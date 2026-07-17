<script lang="ts">
  import { gameStore } from '../../lib/stores/game.svelte';

  const engine = $derived(gameStore.engine);
  const hasSelection = $derived(engine?.selectedCell != null);
  const paintMode = $derived(engine?.paintMode ?? false);
  const paintDigit = $derived(engine?.paintDigit ?? null);

  const digits = Array.from({ length: 9 }, (_, i) => i + 1);

  // In paint mode, a digit press loads (or lifts) the pen instead of
  // requiring a selected cell — the cell comes from the board tap that
  // follows, not from `engine.selectedCell`.
  function pressDigit(digit: number): void {
    if (paintMode) {
      gameStore.selectPaintDigit(digit);
      return;
    }
    if (engine?.selectedCell == null) return;
    gameStore.enterDigit(engine.selectedCell, digit);
  }

  function digitLabel(digit: number): string {
    if (!paintMode) return `Enter ${digit}`;
    return paintDigit === digit ? `Stop painting ${digit}` : `Paint with ${digit}`;
  }
</script>

<div class="number-pad" role="group" aria-label="Number pad">
  {#each digits as digit (digit)}
    <button
      type="button"
      class="digit"
      class:paint-loaded={paintMode && paintDigit === digit}
      onclick={() => pressDigit(digit)}
      disabled={!paintMode && !hasSelection}
      aria-pressed={paintMode ? paintDigit === digit : undefined}
      aria-label={digitLabel(digit)}
    >
      {digit}
    </button>
  {/each}
</div>

<style>
  .number-pad {
    display: grid;
    /* minmax(0, 1fr), not bare 1fr: bare 1fr defaults to minmax(auto, 1fr),
       which lets a track grow past its equal share to fit an item's content. */
    grid-template-columns: repeat(9, minmax(0, 1fr));
    gap: 0.35rem;
    width: min(100%, 540px);
    margin-inline: auto;
  }

  .digit {
    /* Width tracks the grid column (no aspect-ratio) so on narrow phones,
       where 9-across leaves little width per button, min-height can floor
       the tap target using the ample vertical space below the board without
       aspect-ratio dragging width up to match — buttons become a comfortable
       rectangle on mobile and stay near-square on wider boards. */
    width: 100%;
    min-height: 3rem;
    font-size: clamp(1.2rem, 3.5vw, 1.4rem);
    font-weight: 600;
    border: 1px solid var(--control-border, #ccc);
    border-radius: 0.4rem;
    background: var(--control-bg, #fff);
    color: var(--control-fg, #1a1a1a);
    cursor: pointer;
  }

  .digit:disabled {
    opacity: 0.4;
    cursor: default;
  }

  /* Guarded to real hover-capable pointers — see Toolbar.svelte for why. */
  @media (hover: hover) {
    .digit:not(:disabled):hover {
      background: var(--control-bg-hover, #eef4ff);
    }
  }

  .digit.paint-loaded {
    background: var(--accent, #1b6ef3);
    border-color: var(--accent, #1b6ef3);
    color: #fff;
  }
</style>
