#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const RELEASES_DIR = path.join(ROOT, "local-update-feed", "releases");
const LATEST_YML_PATH = path.join(RELEASES_DIR, "latest.yml");
const EXE_PATTERN = /^OneClaw-Setup-(.+?)-(x64|arm64)\.exe$/i;

function ensureReleaseDir() {
  fs.mkdirSync(RELEASES_DIR, { recursive: true });
}

function listCandidateInstallers() {
  if (!fs.existsSync(RELEASES_DIR)) {
    return [];
  }
  return fs.readdirSync(RELEASES_DIR)
    .map((name) => {
      const match = name.match(EXE_PATTERN);
      if (!match) {
        return null;
      }
      const fullPath = path.join(RELEASES_DIR, name);
      const stat = fs.statSync(fullPath);
      return {
        name,
        fullPath,
        version: match[1],
        arch: match[2].toLowerCase(),
        mtimeMs: stat.mtimeMs,
      };
    })
    .filter(Boolean);
}

function pickTargetVersion(files) {
  if (files.length === 0) {
    throw new Error(
      `未在 ${RELEASES_DIR} 中找到安装包。请先放入 OneClaw-Setup-<version>-x64.exe 或 arm64.exe`,
    );
  }

  const newest = [...files].sort((a, b) => b.mtimeMs - a.mtimeMs)[0];
  return newest.version;
}

function sha512Base64(filePath) {
  const hash = crypto.createHash("sha512");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("base64");
}

function buildYaml(version, files) {
  const lines = [
    `version: ${version}`,
    "files:",
  ];

  for (const file of files) {
    lines.push(`  - url: ${file.name}`);
    lines.push(`    sha512: ${sha512Base64(file.fullPath)}`);
  }

  lines.push(`releaseDate: '${new Date().toISOString()}'`);
  lines.push("");
  return lines.join("\n");
}

function main() {
  ensureReleaseDir();
  const candidates = listCandidateInstallers();
  const version = pickTargetVersion(candidates);
  const targetFiles = candidates
    .filter((file) => file.version === version)
    .sort((a, b) => a.arch.localeCompare(b.arch));

  const yaml = buildYaml(version, targetFiles);
  fs.writeFileSync(LATEST_YML_PATH, yaml, "utf8");

  console.log(`[local-update] 已生成 ${path.relative(ROOT, LATEST_YML_PATH)}`);
  console.log(`[local-update] 版本: ${version}`);
  for (const file of targetFiles) {
    console.log(`[local-update] 包: ${file.name}`);
  }
}

try {
  main();
} catch (error) {
  console.error(`[local-update] 失败: ${error.message}`);
  process.exit(1);
}
