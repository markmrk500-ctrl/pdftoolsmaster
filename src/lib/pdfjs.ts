// Centralized pdfjs-dist setup using the legacy build for maximum
// browser compatibility (iOS Safari, Samsung Internet, older Android Chrome).
// All AI tools that parse PDFs should import from here.
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import workerSrc from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export { pdfjsLib };
