#!/usr/bin/env node
// Generates docs/database.md: a Mermaid ER diagram of the Mongoose models in backend/src/models/.
// Usage: tsx scripts/docs/generate-erd.mjs [--check]
//   --check  exit 1 if docs/database.md is out of date (used in CI)
// Only loads the model files (no database connection). If a model file cannot load on its own (it imports
// config that needs env vars), tell the user instead of changing the backend.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MODELS_DIR = path.join(ROOT, 'backend', 'src', 'models');
const OUTPUT = path.join(ROOT, 'docs', 'database.md');
const MODEL_FILE = /\.model\.(js|ts)$/;

// The backend's own mongoose, so the models register on the same instance we read from
const mongoose = createRequire(path.join(ROOT, 'backend', 'package.json'))('mongoose');

// Sorted so the output does not depend on the file system order
const files = readdirSync(MODELS_DIR, { recursive: true })
  .filter((file) => MODEL_FILE.test(file))
  .sort();
for (const file of files) await import(pathToFileURL(path.join(MODELS_DIR, file)).href);

/** Mermaid attribute names cannot contain dots (nested paths like address.city). */
const attributeName = (schemaPath) => schemaPath.replaceAll('.', '_');

function describeModel(name) {
  const fields = [];
  const relations = [];
  mongoose.model(name).schema.eachPath((schemaPath, type) => {
    if (schemaPath === '__v') return;
    const isArray = type.instance === 'Array';
    // Arrays of references: Mongoose 9 keeps the ref on embeddedSchemaType (older versions: caster)
    const ref =
      type.options?.ref ?? type.embeddedSchemaType?.options?.ref ?? type.caster?.options?.ref;
    const notes = [type.isRequired && 'required', type.options?.unique && 'unique'].filter(Boolean);
    const key = schemaPath === '_id' ? ' PK' : ref ? ' FK' : '';
    const comment = notes.length ? ` "${notes.join(', ')}"` : '';
    fields.push(`    ${type.instance} ${attributeName(schemaPath)}${key}${comment}`);
    if (typeof ref === 'string') {
      relations.push(`  ${ref} ${isArray ? '}o--o{' : '||--o{'} ${name} : "${schemaPath}"`);
    }
  });
  return { block: [`  ${name} {`, ...fields, '  }'].join('\n'), relations };
}

const models = mongoose.modelNames().sort().map(describeModel);
const content = [
  '# Database diagram',
  '',
  '> Generated from `backend/src/models/` by `npm run docs:generate`. Do not edit by hand.',
  '',
  '```mermaid',
  'erDiagram',
  ...models.flatMap((model) => model.relations),
  ...models.map((model) => model.block),
  '```',
  '',
].join('\n');

if (process.argv.includes('--check')) {
  // A Windows checkout may have CRLF line endings (.gitattributes text=auto): compare the text only
  const current = existsSync(OUTPUT) ? readFileSync(OUTPUT, 'utf8').replaceAll('\r\n', '\n') : '';
  if (current !== content) {
    console.error('docs/database.md is out of date. Run `npm run docs:generate`.');
    process.exit(1);
  }
} else {
  writeFileSync(OUTPUT, content);
}
