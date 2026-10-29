#!/usr/bin/env node
// Claude Code PostToolUse hook (Edit|Write): format, lint-fix and enforce the 1000-line limit.
// Written in Node instead of bash + jq so it works the same on Windows, macOS, Linux and in Docker.
// Exit code 2 sends the stderr message back to Claude so it splits the file.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_LINES = 1000;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PRETTIER = path.join(ROOT, 'node_modules', 'prettier', 'bin', 'prettier.cjs');
const APPS = ['backend', 'frontend'];

const LINT_EXT = new Set(['.ts', '.tsx', '.js', '.jsx']);
const CODE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const FORMAT_EXT = new Set([...CODE_EXT, '.json', '.md', '.css', '.yml', '.yaml']);

function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function run(script, args, cwd) {
  if (!existsSync(script)) return;
  try {
    execFileSync(process.execPath, [script, ...args], { cwd, stdio: 'ignore' });
  } catch {
    // Formatting/lint failures must not block the edit; lint errors surface in `npm run lint`.
  }
}

let filePath = '';
try {
  filePath = JSON.parse(readStdin())?.tool_input?.file_path ?? '';
} catch {
  process.exit(0);
}

if (!filePath || !existsSync(filePath)) process.exit(0);

const relative = path.relative(ROOT, filePath);
// Skip files outside the repo (path.relative returns an absolute path across Windows drives)
const outsideRepo = relative.startsWith('..') || path.isAbsolute(relative);
if (outsideRepo || relative.split(path.sep).includes('node_modules')) process.exit(0);

const ext = path.extname(filePath).toLowerCase();
const app = APPS.find((name) => relative.split(path.sep)[0] === name);

if (FORMAT_EXT.has(ext)) run(PRETTIER, ['--write', '--log-level', 'silent', filePath], ROOT);
if (app && LINT_EXT.has(ext)) {
  const appDir = path.join(ROOT, app);
  const eslint = path.join(appDir, 'node_modules', 'eslint', 'bin', 'eslint.js');
  run(eslint, ['--fix', '--no-warn-ignored', filePath], appDir);
}

if (CODE_EXT.has(ext)) {
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n').length - (content.endsWith('\n') ? 1 : 0);
  if (lines > MAX_LINES) {
    process.stderr.write(
      `${relative} has ${lines} lines (max ${MAX_LINES}). Split it into smaller files.\n`,
    );
    process.exit(2);
  }
}

process.exit(0);
