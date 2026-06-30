#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { execFileSync } = require("node:child_process");

const args = new Set(process.argv.slice(2));
const intervalArg = process.argv.find((arg) => arg.startsWith("--interval-seconds="));
const cooldownArg = process.argv.find((arg) => arg.startsWith("--cooldown-ms="));
const intervalSeconds = intervalArg ? Number(intervalArg.slice("--interval-seconds=".length)) : 300;
const cooldownMs = cooldownArg ? Number(cooldownArg.slice("--cooldown-ms=".length)) : 20 * 60 * 1000;
const label = process.env.BEAI_DOCTOR_WAKE_GUARD_LABEL || "ai.beai.doctor.wake-guard";
const home = os.homedir();
const launchAgentsDir = path.join(home, "Library", "LaunchAgents");
const reportsDir = path.join(home, ".openclaw", "reports", "beai-doctor");
const plistPath = path.join(launchAgentsDir, `${label}.plist`);
const doctorScript = path.join(__dirname, "beai-doctor.js");
const nodePath = process.execPath;
const nodeDir = path.dirname(nodePath);
const uid = process.getuid ? process.getuid() : null;
const guiTarget = uid === null ? null : `gui/${uid}`;

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function run(command, commandArgs) {
  try {
    const output = execFileSync(command, commandArgs, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { ok: true, output: output.trim() };
  } catch (error) {
    return {
      ok: false,
      output: String(error.stdout || "").trim(),
      error: String(error.stderr || error.message || "").trim()
    };
  }
}

function plist() {
  const stdout = path.join(reportsDir, "wake-guard.log");
  const stderr = path.join(reportsDir, "wake-guard.err.log");
  const programArgs = [
    nodePath,
    doctorScript,
    "--mode=wake-guard",
    "--self-heal",
    `--cooldown-ms=${cooldownMs}`,
    "--json"
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${xmlEscape(label)}</string>
  <key>ProgramArguments</key>
  <array>
${programArgs.map((arg) => `    <string>${xmlEscape(arg)}</string>`).join("\n")}
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>StartInterval</key>
  <integer>${Math.max(60, Math.floor(intervalSeconds))}</integer>
  <key>StandardOutPath</key>
  <string>${xmlEscape(stdout)}</string>
  <key>StandardErrorPath</key>
  <string>${xmlEscape(stderr)}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>${xmlEscape([path.join(home, ".local", "bin"), nodeDir, "/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin", "/usr/sbin", "/sbin"].join(":"))}</string>
  </dict>
</dict>
</plist>
`;
}

function status() {
  if (!guiTarget) return { ok: false, error: "launchctl gui target unavailable" };
  return run("launchctl", ["print", `${guiTarget}/${label}`]);
}

function uninstall() {
  const result = { label, plistPath, bootout: null, removed: false };
  if (guiTarget) {
    result.bootout = run("launchctl", ["bootout", guiTarget, plistPath]);
  }
  if (fs.existsSync(plistPath)) {
    fs.unlinkSync(plistPath);
    result.removed = true;
  }
  return result;
}

function install() {
  fs.mkdirSync(launchAgentsDir, { recursive: true });
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(plistPath, plist());
  const result = {
    label,
    plistPath,
    doctorScript,
    intervalSeconds: Math.max(60, Math.floor(intervalSeconds)),
    cooldownMs,
    bootout: null,
    bootstrap: null,
    kickstart: null,
    status: null
  };
  if (guiTarget) {
    result.bootout = run("launchctl", ["bootout", guiTarget, plistPath]);
    result.bootstrap = run("launchctl", ["bootstrap", guiTarget, plistPath]);
    result.kickstart = run("launchctl", ["kickstart", "-k", `${guiTarget}/${label}`]);
    result.status = status();
  }
  return result;
}

function main() {
  if (!fs.existsSync(doctorScript)) {
    throw new Error(`BEAI Doctor script not found: ${doctorScript}`);
  }
  let result;
  if (args.has("--print")) {
    result = { label, plistPath, doctorScript, intervalSeconds, cooldownMs, plist: plist() };
  } else if (args.has("--uninstall")) {
    result = uninstall();
  } else if (args.has("--status")) {
    result = { label, plistPath, status: status() };
  } else {
    result = install();
  }
  console.log(JSON.stringify(result, null, 2));
}

main();
