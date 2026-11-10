// Vérifie la lisibilité de tous les thèmes (WCAG).  Usage : npm run themes:check
import { contrast } from '../src/theme/color';
import { STYLES, buildPalette, type ThemeMode } from '../src/theme/palettes';

type Rule = [label: string, fg: keyof ReturnType<typeof buildPalette>, bg: keyof ReturnType<typeof buildPalette>, min: number];
// Texte : 4,5:1. Grands titres et icônes / éléments graphiques : 3:1.
const RULES: Rule[] = [
  ['texte sur carte', 'ink', 'card', 4.5],
  ['texte secondaire sur carte', 'inkSoft', 'card', 4.5],
  ['texte secondaire sur champ', 'inkSoft', 'soft', 4.5],
  ['texte sur champ', 'ink', 'soft', 4.5],
  ['icônes discrètes sur carte', 'muted', 'card', 3],
  ['texte sur bouton principal', 'onInk', 'ink', 4.5],
  ['jauge / succès sur carte', 'forest', 'card', 3],
  ['texte sur accent', 'onForest', 'forest', 4.5],
  ['texte sur bouton doux', 'onButter', 'butter', 4.5],
  ['alerte sur carte', 'clay', 'card', 4.5],
  ['alerte sur fond d’alerte', 'clay', 'clayLight', 4.5],
  ['erreur sur carte', 'rust', 'card', 4.5],
];

let failures = 0;
let checks = 0;
for (const st of STYLES)
  for (const v of st.variants)
    for (const mode of ['light', 'dark'] as ThemeMode[]) {
      const p = buildPalette(st.id, v.id, mode);
      const rules: Rule[] = [...RULES];
      // Style Épuré : le titre est posé directement sur le fond.
      if (!p.patterned) rules.push(['titre sur fond', 'ink', 'bg', 4.5], ['sous-titre (grand) sur fond', 'inkSoft', 'bg', 3]);
      for (const [label, fg, bg, min] of rules) {
        checks++;
        const c = contrast(p[fg] as string, p[bg] as string);
        if (c < min) {
          failures++;
          console.log(`✗ ${st.name} / ${v.name} / ${mode} : ${label} = ${c.toFixed(2)} (min ${min})  ${p[fg]} sur ${p[bg]}`);
        }
      }
    }
const variants = STYLES.reduce((t, st) => t + st.variants.length, 0);
console.log(`${failures ? '✗' : '✓'} ${checks} contrôles sur ${STYLES.length} styles, ${variants} coloris, 2 modes : ${failures} échec(s)`);
if (failures) process.exit(1);
