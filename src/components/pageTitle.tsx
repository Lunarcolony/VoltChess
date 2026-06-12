import Head from "@/components/Head";
import { DEFAULT_SEO } from "@/data/seo";

export const PageTitle = ({
  title,
  description,
}: {
  title: string;
  description?: string;
}) => {
  const metaDescription = description || DEFAULT_SEO.description;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={metaDescription} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content="website" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={metaDescription} />
    </Head>
  );
};
