#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const packageRoot = path.resolve(new URL("..", import.meta.url).pathname);
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "gpao-openclaw-install-"));
const openclawHome = path.join(tempRoot, "openclaw-home");

fs.mkdirSync(path.join(openclawHome, "plugins", "beai-runtime"), { recursive: true });
fs.writeFileSync(path.join(openclawHome, "plugins", "beai-runtime", "legacy.txt"), "legacy runtime\n");
fs.mkdirSync(path.join(openclawHome, ".beai-package"), { recursive: true });
fs.writeFileSync(path.join(openclawHome, ".beai-package", "legacy.txt"), "legacy package\n");

const dryRun = JSON.parse(execFileSync("node", [
  path.join(packageRoot, "installer", "install-gpao-for-openclaw.mjs"),
  "--package-root", packageRoot,
  "--openclaw-home", openclawHome,
  "--json"
], { encoding: "utf8" }));

assert.equal(dryRun.mode, "dry-run");
assert.equal(dryRun.legacyPaths.length, 2);
assert.equal(fs.existsSync(path.join(openclawHome, "plugins", "beai-runtime", "legacy.txt")), true);

const applied = JSON.parse(execFileSync("node", [
  path.join(packageRoot, "installer", "install-gpao-for-openclaw.mjs"),
  "--package-root", packageRoot,
  "--openclaw-home", openclawHome,
  "--apply",
  "--json"
], { encoding: "utf8" }));

assert.equal(applied.mode, "apply");
assert.equal(applied.backups.length, 2);
assert.equal(fs.existsSync(path.join(openclawHome, "plugins", "beai-runtime", "legacy.txt")), false);
assert.equal(fs.existsSync(path.join(openclawHome, "plugins", "beai-runtime", "package.json")), true);
assert.equal(fs.existsSync(path.join(openclawHome, "gpao-for-openclaw", "capability-pack", "README.md")), true);
assert.equal(fs.existsSync(applied.receiptPath), true);

for (const backup of applied.backups) {
  assert.equal(fs.existsSync(backup.to), true);
}

fs.rmSync(tempRoot, { recursive: true, force: true });
process.stdout.write("install-gpao-for-openclaw.test: pass\n");
