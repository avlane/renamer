import path from 'node:path';
import { splitName } from './name.js';
import { applyCase } from './transform.js';
import { compileTemplate } from './template.js';

// The function that rewrites one base name, or null when there is no search
// text. With `regex`, find is a regular expression (flags default to "g") and
// the replacement may use $1 / $<name>.
function makeReplacer({ find, replacement = '', regex = false, flags }) {
  if (find === undefined) return null;
  if (find === '') throw new Error('the text to find cannot be empty');
  if (regex) {
    const re = new RegExp(find, flags ?? 'g');
    return name => name.replace(re, replacement);
  }
  return name => name.replaceAll(find, replacement);
}

// For every file, where it would go after the renaming options are applied
// to its name: search and replace first, then the case mode. The directory
// part of the path is left alone.
export function buildPlan(files, options) {
  const replace = makeReplacer(options);
  const template = options.template === undefined ? null : compileTemplate(options.template);
  if (template !== null && replace !== null) throw new Error('use either --template or --find, not both');
  if (replace === null && template === null && options.caseMode === undefined) {
    throw new Error('nothing to do: give --find, --template or one of --lower, --upper, --title, --slug');
  }
  return files.map((from, index) => {
    const base = path.basename(from);
    let name = base;
    if (template !== null) {
      name = template({
        ...splitName(base),
        base,
        parent: path.basename(path.resolve(path.dirname(from))),
        n: (options.start ?? 1) + index * (options.step ?? 1)
      });
    } else if (replace !== null) {
      name = replace(base);
    }
    if (options.caseMode !== undefined) {
      const parts = splitName(name);
      const cased = applyCase(options.caseMode, parts.stem, parts.ext);
      name = cased.stem + cased.ext;
    }
    return { from, to: path.join(path.dirname(from), name), changed: name !== base };
  });
}
