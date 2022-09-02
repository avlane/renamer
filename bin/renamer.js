#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const [find, replacement, ...files] = process.argv.slice(2);
if (find === undefined || replacement === undefined || files.length === 0) {
  console.error('usage: renamer <find> <replacement> <file>...');
  process.exit(1);
}

for (const file of files) {
  const dir = path.dirname(file);
  const base = path.basename(file);
  const renamed = base.replaceAll(find, replacement);
  if (renamed === base) continue;
  fs.renameSync(file, path.join(dir, renamed));
  console.log(`${file} -> ${path.join(dir, renamed)}`);
}
