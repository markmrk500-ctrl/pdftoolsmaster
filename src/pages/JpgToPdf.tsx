import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { PDFDocument, PageSizes } from "pdf-lib";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Download, Loader2, Upload, X, ArrowUp, ArrowDown, Image as ImageIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const faqs = [
  { question: "What image formats are supported?", answer: "JPG/JPEG and PNG. Each image becomes one page in the resulting PDF." },
  { question: "Can I choose page size and orientation?", answer: "Yes. Pick 'Fit to image' to keep each image's native dimensions, or set A4 / US Letter with automatic or fixed portrait/landscape orientation." },
  { question: "Can I add margins around each image?", answer: "Yes. Choose None, Small, or Big margins to control how much white space frames each page." },
  { question: "Are my images uploaded anywhere?", answer: "No. Conversion runs entirely in your browser — nothing leaves your device." },
];

type PageSize = "fit" | "a4" | "letter";
type Orientation = "auto" | "portrait" | "landscape";
type Margin = "none" | "small" | "big";

const SIZE_MAP: Record<Exclude<PageSize, "fit">, [number, number]> = {
  a4: PageSizes.A4,
  letter: PageSizes.Letter,
};
const MARGIN_MAP: Record<Margin, number> = { none: 0, small: 24, big: 60 };

const JpgToPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("fit");
  const [orientation, setOrientation] = useState<Orientation>("auto");
  const [margin, setMargin] = useState<Margin>("none");
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
      const m = MARGIN_MAP[margin];

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const bytes = await f.arrayBuffer();
        const img = f.type === "image/png" ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);

        let pageW: number, pageH: number;
        if (pageSize === "fit") {
          pageW = img.width + m * 2;
          pageH = img.height + m * 2;
        } else {
          const [sw, sh] = SIZE_MAP[pageSize];
          const wantLandscape =
            orientation === "landscape" ||
            (orientation === "auto" && img.width > img.height);
          pageW = wantLandscape ? sh : sw;
          pageH = wantLandscape ? sw : sh;
        }

        const page = pdf.addPage([pageW, pageH]);
        const availW = pageW - m * 2;
        const availH = pageH - m * 2;
        const scale = Math.min(availW / img.width, availH / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        page.drawImage(img, {
          x: (pageW - drawW) / 2,
          y: (pageH - drawH) / 2,
          width: drawW,
          height: drawH,
        });
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
      title="JPG to PDF Online Free – Page Size, Orientation & Margin | Master PDF Tools"
      description="Convert JPG and PNG images to PDF with iLovePDF-style controls: A4/Letter/Fit page size, auto or fixed orientation, and margin presets."
      keywords="JPG to PDF Online Free, Image to PDF, jpg to pdf, png to pdf, image to pdf converter, photo to pdf, a4 image pdf, letter image pdf"
      h1="JPG to PDF — Combine Images with Full Layout Control"
      intro="Combine JPG and PNG images into a single PDF with A4 / Letter / Fit page size, auto or fixed orientation, and margin presets."
      faqSchema={faqs}
      toolUI={
        <div className="space-y-6">
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-2xl p-10 md:p-14 text-center cursor-pointer transition-colors",
              isDragActive ? "border-primary bg-accent" : "border-border bg-card hover:border-primary/50 hover:bg-accent/30"
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-accent flex items-center justify-center">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <p className="font-semibold text-base md:text-lg">Drop JPG or PNG images here or click to upload</p>
              <p className="text-sm text-muted-foreground">Multiple files • Max 20MB each</p>
            </div>
          </div>

          {files.length > 0 && (
            <>
              <ul className="space-y-2">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3">
                    <ImageIcon className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{i + 1}. {f.name}</p>
                      <p className="text-xs text-muted-foreground">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 hover:bg-secondary rounded disabled:opacity-30" aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
                    <button onClick={() => move(i, 1)} disabled={i === files.length - 1} className="p-1 hover:bg-secondary rounded disabled:opacity-30" aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
                    <button onClick={() => remove(i)} className="p-1 hover:bg-secondary rounded" aria-label="Remove"><X className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Page size</Label>
                  <RadioGroup value={pageSize} onValueChange={(v) => setPageSize(v as PageSize)}>
                    {(["fit", "a4", "letter"] as PageSize[]).map((v) => (
                      <Label key={v} htmlFor={`ps-${v}`} className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem value={v} id={`ps-${v}`} />
                        <span className="text-sm">{v === "fit" ? "Fit to image" : v === "a4" ? "A4" : "US Letter"}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label>Orientation</Label>
                  <RadioGroup value={orientation} onValueChange={(v) => setOrientation(v as Orientation)}>
                    {(["auto", "portrait", "landscape"] as Orientation[]).map((v) => (
                      <Label key={v} htmlFor={`or-${v}`} className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem value={v} id={`or-${v}`} disabled={pageSize === "fit"} />
                        <span className="text-sm capitalize">{v}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label>Margin</Label>
                  <RadioGroup value={margin} onValueChange={(v) => setMargin(v as Margin)}>
                    {(["none", "small", "big"] as Margin[]).map((v) => (
                      <Label key={v} htmlFor={`mg-${v}`} className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem value={v} id={`mg-${v}`} />
                        <span className="text-sm capitalize">{v}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </>
          )}

          {processing && <Progress value={progress} />}

          <Button size="lg" className="w-full" disabled={!files.length || processing} onClick={handleConvert}>
            {processing ? (<><Loader2 className="h-4 w-4 animate-spin" /> Converting...</>) : (<><Download className="h-4 w-4" /> Convert to PDF</>)}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>Convert JPG and PNG to PDF with Layout Options</h2>
          <p>
            Not every image should be crammed into a single page size. This converter matches the layout
            controls you'd expect from iLovePDF or Adobe: choose Fit-to-image for scans that must stay
            pixel-perfect, or A4 / US Letter with auto-orientation for a consistent stack of pages, and add
            small or big margins to frame each image.
          </p>
          <h3>Step-by-step</h3>
          <ol>
            <li>Drop your JPG or PNG images.</li>
            <li>Reorder them, then pick page size, orientation, and margins.</li>
            <li>Click Convert to PDF — the combined file downloads instantly.</li>
          </ol>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default JpgToPdf;
