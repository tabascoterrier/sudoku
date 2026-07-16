import { describe, expect, it } from 'vitest';
import { mulberry32, shuffle } from './rng';
import { solve, solveCount } from './solver';
import type { Board } from './types';

// A well-known unique-solution puzzle (classic "world's hardest sudoku"-adjacent
// easy example) — 0 = empty.
const PUZZLE = Uint8Array.from([
  5, 3, 0, 0, 7, 0, 0, 0, 0, 6, 0, 0, 1, 9, 5, 0, 0, 0, 0, 9, 8, 0, 0, 0, 0, 6, 0, 8, 0, 0, 0, 6, 0,
  0, 0, 3, 4, 0, 0, 8, 0, 3, 0, 0, 1, 7, 0, 0, 0, 2, 0, 0, 0, 6, 0, 6, 0, 0, 0, 0, 2, 8, 0, 0, 0, 0,
  4, 1, 9, 0, 0, 5, 0, 0, 0, 0, 8, 0, 0, 7, 9,
]) as Board;

const SOLUTION = Uint8Array.from([
  5, 3, 4, 6, 7, 8, 9, 1, 2, 6, 7, 2, 1, 9, 5, 3, 4, 8, 1, 9, 8, 3, 4, 2, 5, 6, 7, 8, 5, 9, 7, 6, 1,
  4, 2, 3, 4, 2, 6, 8, 5, 3, 7, 9, 1, 7, 1, 3, 9, 2, 4, 8, 5, 6, 9, 6, 1, 5, 3, 7, 2, 8, 4, 2, 8, 7,
  4, 1, 9, 6, 3, 5, 3, 4, 5, 2, 8, 6, 1, 7, 9,
]) as Board;

// Relabeling every 8 as 9 and vice versa in a valid solved grid always yields
// another equally valid solved grid (Latin-square relabeling symmetry). So a
// puzzle that blanks exactly the 8/9 cells and keeps everything else as a
// given has at least two solutions: the original, and the 8<->9 swap.
function makeTwoSolutionBoard(): Board {
  const board = SOLUTION.slice() as Board;
  for (let i = 0; i < 81; i++) {
    if (board[i] === 8 || board[i] === 9) board[i] = 0;
  }
  return board;
}

describe('solve', () => {
  it('solves a known puzzle to its known unique solution', () => {
    const result = solve(PUZZLE);
    expect(result).not.toBeNull();
    expect(Array.from(result!)).toEqual(Array.from(SOLUTION));
  });

  it('returns null for a contradictory board', () => {
    const board = PUZZLE.slice() as Board;
    board[0] = 5;
    board[1] = 5; // same row, immediate contradiction
    expect(solve(board)).toBeNull();
  });

  it('round-trips a fully solved grid (no empty cells) to itself', () => {
    expect(Array.from(solve(SOLUTION)!)).toEqual(Array.from(SOLUTION));
  });
});

describe('solveCount', () => {
  it('returns 1 for a known-unique puzzle', () => {
    expect(solveCount(PUZZLE, 2)).toBe(1);
  });

  it('returns 0 for a contradictory board', () => {
    const board = PUZZLE.slice() as Board;
    board[0] = 5;
    board[1] = 5;
    expect(solveCount(board, 2)).toBe(0);
  });

  it('caps at the requested count on a board with many solutions (empty grid)', () => {
    const empty = new Uint8Array(81) as Board;
    expect(solveCount(empty, 2)).toBe(2);
  });

  it('detects exactly two solutions on a crafted two-solution board (8/9 relabeling)', () => {
    const board = makeTwoSolutionBoard();
    expect(solveCount(board, 2)).toBe(2);
  });

  it('perf: solves and uniqueness-checks a near-minimal (~20-given) puzzle quickly', () => {
    // Self-generated rather than hand-copied from an external source: dig cells
    // from our own verified SOLUTION, checking uniqueness with solveCount as we
    // go, so the resulting board is guaranteed valid and uniquely solvable by
    // construction (this is a minimal preview of generator.ts's digging logic).
    const rng = mulberry32(1);
    const order = shuffle(
      Array.from({ length: 81 }, (_, i) => i),
      rng,
    );
    const board = SOLUTION.slice() as Board;
    let givens = 81;
    for (const idx of order) {
      if (givens <= 20) break;
      const backup = board[idx];
      board[idx] = 0;
      if (solveCount(board, 2) === 1) {
        givens--;
      } else {
        board[idx] = backup;
      }
    }
    expect(givens).toBeLessThanOrEqual(27); // sanity: digging actually removed a meaningful number of cells

    const start = performance.now();
    const count = solveCount(board, 2);
    const solved = solve(board);
    const elapsed = performance.now() - start;

    expect(count).toBe(1);
    expect(solved).not.toBeNull();
    expect(elapsed).toBeLessThan(1000);
  });
});
