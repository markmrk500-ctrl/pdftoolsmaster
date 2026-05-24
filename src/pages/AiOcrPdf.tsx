import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ScanText, Loader2, Copy, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const MAX_PAGES = 20;

const faqs = [
  { question: "What is AI OCR?", answer: "OCR (Optical Character Recognition) extracts text from images. Our AI OCR uses Google Gemini's vision model to read scanned and image-based PDFs that regular text extraction can't handle." },
  { question: "How many pages can I process?", answer: `Up to ${MAX_PAGES} pages per run, to keep latency and cost reasonable. Split larger PDFs first using our Split tool.` },
  { question: "What languages does it support?", answer: "AI vision OCR works on 100+ languages including English, Spanish, French, German, Chinese, Japanese, Arabic, Hindi, Cyrillic scripts, and more." },
  { question: "Is it more accurate than traditional OCR?", answer: "Yes — vision LLMs handle low-quality scans, handwriting, complex layouts, and mixed languages much better than classic OCR engines like Tesseract." },
];

const AiOcrPdf = () => {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const handleOcr = async () => {
    if (!file) return;
    setProcessing(true);
    setText("");
    setProgress(2);
    try {
      const bytes = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      const total = Math.min(pdf.numPages, MAX_PAGES);
      if (pdf.numPages > MAX_PAGES) {
        toast({ title: `Processing first ${MAX_PAGES} pages`, description: `Your PDF has ${pdf.numPages} pages. Split it for full coverage.` });
      }
      let acc = "";
      for (let i = 1; i <= total; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        const base64 = dataUrl.split(",")[1];

        const { data, error } = await supabase.functions.invoke("ai-ocr", {
          body: { imageBase64: base64, mimeType: "image/jpeg" },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        acc += `--- Page ${i} ---\n${data?.text || ""}\n\n`;
        setText(acc);
        setProgress(Math.round((i / total) * 100));
      }
      toast({ title: "OCR complete", description: `${total} page(s) processed.` });
    } catch (e: any) {
      console.error(e);
      toast({ title: "OCR failed", description: e?.message || "Please try again.", variant: "destructive" });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (file?.name.replace(/\.pdf$/i, "") || "ocr") + ".txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolPageShell
      title="AI OCR for Scanned PDFs — Extract Text from Images Free | PDFMaster"
      description="Turn scanned PDFs into editable text using AI vision OCR. Reads handwriting, low-quality scans & 100+ languages. Powered by Lovable AI. Free, no signup."
      keywords="ai ocr pdf, scanned pdf to text, pdf ocr online, image pdf to text, gemini ocr, vision ocr pdf, handwriting pdf to text"
      h1="AI OCR — Scanned PDF to Text"
      intro="Upload a scanned or image-based PDF and let AI vision extract every word — including handwriting and 100+ languages."
      faqSchema={faqs}
      breadcrumbName="AI OCR PDF"
      breadcrumbPath="/ai-ocr-pdf"
      toolUI={
        <div className="space-y-6">
          <FileDropzone
            files={file ? [file] : []}
            onFiles={(f) => { setFile(f[0]); setText(""); }}
            onRemove={() => { setFile(null); setText(""); }}
            cta="Drop a scanned PDF here"
            subtitle={`First ${MAX_PAGES} pages • Max 50MB`}
          />
          {processing && <Progress value={progress} />}
          <Button size="lg" className="w-full" disabled={!file || processing} onClick={handleOcr}>
            {processing ? (<><Loader2 className="h-4 w-4 animate-spin" /> Reading page-by-page...</>) : (<><ScanText className="h-4 w-4" /> Run AI OCR</>)}
          </Button>

          {text && (
            <>
              <Textarea value={text} readOnly rows={14} className="font-mono text-xs" />
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={handleCopy}><Copy className="h-4 w-4" /> Copy</Button>
                <Button onClick={handleDownload}><Download className="h-4 w-4" /> Download .txt</Button>
              </div>
            </>
          )}
        </div>
      }
      seoContent={
        <>
          <h2>Scanned PDF to Text — Powered by AI Vision</h2>
          <p>
            Traditional PDF text extraction fails on scanned documents because there's no underlying text layer — just images of text. Our AI OCR tool solves that by sending each page to a vision-capable AI model (Google Gemini) which reads the text directly from the image, the same way a human would.
          </p>
          <h3>What It Handles That Classic OCR Can't</h3>
          <ul>
            <li><strong>Low-quality scans</strong> — faded, skewed, or noisy pages</li>
            <li><strong>Handwriting</strong> — printed and cursive notes</li>
            <li><strong>Complex layouts</strong> — multi-column, tables, forms</li>
            <li><strong>Mixed languages</strong> — multilingual documents in one pass</li>
            <li><strong>Non-Latin scripts</strong> — Chinese, Arabic, Hindi, Cyrillic, and more</li>
          </ul>
          <h3>How It Works</h3>
          <ol>
            <li>Each PDF page is rendered as a high-resolution image in your browser.</li>
            <li>The image is sent securely to Lovable AI's vision model.</li>
            <li>Extracted text streams back page by page, ready to copy or download.</li>
          </ol>
          <h3>Privacy</h3>
          <p>
            Pages are sent only to our AI backend for OCR — nothing is stored or used for training. The original PDF file never leaves your device.
          </p>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default AiOcrPdf;
