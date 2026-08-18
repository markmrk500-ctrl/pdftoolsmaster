import { PDFDocument, StandardFonts, PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

/**
 * pdf-lib's StandardFonts only support WinAnsi (Latin-1). Any character
 * outside that range (CJK, Arabic, Urdu, Devanagari, Thai, Cyrillic, emoji,
 * smart quotes/dashes in some cases) throws at drawText/widthOfTextAtSize.
 *
 * This helper detects unsupported characters and transparently swaps in a
 * Unicode Noto font (embedded via fontkit) when needed.
 */

const NOTO_BASE = "https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts";

const SCRIPT_FONTS: Array<{ test: RegExp; regular: string; bold?: string }> = [
  { test: /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/, regular: `${NOTO_BASE}/NotoSansArabic/hinted/ttf/NotoSansArabic-Regular.ttf`, bold: `${NOTO_BASE}/NotoSansArabic/hinted/ttf/NotoSansArabic-Bold.ttf` },
  { test: /[\u0900-\u097F]/, regular: `${NOTO_BASE}/NotoSansDevanagari/hinted/ttf/NotoSansDevanagari-Regular.ttf`, bold: `${NOTO_BASE}/NotoSansDevanagari/hinted/ttf/NotoSansDevanagari-Bold.ttf` },
  { test: /[\u0980-\u09FF]/, regular: `${NOTO_BASE}/NotoSansBengali/hinted/ttf/NotoSansBengali-Regular.ttf`, bold: `${NOTO_BASE}/NotoSansBengali/hinted/ttf/NotoSansBengali-Bold.ttf` },
  { test: /[\u0E00-\u0E7F]/, regular: `${NOTO_BASE}/NotoSansThai/hinted/ttf/NotoSansThai-Regular.ttf`, bold: `${NOTO_BASE}/NotoSansThai/hinted/ttf/NotoSansThai-Bold.ttf` },
  { test: /[\u4E00-\u9FFF\u3400-\u4DBF]/, regular: "https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk@main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf" },
  { test: /[\u3040-\u30FF]/, regular: "https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk@main/Sans/OTF/Japanese/NotoSansCJKjp-Regular.otf" },
  { test: /[\uAC00-\uD7AF]/, regular: "https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk@main/Sans/OTF/Korean/NotoSansCJKkr-Regular.otf" },
];

const FALLBACK = {
  regular: `${NOTO_BASE}/NotoSans/hinted/ttf/NotoSans-Regular.ttf`,
  bold: `${NOTO_BASE}/NotoSans/hinted/ttf/NotoSans-Bold.ttf`,
};

const cache = new Map<string, Promise<ArrayBuffer>>();

const fetchFont = (url: string): Promise<ArrayBuffer> => {
  if (!cache.has(url)) {
    cache.set(
      url,
      fetch(url).then((r) => {
        if (!r.ok) throw new Error(`Font fetch failed: ${r.status}`);
        return r.arrayBuffer();
      })
    );
  }
  return cache.get(url)!;
};

/** True when every character in `text` can be encoded by the WinAnsi standard fonts. */
export const isWinAnsiSafe = (text: string): boolean => {
  for (const ch of text) {
    const c = ch.codePointAt(0)!;
    if (c === 10 || c === 13 || c === 9) continue;
    if (c >= 32 && c <= 126) continue;
    if (c >= 160 && c <= 255) continue;
    // A handful of WinAnsi-mapped punctuation in the 0x2010-0x20AC range
    if ([0x2013, 0x2014, 0x2018, 0x2019, 0x201a, 0x201c, 0x201d, 0x201e, 0x2020, 0x2021, 0x2022, 0x2026, 0x2030, 0x2039, 0x203a, 0x20ac, 0x2122].includes(c)) continue;
    return false;
  }
  return true;
};

/** Replace characters the standard fonts can't encode with "?" (last-resort fallback). */
export const sanitizeWinAnsi = (text: string): string =>
  Array.from(text)
    .map((ch) => (isWinAnsiSafe(ch) ? ch : "?"))
    .join("");

/**
 * Embed a font suitable for `sampleText`. Uses the built-in Helvetica/Courier
 * for plain Latin text (fast, no network), and downloads a matching Noto font
 * when the text contains non-Latin characters.
 */
export async function embedTextFont(
  pdf: PDFDocument,
  sampleText: string,
  opts: { bold?: boolean; mono?: boolean } = {}
): Promise<PDFFont> {
  const { bold = false, mono = false } = opts;

  if (isWinAnsiSafe(sampleText)) {
    const std = mono
      ? bold
        ? StandardFonts.CourierBold
        : StandardFonts.Courier
      : bold
        ? StandardFonts.HelveticaBold
        : StandardFonts.Helvetica;
    return pdf.embedFont(std);
  }

  const match = SCRIPT_FONTS.find((s) => s.test.test(sampleText));
  const url = match ? (bold && match.bold ? match.bold : match.regular) : bold ? FALLBACK.bold : FALLBACK.regular;

  try {
    pdf.registerFontkit(fontkit);
    const bytes = await fetchFont(url);
    return await pdf.embedFont(bytes, { subset: true });
  } catch (e) {
    console.warn("Unicode font embed failed, falling back to Helvetica:", e);
    return pdf.embedFont(bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica);
  }
}

/** Draw text safely: never throws on unencodable glyphs. */
export function safeDrawText(
  page: { drawText: (t: string, o: any) => void },
  text: string,
  options: any
) {
  try {
    page.drawText(text, options);
  } catch {
    try {
      page.drawText(sanitizeWinAnsi(text), options);
    } catch {
      /* give up on this line rather than failing the whole document */
    }
  }
}

/** Measure text safely: falls back to an approximation if the font can't encode it. */
export function safeWidth(font: PDFFont, text: string, size: number): number {
  try {
    return font.widthOfTextAtSize(text, size);
  } catch {
    try {
      return font.widthOfTextAtSize(sanitizeWinAnsi(text), size);
    } catch {
      return text.length * size * 0.5;
    }
  }
}
