import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowUp, ArrowDown, Download, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const faqs = [
  {
    question: "How do I merge PDF files for free?",
    answer:
      "Upload two or more PDF files, drag them into the order you want, then click Merge PDFs. Your combined file will download instantly. No signup, no payment, and no email address required.",
  },
  {
    question: "Is there a limit on the number of PDFs I can merge?",
    answer:
      "There is no hard limit on the number of files. However, very large combined files may use significant browser memory. For best performance, keep the total size under 50MB and use a modern browser like Chrome, Edge, Firefox, or Safari.",
  },
  {
    question: "Are my PDF files uploaded to a server?",
    answer:
      "No. Merging happens entirely in your browser using the open-source pdf-lib library. Your files never leave your device, ensuring complete privacy for confidential documents like contracts, tax returns, or medical records.",
  },
  {
    question: "Will the page order be preserved when I merge PDFs?",
    answer:
      "Yes. Pages from each PDF are appended in the exact order you arrange the files. Use the up/down arrows to reorder before merging, and the resulting PDF will follow that exact sequence.",
  },
  {
    question: "Does merging PDFs reduce quality?",
    answer:
      "No. Merging is a lossless operation. Pages are copied bit-for-bit from the source PDFs, so text remains selectable, images stay sharp, and embedded fonts are preserved.",
  },
  {
    question: "Can I merge password-protected PDFs?",
    answer:
      "If a PDF only has owner restrictions, the tool can usually merge it. PDFs that require a password to open must be unlocked first using our Unlock PDF tool.",
  },
  {
    question: "Does it work on mobile devices?",
    answer:
      "Yes. PDFMaster Tools works in any modern browser on iOS, Android, Windows, macOS, Linux, and ChromeOS — no app installation needed.",
  },
];

const MergePdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const addFiles = (newFiles: File[]) => setFiles((p) => [...p, ...newFiles]);
  const removeFile = (i: number) => setFiles((p) => p.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...files];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setFiles(next);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      toast({ title: "Add at least 2 PDFs", description: "You need 2 or more files to merge." });
      return;
    }
    setProcessing(true);
    setProgress(5);
    try {
      const merged = await PDFDocument.create();
      for (let i = 0; i < files.length; i++) {
        const bytes = await files[i].arrayBuffer();
        const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pages = await merged.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
        setProgress(10 + Math.round(((i + 1) / files.length) * 80));
      }
      const out = await merged.save();
      setProgress(95);
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "merged.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setProgress(100);
      toast({ title: "Merge complete", description: "Your merged PDF has been downloaded." });
    } catch (e) {
      console.error(e);
      toast({
        title: "Merge failed",
        description: "One of your files may be corrupted or password-protected.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  return (
    <ToolPageShell
      title="Merge PDF Online Free – Combine PDF Files on Any Device | Master PDF Tools"
      description="Merge and combine PDF files online with one tool. Mobile-friendly, cross-browser, secure, and compatible with all devices, operating systems, and software versions."
      keywords="Merge PDF Online Free, Combine PDF Files, PDF Merger for All Devices, Mobile PDF Merger, Cross-platform PDF Merge, Fast Secure PDF Combine, merge pdf, combine pdf, join pdf, pdf merger, merge pdf online free, combine pdf files, pdf joiner"
      h1="Merge PDF Files Online — Free PDF Combiner"
      intro="Combine multiple PDFs into a single document. Drag, drop, reorder, and merge — all in your browser, with full privacy and zero uploads."
      faqSchema={faqs}
      toolUI={
        <div className="space-y-6">
          <FileDropzone
            multiple
            files={[]}
            onFiles={addFiles}
            cta="Drop PDF files here or click to upload"
            subtitle="Select 2 or more PDFs • Max 50MB each"
          />

          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{files.length} file(s) — drag to reorder:</p>
              {files.map((f, i) => (
                <div
                  key={`${f.name}-${i}`}
                  className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3"
                >
                  <span className="text-xs font-mono w-6 text-muted-foreground">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(f.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => move(i, 1)}
                      disabled={i === files.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => removeFile(i)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {processing && <Progress value={progress} />}

          <Button
            size="lg"
            className="w-full"
            disabled={files.length < 2 || processing}
            onClick={handleMerge}
          >
            {processing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Merging...</>
            ) : (
              <><Download className="h-4 w-4" /> Merge PDFs & Download</>
            )}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>How to Merge PDF Files Online — A Complete Guide</h2>
          <p>
            Combining several PDF documents into one unified file is one of the most
            common tasks in modern offices, classrooms, and home workflows. Whether you
            need to bundle invoices, consolidate research papers, compile a multi-section
            report, or assemble a portfolio, merging PDFs eliminates the hassle of
            sending multiple attachments and makes your documents easier to share, store,
            archive, and print. PDFMaster Tools' free online Merge PDF utility makes this
            process effortless, completely free, and 100% private — your files are
            processed entirely in your browser and never uploaded anywhere.
          </p>

          <h3>Step-by-Step: How to Merge PDFs in Under 30 Seconds</h3>
          <ol>
            <li>
              <strong>Upload your PDFs.</strong> Click the upload area or drag and drop
              two or more PDF files into the dropzone. You can add files in batches —
              each new upload appends to your existing list.
            </li>
            <li>
              <strong>Arrange the order.</strong> Use the up and down arrows on each file
              card to put them in the order you want them combined. Pages from each PDF
              are appended sequentially in the order shown on screen.
            </li>
            <li>
              <strong>Click Merge.</strong> Press the "Merge PDFs &amp; Download" button.
              The tool processes everything locally in your browser and immediately
              downloads the combined file as <code>merged.pdf</code>.
            </li>
            <li>
              <strong>Open and verify.</strong> Open the downloaded file in any PDF
              reader (Adobe Acrobat, Preview, Chrome, Edge, Foxit, etc.) to confirm your
              pages are in the right order.
            </li>
          </ol>

          <h3>Why Merge PDFs Directly in Your Browser?</h3>
          <p>
            Most online PDF merge tools upload your files to remote servers, where they
            may be cached, logged, indexed, or scanned by automated systems. For
            confidential documents — contracts, medical records, tax returns, employee
            files, or trade secrets — this represents a significant privacy and
            compliance risk. PDFMaster Tools uses the open-source <code>pdf-lib</code>{" "}
            library to perform all merging directly in your browser using JavaScript.
            Your files never leave your device, are never transmitted over the internet,
            and disappear from memory when you close the tab.
          </p>

          <h3>Top 10 Use Cases for Merging PDFs</h3>
          <ul>
            <li>Combining multiple scanned pages into a single contract or agreement</li>
            <li>Assembling monthly invoices into a quarterly or annual report</li>
            <li>Merging separate book chapters or thesis sections into one manuscript</li>
            <li>Bundling application forms with supporting documents and references</li>
            <li>Consolidating meeting notes from multiple sessions into a single archive</li>
            <li>Combining receipts and expense reports for reimbursement</li>
            <li>Joining exported pages from different sources into a unified file</li>
            <li>Creating a portfolio from multiple project PDFs</li>
            <li>Stitching together legal exhibits or court filings</li>
            <li>Preparing print-ready booklets or e-books from individual chapters</li>
          </ul>

          <h3>Tips for Best Results</h3>
          <ul>
            <li>
              <strong>Name your files clearly</strong> before uploading so the order
              shown on screen makes sense (e.g., <code>01-cover.pdf</code>,{" "}
              <code>02-intro.pdf</code>).
            </li>
            <li>
              <strong>Compress large PDFs first</strong> using our Compress PDF tool to
              keep the merged output manageable.
            </li>
            <li>
              <strong>Unlock protected PDFs first</strong> if any source file is
              password-protected or encrypted.
            </li>
            <li>
              <strong>Use Organize PDF</strong> after merging if you need to fine-tune
              page order at the page level rather than the file level.
            </li>
          </ul>

          <h3>Merge PDF vs Combine PDF vs Join PDF — What's the Difference?</h3>
          <p>
            These three terms all describe the same operation: taking two or more PDF
            documents and assembling them into a single file. Some tools market the
            feature as "combine PDF" or "join PDF," but the underlying process is
            identical — copying pages from each input file into a new output PDF in the
            order specified.
          </p>

          <h3>Privacy, Security, and Compliance</h3>
          <p>
            Because PDFMaster's Merge PDF tool runs entirely in your browser, it is
            inherently safe for documents covered by privacy regulations such as HIPAA,
            GDPR, FERPA, or attorney-client privilege. No data leaves your device, no
            cookies track your files, and no analytics inspect your content. You retain
            full control at every step.
          </p>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default MergePdf;
