import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Loader2, Maximize2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SIZES: Record<string, [number, number]> = {
  A4: [595.28, 841.89],
  Letter: [612, 792],
  Legal: [612, 1008],
  A3: [841.89, 1190.55],
  A5: [419.53, 595.28],
  Tabloid: [792, 1224],
};

const faqs = [
  { question: "How does resizing work?", answer: "Each page is placed onto a new page of the chosen size and scaled proportionally to fit, preserving the original aspect ratio with white margins added if needed." },
  { question: "Will my text become blurry?", answer: "No. Vector text and graphics scale crisply at any size because the underlying content is preserved as a PDF form XObject, not a raster image." },
  { question: "Are my files uploaded?", answer: "No. Resizing runs entirely in your browser using pdf-lib." },
];

const ResizePdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [size, setSize] = useState<keyof typeof SIZES>("A4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const handleResize = async () => {
    if (!files[0]) return;
    setProcessing(true);
    setProgress(10);
    try {
      const bytes = await files[0].arrayBuffer();
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      let [w, h] = SIZES[size];
      if (orientation === "landscape") [w, h] = [h, w];
      const indices = src.getPageIndices();
      const embedded = await out.embedPdf(src, indices);
      embedded.forEach((page) => {
        const newPage = out.addPage([w, h]);
        const ratio = Math.min(w / page.width, h / page.height);
        const dw = page.width * ratio;
        const dh = page.height * ratio;
        newPage.drawPage(page, { x: (w - dw) / 2, y: (h - dh) / 2, width: dw, height: dh });
      });
      setProgress(85);
      const data = await out.save();
      const blob = new Blob([data as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = files[0].name.replace(/\.pdf$/i, "") + `-${size}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setProgress(100);
      toast({ title: "Resize complete", description: "File downloaded." });
    } catch (e) {
      console.error(e);
      toast({ title: "Resize failed", variant: "destructive" });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  return (
    <ToolPageShell
      title="Resize PDF Online Free – Change Page Size to A4, Letter, Legal on Any Device | Master PDF Tools"
      description="Resize PDF pages to A4, Letter, Legal, or custom sizes online. Mobile-friendly, cross-browser, secure, and compatible with all devices and software versions."
      keywords="Resize PDF Online Free, Change PDF Page Size, PDF Resizer for All Devices, Mobile PDF Resize, resize pdf, change pdf page size, pdf to a4, pdf to letter, pdf page resizer, scale pdf"
      h1="Resize PDF Page Size — Free Online"
      intro="Standardize your PDFs by converting them to A4, Letter, Legal, A3, A5, or Tabloid in portrait or landscape."
      faqSchema={faqs}
      toolUI={
        <div className="space-y-6">
          <FileDropzone files={files} onFiles={(f) => setFiles([f[0]])} onRemove={() => setFiles([])} cta="Drop a PDF here or click to upload" subtitle="One file at a time • Max 150MB" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-card border border-border rounded-xl p-4">
            <div className="space-y-2">
              <Label>Page Size</Label>
              <Select value={size} onValueChange={(v) => setSize(v as keyof typeof SIZES)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(SIZES).map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Orientation</Label>
              <Select value={orientation} onValueChange={(v) => setOrientation(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {processing && <Progress value={progress} />}
          <Button size="lg" className="w-full" disabled={!files[0] || processing} onClick={handleResize}>
            {processing ? (<><Loader2 className="h-4 w-4 animate-spin" /> Resizing...</>) : (<><Download className="h-4 w-4" /> Resize & Download</>)}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>How to Resize a PDF Online</h2>
          <p>Resizing a PDF means changing the physical page dimensions — for example, converting a US Letter document to A4 so it prints correctly in Europe, or expanding a small A5 booklet into a full A4 reading copy. Our resizer rebuilds each page at the target size and scales the original content proportionally so nothing is cropped, stretched, or distorted.</p>
          <h3>Step-by-Step</h3>
          <ol>
            <li><strong>Upload your PDF.</strong></li>
            <li><strong>Choose a page size</strong> — A4, Letter, Legal, A3, A5, or Tabloid.</li>
            <li><strong>Pick orientation</strong> — portrait or landscape.</li>
            <li><strong>Click Resize &amp; Download.</strong></li>
          </ol>
          <h3>Common Page Sizes</h3>
          <ul>
            <li><strong>A4 (210 × 297 mm)</strong> — international standard outside North America</li>
            <li><strong>Letter (8.5 × 11 in)</strong> — US and Canada standard</li>
            <li><strong>Legal (8.5 × 14 in)</strong> — US legal documents</li>
            <li><strong>A3 (297 × 420 mm)</strong> — large format, posters, drawings</li>
            <li><strong>A5 (148 × 210 mm)</strong> — booklets, pocket guides</li>
            <li><strong>Tabloid (11 × 17 in)</strong> — newspapers, large reports</li>
          </ul>
          <h3>Quality is Preserved</h3>
          <p>Pages are embedded as PDF form XObjects and scaled vectorially, so text remains crisp at any size and embedded fonts are not re-encoded.</p>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default ResizePdf;
