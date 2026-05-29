import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import { PDFDocument } from "pdf-lib";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Loader2, PenTool, Eraser } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const faqs = [
  {
    question: "Is the signature legally binding?",
    answer:
      "An image-based signature on a PDF is widely accepted, but legal status varies by jurisdiction and document type. For high-stakes contracts, use a certified e-signature provider.",
  },
  {
    question: "Where is the signature placed?",
    answer:
      "On the page you select, in the corner you choose, with adjustable size.",
  },
  {
    question: "Is my signature uploaded?",
    answer: "No. Both the PDF and your signature stay in your browser.",
  },
];

type Position = "br" | "bl" | "tr" | "tl";

const SignPdf = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [pageNum, setPageNum] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [position, setPosition] = useState<Position>("br");
  const [width, setWidth] = useState(180);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d")!.scale(ratio, ratio);
    padRef.current = new SignaturePad(canvas, { backgroundColor: "rgba(255,255,255,0)", penColor: "#0a0a0a" });
    return () => padRef.current?.off();
  }, []);

  const handleFiles = async (incoming: File[]) => {
    const f = incoming[0];
    setFiles([f]);
    try {
      const bytes = await f.arrayBuffer();
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      setPageCount(pdf.getPageCount());
      setPageNum(1);
    } catch {
      toast({ title: "Could not read PDF", variant: "destructive" });
      setFiles([]);
    }
  };

  const clearSig = () => padRef.current?.clear();

  const handleSign = async () => {
    if (!files[0] || !padRef.current) return;
    if (padRef.current.isEmpty()) {
      toast({ title: "Draw your signature first", variant: "destructive" });
      return;
    }
    setProcessing(true);
    setProgress(10);
    try {
      const sigDataUrl = padRef.current.toDataURL("image/png");
      const sigBytes = await (await fetch(sigDataUrl)).arrayBuffer();

      const bytes = await files[0].arrayBuffer();
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const png = await pdf.embedPng(sigBytes);
      const ratio = png.height / png.width;

      const target = pdf.getPage(pageNum - 1);
      const { width: pw, height: ph } = target.getSize();
      const w = Math.min(width, pw - 40);
      const h = w * ratio;
      const margin = 30;
      let x = pw - w - margin;
      let y = margin;
      if (position === "bl") x = margin;
      if (position === "tr") {
        x = pw - w - margin;
        y = ph - h - margin;
      }
      if (position === "tl") {
        x = margin;
        y = ph - h - margin;
      }
      target.drawImage(png, { x, y, width: w, height: h });

      setProgress(80);
      const out = await pdf.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = files[0].name.replace(/\.pdf$/i, "") + "-signed.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setProgress(100);
      toast({ title: "Signed", description: "Signed PDF downloaded." });
    } catch (e) {
      console.error(e);
      toast({ title: "Signing failed", variant: "destructive" });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  return (
    <ToolPageShell
      title="Sign PDF Online Free – Add eSignature to PDF on Any Device | Master PDF Tools"
      description="Add typed or drawn signatures to PDF online with full positioning control. Mobile-friendly, cross-browser, secure, and compatible with all devices and software versions."
      keywords="Sign PDF Online Free, eSignature PDF, PDF Signature Tool for All Devices, Mobile PDF Signature, Cross-platform PDF Sign, sign pdf, e-signature pdf, pdf signature, electronic signature, sign pdf online free, draw signature pdf"
      h1="Sign a PDF Online — Free E-Signature Tool"
      intro="Draw your signature and stamp it onto any page of your PDF — fully in your browser, no account required."
      faqSchema={faqs}
      toolUI={
        <div className="space-y-6">
          <FileDropzone
            files={files}
            onFiles={handleFiles}
            onRemove={() => {
              setFiles([]);
              setPageCount(0);
            }}
            cta="Drop a PDF here or click to upload"
            subtitle="One file at a time • Max 50MB"
          />

          <div className="space-y-2">
            <Label>Draw your signature</Label>
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <canvas ref={canvasRef} className="block w-full h-44 touch-none bg-secondary/30" />
            </div>
            <Button variant="outline" size="sm" onClick={clearSig}>
              <Eraser className="h-4 w-4" /> Clear
            </Button>
          </div>

          {pageCount > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="pn">Page (1–{pageCount})</Label>
                <Input
                  id="pn"
                  type="number"
                  min={1}
                  max={pageCount}
                  value={pageNum}
                  onChange={(e) => setPageNum(Math.min(pageCount, Math.max(1, parseInt(e.target.value) || 1)))}
                />
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Select value={position} onValueChange={(v) => setPosition(v as Position)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="br">Bottom right</SelectItem>
                    <SelectItem value="bl">Bottom left</SelectItem>
                    <SelectItem value="tr">Top right</SelectItem>
                    <SelectItem value="tl">Top left</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="w">Width (pt)</Label>
                <Input
                  id="w"
                  type="number"
                  min={60}
                  max={400}
                  value={width}
                  onChange={(e) => setWidth(parseInt(e.target.value) || 180)}
                />
              </div>
            </div>
          )}

          {processing && <Progress value={progress} />}

          <Button size="lg" className="w-full" disabled={!files[0] || processing} onClick={handleSign}>
            {processing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Signing...</>
            ) : (
              <><PenTool className="h-4 w-4" /> Sign & Download</>
            )}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>How to Sign a PDF Online — Complete Guide</h2>
          <p>
            Drawing your signature and adding it to a PDF takes seconds — upload the
            file, draw your signature on the pad with your mouse or finger, pick the
            page and corner, then download the signed document. Because everything
            happens in your browser, this is one of the safest ways to sign sensitive
            documents like NDAs, contracts, authorizations, and consent forms.
          </p>

          <h3>Step-by-Step: How to Sign a PDF</h3>
          <ol>
            <li><strong>Upload the PDF</strong> you need to sign.</li>
            <li><strong>Draw your signature</strong> in the signature pad — works with mouse, trackpad, or touchscreen.</li>
            <li><strong>Pick the target page</strong> and corner where the signature should appear.</li>
            <li><strong>Adjust the width</strong> to set how large your signature appears (in points).</li>
            <li><strong>Click Sign &amp; Download</strong> and your signed PDF arrives instantly.</li>
          </ol>

          <h3>Are Drawn Signatures Legally Binding?</h3>
          <p>
            In most jurisdictions (US under the ESIGN Act, EU under eIDAS as a "simple
            electronic signature"), drawn or image-based signatures are accepted for
            many contracts and consents. However, certain documents — wills, real
            estate transfers, court filings — may require notarization or a qualified
            e-signature provider. When in doubt, consult a lawyer.
          </p>

          <h3>Tips for a Great Digital Signature</h3>
          <ul>
            <li>Use a touchscreen or stylus for the most natural-looking signature.</li>
            <li>Sign slowly and steadily for cleaner lines.</li>
            <li>Keep your signature simple — overly complex strokes don't render well at small sizes.</li>
            <li>Use the Clear button if your first attempt isn't right.</li>
          </ul>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default SignPdf;
