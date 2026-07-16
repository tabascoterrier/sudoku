<script lang="ts">
  import { gameStore } from '../../lib/stores/game.svelte';

  const engine = $derived(gameStore.engine);
  const hasSelection = $derived(engine?.selectedCell != null);

  const digits = Array.from({ length: 9 }, (_, i) => i + 1);

  function pressDigit(digit: number): void {
    if (engine?.selectedCell == null) return;
    gameStore.enterDigit(engine.selectedCell, digit);
  }
</script>

<div class="number-pad" role="group" aria-label="Number pad">
  {#each digits as digit (digit)}
    <button type="button" class="digit" onclick={() => pressDigit(digit)} disabled={!hasSelection} aria-label={`Enter ${digit}`}>
      {digit}
    </button>
  {/each}
</div>

<style>
  .number-pad {
    display: grid;
    grid-template-columns: repeat(9, 1fr);
    gap: 0.35rem;
    width: min(100%, 540px);
    margin-inline: auto;
  }

  .digit {
    aspect-ratio: 1;
    font-size: clamp(1rem, 3.5vw, 1.4rem);
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

  .digit:not(:disabled):hover {
    background: var(--control-bg-hover, #eef4ff);
  }
</style>
