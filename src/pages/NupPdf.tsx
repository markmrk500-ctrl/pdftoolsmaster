import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Loader2, LayoutGrid } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const faqs = [
  { question: "What is N-up?", answer: "N-up combines multiple original pages onto a single output page (2-up = 2 per sheet, 4-up = 4 per sheet). Great for printing handouts, saving paper, and creating booklets." },
  { question: "What page size is the output?", answer: "A4 in landscape for 2-up, A4 portrait for 4-up. Original pages are scaled proportionally to fit each cell with white space if aspect ratios differ." },
  { question: "Are my files uploaded?", answer: "No. Layout runs entirely in your browser using pdf-lib." },
];

const ResizePdfNup = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [n, setN] = useState<2 | 4>(2);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const handleRun = async () => {
    if (!files[0]) return;
    setProcessing(true);
    setProgress(10);
    try {
      const bytes = await files[0].arrayBuffer();
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const indices = src.getPageIndices();
      const embedded = await out.embedPdf(src, indices);

      const A4 = [595.28, 841.89] as const;
      const sheetW = n === 2 ? A4[1] : A4[0];
      const sheetH = n === 2 ? A4[0] : A4[1];
      const cols = n === 2 ? 2 : 2;
      const rows = n === 2 ? 1 : 2;
      const margin = 18;
      const cellW = (sheetW - margin * (cols + 1)) / cols;
      const cellH = (sheetH - margin * (rows + 1)) / rows;

      for (let i = 0; i < embedded.length; i += n) {
        const page = out.addPage([sheetW, sheetH]);
        for (let j = 0; j < n && i + j < embedded.length; j++) {
          const e = embedded[i + j];
          const col = j % cols;
          const row = Math.floor(j / cols);
          const ratio = Math.min(cellW / e.width, cellH / e.height);
          const dw = e.width * ratio;
          const dh = e.height * ratio;
          const x = margin + col * (cellW + margin) + (cellW - dw) / 2;
          const yTop = sheetH - margin - row * (cellH + margin);
          const y = yTop - cellH + (cellH - dh) / 2;
          page.drawPage(e, { x, y, width: dw, height: dh });
        }
        setProgress(10 + Math.round(((i + n) / embedded.length) * 80));
      }

      const data = await out.save();
      const blob = new Blob([data as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = files[0].name.replace(/\.pdf$/i, "") + `-${n}up.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setProgress(100);
      toast({ title: "N-up complete", description: "File downloaded." });
    } catch (e) {
      console.error(e);
      toast({ title: "Layout failed", variant: "destructive" });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  return (
    <ToolPageShell
      title="N-up PDF Online Free – Multiple Pages Per Sheet on Any Device | Master PDF Tools"
      description="Combine multiple PDF pages onto one sheet (2-up, 4-up, 6-up). Mobile-friendly, cross-browser, secure, and compatible with all devices and software versions."
      keywords="N-up PDF Online Free, Multiple Pages Per Sheet, PDF 2-up 4-up for All Devices, Mobile N-up PDF, n-up pdf, multiple pages per sheet, 2 pages per sheet, 4 pages per sheet, pdf booklet, pdf handout"
      h1="Multiple PDF Pages Per Sheet (N-up)"
      intro="Place 2 or 4 original PDF pages onto each output sheet. Perfect for handouts, study notes, and saving paper."
      faqSchema={faqs}
      toolUI={
        <div className="space-y-6">
          <FileDropzone files={files} onFiles={(f) => setFiles([f[0]])} onRemove={() => setFiles([])} cta="Drop a PDF here or click to upload" subtitle="One file at a time • Max 50MB" />
          <div className="bg-card border border-border rounded-xl p-4">
            <Label>Pages per sheet</Label>
            <Select value={String(n)} onValueChange={(v) => setN(Number(v) as 2 | 4)}>
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2-up (2 pages per sheet)</SelectItem>
                <SelectItem value="4">4-up (4 pages per sheet)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {processing && <Progress value={progress} />}
          <Button size="lg" className="w-full" disabled={!files[0] || processing} onClick={handleRun}>
            {processing ? (<><Loader2 className="h-4 w-4 animate-spin" /> Building...</>) : (<><Download className="h-4 w-4" /> Build & Download</>)}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>How to Print Multiple PDF Pages on One Sheet (N-up)</h2>
          <p>"N-up" is the printing term for placing N original pages onto a single output sheet. It cuts paper consumption in half (2-up) or quarter (4-up), and it's how teachers print classroom handouts, students print reading material, and developers print code reviews.</p>
          <h3>Step-by-Step</h3>
          <ol>
            <li><strong>Upload your PDF.</strong></li>
            <li><strong>Choose 2-up or 4-up.</strong></li>
            <li><strong>Click Build &amp; Download.</strong> A new PDF sized for A4 paper is generated.</li>
          </ol>
          <h3>When to Use N-up</h3>
          <ul>
            <li>Printing handouts for meetings or classrooms</li>
            <li>Compressing slide decks (4-up of slides) into reading notes</li>
            <li>Saving paper and printer ink for personal archives</li>
            <li>Building quick-reference cards from longer documents</li>
            <li>Prepping booklet drafts before professional binding</li>
          </ul>
          <h3>Layout Details</h3>
          <p>2-up uses A4 landscape with one row of two pages; 4-up uses A4 portrait with a 2 × 2 grid. Each cell preserves the original page's aspect ratio, scaling down proportionally with a small margin.</p>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default ResizePdfNup;
