import { useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2, AlignVerticalSpaceAround } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const faqs = [
  { question: "Can I add both a header and footer?", answer: "Yes. Fill in either or both fields. Empty fields are skipped." },
  { question: "Where is the text positioned?", answer: "Headers are placed 30 points from the top edge, footers 30 points from the bottom — centered horizontally." },
  { question: "What font and size are used?", answer: "Helvetica at 10pt, in dark gray. This keeps text discreet but legible." },
];

const HeaderFooter = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [header, setHeader] = useState("");
  const [footer, setFooter] = useState("");
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const handleApply = async () => {
    if (!files[0] || (!header && !footer)) {
      toast({ title: "Enter header or footer text", variant: "destructive" });
      return;
    }
    setProcessing(true);
    setProgress(10);
    try {
      const bytes = await files[0].arrayBuffer();
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const size = 10;
      pdf.getPages().forEach((p) => {
        const { width, height } = p.getSize();
        if (header) {
          const w = font.widthOfTextAtSize(header, size);
          p.drawText(header, { x: (width - w) / 2, y: height - 30, size, font, color: rgb(0.3, 0.3, 0.3) });
        }
        if (footer) {
          const w = font.widthOfTextAtSize(footer, size);
          p.drawText(footer, { x: (width - w) / 2, y: 20, size, font, color: rgb(0.3, 0.3, 0.3) });
        }
      });
      setProgress(80);
      const out = await pdf.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = files[0].name.replace(/\.pdf$/i, "") + "-headed.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setProgress(100);
      toast({ title: "Done", description: "PDF downloaded." });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed", variant: "destructive" });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  return (
    <ToolPageShell
      title="Add Header and Footer to PDF Online Free – Works on Any Device | Master PDF Tools"
      description="Add custom headers and footers to PDF pages online. Mobile-friendly, cross-browser, secure, and compatible with all devices and software versions."
      keywords="Add Header Footer to PDF Online Free, PDF Header Footer Tool for All Devices, Mobile PDF Header Footer, add header to pdf, add footer to pdf, pdf header footer, page header pdf, document footer"
      h1="Add Header & Footer to PDF"
      intro="Stamp a custom header and footer on every page of your document — perfect for branded reports, drafts, and confidential documents."
      faqSchema={faqs}
      breadcrumbName="Add Header & Footer"
      breadcrumbPath="/header-footer"
      toolUI={
        <div className="space-y-6">
          <FileDropzone onFiles={setFiles} files={files} onRemove={() => setFiles([])} />
          <div className="grid gap-4">
            <div>
              <Label htmlFor="hdr">Header text</Label>
              <Input id="hdr" value={header} onChange={(e) => setHeader(e.target.value)} placeholder="e.g. Confidential — Acme Inc." />
            </div>
            <div>
              <Label htmlFor="ftr">Footer text</Label>
              <Input id="ftr" value={footer} onChange={(e) => setFooter(e.target.value)} placeholder="e.g. © 2026 Acme Inc. — Page Draft" />
            </div>
          </div>
          {processing && <Progress value={progress} />}
          <Button size="lg" className="w-full" disabled={!files.length || processing} onClick={handleApply}>
            {processing ? (<><Loader2 className="h-4 w-4 animate-spin" /> Applying...</>) : (<><AlignVerticalSpaceAround className="h-4 w-4" /> Apply Header & Footer</>)}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>Add Headers and Footers to a PDF — Branded, Consistent, Professional</h2>
          <p>
            Headers and footers turn an ordinary PDF into a branded, navigable, professional document. Whether you need to mark a draft as confidential, attach a copyright line, indicate a project code on every page of a proposal, or just add a discreet watermark of your company name, this tool stamps your text on every page in seconds.
          </p>
          <h3>How to Add a Header or Footer</h3>
          <ol>
            <li><strong>Upload</strong> your PDF.</li>
            <li><strong>Type your header and/or footer text</strong> in the fields below the dropzone.</li>
            <li><strong>Click Apply.</strong> A new PDF is generated with the text on every page.</li>
          </ol>
          <h3>Common Use Cases</h3>
          <ul>
            <li>Marking documents as "Draft", "Confidential" or "Internal Use Only"</li>
            <li>Adding company name, copyright line, or contact info</li>
            <li>Labeling proposals with client name and project code</li>
            <li>Inserting version numbers across long technical documents</li>
            <li>Adding citation info or document IDs for archive purposes</li>
          </ul>
          <h3>Tips</h3>
          <ul>
            <li>Keep header/footer text short — long lines may extend beyond margins.</li>
            <li>Use the <a href="/page-numbers">Page Numbers</a> tool to add automated numbering.</li>
            <li>For per-page custom text, split the document, stamp, and re-merge.</li>
          </ul>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default HeaderFooter;
