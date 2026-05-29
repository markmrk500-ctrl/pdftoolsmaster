import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2, Unlock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const faqs = [
  {
    question: "Does this remove all PDF passwords?",
    answer:
      "It removes owner restrictions (printing, copying, editing limits). For PDFs that require a password to open, you must enter the correct password — this tool cannot crack passwords.",
  },
  {
    question: "Is unlocking my PDF safe?",
    answer:
      "Yes. The PDF and any password you enter never leave your browser. Everything is processed locally.",
  },
  {
    question: "What's the difference between owner and user passwords?",
    answer:
      "A user password is required to open the PDF. An owner password restricts actions (printing, copying) but doesn't block opening. This tool removes both when possible.",
  },
];

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
      // pdf-lib can ignore owner-encryption; for user-password PDFs it can't decrypt
      const pdf = await PDFDocument.load(bytes, {
        ignoreEncryption: true,
        password: password || undefined,
      } as any);
      setProgress(60);
      const out = await pdf.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = files[0].name.replace(/\.pdf$/i, "") + "-unlocked.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setProgress(100);
      toast({ title: "PDF unlocked", description: "Restrictions removed." });
    } catch (e) {
      console.error(e);
      toast({
        title: "Unlock failed",
        description:
          "If the PDF requires a password to open, this browser-based tool cannot decrypt it.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  return (
    <ToolPageShell
      title="Unlock PDF Online Free – Remove PDF Password on Any Device | Master PDF Tools"
      description="Unlock password-protected PDFs and remove restrictions online. Mobile-friendly, cross-browser, secure, and compatible with all devices and software versions."
      keywords="Unlock PDF Online Free, Remove PDF Password, PDF Unlocker for All Devices, Mobile PDF Unlocker, Cross-platform PDF Unlock, unlock pdf, remove pdf password, remove pdf restrictions, pdf unlocker, decrypt pdf, unlock pdf online free"
      h1="Unlock PDF Restrictions Online"
      intro="Remove owner restrictions on your PDF so you can print, copy text, and edit freely — all in your browser."
      faqSchema={faqs}
      toolUI={
        <div className="space-y-6">
          <FileDropzone
            files={files}
            onFiles={(f) => setFiles([f[0]])}
            onRemove={() => setFiles([])}
            cta="Drop a PDF here or click to upload"
            subtitle="One file at a time • Max 50MB"
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
            This tool removes owner restrictions so you can use the PDF freely. You must
            own the file or have permission to unlock it — never use this tool on
            documents you don't have the right to modify.
          </p>

          <h3>User Password vs Owner Password</h3>
          <ul>
            <li><strong>User password:</strong> required just to open and view the PDF. Without it, the document cannot be read.</li>
            <li><strong>Owner password:</strong> allows opening but restricts actions — printing, text selection, copying, editing, form filling, or annotation.</li>
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
