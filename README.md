# kirankrishnakumar.com

Personal site of Kiran Krishnakumar Subhashini (Kiran K S), founder of Txtudio and Lofritex.
Static Astro 7 site, light editorial design, smooth scroll and micro-interactions. No 3D.

## Run it

```sh
pnpm install
pnpm dev            # http://localhost:4321
pnpm build          # static output in dist/
pnpm preview        # serve dist/ locally
pnpm check          # type check
```

Node 24 (see `.nvmrc`). Deploys as Cloudflare Workers static assets (`wrangler.jsonc`).

## Where things live

| Path | What it holds |
| --- | --- |
| `src/content/pages/*.md` | Copy for each page (title tag, description, H1 and page text) |
| `src/content/work/*.mdx` | The six case studies |
| `src/content/writing/*.mdx` | Posts |
| `src/data/person.json` | Biography facts, experience, résumé data and structured data |
| `src/data/milestones.ts` | The dated milestones in the Experience page's year strip |
| `src/assets/logos/` | Txtudio and Lofritex logos (use `src/components/Logo.astro`) |
| `src/site.config.ts` | Email, booking link and analytics token (fill before launch) |
| `src/motion/` | Smooth scroll, reveals, hero, company scenes, navigation chrome, reduced-motion and pause state |
| `docs/` | Design spec and SEO plan |

## Interaction hooks

Pages opt into behaviour with data attributes; `src/motion/micro.ts` documents each one.

| Attribute | Behaviour |
| --- | --- |
| `data-reveal`, `data-split` | Fade or line-by-line rise when scrolled into view |
| `data-inview` | Set to `in` once visible, so CSS can stage an entrance |
| `data-tilt`, `data-magnetic`, `data-speed` | Lean toward the pointer, follow it, or drift on scroll |
| `data-cursor="Label"` | Cursor ring grows and shows the label |
| `data-preview="url"` | An image trails the cursor while hovered |
| `data-switch` | Buttons `data-switch-to` swap panels `data-switch-panel` (arrow keys too) |
| `data-count`, `data-scramble`, `data-roll`, `data-wave`, `data-clock` | Count-up, text scramble, text roll, wave letters, live IST time |

A character or 3D piece can return later in the slots that now hold the portrait on About and Home.

## Checks

```sh
node scripts/dev/route-cycle.mjs     # 21 page swaps: nav state, one H1, cursor, no errors
node scripts/dev/route-check.mjs     # reduced motion, pause, Lab interactions, 404
node scripts/dev/menu-check.mjs      # menu after scrolling: hover, glide to a link, pin on click, close
node scripts/dev/a11y-check.mjs      # axe on every route
node scripts/dev/verify-dist.mjs     # titles, descriptions, JSON-LD, sitemap
node scripts/dev/lighthouse.mjs      # mobile Lighthouse on key routes
node scripts/dev/page-shots.mjs      # screenshots of every page, desktop and phone
node scripts/dev/article-shots.mjs   # case studies and posts with the sticky aside
```
