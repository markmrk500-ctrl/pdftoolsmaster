import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import MergePdf from "./pages/MergePdf.tsx";
import SplitPdf from "./pages/SplitPdf.tsx";
import CompressPdf from "./pages/CompressPdf.tsx";
import PdfToWord from "./pages/PdfToWord.tsx";
import RotatePdf from "./pages/RotatePdf.tsx";
import UnlockPdf from "./pages/UnlockPdf.tsx";
import ProtectPdf from "./pages/ProtectPdf.tsx";
import PageNumbers from "./pages/PageNumbers.tsx";
import WatermarkPdf from "./pages/WatermarkPdf.tsx";
import JpgToPdf from "./pages/JpgToPdf.tsx";
import PdfToJpg from "./pages/PdfToJpg.tsx";
import DeletePages from "./pages/DeletePages.tsx";
import OrganizePdf from "./pages/OrganizePdf.tsx";
import CropPdf from "./pages/CropPdf.tsx";
import Grayscale from "./pages/Grayscale.tsx";
import ExtractText from "./pages/ExtractText.tsx";
import HtmlToPdf from "./pages/HtmlToPdf.tsx";
import SignPdf from "./pages/SignPdf.tsx";
import PdfToPng from "./pages/PdfToPng.tsx";
import EditMetadata from "./pages/EditMetadata.tsx";
import RepairPdf from "./pages/RepairPdf.tsx";
import ResizePdf from "./pages/ResizePdf.tsx";
import PdfInfo from "./pages/PdfInfo.tsx";
import NupPdf from "./pages/NupPdf.tsx";
import ReversePages from "./pages/ReversePages.tsx";
import ExtractImages from "./pages/ExtractImages.tsx";
import HeaderFooter from "./pages/HeaderFooter.tsx";
import BlankPdf from "./pages/BlankPdf.tsx";
import FlattenPdf from "./pages/FlattenPdf.tsx";
import CsvToPdf from "./pages/CsvToPdf.tsx";
import TextToPdf from "./pages/TextToPdf.tsx";
import MarkdownToPdf from "./pages/MarkdownToPdf.tsx";
import DuplicatePages from "./pages/DuplicatePages.tsx";
import BatesNumbering from "./pages/BatesNumbering.tsx";
import WordCount from "./pages/WordCount.tsx";
import InvertColors from "./pages/InvertColors.tsx";
import AiSummarizePdf from "./pages/AiSummarizePdf.tsx";
import AiTranslatePdf from "./pages/AiTranslatePdf.tsx";
import AiOcrPdf from "./pages/AiOcrPdf.tsx";
import About from "./pages/About.tsx";
import Privacy from "./pages/Privacy.tsx";
import Terms from "./pages/Terms.tsx";
import Contact from "./pages/Contact.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/merge-pdf" element={<MergePdf />} />
            <Route path="/split-pdf" element={<SplitPdf />} />
            <Route path="/compress-pdf" element={<CompressPdf />} />
            <Route path="/pdf-to-word" element={<PdfToWord />} />
            <Route path="/rotate-pdf" element={<RotatePdf />} />
            <Route path="/unlock-pdf" element={<UnlockPdf />} />
            <Route path="/protect-pdf" element={<ProtectPdf />} />
            <Route path="/page-numbers" element={<PageNumbers />} />
            <Route path="/watermark-pdf" element={<WatermarkPdf />} />
            <Route path="/jpg-to-pdf" element={<JpgToPdf />} />
            <Route path="/pdf-to-jpg" element={<PdfToJpg />} />
            <Route path="/delete-pages" element={<DeletePages />} />
            <Route path="/organize-pdf" element={<OrganizePdf />} />
            <Route path="/crop-pdf" element={<CropPdf />} />
            <Route path="/grayscale-pdf" element={<Grayscale />} />
            <Route path="/extract-text" element={<ExtractText />} />
            <Route path="/html-to-pdf" element={<HtmlToPdf />} />
            <Route path="/sign-pdf" element={<SignPdf />} />
            <Route path="/pdf-to-png" element={<PdfToPng />} />
            <Route path="/edit-metadata" element={<EditMetadata />} />
            <Route path="/repair-pdf" element={<RepairPdf />} />
            <Route path="/resize-pdf" element={<ResizePdf />} />
            <Route path="/pdf-info" element={<PdfInfo />} />
            <Route path="/nup-pdf" element={<NupPdf />} />
            <Route path="/reverse-pages" element={<ReversePages />} />
            <Route path="/extract-images" element={<ExtractImages />} />
            <Route path="/header-footer" element={<HeaderFooter />} />
            <Route path="/blank-pdf" element={<BlankPdf />} />
            <Route path="/flatten-pdf" element={<FlattenPdf />} />
            <Route path="/csv-to-pdf" element={<CsvToPdf />} />
            <Route path="/text-to-pdf" element={<TextToPdf />} />
            <Route path="/markdown-to-pdf" element={<MarkdownToPdf />} />
            <Route path="/duplicate-pages" element={<DuplicatePages />} />
            <Route path="/bates-numbering" element={<BatesNumbering />} />
            <Route path="/word-count" element={<WordCount />} />
            <Route path="/invert-colors" element={<InvertColors />} />
            <Route path="/ai-summarize-pdf" element={<AiSummarizePdf />} />
            <Route path="/ai-translate-pdf" element={<AiTranslatePdf />} />
            <Route path="/ai-ocr-pdf" element={<AiOcrPdf />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
