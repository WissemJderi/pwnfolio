Plan: make pwnfolio recruiter-ready
Phase 1 — Repo hygiene

- Delete tracked junk: cookies.txt, writeup.json, writeup3.json, stale root dist/; add them to .gitignore.
- (Optional, noted) git rm --cached only — history cleanup via filter-repo is invasive; current state is what recruiters see.

Phase 2 — README.md (the big one)

- Pitch + tagline, dark/light screenshots (I'll add a docs/screenshots/ reference in README and you drop 2-3 PNGs in — I can't capture live screenshots myself).
- Tech stack badges + architecture sketch (shared zod → Express/Mongo API ↔ React/Vite SPA).
- Setup (.env, install, npm run dev, client dev), test commands, CI status note.
- Feature list, demo note (self-registration), roadmap.

Phase 3 — CI

- .github/workflows/ci.yml: two jobs — server (npm ci → npm run test with mongodb-memory-server), client (npm ci → npm run build, runs tsc --noEmit), on push/PR.
  Phase 4 — Client tests + linting
- Add vitest (+ jsdom + testing-library) as client devDeps; vitest.config.ts with the @shared alias.
- Tests: lib/format.ts pure-unit tests; component tests for Markdown (code block + m-pre bar) and WriteupCard; theme toggle localStorage init. Add "test" script to client.

- Add ESLint flat config (typescript-eslint) + Prettier; lint/format scripts in both packages.
  Phase 5 — Tasteful personalization + meta
- index.html: proper <title>, meta description, Open Graph/Twitter tags, theme-color, favicon.
- Add client/public/favicon.svg (small terminal/neon glyph).
- Home page: a one-line, non-cringe header above the list — e.g. a muted mono line with your @handle + GitHub/HTB/LinkedIn links, styled like the existing README-esque comments (// writeups for hackers, by hackers). No bloated hero/about section — keep it a writeup platform that quietly advertises you.
  Out of scope (per your answers)
- No demo account / seed creds — self-registration stays.
- No personal About page / big hero — just the subtle header above.
  Verify
- npm run test (server 100) green; client npm run build, npm run test, npm run lint; CI workflow syntax-checked via act or manual review.
  Want me to proceed with this?
