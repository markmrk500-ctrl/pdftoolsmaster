import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FAQ } from "@/components/FAQ";
import { FileDropzone } from "@/components/FileDropzone";
import { Button } from "@/components/ui/button";
import { Loader2, BarChart3 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const faqs = [
  { question: "How is the word count calculated?", answer: "All extractable text is concatenated, then tokenized by whitespace. Image-only (scanned) PDFs may report zero words." },
  { question: "Are characters counted with or without spaces?", answer: "We report both — total characters including whitespace, and total characters excluding whitespace." },
  { question: "Can I count words on selected pages only?", answer: "This tool counts the entire document. Use Split PDF first if you need a subset." },
];

const WordCount = () => {
  const [file, setFile] = useState<File | null>(null);
  const [stats, setStats] = useState<{ words: number; chars: number; charsNoSpace: number; sentences: number; paragraphs: number; pages: number; readMin: number } | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    setStats(null);
    try {
      const bytes = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const c = await page.getTextContent();
        text += c.items.map((it: any) => it.str).join(" ") + "\n\n";
      }
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      const chars = text.length;
      const charsNoSpace = text.replace(/\s/g, "").length;
      const sentences = (text.match(/[.!?]+(\s|$)/g) || []).length;
      const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim()).length;
      const readMin = Math.max(1, Math.round(words / 200));
      setStats({ words, chars, charsNoSpace, sentences, paragraphs, pages: pdf.numPages, readMin });
      toast({ title: "Analysis complete" });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to analyze PDF", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageShell
      title="PDF Word Counter — Count Words, Pages & Reading Time Online Free | PDFMaster"
      description="Count words, characters, sentences, paragraphs, pages and estimated reading time in any PDF. Free, browser-based, instant analysis."
      keywords="pdf word counter, count words pdf, pdf statistics, reading time pdf, character count pdf"
      h1="PDF Word Counter & Statistics"
      intro="Get an instant breakdown of your PDF: word count, character count, sentences, paragraphs, pages, and estimated reading time."
      faqSchema={faqs}
      breadcrumbName="PDF Word Count"
      breadcrumbPath="/word-count"
      toolUI={
        <div className="space-y-6">
          <FileDropzone onFiles={(f) => setFile(f[0])} files={file ? [file] : []} onRemove={() => setFile(null)} />
          {file && (
            <Button size="lg" className="w-full" onClick={handleProcess} disabled={processing}>
              {processing ? (<><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>) : (<><BarChart3 className="h-4 w-4" /> Analyze PDF</>)}
            </Button>
          )}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
              {[
                ["Words", stats.words.toLocaleString()],
                ["Characters", stats.chars.toLocaleString()],
                ["Characters (no spaces)", stats.charsNoSpace.toLocaleString()],
                ["Sentences", stats.sentences.toLocaleString()],
                ["Paragraphs", stats.paragraphs.toLocaleString()],
                ["Pages", stats.pages.toLocaleString()],
                ["Reading time", `${stats.readMin} min`],
              ].map(([label, val]) => (
                <div key={label} className="bg-card border border-border rounded-xl p-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
                  <div className="text-2xl font-bold mt-1">{val}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      }
      seoContent={
        <>
          <h2>Why Count Words in a PDF?</h2>
          <p>
            Word count matters for editors, students, translators, lawyers, and content marketers alike. Translation rates are often quoted per word; academic essays have strict word limits; SEO writers track reading time. Yet PDF viewers rarely surface this information. This tool extracts every word from your document and produces a complete statistical breakdown in seconds.
          </p>
          <h3>Metrics Provided</h3>
          <ul>
            <li><strong>Words</strong> — whitespace-delimited tokens</li>
            <li><strong>Characters</strong> — total length including spaces and punctuation</li>
            <li><strong>Characters without spaces</strong> — for typographers and translators</li>
            <li><strong>Sentences</strong> — counted by terminal punctuation</li>
            <li><strong>Paragraphs</strong> — counted by blank-line breaks</li>
            <li><strong>Pages</strong> — total page count</li>
            <li><strong>Reading time</strong> — estimated at 200 words per minute</li>
          </ul>
          <h3>Limitations</h3>
          <p>
            Image-only or scanned PDFs contain no extractable text and will report zero words. Run them through OCR first to digitize the content.
          </p>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default WordCount;
