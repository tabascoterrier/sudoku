<script lang="ts">
  import { gameStore } from '../../lib/stores/game.svelte';
  import Cell from './Cell.svelte';

  let liveMessage = $state('');

  const rows = Array.from({ length: 9 }, (_, i) => i);
  const cols = Array.from({ length: 9 }, (_, i) => i);

  function cellId(index: number): string {
    return `sudoku-cell-${index}`;
  }

  function focusCell(index: number): void {
    document.getElementById(cellId(index))?.focus();
  }

  function selectCell(index: number): void {
    const engine = gameStore.engine;
    if (!engine || engine.isPaused) return;
    if (engine.paintMode && engine.paintDigit != null) {
      gameStore.paintCell(index);
      announce(index);
    } else {
      gameStore.selectCell(index);
    }
    focusCell(index);
  }

  function announce(index: number): void {
    const engine = gameStore.engine;
    if (!engine) return;
    const cell = engine.grid[index];
    if (cell.value === 0) {
      liveMessage = 'Cell cleared.';
    } else if (engine.isCellError(index)) {
      liveMessage = `Mistake: ${cell.value} is incorrect here.`;
    } else {
      liveMessage = `${cell.value} entered.`;
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    const engine = gameStore.engine;
    if (!engine || engine.isPaused || engine.selectedCell === null) return;
    const index = engine.selectedCell;
    const row = Math.floor(index / 9);
    const col = index % 9;

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      let nextRow = row;
      let nextCol = col;
      if (event.key === 'ArrowUp') nextRow = (row + 8) % 9;
      if (event.key === 'ArrowDown') nextRow = (row + 1) % 9;
      if (event.key === 'ArrowLeft') nextCol = (col + 8) % 9;
      if (event.key === 'ArrowRight') nextCol = (col + 1) % 9;
      selectCell(nextRow * 9 + nextCol);
      return;
    }

    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      gameStore.erase(index);
      announce(index);
      return;
    }

    if (event.key >= '1' && event.key <= '9') {
      event.preventDefault();
      gameStore.enterDigit(index, Number(event.key));
      announce(index);
    }
  }
</script>

{#if gameStore.engine}
  <div
    class="board"
    role="grid"
    tabindex="-1"
    aria-label="Sudoku board"
    aria-rowcount="9"
    aria-colcount="9"
    onkeydown={handleKeydown}
  >
    {#each rows as row (row)}
      <div role="row" class="board-row">
        {#each cols as col (col)}
          {@const index = row * 9 + col}
          <Cell {index} {row} {col} id={cellId(index)} onSelect={() => { selectCell(index); }} />
        {/each}
      </div>
    {/each}
  </div>
  <div class="sr-only" role="status" aria-live="polite">{liveMessage}</div>
{/if}

<style>
  .board {
    display: grid;
    /* minmax(0, 1fr), not bare 1fr: bare 1fr tracks default to
       minmax(auto, 1fr), so a cell's content (e.g. the 3x3 notes grid) can
       inflate its whole row/column past its equal share. Safari's
       min-content estimate for that nested grid text runs slightly larger
       than Chrome's, so only Safari visibly bulges — clamping the track
       minimum to 0 makes every row/column exactly equal regardless. */
    grid-template-rows: repeat(9, minmax(0, 1fr));
    width: min(100%, 540px);
    aspect-ratio: 1;
    margin-inline: auto;
    border: 2px solid var(--board-line-strong, #333);
    background: var(--board-bg, #fff);
  }

  .board-row {
    display: grid;
    grid-template-columns: repeat(9, minmax(0, 1fr));
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
