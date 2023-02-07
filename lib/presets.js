import fs from 'node:fs';
import path from 'node:path';
import { OPTIONS, UsageError } from './args.js';

export const RC_NAME = '.renamerrc.json';

// Options that make no sense inside a preset.
const NOT_IN_PRESETS = new Set(['help', 'undo', 'preset', 'dry-run', 'json']);

// Check one preset from the config file and return its options in the shape
// util.parseArgs produces (numbers become strings, a single string becomes a list
// for repeatable options).
export function validatePreset(name, preset) {
  if (preset === null || typeof preset !== 'object' || Array.isArray(preset)) {
    throw new UsageError(`preset "${name}" must be an object`);
  }
  const values = {};
  for (const [key, value] of Object.entries(preset)) {
    const option = Object.hasOwn(OPTIONS, key) ? OPTIONS[key] : undefined;
    if (option === undefined || NOT_IN_PRESETS.has(key)) throw new UsageError(`preset "${name}": unknown option "${key}"`);
    if (option.type === 'boolean') {
      if (typeof value !== 'boolean') throw new UsageError(`preset "${name}": "${key}" must be true or false`);
      values[key] = value;
    } else if (option.multiple) {
      const list = [].concat(value);
      if (!list.every(item => typeof item === 'string')) throw new UsageError(`preset "${name}": "${key}" must be a string or a list of strings`);
      values[key] = list;
    } else {
      const numeric = key === 'start' || key === 'step';
      const valid = numeric
        ? (typeof value === 'number' || typeof value === 'string') && /^-?\d+$/.test(String(value))
        : typeof value === 'string';
      if (!valid) throw new UsageError(`preset "${name}": "${key}" must be ${numeric ? 'a whole number' : 'a string'}`);
      values[key] = String(value);
    }
  }
  return values;
}

// Read a preset from .renamerrc.json in dir.
export function loadPreset(dir, name) {
  let text;
  try {
    text = fs.readFileSync(path.join(dir, RC_NAME), 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') throw new UsageError(`--preset ${name}: there is no ${RC_NAME} in ${dir}`);
    throw err;
  }
  let config;
  try {
    config = JSON.parse(text);
  } catch {
    throw new UsageError(`${RC_NAME} is not valid JSON`);
  }
  const presets = config !== null && typeof config === 'object' && config.presets !== null && typeof config.presets === 'object' ? config.presets : {};
  if (!Object.hasOwn(presets, name)) {
    const known = Object.keys(presets);
    throw new UsageError(`${RC_NAME} has no preset called "${name}"${known.length > 0 ? ` (it has: ${known.join(', ')})` : ''}`);
  }
  return validatePreset(name, presets[name]);
}
