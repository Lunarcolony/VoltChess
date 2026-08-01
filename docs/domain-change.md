# Changing the public site domain

VoltChess canonical URLs come from one env var. Prefer that over hunting hardcodes.

## Current primary

`https://voltchess.vercel.app` (`VITE_SITE_URL`)

## Cutover steps (any future host)

1. Set `VITE_SITE_URL=https://new-host` in Vercel (Production + Preview) and local `.env`.
2. Redeploy — sitemap, `robots.txt`, prerender, OG/canonical, and IndexNow all follow `scripts/seo-urls.mjs` / `src/data/seo.ts`.
3. Add the new hostname in Vercel → Project → Domains.
4. Update backend `CORS_ALLOWED_ORIGINS` (and `VITE_API_URL` if the API host changes). `*.vercel.app` is already allowed by regex.
5. Search hygiene: new Google Search Console + Bing property, submit `https://new-host/sitemap.xml`, run `npm run indexnow`.
6. **If you still control the previous domain**, add a host-based permanent redirect in `vercel.json` from old → new (this is what was impossible when `voltchess.me` expired without DNS).
7. **Notify users** (do not rely on search alone):
   - Update README + pin a GitHub issue/discussion
   - Edit prior Chess.com / Lichess / Reddit / Discord posts
   - Email Academy accounts if any real users exist
   - Share `/moved` so people trust the new URL

## Optional: reclaim old domain for redirects only

If the registrar still allows renewing `voltchess.me` at a normal price:

1. Renew once and point DNS at Vercel.
2. Add both hosts on the Vercel project.
3. Redirect `voltchess.me` / `www.voltchess.me` → `https://voltchess.vercel.app/:path*` in `vercel.json`.
4. Let the old domain expire later if you cannot keep paying — outreach + bookmarks on the new host should already be updated.

## Outreach message template

> **VoltChess moved.** `voltchess.me` expired — the free analyzer is now at **https://voltchess.vercel.app** (same app, no sign-up). Please update bookmarks. Sorry for the downtime.

## Post-deploy checklist (this cutover)

- [ ] Vercel env: `VITE_SITE_URL=https://voltchess.vercel.app`
- [ ] Remove or ignore dead `voltchess.me` / `www.voltchess.me` from Vercel Domains if they show errors
- [ ] Confirm `https://voltchess.vercel.app/` loads and canonical/OG point at vercel.app
- [ ] Confirm `https://voltchess.vercel.app/moved` and `https://voltchess.vercel.app/sitemap.xml`
- [ ] Confirm IndexNow key: `https://voltchess.vercel.app/30a48e821f564f43bd421d99f842e4e2.txt`
- [ ] Run outreach (README already updated; edit your forum posts; Academy email if applicable)
- [ ] Optional: check registrar status for a short `.me` redirect reclaim
- [ ] Light GSC/Bing: add vercel.app property, submit sitemap, `npm run indexnow`
