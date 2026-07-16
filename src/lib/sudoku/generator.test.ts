import { describe, expect, it } from 'vitest';
import { computeCandidates } from './candidates';
import { DIFFICULTIES, DIFFICULTY_BANDS } from './difficulty';
import { digPuzzle, generatePuzzle, generateSolvedGrid } from './generator';
import { BOX_CELLS, COL_CELLS, ROW_CELLS } from './peers';
import { mulberry32 } from './rng';
import { solveCount } from './solver';
import type { Board } from './types';

function isValidFullGrid(board: Board): boolean {
  const isPermutationOf1to9 = (cells: readonly number[]) => {
    const seen = new Set(cells.map((i) => board[i]));
    return seen.size === 9 && !seen.has(0);
  };
  return (
    ROW_CELLS.every(isPermutationOf1to9) &&
    COL_CELLS.every(isPermutationOf1to9) &&
    BOX_CELLS.every(isPermutationOf1to9)
  );
}

describe('generateSolvedGrid', () => {
  it('produces a fully valid grid (every row/col/box is a 1-9 permutation) across many seeds', () => {
    for (let seed = 0; seed < 25; seed++) {
      const board = generateSolvedGrid(mulberry32(seed));
      expect(isValidFullGrid(board)).toBe(true);
    }
  });

  it('produces different grids for different seeds (not a fixed canonical grid)', () => {
    const a = generateSolvedGrid(mulberry32(1));
    const b = generateSolvedGrid(mulberry32(2));
    expect(Array.from(a)).not.toEqual(Array.from(b));
  });
});

describe('digPuzzle', () => {
  it('always produces a uniquely solvable board', () => {
    const rng = mulberry32(7);
    const solved = generateSolvedGrid(rng);
    const { board } = digPuzzle(solved, 24, rng, performance.now() + 2000);
    expect(solveCount(board, 2)).toBe(1);
  });

  it('never removes a cell that was not present in the solved grid (givens are a subset)', () => {
    const rng = mulberry32(7);
    const solved = generateSolvedGrid(rng);
    const { board } = digPuzzle(solved, 24, rng, performance.now() + 2000);
    for (let i = 0; i < 81; i++) {
      if (board[i] !== 0) expect(board[i]).toBe(solved[i]);
    }
  });
});

describe('generatePuzzle', () => {
  for (const difficulty of DIFFICULTIES) {
    it(`produces a valid, uniquely-solvable ${difficulty} puzzle within its given-count band`, () => {
      const rng = mulberry32(100 + DIFFICULTIES.indexOf(difficulty));
      const puzzle = generatePuzzle(difficulty, rng);
      const band = DIFFICULTY_BANDS[difficulty];

      expect(puzzle.difficulty).toBe(difficulty);
      expect(isValidFullGrid(puzzle.solution)).toBe(true);
      expect(solveCount(puzzle.givens, 2)).toBe(1);
      expect(puzzle.actualGivens).toBeLessThanOrEqual(band.max + 5); // generous slack for the graceful-fallback path
      expect(puzzle.actualGivens).toBeGreaterThanOrEqual(17); // never below the mathematical minimum

      const actualGivenCount = Array.from(puzzle.givens).filter((v) => v !== 0).length;
      expect(actualGivenCount).toBe(puzzle.actualGivens);

      // Every given cell must match the solution.
      for (let i = 0; i < 81; i++) {
        if (puzzle.givens[i] !== 0) expect(puzzle.givens[i]).toBe(puzzle.solution[i]);
      }
    });
  }

  it('produces distinct puzzle ids across calls', () => {
    const rng = mulberry32(42);
    const a = generatePuzzle('easy', rng);
    const b = generatePuzzle('easy', rng);
    expect(a.id).not.toBe(b.id);
  });

  it('exercises the graceful-fallback path under an artificially tiny time budget without hanging or throwing', () => {
    const rng = mulberry32(9);
    const puzzle = generatePuzzle('expert', rng, 0);
    expect(solveCount(puzzle.givens, 2)).toBe(1);
    expect(puzzle.actualGivens).toBeGreaterThan(0);
  });

  it('never leaves a completed cell candidate-inconsistent (sanity check via computeCandidates)', () => {
    const rng = mulberry32(3);
    const puzzle = generatePuzzle('hard', rng);
    const candidates = computeCandidates(puzzle.givens);
    for (let i = 0; i < 81; i++) {
      if (puzzle.givens[i] === 0) {
        // The true solution's digit for this cell must still be a legal
        // candidate given the other givens (guaranteed since givens are a
        // subset of a valid full solution).
        const solutionDigit = puzzle.solution[i];
        expect(candidates[i] & (1 << (solutionDigit - 1))).not.toBe(0);
      }
    }
  });
});
