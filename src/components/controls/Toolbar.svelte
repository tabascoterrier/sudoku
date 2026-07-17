<script lang="ts">
  import { gameStore } from '../../lib/stores/game.svelte';

  const engine = $derived(gameStore.engine);
  const notesMode = $derived(engine?.notesMode ?? false);
  const paintMode = $derived(engine?.paintMode ?? false);
  const canUndo = $derived((engine?.history.length ?? 0) > 0);
  const hasSelection = $derived(engine?.selectedCell != null);
  const isPaused = $derived(engine?.isPaused ?? false);
  const isGameOver = $derived(engine?.isComplete ?? false);

  function handleErase(): void {
    if (engine?.selectedCell != null) gameStore.erase(engine.selectedCell);
  }

  function handleHint(): void {
    gameStore.requestHint();
  }

  function handlePauseToggle(): void {
    if (isPaused) gameStore.resume();
    else gameStore.pause();
  }
</script>

<div class="toolbar" role="toolbar" aria-label="Game controls">
  <button type="button" class="tool" onclick={() => gameStore.undo()} disabled={!canUndo || isPaused}>
    <span class="icon" aria-hidden="true">↺</span>
    <span class="label">Undo</span>
  </button>

  <button type="button" class="tool" onclick={handleErase} disabled={!hasSelection || isPaused}>
    <span class="icon" aria-hidden="true">⌫</span>
    <span class="label">Eraser</span>
  </button>

  <button
    type="button"
    class="tool"
    class:active={notesMode}
    onclick={() => gameStore.toggleNotesMode()}
    aria-pressed={notesMode}
    disabled={isPaused || isGameOver}
  >
    <span class="icon" aria-hidden="true">✎</span>
    <span class="label">Notes</span>
  </button>

  <button
    type="button"
    class="tool"
    class:active={paintMode}
    onclick={() => gameStore.togglePaintMode()}
    aria-pressed={paintMode}
    disabled={isPaused || isGameOver}
  >
    <!-- Paintbrush has no text-presentation variant (unlike ✎/⏸ below), so
         U+FE0E can't force it monochrome — iOS always renders it in color.
         Use an outline SVG with currentColor instead, to match the other
         toolbar icons' plain outline style. -->
    <span class="icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 21c1-4 2-6 4-7l9-9a2 2 0 0 1 3 3l-9 9c-1 2-3 3-7 4Z" />
        <path d="M14 6l4 4" />
      </svg>
    </span>
    <span class="label">Paint</span>
  </button>

  <button type="button" class="tool" onclick={handleHint} disabled={isPaused || isGameOver}>
    <!-- Light bulb is emoji-only (no text-presentation variant), so it
         always renders in color on iOS. Use an outline SVG with
         currentColor instead, same reasoning as the paint icon above. -->
    <span class="icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 18h6M10 21h4" />
        <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.46 1.1 1.24 1.1 2.2h5c0-.96.5-1.74 1.1-2.2A6 6 0 0 0 12 3Z" />
      </svg>
    </span>
    <span class="label">Hint</span>
  </button>

  <button type="button" class="tool" onclick={handlePauseToggle} disabled={isGameOver}>
    <!-- U+FE0E forces plain text-style glyphs: ⏸ in particular defaults to
         a colorful emoji presentation on iOS (a filled rounded-square icon)
         that clashes with the other toolbar icons' plain outline style. -->
    <span class="icon" aria-hidden="true">{isPaused ? '▶︎' : '⏸︎'}</span>
    <span class="label">{isPaused ? 'Resume' : 'Pause'}</span>
  </button>
</div>

<style>
  .toolbar {
    display: flex;
    justify-content: space-between;
    gap: 0.4rem;
    width: min(100%, 540px);
    margin-inline: auto;
  }

  /* A single row of 6 tools doesn't fit the narrow right-hand column of the
     landscape layout — wrapping into 3 columns keeps each tool a legible
     size instead of squeezing all 6 into ~250px of width. Capped at
     max-width rather than the column's full width: this breakpoint also
     covers tablet-width columns (e.g. a 1024x768 iPad), where stretching
     to fill would space the 6 tools out across the whole column instead
     of keeping them a compact, thumb-reachable cluster. */
  @media (orientation: landscape) and (max-height: 900px) {
    .toolbar {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.3rem;
      width: 100%;
      max-width: 20rem;
      justify-self: center;
    }
  }

  .tool {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    flex: 1;
    padding: 0.4rem 0.2rem;
    border: none;
    background: transparent;
    color: var(--control-fg, #1a1a1a);
    cursor: pointer;
    border-radius: 0.4rem;
  }

  /* Two rows of icon+label in the landscape side column have to fit
     alongside the stats row and the number pad, not just each other —
     shrink the icon/label/padding so both rows stay compact. */
  @media (orientation: landscape) and (max-height: 900px) {
    .tool {
      gap: 0.05rem;
      padding: 0.1rem 0.1rem;
    }
  }

  .tool:disabled {
    opacity: 0.35;
    cursor: default;
  }

  /* Guarded to real hover-capable pointers: on touch devices, tapping a
     button applies :hover with no matching mouseleave to clear it, so the
     highlight sticks around until an unrelated tap bumps it off. */
  @media (hover: hover) {
    .tool:not(:disabled):hover {
      background: var(--control-bg-hover, #eef4ff);
    }
  }

  .tool.active {
    color: var(--accent, #1b6ef3);
  }

  .tool.active .icon {
    background: var(--accent, #1b6ef3);
    color: #fff;
    border-radius: 50%;
  }

  .icon {
    font-size: 1.2rem;
    width: 1.8rem;
    height: 1.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .label {
    font-size: 0.7rem;
  }

  @media (orientation: landscape) and (max-height: 900px) {
    .icon {
      font-size: 1rem;
      width: 1.4rem;
      height: 1.4rem;
    }

    .label {
      font-size: 0.6rem;
    }
  }
</style>
