import test from 'node:test';
import assert from 'node:assert/strict';
import { compileTemplate, TemplateError } from '../lib/template.js';

const context = {
  stem: 'My Photo',
  ext: '.JPG',
  base: 'My Photo.JPG',
  parent: 'Holiday 2022',
  n: 7,
  mtime: new Date(Date.UTC(2022, 11, 3, 4, 5, 6)),
  utc: true
};
const render = source => compileTemplate(source)(context);

test('template fields', () => {
  assert.equal(render('{name}'), 'My Photo');
  assert.equal(render('{ext}'), '.JPG');
  assert.equal(render('{base}'), 'My Photo.JPG');
  assert.equal(render('{parent}'), 'Holiday 2022');
  assert.equal(render('{n}'), '7');
});

test('template literal text and braces', () => {
  assert.equal(render('IMG {name} copy{ext}'), 'IMG My Photo copy.JPG');
  assert.equal(render('{{literal}} {n}'), '{literal} 7');
});

test('template counter padding', () => {
  assert.equal(render('{n:3}'), '007');
  assert.equal(render('{n:1}'), '7');
  assert.equal(render('{n:2}_{name}'), '07_My Photo');
});

test('template modifiers', () => {
  assert.equal(render('{name|lower}'), 'my photo');
  assert.equal(render('{name|upper}{ext|lower}'), 'MY PHOTO.jpg');
  assert.equal(render('{parent|slug}/{name|slug}'), 'holiday-2022/my-photo');
  assert.equal(render('{name|title}'), 'My Photo');
});

test('template errors', () => {
  assert.throws(() => compileTemplate('{nmae}'), /unknown template field \{nmae\}/);
  assert.throws(() => compileTemplate('{name|shout}'), /unknown modifier \|shout/);
  assert.throws(() => compileTemplate('{name:3}'), /does not take an argument/);
  assert.throws(() => compileTemplate('{n:x}'), /needs a width such as \{n:3\}/);
  assert.throws(() => compileTemplate('{mtime:}'), /needs a date format/);
  assert.throws(() => compileTemplate('{n|lower}'), /cannot have a modifier/);
  assert.throws(() => compileTemplate('oops {name'), TemplateError);
  assert.throws(() => compileTemplate('oops name}'), /unbalanced/);
});

test('template compiled once can be reused', () => {
  const template = compileTemplate('{n:2}-{name}');
  assert.equal(template({ ...context, n: 1 }), '01-My Photo');
  assert.equal(template({ ...context, n: 12 }), '12-My Photo');
});

test('template mtime', () => {
  assert.equal(render('{mtime}'), '2022-12-03');
  assert.equal(render('{mtime:YYYYMMDD_HHmmss}-{name}{ext}'), '20221203_040506-My Photo.JPG');
  assert.equal(render('{mtime:YY.MM}'), '22.12');
});

test('template reports which fields it uses', () => {
  assert.deepEqual([...compileTemplate('{n}{name}{mtime}').uses].sort(), ['mtime', 'n', 'name']);
  assert.deepEqual([...compileTemplate('plain').uses], []);
});
