import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Download, Loader2, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const faqs = [
  {
    question: "What's the difference between this and PDF to Word?",
    answer:
      "This tool gives you raw text in a .txt file (or copy/paste it), perfect for analysis, search, or feeding into other apps. PDF to Word produces an editable .docx file.",
  },
  {
    question: "Can I extract text from scanned PDFs?",
    answer:
      "No. Scanned PDFs are images and require OCR. This tool extracts the text layer that's already embedded in the PDF.",
  },
  {
    question: "Is my PDF uploaded?",
    answer: "No. Text extraction runs entirely in your browser.",
  },
];

const ExtractText = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("");
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const handleExtract = async () => {
    if (!files[0]) return;
    setProcessing(true);
    setProgress(5);
    setText("");
    try {
      const bytes = await files[0].arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      let result = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = (content.items as any[])
          .map((it) => ("str" in it ? it.str : ""))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        result += `--- Page ${i} ---\n${pageText}\n\n`;
        setProgress(10 + Math.round((i / pdf.numPages) * 85));
      }
      setText(result);
      setProgress(100);
      toast({ title: "Text extracted", description: `${pdf.numPages} page(s) processed.` });
    } catch (e) {
      console.error(e);
      toast({ title: "Extraction failed", variant: "destructive" });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (files[0]?.name.replace(/\.pdf$/i, "") || "extracted") + ".txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolPageShell
      title="Extract Text from PDF Online Free – TXT Export on Any Device | Master PDF Tools"
      description="Extract plain text from any PDF and download as .txt. Mobile-friendly, cross-browser, secure, and compatible with all devices and software versions."
      keywords="Extract Text from PDF Online Free, PDF to TXT Converter, PDF Text Extractor for All Devices, Mobile PDF Text Extract, extract text from pdf, pdf to text, pdf to txt, copy text from pdf, pdf text extractor"
      h1="Extract Text from PDF — Free Online .txt Export"
      intro="Pull all text from your PDF into a clean .txt file you can copy, search, translate, or feed into AI tools."
      faqSchema={faqs}
      toolUI={
        <div className="space-y-6">
          <FileDropzone
            files={files}
            onFiles={(f) => {
              setFiles([f[0]]);
              setText("");
            }}
            onRemove={() => {
              setFiles([]);
              setText("");
            }}
            cta="Drop a PDF here or click to upload"
            subtitle="One file at a time • Max 50MB"
          />

          {processing && <Progress value={progress} />}

          <Button
            size="lg"
            className="w-full"
            disabled={!files[0] || processing}
            onClick={handleExtract}
          >
            {processing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Extracting...</>
            ) : (
              <><FileText className="h-4 w-4" /> Extract Text</>
            )}
          </Button>

          {text && (
            <>
              <Textarea value={text} readOnly rows={12} className="font-mono text-xs" />
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={handleCopy}>
                  <Copy className="h-4 w-4" /> Copy All
                </Button>
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4" /> Download .txt
                </Button>
              </div>
            </>
          )}
        </div>
      }
      seoContent={
        <>
          <h2>How to Extract Text from a PDF — Complete Guide</h2>
          <p>
            Extracting plain text from a PDF is useful for keyword search, feeding
            content into AI tools and chatbots, copying quotations into documents,
            building search indexes, or repurposing material into other formats. This
            tool reads the embedded text layer of your PDF and outputs it as a clean
            .txt file with page markers preserved so you can navigate by page.
          </p>

          <h3>Step-by-Step: How to Extract Text from a PDF</h3>
          <ol>
            <li><strong>Upload your PDF</strong> using the dropzone above.</li>
            <li><strong>Click Extract Text.</strong> The tool reads each page's text layer.</li>
            <li><strong>Copy or download</strong> the extracted text as a .txt file.</li>
          </ol>

          <h3>Common Use Cases</h3>
          <ul>
            <li>Feeding PDF content into ChatGPT, Claude, or other AI tools</li>
            <li>Building a searchable text database from a PDF library</li>
            <li>Quoting passages from research papers or articles</li>
            <li>Translating text using external translation tools</li>
            <li>Counting words for editing, billing, or compliance</li>
            <li>Migrating content into a CMS, blog, or knowledge base</li>
          </ul>

          <h3>Why Some PDFs Don't Extract Well</h3>
          <p>
            Scanned PDFs (where pages are images of text rather than real text) can't be
            extracted with this tool because there is no text layer to read — they
            require OCR (optical character recognition) processing first. PDFs with
            unusual fonts or copy-protection may also produce garbled output.
          </p>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default ExtractText;
