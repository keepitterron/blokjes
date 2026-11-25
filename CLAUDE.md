# Blokjes

A daily visual maths practice tool for Zoë (9, groep 5, Montessori): 8 sums, about 5 minutes, with blocks she moves herself. A learning tool, not a game. Vanilla TypeScript + Vite PWA on GitHub Pages, deployed from `main` to https://keepitterron.github.io/blokjes/.

Full spec (teaching principles, progression rules, interactions, data model): [docs/handoff.md](docs/handoff.md). Behavioural reference: [docs/reference/blokjes.html](docs/reference/blokjes.html), the original single-file build this project was ported from.

## Stack

Node 24 (`.nvmrc`), npm, Vite 8, TypeScript 7 (strict, `noUncheckedIndexedAccess`), Oxlint type-aware (`oxlint --type-aware --type-check`, the only type check), Vitest 5, vite-plugin-pwa. Fonts self-hosted via `@fontsource`. No UI framework: screens render HTML strings and animate with the Web Animations API. Pin exact versions, at least 14 days old; anything new needs a one-line reason.

## Layout

- `src/core/`: pure logic, no DOM, storage or strings (enforced by `.oxlintrc.json`). `skills.ts` (sum generation, slips), `progress.ts` (save shape and repair, grading, session plan, review queue), `speed.ts` (timing medians). Every rule here has a test in `tests/`.
- `src/store.ts`: the single saved state `S` in localStorage `blokjes-v1`, plus `L()` for the current strings.
- `src/i18n.ts`: en/nl strings. Dutch uses school terms (T/E, overschrijden, inwisselen).
- `src/themes.css`: all colour tokens. Palettes (lavender, pink, unicorn) change page, accent and review colours only; block colours and the wooden tray are fixed. Steps to add one are at the top of the file.
- `src/ui/`: screens (`home`, `session`, `done`, `grown`), tray markup (`blocks`), animation (`motion`), Spartacus (`dog`), `sound`.

## Rules

- Never change the storage key or break old saves: `repair()` must accept every earlier shape. Her progress lives only in that origin's localStorage, so `base: '/blokjes/'` is permanent.
- Moves in `session.ts` are shared by taps and `replay()`, and bail out with `if (ps !== s) return` when the sum changes mid-flight. Keep both properties.
- No emojis; icons are inline SVG. Typographic apostrophes and quotes in visible text.
- Honour `prefers-reduced-motion` (`REDUCE` in `motion.ts`).

## Commands

- `npm run dev`: dev server at http://localhost:5173/blokjes/ (no service worker in dev).
- `npm run lint`, `npm test`, `npm run build` then `npm run preview`.
