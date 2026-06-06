import { useState } from "react";
import html2canvas from "html2canvas";
import { PDFDocument } from "pdf-lib";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Loader2, Globe } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const faqs = [
  {
    question: "How does HTML to PDF work?",
    answer:
      "The page content is rendered to an image in your browser using html2canvas, then placed onto an A4-sized PDF page.",
  },
  {
    question: "Will my JavaScript run?",
    answer:
      "Inline <script> tags are stripped for safety. Only static HTML and CSS are rendered.",
  },
  {
    question: "Can I convert a live website?",
    answer:
      "Browsers block cross-origin iframes from being rasterized. To convert a live site, paste its HTML source into the editor.",
  },
];

const A4 = { w: 595.28, h: 841.89 };

const HtmlToPdf = () => {
  const [html, setHtml] = useState(
    `<h1>Hello PDF</h1><p>Paste any HTML here and it will be rendered to a PDF.</p><ul><li>Items</li><li>Lists</li><li>Tables work too</li></ul>`
  );
  const [title, setTitle] = useState("document");
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<"html" | "url">("html");
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const renderHtmlToPdf = async (sourceHtml: string) => {
    const host = document.createElement("div");
    host.style.position = "fixed";
    host.style.left = "-99999px";
    host.style.top = "0";
    host.style.width = "794px";
    host.style.background = "#ffffff";
    host.style.color = "#000000";
    host.style.padding = "40px";
    host.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    host.innerHTML = sourceHtml.replace(/<script[\s\S]*?<\/script>/gi, "");
    document.body.appendChild(host);

    setProgress(50);
    const canvas = await html2canvas(host, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      allowTaint: false,
    });
    document.body.removeChild(host);
    setProgress(75);

    const pdf = await PDFDocument.create();
    const jpg = canvas.toDataURL("image/jpeg", 0.92);
    const jpgBytes = await (await fetch(jpg)).arrayBuffer();
    const img = await pdf.embedJpg(jpgBytes);

    const pxPerPoint = canvas.width / A4.w;
    const pageHeightPx = A4.h * pxPerPoint;
    const totalPages = Math.max(1, Math.ceil(canvas.height / pageHeightPx));

    for (let i = 0; i < totalPages; i++) {
      const page = pdf.addPage([A4.w, A4.h]);
      const yOffsetPx = i * pageHeightPx;
      const imgHeightPoints = canvas.height / pxPerPoint;
      const yPoints = -(imgHeightPoints - A4.h - yOffsetPx / pxPerPoint);
      page.drawImage(img, { x: 0, y: yPoints, width: A4.w, height: imgHeightPoints });
    }

    const out = await pdf.save();
    const blob = new Blob([out as BlobPart], { type: "application/pdf" });
    const link = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = link;
    a.download = (title || "document") + ".pdf";
    a.click();
    URL.revokeObjectURL(link);
  };

  const handleConvert = async () => {
    setProcessing(true);
    setProgress(10);
    try {
      let sourceHtml = html;
      if (mode === "url") {
        let normalized = url.trim();
        if (!normalized) throw new Error("Enter a URL");
        if (!/^https?:\/\//i.test(normalized)) normalized = "https://" + normalized;
        setProgress(25);
        const { data, error } = await supabase.functions.invoke("fetch-url", {
          body: { url: normalized },
        });
        if (error) throw error;
        if (!data?.html) throw new Error(data?.error || "Failed to fetch page");
        sourceHtml = data.html as string;
      }
      await renderHtmlToPdf(sourceHtml);
      setProgress(100);
      toast({ title: "PDF created", description: "File downloaded." });
    } catch (e) {
      console.error(e);
      toast({
        title: "Conversion failed",
        description: (e as Error)?.message || "Try again with different input.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  return (
    <ToolPageShell
      title="HTML to PDF Online Free – Convert HTML to PDF on Any Device | Master PDF Tools"
      description="Convert HTML pages and snippets to clean PDFs online. Mobile-friendly, cross-browser, secure, and compatible with all devices and software versions."
      keywords="HTML to PDF Online Free, Web Page to PDF Converter, HTML to PDF for All Devices, Mobile HTML to PDF, html to pdf, convert html to pdf, web page to pdf, html to pdf converter, render html pdf"
      h1="HTML to PDF Converter — Free Online"
      intro="Paste raw HTML or enter a URL and download it as a PDF rendered with styles intact, sliced across A4 pages."
      faqSchema={faqs}
      toolUI={
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">File name</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as "html" | "url")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="html">HTML source</TabsTrigger>
              <TabsTrigger value="url"><Globe className="h-4 w-4 mr-1" /> From URL</TabsTrigger>
            </TabsList>
            <TabsContent value="html" className="space-y-2 pt-4">
              <Label htmlFor="html">HTML source</Label>
              <textarea
                id="html"
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                rows={14}
                className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
              />
            </TabsContent>
            <TabsContent value="url" className="space-y-2 pt-4">
              <Label htmlFor="url">Web page URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                We fetch the page server-side and render the HTML to PDF. Pages that require login or rely heavily on JavaScript may not render fully.
              </p>
            </TabsContent>
          </Tabs>

          {processing && <Progress value={progress} />}

          <Button
            size="lg"
            className="w-full"
            disabled={processing || (mode === "html" ? !html.trim() : !url.trim())}
            onClick={handleConvert}
          >
            {processing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Converting...</>
            ) : (
              <><Download className="h-4 w-4" /> Convert to PDF</>
            )}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>How to Convert HTML to PDF — Complete Guide</h2>
          <p>
            HTML to PDF conversion is essential for generating receipts, invoices,
            reports, certificates, and styled documents from web markup. This tool
            renders your HTML (with inline CSS) at 2× resolution for sharp output, then
            slices it across A4 pages. Inline scripts are stripped for safety so you can
            paste markup from any source without security worries.
          </p>

          <h3>Step-by-Step: How to Convert HTML to PDF</h3>
          <ol>
            <li><strong>Set a file name</strong> for the output PDF.</li>
            <li><strong>Paste your HTML</strong> markup (inline CSS supported, scripts stripped).</li>
            <li><strong>Click Convert to PDF.</strong> The renderer captures your content and slices it into A4 pages.</li>
          </ol>

          <h3>Common Use Cases</h3>
          <ul>
            <li>Generating one-off invoices or receipts from an HTML template</li>
            <li>Creating certificates with custom names and dates</li>
            <li>Exporting blog drafts or articles as PDFs for sharing</li>
            <li>Producing styled reports from HTML email templates</li>
            <li>Converting documentation snippets into printable handouts</li>
          </ul>

          <h3>Tips for Clean Output</h3>
          <ul>
            <li>Use inline CSS (style attributes) or a single <code>&lt;style&gt;</code> block in the markup.</li>
            <li>Stick to web-safe fonts (system-ui, Arial, Georgia) for predictable rendering.</li>
            <li>Avoid fixed positioning and viewport units — use static layout for best A4 fit.</li>
            <li>Keep total content height reasonable; very tall documents take longer to render.</li>
          </ul>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default HtmlToPdf;
