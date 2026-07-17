import { useState } from "react";
import { PDFDocument as CantooPDFDocument } from "@cantoo/pdf-lib";
import { PDFDocument } from "pdf-lib";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader2, Unlock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { pdfjsLib } from "@/lib/pdfjs";

const faqs = [
  {
    question: "Does this remove all PDF passwords?",
    answer:
      "Yes. Owner restrictions (printing, copying, editing) are stripped automatically. For PDFs with an open password, enter the correct password and the file will be fully decrypted to an unprotected PDF.",
  },
  {
    question: "Is unlocking my PDF safe?",
    answer:
      "Yes. The PDF and any password you enter never leave your browser. Everything is processed locally using AES-256 capable decryption.",
  },
  {
    question: "What's the difference between owner and user passwords?",
    answer:
      "A user password is required to open the PDF. An owner password restricts actions (printing, copying) but doesn't block opening. This tool removes both.",
  },
];

const downloadBlob = (bytes: Uint8Array, filename: string) => {
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const isPasswordError = (e: any) => {
  const n = e?.name || "";
  const m = (e?.message || "").toLowerCase();
  return (
    n === "PasswordException" ||
    m.includes("password") ||
    m.includes("encrypted") ||
    m.includes("encryption")
  );
};

/**
 * Decrypt a user-password PDF by rendering each page with pdf.js (which
 * accepts the password) and rebuilding an unencrypted PDF from the rendered
 * pages. This works for any standard encrypted PDF, including AES-256.
 */
const decryptViaRender = async (bytes: ArrayBuffer, password: string) => {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(bytes),
    password,
    isEvalSupported: false,
    useSystemFonts: true,
  } as any);
  const doc = await loadingTask.promise;
  const out = await PDFDocument.create();
  const scale = 2;

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    const jpgBytes = await (await fetch(dataUrl)).arrayBuffer();
    const img = await out.embedJpg(jpgBytes);
    const w = viewport.width / scale;
    const h = viewport.height / scale;
    const newPage = out.addPage([w, h]);
    newPage.drawImage(img, { x: 0, y: 0, width: w, height: h });
  }

  return await out.save();
};

const UnlockPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [password, setPassword] = useState("");
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  const handleUnlock = async () => {
    if (!files[0]) return;
    setProcessing(true);
    setProgress(10);
    try {
      const bytes = await files[0].arrayBuffer();
      let outBytes: Uint8Array | null = null;

      // Strategy:
      // A) If a password is provided, try @cantoo/pdf-lib (supports AES-256/RC4
      //    user-password decryption). If it fails, fall back to pdf.js render.
      // B) If no password, strip owner restrictions with pdf-lib re-save. If
      //    that reveals a user-password requirement, prompt for it.
      if (password) {
        try {
          const pdf = await CantooPDFDocument.load(bytes, {
            password,
            ignoreEncryption: false,
            throwOnInvalidObject: false,
          } as any);
          setProgress(55);
          const cantooBytes = await pdf.save({ useObjectStreams: false } as any);
          // Re-save through standard pdf-lib to guarantee a fully unencrypted output.
          try {
            const clean = await PDFDocument.load(cantooBytes as any, {
              ignoreEncryption: true,
              throwOnInvalidObject: false,
              updateMetadata: false,
            } as any);
            outBytes = await clean.save();
          } catch {
            outBytes = cantooBytes;
          }
        } catch (e: any) {
          if (isPasswordError(e)) {
            // Wrong password OR cantoo couldn't handle this encryption — try pdf.js render.
            setProgress(35);
            try {
              outBytes = await decryptViaRender(bytes, password);
            } catch (e2: any) {
              if (isPasswordError(e2)) throw new Error("WRONG_PASSWORD");
              throw e2;
            }
          } else {
            // Non-password error — try render as last resort.
            setProgress(35);
            outBytes = await decryptViaRender(bytes, password);
          }
        }
      } else {
        // No password: attempt owner-restriction strip.
        try {
          const pdf = await PDFDocument.load(bytes, {
            ignoreEncryption: true,
            throwOnInvalidObject: false,
          } as any);
          setProgress(60);
          outBytes = await pdf.save();
        } catch (e: any) {
          if (isPasswordError(e)) throw new Error("PASSWORD_REQUIRED");
          throw e;
        }
      }

      if (!outBytes) throw new Error("Unable to unlock");
      setProgress(95);
      downloadBlob(outBytes, files[0].name.replace(/\.pdf$/i, "") + "-unlocked.pdf");
      setProgress(100);
      toast({ title: "PDF unlocked", description: "Password and restrictions removed." });
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || "";
      if (msg === "PASSWORD_REQUIRED") {
        toast({
          title: "Password required",
          description: "This PDF needs a password to open. Enter it above and try again.",
          variant: "destructive",
        });
      } else if (msg === "WRONG_PASSWORD" || isPasswordError(e)) {
        toast({
          title: "Wrong password",
          description: "The password you entered didn't decrypt this PDF. Double-check and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Unlock failed",
          description: "Couldn't process this PDF. Try a different file.",
          variant: "destructive",
        });
      }
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  return (
    <ToolPageShell
      title="Unlock PDF Online Free – Remove PDF Password on Any Device | Master PDF Tools"
      description="Unlock password-protected PDFs and remove restrictions online. AES-256 compatible, mobile-friendly, cross-browser, secure, runs entirely in your browser."
      keywords="Unlock PDF Online Free, Remove PDF Password, PDF Unlocker, Decrypt PDF, AES-256 PDF Unlock, unlock pdf, remove pdf password, remove pdf restrictions, pdf unlocker, decrypt pdf, unlock pdf online free"
      h1="Unlock PDF Online — Remove Password & Restrictions"
      intro="Remove open passwords and owner restrictions from your PDF so you can print, copy text, and edit freely — all securely in your browser."
      faqSchema={faqs}
      toolUI={
        <div className="space-y-6">
          <FileDropzone
            files={files}
            onFiles={(f) => setFiles([f[0]])}
            onRemove={() => setFiles([])}
            cta="Drop a PDF here or click to upload"
            subtitle="One file at a time • Max 150MB"
          />

          <div className="space-y-2">
            <Label htmlFor="pwd">Password (only if required to open)</Label>
            <Input
              id="pwd"
              type="password"
              placeholder="Leave blank if not needed"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {processing && <Progress value={progress} />}

          <Button
            size="lg"
            className="w-full"
            disabled={!files[0] || processing}
            onClick={handleUnlock}
          >
            {processing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Unlocking...</>
            ) : (
              <><Unlock className="h-4 w-4" /> Unlock & Download</>
            )}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>How to Unlock a Password-Protected PDF</h2>
          <p>
            PDFs can be locked in two distinct ways: a <strong>user password</strong>{" "}
            required to open the file at all, and an <strong>owner password</strong>{" "}
            that restricts actions like printing, copying text, or editing the document.
            This tool removes both — including modern AES-256 encrypted PDFs — and
            returns a clean, fully usable file.
          </p>

          <h3>User Password vs Owner Password</h3>
          <ul>
            <li><strong>User password:</strong> required just to open and view the PDF. Without it, the document cannot be read. Enter it in the field above to decrypt.</li>
            <li><strong>Owner password:</strong> allows opening but restricts actions — printing, text selection, copying, editing, form filling, or annotation. These are stripped automatically; no password needed.</li>
          </ul>

          <h3>Step-by-Step: How to Unlock a PDF</h3>
          <ol>
            <li><strong>Upload your locked PDF</strong> using the dropzone above.</li>
            <li><strong>Enter the open password</strong> (only if the file requires one to open). Leave blank for restriction-only PDFs.</li>
            <li><strong>Click Unlock &amp; Download.</strong> The unlocked file downloads instantly.</li>
          </ol>

          <h3>Privacy &amp; Legal Note</h3>
          <p>
            All processing happens locally in your browser. Neither the PDF nor your
            password is uploaded anywhere. This is not a password-cracking tool — for
            files that require a password to open, you must know the correct one. Using
            this tool on documents you don't own or have rights to modify may violate
            laws and terms of service.
          </p>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default UnlockPdf;
