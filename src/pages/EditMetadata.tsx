import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2, Tags } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const faqs = [
  { question: "What metadata can I edit?", answer: "Title, Author, Subject, Keywords, Creator, and Producer fields stored in the PDF document information dictionary." },
  { question: "Why edit PDF metadata?", answer: "Cleaner search results, professional document properties, better SEO when PDFs are indexed online, and easier organization in document management systems." },
  { question: "Are my files uploaded?", answer: "No. Metadata edits are written locally in your browser using pdf-lib." },
];

const EditMetadata = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [subject, setSubject] = useState("");
  const [keywords, setKeywords] = useState("");
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const handleLoad = async (file: File) => {
    setFiles([file]);
    try {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      setTitle(pdf.getTitle() || "");
      setAuthor(pdf.getAuthor() || "");
      setSubject(pdf.getSubject() || "");
      setKeywords((pdf.getKeywords() as unknown as string) || "");
    } catch (e) { console.error(e); }
  };

  const handleSave = async () => {
    if (!files[0]) return;
    setProcessing(true);
    setProgress(20);
    try {
      const bytes = await files[0].arrayBuffer();
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      pdf.setTitle(title);
      pdf.setAuthor(author);
      pdf.setSubject(subject);
      pdf.setKeywords(keywords ? keywords.split(",").map((k) => k.trim()).filter(Boolean) : []);
      pdf.setProducer("PDFMaster Tools");
      pdf.setModificationDate(new Date());
      setProgress(80);
      const out = await pdf.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = files[0].name.replace(/\.pdf$/i, "") + "-metadata.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setProgress(100);
      toast({ title: "Metadata saved", description: "File downloaded." });
    } catch (e) {
      console.error(e);
      toast({ title: "Update failed", variant: "destructive" });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  return (
    <ToolPageShell
      title="Edit PDF Metadata Online Free – Title, Author, Keywords on Any Device | Master PDF Tools"
      description="Edit PDF title, author, subject, and keywords online. Mobile-friendly, cross-browser, secure, and compatible with all devices and software versions."
      keywords="Edit PDF Metadata Online Free, Change PDF Author, PDF Metadata Editor for All Devices, Mobile PDF Metadata, edit pdf metadata, change pdf author, pdf properties editor, set pdf title, pdf keywords editor"
      h1="Edit PDF Metadata Online"
      intro="Update the document title, author, subject, and keywords stored inside any PDF. Quick, private, and free."
      faqSchema={faqs}
      toolUI={
        <div className="space-y-6">
          <FileDropzone files={files} onFiles={(f) => handleLoad(f[0])} onRemove={() => setFiles([])} cta="Drop a PDF here or click to upload" subtitle="One file at a time • Max 150MB" />
          {files[0] && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-card border border-border rounded-xl p-4">
              <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title" /></div>
              <div className="space-y-2"><Label>Author</Label><Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author name" /></div>
              <div className="space-y-2"><Label>Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Document subject" /></div>
              <div className="space-y-2"><Label>Keywords</Label><Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="comma, separated, keywords" /></div>
            </div>
          )}
          {processing && <Progress value={progress} />}
          <Button size="lg" className="w-full" disabled={!files[0] || processing} onClick={handleSave}>
            {processing ? (<><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>) : (<><Download className="h-4 w-4" /> Save & Download</>)}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>How to Edit PDF Metadata Online</h2>
          <p>Every PDF carries an information dictionary describing its title, author, subject, keywords, creator software, and creation date. These fields show up in PDF readers, file manager preview panes, document management systems, and search engine results. Cleaning them up takes seconds but instantly upgrades how your documents appear and how easily they're found.</p>
          <h3>Step-by-Step</h3>
          <ol>
            <li><strong>Upload your PDF</strong> — existing metadata fields auto-populate.</li>
            <li><strong>Edit the fields</strong> — title, author, subject, and comma-separated keywords.</li>
            <li><strong>Click Save & Download</strong> to get the updated PDF.</li>
          </ol>
          <h3>Why Metadata Matters</h3>
          <ul>
            <li>Search engines index PDF metadata, improving discoverability of public documents</li>
            <li>Document management systems sort and filter by author and subject</li>
            <li>PDF readers display the title in browser tabs and recent files lists</li>
            <li>Removing draft titles like "Untitled-1" looks far more professional</li>
            <li>Stripping the original creator software protects internal workflow details</li>
          </ul>
          <h3>Privacy</h3>
          <p>All metadata changes happen in-browser via pdf-lib. Your file never reaches a server.</p>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default EditMetadata;
