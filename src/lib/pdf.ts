import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument } from "pdf-lib";

export class PdfPasswordError extends Error {
  constructor(message = "This PDF is password-protected. Unlock it first with our Unlock PDF tool.") {
    super(message);
    this.name = "PdfPasswordError";
  }
}

export class PdfCorruptError extends Error {
  constructor(message = "This file doesn't look like a valid PDF or is corrupted.") {
    super(message);
    this.name = "PdfCorruptError";
  }
}

const isPasswordError = (e: any) => {
  const n = e?.name || "";
  const m = (e?.message || "").toLowerCase();
  return (
    n === "PasswordException" ||
    m.includes("password") ||
    m.includes("encrypted") ||
    m.includes("encryption")
  );
};

/**
 * Load a PDF with pdf.js, tolerating owner-restricted (non-password) encryption.
 * Throws PdfPasswordError when a user password is required, PdfCorruptError otherwise.
 */
export async function loadPdfJs(
  data: ArrayBuffer | Uint8Array,
  opts: { password?: string } = {}
) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  try {
    const task = pdfjsLib.getDocument({
      data: bytes,
      password: opts.password ?? "",
      isEvalSupported: false,
      disableAutoFetch: true,
      disableStream: true,
      stopAtErrors: false,
      useSystemFonts: true,
    } as any);
    return await task.promise;
  } catch (e: any) {
    if (isPasswordError(e)) throw new PdfPasswordError();
    console.error("pdf.js load error:", e);
    throw new PdfCorruptError(e?.message ? `Couldn't read PDF: ${e.message}` : undefined);
  }
}

/**
 * Load a PDF with pdf-lib, tolerating owner-restricted encryption and minor corruption.
 */
export async function loadPdfLib(
  data: ArrayBuffer | Uint8Array,
  extra: Parameters<typeof PDFDocument.load>[1] = {}
) {
  try {
    return await PDFDocument.load(data as any, {
      ignoreEncryption: true,
      throwOnInvalidObject: false,
      updateMetadata: false,
      capNumbers: true,
      ...extra,
    });
  } catch (e: any) {
    if (isPasswordError(e)) throw new PdfPasswordError();
    console.error("pdf-lib load error:", e);
    throw new PdfCorruptError(e?.message ? `Couldn't read PDF: ${e.message}` : undefined);
  }
}

export function describePdfError(e: unknown): { title: string; description: string } {
  if (e instanceof PdfPasswordError) {
    return {
      title: "Password-protected PDF",
      description:
        "This file requires a password to open. Unlock it first with our Unlock PDF tool, then try again.",
    };
  }
  if (e instanceof PdfCorruptError) {
    return { title: "Couldn't read PDF", description: e.message };
  }
  const msg = (e as any)?.message;
  return {
    title: "Something went wrong",
    description: msg || "Please try again with a different file.",
  };
}
