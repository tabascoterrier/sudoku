import { computeCandidates, digitBit, digitsInMask, popcount } from './candidates';
import { BOX_CELLS, COL_CELLS, PEERS, ROW_CELLS } from './peers';
import type { Board } from './types';

export type ScopeType = 'row' | 'col' | 'box';

export interface Scope {
  type: ScopeType;
  index: number;
}

export type TechniqueName = 'naked-single' | 'hidden-single' | null;

export interface HintStep {
  title: string;
  body: string;
  dimmed: boolean;
  highlightCells: number[];
  highlightScope?: Scope;
  ghostValue?: number;
}

export interface Hint {
  technique: TechniqueName;
  targetCell: number;
  value: number;
  steps: [HintStep, HintStep];
}

export interface NakedSingleResult {
  cell: number;
  value: number;
}

// Naked single ("Only Choice"): an empty cell with exactly one remaining candidate.
export function findNakedSingle(board: Board): NakedSingleResult | null {
  const candidates = computeCandidates(board);
  for (let i = 0; i < 81; i++) {
    if (board[i] !== 0) continue;
    const mask = candidates[i];
    if (popcount(mask) === 1) {
      return { cell: i, value: digitsInMask(mask)[0] };
    }
  }
  return null;
}

export interface HiddenSingleResult {
  cell: number;
  value: number;
  scope: Scope;
}

const SCOPE_CELL_LISTS: Record<ScopeType, readonly number[][]> = {
  row: ROW_CELLS,
  col: COL_CELLS,
  box: BOX_CELLS,
};

function cellsForScope(scope: Scope): readonly number[] {
  return SCOPE_CELL_LISTS[scope.type][scope.index];
}

// Hidden single ("Last Remaining Cell"): a digit with exactly one legal empty
// cell left within some row/column/box, even if that cell has other
// candidates too.
export function findHiddenSingle(board: Board): HiddenSingleResult | null {
  const candidates = computeCandidates(board);
  for (const type of ['row', 'col', 'box'] as const) {
    const cellsList = SCOPE_CELL_LISTS[type];
    for (let index = 0; index < 9; index++) {
      const cells = cellsList[index];
      for (let d = 1; d <= 9; d++) {
        const bit = digitBit(d);
        let matchCell = -1;
        let count = 0;
        for (const cell of cells) {
          if (board[cell] !== 0) continue;
          if (candidates[cell] & bit) {
            count++;
            matchCell = cell;
          }
        }
        if (count === 1) {
          return { cell: matchCell, value: d, scope: { type, index } };
        }
      }
    }
  }
  return null;
}

// Whether `board` can be fully completed using only naked/hidden singles —
// the same two techniques the hint system names — with no guessing or more
// advanced deduction required. Used by the generator to keep Easy puzzles
// solvable by beginners, not just uniquely solvable by brute force.
export function isSolvableByBasicTechniques(board: Board): boolean {
  const working = board.slice() as Board;
  for (;;) {
    const naked = findNakedSingle(working);
    if (naked) {
      working[naked.cell] = naked.value;
      continue;
    }
    const hidden = findHiddenSingle(working);
    if (hidden) {
      working[hidden.cell] = hidden.value;
      continue;
    }
    break;
  }
  return working.every((v) => v !== 0);
}

function scopeLabel(type: ScopeType): string {
  if (type === 'row') return 'row';
  if (type === 'col') return 'column';
  return 'block';
}

function placedDigitCells(board: Board, value: number): number[] {
  const cells: number[] = [];
  for (let i = 0; i < 81; i++) if (board[i] === value) cells.push(i);
  return cells;
}

// No naked/hidden single exists at this board state (most likely on Expert
// puzzles, which aren't guaranteed solvable via singles alone at every step).
// Picks the empty cell with the fewest remaining candidates as a reasonable
// "next" cell to reveal.
function findFallbackCell(board: Board): number {
  const candidates = computeCandidates(board);
  let bestCell = -1;
  let bestCount = 10;
  for (let i = 0; i < 81; i++) {
    if (board[i] !== 0) continue;
    const count = popcount(candidates[i]);
    if (count < bestCount) {
      bestCount = count;
      bestCell = i;
    }
  }
  return bestCell;
}

// Builds the 2-step guided hint walkthrough (SPEC §7). Tries naked single,
// then hidden single; if neither named technique applies, honestly falls
// back to a generic reveal rather than claiming a technique that wasn't used.
export function buildHint(board: Board, solution: Board): Hint {
  const naked = findNakedSingle(board);
  if (naked) {
    const { cell, value } = naked;
    return {
      technique: 'naked-single',
      targetCell: cell,
      value,
      steps: [
        {
          title: 'Only Choice',
          body: `This cell has only one possible candidate remaining: ${value}. Every other digit already appears among its highlighted row, column, or box peers.`,
          dimmed: true,
          highlightCells: [cell, ...PEERS[cell]],
        },
        {
          title: 'Only Choice',
          body: `Since it is the only possible option, this cell must be ${value}.`,
          dimmed: true,
          highlightCells: [cell],
          ghostValue: value,
        },
      ],
    };
  }

  const hidden = findHiddenSingle(board);
  if (hidden) {
    const { cell, value, scope } = hidden;
    const label = scopeLabel(scope.type);
    return {
      technique: 'hidden-single',
      targetCell: cell,
      value,
      steps: [
        {
          title: 'Last Remaining Cell',
          body: `In this ${label}, there is only one cell remaining that can contain ${value}.`,
          dimmed: true,
          highlightCells: [...cellsForScope(scope), ...placedDigitCells(board, value)],
          highlightScope: scope,
        },
        {
          title: 'Last Remaining Cell',
          body: `Since it is the only possible option, this cell must be ${value}.`,
          dimmed: true,
          highlightCells: [cell],
          highlightScope: scope,
          ghostValue: value,
        },
      ],
    };
  }

  const cell = findFallbackCell(board);
  const value = solution[cell];
  return {
    technique: null,
    targetCell: cell,
    value,
    steps: [
      {
        title: 'Next Step',
        body: 'This one needs a more advanced technique than we can walk through step by step — let’s just fill it in.',
        dimmed: false,
        highlightCells: [cell],
      },
      {
        title: 'Next Step',
        body: 'Here is the correct value for this cell.',
        dimmed: false,
        highlightCells: [cell],
        ghostValue: value,
      },
    ],
  };
}
