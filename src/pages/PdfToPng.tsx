import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import JSZip from "jszip";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const faqs = [
  { question: "Why use PNG instead of JPG?", answer: "PNG is lossless and supports transparency — better for screenshots, diagrams, and crisp text rendering where compression artifacts are unacceptable." },
  { question: "How are multiple pages delivered?", answer: "Multi-page PDFs are bundled into a single ZIP archive containing one PNG per page." },
  { question: "Are my files uploaded?", answer: "No. Rendering happens entirely in your browser using PDF.js." },
];

const PdfToPng = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const handleConvert = async () => {
    if (!files[0]) return;
    setProcessing(true);
    setProgress(5);
    try {
      const file = files[0];
      const bytes = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      const baseName = file.name.replace(/\.pdf$/i, "");
      const blobs: { name: string; blob: Blob }[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));
        blobs.push({ name: `${baseName}-page-${i}.png`, blob });
        setProgress(10 + Math.round((i / pdf.numPages) * 80));
      }

      if (blobs.length === 1) {
        const url = URL.createObjectURL(blobs[0].blob);
        const a = document.createElement("a");
        a.href = url; a.download = blobs[0].name; a.click();
        URL.revokeObjectURL(url);
      } else {
        const zip = new JSZip();
        blobs.forEach((b) => zip.file(b.name, b.blob));
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = url; a.download = `${baseName}-images.zip`; a.click();
        URL.revokeObjectURL(url);
      }

      setProgress(100);
      toast({ title: "Conversion complete", description: `${blobs.length} image(s) ready.` });
    } catch (e) {
      console.error(e);
      toast({ title: "Conversion failed", variant: "destructive" });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  return (
    <ToolPageShell
      title="PDF to PNG Online — Convert PDF Pages to PNG Images Free | PDFMaster Tools"
      description="Convert PDF pages to lossless PNG images online for free. High-resolution, transparent-ready output. Browser-based, secure, no signup."
      keywords="pdf to png, pdf to png converter, convert pdf to png, pdf page to png image"
      h1="PDF to PNG Converter — Free Online"
      intro="Render every page of your PDF as a sharp, lossless PNG image. Multi-page PDFs are delivered as a single ZIP."
      faqSchema={faqs}
      toolUI={
        <div className="space-y-6">
          <FileDropzone files={files} onFiles={(f) => setFiles([f[0]])} onRemove={() => setFiles([])} cta="Drop a PDF here or click to upload" subtitle="One file at a time • Max 50MB" />
          {processing && <Progress value={progress} />}
          <Button size="lg" className="w-full" disabled={!files[0] || processing} onClick={handleConvert}>
            {processing ? (<><Loader2 className="h-4 w-4 animate-spin" /> Converting...</>) : (<><ImageIcon className="h-4 w-4" /> Convert to PNG</>)}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>How to Convert PDF to PNG Images Online</h2>
          <p>PNG is the preferred image format whenever you need lossless quality, sharp text, or transparency. Unlike JPG, PNG does not introduce compression artifacts around letters, line art, or solid color fills, which makes it the right choice for screenshots of contracts, diagrams from technical manuals, infographics, scanned forms, and any page where readability matters more than file size.</p>
          <h3>Step-by-Step</h3>
          <ol>
            <li><strong>Upload your PDF</strong> using the dropzone above.</li>
            <li><strong>Click Convert to PNG.</strong> Each page is rendered at 2× resolution.</li>
            <li><strong>Download.</strong> Single-page PDFs deliver one PNG; multi-page PDFs come as a ZIP.</li>
          </ol>
          <h3>When to Choose PNG Over JPG</h3>
          <ul>
            <li>Screenshots of text-heavy pages where compression artifacts hurt readability</li>
            <li>Diagrams, charts, and line art that require crisp edges</li>
            <li>Pages with logos or graphics that need transparent backgrounds</li>
            <li>Archival exports where preserving exact pixel data matters</li>
            <li>Inputs for OCR pipelines that benefit from lossless source images</li>
          </ul>
          <h3>Privacy by Default</h3>
          <p>Your PDF is processed entirely inside your browser tab using PDF.js and the HTML canvas API. Nothing is uploaded to any server, so even confidential documents stay private.</p>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default PdfToPng;
