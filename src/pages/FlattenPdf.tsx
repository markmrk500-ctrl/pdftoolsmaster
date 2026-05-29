import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { PDFDocument } from "pdf-lib";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2, Layers } from "lucide-react";
import { toast } from "@/hooks/use-toast";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const faqs = [
  { question: "What does flattening a PDF do?", answer: "Flattening turns interactive elements (form fields, annotations, signatures) into static page content so they can no longer be edited or removed." },
  { question: "How does this tool flatten?", answer: "Each page is rasterized to a high-resolution image and embedded back into a new PDF. The result looks identical but contains no editable layers." },
  { question: "Will text remain selectable?", answer: "No — flattening via rasterization makes the document image-based. Use this when you specifically want a non-editable, signed-off final version." },
];

const FlattenPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const handleFlatten = async () => {
    if (!files[0]) return;
    setProcessing(true);
    setProgress(5);
    try {
      const file = files[0];
      const bytes = await file.arrayBuffer();
      const src = await pdfjsLib.getDocument({ data: bytes }).promise;
      const out = await PDFDocument.create();
      for (let i = 1; i <= src.numPages; i++) {
        const page = await src.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport } as any).promise;
        const jpg = canvas.toDataURL("image/jpeg", 0.92);
        const jpgBytes = await (await fetch(jpg)).arrayBuffer();
        const img = await out.embedJpg(jpgBytes);
        const newPage = out.addPage([viewport.width / 2, viewport.height / 2]);
        newPage.drawImage(img, { x: 0, y: 0, width: viewport.width / 2, height: viewport.height / 2 });
        setProgress(10 + Math.round((i / src.numPages) * 80));
      }
      const data = await out.save();
      const blob = new Blob([data as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "") + "-flattened.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setProgress(100);
      toast({ title: "Flattened", description: "File downloaded." });
    } catch (e) {
      console.error(e);
      toast({ title: "Flattening failed", variant: "destructive" });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  return (
    <ToolPageShell
      title="Flatten PDF Online Free – Lock Forms & Annotations on Any Device | Master PDF Tools"
      description="Flatten PDF forms, fields, and annotations into static content online. Mobile-friendly, cross-browser, secure, and compatible with all devices and software versions."
      keywords="Flatten PDF Online Free, Lock PDF Forms, PDF Flatten Tool for All Devices, Mobile PDF Flatten, flatten pdf, flatten pdf form, lock pdf, freeze pdf, flatten signature pdf, non-editable pdf"
      h1="Flatten PDF — Lock Forms, Annotations & Signatures"
      intro="Convert form fields, annotations, and editable layers into permanent page content. The output looks identical but cannot be modified."
      faqSchema={faqs}
      breadcrumbName="Flatten PDF"
      breadcrumbPath="/flatten-pdf"
      toolUI={
        <div className="space-y-6">
          <FileDropzone onFiles={setFiles} files={files} onRemove={() => setFiles([])} />
          {processing && <Progress value={progress} />}
          <Button size="lg" className="w-full" disabled={!files.length || processing} onClick={handleFlatten}>
            {processing ? (<><Loader2 className="h-4 w-4 animate-spin" /> Flattening...</>) : (<><Layers className="h-4 w-4" /> Flatten PDF</>)}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>What Does It Mean to Flatten a PDF?</h2>
          <p>
            A PDF can contain dynamic, editable layers — fillable form fields, sticky notes, highlight annotations, drawn signatures, even comments from multiple reviewers. Flattening permanently bakes those layers into the page so they appear in every viewer, on every device, and can no longer be edited, removed, or rearranged.
          </p>
          <h3>When to Flatten</h3>
          <ul>
            <li><strong>Final signed contracts</strong> — prevent recipients from editing the signature or filled fields.</li>
            <li><strong>Survey or application forms</strong> — lock answers before submission.</li>
            <li><strong>Reviewed manuscripts</strong> — turn comments and highlights into permanent marks.</li>
            <li><strong>Compatibility</strong> — ensure annotations display correctly in every PDF viewer, including older mobile readers.</li>
          </ul>
          <h3>How It Works</h3>
          <p>
            This tool renders every page of your PDF to a high-resolution image and rebuilds the document around those images. The output is visually identical but text and form fields are no longer separate, editable objects. For a true "freeze the file" workflow, this is the safest, most universal approach.
          </p>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default FlattenPdf;
