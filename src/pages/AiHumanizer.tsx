import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2, Copy, Download, Trash2, Wand2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { copyTextSafely, downloadBlobSafely } from "@/lib/aiToolCompat";
import { cn } from "@/lib/utils";

const MODES = [
  { value: "light", label: "Light", hint: "Gentle polish, keeps original phrasing" },
  { value: "standard", label: "Standard", hint: "Natural, balanced rewrite" },
  { value: "advanced", label: "Advanced", hint: "Heavier humanization, removes AI patterns" },
  { value: "academic", label: "Academic", hint: "Formal essay / research tone" },
  { value: "professional", label: "Professional", hint: "Polished business voice" },
  { value: "seo", label: "SEO Optimized", hint: "Reads human, keeps keywords" },
] as const;

const TYPO_MODES = [
  { value: "off", label: "Off", hint: "Clean, no imperfections" },
  { value: "light", label: "Light", hint: "Tiny, harmless quirks" },
  { value: "natural", label: "Natural", hint: "Casual fillers and small slips" },
] as const;

const faqs = [
  {
    question: "What does the AI Humanizer do?",
    answer:
      "It rewrites AI-generated text from ChatGPT, Gemini, Claude, DeepSeek and other models into natural, human-sounding writing. The meaning stays the same — the tone, rhythm and word choice are improved so it reads like a person wrote it.",
  },
  {
    question: "What is the Humanizer Score?",
    answer:
      "A 0–100% estimate of how human the output reads, based on sentence-length variety (burstiness), vocabulary diversity, and reduction of common AI patterns. Higher is more human-like.",
  },
  {
    question: "What does Typo Mode do?",
    answer:
      "It optionally adds tiny, realistic imperfections — a missing comma, a casual filler like 'you know', a contraction tweak — so the output reads less polished and more like a real person typed it. Keep it Off for formal use.",
  },
  {
    question: "Will it bypass AI detection tools?",
    answer:
      "AI detectors change constantly, so no humanizer can guarantee a permanent bypass. Our tool focuses on producing genuinely human-quality writing, which naturally scores much lower on most AI detectors than raw AI output.",
  },
  {
    question: "Is my text saved or used to train models?",
    answer:
      "No. Your text is sent securely to the AI backend only to generate the rewrite. We do not store it, log it, or use it for training.",
  },
  {
    question: "How long can the input be?",
    answer:
      "Up to about 30,000 characters per run (roughly 5,000 words). For longer pieces, humanize in sections and paste them back together.",
  },
  {
    question: "Does it work on mobile?",
    answer:
      "Yes. The AI Humanizer is fully responsive and works on Android phones, iPhones, iPads, tablets, laptops and desktops across all modern browsers.",
  },
];

const AiHumanizer = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<string>("standard");
  const [typoMode, setTypoMode] = useState<string>("off");
  const [compact, setCompact] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const charCount = input.length;
  const wordCount = useMemo(
    () => (input.trim() ? input.trim().split(/\s+/).length : 0),
    [input]
  );
  const outCharCount = output.length;
  const outWordCount = useMemo(
    () => (output.trim() ? output.trim().split(/\s+/).length : 0),
    [output]
  );

  const handleHumanize = async () => {
    if (input.trim().length < 20) {
      toast({
        title: "Add more text",
        description: "Please paste at least 20 characters to humanize.",
        variant: "destructive",
      });
      return;
    }
    setProcessing(true);
    setOutput("");
    setScore(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-humanize", {
        body: { text: input, mode, typoMode },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setOutput(data.output || "");
      if (typeof data?.score === "number") setScore(data.score);
      toast({ title: "Humanized!", description: "Your text is ready." });
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Humanization failed",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCopy = async () => {
    await copyTextSafely(output);
    toast({ title: "Copied to clipboard" });
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    downloadBlobSafely(blob, "humanized-text.txt");
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setScore(null);
  };

  const pad = compact ? "space-y-3" : "space-y-6";
  const taMin = compact ? "min-h-[140px]" : "min-h-[220px] md:min-h-[260px]";

  return (
    <ToolPageShell
      title="AI Humanizer Free – Humanize AI Text Online | Master PDF Tools"
      description="Humanize AI-generated text instantly. Make ChatGPT, Gemini, Claude, and other AI content sound natural and human-written. Free online AI Humanizer."
      keywords="AI Humanizer, Humanize AI Text, Humanize ChatGPT Text, AI Content Humanizer, AI Text Rewriter, Human Written AI Text, Remove AI Detection, Make AI Text Sound Human, AI Humanizer Free, Humanize Content Online"
      h1="AI Humanizer"
      intro="Paste AI text from ChatGPT, Gemini, Claude or DeepSeek and turn it into natural, human-sounding writing — instantly, free, on any device."
      faqSchema={faqs}
      breadcrumbName="AI Humanizer"
      breadcrumbPath="/ai-humanizer"
      softwareApp={{
        name: "AI Humanizer — Master PDF Tools",
        category: "WebApplication",
        applicationCategory: "BusinessApplication",
      }}
      toolUI={
        <div className={pad}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="space-y-2">
              <Label htmlFor="mode">Humanization level</Label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger id="mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      <span className="font-medium">{m.label}</span>
                      <span className="text-muted-foreground ml-2 text-xs">— {m.hint}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="typo">Typo mode</Label>
              <Select value={typoMode} onValueChange={setTypoMode}>
                <SelectTrigger id="typo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPO_MODES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      <span className="font-medium">{m.label}</span>
                      <span className="text-muted-foreground ml-2 text-xs">— {m.hint}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end justify-between gap-3 md:justify-end">
              <div className="flex items-center gap-2">
                <Switch id="compact" checked={compact} onCheckedChange={setCompact} />
                <Label htmlFor="compact" className="cursor-pointer">Compact view</Label>
              </div>
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={!input && !output}
              >
                <Trash2 className="h-4 w-4" /> Clear
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="input">Paste your AI-generated text</Label>
              <span className="text-xs text-muted-foreground">
                {wordCount} words • {charCount.toLocaleString()} characters
              </span>
            </div>
            <Textarea
              id="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste text from ChatGPT, Gemini, Claude, DeepSeek or any AI model..."
              className={cn(taMin, "resize-y")}
            />
          </div>

          <Button
            size={compact ? "default" : "lg"}
            className="w-full"
            disabled={processing || input.trim().length < 20}
            onClick={handleHumanize}
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Humanizing...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" /> Humanize Text
              </>
            )}
          </Button>

          {output && (
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Label htmlFor="output" className="inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Humanized output
                </Label>
                <div className="flex items-center gap-3">
                  {score !== null && (
                    <span
                      className="text-xs font-medium px-2 py-1 rounded-md bg-primary/10 text-primary"
                      title="Estimated human-likeness based on sentence variety, vocabulary diversity and AI-pattern reduction."
                    >
                      Humanizer Score: {score}%
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {outWordCount} words • {outCharCount.toLocaleString()} chars
                  </span>
                </div>
              </div>
              {score !== null && (
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
                  />
                </div>
              )}
              <Textarea
                id="output"
                value={output}
                onChange={(e) => setOutput(e.target.value)}
                className={cn(taMin, "resize-y bg-card")}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button variant="outline" onClick={handleCopy}>
                  <Copy className="h-4 w-4" /> Copy result
                </Button>
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4" /> Download .txt
                </Button>
              </div>
            </div>
          )}
        </div>
      }
      seoContent={
        <>
          <h2>What is an AI Humanizer?</h2>
          <p>
            An <strong>AI Humanizer</strong> is a tool that rewrites text generated by large
            language models — ChatGPT, Google Gemini, Anthropic Claude, DeepSeek, Llama and
            others — into writing that sounds natural, varied and human. Modern AI models are
            extraordinarily capable, but their output often shares the same fingerprints:
            evenly weighted sentences, predictable transitions ("in conclusion", "it is
            important to note", "navigate the landscape"), and a balanced, faintly impersonal
            voice. The Master PDF Tools AI Humanizer rewrites that text so it reads the way a
            thoughtful person would actually write it — while keeping every fact, claim and
            instruction intact.
          </p>

          <h3>How the Humanizer Score works</h3>
          <p>
            After every rewrite you'll see a <strong>Humanizer Score</strong> between 0 and
            100%. It blends sentence-length variety (burstiness), vocabulary diversity, and
            how many common AI patterns were removed. Higher means the writing reads more like
            a person wrote it. Treat it as a guide, not a guarantee — AI detectors change all
            the time.
          </p>

          <h3>Typo Mode: Off, Light, Natural</h3>
          <p>
            Real writing isn't perfect. <em>Typo Mode</em> lets you optionally add subtle
            imperfections — a missing comma here, a casual "you know" there — so the output
            stops sounding suspiciously polished. Keep it <em>Off</em> for academic or
            professional work, use <em>Light</em> for blogs, and <em>Natural</em> for casual
            posts and social copy.
          </p>

          <h3>Compact view</h3>
          <p>
            Prefer a tighter, less chunky interface? Flip on <em>Compact view</em> to shrink
            padding, controls and the editor so more text fits on screen. Your choice sticks
            for the session.
          </p>

          <h3>How AI Humanizers Work</h3>
          <p>
            Under the hood, our humanizer sends your text to a powerful language model with a
            carefully tuned set of instructions: vary sentence length, use natural rhythm,
            remove repetitive AI phrasing, keep meaning identical, and never invent new facts.
            Depending on the mode you choose, the model adjusts register — casual,
            professional, academic, or SEO-friendly — and rewrites the text as if a human
            writer were editing a first draft.
          </p>

          <h3>Benefits of Humanizing AI Text</h3>
          <ul>
            <li><strong>Sounds natural.</strong> Readers stay engaged because the rhythm and word choice feel real.</li>
            <li><strong>Lower AI-detector signals.</strong> Human-quality writing naturally scores far lower than raw AI output.</li>
            <li><strong>Better SEO performance.</strong> Search engines favor original, well-written content over generic AI prose.</li>
            <li><strong>Stronger brand voice.</strong> Your blog, emails and product copy don't all sound like the same chatbot.</li>
            <li><strong>Saves editing time.</strong> Instead of manually rewriting every paragraph, you start from a clean human draft.</li>
            <li><strong>Works on any device.</strong> Mobile, tablet, laptop, desktop — same fast experience.</li>
          </ul>

          <h3>Related tools on Master PDF Tools</h3>
          <ul>
            <li><Link to="/ai-translate-pdf">AI Translator</Link> — translate PDFs into 20+ languages.</li>
            <li><Link to="/ai-summarize-pdf">AI Summarizer</Link> — TL;DR and key points from any document.</li>
            <li><Link to="/ai-chat-pdf">Chat with PDF</Link> — ask any PDF questions and get cited answers.</li>
            <li><Link to="/ai-ocr-pdf">AI OCR</Link> — extract text from scans and handwriting.</li>
            <li><Link to="/ai-mcq-generator">AI MCQ Generator</Link> — turn any document into a quiz.</li>
            <li><Link to="/">All PDF Tools</Link> — merge, split, compress, convert and more.</li>
          </ul>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default AiHumanizer;
