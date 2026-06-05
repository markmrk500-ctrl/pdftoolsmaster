import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_SIZE = 150 * 1024 * 1024; // 150 MB

interface FileDropzoneProps {
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  files?: File[];
  onRemove?: (index: number) => void;
  cta?: string;
  subtitle?: string;
}

export const FileDropzone = ({
  multiple = false,
  onFiles,
  files = [],
  onRemove,
  cta = "Drop PDF here or click to upload",
  subtitle = "Max file size 150MB",
}: FileDropzoneProps) => {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], rejected: any[]) => {
      setError(null);
      if (rejected.length > 0) {
        const r = rejected[0];
        if (r.errors?.[0]?.code === "file-too-large") {
          setError("File too large. Maximum size is 150MB.");
        } else if (r.errors?.[0]?.code === "file-invalid-type") {
          setError("Invalid file type. Only PDF files are allowed.");
        } else {
          setError("File could not be added.");
        }
        return;
      }
      // Extra safety: validate MIME / extension
      const valid = accepted.filter(
        (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
      );
      if (valid.length !== accepted.length) {
        setError("Only PDF files are allowed.");
      }
      if (valid.length) onFiles(valid);
    },
    [onFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple,
    maxSize: MAX_SIZE,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-10 md:p-14 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-accent"
            : "border-border bg-card hover:border-primary/50 hover:bg-accent/30"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className="h-14 w-14 rounded-full bg-accent flex items-center justify-center">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <p className="font-semibold text-base md:text-lg">{cta}</p>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3"
            >
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {onRemove && (
                <button
                  onClick={() => onRemove(i)}
                  className="p-1 hover:bg-secondary rounded"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
