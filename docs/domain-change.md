# Changing the public site domain

VoltChess canonical URLs come from one env var. Prefer that over hunting hardcodes.

## Current primary

`https://www.dawvio.com` (`VITE_SITE_URL`)

- `dawvio.com` (apex) → 308 to `www.dawvio.com` (Vercel → Project → Domains).
- `voltchess.vercel.app` → 308 to `https://www.dawvio.com/:path*` (host route in `vercel.json`).
- API: `https://api.dawvio.com` (named Cloudflare tunnel → Pi; see `backend/PI_CONTINUOUS_ANALYSIS.md`).
- DNS: registrar IONOS; `dawvio.com` and `www` are `A 216.198.79.1` (Vercel).

Previous hosts: `voltchess.me` (expired), then `voltchess.vercel.app`.

## Cutover steps (any future host)

1. Set `VITE_SITE_URL=https://new-host` in Vercel (Production + Preview) and local `.env`.
2. Redeploy — sitemap, `robots.txt`, prerender, OG/canonical, and IndexNow all follow `scripts/seo-urls.mjs` / `src/data/seo.ts`.
3. Add the new hostname in Vercel → Project → Domains.
4. Update backend `CORS_ALLOWED_ORIGINS` (and `VITE_API_URL` if the API host changes). `*.vercel.app` is already allowed by regex.
5. Search hygiene: new Google Search Console + Bing property, submit `https://new-host/sitemap.xml`, run `npm run indexnow`.
6. **If you still control the previous domain**, add a host-based permanent redirect in `vercel.json` from old → new.
7. **Notify users** (do not rely on search alone):
   - Update README + pin a GitHub issue/discussion
   - Edit prior Chess.com / Lichess / Reddit / Discord posts
   - Email Academy accounts if any real users exist
   - Share `/moved` so people trust the new URL

## Outreach message template

> **VoltChess moved.** The free analyzer is now at **https://www.dawvio.com** (same app, no sign-up). The old addresses `voltchess.me` and `voltchess.vercel.app` are retired — please update bookmarks.

## Post-deploy checklist (this cutover)

- [ ] Vercel env: `VITE_SITE_URL=https://www.dawvio.com` (only matters if Vercel ever builds from source)
- [ ] Confirm `https://www.dawvio.com/` loads and canonical/OG point at `www.dawvio.com`
- [ ] Confirm `https://dawvio.com/` and `https://voltchess.vercel.app/` both 308 to `https://www.dawvio.com/`
- [ ] Confirm `https://www.dawvio.com/moved` and `https://www.dawvio.com/sitemap.xml`
- [ ] Confirm IndexNow key: `https://www.dawvio.com/30a48e821f564f43bd421d99f842e4e2.txt`
- [ ] Pi: point the named tunnel at `api.dawvio.com` and set `CORS_ALLOWED_ORIGINS` to include `https://www.dawvio.com` and `https://dawvio.com`
- [ ] Re-publish the browser extension (new default URL + host permissions)
- [ ] GSC/Bing: add `www.dawvio.com` property, use Change of Address from `voltchess.vercel.app`, submit sitemap, `npm run indexnow`
