import { Link } from "react-router-dom";
import { FileText } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-secondary/30 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 font-bold mb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <FileText className="h-4 w-4" />
              </span>
              <span>PDFMaster Tools</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Free online PDF tools. Fast, secure, no signup required.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">Tools</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/merge-pdf" className="hover:text-primary">Merge PDF</Link></li>
              <li><Link to="/split-pdf" className="hover:text-primary">Split PDF</Link></li>
              <li><Link to="/compress-pdf" className="hover:text-primary">Compress PDF</Link></li>
              <li><Link to="/pdf-to-word" className="hover:text-primary">PDF to Word</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">AI Tools ✨</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/ai-chat-pdf" className="hover:text-primary">Chat with PDF</Link></li>
              <li><Link to="/ai-mcq-generator" className="hover:text-primary">AI MCQ Generator</Link></li>
              <li><Link to="/ai-summarize-pdf" className="hover:text-primary">AI Summarize PDF</Link></li>
              <li><Link to="/ai-translate-pdf" className="hover:text-primary">AI Translate PDF</Link></li>
              <li><Link to="/ai-ocr-pdf" className="hover:text-primary">AI OCR (Scanned PDF)</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary">About</Link></li>
              <li><Link to="/compare" className="hover:text-primary">Compare</Link></li>
              <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 text-sm text-muted-foreground text-center">
          © {new Date().getFullYear()} PDFMaster Tools. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
