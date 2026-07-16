<script lang="ts">
  import { gameStore } from '../../lib/stores/game.svelte';
  import { boxOf } from '../../lib/sudoku/peers';

  interface Props {
    index: number;
    row: number;
    col: number;
    id: string;
    onSelect: () => void;
  }

  let { index, row, col, id, onSelect }: Props = $props();

  const engine = $derived(gameStore.engine);

  // Read primitives directly off engine.grid[index] rather than memoizing the
  // cell object itself: GameEngine's grid cells are plain mutated-in-place
  // objects, not deeply-reactive $state proxies, so a derived that returns
  // the SAME cell object reference before and after a mutation won't
  // propagate to template reads of its properties (Svelte's `$derived`
  // skips notifying dependents when the recomputed value is reference-equal
  // to the previous one). Deriving primitives sidesteps this: a changed
  // number/boolean is never reference-equal to its old value.
  const value = $derived(engine?.grid[index]?.value ?? 0);
  const given = $derived(engine?.grid[index]?.given ?? false);
  const notes = $derived(engine?.grid[index]?.notes ?? 0);
  const exists = $derived(engine != null);

  const isSelected = $derived(engine?.selectedCell === index);
  const isError = $derived(engine?.isCellError(index) ?? false);

  const hint = $derived(engine?.activeHint ?? null);
  const currentHintStep = $derived(hint?.steps[engine?.hintStepIndex ?? 0]);

  // Peer/same-value context highlighting is about the current selection;
  // while a hint is guiding attention elsewhere, it would just compete with
  // the hint's own highlighting, so suppress it.
  const isPeer = $derived.by(() => {
    if (currentHintStep) return false;
    if (!engine || engine.selectedCell === null || engine.selectedCell === index) return false;
    const sel = engine.selectedCell;
    const selRow = Math.floor(sel / 9);
    const selCol = sel % 9;
    const selBox = Math.floor(selRow / 3) * 3 + Math.floor(selCol / 3);
    const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
    return selRow === row || selCol === col || selBox === box;
  });

  const isSameValue = $derived.by(() => {
    if (currentHintStep) return false;
    if (!engine || engine.selectedCell === null || value === 0) return false;
    if (engine.selectedCell === index) return false;
    const selectedValue = engine.grid[engine.selectedCell].value;
    return selectedValue !== 0 && selectedValue === value;
  });

  const isHighlightedByHint = $derived(currentHintStep?.highlightCells.includes(index) ?? false);
  const isHintTarget = $derived(isHighlightedByHint && hint?.targetCell === index);
  const isHintSupport = $derived(isHighlightedByHint && !isHintTarget);

  const isInHintScope = $derived.by(() => {
    const scope = currentHintStep?.highlightScope;
    if (!scope) return false;
    if (scope.type === 'row') return row === scope.index;
    if (scope.type === 'col') return col === scope.index;
    return boxOf(index) === scope.index;
  });

  const isDimmedByHint = $derived(
    Boolean(currentHintStep?.dimmed) && !isHighlightedByHint && !isInHintScope,
  );

  const ghostValue = $derived(
    hint && currentHintStep && hint.targetCell === index && value === 0
      ? currentHintStep.ghostValue
      : undefined,
  );

  const notesDigits = Array.from({ length: 9 }, (_, i) => i + 1);

  function ariaLabel(): string {
    const position = `Row ${row + 1} column ${col + 1}`;
    if (value === 0) return `${position}, empty`;
    if (given) return `${position}, given ${value}`;
    if (isError) return `${position}, ${value}, incorrect`;
    return `${position}, ${value}`;
  }
</script>

{#if exists}
  <button
    {id}
    type="button"
    role="gridcell"
    aria-rowindex={row + 1}
    aria-colindex={col + 1}
    aria-selected={isSelected}
    aria-disabled={given}
    aria-label={ariaLabel()}
    tabindex={isSelected ? 0 : -1}
    class="cell"
    class:right-edge={col % 3 === 2}
    class:bottom-edge={row % 3 === 2}
    class:given
    class:selected={isSelected}
    class:peer={isPeer}
    class:same-value={isSameValue}
    class:error={isError}
    class:dimmed={isDimmedByHint}
    class:hint-scope={isInHintScope && !isHighlightedByHint}
    class:hint-highlight={isHintSupport}
    class:hint-target={isHintTarget}
    onclick={onSelect}
  >
    {#if value !== 0}
      <span class="value">{value}</span>
    {:else if ghostValue}
      <span class="ghost">{ghostValue}</span>
    {:else if notes !== 0}
      <div class="notes" aria-hidden="true">
        {#each notesDigits as n (n)}
          <span class="note">{notes & (1 << (n - 1)) ? n : ''}</span>
        {/each}
      </div>
    {/if}
  </button>
{/if}

<style>
  .cell {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1;
    width: 100%;
    min-width: 0;
    min-height: 0;
    border: 1px solid var(--board-line, #ccc);
    background: var(--cell-bg, #fff);
    color: var(--cell-fg, #1a1a1a);
    font-size: clamp(0.9rem, 4.2vw, 1.6rem);
    font-family: inherit;
    cursor: pointer;
    padding: 0;
  }

  .cell.right-edge {
    border-right: 2px solid var(--board-line-strong, #333);
  }

  .cell.bottom-edge {
    border-bottom: 2px solid var(--board-line-strong, #333);
  }

  .cell.given {
    cursor: default;
  }

  .cell.peer {
    background: var(--cell-peer-bg, #eaf1fb);
  }

  .cell.same-value {
    background: var(--cell-samevalue-bg, #d6e6fb);
  }

  .cell.selected {
    background: var(--cell-selected-bg, #bcd8ff);
    outline: 2px solid var(--cell-selected-outline, #1b6ef3);
    outline-offset: -2px;
  }

  .cell.error {
    color: var(--cell-error-fg, #d33);
  }

  /* Fade only the digit/notes, not the cell chrome, so the grid lines stay
     crisp instead of turning blotchy where dimmed and highlighted cells meet. */
  .cell.dimmed .value,
  .cell.dimmed .notes {
    opacity: 0.3;
  }

  .cell.hint-scope {
    background: var(--cell-hint-scope-bg, #fbf1d8);
  }

  .cell.hint-highlight {
    background: var(--cell-hint-bg, #f7dfa0);
  }

  .cell.hint-target {
    background: var(--cell-hint-target-bg, #f5c451);
    outline: 2px solid var(--cell-hint-target-outline, #c98a0e);
    outline-offset: -2px;
  }

  .value {
    font-weight: 700;
    line-height: 1;
  }

  .ghost {
    line-height: 1;
    color: var(--cell-ghost-fg, #1b6ef3);
    opacity: 0.6;
  }

  .notes {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    width: 100%;
    height: 100%;
    padding: 2px;
  }

  .note {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.55em;
    color: var(--cell-note-fg, #666);
    line-height: 1;
  }
</style>
