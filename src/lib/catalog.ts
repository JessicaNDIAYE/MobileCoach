import type { IconName } from '@/components/ui';

import type { ChallengeType } from './types';

type ChallengeDef = {
  label: string;
  icon: IconName;
  rule: string;
  /** true si la journée nécessite de saisir des grammes de fibres plutôt qu'un simple oui/non */
  tracksFiber: boolean;
};

export const CHALLENGES: Record<ChallengeType, ChallengeDef> = {
  no_sugar: {
    label: 'Zéro sucre ajouté',
    icon: 'slash',
    rule: 'Pas de sucre ajouté, pas de soda, pas de pâtisserie.',
    tracksFiber: false,
  },
  no_carbs: {
    label: 'Low carb',
    icon: 'minus-circle',
    rule: 'Pas de pain, pâtes, riz, pommes de terre ni sucre.',
    tracksFiber: false,
  },
  fiber_max: {
    label: 'Fibres max',
    icon: 'feather',
    rule: 'Atteindre ton objectif de fibres chaque jour (30 g par défaut).',
    tracksFiber: true,
  },
};

/** Raccourcis de saisie pour le défi fibres (grammes par portion, valeurs indicatives). */
export const FIBER_SHORTCUTS: { label: string; grams: number }[] = [
  { label: 'Pomme', grams: 4 },
  { label: 'Avoine', grams: 8 },
  { label: 'Lentilles', grams: 8 },
  { label: 'Brocoli', grams: 5 },
  { label: 'Avocat', grams: 7 },
  { label: 'Pain complet', grams: 3 },
];

export const CATEGORIES = [
  'Fruits & légumes',
  'Viande & poisson',
  'Crèmerie',
  'Épicerie',
  'Boissons',
  'Surgelés',
  'Autre',
] as const;
