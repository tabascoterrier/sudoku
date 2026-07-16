import { digitsInMask } from './candidates';
import { DIFFICULTY_BANDS, TIME_BUDGET_MS } from './difficulty';
import { BOX_CELLS } from './peers';
import { defaultRng, shuffle, type RNG } from './rng';
import { pickBranchCell, solveCount } from './solver';
import type { Board, Difficulty, Puzzle } from './types';

// Generates a fully solved, random, valid 9x9 grid. The three diagonal boxes
// share no row/col/box constraints with each other, so they're filled
// independently first; the rest is backtrack-filled with randomized
// candidate order so the result isn't just a permutation of one canonical
// grid.
export function generateSolvedGrid(rng: RNG): Board {
  const board = new Uint8Array(81) as Board;

  for (const boxIndex of [0, 4, 8]) {
    const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
    BOX_CELLS[boxIndex].forEach((cell, i) => {
      board[cell] = digits[i];
    });
  }

  function backtrackFill(): boolean {
    const { index, mask } = pickBranchCell(board);
    if (index === -2) return false;
    if (index === -1) return true;
    for (const d of shuffle(digitsInMask(mask), rng)) {
      board[index] = d;
      if (backtrackFill()) return true;
      board[index] = 0;
    }
    return false;
  }

  backtrackFill();
  return board;
}

// Removes cells from a solved grid while preserving a unique solution,
// stopping once `targetGivens` is reached or the shuffled removal order is
// exhausted (whichever comes first). `deadline` is an absolute
// performance.now()-based timestamp; digging stops early if it's exceeded,
// returning whatever given-count was reached so far.
export function digPuzzle(
  solved: Board,
  targetGivens: number,
  rng: RNG,
  deadline: number,
): { board: Board; givens: number } {
  const board = solved.slice() as Board;
  const order = shuffle(
    Array.from({ length: 81 }, (_, i) => i),
    rng,
  );
  let givens = 81;
  for (const index of order) {
    if (givens <= targetGivens || performance.now() > deadline) break;
    const backup = board[index];
    board[index] = 0;
    if (solveCount(board, 2) === 1) {
      givens--;
    } else {
      board[index] = backup;
    }
  }
  return { board, givens };
}

function makePuzzleId(difficulty: Difficulty, rng: RNG): string {
  const random = Math.floor(rng() * 36 ** 8)
    .toString(36)
    .padStart(8, '0');
  return `${difficulty}-${random}`;
}

// Repeatedly generates a fresh solved grid + dig pass until the difficulty's
// target given-count is reached or the time budget expires, keeping the best
// (lowest given-count) attempt seen. Never hangs or throws: if the deadline
// is hit before hitting the target, the best attempt found so far is used.
export function generatePuzzle(
  difficulty: Difficulty,
  rng: RNG = defaultRng(),
  timeBudgetMs: number = TIME_BUDGET_MS[difficulty],
): Puzzle {
  const band = DIFFICULTY_BANDS[difficulty];
  const deadline = performance.now() + timeBudgetMs;

  let best: { board: Board; solved: Board; givens: number } | null = null;

  while (performance.now() < deadline) {
    const solved = generateSolvedGrid(rng);
    const { board, givens } = digPuzzle(solved, band.min, rng, deadline);
    if (!best || givens < best.givens) {
      best = { board, solved, givens };
    }
    if (best.givens <= band.min) break;
  }

  if (!best) {
    // Deadline was already past on entry (e.g. an artificially tiny budget in
    // a test) — fall back to one untimed attempt so we still return a valid,
    // uniquely-solvable puzzle rather than throwing.
    const solved = generateSolvedGrid(rng);
    const { board, givens } = digPuzzle(solved, band.min, rng, Infinity);
    best = { board, solved, givens };
  }

  return {
    id: makePuzzleId(difficulty, rng),
    difficulty,
    givens: best.board,
    solution: best.solved,
    actualGivens: best.givens,
  };
}
