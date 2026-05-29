import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2, FlipVertical2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const faqs = [
  { question: "What does Reverse PDF do?", answer: "It flips the order of pages in your PDF — the last page becomes page 1 and the first page becomes the last." },
  { question: "When is reversing pages useful?", answer: "Common cases include fixing scans from a duplex scanner that fed pages in reverse, flipping booklet imposition, or restoring chronological order in archived documents." },
  { question: "Are my files uploaded?", answer: "No. Reversal happens locally in your browser. Your PDF never leaves your device." },
];

const ReversePages = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const handleReverse = async () => {
    if (!files[0]) return;
    setProcessing(true);
    setProgress(10);
    try {
      const bytes = await files[0].arrayBuffer();
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const indices = src.getPageIndices().reverse();
      const copied = await out.copyPages(src, indices);
      copied.forEach((p) => out.addPage(p));
      setProgress(80);
      const data = await out.save();
      const blob = new Blob([data as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = files[0].name.replace(/\.pdf$/i, "") + "-reversed.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setProgress(100);
      toast({ title: "Done", description: "Reversed PDF downloaded." });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to reverse PDF", variant: "destructive" });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  return (
    <ToolPageShell
      title="Reverse PDF Pages Online Free – Flip Page Order on Any Device | Master PDF Tools"
      description="Reverse the order of pages in any PDF online. Mobile-friendly, cross-browser, secure, and compatible with all devices and software versions."
      keywords="Reverse PDF Pages Online Free, Flip PDF Page Order, PDF Reverser for All Devices, Mobile PDF Reverse, reverse pdf, flip pdf pages, reverse page order, invert pdf pages, pdf page order"
      h1="Reverse PDF Pages — Flip the Page Order Instantly"
      intro="Upload your PDF and we'll flip the order of every page in seconds. 100% free and private."
      faqSchema={faqs}
      breadcrumbName="Reverse PDF Pages"
      breadcrumbPath="/reverse-pages"
      toolUI={
        <div className="space-y-6">
          <FileDropzone onFiles={setFiles} files={files} onRemove={() => setFiles([])} />
          {processing && <Progress value={progress} />}
          <Button size="lg" className="w-full" disabled={!files.length || processing} onClick={handleReverse}>
            {processing ? (<><Loader2 className="h-4 w-4 animate-spin" /> Reversing...</>) : (<><FlipVertical2 className="h-4 w-4" /> Reverse Pages</>)}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>Reverse PDF Pages — When and Why</h2>
          <p>
            Reversing the page order of a PDF is a small but important fix for documents that ended up in the wrong sequence. Duplex scanners, batch-scanning workflows, and certain export pipelines can leave you with a PDF where the last page should be the first. Rather than re-scanning or printing-and-rebinding, you can flip the entire document in seconds.
          </p>
          <h3>How to Reverse a PDF</h3>
          <ol>
            <li><strong>Drop your PDF</strong> into the upload box.</li>
            <li><strong>Click Reverse Pages.</strong> The reversed file downloads instantly.</li>
            <li><strong>Open the file</strong> in any PDF reader — pages will appear in inverted order.</li>
          </ol>
          <h3>Common Use Cases</h3>
          <ul>
            <li>Fixing duplex scans where back-faces were captured in reverse</li>
            <li>Re-ordering booklet imposition output before printing</li>
            <li>Reversing chronological documents (e.g. journal entries, change logs)</li>
            <li>Restoring original page order after extracting from imposition software</li>
          </ul>
          <h3>Privacy</h3>
          <p>Your PDF is processed entirely in your browser using <code>pdf-lib</code>. No uploads, no servers, no tracking of file content.</p>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default ReversePages;
