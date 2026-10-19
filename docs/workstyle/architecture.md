# Architecture

## What exists today (implemented)

```
app/how-i-work/            routes + product layout, fonts, scoped CSS (workshape.css)
  page.tsx                 landing
  start/                   the assessment (client)
  result/                  your result (client; reads local state)
  about/                   how it works, privacy, limits
  p/[code]/                public share page (server; decodes the code)
  p/[code]/card/route.tsx  share-card PNG (next/og ImageResponse)
  compare/[code]/          compare a shared profile with your own local one
components/workstyle/      UI: assessment widgets, reveal, results, guide editor, share panel
lib/workstyle/             the engine: pure TypeScript, no React, no DOM, no network
  types.ts dimensions.ts questions.ts flow.ts validate.ts
  scoring.ts interpret.ts profile.ts content/   → deterministic scoring and copy
  signature.ts             → the data-derived figure (React-agnostic: SVG string + geometry)
  share.ts voice.ts compare.ts analytics.ts
  persistence.ts           → versioned local state, migration
  export/                  → export model + vector PDF (pdf-lib)
  brand.ts                 → all brand strings and the base path
scripts/workstyle-audit.ts → generates docs/workstyle/question-bank-audit.md
```

### Principles

1. **The engine is pure and portable.** `lib/workstyle` imports no React, Next or browser APIs (the `.ts` relative imports let Node run the tests without a build). It can move to a package, an API route or a worker unchanged.
2. **Everything is derived from a snapshot.** A completed result stores a `ProfileSummary` (per dimension: position, spread, evidence; contexts; scoring and assessment version; completion time). The profile, the signature, the guide, the PDF and the share code are all computed from that snapshot, so an old result renders the same after the question bank changes.
3. **Versioned.** `ASSESSMENT_VERSION` (question bank), `SCORING_VERSION` (rules and thresholds), `STORAGE_KEY` (`ws.state.v1`) and the share-code `FORMAT` are all explicit. Older answers are migrated where still valid and flagged for confirmation.
4. **Local-first.** State is in `localStorage` through a `useSyncExternalStore` store. Server render and first client render see "no state", so there is no hydration mismatch.
5. **Privacy by construction.** Share codes contain only the dimensions the person ticked, never answers. See `implementation-notes.md`.

### Data flow

```
answers ──scoreResponses──▶ DimensionResult[] ──toProfileSummary──▶ ProfileSummary (stored)
                                                          │
                              buildProfile ◀──────────────┘
                                   │
        ┌──────────────┬───────────┼────────────┬───────────────┐
   result page      signature    guide      PDF/Markdown     encodeShare ──▶ /p/[code], /compare/[code], card PNG
```

## Standalone-domain path (documented, not built)

The product lives under `/how-i-work` in this repo. To serve it from its own domain:

1. Set `brand.basePath` to `""` and update links (they all go through `productPath`).
2. In `proxy.ts`, add a host match (the existing `matchB2BHost` pattern is the model) that rewrites `/` and `/start` etc. to `/how-i-work/...` for the new host.
3. Move the `app/how-i-work` segment's layout to a route group if a second root layout is wanted. `app/layout.tsx` already delegates analytics to one component (`app/analytics.tsx`) and skips Contentsquare on product paths.
4. Set `NEXT_PUBLIC_SITE_URL` (used for `metadataBase`, OG images and share links).

None of this has been exercised on a second domain.

## Future: accounts, teams, backend (documented, **not implemented**)

Nothing below exists. It is a sketch of how the current design would extend without rework.

- **Accounts (optional).** Sign-in only to save across devices or join a team. Store the `ProfileSummary` (not raw answers by default) with its versions. The engine already works from the snapshot, so server-side storage is a thin layer.
- **Consent model.** Each dimension has its own visibility (already modelled by the share mask). A person chooses, per team, which dimensions are visible, and can revoke.
- **Team view.** Aggregate only dimensions people chose to share; show distributions and "worth discussing" prompts, never individual rankings or a team score. Minimum group size before any aggregate is shown. Comparison between two people generalises to pairwise views a person opts into.
- **Mutual comparison.** Today comparison is client-side: you open someone's link and your own local result is compared in your browser, and nothing is sent. A server version would need both parties' consent before either profile is revealed.
- **Employer/admin.** Deliberately out of scope. Anything that would let a manager see individual profiles without the person's choice should not be built; the methodology doc says this is not a selection or appraisal tool.
- **Data rights.** Export and delete in one action (the local `clearAll` is the template), retention limits, and no raw-answer analytics.
- **Re-assessment.** Store multiple snapshots with versions; compare over time as "how my preferences have changed", not as progress.
- **Localisation.** Questions and copy are data (`questions.ts`, `content/`); a locale layer would wrap them, but items would need re-validation per language.

## Testing

`npm run test:workstyle` runs three suites with Node's built-in runner (89 tests at the time of writing): assessment (bank structure, scoring, follow-ups, persistence), results (identity, guide, export, signature, comparison, voice), and sharing (codec, privacy, analytics, audit-doc drift). UI behaviour was verified by hand in a browser; there is no automated UI test suite (see `implementation-notes.md`).
