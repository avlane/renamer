import path from 'node:path';

// 'photo.jpg' -> { stem: 'photo', ext: '.jpg' }; dotfiles have no extension.
export function splitName(base) {
  const ext = path.extname(base);
  return { stem: ext === '' ? base : base.slice(0, -ext.length), ext };
}
