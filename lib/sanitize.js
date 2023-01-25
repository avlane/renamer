const INVALID = /[<>:"/\\|?*\u0000-\u001f]/g;
const RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;

// Make a generated file name safe to create on Windows, macOS and Linux.
export function sanitizeName(name) {
  let clean = name.replace(INVALID, '_').replace(/[. ]+$/, '');
  if (RESERVED.test(clean)) clean = `_${clean}`;
  return clean;
}
