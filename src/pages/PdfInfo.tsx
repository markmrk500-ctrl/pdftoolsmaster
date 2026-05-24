import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const faqs = [
  { question: "What information is shown?", answer: "Page count, file size, document title, author, subject, keywords, creator software, producer, creation/modification dates, PDF version, and per-page dimensions." },
  { question: "Are my files uploaded?", answer: "No. Inspection runs entirely in your browser using pdf-lib." },
  { question: "Why are dimensions in points?", answer: "PDF natively measures pages in points (1 point = 1/72 inch). 595 × 842 points equals A4." },
];

const fmtSize = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(2)} MB`;

const PdfInfo = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [info, setInfo] = useState<Record<string, string> | null>(null);
  const [pages, setPages] = useState<{ index: number; width: number; height: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleLoad = async (file: File) => {
    setFiles([file]);
    setLoading(true);
    try {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
      const data: Record<string, string> = {
        "File name": file.name,
        "File size": fmtSize(file.size),
        "Pages": String(pdf.getPageCount()),
        "PDF version": pdf.getProducer() ? "1.x" : "—",
        "Title": pdf.getTitle() || "—",
        "Author": pdf.getAuthor() || "—",
        "Subject": pdf.getSubject() || "—",
        "Keywords": (pdf.getKeywords() as unknown as string) || "—",
        "Creator": pdf.getCreator() || "—",
        "Producer": pdf.getProducer() || "—",
        "Created": pdf.getCreationDate()?.toLocaleString() || "—",
        "Modified": pdf.getModificationDate()?.toLocaleString() || "—",
      };
      setInfo(data);
      setPages(pdf.getPages().map((p, i) => ({ index: i + 1, width: Math.round(p.getWidth()), height: Math.round(p.getHeight()) })));
    } catch (e) {
      console.error(e);
      toast({ title: "Could not read PDF", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolPageShell
      title="PDF Info & Analyzer — View PDF Metadata, Page Sizes Online | PDFMaster Tools"
      description="Inspect PDF metadata, page count, file size, fonts, and page dimensions online for free. Browser-based, secure, no signup."
      keywords="pdf info, pdf analyzer, pdf metadata viewer, pdf properties, pdf inspector, pdf page sizes"
      h1="PDF Info & Analyzer"
      intro="Inspect any PDF — see metadata, page count, file size, and per-page dimensions in seconds."
      faqSchema={faqs}
      toolUI={
        <div className="space-y-6">
          <FileDropzone files={files} onFiles={(f) => handleLoad(f[0])} onRemove={() => { setFiles([]); setInfo(null); setPages([]); }} cta="Drop a PDF here or click to upload" subtitle="One file at a time • Max 50MB" />
          {loading && <div className="flex items-center justify-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mr-2" /> Reading...</div>}
          {info && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border font-semibold">Document Properties</div>
              <dl className="divide-y divide-border">
                {Object.entries(info).map(([k, v]) => (
                  <div key={k} className="grid grid-cols-3 gap-4 px-4 py-2.5 text-sm">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="col-span-2 font-medium break-words">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          {pages.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border font-semibold">Page Dimensions (points)</div>
              <div className="max-h-72 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50"><tr><th className="text-left px-4 py-2">Page</th><th className="text-left px-4 py-2">Width</th><th className="text-left px-4 py-2">Height</th></tr></thead>
                  <tbody>
                    {pages.map((p) => (
                      <tr key={p.index} className="border-t border-border"><td className="px-4 py-1.5">{p.index}</td><td className="px-4 py-1.5">{p.width}</td><td className="px-4 py-1.5">{p.height}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      }
      seoContent={
        <>
          <h2>Inspect Any PDF — Free Online Analyzer</h2>
          <p>Sometimes you need to look inside a PDF before doing anything with it: how many pages does it really have, what software produced it, when was it last modified, and is every page the same size? The PDF Info tool reads all of that out of the file in a single click and presents it in a clean, scannable layout.</p>
          <h3>What You'll See</h3>
          <ul>
            <li><strong>File name &amp; size</strong> in human-friendly KB or MB</li>
            <li><strong>Page count</strong> and per-page dimensions in PDF points</li>
            <li><strong>Title, Author, Subject, Keywords</strong> from the document info dictionary</li>
            <li><strong>Creator and Producer</strong> — the software that authored and exported the PDF</li>
            <li><strong>Creation and Modification dates</strong> when present</li>
          </ul>
          <h3>Common Use Cases</h3>
          <ul>
            <li>Auditing PDFs before publishing them online</li>
            <li>Checking whether a PDF has hidden mixed page sizes</li>
            <li>Verifying authorship and creation tools for compliance</li>
            <li>Quickly spotting unusually large files that need compression</li>
          </ul>
          <h3>Privacy</h3>
          <p>The file is parsed in-browser; nothing is uploaded.</p>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default PdfInfo;
