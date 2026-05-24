import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
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

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

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
  { question: "How accurate is it?", answer: "Powered by Google Gemini via Lovable AI — accuracy is on par with the best general-purpose translators for prose. Specialized legal/medical terms may need expert review." },
];

const AiTranslatePdf = () => {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("Spanish");
  const [translated, setTranslated] = useState("");
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const extractText = async (f: File): Promise<string> => {
    const bytes = await f.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += (content.items as any[]).map((it) => ("str" in it ? it.str : "")).join(" ") + "\n\n";
    }
    return text;
  };

  const handleTranslate = async () => {
    if (!file) return;
    setProcessing(true);
    setTranslated("");
    setProgress(10);
    try {
      const text = await extractText(file);
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

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${resp.status})`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      let done = false;
      setProgress(50);

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || !line.trim()) continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setTranslated(acc);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
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
    await navigator.clipboard.writeText(translated);
    toast({ title: "Copied to clipboard" });
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([translated], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (file?.name.replace(/\.pdf$/i, "") || "translated") + `-${language}.txt`;
    a.click();
    URL.revokeObjectURL(url);
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

      const lines = translated.split("\n").flatMap(wrap);
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
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = (file?.name.replace(/\.pdf$/i, "") || "translated") + `-${language}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "PDF downloaded", description: "Note: non-Latin characters may render as '?' due to PDF font limits — use .txt for full Unicode." });
    } catch (e) {
      console.error(e);
      toast({ title: "PDF export failed", variant: "destructive" });
    }
  };

  return (
    <ToolPageShell
      title="AI PDF Translator — Translate PDFs Online Free in 20+ Languages | PDFMaster"
      description="Translate any PDF into Spanish, French, German, Chinese, Arabic, Hindi & more with AI. Free, fast, no signup. Powered by Lovable AI."
      keywords="ai pdf translator, translate pdf online, pdf translation free, gemini pdf translate, translate pdf to spanish, pdf to french"
      h1="AI PDF Translator"
      intro="Upload a PDF, pick a language, and get an instant AI translation. Streams in real-time and exports as text or PDF."
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
              <div className="grid grid-cols-3 gap-3">
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
            The AI PDF Translator reads the text of your PDF and renders a fluent translation in your chosen language using Google Gemini through the Lovable AI gateway. Translations stream live as they're generated, so you see results instantly instead of waiting for a single big response.
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
