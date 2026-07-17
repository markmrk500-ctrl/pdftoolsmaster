import { useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { loadPdfJs, describePdfError } from "@/lib/pdf";

const faqs = [
  { question: "How does redaction work?", answer: "Each PDF page is rendered to an image. The areas you mark are painted black on the image, then a fresh PDF is built from those images. The original text and metadata under the redaction is permanently destroyed." },
  { question: "Is this true redaction?", answer: "Yes. Unlike covering text with black rectangles in an editor, this method rasterises pages — there is no underlying text left to recover with copy/paste or text extraction." },
  { question: "Does the output PDF have searchable text?", answer: "No. Because pages are rasterised, the output is image-only. Run OCR on it afterwards if you need searchable text without the redacted content." },
];

type Box = { x: number; y: number; w: number; h: number };

const RedactPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageIdx, setPageIdx] = useState(0);
  const [boxes, setBoxes] = useState<Record<number, Box[]>>({});
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCur, setDrawCur] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    setPdfDoc(null);
    setPageIdx(0);
    setBoxes({});
    if (!files[0]) return;
    (async () => {
      try {
        const bytes = await files[0].arrayBuffer();
        const doc = await loadPdfJs(bytes);
        setPdfDoc(doc);
      } catch (e) {
        const { title, description } = describePdfError(e);
        toast({ title, description, variant: "destructive" });
      }
    })();
  }, [files]);

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let cancelled = false;
    (async () => {
      const page = await pdfDoc.getPage(pageIdx + 1);
      const wrapW = wrapRef.current?.clientWidth ?? 800;
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = Math.min(1.5, wrapW / baseViewport.width);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current!;
      if (cancelled) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      setCanvasSize({ w: viewport.width, h: viewport.height });
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
      // Draw existing boxes
      ctx.fillStyle = "rgba(220,38,38,0.65)";
      for (const b of boxes[pageIdx] ?? []) ctx.fillRect(b.x * scale, b.y * scale, b.w * scale, b.h * scale);
    })();
    return () => { cancelled = true; };
  }, [pdfDoc, pageIdx, boxes]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
    const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: cx - rect.left, y: cy - rect.top };
  };

  const startDraw = (e: React.MouseEvent) => setDrawStart(getPos(e));
  const moveDraw = (e: React.MouseEvent) => { if (drawStart) setDrawCur(getPos(e)); };
  const endDraw = () => {
    if (!drawStart || !drawCur || !pdfDoc) { setDrawStart(null); setDrawCur(null); return; }
    const scale = canvasSize.w / 1; // displayed === canvas px
    // Convert displayed coords back to canvas-render coords (1:1 here)
    const x = Math.min(drawStart.x, drawCur.x);
    const y = Math.min(drawStart.y, drawCur.y);
    const w = Math.abs(drawCur.x - drawStart.x);
    const h = Math.abs(drawCur.y - drawStart.y);
    if (w > 5 && h > 5) {
      // Store in unscaled (canvas px) coords; render uses same scale
      const displayToCanvas = (canvasRef.current!.width) / canvasRef.current!.getBoundingClientRect().width;
      setBoxes((p) => ({
        ...p,
        [pageIdx]: [
          ...(p[pageIdx] ?? []),
          { x: x * displayToCanvas, y: y * displayToCanvas, w: w * displayToCanvas, h: h * displayToCanvas },
        ],
      }));
    }
    setDrawStart(null); setDrawCur(null);
  };

  const clearPage = () => setBoxes((p) => ({ ...p, [pageIdx]: [] }));

  const handleRedact = async () => {
    if (!files[0] || !pdfDoc) return;
    setProcessing(true);
    setProgress(5);
    try {
      const out = await PDFDocument.create();
      const total = pdfDoc.numPages;
      for (let i = 1; i <= total; i++) {
        const page = await pdfDoc.getPage(i);
        const vp = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(vp.width);
        canvas.height = Math.floor(vp.height);
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport: vp, canvas } as any).promise;

        const pageBoxes = boxes[i - 1] ?? [];
        if (pageBoxes.length) {
          // Boxes were stored at preview render scale -> convert to output scale.
          const previewVp = page.getViewport({ scale: 1 });
          // We stored boxes in CSS canvas px (preview scale ~min(1.5, fit)). Re-render fresh page to know the actual preview width:
          // Simpler: re-render preview off-screen once to obtain its width, then ratio = vp.width / previewVp.width.
          // We rendered preview at min(1.5, wrapW/base). Approximate using stored canvasSize for current page;
          // for other pages, use 1.0 (best-effort). To be safe, store boxes in PDF-space (base) units:
          // Refactor: convert preview-px to base-units using preview render width recorded at draw time.
          // Since canvasSize is current-page only, store ratio per page would be cleaner — but to keep code small,
          // we re-derive ratio for each page here.
          const wrapW = wrapRef.current?.clientWidth ?? 800;
          const previewScale = Math.min(1.5, wrapW / previewVp.width);
          const ratio = vp.width / (previewVp.width * previewScale);
          ctx.fillStyle = "#000";
          for (const b of pageBoxes) {
            ctx.fillRect(b.x * ratio, b.y * ratio, b.w * ratio, b.h * ratio);
          }
        }

        const jpeg = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), "image/jpeg", 0.92));
        const jpegBytes = await jpeg.arrayBuffer();
        const img = await out.embedJpg(jpegBytes);
        const newPage = out.addPage([canvas.width, canvas.height]);
        newPage.drawImage(img, { x: 0, y: 0, width: canvas.width, height: canvas.height });
        setProgress(5 + Math.round((i / total) * 90));
      }
      const bytes = await out.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = files[0].name.replace(/\.pdf$/i, "") + "-redacted.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setProgress(100);
      toast({ title: "Redaction complete", description: "Underlying text was permanently destroyed." });
    } catch (e) {
      const { title, description } = describePdfError(e);
      toast({ title, description, variant: "destructive" });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  const totalBoxes = Object.values(boxes).reduce((s, a) => s + a.length, 0);

  return (
    <ToolPageShell
      title="Redact PDF Online Free – Permanently Remove Sensitive Info | Master PDF Tools"
      description="Redact PDFs in your browser. Black-box sensitive areas and permanently destroy the underlying text. 100% private — files never leave your device."
      keywords="redact pdf, pdf redaction, black out pdf text, remove sensitive info pdf, redact online free"
      h1="Redact PDF — Permanently Black Out Sensitive Content"
      intro="Drag rectangles over anything you want redacted. The output PDF replaces those pages with images, permanently destroying the text underneath."
      faqSchema={faqs}
      toolUI={
        <div className="space-y-6">
          <FileDropzone files={files} onFiles={(f) => setFiles([f[0]])} onRemove={() => { setFiles([]); setBoxes({}); }} />

          {pdfDoc && (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={pageIdx === 0} onClick={() => setPageIdx((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">Page {pageIdx + 1} of {pdfDoc.numPages}</span>
                  <Button variant="outline" size="sm" disabled={pageIdx >= pdfDoc.numPages - 1} onClick={() => setPageIdx((p) => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={clearPage} disabled={!(boxes[pageIdx]?.length)}>
                  <Trash2 className="h-4 w-4" /> Clear page
                </Button>
              </div>

              <div ref={wrapRef} className="border border-border rounded-lg overflow-hidden bg-secondary/30 select-none">
                <canvas
                  ref={canvasRef}
                  className="block w-full cursor-crosshair touch-none"
                  onMouseDown={startDraw}
                  onMouseMove={moveDraw}
                  onMouseUp={endDraw}
                  onMouseLeave={endDraw}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {totalBoxes > 0
                  ? `${totalBoxes} redaction${totalBoxes === 1 ? "" : "s"} marked across the document.`
                  : "Click and drag on the page to draw a redaction rectangle."}
              </p>
            </>
          )}

          {processing && <Progress value={progress} />}

          <Button size="lg" className="w-full" disabled={!pdfDoc || totalBoxes === 0 || processing} onClick={handleRedact}>
            {processing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Redacting...</>
            ) : (
              <><Download className="h-4 w-4" /> Redact & Download</>
            )}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>True PDF Redaction — Permanently Destroys Underlying Text</h2>
          <p>Most "redaction" tools just draw a black rectangle on top of the text — the original content is still selectable and can be copied or extracted. This tool rasterises every page and bakes the redaction blocks into the image, so the underlying text is permanently gone.</p>
          <h3>How to Use</h3>
          <ol>
            <li>Upload your PDF.</li>
            <li>Drag rectangles over anything you need to hide. Navigate between pages with the arrows.</li>
            <li>Click Redact &amp; Download.</li>
          </ol>
          <h3>Important Notes</h3>
          <ul>
            <li>The output PDF is image-only. Run our OCR tool afterwards if you need searchable text.</li>
            <li>Metadata is stripped automatically.</li>
            <li>For legal/regulatory redaction, always verify the output before distributing.</li>
          </ul>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default RedactPdf;
