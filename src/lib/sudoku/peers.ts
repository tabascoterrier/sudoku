export function rowOf(i: number): number {
  return Math.floor(i / 9);
}

export function colOf(i: number): number {
  return i % 9;
}

export function boxOf(i: number): number {
  return Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);
}

export const ROW_CELLS: readonly number[][] = Array.from({ length: 9 }, (_, r) =>
  Array.from({ length: 9 }, (_, c) => r * 9 + c),
);

export const COL_CELLS: readonly number[][] = Array.from({ length: 9 }, (_, c) =>
  Array.from({ length: 9 }, (_, r) => r * 9 + c),
);

export const BOX_CELLS: readonly number[][] = Array.from({ length: 9 }, (_, b) => {
  const boxRow = Math.floor(b / 3) * 3;
  const boxCol = (b % 3) * 3;
  const cells: number[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      cells.push((boxRow + r) * 9 + (boxCol + c));
    }
  }
  return cells;
});

// All cells sharing a row, column, or box with cell i (excluding i itself).
export const PEERS: readonly number[][] = Array.from({ length: 81 }, (_, i) => {
  const set = new Set<number>();
  for (const c of ROW_CELLS[rowOf(i)]) if (c !== i) set.add(c);
  for (const c of COL_CELLS[colOf(i)]) if (c !== i) set.add(c);
  for (const c of BOX_CELLS[boxOf(i)]) if (c !== i) set.add(c);
  return Array.from(set);
});
