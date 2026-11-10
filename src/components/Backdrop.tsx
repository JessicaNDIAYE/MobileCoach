import { memo, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { useTheme, type Palette, type StyleId } from '@/theme';

type Props = { styleId: StyleId; palette: Palette; width: number; height: number };

/** Courbe lisse passant par des points (Catmull-Rom → Bézier cubique). */
function smooth(points: [number, number][]): string {
  if (points.length < 2) return '';
  let d = `M${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

// Gribouillis : tracés libres en coordonnées relatives (0 → 1).
const SQUIGGLES: [number, number][][] = [
  [[-0.1, 0.12], [0.18, 0.04], [0.32, 0.2], [0.16, 0.3], [0.08, 0.18], [0.4, 0.1], [0.62, 0.22], [0.78, 0.06], [1.1, 0.16]],
  [[1.1, 0.42], [0.82, 0.36], [0.7, 0.52], [0.88, 0.6], [0.94, 0.48], [0.6, 0.44], [0.36, 0.56], [0.2, 0.42], [-0.1, 0.5]],
  [[-0.1, 0.8], [0.14, 0.7], [0.3, 0.86], [0.46, 0.74], [0.38, 0.66], [0.3, 0.76], [0.58, 0.9], [0.76, 0.76], [1.1, 0.86]],
];

function Pattern({ styleId, palette: p, width: w, height: h }: Props) {
  const [main, second] = p.pattern;

  const content = useMemo(() => {
    switch (styleId) {
      case 'damier': {
        const size = Math.max(10, Math.round(w / 11));
        const cells = [];
        for (let y = 0; y * size < h; y++)
          for (let x = 0; x * size < w; x++)
            if ((x + y) % 2 === 0) cells.push(<Rect key={`${x}-${y}`} x={x * size} y={y * size} width={size} height={size} fill={main} />);
        return (
          <>
            <Rect width={w} height={h} fill={second ?? p.bg} />
            {cells}
          </>
        );
      }
      case 'gribouillis':
        return SQUIGGLES.map((pts, i) => (
          <Path key={i} d={smooth(pts.map(([x, y]) => [x * w, y * h]))} stroke={main} strokeWidth={w * 0.075} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        ));
      case 'topo': {
        // Lignes de niveau : une même courbe décalée plusieurs fois, deux groupes.
        const lines = [];
        const step = h * 0.018;
        for (const [base, phase] of [[0.16, 0], [0.7, 1.7]] as const)
          for (let k = 0; k < 7; k++) {
            const pts: [number, number][] = [];
            for (let i = 0; i <= 24; i++) {
              const x = (i / 24) * w * 1.1 - w * 0.05;
              const t = (i / 24) * Math.PI * 2;
              const y = h * base + Math.sin(t * 1.3 + phase) * h * 0.06 + Math.sin(t * 2.7 + phase + k * 0.15) * h * 0.025 + k * step;
              pts.push([x, y]);
            }
            lines.push(<Path key={`${base}-${k}`} d={smooth(pts)} stroke={main} strokeWidth={Math.max(1, w * 0.006)} fill="none" />);
          }
        return lines;
      }
      case 'spirale': {
        const spirals: [number, number, number][] = [
          [0.74, 0.5, 0.34],
          [0.24, 0.66, 0.3],
          [0.58, 0.9, 0.28],
        ];
        return spirals.map(([cx, cy, r], idx) => {
          const turns = 9;
          const pts: string[] = [];
          for (let i = 0; i <= turns * 48; i++) {
            const a = (i / 48) * Math.PI * 2;
            const rad = (r * w * i) / (turns * 48);
            pts.push(`${(cx * w + Math.cos(a) * rad).toFixed(1)} ${(cy * h + Math.sin(a) * rad).toFixed(1)}`);
          }
          return <Path key={idx} d={`M${pts.join(' L')}`} stroke={main} strokeWidth={Math.max(1, w * 0.005)} fill="none" />;
        });
      }
      default:
        return null;
    }
  }, [styleId, main, second, p.bg, w, h]);

  return (
    <Svg width={w} height={h}>
      <Rect width={w} height={h} fill={p.bg} />
      {content}
    </Svg>
  );
}

/** Motif seul, à une taille donnée (sert aussi aux aperçus de l'écran Apparence). */
export const PatternView = memo(Pattern);

/** Fond de toute l'app, fixe derrière le contenu. */
export function Backdrop() {
  const { colors, appearance } = useTheme();
  const { width, height } = useWindowDimensions();
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]}>
      {colors.patterned && <PatternView styleId={appearance.style} palette={colors} width={width} height={height} />}
    </View>
  );
}
