#!/usr/bin/env node

import { cp, mkdir, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

function usage() {
  console.log(`Usage:
  node scripts/install.mjs install --tool <codex|agents|copilot|claude|opencode> --scope <project|user> [--path <dir>] [--force]
  node scripts/install.mjs uninstall --tool <codex|agents|copilot|claude|opencode> --scope <project|user> [--path <dir>] [--force]
  node scripts/install.mjs version
  node scripts/install.mjs doctor`);
}

function parseArgs(argv) {
  const args = [...argv];
  let command = "install";

  if (args[0] && !args[0].startsWith("--")) {
    command = args.shift();
  }

  const options = { force: false };

  while (args.length > 0) {
    const flag = args.shift();
    switch (flag) {
      case "--tool":
        options.tool = args.shift();
        break;
      case "--scope":
        options.scope = args.shift();
        break;
      case "--path":
        options.path = args.shift();
        break;
      case "--force":
        options.force = true;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      default:
        throw new Error(`unknown flag or argument: ${flag}`);
    }
  }

  return { command, options };
}

function normalizeTool(tool) {
  switch (tool) {
    case "codex":
      return "codex";
    case "agents":
    case "universal":
      return "agents";
    case "copilot":
    case "github-copilot":
      return "agents";
    case "claude":
    case "claude-code":
      return "claude";
    case "opencode":
      return "opencode";
    default:
      throw new Error(`unsupported tool: ${tool}`);
  }
}

function generatedSource(tool) {
  if (tool === "codex") {
    return path.join(repoRoot, "generated", "agents", "skills", "kalamdb");
  }
  return path.join(repoRoot, "generated", tool, "skills", "kalamdb");
}

function projectRelativeDestination(tool) {
  switch (tool) {
    case "agents":
    case "codex":
      return path.join(".agents", "skills", "kalamdb");
    case "claude":
      return path.join(".claude", "skills", "kalamdb");
    case "opencode":
      return path.join(".opencode", "skills", "kalamdb");
    default:
      throw new Error(`unsupported tool: ${tool}`);
  }
}

function userDestination(tool) {
  const home = os.homedir();
  switch (tool) {
    case "agents":
      return path.join(home, ".agents", "skills", "kalamdb");
    case "codex":
      return path.join(home, ".codex", "skills", "kalamdb");
    case "claude":
      return path.join(home, ".claude", "skills", "kalamdb");
    case "opencode":
      return path.join(home, ".config", "opencode", "skills", "kalamdb");
    default:
      throw new Error(`unsupported tool: ${tool}`);
  }
}

function resolveDestination(tool, scope, targetPath) {
  if (scope === "user") {
    return userDestination(tool);
  }

  if (scope !== "project") {
    throw new Error(`unsupported scope: ${scope}`);
  }

  const basePath = targetPath ? path.resolve(targetPath) : process.cwd();
  if (basePath === repoRoot) {
    throw new Error("project installs should target the repo you want to enrich, not the kalamdb-skills repo itself; pass --path");
  }
  return path.join(basePath, projectRelativeDestination(tool));
}

async function ensureBuilt(tool) {
  try {
    await stat(generatedSource(tool));
  } catch {
    const result = spawnSync(process.execPath, [path.join(repoRoot, "scripts", "build-targets.mjs")], {
      stdio: "inherit"
    });
    if (result.status !== 0) {
      throw new Error("failed to build generated targets");
    }
  }
}

async function installSkill(tool, scope, targetPath, force) {
  await ensureBuilt(tool);
  const source = generatedSource(tool);
  const destination = resolveDestination(tool, scope, targetPath);

  if (force) {
    await rm(destination, { force: true, recursive: true });
  } else {
    try {
      await stat(destination);
      throw new Error(`destination already exists: ${destination}; rerun with --force to replace it`);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true });

  console.log(`installed KalamDB skill for ${tool} at ${destination}`);
  console.log("verification hint: ask the tool to list available skills or open its skill selector");
}

async function uninstallSkill(tool, scope, targetPath, force) {
  const destination = resolveDestination(tool, scope, targetPath);
  await rm(destination, { force: true, recursive: true });
  console.log(`removed ${destination}`);
  if (!force) {
    console.log("note: uninstall is recursive and idempotent");
  }
}

async function printVersion() {
  const packageJson = JSON.parse(await readFile(path.join(repoRoot, "package.json"), "utf8"));
  const manifest = JSON.parse(await readFile(path.join(repoRoot, "skills", "kalamdb", "manifest.json"), "utf8"));
  console.log(`${packageJson.name} ${packageJson.version}`);
  console.log(`skill ${manifest.name} ${manifest.version}`);
}

async function doctor() {
  const tools = ["agents", "claude", "opencode"];
  console.log(`repo: ${repoRoot}`);
  console.log(`node: ${process.version}`);

  for (const tool of tools) {
    try {
      await stat(generatedSource(tool));
      console.log(`${tool}: generated target present`);
    } catch {
      console.log(`${tool}: generated target missing`);
    }
  }
}

try {
  const { command, options } = parseArgs(process.argv.slice(2));

  if (options.help) {
    usage();
    process.exit(0);
  }

  if (command === "version") {
    await printVersion();
    process.exit(0);
  }

  if (command === "doctor") {
    await doctor();
    process.exit(0);
  }

  if (!options.tool || !options.scope) {
    usage();
    throw new Error("install and uninstall require --tool and --scope");
  }

  const tool = normalizeTool(options.tool);

  if (command === "install") {
    await installSkill(tool, options.scope, options.path, options.force);
    process.exit(0);
  }

  if (command === "uninstall") {
    await uninstallSkill(tool, options.scope, options.path, options.force);
    process.exit(0);
  }

  usage();
  throw new Error(`unsupported command: ${command}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}