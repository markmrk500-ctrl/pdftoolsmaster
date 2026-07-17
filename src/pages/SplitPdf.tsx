import { useState } from "react";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const faqs = [
  { question: "What split modes are available?", answer: "Custom ranges (e.g. '1-3, 5, 8-10'), Fixed intervals (split every N pages), and Extract all pages (one PDF per page). All three match iLovePDF's split modes." },
  { question: "Can I merge the ranges into one PDF instead of many?", answer: "Yes. Enable 'Merge ranges into a single PDF' to combine your selected pages into one output file." },
  { question: "How do I get multiple output files?", answer: "Multiple output PDFs are automatically bundled into a single ZIP so you don't get download-prompt spam." },
  { question: "Is my file uploaded anywhere?", answer: "No. Splitting runs entirely in your browser using pdf-lib." },
];

type Mode = "ranges" | "fixed" | "extract";

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
  const [mode, setMode] = useState<Mode>("ranges");
  const [ranges, setRanges] = useState("");
  const [interval, setInterval] = useState("1");
  const [mergeRanges, setMergeRanges] = useState(false);
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
      toast({ title: "Could not read PDF", description: "File may be corrupted or password-protected.", variant: "destructive" });
      setFiles([]);
    }
  };

  const buildGroups = (): number[][] | null => {
    if (mode === "ranges") {
      const g = parseRanges(ranges, pageCount);
      return g.length ? g : null;
    }
    if (mode === "fixed") {
      const n = parseInt(interval, 10);
      if (isNaN(n) || n < 1) return null;
      const groups: number[][] = [];
      for (let start = 0; start < pageCount; start += n) {
        groups.push(Array.from({ length: Math.min(n, pageCount - start) }, (_, i) => start + i));
      }
      return groups;
    }
    // extract
    return Array.from({ length: pageCount }, (_, i) => [i]);
  };

  const handleSplit = async () => {
    if (!files[0]) return;
    const groups = buildGroups();
    if (!groups || !groups.length) {
      toast({
        title: "Invalid selection",
        description: mode === "ranges" ? `Use "1-3, 5, 8-${pageCount}"` : "Check your split settings.",
        variant: "destructive",
      });
      return;
    }
    setProcessing(true);
    setProgress(5);
    try {
      const bytes = await files[0].arrayBuffer();
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const baseName = files[0].name.replace(/\.pdf$/i, "");

      // Merged single-file output
      if (mergeRanges && mode !== "extract") {
        const out = await PDFDocument.create();
        const flat = groups.flat();
        const copied = await out.copyPages(src, flat);
        copied.forEach((p) => out.addPage(p));
        const data = await out.save();
        const blob = new Blob([data as BlobPart], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${baseName}-selected.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        setProgress(100);
        toast({ title: "Split complete", description: "Merged output downloaded." });
        return;
      }

      // Single group → single download
      if (groups.length === 1) {
        const out = await PDFDocument.create();
        const copied = await out.copyPages(src, groups[0]);
        copied.forEach((p) => out.addPage(p));
        const data = await out.save();
        const blob = new Blob([data as BlobPart], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${baseName}-split.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        setProgress(100);
        toast({ title: "Split complete", description: "File downloaded." });
        return;
      }

      // Multiple groups → ZIP
      const zip = new JSZip();
      for (let i = 0; i < groups.length; i++) {
        const out = await PDFDocument.create();
        const copied = await out.copyPages(src, groups[i]);
        copied.forEach((p) => out.addPage(p));
        const data = await out.save();
        const first = groups[i][0] + 1;
        const last = groups[i][groups[i].length - 1] + 1;
        const label = first === last ? `page-${first}` : `pages-${first}-${last}`;
        zip.file(`${baseName}-${label}.pdf`, data);
        setProgress(10 + Math.round(((i + 1) / groups.length) * 80));
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseName}-split.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setProgress(100);
      toast({ title: "Split complete", description: `${groups.length} files in ZIP.` });
    } catch (e) {
      console.error(e);
      toast({ title: "Split failed", variant: "destructive" });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  const canSubmit =
    !!files[0] &&
    !processing &&
    (mode === "extract" ||
      (mode === "ranges" && ranges.trim().length > 0) ||
      (mode === "fixed" && parseInt(interval, 10) >= 1));

  return (
    <ToolPageShell
      title="Split PDF Online Free – Ranges, Fixed Intervals & Extract Pages | Master PDF Tools"
      description="Split PDFs by custom ranges, fixed intervals, or extract every page. Output as ZIP or merged into one PDF. Fully in-browser, private."
      keywords="Split PDF Online Free, split pdf, extract pdf pages, split pdf every n pages, pdf splitter, divide pdf"
      h1="Split PDF — Ranges, Fixed Intervals, or Extract All Pages"
      intro="Three split modes plus optional merge-to-one-PDF, all bundled in a single ZIP when needed."
      faqSchema={faqs}
      toolUI={
        <div className="space-y-6">
          <FileDropzone
            files={files}
            onFiles={handleFiles}
            onRemove={() => { setFiles([]); setPageCount(0); }}
            cta="Drop a PDF here or click to upload"
            subtitle="One file at a time • Max 150MB"
          />

          {pageCount > 0 && (
            <>
              <div className="space-y-3">
                <Label>Split mode</Label>
                <RadioGroup value={mode} onValueChange={(v) => setMode(v as Mode)} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {([
                    { v: "ranges", t: "Custom ranges", s: "e.g. 1-3, 5" },
                    { v: "fixed", t: "Fixed intervals", s: "Every N pages" },
                    { v: "extract", t: "Extract all pages", s: "One PDF per page" },
                  ] as { v: Mode; t: string; s: string }[]).map((opt) => (
                    <Label key={opt.v} htmlFor={`m-${opt.v}`} className="flex flex-col gap-1 border border-border rounded-lg p-4 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-accent/50">
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value={opt.v} id={`m-${opt.v}`} />
                        <span className="font-semibold text-sm">{opt.t}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{opt.s}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              {mode === "ranges" && (
                <div className="space-y-2">
                  <Label htmlFor="ranges">Page ranges (PDF has {pageCount} pages)</Label>
                  <Input id="ranges" placeholder={`e.g., 1-3, 5, 8-${pageCount}`} value={ranges} onChange={(e) => setRanges(e.target.value)} />
                </div>
              )}

              {mode === "fixed" && (
                <div className="space-y-2">
                  <Label htmlFor="interval">Split every N pages</Label>
                  <Input id="interval" type="number" min={1} max={pageCount} value={interval} onChange={(e) => setInterval(e.target.value)} />
                </div>
              )}

              {mode !== "extract" && (
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={mergeRanges} onCheckedChange={(v) => setMergeRanges(!!v)} />
                  Merge ranges into a single PDF
                </label>
              )}
            </>
          )}

          {processing && <Progress value={progress} />}

          <Button size="lg" className="w-full" disabled={!canSubmit} onClick={handleSplit}>
            {processing ? (<><Loader2 className="h-4 w-4 animate-spin" /> Splitting...</>) : (<><Download className="h-4 w-4" /> Split & Download</>)}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>Split PDF with the Same Options You'd Expect from a Premium Tool</h2>
          <p>
            This splitter matches iLovePDF's three modes: custom ranges when you know exactly which pages
            you want, fixed intervals to break a long document into equal chunks, and extract-all-pages
            when you want a folder of single-page PDFs. Multiple outputs come as a clean ZIP, or you can
            merge selected ranges into a single PDF.
          </p>
          <h3>Common uses</h3>
          <ul>
            <li>Extract a chapter or invoice from a larger PDF</li>
            <li>Break a 200-page report into 10-page chunks for email</li>
            <li>Split a scanned document into individual page files for archiving</li>
            <li>Pull a set of exhibits out of a legal bundle in one pass</li>
          </ul>
          <h3>Privacy</h3>
          <p>All splitting is done in your browser using pdf-lib. Your PDF never leaves your device.</p>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default SplitPdf;
