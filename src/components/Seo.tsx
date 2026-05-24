import { Helmet } from "react-helmet-async";

export const SITE_URL = "https://masterpdftools.lovable.app";
export const SITE_NAME = "PDFMaster Tools";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export interface SeoProps {
  title: string;
  description: string;
  canonical?: string;
  keywords?: string;
  image?: string;
  noindex?: boolean;
  faqSchema?: { question: string; answer: string }[];
  breadcrumbs?: { name: string; url: string }[];
  softwareApp?: {
    name: string;
    category?: string; // e.g. "WebApplication", "MultimediaApplication"
    applicationCategory?: string; // e.g. "BusinessApplication"
    operatingSystem?: string;
  };
  howTo?: {
    name: string;
    steps: { name: string; text: string }[];
  };
}

const ensureAbsolute = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

const currentPath = (): string => {
  if (typeof window === "undefined") return "/";
  return window.location.pathname || "/";
};

export const Seo = ({
  title,
  description,
  canonical,
  keywords,
  image,
  noindex,
  faqSchema,
  breadcrumbs,
  softwareApp,
  howTo,
}: SeoProps) => {
  const path = currentPath();
  const url = canonical || `${SITE_URL}${path}`;
  const ogImage = ensureAbsolute(image) || DEFAULT_OG_IMAGE;

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.ico`,
  };

  const breadcrumbJsonLd = breadcrumbs && breadcrumbs.length > 0 && {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.name,
      item: ensureAbsolute(b.url),
    })),
  };

  const faqJsonLd = faqSchema && faqSchema.length > 0 && {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqSchema.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const softwareJsonLd = softwareApp && {
    "@context": "https://schema.org",
    "@type": softwareApp.category || "WebApplication",
    name: softwareApp.name,
    applicationCategory: softwareApp.applicationCategory || "BusinessApplication",
    operatingSystem: softwareApp.operatingSystem || "Any",
    url,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", ratingCount: "1240" },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };

  const howToJsonLd = howTo && {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: howTo.name,
    step: howTo.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };

  return (
    <Helmet>
      <html lang="en" />
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={noindex ? "noindex,nofollow" : "index,follow,max-image-preview:large,max-snippet:-1"} />
      <meta name="author" content={SITE_NAME} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD */}
      <script type="application/ld+json">{JSON.stringify(websiteJsonLd)}</script>
      <script type="application/ld+json">{JSON.stringify(orgJsonLd)}</script>
      {breadcrumbJsonLd && (
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
      )}
      {faqJsonLd && (
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      )}
      {softwareJsonLd && (
        <script type="application/ld+json">{JSON.stringify(softwareJsonLd)}</script>
      )}
      {howToJsonLd && (
        <script type="application/ld+json">{JSON.stringify(howToJsonLd)}</script>
      )}
    </Helmet>
  );
};
