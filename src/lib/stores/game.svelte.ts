import { GameEngine } from '../sudoku/gameEngine';
import type { Cell, Difficulty, Puzzle } from '../sudoku/types';
import { requestPuzzle } from '../worker/workerClient';

const SAVE_KEY = 'sudoku:save';

interface SavedGame {
  puzzle: { id: string; difficulty: Difficulty; givens: number[]; solution: number[]; actualGivens: number };
  grid: Cell[];
  mistakes: number;
  score: number;
  elapsedMs: number;
  notesMode: boolean;
  isComplete: boolean;
}

function serialize(engine: GameEngine): SavedGame {
  return {
    puzzle: {
      id: engine.puzzle.id,
      difficulty: engine.puzzle.difficulty,
      givens: Array.from(engine.puzzle.givens),
      solution: Array.from(engine.puzzle.solution),
      actualGivens: engine.puzzle.actualGivens,
    },
    grid: engine.grid.map((c) => ({ ...c })),
    mistakes: engine.mistakes,
    score: engine.score,
    elapsedMs: engine.elapsedMs,
    notesMode: engine.notesMode,
    isComplete: engine.isComplete,
  };
}

// Undo history is deliberately not persisted — a reload keeps your board
// progress but starts a fresh undo stack, a common and acceptable simplification.
function hydrate(saved: SavedGame): GameEngine {
  const puzzle: Puzzle = {
    id: saved.puzzle.id,
    difficulty: saved.puzzle.difficulty,
    givens: Uint8Array.from(saved.puzzle.givens),
    solution: Uint8Array.from(saved.puzzle.solution),
    actualGivens: saved.puzzle.actualGivens,
  };
  const engine = new GameEngine(puzzle);
  engine.grid = saved.grid.map((c) => ({ ...c }));
  engine.mistakes = saved.mistakes;
  engine.score = saved.score;
  engine.elapsedMs = saved.elapsedMs;
  engine.notesMode = saved.notesMode;
  engine.isComplete = saved.isComplete;
  return engine;
}

function loadSaved(difficulty: Difficulty): GameEngine | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const saved: SavedGame = JSON.parse(raw);
    if (saved.puzzle.difficulty !== difficulty) return null;
    return hydrate(saved);
  } catch {
    return null;
  }
}

function persist(engine: GameEngine): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(serialize(engine)));
  } catch {
    // localStorage unavailable/full — persistence is a nicety, not required for gameplay.
  }
}

class GameStore {
  engine = $state<GameEngine | null>(null);
  isGenerating = $state(false);

  private requestToken = 0;
  private timerHandle: ReturnType<typeof setInterval> | null = null;

  // Loads a saved in-progress puzzle for this difficulty if one exists,
  // otherwise generates a fresh one via the worker. `forceNew` skips the
  // saved-game check (used by "New Game").
  async loadPuzzle(difficulty: Difficulty, forceNew = false): Promise<void> {
    if (!forceNew) {
      const saved = loadSaved(difficulty);
      if (saved) {
        this.setEngine(saved);
        return;
      }
    }

    const token = ++this.requestToken;
    this.isGenerating = true;
    const puzzle = await requestPuzzle(difficulty);
    if (token !== this.requestToken) return; // superseded by a newer request
    this.isGenerating = false;
    this.setEngine(new GameEngine(puzzle));
  }

  private setEngine(engine: GameEngine): void {
    this.engine = engine;
    this.startTimer();
    this.save();
  }

  private startTimer(): void {
    if (this.timerHandle) clearInterval(this.timerHandle);
    let last = Date.now();
    this.timerHandle = setInterval(() => {
      const now = Date.now();
      const delta = now - last;
      last = now;
      this.engine?.tick(delta);
      this.touch();
      this.save();
    }, 1000);
  }

  save(): void {
    if (this.engine) persist(this.engine);
  }

  // GameEngine is a plain, Svelte-agnostic class (so it stays unit-testable
  // in Vitest with no Svelte runtime involved) — Svelte 5's `$state` deep-
  // proxies plain objects/arrays but treats custom class instances as
  // opaque, so mutating its internals doesn't trigger reactivity on its own.
  // Every store method that mutates the engine re-stamps the `engine` field
  // with a new object identity (same prototype, same — now-mutated — own
  // properties) afterwards so components reading `gameStore.engine.*`
  // re-render with the fresh values.
  private touch(): void {
    if (!this.engine) return;
    this.engine = Object.assign(Object.create(Object.getPrototypeOf(this.engine)), this.engine);
  }

  enterDigit(index: number, digit: number): void {
    this.engine?.enterDigit(index, digit);
    this.touch();
    this.save();
  }

  erase(index: number): void {
    this.engine?.erase(index);
    this.touch();
    this.save();
  }

  undo(): void {
    this.engine?.undo();
    this.touch();
    this.save();
  }

  toggleNotesMode(): void {
    this.engine?.toggleNotesMode();
    this.touch();
    this.save();
  }

  selectCell(index: number): void {
    this.engine?.selectCell(index);
    this.touch();
  }

  togglePaintMode(): void {
    this.engine?.togglePaintMode();
    this.touch();
  }

  selectPaintDigit(digit: number): void {
    this.engine?.selectPaintDigit(digit);
    this.touch();
  }

  paintCell(index: number): void {
    this.engine?.paintCell(index);
    this.touch();
    this.save();
  }

  requestHint() {
    const hint = this.engine?.requestHint() ?? null;
    this.touch();
    this.save();
    return hint;
  }

  nextHintStep(): void {
    this.engine?.nextHintStep();
    this.touch();
  }

  prevHintStep(): void {
    this.engine?.prevHintStep();
    this.touch();
  }

  cancelHint(): void {
    this.engine?.cancelHint();
    this.touch();
  }

  commitHint(): void {
    this.engine?.commitHint();
    this.touch();
    this.save();
  }

  restart(): void {
    this.engine?.restart();
    this.touch();
    this.save();
  }

  pause(): void {
    this.engine?.pause();
    this.touch();
  }

  resume(): void {
    this.engine?.resume();
    this.touch();
  }
}

export const gameStore = new GameStore();
