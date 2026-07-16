import { generatePuzzle } from '../sudoku/generator';
import type { Difficulty, Puzzle } from '../sudoku/types';

export interface GenerateRequest {
  id: number;
  difficulty: Difficulty;
}

export interface GenerateResponse {
  id: number;
  puzzle: Puzzle;
}

self.onmessage = (event: MessageEvent<GenerateRequest>) => {
  const { id, difficulty } = event.data;
  const puzzle = generatePuzzle(difficulty);
  const response: GenerateResponse = { id, puzzle };
  (self as unknown as Worker).postMessage(response);
};
