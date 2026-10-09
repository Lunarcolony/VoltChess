export interface FeedItem {
  url: string;
  title: string;
  sourceId: string;
  excerpt: string;
  publishedAt: string;
}

export type FontSizePref = "S" | "M" | "L" | "XL";
export type LineWidthPref = "narrow" | "medium" | "wide";

export interface ReadingPrefs {
  fontSize: FontSizePref;
  lineWidth: LineWidthPref;
}

export interface SavedArticle {
  url: string;
  title: string;
  sourceId: string;
  excerpt: string;
  publishedAt: string;
  savedAt: string;
  read: boolean;
  scrollPosition: number;
  cachedContent?: string;
  cachedTitle?: string;
}

export const DEFAULT_READING_PREFS: ReadingPrefs = {
  fontSize: "M",
  lineWidth: "medium",
};
