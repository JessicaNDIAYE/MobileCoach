import type { IconName } from '@/components/ui';

import type { Module } from './types';

export type ModuleDef = { id: Module; label: string; hint: string; icon: IconName };

/** Ordre d'affichage des modules. Le suivi du poids n'est jamais coché par défaut. */
export const MODULES: ModuleDef[] = [
  { id: 'recipes', label: 'Recettes', hint: 'Des idées avec ce qu’il y a dans ton frigo', icon: 'book-open' },
  { id: 'budget', label: 'Budget courses', hint: 'Suivre tes dépenses du mois', icon: 'shopping-bag' },
  { id: 'challenges', label: 'Défis entre amis', hint: 'Zéro sucre, low carb ou fibres, ensemble', icon: 'award' },
  { id: 'weight', label: 'Suivi du poids', hint: 'Pesées, objectif et courbe', icon: 'activity' },
];

export const DEFAULT_MODULES: Module[] = ['recipes', 'budget', 'challenges'];

export const WEIGHT_CONSENT =
  'En activant ce module, tu acceptes que tes pesées soient enregistrées. Ce sont des données de santé : tu peux les supprimer à tout moment.';
