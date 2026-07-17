import { useState } from "react";
import JSZip from "jszip";
import { pdfjsLib } from "@/lib/pdfjs";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const faqs = [
  { question: "Can I choose the output resolution?", answer: "Yes — 72 DPI (screen), 150 DPI (default), or 300 DPI (high detail print)." },
  { question: "Can I convert only some pages?", answer: "Yes. Enter a page range like '1-3, 5, 8-10'. Leave blank to convert every page." },
  { question: "How are multiple pages delivered?", answer: "Multi-page PDFs deliver a single ZIP archive containing one PNG per page." },
];

const DPI_MAP = { "72": 1, "150": 2.083, "300": 4.167 } as const;

const parsePages = (input: string, total: number): number[] => {
  const s = input.trim();
  if (!s) return Array.from({ length: total }, (_, i) => i + 1);
  const out = new Set<number>();
  for (const part of s.split(",").map((p) => p.trim()).filter(Boolean)) {
    if (part.includes("-")) {
      const [a, b] = part.split("-").map((n) => parseInt(n, 10));
      if (isNaN(a) || isNaN(b)) continue;
      for (let i = Math.max(1, a); i <= Math.min(total, b); i++) out.add(i);
    } else {
      const n = parseInt(part, 10);
      if (!isNaN(n) && n >= 1 && n <= total) out.add(n);
    }
  }
  return [...out].sort((a, b) => a - b);
};

const PdfToPng = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [dpi, setDpi] = useState<keyof typeof DPI_MAP>("150");
  const [pages, setPages] = useState("");
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
      const targetPages = parsePages(pages, pdf.numPages);
      if (!targetPages.length) {
        toast({ title: "No valid pages selected", variant: "destructive" });
        setProcessing(false);
        return;
      }
      const scale = DPI_MAP[dpi];

      const blobs: { name: string; blob: Blob }[] = [];
      for (let idx = 0; idx < targetPages.length; idx++) {
        const i = targetPages[idx];
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
        const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));
        blobs.push({ name: `${baseName}-page-${i}.png`, blob });
        setProgress(10 + Math.round(((idx + 1) / targetPages.length) * 80));
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
      title="PDF to PNG Online Free – DPI & Page Range Control | Master PDF Tools"
      description="Convert PDF pages to lossless PNG with resolution presets and page-range control. Runs entirely in your browser."
      keywords="PDF to PNG Online Free, PDF to PNG Converter, pdf to png, pdf to png high resolution, convert pdf pages to png"
      h1="PDF to PNG Converter — Choose DPI and Pages"
      intro="Render PDF pages as lossless PNGs with resolution and page-range control."
      faqSchema={faqs}
      toolUI={
        <div className="space-y-6">
          <FileDropzone files={files} onFiles={(f) => setFiles([f[0]])} onRemove={() => setFiles([])} cta="Drop a PDF here or click to upload" subtitle="One file at a time • Max 150MB" />

          <div className="space-y-3">
            <Label>Resolution</Label>
            <RadioGroup value={dpi} onValueChange={(v) => setDpi(v as keyof typeof DPI_MAP)} className="grid grid-cols-3 gap-3">
              {(["72", "150", "300"] as const).map((v) => (
                <Label key={v} htmlFor={`dpi-${v}`} className="flex flex-col items-start gap-1 border border-border rounded-lg p-4 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-accent/50">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value={v} id={`dpi-${v}`} />
                    <span className="font-semibold">{v} DPI</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {v === "72" && "Screen"}
                    {v === "150" && "Print-ready"}
                    {v === "300" && "High detail"}
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="png-pages">Pages (optional)</Label>
            <Input id="png-pages" placeholder="e.g., 1-3, 5, 8-10 — leave blank for all" value={pages} onChange={(e) => setPages(e.target.value)} />
          </div>

          {processing && <Progress value={progress} />}

          <Button size="lg" className="w-full" disabled={!files[0] || processing} onClick={handleConvert}>
            {processing ? (<><Loader2 className="h-4 w-4 animate-spin" /> Converting...</>) : (<><ImageIcon className="h-4 w-4" /> Convert to PNG</>)}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>Lossless PDF to PNG with Real Resolution Control</h2>
          <p>Pick 72, 150, or 300 DPI — matching what desktop tools offer — and optionally restrict to specific pages. PNG keeps text edges crisp and supports transparency, ideal for screenshots, diagrams, and OCR pipelines.</p>
          <h3>Privacy</h3>
          <p>Rendering happens entirely in your browser using PDF.js. Nothing is uploaded.</p>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default PdfToPng;
