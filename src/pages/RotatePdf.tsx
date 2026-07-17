import { useState } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2, RotateCw, RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const faqs = [
  { question: "Can I rotate specific pages only?", answer: "Yes. Leave the Pages field blank to rotate every page, or enter a range like '1-3, 5, 8-10' to rotate only those pages." },
  { question: "Does rotating reduce quality?", answer: "No. Rotation only changes page metadata, not the underlying content. Quality is preserved exactly." },
  { question: "Is my file uploaded?", answer: "No. Rotation runs entirely in your browser." },
];

const parsePages = (input: string, total: number): Set<number> => {
  const s = input.trim();
  if (!s) return new Set(Array.from({ length: total }, (_, i) => i));
  const out = new Set<number>();
  for (const part of s.split(",").map((p) => p.trim()).filter(Boolean)) {
    if (part.includes("-")) {
      const [a, b] = part.split("-").map((n) => parseInt(n, 10));
      if (isNaN(a) || isNaN(b)) continue;
      for (let i = Math.max(1, a); i <= Math.min(total, b); i++) out.add(i - 1);
    } else {
      const n = parseInt(part, 10);
      if (!isNaN(n) && n >= 1 && n <= total) out.add(n - 1);
    }
  }
  return out;
};

const RotatePdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [angle, setAngle] = useState<90 | 180 | 270>(90);
  const [pages, setPages] = useState("");
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const handleRotate = async () => {
    if (!files[0]) return;
    setProcessing(true);
    setProgress(10);
    try {
      const bytes = await files[0].arrayBuffer();
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const all = pdf.getPages();
      const targets = parsePages(pages, all.length);
      if (targets.size === 0) {
        toast({ title: "No valid pages selected", variant: "destructive" });
        setProcessing(false);
        return;
      }
      all.forEach((p, idx) => {
        if (targets.has(idx)) {
          const current = p.getRotation().angle;
          p.setRotation(degrees((current + angle) % 360));
        }
      });
      setProgress(80);
      const out = await pdf.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = files[0].name.replace(/\.pdf$/i, "") + "-rotated.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setProgress(100);
      toast({ title: "Rotation complete", description: `${targets.size} page(s) rotated.` });
    } catch (e) {
      console.error(e);
      toast({ title: "Rotation failed", variant: "destructive" });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  return (
    <ToolPageShell
      title="Rotate PDF Online Free – Rotate All or Specific Pages | Master PDF Tools"
      description="Rotate every page or specific page ranges in a PDF. Lossless, private, and fully browser-based."
      keywords="Rotate PDF Online Free, rotate pdf pages, rotate specific pdf pages, pdf rotator, fix pdf orientation"
      h1="Rotate PDF Pages — All Pages or Specific Ranges"
      intro="Rotate the whole PDF or just the pages you pick — 90° left, 180°, or 90° right. Lossless and 100% in-browser."
      faqSchema={faqs}
      toolUI={
        <div className="space-y-6">
          <FileDropzone files={files} onFiles={(f) => setFiles([f[0]])} onRemove={() => setFiles([])} cta="Drop a PDF here or click to upload" subtitle="One file at a time • Max 150MB" />

          <div className="grid grid-cols-3 gap-3">
            <Button variant={angle === 270 ? "default" : "outline"} onClick={() => setAngle(270)}><RotateCcw className="h-4 w-4" /> 90° Left</Button>
            <Button variant={angle === 180 ? "default" : "outline"} onClick={() => setAngle(180)}>180°</Button>
            <Button variant={angle === 90 ? "default" : "outline"} onClick={() => setAngle(90)}><RotateCw className="h-4 w-4" /> 90° Right</Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rot-pages">Pages (optional)</Label>
            <Input id="rot-pages" placeholder="e.g., 1-3, 5, 8-10 — leave blank for all pages" value={pages} onChange={(e) => setPages(e.target.value)} />
          </div>

          {processing && <Progress value={progress} />}

          <Button size="lg" className="w-full" disabled={!files[0] || processing} onClick={handleRotate}>
            {processing ? (<><Loader2 className="h-4 w-4 animate-spin" /> Rotating...</>) : (<><Download className="h-4 w-4" /> Rotate & Download</>)}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>Rotate a PDF — All Pages or Just the Ones You Pick</h2>
          <p>
            Scans and mobile-photo PDFs often come out with a handful of misoriented pages. This tool
            matches the workflow you'd expect from iLovePDF: pick an angle, optionally enter a page
            range, and download a losslessly-rotated PDF. Text stays selectable, images keep their
            resolution, and file size stays identical.
          </p>
          <h3>Step-by-step</h3>
          <ol>
            <li>Upload your PDF.</li>
            <li>Pick 90° left, 180°, or 90° right.</li>
            <li>Enter a page range (or leave blank for the whole document).</li>
            <li>Click Rotate &amp; Download.</li>
          </ol>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default RotatePdf;
