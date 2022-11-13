const SPECIAL = /[.+^${}()|\\\]]/g;

// Turn a glob into an anchored regular expression over "/"-separated paths.
export function globToRegExp(glob) {
  let source = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        i++;
        if (glob[i + 1] === '/') {
          i++;
          source += '(?:.*/)?';
        } else {
          source += '.*';
        }
      } else {
        source += '[^/]*';
      }
    } else if (c === '?') {
      source += '[^/]';
    } else if (c === '[') {
      const end = glob.indexOf(']', i + 2);
      if (end === -1) {
        source += '\\[';
      } else {
        source += '[' + glob.slice(i + 1, end).replace(/^!/, '^').replace(/\\/g, '\\\\') + ']';
        i = end;
      }
    } else {
      source += c.replace(SPECIAL, '\\$&');
    }
  }
  return new RegExp(`^${source}$`);
}

// Does the glob match this file? Patterns without a slash look at the file
// name only; others at the whole relative path (always with "/" separators).
export function matchesGlob(glob, relativePath) {
  const target = glob.includes('/') ? relativePath : relativePath.slice(relativePath.lastIndexOf('/') + 1);
  return globToRegExp(glob).test(target);
}
