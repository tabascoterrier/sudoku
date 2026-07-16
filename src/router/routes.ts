import type { Difficulty } from '../lib/sudoku/types';

export type RouteName = 'game' | 'rules' | 'settings' | 'not-found';

export interface Route {
  name: RouteName;
  difficulty?: Difficulty;
}

const DIFFICULTY_BY_PATH: Record<string, Difficulty> = {
  '/easy/': 'easy',
  '/medium/': 'medium',
  '/hard/': 'hard',
  '/expert/': 'expert',
};

const DEFAULT_DIFFICULTY: Difficulty = 'easy';

export function matchRoute(pathname: string): Route {
  const normalized = pathname.endsWith('/') ? pathname : `${pathname}/`;

  const difficulty = DIFFICULTY_BY_PATH[normalized];
  if (difficulty) return { name: 'game', difficulty };

  if (normalized === '/rules/') return { name: 'rules' };
  if (normalized === '/settings/') return { name: 'settings' };
  if (normalized === '/') return { name: 'game', difficulty: DEFAULT_DIFFICULTY };

  return { name: 'not-found' };
}

export function pathForDifficulty(difficulty: Difficulty): string {
  return `/${difficulty}/`;
}
