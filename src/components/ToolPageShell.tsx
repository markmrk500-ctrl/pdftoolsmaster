import { Layout } from "@/components/layout/Layout";
import { Seo, SeoProps } from "@/components/Seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AdSlot } from "@/components/AdSlot";
import { ReactNode } from "react";

interface ToolPageShellProps {
  title: string;
  description: string;
  keywords?: string;
  h1: string;
  intro: string;
  faqSchema: { question: string; answer: string }[];
  toolUI: ReactNode;
  seoContent: ReactNode;
  faqSection: ReactNode;
  breadcrumbName?: string;
  breadcrumbPath?: string;
  softwareApp?: SeoProps["softwareApp"];
  howTo?: SeoProps["howTo"];
}

export const ToolPageShell = ({
  title,
  description,
  keywords,
  h1,
  intro,
  faqSchema,
  toolUI,
  seoContent,
  faqSection,
  breadcrumbName,
  breadcrumbPath,
  softwareApp,
  howTo,
}: ToolPageShellProps) => {
  const breadcrumbs = breadcrumbName && breadcrumbPath
    ? [{ name: breadcrumbName, url: breadcrumbPath }]
    : undefined;

  return (
    <Layout>
      <Seo
        title={title}
        description={description}
        keywords={keywords}
        faqSchema={faqSchema}
        breadcrumbs={breadcrumbs}
        softwareApp={softwareApp || (breadcrumbName ? { name: breadcrumbName } : undefined)}
        howTo={howTo}
      />
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className="bg-gradient-to-b from-accent/40 to-background border-b border-border">
        <div className="container mx-auto px-4 py-10 md:py-14 text-center max-w-3xl">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{h1}</h1>
          <p className="text-base md:text-lg text-muted-foreground">{intro}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          <AdSlot label="Ad — Top Banner (728x90)" className="mb-8" />
          {toolUI}
          <AdSlot label="Ad — Middle Content" className="my-12" />
          <article className="prose prose-slate dark:prose-invert max-w-none">
            {seoContent}
          </article>
          <div className="mt-16">{faqSection}</div>
        </div>
      </div>
    </Layout>
  );
};
