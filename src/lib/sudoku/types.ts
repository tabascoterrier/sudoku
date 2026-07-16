export type Board = Uint8Array; // length 81, 0 = empty, 1-9 = digit

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface Cell {
  value: number; // 0 = empty
  given: boolean;
  notes: number; // 9-bit bitmask, bit (d-1) set means digit d is pencil-marked
}

export interface Puzzle {
  id: string;
  difficulty: Difficulty;
  givens: Board;
  solution: Board;
  actualGivens: number;
}
