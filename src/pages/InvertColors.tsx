import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FAQ } from "@/components/FAQ";
import { FileDropzone } from "@/components/FileDropzone";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const faqs = [
  { question: "What does inverting colors do?", answer: "Every pixel's color is replaced with its complement: white becomes black, black becomes white, and all colors swap to their opposite. Useful for dark mode reading and saving printer ink." },
  { question: "Will text remain selectable?", answer: "No. Because pages are rasterized to invert pixel colors, the output is image-based and text is not selectable. Use this for visual viewing only." },
  { question: "Does it work on encrypted PDFs?", answer: "Unlock the PDF first using our Unlock PDF tool, then run it through this converter." },
];

const InvertColors = () => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const bytes = await file.arrayBuffer();
      const pdfjs = await pdfjsLib.getDocument({ data: bytes }).promise;
      const out = await PDFDocument.create();
      for (let i = 1; i <= pdfjs.numPages; i++) {
        const page = await pdfjs.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        for (let j = 0; j < d.length; j += 4) {
          d[j] = 255 - d[j];
          d[j + 1] = 255 - d[j + 1];
          d[j + 2] = 255 - d[j + 2];
        }
        ctx.putImageData(imgData, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        const jpgBytes = Uint8Array.from(atob(dataUrl.split(",")[1]), (c) => c.charCodeAt(0));
        const img = await out.embedJpg(jpgBytes);
        const newPage = out.addPage([viewport.width, viewport.height]);
        newPage.drawImage(img, { x: 0, y: 0, width: viewport.width, height: viewport.height });
      }
      const data = await out.save();
      const blob = new Blob([data as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "-inverted.pdf");
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Colors inverted" });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to invert", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageShell
      title="Invert PDF Colors — Dark Mode PDF Converter Online Free | PDFMaster"
      description="Invert every color in a PDF. White becomes black, black becomes white. Perfect for dark-mode reading and printing on dark paper. Free and browser-based."
      keywords="invert pdf colors, dark mode pdf, negative pdf, white to black pdf, pdf color inversion"
      h1="Invert PDF Colors"
      intro="Invert every color in your PDF — turn bright white pages into dark mode-friendly black backgrounds for late-night reading."
      faqSchema={faqs}
      breadcrumbName="Invert Colors"
      breadcrumbPath="/invert-colors"
      toolUI={
        <div className="space-y-6">
          <FileDropzone onFiles={(f) => setFile(f[0])} files={file ? [file] : []} onRemove={() => setFile(null)} />
          {file && (
            <Button size="lg" className="w-full" onClick={handleProcess} disabled={processing}>
              {processing ? (<><Loader2 className="h-4 w-4 animate-spin" /> Inverting...</>) : (<><Download className="h-4 w-4" /> Invert & Download</>)}
            </Button>
          )}
        </div>
      }
      seoContent={
        <>
          <h2>Why Invert PDF Colors?</h2>
          <p>
            Most PDFs use a bright white background. That's perfect for printing — but punishing for late-night reading on a phone or laptop in a dark room. Inverting the colors flips the entire palette: white pages become deep black, dark text becomes crisp white, and the whole document becomes much easier on your eyes.
          </p>
          <h3>Common Use Cases</h3>
          <ul>
            <li><strong>Dark-mode reading</strong> — match your OS theme on phones, tablets, and laptops.</li>
            <li><strong>Bedtime study</strong> — reduce blue light exposure before sleep.</li>
            <li><strong>Accessibility</strong> — high-contrast inverse for users with light sensitivity.</li>
            <li><strong>Photo negatives</strong> — preview scanned negatives by inverting them.</li>
          </ul>
          <h3>Technical Note</h3>
          <p>
            This tool rasterizes each page at 1.5x resolution, inverts every pixel's RGB values, then re-embeds the inverted images into a new PDF. Because the output is image-based, text is no longer selectable — keep the original if you need editable text.
          </p>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default InvertColors;
