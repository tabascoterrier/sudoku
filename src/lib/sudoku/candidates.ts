import { PEERS } from './peers';
import type { Board } from './types';

export const FULL_MASK = 0b1_1111_1111; // bits 0..8 = digits 1..9

export function digitBit(d: number): number {
  return 1 << (d - 1);
}

export function popcount(mask: number): number {
  let count = 0;
  let m = mask;
  while (m) {
    m &= m - 1;
    count++;
  }
  return count;
}

export function digitsInMask(mask: number): number[] {
  const out: number[] = [];
  for (let d = 1; d <= 9; d++) if (mask & digitBit(d)) out.push(d);
  return out;
}

// Candidate bitmask per cell: which digits are not already used by any peer.
// Filled cells get a mask of 0.
export function computeCandidates(board: Board): Int16Array {
  const candidates = new Int16Array(81);
  for (let i = 0; i < 81; i++) {
    if (board[i] !== 0) continue;
    let mask = FULL_MASK;
    for (const p of PEERS[i]) {
      if (board[p] !== 0) mask &= ~digitBit(board[p]);
    }
    candidates[i] = mask & FULL_MASK;
  }
  return candidates;
}
