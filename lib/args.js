import { CASE_MODES } from './transform.js';

export class UsageError extends Error {}

function wholeNumber(value, name) {
  if (!/^-?\d+$/.test(value)) throw new UsageError(`${name} needs a whole number`);
  return Number(value);
}

export const USAGE = `usage: renamer [options] <file>...

Options:
  -f, --find TEXT     text to replace in the file names
  -w, --with TEXT     what to replace it with (default: nothing)
  -t, --template TPL  build names from parts, e.g. '{n:3}_{name|slug}{ext}'
      --start N       first value of {n} (default: 1)
      --step N        increment of {n} (default: 1)
  -e, --regex         treat --find as a regular expression ($1, $<name>)
      --flags FLAGS   regular expression flags (default: g)
      --lower         lower-case the names
      --upper         upper-case the names
      --title         Title Case The Names
      --slug          make-names-like-this
  -n, --dry-run       show what would happen, change nothing
  -h, --help          show this help
`;

export function readArgs(argv) {
  const opts = { files: [], dryRun: false, regex: false, caseMode: undefined, template: undefined, find: undefined, replacement: undefined, flags: undefined, help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const take = () => {
      if (i + 1 >= argv.length) throw new UsageError(`${arg} needs a value`);
      return argv[++i];
    };
    if (arg === '-n' || arg === '--dry-run') opts.dryRun = true;
    else if (arg === '-e' || arg === '--regex') opts.regex = true;
    else if (arg === '-f' || arg === '--find') opts.find = take();
    else if (arg === '-w' || arg === '--with') opts.replacement = take();
    else if (arg === '--flags') opts.flags = take();
    else if (arg === '-t' || arg === '--template') opts.template = take();
    else if (arg === '--start') opts.start = wholeNumber(take(), arg);
    else if (arg === '--step') opts.step = wholeNumber(take(), arg);
    else if (arg === '-h' || arg === '--help') opts.help = true;
    else if (arg.startsWith('--') && CASE_MODES.includes(arg.slice(2))) {
      if (opts.caseMode !== undefined) throw new UsageError('only one of --lower, --upper, --title and --slug can be used');
      opts.caseMode = arg.slice(2);
    } else if (arg.startsWith('-') && arg !== '-') throw new UsageError(`unknown option: ${arg}`);
    else opts.files.push(arg);
  }
  return opts;
}
