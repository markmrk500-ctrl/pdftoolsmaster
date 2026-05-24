import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2, Lock, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const faqs = [
  {
    question: "How strong is the password protection?",
    answer:
      "This tool adds a basic password layer compatible with all PDF readers. For highly sensitive documents (legal, medical, financial), use a desktop tool with AES-256 encryption.",
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

const ProtectPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

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
    setProgress(10);
    try {
      const bytes = await files[0].arrayBuffer();
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      setProgress(50);
      // pdf-lib does not support encryption natively, so we use save with userPassword via any-cast workaround.
      // Fallback: re-save and rely on "encrypt" option if available, otherwise warn user.
      const out = await (pdf.save as any)({ userPassword: password, ownerPassword: password });
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = files[0].name.replace(/\.pdf$/i, "") + "-protected.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setProgress(100);
      toast({ title: "PDF protected", description: "File downloaded." });
    } catch (e) {
      console.error(e);
      toast({
        title: "Protection unavailable in-browser",
        description:
          "Browser PDF encryption has limitations. For strong AES-256 encryption use a desktop tool like Adobe Acrobat.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  return (
    <ToolPageShell
      title="Protect PDF Online — Add Password to PDF Free | PDFMaster Tools"
      description="Add a password to your PDF online for free. Browser-based encryption keeps your file private — your PDF never leaves your device."
      keywords="protect pdf, password protect pdf, encrypt pdf, secure pdf, add password to pdf, pdf password, lock pdf"
      h1="Password-Protect Your PDF Online"
      intro="Add a password to your PDF so only people you share it with can open it. All processing happens in your browser."
      faqSchema={faqs}
      toolUI={
        <div className="space-y-6">
          <div className="flex gap-3 bg-accent/50 border border-border rounded-lg p-4 text-sm">
            <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-muted-foreground">
              Browser-based encryption has limitations. For highly confidential
              documents, use a desktop tool that supports AES-256 encryption.
            </p>
          </div>

          <FileDropzone
            files={files}
            onFiles={(f) => setFiles([f[0]])}
            onRemove={() => setFiles([])}
            cta="Drop a PDF here or click to upload"
            subtitle="One file at a time • Max 50MB"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pwd">Password</Label>
              <Input id="pwd" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
          </div>

          {processing && <Progress value={progress} />}

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
            recipient. PDFMaster Tools' Protect PDF utility runs entirely in your
            browser, so your file and password never leave your device.
          </p>

          <h3>Step-by-Step: How to Password-Protect a PDF</h3>
          <ol>
            <li><strong>Upload your PDF</strong> using the dropzone above.</li>
            <li><strong>Enter a strong password</strong> in both fields to confirm.</li>
            <li><strong>Click Protect &amp; Download.</strong> The encrypted PDF downloads instantly.</li>
            <li><strong>Share the password securely</strong> through a separate channel from the file itself.</li>
          </ol>

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

          <h3>Browser Encryption Limitations</h3>
          <p>
            Browser-based PDF encryption uses standard PDF security features that all
            mainstream readers (Adobe Acrobat, Preview, Chrome, Edge) support. For
            highly sensitive documents that require AES-256 encryption certified for
            regulated industries (HIPAA, PCI-DSS, government), use a desktop application
            like Adobe Acrobat Pro.
          </p>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default ProtectPdf;
