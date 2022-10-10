import path from 'node:path';

// The function that rewrites one base name. With `regex`, find is a regular
// expression (flags default to "g") and the replacement may use $1 / $<name>.
function makeReplacer({ find, replacement = '', regex = false, flags }) {
  if (find === undefined || find === '') throw new Error('the text to find cannot be empty');
  if (regex) {
    const re = new RegExp(find, flags ?? 'g');
    return name => name.replace(re, replacement);
  }
  return name => name.replaceAll(find, replacement);
}

// For every file, where it would go after the replacement is applied to its
// name. The directory part of the path is left alone.
export function buildPlan(files, options) {
  const replace = makeReplacer(options);
  return files.map(from => {
    const base = path.basename(from);
    const renamed = replace(base);
    return { from, to: path.join(path.dirname(from), renamed), changed: renamed !== base };
  });
}
