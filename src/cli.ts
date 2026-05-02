import { readFileSync } from "node:fs";
import path from "node:path";
import { runArchetypeCompiler } from "./core/pipeline";
import { exportPackage } from "./output/exportPackage";
import { validateExportedPackage } from "./quality/validatePackage";
import type { ArchetypeInput } from "./core/types";

function usage(): never {
  console.log("Usage:");
  console.log("  archetype generate --input <intake.json> --out <output-dir>");
  console.log("  archetype validate --out <output-dir>");
  process.exit(1);
}

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function main(): Promise<void> {
  const command = process.argv[2];
  if (command !== "generate" && command !== "validate") usage();

  if (command === "validate") {
    const outDir = getArg("--out");
    if (!outDir) usage();
    const result = validateExportedPackage(path.resolve(outDir));
    console.log(JSON.stringify(result, null, 2));
    if (result.status === "fail") process.exit(1);
    return;
  }

  const inputPath = getArg("--input");
  const outDir = getArg("--out");
  if (!inputPath || !outDir) usage();

  const absoluteInput = path.resolve(inputPath);
  const absoluteOut = path.resolve(outDir);
  const input = JSON.parse(readFileSync(absoluteInput, "utf8")) as ArchetypeInput;
  const compiled = runArchetypeCompiler(input, {
    sourcePath: absoluteInput,
    outputDir: absoluteOut
  });

  exportPackage(compiled, absoluteOut);

  console.log(`Archetype package generated: ${absoluteOut}`);
  console.log(`Readiness score: ${compiled.quality.readiness.score}`);
  console.log(`Ready for frontend agent: ${compiled.quality.readiness.readyForFrontendAgent}`);
  if (compiled.quality.readiness.blockers.length > 0) {
    console.log("Blockers:");
    for (const blocker of compiled.quality.readiness.blockers) console.log(`- ${blocker}`);
  }
  if (compiled.quality.readiness.warnings.length > 0) {
    console.log("Warnings:");
    for (const warning of compiled.quality.readiness.warnings) console.log(`- ${warning}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
