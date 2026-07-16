import type { Difficulty, Puzzle } from '../sudoku/types';
import type { GenerateRequest, GenerateResponse } from './generator.worker';

interface PendingEntry {
  resolve: (puzzle: Puzzle) => void;
  reject: (error: unknown) => void;
}

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, PendingEntry>();

function getWorker(): Worker {
  if (worker) return worker;

  worker = new Worker(new URL('./generator.worker.ts', import.meta.url), { type: 'module' });

  worker.onmessage = (event: MessageEvent<GenerateResponse>) => {
    const { id, puzzle } = event.data;
    const entry = pending.get(id);
    if (!entry) return; // no one is waiting on this id anymore
    pending.delete(id);
    entry.resolve(puzzle);
  };

  worker.onerror = (event) => {
    for (const [id, entry] of pending) {
      entry.reject(event.error ?? new Error(event.message));
      pending.delete(id);
    }
  };

  return worker;
}

// Each call is tagged with a unique id so responses (which may arrive out of
// order if requests overlap) resolve the correct caller's promise. Callers
// that only care about the most recent request (e.g. the game store, when
// the user rapidly changes difficulty) are responsible for discarding a
// resolved-but-now-stale result themselves — this client just guarantees
// every request's own promise resolves with its own matching response.
export function requestPuzzle(difficulty: Difficulty): Promise<Puzzle> {
  const id = nextId++;
  const request: GenerateRequest = { id, difficulty };
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getWorker().postMessage(request);
  });
}
