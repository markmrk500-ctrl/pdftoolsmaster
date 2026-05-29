import { useState } from "react";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Download, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const faqs = [
  { question: "Which Markdown features are supported?", answer: "Headings, bold, italic, code, inline code, links, lists, blockquotes, and horizontal rules." },
  { question: "How is the PDF rendered?", answer: "Markdown is converted to HTML, styled, and printed via your browser's native print engine — completely offline." },
  { question: "Can I customize fonts?", answer: "The default theme uses a clean serif/sans pairing optimized for printing. Use your browser's print dialog to adjust margins." },
];

// minimal markdown -> html
const mdToHtml = (md: string): string => {
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = md.split("\n");
  let html = "";
  let inList: "ul" | "ol" | null = null;
  let inCode = false;
  let codeBuf: string[] = [];
  const flushList = () => { if (inList) { html += `</${inList}>`; inList = null; } };
  for (const raw of lines) {
    if (raw.trim().startsWith("```")) {
      if (inCode) { html += `<pre><code>${escape(codeBuf.join("\n"))}</code></pre>`; codeBuf = []; inCode = false; }
      else { flushList(); inCode = true; }
      continue;
    }
    if (inCode) { codeBuf.push(raw); continue; }
    let line = raw;
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { flushList(); html += `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`; continue; }
    if (/^\s*[-*]\s+/.test(line)) {
      if (inList !== "ul") { flushList(); html += "<ul>"; inList = "ul"; }
      html += `<li>${inline(line.replace(/^\s*[-*]\s+/, ""))}</li>`; continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      if (inList !== "ol") { flushList(); html += "<ol>"; inList = "ol"; }
      html += `<li>${inline(line.replace(/^\s*\d+\.\s+/, ""))}</li>`; continue;
    }
    if (/^---+$/.test(line)) { flushList(); html += "<hr/>"; continue; }
    if (line.trim().startsWith(">")) { flushList(); html += `<blockquote>${inline(line.replace(/^\s*>\s?/, ""))}</blockquote>`; continue; }
    flushList();
    if (line.trim() === "") { html += ""; continue; }
    html += `<p>${inline(line)}</p>`;
  }
  flushList();
  if (inCode) html += `<pre><code>${escape(codeBuf.join("\n"))}</code></pre>`;
  return html;

  function inline(s: string) {
    s = escape(s);
    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    return s;
  }
};

const MarkdownToPdf = () => {
  const [md, setMd] = useState("# Hello\n\nThis is **markdown** converted to a PDF.\n\n- Item one\n- Item two\n");
  const [processing, setProcessing] = useState(false);

  const handleGenerate = async () => {
    if (!md.trim()) return toast({ title: "Please enter some markdown", variant: "destructive" });
    setProcessing(true);
    try {
      const body = mdToHtml(md);
      const w = window.open("", "_blank");
      if (!w) throw new Error("Popup blocked");
      w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Document</title>
        <style>
          body { font-family: Georgia, serif; max-width: 720px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #111; }
          h1,h2,h3,h4 { font-family: -apple-system, Helvetica, Arial, sans-serif; }
          code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; font-family: Menlo, monospace; font-size: 0.9em; }
          pre { background: #f4f4f4; padding: 12px; border-radius: 6px; overflow-x: auto; }
          pre code { background: transparent; padding: 0; }
          blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 16px; color: #555; }
          a { color: #0366d6; }
          hr { border: none; border-top: 1px solid #ddd; margin: 24px 0; }
        </style></head><body>${body}<script>window.onload=()=>setTimeout(()=>window.print(),200);</script></body></html>`);
      w.document.close();
      toast({ title: "Print dialog opened", description: "Choose 'Save as PDF' as the destination." });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to generate", description: "Allow popups and try again.", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageShell
      title="Markdown to PDF Converter Online Free – Render .md on Any Device | Master PDF Tools"
      description="Convert Markdown files to beautifully rendered PDFs online. Mobile-friendly, cross-browser, secure, and compatible with all devices and software versions."
      keywords="Markdown to PDF Online Free, MD to PDF Converter, Markdown to PDF for All Devices, Mobile Markdown to PDF, markdown to pdf, md to pdf, convert markdown pdf, markdown converter, render md as pdf"
      h1="Markdown to PDF Converter"
      intro="Paste your Markdown and convert it to a beautifully styled PDF using your browser's native print engine — fast, offline, and free."
      faqSchema={faqs}
      breadcrumbName="Markdown to PDF"
      breadcrumbPath="/markdown-to-pdf"
      toolUI={
        <div className="space-y-4">
          <div>
            <Label htmlFor="md">Markdown</Label>
            <Textarea id="md" rows={14} value={md} onChange={(e) => setMd(e.target.value)} className="font-mono text-sm" />
          </div>
          <Button size="lg" className="w-full" onClick={handleGenerate} disabled={processing}>
            {processing ? (<><Loader2 className="h-4 w-4 animate-spin" /> Rendering...</>) : (<><Download className="h-4 w-4" /> Render & Save as PDF</>)}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>From Markdown to Print-Ready PDF</h2>
          <p>
            Markdown is the lingua franca of developers, technical writers, and note-takers. But sharing Markdown with non-technical readers requires a polished output — and PDF is the universal answer. This converter renders your Markdown into clean, typographically considered HTML, then opens your browser's print dialog so you can save it as a PDF in one click.
          </p>
          <h3>Supported Syntax</h3>
          <ul>
            <li>Headings (# through ######)</li>
            <li>Bold (**text**) and italic (*text*)</li>
            <li>Inline code (`code`) and fenced code blocks (```)</li>
            <li>Ordered and unordered lists</li>
            <li>Links [text](url) and blockquotes (&gt;)</li>
            <li>Horizontal rules (---)</li>
          </ul>
          <h3>How to Save as PDF</h3>
          <ol>
            <li>Paste your Markdown above.</li>
            <li>Click "Render & Save as PDF".</li>
            <li>In the print dialog, set destination to <strong>Save as PDF</strong>.</li>
            <li>Click Save and pick a location.</li>
          </ol>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default MarkdownToPdf;
