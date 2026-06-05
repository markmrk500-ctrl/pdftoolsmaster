import { useState } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2, RotateCw, RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const faqs = [
  {
    question: "Can I rotate just one page or all pages?",
    answer:
      "This tool rotates every page of the PDF by the angle you choose. To rotate specific pages only, use Split PDF first to extract them.",
  },
  {
    question: "Does rotating reduce quality?",
    answer:
      "No. Rotation only changes page metadata, not the underlying content. Quality is preserved exactly.",
  },
  {
    question: "Are my files uploaded?",
    answer:
      "No. Rotation runs entirely in your browser. Your PDF never leaves your device.",
  },
];

const RotatePdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [angle, setAngle] = useState<90 | 180 | 270>(90);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const handleRotate = async () => {
    if (!files[0]) return;
    setProcessing(true);
    setProgress(10);
    try {
      const bytes = await files[0].arrayBuffer();
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = pdf.getPages();
      pages.forEach((p) => {
        const current = p.getRotation().angle;
        p.setRotation(degrees((current + angle) % 360));
      });
      setProgress(80);
      const out = await pdf.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = files[0].name.replace(/\.pdf$/i, "") + "-rotated.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setProgress(100);
      toast({ title: "Rotation complete", description: "File downloaded." });
    } catch (e) {
      console.error(e);
      toast({ title: "Rotation failed", variant: "destructive" });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  return (
    <ToolPageShell
      title="Rotate PDF Online Free – Rotate PDF Pages on Any Device | Master PDF Tools"
      description="Rotate PDF pages online with a free PDF rotator. Mobile-friendly, cross-browser, secure, and compatible with all devices and software versions."
      keywords="Rotate PDF Online Free, PDF Page Rotator, Rotate PDF on Any Device, Mobile PDF Rotator, Cross-platform PDF Rotate, rotate pdf, pdf rotator, rotate pdf pages, fix pdf orientation, turn pdf, rotate pdf online free"
      h1="Rotate PDF Pages Online — Free PDF Rotator"
      intro="Rotate every page of your PDF clockwise or counter-clockwise. Fix scanned documents, sideways pages, and orientation issues in one click."
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

          <div className="grid grid-cols-3 gap-3">
            <Button
              variant={angle === 270 ? "default" : "outline"}
              onClick={() => setAngle(270)}
            >
              <RotateCcw className="h-4 w-4" /> 90° Left
            </Button>
            <Button
              variant={angle === 180 ? "default" : "outline"}
              onClick={() => setAngle(180)}
            >
              180°
            </Button>
            <Button
              variant={angle === 90 ? "default" : "outline"}
              onClick={() => setAngle(90)}
            >
              <RotateCw className="h-4 w-4" /> 90° Right
            </Button>
          </div>

          {processing && <Progress value={progress} />}

          <Button
            size="lg"
            className="w-full"
            disabled={!files[0] || processing}
            onClick={handleRotate}
          >
            {processing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Rotating...</>
            ) : (
              <><Download className="h-4 w-4" /> Rotate & Download</>
            )}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>How to Rotate a PDF Online — Complete Guide</h2>
          <p>
            Sometimes scanned, downloaded, or auto-generated PDFs come in the wrong
            orientation — sideways, upside down, or rotated incorrectly by a scanner or
            mobile camera. Reading them is uncomfortable, printing them is wasteful, and
            sending them looks unprofessional. The Rotate PDF tool from PDFMaster Tools
            lets you fix that with a single click. Choose 90° left, 180°, or 90° right
            and download the corrected file instantly.
          </p>

          <h3>Step-by-Step: How to Rotate a PDF</h3>
          <ol>
            <li><strong>Upload your PDF</strong> by dragging it in or clicking to browse.</li>
            <li><strong>Pick a rotation:</strong> 90° left (counter-clockwise), 180° (flip), or 90° right (clockwise).</li>
            <li><strong>Click Rotate &amp; Download.</strong> The new PDF downloads automatically.</li>
          </ol>

          <h3>Why Rotation Doesn't Reduce Quality</h3>
          <p>
            Because rotation only updates the page metadata — not the underlying content
            — file size and image quality stay exactly the same as the original. The
            text remains selectable, embedded fonts are preserved, and images keep their
            full resolution.
          </p>

          <h3>When to Use the Rotate PDF Tool</h3>
          <ul>
            <li>Fixing scanned documents that came out sideways</li>
            <li>Correcting photos of receipts or whiteboards saved as PDFs</li>
            <li>Reorienting landscape pages to portrait for printing</li>
            <li>Preparing PDFs for proper display on tablets and e-readers</li>
            <li>Fixing upside-down pages from auto-rotated scanners</li>
            <li>Standardizing orientation before merging multiple PDFs</li>
          </ul>

          <h3>Need to Rotate Just One Page?</h3>
          <p>
            This tool rotates every page by the same angle. To rotate specific pages
            independently, use our <strong>Organize PDF</strong> tool, which lets you
            rotate individual pages while reordering and deleting in one workspace.
          </p>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default RotatePdf;
