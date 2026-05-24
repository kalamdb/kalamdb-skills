#!/usr/bin/env node

import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const canonicalSkillDir = path.join(repoRoot, "skills", "kalamdb");
const generatedRoot = path.join(repoRoot, "generated");

const targets = [
  path.join(generatedRoot, "agents", "skills", "kalamdb"),
  path.join(generatedRoot, "claude", "skills", "kalamdb"),
  path.join(generatedRoot, "opencode", "skills", "kalamdb")
];

for (const target of targets) {
  await rm(target, { force: true, recursive: true });
  await mkdir(path.dirname(target), { recursive: true });
  await cp(canonicalSkillDir, target, { recursive: true });
  console.log(`generated ${path.relative(repoRoot, target)}`);
}