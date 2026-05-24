#!/usr/bin/env node

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const canonicalSkillDir = path.join(repoRoot, "skills", "kalamdb");
const generatedDirs = [
  path.join(repoRoot, "generated", "agents", "skills", "kalamdb"),
  path.join(repoRoot, "generated", "claude", "skills", "kalamdb"),
  path.join(repoRoot, "generated", "opencode", "skills", "kalamdb")
];

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) {
    throw new Error("missing YAML frontmatter");
  }
  const fields = new Map();
  for (const line of match[1].split("\n")) {
    const index = line.indexOf(":");
    if (index === -1) {
      continue;
    }
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (key && value) {
      fields.set(key, value.replace(/^"|"$/g, ""));
    }
  }
  return fields;
}

async function listFiles(rootDir, currentDir = rootDir) {
  const entries = await readdir(currentDir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(rootDir, entryPath));
    } else {
      files.push(path.relative(rootDir, entryPath));
    }
  }
  return files.sort();
}

async function verifyCanonical() {
  const expectedFiles = [
    "SKILL.md",
    "manifest.json",
    path.join("agents", "openai.yaml"),
    path.join("examples", "agent-change-checklist.md"),
    path.join("examples", "cli-workflows.md"),
    path.join("examples", "dart-sdk.md"),
    path.join("examples", "pg-extension.md"),
    path.join("examples", "server-configuration.toml"),
    path.join("examples", "sql-patterns.md"),
    path.join("examples", "typescript-client.md"),
    path.join("examples", "typescript-consumer.md"),
    path.join("examples", "typescript-orm.md"),
    path.join("references", "architecture.md"),
    path.join("references", "operations.md"),
    path.join("references", "server-configuration.md"),
    path.join("references", "cli.md"),
    path.join("references", "auth.md"),
    path.join("references", "performance.md"),
    path.join("references", "typescript-client-sdk.md"),
    path.join("references", "typescript-orm.md"),
    path.join("references", "typescript-consumer.md"),
    path.join("references", "dart-sdk.md"),
    path.join("references", "pg-extension.md"),
    path.join("references", "sql-syntax.md"),
    path.join("references", "api-websocket.md"),
    path.join("references", "integrations.md"),
    path.join("references", "testing.md"),
    path.join("references", "troubleshooting.md")
  ];

  for (const relativePath of expectedFiles) {
    await stat(path.join(canonicalSkillDir, relativePath));
  }

  const skillContent = await readFile(path.join(canonicalSkillDir, "SKILL.md"), "utf8");
  const frontmatter = parseFrontmatter(skillContent);

  if (frontmatter.get("name") !== "kalamdb") {
    throw new Error("canonical skill name must be kalamdb");
  }
  if (!frontmatter.get("description")) {
    throw new Error("canonical skill description is required");
  }
}

async function verifyGenerated() {
  const canonicalFiles = await listFiles(canonicalSkillDir);

  for (const dir of generatedDirs) {
    await stat(dir);
    const generatedFiles = await listFiles(dir);
    const missing = canonicalFiles.filter((file) => !generatedFiles.includes(file));
    if (missing.length > 0) {
      throw new Error(`generated target ${dir} is missing files: ${missing.join(", ")}`);
    }
  }
}

try {
  await verifyCanonical();
  await verifyGenerated();
  console.log("verified canonical skill and generated targets");
} catch (error) {
  console.error(error.message);
  process.exit(1);
}