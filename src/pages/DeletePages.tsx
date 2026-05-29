import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const faqs = [
  {
    question: "How do I specify which pages to delete?",
    answer:
      "Use a comma-separated list with single pages or ranges, e.g., '1, 3-5, 8'.",
  },
  {
    question: "Can I undo a deletion?",
    answer:
      "The downloaded file has the pages removed. Your original file is not modified — keep it as a backup.",
  },
  {
    question: "Are my files uploaded?",
    answer: "No. All processing happens in your browser.",
  },
];

function parsePagesToDelete(input: string, pageCount: number): Set<number> {
  const set = new Set<number>();
  for (const part of input.split(",").map((s) => s.trim()).filter(Boolean)) {
    if (part.includes("-")) {
      const [a, b] = part.split("-").map((n) => parseInt(n.trim(), 10));
      if (!isNaN(a) && !isNaN(b) && a >= 1 && b <= pageCount && a <= b) {
        for (let i = a; i <= b; i++) set.add(i - 1);
      }
    } else {
      const n = parseInt(part, 10);
      if (!isNaN(n) && n >= 1 && n <= pageCount) set.add(n - 1);
    }
  }
  return set;
}

const DeletePages = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [pages, setPages] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const handleFiles = async (incoming: File[]) => {
    const f = incoming[0];
    setFiles([f]);
    try {
      const bytes = await f.arrayBuffer();
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      setPageCount(pdf.getPageCount());
    } catch {
      toast({ title: "Could not read PDF", variant: "destructive" });
      setFiles([]);
    }
  };

  const handleDelete = async () => {
    if (!files[0]) return;
    const toDelete = parsePagesToDelete(pages, pageCount);
    if (!toDelete.size) {
      toast({
        title: "Invalid pages",
        description: `Enter pages between 1 and ${pageCount}, e.g. "1, 3-5".`,
        variant: "destructive",
      });
      return;
    }
    if (toDelete.size === pageCount) {
      toast({ title: "Cannot delete all pages", variant: "destructive" });
      return;
    }
    setProcessing(true);
    setProgress(10);
    try {
      const bytes = await files[0].arrayBuffer();
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const keep = Array.from({ length: pageCount }, (_, i) => i).filter(
        (i) => !toDelete.has(i)
      );
      const copied = await out.copyPages(src, keep);
      copied.forEach((p) => out.addPage(p));
      setProgress(80);
      const data = await out.save();
      const blob = new Blob([data as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = files[0].name.replace(/\.pdf$/i, "") + "-trimmed.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setProgress(100);
      toast({
        title: "Pages deleted",
        description: `${toDelete.size} page(s) removed; ${keep.length} kept.`,
      });
    } catch (e) {
      console.error(e);
      toast({ title: "Delete failed", variant: "destructive" });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  return (
    <ToolPageShell
      title="Delete PDF Pages Online Free – Remove Pages on Any Device | Master PDF Tools"
      description="Delete unwanted pages from any PDF online. Mobile-friendly, cross-browser, secure, and compatible with all devices and software versions."
      keywords="Delete PDF Pages Online Free, Remove PDF Pages, PDF Page Remover for All Devices, Mobile PDF Page Delete, delete pdf pages, remove pdf pages, pdf page remover, trim pdf, delete pages from pdf"
      h1="Delete Pages from PDF Online"
      intro="Remove specific pages from your PDF using simple range syntax and download the trimmed file instantly."
      faqSchema={faqs}
      toolUI={
        <div className="space-y-6">
          <FileDropzone
            files={files}
            onFiles={handleFiles}
            onRemove={() => {
              setFiles([]);
              setPageCount(0);
            }}
            cta="Drop a PDF here or click to upload"
            subtitle="One file at a time • Max 50MB"
          />

          {pageCount > 0 && (
            <div className="space-y-2">
              <Label htmlFor="pages">Pages to delete (PDF has {pageCount} pages)</Label>
              <Input
                id="pages"
                placeholder={`e.g., 1, 3-5, ${pageCount}`}
                value={pages}
                onChange={(e) => setPages(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated list of single pages or ranges.
              </p>
            </div>
          )}

          {processing && <Progress value={progress} />}

          <Button
            size="lg"
            className="w-full"
            disabled={!files[0] || !pages || processing}
            onClick={handleDelete}
          >
            {processing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</>
            ) : (
              <><Trash2 className="h-4 w-4" /> Delete & Download</>
            )}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>How to Delete Pages from a PDF — Complete Guide</h2>
          <p>
            Need to remove a blank scan, a draft page, sensitive information, or
            irrelevant content before sharing a PDF? The Delete PDF Pages tool lets you
            specify exactly which pages to remove using simple range syntax. The tool
            keeps everything else intact — fonts, images, formatting, and embedded
            media are all preserved in the downloaded file. Your original PDF stays
            untouched on your device as a backup.
          </p>

          <h3>Step-by-Step: How to Delete Pages from a PDF</h3>
          <ol>
            <li><strong>Upload your PDF.</strong> The tool reads it locally and shows the page count.</li>
            <li><strong>Enter pages to delete</strong> as a comma-separated list — single pages, ranges, or both.</li>
            <li><strong>Click Delete &amp; Download.</strong> The trimmed PDF downloads automatically.</li>
          </ol>

          <h3>Range Syntax Examples</h3>
          <ul>
            <li><code>3</code> — delete just page 3</li>
            <li><code>1, 5, 10</code> — delete pages 1, 5, and 10</li>
            <li><code>2-4</code> — delete pages 2 through 4</li>
            <li><code>1, 3-5, 8</code> — delete page 1, pages 3-5, and page 8</li>
          </ul>

          <h3>Common Use Cases</h3>
          <ul>
            <li>Removing blank pages from a scan</li>
            <li>Stripping cover sheets, fax cover pages, or footers</li>
            <li>Redacting sensitive pages before sharing externally</li>
            <li>Deleting draft notes or markup pages from a finalized report</li>
            <li>Trimming an ebook to share just specific chapters</li>
          </ul>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default DeletePages;
