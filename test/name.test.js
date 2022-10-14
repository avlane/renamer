import test from 'node:test';
import assert from 'node:assert/strict';
import { splitName } from '../lib/name.js';

test('splitName separates the extension', () => {
  assert.deepEqual(splitName('photo.jpg'), { stem: 'photo', ext: '.jpg' });
  assert.deepEqual(splitName('archive.tar.gz'), { stem: 'archive.tar', ext: '.gz' });
  assert.deepEqual(splitName('README'), { stem: 'README', ext: '' });
});

test('splitName treats dotfiles as having no extension', () => {
  assert.deepEqual(splitName('.gitignore'), { stem: '.gitignore', ext: '' });
});

test('splitName trailing dots', () => {
  assert.deepEqual(splitName('name.'), { stem: 'name', ext: '.' });
});
