import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { ReactNode } from "react";

export const StaticPage = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) => (
  <Layout>
    <Seo title={title} description={description} />
    <div className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
      <article className="prose prose-slate dark:prose-invert max-w-none">
        {children}
      </article>
    </div>
  </Layout>
);
