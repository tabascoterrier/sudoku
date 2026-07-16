import { computeCandidates, digitsInMask, popcount } from './candidates';
import type { Board } from './types';

// Finds the empty cell with the fewest remaining candidates (MRV heuristic).
// Returns index -1 if the board is fully filled, or -2 if some empty cell
// has zero candidates (a contradiction / dead end).
export function pickBranchCell(board: Board): { index: number; mask: number } {
  const candidates = computeCandidates(board);
  let bestIndex = -1;
  let bestMask = 0;
  let bestCount = 10;
  for (let i = 0; i < 81; i++) {
    if (board[i] !== 0) continue;
    const mask = candidates[i];
    const count = popcount(mask);
    if (count === 0) return { index: -2, mask: 0 };
    if (count < bestCount) {
      bestCount = count;
      bestIndex = i;
      bestMask = mask;
      if (count === 1) break;
    }
  }
  return { index: bestIndex, mask: bestMask };
}

// Counts solutions via backtracking, stopping early once `cap` is reached.
// Used to verify puzzle uniqueness (cap = 2: we only need to know if there's
// more than one solution, not how many).
export function solveCount(board: Board, cap = 2): number {
  const work = board.slice() as Board;
  let count = 0;

  function backtrack(): boolean {
    const { index, mask } = pickBranchCell(work);
    if (index === -2) return false;
    if (index === -1) {
      count++;
      return count >= cap;
    }
    for (const d of digitsInMask(mask)) {
      work[index] = d;
      const stop = backtrack();
      work[index] = 0;
      if (stop) return true;
    }
    return false;
  }

  backtrack();
  return count;
}

// Solves a board (assumes at most one solution is wanted), returning the
// filled grid or null if unsolvable.
export function solve(board: Board): Board | null {
  const work = board.slice() as Board;

  function backtrack(): boolean {
    const { index, mask } = pickBranchCell(work);
    if (index === -2) return false;
    if (index === -1) return true;
    for (const d of digitsInMask(mask)) {
      work[index] = d;
      if (backtrack()) return true;
      work[index] = 0;
    }
    return false;
  }

  return backtrack() ? work : null;
}
