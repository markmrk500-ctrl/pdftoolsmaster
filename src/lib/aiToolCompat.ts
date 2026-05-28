import { pdfjsLib } from "@/lib/pdfjs";

export interface PageTextChunk {
  page: number;
  text: string;
}

type ProgressCallback = (progress: number) => void;

const cloneArrayBuffer = (buffer: ArrayBuffer) => buffer.slice(0);

export const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  if (typeof file.arrayBuffer === "function") return file.arrayBuffer();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read this file. Please try another file."));
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.readAsArrayBuffer(file);
  });
};

export const readFileAsText = (file: File): Promise<string> => {
  if (typeof file.text === "function") return file.text();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read this text file. Please try another file."));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsText(file);
  });
};

const loadPdfDocument = async (buffer: ArrayBuffer) => {
  const options = {
    data: cloneArrayBuffer(buffer),
    disableFontFace: true,
    isEvalSupported: false,
    useSystemFonts: true,
  };

  try {
    return await pdfjsLib.getDocument(options).promise;
  } catch (firstError) {
    try {
      return await pdfjsLib.getDocument({
        ...options,
        data: cloneArrayBuffer(buffer),
        disableWorker: true,
      } as any).promise;
    } catch {
      throw firstError;
    }
  }
};

const getPageText = async (page: any): Promise<string> => {
  const content = await page.getTextContent({ disableCombineTextItems: false } as any);
  return (content.items as any[])
    .map((item) => (item && typeof item.str === "string" ? item.str : ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
};

export const extractPdfPages = async (
  file: File,
  onProgress?: ProgressCallback
): Promise<{ pages: PageTextChunk[]; totalPages: number }> => {
  const bytes = await readFileAsArrayBuffer(file);
  const pdf = await loadPdfDocument(bytes);
  const totalPages = pdf.numPages;
  const pages: PageTextChunk[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const text = await getPageText(page);
      pages.push({ page: pageNumber, text });
      onProgress?.(Math.round((pageNumber / totalPages) * 100));
      page.cleanup?.();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  } finally {
    pdf.destroy?.();
  }

  return { pages, totalPages };
};

export const extractPdfText = async (
  file: File,
  options: { fromPage?: number; toPage?: number; onProgress?: ProgressCallback } = {}
): Promise<{ text: string; totalPages: number }> => {
  const bytes = await readFileAsArrayBuffer(file);
  const pdf = await loadPdfDocument(bytes);
  const totalPages = pdf.numPages;
  const start = Math.max(1, options.fromPage || 1);
  const end = Math.min(totalPages, options.toPage || totalPages);
  const total = Math.max(1, end - start + 1);
  let text = "";

  try {
    for (let pageNumber = start; pageNumber <= end; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      text += `${await getPageText(page)}\n\n`;
      options.onProgress?.(Math.round(((pageNumber - start + 1) / total) * 100));
      page.cleanup?.();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  } finally {
    pdf.destroy?.();
  }

  return { text, totalPages };
};

export const renderPdfPagesAsImages = async (
  file: File,
  maxPages: number,
  onProgress?: ProgressCallback
): Promise<{ images: string[]; totalPages: number }> => {
  const bytes = await readFileAsArrayBuffer(file);
  const pdf = await loadPdfDocument(bytes);
  const totalPages = pdf.numPages;
  const total = Math.min(totalPages, maxPages);
  const images: string[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= total; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const maxSide = Math.max(baseViewport.width, baseViewport.height);
      const scale = Math.min(1.8, Math.max(1, 1800 / maxSide));
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Canvas rendering is not supported on this browser.");

      await page.render({ canvasContext: context, viewport } as any).promise;
      images.push(canvas.toDataURL("image/jpeg", 0.82).split(",")[1] || "");
      canvas.width = 1;
      canvas.height = 1;
      page.cleanup?.();
      onProgress?.(Math.round((pageNumber / total) * 100));
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  } finally {
    pdf.destroy?.();
  }

  return { images, totalPages };
};

const parseSseText = (raw: string, onDelta?: (delta: string) => void) => {
  let output = "";
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    if (!line.startsWith("data:")) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;

    try {
      const json = JSON.parse(payload);
      const delta = json.choices?.[0]?.delta?.content || json.choices?.[0]?.message?.content || "";
      if (delta) {
        output += delta;
        onDelta?.(delta);
      }
    } catch {
      output += payload;
      onDelta?.(payload);
    }
  }

  return output || raw.trim();
};

export const getResponseErrorMessage = async (response: Response) => {
  const fallback = response.status >= 500
    ? "The AI service is temporarily unavailable. Please try again in a moment."
    : `Request failed (${response.status}).`;

  try {
    const data = await response.clone().json();
    return data?.error || data?.message || fallback;
  } catch {
    try {
      const text = await response.clone().text();
      return text || fallback;
    } catch {
      return fallback;
    }
  }
};

export const readAiStream = async (
  response: Response,
  onDelta: (delta: string, fullText: string) => void
) => {
  if (!response.ok) throw new Error(await getResponseErrorMessage(response));

  const contentType = response.headers.get("Content-Type") || "";
  if (contentType.includes("application/json")) {
    const data = await response.json().catch(() => ({}));
    if (data?.error) throw new Error(data.error);
    const text = data?.text || data?.summary || data?.content || "";
    if (text) onDelta(text, text);
    return text;
  }

  if (!response.body || typeof response.body.getReader !== "function" || typeof TextDecoder === "undefined") {
    let full = "";
    return parseSseText(await response.text(), (delta) => {
      full += delta;
      onDelta(delta, full);
    });
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex = buffer.indexOf("\n");
    while (newlineIndex !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);

      if (line.startsWith("data:")) {
        const payload = line.slice(5).trim();
        if (payload && payload !== "[DONE]") {
          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content || "";
            if (delta) {
              fullText += delta;
              onDelta(delta, fullText);
            }
          } catch {
            buffer = `${line}\n${buffer}`;
            break;
          }
        }
      }

      newlineIndex = buffer.indexOf("\n");
    }
  }

  if (buffer.trim()) {
    const fallbackText = parseSseText(buffer);
    if (fallbackText && fallbackText !== buffer.trim()) {
      fullText += fallbackText;
      onDelta(fallbackText, fullText);
    }
  }

  return fullText;
};

export const copyTextSafely = async (text: string) => {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
};

export const downloadBlobSafely = (blob: Blob, filename: string) => {
  const nav = navigator as any;
  if (typeof nav.msSaveOrOpenBlob === "function") {
    nav.msSaveOrOpenBlob(blob, filename);
    return;
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};