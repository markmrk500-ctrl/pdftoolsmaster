import { Link, NavLink } from "react-router-dom";
import { ChevronDown, Heart, LogOut, User as UserIcon, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { DensityToggle } from "@/components/DensityToggle";

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
      { to: "/ai-chat-pdf", label: "Chat with PDF" },
      { to: "/ai-summarize-pdf", label: "AI Summarize PDF" },
      { to: "/ai-translate-pdf", label: "AI Translate PDF" },
      { to: "/ai-ocr-pdf", label: "AI OCR (Scanned PDF)" },
      { to: "/ai-mcq-generator", label: "AI MCQ Generator" },
      { to: "/ai-humanizer", label: "AI Humanizer" },
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

const companyLinks = [
  { to: "/about", label: "About" },
  { to: "/compare", label: "Compare" },
  { to: "/contact", label: "Contact" },
];

const legalLinks = [
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/terms", label: "Terms of Service" },
];

const AllToolsMenu = ({ align = "end" }: { align?: "start" | "end" }) => (
  <DropdownMenu>
    <DropdownMenuTrigger className="px-3 py-2 text-sm font-medium rounded-md text-foreground/70 hover:text-primary inline-flex items-center gap-1 outline-none">
      <Wrench className="h-4 w-4" /> All Tools <ChevronDown className="h-3.5 w-3.5" />
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align={align}
      className="w-[min(560px,calc(100vw-1rem))] max-h-[70vh] overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 overscroll-contain"
    >
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
);

const CompanyLegalMenu = () => (
  <DropdownMenu>
    <DropdownMenuTrigger className="px-3 py-2 text-sm font-medium rounded-md text-foreground/70 hover:text-primary inline-flex items-center gap-1 outline-none">
      More <ChevronDown className="h-3.5 w-3.5" />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-48">
      <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground">Company</DropdownMenuLabel>
      {companyLinks.map((l) => (
        <DropdownMenuItem key={l.to} asChild>
          <Link to={l.to}>{l.label}</Link>
        </DropdownMenuItem>
      ))}
      <DropdownMenuSeparator />
      <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground">Legal</DropdownMenuLabel>
      {legalLinks.map((l) => (
        <DropdownMenuItem key={l.to} asChild>
          <Link to={l.to}>{l.label}</Link>
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

export const Header = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between gap-2 px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
          <img src="/logo.png" alt="PDFMaster Tools" className="h-9 w-9" />
          <span className="hidden sm:inline">PDFMaster<span className="text-primary"> Tools</span></span>
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
          <AllToolsMenu />
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <DensityToggle />
          <CompanyLegalMenu />
          <UserMenu />
        </div>

        <div className="md:hidden flex items-center gap-1">
          <AllToolsMenu align="end" />
          <CompanyLegalMenu />
          <DensityToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

const UserMenu = () => {
  const { user, signOut, loading } = useAuth();
  if (loading) return null;
  if (!user) {
    return (
      <Button asChild variant="default" size="sm">
        <Link to="/auth">
          <Heart className="h-4 w-4" /> <span className="hidden sm:inline">Sign In</span>
        </Link>
      </Button>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <UserIcon className="h-4 w-4" />
          <span className="max-w-[140px] truncate hidden sm:inline">{user.email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()} className="text-destructive cursor-pointer">
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
