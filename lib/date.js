const pad = n => String(n).padStart(2, '0');

// Tokens: YYYY YY MM DD HH mm ss. Everything else is copied as it is.
export function formatDate(date, format, utc = false) {
  const parts = utc
    ? { Y: date.getUTCFullYear(), M: date.getUTCMonth() + 1, D: date.getUTCDate(), h: date.getUTCHours(), m: date.getUTCMinutes(), s: date.getUTCSeconds() }
    : { Y: date.getFullYear(), M: date.getMonth() + 1, D: date.getDate(), h: date.getHours(), m: date.getMinutes(), s: date.getSeconds() };
  return format.replace(/YYYY|YY|MM|DD|HH|mm|ss/g, token => {
    switch (token) {
      case 'YYYY': return String(parts.Y).padStart(4, '0');
      case 'YY': return pad(parts.Y % 100);
      case 'MM': return pad(parts.M);
      case 'DD': return pad(parts.D);
      case 'HH': return pad(parts.h);
      case 'mm': return pad(parts.m);
      default: return pad(parts.s);
    }
  });
}
