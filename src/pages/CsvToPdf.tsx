import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2, Upload, Table as TableIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const faqs = [
  { question: "What CSV formats are supported?", answer: "Standard comma-separated values with optional double-quoted fields. The first row is treated as the header." },
  { question: "How are wide tables handled?", answer: "Columns are sized proportionally to their longest cell and the table is rendered on Letter-sized landscape pages, paginating automatically." },
  { question: "Are my files uploaded?", answer: "No. Parsing and PDF generation happen entirely in your browser." },
];

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else cell += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(cell); cell = ""; }
      else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ""; }
      else if (c === '\r') { /* skip */ }
      else cell += c;
    }
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.length));
}

const CsvToPdf = () => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"], "text/plain": [".csv", ".tsv"] },
    multiple: false,
    maxSize: 10 * 1024 * 1024,
  });

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(10);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (!rows.length) throw new Error("Empty CSV");

      const pdf = await PDFDocument.create();
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
      const fontSize = 9;
      const padding = 4;
      const pageW = 792, pageH = 612; // Letter landscape
      const margin = 30;
      const usableW = pageW - margin * 2;
      const cols = rows[0].length;

      // Compute column widths from longest cell per column
      const widths = new Array(cols).fill(0).map((_, ci) => {
        let max = 0;
        for (const r of rows) {
          const t = (r[ci] || "").slice(0, 80);
          const w = font.widthOfTextAtSize(t, fontSize);
          if (w > max) max = w;
        }
        return max + padding * 2;
      });
      const totalW = widths.reduce((a, b) => a + b, 0);
      const scale = usableW / totalW;
      const colW = widths.map((w) => w * scale);

      const rowH = fontSize + padding * 2;
      let page = pdf.addPage([pageW, pageH]);
      let y = pageH - margin - rowH;

      const drawRow = (r: string[], header = false) => {
        let x = margin;
        const f = header ? bold : font;
        const bg = header ? rgb(0.93, 0.94, 0.97) : null;
        if (bg) page.drawRectangle({ x: margin, y, width: usableW, height: rowH, color: bg });
        for (let ci = 0; ci < cols; ci++) {
          page.drawRectangle({ x, y, width: colW[ci], height: rowH, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 0.5 });
          const text = (r[ci] || "").slice(0, 80);
          page.drawText(text, { x: x + padding, y: y + padding, size: fontSize, font: f, color: rgb(0.1, 0.1, 0.1) });
          x += colW[ci];
        }
        y -= rowH;
      };

      drawRow(rows[0], true);
      for (let i = 1; i < rows.length; i++) {
        if (y < margin) {
          page = pdf.addPage([pageW, pageH]);
          y = pageH - margin - rowH;
          drawRow(rows[0], true);
        }
        drawRow(rows[i]);
        if (i % 100 === 0) setProgress(10 + Math.round((i / rows.length) * 80));
      }

      const out = await pdf.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.csv$/i, "") + ".pdf";
      a.click();
      URL.revokeObjectURL(url);
      setProgress(100);
      toast({ title: "PDF created", description: "File downloaded." });
    } catch (e) {
      console.error(e);
      toast({ title: "Conversion failed", variant: "destructive" });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  return (
    <ToolPageShell
      title="CSV to PDF Converter Online Free – Spreadsheet to PDF on Any Device | Master PDF Tools"
      description="Convert CSV spreadsheets to clean PDF tables online. Mobile-friendly, cross-browser, secure, and compatible with all devices and software versions."
      keywords="CSV to PDF Online Free, Spreadsheet to PDF Converter, CSV to PDF for All Devices, Mobile CSV to PDF, csv to pdf, convert csv to pdf, spreadsheet to pdf, csv table pdf, csv converter"
      h1="CSV to PDF — Convert Spreadsheets into Printable Tables"
      intro="Upload a CSV file and download a paginated PDF table — header row styled, columns auto-sized, ready to share or print."
      faqSchema={faqs}
      breadcrumbName="CSV to PDF"
      breadcrumbPath="/csv-to-pdf"
      toolUI={
        <div className="space-y-6">
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-2xl p-10 md:p-14 text-center cursor-pointer transition-colors",
              isDragActive ? "border-primary bg-accent" : "border-border bg-card hover:border-primary/50 hover:bg-accent/30"
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-accent flex items-center justify-center">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <p className="font-semibold text-base md:text-lg">
                {file ? file.name : "Drop your CSV file here or click to upload"}
              </p>
              <p className="text-sm text-muted-foreground">.csv • Max 10MB</p>
            </div>
          </div>
          {processing && <Progress value={progress} />}
          <Button size="lg" className="w-full" disabled={!file || processing} onClick={handleConvert}>
            {processing ? (<><Loader2 className="h-4 w-4 animate-spin" /> Converting...</>) : (<><TableIcon className="h-4 w-4" /> Convert to PDF</>)}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>Turn CSV Data into a Professional PDF Table</h2>
          <p>
            CSV files are everywhere — exports from spreadsheets, database queries, analytics dashboards, and accounting tools. But CSV is unreadable when you need to share it with a non-technical audience or include it in a printed report. This converter renders your CSV as a properly formatted PDF table with a styled header row, auto-sized columns, and automatic pagination.
          </p>
          <h3>How to Convert CSV to PDF</h3>
          <ol>
            <li><strong>Drop your CSV file</strong> into the upload box.</li>
            <li><strong>Click Convert to PDF.</strong> The first row becomes the header.</li>
            <li><strong>Download</strong> the generated PDF — Letter size, landscape, paginated.</li>
          </ol>
          <h3>Common Use Cases</h3>
          <ul>
            <li>Sharing exported sales or financial data with stakeholders</li>
            <li>Printing inventory lists, attendee rosters, or contact sheets</li>
            <li>Attaching tabular data to email reports</li>
            <li>Archiving database exports in a portable, viewer-agnostic format</li>
            <li>Including data tables in legal disclosures and audits</li>
          </ul>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default CsvToPdf;
