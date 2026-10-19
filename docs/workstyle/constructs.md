# Constructs

Eight **exploratory** dimensions. Each describes a *preference about how work is done*, as a continuum between two ways of working that are both fully legitimate. None is a trait, an ability, or a measure of performance. Labels and glyphs live in `lib/workstyle/dimensions.ts`; question mapping lives in `lib/workstyle/questions.ts` and is audited in `question-bank-audit.md`.

Every dimension has the same shape:

- **Definition** and **what it is not**.
- **Two poles** ("a" scores −2, "b" scores +2 per item; summaries store the mean on −1…+1) and a deliberate **middle** that means either "balanced / depends on the situation" or "answers pulled both ways" (the scorer tells them apart; see `methodology.md`).
- **Typical situations** it shows up in.
- **Overlap risks** with neighbouring dimensions and how the bank separates them.

| # | Dimension | Pole a (−1) | Pole b (+1) | Chapter |
| - | --- | --- | --- | --- |
| 1 | Thinking & processing | Reflect first | Think aloud | 1 · Getting to clear |
| 2 | Structure & flexibility | Plan ahead | Stay adaptable | 2 · The shape of a week |
| 3 | Decision-making | Evidence first | Test first | 1 · Getting to clear |
| 4 | Focus & energy | Protected focus | Lively rhythm | 2 · The shape of a week |
| 5 | Communication | Written & considered | Live & ongoing | 3 · Between people |
| 6 | Collaboration & autonomy | Own a clear piece | Co-create | 3 · Between people |
| 7 | Change & uncertainty | Check, then commit | Try and adapt | 4 · When things shift |
| 8 | Feedback & friction | Time to reflect | Straight away | 4 · When things shift |

## 1. Thinking & processing — "How do you get to clear?"

- **Definition.** Whether a view tends to form privately before it is shared, or while it is being talked through.
- **Not.** Intelligence, speed, introversion/extraversion, or confidence.
- **Situations.** Meetings where an opinion is asked for on the spot; brainstorming; being briefed on something complex.
- **Overlap.** Feedback (timing of response) and communication (format). Thinking questions are about *forming* a view; feedback questions about *receiving* one; communication questions about *format*. Where an item plainly informs a second dimension it carries a small secondary weight (0.4×) so the overlap is explicit rather than hidden; the audit lists every such item.

## 2. Structure & flexibility — "How much shape do you want before you start?"

- **Definition.** Preferred level of definition (scope, order, ownership, dates) at the start of work.
- **Not.** Organisation skill, discipline, or tolerance of ambiguity as a capability.
- **Situations.** Kicking off a multi-week project; planning a week; agreeing up front with someone else.
- **Overlap.** Change (how plans are *revised* once running). `s3` ranks fixed-scope vs fixed-sequence and gives the last option a secondary credit to change.

## 3. Decision-making — "How do you move when things are unclear?"

- **Definition.** Whether uncertainty is reduced before committing, or a working hypothesis is committed to and learned from.
- **Not.** Decision quality, risk appetite in general, or impulsiveness.
- **Situations.** Choosing between options with incomplete information; deciding how much analysis is enough.
- **Overlap.** Change (`x1` is mid-flight challenge to a plan; `d1` is the unclear detail at the start). Watch this pair in pilot data.

## 4. Focus & energy — "What conditions let you sustain attention?"

- **Definition.** Conditions under which attention is easiest to sustain: long uninterrupted stretches, or variety, people and rhythm.
- **Not.** Attention capacity, attention disorders, or work ethic. The copy never describes anyone as "distractible".
- **Situations.** A big-output day; how interruptions feel; the physical or social setup that helps.
- **Overlap.** Collaboration (working near others). The interruption question (Q15) isolates interruption cost vs benefit, which the other focus questions mix with other conditions.

## 5. Communication — "How do you like information to move?"

- **Definition.** Preference for written, considered, conclusion-first information versus live, ongoing conversation that shows the reasoning.
- **Not.** Communication skill. Fluency in either mode is independent of preference.
- **Situations.** Being briefed; receiving status updates; the cadence of check-ins when nothing is wrong.
- **Overlap.** Thinking (`m1` has a small secondary thinking weight) and collaboration (`a2`). Format (`m1`), content style (`m2`) and cadence (`m3`) are separated into distinct items.

## 6. Collaboration & autonomy — "How do you share ownership?"

- **Definition.** Preference for a clearly owned piece with room to deliver, versus shaping the work jointly and staying in step.
- **Not.** Team-player-ness, leadership, or social skill.
- **Situations.** Splitting a group deliverable; a week on a shared project; what matters when responsibility is shared.
- **Overlap.** Communication (alignment rhythm) and structure (agreement up front). Task design (`a1`), alignment rhythm (`a2`), time (`a3`) and accountability (`a4`) are separate angles.

## 7. Change & uncertainty — "How do you respond when plans move?"

- **Definition.** Whether options are checked before shifting and settled priorities protected, or new information is followed early by experimenting.
- **Not.** Resilience, adaptability as a skill, or comfort with stress.
- **Situations.** New information against a plan; an attractive opportunity arriving mid-priority.
- **Overlap.** Decisions and structure, as above. `x3` is the only change item that also informs focus.

## 8. Feedback & friction — "How do you like to disagree and be challenged?"

- **Definition.** Preferred timing and channel for hearing and giving pushback: time to absorb and prepare, or promptly and openly.
- **Not.** Resilience to criticism, conflict avoidance, or how hard someone is to work with.
- **Situations.** Hearing a concern about shared work; disagreeing about ideas; repairing after a misunderstanding.
- **Overlap.** Thinking and communication (`b1` carries a small secondary communication weight).

## Cross-cutting rules

1. **Both poles are described as strengths with a cost.** The result copy names what each preference gives you and where it can create friction for others, never what it "lacks".
2. **The middle is not a null.** "Balanced" is a real answer ("depends on the situation"); "mixed" means answers disagreed. They are worded differently and compare differently.
3. **No dimension is combined into an overall score.** There is no total, rank, or "fit".
4. **Constructs are provisional.** They were derived from the original questionnaire's themes and established, openly described distinctions in the work-preference literature (see `methodology.md`), not from data collected with this instrument.
