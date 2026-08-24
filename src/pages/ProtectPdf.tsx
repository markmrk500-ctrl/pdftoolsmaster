import { useEffect, useState } from "react";
import { PDFDocument } from "@cantoo/pdf-lib";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Loader2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  encryptPdf,
  preloadQpdf,
  QpdfCorruptError,
  QpdfUnavailableError,
  type PrintPermission,
} from "@/lib/qpdf";

const faqs = [
  {
    question: "What encryption does this use?",
    answer:
      "256-bit AES (PDF 2.0 / revision 6) — the strongest encryption the PDF specification supports, and the same standard used by Adobe Acrobat and desktop tools. It's applied by qpdf running locally in your browser.",
  },
  {
    question: "Can I set a separate owner password?",
    answer:
      "Yes. The user password is needed to open the file; the owner password unlocks the permissions you restricted. Leave the owner field blank to reuse the same password for both.",
  },
  {
    question: "Do the permission settings really work?",
    answer:
      "Yes. Printing, copying, editing, annotating, form filling and page assembly are written into the encryption dictionary and enforced by every compliant PDF reader.",
  },
  {
    question: "Can I remove the password later?",
    answer:
      "Yes — anyone with the password can open the PDF and re-save it without protection, or use our Unlock PDF tool.",
  },
  {
    question: "Is my password stored anywhere?",
    answer:
      "No. The password is only used in your browser to encrypt the PDF and is never transmitted or saved.",
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

const ProtectPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [print, setPrint] = useState<PrintPermission>("full");
  const [allowCopy, setAllowCopy] = useState(false);
  const [allowModify, setAllowModify] = useState(false);
  const [allowAnnotate, setAllowAnnotate] = useState(false);
  const [allowForms, setAllowForms] = useState(true);
  const [allowAssemble, setAllowAssemble] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<string | null>(null);

  // Warm the encryption engine up as soon as a file is chosen.
  useEffect(() => {
    if (files.length) preloadQpdf();
  }, [files.length]);

  const legacyFallback = async (bytes: ArrayBuffer) => {
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
    return (await pdf.save({
      userPassword: password,
      ownerPassword: ownerPassword || password,
      permissions: {
        printing: print === "none" ? undefined : print === "low" ? "lowResolution" : "highResolution",
        modifying: allowModify,
        copying: allowCopy,
        annotating: allowAnnotate,
        fillingForms: allowForms,
        contentAccessibility: true,
        documentAssembly: allowAssemble,
      },
    } as any)) as Uint8Array;
  };

  const handleProtect = async () => {
    if (!files[0]) return;
    if (password.length < 4) {
      toast({ title: "Password too short", description: "Use at least 4 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setProcessing(true);
    setResult(null);
    setStatus("Preparing secure engine…");
    setProgress(15);

    try {
      const bytes = await files[0].arrayBuffer();
      let out: Uint8Array;
      let method: "aes256" | "legacy" = "aes256";

      try {
        setStatus("Encrypting with AES-256…");
        setProgress(45);
        out = await encryptPdf(bytes, {
          userPassword: password,
          ownerPassword: ownerPassword || undefined,
          print,
          copy: allowCopy,
          modify: allowModify,
          annotate: allowAnnotate,
          fillForms: allowForms,
          assemble: allowAssemble,
        });
      } catch (e) {
        if (e instanceof QpdfCorruptError) throw e;
        if (!(e instanceof QpdfUnavailableError)) console.error(e);
        setStatus("Falling back to standard encryption…");
        out = await legacyFallback(bytes);
        method = "legacy";
      }

      setProgress(95);
      downloadBlob(out, files[0].name.replace(/\.pdf$/i, "") + "-protected.pdf");
      setProgress(100);
      setResult(
        method === "aes256"
          ? "Encrypted with 256-bit AES (PDF 2.0 / R6) — the strongest protection the PDF format supports."
          : "Encrypted with standard PDF encryption. The AES-256 engine couldn't load in this browser, so a compatible fallback was used."
      );
      toast({
        title: method === "aes256" ? "PDF protected with AES-256" : "PDF protected",
        description: "Your encrypted file has been downloaded.",
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Couldn't protect this PDF",
        description:
          e instanceof QpdfCorruptError
            ? "This file appears to be damaged or already encrypted. Unlock it first, then try again."
            : "Something went wrong while encrypting. Try a different PDF.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setStatus("");
      setTimeout(() => setProgress(0), 1500);
    }
  };

  return (
    <ToolPageShell
      title="Protect PDF Online Free – AES-256 Password Protection on Any Device | Master PDF Tools"
      description="Password-protect PDFs with real 256-bit AES encryption in your browser. Set owner passwords and permissions. Mobile-friendly, cross-browser, private — no uploads."
      keywords="Protect PDF Online Free, AES-256 PDF Encryption, Password Protect PDF, Encrypt PDF for All Devices, Mobile PDF Encryption, Cross-platform PDF Security, protect pdf, password protect pdf, encrypt pdf, secure pdf, add password to pdf, pdf password, lock pdf"
      h1="Password-Protect Your PDF with AES-256 Encryption"
      intro="Add a password to your PDF using genuine 256-bit AES encryption and fine-grained permissions. Everything runs locally in your browser — the file and password never leave your device."
      faqSchema={faqs}
      toolUI={
        <div className="space-y-6">
          <div className="flex gap-3 bg-accent/50 border border-border rounded-lg p-4 text-sm">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-muted-foreground">
              Files are encrypted with 256-bit AES (PDF 2.0 / R6) by qpdf running locally in your browser — the same
              standard desktop tools use. Choose a strong password: we cannot recover it for you.
            </p>
          </div>

          <FileDropzone
            files={files}
            onFiles={(f) => setFiles([f[0]])}
            onRemove={() => setFiles([])}
            cta="Drop a PDF here or click to upload"
            subtitle="One file at a time • Max 150MB"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pwd">Password (required to open)</Label>
              <Input id="pwd" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="owner">Owner password (optional)</Label>
              <Input
                id="owner"
                type="password"
                placeholder="Same as password if left blank"
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="print">Printing</Label>
              <Select value={print} onValueChange={(v) => setPrint(v as PrintPermission)}>
                <SelectTrigger id="print">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Allow high-resolution printing</SelectItem>
                  <SelectItem value="low">Allow low-resolution printing only</SelectItem>
                  <SelectItem value="none">Block printing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border border-border p-4 space-y-4">
            <p className="text-sm font-medium">Permissions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: "copy", label: "Copy text & images", value: allowCopy, set: setAllowCopy },
                { id: "modify", label: "Edit page content", value: allowModify, set: setAllowModify },
                { id: "annotate", label: "Add comments & annotations", value: allowAnnotate, set: setAllowAnnotate },
                { id: "forms", label: "Fill in form fields", value: allowForms, set: setAllowForms },
                { id: "assemble", label: "Insert, delete & rotate pages", value: allowAssemble, set: setAllowAssemble },
              ].map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3">
                  <Label htmlFor={p.id} className="font-normal text-muted-foreground">
                    {p.label}
                  </Label>
                  <Switch id={p.id} checked={p.value} onCheckedChange={p.set} />
                </div>
              ))}
            </div>
          </div>

          {processing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground">{status}</p>
            </div>
          )}

          {result && !processing && (
            <div className="flex gap-3 rounded-lg border border-border bg-accent/40 p-4 text-sm">
              <Download className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-muted-foreground">{result}</p>
            </div>
          )}

          <Button
            size="lg"
            className="w-full"
            disabled={!files[0] || !password || processing}
            onClick={handleProtect}
          >
            {processing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Protecting...</>
            ) : (
              <><Lock className="h-4 w-4" /> Protect & Download</>
            )}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>How to Add a Password to a PDF — Complete Guide</h2>
          <p>
            Adding a password to a PDF is one of the simplest ways to keep contracts,
            invoices, medical records, financial statements, or personal documents
            private. Only people who know the password will be able to open the file —
            even if it's intercepted, leaked, or accidentally shared with the wrong
            recipient. Master PDF Tools' Protect PDF utility uses qpdf compiled to
            WebAssembly, so your file and password never leave your device.
          </p>

          <h3>Step-by-Step: How to Password-Protect a PDF</h3>
          <ol>
            <li><strong>Upload your PDF</strong> using the dropzone above.</li>
            <li><strong>Enter a strong password</strong> in both fields to confirm.</li>
            <li><strong>Optionally set an owner password</strong> and choose which actions to allow.</li>
            <li><strong>Click Protect &amp; Download.</strong> The AES-256 encrypted PDF downloads instantly.</li>
            <li><strong>Share the password securely</strong> through a separate channel from the file itself.</li>
          </ol>

          <h3>What AES-256 Encryption Means</h3>
          <p>
            AES-256 is the encryption revision 6 scheme defined in PDF 2.0 (ISO 32000-2)
            and used by Adobe Acrobat, qpdf, and every modern PDF toolchain. It replaces
            the older 40-bit and 128-bit RC4 schemes, which are considered broken and can
            be cracked by consumer hardware. Because the entire operation runs inside your
            browser through WebAssembly, you get desktop-grade encryption without
            uploading a single byte.
          </p>

          <h3>User Password vs Owner Password</h3>
          <ul>
            <li><strong>User password:</strong> required to open and read the document.</li>
            <li><strong>Owner password:</strong> unlocks the permission restrictions — printing, copying, editing — for people who need full control. If you leave it blank, the same password is used for both.</li>
          </ul>

          <h3>How to Choose a Strong PDF Password</h3>
          <ul>
            <li>Use at least 12 characters — longer is better.</li>
            <li>Mix uppercase, lowercase, numbers, and symbols.</li>
            <li>Avoid dictionary words, names, and dates of birth.</li>
            <li>Don't reuse a password from another account.</li>
            <li>Consider a passphrase like "Coffee-Pumpkin-Stairs-42!"</li>
          </ul>

          <h3>How to Share a Password Safely</h3>
          <p>
            Never include the password in the same email as the PDF itself. If your
            email is compromised or forwarded, the password is exposed. Instead, share
            the password through a different channel: a phone call, an SMS message, an
            encrypted messaging app like Signal, or in person.
          </p>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default ProtectPdf;
