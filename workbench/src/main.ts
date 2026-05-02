import "./styles.css";

type ViewId =
  | "overview"
  | "generation"
  | "evidence"
  | "architecture"
  | "dsag"
  | "screens"
  | "design"
  | "contract"
  | "simulation"
  | "revision";

interface Bundle {
  generatedAt: string;
  manifest: Record<string, any>;
  readiness: {
    score: number;
    readyForFrontendAgent: boolean;
    blockers: string[];
    warnings: string[];
    requiredHumanReview: string[];
    dimensions: Record<string, number>;
  };
  schemaValidation: {
    status: string;
    blockers: string[];
    warnings: string[];
    checks: Array<{ id: string; status: string; details: string }>;
  };
  schemaIndex: Array<Record<string, string>>;
  evidence: Record<string, any>;
  sourceAnalysis: Record<string, any>;
  productModel: Record<string, any>;
  userModel: Record<string, any>;
  routeMap: { routes: Array<Record<string, any>> };
  screenInventory: { screens: Array<Record<string, any>> };
  dsag: {
    graph_version: string;
    nodes: Array<Record<string, any>>;
    edges: Array<Record<string, any>>;
    integrity: {
      status: string;
      blockers: string[];
      warnings: string[];
      checks: Array<{ id: string; status: string; details: string }>;
    };
  };
  componentRegistry: { components: Array<Record<string, any>> };
  patternRegistry: { patterns: Array<Record<string, any>> };
  primitiveTokens: Record<string, any>;
  semanticTokens: Record<string, any>;
  buildManifest: Record<string, any>;
  componentUsageMap: Record<string, any>;
  dataContracts: Record<string, any>;
  acceptanceCriteria: { criteria: Array<Record<string, any>> };
  buildSimulation: Record<string, any>;
  revision: Record<string, any>;
  reports: Record<string, string>;
  screens: Array<{ path: string; name: string; content: string }>;
}

interface ApprovalOverride {
  state: "pending_human_review" | "approved" | "changes_requested" | "blocked";
  note: string;
  updatedAt: string;
}

const views: Array<{ id: ViewId; label: string; count: (bundle: Bundle) => number | string }> = [
  { id: "overview", label: "Overview", count: (bundle) => bundle.readiness.score },
  { id: "generation", label: "Generate", count: () => "draft" },
  { id: "evidence", label: "Evidence", count: (bundle) => bundle.evidence.sources?.length ?? 0 },
  { id: "architecture", label: "Architecture", count: (bundle) => bundle.routeMap.routes.length },
  { id: "dsag", label: "DSAG", count: (bundle) => bundle.dsag.integrity.status },
  { id: "screens", label: "Screens", count: (bundle) => bundle.screens.length },
  { id: "design", label: "Design System", count: (bundle) => bundle.componentRegistry.components.length },
  { id: "contract", label: "Frontend Contract", count: (bundle) => bundle.buildManifest.entry_routes?.length ?? 0 },
  { id: "simulation", label: "Simulation", count: (bundle) => bundle.buildSimulation.routeSimulation?.routes?.length ?? 0 },
  { id: "revision", label: "Revision", count: (bundle) => bundle.revision.approvalGates?.gates?.length ?? 0 }
];

const state: {
  bundle: Bundle | null;
  view: ViewId;
  selectedScreen: string | null;
  screenFilter: string;
  packageName: string;
  generationDraft: string;
  generationMessage: string;
  approvalOverrides: Record<string, ApprovalOverride>;
  activeGateNote: string;
} = {
  bundle: null,
  view: "overview",
  selectedScreen: null,
  screenFilter: "",
  packageName: "sample-package",
  generationDraft: "",
  generationMessage: "",
  approvalOverrides: {},
  activeGateNote: ""
};

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("App root not found.");

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function badge(label: string, tone: "success" | "warning" | "danger" | "neutral" = "neutral"): string {
  const cls = tone === "neutral" ? "badge" : `badge ${tone}`;
  return `<span class="${cls}">${esc(label)}</span>`;
}

function statusTone(status: unknown): "success" | "warning" | "danger" | "neutral" {
  if (status === true || status === "pass" || status === "ready") return "success";
  if (status === "warning") return "warning";
  if (status === false || status === "fail") return "danger";
  return "neutral";
}

function panel(title: string, body: string, aside = ""): string {
  return `
    <section class="panel">
      <div class="panel-header">
        <h2>${esc(title)}</h2>
        ${aside}
      </div>
      <div class="panel-body">${body}</div>
    </section>
  `;
}

function table(headers: string[], rows: string[][]): string {
  if (rows.length === 0) return `<div class="empty">No rows.</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead><tr>${headers.map((header) => `<th>${esc(header)}</th>`).join("")}</tr></thead>
        <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
    </div>
  `;
}

function code(value: unknown): string {
  return `<pre class="code">${esc(typeof value === "string" ? value : pretty(value))}</pre>`;
}

function textArea(id: string, value: string, label: string): string {
  return `
    <label class="field">
      <span>${esc(label)}</span>
      <textarea id="${esc(id)}" class="textarea" spellcheck="false">${esc(value)}</textarea>
    </label>
  `;
}

function metric(label: string, value: unknown, tone: "success" | "warning" | "danger" | "neutral" = "neutral"): string {
  return `
    <section class="panel">
      <div class="panel-body metric">
        <div class="metric-value">${esc(value)}</div>
        <div class="metric-label">${esc(label)}</div>
        <div>${badge(tone === "neutral" ? "tracked" : tone, tone)}</div>
      </div>
    </section>
  `;
}

function renderOverview(bundle: Bundle): string {
  const routeCount = bundle.routeMap.routes.length;
  const screenCount = bundle.screenInventory.screens.length;
  const dsagStatus = bundle.dsag.integrity.status;
  return `
    <div class="grid cols-3">
      ${metric("Readiness score", bundle.readiness.score, bundle.readiness.readyForFrontendAgent ? "success" : "danger")}
      ${metric("Routes", routeCount)}
      ${metric("Screens", screenCount)}
      ${metric("DSAG nodes", bundle.dsag.nodes.length, statusTone(dsagStatus))}
      ${metric("Simulation routes", bundle.buildSimulation.routeSimulation?.routes?.length ?? 0, statusTone(bundle.buildSimulation.status))}
      ${metric("Manifest artifacts", bundle.manifest.artifact_index?.length ?? 0)}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Warnings", list(bundle.readiness.warnings))}
      ${panel("Human Review", list(bundle.readiness.requiredHumanReview))}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Product Model", code(bundle.productModel))}
      ${panel("Validation", code({ status: bundle.schemaValidation.status, checks: bundle.schemaValidation.checks.length, blockers: bundle.schemaValidation.blockers.length }))}
    </div>
  `;
}

function list(items: unknown[]): string {
  if (!items || items.length === 0) return `<div class="empty">None.</div>`;
  return `<div class="list">${items.map((item) => `<div class="list-button">${esc(typeof item === "string" ? item : JSON.stringify(item))}</div>`).join("")}</div>`;
}

function defaultIntakeFromBundle(bundle: Bundle): Record<string, unknown> {
  return {
    projectName: bundle.productModel.product_name ?? "Archetype Project",
    context: `${bundle.productModel.product_type ?? "Product"}: ${bundle.productModel.primary_goal ?? "Generate product architecture."}`,
    goals: (bundle.productModel.core_jobs ?? []).map((job: any) => job.job).filter(Boolean),
    businessGoals: bundle.productModel.business_goals ?? [],
    users: bundle.productModel.primary_users ?? [],
    brand: {
      attributes: ["clear", "precise", "trustworthy"],
      primaryColor: "#2563EB",
      tone: "Clear, direct, and low-hype."
    },
    operatingMode: bundle.manifest.operating_mode ?? "full_architecture"
  };
}

function ensureGenerationDraft(bundle: Bundle): string {
  if (!state.generationDraft) {
    state.generationDraft = pretty(defaultIntakeFromBundle(bundle));
  }
  return state.generationDraft;
}

function intakeFileName(value: Record<string, unknown>): string {
  const projectName = String(value.projectName ?? "custom-project");
  return `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "custom-project"}-intake.json`;
}

function parseGenerationDraft(): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  try {
    const value = JSON.parse(state.generationDraft);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return { ok: false, error: "Draft must be a JSON object." };
    }
    const record = value as Record<string, unknown>;
    if (typeof record.context !== "string" || record.context.trim().length === 0) {
      return { ok: false, error: "Draft requires a non-empty context field." };
    }
    return { ok: true, value: record };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid JSON." };
  }
}

async function copyTextToClipboard(value: string): Promise<void> {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const text = document.createElement("textarea");
  text.value = value;
  text.style.position = "fixed";
  text.style.left = "-9999px";
  document.body.appendChild(text);
  text.focus();
  text.select();
  document.execCommand("copy");
  text.remove();
}

function renderGeneration(bundle: Bundle): string {
  const draft = ensureGenerationDraft(bundle);
  const parsed = parseGenerationDraft();
  const fileName = parsed.ok ? intakeFileName(parsed.value) : "custom-project-intake.json";
  const command = `node dist/cli.js generate --input examples/${fileName} --out tmp/${fileName.replace("-intake.json", "-output")}`;
  return `
    <div class="grid cols-2">
      ${panel("Generation Draft", `
        ${textArea("generation-draft", draft, "Intake JSON")}
        <div class="control-row">
          <button class="button primary" id="validate-draft" type="button">Validate draft</button>
          <button class="button" id="reset-draft" type="button">Use current package</button>
          <button class="button" id="download-draft" type="button">Download intake</button>
        </div>
        ${state.generationMessage ? `<div class="notice">${esc(state.generationMessage)}</div>` : ""}
      `)}
      ${panel("Run Command", `
        ${parsed.ok ? badge("draft valid", "success") : badge("draft invalid", "danger")}
        <div style="height:10px"></div>
        ${parsed.ok ? code(command) : `<div class="empty">${esc(parsed.error)}</div>`}
        <div class="control-row">
          <button class="button" id="copy-command" type="button" ${parsed.ok ? "" : "disabled"}>Copy command</button>
        </div>
      `)}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Generation Contract", code({
        required: ["context"],
        recommended: ["projectName", "goals", "businessGoals", "users", "brand", "operatingMode"],
        supportedModes: ["fast_architecture", "full_architecture", "existing_product_audit", "contract_repair"]
      }))}
      ${panel("Current Package Seed", code(defaultIntakeFromBundle(bundle)))}
    </div>
  `;
}

function renderEvidence(bundle: Bundle): string {
  return `
    <div class="grid cols-2">
      ${panel("Sources", table(["Source", "Type", "Confidence"], (bundle.evidence.sources ?? []).map((source: any) => [
        esc(source.source_label),
        esc(source.source_type),
        badge(source.confidence, source.confidence === "high" ? "success" : source.confidence === "medium" ? "warning" : "neutral")
      ])))}
      ${panel("Source Analysis", code(bundle.sourceAnalysis))}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Decisions", table(["Decision", "Status", "Confidence"], (bundle.evidence.decisions ?? []).map((decision: any) => [
        esc(decision.decision),
        badge(decision.status, decision.status === "accepted" ? "success" : "warning"),
        esc(decision.confidence)
      ])))}
      ${panel("Risks", list(bundle.evidence.risks ?? []))}
    </div>
  `;
}

function renderArchitecture(bundle: Bundle): string {
  return `
    <div class="grid cols-2">
      ${panel("Routes", table(["Route", "Screen", "Layout", "Priority"], bundle.routeMap.routes.map((route) => [
        `<code>${esc(route.route)}</code>`,
        esc(route.screen_id),
        esc(route.layout),
        badge(route.priority, route.priority === "primary" ? "success" : "neutral")
      ])))}
      ${panel("Screen Inventory", table(["Screen", "Priority", "Patterns"], bundle.screenInventory.screens.map((screen) => [
        esc(screen.screen_id),
        badge(screen.priority, screen.priority === "P0" ? "success" : "neutral"),
        esc((screen.required_patterns ?? []).join(", "))
      ])))}
    </div>
    <div style="margin-top:14px">
      ${panel("Information Shape", code({ userModel: bundle.userModel, acceptanceCriteria: bundle.acceptanceCriteria.criteria.length }))}
    </div>
  `;
}

function renderDSAG(bundle: Bundle): string {
  const checks = bundle.dsag.integrity.checks.slice(0, 90);
  return `
    <div class="grid cols-3">
      ${metric("Integrity", bundle.dsag.integrity.status, statusTone(bundle.dsag.integrity.status))}
      ${metric("Nodes", bundle.dsag.nodes.length)}
      ${metric("Edges", bundle.dsag.edges.length)}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Integrity Checks", table(["Check", "Status"], checks.map((check) => [
        esc(check.id),
        badge(check.status, statusTone(check.status))
      ])))}
      ${panel("Graph Sample", code({ nodes: bundle.dsag.nodes.slice(0, 12), edges: bundle.dsag.edges.slice(0, 12) }))}
    </div>
  `;
}

function renderScreens(bundle: Bundle): string {
  const filtered = bundle.screens.filter((screen) =>
    screen.name.toLowerCase().includes(state.screenFilter.toLowerCase())
  );
  const selected = filtered.find((screen) => screen.name === state.selectedScreen) ?? filtered[0] ?? null;
  if (selected && state.selectedScreen !== selected.name) state.selectedScreen = selected.name;
  return `
    <div class="split">
      <section class="panel">
        <div class="panel-header"><h2>Screens</h2></div>
        <div class="panel-body">
          <input class="search" id="screen-filter" value="${esc(state.screenFilter)}" placeholder="Filter screens" />
          <div class="list" style="margin-top:10px">
            ${filtered.map((screen) => `
              <button class="list-button ${selected?.name === screen.name ? "active" : ""}" data-screen="${esc(screen.name)}">
                ${esc(screen.name)}
              </button>
            `).join("")}
          </div>
        </div>
      </section>
      ${panel(selected ? selected.path : "Screen", selected ? code(selected.content) : `<div class="empty">No matching screen.</div>`)}
    </div>
  `;
}

function renderDesign(bundle: Bundle): string {
  return `
    <div class="grid cols-2">
      ${panel("Components", table(["Component", "Category", "Screens"], bundle.componentRegistry.components.map((component) => [
        esc(component.name),
        esc(component.category),
        esc((component.used_on_screens ?? []).join(", ") || "none")
      ])))}
      ${panel("Patterns", table(["Pattern", "Screens", "Data"], bundle.patternRegistry.patterns.map((pattern) => [
        esc(pattern.name),
        esc((pattern.used_on_screens ?? []).join(", ") || "none"),
        esc((pattern.data_requirements ?? []).join(", "))
      ])))}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Semantic Tokens", code(bundle.semanticTokens))}
      ${panel("Primitive Tokens", code(bundle.primitiveTokens))}
    </div>
  `;
}

function renderContract(bundle: Bundle): string {
  return `
    <div class="grid cols-2">
      ${panel("Build Manifest", code(bundle.buildManifest))}
      ${panel("Data Contracts", code(bundle.dataContracts))}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Component Usage", code(bundle.componentUsageMap))}
      ${panel("Acceptance Criteria", code(bundle.acceptanceCriteria))}
    </div>
  `;
}

function renderSimulation(bundle: Bundle): string {
  return `
    <div class="grid cols-3">
      ${metric("Simulation", bundle.buildSimulation.status ?? "warning", statusTone(bundle.buildSimulation.status))}
      ${metric("Routes", bundle.buildSimulation.routeSimulation?.routes?.length ?? 0)}
      ${metric("Screens", bundle.buildSimulation.stateCoverage?.screens?.length ?? 0)}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Simulation Report", code(bundle.buildSimulation.report))}
      ${panel("Route Simulation", code(bundle.buildSimulation.routeSimulation))}
      ${panel("Component Resolution", code(bundle.buildSimulation.componentResolution))}
      ${panel("Data Coverage", code(bundle.buildSimulation.dataContractCoverage))}
    </div>
  `;
}

function renderRevision(bundle: Bundle): string {
  const gates = bundle.revision.approvalGates?.gates ?? [];
  return `
    <div class="grid cols-2">
      ${panel("Approval Gates", `
        <div class="list">
          ${gates.map((gate: any) => {
            const override = state.approvalOverrides[gate.id];
            const approvalState = override?.state ?? gate.approval_state;
            return `
              <div class="gate-row">
                <div>
                  <h3>${esc(gate.label)}</h3>
                  <div class="muted">${esc((gate.required_artifacts ?? []).join(", "))}</div>
                  ${override?.note ? `<div class="gate-note">${esc(override.note)}</div>` : ""}
                </div>
                <div class="gate-actions">
                  ${badge(approvalState, approvalState === "approved" ? "success" : approvalState === "blocked" ? "danger" : "warning")}
                  <button class="button small" data-gate="${esc(gate.id)}" data-approval-state="approved" type="button">Approve</button>
                  <button class="button small" data-gate="${esc(gate.id)}" data-approval-state="changes_requested" type="button">Request changes</button>
                  <button class="button small" data-gate="${esc(gate.id)}" data-approval-state="blocked" type="button">Block</button>
                </div>
              </div>
            `;
          }).join("")}
        </div>
        <div style="height:10px"></div>
        ${textArea("gate-note", state.activeGateNote, "Approval note for the next gate action")}
        <div class="control-row">
          <button class="button" id="reset-gates" type="button">Reset local gate states</button>
        </div>
      `)}
      ${panel("Initial Change Set", code(bundle.revision.initialChangeSet))}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      ${panel("Invalidation Rules", code(bundle.revision.invalidationRules))}
      ${panel("Revision Protocol", code(bundle.revision.protocol))}
    </div>
  `;
}

function renderContent(bundle: Bundle): string {
  switch (state.view) {
    case "overview":
      return renderOverview(bundle);
    case "generation":
      return renderGeneration(bundle);
    case "evidence":
      return renderEvidence(bundle);
    case "architecture":
      return renderArchitecture(bundle);
    case "dsag":
      return renderDSAG(bundle);
    case "screens":
      return renderScreens(bundle);
    case "design":
      return renderDesign(bundle);
    case "contract":
      return renderContract(bundle);
    case "simulation":
      return renderSimulation(bundle);
    case "revision":
      return renderRevision(bundle);
  }
}

function render(): void {
  const bundle = state.bundle;
  if (!bundle) {
    app.innerHTML = `<main class="main"><div class="empty">Package unavailable.</div></main>`;
    return;
  }
  const viewLabel = views.find((view) => view.id === state.view)?.label ?? "Overview";
  app.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="mark">A</div>
          <div>
            <div class="brand-title">Archetype</div>
            <div class="brand-subtitle">Architecture Workbench</div>
          </div>
        </div>
        <div class="package-tools">
          <button class="button primary" id="load-sample" type="button">Load sample</button>
          <button class="button" id="import-folder" type="button">Import package</button>
          <input id="folder-input" type="file" webkitdirectory multiple hidden />
        </div>
        <nav class="nav" aria-label="Workbench views">
          ${views.map((view) => `
            <button class="nav-item ${state.view === view.id ? "active" : ""}" data-view="${view.id}" type="button">
              <span>${esc(view.label)}</span>
              <span class="nav-count">${esc(view.count(bundle))}</span>
            </button>
          `).join("")}
        </nav>
        <div class="footer-note">${esc(state.packageName)} · ${esc(bundle.manifest.project_slug ?? "package")}</div>
      </aside>
      <main class="main">
        <div class="topbar">
          <div>
            <div class="eyebrow">${esc(viewLabel)}</div>
            <h1>${esc(bundle.productModel.product_name ?? "Archetype Package")}</h1>
            <div class="meta-line">${esc(bundle.productModel.product_type ?? "")} · ${esc(bundle.manifest.operating_mode ?? "")}</div>
          </div>
          <div class="status-strip">
            ${badge(`score ${bundle.readiness.score}`, bundle.readiness.readyForFrontendAgent ? "success" : "danger")}
            ${badge(bundle.readiness.readyForFrontendAgent ? "ready" : "blocked", bundle.readiness.readyForFrontendAgent ? "success" : "danger")}
            ${badge(`DSAG ${bundle.dsag.integrity.status}`, statusTone(bundle.dsag.integrity.status))}
            ${badge(`${bundle.readiness.warnings.length} warnings`, bundle.readiness.warnings.length ? "warning" : "success")}
          </div>
        </div>
        ${renderContent(bundle)}
      </main>
    </div>
  `;
  bindEvents();
}

function bindEvents(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view as ViewId;
      render();
    });
  });
  document.querySelectorAll<HTMLButtonElement>("[data-screen]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedScreen = button.dataset.screen ?? null;
      render();
    });
  });
  document.querySelector<HTMLInputElement>("#screen-filter")?.addEventListener("input", (event) => {
    state.screenFilter = (event.target as HTMLInputElement).value;
    state.selectedScreen = null;
    render();
  });
  document.querySelector<HTMLTextAreaElement>("#generation-draft")?.addEventListener("input", (event) => {
    state.generationDraft = (event.target as HTMLTextAreaElement).value;
  });
  document.querySelector<HTMLButtonElement>("#validate-draft")?.addEventListener("click", () => {
    const parsed = parseGenerationDraft();
    state.generationMessage = parsed.ok ? "Draft is valid JSON and includes context." : parsed.error;
    render();
  });
  document.querySelector<HTMLButtonElement>("#reset-draft")?.addEventListener("click", () => {
    if (state.bundle) state.generationDraft = pretty(defaultIntakeFromBundle(state.bundle));
    state.generationMessage = "Draft reset from the current package.";
    render();
  });
  document.querySelector<HTMLButtonElement>("#download-draft")?.addEventListener("click", () => {
    const parsed = parseGenerationDraft();
    if (!parsed.ok) {
      state.generationMessage = parsed.error;
      render();
      return;
    }
    const fileName = intakeFileName(parsed.value);
    const blob = new Blob([`${pretty(parsed.value)}\n`], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
    state.generationMessage = `Prepared ${fileName}.`;
    render();
  });
  document.querySelector<HTMLButtonElement>("#copy-command")?.addEventListener("click", async () => {
    const parsed = parseGenerationDraft();
    if (!parsed.ok) return;
    const fileName = intakeFileName(parsed.value);
    const command = `node dist/cli.js generate --input examples/${fileName} --out tmp/${fileName.replace("-intake.json", "-output")}`;
    await copyTextToClipboard(command);
    state.generationMessage = "Command copied.";
    render();
  });
  document.querySelector<HTMLTextAreaElement>("#gate-note")?.addEventListener("input", (event) => {
    state.activeGateNote = (event.target as HTMLTextAreaElement).value;
  });
  document.querySelectorAll<HTMLButtonElement>("[data-gate]").forEach((button) => {
    button.addEventListener("click", () => {
      const gateId = button.dataset.gate;
      const approvalState = button.dataset.approvalState as ApprovalOverride["state"] | undefined;
      if (!gateId || !approvalState) return;
      state.approvalOverrides[gateId] = {
        state: approvalState,
        note: state.activeGateNote.trim(),
        updatedAt: new Date().toISOString()
      };
      saveApprovalOverrides();
      render();
    });
  });
  document.querySelector<HTMLButtonElement>("#reset-gates")?.addEventListener("click", () => {
    state.approvalOverrides = {};
    state.activeGateNote = "";
    saveApprovalOverrides();
    render();
  });
  document.querySelector<HTMLButtonElement>("#load-sample")?.addEventListener("click", () => loadSample());
  document.querySelector<HTMLButtonElement>("#import-folder")?.addEventListener("click", () => {
    document.querySelector<HTMLInputElement>("#folder-input")?.click();
  });
  document.querySelector<HTMLInputElement>("#folder-input")?.addEventListener("change", async (event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      state.bundle = await bundleFromFiles([...input.files]);
      state.packageName = input.files[0]?.webkitRelativePath?.split("/")[0] || "imported-package";
      state.view = "overview";
      state.selectedScreen = null;
      state.generationDraft = "";
      state.generationMessage = "";
      state.activeGateNote = "";
      loadApprovalOverrides();
      render();
    }
  });
}

async function loadSample(): Promise<void> {
  const response = await fetch("/sample-package.json");
  state.bundle = await response.json() as Bundle;
  state.packageName = "sample-package";
  loadApprovalOverrides();
  state.selectedScreen = null;
  state.generationDraft = "";
  state.generationMessage = "";
  state.activeGateNote = "";
  render();
}

function approvalStorageKey(): string {
  const slug = state.bundle?.manifest.project_slug ?? state.packageName;
  return `archetype:approval:${slug}`;
}

function loadApprovalOverrides(): void {
  try {
    state.approvalOverrides = JSON.parse(localStorage.getItem(approvalStorageKey()) ?? "{}");
  } catch {
    state.approvalOverrides = {};
  }
}

function saveApprovalOverrides(): void {
  localStorage.setItem(approvalStorageKey(), JSON.stringify(state.approvalOverrides));
}

async function readFile(file: File): Promise<string> {
  return file.text();
}

async function bundleFromFiles(files: File[]): Promise<Bundle> {
  const byPath = new Map<string, File>();
  for (const file of files) {
    const parts = (file.webkitRelativePath || file.name).split("/");
    const relative = parts.includes("00-manifest") ? parts.slice(parts.indexOf("00-manifest")).join("/") : parts.slice(1).join("/");
    byPath.set(relative || file.name, file);
  }
  const getText = async (path: string) => {
    const file = byPath.get(path);
    if (!file) throw new Error(`Missing ${path}`);
    return readFile(file);
  };
  const getJson = async (path: string) => JSON.parse(await getText(path));
  const screenEntries = [...byPath.entries()]
    .filter(([path]) => path.startsWith("05-screen-specs/") && path.endsWith(".yaml"))
    .sort(([a], [b]) => a.localeCompare(b));
  const screens = await Promise.all(screenEntries.map(async ([path, file]) => ({
    path,
    name: path.split("/").pop()?.replace(".yaml", "") ?? path,
    content: await readFile(file)
  })));
  return {
    generatedAt: new Date().toISOString(),
    manifest: await getJson("00-manifest/manifest.json"),
    readiness: await getJson("00-manifest/implementation-readiness.json"),
    schemaValidation: await getJson("00-manifest/schema-validation-report.json"),
    schemaIndex: await getJson("00-manifest/schema-index.json"),
    evidence: await getJson("01-evidence/evidence-ledger.json"),
    sourceAnalysis: await getJson("01-evidence/source-analysis-report.json"),
    productModel: await getJson("02-product-model/product-model.json"),
    userModel: await getJson("02-product-model/user-model.json"),
    routeMap: await getJson("03-experience-architecture/route-map.json"),
    screenInventory: await getJson("03-experience-architecture/screen-inventory.json"),
    dsag: await getJson("03-experience-architecture/dsag.json"),
    componentRegistry: await getJson("04-design-system/components/component-registry.json"),
    patternRegistry: await getJson("04-design-system/patterns/pattern-registry.json"),
    primitiveTokens: await getJson("04-design-system/tokens/primitive-tokens.json"),
    semanticTokens: await getJson("04-design-system/tokens/semantic-tokens.json"),
    buildManifest: await getJson("06-frontend-agent-contract/build-manifest.json"),
    componentUsageMap: await getJson("06-frontend-agent-contract/component-usage-map.json"),
    dataContracts: await getJson("06-frontend-agent-contract/data-contracts.json"),
    acceptanceCriteria: await getJson("06-frontend-agent-contract/acceptance-criteria.json"),
    buildSimulation: {
      buildPlan: await getJson("11-build-simulation/build-plan.json"),
      routeSimulation: await getJson("11-build-simulation/route-simulation.json"),
      componentResolution: await getJson("11-build-simulation/component-resolution.json"),
      patternResolution: await getJson("11-build-simulation/pattern-resolution.json"),
      stateCoverage: await getJson("11-build-simulation/state-coverage.json"),
      dataContractCoverage: await getJson("11-build-simulation/data-contract-coverage.json"),
      acceptanceSimulation: await getJson("11-build-simulation/acceptance-simulation.json"),
      report: await getText("11-build-simulation/frontend-build-simulation-report.md")
    },
    revision: {
      dependencyGraph: await getJson("10-revision/artifact-dependency-graph.json"),
      invalidationRules: await getJson("10-revision/invalidation-rules.json"),
      approvalGates: await getJson("10-revision/approval-gates.json"),
      initialChangeSet: await getJson("10-revision/initial-change-set.json"),
      protocol: await getText("10-revision/revision-protocol.md")
    },
    reports: {
      dsagIntegrity: await getText("08-quality/dsag-integrity-report.md"),
      consistency: await getText("08-quality/consistency-report.md"),
      accessibility: await getText("08-quality/accessibility-report.md"),
      safety: await getText("08-quality/safety-report.md"),
      readiness: await getText("08-quality/implementation-readiness-report.md")
    },
    screens
  };
}

loadSample().catch((error) => {
  app.innerHTML = `<main class="main"><div class="empty">${esc(error instanceof Error ? error.message : error)}</div></main>`;
});
