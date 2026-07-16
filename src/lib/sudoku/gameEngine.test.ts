import { beforeEach, describe, expect, it } from 'vitest';
import { GameEngine, STARTING_HINTS } from './gameEngine';
import { HINT_COMMIT_SCORE } from './scoring';
import type { Board, Puzzle } from './types';

const SOLUTION = Uint8Array.from([
  5, 3, 4, 6, 7, 8, 9, 1, 2, 6, 7, 2, 1, 9, 5, 3, 4, 8, 1, 9, 8, 3, 4, 2, 5, 6, 7, 8, 5, 9, 7, 6, 1,
  4, 2, 3, 4, 2, 6, 8, 5, 3, 7, 9, 1, 7, 1, 3, 9, 2, 4, 8, 5, 6, 9, 6, 1, 5, 3, 7, 2, 8, 4, 2, 8, 7,
  4, 1, 9, 6, 3, 5, 3, 4, 5, 2, 8, 6, 1, 7, 9,
]) as Board;

// Givens: everything except cells 4, 13, 40 (three empty cells to play with),
// none of which are peers of each other (different rows/cols/boxes) so
// filling one never triggers peer-note interactions with another by accident.
function makeTestPuzzle(): Puzzle {
  const givens = SOLUTION.slice() as Board;
  const empties = [4, 13, 40];
  for (const i of empties) givens[i] = 0;
  return {
    id: 'test-puzzle',
    difficulty: 'easy',
    givens,
    solution: SOLUTION,
    actualGivens: 81 - empties.length,
  };
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

  it('starts with zero mistakes, full hints, zero score, not paused/complete', () => {
    expect(engine.mistakes).toBe(0);
    expect(engine.hintsRemaining).toBe(STARTING_HINTS);
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
  it('commits the hinted digit like a correct manual entry, awards score, and consumes a charge', () => {
    const hint = engine.requestHint();
    expect(hint).not.toBeNull();
    engine.commitHint();
    expect(engine.grid[hint!.targetCell].value).toBe(hint!.value);
    expect(engine.grid[hint!.targetCell].value).toBe(SOLUTION[hint!.targetCell]);
    expect(engine.score).toBe(HINT_COMMIT_SCORE);
    expect(engine.hintsRemaining).toBe(STARTING_HINTS - 1);
    expect(engine.mistakes).toBe(0);
  });

  it('does not refund score or hint charge on undo after a hint commit', () => {
    engine.requestHint();
    engine.commitHint();
    const targetCell = engine.history[engine.history.length - 1].after[0].index;
    engine.undo();
    expect(engine.grid[targetCell].value).toBe(0);
    expect(engine.score).toBe(HINT_COMMIT_SCORE);
    expect(engine.hintsRemaining).toBe(STARTING_HINTS - 1);
  });

  it('runs out after STARTING_HINTS uses', () => {
    for (let i = 0; i < STARTING_HINTS; i++) {
      const hint = engine.requestHint();
      expect(hint).not.toBeNull();
      engine.commitHint();
    }
    expect(engine.hintsRemaining).toBe(0);
    expect(engine.requestHint()).toBeNull();
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
  it('resets the board to givens and clears mistakes/score/hints/history', () => {
    engine.setValue(4, (SOLUTION[4] % 9) + 1); // a mistake
    engine.requestHint();
    engine.commitHint();
    engine.restart();

    expect(engine.grid[4].value).toBe(0);
    expect(engine.grid[0].value).toBe(SOLUTION[0]); // given cells restored
    expect(engine.mistakes).toBe(0);
    expect(engine.score).toBe(0);
    expect(engine.hintsRemaining).toBe(STARTING_HINTS);
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
