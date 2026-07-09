import Head from "@/components/Head";
import { useLocation } from "react-router-dom";
import { DEFAULT_SEO, OG_IMAGE, SITE_URL } from "@/data/seo";

export const PageTitle = ({
  title,
  description,
  path,
  noindex = false,
}: {
  title: string;
  description?: string;
  path?: string;
  noindex?: boolean;
}) => {
  const location = useLocation();
  const metaDescription = description || DEFAULT_SEO.description;
  const canonicalPath = path ?? location.pathname;
  const canonical = `${SITE_URL}${canonicalPath === "/" ? "/" : canonicalPath}`;

  return (
    <Head>
      <title>{title}</title>
      <meta
        name="robots"
        content={noindex ? "noindex, nofollow" : "index, follow"}
      />
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={OG_IMAGE} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={OG_IMAGE} />
    </Head>
  );
};
