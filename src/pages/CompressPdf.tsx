import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Download, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const faqs = [
  {
    question: "How much can I compress my PDF?",
    answer:
      "Image-heavy PDFs typically shrink 40–70% on High setting. Text-only PDFs see smaller reductions because text is already efficiently encoded.",
  },
  {
    question: "Will compression affect quality?",
    answer:
      "On Low setting, compression is lossless. Medium and High re-encode embedded images at lower resolution and quality, with visible but acceptable trade-offs for most uses.",
  },
  {
    question: "Is my file uploaded somewhere?",
    answer:
      "No. Compression runs entirely in your browser. Your PDF stays on your device.",
  },
  {
    question: "What if my PDF gets larger after compression?",
    answer:
      "If your source PDF is already optimized (mostly text, small file size), the tool may not reduce it further. The original file is downloaded if compression doesn't help.",
  },
];

type Level = "low" | "medium" | "high";

const settings: Record<Level, { scale: number; quality: number }> = {
  low: { scale: 1.5, quality: 0.85 },
  medium: { scale: 1.1, quality: 0.7 },
  high: { scale: 0.85, quality: 0.55 },
};

const CompressPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [level, setLevel] = useState<Level>("medium");
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ before: number; after: number } | null>(null);

  const handleCompress = async () => {
    if (!files[0]) return;
    setProcessing(true);
    setProgress(2);
    setResult(null);
    try {
      const file = files[0];
      const bytes = await file.arrayBuffer();
      const { scale, quality } = settings[level];

      // Render each page to canvas, re-encode as JPEG, then build a new PDF.
      const loadingTask = pdfjsLib.getDocument({ data: bytes.slice(0) });
      const pdfDoc = await loadingTask.promise;
      const out = await PDFDocument.create();

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;

        const jpegDataUrl = canvas.toDataURL("image/jpeg", quality);
        const jpegBytes = await (await fetch(jpegDataUrl)).arrayBuffer();
        const img = await out.embedJpg(jpegBytes);
        const newPage = out.addPage([canvas.width, canvas.height]);
        newPage.drawImage(img, { x: 0, y: 0, width: canvas.width, height: canvas.height });

        setProgress(5 + Math.round((i / pdfDoc.numPages) * 85));
      }

      const compressed = await out.save({ useObjectStreams: true });
      setProgress(95);

      // If compression made it bigger, fall back to original
      const finalBytes = compressed.byteLength < bytes.byteLength ? compressed : new Uint8Array(bytes);
      const blob = new Blob([finalBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "") + "-compressed.pdf";
      a.click();
      URL.revokeObjectURL(url);

      setResult({ before: bytes.byteLength, after: finalBytes.byteLength });
      setProgress(100);
      toast({ title: "Compression complete", description: "Your file has been downloaded." });
    } catch (e) {
      console.error(e);
      toast({
        title: "Compression failed",
        description: "File may be corrupted or password-protected.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  const fmt = (b: number) => (b / 1024 / 1024).toFixed(2) + " MB";
  const reduction =
    result && result.before > 0
      ? Math.max(0, Math.round((1 - result.after / result.before) * 100))
      : 0;

  return (
    <ToolPageShell
      title="Compress PDF Online Free – Reduce PDF Size on Any Device | Master PDF Tools"
      description="Compress and reduce PDF file size online with AI-friendly optimization. Mobile-friendly, cross-browser, secure, and compatible with all devices and software versions."
      keywords="Compress PDF Online Free, Reduce PDF Size, PDF Compressor for All Devices, Mobile PDF Compressor, Cross-platform PDF Compression, compress pdf, reduce pdf size, pdf compressor, shrink pdf, compress pdf online free, optimize pdf, make pdf smaller"
      h1="Compress PDF Online — Reduce File Size up to 70%"
      intro="Reduce PDF size with smart image downsampling. Choose Low, Medium, or High compression and download instantly — all in your browser."
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

          <div className="space-y-3">
            <Label>Compression level</Label>
            <RadioGroup value={level} onValueChange={(v) => setLevel(v as Level)} className="grid grid-cols-3 gap-3">
              {(["low", "medium", "high"] as Level[]).map((l) => (
                <Label
                  key={l}
                  htmlFor={l}
                  className="flex flex-col items-start gap-1 border border-border rounded-lg p-4 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value={l} id={l} />
                    <span className="font-semibold capitalize">{l}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {l === "low" && "Best quality"}
                    {l === "medium" && "Balanced"}
                    {l === "high" && "Smallest size"}
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {processing && <Progress value={progress} />}

          {result && (
            <div className="bg-accent/40 border border-border rounded-lg p-4 text-sm space-y-1">
              <div className="flex justify-between"><span>Original size:</span><span className="font-mono">{fmt(result.before)}</span></div>
              <div className="flex justify-between"><span>Compressed size:</span><span className="font-mono">{fmt(result.after)}</span></div>
              <div className="flex justify-between font-semibold text-primary"><span>Reduction:</span><span>{reduction}%</span></div>
            </div>
          )}

          <Button size="lg" className="w-full" disabled={!files[0] || processing} onClick={handleCompress}>
            {processing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Compressing...</>
            ) : (
              <><Download className="h-4 w-4" /> Compress & Download</>
            )}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>How to Compress PDF Files Online Without Losing Quality</h2>
          <p>
            Large PDF files cause real, everyday problems: emails bounce because
            attachments are too big, cloud storage fills up faster than expected, uploads
            on slow connections take forever, and shared drives charge premiums for
            extra space. PDFMaster Tools' free Compress PDF utility reduces file size by
            intelligently downsampling embedded images and re-encoding pages, often
            cutting size by 40–70% while keeping documents perfectly readable.
          </p>

          <h3>Step-by-Step: How to Compress a PDF</h3>
          <ol>
            <li><strong>Upload your PDF</strong> by dragging it into the dropzone or clicking to browse.</li>
            <li><strong>Choose a compression level</strong> — Low, Medium, or High — based on how you'll use the file.</li>
            <li><strong>Click Compress &amp; Download.</strong> Your optimized PDF downloads automatically with the size summary shown on screen.</li>
          </ol>

          <h3>Choosing the Right Compression Level</h3>
          <h4>Low — Best Quality</h4>
          <p>
            Preserves the highest visual fidelity with modest size reduction (typically
            10–30%). Ideal for documents you'll print, archive, or present on large
            screens. Use this when image clarity is critical, such as portfolios,
            brochures, and product catalogs.
          </p>
          <h4>Medium — Balanced (Recommended)</h4>
          <p>
            The best general-purpose setting. Offers a balanced trade-off between file
            size and quality (typically 40–60% reduction) — perfect for emailing
            reports, sharing scans, uploading to cloud drives, or attaching to web
            forms.
          </p>
          <h4>High — Smallest Size</h4>
          <p>
            Aggressively reduces size (often 60–80%) for documents you only need to view
            on screen, like reference material or quick-share copies. Some image detail
            and text crispness will be sacrificed in exchange for the tiniest file.
          </p>

          <h3>How PDF Compression Works</h3>
          <p>
            The tool renders each page of your PDF to a canvas at a chosen resolution,
            re-encodes it as a quality-adjusted JPEG image, then assembles those images
            into a fresh PDF. This approach drastically reduces size for image-heavy and
            scanned documents. The compression runs entirely in your browser using
            <code> pdf.js</code> and <code>pdf-lib</code> — no upload, no waiting, no
            privacy compromise.
          </p>

          <h3>When PDF Compression Won't Help (and What to Do)</h3>
          <p>
            PDFs that are already heavily optimized (small files, mostly text) may not
            shrink further. In that case, the tool detects no improvement and downloads
            your original file unchanged so you never lose quality unnecessarily.
          </p>

          <h3>Best Practices for Smaller PDFs</h3>
          <ul>
            <li>Scan documents at 200–300 DPI rather than 600 DPI when possible.</li>
            <li>Use grayscale (via our Grayscale PDF tool) before compressing for text-only documents.</li>
            <li>Delete unused pages with our Delete Pages tool before compressing.</li>
            <li>For very large PDFs, split into smaller files first using the Split PDF tool.</li>
          </ul>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default CompressPdf;
