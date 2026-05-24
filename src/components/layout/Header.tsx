import { Link, NavLink } from "react-router-dom";
import { FileText, Menu, X, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const primaryTools = [
  { to: "/merge-pdf", label: "Merge PDF" },
  { to: "/split-pdf", label: "Split PDF" },
  { to: "/compress-pdf", label: "Compress PDF" },
  { to: "/pdf-to-word", label: "PDF to Word" },
];

const categoryGroups: { name: string; tools: { to: string; label: string }[] }[] = [
  {
    name: "AI Tools ✨",
    tools: [
      { to: "/ai-summarize-pdf", label: "AI Summarize PDF" },
      { to: "/ai-translate-pdf", label: "AI Translate PDF" },
      { to: "/ai-ocr-pdf", label: "AI OCR (Scanned PDF)" },
    ],
  },
  {
    name: "Organize PDF",
    tools: [
      { to: "/organize-pdf", label: "Organize PDF" },
      { to: "/delete-pages", label: "Delete Pages" },
      { to: "/rotate-pdf", label: "Rotate PDF" },
      { to: "/reverse-pages", label: "Reverse Pages" },
      { to: "/nup-pdf", label: "N-up Pages" },
      { to: "/duplicate-pages", label: "Duplicate Pages" },
    ],
  },
  {
    name: "Optimize PDF",
    tools: [
      { to: "/resize-pdf", label: "Resize PDF" },
      { to: "/repair-pdf", label: "Repair PDF" },
      { to: "/flatten-pdf", label: "Flatten PDF" },
      { to: "/grayscale-pdf", label: "Grayscale PDF" },
    ],
  },
  {
    name: "Convert to PDF",
    tools: [
      { to: "/jpg-to-pdf", label: "JPG to PDF" },
      { to: "/html-to-pdf", label: "HTML to PDF" },
      { to: "/csv-to-pdf", label: "CSV to PDF" },
      { to: "/text-to-pdf", label: "Text to PDF" },
      { to: "/markdown-to-pdf", label: "Markdown to PDF" },
      { to: "/blank-pdf", label: "Blank PDF" },
    ],
  },
  {
    name: "Convert from PDF",
    tools: [
      { to: "/pdf-to-jpg", label: "PDF to JPG" },
      { to: "/pdf-to-png", label: "PDF to PNG" },
      { to: "/extract-text", label: "Extract Text" },
      { to: "/extract-images", label: "Extract Images" },
    ],
  },
  {
    name: "Edit PDF",
    tools: [
      { to: "/page-numbers", label: "Page Numbers" },
      { to: "/header-footer", label: "Header & Footer" },
      { to: "/watermark-pdf", label: "Watermark PDF" },
      { to: "/sign-pdf", label: "Sign PDF" },
      { to: "/crop-pdf", label: "Crop PDF" },
      { to: "/edit-metadata", label: "Edit Metadata" },
      { to: "/pdf-info", label: "PDF Info" },
      { to: "/bates-numbering", label: "Bates Numbering" },
      { to: "/word-count", label: "Word Count" },
      { to: "/invert-colors", label: "Invert Colors" },
    ],
  },
  {
    name: "Security",
    tools: [
      { to: "/protect-pdf", label: "Protect PDF" },
      { to: "/unlock-pdf", label: "Unlock PDF" },
    ],
  },
];

const moreTools = categoryGroups.flatMap((g) => g.tools);
const allTools = [...primaryTools, ...moreTools];

export const Header = () => {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="h-5 w-5" />
          </span>
          <span>PDFMaster<span className="text-primary"> Tools</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {primaryTools.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                `px-3 py-2 text-sm font-medium rounded-md transition-colors hover:text-primary ${
                  isActive ? "text-primary" : "text-foreground/70"
                }`
              }
            >
              {t.label}
            </NavLink>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger className="px-3 py-2 text-sm font-medium rounded-md text-foreground/70 hover:text-primary inline-flex items-center gap-1 outline-none">
              All Tools <ChevronDown className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[560px] p-3 grid grid-cols-2 gap-3">
              {categoryGroups.map((g) => (
                <div key={g.name} className="space-y-1">
                  <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {g.name}
                  </div>
                  {g.tools.map((t) => (
                    <DropdownMenuItem key={t.to} asChild>
                      <Link to={t.to} className="text-sm">{t.label}</Link>
                    </DropdownMenuItem>
                  ))}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="hidden md:block">
          <Button asChild variant="default" size="sm">
            <Link to="/merge-pdf">Get Started</Link>
          </Button>
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container mx-auto px-4 py-3 flex flex-col gap-1">
            {allTools.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2 text-sm font-medium rounded-md ${
                    isActive ? "bg-accent text-primary" : "text-foreground/80"
                  }`
                }
              >
                {t.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};
