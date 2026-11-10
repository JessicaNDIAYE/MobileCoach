/**
 * Styles d'apparence (Épuré, Damier, Gribouillis, Topo, Spirale), leurs coloris,
 * et le calcul des palettes claire / sombre.
 *
 * Règle de lisibilité : le texte et les icônes ne sont jamais posés sur un motif,
 * seulement sur des surfaces unies (cartes, plaques). Les couleurs de texte et d'accent
 * sont ajustées automatiquement pour respecter les contrastes WCAG
 * (vérifié par scripts/check-themes.ts).
 */
import { contrast, ensureContrast, mix, readableOn } from './color';

export type ThemeMode = 'light' | 'dark';
export type ModeSetting = ThemeMode | 'system';
export type StyleId = 'epure' | 'damier' | 'gribouillis' | 'topo' | 'spirale';

export type Variant = {
  id: string;
  name: string;
  /** Fond en mode clair. */
  bg: string;
  /** Couleurs du motif en mode clair (la première sert aussi d'accent). */
  colors: string[];
};

export type StyleDef = { id: StyleId; name: string; description: string; variants: Variant[] };

export const STYLES: StyleDef[] = [
  {
    id: 'epure',
    name: 'Épuré',
    description: 'Un fond uni, tout en douceur',
    variants: [
      { id: 'sauge', name: 'Sauge', bg: '#D6DED9', colors: ['#2E3D35'] },
      { id: 'sable', name: 'Sable', bg: '#ECE4D6', colors: ['#6B4E2E'] },
      { id: 'lavande', name: 'Lavande', bg: '#E2DEF2', colors: ['#4B3F8F'] },
      { id: 'ciel', name: 'Ciel', bg: '#D9E6F2', colors: ['#2D5A86'] },
      { id: 'rose', name: 'Rose', bg: '#F3E1E5', colors: ['#8C3A52'] },
    ],
  },
  {
    id: 'damier',
    name: 'Damier',
    description: 'Des carreaux pop et colorés',
    variants: [
      { id: 'citron-lilas', name: 'Citron lilas', bg: '#CDB8EE', colors: ['#F2F77A', '#CDB8EE'] },
      { id: 'fraise-ciel', name: 'Fraise ciel', bg: '#BDE8FA', colors: ['#FF5C6E', '#BDE8FA'] },
      { id: 'peche', name: 'Pêche', bg: '#FFEEF0', colors: ['#F0C8BB', '#FFEEF0'] },
      { id: 'matcha', name: 'Matcha', bg: '#D7EDBB', colors: ['#62A36F', '#D7EDBB'] },
      { id: 'abricot', name: 'Abricot', bg: '#D7EDBB', colors: ['#FF8B5E', '#D7EDBB'] },
      { id: 'bonbon', name: 'Bonbon', bg: '#BDE8FA', colors: ['#FF66B8', '#BDE8FA'] },
      { id: 'noir-blanc', name: 'Noir et blanc', bg: '#FFFFFF', colors: ['#151515', '#FFFFFF'] },
      { id: 'bleuet', name: 'Bleuet', bg: '#BDE8FA', colors: ['#5B72E0', '#BDE8FA'] },
    ],
  },
  {
    id: 'gribouillis',
    name: 'Gribouillis',
    description: 'De grands traits libres',
    variants: [
      { id: 'ciel-vert', name: 'Ciel et vert', bg: '#99B7F5', colors: ['#267F53'] },
      { id: 'vert-rose', name: 'Vert et rose', bg: '#267F53', colors: ['#F296BD'] },
      { id: 'orange-jaune', name: 'Orange et jaune', bg: '#F5793B', colors: ['#FCCA59'] },
      { id: 'rose-orange', name: 'Rose et orange', bg: '#F296BD', colors: ['#F5793B'] },
      { id: 'jaune-ciel', name: 'Jaune et ciel', bg: '#FCCA59', colors: ['#99B7F5'] },
    ],
  },
  {
    id: 'topo',
    name: 'Topo',
    description: 'Des lignes comme une carte de randonnée',
    variants: [
      { id: 'brique', name: 'Brique', bg: '#F7F5EE', colors: ['#D9532B'] },
      { id: 'foret', name: 'Forêt', bg: '#F2F4EE', colors: ['#267F53'] },
      { id: 'encre', name: 'Encre', bg: '#F3F4F8', colors: ['#2D4BA0'] },
      { id: 'prune', name: 'Prune', bg: '#F6F1F4', colors: ['#7A3E6E'] },
    ],
  },
  {
    id: 'spirale',
    name: 'Spirale',
    description: 'Des spirales hypnotiques',
    variants: [
      { id: 'rouge', name: 'Rouge', bg: '#FFFFFF', colors: ['#E8282B'] },
      { id: 'bleu', name: 'Bleu', bg: '#FFFFFF', colors: ['#2F5BEA'] },
      { id: 'vert', name: 'Vert', bg: '#FFFFFF', colors: ['#1F8A4C'] },
      { id: 'noir', name: 'Noir', bg: '#FFFFFF', colors: ['#151515'] },
    ],
  },
];

export type Palette = {
  mode: ThemeMode;
  /** true si le fond porte un motif : le texte hors carte est alors posé sur une plaque unie. */
  patterned: boolean;
  /** true si les cartes se distinguent mal du fond : elles reçoivent un contour. */
  outlined: boolean;
  bg: string;
  pattern: string[];
  card: string;
  soft: string;
  line: string;
  ink: string;
  inkSoft: string;
  muted: string;
  onInk: string;
  forest: string;
  onForest: string;
  track: string;
  butter: string;
  onButter: string;
  clay: string;
  clayLight: string;
  rust: string;
};

const NIGHT = '#0F100F';

const NEUTRALS = {
  light: {
    card: '#FFFFFF',
    soft: '#EEF1EF',
    line: '#E2E6E3',
    ink: '#151816',
    inkSoft: '#56605A',
    muted: '#737D77',
    onInk: '#FFFFFF',
    track: '#E6E4DE',
    clay: '#954A30',
    clayLight: '#F6E5DD',
    rust: '#9C3B2E',
  },
  dark: {
    card: '#1C1E1D',
    soft: '#2A2D2B',
    line: '#333734',
    ink: '#F1EFE9',
    inkSoft: '#B4BBB6',
    muted: '#8E9690',
    onInk: '#141615',
    track: '#3A3E3B',
    clay: '#EFA488',
    clayLight: '#3B2A23',
    rust: '#F28B7B',
  },
};

export function findStyle(styleId: StyleId): StyleDef {
  return STYLES.find((st) => st.id === styleId) ?? STYLES[0];
}

export function findVariant(styleId: StyleId, variantId: string): Variant {
  const st = findStyle(styleId);
  return st.variants.find((v) => v.id === variantId) ?? st.variants[0];
}

/** Construit la palette complète d'un style + coloris + mode. */
export function buildPalette(styleId: StyleId, variantId: string, mode: ThemeMode): Palette {
  const v = findVariant(styleId, variantId);
  const n = NEUTRALS[mode];
  const dark = mode === 'dark';

  const bg = dark ? mix(v.bg, NIGHT, 0.86) : v.bg;
  const pattern = dark ? v.colors.map((c) => mix(c, NIGHT, 0.55)) : v.colors;

  // Accent (jauges, succès, calendrier) : la couleur la plus marquée du coloris,
  // ajustée pour rester visible sur les cartes (contraste ≥ 3:1).
  const candidates = [...v.colors, v.bg];
  const strongest = candidates.reduce((best, c) => (contrast(c, n.card) > contrast(best, n.card) ? c : best));
  let forest = ensureContrast(strongest, n.card, 3.2, dark ? '#FFFFFF' : '#000000');
  // Le texte posé sur l'accent (calendrier, avatars) doit aussi rester lisible (≥ 4,5:1).
  if (Math.max(contrast('#111111', forest), contrast('#FFFFFF', forest)) < 4.5) {
    forest = dark ? ensureContrast(forest, '#111111', 4.5, '#FFFFFF') : ensureContrast(forest, '#FFFFFF', 4.5, '#000000');
  }
  const onForest = readableOn(forest, '#111111', '#FFFFFF');

  // Accent doux (bouton chaleureux), texte toujours en encre lisible dessus.
  const butter = dark ? mix(forest, n.card, 0.62) : mix(forest, '#FFFFFF', 0.72);
  const onButter = ensureContrast(n.ink, butter, 4.5, dark ? '#FFFFFF' : '#000000');

  return {
    mode,
    patterned: styleId !== 'epure',
    outlined: contrast(n.card, bg) < 1.2,
    bg,
    pattern,
    ...n,
    // Sur un fond uni, le texte est posé directement sur le fond : on garantit le contraste.
    ink: styleId === 'epure' ? ensureContrast(n.ink, bg, 7, dark ? '#FFFFFF' : '#000000') : n.ink,
    forest,
    onForest,
    butter,
    onButter,
  };
}

export const DEFAULT_APPEARANCE = { style: 'epure' as StyleId, variant: 'sauge', mode: 'system' as ModeSetting };
export type Appearance = typeof DEFAULT_APPEARANCE;
