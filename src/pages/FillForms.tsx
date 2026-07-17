import { useState, useEffect } from "react";
import { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown } from "pdf-lib";
import { ToolPageShell } from "@/components/ToolPageShell";
import { FileDropzone } from "@/components/FileDropzone";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Download, Loader2, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { loadPdfLib, describePdfError } from "@/lib/pdf";

const faqs = [
  { question: "What kinds of forms are supported?", answer: "AcroForm fields embedded in PDFs: text inputs, checkboxes, radio button groups, and dropdowns. Static PDFs without form fields cannot be filled — use Sign PDF or Edit PDF instead." },
  { question: "Will the filled PDF still be editable?", answer: "Yes by default. If you check 'Flatten after filling', values are baked into the page content and the fields become uneditable." },
  { question: "Is my file uploaded?", answer: "No. Form parsing and saving happen entirely in your browser." },
];

type Field =
  | { type: "text"; name: string; value: string }
  | { type: "checkbox"; name: string; value: boolean }
  | { type: "radio"; name: string; value: string; options: string[] }
  | { type: "dropdown"; name: string; value: string; options: string[] };

const FillForms = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [flatten, setFlatten] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFields([]);
    setPdfBytes(null);
    if (!files[0]) return;
    (async () => {
      try {
        const bytes = new Uint8Array(await files[0].arrayBuffer());
        setPdfBytes(bytes);
        const pdf = await loadPdfLib(bytes.slice());
        const form = pdf.getForm();
        const collected: Field[] = form.getFields().map((f) => {
          const name = f.getName();
          if (f instanceof PDFTextField) return { type: "text", name, value: f.getText() ?? "" };
          if (f instanceof PDFCheckBox) return { type: "checkbox", name, value: f.isChecked() };
          if (f instanceof PDFRadioGroup) return { type: "radio", name, value: f.getSelected() ?? "", options: f.getOptions() };
          if (f instanceof PDFDropdown) return { type: "dropdown", name, value: f.getSelected()?.[0] ?? "", options: f.getOptions() };
          return { type: "text", name, value: "" } as Field;
        });
        setFields(collected);
        setLoaded(true);
        if (collected.length === 0) {
          toast({ title: "No form fields found", description: "This PDF doesn't contain fillable form fields.", variant: "destructive" });
        }
      } catch (e) {
        const { title, description } = describePdfError(e);
        toast({ title, description, variant: "destructive" });
      }
    })();
  }, [files]);

  const updateField = (idx: number, value: any) => {
    setFields((p) => p.map((f, i) => (i === idx ? { ...f, value } : f)));
  };

  const handleFill = async () => {
    if (!pdfBytes || !fields.length) return;
    setProcessing(true);
    setProgress(20);
    try {
      const pdf = await loadPdfLib(pdfBytes.slice());
      const form = pdf.getForm();
      for (const f of fields) {
        try {
          if (f.type === "text") form.getTextField(f.name).setText(f.value);
          else if (f.type === "checkbox") {
            const cb = form.getCheckBox(f.name);
            f.value ? cb.check() : cb.uncheck();
          } else if (f.type === "radio" && f.value) form.getRadioGroup(f.name).select(f.value);
          else if (f.type === "dropdown" && f.value) form.getDropdown(f.name).select(f.value);
        } catch (err) {
          console.warn("Skipping field", f.name, err);
        }
      }
      if (flatten) form.flatten();
      setProgress(80);
      const out = await pdf.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = files[0].name.replace(/\.pdf$/i, "") + "-filled.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setProgress(100);
      toast({ title: "Form filled", description: "PDF downloaded." });
    } catch (e) {
      const { title, description } = describePdfError(e);
      toast({ title, description, variant: "destructive" });
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  return (
    <ToolPageShell
      title="Fill PDF Forms Online Free – Complete PDF Forms in Your Browser | Master PDF Tools"
      description="Fill PDF form fields online — text, checkboxes, radios, dropdowns. Save as editable or flattened PDF. Secure, browser-based."
      keywords="fill pdf forms, pdf form filler, complete pdf forms, fillable pdf, acroform editor, fill pdf online"
      h1="Fill PDF Forms — Complete Fillable PDFs in Your Browser"
      intro="Upload a fillable PDF, enter values for every field, and download a completed copy. Optionally flatten so values are locked in."
      faqSchema={faqs}
      toolUI={
        <div className="space-y-6">
          <FileDropzone files={files} onFiles={(f) => setFiles([f[0]])} onRemove={() => setFiles([])} />

          {loaded && fields.length === 0 && (
            <div className="flex gap-2 items-start bg-destructive/10 border border-destructive/20 text-sm rounded-lg p-4">
              <AlertCircle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
              <span>This PDF has no fillable form fields. Try the Sign PDF tool to add a signature or use Edit Metadata for document properties.</span>
            </div>
          )}

          {fields.length > 0 && (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {fields.map((f, idx) => (
                <div key={idx} className="space-y-1.5">
                  <Label className="text-sm font-medium">{f.name}</Label>
                  {f.type === "text" && (
                    <Input value={f.value} onChange={(e) => updateField(idx, e.target.value)} />
                  )}
                  {f.type === "checkbox" && (
                    <div className="flex items-center gap-2 py-1">
                      <Checkbox checked={f.value} onCheckedChange={(c) => updateField(idx, !!c)} />
                      <span className="text-sm text-muted-foreground">Checked</span>
                    </div>
                  )}
                  {(f.type === "radio" || f.type === "dropdown") && (
                    <Select value={f.value} onValueChange={(v) => updateField(idx, v)}>
                      <SelectTrigger><SelectValue placeholder="Select option" /></SelectTrigger>
                      <SelectContent>
                        {f.options.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))}
            </div>
          )}

          {fields.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox id="flat" checked={flatten} onCheckedChange={(c) => setFlatten(!!c)} />
              <Label htmlFor="flat" className="text-sm cursor-pointer">Flatten after filling (lock values, fields become uneditable)</Label>
            </div>
          )}

          {processing && <Progress value={progress} />}

          <Button size="lg" className="w-full" disabled={!fields.length || processing} onClick={handleFill}>
            {processing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Download className="h-4 w-4" /> Fill & Download PDF</>
            )}
          </Button>
        </div>
      }
      seoContent={
        <>
          <h2>Fill PDF Forms Online — Free, Private, Browser-Based</h2>
          <p>Upload any PDF with AcroForm fields, fill in every value, and download a completed copy. All processing happens locally in your browser.</p>
          <h3>Supported Field Types</h3>
          <ul>
            <li>Text fields (single and multi-line)</li>
            <li>Checkboxes</li>
            <li>Radio button groups</li>
            <li>Dropdown menus</li>
          </ul>
          <h3>Flatten vs Editable</h3>
          <p>By default the downloaded PDF keeps its fields editable so recipients can modify values. Check "Flatten after filling" to bake the values permanently into the page content — useful when sending completed forms to government agencies or for archival.</p>
        </>
      }
      faqSection={<FAQ items={faqs} />}
    />
  );
};

export default FillForms;
