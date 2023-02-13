const CODES = { dim: 2, red: 31, green: 32, bold: 1 };

// Colour helpers for one run. `force` is true for --color, false for
// --no-color, and undefined to decide from the terminal and the environment.
export function makeStyle({ isTTY = false, env = {}, force } = {}) {
  const enabled = force ?? (isTTY && (env.NO_COLOR === undefined || env.NO_COLOR === '') && env.TERM !== 'dumb');
  const style = {};
  for (const [name, code] of Object.entries(CODES)) {
    style[name] = text => (enabled ? `\u001b[${code}m${text}\u001b[0m` : text);
  }
  return style;
}
