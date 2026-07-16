import type { Difficulty } from './types';

export interface GivenBand {
  min: number;
  max: number;
}

// Difficulty is implemented as givens density (SPEC §3): easier puzzles start
// with more pre-filled cells.
export const DIFFICULTY_BANDS: Record<Difficulty, GivenBand> = {
  easy: { min: 36, max: 40 },
  medium: { min: 32, max: 35 },
  hard: { min: 28, max: 31 },
  expert: { min: 24, max: 27 },
};

// Per-tier generation time budget (ms) for the retry loop in generator.ts.
export const TIME_BUDGET_MS: Record<Difficulty, number> = {
  easy: 500,
  medium: 500,
  hard: 500,
  expert: 1000,
};

export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  expert: 'Expert',
};
