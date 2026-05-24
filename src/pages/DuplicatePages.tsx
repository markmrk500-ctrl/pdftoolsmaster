import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FAQ } from "@/components/FAQ";
import { FileDropzone } from "@/components/FileDropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const faqs = [
  { question: "How do page ranges work?", answer: "Use comma-separated values and ranges, e.g. '1,3,5-7'. Each listed page will be duplicated in place." },
  { question: "How many copies can I make?", answer: "From 1 to 20 copies per selected page." },
  { question: "Are originals preserved?", answer: "Yes — the original pages remain, with the duplicates inserted directly after each one." },
];

const parseRange = (s: string, max: number): Set<number> => {
  const out = new Set<number>();
  for (const part of s.split(",").map((p) => p.trim()).filter(Boolean)) {
    if (part.includes("-")) {
      const [a, b] = part.split("-").map((n) => parseInt(n));
      for (let i = a; i <= b; i++) if (i >= 1 && i <= max) out.add(i - 1);
    } else {
      const n = parseInt(part);
      if (n >= 1 && n <= max) out.add(n - 1);
    }
  }
  return out;
};

const DuplicatePages = () => {
  const [file, setFile] = useState<File | null>(null);
  const [range, setRange] = useState("1");
  const [copies, setCopies] = useState(1);
  const [processing, setProcessing] = useState(false);

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const bytes = await file.arrayBuffer();
      const src = await PDFDocument.load(bytes);
      const out = await PDFDocument.create();
      const targets = parseRange(range, src.getPageCount());
      const allIdx = src.getPageIndices();
      const pages = await out.copyPages(src, allIdx);
      for (let i = 0; i < pages.length; i++) {
        out.addPage(pages[i]);
        if (targets.has(i)) {
          const dupes = await out.copyPages(src, Array(copies).fill(i));
          dupes.forEach((p) => out.addPage(p));
        }
      }
      const data = await out.save();
      const blob = new Blob([data as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "-duplicated.pdf");
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Pages duplicated" });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to process", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageShell
      title="Duplicate PDF Pages — Copy Pages Within a PDF Online Free | PDFMaster"
      description="Duplicate selected PDF pages in place. Specify any pages and copy count. Free, fast, and 100% private — runs in your browser."
      keywords="duplicate pdf pages, copy pdf pages, repeat pdf page, clone pdf pages"
      h1="Duplicate PDF Pages"
      intro="Pick which pages to duplicate and how many copies to make. The duplicates are inserted right after each original page."
      faqSchema={faqs}
      breadcrumbName="Duplicate Pages"
      breadcrumbPath="/duplicate-pages"
      toolUI={
        <div className="space-y-6">
          <FileDropzone onFiles={(f) => setFile(f[0])} files={file ? [file] : []} onRemove={() => setFile(null)} />
          {file && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="range">Pages to duplicate</Label>
                  <Input id="range" value={range} onChange={(e) => setRange(e.target.value)} placeholder="e.g. 1,3,5-7" />
                </div>
                <div>
                  <Label htmlFor="copies">Copies per page</Label>
                  <Input id="copies" type="number" min={1} max={20} value={copies} onChange={(e) => setCopies(parseInt(e.target.value) || 1)} />
                </div>
              </div>
              <Button size="lg" className="w-full" onClick={handleProcess} disabled={processing}>
                {processing ? (<><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>) : (<><Download className="h-4 w-4" /> Duplicate & Download</>)}
              </Button>
            </>
          )}
        </div>
      }
      seoContent={
        <>
          <h2>When to Duplicate PDF Pages</h2>
          <p>
            Duplicating pages is useful when preparing booklets, multi-up handouts, sign-here-here-and-here forms, ticket stubs, or repeating templates. Rather than copy-pasting in another editor, this tool clones any pages you specify in place — keeping your document layout consistent.
          </p>
          <h3>How to Use</h3>
          <ol>
            <li>Upload your PDF.</li>
            <li>Enter the pages to duplicate using comma and range notation.</li>
            <li>Choose how many copies of each.</li>
            <li>Download the new PDF — duplicates are inserted directly after each original.</li>
          </ol>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default DuplicatePages;
