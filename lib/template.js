import { slugify } from './transform.js';

import { formatDate } from './date.js';

const TOKENS = ['name', 'ext', 'base', 'parent', 'n', 'mtime'];
const MODIFIERS = {
  lower: text => text.toLowerCase(),
  upper: text => text.toUpperCase(),
  title: text => text.toLowerCase().replace(/(^|[\s_-])(\p{L})/gu, (m, sep, letter) => sep + letter.toUpperCase()),
  slug: slugify
};

const PIECE = /\{\{|\}\}|\{([a-z]+)(?::([^|}]*))?(?:\|([a-z]+))?\}|[{}]/g;

export class TemplateError extends Error {}

// Compile a template into a function of { stem, ext, base, parent, n, mtime, utc }.
// The returned function has a `uses` property: the set of fields the template needs.
export function compileTemplate(source) {
  const pieces = [];
  let last = 0;
  for (const match of source.matchAll(PIECE)) {
    if (match.index > last) pieces.push({ text: source.slice(last, match.index) });
    last = match.index + match[0].length;
    const [whole, token, argument, modifier] = match;
    if (whole === '{{') pieces.push({ text: '{' });
    else if (whole === '}}') pieces.push({ text: '}' });
    else if (token === undefined) throw new TemplateError(`unbalanced brace in template: ${source}`);
    else {
      if (!TOKENS.includes(token)) throw new TemplateError(`unknown template field {${token}} (use ${TOKENS.map(t => `{${t}}`).join(', ')})`);
      if (argument !== undefined && token !== 'n' && token !== 'mtime') {
        throw new TemplateError(`{${token}} does not take an argument`);
      }
      if (token === 'n' && argument !== undefined && !/^\d+$/.test(argument)) {
        throw new TemplateError(`{n:${argument}} needs a width such as {n:3}`);
      }
      if (token === 'mtime' && argument === '') throw new TemplateError('{mtime:} needs a date format');
      if (modifier !== undefined && !(modifier in MODIFIERS)) {
        throw new TemplateError(`unknown modifier |${modifier} (use ${Object.keys(MODIFIERS).join(', ')})`);
      }
      if (modifier !== undefined && token === 'n') throw new TemplateError('{n} cannot have a modifier');
      pieces.push({ token, width: token === 'n' && argument !== undefined ? Number(argument) : 0, format: argument, modifier });
    }
  }
  if (last < source.length) pieces.push({ text: source.slice(last) });

  const render = context => pieces.map(piece => {
    if (piece.text !== undefined) return piece.text;
    let value;
    if (piece.token === 'n') value = String(context.n).padStart(piece.width, '0');
    else if (piece.token === 'mtime') value = formatDate(context.mtime, piece.format ?? 'YYYY-MM-DD', context.utc);
    else value = String(piece.token === 'name' ? context.stem : context[piece.token]);
    return piece.modifier === undefined ? value : MODIFIERS[piece.modifier](value);
  }).join('');
  render.uses = new Set(pieces.filter(piece => piece.token !== undefined).map(piece => piece.token));
  return render;
}
