import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2, Wrench } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const faqs = [
  { question: "What kinds of issues can this fix?", answer: "Minor corruption such as broken cross-reference tables, malformed object streams, and incorrect file trailers. Severely damaged files where page content is missing cannot be recovered." },
  { question: "Will my file change visually?", answer: "No. Repair only rewrites the underlying PDF structure. Pages, text, and images remain identical." },
  { question: "Are my files uploaded?", answer: "No. Repair runs entirely in your browser using pdf-lib." },
];

const RepairPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const handleRepair = async () => {
    if (!files[0]) return;
    setProcessing(true);
    setProgress(15);
    try {
      const bytes = await files[0].arrayBuffer();
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true, throwOnInvalidObject: false, updateMetadata: false });
      setProgress(60);
      const out = await pdf.save({ useObjectStreams: true });
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = files[0].name.replace(/\.pdf$/i, "") + "-repaired.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setProgress(100);
      toast({ title: "Repair complete", description: "File downloaded." });
    } catch (e) {
      console.error(e);
      toast({ title: "Repair failed", description: "This file is too damaged to recover.", variant: "destructive" });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  return (
    <ToolPageShell
      title="Repair PDF Online Free – Fix Corrupted PDF Files on Any Device | Master PDF Tools"
      description="Repair damaged and corrupted PDF files online. Mobile-friendly, cross-browser, secure, and compatible with all devices and software versions."
      keywords="Repair PDF Online Free, Fix Corrupted PDF, PDF Repair Tool for All Devices, Mobile PDF Repair, repair pdf, fix pdf, recover pdf, corrupted pdf repair, pdf fix tool, restore pdf"
      h1="Repair PDF — Fix Corrupted Files Free"
      intro="Rebuild the internal structure of broken PDFs so they open cleanly again. Runs entirely in your browser."
      faqSchema={faqs}
      toolUI={
        <div className="space-y-6">
          <FileDropzone files={files} onFiles={(f) => setFiles([f[0]])} onRemove={() => setFiles([])} cta="Drop a PDF here or click to upload" subtitle="One file at a time • Max 150MB" />
          {processing && <Progress value={progress} />}
          <Button size="lg" className="w-full" disabled={!files[0] || processing} onClick={handleRepair}>
            {processing ? (<><Loader2 className="h-4 w-4 animate-spin" /> Repairing...</>) : (<><Wrench className="h-4 w-4" /> Repair & Download</>)}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>How to Repair a Corrupted PDF Online</h2>
          <p>PDF files can break for many reasons — interrupted downloads, failed email attachments, half-written exports from buggy software, or storage drives losing power mid-write. The result is usually the dreaded "There was a problem opening this document" error. The Repair PDF tool re-parses the file with a tolerant reader and rewrites a clean, well-formed PDF that most viewers will accept again.</p>
          <h3>Step-by-Step</h3>
          <ol>
            <li><strong>Upload</strong> the broken PDF.</li>
            <li><strong>Click Repair &amp; Download.</strong></li>
            <li><strong>Open</strong> the new file — most fixable issues are resolved automatically.</li>
          </ol>
          <h3>What Repair Can &amp; Can't Fix</h3>
          <ul>
            <li>✅ Broken cross-reference (xref) tables</li>
            <li>✅ Malformed object streams and trailers</li>
            <li>✅ Files that open with warnings in strict viewers</li>
            <li>❌ Files where actual page content has been overwritten with zeros</li>
            <li>❌ Encrypted files where the password and key are unknown</li>
          </ul>
          <h3>Prevention Tips</h3>
          <p>Always download large PDFs over a stable connection, avoid opening files directly from email attachments before saving them, and keep a backup of important documents in two locations.</p>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default RepairPdf;
