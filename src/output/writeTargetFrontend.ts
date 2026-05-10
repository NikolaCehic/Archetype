import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { prepareGeneratedTargetDirectory } from "../safety/pathSafety";

interface TargetWriteOptions {
  force?: boolean;
}

interface TargetWriteResult {
  status: "pass" | "fail";
  outputDir: string;
  targetDir: string;
  filesWritten: number;
  blockers: string[];
  warnings: string[];
  files: string[];
}

interface SourceManifestFile {
  path: string;
  kind: string;
  route?: string;
  screen_id?: string;
  screen_file?: string;
  feature_module?: string;
  component?: string;
  pattern?: string;
  suite_id?: string;
  required_states?: string[];
}

type SourceTargetKind = "next_app_router" | "vite_react_router";

interface SourceManifest {
  target_stack?: Record<string, unknown>;
  files?: SourceManifestFile[];
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function ensureDir(filePath: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeText(targetDir: string, relativePath: string, value: string): void {
  const target = path.join(targetDir, relativePath);
  ensureDir(target);
  writeFileSync(target, `${value.trimEnd()}\n`);
}

function pascalCase(value: string): string {
  return value
    .split(/[^a-zA-Z0-9]+/g)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join("");
}

function safeIdentifier(value: string, fallback: string): string {
  const candidate = pascalCase(value);
  return candidate || fallback;
}

function relativeImport(fromFile: string, toFile: string): string {
  const fromDir = path.posix.dirname(fromFile);
  const withoutExt = toFile.replace(/\.(tsx|ts|css)$/, "");
  const relative = path.posix.relative(fromDir, withoutExt);
  return relative.startsWith(".") ? relative : `./${relative}`;
}

function targetKindFromManifest(manifest: SourceManifest): SourceTargetKind {
  const stack = manifest.target_stack ?? {};
  if (stack.resolved_source_target === "vite_react_router") return "vite_react_router";
  if (stack.resolved_source_target === "next_app_router") return "next_app_router";
  const hasViteFiles = (manifest.files ?? []).some((file) => file.path === "vite.config.ts" || file.path.startsWith("src/routes/"));
  return hasViteFiles ? "vite_react_router" : "next_app_router";
}

function packageJson(targetKind: SourceTargetKind): string {
  const vitePackage = {
    private: true,
    scripts: {
      dev: "vite --host 127.0.0.1",
      build: "tsc --noEmit && vite build",
      preview: "vite preview --host 127.0.0.1",
      typecheck: "tsc --noEmit",
      test: "vitest run",
      "archetype:unit": "vitest run",
      "archetype:playwright": "playwright test --config=playwright.config.ts"
    },
    dependencies: {
      "@vitejs/plugin-react": "^5.0.0",
      "vite": "^7.0.0",
      "react": "19.2.5",
      "react-dom": "19.2.5",
      "react-router-dom": "^7.0.0"
    },
    devDependencies: {
      "@types/node": "25.6.0",
      "@types/react": "19.2.14",
      "@types/react-dom": "19.2.3",
      "@playwright/test": "1.59.1",
      "tailwindcss": "4.2.4",
      "typescript": "5.9.3",
      "vitest": "^4.0.0"
    }
  };
  if (targetKind === "vite_react_router") return JSON.stringify(vitePackage, null, 2);
  return JSON.stringify({
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
      typecheck: "tsc --noEmit",
      test: "vitest run",
      "archetype:unit": "vitest run",
      "archetype:playwright": "playwright test --config=playwright.config.ts"
    },
    dependencies: {
      "next": "16.2.4",
      "react": "19.2.5",
      "react-dom": "19.2.5"
    },
    devDependencies: {
      "@types/node": "25.6.0",
      "@types/react": "19.2.14",
      "@types/react-dom": "19.2.3",
      "@playwright/test": "1.59.1",
      "tailwindcss": "4.2.4",
      "typescript": "5.9.3",
      "vitest": "^4.0.0"
    },
    overrides: {
      "postcss": "8.5.10"
    }
  }, null, 2);
}

function tsconfigJson(targetKind: SourceTargetKind): string {
  const baseCompilerOptions = {
    target: "ES2022",
    lib: ["dom", "dom.iterable", "esnext"],
    allowJs: false,
    skipLibCheck: true,
    strict: true,
    noEmit: true,
    esModuleInterop: true,
    module: "esnext",
    moduleResolution: "bundler",
    resolveJsonModule: true,
    isolatedModules: true,
    jsx: "react-jsx",
    incremental: true
  };
  if (targetKind === "vite_react_router") {
    return JSON.stringify({
      compilerOptions: baseCompilerOptions,
      include: ["src"],
      exclude: ["node_modules", "dist"]
    }, null, 2);
  }
  return JSON.stringify({
    compilerOptions: {
      ...baseCompilerOptions,
      plugins: [{ name: "next" }]
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts"],
    exclude: ["node_modules"]
  }, null, 2);
}

function nextConfigSource(): string {
  return [
    "const nextConfig = {",
    "  turbopack: {",
    "    root: process.cwd()",
    "  }",
    "};",
    "",
    "export default nextConfig;"
  ].join("\n");
}

function viteConfigSource(): string {
  return [
    "import react from \"@vitejs/plugin-react\";",
    "import { defineConfig } from \"vite\";",
    "",
    "export default defineConfig({",
    "  plugins: [react()],",
    "  server: { host: \"127.0.0.1\" },",
    "  preview: { host: \"127.0.0.1\" }",
    "});"
  ].join("\n");
}

function indexHtmlSource(): string {
  return [
    "<!doctype html>",
    "<html lang=\"en\">",
    "  <head>",
    "    <meta charset=\"UTF-8\" />",
    "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />",
    "    <title>Archetype Target</title>",
    "  </head>",
    "  <body>",
    "    <div id=\"root\"></div>",
    "    <script type=\"module\" src=\"/src/main.tsx\"></script>",
    "  </body>",
    "</html>"
  ].join("\n");
}

function mainSource(): string {
  return [
    "import { StrictMode } from \"react\";",
    "import { createRoot } from \"react-dom/client\";",
    "import App from \"./App\";",
    "import \"./index.css\";",
    "",
    "const root = document.getElementById(\"root\");",
    "if (!root) throw new Error(\"Missing root element.\");",
    "",
    "createRoot(root).render(",
    "  <StrictMode>",
    "    <App />",
    "  </StrictMode>",
    ");"
  ].join("\n");
}

function componentSource(name: string, selector: string): string {
  const componentName = safeIdentifier(name, "ArchetypeComponent");
  return [
    "interface ArchetypeComponentProps {",
    "  state?: string;",
    "  label?: string;",
    "}",
    "",
    `export function ${componentName}({ state = "default", label = "${name}" }: ArchetypeComponentProps) {`,
    "  return (",
    `    <section data-archetype-component="${selector}" data-state={state} className="archetype-surface">`,
    "      <span className=\"archetype-eyebrow\">component</span>",
    "      <strong>{label}</strong>",
    "    </section>",
    "  );",
    "}"
  ].join("\n");
}

function patternSource(name: string, selector: string): string {
  const patternName = safeIdentifier(name, "ArchetypePattern");
  return [
    `export function ${patternName}() {`,
    "  return (",
    `    <section data-archetype-pattern="${selector}" className="archetype-pattern">`,
    "      <span className=\"archetype-eyebrow\">pattern</span>",
    `      <strong>${name}</strong>`,
    "    </section>",
    "  );",
    "}"
  ].join("\n");
}

function screenComponentName(screenId: string): string {
  return `${safeIdentifier(screenId, "Archetype")}Screen`;
}

function routeComponentName(screenId: string): string {
  return `${safeIdentifier(screenId, "Archetype")}Route`;
}

function nextRouteSource(file: SourceManifestFile): string {
  const screenFile = String(file.screen_file ?? "");
  const componentName = screenComponentName(String(file.screen_id ?? "Screen"));
  const importPath = screenFile ? relativeImport(file.path, screenFile) : "";
  const states = JSON.stringify(file.required_states && file.required_states.length > 0 ? file.required_states : ["default"]);
  return [
    screenFile ? `import { ${componentName} } from "${importPath}";` : "",
    "",
    "type RouteProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };",
    "",
    `const allowedStates = ${states} as const;`,
    "",
    "export default async function ArchetypeRoute({ searchParams }: RouteProps) {",
    "  const params = await searchParams;",
    "  const requestedState = typeof params?.archetype_state === \"string\" ? params.archetype_state : \"default\";",
    "  const state = (allowedStates as readonly string[]).includes(requestedState) ? requestedState : \"default\";",
    "  return (",
    `    <main data-archetype-screen="${file.screen_id}" data-state={state} data-route="${file.route}" className="archetype-screen">`,
    `      <${componentName} state={state} />`,
    "    </main>",
    "  );",
    "}"
  ].join("\n");
}

function viteRouteSource(file: SourceManifestFile): string {
  const screenFile = String(file.screen_file ?? "");
  const componentName = screenComponentName(String(file.screen_id ?? "Screen"));
  const routeName = routeComponentName(String(file.screen_id ?? "Route"));
  const importPath = screenFile ? relativeImport(file.path, screenFile) : "";
  const states = JSON.stringify(file.required_states && file.required_states.length > 0 ? file.required_states : ["default"]);
  return [
    screenFile ? `import { ${componentName} } from "${importPath}";` : "",
    "",
    "interface ArchetypeRouteProps {",
    "  state?: string;",
    "}",
    "",
    `const allowedStates = ${states} as const;`,
    "",
    "export const routeConfig = {",
    `  path: ${JSON.stringify(file.route ?? "/")},`,
    `  screenId: ${JSON.stringify(file.screen_id ?? "screen")},`,
    "  allowedStates",
    "};",
    "",
    `export function ${routeName}({ state = "default" }: ArchetypeRouteProps) {`,
    "  const resolvedState = (allowedStates as readonly string[]).includes(state) ? state : \"default\";",
    "  return (",
    `    <main data-archetype-screen="${file.screen_id}" data-state={resolvedState} data-route="${file.route}" className="archetype-screen">`,
    `      <${componentName} state={resolvedState} />`,
    "    </main>",
    "  );",
    "}",
    "",
    `export default ${routeName};`
  ].join("\n");
}

function appSource(routeMap: { routes?: Array<Record<string, unknown>> }): string {
  const routes = (routeMap.routes ?? [])
    .filter((route) => String(route.route_file ?? "").startsWith("src/routes/"))
    .map((route) => ({
      path: String(route.route ?? "/"),
      screenId: String(route.screen_id ?? "route"),
      routeFile: String(route.route_file ?? "")
    }));
  const imports = routes.map((route) => {
    const componentName = routeComponentName(route.screenId);
    const configName = `${componentName}Config`;
    return `import { ${componentName}, routeConfig as ${configName} } from "${relativeImport("src/App.tsx", route.routeFile)}";`;
  });
  const routeElements = routes.map((route) => {
    const componentName = routeComponentName(route.screenId);
    const configName = `${componentName}Config`;
    return `        <Route path="${route.path}" element={<RouteBoundary config={${configName}} Component={${componentName}} />} />`;
  });
  return [
    "import type { ComponentType } from \"react\";",
    "import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from \"react-router-dom\";",
    ...imports,
    "",
    "interface RouteBoundaryProps {",
    "  config: { path: string; allowedStates: readonly string[] };",
    "  Component: ComponentType<{ state?: string }>;",
    "}",
    "",
    "function RouteBoundary({ config, Component }: RouteBoundaryProps) {",
    "  const [searchParams] = useSearchParams();",
    "  const requestedState = searchParams.get(\"archetype_state\") ?? \"default\";",
    "  const state = config.allowedStates.includes(requestedState) ? requestedState : \"default\";",
    "  return <Component state={state} />;",
    "}",
    "",
    "export default function App() {",
    "  return (",
    "    <BrowserRouter>",
    "      <Routes>",
    ...routeElements,
    "        <Route path=\"*\" element={<Navigate to=\"/\" replace />} />",
    "      </Routes>",
    "    </BrowserRouter>",
    "  );",
    "}"
  ].join("\n");
}

function screenSource(file: SourceManifestFile, routeMap: { routes?: Array<Record<string, unknown>> }): string {
  const route = routeMap.routes?.find((item) => item.screen_id === file.screen_id);
  const components = ((route?.components as Array<{ name?: string; file?: string }> | undefined) ?? []).slice(0, 8);
  const patterns = ((route?.patterns as Array<{ name?: string; file?: string }> | undefined) ?? []).slice(0, 8);
  const imports = [
    ...components.map((component) => `import { ${safeIdentifier(String(component.name ?? "Component"), "ArchetypeComponent")} } from "${relativeImport(file.path, String(component.file ?? ""))}";`),
    ...patterns.map((pattern) => `import { ${safeIdentifier(String(pattern.name ?? "Pattern"), "ArchetypePattern")} } from "${relativeImport(file.path, String(pattern.file ?? ""))}";`)
  ];
  const componentCalls = components.map((component) => `        <${safeIdentifier(String(component.name ?? "Component"), "ArchetypeComponent")} state={state} />`);
  const patternCalls = patterns.map((pattern) => `        <${safeIdentifier(String(pattern.name ?? "Pattern"), "ArchetypePattern")} />`);
  const componentName = screenComponentName(String(file.screen_id ?? "Screen"));
  return [
    ...imports,
    imports.length ? "" : "",
    "interface FeatureScreenProps {",
    "  state?: string;",
    "}",
    "",
    `export function ${componentName}({ state = "default" }: FeatureScreenProps) {`,
    "  return (",
    `    <section data-archetype-feature-screen="${file.screen_id}" data-feature-module="${file.feature_module ?? ""}" className="archetype-feature-screen">`,
    "      <header className=\"archetype-page-header\">",
    `        <span className="archetype-eyebrow">${file.route}</span>`,
    `        <h1>${String(file.screen_id ?? "Screen").replace(/[._-]/g, " ")}</h1>`,
    "      </header>",
    "      <section data-archetype-state={state} className=\"archetype-state-panel\" role=\"status\" aria-live=\"polite\">",
    "        <span className=\"archetype-eyebrow\">state</span>",
    "        <strong>{state.replace(/[_-]/g, \" \")}</strong>",
    "      </section>",
    "      <div className=\"archetype-composition\">",
    ...patternCalls,
    ...componentCalls,
    "      </div>",
    "    </section>",
    "  );",
    "}"
  ].join("\n");
}

function dataAdapterSource(outputDir: string): string {
  const operations = readJson<{ queries?: Array<{ query_id?: string }>; mutations?: Array<{ mutation_id?: string }> }>(path.join(outputDir, "06-frontend-agent-contract", "data-operation-contracts.json"));
  const queryMethods = (operations.queries ?? []).map((query) => {
    const name = String(query.query_id ?? "query").replace(/[^a-zA-Z0-9_]/g, "_");
    return [
      `    async ${name}() {`,
      "      return { state: \"empty\" as const, data: [], meta: { total: 0, refreshedAt: new Date().toISOString() } };",
      "    }"
    ].join("\n");
  });
  const mutationMethods = (operations.mutations ?? []).map((mutation) => {
    const name = String(mutation.mutation_id ?? "mutation").replace(/[^a-zA-Z0-9_]/g, "_");
    return [
      `    async ${name}() {`,
      "      return { ok: true, state: \"success_confirmation\" as const };",
      "    }"
    ].join("\n");
  });
  return [
    "import type { ArchetypeDataAdapter } from \"./adapter-interfaces\";",
    "",
    "export function createFixtureDataAdapter(): ArchetypeDataAdapter {",
    "  return {",
    [...queryMethods, ...mutationMethods].join(",\n"),
    "  };",
    "}"
  ].join("\n");
}

function authAdapterSource(outputDir: string): string {
  const permissionMatrix = readJson<{ permissions?: Array<Record<string, unknown>> }>(path.join(outputDir, "02-product-model", "permission-matrix.json"));
  const firstRole = permissionMatrix.permissions?.[0] ?? {};
  const roleId = String(firstRole.role_id ?? "authorized_user");
  const permissions = Object.entries(firstRole)
    .filter(([, value]) => value === true)
    .map(([key]) => key);
  return [
    "import type { ArchetypeAuthAdapter } from \"../api/adapter-interfaces\";",
    "",
    "export function createFixtureAuthAdapter(): ArchetypeAuthAdapter {",
    "  return {",
    "    async getSession() {",
    `      return { user: { id: "fixture_user", role_id: "${roleId}" }, permissions: ${JSON.stringify(permissions)}, auth_state: "authenticated" };`,
    "    },",
    "    async can(permission: string) {",
    `      return ${JSON.stringify(permissions)}.includes(permission);`,
    "    }",
    "  };",
    "}"
  ].join("\n");
}

function copyContractSource(outputDir: string): string {
  const production = readJson<{ content_brand?: { copy_surfaces?: unknown[] } }>(path.join(outputDir, "06-frontend-agent-contract", "production-integration-contracts.json"));
  return `export const copySurfaces = ${JSON.stringify(production.content_brand?.copy_surfaces ?? [], null, 2)} as const;`;
}

function styleSource(outputDir: string): string {
  const css = readFileSync(path.join(outputDir, "04-design-system", "tokens", "css-variables.css"), "utf8");
  const type = readFileSync(path.join(outputDir, "04-design-system", "tokens", "typography.css"), "utf8");
  return [
    css,
    type,
    "",
    ".archetype-screen { padding: var(--space-6, 24px); color: var(--color-text-primary, #17202a); }",
    ".archetype-page-header { margin-bottom: var(--space-5, 20px); }",
    ".archetype-state-panel { border: 1px dashed var(--color-border-subtle, #d8dee8); border-radius: var(--radius-md, 8px); padding: var(--space-3, 12px); margin: var(--space-3, 12px) 0; }",
    ".archetype-surface, .archetype-pattern { border: 1px solid var(--color-border-subtle, #d8dee8); border-radius: var(--radius-md, 8px); padding: var(--space-4, 16px); margin: var(--space-3, 12px) 0; background: var(--color-surface, #f8fafc); }",
    ".archetype-eyebrow { display: block; font-size: 12px; color: var(--color-text-muted, #566270); margin-bottom: 4px; }"
  ].join("\n");
}

function sourceForFile(outputDir: string, file: SourceManifestFile, routeMap: { routes?: Array<Record<string, unknown>> }, adapterInterfaces: string, targetKind: SourceTargetKind): string {
  if (file.path === "package.json") return packageJson(targetKind);
  if (file.path === "tsconfig.json") return tsconfigJson(targetKind);
  if (file.path === "next.config.mjs") return nextConfigSource();
  if (file.path === "vite.config.ts") return viteConfigSource();
  if (file.path === "index.html") return indexHtmlSource();
  if (file.path === "next-env.d.ts") return "/// <reference types=\"next\" />\n/// <reference types=\"next/image-types/global\" />";
  if (file.path === "src/vite-env.d.ts") return "/// <reference types=\"vite/client\" />";
  if (file.path === "src/main.tsx") return mainSource();
  if (file.path === "src/App.tsx") return appSource(routeMap);
  if (file.path === "playwright.config.ts") return readFileSync(path.join(outputDir, "verification", "playwright.config.ts"), "utf8");
  if (file.path === "src/app/layout.tsx") {
    return [
      "import type { ReactNode } from \"react\";",
      "import \"./globals.css\";",
      "",
      "export default function RootLayout({ children }: { children: ReactNode }) {",
      "  return (",
      "    <html lang=\"en\">",
      "      <body>{children}</body>",
      "    </html>",
      "  );",
      "}"
    ].join("\n");
  }
  if (file.path === "src/app/globals.css" || file.path === "src/index.css" || file.path === "src/design-system/tokens.css") return styleSource(outputDir);
  if (file.path === "src/shared/api/adapter-interfaces.ts") return adapterInterfaces;
  if (file.path === "src/shared/api/data-adapter.ts") return dataAdapterSource(outputDir);
  if (file.path === "src/shared/auth/auth-adapter.ts") return authAdapterSource(outputDir);
  if (file.path === "src/shared/content/copy-contract.ts") return copyContractSource(outputDir);
  if (file.path === "tailwind.config.ts") return readFileSync(path.join(outputDir, "04-design-system", "tokens", "tailwind.config.ts"), "utf8");
  if (file.kind === "component") return componentSource(String(file.component ?? "Component"), file.path.split("/").pop()?.replace(".tsx", "") ?? "component");
  if (file.kind === "pattern") return patternSource(String(file.pattern ?? "Pattern"), file.path.split("/").pop()?.replace(".tsx", "") ?? "pattern");
  if (file.kind === "screen") return screenSource(file, routeMap);
  if (file.kind === "route") return targetKind === "vite_react_router" ? viteRouteSource(file) : nextRouteSource(file);
  if (file.kind === "playwright_verification") return readFileSync(path.join(outputDir, "verification", "playwright-verification.spec.ts"), "utf8");
  if (file.kind === "playwright_traceability") {
    return readFileSync(path.join(outputDir, "test-first", "playwright-contract.spec.ts"), "utf8");
  }
  if (file.kind === "test_first_traceability") {
    return readFileSync(path.join(outputDir, "test-first", "vitest-contract.spec.ts"), "utf8");
  }
  if (file.kind === "test") {
    if (file.suite_id === "route_smoke") return readFileSync(path.join(outputDir, "verification", "playwright-verification.spec.ts"), "utf8");
    if (file.suite_id === "user_flows_e2e" || file.suite_id === "screen_state_ui" || file.suite_id === "accessibility_ui") {
      return readFileSync(path.join(outputDir, "test-first", "playwright-contract.spec.ts"), "utf8");
    }
    if (file.suite_id === "contract_integration" || file.suite_id === "component_unit") {
      return readFileSync(path.join(outputDir, "test-first", "vitest-contract.spec.ts"), "utf8");
    }
    return [
      `// Verification suite: ${file.suite_id ?? "unknown"}`,
      "// Create this test before product UI implementation.",
      "// Derive assertions from test-first/test-first-contract.json first.",
      "// Implement assertions from 06-frontend-agent-contract/verification-contracts.json.",
      "export {};"
    ].join("\n");
  }
  return "export {};";
}

export function writeTargetFrontendSource(outputDir: string, targetDir: string, options: TargetWriteOptions = {}): TargetWriteResult {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const manifestPath = path.join(outputDir, "12-target-frontend", "source-file-manifest.json");
  const topManifestPath = path.join(outputDir, "manifest.json");
  const routeMapPath = path.join(outputDir, "12-target-frontend", "route-component-map.json");
  const adapterPath = path.join(outputDir, "12-target-frontend", "adapter-interfaces.ts");
  if (!existsSync(topManifestPath)) blockers.push("Missing manifest.json.");
  if (existsSync(topManifestPath)) {
    const topManifest = readJson<{ implementationAuthorized?: boolean; contractApproval?: { status?: string } }>(topManifestPath);
    if (topManifest.implementationAuthorized !== true) {
      blockers.push(`Implementation is not authorized. Contract approval status: ${topManifest.contractApproval?.status ?? "unknown"}.`);
    }
  }
  if (!existsSync(manifestPath)) blockers.push("Missing 12-target-frontend/source-file-manifest.json.");
  if (!existsSync(routeMapPath)) blockers.push("Missing 12-target-frontend/route-component-map.json.");
  if (!existsSync(adapterPath)) blockers.push("Missing 12-target-frontend/adapter-interfaces.ts.");
  if (existsSync(targetDir) && !options.force) blockers.push("Target directory already exists. Pass --force to replace it.");
  if (options.force) {
    try {
      prepareGeneratedTargetDirectory(targetDir, { force: true });
    } catch (error) {
      blockers.push(error instanceof Error ? error.message : String(error));
    }
  }
  if (blockers.length > 0) return { status: "fail", outputDir, targetDir, filesWritten: 0, blockers, warnings, files: [] };

  if (!options.force) prepareGeneratedTargetDirectory(targetDir, { force: false });

  const manifest = readJson<SourceManifest>(manifestPath);
  const routeMap = readJson<{ routes?: Array<Record<string, unknown>> }>(routeMapPath);
  const adapterInterfaces = readFileSync(adapterPath, "utf8");
  const targetKind = targetKindFromManifest(manifest);
  const files = manifest.files ?? [];
  const written: string[] = [];
  for (const file of files) {
    writeText(targetDir, file.path, sourceForFile(outputDir, file, routeMap, adapterInterfaces, targetKind));
    written.push(file.path);
  }

  warnings.push("Generated target source uses fixture adapters until production backend and auth mappings are confirmed.");
  return {
    status: "pass",
    outputDir,
    targetDir,
    filesWritten: written.length,
    blockers,
    warnings,
    files: written
  };
}
