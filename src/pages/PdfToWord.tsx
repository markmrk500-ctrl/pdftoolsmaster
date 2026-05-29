import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const faqs = [
  {
    question: "Will my PDF formatting be preserved in Word?",
    answer:
      "This tool extracts text content into an editable Word document. Complex layouts, embedded images, columns, and tables may not be preserved exactly. For text-heavy PDFs, results are excellent.",
  },
  {
    question: "Is my PDF uploaded to a server?",
    answer:
      "No. Conversion runs entirely in your browser. Your PDF and the resulting Word file never leave your device.",
  },
  {
    question: "What format is the output file?",
    answer:
      "The tool generates a standard .docx file compatible with Microsoft Word, Google Docs, LibreOffice, and Apple Pages.",
  },
  {
    question: "Can I convert scanned PDFs?",
    answer:
      "Scanned PDFs contain images, not text, so this text-extraction tool can't read them. You'd need an OCR (optical character recognition) tool first.",
  },
];

const PdfToWord = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const handleConvert = async () => {
    if (!files[0]) return;
    setProcessing(true);
    setProgress(5);
    try {
      const file = files[0];
      const bytes = await file.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: bytes }).promise;

      const paragraphs: Paragraph[] = [
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun(file.name.replace(/\.pdf$/i, ""))],
        }),
      ];

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const content = await page.getTextContent();

        // Group text items into lines by approximate Y position
        const lines = new Map<number, string[]>();
        for (const item of content.items as any[]) {
          if (!("str" in item)) continue;
          const y = Math.round(item.transform[5]);
          const arr = lines.get(y) || [];
          arr.push(item.str);
          lines.set(y, arr);
        }

        const sorted = Array.from(lines.entries()).sort((a, b) => b[0] - a[0]);
        for (const [, parts] of sorted) {
          const text = parts.join(" ").replace(/\s+/g, " ").trim();
          if (text) paragraphs.push(new Paragraph({ children: [new TextRun(text)] }));
        }
        paragraphs.push(new Paragraph({ children: [new TextRun("")] }));
        setProgress(10 + Math.round((i / pdfDoc.numPages) * 80));
      }

      const doc = new Document({ sections: [{ children: paragraphs }] });
      const blob = await Packer.toBlob(doc);
      setProgress(95);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "") + ".docx";
      a.click();
      URL.revokeObjectURL(url);
      setProgress(100);
      toast({ title: "Conversion complete", description: "Word file has been downloaded." });
    } catch (e) {
      console.error(e);
      toast({
        title: "Conversion failed",
        description: "Could not extract text. The PDF may be scanned, encrypted, or corrupted.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  return (
    <ToolPageShell
      title="PDF to Word Converter Online Free – Convert PDF to DOCX on Any Device | Master PDF Tools"
      description="Convert PDF to editable Word DOCX online. Mobile-friendly, cross-browser, secure, and compatible with all devices, operating systems, and software versions."
      keywords="PDF to Word Online Free, PDF to DOCX Converter, PDF to Word for All Devices, Mobile PDF to Word, Cross-platform PDF to DOCX, pdf to word, pdf to docx, convert pdf to word, pdf to word converter, pdf to word free, pdf editor"
      h1="PDF to Word Converter — Free Online PDF to DOCX"
      intro="Extract text from your PDF into an editable Microsoft Word (.docx) document. Open in Word, Google Docs, LibreOffice, or Pages."
      faqSchema={faqs}
      toolUI={
        <div className="space-y-6">
          <div className="flex gap-3 bg-accent/50 border border-border rounded-lg p-4 text-sm">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">About this converter</p>
              <p className="text-muted-foreground">
                This tool extracts <strong>text content</strong> into a clean .docx file.
                Complex layouts, columns, tables, and images are not preserved. Best for
                text-heavy documents like articles, reports, and resumes.
              </p>
            </div>
          </div>

          <FileDropzone
            files={files}
            onFiles={(f) => setFiles([f[0]])}
            onRemove={() => setFiles([])}
            cta="Drop a PDF here or click to upload"
            subtitle="One file at a time • Max 50MB"
          />

          {processing && <Progress value={progress} />}

          <Button
            size="lg"
            className="w-full"
            disabled={!files[0] || processing}
            onClick={handleConvert}
          >
            {processing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Converting...</>
            ) : (
              <><Download className="h-4 w-4" /> Convert to Word & Download</>
            )}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>How to Convert PDF to Word Online — Complete Guide</h2>
          <p>
            PDFs are excellent for sharing finished documents but frustrating to edit.
            When you need to update a resume, revise a report, repurpose content from a
            published article, or correct a typo, converting to Microsoft Word format
            opens up full editing capability. PDFMaster Tools' free PDF to Word converter
            extracts the text from your PDF and packages it into a clean, editable .docx
            file you can open in Word, Google Docs, LibreOffice, Apple Pages, or any
            compatible editor.
          </p>

          <h3>Step-by-Step: How to Convert PDF to Word</h3>
          <ol>
            <li><strong>Upload your PDF.</strong> Drag and drop or click to select. The file is read locally — nothing is uploaded.</li>
            <li><strong>Click Convert.</strong> The tool extracts text from each page, preserving line and paragraph order, and builds a Word document.</li>
            <li><strong>Download.</strong> Your .docx file downloads automatically, ready to edit in any word processor.</li>
          </ol>

          <h3>What This PDF to Word Converter Does Well</h3>
          <p>
            Text extraction works excellently for articles, books, reports, contracts,
            essays, blog posts, manuscripts, and any text-driven document. The output
            preserves words and reading order, giving you a clean foundation to edit,
            reformat, and rework as needed. Page breaks are preserved so you maintain
            the original document's structure.
          </p>

          <h3>Common Use Cases</h3>
          <ul>
            <li>Updating an old resume that only exists as a PDF</li>
            <li>Revising a contract or proposal sent as a PDF attachment</li>
            <li>Repurposing published research or articles for new documents</li>
            <li>Translating PDF content using Word's built-in translator</li>
            <li>Adding tracked changes to a finished report</li>
            <li>Pulling text out for use in presentations, emails, or web pages</li>
          </ul>

          <h3>Limitations to Be Aware Of</h3>
          <p>
            Because this is a fully browser-based extraction tool (not a server-based
            layout converter), some complex visual elements aren't carried over: multi-
            column layouts get linearized into a single column, embedded images aren't
            included in the .docx, tables become loose text rows, and scanned PDFs
            (which contain images, not selectable text) can't be processed without OCR
            (optical character recognition). For pixel-perfect layout conversion,
            dedicated server-based tools are required, but for the vast majority of
            "I just need the text in Word" use cases this converter is fast, free, and
            completely private.
          </p>

          <h3>PDF to Word vs Extract Text — Which Should You Use?</h3>
          <p>
            Use <strong>PDF to Word</strong> when you want a formatted .docx file ready
            to edit. Use our <strong>Extract Text</strong> tool when you just need raw
            text in a .txt file (for analysis, search indexing, or copy-paste).
          </p>

          <h3>Privacy &amp; Security</h3>
          <p>
            The conversion happens entirely in your browser using <code>pdf.js</code> and
            the <code>docx</code> library. No file is uploaded, no text is logged, and
            nothing is stored. Your document is yours alone — perfect for confidential
            content like contracts, financial statements, and personal records.
          </p>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default PdfToWord;
