import fs from 'node:fs';
import path from 'node:path';
import { PlanError } from './errors.js';

export const SORT_MODES = ['name', 'natural', 'mtime', 'size'];

const natural = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
const plain = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// Put files in the order they should be numbered. Without a mode the order
// given on the command line is kept. `stat` is injectable for tests.
export function sortFiles(files, mode, { stat = fs.statSync, reverse = false } = {}) {
  const sorted = files.slice();
  if (mode === 'name') {
    sorted.sort(plain);
  } else if (mode === 'natural') {
    sorted.sort((a, b) => natural.compare(path.dirname(a), path.dirname(b)) || natural.compare(path.basename(a), path.basename(b)) || plain(a, b));
  } else if (mode === 'mtime' || mode === 'size') {
    const field = mode === 'mtime' ? 'mtimeMs' : 'size';
    const values = new Map();
    for (const file of files) {
      try {
        values.set(file, stat(file)[field]);
      } catch (err) {
        throw new PlanError(`cannot read ${file} to sort it by ${mode} (${err.code ?? err.message})`);
      }
    }
    sorted.sort((a, b) => values.get(a) - values.get(b) || plain(a, b));
  } else if (mode !== undefined) {
    throw new PlanError(`unknown sort order: ${mode}`);
  }
  if (reverse) sorted.reverse();
  return sorted;
}
