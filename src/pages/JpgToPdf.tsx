import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { PDFDocument } from "pdf-lib";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2, Upload, X, ArrowUp, ArrowDown, Image as ImageIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "What image formats are supported?",
    answer:
      "JPG/JPEG and PNG images are supported. Each image becomes one page in the resulting PDF.",
  },
  {
    question: "Can I reorder images before converting?",
    answer:
      "Yes. Use the up/down arrows on each image card to set the page order before clicking Convert.",
  },
  {
    question: "Are my images uploaded?",
    answer:
      "No. Conversion runs entirely in your browser — nothing leaves your device.",
  },
];

const JpgToPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    const valid = accepted.filter((f) => f.type === "image/jpeg" || f.type === "image/png");
    if (valid.length !== accepted.length) {
      toast({ title: "Only JPG and PNG images are allowed", variant: "destructive" });
    }
    setFiles((p) => [...p, ...valid]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"] },
    multiple: true,
    maxSize: 20 * 1024 * 1024,
  });

  const move = (i: number, dir: -1 | 1) => {
    setFiles((p) => {
      const next = [...p];
      const j = i + dir;
      if (j < 0 || j >= next.length) return p;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };
  const remove = (i: number) => setFiles((p) => p.filter((_, idx) => idx !== i));

  const handleConvert = async () => {
    if (!files.length) return;
    setProcessing(true);
    setProgress(5);
    try {
      const pdf = await PDFDocument.create();
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const bytes = await f.arrayBuffer();
        const img = f.type === "image/png" ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
        const page = pdf.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        setProgress(10 + Math.round(((i + 1) / files.length) * 80));
      }
      const out = await pdf.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "images.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setProgress(100);
      toast({ title: "PDF created", description: "File downloaded." });
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
      title="JPG to PDF Online — Convert Images to PDF Free | PDFMaster Tools"
      description="Convert JPG and PNG images to a single PDF online for free. Reorder pages, combine multiple images, browser-based and secure — no signup."
      keywords="jpg to pdf, png to pdf, image to pdf, convert image to pdf, jpg to pdf converter, photo to pdf"
      h1="JPG to PDF Converter — Combine Images into One PDF"
      intro="Combine multiple JPG or PNG images into a single PDF document. Reorder, preview, and download — all in your browser."
      faqSchema={faqs}
      toolUI={
        <div className="space-y-6">
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-2xl p-10 md:p-14 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-primary bg-accent"
                : "border-border bg-card hover:border-primary/50 hover:bg-accent/30"
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-accent flex items-center justify-center">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <p className="font-semibold text-base md:text-lg">
                Drop JPG or PNG images here or click to upload
              </p>
              <p className="text-sm text-muted-foreground">Multiple files • Max 20MB each</p>
            </div>
          </div>

          {files.length > 0 && (
            <ul className="space-y-2">
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3"
                >
                  <ImageIcon className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {i + 1}. {f.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(f.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 hover:bg-secondary rounded disabled:opacity-30" aria-label="Move up">
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button onClick={() => move(i, 1)} disabled={i === files.length - 1} className="p-1 hover:bg-secondary rounded disabled:opacity-30" aria-label="Move down">
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove(i)} className="p-1 hover:bg-secondary rounded" aria-label="Remove">
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {processing && <Progress value={progress} />}

          <Button
            size="lg"
            className="w-full"
            disabled={!files.length || processing}
            onClick={handleConvert}
          >
            {processing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Converting...</>
            ) : (
              <><Download className="h-4 w-4" /> Convert to PDF</>
            )}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>How to Convert JPG to PDF — Complete Guide</h2>
          <p>
            Converting images to PDF is useful for sharing scanned documents, archiving
            photos, assembling visual reports, submitting application materials, or
            sending receipts in a unified format. Drop your JPG or PNG files, drag them
            into the order you want, and click Convert — each image becomes a separate
            page sized to match the original image dimensions.
          </p>

          <h3>Step-by-Step: How to Convert JPG to PDF</h3>
          <ol>
            <li><strong>Drop your images</strong> into the dropzone (JPG or PNG, multiple files OK).</li>
            <li><strong>Reorder them</strong> using the up/down arrows so pages appear in the right sequence.</li>
            <li><strong>Click Convert to PDF.</strong> Your combined PDF downloads automatically.</li>
          </ol>

          <h3>Common Use Cases</h3>
          <ul>
            <li>Combining smartphone photos of a paper document into one PDF</li>
            <li>Submitting a passport scan, ID, and proof of address as a single file</li>
            <li>Archiving photos with consistent formatting</li>
            <li>Creating a printable photo album or visual portfolio</li>
            <li>Bundling product screenshots into a quick reference document</li>
            <li>Converting receipts for expense reports</li>
          </ul>

          <h3>Tips for Best Results</h3>
          <ul>
            <li>Take photos in landscape orientation for letter-sized output.</li>
            <li>Use even lighting and a flat surface for sharp scans.</li>
            <li>Crop and rotate images <em>before</em> converting for cleaner pages.</li>
            <li>Compress the resulting PDF afterwards if file size matters.</li>
          </ul>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default JpgToPdf;
