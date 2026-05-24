import { useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FAQ } from "@/components/FAQ";
import { FileDropzone } from "@/components/FileDropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const faqs = [
  { question: "What are Bates numbers?", answer: "Bates numbering is a unique identifier (typically a prefix + zero-padded sequence) stamped on every page of a PDF, used in legal discovery, accounting, and document production." },
  { question: "Where are the numbers placed?", answer: "Bates numbers are placed at the bottom-right of every page in a small monospace-looking font, the standard convention for legal filings." },
  { question: "Can I customize the prefix and start number?", answer: "Yes — set any prefix (e.g. ABC), starting number, and zero-padding width." },
];

const BatesNumbering = () => {
  const [file, setFile] = useState<File | null>(null);
  const [prefix, setPrefix] = useState("BATES");
  const [start, setStart] = useState(1);
  const [pad, setPad] = useState(6);
  const [processing, setProcessing] = useState(false);

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const font = await pdf.embedFont(StandardFonts.Courier);
      const pages = pdf.getPages();
      pages.forEach((page, i) => {
        const num = String(start + i).padStart(pad, "0");
        const label = `${prefix}${num}`;
        const { width } = page.getSize();
        const size = 10;
        const textWidth = font.widthOfTextAtSize(label, size);
        page.drawText(label, {
          x: width - textWidth - 36,
          y: 24,
          size,
          font,
          color: rgb(0, 0, 0),
        });
      });
      const out = await pdf.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "-bates.pdf");
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Bates numbering applied" });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to process", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageShell
      title="Bates Numbering for PDFs — Add Legal Bates Numbers Online Free | PDFMaster"
      description="Add Bates numbering to every page of a PDF for legal discovery and document production. Custom prefix, start number, and padding. Free and private."
      keywords="bates numbering, bates stamp pdf, legal bates numbers, pdf bates numbering, document discovery numbering"
      h1="Bates Numbering for PDFs"
      intro="Stamp every page with a custom prefix and sequential number — the standard convention for legal discovery and document production."
      faqSchema={faqs}
      breadcrumbName="Bates Numbering"
      breadcrumbPath="/bates-numbering"
      toolUI={
        <div className="space-y-6">
          <FileDropzone onFiles={(f) => setFile(f[0])} files={file ? [file] : []} onRemove={() => setFile(null)} />
          {file && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="prefix">Prefix</Label>
                  <Input id="prefix" value={prefix} onChange={(e) => setPrefix(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="start">Start number</Label>
                  <Input id="start" type="number" min={0} value={start} onChange={(e) => setStart(parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <Label htmlFor="pad">Pad width</Label>
                  <Input id="pad" type="number" min={1} max={10} value={pad} onChange={(e) => setPad(parseInt(e.target.value) || 1)} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Preview: <span className="font-mono">{prefix}{String(start).padStart(pad, "0")}</span>
              </p>
              <Button size="lg" className="w-full" onClick={handleProcess} disabled={processing}>
                {processing ? (<><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>) : (<><Download className="h-4 w-4" /> Apply Bates & Download</>)}
              </Button>
            </>
          )}
        </div>
      }
      seoContent={
        <>
          <h2>Bates Numbering Explained</h2>
          <p>
            Bates numbering — named after the Bates Manufacturing Company that invented an automatic numbering machine in the 1890s — is the standard way to uniquely identify each page in a corpus of legal, medical, or accounting documents. A typical Bates label looks like <code>SMITH000142</code>: a prefix identifying the case or party, followed by a zero-padded sequential number.
          </p>
          <h3>Common Use Cases</h3>
          <ul>
            <li><strong>Legal discovery</strong> — every page produced in litigation must be uniquely identifiable.</li>
            <li><strong>Audits</strong> — accountants stamp evidence pages for cross-referencing in workpapers.</li>
            <li><strong>Medical records</strong> — clinics number patient charts for HIPAA-compliant production.</li>
            <li><strong>Government filings</strong> — regulatory submissions often require sequential page IDs.</li>
          </ul>
          <h3>How This Tool Works</h3>
          <ol>
            <li>Upload your PDF.</li>
            <li>Choose a prefix, starting number, and zero-pad width.</li>
            <li>The tool stamps every page at the bottom-right corner using a monospace font for clarity.</li>
            <li>Download the numbered PDF and use it in your filing.</li>
          </ol>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default BatesNumbering;
