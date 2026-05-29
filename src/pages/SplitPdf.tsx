import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const faqs = [
  {
    question: "How do I split a PDF into multiple files?",
    answer:
      "Upload your PDF, enter the page ranges you want (e.g., '1-3, 5, 8-10'), and click Split. Each range becomes a separate downloadable PDF.",
  },
  {
    question: "Can I extract just one page from a PDF?",
    answer:
      "Yes. Enter the page number alone (e.g., '5') and the tool will create a single-page PDF containing only that page.",
  },
  {
    question: "What page range format should I use?",
    answer:
      "Use a comma-separated list of single pages or ranges, e.g., '1-3, 7, 10-12'. Each entry produces one output PDF.",
  },
  {
    question: "Is splitting safe for confidential documents?",
    answer:
      "Yes. All splitting happens locally in your browser. Your PDF is never uploaded to any server.",
  },
];

function parseRanges(input: string, pageCount: number): number[][] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((part) => {
      if (part.includes("-")) {
        const [a, b] = part.split("-").map((n) => parseInt(n.trim(), 10));
        if (isNaN(a) || isNaN(b) || a < 1 || b > pageCount || a > b) return [];
        return Array.from({ length: b - a + 1 }, (_, i) => a + i - 1);
      }
      const n = parseInt(part, 10);
      if (isNaN(n) || n < 1 || n > pageCount) return [];
      return [n - 1];
    })
    .filter((arr) => arr.length > 0);
}

const SplitPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [ranges, setRanges] = useState("");
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
      toast({
        title: "Could not read PDF",
        description: "File may be corrupted or password-protected.",
        variant: "destructive",
      });
      setFiles([]);
    }
  };

  const handleSplit = async () => {
    if (!files[0]) return;
    const groups = parseRanges(ranges, pageCount);
    if (!groups.length) {
      toast({
        title: "Invalid range",
        description: `Use format like "1-3, 5, 8-${pageCount}". Pages must be 1–${pageCount}.`,
        variant: "destructive",
      });
      return;
    }
    setProcessing(true);
    setProgress(5);
    try {
      const bytes = await files[0].arrayBuffer();
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });

      for (let i = 0; i < groups.length; i++) {
        const out = await PDFDocument.create();
        const copied = await out.copyPages(src, groups[i]);
        copied.forEach((p) => out.addPage(p));
        const data = await out.save();
        const blob = new Blob([data as BlobPart], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const label = ranges.split(",")[i]?.trim().replace(/\s/g, "") || `${i + 1}`;
        a.href = url;
        a.download = `split-${label}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        setProgress(10 + Math.round(((i + 1) / groups.length) * 85));
      }
      setProgress(100);
      toast({ title: "Split complete", description: `${groups.length} file(s) downloaded.` });
    } catch (e) {
      console.error(e);
      toast({ title: "Split failed", variant: "destructive" });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  return (
    <ToolPageShell
      title="Split PDF Online Free – Extract PDF Pages on Any Device | Master PDF Tools"
      description="Split PDFs and extract pages online. Mobile-friendly, cross-browser, secure, and compatible with all devices, operating systems, and software versions."
      keywords="Split PDF Online Free, Extract PDF Pages, PDF Splitter for All Devices, Mobile PDF Splitter, Cross-platform PDF Split, split pdf, extract pdf pages, divide pdf, pdf splitter, separate pdf pages, split pdf online free"
      h1="Split PDF Files Online — Extract Pages from PDF"
      intro="Extract specific pages or split a PDF into multiple files using flexible page ranges. Fast, free, browser-based."
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
              <Label htmlFor="ranges">
                Page ranges (PDF has {pageCount} pages)
              </Label>
              <Input
                id="ranges"
                placeholder={`e.g., 1-3, 5, 8-${pageCount}`}
                value={ranges}
                onChange={(e) => setRanges(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Each comma-separated entry becomes one output PDF.
              </p>
            </div>
          )}

          {processing && <Progress value={progress} />}

          <Button
            size="lg"
            className="w-full"
            disabled={!files[0] || !ranges || processing}
            onClick={handleSplit}
          >
            {processing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Splitting...</>
            ) : (
              <><Download className="h-4 w-4" /> Split & Download</>
            )}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>How to Split a PDF Online — Complete Guide</h2>
          <p>
            Splitting a PDF lets you extract just the pages you need from a larger
            document — a single chapter from an ebook, a particular invoice from a bank
            statement, a few key slides from a presentation, or one signed agreement from
            a multi-document scan. PDFMaster Tools' free Split PDF utility offers
            flexible range syntax so you can split exactly how you want, all without
            uploading your file to any server.
          </p>

          <h3>Step-by-Step: How to Split a PDF</h3>
          <ol>
            <li><strong>Upload your PDF.</strong> The tool reads it locally and shows the total page count.</li>
            <li><strong>Enter page ranges.</strong> Use a comma-separated list. Example: <code>1-3, 5, 8-10</code> creates three output PDFs.</li>
            <li><strong>Click Split &amp; Download.</strong> Each range downloads instantly as its own PDF.</li>
          </ol>

          <h3>Page Range Syntax Examples</h3>
          <ul>
            <li><code>5</code> — extract just page 5 as a single-page PDF</li>
            <li><code>1-10</code> — extract pages 1 through 10 as one combined file</li>
            <li><code>1, 3, 5</code> — produces three separate files, one page each</li>
            <li><code>1-3, 7-9, 12</code> — three files: pages 1-3, 7-9, and page 12</li>
            <li><code>1-5, 6-10, 11-15</code> — split a 15-page document into three 5-page parts</li>
          </ul>

          <h3>Common Use Cases for Splitting PDFs</h3>
          <ul>
            <li>Extract a single chapter from a long ebook or research paper</li>
            <li>Pull a specific invoice or statement from a bank-document export</li>
            <li>Separate signed pages from supporting documents in a contract bundle</li>
            <li>Split a scanned multi-page document into individual page files</li>
            <li>Break a large report into sections for easier email distribution</li>
            <li>Isolate a single slide deck section for sharing</li>
            <li>Prepare individual exhibits for legal filings</li>
          </ul>

          <h3>Split PDF vs Extract Pages — Are They the Same?</h3>
          <p>
            Yes — "split PDF" and "extract PDF pages" describe the same underlying
            operation. Whether you want to break one document into many or pull out a
            single page, this tool handles both with the same range syntax.
          </p>

          <h3>Privacy Guarantee</h3>
          <p>
            All splitting is done in your browser using <code>pdf-lib</code>. Your PDF
            never leaves your device, making this tool safe for confidential financial,
            medical, legal, and personal documents.
          </p>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default SplitPdf;
