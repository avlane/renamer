import { CASE_MODES } from './transform.js';

export class UsageError extends Error {}

export const USAGE = `usage: renamer [options] <file>...

Options:
  -f, --find TEXT     text to replace in the file names
  -w, --with TEXT     what to replace it with (default: nothing)
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
  const opts = { files: [], dryRun: false, regex: false, caseMode: undefined, find: undefined, replacement: undefined, flags: undefined, help: false };
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
    else if (arg === '-h' || arg === '--help') opts.help = true;
    else if (arg.startsWith('--') && CASE_MODES.includes(arg.slice(2))) {
      if (opts.caseMode !== undefined) throw new UsageError('only one of --lower, --upper, --title and --slug can be used');
      opts.caseMode = arg.slice(2);
    } else if (arg.startsWith('-') && arg !== '-') throw new UsageError(`unknown option: ${arg}`);
    else opts.files.push(arg);
  }
  return opts;
}
