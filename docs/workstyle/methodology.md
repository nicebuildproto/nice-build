# Methodology and limits

> **Status: exploratory and unvalidated.** This instrument has not been piloted. Nothing here claims reliability, validity, norms, or predictive power, and the product says so wherever it speaks about itself (`brand.disclaimer`).

## What it is

A self-report questionnaire of **28 primary questions** (plus up to **3 optional follow-ups**) that places a person on eight continua of *work preference* and turns that into a profile and an editable "How to work with me" guide. The aim is to give someone words for what helps them, and to make it easier to start a conversation with colleagues.

## What it is not

Not a personality test, a clinical or diagnostic tool, a selection/hiring/appraisal tool, or a prediction of performance, fit or compatibility. It must not be used to make decisions about people.

## Scoring (version 2)

Implemented in `lib/workstyle/scoring.ts` and `interpret.ts`; deterministic, no randomness, no network, no LLM. `SCORING_VERSION = 2`, `ASSESSMENT_VERSION = "2026.2"`. Any change to rules or thresholds requires a version bump. Older saved progress is not carried over: the questions changed, so a person who returns is told and starts fresh.

1. **Item value.** Each option carries an effect from −2 (left pole) to +2 (right pole) per dimension. Choose one: the option's value. Choose several: the **mean** of the chosen options, never the sum. Slider: five stops, −2 to +2 left to right, stored in canonical orientation however it was displayed. Rank: weighted mean with position weights 4, 3, 2, 1. Divide six units: the share-weighted mean. Options marked *context* score 0 and add a **context signal**.
2. **Weights.** Core items (one primary dimension) count 1. Cross-dimension items count 0.5 on every dimension they touch.
3. **Dimension position.** Weighted mean of the answered items. Skipped items drop out; they are never treated as neutral.
4. **Spread.** Weighted standard deviation of the same values: how much the answers disagree.
5. **Evidence** (separate from position): `none` / `thin` / `some` / `good`, from the weight of answers and how consistent they are. Thin evidence is never presented as a result.
6. **Four readings.** On the −2…+2 scale: *clear lean* |mean| ≥ 0.8 with spread < 1.2; *mild lean* 0.35 to 0.8 with spread < 1.2; *flexible* |mean| < 0.35 with spread < 1.0; *depends on context* when spread ≥ 1.2 or there are two or more context signals (and for a weak mean with spread between 1.0 and 1.2). Flexible means the answers agree on the middle; depends on context means they point different ways or the person said so.
7. **Completion.** A result exists only if at least 21 questions are answered and at least 2 answers bear on every dimension.

### Calibration

The starting thresholds above were kept after simulation: all-left and all-right respondents read as a clear lean on every dimension, an alternating respondent reads as flexible or depends on context, and 200 random respondents average within ±0.3 of zero on every dimension (`lib/workstyle/bank-v2.test.ts`). Among random respondents the readings split roughly 52% depends on context, 21% lean left, 19% lean right and 9% flexible, which is a property of random answers, not of people. The “two or more context signals” rule is effectively reachable only for communication, because the other dimensions have at most one slider and no context option.

### Why confidence is separate from preference

A strong lean from two answers is not the same as a moderate lean from five. Position, strength and evidence are displayed and stored separately, so the UI can say "this is a tentative reading".

### Thresholds are product choices

The numbers above are chosen for readable bands, **not** derived from norms or statistics. There are **no norms** and no percentile or "typical person" comparison anywhere in the product.

## Adaptive follow-ups

Bounded and transparent: at most 3 are asked, each optional. A follow-up is triggered when the dimension it concerns is *conflicted* (at least two answers, and the reading is depends on context), or, for `pressure-shift`, when the answer to the deadline question (Q18) points a different way from the rest of the profile on some dimension by 1.5 or more. Follow-ups record *context* ("what makes the difference?") for the person's own guide; they **never change scores**. Each is evaluated only on evidence available up to its own chapter, so later answers cannot change which follow-up appears. `pressure-shift` stays on the device: it is not part of a share code.

## Identity and patterns

The headline title (e.g. a named style) and pattern notes are rule-based on the eight summaries (`lib/workstyle/profile.ts`, `content/`). A hybrid is shown when two candidates are within a small window rather than forcing one; mixed dimensions do not contribute a lean to identity. Patterns require supporting dimensions with at least "some" evidence and say *what the answers showed*, not what a person "is".

## Interpretation language

- Describe preferences and conditions, not capacities.
- Both poles are positive; costs are named for both.
- Statements to others are phrased as "may" and "tends to" and are marked *supported* or *tentative* by evidence.
- The "How to work with me" guide is the person's, not ours: every statement is editable and they can add their own words.

## Comparison

Two people who both choose to share can see their readings side by side as: shared, different, flexible. There is **no compatibility score**, no ranking, and no prediction. "Different" is framed as something to agree on, with a question and a working agreement to try. Comparison runs in the browser from a share link; there is no server-side matching.

## Known limitations

- Self-report: reflects how someone sees themselves today, in the situations imagined. Context, role and mood matter.
- Forced and relative formats (rank, split) are chosen to make trade-offs visible but can feel artificial.
- Wording is in English, with workplace situations that assume knowledge work, and assumes a team context. Cultural and neurodiversity review has **not** been done.
- Some construct overlaps (decisions/change, thinking/feedback) are expected; the audit lists them.
- Short scales (3–4 primary items each) give coarse readings.

## Validation plan (not yet done)

1. **Usability pilot (n≈15–25).** Time to complete, abandonment points, confusing items, whether people recognise their own result ("how well does this fit?" per dimension) and how they edit the guide.
2. **Item review.** Cognitive interviews for ambiguous wording; inclusive-language and accessibility review; translation review if localised.
3. **Structure.** With a larger sample (several hundred): item distributions, ceiling/floor effects, internal consistency per dimension, inter-dimension correlations, and whether eight dimensions are empirically separable. Revise the bank and bump versions.
4. **Stability.** Test–retest over 2–4 weeks.
5. **Fairness.** Differential item functioning across groups where sample sizes allow.
6. **Utility.** Whether the guide leads to useful conversations (qualitative), not whether it predicts performance.

Until step 3 at least is complete, results must be described as exploratory.

## References to verify before citing publicly

These informed the design direction. They have **not** been fact-checked against sources in this repository; check each before quoting in any public document.

- Goldberg et al., International Personality Item Pool (IPIP) — openly available item-writing and scale-construction practice.
- AERA, APA, NCME, *Standards for Educational and Psychological Testing* — validity, reliability and fairness expectations.
- International Test Commission guidelines on test use and on computer-based/internet testing.
- Hicks (1970) on how choice count affects decision time — used loosely for keeping answer sets short.
- Paulhus on socially desirable responding — behind the choice to make both poles positive.
- Budner (tolerance of ambiguity); Kruglanski & Webster (need for closure); Kirton (adaption–innovation) — background for structure, decisions and change.
- Edmondson on psychological safety — background for feedback and friction.
- Daft & Lengel on media richness — background for communication format.
- Hall on high- and low-context communication — background for communication style.

The product does not reproduce items from any of these instruments.
