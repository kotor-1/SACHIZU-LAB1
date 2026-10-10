/** What a number box (Sprint10Lab's NumberField) shows and uses for the text typed: full-width digits (a Japanese
 * keyboard) as digits and a comma as the decimal point (some regions' keypads); one decimal point at most, where a whole
 * number stops (50.5 was taken as 505); no leading zeros. The value is kept within min-max; past the largest the box
 * shows what is used (it showed 1000 while 100 was used), below the smallest it keeps the typing (a 1 on the way to 10).
 * `value` null: nothing to use yet (empty, or a lone point). */
export function numberInput(raw: string, min: number, max: number, whole: boolean): { text: string; value: number | null } {
  const digits = raw.normalize('NFKC').replace(/,/g, '.').replace(/[^\d.]/g, ''), dot = digits.indexOf('.');
  const t = (dot < 0 ? digits : whole ? digits.slice(0, dot) : digits.slice(0, dot + 1) + digits.slice(dot + 1).replace(/\./g, '')).replace(/^0+(?=\d)/, '');
  const v = Number(t);
  if (t === '' || t === '.' || !Number.isFinite(v)) return { text: t, value: null };
  const used = Math.max(min, Math.min(max, whole ? Math.round(v) : v));
  return { text: v > max ? String(used) : t, value: used };
}
