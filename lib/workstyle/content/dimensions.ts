import type { Band, DimensionId } from "../types.ts"

// Authored interpretation blocks — the controlled library the narrative draws from.
// Voice rules: "seems / may / often" for inferences, no diagnoses, no flattery, no “better” pole.
// Each block must read correctly on its own, because the narrative assembles blocks, never sentences.

export type BandBlock = {
  /** Plain-language description of the preference (second person). */
  summary: string
  /** A condition that may bring out this person's best. */
  best: string
  /** Where this preference may rub against an environment or another style. */
  friction: string
  /** First-person statement for the "How to work with me" guide. */
  guide: string
  /** What colleagues may notice day to day. */
  notice: string
  /** A small experiment, framed as something to try and observe. */
  experiment: string
}

export type CompareBlock = {
  /** A question a pair can ask each other. */
  question: string
  /** An assumption that could cause friction when two different preferences meet. */
  assumption: string
  /** A working agreement the pair can accept, edit or ignore. */
  agreement: string
}

export const dimensionContent: Record<DimensionId, Record<Band, BandBlock> & { compare: CompareBlock }> = {
  thinking: {
    a: {
      summary: "You seem to do your clearest thinking before you do your talking: a first view forms privately, then you bring it to other people.",
      best: "A little time with the question before the discussion — a heads-up the day before, or the problem written down in advance.",
      friction: "Fast, think-out-loud meetings can ask you to commit to a view before you have one, and a quiet start can be read as disengagement.",
      guide: "I usually think best on my own first. If you can send me the question ahead of a discussion, I’ll arrive with something more useful than a first reaction.",
      notice: "You may go quiet while an idea forms, then arrive with a considered view.",
      experiment: "Before your next meeting that matters, ask for the agenda a day early and write down your own view first. Notice whether the discussion goes differently.",
    },
    b: {
      summary: "You seem to find clarity by talking: ideas sharpen for you in conversation, and you often don’t know quite what you think until you’ve said it.",
      best: "Someone to think with early, even before the idea is tidy — a short call, a whiteboard, a thread that’s allowed to wander.",
      friction: "Long stretches of solo preparation can leave you stuck, and colleagues who think privately may hear your early ideas as final positions.",
      guide: "I often work things out by talking. If I’m thinking aloud, treat it as a draft rather than a decision — and ask me to say more if you’re not sure.",
      notice: "You may bring half-formed ideas to the conversation and refine them as you go.",
      experiment: "When you start thinking aloud, say so: “this is a draft”. Notice whether colleagues respond to the idea rather than to a position.",
    },
    middle: {
      summary: "Your answers don’t point to one way of getting clear. Sometimes you reflect first, sometimes you need the conversation — and the situation probably decides.",
      best: "A choice about the mode: sometimes the question in advance, sometimes a quick chat to get started.",
      friction: "Colleagues may assume you’re always one or the other, so what you’re offered may not be what you need that day.",
      guide: "It depends on the problem. For some things I need time alone first; for others, talking is the fastest way. I’ll say which when I can.",
      notice: "You may switch between private thinking and open discussion depending on the problem.",
      experiment: "For one week, note whether each tricky problem got clearer alone or in conversation. See whether a pattern shows up in the kind of problem.",
    },
    compare: {
      question: "When we’re working something out, would we each rather think alone first, or talk it through together?",
      assumption: "One of you may take quiet to mean disengaged, while the other takes talking to mean decided.",
      agreement: "Before a discussion we’ll share the question a day ahead, and in the discussion we’ll say whether an idea is a draft.",
    },
  },

  structure: {
    a: {
      summary: "You seem to like the shape of the work defined early: the order, the expectations and who’s doing what.",
      best: "A clear brief at the start — scope, owner, dates — and notice before the shape changes.",
      friction: "Open-ended or fast-changing work can feel unmoored, and colleagues who like to settle details as they go may find your questions slow things down.",
      guide: "I’m most useful when the shape is clear early: what done looks like, who owns what, and roughly when. If it can’t be clear yet, tell me what’s still open.",
      notice: "You may ask for scope, order or ownership early, and be unsettled by changes made without notice.",
      experiment: "At the start of one piece of work, write three lines: what done looks like, who decides, what’s still open. Notice what that gives others as well as you.",
    },
    b: {
      summary: "You seem to like room to settle details as the work develops, rather than fixing everything up front.",
      best: "A clear purpose and clear constraints, with permission to adjust the route as things become clear.",
      friction: "Detailed plans can feel premature, and colleagues who rely on predictability may find an open approach hard to plan around.",
      guide: "I do my best work when the goal is clear and the route is open. If I seem light on plans, ask what I’m holding steady and I’ll tell you.",
      notice: "You may start with a rough outline and fill in the detail as it appears.",
      experiment: "Pick one thing that mustn’t move — a date or an owner — and tell people. Notice whether a single fixed point helps others stay flexible with you.",
    },
    middle: {
      summary: "Your answers sit between planning ahead and staying flexible, or pull both ways. That often means a frame at the start, then flexibility inside it.",
      best: "A light frame: purpose, owner and a rough timeline, with the details left open.",
      friction: "Planners may read you as vague, and adapters may read you as rigid.",
      guide: "I like a light frame at the start — purpose, owner, rough timing — and I’m comfortable adjusting the detail after that.",
      notice: "You may be comfortable with either a plan or an open brief, depending on the work.",
      experiment: "Next time you start something, agree what must be fixed and what can stay open. Notice which category you reach for first.",
    },
    compare: {
      question: "How much of the plan do we want to fix at the start, and what can stay open?",
      assumption: "One of you may read questions about scope as slowing things down, while the other reads a loose brief as carelessness.",
      agreement: "We’ll agree what is fixed (goal, date, owner) and what stays open, and write it down in three lines.",
    },
  },

  decisions: {
    a: {
      summary: "You seem to prefer reducing uncertainty before you commit: you want to know enough that the decision feels well founded.",
      best: "Time and access to what you need to feel confident, and a clear point at which gathering stops and deciding starts.",
      friction: "Pressure to move on limited information can be uncomfortable, and colleagues who prefer to test things may read your checking as hesitation.",
      guide: "I like to check the important facts before committing. If we need to move quickly, tell me what’s uncertain and I’ll say which gaps matter most.",
      notice: "You may ask for evidence, or what has already been tried, before agreeing to a direction.",
      experiment: "On your next decision, agree in advance how much evidence is enough and by when. Notice whether the decision feels any different.",
    },
    b: {
      summary: "You seem to prefer committing to a working hypothesis and learning from it, rather than waiting until the picture is complete.",
      best: "Permission to try a small, reversible version, and agreement on what you’ll be looking for.",
      friction: "Colleagues who want the full picture first may see your pace as under-prepared, and any mistakes may be more visible.",
      guide: "I tend to try something small and learn from it. When I’m moving ahead I’ll say what I’m assuming, and I’d like to hear if you think a check is needed first.",
      notice: "You may produce a first version quickly and use the reactions to decide what happens next.",
      experiment: "Before your next quick test, write one line on what you’re assuming and what would change your mind. Notice how it shapes the conversation.",
    },
    middle: {
      summary: "Your answers don’t settle on checking first or testing first. Your approach seems to depend on the stakes and on how easily a decision can be undone.",
      best: "A shared sense of how big the decision is: quick to try if it’s cheap to undo, more checking if it isn’t.",
      friction: "Colleagues may not know which mode you’re in, so you may seem fast on one decision and slow on another.",
      guide: "My approach varies with the stakes. For decisions that are easy to undo I’ll move quickly; for ones that aren’t, I’ll want to check more first.",
      notice: "You may move fast on small decisions and slow down on bigger ones.",
      experiment: "Label your next three decisions ‘easy to undo’ or ‘hard to undo’ before you start. Notice whether the label changes how much you check.",
    },
    compare: {
      question: "For this kind of decision, how much checking is enough, and what would we rather try?",
      assumption: "One of you may read checking as hesitation, while the other reads quick testing as under-preparing.",
      agreement: "We’ll label decisions ‘easy to undo’ or ‘hard to undo’ and agree how much checking each deserves.",
    },
  },

  focus: {
    a: {
      summary: "You seem to do your best work in long, quiet, uninterrupted stretches, where attention can go deep.",
      best: "Protected blocks with notifications off, and an understanding that you’ll reply afterwards.",
      friction: "Open-plan spaces and always-on chat can break your concentration, and colleagues may read slow replies as being unavailable.",
      guide: "I do my best work in long, uninterrupted blocks. If something’s urgent, say so and I’ll come out of it; otherwise I’ll reply when the block ends.",
      notice: "You may be hard to reach during blocks, then more available afterwards.",
      experiment: "Book two protected blocks this week and tell people when you’ll reply. Notice what was actually interrupted, and whether it mattered.",
    },
    b: {
      summary: "You seem to stay engaged through variety, people and activity around you; long stretches alone with one task may drain more than they help.",
      best: "Variety through the day, people nearby for quick questions, and work that can be broken into shorter pieces.",
      friction: "Heads-down environments can feel flat, and colleagues who need quiet may find your pace of interaction tiring.",
      guide: "I stay engaged when there’s variety and people around. A quick question is usually fine, and if I’m deep in something I’ll say.",
      notice: "You may move between tasks and conversations through the day and seem energised by it.",
      experiment: "For one afternoon, swap your longest task for three shorter ones with a quick conversation between each. Notice what happens to your energy.",
    },
    middle: {
      summary: "Your answers sit between protected focus and a livelier rhythm. You probably want both, at different times.",
      best: "A mix: some protected time for deep work, with room for conversation and variety around it.",
      friction: "Colleagues may not know when it’s fine to interrupt you, and neither a silent nor a busy environment fully suits you.",
      guide: "I need a mix of quiet time and interaction. If you’re not sure whether I’m interruptible, ask — I’ll tell you.",
      notice: "You may be equally comfortable at a quiet desk or in a busy room, depending on the task.",
      experiment: "For a week, notice which tasks you do best in quiet and which with people around. Try matching tasks to settings.",
    },
    compare: {
      question: "When is it fine to interrupt each other, and when should we protect time?",
      assumption: "One of you may take an interruption as a sign of availability, while the other takes it as a lack of respect for focus.",
      agreement: "We’ll agree on protected blocks and a simple way to flag something urgent.",
    },
  },

  communication: {
    a: {
      summary: "You seem to prefer information that arrives in writing with context, conclusions first, and updates when there’s something meaningful to say.",
      best: "Written context you can return to, a clear summary at the top, and updates reserved for meaningful change.",
      friction: "Spontaneous calls and constant check-ins may feel like interruptions, and colleagues may read your concise messages as brisk.",
      guide: "I prefer context in writing with the conclusion up front. If something’s urgent or sensitive, call me; otherwise I’ll answer once I’ve thought about it.",
      notice: "You may reply with considered answers rather than instant ones, and prefer a summary to a ramble.",
      experiment: "Next time you ask for something, put the ask in the first line and the context below. Notice whether replies get quicker or clearer.",
    },
    b: {
      summary: "You seem to prefer conversation: hearing the reasoning as well as the answer, and staying in touch as the work goes.",
      best: "Quick calls, regular touchpoints and room to talk something through rather than read it.",
      friction: "Written-only updates can feel thin, and colleagues who prefer written context may find regular check-ins heavy.",
      guide: "I prefer talking things through and like to hear the reasoning as well as the answer. A quick call usually beats a long message for me.",
      notice: "You may pick up the phone or start a call where others would write a message.",
      experiment: "Follow a call with a three-line written recap. Notice whether the recap helps people who weren’t there.",
    },
    middle: {
      summary: "Your answers don’t point to one format. You probably want written context for some things and conversation for others.",
      best: "A format that fits the topic: a written brief for detail, a conversation for ambiguity.",
      friction: "Colleagues may default to their own preference and miss what you need for this particular topic.",
      guide: "Writing or talking both work for me. If it’s detailed, a written version helps; if it’s ambiguous, a conversation does.",
      notice: "You may use writing and conversation about equally.",
      experiment: "For a week, note which topics you wished had come in writing and which in conversation. Share the pattern with one colleague.",
    },
    compare: {
      question: "What should go in writing, what should be a conversation, and how often do we need to hear from each other?",
      assumption: "One of you may find calls intrusive, while the other finds messages cold.",
      agreement: "We’ll default to a written summary with the ask first, and use a call when something is ambiguous or sensitive.",
    },
  },

  collaboration: {
    a: {
      summary: "You seem to prefer owning a clearly defined piece of work and having room to deliver it, with agreements made early.",
      best: "A clearly scoped piece with your name on it, agreed expectations, and planned rather than constant checkpoints.",
      friction: "Heavily shared ownership can feel diffuse, and colleagues who like to co-create may read independence as distance.",
      guide: "I do my best work on a clearly defined piece that I own. Agree the shape with me early and I’ll check in at the points we set.",
      notice: "You may take a section away, finish it, and come back with it ready for review.",
      experiment: "On your next shared task, agree two check-in points at the start and say what you’ll bring to each. Notice whether that feels like enough contact to others.",
    },
    b: {
      summary: "You seem to prefer shaping work together and staying in step as it goes, with ownership that’s shared rather than split.",
      best: "A partner or small group, regular alignment, and permission to change course together.",
      friction: "Being handed a task to finish alone can feel isolating, and colleagues who prefer autonomy may feel crowded by frequent check-ins.",
      guide: "I enjoy shaping work with other people and staying in step as we go. If I’m checking in a lot, tell me what level suits you.",
      notice: "You may check in often, invite input early and enjoy working alongside someone.",
      experiment: "Ask one colleague how much input they’d like from you on a shared task, and agree it. Notice whether that changes how often you check in.",
    },
    middle: {
      summary: "Your answers don’t settle on owning a piece or co-creating. It probably depends on the task and on who you’re working with.",
      best: "Clarity, task by task, on whether it’s a solo piece or shared work.",
      friction: "Colleagues may not know whether you want input or space, and may guess wrong.",
      guide: "It depends on the task. I’m happy to own a piece or to work on it together — it helps if we agree which at the start.",
      notice: "You may move between independent work and shared work.",
      experiment: "At the start of your next three tasks, label each ‘mine’, ‘ours’ or ‘yours’. Notice whether the label matters.",
    },
    compare: {
      question: "Which parts of this does each of us own, and where do we want to work side by side?",
      assumption: "One of you may feel crowded by check-ins while the other feels left alone.",
      agreement: "We’ll agree who owns what, and set a check-in rhythm that suits both of us.",
    },
  },

  change: {
    a: {
      summary: "You seem to prefer checking before shifting course, and protecting settled priorities when something new appears.",
      best: "Notice before priorities change, a reason for the change, and time to check what it affects.",
      friction: "Frequent shifts can feel destabilising, and colleagues who like to adapt on the fly may read your checking as resistance.",
      guide: "When priorities change I’ll want to understand why and what it replaces. Give me a moment to check what it affects and I’ll re-plan quickly.",
      notice: "You may ask what a change replaces, and be careful about adding without removing.",
      experiment: "When a new priority arrives, ask “what does this replace?” Notice whether naming it makes the change easier to absorb.",
    },
    b: {
      summary: "You seem to prefer trying things early and following new information as it appears, rather than holding to a fixed plan.",
      best: "Room for small experiments, quick feedback on how they went, and priorities that can move when the evidence does.",
      friction: "Long commitments to a fixed plan can feel stifling, and colleagues who value stability may find shifts hard to follow.",
      guide: "I’m comfortable when plans change as we learn. If I switch direction I’ll say why, and tell me if the pace of change is too much.",
      notice: "You may suggest changes mid-stream and be energised by new options.",
      experiment: "Before you change direction, write one sentence on what you’d be stopping. Notice whether others find the change easier to follow.",
    },
    middle: {
      summary: "Your answers don’t settle on checking first or adapting early. How you respond probably depends on what’s at stake.",
      best: "Clear signals about how settled a plan is: firm, or a draft that can move.",
      friction: "Colleagues may not know whether a change will be welcome or unsettling.",
      guide: "My response to change depends on the situation. If you tell me how firm a plan is, I’ll know whether to hold or adapt.",
      notice: "You may adapt readily to some changes and want to pause on others.",
      experiment: "Label your next plan ‘firm’ or ‘draft’ when you share it. Notice how colleagues respond to each.",
    },
    compare: {
      question: "When plans change, how should we tell each other, and how quickly should we act?",
      assumption: "One of you may hear a new idea as a decision, while the other hears caution as resistance.",
      agreement: "We’ll mark plans ‘firm’ or ‘draft’ when we share them, and say what a change replaces.",
    },
  },

  feedback: {
    a: {
      summary: "You seem to prefer time to absorb and prepare before discussing feedback or disagreement.",
      best: "Feedback that comes with a little notice or in writing, and space to return with a considered response.",
      friction: "Immediate challenge in a meeting can leave you without your best response, and colleagues may read a pause as agreement or avoidance.",
      guide: "I take feedback in best when I can think before I reply. Tell me directly, and give me a day or a written note so I can respond properly.",
      notice: "You may say “let me think about that” and return with a more considered view.",
      experiment: "Next time you need time, say how long: “I’ll come back to you tomorrow morning.” Notice whether naming the gap helps others.",
    },
    b: {
      summary: "You seem to prefer raising and hearing things promptly and openly, rather than letting them sit.",
      best: "Direct feedback soon after the event, and room to respond in conversation.",
      friction: "Delayed or written-only feedback can feel indirect, and colleagues who need time may find directness hard to respond to.",
      guide: "I’d rather hear things promptly and directly. If I raise something quickly it isn’t a verdict, and tell me if you’d like more time.",
      notice: "You may raise a concern in the moment and be ready to talk it through immediately.",
      experiment: "When you raise something quickly, ask “do you want to respond now or later?” Notice what people choose.",
    },
    middle: {
      summary: "Your answers don’t settle on needing time or wanting it straight away. It probably depends on the topic and the person.",
      best: "A quick check on what suits the other person and the topic: now, or after some thought.",
      friction: "Colleagues may not know which mode you want for a particular piece of feedback.",
      guide: "It depends on the topic. For small things straight away is fine; for bigger ones I may want time. I’ll say which.",
      notice: "You may react straight away to some things and ask for time on others.",
      experiment: "For a week, notice which feedback you wished had arrived sooner or later. Tell one colleague what you noticed.",
    },
    compare: {
      question: "How and when do we want to tell each other that something isn’t working?",
      assumption: "One of you may read silence as agreement, while the other reads directness as criticism.",
      agreement: "We’ll say how we each want feedback — now, or after some thinking — and name a time to come back to it.",
    },
  },
}
