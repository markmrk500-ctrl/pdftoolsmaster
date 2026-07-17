import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import mammoth from "mammoth";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2, Upload, X, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const faqs = [
  { question: "What file types are supported?", answer: "Microsoft Word .docx files. Older .doc files must be saved as .docx first in Word or Google Docs." },
  { question: "Does formatting carry over?", answer: "Headings, bold/italic, lists, tables, and images are preserved. Complex layouts (text boxes, columns, custom fonts) may render with simplified styling." },
  { question: "Is my file uploaded?", answer: "No. Conversion runs entirely in your browser." },
];

const WordToPdf = () => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    if (!accepted[0]) return;
    setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    multiple: false,
    maxSize: 25 * 1024 * 1024,
  });

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(5);
    try {
      const buffer = await file.arrayBuffer();
      setProgress(20);
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer: buffer });
      setProgress(45);

      // Render the HTML to an off-screen container, then snapshot to a paginated PDF.
      const container = document.createElement("div");
      container.style.cssText =
        "position:fixed;left:-99999px;top:0;width:794px;padding:48px;background:#fff;color:#111;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;";
      container.innerHTML = html;
      document.body.appendChild(container);

      try {
        const canvas = await html2canvas(container, { scale: 2, backgroundColor: "#ffffff" });
        setProgress(75);

        const pdf = new jsPDF({ unit: "pt", format: "a4" });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const imgW = pageW;
        const imgH = (canvas.height * imgW) / canvas.width;

        let heightLeft = imgH;
        let position = 0;
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        pdf.addImage(dataUrl, "JPEG", 0, position, imgW, imgH);
        heightLeft -= pageH;
        while (heightLeft > 0) {
          position = heightLeft - imgH;
          pdf.addPage();
          pdf.addImage(dataUrl, "JPEG", 0, position, imgW, imgH);
          heightLeft -= pageH;
        }
        pdf.save(file.name.replace(/\.docx$/i, "") + ".pdf");
      } finally {
        container.remove();
      }

      setProgress(100);
      toast({ title: "Conversion complete", description: "PDF downloaded." });
    } catch (e) {
      console.error(e);
      toast({ title: "Conversion failed", description: "Couldn't convert this Word file.", variant: "destructive" });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  return (
    <ToolPageShell
      title="Word to PDF Online Free – Convert DOCX to PDF on Any Device | Master PDF Tools"
      description="Convert Word DOCX documents to PDF online. Mobile-friendly, secure, browser-based — your file never leaves your device."
      keywords="Word to PDF, DOCX to PDF, convert word to pdf, doc to pdf, docx to pdf converter, free word to pdf"
      h1="Word to PDF — Convert DOCX to PDF in Your Browser"
      intro="Drop a .docx file and instantly download a paginated PDF. Headings, lists, tables and images preserved."
      faqSchema={faqs}
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
              <p className="font-semibold text-base md:text-lg">Drop a .docx file here or click to upload</p>
              <p className="text-sm text-muted-foreground">One file • Max 25MB</p>
            </div>
          </div>

          {file && (
            <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3">
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button onClick={() => setFile(null)} className="p-1 hover:bg-secondary rounded" aria-label="Remove">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {processing && <Progress value={progress} />}

          <Button size="lg" className="w-full" disabled={!file || processing} onClick={handleConvert}>
            {processing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Converting...</>
            ) : (
              <><Download className="h-4 w-4" /> Convert to PDF</>
            )}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>Convert Word to PDF — Free, Private, Browser-Based</h2>
          <p>Drop a .docx file and download a paginated PDF in seconds. Conversion happens locally — your document never leaves your device.</p>
          <h3>Step-by-Step</h3>
          <ol>
            <li>Upload your .docx file.</li>
            <li>Click Convert to PDF.</li>
            <li>Save the downloaded PDF.</li>
          </ol>
          <h3>What's Preserved</h3>
          <ul>
            <li>Headings, paragraphs, bold and italic text</li>
            <li>Bullet and numbered lists</li>
            <li>Tables and inline images</li>
            <li>Basic hyperlinks</li>
          </ul>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default WordToPdf;
