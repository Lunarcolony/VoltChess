# Search Console & SEO checklist

Manual steps **after deploying** SEO updates to [www.dawvio.com](https://www.dawvio.com).

Canonical host is controlled by `VITE_SITE_URL` (see [domain-change.md](./domain-change.md)).

## Deploy first (required)

The favicon PNG/ICO files and SEO changes must be **committed and pushed** before they work in production.
If `https://www.dawvio.com/favicon.ico` shows the VoltChess app (sidebar) instead of a tiny icon, the latest build is **not deployed yet**.

Commit at minimum these untracked assets in `public/`:

- `favicon.ico`
- `favicon-48x48.png`
- `apple-touch-icon.png`
- `logo-512.png`
- `og-image.png`

Then push to trigger a Vercel redeploy. After deploy, open `https://www.dawvio.com/favicon.ico` — you should see a small green lightning icon, not the full website.

## Google Search Console

1. Add a **URL-prefix** property for `https://www.dawvio.com` (new property — the old `voltchess.vercel.app` URLs 308-redirect here, so Change of Address is possible from a verified vercel.app property).
2. **URL Inspection** → enter `https://www.dawvio.com/` → **Request indexing**
3. Repeat for high-priority landing pages:
  - `https://www.dawvio.com/free-chess-com-analysis`
  - `https://www.dawvio.com/free-lichess-game-review`
  - `https://www.dawvio.com/free-chess-game-analysis`
  - `https://www.dawvio.com/blog/voltchess-vs-chesscom-premium`
  - `https://www.dawvio.com/moved`
4. **Sitemaps** → submit `https://www.dawvio.com/sitemap.xml`
5. **Verify favicon files are live**:
   - `https://www.dawvio.com/favicon.ico`
   - `https://www.dawvio.com/favicon-48x48.png`
6. Monitor **Performance** weekly for queries:
  - `free chess.com analysis`
  - `chess game review free`
  - `free chess game analysis`
  - `stockfish game analysis`

## Bing Webmaster Tools

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Add `https://www.dawvio.com` (or import from GSC)
3. Submit sitemap: `https://www.dawvio.com/sitemap.xml`
4. Use **URL Submission** for homepage and `/free-chess-com-analysis`

## IndexNow (Bing + Yandex instant crawl ping)

**Hosted key file (required):**

- `https://www.dawvio.com/30a48e821f564f43bd421d99f842e4e2.txt`

After deploy, open that URL — it should show only the key text, not the VoltChess app.

**Submit all sitemap URLs (run after each deploy):**

```bash
npm run indexnow
```

Override host if needed: `INDEXNOW_SITE_URL=https://www.dawvio.com npm run indexnow`

## User outreach (higher priority than SEO)

Most VoltChess traffic was not from search. After deploy, follow the outreach playbook in [domain-change.md](./domain-change.md) (GitHub, forums, DMs, optional Academy email, optional `.me` renew+redirect).
