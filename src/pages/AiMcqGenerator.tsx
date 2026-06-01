import { useMemo, useState } from "react";
import mammoth from "mammoth/mammoth.browser";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileDropzone } from "@/components/FileDropzone";
import { Sparkles, Loader2, ChevronLeft, ChevronRight, Check, X, RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { extractPdfText, readFileAsArrayBuffer, readFileAsText } from "@/lib/aiToolCompat";


interface McqQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

type Provider = "openai" | "gemini";

const SUBJECTS = [
  "Biology",
  "Chemistry",
  "Physics",
  "Mathematics",
  "Computer Science",
  "English",
  "Business",
  "Medical",
  "Engineering",
  "Law",
  "History",
  "Economics",
  "Accounting",
] as const;

const CUSTOM = "__custom__";

const faqs = [
  { question: "Which file types are supported?", answer: "PDF, DOCX, and TXT files up to 50MB. You can also paste raw text directly." },
  { question: "Why do I need to pick a subject?", answer: "The subject tunes the AI to use the right terminology, notation, and difficulty for your field — so MCQs from a Biology PDF feel like real Biology questions, not generic ones." },
  { question: "How are the questions generated?", answer: "Your selected content plus your chosen subject are sent to our AI (OpenAI GPT-5 or Google Gemini). The model writes 4-option MCQs with one correct answer and an explanation." },
  { question: "Can I limit which pages are used?", answer: "Yes. For PDFs you can specify a page range (e.g. 3-12). Only that portion of the document is sent to the AI." },
  { question: "How many questions can I generate?", answer: "Between 5 and 50 questions per quiz. Larger quizzes take a few extra seconds." },
];

const extractDocxText = async (file: File) => {
  const buf = await readFileAsArrayBuffer(file);
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return result.value;
};

const extractTxtText = async (file: File) => await readFileAsText(file);

const AiMcqGenerator = () => {
  const [mode, setMode] = useState<"file" | "paste">("file");
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [fromPage, setFromPage] = useState<number | "">("");
  const [toPage, setToPage] = useState<number | "">("");
  const [count, setCount] = useState(10);
  const [provider, setProvider] = useState<Provider>("gemini");
  const [subjectChoice, setSubjectChoice] = useState<string>("Biology");
  const [customSubject, setCustomSubject] = useState("");

  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [questions, setQuestions] = useState<McqQuestion[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const isPdf = file?.name.toLowerCase().endsWith(".pdf");
  const isDocx = file?.name.toLowerCase().endsWith(".docx");
  const isTxt = file?.name.toLowerCase().endsWith(".txt");

  const score = useMemo(() => {
    if (!submitted) return 0;
    return answers.reduce(
      (acc, a, i) => acc + (a !== null && a === questions[i]?.correctIndex ? 1 : 0),
      0
    );
  }, [submitted, answers, questions]);

  const reset = () => {
    setQuestions([]);
    setAnswers([]);
    setCurrentIdx(0);
    setSubmitted(false);
    setError(null);
  };

  const handleFiles = (files: File[]) => {
    const f = files[0];
    if (!f) return;
    const name = f.name.toLowerCase();
    if (!(name.endsWith(".pdf") || name.endsWith(".docx") || name.endsWith(".txt"))) {
      toast({ title: "Unsupported file", description: "Please upload a PDF, DOCX, or TXT file.", variant: "destructive" });
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 50MB.", variant: "destructive" });
      return;
    }
    setFile(f);
    setFromPage("");
    setToPage("");
    reset();
  };

  const handleGenerate = async () => {
    setError(null);
    setProcessing(true);
    setProgress(5);
    reset();
    try {
      let text = "";
      if (mode === "paste") {
        text = pastedText.trim();
      } else if (file) {
        if (isPdf) {
          const { text: t } = await extractPdfText(file, {
            fromPage: Number(fromPage) || 1,
            toPage: Number(toPage) || 0,
            onProgress: (p) => setProgress(5 + Math.round(p * 0.5)),
          });
          text = t;
        } else if (isDocx) {
          setProgress(30);
          text = await extractDocxText(file);
        } else if (isTxt) {
          setProgress(30);
          text = await extractTxtText(file);
        }
      }

      if (!text || text.trim().length < 100) {
        throw new Error("Not enough text found. Please use a longer source or different page range.");
      }

      const subject =
        subjectChoice === CUSTOM ? customSubject.trim() : subjectChoice;
      if (!subject) {
        throw new Error("Please choose a subject (or enter a custom one).");
      }

      setProgress(70);
      const { data, error: fnError } = await supabase.functions.invoke("ai-mcq", {
        body: { text, count, provider, subject },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      const qs: McqQuestion[] = data?.questions ?? [];
      if (qs.length === 0) throw new Error("AI returned no questions. Please retry.");

      setQuestions(qs);
      setAnswers(new Array(qs.length).fill(null));
      setCurrentIdx(0);
      setProgress(100);
      toast({ title: `Generated ${qs.length} questions` });
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || "Generation failed. Please try again.";
      setError(msg);
      toast({ title: "Generation failed", description: msg, variant: "destructive" });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1200);
    }
  };

  const selectOption = (optionIdx: number) => {
    if (submitted) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIdx] = optionIdx;
      return next;
    });
  };

  const allAnswered = answers.length > 0 && answers.every((a) => a !== null);
  const subjectReady =
    subjectChoice !== CUSTOM || customSubject.trim().length >= 2;
  const canGenerate =
    !processing &&
    subjectReady &&
    ((mode === "paste" && pastedText.trim().length >= 100) || (mode === "file" && !!file));

  return (
    <ToolPageShell
      title="AI MCQ Generator Online Free – Create Quizzes from PDF on Any Device | Master PDF Tools"
      description="Generate multiple-choice quizzes from PDF, DOCX, or text using AI. Mobile-friendly, cross-browser, secure, and compatible with all devices and software versions."
      keywords="AI MCQ Generator, Quiz from PDF, AI Quiz Maker, MCQ Generator Online Free, Study Quiz Generator, Mobile Quiz Maker, MCQ Generator for All Devices, Subject-specific MCQ AI, cross-platform quiz tool"
      h1="AI MCQ Generator — Works on Any Device"
      intro="Turn any PDF, DOCX, TXT, or pasted text into a subject-specific multiple-choice quiz with instant scoring. Mobile-friendly and cross-browser on every device."
      faqSchema={faqs}
      breadcrumbName="AI MCQ Generator"
      breadcrumbPath="/ai-mcq-generator"
      toolUI={
        <div className="space-y-6">
          {questions.length === 0 ? (
            <>
              <Tabs value={mode} onValueChange={(v) => setMode(v as "file" | "paste")}>
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="file">Upload File</TabsTrigger>
                  <TabsTrigger value="paste">Paste Text</TabsTrigger>
                </TabsList>
                <TabsContent value="file" className="space-y-4 pt-4">
                  <div
                    onDrop={(e) => {
                      e.preventDefault();
                      const files = Array.from(e.dataTransfer.files);
                      if (files[0]) handleFiles(files);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <FileDropzoneAny
                      file={file}
                      onFile={(f) => handleFiles(f ? [f] : [])}
                      onRemove={() => setFile(null)}
                    />
                  </div>
                  {file && isPdf && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="from-page">From page</Label>
                        <Input
                          id="from-page"
                          type="number"
                          min={1}
                          placeholder="1"
                          value={fromPage}
                          onChange={(e) => setFromPage(e.target.value ? Number(e.target.value) : "")}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="to-page">To page</Label>
                        <Input
                          id="to-page"
                          type="number"
                          min={1}
                          placeholder="last"
                          value={toPage}
                          onChange={(e) => setToPage(e.target.value ? Number(e.target.value) : "")}
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="paste" className="pt-4">
                  <Textarea
                    placeholder="Paste at least 100 characters of source text here…"
                    rows={10}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-2">{pastedText.length} characters</p>
                </TabsContent>
              </Tabs>

              <div className="space-y-1.5">
                <Label htmlFor="subject">Subject / Category</Label>
                <Select value={subjectChoice} onValueChange={setSubjectChoice}>
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Choose a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                    <SelectItem value={CUSTOM}>Custom subject…</SelectItem>
                  </SelectContent>
                </Select>
                {subjectChoice === CUSTOM && (
                  <Input
                    autoFocus
                    placeholder="e.g. Constitutional Law, Organic Chemistry, Machine Learning"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    maxLength={80}
                    className="mt-2"
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  The AI tailors terminology, notation, and difficulty to this subject.
                </p>
              </div>


              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="count">Number of questions</Label>
                  <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
                    <SelectTrigger id="count"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[5, 10, 15, 20, 25, 30, 40, 50].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n} questions</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="provider">AI model</Label>
                  <Select value={provider} onValueChange={(v) => setProvider(v as Provider)}>
                    <SelectTrigger id="provider"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini">Google Gemini (fast)</SelectItem>
                      <SelectItem value="openai">OpenAI GPT-5 mini</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {processing && <Progress value={progress} />}
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2">
                  {error}
                </div>
              )}

              <Button size="lg" className="w-full" disabled={!canGenerate} onClick={handleGenerate}>
                {processing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating quiz…</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Generate Quiz</>
                )}
              </Button>
            </>
          ) : !submitted ? (
            <QuizView
              questions={questions}
              answers={answers}
              currentIdx={currentIdx}
              setCurrentIdx={setCurrentIdx}
              selectOption={selectOption}
              allAnswered={allAnswered}
              onSubmit={() => setSubmitted(true)}
              onReset={reset}
            />
          ) : (
            <ResultsView
              questions={questions}
              answers={answers}
              score={score}
              onReset={reset}
            />
          )}
        </div>
      }
      seoContent={
        <>
          <h2>Turn Any Document Into a Quiz in Seconds</h2>
          <p>
            The AI MCQ Generator reads your study material — a textbook PDF, lecture notes, meeting transcript, or pasted article — and writes randomized multiple-choice questions to test what you actually understood. Each question has four options, one correct answer, and a short explanation pulled from the source.
          </p>
          <h3>How It Works</h3>
          <ol>
            <li>Upload a PDF, DOCX, or TXT file — or paste raw text.</li>
            <li>Optionally choose a page range and pick how many questions you want (5–50).</li>
            <li>Take the quiz, navigate with previous and next, and submit when ready.</li>
            <li>See your score, percentage, correct vs wrong answers, and per-question explanations.</li>
          </ol>
          <h3>Great For</h3>
          <ul>
            <li>Students preparing for exams from textbooks and lecture notes</li>
            <li>Teachers building practice quizzes from course materials</li>
            <li>Corporate training and compliance refreshers</li>
            <li>Self-study from articles, whitepapers, and research papers</li>
          </ul>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

// Small wrapper so we can accept PDF/DOCX/TXT (the shared FileDropzone is PDF-only)
const FileDropzoneAny = ({
  file,
  onFile,
  onRemove,
}: {
  file: File | null;
  onFile: (f: File | null) => void;
  onRemove: () => void;
}) => {
  return (
    <div className="space-y-3">
      <label className="border-2 border-dashed border-border bg-card hover:border-primary/50 hover:bg-accent/30 rounded-2xl p-10 md:p-14 text-center cursor-pointer block transition-colors">
        <input
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
        <div className="flex flex-col items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <p className="font-semibold">Drop PDF, DOCX or TXT here, or click to upload</p>
          <p className="text-sm text-muted-foreground">Max 50MB</p>
        </div>
      </label>
      {file && (
        <div className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onRemove}>Remove</Button>
        </div>
      )}
    </div>
  );
};

const QuizView = ({
  questions,
  answers,
  currentIdx,
  setCurrentIdx,
  selectOption,
  allAnswered,
  onSubmit,
  onReset,
}: {
  questions: McqQuestion[];
  answers: (number | null)[];
  currentIdx: number;
  setCurrentIdx: (i: number) => void;
  selectOption: (i: number) => void;
  allAnswered: boolean;
  onSubmit: () => void;
  onReset: () => void;
}) => {
  const q = questions[currentIdx];
  const answered = answers.filter((a) => a !== null).length;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Question {currentIdx + 1} of {questions.length}</span>
        <span className="text-muted-foreground">{answered}/{questions.length} answered</span>
      </div>
      <Progress value={(answered / questions.length) * 100} />

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold text-lg mb-4">{q.question}</h3>
        <div className="space-y-2">
          {q.options.map((opt, i) => {
            const selected = answers[currentIdx] === i;
            return (
              <button
                key={i}
                onClick={() => selectOption(i)}
                className={cn(
                  "w-full text-left rounded-lg border px-4 py-3 transition-colors flex items-start gap-3",
                  selected
                    ? "border-primary bg-accent"
                    : "border-border hover:border-primary/50 hover:bg-accent/30"
                )}
              >
                <span className={cn(
                  "h-6 w-6 shrink-0 rounded-full border flex items-center justify-center text-xs font-semibold",
                  selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
                )}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIdx(i)}
            className={cn(
              "h-8 w-8 rounded-md text-xs font-medium border transition-colors",
              i === currentIdx
                ? "border-primary bg-primary text-primary-foreground"
                : answers[i] !== null
                  ? "border-primary/40 bg-accent text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        {currentIdx < questions.length - 1 ? (
          <Button onClick={() => setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1))}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={onSubmit} disabled={!allAnswered}>
            Submit Quiz
          </Button>
        )}
      </div>

      <div className="text-center">
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw className="h-3.5 w-3.5" /> Start over
        </Button>
      </div>
    </div>
  );
};

const ResultsView = ({
  questions,
  answers,
  score,
  onReset,
}: {
  questions: McqQuestion[];
  answers: (number | null)[];
  score: number;
  onReset: () => void;
}) => {
  const pct = Math.round((score / questions.length) * 100);
  const passed = pct >= 60;
  return (
    <div className="space-y-6">
      <div className={cn(
        "rounded-2xl border p-6 text-center",
        passed ? "border-success/40 bg-success/10" : "border-destructive/30 bg-destructive/5"
      )}>
        <p className="text-sm text-muted-foreground">Your score</p>
        <p className="text-4xl font-bold mt-1">{score} / {questions.length}</p>
        <p className={cn("text-2xl font-semibold mt-1", passed ? "text-success" : "text-destructive")}>
          {pct}%
        </p>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => {
          const userAns = answers[i];
          const isCorrect = userAns === q.correctIndex;
          return (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className={cn(
                  "h-7 w-7 shrink-0 rounded-full flex items-center justify-center",
                  isCorrect ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                )}>
                  {isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </div>
                <h4 className="font-semibold">
                  <span className="text-muted-foreground mr-1">Q{i + 1}.</span>
                  {q.question}
                </h4>
              </div>
              <div className="space-y-2 ml-10">
                {q.options.map((opt, oi) => {
                  const isRight = oi === q.correctIndex;
                  const isUserPick = oi === userAns;
                  return (
                    <div
                      key={oi}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm flex items-start gap-2",
                        isRight && "border-success bg-success/10 text-success-foreground",
                        !isRight && isUserPick && "border-destructive bg-destructive/10",
                        !isRight && !isUserPick && "border-border"
                      )}
                    >
                      <span className={cn("font-semibold w-5", isRight && "text-success")}>{String.fromCharCode(65 + oi)}.</span>
                      <span className={cn("flex-1", isRight && "text-success font-medium")}>{opt}</span>
                      {isRight && <Check className="h-4 w-4 text-success shrink-0" />}
                      {!isRight && isUserPick && <X className="h-4 w-4 text-destructive shrink-0" />}
                    </div>
                  );
                })}
              </div>
              {q.explanation && (
                <div className="mt-3 ml-10 text-sm text-muted-foreground border-l-2 border-success/40 pl-3">
                  <span className="font-medium text-foreground">Explanation: </span>{q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Button className="w-full" size="lg" onClick={onReset}>
        <RotateCcw className="h-4 w-4" /> Generate a new quiz
      </Button>
    </div>
  );
};

export default AiMcqGenerator;
