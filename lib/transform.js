// Words are separated by spaces, underscores and hyphens.
function title(text) {
  return text.replace(/(^|[\s_-])(\p{L})/gu, (match, separator, letter) => separator + letter.toUpperCase());
}

// "My Holiday (2022)!" -> "my-holiday-2022". Accents are removed.
export function slugify(text) {
  return text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

export const CASE_MODES = ['lower', 'upper', 'title', 'slug'];

// Returns the new { stem, ext } for a case mode.
export function applyCase(mode, stem, ext) {
  switch (mode) {
    case 'lower': return { stem: stem.toLowerCase(), ext: ext.toLowerCase() };
    case 'upper': return { stem: stem.toUpperCase(), ext: ext.toUpperCase() };
    case 'title': return { stem: title(stem.toLowerCase()), ext };
    case 'slug': return { stem: slugify(stem), ext: ext.toLowerCase() };
    default: throw new Error(`unknown case mode: ${mode}`);
  }
}
