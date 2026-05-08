import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const tmpDir = path.join(root, "tmp");
const heavyNames = new Set(["node_modules", ".next", "playwright-report", "test-results", ".turbo"]);
const removed = [];

function sizeOf(targetPath) {
  if (!existsSync(targetPath)) return 0;
  const stats = statSync(targetPath);
  if (stats.isFile()) return stats.size;
  if (!stats.isDirectory()) return 0;
  return readdirSync(targetPath).reduce((total, entry) => total + sizeOf(path.join(targetPath, entry)), 0);
}

function walk(directory) {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (!entry.isDirectory()) continue;
    if (heavyNames.has(entry.name)) {
      const bytes = sizeOf(absolutePath);
      rmSync(absolutePath, { recursive: true, force: true });
      removed.push({ path: path.relative(root, absolutePath), bytes });
    } else {
      walk(absolutePath);
    }
  }
}

walk(tmpDir);

const report = {
  status: "pass",
  removed_count: removed.length,
  removed_bytes: removed.reduce((total, item) => total + item.bytes, 0),
  removed
};

console.log(JSON.stringify(report, null, 2));
