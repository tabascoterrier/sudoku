import { beforeEach, describe, expect, it } from 'vitest';
import { GameEngine } from './gameEngine';
import { CORRECT_ENTRY_SCORE, HINT_PENALTY, MISTAKE_PENALTY, UNIT_COMPLETE_BONUS } from './scoring';
import type { Board, Puzzle } from './types';

const SOLUTION = Uint8Array.from([
  5, 3, 4, 6, 7, 8, 9, 1, 2, 6, 7, 2, 1, 9, 5, 3, 4, 8, 1, 9, 8, 3, 4, 2, 5, 6, 7, 8, 5, 9, 7, 6, 1,
  4, 2, 3, 4, 2, 6, 8, 5, 3, 7, 9, 1, 7, 1, 3, 9, 2, 4, 8, 5, 6, 9, 6, 1, 5, 3, 7, 2, 8, 4, 2, 8, 7,
  4, 1, 9, 6, 3, 5, 3, 4, 5, 2, 8, 6, 1, 7, 9,
]) as Board;

// Givens: everything except cells 4, 13, 40 (three empty cells to play with),
// none of which are peers of each other (different rows/cols/boxes) so
// filling one never triggers peer-note interactions with another by accident.
function makePuzzleWithEmpties(empties: number[]): Puzzle {
  const givens = SOLUTION.slice() as Board;
  for (const i of empties) givens[i] = 0;
  return {
    id: 'test-puzzle',
    difficulty: 'easy',
    givens,
    solution: SOLUTION,
    actualGivens: 81 - empties.length,
  };
}

function makeTestPuzzle(): Puzzle {
  return makePuzzleWithEmpties([4, 13, 40]);
}

let engine: GameEngine;

beforeEach(() => {
  engine = new GameEngine(makeTestPuzzle());
});

describe('initial state', () => {
  it('marks given cells as given/fixed and empty cells as editable', () => {
    expect(engine.grid[0].given).toBe(true);
    expect(engine.grid[0].value).toBe(SOLUTION[0]);
    expect(engine.grid[4].given).toBe(false);
    expect(engine.grid[4].value).toBe(0);
  });

  it('starts with zero mistakes, zero score, not paused/complete', () => {
    expect(engine.mistakes).toBe(0);
    expect(engine.score).toBe(0);
    expect(engine.isPaused).toBe(false);
    expect(engine.isComplete).toBe(false);
  });
});

describe('setValue / mistakes', () => {
  it('accepts a correct entry with no mistake', () => {
    engine.setValue(4, SOLUTION[4]);
    expect(engine.grid[4].value).toBe(SOLUTION[4]);
    expect(engine.mistakes).toBe(0);
    expect(engine.isCellError(4)).toBe(false);
  });

  it('flags a wrong entry and increments the cumulative mistake counter', () => {
    const wrong = (SOLUTION[4] % 9) + 1; // guaranteed different digit
    engine.setValue(4, wrong);
    expect(engine.grid[4].value).toBe(wrong);
    expect(engine.mistakes).toBe(1);
    expect(engine.isCellError(4)).toBe(true);
  });

  it('is a no-op on given cells', () => {
    engine.setValue(0, (SOLUTION[0] % 9) + 1);
    expect(engine.grid[0].value).toBe(SOLUTION[0]);
    expect(engine.mistakes).toBe(0);
  });

  it('has no mistake cap: the game stays playable past 3 mistakes', () => {
    const wrong = (i: number) => (SOLUTION[i] % 9) + 1;
    engine.setValue(4, wrong(4));
    engine.setValue(13, wrong(13));
    engine.setValue(40, wrong(40));
    expect(engine.mistakes).toBe(3);
    expect(engine.isComplete).toBe(false);

    // Still editable — no failure state blocks further play.
    engine.erase(4);
    expect(engine.grid[4].value).toBe(0);
    engine.setValue(4, SOLUTION[4]);
    expect(engine.grid[4].value).toBe(SOLUTION[4]);
  });
});

describe('notes and peer auto-clear', () => {
  it('toggles a candidate on and back off in an empty cell', () => {
    engine.toggleNote(4, 3);
    expect(engine.grid[4].notes & (1 << 2)).not.toBe(0);
    engine.toggleNote(4, 3);
    expect(engine.grid[4].notes & (1 << 2)).toBe(0);
  });

  it('lets multiple candidates coexist in one cell', () => {
    engine.toggleNote(4, 1);
    engine.toggleNote(4, 3);
    expect(engine.grid[4].notes & (1 << 0)).not.toBe(0);
    expect(engine.grid[4].notes & (1 << 2)).not.toBe(0);
  });

  it('clears only the matching digit from peer notes on a committed entry, leaving unrelated notes untouched', () => {
    // Cell 4 (row0,col4) and cell 13 (row1,col4) are column peers.
    engine.toggleNote(13, 4); // candidate "4"
    engine.toggleNote(13, 5); // unrelated candidate "5"
    engine.enterDigit(4, 4); // commit final "4" into cell 4 (a peer of 13 via column)
    expect(engine.grid[13].notes & (1 << 3)).toBe(0); // "4" candidate cleared
    expect(engine.grid[13].notes & (1 << 4)).not.toBe(0); // "5" candidate untouched
  });

  it('routes digit entry to note-toggling when notes mode is on', () => {
    engine.toggleNotesMode();
    engine.enterDigit(4, 6);
    expect(engine.grid[4].value).toBe(0);
    expect(engine.grid[4].notes & (1 << 5)).not.toBe(0);
  });
});

describe('erase', () => {
  it('clears a cell\'s value and notes', () => {
    engine.setValue(4, SOLUTION[4]);
    engine.erase(4);
    expect(engine.grid[4].value).toBe(0);
    expect(engine.grid[4].notes).toBe(0);
  });

  it('is a no-op on given cells', () => {
    engine.erase(0);
    expect(engine.grid[0].value).toBe(SOLUTION[0]);
  });
});

describe('undo', () => {
  it('reverts a value entry back to empty', () => {
    engine.setValue(4, SOLUTION[4]);
    engine.undo();
    expect(engine.grid[4].value).toBe(0);
  });

  it('reverts a note toggle', () => {
    engine.toggleNote(4, 2);
    engine.undo();
    expect(engine.grid[4].notes).toBe(0);
  });

  it('reverts peer-note auto-clear alongside the value entry it came from', () => {
    engine.toggleNote(13, 4);
    engine.enterDigit(4, 4);
    expect(engine.grid[13].notes & (1 << 3)).toBe(0);
    engine.undo();
    expect(engine.grid[4].value).toBe(0);
    expect(engine.grid[13].notes & (1 << 3)).not.toBe(0); // peer note restored too
  });

  it('never refunds the mistake counter, even though it reverts the wrong value', () => {
    const wrong = (SOLUTION[4] % 9) + 1;
    engine.setValue(4, wrong);
    expect(engine.mistakes).toBe(1);
    engine.undo();
    expect(engine.grid[4].value).toBe(0);
    expect(engine.mistakes).toBe(1); // unchanged
  });

  it('is a no-op with an empty history', () => {
    expect(() => engine.undo()).not.toThrow();
  });
});

describe('hints', () => {
  it('commits the hinted digit like a correct manual entry and deducts points', () => {
    // Cells 0/1/9/10 form a 2x2 block that's mutually protective: filling any
    // one of them, alone, never completes its row, column, or box, so the
    // hint's score delta here is exactly -HINT_PENALTY regardless of which
    // of the four cells the hint engine happens to target.
    const isolated = new GameEngine(makePuzzleWithEmpties([0, 1, 9, 10]));
    const hint = isolated.requestHint();
    expect(hint).not.toBeNull();
    isolated.commitHint();
    expect(isolated.grid[hint!.targetCell].value).toBe(hint!.value);
    expect(isolated.grid[hint!.targetCell].value).toBe(SOLUTION[hint!.targetCell]);
    expect(isolated.score).toBe(0); // -HINT_PENALTY clamped at zero from a fresh game
    expect(isolated.mistakes).toBe(0);
  });

  it('does not refund the hint penalty on undo after a hint commit', () => {
    engine.requestHint();
    engine.commitHint();
    const scoreAfterHint = engine.score;
    const targetCell = engine.history[engine.history.length - 1].after[0].index;
    engine.undo();
    expect(engine.grid[targetCell].value).toBe(0);
    expect(engine.score).toBe(scoreAfterHint);
  });

  it('has no cap on how many hints can be requested — only puzzle completion stops it', () => {
    // Four isolated cells, one more than the old 3-hint cap this replaces.
    const isolated = new GameEngine(makePuzzleWithEmpties([0, 1, 9, 10]));
    for (let i = 0; i < 4; i++) {
      const hint = isolated.requestHint();
      expect(hint).not.toBeNull();
      isolated.commitHint();
    }
    expect(isolated.isComplete).toBe(true);
    expect(isolated.requestHint()).toBeNull(); // no hints once the puzzle is solved
  });

  it('advances and retreats through the 3-step walkthrough without exceeding its bounds', () => {
    engine.requestHint();
    expect(engine.hintStepIndex).toBe(0);
    engine.nextHintStep();
    engine.nextHintStep();
    expect(engine.hintStepIndex).toBe(2);
    engine.nextHintStep(); // clamps at last step
    expect(engine.hintStepIndex).toBe(2);
    engine.prevHintStep();
    expect(engine.hintStepIndex).toBe(1);
  });
});

describe('scoring', () => {
  // Cells 0/1/9/10 form a 2x2 block: each one's row, column, and box still
  // has another empty member of the block left, so filling any single one
  // never triggers a unit-completion bonus. This isolates the base
  // correct-entry score and the mistake penalty from bonus interference.
  const PROTECTED_BLOCK = [0, 1, 9, 10];

  it('awards points for a correct entry with no unit bonus in play', () => {
    const e = new GameEngine(makePuzzleWithEmpties(PROTECTED_BLOCK));
    e.setValue(0, SOLUTION[0]);
    expect(e.score).toBe(CORRECT_ENTRY_SCORE);
  });

  it('penalizes a wrong entry, clamped at zero from a fresh game', () => {
    const e = new GameEngine(makePuzzleWithEmpties(PROTECTED_BLOCK));
    const wrong = (SOLUTION[0] % 9) + 1;
    e.setValue(0, wrong);
    expect(e.score).toBe(0);
    expect(e.mistakes).toBe(1);
  });

  it('subtracts the mistake penalty from existing points rather than clamping every time', () => {
    const e = new GameEngine(makePuzzleWithEmpties(PROTECTED_BLOCK));
    e.setValue(0, SOLUTION[0]); // +CORRECT_ENTRY_SCORE, no bonus
    const wrong = (SOLUTION[1] % 9) + 1;
    e.setValue(1, wrong); // -MISTAKE_PENALTY
    expect(e.score).toBe(CORRECT_ENTRY_SCORE - MISTAKE_PENALTY);
  });

  it('awards a bonus for completing a row (with column and box still open)', () => {
    // Cell 0 is row 0's only empty cell; 9 keeps column 0 open and 10 keeps
    // box 0 open, and neither sits in row 0, so filling 0 completes exactly
    // one unit.
    const e = new GameEngine(makePuzzleWithEmpties([0, 9, 10]));
    e.setValue(0, SOLUTION[0]);
    expect(e.score).toBe(CORRECT_ENTRY_SCORE + UNIT_COMPLETE_BONUS);
  });

  it('awards a bonus for completing a column (with row and box still open)', () => {
    // Cell 5 keeps row 0 open and 10 keeps box 0 open; neither sits in
    // column 0, so filling 0 completes only column 0.
    const e = new GameEngine(makePuzzleWithEmpties([0, 5, 10]));
    e.setValue(0, SOLUTION[0]);
    expect(e.score).toBe(CORRECT_ENTRY_SCORE + UNIT_COMPLETE_BONUS);
  });

  it('awards a bonus for completing a box (with row and column still open)', () => {
    // Cell 5 keeps row 0 open and 27 keeps column 0 open; neither sits in
    // box 0, so filling 0 completes only box 0.
    const e = new GameEngine(makePuzzleWithEmpties([0, 5, 27]));
    e.setValue(0, SOLUTION[0]);
    expect(e.score).toBe(CORRECT_ENTRY_SCORE + UNIT_COMPLETE_BONUS);
  });

  it('stacks a bonus per unit when one entry completes several at once', () => {
    // The lone empty cell in the whole grid completes its row, column, and
    // box in the same move.
    const e = new GameEngine(makePuzzleWithEmpties([40]));
    e.setValue(40, SOLUTION[40]);
    expect(e.score).toBe(CORRECT_ENTRY_SCORE + 3 * UNIT_COMPLETE_BONUS);
  });

  it('deducts the hint penalty from existing points, on top of any unit bonus the hinted digit completes', () => {
    const e = new GameEngine(makePuzzleWithEmpties([...PROTECTED_BLOCK, 40]));
    e.setValue(40, SOLUTION[40]); // isolated cell: completes its row, column, and box at once
    const scoreBefore = e.score;
    expect(scoreBefore).toBe(CORRECT_ENTRY_SCORE + 3 * UNIT_COMPLETE_BONUS);

    e.requestHint(); // targets one of the still-protected 0/1/9/10 cells — no bonus
    e.commitHint();
    expect(e.score).toBe(scoreBefore - HINT_PENALTY);
  });

  it('never lets score go negative', () => {
    const e = new GameEngine(makePuzzleWithEmpties(PROTECTED_BLOCK));
    e.setValue(0, (SOLUTION[0] % 9) + 1);
    e.setValue(1, (SOLUTION[1] % 9) + 1);
    expect(e.score).toBe(0);
  });
});

describe('win detection', () => {
  it('marks the game complete once every cell matches the solution', () => {
    engine.setValue(4, SOLUTION[4]);
    engine.setValue(13, SOLUTION[13]);
    expect(engine.isComplete).toBe(false);
    engine.setValue(40, SOLUTION[40]);
    expect(engine.isComplete).toBe(true);
  });
});

describe('restart', () => {
  it('resets the board to givens and clears mistakes/score/history', () => {
    engine.setValue(4, (SOLUTION[4] % 9) + 1); // a mistake
    engine.requestHint();
    engine.commitHint();
    engine.restart();

    expect(engine.grid[4].value).toBe(0);
    expect(engine.grid[0].value).toBe(SOLUTION[0]); // given cells restored
    expect(engine.mistakes).toBe(0);
    expect(engine.score).toBe(0);
    expect(engine.history).toHaveLength(0);
    expect(engine.isComplete).toBe(false);
  });
});

describe('pause / timer', () => {
  it('does not accumulate elapsed time while paused', () => {
    engine.tick(1000);
    engine.pause();
    engine.tick(1000);
    expect(engine.elapsedMs).toBe(1000);
    engine.resume();
    engine.tick(500);
    expect(engine.elapsedMs).toBe(1500);
  });
});
