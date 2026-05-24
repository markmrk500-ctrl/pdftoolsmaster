import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import JSZip from "jszip";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Images } from "lucide-react";
import { toast } from "@/hooks/use-toast";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const faqs = [
  { question: "What does this tool extract?", answer: "It renders each page of your PDF as a high-resolution image so you can pull out figures, photos, charts, and screenshots — even if they're not separately embedded." },
  { question: "Why not extract embedded images directly?", answer: "Many PDFs use clipped, masked, or recombined images that don't extract cleanly. Rendering full pages produces predictable, high-quality output every time." },
  { question: "What format are the images?", answer: "PNG, bundled into a ZIP file when there are multiple pages." },
];

const ExtractImages = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const handleExtract = async () => {
    if (!files[0]) return;
    setProcessing(true);
    setProgress(5);
    try {
      const file = files[0];
      const bytes = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      const baseName = file.name.replace(/\.pdf$/i, "");
      const zip = new JSZip();
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.5 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), "image/png"));
        zip.file(`${baseName}-image-${i}.png`, blob);
        setProgress(10 + Math.round((i / pdf.numPages) * 80));
      }
      const out = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(out);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseName}-images.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setProgress(100);
      toast({ title: "Images extracted", description: "ZIP downloaded." });
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
      title="Extract Images from PDF Online — Free PDF Image Extractor | PDFMaster"
      description="Extract images from PDF files online for free. Pull figures, photos, and diagrams as high-resolution PNGs. Browser-based, private, no signup."
      keywords="extract images from pdf, pdf image extractor, get images from pdf, pdf to images, save images from pdf"
      h1="Extract Images from PDF — Save Every Page as a PNG"
      intro="Pull every page out of a PDF as a crisp, high-resolution PNG image. Perfect for grabbing diagrams, figures, and screenshots."
      faqSchema={faqs}
      breadcrumbName="Extract Images from PDF"
      breadcrumbPath="/extract-images"
      toolUI={
        <div className="space-y-6">
          <FileDropzone onFiles={setFiles} files={files} onRemove={() => setFiles([])} />
          {processing && <Progress value={progress} />}
          <Button size="lg" className="w-full" disabled={!files.length || processing} onClick={handleExtract}>
            {processing ? (<><Loader2 className="h-4 w-4 animate-spin" /> Extracting...</>) : (<><Images className="h-4 w-4" /> Extract Images</>)}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>Extract Every Image from a PDF — High Resolution, Browser Based</h2>
          <p>
            Many PDFs contain valuable visual assets — slides from presentations, charts in research papers, infographics in reports, or scanned figures in manuals. This tool gives you a reliable way to capture each page as a print-quality PNG image. Because it renders pages directly with PDF.js at 2.5× resolution, you get consistent, crisp output without the fragility of trying to extract embedded raster streams.
          </p>
          <h3>Step-by-Step</h3>
          <ol>
            <li><strong>Drop your PDF</strong> into the dropzone.</li>
            <li><strong>Click Extract Images.</strong> Each page is rendered to PNG.</li>
            <li><strong>Download the ZIP</strong> containing every image.</li>
          </ol>
          <h3>Why Render Pages Instead of Pulling Embedded Streams?</h3>
          <p>
            PDFs frequently store a single visual as multiple stitched, masked, or color-separated raster objects. Pulling them raw often produces fragments. Rendering full pages preserves the visual exactly as it appears, including overlays and vector content.
          </p>
          <h3>Common Use Cases</h3>
          <ul>
            <li>Reusing slides from a PDF deck in another presentation</li>
            <li>Saving figures and tables from scientific papers for citation</li>
            <li>Capturing infographics from marketing reports</li>
            <li>Pulling product photos out of catalogs</li>
            <li>Archiving every page of a contract as an image for OCR</li>
          </ul>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default ExtractImages;
