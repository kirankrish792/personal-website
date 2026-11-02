# Launch handover

Launch needs about an hour across five accounts. Everything else is in the repository.

1. Register kirankrishnakumar.com, ideally with Cloudflare Registrar so the DNS zone is in Cloudflare.
2. Install the GitHub CLI and sign in: `brew install gh`, then `gh auth login`. The public repository is created under `kirankrish792` and pushed.
3. Cloudflare → Workers & Pages → Create → Import a repository. Build command `pnpm build`; deploy command `npx wrangler deploy`.
4. Worker → Settings → Domains & Routes: add `kirankrishnakumar.com` as a custom domain. Add `www.kirankrishnakumar.com` and a redirect rule sending it to the apex with a 301.
5. Security: turn off **Block AI bots** and Cloudflare's **managed robots.txt** (both block the AI search crawlers the SEO plan relies on). Keep **Bot Fight Mode** and challenges off: they set cookies, and the privacy page promises none.
6. Web Analytics: add the site and copy its token into `cfAnalyticsToken` in `src/site.config.ts`.
7. Fill `email` and `bookingUrl` in `src/site.config.ts`. Without a booking link, remove the "book a call" lines from `src/content/pages/contact.md` and `privacy.md`.
8. Google Search Console: add a Domain property, verify with the DNS TXT record, submit `https://kirankrishnakumar.com/sitemap-index.xml`, request indexing for `/`, `/about`, `/work`, `/experience`.
9. Bing Webmaster Tools: import the site from Search Console.

Optional: a fine-grained GitHub token as the build variable `GITHUB_TOKEN` gives exact daily contribution counts; without it the build reads the public contribution calendar.

## Verify on the live domain

```sh
curl -sI https://kirankrishnakumar.com/about          # 200
curl -sI https://kirankrishnakumar.com/about/         # 307 to /about
curl -sI https://kirankrishnakumar.com/missing        # 404
curl -s  https://kirankrishnakumar.com/robots.txt     # our file, not Cloudflare's
curl -sI -A "Claude-SearchBot" https://kirankrishnakumar.com/   # 200
```

## After launch

- GitHub: update the website field and the bio (it still says student), and the profile README's LinkedIn link.
- LinkedIn: set the website field.
- `kirankrish792.github.io`: point it at the new domain (it redirects to the dead kiranks.me).
- Ask for a founder line and a link on txtudio.com/about, and a link from lofritex.com/about.
- txtudio.com expires on 6 November 2026: confirm auto-renew.
- Before linking the Attendance-list repository: purge the committed `.env` from history and rotate its keys.
