import path from 'node:path';

// For every file, where it would go if `find` were replaced by `replacement`
// in its name. The directory part of the path is left alone.
export function buildPlan(files, { find, replacement = '' }) {
  if (find === undefined || find === '') throw new Error('the text to find cannot be empty');
  return files.map(from => {
    const base = path.basename(from);
    const renamed = base.replaceAll(find, replacement);
    return { from, to: path.join(path.dirname(from), renamed), changed: renamed !== base };
  });
}
