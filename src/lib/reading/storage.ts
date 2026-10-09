import type {
  FeedItem,
  FontSizePref,
  LineWidthPref,
  ReadingPrefs,
  SavedArticle,
} from "@/lib/reading/types";
import { DEFAULT_READING_PREFS } from "@/lib/reading/types";

const SAVED_KEY = "voltchess_reading_saved";
const PREFS_KEY = "voltchess_reading_prefs";
const CACHE_PREFIX = "voltchess_reading_cache:";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getSavedArticles(): SavedArticle[] {
  return readJson<SavedArticle[]>(SAVED_KEY, []);
}

export function saveArticle(item: FeedItem): SavedArticle[] {
  const saved = getSavedArticles();
  if (saved.some((entry) => entry.url === item.url)) {
    return saved;
  }

  const entry: SavedArticle = {
    ...item,
    savedAt: new Date().toISOString(),
    read: false,
    scrollPosition: 0,
  };

  const next = [entry, ...saved];
  writeJson(SAVED_KEY, next);
  return next;
}

export function removeSavedArticle(url: string): SavedArticle[] {
  const next = getSavedArticles().filter((entry) => entry.url !== url);
  writeJson(SAVED_KEY, next);
  return next;
}

export function markArticleRead(url: string, read = true): SavedArticle[] {
  const saved = getSavedArticles();
  const existing = saved.find((entry) => entry.url === url);

  if (existing) {
    existing.read = read;
    writeJson(SAVED_KEY, saved);
    return saved;
  }

  const entry: SavedArticle = {
    url,
    title: url,
    sourceId: "custom",
    excerpt: "",
    publishedAt: new Date().toISOString(),
    savedAt: new Date().toISOString(),
    read,
    scrollPosition: 0,
  };

  const next = [entry, ...saved];
  writeJson(SAVED_KEY, next);
  return next;
}

export function isArticleRead(url: string): boolean {
  return getSavedArticles().some((entry) => entry.url === url && entry.read);
}

export function isArticleSaved(url: string): boolean {
  return getSavedArticles().some((entry) => entry.url === url);
}

export function setScrollPosition(url: string, scrollPosition: number): void {
  const saved = getSavedArticles();
  const entry = saved.find((item) => item.url === url);
  if (entry) {
    entry.scrollPosition = scrollPosition;
    writeJson(SAVED_KEY, saved);
  }
}

export function getScrollPosition(url: string): number {
  return (
    getSavedArticles().find((entry) => entry.url === url)?.scrollPosition ?? 0
  );
}

export function cacheArticleContent(
  url: string,
  title: string,
  content: string
): void {
  localStorage.setItem(
    `${CACHE_PREFIX}${url}`,
    JSON.stringify({ title, content, cachedAt: new Date().toISOString() })
  );

  const saved = getSavedArticles();
  const entry = saved.find((item) => item.url === url);
  if (entry) {
    entry.cachedContent = content;
    entry.cachedTitle = title;
    entry.title = title;
    writeJson(SAVED_KEY, saved);
  }
}

export function getCachedArticleContent(
  url: string
): { title: string; content: string } | null {
  const fromSaved = getSavedArticles().find((entry) => entry.url === url);
  if (fromSaved?.cachedContent) {
    return {
      title: fromSaved.cachedTitle || fromSaved.title,
      content: fromSaved.cachedContent,
    };
  }

  const raw = localStorage.getItem(`${CACHE_PREFIX}${url}`);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { title: string; content: string };
    return parsed;
  } catch {
    return null;
  }
}

export function getReadingPrefs(): ReadingPrefs {
  return readJson<ReadingPrefs>(PREFS_KEY, DEFAULT_READING_PREFS);
}

export function setReadingPrefs(prefs: Partial<ReadingPrefs>): ReadingPrefs {
  const next = { ...getReadingPrefs(), ...prefs };
  writeJson(PREFS_KEY, next);
  return next;
}

export function fontSizeToPx(size: FontSizePref): number {
  const map: Record<FontSizePref, number> = {
    S: 16,
    M: 18,
    L: 20,
    XL: 22,
  };
  return map[size];
}

export function lineWidthToMaxWidth(width: LineWidthPref): number {
  const map: Record<LineWidthPref, number> = {
    narrow: 560,
    medium: 680,
    wide: 820,
  };
  return map[width];
}
