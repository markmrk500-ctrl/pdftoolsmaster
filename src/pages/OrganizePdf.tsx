import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowUp, ArrowDown, Download, Loader2, Trash2, Layers } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const faqs = [
  {
    question: "What can I do with this tool?",
    answer:
      "Reorder, rotate, or delete individual pages of a PDF — then download the rearranged result.",
  },
  {
    question: "Is the original file modified?",
    answer: "No. Your original stays untouched; you download a new file.",
  },
  {
    question: "Are pages uploaded to a server?",
    answer: "No. All processing happens in your browser.",
  },
];

interface PageItem {
  index: number; // original page index
  rotation: number; // accumulated rotation
}

const OrganizePdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const handleFiles = async (incoming: File[]) => {
    const f = incoming[0];
    setFiles([f]);
    try {
      const bytes = await f.arrayBuffer();
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const count = pdf.getPageCount();
      setPages(Array.from({ length: count }, (_, i) => ({ index: i, rotation: 0 })));
    } catch {
      toast({ title: "Could not read PDF", variant: "destructive" });
      setFiles([]);
      setPages([]);
    }
  };

  const move = (i: number, dir: -1 | 1) =>
    setPages((p) => {
      const next = [...p];
      const j = i + dir;
      if (j < 0 || j >= next.length) return p;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const remove = (i: number) => setPages((p) => p.filter((_, idx) => idx !== i));

  const rotate = (i: number) =>
    setPages((p) => p.map((pg, idx) => (idx === i ? { ...pg, rotation: (pg.rotation + 90) % 360 } : pg)));

  const handleSave = async () => {
    if (!files[0] || !pages.length) return;
    setProcessing(true);
    setProgress(10);
    try {
      const bytes = await files[0].arrayBuffer();
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const indexes = pages.map((p) => p.index);
      const copied = await out.copyPages(src, indexes);
      copied.forEach((page, i) => {
        const rot = pages[i].rotation;
        if (rot) {
          const current = page.getRotation().angle;
          // pdf-lib uses degrees() helper but setRotation accepts rotation object.
          // Use page.setRotation via reflection-safe import
          // We avoid importing degrees again; use {angle:..., type:'degrees'} shape
          (page as any).setRotation({ angle: (current + rot) % 360, type: "degrees" });
        }
        out.addPage(page);
      });
      setProgress(85);
      const data = await out.save();
      const blob = new Blob([data as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = files[0].name.replace(/\.pdf$/i, "") + "-organized.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setProgress(100);
      toast({ title: "Saved", description: "Organized PDF downloaded." });
    } catch (e) {
      console.error(e);
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  return (
    <ToolPageShell
      title="Organize PDF Online — Reorder, Rotate & Delete Pages Free | PDFMaster Tools"
      description="Visually organize PDF pages: reorder, rotate, and delete pages in one workspace. Free, browser-based, and private — no upload required."
      keywords="organize pdf, reorder pdf pages, rearrange pdf, pdf page organizer, sort pdf pages"
      h1="Organize PDF Pages — Reorder, Rotate, Delete"
      intro="Reorder, rotate, and delete pages in a single workspace — then download the rearranged file."
      faqSchema={faqs}
      toolUI={
        <div className="space-y-6">
          <FileDropzone
            files={files}
            onFiles={handleFiles}
            onRemove={() => {
              setFiles([]);
              setPages([]);
            }}
            cta="Drop a PDF here or click to upload"
            subtitle="One file at a time • Max 50MB"
          />

          {pages.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {pages.length} page{pages.length !== 1 ? "s" : ""} • Use arrows to reorder, ↻ to rotate, × to delete
              </p>
              <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {pages.map((p, i) => (
                  <li
                    key={`${p.index}-${i}`}
                    className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-2.5"
                  >
                    <span className="text-sm font-medium w-12 text-muted-foreground">#{i + 1}</span>
                    <span className="text-sm flex-1">
                      Original page {p.index + 1}
                      {p.rotation ? ` • rotated ${p.rotation}°` : ""}
                    </span>
                    <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 hover:bg-secondary rounded disabled:opacity-30" aria-label="Move up">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button onClick={() => move(i, 1)} disabled={i === pages.length - 1} className="p-1 hover:bg-secondary rounded disabled:opacity-30" aria-label="Move down">
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button onClick={() => rotate(i)} className="p-1 hover:bg-secondary rounded" aria-label="Rotate">
                      ↻
                    </button>
                    <button onClick={() => remove(i)} className="p-1 hover:bg-secondary rounded text-destructive" aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {processing && <Progress value={progress} />}

          <Button
            size="lg"
            className="w-full"
            disabled={!pages.length || processing}
            onClick={handleSave}
          >
            {processing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Layers className="h-4 w-4" /> Save Organized PDF</>
            )}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>Organize PDF Pages Online — Reorder, Rotate, Delete in One Tool</h2>
          <p>
            The Organize PDF tool combines reorder, rotate, and delete operations into a
            single workspace so you can fully restructure a document without bouncing
            between separate utilities. Upload a PDF and you'll see every page listed —
            move them into the order you want, rotate misaligned ones, and remove what
            you don't need. When you're satisfied, download the rearranged file.
          </p>

          <h3>Step-by-Step: How to Organize a PDF</h3>
          <ol>
            <li><strong>Upload your PDF</strong> using the dropzone above.</li>
            <li><strong>Use the arrows</strong> to move pages up or down.</li>
            <li><strong>Click ↻</strong> to rotate a page 90° (repeat for 180° or 270°).</li>
            <li><strong>Click ×</strong> to remove pages you no longer need.</li>
            <li><strong>Click Save Organized PDF</strong> to download the result.</li>
          </ol>

          <h3>When to Use Organize PDF</h3>
          <ul>
            <li>Restructuring a scanned document where pages were captured out of order</li>
            <li>Building a custom reading sequence from an existing PDF</li>
            <li>Removing draft or internal pages before sending externally</li>
            <li>Fixing individual sideways pages without rotating the whole document</li>
            <li>Combining reorder + delete + rotate into a single saved workflow</li>
          </ul>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default OrganizePdf;
