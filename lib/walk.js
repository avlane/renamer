import fs from 'node:fs';
import path from 'node:path';
import { matchesGlob } from './glob.js';

export class WalkError extends Error {}

function wanted(relative, { include = [], exclude = [] }) {
  if (include.length > 0 && !include.some(glob => matchesGlob(glob, relative))) return false;
  return !exclude.some(glob => matchesGlob(glob, relative));
}

// `depth` is 0 for the files directly inside the folder that was named.
function walk(dir, relative, opts, out, depth = 0) {
  const entries = fs.readdirSync(path.join(dir, relative), { withFileTypes: true });
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const entry of entries) {
    if (entry.name.startsWith('.') && !opts.hidden) continue;
    const next = relative === '' ? entry.name : `${relative}/${entry.name}`;
    if (entry.isDirectory()) {
      if (opts.maxDepth === undefined || depth < opts.maxDepth) walk(dir, next, opts, out, depth + 1);
    } else if (wanted(next, opts)) {
      out.push(path.join(dir, next));
    }
  }
}

// Expand the paths from the command line into the list of files to rename.
// Paths that do not exist are passed through so the plan check can report them.
export function collectFiles(inputs, opts = {}) {
  const files = [];
  for (const input of inputs) {
    let stat = null;
    try {
      stat = fs.statSync(input);
    } catch {
      // reported later as "no such file"
    }
    if (stat !== null && stat.isDirectory()) {
      if (!opts.recursive) throw new WalkError(`${input} is a folder (use -R to rename the files inside it)`);
      walk(input, '', opts, files);
    } else if (wanted(path.basename(input), opts)) {
      files.push(input);
    }
  }
  return files;
}
