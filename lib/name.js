import path from 'node:path';

const COMPOUND = /\.(?:tar\.(?:gz|bz2|xz|zst|lz4)|d\.ts)$/i;

// 'photo.jpg' -> { stem: 'photo', ext: '.jpg' }; dotfiles have no extension
// and a few two-part extensions such as .tar.gz are kept together.
export function splitName(base) {
  const compound = COMPOUND.exec(base);
  if (compound !== null && compound.index > 0) {
    return { stem: base.slice(0, compound.index), ext: compound[0] };
  }
  const ext = path.extname(base);
  return { stem: ext === '' ? base : base.slice(0, -ext.length), ext };
}

// 'jpg' and '.jpg' both mean '.jpg'; '' means no extension.
export function normalizeExt(ext) {
  if (ext === '' || ext.startsWith('.')) return ext;
  return `.${ext}`;
}
