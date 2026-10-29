import {
  CandidateProfile,
  DiagnosticResult,
  JDProfile,
  PrepPlan,
  type DiagnosticQuestion,
  type SkillVerdict,
} from "@intervibe/contracts";

export interface DiagnosisAnswer {
  question: string;
  skillTag: string;
  answer: string;
}

/** 5–8 adaptive questions: JD must-haves first, then resume skills, deduped. */
export function buildQuestions(
  resume: CandidateProfile,
  jd: JDProfile,
): { questions: DiagnosticQuestion[]; lowConfidence: boolean; clarifyingQuestion?: string } {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const m of [...jd.must_haves, ...jd.responsibilities, ...resume.skills, ...jd.keywords]) {
    const t = m.trim();
    if (!t || seen.has(t.toLowerCase())) continue;
    seen.add(t.toLowerCase());
    tags.push(t);
    if (tags.length >= 8) break;
  }
  const thin = tags.length < 5;
  const followUps = [
    (t: string) => `What trade-offs did you weigh when using ${t}, and how did you validate the result?`,
    (t: string) => `Tell me about a failure or bug with ${t} and what you changed after it.`,
  ];
  const questions: DiagnosticQuestion[] = tags.slice(0, 8).map((skillTag) => ({
    question: `Describe your hands-on experience with ${skillTag}. What did you build, and what was the outcome?`,
    skillTag,
  }));
  let i = 0;
  while (questions.length < 5) {
    const tag = tags[i % Math.max(tags.length, 1)] ?? "your strongest skill";
    const ask = followUps[i % followUps.length](tag);
    questions.push({ question: ask, skillTag: tag });
    i += 1;
    if (i > 12) break;
  }
  if (thin) {
    return {
      questions: questions.slice(0, 8),
      lowConfidence: true,
      clarifyingQuestion:
        "Your resume and JD were thin on concrete skills. Which 2–3 skills should this prep focus on?",
    };
  }
  return { questions: questions.slice(0, 8), lowConfidence: false };
}

/** Heuristic verdicts: empty/short answers are gaps, medium shaky, detailed verified. */
export function buildDiagnostic(
  questions: DiagnosticQuestion[],
  answers: DiagnosisAnswer[],
  resume: CandidateProfile,
  jd: JDProfile,
): DiagnosticResult {
  const byTag = new Map(answers.map((a) => [a.skillTag.toLowerCase(), a.answer.trim()]));
  const verdicts = questions.map((q) => {
    const text = byTag.get(q.skillTag.toLowerCase()) ?? "";
    const source = jd.must_haves.some((m) => m.toLowerCase() === q.skillTag.toLowerCase())
      ? `JD must-have '${q.skillTag}'`
      : `resume skill '${q.skillTag}'`;
    if (text.length < 20) {
      return { skill: q.skillTag, source, verdict: "gap" as const, evidence: text || "(no answer)" };
    }
    if (text.length < 120) {
      return { skill: q.skillTag, source, verdict: "shaky" as const, evidence: text };
    }
    return { skill: q.skillTag, source, verdict: "verified" as const, evidence: text };
  });
  const thin = resume.skills.length === 0 && jd.must_haves.length === 0;
  const parsed = DiagnosticResult.safeParse({
    verdicts,
    questionsAsked: questions,
    lowConfidence: thin,
    ...(thin
      ? { clarifyingQuestion: "Which 2–3 skills should this prep focus on?" }
      : {}),
  });
  if (!parsed.success) throw new Error("Built an invalid DiagnosticResult");
  return parsed.data;
}

/** One module per JD must-have (coverage rule), plus resume skills and optional comms. */
export function buildPlan(
  resume: CandidateProfile,
  jd: JDProfile,
  verdicts: DiagnosticResult["verdicts"],
  commsWanted: boolean,
): PrepPlan {
  const modules: PrepPlan["modules"] = [];
  const verdictBySkill = new Map(verdicts.map((v: SkillVerdict) => [v.skill.toLowerCase(), v]));
  for (const must of jd.must_haves) {
    const v = verdictBySkill.get(must.toLowerCase());
    const weak = !v || v.verdict !== "verified";
    modules.push({
      kind: weak ? "knowledge_drill" : "jd_deep_dive",
      title: weak ? `Close the gap: ${must}` : `Go deep: ${must}`,
      goal: `Answer ${must} questions with trade-offs, metrics, and failure modes.`,
      source: `JD must-have '${must}'`,
      estimatedQuestions: 6,
      passBar: "Score 75+ with transcript evidence on the next drill.",
    });
  }
  for (const skill of resume.skills) {
    if (jd.must_haves.some((m) => m.toLowerCase() === skill.toLowerCase())) continue;
    if (modules.length >= 8) break;
    modules.push({
      kind: "resume_story",
      title: `Turn ${skill} into a STAR story`,
      goal: `Mine a real ${skill} bullet into a 60–90 second story with metrics.`,
      source: `resume skill '${skill}'`,
      estimatedQuestions: 4,
      passBar: "One complete STAR story with evidence quote.",
    });
  }
  if (modules.length === 0) {
    modules.push({
      kind: "knowledge_drill",
      title: "Clarify your target skills",
      goal: "Answer the clarifying question so the plan can be rebuilt on real skills.",
      source: "diagnostic clarifying question",
      estimatedQuestions: 3,
      passBar: "Provide 2–3 focus skills.",
    });
  }
  if (commsWanted) {
    modules.unshift({
      kind: "comms",
      title: "Introduction and background",
      goal: "Kick off with a 60–90 second intro: background, key achievements, and role alignment.",
      source: "interview introduction kickoff",
      estimatedQuestions: 2,
      passBar: "Intro under 90 seconds covering background, proof, and target role.",
    });
  }
  const thin = resume.skills.length === 0 && jd.must_haves.length === 0;
  return PrepPlan.parse({
    modules,
    commsIncluded: commsWanted,
    lowConfidence: thin,
    ...(thin ? { clarifyingQuestion: "Which 2–3 skills should this prep focus on?" } : {}),
  });
}

/**
 * Synthesizes a structured JDProfile from target role, company, and seniority
 * when the user chooses not to provide a raw job description file.
 */
export function synthesizeJD(
  role = "Software Engineer",
  company = "Tech Company",
  seniority = "Senior",
  focusArea = "",
): JDProfile {
  const cleanRole = role.trim() || "Software Engineer";
  const cleanCompany = company.trim() || "Tech Company";
  const cleanSeniority = seniority.trim() || "Senior";

  const roleLower = cleanRole.toLowerCase();
  let mustHaves: string[] = [];

  if (roleLower.includes("machine learning") || roleLower.includes("ml") || roleLower.includes("ai")) {
    mustHaves = [
      "Large Language Models & Prompt Engineering",
      "RAG Architectures & Vector Databases",
      "Distributed Model Training & PyTorch",
      "System Architecture & Scaling ML Services",
      "Model Evaluation Metrics & Trade-offs",
    ];
  } else if (roleLower.includes("frontend") || roleLower.includes("web") || roleLower.includes("ui")) {
    mustHaves = [
      "Modern Frontend Architecture & React",
      "State Management & Client-side Performance",
      "Web Vitals, Bundle Optimization & Caching",
      "API Integration & Asynchronous State",
      "Cross-browser Rendering & UI Reliability",
    ];
  } else if (roleLower.includes("product") || roleLower.includes("pm")) {
    mustHaves = [
      "Product Strategy & Vision Alignment",
      "User Empathy & Problem Discovery",
      "Metrics Definition, A/B Testing & Retention",
      "Cross-functional Execution & Roadmapping",
      "Technical Trade-offs & Stakeholder Management",
    ];
  } else if (roleLower.includes("data") || roleLower.includes("analyst")) {
    mustHaves = [
      "SQL Query Optimization & Data Modeling",
      "Statistical Analysis & Hypothesis Testing",
      "ETL Data Pipelines & Warehouse Architecture",
      "Business Intelligence & Metric Dashboards",
      "Predictive Modeling & Insights Communication",
    ];
  } else if (roleLower.includes("devops") || roleLower.includes("sre") || roleLower.includes("cloud")) {
    mustHaves = [
      "Kubernetes & Container Orchestration",
      "Cloud Infrastructure Architecture (AWS/GCP)",
      "CI/CD Pipeline Automation & Deployment Strategies",
      "Observability, SLIs/SLOs & Incident Response",
      "Infrastructure as Code (Terraform)",
    ];
  } else {
    mustHaves = [
      "System Architecture & Distributed Systems",
      "Concurrency, Scaling & Microservices",
      "Database Modeling, Indexing & Query Tuning",
      "API Design, Resilience & Failure Modes",
      "Production Debugging & Performance Optimization",
    ];
  }

  if (focusArea && focusArea.trim()) {
    mustHaves.unshift(focusArea.trim());
  }

  return JDProfile.parse({
    title: cleanRole,
    company: cleanCompany,
    seniority: cleanSeniority,
    must_haves: mustHaves,
    nice_to_haves: [],
    responsibilities: [
      `Design and deliver critical features as a ${cleanSeniority} ${cleanRole} at ${cleanCompany}`,
      `Uphold high standards for code quality, architectural trade-offs, and operational reliability`,
    ],
    keywords: [cleanCompany, cleanRole, cleanSeniority, "Production Scale", "Architecture"],
  });
}

/**
 * Automated diagnosis: maps candidate background directly against JD must-haves
 * without requiring the candidate to sit through an 8-question quiz first.
 */
export function autoDiagnose(
  resume: CandidateProfile,
  jd: JDProfile,
  commsWanted = true,
): { diagnostic: DiagnosticResult; plan: PrepPlan } {
  const { questions, lowConfidence, clarifyingQuestion } = buildQuestions(resume, jd);

  const allBullets = resume.experience.flatMap((e) => e.bullets);

  const verdicts: SkillVerdict[] = questions.map((q) => {
    const skill = q.skillTag;
    const isJdMust = jd.must_haves.some((m) => m.toLowerCase() === skill.toLowerCase());
    const isResumeSkill = resume.skills.some((s) => s.toLowerCase() === skill.toLowerCase());
    const source = isJdMust ? `JD must-have '${skill}'` : `resume skill '${skill}'`;

    // Look for matching bullet in experience or metric
    const matchingBullet = allBullets.find((b) => b.toLowerCase().includes(skill.toLowerCase()));
    const matchingMetric = resume.metrics.find((m) => m.toLowerCase().includes(skill.toLowerCase()));

    if (
      matchingMetric ||
      (matchingBullet &&
        /\d+%?|\b(scaled|reduced|increased|built|architected|designed|led|migrated|optimized)\b/i.test(
          matchingBullet,
        ))
    ) {
      return {
        skill,
        source,
        verdict: "verified" as const,
        evidence: matchingMetric || matchingBullet || `Evidenced in experience under ${resume.name}`,
      };
    }

    if (matchingBullet || isResumeSkill) {
      return {
        skill,
        source,
        verdict: "shaky" as const,
        evidence: matchingBullet || `Candidate claims skill on resume without quantified production metrics`,
      };
    }

    return {
      skill,
      source,
      verdict: "gap" as const,
      evidence: `Must-have competency required by JD but not documented on resume`,
    };
  });

  const parsedDiagnostic = DiagnosticResult.parse({
    verdicts,
    questionsAsked: questions,
    lowConfidence,
    ...(lowConfidence && clarifyingQuestion ? { clarifyingQuestion } : {}),
  });

  const plan = buildPlan(resume, jd, verdicts, commsWanted);

  return { diagnostic: parsedDiagnostic, plan };
}
