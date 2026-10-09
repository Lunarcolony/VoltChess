export interface ReadingSource {
  id: string;
  name: string;
  rssUrl: string;
  homepage: string;
}

export const READING_SOURCES: ReadingSource[] = [
  {
    id: "sciencedaily",
    name: "ScienceDaily",
    rssUrl: "https://www.sciencedaily.com/rss/all.xml",
    homepage: "https://www.sciencedaily.com",
  },
  {
    id: "smithsonian",
    name: "Smithsonian Magazine",
    rssUrl: "https://www.smithsonianmag.com/rss/latest_articles/",
    homepage: "https://www.smithsonianmag.com",
  },
  {
    id: "sciam",
    name: "Scientific American",
    rssUrl: "https://rss.sciam.com/ScientificAmerican-News",
    homepage: "https://www.scientificamerican.com",
  },
  {
    id: "nyt-science",
    name: "NYT Science",
    rssUrl: "https://rss.nytimes.com/services/xml/rss/nyt/Science.xml",
    homepage: "https://www.nytimes.com/section/science",
  },
];

export function getReadingSource(id: string): ReadingSource | undefined {
  return READING_SOURCES.find((source) => source.id === id);
}
