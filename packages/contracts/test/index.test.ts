import { describe, expect, it } from "vitest";
import {
  PASS_THRESHOLD,
  SessionState,
  TurnEvaluation,
  assertStandardModel,
} from "../src/index.js";

describe("contracts", () => {
  it("rejects unknown session states", () => {
    expect(() => SessionState.parse("flying")).toThrow();
    expect(SessionState.parse("live_mock")).toBe("live_mock");
  });

  it("requires evidence on every score", () => {
    const base = {
      dimensions: [{ dimension: "structure", score: 80, evidence: "Clear STAR arc." }],
      overall: 80,
      next_fix: "Add metrics to the result.",
    };
    expect(TurnEvaluation.parse(base).overall).toBe(80);
    expect(() =>
      TurnEvaluation.parse({
        ...base,
        dimensions: [{ dimension: "structure", score: 80, evidence: "" }],
      }),
    ).toThrow();
  });

  it("bans Contributor-mode models", () => {
    expect(() => assertStandardModel("muse-spark-1.3-contributor")).toThrow();
    expect(() => assertStandardModel("muse-spark-1.3")).not.toThrow();
    expect(PASS_THRESHOLD).toBe(70);
  });
});
