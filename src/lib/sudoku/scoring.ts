// Invented scoring system: correct entries earn points, mistakes and hints
// cost points (hints in particular should never be a net win over just
// solving the cell yourself), and completing a row, column, or box earns a
// bonus. Score never drops below zero.
export const CORRECT_ENTRY_SCORE = 10;
export const MISTAKE_PENALTY = 5;
export const HINT_PENALTY = 25;
export const UNIT_COMPLETE_BONUS = 20;

// One-time bonus applied on puzzle completion, rewarding solving at or under
// the tier's par time. Full bonus up to par, tapering linearly to zero by
// double par, and zero beyond that — lingering never costs points, it just
// stops earning more of the bonus.
export const MAX_TIME_BONUS = 200;

export function timeBonus(elapsedMs: number, parMs: number): number {
  if (elapsedMs <= parMs) return MAX_TIME_BONUS;
  const capMs = parMs * 2;
  if (elapsedMs >= capMs) return 0;
  const remaining = (capMs - elapsedMs) / (capMs - parMs);
  return Math.round(MAX_TIME_BONUS * remaining);
}
