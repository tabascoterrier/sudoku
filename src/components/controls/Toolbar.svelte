<script lang="ts">
  import { gameStore } from '../../lib/stores/game.svelte';

  const engine = $derived(gameStore.engine);
  const notesMode = $derived(engine?.notesMode ?? false);
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

  <button type="button" class="tool" onclick={handleHint} disabled={isPaused || isGameOver}>
    <span class="icon" aria-hidden="true">💡</span>
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

  .tool:disabled {
    opacity: 0.35;
    cursor: default;
  }

  .tool:not(:disabled):hover {
    background: var(--control-bg-hover, #eef4ff);
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
</style>
