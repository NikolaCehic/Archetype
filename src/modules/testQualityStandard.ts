type JsonRecord = Record<string, unknown>;

export const FORBIDDEN_TEST_PATTERNS = [
  "Only checking `[data-archetype-screen]`.",
  "Clicking a generic primary button and accepting any success message.",
  "Leaving visible controls unbound to declared action, form, route-link, or control contracts.",
  "Leaving terminal-state controls active after resolve, handoff, rerun, cancel, completion, or archive.",
  "Testing contract arrays without importing target behavior.",
  "Treating screenshot byte size as visual quality.",
  "Treating supplied screenshots, wireframes, or design files as ingested evidence without visual-reference assertions.",
  "Mirroring implementation constants as expected values without independent contract expectations."
];

export const REQUIRED_TEST_BEHAVIORS = [
  "Search filters real visible results or shows filtered-empty with reset.",
  "Create actions open a form or mutation workflow.",
  "Export produces a declared artifact, callback, or mock adapter result.",
  "Required states are reachable through deterministic fixtures.",
  "Route transitions and deep links are browser-observable.",
  "CTA hover, focus-visible, active/pressed, disabled, loading, success, and error states are tested when actions exist.",
  "Every visible interactive control is either declared or fails visible-control policy verification.",
  "Terminal states hide or disable unavailable actions and fail action-state policy verification when controls remain active.",
  "Keyboard, focus, accessible names, landmarks, and live/status regions are tested.",
  "Long labels, malformed data, and permission mismatches are tested.",
  "Visual evidence covers desktop, tablet, and mobile.",
  "Supplied visual references become source-bound density, layout, component, state, and token assertions verified in the browser."
];

export function buildTestQualityStandardArtifact(): JsonRecord {
  return {
    artifact_version: "1.0",
    source_scope: "HL-11",
    rule: "Marker-only tests fail the verifier.",
    marker_only_tests_fail_verifier: true,
    forbidden_test_patterns: FORBIDDEN_TEST_PATTERNS,
    required_test_behaviors: REQUIRED_TEST_BEHAVIORS,
    verifier_enforcement: {
      target_test_audit: "verify-target inspects target test files and blocks marker-only specs.",
      package_validation: "validate requires this standard and checks generated Playwright contracts reference it.",
      required_artifacts: [
        "test-first/test-quality-standard.json",
        "test-first/test-quality-standard.md",
        "verification/playwright-verification-contract.json",
        "verification/playwright-verification.spec.ts"
      ]
    },
    exit_condition: "Marker-only tests fail the verifier."
  };
}

export function testQualityStandardMarkdown(artifact: JsonRecord): string {
  return [
    "# Test Quality Standard",
    "",
    `Source scope: ${String(artifact.source_scope ?? "HL-11")}`,
    `Rule: ${String(artifact.rule ?? "Marker-only tests fail the verifier.")}`,
    "",
    "## Forbidden Test Patterns",
    "",
    ...FORBIDDEN_TEST_PATTERNS.map((pattern) => `- ${pattern}`),
    "",
    "## Required Test Behaviors",
    "",
    ...REQUIRED_TEST_BEHAVIORS.map((behavior) => `- ${behavior}`),
    "",
    "## Exit Condition",
    "",
    String(artifact.exit_condition ?? "Marker-only tests fail the verifier.")
  ].join("\n");
}
