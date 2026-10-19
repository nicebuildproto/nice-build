# Implementation notes: accessibility, performance, privacy, status

This file separates **what was built and checked** from **what is only intended**.

## Accessibility

### Built

- Semantic structure: one `h1` per page, landmark regions, skip link, labelled sections.
- Every question is a real form control: options are radio/checkbox inputs inside labels; scales are radio groups with visible stop labels; the split widget uses steppers (buttons with accessible names) rather than drag-only sliders; the rank widget has **up/down buttons** as well as animated reordering, so ranking never requires dragging.
- Keyboard: number keys pick options; Enter/Space and arrows work natively; focus is moved to the question on each step; a visible focus ring (`#3347C9`) on every interactive element including `:has(input:focus-visible)` for custom option cards.
- Screen readers: step changes announced through a polite live region; the signature figure has a text alternative (`label`) and the legend below it is a real list that carries the same information (dimension and reading), so colour and shape are never the only channel.
- Colour: each dimension also has a unique glyph shape; colour-only distinctions are avoided. Dimension colours have lighter variants for dark backgrounds.
- Motion: a `prefers-reduced-motion` block disables the reveal tween, rank animation and transitions; the final figure is shown immediately.
- Copy is in plain language, with no timers and no pressure; any question can be skipped, and answers can be changed.
- Text resizes with the browser; layout is fluid from ~320px.

### Checked

- Keyboard and layout checks in a real browser during development on desktop width; the signature, results and share panel were looked at in the browser, and the card PNG was inspected.
- Lint (`eslint`) and type checks are clean for the product code. ESLint's React hooks rules caught and forced fixes for several effect/ref patterns.

### Not done

- **No automated accessibility audit** (axe or Lighthouse) was run and there is **no screen-reader test** (VoiceOver, NVDA, TalkBack). The claims above describe how it was built, not an audited result.
- Contrast ratios were chosen deliberately (ink on paper, large dimension colours on paper with dark text alongside) but were not measured with a tool for every pairing, particularly the dimension colours on paper at small sizes and the muted text colour.
- Mobile (390px) views of the result and share panel, reduced-motion behaviour and a full keyboard-only run of all 28 questions were **not** exhaustively verified by hand.
- The PDF is not tagged for accessibility.
- No right-to-left or localisation support.

## Performance

### Built

- Server components for shells and the public/compare pages; client code only where state is needed.
- The PDF library (`pdf-lib`) is loaded on demand (`components/workstyle/exports.ts`) when someone downloads a guide, not on page load.
- The signature is generated SVG, with no image assets. The reveal tween is one `requestAnimationFrame` loop.
- Landing, start, result and about are static (`○` in the build output). Public page, compare and card are dynamic (`ƒ`) because they decode a code.
- Fonts: Fraunces is a self-hosted variable font via `next/font` for the pages; two small woff subsets are read from disk by the card route. The card PNG is generated on demand and is about 100–140 KB.

### Measured

- `npm run build` succeeds. Card PNGs render in production mode (`next start`), including with the embedded fonts.
- Local timing of the card route: well under a second per request on a development laptop. This is not a load test.

### Not done

- No Lighthouse, Web Vitals, bundle-size budget or real-device measurements.
- No cache headers were tuned for the card route (the response is deterministic for a given code, so it could be cached hard; this is a follow-up).
- The "7–10 minutes" estimate is **not** from timed users (see `methodology.md`, Validation plan).

## Privacy

### Built (and covered by tests where noted)

- **Answers never leave the browser.** There is no API route for results and no server storage. State is in `localStorage` (`ws.state.v1`) and the reveal flag in `sessionStorage`. "Clear everything" removes it.
- **Share codes carry only what was chosen**: per ticked dimension, a position, a spread and an evidence level, plus an optional first name and the follow-up contexts. Unticked dimensions are absent, not hidden. Answers, emails and free text are not encoded. (Tested: `sharing.test.ts`.)
- **Free-text reflections and edits** to the guide stay local unless the person copies or downloads them. Public pages show a re-voiced version of the generated profile, not their edits.
- **Public and compare pages are `noindex, nofollow`**, as are result pages.
- **Analytics.** Vercel Analytics `beforeSend` strips share codes, query strings and hashes from product paths (`lib/workstyle/analytics.ts`, tested). Contentsquare is not loaded on `/how-i-work` paths and the product root carries `data-cs-mask`. No custom events record answers.
- **No email gate**, no cookies set by the product, no third-party embeds.

### Residual risks and decisions

- A share link is public to anyone who has it. The page says so before someone shares, and names the dimensions that will be included.
- The code is **not signed or encrypted**: anyone can craft one. A page therefore shows what the link says, never claims it was verified, and a checksum only catches accidental corruption.
- The OG card and the public page are fetched by chat apps and link-preview bots. That is intended, but means shared links are fetched by third parties.
- Server logs on the host may contain the share code in request paths. This is outside the app; hosts should be configured not to retain them longer than needed.
- Comparison does not send either profile to a server, but the other person's code is in the URL of the compare page.

## Status of the brief's requirements

| Area | State |
| --- | --- |
| Independent brand, central config | Built (name provisional, unchecked) |
| Editorial visual system, signature, reduced motion | Built; one primary light presentation, dark tone for reveal and card only |
| ~28-question chaptered journey, no email gate | Built; timing not user-tested |
| 8 dimensions, construct specs, matrix, validator, audit | Built; docs in this folder |
| Deterministic, versioned scoring; confidence separate; bounded follow-ups | Built and tested |
| Results sections A–I with editable guide | Built |
| Share card, Web Share/copy, PDF guide, public page, comparison | Built; PDF layout not visually reviewed; PNG/PDF downloads not exercised through a real browser download |
| Docs: methodology, accessibility, performance, architecture | These files |
| Accounts, teams, backend, standalone domain | **Documented only** |
| Validated instrument, norms | **Not done** (and not claimed) |
| Automated UI tests, accessibility audit, device testing | **Not done** |

## Question bank v2 (2026.2)

- 28 questions in four short scenes, with scoring on a −2…+2 scale, per-person option shuffles saved with the session (`seed`), a pick limit on choose-several, and the `pressure-shift` follow-up (kept private, never in a share code).
- Share codes are format 2: three bytes per dimension (position, spread, context signals and evidence) and three bits per shared follow-up.
- Progress saved against the previous bank is dropped on return, with a notice on the intro screen.
- Regenerate the audit docs with `npm run workstyle:audit` after any change to the bank; a test fails if they drift.
