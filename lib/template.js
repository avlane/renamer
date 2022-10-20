import { slugify } from './transform.js';

const TOKENS = ['name', 'ext', 'base', 'parent', 'n'];
const MODIFIERS = {
  lower: text => text.toLowerCase(),
  upper: text => text.toUpperCase(),
  title: text => text.toLowerCase().replace(/(^|[\s_-])(\p{L})/gu, (m, sep, letter) => sep + letter.toUpperCase()),
  slug: slugify
};

const PIECE = /\{\{|\}\}|\{([a-z]+)(?::(\d+))?(?:\|([a-z]+))?\}|[{}]/g;

export class TemplateError extends Error {}

// Compile a template into a function of { stem, ext, base, parent, n }.
export function compileTemplate(source) {
  const pieces = [];
  let last = 0;
  for (const match of source.matchAll(PIECE)) {
    if (match.index > last) pieces.push({ text: source.slice(last, match.index) });
    last = match.index + match[0].length;
    const [whole, token, width, modifier] = match;
    if (whole === '{{') pieces.push({ text: '{' });
    else if (whole === '}}') pieces.push({ text: '}' });
    else if (token === undefined) throw new TemplateError(`unbalanced brace in template: ${source}`);
    else {
      if (!TOKENS.includes(token)) throw new TemplateError(`unknown template field {${token}} (use ${TOKENS.map(t => `{${t}}`).join(', ')})`);
      if (width !== undefined && token !== 'n') throw new TemplateError(`{${token}} does not take a width`);
      if (modifier !== undefined && !(modifier in MODIFIERS)) {
        throw new TemplateError(`unknown modifier |${modifier} (use ${Object.keys(MODIFIERS).join(', ')})`);
      }
      if (modifier !== undefined && token === 'n') throw new TemplateError('{n} cannot have a modifier');
      pieces.push({ token, width: width === undefined ? 0 : Number(width), modifier });
    }
  }
  if (last < source.length) pieces.push({ text: source.slice(last) });

  return context => pieces.map(piece => {
    if (piece.text !== undefined) return piece.text;
    const value = piece.token === 'n'
      ? String(context.n).padStart(piece.width, '0')
      : String(piece.token === 'name' ? context.stem : context[piece.token]);
    return piece.modifier === undefined ? value : MODIFIERS[piece.modifier](value);
  }).join('');
}
