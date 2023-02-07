import { parseArgs } from 'node:util';
import { SORT_MODES } from './sort.js';
import { CASE_MODES } from './transform.js';

export class UsageError extends Error {}

export const USAGE = `usage: renamer [options] <file>...

Options:
  -f, --find TEXT     text to replace in the file names
  -w, --with TEXT     what to replace it with (default: nothing)
  -t, --template TPL  build names from parts, e.g. '{n:3}_{name|slug}{ext}'
      --start N       first value of {n} (default: 1)
      --step N        increment of {n} (default: 1; negative: --step=-1)
  -e, --regex         treat --find as a regular expression ($1, $<name>)
      --flags FLAGS   regular expression flags (default: g)
      --ext EXT       set the extension (--ext "" removes it)
      --lower         lower-case the names
      --upper         upper-case the names
      --title         Title Case The Names
      --slug          make-names-like-this
      --sort MODE     order files before numbering: name, natural, mtime, size
      --reverse       reverse that order
  -R, --recursive     rename the files inside the folders given
      --include GLOB  only files matching GLOB (repeatable)
      --exclude GLOB  skip files matching GLOB (repeatable)
      --force         replace files that already exist (never folders)
      --undo          put back the files renamed by the last run
      --utc           {mtime} in UTC instead of local time
      --preset NAME   start from a preset in .renamerrc.json
      --json          print the plan as JSON
  -n, --dry-run       show what would happen, change nothing
  -h, --help          show this help
`;

export const OPTIONS = {
  find: { type: 'string', short: 'f' },
  with: { type: 'string', short: 'w' },
  template: { type: 'string', short: 't' },
  start: { type: 'string' },
  step: { type: 'string' },
  regex: { type: 'boolean', short: 'e' },
  flags: { type: 'string' },
  ext: { type: 'string' },
  lower: { type: 'boolean' },
  upper: { type: 'boolean' },
  title: { type: 'boolean' },
  slug: { type: 'boolean' },
  utc: { type: 'boolean' },
  preset: { type: 'string' },
  json: { type: 'boolean' },
  force: { type: 'boolean' },
  undo: { type: 'boolean' },
  sort: { type: 'string' },
  reverse: { type: 'boolean' },
  recursive: { type: 'boolean', short: 'R' },
  include: { type: 'string', multiple: true },
  exclude: { type: 'string', multiple: true },
  'dry-run': { type: 'boolean', short: 'n' },
  help: { type: 'boolean', short: 'h' }
};

function wholeNumber(value, name) {
  if (value === undefined) return undefined;
  if (!/^-?\d+$/.test(value)) throw new UsageError(`--${name} needs a whole number`);
  return Number(value);
}

// `lookup(name)` returns the options of a preset (see presets.js). Options on the
// command line win over the preset's.
export function readArgs(argv, { preset: lookup } = {}) {
  let parsed;
  try {
    parsed = parseArgs({ args: argv, options: OPTIONS, allowPositionals: true });
  } catch (err) {
    if (typeof err.code === 'string' && err.code.startsWith('ERR_PARSE_ARGS_')) throw new UsageError(err.message);
    throw err;
  }
  let v = parsed.values;
  if (v.preset !== undefined) {
    if (lookup === undefined) throw new UsageError('--preset is not available here');
    const fromPreset = lookup(v.preset);
    if (CASE_MODES.some(mode => v[mode])) {
      for (const mode of CASE_MODES) delete fromPreset[mode];
    }
    v = { ...fromPreset, ...v };
  }
  const modes = CASE_MODES.filter(mode => v[mode]);
  if (modes.length > 1) throw new UsageError('only one of --lower, --upper, --title and --slug can be used');
  if (v.sort !== undefined && !SORT_MODES.includes(v.sort)) {
    throw new UsageError(`--sort must be one of ${SORT_MODES.join(', ')}`);
  }
  return {
    files: parsed.positionals,
    find: v.find,
    replacement: v.with,
    template: v.template,
    start: wholeNumber(v.start, 'start'),
    step: wholeNumber(v.step, 'step'),
    regex: v.regex ?? false,
    flags: v.flags,
    ext: v.ext,
    caseMode: modes[0],
    sort: v.sort,
    reverse: v.reverse ?? false,
    json: v.json ?? false,
    force: v.force ?? false,
    undo: v.undo ?? false,
    utc: v.utc ?? false,
    recursive: v.recursive ?? false,
    include: v.include ?? [],
    exclude: v.exclude ?? [],
    dryRun: v['dry-run'] ?? false,
    help: v.help ?? false
  };
}
