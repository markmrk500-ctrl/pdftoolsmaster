import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import JSZip from "jszip";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const faqs = [
  {
    question: "What format are the output images?",
    answer:
      "Each PDF page is rendered as a high-quality JPG image (150 DPI scale).",
  },
  {
    question: "How are multiple pages delivered?",
    answer:
      "If your PDF has more than one page, all images are bundled into a single ZIP file for easy download.",
  },
  {
    question: "Are my files uploaded?",
    answer: "No. Rendering happens entirely in your browser using PDF.js.",
  },
];

const PdfToJpg = () => {
  const [files, setFiles] = useState<File[]>([]);
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

      const blobs: { name: string; blob: Blob }[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        const blob = await new Promise<Blob>((res) =>
          canvas.toBlob((b) => res(b!), "image/jpeg", 0.92)
        );
        blobs.push({ name: `${baseName}-page-${i}.jpg`, blob });
        setProgress(10 + Math.round((i / pdf.numPages) * 80));
      }

      if (blobs.length === 1) {
        const url = URL.createObjectURL(blobs[0].blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = blobs[0].name;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const zip = new JSZip();
        blobs.forEach((b) => zip.file(b.name, b.blob));
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${baseName}-images.zip`;
        a.click();
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
      title="PDF to JPG Online — Convert PDF Pages to Images Free | PDFMaster Tools"
      description="Convert each page of a PDF to a high-quality JPG image online for free. Multiple pages bundled in a ZIP. Browser-based — no upload required."
      keywords="pdf to jpg, pdf to image, convert pdf to jpg, pdf to png, pdf to jpg converter, pdf page to image"
      h1="PDF to JPG Converter — Free Online"
      intro="Turn every page of your PDF into a high-resolution JPG image. Multiple pages download as a single ZIP."
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

          {processing && <Progress value={progress} />}

          <Button
            size="lg"
            className="w-full"
            disabled={!files[0] || processing}
            onClick={handleConvert}
          >
            {processing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Converting...</>
            ) : (
              <><ImageIcon className="h-4 w-4" /> Convert to JPG</>
            )}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>How to Convert PDF to JPG Images — Complete Guide</h2>
          <p>
            Converting PDF pages to JPG images is useful for posting on social media,
            embedding in slide decks, quickly previewing documents on devices that don't
            have a PDF reader, creating thumbnails for websites, or sharing single pages
            without sending the whole document. Our converter renders each page at 2×
            scale for sharp, high-resolution output.
          </p>

          <h3>Step-by-Step: How to Convert PDF to JPG</h3>
          <ol>
            <li><strong>Upload your PDF</strong> using the dropzone above.</li>
            <li><strong>Click Convert to JPG.</strong> Each page is rendered at high resolution.</li>
            <li><strong>Download.</strong> Single-page PDFs deliver one JPG; multi-page PDFs are bundled in a ZIP file.</li>
          </ol>

          <h3>Common Use Cases</h3>
          <ul>
            <li>Posting a single PDF page as an image on social media</li>
            <li>Embedding pages into a PowerPoint or Google Slides presentation</li>
            <li>Creating preview thumbnails for a website or marketplace</li>
            <li>Sharing one page from a PDF without sending the entire file</li>
            <li>Importing PDF content into image editors like Photoshop or GIMP</li>
            <li>Generating high-resolution screenshots from PDF reports</li>
          </ul>

          <h3>Output Quality</h3>
          <p>
            Pages are rendered at 2× their native PDF dimensions and saved as 92%-quality
            JPEG images. This produces sharp, screen-ready output suitable for
            presentations, web pages, and print at typical sizes.
          </p>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default PdfToJpg;
