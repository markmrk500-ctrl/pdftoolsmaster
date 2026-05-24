import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText as FileIcon, Download, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SIZES: Record<string, [number, number]> = {
  A4: [595.28, 841.89],
  Letter: [612, 792],
  Legal: [612, 1008],
  A3: [841.89, 1190.55],
  A5: [419.53, 595.28],
};

const faqs = [
  { question: "Why generate a blank PDF?", answer: "Blank PDFs are useful as templates, separator pages between bound chapters, placeholder pages for redaction, or printable lined paper." },
  { question: "Can I choose page size?", answer: "Yes — A4, Letter, Legal, A3, and A5 are supported." },
  { question: "Are pages truly empty?", answer: "Yes. The output contains the chosen number of completely empty pages with no markings, watermarks, or metadata." },
];

const BlankPdf = () => {
  const [size, setSize] = useState("A4");
  const [count, setCount] = useState(1);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [processing, setProcessing] = useState(false);

  const handleGenerate = async () => {
    setProcessing(true);
    try {
      const pdf = await PDFDocument.create();
      let [w, h] = SIZES[size];
      if (orientation === "landscape") [w, h] = [h, w];
      for (let i = 0; i < Math.max(1, Math.min(500, count)); i++) {
        pdf.addPage([w, h]);
      }
      const out = await pdf.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `blank-${size.toLowerCase()}-${count}p.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Blank PDF created", description: "File downloaded." });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to generate", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageShell
      title="Create Blank PDF Online — Generate Empty PDF Pages Free | PDFMaster"
      description="Generate a blank PDF with custom page size and page count. A4, Letter, Legal, A3, A5. Free, instant, browser-based."
      keywords="blank pdf, create empty pdf, generate blank pdf, empty pdf template, blank a4 pdf, blank letter pdf"
      h1="Create a Blank PDF"
      intro="Generate an empty PDF in any standard page size, with the number of pages you need. Useful for templates, placeholders, and printing."
      faqSchema={faqs}
      breadcrumbName="Create Blank PDF"
      breadcrumbPath="/blank-pdf"
      toolUI={
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Page size</Label>
              <select value={size} onChange={(e) => setSize(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                {Object.keys(SIZES).map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <Label>Orientation</Label>
              <select value={orientation} onChange={(e) => setOrientation(e.target.value as "portrait" | "landscape")} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
            <div>
              <Label htmlFor="cnt">Page count</Label>
              <Input id="cnt" type="number" min={1} max={500} value={count} onChange={(e) => setCount(parseInt(e.target.value) || 1)} />
            </div>
          </div>
          <Button size="lg" className="w-full" onClick={handleGenerate} disabled={processing}>
            {processing ? (<><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>) : (<><Download className="h-4 w-4" /> Generate Blank PDF</>)}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>When You Need a Blank PDF</h2>
          <p>
            A blank PDF sounds trivial but it's surprisingly useful. Print shops use them as separators between print jobs. Authors use them as placeholder chapters in book mockups. Lawyers add them between sections of bound exhibits. Designers use them as base templates when building forms. And teachers print them as lined or grid paper handouts.
          </p>
          <h3>How to Generate a Blank PDF</h3>
          <ol>
            <li><strong>Pick a page size</strong> — A4, Letter, Legal, A3, or A5.</li>
            <li><strong>Choose orientation</strong> — Portrait or Landscape.</li>
            <li><strong>Set the page count</strong> (1 to 500).</li>
            <li><strong>Click Generate.</strong> Your blank PDF downloads instantly.</li>
          </ol>
          <h3>Standard Page Dimensions</h3>
          <ul>
            <li>A4 — 595 × 842 points (210 × 297 mm)</li>
            <li>Letter — 612 × 792 points (8.5 × 11 in)</li>
            <li>Legal — 612 × 1008 points (8.5 × 14 in)</li>
            <li>A3 — 842 × 1191 points (297 × 420 mm)</li>
            <li>A5 — 420 × 595 points (148 × 210 mm)</li>
          </ul>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default BlankPdf;
