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

  /* 9-across no longer fits comfortably once the number pad is squeezed
     into the narrow right-hand column of the landscape layout — 3x3 keeps
     each button a legible, tappable size. height:100% still lets it shrink
     to fit a short phone column's modest leftover space, but max-height
     caps how far it can grow on a tablet-tall column (this same breakpoint
     also covers e.g. a 1024x768 iPad) — otherwise filling that leftover
     1fr row would blow each button up to an oversized square. (Deliberately
     not aspect-ratio: 1 — that would force the height to follow the
     width even on a narrow-but-short phone column, overflowing it.) */
  @media (orientation: landscape) and (max-height: 900px) {
    .number-pad {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      grid-template-rows: repeat(3, minmax(0, 1fr));
      gap: 0.25rem;
      width: 100%;
      max-width: 20rem;
      height: 100%;
      max-height: 20rem;
      justify-self: center;
      /* The numpad's row is 1fr so the board (which spans all three
         right-column rows) can reach its full height — on a tablet-tall
         column that leaves a lot of slack in this row. Docking to the
         bottom keeps the numpad snug against the toolbar below it instead
         of floating centered with a gap on both sides. */
      align-self: end;
    }
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

  /* The 3rem floor above assumes ample height below the board — not true in
     landscape, where the pad's whole 3-row height has to fit next to it.
     Let each button fill its grid cell and fall back to a much smaller
     floor only as a last resort, instead of forcing an overflow. */
  @media (orientation: landscape) and (max-height: 900px) {
    .digit {
      height: 100%;
      min-height: 1.5rem;
      font-size: clamp(1rem, 3vw, 1.3rem);
    }
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
