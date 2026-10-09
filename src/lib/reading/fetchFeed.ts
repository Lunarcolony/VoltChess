import type { ReadingSource } from "@/data/readingSources";
import type { FeedItem } from "@/lib/reading/types";

interface Rss2JsonItem {
  title?: string;
  link?: string;
  pubDate?: string;
  description?: string;
  content?: string;
  thumbnail?: string;
}

interface Rss2JsonResponse {
  status: string;
  items?: Rss2JsonItem[];
  message?: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function excerptFromItem(item: Rss2JsonItem): string {
  const raw = item.description || item.content || "";
  const text = stripHtml(raw);
  return text.length > 220 ? `${text.slice(0, 217)}…` : text;
}

export async function fetchFeed(source: ReadingSource): Promise<FeedItem[]> {
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.rssUrl)}`;
  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error(`Could not load ${source.name} (${response.status})`);
  }

  const data = (await response.json()) as Rss2JsonResponse;
  if (data.status !== "ok" || !data.items?.length) {
    throw new Error(data.message || `No articles from ${source.name}`);
  }

  return data.items
    .filter((item): item is Rss2JsonItem & { link: string; title: string } =>
      Boolean(item.link && item.title)
    )
    .map((item) => ({
      url: item.link,
      title: item.title,
      sourceId: source.id,
      excerpt: excerptFromItem(item),
      publishedAt: item.pubDate || new Date().toISOString(),
    }));
}

export async function fetchAllFeeds(
  sources: ReadingSource[]
): Promise<FeedItem[]> {
  const results = await Promise.allSettled(
    sources.map((source) => fetchFeed(source))
  );
  const items: FeedItem[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      items.push(...result.value);
    }
  }

  items.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return items;
}
