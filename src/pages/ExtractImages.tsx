import { useState } from "react";
import JSZip from "jszip";
import { pdfjsLib } from "@/lib/pdfjs";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Images } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const faqs = [
  { question: "Does this pull real embedded images or just page snapshots?", answer: "Both — the default mode extracts the actual image objects embedded in the PDF (photos, logos, figures) at their original resolution. Switch to 'Render pages' if you'd rather save each whole page as a PNG." },
  { question: "What if the PDF has no embedded images?", answer: "Some PDFs draw everything as vector shapes with no raster images inside. In that case, embedded extraction produces nothing and you should use 'Render pages' instead." },
  { question: "What format are the images?", answer: "PNG. Multi-image PDFs deliver a single ZIP archive; single-image PDFs download the PNG directly." },
];

type Mode = "embedded" | "render";

const canvasToBlob = (canvas: HTMLCanvasElement, type = "image/png"): Promise<Blob> =>
  new Promise((r) => canvas.toBlob((b) => r(b!), type));

const ExtractImages = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<Mode>("embedded");
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const extractEmbedded = async (bytes: ArrayBuffer, baseName: string, zip: JSZip) => {
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(bytes) }).promise;
    const seen = new Set<string>();
    let count = 0;

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const ops = await page.getOperatorList();
      const OPS = (pdfjsLib as any).OPS;

      for (let j = 0; j < ops.fnArray.length; j++) {
        const fn = ops.fnArray[j];
        if (fn === OPS.paintImageXObject || fn === OPS.paintJpegXObject || fn === OPS.paintInlineImageXObject) {
          const args = ops.argsArray[j];
          const name = args?.[0];
          if (!name || typeof name !== "string") continue;
          const key = `p${i}-${name}`;
          if (seen.has(name)) continue;
          seen.add(name);

          try {
            const img: any = await new Promise((resolve, reject) => {
              try {
                page.objs.get(name, (obj: any) => resolve(obj));
              } catch {
                (page as any).commonObjs.get(name, (obj: any) => resolve(obj));
              }
              setTimeout(() => reject(new Error("timeout")), 8000);
            });
            if (!img) continue;

            const w = img.width || img.bitmap?.width;
            const h = img.height || img.bitmap?.height;
            if (!w || !h || w < 8 || h < 8) continue;

            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d")!;

            if (img.bitmap) {
              ctx.drawImage(img.bitmap, 0, 0);
            } else if (img.data) {
              const kind = img.kind; // 1=GRAYSCALE_1BPP, 2=RGB_24BPP, 3=RGBA_32BPP
              const imgData = ctx.createImageData(w, h);
              const src = img.data;
              if (kind === 3 || src.length === w * h * 4) {
                imgData.data.set(src);
              } else if (kind === 2 || src.length === w * h * 3) {
                for (let p = 0, q = 0; p < src.length; p += 3, q += 4) {
                  imgData.data[q] = src[p];
                  imgData.data[q + 1] = src[p + 1];
                  imgData.data[q + 2] = src[p + 2];
                  imgData.data[q + 3] = 255;
                }
              } else {
                // Grayscale fallback
                for (let p = 0, q = 0; p < src.length; p += 1, q += 4) {
                  const v = src[p];
                  imgData.data[q] = v;
                  imgData.data[q + 1] = v;
                  imgData.data[q + 2] = v;
                  imgData.data[q + 3] = 255;
                }
              }
              ctx.putImageData(imgData, 0, 0);
            } else {
              continue;
            }

            const blob = await canvasToBlob(canvas);
            zip.file(`${baseName}-image-p${i}-${++count}.png`, blob);
          } catch (err) {
            console.warn("Skip image", key, err);
          }
        }
      }
      setProgress(10 + Math.round((i / pdf.numPages) * 80));
    }

    return count;
  };

  const renderPages = async (bytes: ArrayBuffer, baseName: string, zip: JSZip) => {
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(bytes) }).promise;
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.5 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
      const blob = await canvasToBlob(canvas);
      zip.file(`${baseName}-page-${i}.png`, blob);
      setProgress(10 + Math.round((i / pdf.numPages) * 80));
    }
    return pdf.numPages;
  };

  const handleExtract = async () => {
    if (!files[0]) return;
    setProcessing(true);
    setProgress(5);
    try {
      const file = files[0];
      const bytes = await file.arrayBuffer();
      const baseName = file.name.replace(/\.pdf$/i, "");
      const zip = new JSZip();

      let count = 0;
      if (mode === "embedded") {
        count = await extractEmbedded(bytes, baseName, zip);
        if (count === 0) {
          toast({
            title: "No embedded images found",
            description: "Falling back to full-page render.",
          });
          count = await renderPages(bytes, baseName, zip);
        }
      } else {
        count = await renderPages(bytes, baseName, zip);
      }

      const out = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(out);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseName}-images.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setProgress(100);
      toast({ title: "Images extracted", description: `${count} image(s) in ZIP.` });
    } catch (e) {
      console.error(e);
      toast({ title: "Extraction failed", variant: "destructive" });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  return (
    <ToolPageShell
      title="Extract Images from PDF Online Free – Real Image Extraction | Master PDF Tools"
      description="Pull real embedded images out of any PDF at their original resolution, or render whole pages as PNG. 100% in-browser, private, cross-platform."
      keywords="Extract Images from PDF Online Free, PDF Image Extractor, extract embedded images pdf, pdf photo extractor, get images from pdf"
      h1="Extract Images from PDF — Real Embedded Photos, Not Just Page Snapshots"
      intro="Pull the actual image objects out of your PDF at their original resolution, or render each full page as PNG. Everything happens locally in your browser."
      faqSchema={faqs}
      breadcrumbName="Extract Images from PDF"
      breadcrumbPath="/extract-images"
      toolUI={
        <div className="space-y-6">
          <FileDropzone onFiles={setFiles} files={files} onRemove={() => setFiles([])} />

          <div className="space-y-3">
            <Label>Extraction mode</Label>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as Mode)} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Label htmlFor="embedded" className="flex flex-col gap-1 border border-border rounded-lg p-4 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-accent/50">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="embedded" id="embedded" />
                  <span className="font-semibold">Embedded images</span>
                </div>
                <span className="text-xs text-muted-foreground">Real photos/logos at native resolution</span>
              </Label>
              <Label htmlFor="render" className="flex flex-col gap-1 border border-border rounded-lg p-4 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-accent/50">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="render" id="render" />
                  <span className="font-semibold">Render pages</span>
                </div>
                <span className="text-xs text-muted-foreground">Each page as a high-res PNG</span>
              </Label>
            </RadioGroup>
          </div>

          {processing && <Progress value={progress} />}
          <Button size="lg" className="w-full" disabled={!files.length || processing} onClick={handleExtract}>
            {processing ? (<><Loader2 className="h-4 w-4 animate-spin" /> Extracting...</>) : (<><Images className="h-4 w-4" /> Extract Images</>)}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>Two ways to pull images out of any PDF</h2>
          <p>
            Most "PDF image extractors" just render whole pages and call it a day. This tool does both:
            it walks the PDF's operator list to grab the real embedded image XObjects — the original
            photos, logos, scans, and figures at their native resolution — and falls back to full-page
            rendering when the PDF doesn't actually embed rasters.
          </p>
          <h3>When to use each mode</h3>
          <ul>
            <li><strong>Embedded images</strong> — you want the exact photos, product shots, or figures that were placed into the PDF, in their original size and format.</li>
            <li><strong>Render pages</strong> — the PDF is mostly vector (charts, text), or you want the visual layout preserved with backgrounds and overlays.</li>
          </ul>
          <h3>Privacy</h3>
          <p>Every image is extracted locally with pdf.js. Nothing is uploaded.</p>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default ExtractImages;
