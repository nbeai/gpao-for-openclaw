#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PRODUCT = "GPAO for OpenClaw";
const VERSION = "0.1.0";
const RUNTIME_VERSION = "0.6.22";
const COPYRIGHT = "Copyright (c) 2026 Park Jongyoon / 윤 (@aigis0927). All rights reserved.";

function dateStamp() {
  return new Date().toISOString().slice(0, 10).replaceAll("-", "");
}

function sha256(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function shouldCopy(relativePath) {
  const ignoredTopLevel = new Set([
    ".git",
    ".beai-harness",
    "node_modules",
    "packages",
    "patches",
    "proposals",
    "reports",
    ".DS_Store"
  ]);
  const first = relativePath.split(path.sep)[0];
  if (ignoredTopLevel.has(first)) return false;
  const parts = relativePath.split(path.sep);
  if (parts.includes("node_modules")) return false;
  if (parts.includes(".git")) return false;
  if (parts.includes(".beai-harness")) return false;
  return true;
}

function copyTree(source, target, base = source) {
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const relativePath = path.relative(base, sourcePath);
    if (!shouldCopy(relativePath)) continue;
    const targetPath = path.join(target, relativePath);
    if (entry.isDirectory()) {
      fs.mkdirSync(targetPath, { recursive: true });
      copyTree(sourcePath, target, base);
    } else if (entry.isFile()) {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function main() {
  const root = path.resolve(new URL("..", import.meta.url).pathname);
  const packageName = `gpao-for-openclaw-v${VERSION}-runtime-v${RUNTIME_VERSION}-${dateStamp()}`;
  const packageDir = path.join(root, "packages");
  const stagingRoot = fs.mkdtempSync(path.join(os.tmpdir(), "gpao-release-"));
  const stagingPackage = path.join(stagingRoot, "gpao-for-openclaw");
  const zipPath = path.join(packageDir, `${packageName}.zip`);
  const checksumPath = `${zipPath}.sha256`;
  const manifestPath = path.join(packageDir, `${packageName}.manifest.json`);

  fs.mkdirSync(packageDir, { recursive: true });
  fs.rmSync(zipPath, { force: true });
  fs.rmSync(checksumPath, { force: true });
  fs.rmSync(manifestPath, { force: true });
  fs.mkdirSync(stagingPackage, { recursive: true });
  copyTree(root, stagingPackage);

  execFileSync("zip", ["-r", zipPath, "gpao-for-openclaw"], {
    cwd: stagingRoot,
    stdio: "inherit"
  });

  const digest = sha256(zipPath);
  fs.writeFileSync(checksumPath, `${digest}  ${path.basename(zipPath)}\n`, "utf8");
  fs.writeFileSync(manifestPath, `${JSON.stringify({
    schema: "gpao.openclaw.release_archive.v0_1",
    product: PRODUCT,
    version: VERSION,
    runtimeVersion: RUNTIME_VERSION,
    archive: zipPath,
    sha256: digest,
    generatedAt: new Date().toISOString(),
    copyright: COPYRIGHT,
    status: "production-ready local release archive",
    includes: [
      "BEAI Runtime component",
      "BEAI Capability Pack component",
      "Context Mesh documents and interfaces",
      "Knowledge Loop tools and review-first flow",
      "clean install backup/migration installer",
      "verification and release evidence"
    ],
    boundaries: [
      "archive creation does not restart Gateway",
      "archive creation does not send Telegram messages",
      "archive creation does not create cron jobs",
      "archive creation does not publish external accounts",
      "archive creation does not promote durable memory"
    ]
  }, null, 2)}\n`, "utf8");

  fs.rmSync(stagingRoot, { recursive: true, force: true });
  process.stdout.write(JSON.stringify({ zipPath, checksumPath, manifestPath, sha256: digest }, null, 2));
  process.stdout.write("\n");
}

main();
