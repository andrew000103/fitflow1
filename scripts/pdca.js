#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const STATE_PATH = path.join(ROOT, ".codex-pdca/state/pdca-status.json");
const REPORT_DIR = path.join(ROOT, "docs/04-report/features");

const phaseActions = new Set(["plan", "design", "do", "analyze"]);
const utilityActions = new Set(["status", "next", "report", "team"]);
const allActions = new Set([...phaseActions, ...utilityActions]);

function printUsage() {
  console.log(`Usage:
  pdca <action> "<task-or-feature>"
  pdca team "<task>" [--feature <feature>] [--files <csv>] [--validate <csv>] [--phase <phase>]

Phase actions:
  plan
  design
  do
  analyze

Utility actions:
  status   Show current PDCA state
  next     Suggest the next recommended command
  report   Create a report template file in docs/04-report/features
  team     Generate a Codex orchestration prompt for real subagent execution

Examples:
  pdca plan "페르소나 생성"
  pdca design "persona-engine 구조"
  pdca do "persona-engine.ts 구현"
  pdca analyze "페르소나 시스템 초안"
  pdca status
  pdca next
  pdca report "persona-system"
  pdca team "페르소나 시스템 구현"
  pdca team "페르소나 시스템 구현" --feature persona-system --files src/lib/persona-engine.ts,src/stores/persona-store.ts --validate typecheck,ui
`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/["']/g, "")
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function ensureState() {
  if (!fs.existsSync(STATE_PATH)) {
    console.error(`State file not found: ${STATE_PATH}`);
    process.exit(1);
  }
  return readJson(STATE_PATH);
}

function getFeatureEntry(state, explicitFeature) {
  const featureName = explicitFeature || state.activeFeature;
  return {
    featureName,
    feature: state.features?.[featureName] || null
  };
}

function phasePrompt(phase, task) {
  const phaseInstructions = {
    plan: [
      "Stay in Plan phase only.",
      "Do not write Design, Do, Check, Act, or Analyze sections.",
      "Return only: Objective, Scope, Constraints, Assumptions, Success Criteria, Next Phase.",
      "If code or architecture ideas are relevant, mention them only as planning notes.",
      "Subagents used: none unless broad codebase reconnaissance is truly needed."
    ],
    design: [
      "Stay in Design phase only.",
      "Do not implement anything.",
      "Return only: Options Considered, Chosen Approach, Target Files, Validation Plan, Out of Scope, Next Phase.",
      "If earlier planning context is missing, add only the minimum needed context at the top.",
      "Use subagents only for design exploration when multiple approaches exist."
    ],
    do: [
      "This is the only phase allowed to implement.",
      "If the task is risky, prepend the minimum Plan or Design context needed, then implement.",
      "Return implementation progress clearly and keep planning text short.",
      "Use subagents when file ownership can be split or validation can run in parallel."
    ],
    analyze: [
      "Stay in Analyze phase only.",
      "Do not implement anything.",
      "Return only: Outcome, Verified, Risks, Missing Validation, Next Phase.",
      "Use a validator-style review mindset.",
      "If the prior implementation context is missing, infer carefully and state assumptions."
    ]
  };

  const shared = [
    `Interpret this as a strict /pdca ${phase} invocation.`,
    `Task: "${task}"`,
    "Follow the pdca-orchestrator workflow and repo rules if available.",
    "If you do not actually spawn subagents, say 'Subagents used: none'.",
    "Do not expand into a full PDCA cycle unless explicitly asked."
  ];

  return [...shared, ...phaseInstructions[phase]].join(" ");
}

function printStatus(featureNameArg) {
  const state = ensureState();
  const { featureName, feature } = getFeatureEntry(state, featureNameArg);

  console.log("PDCA Status");
  console.log(`Active Feature: ${state.activeFeature || "-"}`);
  console.log(`Selected Feature: ${featureName || "-"}`);

  if (!feature) {
    console.log("Feature Entry: not found");
    return;
  }

  console.log(`Phase: ${feature.phase || "-"}`);
  console.log(`Phase Number: ${feature.phaseNumber ?? "-"}`);
  console.log(`Status: ${feature.status || "-"}`);
  console.log(`Last Updated: ${feature.lastUpdated || "-"}`);
  console.log(`Last File: ${feature.lastFile || "-"}`);

  if (Array.isArray(feature.constraints) && feature.constraints.length > 0) {
    console.log(`Constraints: ${feature.constraints.join(", ")}`);
  }

  if (feature.documents && Object.keys(feature.documents).length > 0) {
    console.log("Documents:");
    for (const [key, value] of Object.entries(feature.documents)) {
      console.log(`- ${key}: ${value}`);
    }
  }
}

function getNextPhase(phase) {
  const mapping = {
    plan: "design",
    design: "do",
    do: "analyze",
    analyze: "done"
  };
  return mapping[phase] || "plan";
}

function printNext(featureNameArg) {
  const state = ensureState();
  const { featureName, feature } = getFeatureEntry(state, featureNameArg);

  console.log("PDCA Next");

  if (!feature) {
    console.log("No feature entry found.");
    console.log('Recommended: pdca plan "<task>"');
    return;
  }

  const nextPhase = getNextPhase(feature.phase);

  console.log(`Feature: ${featureName}`);
  console.log(`Current Phase: ${feature.phase || "-"}`);
  console.log(`Recommended Next Phase: ${nextPhase}`);

  if (nextPhase === "done") {
    console.log("Recommended Command: pdca report \"" + featureName + "\"");
    console.log("Follow-up: update archive or handoff notes if needed");
    return;
  }

  console.log(`Recommended Command: pdca ${nextPhase} "${featureName}"`);
  if (feature.phase === "do") {
    console.log(`Also consider: pdca report "${featureName}" after validation is complete`);
  }
}

function writeReport(featureOrTask) {
  const state = ensureState();
  const { featureName, feature } = getFeatureEntry(state, featureOrTask);
  const name = feature ? featureName : featureOrTask;
  const slug = slugify(name);
  const filePath = path.join(REPORT_DIR, `${slug}.report.md`);
  const today = new Date().toISOString().slice(0, 10);

  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const existingDocuments = feature?.documents || {};
  const content = `# ${name} Report

## Metadata

- Date: ${today}
- Feature: \`${name}\`
- Current Phase: \`${feature?.phase || "unknown"}\`
- Status: \`${feature?.status || "draft"}\`

## Outcome

## What Was Verified

## Remaining Risks

## Match Rate

## Follow-up Actions

## Related Documents

${Object.entries(existingDocuments)
  .map(([key, value]) => `- ${key}: \`${value}\``)
  .join("\n") || "- none recorded"}
`;

  fs.writeFileSync(filePath, content, "utf8");

  console.log(`Created report: ${filePath}`);
}

function printTeamPrompt(task) {
  console.log(`Interpret this as a strict /pdca team invocation.
Task: "${task}"
Use the pdca-orchestrator workflow and execute real Codex subagent orchestration when justified.
Start with a brief Plan. Then:
1. Spawn a context-reader if the code area or docs are broad or unclear.
2. Spawn a designer if multiple implementation paths exist.
3. During Do, spawn implementer workers only when write scopes are disjoint.
4. Spawn a validator when regression review or independent verification is valuable.
Keep the critical path in the main agent.
If no subagent is needed for a phase, say so explicitly.
Always report: Subagents used: <list>.
When using workers, name each worker, state its role, goal, and file ownership.
After implementation, end with Analyze and summarize verified outcomes, risks, and next phase.`);
}

function parseTeamArgs(args) {
  const parsed = {
    taskParts: [],
    feature: "",
    files: [],
    validate: [],
    phase: "",
    split: "auto"
  };

  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];

    if (token === "--feature") {
      parsed.feature = args[i + 1] || "";
      i += 1;
      continue;
    }
    if (token === "--files") {
      parsed.files = (args[i + 1] || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      i += 1;
      continue;
    }
    if (token === "--validate") {
      parsed.validate = (args[i + 1] || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      i += 1;
      continue;
    }
    if (token === "--phase") {
      parsed.phase = (args[i + 1] || "").trim();
      i += 1;
      continue;
    }
    if (token === "--split") {
      parsed.split = (args[i + 1] || "auto").trim();
      i += 1;
      continue;
    }

    parsed.taskParts.push(token);
  }

  return parsed;
}

function chunkFiles(files) {
  if (files.length <= 1) {
    return [files];
  }

  const midpoint = Math.ceil(files.length / 2);
  return [files.slice(0, midpoint), files.slice(midpoint)];
}

function printTeamPromptAdvanced(task, options) {
  const featureLine = options.feature ? `Feature: "${options.feature}"` : "Feature: infer from task or current state";
  const phaseLine = options.phase ? `Preferred starting phase: ${options.phase}` : "Preferred starting phase: plan";
  const validateLine = options.validate.length > 0
    ? `Validation targets: ${options.validate.join(", ")}`
    : "Validation targets: infer from project rules and changed surfaces";
  const filesLine = options.files.length > 0
    ? `Candidate files: ${options.files.join(", ")}`
    : "Candidate files: infer from repo context";

  const chunks = chunkFiles(options.files);
  const workerLines = [];

  if (options.files.length === 0) {
    workerLines.push("- implementer-a: assign after repository scan if disjoint write scope exists");
  } else if (options.files.length === 1) {
    workerLines.push(`- implementer-a: owns ${chunks[0].join(", ")}`);
  } else {
    workerLines.push(`- implementer-a: owns ${chunks[0].join(", ")}`);
    workerLines.push(`- implementer-b: owns ${chunks[1].join(", ")}`);
  }

  console.log(`Interpret this as a strict /pdca team invocation.
Task: "${task}"
${featureLine}
${phaseLine}
${filesLine}
${validateLine}

Use the pdca-orchestrator workflow and perform real Codex subagent orchestration when justified.

Execution rules:
- Start with a brief Plan and keep the critical path in the main agent.
- Spawn a context-reader if the entry points, docs, or related files are unclear.
- Spawn a designer if multiple realistic implementation approaches exist.
- During Do, spawn implementer workers only with disjoint write scopes.
- Spawn a validator to review verification, regression risk, and missing tests.
- If no subagent is needed for a phase, say so explicitly.
- Always disclose actual usage as: Subagents used: <list>.

Suggested worker ownership:
${workerLines.join("\n")}
- validator: no writes by default; review ${options.validate.length > 0 ? options.validate.join(", ") : "tests, typecheck, UI regressions, and rule compliance"}

Main agent responsibilities:
- own the authoritative plan
- integrate worker outputs
- prevent write-scope overlap
- end with Analyze including verified outcomes, residual risks, and next phase

When spawning workers, give each one:
- current phase
- exact goal
- allowed files or write scope
- relevant project constraints
- a reminder that they are not alone in the codebase`);
}

const [, , rawAction, ...rest] = process.argv;

if (!rawAction || rawAction === "--help" || rawAction === "-h") {
  printUsage();
  process.exit(rawAction ? 0 : 1);
}

const action = rawAction.toLowerCase();

if (!allActions.has(action)) {
  console.error(`Invalid action: ${rawAction}`);
  printUsage();
  process.exit(1);
}

const payload = rest.join(" ").trim();

if (phaseActions.has(action)) {
  if (!payload) {
    console.error("Task is required.");
    printUsage();
    process.exit(1);
  }
  console.log(phasePrompt(action, payload));
  process.exit(0);
}

if (action === "status") {
  printStatus(payload || undefined);
  process.exit(0);
}

if (action === "next") {
  printNext(payload || undefined);
  process.exit(0);
}

if (action === "report") {
  const reportTarget = payload || ensureState().activeFeature || "untitled-feature";
  writeReport(reportTarget);
  process.exit(0);
}

if (action === "team") {
  const teamArgs = parseTeamArgs(rest);
  const task = teamArgs.taskParts.join(" ").trim();
  if (!task) {
    console.error("Task is required.");
    printUsage();
    process.exit(1);
  }
  if (
    teamArgs.feature ||
    teamArgs.files.length > 0 ||
    teamArgs.validate.length > 0 ||
    teamArgs.phase ||
    teamArgs.split !== "auto"
  ) {
    printTeamPromptAdvanced(task, teamArgs);
  } else {
    printTeamPrompt(task);
  }
  process.exit(0);
}
