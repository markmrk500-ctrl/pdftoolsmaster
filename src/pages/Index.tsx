import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Helmet } from "react-helmet-async";
import { AdSlot } from "@/components/AdSlot";
import { FAQ } from "@/components/FAQ";
import { Button } from "@/components/ui/button";
import {
  Combine,
  Scissors,
  Minimize2,
  FileType2,
  RotateCw,
  Trash2,
  Hash,
  Stamp,
  Lock,
  Unlock,
  Image as ImageIcon,
  FileImage,
  Layers,
  Crop,
  Contrast,
  FileText as FileTextIcon,
  Code,
  PenTool,
  FileImage as FileImage2,
  Tags,
  Wrench,
  Maximize2,
  Info,
  LayoutGrid,
  Zap,
  ShieldCheck,
  Heart,
  ArrowRight,
  FlipVertical2,
  Images,
  AlignVerticalSpaceAround,
  FilePlus2,
  Table as TableIcon,
  Search,
  X,
  Type,
  FileCode,
  Copy,
  Gavel,
  BarChart3,
  MoonStar,
  Sparkles,
  Languages,
  ScanText,
} from "lucide-react";

type Tool = { to: string; icon: any; title: string; description: string; color: string };

const categories: { id: string; name: string; description: string; tools: (Tool & { isNew?: boolean })[] }[] = [
  {
    id: "ai",
    name: "AI Tools ✨",
    description: "Smart AI-powered features: summarize, translate, and OCR scanned PDFs.",
    tools: [
      { to: "/ai-summarize-pdf", icon: Sparkles, title: "AI PDF Summarizer", description: "Get a TL;DR, key points & section summaries instantly.", color: "tool-merge", isNew: true },
      { to: "/ai-translate-pdf", icon: Languages, title: "AI PDF Translator", description: "Translate any PDF into 20+ languages with AI.", color: "tool-convert", isNew: true },
      { to: "/ai-ocr-pdf", icon: ScanText, title: "AI OCR (Scanned PDF)", description: "Extract text from scans & handwriting using AI vision.", color: "tool-split", isNew: true },
    ],
  },
  {
    id: "organize",
    name: "Organize PDF",
    description: "Merge, split, reorder and clean up your documents.",
    tools: [
      { to: "/merge-pdf", icon: Combine, title: "Merge PDF", description: "Combine multiple PDFs into one file in seconds.", color: "tool-merge" },
      { to: "/split-pdf", icon: Scissors, title: "Split PDF", description: "Extract pages or split a PDF into multiple files.", color: "tool-split" },
      { to: "/organize-pdf", icon: Layers, title: "Organize PDF", description: "Reorder, rotate, and delete pages in one place.", color: "tool-merge" },
      { to: "/delete-pages", icon: Trash2, title: "Delete Pages", description: "Remove unwanted pages from your PDF.", color: "tool-compress" },
      { to: "/rotate-pdf", icon: RotateCw, title: "Rotate PDF", description: "Rotate PDF pages 90, 180, or 270 degrees.", color: "tool-split" },
      { to: "/reverse-pages", icon: FlipVertical2, title: "Reverse Pages", description: "Flip the order of every page in your PDF.", color: "tool-split" },
      { to: "/nup-pdf", icon: LayoutGrid, title: "N-up Pages", description: "Print 2 or 4 PDF pages per sheet to save paper.", color: "tool-merge" },
      { to: "/duplicate-pages", icon: Copy, title: "Duplicate Pages", description: "Clone selected PDF pages in place with custom copy count.", color: "tool-split" },
    ],
  },
  {
    id: "optimize",
    name: "Optimize PDF",
    description: "Reduce size, repair files and tune page dimensions.",
    tools: [
      { to: "/compress-pdf", icon: Minimize2, title: "Compress PDF", description: "Reduce PDF file size while keeping quality.", color: "tool-compress" },
      { to: "/resize-pdf", icon: Maximize2, title: "Resize PDF", description: "Change page size to A4, Letter, Legal, A3 & more.", color: "tool-convert" },
      { to: "/repair-pdf", icon: Wrench, title: "Repair PDF", description: "Fix corrupted PDFs that won't open.", color: "tool-compress" },
      { to: "/flatten-pdf", icon: Layers, title: "Flatten PDF", description: "Lock forms, signatures & annotations into pages.", color: "tool-merge" },
      { to: "/grayscale-pdf", icon: Contrast, title: "Grayscale PDF", description: "Convert color PDFs to black & white.", color: "tool-convert" },
      { to: "/invert-colors", icon: MoonStar, title: "Invert Colors", description: "Flip PDF colors for dark-mode reading.", color: "tool-merge" },
    ],
  },
  {
    id: "convert-to",
    name: "Convert to PDF",
    description: "Turn images and HTML into polished PDFs.",
    tools: [
      { to: "/jpg-to-pdf", icon: FileImage, title: "JPG to PDF", description: "Convert JPG or PNG images into a single PDF.", color: "tool-split" },
      { to: "/html-to-pdf", icon: Code, title: "HTML to PDF", description: "Render HTML markup as a downloadable PDF.", color: "tool-split" },
      { to: "/csv-to-pdf", icon: TableIcon, title: "CSV to PDF", description: "Convert spreadsheet CSV data into a PDF table.", color: "tool-convert" },
      { to: "/text-to-pdf", icon: Type, title: "Text to PDF", description: "Paste any text and convert it into a paginated PDF.", color: "tool-merge" },
      { to: "/markdown-to-pdf", icon: FileCode, title: "Markdown to PDF", description: "Render Markdown into a beautifully styled PDF.", color: "tool-split" },
      { to: "/blank-pdf", icon: FilePlus2, title: "Blank PDF", description: "Generate empty PDFs in any standard size.", color: "tool-merge" },
    ],
  },
  {
    id: "convert-from",
    name: "Convert from PDF",
    description: "Export PDFs to Word, images and plain text.",
    tools: [
      { to: "/pdf-to-word", icon: FileType2, title: "PDF to Word", description: "Extract PDF text into an editable .docx file.", color: "tool-convert" },
      { to: "/pdf-to-jpg", icon: ImageIcon, title: "PDF to JPG", description: "Turn each PDF page into a high-quality JPG.", color: "tool-compress" },
      { to: "/pdf-to-png", icon: FileImage2, title: "PDF to PNG", description: "Convert PDF pages to lossless PNG images.", color: "tool-compress" },
      { to: "/extract-text", icon: FileTextIcon, title: "Extract Text", description: "Pull all text from a PDF into a .txt file.", color: "tool-merge" },
      { to: "/extract-images", icon: Images, title: "Extract Images", description: "Save every PDF page as a high-resolution PNG.", color: "tool-split" },
    ],
  },
  {
    id: "edit",
    name: "Edit PDF",
    description: "Annotate, sign and personalize your documents.",
    tools: [
      { to: "/page-numbers", icon: Hash, title: "Page Numbers", description: "Add page numbers to every page.", color: "tool-merge" },
      { to: "/header-footer", icon: AlignVerticalSpaceAround, title: "Header & Footer", description: "Stamp custom header & footer text on every page.", color: "tool-convert" },
      { to: "/watermark-pdf", icon: Stamp, title: "Watermark PDF", description: "Stamp your PDF with a custom text watermark.", color: "tool-split" },
      { to: "/sign-pdf", icon: PenTool, title: "Sign PDF", description: "Draw your signature and add it to a PDF.", color: "tool-compress" },
      { to: "/crop-pdf", icon: Crop, title: "Crop PDF", description: "Trim equal margins from every page.", color: "tool-convert" },
      { to: "/edit-metadata", icon: Tags, title: "Edit Metadata", description: "Update PDF title, author, subject and keywords.", color: "tool-split" },
      { to: "/pdf-info", icon: Info, title: "PDF Info", description: "Inspect metadata, page sizes & file properties.", color: "tool-convert" },
      { to: "/bates-numbering", icon: Gavel, title: "Bates Numbering", description: "Stamp legal Bates numbers on every page.", color: "tool-compress" },
      { to: "/word-count", icon: BarChart3, title: "PDF Word Count", description: "Count words, chars & estimate reading time.", color: "tool-merge" },
    ],
  },
  {
    id: "security",
    name: "PDF Security",
    description: "Protect or unlock your PDF documents.",
    tools: [
      { to: "/protect-pdf", icon: Lock, title: "Protect PDF", description: "Add a password to keep your PDF private.", color: "tool-convert" },
      { to: "/unlock-pdf", icon: Unlock, title: "Unlock PDF", description: "Remove restrictions from a protected PDF.", color: "tool-merge" },
    ],
  },
];

const tools: Tool[] = categories.flatMap((c) => c.tools);

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Files are processed instantly in your browser — no waiting in queues.",
  },
  {
    icon: ShieldCheck,
    title: "100% Secure",
    description: "Your files never leave your device. Everything runs locally in your browser.",
  },
  {
    icon: Heart,
    title: "Free Forever",
    description: "All tools are completely free. No signup, no watermark, no limits.",
  },
];

const faqs = [
  {
    question: "Are these PDF tools really free?",
    answer:
      "Yes. Every tool on PDFMaster is 100% free with no hidden fees, no signups, and no watermarks added to your files.",
  },
  {
    question: "Is it safe to upload my PDFs?",
    answer:
      "Absolutely. All processing happens directly in your browser using JavaScript. Your files are never uploaded to any server.",
  },
  {
    question: "What is the maximum file size I can process?",
    answer:
      "You can process PDFs up to 50MB. For very large files, browser performance depends on your device's memory.",
  },
  {
    question: "Do I need to install any software?",
    answer:
      "No installation required. PDFMaster works entirely in your web browser on Windows, macOS, Linux, iOS, and Android.",
  },
];

const SITE_URL = "https://masterpdftools.lovable.app";

const itemListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: tools.map((t, i) => ({
    "@type": "ListItem",
    position: i + 1,
    url: `${SITE_URL}${t.to}`,
    name: t.title,
  })),
};

const Index = () => {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const q = query.trim().toLowerCase();

  const matchingTools = q
    ? tools.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      )
    : [];

  const filteredCategories = q
    ? categories
        .map((c) => ({
          ...c,
          tools: c.tools.filter(
            (t) =>
              t.title.toLowerCase().includes(q) ||
              t.description.toLowerCase().includes(q)
          ),
        }))
        .filter((c) => c.tools.length > 0)
    : categories;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
        inputRef.current?.focus();
        setShowDropdown(true);
      }
      if (e.key === "Escape") {
        setShowDropdown(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const clearSearch = () => {
    setQuery("");
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  return (
    <Layout>
      <Seo
        title={`PDFMaster Tools — ${tools.length}+ Free Online PDF Tools: Merge, Split, Compress, Convert`}
        description={`${tools.length}+ free online PDF tools. Merge, split, compress, convert, sign, edit, protect & unlock PDFs in your browser. 100% private, no signup, no upload.`}
        keywords="pdf tools, online pdf tools, free pdf editor, merge pdf, split pdf, compress pdf, pdf to word, jpg to pdf, csv to pdf, sign pdf online"
        faqSchema={faqs}
        softwareApp={{
          name: "PDFMaster Tools",
          category: "WebApplication",
          applicationCategory: "BusinessApplication",
        }}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(itemListJsonLd)}</script>
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto px-4 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-6">
            <Heart className="h-3 w-3" /> 100% Free • No Signup
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 max-w-3xl mx-auto leading-tight">
            All-in-One Free <span className="text-primary">PDF Tools</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Merge, Split, Compress & Convert PDFs instantly — right in your browser.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto mb-8 relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search PDF tools..."
                className="w-full h-14 pl-12 pr-12 rounded-2xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary shadow-sm text-base"
              />
              {query ? (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted text-muted-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground border border-border rounded-md px-1.5 py-0.5 hidden sm:inline-block">
                  /
                </span>
              )}
            </div>

            {/* Dropdown results */}
            {showDropdown && q && (
              <div
                ref={dropdownRef}
                className="absolute left-0 right-0 top-full mt-2 bg-card border border-border rounded-2xl shadow-lg z-30 overflow-hidden"
              >
                {matchingTools.length > 0 ? (
                  <div className="py-2 max-h-80 overflow-y-auto">
                    {matchingTools.map((t) => (
                      <Link
                        key={t.to}
                        to={t.to}
                        onClick={() => {
                          setQuery("");
                          setShowDropdown(false);
                        }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors"
                      >
                        <div
                          className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 text-white"
                          style={{ backgroundColor: `hsl(var(--${t.color}))` }}
                        >
                          <t.icon className="h-4 w-4" />
                        </div>
                        <div className="text-left min-w-0">
                          <div className="text-sm font-medium truncate">{t.title}</div>
                          <div className="text-xs text-muted-foreground truncate">{t.description}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No tools found for "{query}"
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {tools.slice(0, 4).map((t) => (
              <Button key={t.to} asChild variant="outline" size="lg">
                <Link to={t.to}>
                  <t.icon className="h-4 w-4" />
                  {t.title}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section id="tools" className="container mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">All PDF Tools by Category</h2>
          <p className="text-muted-foreground">
            {q
              ? `${matchingTools.length} result${matchingTools.length === 1 ? "" : "s"} for "${query}"`
              : `Browse ${tools.length} free utilities organized by what you need to do.`}
          </p>
        </div>

        {/* Category nav */}
        {!q && (
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map((c) => (
              <a
                key={c.id}
                href={`#${c.id}`}
                className="px-4 py-2 text-sm font-medium rounded-full border border-border bg-card hover:border-primary hover:text-primary transition-colors"
              >
                {c.name}
              </a>
            ))}
          </div>
        )}

        <div className="space-y-14">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((cat) => (
              <div key={cat.id} id={cat.id} className="scroll-mt-20">
                <div className="flex items-end justify-between gap-4 mb-5 border-b border-border pb-3">
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold">{cat.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{cat.description}</p>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground shrink-0">
                    {cat.tools.length} tools
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {cat.tools.map((t) => (
                    <Link key={t.to} to={t.to} className="tool-card group block relative">
                      {t.isNew && (
                        <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                          New
                        </span>
                      )}
                      <div
                        className="h-12 w-12 rounded-xl flex items-center justify-center mb-4 text-white"
                        style={{ backgroundColor: `hsl(var(--${t.color}))` }}
                      >
                        <t.icon className="h-6 w-6" />
                      </div>
                      <h4 className="text-lg font-semibold mb-2">{t.title}</h4>
                      <p className="text-sm text-muted-foreground mb-4">{t.description}</p>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                        Try it <ArrowRight className="h-4 w-4" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No tools found</p>
              <p className="text-muted-foreground text-sm">
                Try a different search term or browse all tools below.
              </p>
              <Button className="mt-4" variant="outline" onClick={() => setQuery("")}>
                Clear Search
              </Button>
            </div>
          )}
        </div>
      </section>

      <div className="container mx-auto px-4">
        <AdSlot label="Ad — Banner (728x90)" />
      </div>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Why Choose PDFMaster?</h2>
          <p className="text-muted-foreground">Built for speed, security, and simplicity.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((f) => (
            <div key={f.title} className="text-center p-6">
              <div className="h-14 w-14 rounded-2xl bg-accent text-primary mx-auto mb-4 flex items-center justify-center">
                <f.icon className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SEO Content */}
      <section className="bg-secondary/30 border-y border-border py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <article className="prose prose-slate dark:prose-invert max-w-none">
            <h2>The Complete Guide to Working with PDF Files Online</h2>
            <p>
              PDF (Portable Document Format) has become the universal standard for sharing
              documents across platforms, devices, and operating systems. Whether you're a
              student combining research papers, a business professional preparing reports, or
              someone managing personal documents, you need reliable PDF tools you can trust.
              PDFMaster Tools provides a complete suite of free, browser-based PDF utilities
              that work without installing software, creating accounts, or compromising your
              privacy.
            </p>

            <h3>How to Merge PDF Files Online</h3>
            <p>
              Merging PDFs is one of the most common tasks people need to perform. Whether
              you're combining invoices for monthly accounting, joining scanned pages into a
              single document, or assembling a portfolio, the process should be simple. With
              PDFMaster's <Link to="/merge-pdf">Merge PDF tool</Link>, you can drag and drop
              multiple PDF files, reorder them by simply dragging cards into the right
              sequence, and download the combined result in seconds. There's no limit on how
              many files you can merge in a session, and because everything happens locally in
              your browser, sensitive documents like contracts and tax forms never leave your
              device.
            </p>

            <h3>How to Compress PDFs Online Without Losing Quality</h3>
            <p>
              Large PDF files are a common headache — email providers reject attachments over
              a certain size, cloud storage fills up quickly, and uploads slow to a crawl.
              PDFMaster's <Link to="/compress-pdf">Compress PDF tool</Link> reduces file size
              by optimizing embedded images, stripping unnecessary metadata, and re-encoding
              content streams. You can choose between Low, Medium, and High compression
              levels depending on whether you prioritize quality or smaller file size. Most
              image-heavy PDFs can be reduced by 40–70% with virtually no visible quality
              loss, making them easier to email, upload, and archive.
            </p>

            <h3>Splitting PDFs and Extracting Specific Pages</h3>
            <p>
              Sometimes you only need a few pages from a long PDF — a single chapter from an
              ebook, a specific receipt from a bank statement, or a particular slide from a
              presentation. The <Link to="/split-pdf">Split PDF tool</Link> lets you extract
              individual pages or split a document into multiple files using flexible page
              ranges (e.g., 1-3, 5, 8-10). This is far more efficient than printing and
              re-scanning, and the output preserves the original PDF's formatting, fonts, and
              embedded images perfectly.
            </p>

            <h3>Converting PDF to Word for Easy Editing</h3>
            <p>
              PDFs are designed for sharing, not editing. When you need to modify content —
              update a resume, edit a report, or repurpose text from an article — converting
              to a Microsoft Word (.docx) file makes the job vastly easier. Our{" "}
              <Link to="/pdf-to-word">PDF to Word converter</Link> extracts text from your
              PDF and packages it into a clean, editable .docx file ready to open in Word,
              Google Docs, or LibreOffice.
            </p>

            <h3>Privacy and Security First</h3>
            <p>
              Most online PDF tools upload your files to remote servers, which raises serious
              concerns about data privacy — especially for contracts, medical records, and
              financial documents. PDFMaster takes a fundamentally different approach: every
              tool runs entirely in your browser using JavaScript and WebAssembly. Your files
              are never transmitted over the internet, never stored on our servers, and never
              seen by anyone but you. Close the tab and the files are gone. It's the safest
              way to work with sensitive PDFs online.
            </p>
          </article>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <FAQ items={faqs} />
      </section>
    </Layout>
  );
};

export default Index;
