import type { DimensionId, FollowUpId, Side } from "../types.ts"

// Cross-dimension patterns. A pattern is only reported when EVERY listed dimension leans the stated
// way with at least some evidence (or, for context patterns, when the person said so in a follow-up).
// Wording describes co-occurrence in answers; it never claims one preference causes another.

export type PatternDef = {
  id: string
  title: string
  dimensions: { dimension: DimensionId; side: Side }[]
  /** Also satisfied by this follow-up answer. */
  context?: { followUp: FollowUpId; value: string }
  insight: string
  /** First-person line for the guide's “what colleagues should know”. */
  guide: string
  experiment: string
}

const need = (dimension: DimensionId, side: Side) => ({ dimension, side })

export const patterns: PatternDef[] = [
  {
    id: "together-with-room-to-be-alone",
    title: "Together, with room to be alone",
    dimensions: [need("collaboration", "b"), need("focus", "a")],
    insight:
      "You like building things with other people, and you also seem to do your best work in long uninterrupted stretches. That usually means you want the together time and the alone time to be deliberate, not accidental.",
    guide: "I like building with people and I also need real stretches alone, so I’ll tell you which I need this week.",
    experiment: "Mark two ‘together’ windows and two protected blocks in your week, and tell collaborators which is which. Notice whether either type of time gets squeezed.",
  },
  {
    id: "experiments-with-a-named-owner",
    title: "Experiments, with a named owner",
    dimensions: [need("change", "b"), need("collaboration", "a")],
    insight:
      "You seem to enjoy trying things early, and to want it clear whose call it is when you do. Experiments may feel safest to you when ownership is explicit.",
    guide: "I like trying things early, and I work best when it’s clear who owns the call.",
    experiment: "Next time you propose a trial, say who owns the call and when you’ll review it. Notice whether that changes how others respond.",
  },
  {
    id: "direct-but-not-off-the-cuff",
    title: "Direct, but not off the cuff",
    dimensions: [need("feedback", "b"), need("thinking", "a")],
    insight:
      "You may be glad to hear things promptly and still want time to work out what to do with them, especially when the issue is complex. Hearing it quickly and responding slowly can both be true.",
    guide: "Tell me things straight away; on anything complicated I may need until tomorrow to respond properly.",
    experiment: "Tell one colleague: “say it straight away, and I might need until tomorrow to respond.” Notice whether it makes feedback easier on both sides.",
  },
  {
    id: "clear-frame-open-to-change",
    title: "A clear frame, and an open mind",
    dimensions: [need("structure", "a"), need("change", "b")],
    insight:
      "You seem to want expectations settled and still be comfortable changing the plan when new information arrives. The two fit together if the frame stays stable while the route moves.",
    guide: "I like the frame clear, and I’m happy to change the route inside it when we learn something.",
    experiment: "When you share a plan, say which parts are the frame and which are the route. Notice which parts people want to change.",
  },
  {
    id: "open-then-precise",
    title: "Open while forming, precise when delivering",
    // Context-only: it is reported solely when the person said so in the structure follow-up.
    dimensions: [],
    context: { followUp: "structure-phase", value: "open-then-precise" },
    insight:
      "Your answers suggest you’re comfortable with ambiguity while an idea is taking shape, and want precision when it’s time to deliver. That’s a useful pairing if the people around you know which phase you’re in.",
    guide: "I’m comfortable with things loose while we’re shaping an idea, and I’ll want them pinned down when we deliver.",
    experiment: "Name the phase out loud — “we’re still shaping” or “we’re delivering”. Notice whether it changes what people expect from you.",
  },
  {
    id: "think-first-then-talk",
    title: "Think first, then talk it through",
    dimensions: [need("thinking", "a"), need("communication", "b")],
    insight:
      "You seem to form a view on your own and then want a live conversation to test it. People may see the conversation without seeing the preparation behind it.",
    guide: "I usually think on my own first, and then I like to talk it through.",
    experiment: "Say what you’ve already thought through before the conversation starts. Notice whether people respond differently once they know.",
  },
  {
    id: "move-fast-keep-a-trail",
    title: "Move fast, keep a trail",
    dimensions: [need("decisions", "b"), need("communication", "a")],
    insight:
      "You seem comfortable acting on a working hypothesis, and you want the reasoning written down so it can be checked. That makes quick moves easier for other people to follow.",
    guide: "I’ll often move on a working assumption, and I like to write down what it was so we can check it.",
    experiment: "Keep a short running note of assumptions and what you did about them. Notice whether anyone reads it, and whether it changes any decisions.",
  },
  {
    id: "open-ideas-private-concerns",
    title: "Open with ideas, private with concerns",
    dimensions: [need("thinking", "b"), need("feedback", "a")],
    insight:
      "You may happily share half-formed ideas yet prefer to raise your own concerns privately first. Colleagues may not realise the openness runs one way.",
    guide: "I’m happy to float half-formed ideas, but I’d rather raise concerns one to one first.",
    experiment: "Next time you have a concern about an idea, tell one person privately before the group discussion. Notice whether the discussion goes better.",
  },
  {
    id: "flexible-plans-protected-time",
    title: "Flexible plans, protected time",
    dimensions: [need("structure", "b"), need("focus", "a")],
    insight:
      "You seem to want room to change what you work on, and to protect your time once you’ve picked it. Both can be true: the choice stays open, and the block, once chosen, is guarded.",
    guide: "I like to choose what I’m working on as things develop, and once I’ve chosen, I protect the time.",
    experiment: "Choose the day’s main block in the morning and protect it. Notice whether choosing late and guarding early works for you.",
  },
]
