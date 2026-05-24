import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Crop, Download, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const faqs = [
  {
    question: "What does cropping do?",
    answer:
      "Cropping trims the visible page area without removing content from the underlying file. Each page's CropBox is set to the new region.",
  },
  {
    question: "Are margins applied uniformly?",
    answer:
      "Yes. The same margin (in points) is removed from every side of every page.",
  },
  {
    question: "Will text and images be cut?",
    answer:
      "Only what falls outside the new crop area is hidden. The underlying content is not deleted, so you can re-crop later.",
  },
];

const CropPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [margin, setMargin] = useState(36); // 0.5in
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const handleCrop = async () => {
    if (!files[0]) return;
    setProcessing(true);
    setProgress(10);
    try {
      const bytes = await files[0].arrayBuffer();
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const m = Math.max(0, margin);
      pdf.getPages().forEach((page) => {
        const { width, height } = page.getSize();
        const newW = Math.max(10, width - m * 2);
        const newH = Math.max(10, height - m * 2);
        page.setCropBox(m, m, newW, newH);
      });
      setProgress(80);
      const out = await pdf.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = files[0].name.replace(/\.pdf$/i, "") + "-cropped.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setProgress(100);
      toast({ title: "Crop complete", description: "File downloaded." });
    } catch (e) {
      console.error(e);
      toast({ title: "Crop failed", variant: "destructive" });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  return (
    <ToolPageShell
      title="Crop PDF Online — Trim PDF Margins Free | PDFMaster Tools"
      description="Crop PDF pages by removing equal margins from every side. Free, browser-based, and secure — no upload, no signup."
      keywords="crop pdf, trim pdf, pdf cropper, remove pdf margins, cut pdf pages, crop pdf online free"
      h1="Crop PDF Margins Online"
      intro="Trim equal margins from every page of your PDF — perfect for cleaning up scans and removing unwanted whitespace."
      faqSchema={faqs}
      toolUI={
        <div className="space-y-6">
          <FileDropzone
            files={files}
            onFiles={(f) => setFiles([f[0]])}
            onRemove={() => setFiles([])}
            cta="Drop a PDF here or click to upload"
            subtitle="One file at a time • Max 50MB"
          />

          <div className="space-y-2">
            <Label htmlFor="m">Margin to remove on each side (points)</Label>
            <Input
              id="m"
              type="number"
              min={0}
              max={300}
              value={margin}
              onChange={(e) => setMargin(parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              72 points ≈ 1 inch • Default 36 ≈ 0.5 inch
            </p>
          </div>

          {processing && <Progress value={progress} />}

          <Button size="lg" className="w-full" disabled={!files[0] || processing} onClick={handleCrop}>
            {processing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Cropping...</>
            ) : (
              <><Crop className="h-4 w-4" /> Crop & Download</>
            )}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>How to Crop a PDF — Complete Guide</h2>
          <p>
            Cropping is useful when scanned PDFs include excessive white space, when
            you want to remove headers or footers from a printout, or when you're
            preparing pages for printing on a smaller paper size. This tool sets a
            uniform crop box on every page so the visible region is reduced by the
            margin you specify, without permanently removing the underlying content.
          </p>

          <h3>Step-by-Step: How to Crop a PDF</h3>
          <ol>
            <li><strong>Upload your PDF</strong> using the dropzone above.</li>
            <li><strong>Set the margin</strong> to remove on each side (in points — 72 = 1 inch).</li>
            <li><strong>Click Crop &amp; Download.</strong> The cropped PDF downloads instantly.</li>
          </ol>

          <h3>Understanding Points and Margins</h3>
          <ul>
            <li><strong>72 points = 1 inch</strong> = 25.4 mm</li>
            <li><strong>36 points = 0.5 inch</strong> (default) — typical for trimming light scan borders</li>
            <li><strong>18 points = 0.25 inch</strong> — for very subtle cropping</li>
            <li><strong>108 points = 1.5 inches</strong> — for aggressive header/footer removal</li>
          </ul>

          <h3>Common Use Cases</h3>
          <ul>
            <li>Cleaning up scanned documents with thick black or white borders</li>
            <li>Removing repeating headers or footers from a long report</li>
            <li>Preparing pages for printing on smaller paper</li>
            <li>Standardizing margins across mixed-source PDFs before merging</li>
          </ul>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default CropPdf;
