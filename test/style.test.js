import test from 'node:test';
import assert from 'node:assert/strict';
import { makeStyle } from '../lib/style.js';

test('makeStyle is plain by default', () => {
  assert.equal(makeStyle().green('x'), 'x');
  assert.equal(makeStyle({ isTTY: false, env: {} }).dim('x'), 'x');
});

test('makeStyle colours a terminal', () => {
  const style = makeStyle({ isTTY: true, env: { TERM: 'xterm-256color' } });
  assert.equal(style.green('ok'), '\u001b[32mok\u001b[0m');
  assert.equal(style.dim('ok'), '\u001b[2mok\u001b[0m');
  assert.equal(style.red('ok'), '\u001b[31mok\u001b[0m');
  assert.equal(style.bold('ok'), '\u001b[1mok\u001b[0m');
});

test('makeStyle respects NO_COLOR and TERM=dumb', () => {
  assert.equal(makeStyle({ isTTY: true, env: { NO_COLOR: '1' } }).green('x'), 'x');
  assert.equal(makeStyle({ isTTY: true, env: { NO_COLOR: '' } }).green('x'), '\u001b[32mx\u001b[0m');
  assert.equal(makeStyle({ isTTY: true, env: { TERM: 'dumb' } }).green('x'), 'x');
});

test('makeStyle force beats everything else', () => {
  assert.equal(makeStyle({ isTTY: false, force: true }).green('x'), '\u001b[32mx\u001b[0m');
  assert.equal(makeStyle({ isTTY: true, env: {}, force: false }).green('x'), 'x');
});
