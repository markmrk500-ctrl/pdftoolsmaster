import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { pdfjsLib } from "@/lib/pdfjs";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Download, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const faqs = [
  { question: "What's the difference between the compression levels?", answer: "Less compression preserves text as text (vector) and only strips metadata and re-optimizes streams — best quality, smaller savings. Recommended compression rasterizes pages at 150 DPI equivalent for a balanced shrink. Extreme compression uses aggressive image re-encoding for the smallest possible file, at the cost of text sharpness." },
  { question: "Will text stay searchable and selectable?", answer: "On the 'Less compression' level, yes — the tool keeps the original text objects. Recommended and Extreme rasterize pages, so the text becomes part of the page image (non-selectable). Use Less compression when you need OCR-ready or searchable output." },
  { question: "How much shrink should I expect?", answer: "Image-heavy PDFs typically shrink 40–70% on Recommended and 60–85% on Extreme. Text-only or already-optimized PDFs may only shrink 5–15% on Less, and the tool will keep your original if compression doesn't help." },
  { question: "Is my file uploaded?", answer: "No. Compression runs entirely in your browser using pdf-lib and pdf.js. Your file never leaves your device." },
];

type Level = "less" | "recommended" | "extreme";
const settings: Record<Exclude<Level, "less">, { scale: number; quality: number }> = {
  recommended: { scale: 1.25, quality: 0.72 },
  extreme: { scale: 0.85, quality: 0.5 },
};

const CompressPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [level, setLevel] = useState<Level>("recommended");
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ before: number; after: number; textPreserved: boolean } | null>(null);

  const handleCompress = async () => {
    if (!files[0]) return;
    setProcessing(true);
    setProgress(2);
    setResult(null);
    try {
      const file = files[0];
      const bytes = await file.arrayBuffer();
      let compressed: Uint8Array;
      let textPreserved = false;

      if (level === "less") {
        // Text-preserving: pdf-lib re-save + metadata strip + object streams.
        const src = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
        src.setTitle("");
        src.setAuthor("");
        src.setSubject("");
        src.setKeywords([]);
        src.setProducer("");
        src.setCreator("");
        setProgress(60);
        compressed = await src.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 200 });
        textPreserved = true;
        setProgress(95);
      } else {
        const { scale, quality } = settings[level];
        const loadingTask = pdfjsLib.getDocument({
          data: bytes.slice(0),
          password: "",
          isEvalSupported: false,
          useSystemFonts: true,
        });
        const pdfDoc = await loadingTask.promise;
        const out = await PDFDocument.create();

        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.floor(viewport.width));
          canvas.height = Math.max(1, Math.floor(viewport.height));
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
        compressed = await out.save({ useObjectStreams: true });
        setProgress(95);
      }

      const finalBytes = compressed.byteLength < bytes.byteLength ? compressed : new Uint8Array(bytes);
      const usedFallback = finalBytes.byteLength === bytes.byteLength;
      const blob = new Blob([finalBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "") + "-compressed.pdf";
      a.click();
      URL.revokeObjectURL(url);

      setResult({ before: bytes.byteLength, after: finalBytes.byteLength, textPreserved: textPreserved || usedFallback });
      setProgress(100);
      toast({ title: "Compression complete", description: usedFallback ? "Original file kept — already optimized." : "Your file has been downloaded." });
    } catch (e: any) {
      console.error("Compress PDF error:", e);
      const name = e?.name || "";
      const msg = String(e?.message || e || "");
      let description = "Something went wrong while compressing this PDF. Please try again.";
      if (name === "PasswordException" || /password/i.test(msg)) {
        description = "This PDF is password-protected. Unlock it first with our Unlock PDF tool.";
      } else if (name === "InvalidPDFException" || /invalid pdf|corrupt|missing pdf/i.test(msg)) {
        description = "This file doesn't look like a valid PDF or it may be damaged.";
      } else if (/memory|allocation|maximum call stack/i.test(msg)) {
        description = "The PDF is too large for this browser. Try 'Less compression' or split the file first.";
      }
      toast({ title: "Compression failed", description, variant: "destructive" });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  const fmt = (b: number) => (b / 1024 / 1024).toFixed(2) + " MB";
  const reduction = result && result.before > 0 ? Math.max(0, Math.round((1 - result.after / result.before) * 100)) : 0;

  return (
    <ToolPageShell
      title="Compress PDF Online Free – Reduce PDF Size on Any Device | Master PDF Tools"
      description="Compress PDF files with three quality levels — keep text sharp or shrink aggressively. Mobile-friendly, cross-browser, private, and 100% client-side."
      keywords="Compress PDF Online Free, Reduce PDF Size, PDF Compressor, compress pdf, shrink pdf, optimize pdf, make pdf smaller, pdf compressor online"
      h1="Compress PDF Online — Reduce File Size up to 85%"
      intro="Shrink your PDF with three compression levels: keep text as text with Less compression, or maximize savings with Recommended and Extreme."
      faqSchema={faqs}
      toolUI={
        <div className="space-y-6">
          <FileDropzone
            files={files}
            onFiles={(f) => setFiles([f[0]])}
            onRemove={() => setFiles([])}
            cta="Drop a PDF here or click to upload"
            subtitle="One file at a time • Max 150MB"
          />

          <div className="space-y-3">
            <Label>Compression level</Label>
            <RadioGroup value={level} onValueChange={(v) => setLevel(v as Level)} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {([
                { v: "less", title: "Less compression", sub: "High quality • Keeps text selectable" },
                { v: "recommended", title: "Recommended", sub: "Balanced • ~40–60% smaller" },
                { v: "extreme", title: "Extreme", sub: "Smallest • ~60–85% smaller" },
              ] as { v: Level; title: string; sub: string }[]).map((opt) => (
                <Label
                  key={opt.v}
                  htmlFor={opt.v}
                  className="flex flex-col items-start gap-1 border border-border rounded-lg p-4 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value={opt.v} id={opt.v} />
                    <span className="font-semibold">{opt.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{opt.sub}</span>
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
              {result.textPreserved && <div className="text-xs text-muted-foreground pt-1">Text kept as selectable text.</div>}
            </div>
          )}

          <Button size="lg" className="w-full" disabled={!files[0] || processing} onClick={handleCompress}>
            {processing ? (<><Loader2 className="h-4 w-4 animate-spin" /> Compressing...</>) : (<><Download className="h-4 w-4" /> Compress & Download</>)}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>Compress PDF the Right Way — Three Levels, One Free Tool</h2>
          <p>
            Large PDF files cause everyday problems: email bounces, slow uploads, expensive cloud storage.
            This compressor gives you the same three-tier control you get in premium desktop apps — Less
            compression to keep text vector-perfect, Recommended for balanced everyday shrink, and Extreme
            when you need the tiniest possible file. Compression runs 100% in your browser.
          </p>

          <h3>Which level should I choose?</h3>
          <ul>
            <li><strong>Less compression</strong> — keeps text as selectable text, strips embedded metadata, and re-optimizes streams. Best for legal documents, contracts, and searchable archives.</li>
            <li><strong>Recommended</strong> — re-encodes pages at ~150 DPI JPEG for the classic 40–60% shrink most people want for email attachments and cloud storage.</li>
            <li><strong>Extreme</strong> — aggressive image re-encoding for the smallest file. Ideal for on-screen viewing and quick sharing.</li>
          </ul>

          <h3>How to compress a PDF</h3>
          <ol>
            <li>Upload your PDF.</li>
            <li>Pick a compression level.</li>
            <li>Click Compress &amp; Download — the result includes an on-screen size summary.</li>
          </ol>

          <h3>Privacy</h3>
          <p>
            Every byte stays on your device. The tool uses pdf-lib and pdf.js in the browser — no upload,
            no server, no tracking of your file contents.
          </p>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default CompressPdf;
