import { StyleSheet } from 'react-native';

import type { Palette } from './palettes';
import { radius, type } from './tokens';

/** Feuille de styles partagée, recalculée quand le thème change. */
export function makeStyles(c: Palette) {
  return StyleSheet.create({
    // Fond transparent : le fond (uni ou à motif) est dessiné une seule fois sous toute l'app.
    screen: { flex: 1, backgroundColor: 'transparent' },
    screenContent: { paddingHorizontal: 16, gap: 12 },
    header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    /** Plaque unie sous le texte posé hors carte quand le fond a un motif. */
    plate: c.patterned
      ? { backgroundColor: c.card, borderRadius: radius.card, paddingVertical: 18, paddingHorizontal: 20, ...(c.outlined ? { borderWidth: 1, borderColor: c.line } : null) }
      : { paddingHorizontal: 4 },
    display: { ...type.display, color: c.ink },
    card: { backgroundColor: c.card, borderRadius: radius.card, padding: 20, gap: 16, ...(c.outlined ? { borderWidth: 1, borderColor: c.line } : null) },
    cardTitle: { ...type.label, fontSize: 17, color: c.ink },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    muted: { ...type.small, color: c.inkSoft },
    body: { ...type.body, color: c.ink },
    bold: { ...type.label, color: c.ink },
    title: { ...type.title, color: c.ink },
    number: { ...type.number, color: c.ink },
    unit: { fontSize: 15, fontWeight: '400', letterSpacing: 0, color: c.inkSoft },
    stats: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 22, rowGap: 6 },
    statLabel: { ...type.body, color: c.inkSoft },
    statValue: { color: c.ink, fontWeight: '600' },
    iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' },
    pill: { height: 54, borderRadius: radius.pill, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    pillText: { ...type.label },
    pillIcon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    pressed: { opacity: 0.6 },
    tab: { fontSize: 15, fontWeight: '500', color: c.inkSoft },
    choice: { flex: 1, borderRadius: 20, padding: 14, gap: 6, backgroundColor: c.soft },
    tag: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: c.line, backgroundColor: c.card },
    tagText: { fontSize: 13, color: c.ink },
    field: {
      height: 52,
      borderRadius: radius.field,
      paddingHorizontal: 16,
      backgroundColor: c.soft,
      color: c.ink,
      fontSize: 15,
      // Grandit dans une rangée, peut rétrécir sans déborder, garde sa hauteur seul sur sa ligne.
      flexGrow: 1,
      flexShrink: 1,
      minWidth: 0,
    },
    ticks: { flexDirection: 'row', justifyContent: 'space-between', height: 46 },
    tick: { width: 4, borderRadius: 2 },
    segment: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.soft, alignItems: 'center', justifyContent: 'center' },
  });
}

export type Styles = ReturnType<typeof makeStyles>;
