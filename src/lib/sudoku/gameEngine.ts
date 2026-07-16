import { BOX_CELLS, boxOf, COL_CELLS, colOf, PEERS, ROW_CELLS, rowOf } from './peers';
import { CORRECT_ENTRY_SCORE, HINT_PENALTY, MISTAKE_PENALTY, UNIT_COMPLETE_BONUS } from './scoring';
import { buildHint, type Hint } from './techniques';
import type { Board, Cell, Puzzle } from './types';

export const STARTING_HINTS = 3;

interface CellSnapshot {
  index: number;
  value: number;
  notes: number;
}

type HistoryEntryType = 'set-value' | 'erase' | 'toggle-note' | 'hint-commit';

interface HistoryEntry {
  type: HistoryEntryType;
  before: CellSnapshot[];
  after: CellSnapshot[];
  mistakeDelta: number;
  scoreDelta: number;
  hintDelta: number;
}

// Plain, Svelte-agnostic game state + rules engine — unit-testable with no
// UI runtime involved. A thin Svelte store wraps a single instance for
// reactivity (see lib/stores/game.ts).
export class GameEngine {
  puzzle: Puzzle;
  grid: Cell[];
  selectedCell: number | null = null;
  notesMode = false;
  mistakes = 0;
  hintsRemaining = STARTING_HINTS;
  score = 0;
  elapsedMs = 0;
  isPaused = false;
  isComplete = false;
  history: HistoryEntry[] = [];
  activeHint: Hint | null = null;
  hintStepIndex = 0;

  constructor(puzzle: Puzzle) {
    this.puzzle = puzzle;
    this.grid = this.buildInitialGrid();
  }

  private buildInitialGrid(): Cell[] {
    return Array.from({ length: 81 }, (_, i) => ({
      value: this.puzzle.givens[i],
      given: this.puzzle.givens[i] !== 0,
      notes: 0,
    }));
  }

  get solution(): Board {
    return this.puzzle.solution;
  }

  // Mistakes are compared against the puzzle's known solution grid, not just
  // local row/col/box constraints (SPEC §13's evidence points to
  // solution-comparison, not pure constraint checking).
  isCellError(index: number): boolean {
    const cell = this.grid[index];
    return cell.value !== 0 && !cell.given && cell.value !== this.solution[index];
  }

  selectCell(index: number): void {
    this.selectedCell = index;
  }

  toggleNotesMode(): void {
    this.notesMode = !this.notesMode;
  }

  private snapshot(index: number): CellSnapshot {
    const cell = this.grid[index];
    return { index, value: cell.value, notes: cell.notes };
  }

  private applySnapshot(snap: CellSnapshot): void {
    const cell = this.grid[snap.index];
    cell.value = snap.value;
    cell.notes = snap.notes;
  }

  // Applies a score change, clamping at zero, and returns the amount that
  // actually applied (used for history bookkeeping).
  private addScore(delta: number): number {
    const before = this.score;
    this.score = Math.max(0, this.score + delta);
    return this.score - before;
  }

  // A bonus for each row/column/box containing `index` that is now fully
  // correct. Only called right after a correct value lands in `index`, so a
  // freshly-completed unit is necessarily this move's doing.
  private unitCompletionBonus(index: number): number {
    const units = [ROW_CELLS[rowOf(index)], COL_CELLS[colOf(index)], BOX_CELLS[boxOf(index)]];
    let bonus = 0;
    for (const unit of units) {
      if (unit.every((i) => this.grid[i].value === this.solution[i])) {
        bonus += UNIT_COMPLETE_BONUS;
      }
    }
    return bonus;
  }

  // Player-facing entry point for a digit keypress/tap: routes to a note
  // toggle or a final-value commit depending on notes mode (SPEC §6).
  enterDigit(index: number, digit: number): void {
    if (this.notesMode) {
      this.toggleNote(index, digit);
    } else {
      this.setValue(index, digit);
    }
  }

  toggleNote(index: number, digit: number): void {
    if (this.isComplete) return;
    const cell = this.grid[index];
    if (cell.given || cell.value !== 0) return; // notes only apply to empty cells
    const before = [this.snapshot(index)];
    cell.notes ^= 1 << (digit - 1);
    const after = [this.snapshot(index)];
    this.history.push({ type: 'toggle-note', before, after, mistakeDelta: 0, scoreDelta: 0, hintDelta: 0 });
  }

  // Clears digit `value`'s pencil mark from every peer of `index` (SPEC §6:
  // committing a final digit clears just that digit's notes from peers,
  // leaving unrelated candidates untouched). This runs for any committed
  // value — right or wrong — since it reflects what's now on the board, not
  // a re-verification of correctness.
  private clearPeerNotes(index: number, value: number): { before: CellSnapshot[]; after: CellSnapshot[] } {
    const bit = 1 << (value - 1);
    const before: CellSnapshot[] = [];
    const after: CellSnapshot[] = [];
    for (const peer of PEERS[index]) {
      const cell = this.grid[peer];
      if (cell.notes & bit) {
        before.push(this.snapshot(peer));
        cell.notes &= ~bit;
        after.push(this.snapshot(peer));
      }
    }
    return { before, after };
  }

  setValue(index: number, value: number): void {
    if (this.isComplete) return;
    const cell = this.grid[index];
    if (cell.given || cell.value === value) return;

    const before = [this.snapshot(index)];
    cell.value = value;
    cell.notes = 0; // committing a final digit clears this cell's own notes too
    const peerClears = this.clearPeerNotes(index, value);
    const after = [this.snapshot(index), ...peerClears.after];

    const correct = value === this.solution[index];
    const mistakeDelta = correct ? 0 : 1;
    this.mistakes += mistakeDelta;

    const scoreDelta = correct
      ? this.addScore(CORRECT_ENTRY_SCORE + this.unitCompletionBonus(index))
      : this.addScore(-MISTAKE_PENALTY);

    this.history.push({
      type: 'set-value',
      before: [...before, ...peerClears.before],
      after,
      mistakeDelta,
      scoreDelta,
      hintDelta: 0,
    });

    this.checkWin();
  }

  erase(index: number): void {
    if (this.isComplete) return;
    const cell = this.grid[index];
    if (cell.given || (cell.value === 0 && cell.notes === 0)) return;
    const before = [this.snapshot(index)];
    cell.value = 0;
    cell.notes = 0;
    const after = [this.snapshot(index)];
    this.history.push({ type: 'erase', before, after, mistakeDelta: 0, scoreDelta: 0, hintDelta: 0 });
  }

  // Undo reverts cell content only. It deliberately never refunds
  // mistakes/score/hint charges: SPEC §8 calls the mistake counter
  // "cumulative" — mistakes are a permanent tally, not reversible board state.
  undo(): void {
    const entry = this.history.pop();
    if (!entry) return;
    for (const snap of entry.before) this.applySnapshot(snap);
  }

  checkWin(): void {
    for (let i = 0; i < 81; i++) {
      if (this.grid[i].value !== this.solution[i]) return;
    }
    this.isComplete = true;
  }

  requestHint(): Hint | null {
    if (this.hintsRemaining <= 0 || this.isComplete) return null;
    const board = Uint8Array.from(this.grid, (c) => c.value) as Board;
    this.activeHint = buildHint(board, this.solution);
    this.hintStepIndex = 0;
    return this.activeHint;
  }

  nextHintStep(): void {
    if (!this.activeHint) return;
    this.hintStepIndex = Math.min(this.hintStepIndex + 1, this.activeHint.steps.length - 1);
  }

  prevHintStep(): void {
    if (!this.activeHint) return;
    this.hintStepIndex = Math.max(this.hintStepIndex - 1, 0);
  }

  cancelHint(): void {
    this.activeHint = null;
    this.hintStepIndex = 0;
  }

  // Commits the currently-displayed hint's target digit as a correct final
  // entry (no mistake risk — it's provably right), consumes a hint charge,
  // and costs points (a hint should never out-earn solving the cell
  // yourself), with the same peer-note-clear behavior as a manual correct
  // entry. A unit completed by the hinted digit still earns its bonus.
  commitHint(): void {
    if (!this.activeHint || this.isComplete) return;
    const { targetCell, value } = this.activeHint;
    const cell = this.grid[targetCell];

    const before = [this.snapshot(targetCell)];
    cell.value = value;
    cell.notes = 0;
    const peerClears = this.clearPeerNotes(targetCell, value);
    const after = [this.snapshot(targetCell), ...peerClears.after];

    this.hintsRemaining -= 1;
    const scoreDelta = this.addScore(-HINT_PENALTY + this.unitCompletionBonus(targetCell));

    this.history.push({
      type: 'hint-commit',
      before: [...before, ...peerClears.before],
      after,
      mistakeDelta: 0,
      scoreDelta,
      hintDelta: -1,
    });

    this.activeHint = null;
    this.hintStepIndex = 0;
    this.checkWin();
  }

  // Resets the current puzzle back to its initial given-cells state (SPEC
  // §5) — a fresh attempt, so mistakes/score/hints/timer reset too.
  restart(): void {
    this.grid = this.buildInitialGrid();
    this.selectedCell = null;
    this.notesMode = false;
    this.mistakes = 0;
    this.hintsRemaining = STARTING_HINTS;
    this.score = 0;
    this.elapsedMs = 0;
    this.isPaused = false;
    this.isComplete = false;
    this.history = [];
    this.activeHint = null;
    this.hintStepIndex = 0;
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  tick(deltaMs: number): void {
    if (this.isPaused || this.isComplete) return;
    this.elapsedMs += deltaMs;
  }
}
