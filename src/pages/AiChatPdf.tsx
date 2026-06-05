import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Loader2, Send, Upload, FileText, X, Sparkles, RotateCcw, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { extractPdfPages, readAiStream } from "@/lib/aiToolCompat";


interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface PageChunk {
  page: number;
  text: string;
}

const MAX_CONTEXT_CHARS = 70000;

const faqs = [
  { question: "How does Chat with PDF work?", answer: "We extract the text from your PDF in your browser, then send your question along with the most relevant pages to a fast AI model. Answers include inline page citations like [p. 3] so you can jump back to the source." },
  { question: "Is my PDF private?", answer: "Text extraction happens locally in your browser. Only the text needed to answer your question is sent to the AI — never the file itself." },
  { question: "How are large PDFs handled?", answer: "For documents over ~70,000 characters we automatically pick the most relevant pages for each question using keyword scoring, so responses stay fast." },
  { question: "What file types are supported?", answer: "PDF files up to 150MB. Scanned PDFs without selectable text won't work — use the AI OCR tool first to extract text." },
];

// Pick the most relevant pages by keyword overlap with the user's question
const selectRelevantContext = (pages: PageChunk[], query: string): string => {
  const full = pages.map((p) => `[Page ${p.page}]\n${p.text}`).join("\n\n");
  if (full.length <= MAX_CONTEXT_CHARS) return full;

  const stop = new Set([
    "the", "a", "an", "and", "or", "but", "of", "in", "on", "to", "for", "is", "are", "was",
    "were", "what", "how", "when", "where", "why", "who", "which", "this", "that", "with",
    "from", "by", "at", "as", "it", "be", "do", "does", "did", "can", "has", "have", "i", "you",
  ]);
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !stop.has(w));

  const scored = pages.map((p) => {
    const lc = p.text.toLowerCase();
    let score = 0;
    for (const t of terms) {
      const idx = lc.indexOf(t);
      if (idx >= 0) score += 1 + Math.min(3, (lc.match(new RegExp(`\\b${t}\\b`, "g")) || []).length);
    }
    return { ...p, score };
  });

  scored.sort((a, b) => b.score - a.score || a.page - b.page);

  const selected: PageChunk[] = [];
  let total = 0;
  for (const p of scored) {
    const block = `[Page ${p.page}]\n${p.text}\n\n`;
    if (total + block.length > MAX_CONTEXT_CHARS) continue;
    selected.push(p);
    total += block.length;
    if (total > MAX_CONTEXT_CHARS * 0.95) break;
  }
  selected.sort((a, b) => a.page - b.page);
  return selected.map((p) => `[Page ${p.page}]\n${p.text}`).join("\n\n");
};

const AiChatPdf = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageChunk[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState(0);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const totalChars = useMemo(() => pages.reduce((s, p) => s + p.text.length, 0), [pages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const handleFile = async (f: File) => {
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      toast({ title: "PDF only", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }
    if (f.size > 150 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 150MB.", variant: "destructive" });
      return;
    }
    setFile(f);
    setMessages([]);
    setPages([]);
    setExtracting(true);
    setExtractProgress(0);
    try {
      const { pages: out, totalPages } = await extractPdfPages(f, setExtractProgress);
      const usable = out.filter((p) => p.text.length > 0);
      if (usable.length === 0) {
        throw new Error("No selectable text found. If this is a scanned PDF, use AI OCR first.");
      }
      setPages(out);
      toast({ title: "PDF ready", description: `${totalPages} pages indexed. Start chatting!` });
    } catch (e: any) {
      toast({ title: "Failed to read PDF", description: e?.message || "Try a different file.", variant: "destructive" });
      setFile(null);
      setPages([]);
    } finally {
      setExtracting(false);
      setTimeout(() => setExtractProgress(0), 800);
    }
  };

  const removeFile = () => {
    abortRef.current?.abort();
    setFile(null);
    setPages([]);
    setMessages([]);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || streaming || pages.length === 0) return;

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    // Add placeholder for assistant
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const context = selectRelevantContext(pages, text);
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat-pdf`;
      const resp = await fetch(url, {
        method: "POST",
        signal: ctrl.signal,
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages,
          context,
          fileName: file?.name,
        }),
      });

      let assistantText = "";
      assistantText = await readAiStream(resp, (_delta, fullText) => {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: fullText };
          return copy;
        });
      });

      if (!assistantText) {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content: "_(No response. Please try again.)_",
          };
          return copy;
        });
      }
    } catch (e: any) {
      if (e?.name === "AbortError") {
        setMessages((prev) => prev.slice(0, -1));
      } else {
        const msg = e?.message || "Something went wrong.";
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: `**Error:** ${msg}` };
          return copy;
        });
        toast({ title: "Chat failed", description: msg, variant: "destructive" });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      if (!window.matchMedia?.("(pointer: coarse)").matches) inputRef.current?.focus();
    }
  };

  const stop = () => abortRef.current?.abort();
  const resetChat = () => {
    abortRef.current?.abort();
    setMessages([]);
  };

  const suggestions = [
    "Summarize this document",
    "What are the key takeaways?",
    "Explain it like I'm new to the topic",
    "List any action items or recommendations",
  ];

  return (
    <ToolPageShell
      title="Chat with PDF AI Online Free – Ask Questions on Any Device | Master PDF Tools"
      description="Chat with any PDF using AI. Mobile-friendly, cross-browser, secure, and compatible with all devices, operating systems, and software versions."
      keywords="Chat with PDF, AI PDF Chat, Ask PDF Questions, PDF AI Assistant, Talk to PDF, PDF Q&A AI, Mobile PDF Chat, PDF Chatbot for All Devices, cross-platform pdf chat"
      h1="Chat with PDF — Works on Any Device"
      intro="Upload a PDF and ask it anything. Fast, markdown answers with page citations — mobile-friendly, cross-browser, and works on every device."
      faqSchema={faqs}
      breadcrumbName="Chat with PDF"
      breadcrumbPath="/ai-chat-pdf"
      toolUI={
        <div className="space-y-5">
          {!file ? (
            <label className="border-2 border-dashed border-border bg-card hover:border-primary/50 hover:bg-accent/30 rounded-2xl p-10 md:p-14 text-center cursor-pointer block transition-colors">
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <div className="flex flex-col items-center gap-3">
                <div className="h-14 w-14 rounded-full bg-accent flex items-center justify-center">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <p className="font-semibold text-base md:text-lg">Drop PDF here or click to upload</p>
                <p className="text-sm text-muted-foreground">Max 150MB · PDF only</p>
              </div>
            </label>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col h-[min(600px,calc(100vh-8rem))] min-h-[520px] max-[640px]:min-h-[460px]">
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-secondary/30">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {pages.length} pages · {(totalChars / 1000).toFixed(1)}k chars
                    {extracting && " · indexing…"}
                  </p>
                </div>
                {messages.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={resetChat} disabled={streaming} className="shrink-0">
                    <RotateCcw className="h-4 w-4" /> <span className="hidden sm:inline">Clear</span>
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={removeFile} aria-label="Remove file">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {extracting && (
                <div className="px-4 py-3 border-b border-border">
                  <Progress value={extractProgress} />
                  <p className="text-xs text-muted-foreground mt-1.5">Extracting text… {extractProgress}%</p>
                </div>
              )}

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-8">
                    <div className="h-14 w-14 rounded-full bg-accent flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Ask anything about this PDF</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Answers include page citations like [p. 3].
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md mt-2">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => setInput(s)}
                          disabled={extracting}
                          className="text-left text-sm rounded-lg border border-border bg-background px-3 py-2 hover:border-primary hover:bg-accent/30 transition-colors disabled:opacity-50"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <MessageBubble
                      key={i}
                      message={m}
                      isStreaming={streaming && i === messages.length - 1 && m.role === "assistant"}
                    />
                  ))
                )}
              </div>

              {/* Composer */}
              <div className="border-t border-border bg-background px-3 py-3">
                <div className="flex items-end gap-2">
                  <Textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder={extracting ? "Indexing PDF…" : "Ask anything about this PDF…"}
                    rows={1}
                    disabled={extracting}
                    className="min-h-[44px] max-h-40 resize-none"
                  />
                  {streaming ? (
                    <Button onClick={stop} variant="secondary" size="icon" aria-label="Stop">
                      <X className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={sendMessage}
                      disabled={!input.trim() || extracting}
                      size="icon"
                      aria-label="Send"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2 px-1">
                  AI can make mistakes. Verify important details against the source PDF.
                </p>
              </div>
            </div>
          )}
        </div>
      }
      seoContent={
        <>
          <h2>Chat with Any PDF Using AI</h2>
          <p>
            Stop scrolling through hundreds of pages. Upload your PDF — a research paper, contract, textbook, report, or manual — and ask questions in plain English. The AI reads the document and replies with a clear, markdown-formatted answer and inline page references so you can verify every claim.
          </p>
          <h3>How It Works</h3>
          <ol>
            <li>Upload a PDF up to 150MB. Text is extracted privately in your browser.</li>
            <li>Type a question. The most relevant pages are selected automatically for fast responses, even on large PDFs.</li>
            <li>Read the streamed answer with citations like <code>[p. 12]</code>, then ask follow-ups — the full conversation history is kept.</li>
          </ol>
          <h3>Great For</h3>
          <ul>
            <li>Researchers digesting long academic papers</li>
            <li>Legal & compliance teams searching contracts and policies</li>
            <li>Students studying textbooks and lecture notes</li>
            <li>Professionals reviewing whitepapers, manuals, and financial reports</li>
          </ul>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

const MessageBubble = ({ message, isStreaming }: { message: ChatMessage; isStreaming: boolean }) => {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
          isUser ? "bg-primary text-primary-foreground" : "bg-accent text-primary"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>
      <div className={cn("max-w-[85%] min-w-0", isUser && "text-right")}>
        {isUser ? (
          <div className="inline-block rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm whitespace-pre-wrap text-left">
            {message.content}
          </div>
        ) : (
          <div className="rounded-2xl rounded-tl-sm bg-secondary/60 px-4 py-3 text-sm">
            {message.content ? (
              <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-3 prose-pre:my-2 prose-ul:my-2 prose-ol:my-2">
                <ReactMarkdown>{message.content}</ReactMarkdown>
                {isStreaming && (
                  <span className="inline-block w-2 h-4 bg-primary/70 align-middle ml-0.5 animate-pulse" />
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="text-xs">Thinking…</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AiChatPdf;
