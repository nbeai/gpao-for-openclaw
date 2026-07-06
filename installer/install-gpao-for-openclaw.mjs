#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const PRODUCT = "GPAO for OpenClaw";
const COPYRIGHT = "Copyright (c) 2026 Park Jongyoon / 윤 (@aigis0927). All rights reserved.";

const LEGACY_RELATIVE_PATHS = [
  "plugins/beai-runtime",
  "plugins/@nbeai/beai-runtime",
  "plugins/beai-package",
  "plugins/beai-layer",
  "beai-package",
  "beai-layer",
  ".beai-package",
  ".beai-layer"
];

function parseArgs(argv) {
  const options = {
    packageRoot: path.resolve(new URL("..", import.meta.url).pathname),
    openclawHome: process.env.OPENCLAW_HOME || path.join(os.homedir(), ".openclaw"),
    apply: false,
    json: false
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--package-root") options.packageRoot = path.resolve(argv[++index]);
    else if (arg === "--openclaw-home") options.openclawHome = path.resolve(argv[++index]);
    else if (arg === "--apply") options.apply = true;
    else if (arg === "--json") options.json = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
  }
  return options;
}

function usage() {
  return `Usage:
  node installer/install-gpao-for-openclaw.mjs --openclaw-home <dir> [--package-root <dir>] [--apply] [--json]

Installs ${PRODUCT} into an OpenClaw home directory.

Default mode is dry-run. With --apply, legacy BEAI package paths are moved into a timestamped backup before the GPAO runtime component and capability pack are installed.

This installer does not restart Gateway, send Telegram messages, create cron jobs, publish releases, promote durable memory, or edit OpenClaw core files.
`;
}

function safeTimestamp() {
  return new Date().toISOString().replaceAll(":", "").replace(/\..+$/, "Z");
}

function exists(targetPath) {
  try {
    fs.accessSync(targetPath);
    return true;
  } catch {
    return false;
  }
}

function copyDir(source, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, {
    recursive: true,
    force: true,
    errorOnExist: false,
    filter: (entry) => !entry.includes(`${path.sep}node_modules${path.sep}`)
  });
}

function moveToBackup(source, backupRoot, relativePath) {
  const target = path.join(backupRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  try {
    fs.renameSync(source, target);
  } catch (error) {
    if (error && error.code === "EXDEV") {
      copyDir(source, target);
      fs.rmSync(source, { recursive: true, force: true });
      return target;
    }
    throw error;
  }
  return target;
}

function buildPlan(options) {
  const packageRoot = path.resolve(options.packageRoot);
  const openclawHome = path.resolve(options.openclawHome);
  const runtimeSource = path.join(packageRoot, "plugin", "beai-runtime");
  const capabilitySource = path.join(packageRoot, "capability-pack");
  const runtimeTarget = path.join(openclawHome, "plugins", "beai-runtime");
  const capabilityTarget = path.join(openclawHome, "gpao-for-openclaw", "capability-pack");
  const stateRoot = path.join(openclawHome, ".gpao-for-openclaw");

  const requiredSources = [runtimeSource, capabilitySource];
  const missingSources = requiredSources.filter((source) => !exists(source));
  const legacyPaths = LEGACY_RELATIVE_PATHS
    .map((relativePath) => ({
      relativePath,
      absolutePath: path.join(openclawHome, relativePath),
      exists: exists(path.join(openclawHome, relativePath))
    }))
    .filter((item) => item.exists);

  return {
    schema: "gpao.openclaw.clean_install.v0_1",
    product: PRODUCT,
    copyright: COPYRIGHT,
    mode: options.apply ? "apply" : "dry-run",
    packageRoot,
    openclawHome,
    missingSources,
    backupRoot: path.join(openclawHome, "backups", `gpao-migration-${safeTimestamp()}`),
    legacyPaths,
    installTargets: {
      runtime: runtimeTarget,
      capabilityPack: capabilityTarget,
      stateRoot
    },
    boundaries: [
      "no Gateway restart",
      "no Telegram send",
      "no cron or daemon activation",
      "no durable memory promotion",
      "no public release publication",
      "no OpenClaw core edit"
    ]
  };
}

function applyPlan(plan) {
  if (plan.missingSources.length > 0) {
    throw new Error(`Missing package source paths: ${plan.missingSources.join(", ")}`);
  }
  fs.mkdirSync(plan.openclawHome, { recursive: true });
  fs.mkdirSync(plan.backupRoot, { recursive: true });

  const backups = [];
  for (const legacyPath of plan.legacyPaths) {
    const backedUpTo = moveToBackup(legacyPath.absolutePath, plan.backupRoot, legacyPath.relativePath);
    backups.push({ from: legacyPath.absolutePath, to: backedUpTo });
  }

  copyDir(path.join(plan.packageRoot, "plugin", "beai-runtime"), plan.installTargets.runtime);
  copyDir(path.join(plan.packageRoot, "capability-pack"), plan.installTargets.capabilityPack);

  fs.mkdirSync(plan.installTargets.stateRoot, { recursive: true });
  const receipt = {
    ...plan,
    appliedAt: new Date().toISOString(),
    backups,
    installed: [
      plan.installTargets.runtime,
      plan.installTargets.capabilityPack
    ]
  };
  const receiptPath = path.join(plan.installTargets.stateRoot, "install-receipt.json");
  fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  return { ...receipt, receiptPath };
}

function renderText(report) {
  const lines = [];
  lines.push(`${report.product} clean installer`);
  lines.push(`mode: ${report.mode}`);
  lines.push(`openclawHome: ${report.openclawHome}`);
  lines.push(`packageRoot: ${report.packageRoot}`);
  lines.push(`legacy paths to backup: ${report.legacyPaths.length}`);
  for (const item of report.legacyPaths) lines.push(`- ${item.relativePath}`);
  if (report.receiptPath) lines.push(`receipt: ${report.receiptPath}`);
  lines.push("boundaries:");
  for (const boundary of report.boundaries) lines.push(`- ${boundary}`);
  return `${lines.join("\n")}\n`;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  const plan = buildPlan(options);
  const report = options.apply ? applyPlan(plan) : plan;
  process.stdout.write(options.json ? `${JSON.stringify(report, null, 2)}\n` : renderText(report));
}

main();
