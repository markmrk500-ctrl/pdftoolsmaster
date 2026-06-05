import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Loader2, Copy, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { copyTextSafely, downloadBlobSafely, extractPdfText } from "@/lib/aiToolCompat";


const faqs = [
  { question: "Is my PDF uploaded to a server?", answer: "Only the extracted text is sent securely to our AI backend for summarization. The PDF file itself never leaves your browser." },
  { question: "Which AI model powers the summary?", answer: "We use our AI engine (Google Gemini) tuned for fast, accurate document summarization. No API key needed — it's built in." },
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
      const { text } = await extractPdfText(file, { onProgress: (p) => setProgress(5 + Math.round(p * 0.45)) });
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
    await copyTextSafely(summary);
    toast({ title: "Copied to clipboard" });
  };

  const handleDownload = () => {
    const blob = new Blob([summary], { type: "text/markdown;charset=utf-8" });
    downloadBlobSafely(blob, (file?.name.replace(/\.pdf$/i, "") || "summary") + "-summary.md");
  };

  return (
    <ToolPageShell
      title="AI PDF Summarizer Online Free – Summarize Documents on Any Device | Master PDF Tools"
      description="Summarize any PDF with AI in seconds. Mobile-friendly, cross-browser, secure, and compatible with all devices, operating systems, and software versions."
      keywords="AI PDF Summarizer, Summarize PDF Online Free, PDF TLDR, AI Document Summary, Key Points Generator, Mobile PDF Summarizer, PDF Summarizer for All Devices, Fast AI Summary Tool, cross-platform summarizer"
      h1="AI PDF Summarizer — Works on Any Device"
      intro="Get an instant AI-generated TL;DR, key takeaways, and section summaries from any PDF. Mobile-friendly, cross-browser, and fast on every device."
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
            subtitle="Up to ~100 pages • Max 150MB"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <li>The text is sent securely to our AI backend (our AI (Google Gemini)).</li>
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
