import {
  TurnEvaluation,
  type PlanModule,
  type RubricDimension,
} from "@intervibe/contracts";
import { promptForModuleKind } from "./prompts.js";

/** Phase 3 context economics: collapse older turns past this count ... */
export const COMPACTION_TURN_THRESHOLD = 12;
/** ... or past this rough token budget, whichever fires first. */
export const CONTEXT_TOKEN_BUDGET = 6000;
/** Live context keeps the summary plus this many recent turns. */
export const RECENT_TURNS_KEPT = 4;
/** Pass bar: average overall of the last two scored answers. */
export const PASS_BAR = 75;

/** Rough token estimate (~4 chars per token). Used for budget checks, not billing. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export interface DrillTurn {
  question: string;
  answer: string;
  evaluation: TurnEvaluation;
  promptVersion: string;
}

/** Persisted per-module drill state. Lives in `sessions.config` via the bundle. */
export interface DrillState {
  teach: string;
  /** Every question asked, in order. turns.length <= questions.length always. */
  questions: string[];
  turns: DrillTurn[];
  status: "active" | "complete";
  completeReason: string;
  summary: DrillSummary | null;
  promptVersion: string;
}

export interface DrillSummary {
  strengths: string[];
  gaps: string[];
  evidence: string[];
  /** Average overall score per skill tag seen so far. */
  scores: Record<string, number>;
}

/** FAANG-depth follow-up rotation: trade-offs, metrics, failure, scale. */
const FOLLOW_UPS = [
  (t: string) => `What trade-offs did you weigh with ${t}, and how would you defend them?`,
  (t: string) => `What metrics proved ${t} worked? What number would have told you it failed?`,
  (t: string) => `How did ${t} break in production, and what did you change after?`,
  (t: string) => `How would ${t} behave at 10x scale? What breaks first?`,
];

function topicOf(module: PlanModule): string {
  const m = module.source.match(/'([^']+)'/);
  return m?.[1] ?? module.title;
}

/** Brief teach (2-4 sentences) grounded in the module's own goal/source. */
export function startModule(module: PlanModule): { teach: string; question: string } {
  const topic = topicOf(module);
  const teach = module.kind === "comms"
    ? `Welcome! Real interviews always start with an introduction. Take 60-90 seconds: mention your current role, 1-2 major accomplishments with metrics, and why you are excited for this position.`
    : `${module.goal} Anchor every answer in what you actually did: the decision, the trade-off, and the measured outcome. Vague claims score low; numbers and failure modes score high.`;
  const question =
    module.kind === "resume_story"
      ? `Walk me through your strongest ${topic} story in STAR form: situation, task, action, result with numbers.`
      : module.kind === "comms"
        ? `To kick off the interview, could you please introduce yourself, tell me about your background, and why you're interested in this role?`
        : `Describe your hands-on experience with ${topic}. What did you build, and what was the measured outcome?`;
  return { teach, question };
}

/** Next question after a scored turn: follow-up rotation, then module wrap. */
export function followUpFor(module: PlanModule, answeredCount: number): string {
  if (module.kind === "comms") {
    const commsFollowUps = [
      "Thank you for sharing that background. Could you highlight the accomplishment you're most proud of, including the key metrics and your direct contribution?",
      "Great. Tell me about a time when a project faced unexpected obstacles or didn't go as planned. How did you adapt and communicate that to stakeholders?",
    ];
    return commsFollowUps[answeredCount % commsFollowUps.length];
  }
  return FOLLOW_UPS[answeredCount % FOLLOW_UPS.length](topicOf(module));
}

const TRADE_WORDS = ["trade-off", "tradeoff", "however", "because", "instead", "versus", " vs ", "validated"];
const STAR_WORDS = ["situation", "task", "action", "result", "first", "then", "finally", "outcome"];
const FILLERS = [" um ", " uh ", " like ", " you know ", " basically ", " actually ", " stuff ", " kind of "];

function hasAny(hay: string, words: string[]): boolean {
  return words.some((w) => hay.includes(w));
}

function fillerRate(text: string): number {
  const lower = ` ${text.toLowerCase()} `;
  let n = 0;
  for (const f of FILLERS) {
    let i = -1;
    while ((i = lower.indexOf(f, i + 1)) !== -1) n += 1;
  }
  return text.length === 0 ? 0 : n / (text.length / 100);
}

const FIXES: Record<RubricDimension, string> = {
  correctness_depth: "Add the trade-off you weighed and how you validated the result.",
  structure: "Use STAR order: situation, task, action, quantified result.",
  communication_clarity: "Cut filler words and say it in half the words.",
  jd_relevance: "Tie the answer to the module topic with a concrete example.",
  evidence: "Give one number or verbatim fact instead of a general claim.",
};

/**
 * Deterministic heuristic TurnEvaluation (same banding as Phase 2 verdicts).
 * Strong answers outscore average ones on every dimension, every run.
 */
export function scoreAnswer(
  module: PlanModule,
  answer: string,
): TurnEvaluation {
  const text = answer.trim();
  const lower = text.toLowerCase();
  const topic = topicOf(module).toLowerCase();
  const comms = module.kind === "comms";

  const len = text.length;
  const base = len < 20 ? 12 : len < 120 ? 52 : len < 300 ? 72 : 84;
  const hasDigit = /\d/.test(text);
  const quote = text ? text.slice(0, 200) : "(no answer)";

  const raw: { dimension: RubricDimension; score: number }[] = [
    {
      dimension: "correctness_depth",
      score: base + (hasAny(lower, TRADE_WORDS) ? 6 : 0),
    },
    {
      dimension: "structure",
      score: base + (hasAny(lower, STAR_WORDS) ? 6 : 0) - (comms && len > 1600 ? 8 : 0),
    },
    {
      dimension: "communication_clarity",
      score: base - Math.min(15, Math.round(fillerRate(text) * 8)) - (len === 0 ? 5 : 0),
    },
    {
      dimension: "jd_relevance",
      score: base + (topic && lower.includes(topic) ? 6 : 0),
    },
    {
      dimension: "evidence",
      score: base + (hasDigit ? 8 : 0),
    },
  ];
  const dims: { dimension: RubricDimension; score: number }[] = raw.map((d) => ({
    dimension: d.dimension,
    score: Math.max(0, Math.min(100, d.score)),
  }));

  const overall = Math.round(dims.reduce((s, d) => s + d.score, 0) / dims.length);
  const weakest = dims.reduce((a, b) => (a.score <= b.score ? a : b));
  return TurnEvaluation.parse({
    dimensions: dims.map((d) => ({ ...d, evidence: quote })),
    overall,
    next_fix: FIXES[weakest.dimension],
  });
}

/** Module completion: pass bar on the last two, or question budget spent. */
export function moduleStatus(
  turns: DrillTurn[],
  budget: number,
): { complete: boolean; reason: string } {
  if (turns.length >= 2) {
    const last2 = turns.slice(-2);
    const avg = (last2[0].evaluation.overall + last2[1].evaluation.overall) / 2;
    if (avg >= PASS_BAR) return { complete: true, reason: `Pass bar met (last two average ${Math.round(avg)}).` };
  }
  if (turns.length >= budget) {
    return { complete: true, reason: `Question budget ended (${budget} asked).` };
  }
  return { complete: false, reason: "" };
}

/** True exactly when the live context must compact: past the turn threshold. */
export function shouldCompact(turns: DrillTurn[], summary: DrillSummary | null): boolean {
  return summary === null && turns.length > COMPACTION_TURN_THRESHOLD;
}

/** Collapse older turns into a summary. Full transcript stays in the bundle/DB. */
export function buildSummary(turns: DrillTurn[], skillTag: string): DrillSummary {
  const strengths: string[] = [];
  const gaps: string[] = [];
  const evidence: string[] = [];
  let sum = 0;
  for (const t of turns) {
    sum += t.evaluation.overall;
    evidence.push(t.evaluation.dimensions[0]?.evidence ?? "");
    if (t.evaluation.overall >= PASS_BAR) strengths.push(`${skillTag}: ${t.evaluation.overall}`);
    else gaps.push(`${skillTag}: ${t.evaluation.overall} — fix: ${t.evaluation.next_fix}`);
  }
  return {
    strengths,
    gaps,
    evidence: evidence.slice(0, 10),
    scores: { [skillTag]: turns.length ? Math.round(sum / turns.length) : 0 },
  };
}

/** Live context: system + profiles + summary + last N turns. Old raw turns drop out. */
export function assembleContext(args: {
  system: string;
  profiles: string;
  summary: DrillSummary | null;
  recentTurns: DrillTurn[];
}): { messages: { role: string; content: string }[]; contextTokens: number; compactionActive: boolean } {
  const summaryText = args.summary
    ? `So far — strengths: ${args.summary.strengths.join("; ") || "none yet"}. Gaps: ${args.summary.gaps.join("; ") || "none yet"}. Scores: ${JSON.stringify(args.summary.scores)}.`
    : "No summary yet; this is the start of the drill.";
  const turnsText = args.recentTurns
    .map((t) => `Q: ${t.question}\nA: ${t.answer}`)
    .join("\n\n");
  const messages = [
    { role: "system", content: args.system },
    { role: "system", content: `Profiles: ${args.profiles}` },
    { role: "system", content: summaryText },
    { role: "user", content: turnsText || "(first question)" },
  ];
  const contextTokens = estimateTokens(messages.map((m) => m.content).join("\n"));
  return { messages, contextTokens, compactionActive: args.summary !== null };
}

/** Prompt version recorded on every scored turn. */
export function promptVersionFor(module: PlanModule): string {
  return promptForModuleKind(module.kind).version;
}
