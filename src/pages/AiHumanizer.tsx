import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

const MODES = [
  { value: "standard", label: "Standard", hint: "Natural, balanced rewrite" },
  { value: "advanced", label: "Advanced", hint: "Heavier humanization, removes AI patterns" },
  { value: "academic", label: "Academic", hint: "Formal essay / research tone" },
  { value: "professional", label: "Professional", hint: "Polished business voice" },
  { value: "seo", label: "SEO Optimized", hint: "Reads human, keeps keywords" },
] as const;

const faqs = [
  {
    question: "What does the AI Humanizer do?",
    answer:
      "It rewrites AI-generated text from ChatGPT, Gemini, Claude, DeepSeek and other models into natural, human-sounding writing. The meaning stays the same — the tone, rhythm and word choice are improved so it reads like a person wrote it.",
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
    question: "What's the difference between the modes?",
    answer:
      "Standard gives a balanced human rewrite. Advanced is more aggressive at removing AI tells. Academic is formal and research-friendly. Professional fits business writing. SEO Optimized keeps your keywords while sounding human.",
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
  const [processing, setProcessing] = useState(false);

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
    try {
      const { data, error } = await supabase.functions.invoke("ai-humanize", {
        body: { text: input, mode },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setOutput(data.output || "");
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
  };

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
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
            <div className="space-y-2">
              <Label htmlFor="mode">Humanization mode</Label>
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
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={!input && !output}
              className="sm:w-auto w-full"
            >
              <Trash2 className="h-4 w-4" /> Clear
            </Button>
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
              className="min-h-[220px] md:min-h-[260px] resize-y"
            />
          </div>

          <Button
            size="lg"
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
              <div className="flex items-center justify-between">
                <Label htmlFor="output" className="inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Humanized output
                </Label>
                <span className="text-xs text-muted-foreground">
                  {outWordCount} words • {outCharCount.toLocaleString()} characters
                </span>
              </div>
              <Textarea
                id="output"
                value={output}
                onChange={(e) => setOutput(e.target.value)}
                className="min-h-[220px] md:min-h-[260px] resize-y bg-card"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button variant="outline" onClick={handleCopy}>
                  <Copy className="h-4 w-4" /> Copy
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

          <h3>How AI Humanizers Work</h3>
          <p>
            Under the hood, our humanizer sends your text to a powerful language model with a
            carefully tuned set of instructions: vary sentence length, use natural rhythm,
            remove repetitive AI phrasing, keep meaning identical, and never invent new facts.
            Depending on the mode you choose, the model adjusts register — casual,
            professional, academic, or SEO-friendly — and rewrites the text as if a human
            writer were editing a first draft. The result is text with a real voice instead of
            the smooth-but-flat tone that AI detectors and human readers both pick up on.
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

          <h3>Humanize ChatGPT Content</h3>
          <p>
            ChatGPT is brilliant for first drafts, but its default voice is recognizable: long
            balanced paragraphs, frequent hedging, and predictable openers. Paste your ChatGPT
            output into the humanizer, pick <em>Advanced</em> for the strongest rewrite, and
            you'll get back the same information in writing that feels like it came from a
            person — varied sentence length, real transitions, and none of the giveaway
            phrases. The same approach works for Gemini, Claude, DeepSeek, Llama, Mistral and
            any other model.
          </p>

          <h3>Humanize Academic Writing</h3>
          <p>
            For essays, literature reviews and research summaries, choose <em>Academic</em>
            mode. The tool keeps a formal register, uses precise vocabulary, hedges claims
            appropriately and varies sentence structure the way a careful student or
            researcher would. It still preserves your sources, arguments and conclusions
            exactly — only the prose changes. Always check your institution's policy on AI use
            and use humanized text as a starting point for your own writing, not a shortcut
            around your own thinking.
          </p>

          <h3>Humanize for SEO and Marketing</h3>
          <p>
            <em>SEO Optimized</em> mode keeps your target keywords in place but breaks up the
            overly uniform structure that Google's helpful-content systems are trained to
            spot. Short scannable sentences alternate with longer ones, transitions feel
            natural, and the page reads like genuine expertise. Pair it with the rest of the
            Master PDF Tools suite — see the <Link to="/ai-summarize-pdf">AI Summarizer</Link>,{" "}
            <Link to="/ai-translate-pdf">AI Translator</Link>,{" "}
            <Link to="/ai-ocr-pdf">AI OCR</Link>,{" "}
            <Link to="/ai-chat-pdf">Chat with PDF</Link> and{" "}
            <Link to="/ai-mcq-generator">AI MCQ Generator</Link> — to build a full
            content workflow.
          </p>

          <h3>Privacy &amp; Security</h3>
          <p>
            Your text is sent securely over HTTPS to our AI backend only to generate the
            rewrite. We do not store it, log it, or use it for model training. Nothing is
            shared with third parties beyond the AI inference call itself.
          </p>

          <h3>Tips for the best results</h3>
          <ul>
            <li>Paste cleanly formatted text — strip extra tabs or page numbers first.</li>
            <li>Use <em>Advanced</em> mode for content that needs to read as fully original.</li>
            <li>Humanize 1,000–2,000 words at a time for the tightest rewrite.</li>
            <li>Always re-read the output. Add a personal example, anecdote or stat to make it unmistakably yours.</li>
            <li>For long documents, combine with our <Link to="/extract-text">Extract Text</Link> tool to pull copy out of PDFs first.</li>
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
