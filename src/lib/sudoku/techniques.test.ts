import { describe, expect, it } from 'vitest';
import { buildHint, findHiddenSingle, findNakedSingle } from './techniques';
import type { Board } from './types';

const SOLUTION = Uint8Array.from([
  5, 3, 4, 6, 7, 8, 9, 1, 2, 6, 7, 2, 1, 9, 5, 3, 4, 8, 1, 9, 8, 3, 4, 2, 5, 6, 7, 8, 5, 9, 7, 6, 1,
  4, 2, 3, 4, 2, 6, 8, 5, 3, 7, 9, 1, 7, 1, 3, 9, 2, 4, 8, 5, 6, 9, 6, 1, 5, 3, 7, 2, 8, 4, 2, 8, 7,
  4, 1, 9, 6, 3, 5, 3, 4, 5, 2, 8, 6, 1, 7, 9,
]) as Board;

describe('findNakedSingle', () => {
  it('finds a cell with exactly one remaining candidate', () => {
    // Take the full solution and blank exactly one cell — its peers already
    // fully constrain it, so it's a naked single by construction.
    const board = SOLUTION.slice() as Board;
    const targetCell = 40; // center cell, value 5 in SOLUTION
    const expectedValue = SOLUTION[targetCell];
    board[targetCell] = 0;

    const result = findNakedSingle(board);
    expect(result).not.toBeNull();
    expect(result!.cell).toBe(targetCell);
    expect(result!.value).toBe(expectedValue);
  });

  it('returns null when every empty cell has more than one candidate', () => {
    const board = new Uint8Array(81) as Board; // fully empty: every cell has 9 candidates
    expect(findNakedSingle(board)).toBeNull();
  });
});

describe('findHiddenSingle', () => {
  it('finds a valid hidden single when two cells in the same box are blanked', () => {
    // Blanking two cells of an otherwise-complete valid grid leaves each one
    // fully pinned by its own row+col+box peers, so this also happens to be
    // a naked single — but it still exercises findHiddenSingle's box-scope
    // scan end to end and must report one of the two blanked cells correctly.
    const board = SOLUTION.slice() as Board;
    board[0] = 0;
    board[1] = 0;

    const result = findHiddenSingle(board);
    expect(result).not.toBeNull();
    expect([0, 1]).toContain(result!.cell);
    expect([SOLUTION[0], SOLUTION[1]]).toContain(result!.value);
  });

  it('detects a hidden single via row scope with the correct cell and value', () => {
    // Row 0 has digits 1-8 in columns 0-7, leaving column 8 as the only cell
    // that can hold 9 — a hidden (and, in this sparse fixture, also naked)
    // single at cell 8. This test only exercises findHiddenSingle's own
    // scope/cell/value detection; see buildHint's priority-ordering test for
    // the naked-vs-hidden precedence behavior.
    const board = new Uint8Array(81) as Board;
    for (let c = 0; c < 8; c++) board[c] = c + 1; // 1..8 across row 0, col 8 empty
    const result = findHiddenSingle(board);
    expect(result).not.toBeNull();
    expect(result!.cell).toBe(8);
    expect(result!.value).toBe(9);
    expect(result!.scope.type).toBe('row');
    expect(result!.scope.index).toBe(0);
  });

  it('returns null on a fully empty board (no scope has a uniquely-constrained digit)', () => {
    const board = new Uint8Array(81) as Board;
    expect(findHiddenSingle(board)).toBeNull();
  });
});

describe('buildHint', () => {
  it('prioritizes naked single over hidden single when both would apply', () => {
    const board = SOLUTION.slice() as Board;
    const targetCell = 40;
    board[targetCell] = 0;
    const hint = buildHint(board, SOLUTION);
    expect(hint.technique).toBe('naked-single');
    expect(hint.targetCell).toBe(targetCell);
    expect(hint.value).toBe(SOLUTION[targetCell]);
    expect(hint.steps).toHaveLength(3);
    expect(hint.steps[2].ghostValue).toBe(SOLUTION[targetCell]);
  });

  it('falls back to a generic (non-technique) reveal when neither single exists, and never lies about a technique', () => {
    // A board with many empty cells and no forced single anywhere: an empty
    // grid has zero naked/hidden singles (every cell has all 9 candidates,
    // every scope has 9 legal cells for every digit).
    const board = new Uint8Array(81) as Board;
    expect(findNakedSingle(board)).toBeNull();
    expect(findHiddenSingle(board)).toBeNull();

    const hint = buildHint(board, SOLUTION);
    expect(hint.technique).toBeNull();
    expect(hint.value).toBe(SOLUTION[hint.targetCell]);
    expect(hint.steps).toHaveLength(3);
    // Fallback copy must not claim a named technique.
    for (const step of hint.steps) {
      expect(step.title.toLowerCase()).not.toContain('single');
      expect(step.title.toLowerCase()).not.toContain('remaining cell');
    }
  });

  it('surfaces a genuine hidden-single technique (target cell has 3 raw candidates, not a naked single) with "block" wording', () => {
    // Box 0: cells 0, 1, 20 are the only empty cells, with box-only
    // candidates {2, 5, 8}. Placing 8 elsewhere in column 1 and column 2
    // (indices 28, 29) excludes 8 from cells 1 and 20 specifically, leaving
    // cell 0 as the sole holder of candidate 8 within the box — a hidden
    // single — while cell 0 itself still has all three candidates (2, 5, 8),
    // so it is deliberately NOT also a naked single.
    const board = new Uint8Array(81) as Board;
    board[2] = 1;
    board[9] = 3;
    board[10] = 4;
    board[11] = 6;
    board[18] = 7;
    board[19] = 9;
    board[28] = 8;
    board[29] = 8;
    expect(findNakedSingle(board)).toBeNull();

    const solution = board.slice() as Board;
    solution[0] = 8;
    solution[1] = 2;
    solution[20] = 5;

    const hint = buildHint(board, solution);
    expect(hint.technique).toBe('hidden-single');
    expect(hint.targetCell).toBe(0);
    expect(hint.value).toBe(8);
    expect(hint.steps[1].body).toBe('In this block, there is only one cell remaining that can contain 8.');
    expect(hint.steps[2].ghostValue).toBe(8);
  });
});
