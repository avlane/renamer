import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Writable } from 'node:stream';
import { run } from '../lib/cli.js';

// Create a temporary directory holding the given { 'relative/name': 'content' } files.
export function makeDir(files = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'renamer-test-'));
  for (const [name, content] of Object.entries(files)) {
    const file = path.join(dir, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
  return dir;
}

export function removeDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

// Sorted list of the files below dir, as relative paths.
export function listDir(dir, prefix = '') {
  const out = [];
  for (const entry of fs.readdirSync(path.join(dir, prefix), { withFileTypes: true })) {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) out.push(...listDir(dir, relative));
    else out.push(relative);
  }
  return out.sort();
}

class Sink extends Writable {
  constructor() {
    super();
    this.text = '';
  }

  _write(chunk, encoding, callback) {
    this.text += chunk;
    callback();
  }
}

// Run the command in-process: { code, out, err }.
export function runCli(args, extra = {}) {
  const stdout = new Sink();
  const stderr = new Sink();
  const code = run(args, { stdout, stderr, ...extra });
  return { code, out: stdout.text, err: stderr.text };
}
