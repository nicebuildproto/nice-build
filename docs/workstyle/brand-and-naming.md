# Brand and naming

## Status

**"Workshape" is a provisional working name.** No trademark, domain, app-store or social-handle check has been done. Nothing in the product or these docs claims the name is available. Do a proper clearance search before any public launch.

## Candidates considered

| Name | Why it was considered | Concern |
| --- | --- | --- |
| **Workshape** (chosen, provisional) | Describes the output (the shape of how you work), pairs with the signature motif, works as two-weight wordmark *work*shape | Generic compound; likely crowded. Unchecked. |
| Morrow | Warm, forward-looking, short | Many existing uses; weak link to the product idea |
| Modo | Short, "mode" of working | Existing brands; ambiguous pronunciation |
| Other People | Matches the "help others work with you" half | Long, negative-sounding in some contexts |

## One place to change it

All naming, taglines, descriptions, disclaimer, base path, file slug and card text live in `lib/workstyle/brand.ts`. Renaming the product should touch that file only (plus the font/logo assets if they change). The logo mark (`components/workstyle/Brand.tsx`) is the product's own signature motif, not a letter.

## Tone of voice

- Warm, plain and precise. A thoughtful colleague, not a quiz show.
- Speak about *preferences and conditions*, never about what someone "is" or "lacks".
- Both ends of every dimension are described as legitimate, with costs named honestly.
- No jargon, no scores, no ranking, no claims of science beyond what exists. The disclaimer appears wherever the product describes itself.
- Contractions are fine; exclamation marks and gamified language ("unlock", "level") are not.
- Results are written in the second person to the person who took the assessment; the guide is in the first person (their voice, to colleagues); public pages and share cards are re-voiced (`lib/workstyle/voice.ts`).

## Visual direction (implemented)

- **Palette.** Warm paper `#f4efe6` and ink `#15130f`. A dark "ink" tone is used only for the result reveal and the share card. Colour is reserved for the eight dimension colours (with a lighter variant on dark) and a single focus-ring colour.
- **Type.** Fraunces (variable, display) paired with Geist (body). The card route embeds Fraunces woff files from `app/how-i-work/_fonts/` (licence: SIL OFL, included).
- **Signature motif.** A deterministic radial figure: eight spokes in a fixed clockwise order, each carrying that dimension's glyph, placed by position, with mixed/balanced/thin readings drawn differently. Same input, same figure, on screen, in the share card (SVG) and in the PDF (vector).
- **Layout.** Generous whitespace, editorial hierarchy, thin rules, no stock imagery. (A light blur is used behind the sticky header only.)
- **Motion.** Used to explain (the figure drawing in; the rank list reordering), not to decorate. All of it is disabled under `prefers-reduced-motion`.

## Independence from the host app

The product is under `/how-i-work` but has its own layout, fonts, CSS (`app/how-i-work/workshape.css`, scoped to `.ws`), analytics rules and brand config. The legacy site links in with a plain `<a>` (hard navigation) so the two layouts never mix. See `architecture.md` for moving to a standalone domain.
