import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import ReactMarkdown from "react-markdown";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Loader2, Copy, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const faqs = [
  { question: "Is my PDF uploaded to a server?", answer: "Only the extracted text is sent securely to our AI backend for summarization. The PDF file itself never leaves your browser." },
  { question: "Which AI model powers the summary?", answer: "We use Lovable AI (Google Gemini) tuned for fast, accurate document summarization. No API key needed — it's built in." },
  { question: "Can it summarize scanned PDFs?", answer: "Scanned PDFs have no text layer. Run them through our AI OCR tool first, then paste the result into the AI Summarizer." },
  { question: "Are there length limits?", answer: "We process up to ~60,000 characters at a time (roughly 100 PDF pages). For larger docs, summarize in chunks." },
];

const AiSummarizePdf = () => {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState("");
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const handleSummarize = async () => {
    if (!file) return;
    setProcessing(true);
    setSummary("");
    setProgress(5);
    try {
      const bytes = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += (content.items as any[]).map((it) => ("str" in it ? it.str : "")).join(" ") + "\n\n";
        setProgress(5 + Math.round((i / pdf.numPages) * 45));
      }
      if (!text.trim()) {
        toast({ title: "No text found", description: "This PDF may be scanned. Try the AI OCR tool first.", variant: "destructive" });
        setProcessing(false);
        setProgress(0);
        return;
      }
      setProgress(60);
      const { data, error } = await supabase.functions.invoke("ai-summarize", { body: { text } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSummary(data.summary || "");
      setProgress(100);
      toast({ title: "Summary ready" });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Summarization failed", description: e?.message || "Please try again.", variant: "destructive" });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(summary);
    toast({ title: "Copied to clipboard" });
  };

  const handleDownload = () => {
    const blob = new Blob([summary], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (file?.name.replace(/\.pdf$/i, "") || "summary") + "-summary.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolPageShell
      title="AI PDF Summarizer — Free Online TL;DR & Key Points | PDFMaster"
      description="Summarize any PDF instantly with AI. Get a TL;DR, key points, and section-by-section summary. Powered by Lovable AI — no signup, no API key."
      keywords="ai pdf summarizer, summarize pdf online, pdf tldr, pdf key points, ai document summary, gemini pdf summary"
      h1="AI PDF Summarizer"
      intro="Upload any PDF and get an instant AI-generated TL;DR, key takeaways, and section summaries — powered by Lovable AI."
      faqSchema={faqs}
      breadcrumbName="AI PDF Summarizer"
      breadcrumbPath="/ai-summarize-pdf"
      toolUI={
        <div className="space-y-6">
          <FileDropzone
            files={file ? [file] : []}
            onFiles={(f) => { setFile(f[0]); setSummary(""); }}
            onRemove={() => { setFile(null); setSummary(""); }}
            cta="Drop a PDF to summarize"
            subtitle="Up to ~100 pages • Max 50MB"
          />
          {processing && <Progress value={progress} />}
          <Button size="lg" className="w-full" disabled={!file || processing} onClick={handleSummarize}>
            {processing ? (<><Loader2 className="h-4 w-4 animate-spin" /> Summarizing with AI...</>) : (<><Sparkles className="h-4 w-4" /> Summarize with AI</>)}
          </Button>

          {summary && (
            <>
              <div className="prose prose-slate dark:prose-invert max-w-none rounded-xl border border-border bg-card p-5">
                <ReactMarkdown>{summary}</ReactMarkdown>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={handleCopy}><Copy className="h-4 w-4" /> Copy</Button>
                <Button onClick={handleDownload}><Download className="h-4 w-4" /> Download .md</Button>
              </div>
            </>
          )}
        </div>
      }
      seoContent={
        <>
          <h2>Read 100 Pages in 30 Seconds — AI PDF Summaries</h2>
          <p>
            Long reports, research papers, contracts, and meeting decks eat your day. The AI PDF Summarizer reads the entire document for you and returns a structured digest you can scan in under a minute: a TL;DR for the gist, bullet-point key takeaways for the must-knows, and section summaries for everything in between.
          </p>
          <h3>How It Works</h3>
          <ol>
            <li>Upload your PDF — text is extracted locally in your browser.</li>
            <li>The text is sent securely to our AI backend (Lovable AI / Gemini).</li>
            <li>You get back a structured Markdown summary in seconds.</li>
          </ol>
          <h3>Common Use Cases</h3>
          <ul>
            <li>Research papers, whitepapers, and academic articles</li>
            <li>Earnings reports, business plans, and pitch decks</li>
            <li>Legal contracts, policies, and terms of service</li>
            <li>Long-form articles, e-books, and meeting transcripts</li>
            <li>Government filings, RFPs, and technical documentation</li>
          </ul>
          <h3>Privacy First</h3>
          <p>
            Your PDF file never leaves your device — only the extracted plain text is sent to the AI. Nothing is stored, logged, or used for model training.
          </p>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default AiSummarizePdf;
