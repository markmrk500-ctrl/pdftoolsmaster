import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2, Upload, X, FileSpreadsheet } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const faqs = [
  { question: "What file types are supported?", answer: "Excel .xlsx, .xls, and OpenDocument .ods spreadsheets." },
  { question: "How are multiple sheets handled?", answer: "Each worksheet becomes its own section in the PDF, with the sheet name as a heading." },
  { question: "Is my file uploaded?", answer: "No. Parsing and rendering run entirely in your browser." },
];

const ExcelToPdf = () => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.oasis.opendocument.spreadsheet": [".ods"],
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
      const workbook = XLSX.read(buffer, { type: "array" });
      setProgress(25);

      const container = document.createElement("div");
      container.style.cssText =
        "position:fixed;left:-99999px;top:0;width:1100px;padding:32px;background:#fff;color:#111;font-family:Arial,Helvetica,sans-serif;font-size:12px;";

      let html = "";
      for (const name of workbook.SheetNames) {
        const sheet = workbook.Sheets[name];
        const sheetHtml = XLSX.utils.sheet_to_html(sheet, { id: `s-${name}` });
        html += `<h2 style="font-size:18px;margin:24px 0 8px;color:#1a1a1a;">${name}</h2>${sheetHtml}`;
      }
      container.innerHTML = html;
      // Style all tables
      container.querySelectorAll("table").forEach((t) => {
        (t as HTMLElement).style.cssText =
          "border-collapse:collapse;width:100%;margin-bottom:24px;";
      });
      container.querySelectorAll("td, th").forEach((c) => {
        (c as HTMLElement).style.cssText =
          "border:1px solid #ccc;padding:4px 8px;text-align:left;vertical-align:top;";
      });
      document.body.appendChild(container);

      try {
        const canvas = await html2canvas(container, { scale: 1.5, backgroundColor: "#ffffff" });
        setProgress(75);
        const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const imgW = pageW;
        const imgH = (canvas.height * imgW) / canvas.width;
        let heightLeft = imgH;
        let position = 0;
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        pdf.addImage(dataUrl, "JPEG", 0, position, imgW, imgH);
        heightLeft -= pageH;
        while (heightLeft > 0) {
          position = heightLeft - imgH;
          pdf.addPage();
          pdf.addImage(dataUrl, "JPEG", 0, position, imgW, imgH);
          heightLeft -= pageH;
        }
        pdf.save(file.name.replace(/\.(xlsx|xls|ods)$/i, "") + ".pdf");
      } finally {
        container.remove();
      }

      setProgress(100);
      toast({ title: "Conversion complete", description: "PDF downloaded." });
    } catch (e) {
      console.error(e);
      toast({ title: "Conversion failed", description: "Couldn't convert this spreadsheet.", variant: "destructive" });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  return (
    <ToolPageShell
      title="Excel to PDF Online Free – Convert XLSX to PDF on Any Device | Master PDF Tools"
      description="Convert Excel spreadsheets (XLSX, XLS, ODS) to PDF online. Mobile-friendly, secure, browser-based — your file never leaves your device."
      keywords="Excel to PDF, XLSX to PDF, convert excel to pdf, spreadsheet to pdf, xls to pdf converter, free excel to pdf"
      h1="Excel to PDF — Convert Spreadsheets to PDF"
      intro="Drop an Excel file and download a clean PDF. Every worksheet becomes a section with formatted tables."
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
              <p className="font-semibold text-base md:text-lg">Drop a spreadsheet here or click to upload</p>
              <p className="text-sm text-muted-foreground">.xlsx, .xls, .ods • Max 25MB</p>
            </div>
          </div>

          {file && (
            <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3">
              <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" />
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
          <h2>Convert Excel to PDF — Free & Private</h2>
          <p>Drop an .xlsx, .xls, or .ods file and download a paginated PDF in landscape format. Every worksheet is included with its rows and columns preserved.</p>
          <h3>Step-by-Step</h3>
          <ol>
            <li>Upload your spreadsheet.</li>
            <li>Click Convert to PDF.</li>
            <li>Save the PDF — multi-sheet workbooks are sectioned by sheet name.</li>
          </ol>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default ExcelToPdf;
