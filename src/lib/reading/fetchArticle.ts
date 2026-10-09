const JINA_READER_BASE = "https://r.jina.ai/";

function jinaReaderUrl(articleUrl: string): string {
  return `${JINA_READER_BASE}${articleUrl}`;
}

function extractTitle(markdown: string, fallback: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() || fallback;
}

function cleanMarkdown(markdown: string): string {
  return markdown
    .replace(/^Title:\s*.+\n?/im, "")
    .replace(/^URL Source:\s*.+\n?/im, "")
    .replace(/^Markdown Content:\s*\n?/im, "")
    .replace(/^Published Time:\s*.+\n?/im, "")
    .trim();
}

export interface FetchedArticle {
  title: string;
  content: string;
  url: string;
}

export async function fetchArticle(
  articleUrl: string
): Promise<FetchedArticle> {
  const response = await fetch(jinaReaderUrl(articleUrl), {
    headers: {
      Accept: "text/plain",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Could not load article (${response.status}). Try opening the original link.`
    );
  }

  const raw = await response.text();
  const content = cleanMarkdown(raw);
  const title = extractTitle(content, "Article");

  return {
    url: articleUrl,
    title,
    content,
  };
}
