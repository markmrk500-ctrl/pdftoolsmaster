import { useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Download, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const faqs = [
  { question: "What text formats are supported?", answer: "Plain text. Paste any text and it will be wrapped and paginated automatically into a PDF." },
  { question: "Is my text uploaded?", answer: "No. The conversion runs entirely in your browser; nothing is sent to a server." },
  { question: "Can I control fonts?", answer: "The output uses the standard Helvetica font at 11pt for clean, universal readability." },
];

const TextToPdf = () => {
  const [text, setText] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleGenerate = async () => {
    if (!text.trim()) return toast({ title: "Please enter some text", variant: "destructive" });
    setProcessing(true);
    try {
      const pdf = await PDFDocument.create();
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const fontSize = 11;
      const margin = 50;
      const pageW = 612;
      const pageH = 792;
      const maxW = pageW - margin * 2;
      const lineHeight = fontSize * 1.5;

      const wrapLine = (line: string): string[] => {
        if (!line) return [""];
        const words = line.split(" ");
        const out: string[] = [];
        let cur = "";
        for (const w of words) {
          const test = cur ? `${cur} ${w}` : w;
          if (font.widthOfTextAtSize(test, fontSize) > maxW) {
            if (cur) out.push(cur);
            cur = w;
          } else {
            cur = test;
          }
        }
        if (cur) out.push(cur);
        return out;
      };

      const allLines = text.split("\n").flatMap(wrapLine);
      let page = pdf.addPage([pageW, pageH]);
      let y = pageH - margin;
      for (const line of allLines) {
        if (y < margin) {
          page = pdf.addPage([pageW, pageH]);
          y = pageH - margin;
        }
        page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
        y -= lineHeight;
      }

      const out = await pdf.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "text.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "PDF created" });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to generate PDF", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageShell
      title="Text to PDF Converter — Convert Plain Text to PDF Online Free | PDFMaster"
      description="Convert any plain text into a clean, paginated PDF. Free, browser-based, no signup. Auto word wrap and pagination."
      keywords="text to pdf, txt to pdf, convert text to pdf, plain text pdf converter, paste text make pdf"
      h1="Text to PDF Converter"
      intro="Paste any text and instantly convert it into a clean, paginated PDF document — wrapped, formatted, and ready to share."
      faqSchema={faqs}
      breadcrumbName="Text to PDF"
      breadcrumbPath="/text-to-pdf"
      toolUI={
        <div className="space-y-4">
          <div>
            <Label htmlFor="txt">Your text</Label>
            <Textarea id="txt" rows={12} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste or type your text here..." />
          </div>
          <Button size="lg" className="w-full" onClick={handleGenerate} disabled={processing}>
            {processing ? (<><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>) : (<><Download className="h-4 w-4" /> Convert to PDF</>)}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>Why Convert Text to PDF?</h2>
          <p>
            Plain text is universal but unstyled. Converting to PDF preserves your content's structure across every device, prevents accidental edits, and creates a single shareable file that opens identically on Windows, macOS, iOS, and Android.
          </p>
          <h3>How It Works</h3>
          <ol>
            <li>Paste your text into the box above.</li>
            <li>Click "Convert to PDF" — your file downloads instantly.</li>
            <li>Open in any PDF viewer to print or share.</li>
          </ol>
          <h3>Common Use Cases</h3>
          <ul>
            <li>Saving long emails or chat transcripts as archive files</li>
            <li>Creating printable reading copies of articles</li>
            <li>Converting notes, drafts, and snippets to portable documents</li>
            <li>Building simple handouts and instructions</li>
          </ul>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default TextToPdf;
