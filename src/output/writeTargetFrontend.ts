import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

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
  component?: string;
  pattern?: string;
  suite_id?: string;
  required_states?: string[];
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

function packageJson(): string {
  return JSON.stringify({
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
      typecheck: "tsc --noEmit"
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
      "tailwindcss": "4.2.4",
      "typescript": "5.9.3"
    },
    overrides: {
      "postcss": "8.5.10"
    }
  }, null, 2);
}

function tsconfigJson(): string {
  return JSON.stringify({
    compilerOptions: {
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
      incremental: true,
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

function routeSource(file: SourceManifestFile, routeMap: { routes?: Array<Record<string, unknown>> }): string {
  const route = routeMap.routes?.find((item) => item.screen_id === file.screen_id);
  const components = ((route?.components as Array<{ name?: string; file?: string }> | undefined) ?? []).slice(0, 8);
  const patterns = ((route?.patterns as Array<{ name?: string; file?: string }> | undefined) ?? []).slice(0, 8);
  const imports = [
    ...components.map((component) => `import { ${safeIdentifier(String(component.name ?? "Component"), "ArchetypeComponent")} } from "${relativeImport(file.path, String(component.file ?? ""))}";`),
    ...patterns.map((pattern) => `import { ${safeIdentifier(String(pattern.name ?? "Pattern"), "ArchetypePattern")} } from "${relativeImport(file.path, String(pattern.file ?? ""))}";`)
  ];
  const componentCalls = components.map((component) => `      <${safeIdentifier(String(component.name ?? "Component"), "ArchetypeComponent")} />`);
  const patternCalls = patterns.map((pattern) => `      <${safeIdentifier(String(pattern.name ?? "Pattern"), "ArchetypePattern")} />`);
  return [
    ...imports,
    imports.length ? "" : "",
    "export default function ArchetypeRoute() {",
    "  return (",
    `    <main data-archetype-screen="${file.screen_id}" data-state="default" data-route="${file.route}" className="archetype-screen">`,
    "      <header className=\"archetype-page-header\">",
    `        <span className="archetype-eyebrow">${file.route}</span>`,
    `        <h1>${String(file.screen_id ?? "Screen").replace(/[._-]/g, " ")}</h1>`,
    "      </header>",
    ...patternCalls,
    ...componentCalls,
    "    </main>",
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
    "import type { ArchetypeAuthAdapter } from \"./adapter-interfaces\";",
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
    ".archetype-surface, .archetype-pattern { border: 1px solid var(--color-border-subtle, #d8dee8); border-radius: var(--radius-md, 8px); padding: var(--space-4, 16px); margin: var(--space-3, 12px) 0; background: var(--color-surface, #f8fafc); }",
    ".archetype-eyebrow { display: block; font-size: 12px; color: var(--color-text-muted, #566270); margin-bottom: 4px; }"
  ].join("\n");
}

function sourceForFile(outputDir: string, file: SourceManifestFile, routeMap: { routes?: Array<Record<string, unknown>> }, adapterInterfaces: string): string {
  if (file.path === "package.json") return packageJson();
  if (file.path === "tsconfig.json") return tsconfigJson();
  if (file.path === "next.config.mjs") return nextConfigSource();
  if (file.path === "next-env.d.ts") return "/// <reference types=\"next\" />\n/// <reference types=\"next/image-types/global\" />";
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
  if (file.path === "src/app/globals.css" || file.path === "src/styles/archetype/tokens.css") return styleSource(outputDir);
  if (file.path === "src/lib/archetype/adapter-interfaces.ts") return adapterInterfaces;
  if (file.path === "src/lib/archetype/data-adapter.ts") return dataAdapterSource(outputDir);
  if (file.path === "src/lib/archetype/auth-adapter.ts") return authAdapterSource(outputDir);
  if (file.path === "src/lib/archetype/copy-contract.ts") return copyContractSource(outputDir);
  if (file.path === "tailwind.config.ts") return readFileSync(path.join(outputDir, "04-design-system", "tokens", "tailwind.config.ts"), "utf8");
  if (file.kind === "component") return componentSource(String(file.component ?? "Component"), file.path.split("/").pop()?.replace(".tsx", "") ?? "component");
  if (file.kind === "pattern") return patternSource(String(file.pattern ?? "Pattern"), file.path.split("/").pop()?.replace(".tsx", "") ?? "pattern");
  if (file.kind === "route") return routeSource(file, routeMap);
  if (file.kind === "test") {
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
  const routeMapPath = path.join(outputDir, "12-target-frontend", "route-component-map.json");
  const adapterPath = path.join(outputDir, "12-target-frontend", "adapter-interfaces.ts");
  if (!existsSync(manifestPath)) blockers.push("Missing 12-target-frontend/source-file-manifest.json.");
  if (!existsSync(routeMapPath)) blockers.push("Missing 12-target-frontend/route-component-map.json.");
  if (!existsSync(adapterPath)) blockers.push("Missing 12-target-frontend/adapter-interfaces.ts.");
  if (existsSync(targetDir) && !options.force) blockers.push("Target directory already exists. Pass --force to replace it.");
  if (blockers.length > 0) return { status: "fail", outputDir, targetDir, filesWritten: 0, blockers, warnings, files: [] };

  if (options.force) rmSync(targetDir, { recursive: true, force: true });
  mkdirSync(targetDir, { recursive: true });

  const manifest = readJson<{ files?: SourceManifestFile[] }>(manifestPath);
  const routeMap = readJson<{ routes?: Array<Record<string, unknown>> }>(routeMapPath);
  const adapterInterfaces = readFileSync(adapterPath, "utf8");
  const files = manifest.files ?? [];
  const written: string[] = [];
  for (const file of files) {
    writeText(targetDir, file.path, sourceForFile(outputDir, file, routeMap, adapterInterfaces));
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
