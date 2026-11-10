/** Petites fonctions de couleur (hex #RRGGBB) et contraste WCAG. */

const toRgb = (hex: string) => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};

const toHex = (rgb: number[]) =>
  '#' + rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('').toUpperCase();

/** Mélange `a` vers `b` : t = 0 → a, t = 1 → b. */
export function mix(a: string, b: string, t: number): string {
  const ra = toRgb(a);
  const rb = toRgb(b);
  return toHex(ra.map((v, i) => v + (rb[i] - v) * t));
}

export function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Ratio de contraste WCAG entre deux couleurs (1 à 21). */
export function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Pousse `color` vers `target` jusqu'à atteindre le contraste `min` avec `against`. */
export function ensureContrast(color: string, against: string, min: number, target: string): string {
  let c = color;
  for (let t = 0.08; contrast(c, against) < min && t <= 1; t += 0.08) c = mix(color, target, t);
  return c;
}

/** Noir ou blanc, selon ce qui se lit le mieux sur `bg`. */
export const readableOn = (bg: string, dark = '#151816', light = '#FFFFFF') =>
  contrast(dark, bg) >= contrast(light, bg) ? dark : light;
