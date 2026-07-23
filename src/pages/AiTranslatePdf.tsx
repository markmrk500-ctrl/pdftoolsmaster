import { useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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

  const getFontUrl = (lang: string): string => {
    const base = "https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts";
    const map: Record<string, string> = {
      "Arabic": `${base}/NotoSansArabic/hinted/ttf/NotoSansArabic-Regular.ttf`,
      "Urdu": `${base}/NotoNastaliqUrdu/hinted/ttf/NotoNastaliqUrdu-Regular.ttf`,
      "Hindi": `${base}/NotoSansDevanagari/hinted/ttf/NotoSansDevanagari-Regular.ttf`,
      "Bengali": `${base}/NotoSansBengali/hinted/ttf/NotoSansBengali-Regular.ttf`,
      "Chinese (Simplified)": "https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk@main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf",
      "Chinese (Traditional)": "https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk@main/Sans/OTF/TraditionalChinese/NotoSansCJKtc-Regular.otf",
      "Japanese": "https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk@main/Sans/OTF/Japanese/NotoSansCJKjp-Regular.otf",
      "Korean": "https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk@main/Sans/OTF/Korean/NotoSansCJKkr-Regular.otf",
      "Thai": `${base}/NotoSansThai/hinted/ttf/NotoSansThai-Regular.ttf`,
      "Greek": `${base}/NotoSans/hinted/ttf/NotoSans-Regular.ttf`,
      "Russian": `${base}/NotoSans/hinted/ttf/NotoSans-Regular.ttf`,
    };
    return map[lang] || `${base}/NotoSans/hinted/ttf/NotoSans-Regular.ttf`;
  };

  const RTL_LANGS = new Set(["Arabic", "Urdu"]);

  const getFontFamily = (lang: string): { name: string; url: string } => {
    return { name: `translate-${lang.replace(/\W+/g, "-")}`, url: getFontUrl(lang) };
  };

  const loadFontFace = async (name: string, url: string) => {
    try {
      // @ts-ignore
      const existing = Array.from(document.fonts as any).find((f: any) => f.family === name);
      if (existing) return;
      const face = new FontFace(name, `url(${url})`);
      const loaded = await face.load();
      (document.fonts as any).add(loaded);
    } catch (e) {
      console.warn("Font load failed, falling back to system font:", e);
    }
  };

  const handleDownloadPdf = async () => {
    if (!translated) return;
    const container = document.createElement("div");
    try {
      const { name: fontName, url: fontUrl } = getFontFamily(language);
      await loadFontFace(fontName, fontUrl);

      const isRTL = RTL_LANGS.has(language);
      const pageWmm = 210, pageHmm = 297, marginMm = 15;
      // Render at ~96 DPI: 1mm ≈ 3.78px
      const pxPerMm = 3.78;
      const widthPx = Math.round((pageWmm - marginMm * 2) * pxPerMm);

      Object.assign(container.style, {
        position: "fixed",
        top: "-10000px",
        left: "0",
        width: `${widthPx}px`,
        padding: "0",
        background: "#ffffff",
        color: "#000000",
        fontFamily: `"${fontName}", "Noto Sans", Arial, sans-serif`,
        fontSize: "14px",
        lineHeight: "1.7",
        direction: isRTL ? "rtl" : "ltr",
        textAlign: isRTL ? "right" : "left",
        whiteSpace: "pre-wrap",
        wordWrap: "break-word",
      } as CSSStyleDeclaration);
      container.lang = language;
      container.textContent = translated;
      document.body.appendChild(container);

      // Ensure fonts finished
      // @ts-ignore
      if (document.fonts?.ready) await document.fonts.ready;

      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });

      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const imgWmm = pageWmm - marginMm * 2;
      const imgHmm = (canvas.height * imgWmm) / canvas.width;
      const pageContentHmm = pageHmm - marginMm * 2;

      // Slice canvas into page-sized chunks
      const sliceHeightPx = Math.floor((pageContentHmm * canvas.width) / imgWmm);
      let renderedPx = 0;
      let firstPage = true;
      while (renderedPx < canvas.height) {
        const sliceH = Math.min(sliceHeightPx, canvas.height - renderedPx);
        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = sliceH;
        const ctx = slice.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(canvas, 0, renderedPx, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
        const imgData = slice.toDataURL("image/jpeg", 0.92);
        const sliceHmm = (sliceH * imgWmm) / canvas.width;
        if (!firstPage) pdf.addPage();
        pdf.addImage(imgData, "JPEG", marginMm, marginMm, imgWmm, sliceHmm);
        firstPage = false;
        renderedPx += sliceH;
      }

      pdf.save((file?.name.replace(/\.pdf$/i, "") || "translated") + `-${language}.pdf`);
      toast({ title: "PDF downloaded", description: `Translated PDF saved in ${language}.` });
    } catch (e) {
      console.error(e);
      toast({ title: "PDF export failed", description: "Try the .txt download instead.", variant: "destructive" });
    } finally {
      if (container.parentNode) container.parentNode.removeChild(container);
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
            subtitle="Max 150MB"
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
