import { Link } from "react-router-dom";
import { Check, X, Minus } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";

type Cell = boolean | "limited" | string;

const competitors = ["PDFMaster", "iLovePDF", "Smallpdf", "Adobe Acrobat", "PDF24"] as const;

const rows: { feature: string; values: Cell[]; note?: string }[] = [
  { feature: "100% free, no signup required", values: [true, "limited", "limited", false, true] },
  { feature: "Unlimited file uploads per day", values: [true, false, false, "limited", true] },
  { feature: "No file size limit (browser-based)", values: [true, false, false, false, "limited"] },
  { feature: "Works fully offline after first load", values: [true, false, false, false, "limited"] },
  { feature: "All processing in your browser (private)", values: [true, "limited", "limited", false, "limited"] },
  { feature: "AI Chat with PDF (citations)", values: [true, false, false, "limited", false] },
  { feature: "AI Summarize PDF", values: [true, false, false, true, false] },
  { feature: "AI Translate PDF", values: [true, false, false, false, false] },
  { feature: "AI OCR for scanned PDFs", values: [true, "limited", true, true, "limited"] },
  { feature: "AI MCQ / quiz generator", values: [true, false, false, false, false] },
  { feature: "AI Humanizer (rewrite AI text)", values: [true, false, false, false, false] },
  { feature: "45+ PDF tools in one place", values: [true, true, true, true, true] },
  { feature: "No ads on tool pages", values: ["limited", false, false, true, false] },
  { feature: "No watermarks on output", values: [true, true, true, true, true] },
  { feature: "No desktop installer required", values: [true, true, true, false, true] },
  { feature: "Mobile-friendly responsive UI", values: [true, true, true, "limited", true] },
  { feature: "Customizable interface density", values: [true, false, false, false, false] },
  { feature: "Open privacy policy, no tracking sale", values: [true, "limited", "limited", "limited", true] },
  { feature: "Free forever (no paid tier needed)", values: [true, false, false, false, true] },
];

const renderCell = (v: Cell, isUs: boolean) => {
  if (v === true)
    return <Check className={`h-5 w-5 mx-auto ${isUs ? "text-success" : "text-muted-foreground"}`} />;
  if (v === false) return <X className="h-5 w-5 mx-auto text-destructive/70" />;
  if (v === "limited")
    return <Minus className="h-5 w-5 mx-auto text-orange-500" aria-label="Limited" />;
  return <span className="text-sm">{v}</span>;
};

const Compare = () => {
  const breadcrumbs = [{ name: "Compare PDFMaster vs alternatives", url: "/compare" }];

  return (
    <Layout>
      <Seo
        title="PDFMaster vs iLovePDF, Smallpdf, Adobe & PDF24 — Honest Comparison 2026"
        description="See how PDFMaster Tools compares against iLovePDF, Smallpdf, Adobe Acrobat and PDF24. 45+ free tools, no signup, AI features, and total privacy — side-by-side."
        keywords="pdfmaster vs ilovepdf, smallpdf alternative, ilovepdf alternative, free pdf tools comparison, best pdf website, adobe acrobat free alternative"
        breadcrumbs={breadcrumbs}
        faqSchema={[
          {
            question: "Is PDFMaster Tools really better than iLovePDF and Smallpdf?",
            answer:
              "For most users, yes. PDFMaster is 100% free with no daily limits or required signup, includes 6 AI tools (chat, summarize, translate, OCR, MCQ, humanizer) that iLovePDF and Smallpdf either lack or gate behind paid plans, and processes most files entirely in your browser for stronger privacy.",
          },
          {
            question: "Is PDFMaster Tools a free Adobe Acrobat alternative?",
            answer:
              "Yes. PDFMaster covers the everyday Acrobat workflows — merge, split, compress, convert, sign, protect, watermark, OCR and AI editing — without installing software and without an Adobe subscription.",
          },
          {
            question: "What can PDFMaster do that competitors can't?",
            answer:
              "AI Chat with PDF (with page citations), AI MCQ Generator, AI Humanizer, and a customizable interface density toggle are unique to PDFMaster among major free PDF sites.",
          },
          {
            question: "Are my files safe on PDFMaster?",
            answer:
              "Most PDF tools run client-side in your browser, meaning the file never leaves your device. AI tools that need server processing send only the text content over a secure connection and don't store your files.",
          },
        ]}
      />
      <Breadcrumbs items={breadcrumbs} />

      <div className="bg-gradient-to-b from-accent/40 to-background border-b border-border">
        <div className="container mx-auto px-4 py-12 md:py-16 text-center max-w-3xl">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            PDFMaster vs the PDF Giants
          </h1>
          <p className="text-base md:text-lg text-muted-foreground">
            An honest side-by-side comparison of PDFMaster Tools against iLovePDF,
            Smallpdf, Adobe Acrobat and PDF24 — features, limits, AI tools and pricing.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 md:py-14 max-w-5xl">
        <div className="overflow-x-auto rounded-2xl border border-border tool-card !p-0">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 sticky top-0">
              <tr>
                <th className="text-left p-4 font-semibold min-w-[240px]">Feature</th>
                {competitors.map((c) => (
                  <th
                    key={c}
                    className={`p-4 font-semibold text-center min-w-[110px] ${
                      c === "PDFMaster" ? "bg-primary/10 text-primary" : ""
                    }`}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.feature} className={i % 2 ? "bg-muted/30" : ""}>
                  <td className="p-4 font-medium">{r.feature}</td>
                  {r.values.map((v, j) => (
                    <td
                      key={j}
                      className={`p-4 text-center ${j === 0 ? "bg-primary/5" : ""}`}
                    >
                      {renderCell(v, j === 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Check className="h-4 w-4 text-success" /> Included
          </span>
          <span className="inline-flex items-center gap-1">
            <Minus className="h-4 w-4 text-orange-500" /> Limited / Paid plan only
          </span>
          <span className="inline-flex items-center gap-1">
            <X className="h-4 w-4 text-destructive/70" /> Not available
          </span>
        </div>

        <article className="prose prose-slate dark:prose-invert max-w-none mt-14">
          <h2>Why people switch from iLovePDF, Smallpdf and Adobe</h2>
          <p>
            The big PDF brands invented the category — and we respect that. But the
            free experience on iLovePDF and Smallpdf has become a constant nudge to
            upgrade. You hit a 1-2 task per hour limit, the file size cap, a 14-day
            "trial" countdown, or a paywall the moment you need OCR or batch
            processing. Adobe Acrobat is the gold standard for desktop power users,
            but a Pro subscription costs more per year than most people spend on
            software in total — and it requires a heavy install.
          </p>
          <p>
            PDFMaster Tools was built around a simple promise: every tool stays
            free, every day, on every device, with no signup required. Most
            operations run directly in your browser, which means your PDFs never
            leave your computer and processing is instant — even on a flaky
            connection.
          </p>

          <h2>How PDFMaster beats iLovePDF</h2>
          <ul>
            <li>
              <strong>No daily task limit.</strong> iLovePDF caps free users at one
              or two tasks per hour. PDFMaster has no per-hour or per-day cap.
            </li>
            <li>
              <strong>AI tools included.</strong> Our{" "}
              <Link to="/ai-chat-pdf">AI Chat with PDF</Link>,{" "}
              <Link to="/ai-summarize-pdf">AI Summarizer</Link>, and{" "}
              <Link to="/ai-translate-pdf">AI Translator</Link> are free. iLovePDF
              has none of these.
            </li>
            <li>
              <strong>Customizable density.</strong> Our interface has a Normal /
              Compact / Sleek toggle (in the top bar) so you can make the UI as
              dense or as spacious as you want.
            </li>
          </ul>

          <h2>How PDFMaster beats Smallpdf</h2>
          <ul>
            <li>
              <strong>No "14-day free trial" dark pattern.</strong> Smallpdf locks
              most tools behind a trial that requires a credit card. PDFMaster has
              no trial because nothing is paid.
            </li>
            <li>
              <strong>Unique AI features.</strong> Our{" "}
              <Link to="/ai-mcq-generator">MCQ generator</Link> and{" "}
              <Link to="/ai-humanizer">AI Humanizer</Link> have no Smallpdf
              equivalent.
            </li>
          </ul>

          <h2>How PDFMaster compares to Adobe Acrobat</h2>
          <ul>
            <li>
              <strong>Zero install.</strong> Acrobat needs a desktop install and a
              login. PDFMaster opens instantly in any browser on any OS.
            </li>
            <li>
              <strong>Free.</strong> Acrobat Pro is roughly $20/month. PDFMaster
              covers the everyday Acrobat workflows for free.
            </li>
            <li>
              <strong>Honest about limits.</strong> Some advanced legal-grade
              features (advanced redaction, enterprise e-signature workflows) are
              still Acrobat's strength — we don't pretend otherwise.
            </li>
          </ul>

          <h2>How PDFMaster compares to PDF24</h2>
          <p>
            PDF24 is the closest in spirit — both are genuinely free and
            browser-based. PDFMaster's edge is the AI tool suite (chat, summarize,
            translate, MCQ, humanizer), a cleaner mobile experience, and the
            interface density toggle.
          </p>

          <h2>Where the giants still win</h2>
          <p>
            We're not going to pretend we're better at everything. Adobe Acrobat
            still leads in advanced redaction, enterprise signature workflows, and
            deep PDF/A compliance work. iLovePDF and Smallpdf have larger brand
            recognition and longer track records. If you need enterprise SSO, audit
            logs, or a signed BAA for HIPAA, those vendors are the safer pick today.
          </p>

          <h2>Try us free — no signup, no card, no limits</h2>
          <p>
            Start with the tool you need below. If you'd rather browse all 45+
            tools, head to the <Link to="/">home page</Link>.
          </p>
          <div className="flex flex-wrap gap-3 not-prose">
            <Button asChild><Link to="/merge-pdf">Merge PDF</Link></Button>
            <Button asChild variant="outline"><Link to="/compress-pdf">Compress PDF</Link></Button>
            <Button asChild variant="outline"><Link to="/pdf-to-word">PDF to Word</Link></Button>
            <Button asChild variant="outline"><Link to="/ai-chat-pdf">Chat with PDF</Link></Button>
            <Button asChild variant="outline"><Link to="/ai-humanizer">AI Humanizer</Link></Button>
          </div>
        </article>
      </div>
    </Layout>
  );
};

export default Compare;
