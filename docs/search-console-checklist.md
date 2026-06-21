# Search Console & SEO checklist

Manual steps **after deploying** SEO updates to [voltchess.me](https://voltchess.me).

## Deploy first (required)

The favicon PNG/ICO files and SEO changes must be **committed and pushed** before they work in production.
If `https://voltchess.me/favicon.ico` shows the VoltChess app (sidebar) instead of a tiny icon, the latest build is **not deployed yet**.

Commit at minimum these untracked assets in `public/`:

- `favicon.ico`
- `favicon-48x48.png`
- `apple-touch-icon.png`
- `logo-512.png`
- `og-image.png`

Then push to trigger a Vercel redeploy. After deploy, open `https://voltchess.me/favicon.ico` — you should see a small green lightning icon, not the full website.

## Google Search Console (already set up)

1. **URL Inspection** → enter `https://voltchess.me/` → **Request indexing**
2. Repeat for high-priority landing pages:
  - `https://voltchess.me/free-chess-com-analysis`
  - `https://voltchess.me/free-lichess-game-review`
  - `https://voltchess.me/free-chess-game-analysis`
  - `https://voltchess.me/blog/voltchess-vs-chesscom-premium`
3. **Sitemaps** → submit or resubmit `https://voltchess.me/sitemap.xml`
4. **Verify favicon files are live** (GSC has no favicon checker under Settings → Crawling):
   - Open each URL in your browser — you should see/download an image, not a 404:
     - `https://voltchess.me/favicon.ico`
     - `https://voltchess.me/favicon-48x48.png`
   - Or use **URL Inspection** → paste `https://voltchess.me/` → **Test live URL** → view **Page resources** / rendered page to confirm the favicon link is present.
   - **Settings → Crawling** only shows `robots.txt` and crawl stats — if robots.txt says **"All files are valid"**, that part is done.
5. Monitor **Performance** weekly for queries:
  - `free chess.com analysis`
  - `chess game review free`
  - `free chess game analysis`
  - `stockfish game analysis`

## Bing Webmaster Tools (set up)

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. **Import from Google Search Console** (fastest) or verify via DNS/HTML tag
3. Submit sitemap: `https://voltchess.me/sitemap.xml`
4. Use **URL Submission** for homepage and `/free-chess-com-analysis`

## Vercel Analytics funnel events

The app tracks these custom events (see `RouteAnalytics.tsx` and `index.tsx`):


| Event                 | When                           |
| --------------------- | ------------------------------ |
| `pageview`            | Every route change             |
| `game_loaded`         | User loads a game from home    |
| `onboarding_complete` | First-time onboarding finishes |
| `analysis_started`    | User navigates to `/analysis`  |


Review funnel drop-off in the Vercel Analytics dashboard after deploy.

## Expected timeline

- Favicon/snippet updates: **1–4 weeks** after reindex with PNG assets live
- Ranking movement for target keywords: **4–12 weeks** with consistent content and backlinks

