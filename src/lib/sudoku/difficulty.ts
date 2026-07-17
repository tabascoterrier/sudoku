import type { Difficulty } from './types';

export interface GivenBand {
  min: number;
  max: number;
}

// Difficulty is implemented as givens density (SPEC §3): easier puzzles start
// with more pre-filled cells.
export const DIFFICULTY_BANDS: Record<Difficulty, GivenBand> = {
  easy: { min: 40, max: 46 },
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

// Par solve time (ms) per tier, used by scoring.ts's completion time bonus:
// finishing at or under par earns the full bonus.
export const PAR_TIME_MS: Record<Difficulty, number> = {
  easy: 3 * 60_000,
  medium: 6 * 60_000,
  hard: 10 * 60_000,
  expert: 15 * 60_000,
};

export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  expert: 'Expert',
};
