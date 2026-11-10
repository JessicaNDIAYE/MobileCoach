/** Couleurs des catégories : tons désaturés, lisibles côte à côte. */
export const palette = ['#2E3D35', '#7D97A8', '#D2B57E', '#B98C78', '#9AAE9F', '#A59BB8', '#C9C3B6'];
/** Mêmes teintes, éclaircies pour rester visibles sur une carte sombre. */
export const paletteDark = ['#8FB39E', '#9DB6C7', '#E0C691', '#D3A592', '#B7CBBC', '#BDB3D6', '#D9D3C6'];

export const radius = { card: 28, field: 18, pill: 999 };

export const type = {
  display: { fontSize: 38, lineHeight: 42, fontWeight: '700' as const, letterSpacing: -1.2 },
  title: { fontSize: 22, lineHeight: 26, fontWeight: '600' as const, letterSpacing: -0.4 },
  number: { fontSize: 44, lineHeight: 48, fontWeight: '700' as const, letterSpacing: -1.5 },
  label: { fontSize: 15, fontWeight: '600' as const, letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 20 },
  small: { fontSize: 13, lineHeight: 17 },
};
