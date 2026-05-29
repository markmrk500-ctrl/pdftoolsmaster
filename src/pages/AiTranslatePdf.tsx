import { useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Languages, Loader2, Copy, Download, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { copyTextSafely, downloadBlobSafely, extractPdfText, readAiStream } from "@/lib/aiToolCompat";


const LANGUAGES = [
  "Spanish", "French", "German", "Italian", "Portuguese", "Dutch",
  "Arabic", "Hindi", "Bengali", "Urdu",
  "Chinese (Simplified)", "Chinese (Traditional)", "Japanese", "Korean",
  "Russian", "Turkish", "Polish", "Swedish", "Greek", "Vietnamese", "Thai", "Indonesian",
  "English",
];

const faqs = [
  { question: "Which languages are supported?", answer: "Over 20 major languages including Spanish, French, German, Chinese, Japanese, Arabic, Hindi, and more. Pick from the dropdown." },
  { question: "Does the layout get preserved?", answer: "Paragraph structure is preserved, but original PDF visual layout (columns, images, fonts) is not — you get clean translated text or a simple translated PDF." },
  { question: "Is my PDF uploaded?", answer: "No. Text is extracted in your browser. Only the plain text is sent to the AI for translation." },
  { question: "How accurate is it?", answer: "Powered by Google Gemini via our AI engine — accuracy is on par with the best general-purpose translators for prose. Specialized legal/medical terms may need expert review." },
];

const AiTranslatePdf = () => {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("Spanish");
  const [translated, setTranslated] = useState("");
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const handleTranslate = async () => {
    if (!file) return;
    setProcessing(true);
    setTranslated("");
    setProgress(10);
    try {
      const { text } = await extractPdfText(file, { onProgress: (p) => setProgress(10 + Math.round(p * 0.25)) });
      if (!text.trim()) {
        toast({ title: "No text found", description: "Try AI OCR for scanned PDFs.", variant: "destructive" });
        setProcessing(false);
        setProgress(0);
        return;
      }
      setProgress(35);

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-translate`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text, targetLanguage: language }),
      });

      setProgress(50);
      const finalText = await readAiStream(resp, (_delta, fullText) => setTranslated(fullText));
      if (!finalText.trim()) throw new Error("The AI returned an empty translation. Please try again.");
      setProgress(100);
      toast({ title: `Translated to ${language}` });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Translation failed", description: e?.message || "Please try again.", variant: "destructive" });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  const handleCopy = async () => {
    await copyTextSafely(translated);
    toast({ title: "Copied to clipboard" });
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([translated], { type: "text/plain;charset=utf-8" });
    downloadBlobSafely(blob, (file?.name.replace(/\.pdf$/i, "") || "translated") + `-${language}.txt`);
  };

  const handleDownloadPdf = async () => {
    try {
      const pdf = await PDFDocument.create();
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const fontSize = 11;
      const margin = 50;
      const pageW = 612, pageH = 792;
      const maxW = pageW - margin * 2;
      const lh = fontSize * 1.5;

      const wrap = (line: string): string[] => {
        if (!line) return [""];
        const words = line.split(" ");
        const out: string[] = [];
        let cur = "";
        for (const w of words) {
          const t = cur ? `${cur} ${w}` : w;
          // pdf-lib StandardFonts only support WinAnsi — strip unsupported chars
          const safe = t.replace(/[^\x00-\xFF]/g, "?");
          if (font.widthOfTextAtSize(safe, fontSize) > maxW) {
            if (cur) out.push(cur);
            cur = w;
          } else cur = t;
        }
        if (cur) out.push(cur);
        return out;
      };

      const lines: string[] = [];
      translated.split("\n").forEach((line) => lines.push(...wrap(line)));
      let page = pdf.addPage([pageW, pageH]);
      let y = pageH - margin;
      for (const line of lines) {
        if (y < margin) { page = pdf.addPage([pageW, pageH]); y = pageH - margin; }
        const safe = line.replace(/[^\x00-\xFF]/g, "?");
        page.drawText(safe, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
        y -= lh;
      }
      const out = await pdf.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      downloadBlobSafely(blob, (file?.name.replace(/\.pdf$/i, "") || "translated") + `-${language}.pdf`);
      toast({ title: "PDF downloaded", description: "Note: non-Latin characters may render as '?' due to PDF font limits — use .txt for full Unicode." });
    } catch (e) {
      console.error(e);
      toast({ title: "PDF export failed", variant: "destructive" });
    }
  };

  return (
    <ToolPageShell
      title="AI PDF Translator Online Free – Translate Documents on Any Device | Master PDF Tools"
      description="Translate PDF and documents online using AI. Fast, secure, mobile-friendly, and compatible with all devices, browsers, and software versions."
      keywords="AI PDF Translator, Translate PDF Online Free, PDF Translator for All Devices, AI Document Translation, Translate Files Online, Multi-language PDF Translation, Mobile PDF Translator, Fast AI Translation Tool, cross-platform pdf translator, pdf translator iphone android"
      h1="AI PDF Translator — Works on Any Device"
      intro="Translate any PDF into 20+ languages with AI. Mobile-friendly, cross-browser, and compatible with all devices and software versions — fast, secure, free."
      faqSchema={faqs}
      breadcrumbName="AI PDF Translator"
      breadcrumbPath="/ai-translate-pdf"
      toolUI={
        <div className="space-y-6">
          <FileDropzone
            files={file ? [file] : []}
            onFiles={(f) => { setFile(f[0]); setTranslated(""); }}
            onRemove={() => { setFile(null); setTranslated(""); }}
            cta="Drop a PDF to translate"
            subtitle="Max 50MB"
          />
          <div>
            <Label htmlFor="lang">Translate into</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="lang"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {processing && <Progress value={progress} />}
          <Button size="lg" className="w-full" disabled={!file || processing} onClick={handleTranslate}>
            {processing ? (<><Loader2 className="h-4 w-4 animate-spin" /> Translating...</>) : (<><Languages className="h-4 w-4" /> Translate with AI</>)}
          </Button>

          {translated && (
            <>
              <Textarea value={translated} readOnly rows={14} className="font-sans text-sm" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button variant="outline" onClick={handleCopy}><Copy className="h-4 w-4" /> Copy</Button>
                <Button variant="outline" onClick={handleDownloadTxt}><Download className="h-4 w-4" /> .txt</Button>
                <Button onClick={handleDownloadPdf}><FileText className="h-4 w-4" /> .pdf</Button>
              </div>
            </>
          )}
        </div>
      }
      seoContent={
        <>
          <h2>Translate Any PDF — 20+ Languages, Free, No Signup</h2>
          <p>
            The AI PDF Translator reads the text of your PDF and renders a fluent translation in your chosen language using Google Gemini through the AI gateway. Translations stream live as they're generated, so you see results instantly instead of waiting for a single big response.
          </p>
          <h3>Supported Languages</h3>
          <p>
            Spanish, French, German, Italian, Portuguese, Dutch, Russian, Polish, Greek, Turkish, Swedish, Arabic, Hindi, Bengali, Urdu, Chinese (Simplified & Traditional), Japanese, Korean, Vietnamese, Thai, Indonesian, and English.
          </p>
          <h3>How It Works</h3>
          <ol>
            <li>Drop in your PDF — text is extracted entirely in your browser.</li>
            <li>Pick a target language from the dropdown.</li>
            <li>Click Translate — text streams in as the AI translates.</li>
            <li>Copy the result or download as .txt or .pdf.</li>
          </ol>
          <h3>Tips for Best Results</h3>
          <ul>
            <li>For scanned PDFs, run AI OCR first to extract the text layer.</li>
            <li>Use the .txt export when translating to non-Latin scripts (Arabic, Chinese, Japanese, etc.) — it preserves full Unicode.</li>
            <li>Very long documents are automatically truncated to keep responses fast — split bigger PDFs first.</li>
          </ul>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default AiTranslatePdf;
