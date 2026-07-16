// Invented scoring system: correct entries earn points, mistakes and hints
// cost points (hints in particular should never be a net win over just
// solving the cell yourself), and completing a row, column, or box earns a
// bonus. Score never drops below zero.
export const CORRECT_ENTRY_SCORE = 10;
export const MISTAKE_PENALTY = 5;
export const HINT_PENALTY = 25;
export const UNIT_COMPLETE_BONUS = 20;
