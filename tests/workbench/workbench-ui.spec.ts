import { expect, test as base, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

interface MalformedScenario {
  id: string;
  title: string;
  flow: string;
  view: ViewId;
  malformedData: string | Record<string, string>;
  expectedText: string;
  risk: string;
}

type ViewId =
  | "overview"
  | "workspace"
  | "generation"
  | "evidence"
  | "architecture"
  | "dsag"
  | "screens"
  | "design"
  | "contract"
  | "simulation"
  | "e2e"
  | "impact"
  | "export"
  | "governance"
  | "revision";

const scenarioPath = path.join(__dirname, "malformed-scenarios.json");
const malformedScenarios = JSON.parse(fs.readFileSync(scenarioPath, "utf8")) as MalformedScenario[];

const allViews: ViewId[] = [
  "overview",
  "workspace",
  "generation",
  "evidence",
  "architecture",
  "dsag",
  "screens",
  "design",
  "contract",
  "simulation",
  "e2e",
  "impact",
  "export",
  "governance",
  "revision"
];

const test = base.extend<{ pageErrors: string[] }>({
  pageErrors: [async ({ page }, use) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await use(pageErrors);
    expect(pageErrors).toEqual([]);
  }, { auto: true }]
});

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#main-content")).toBeVisible();
  await expect(page.locator("[data-agent-view='overview']")).toBeVisible();
  await expect(page.locator("#main-content")).toHaveAttribute("data-agent-current-view", "overview");
});

test("whole app navigation and AI-readable UI contract render across every view", async ({ page }) => {
  await expect(page.locator("[data-agent-view]")).toHaveCount(allViews.length);
  const overviewActionCount = await page.locator("[data-agent-action]").count();
  expect(overviewActionCount).toBeGreaterThanOrEqual(5);

  for (const view of allViews) {
    await openView(page, view);
    await expect(page.locator("#main-content")).toHaveAttribute("data-agent-current-view", view);
    await expect(page.locator("#main-content")).not.toContainText("Package unavailable");
  }
});

test("primary human workflow can save, validate, compose, and export without breaking the shell", async ({ page }) => {
  await openView(page, "workspace");
  await page.locator("#save-workspace-package").click();
  await expect(page.getByRole("status").filter({ hasText: /Saved/i })).toBeVisible();

  await openView(page, "generation");
  await page.locator("#generation-draft").fill(JSON.stringify({
    projectName: "QA Control Intake",
    context: "A deterministic QA scenario for the Archetype workbench.",
    goals: ["Prove the workbench can produce a valid intake from UI controls."]
  }, null, 2));
  await page.locator("#validate-draft").click();
  await expect(page.getByText("Draft is valid JSON and includes context.")).toBeVisible();
  await page.locator("#copy-command").click();
  await expect(page.getByText("Command copied.")).toBeVisible();

  await page.locator("#source-label").fill("QA evidence note");
  await page.locator("#source-content").fill("Readable source material for the launch-review flow.");
  await page.locator("#add-source-material").click();
  await expect(page.getByText("Source added to the intake draft.")).toBeVisible();

  await openView(page, "contract");
  await page.locator("#gap-description").fill("Document the exact edge state that needs product review.");
  await page.locator("#add-contract-gap").click();
  await expect(page.getByText("Frontend contract gap added.")).toBeVisible();

  await openView(page, "revision");
  await page.locator("#revision-summary").fill("QA review change");
  await page.locator("#revision-changes").fill("Add deterministic proof for the user-facing edge case.");
  await page.locator("#add-revision-request").click();
  await expect(page.getByText("Revision request added.")).toBeVisible();

  await openView(page, "export");
  const handoffDownload = page.waitForEvent("download");
  await page.locator("#download-handoff-json").click();
  await expect((await handoffDownload).suggestedFilename()).toMatch(/handoff.*\.json$/);
  await page.locator("#copy-validate-command").click();
  await expect(page.getByText("Validation command copied.")).toBeVisible();
});

for (const scenario of malformedScenarios) {
  test(`malformed ${scenario.id}: ${scenario.title}`, async ({ page }, testInfo) => {
    await testInfo.attach("malformed-scenario", {
      body: JSON.stringify(scenario, null, 2),
      contentType: "application/json"
    });

    await runMalformedScenario(page, scenario);
    await expect(page.locator("#main-content")).toHaveAttribute("data-agent-current-view", scenario.view);
    await expect(page.locator("#main-content")).toBeVisible();
    await expect(page.locator("#main-content")).not.toContainText("Package unavailable");
    await expect(page.getByText(new RegExp(scenario.expectedText, "i")).first()).toBeVisible();
    await expect(page.locator("img[onerror], iframe[src^='javascript:']")).toHaveCount(0);
  });
}

async function openView(page: Page, view: ViewId): Promise<void> {
  await page.locator(`[data-agent-view='${view}']`).click();
  await expect(page.locator("#main-content")).toHaveAttribute("data-agent-current-view", view);
}

async function runMalformedScenario(page: Page, scenario: MalformedScenario): Promise<void> {
  switch (scenario.flow) {
    case "generation.validate":
      await openView(page, "generation");
      await page.locator("#generation-draft").fill(stringPayload(scenario));
      await page.locator("#validate-draft").click();
      return;
    case "generation.load-form":
      await openView(page, "generation");
      await page.locator("#generation-draft").fill(stringPayload(scenario));
      await page.locator("#load-form-from-draft").click();
      return;
    case "generation.download": {
      await openView(page, "generation");
      await page.locator("#generation-draft").fill(stringPayload(scenario));
      const download = page.waitForEvent("download", { timeout: 1200 }).catch(() => null);
      await page.locator("#download-draft").click();
      expect(await download).toBeNull();
      return;
    }
    case "source.add":
      await openView(page, "generation");
      await fillSourceDraft(page, objectPayload(scenario));
      await page.locator("#add-source-material").click();
      return;
    case "source.import-file": {
      await openView(page, "generation");
      const payload = objectPayload(scenario);
      await page.locator("#source-file-input").setInputFiles({
        name: payload.fileName ?? "malformed-source.txt",
        mimeType: payload.mimeType ?? "text/plain",
        buffer: Buffer.from(payload.content ?? "", "utf8")
      });
      return;
    }
    case "workspace.import": {
      await openView(page, "workspace");
      const payload = objectPayload(scenario);
      await page.locator("#workspace-import-input").setInputFiles({
        name: payload.fileName ?? "workspace.json",
        mimeType: "application/json",
        buffer: Buffer.from(payload.content ?? "", "utf8")
      });
      return;
    }
    case "workspace.restore-state": {
      await openView(page, "workspace");
      const payload = objectPayload(scenario);
      await page.locator("#state-import-input").setInputFiles({
        name: payload.fileName ?? "state.json",
        mimeType: "application/json",
        buffer: Buffer.from(payload.content ?? "", "utf8")
      });
      return;
    }
    case "contract.add-gap":
      await openView(page, "contract");
      await fillContractGap(page, objectPayload(scenario));
      await page.locator("#add-contract-gap").click();
      return;
    case "revision.add-request":
      await openView(page, "revision");
      await fillRevisionRequest(page, objectPayload(scenario));
      await page.locator("#add-revision-request").click();
      return;
    default:
      throw new Error(`Unhandled malformed flow: ${scenario.flow}`);
  }
}

async function fillSourceDraft(page: Page, payload: Record<string, string>): Promise<void> {
  await page.locator("#source-label").fill(payload.label ?? "");
  if (payload.type) {
    await page.locator("#source-type").selectOption(payload.type);
  }
  await page.locator("#source-path").fill(payload.path ?? "");
  await page.locator("#source-notes").fill(payload.notes ?? "");
  await page.locator("#source-content").fill(payload.content ?? "");
}

async function fillContractGap(page: Page, payload: Record<string, string>): Promise<void> {
  if (payload.category) {
    await page.locator("#gap-category").selectOption(payload.category);
  }
  if (payload.severity) {
    await page.locator("#gap-severity").selectOption(payload.severity);
  }
  await page.locator("#gap-artifact").fill(payload.artifact ?? "");
  await page.locator("#gap-description").fill(payload.description ?? "");
}

async function fillRevisionRequest(page: Page, payload: Record<string, string>): Promise<void> {
  if (payload.priority) {
    await page.locator("#revision-priority").selectOption(payload.priority);
  }
  if (payload.changeType) {
    await page.locator("#revision-change-type").selectOption(payload.changeType);
  }
  await page.locator("#revision-summary").fill(payload.summary ?? "");
  await page.locator("#revision-artifacts").fill(payload.affectedArtifacts ?? "");
  await page.locator("#revision-changes").fill(payload.requestedChanges ?? "");
}

function stringPayload(scenario: MalformedScenario): string {
  return typeof scenario.malformedData === "string"
    ? scenario.malformedData
    : JSON.stringify(scenario.malformedData, null, 2);
}

function objectPayload(scenario: MalformedScenario): Record<string, string> {
  if (typeof scenario.malformedData === "string") {
    return { content: scenario.malformedData };
  }
  return scenario.malformedData;
}
