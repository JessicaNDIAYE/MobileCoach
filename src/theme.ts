/**
 * Palette sobre : fond sauge, cartes blanches, encre presque noire.
 * Pas de couleurs saturées : les états (alerte, échec) utilisent des tons terre.
 */
export const colors = {
  bg: '#D6DED9', // sauge clair (fond d'écran)
  card: '#FFFFFF',
  soft: '#EEF2EF', // fonds de champs, pilules inactives
  line: '#E4E9E6',
  ink: '#151816', // texte principal, boutons principaux
  inkSoft: '#8E9993', // 2e ligne des titres, textes secondaires
  muted: '#A6AFA9',
  forest: '#2E3D35', // barres de jauge, succès
  track: '#E8E6E0', // barres inactives
  butter: '#F1DDA4', // accent ponctuel (bouton secondaire chaleureux)
  clay: '#C2876E', // alerte douce (80 % du budget, journée ratée)
  clayLight: '#F1E3DC',
  rust: '#9C4A3B', // dépassement
};

/** Couleurs des catégories : tons désaturés, lisibles côte à côte. */
export const palette = ['#2E3D35', '#7D97A8', '#D2B57E', '#B98C78', '#9AAE9F', '#A59BB8', '#C9C3B6'];

export const radius = { card: 28, field: 18, pill: 999 };

export const type = {
  display: { fontSize: 38, lineHeight: 42, fontWeight: '700' as const, letterSpacing: -1.2 },
  title: { fontSize: 22, lineHeight: 26, fontWeight: '600' as const, letterSpacing: -0.4 },
  number: { fontSize: 44, lineHeight: 48, fontWeight: '700' as const, letterSpacing: -1.5 },
  label: { fontSize: 15, fontWeight: '600' as const, letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 20 },
  small: { fontSize: 13, lineHeight: 17 },
};
