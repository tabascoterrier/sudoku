<script lang="ts">
  import { gameStore } from '../../lib/stores/game.svelte';

  const engine = $derived(gameStore.engine);
  const mistakes = $derived(engine?.mistakes ?? 0);
  const score = $derived(engine?.score ?? 0);
  const elapsedMs = $derived(engine?.elapsedMs ?? 0);
  const isPaused = $derived(engine?.isPaused ?? false);

  const timeLabel = $derived.by(() => {
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });
</script>

<div class="status-bar">
  <div class="stat score" aria-label="Score">
    <span class="icon" aria-hidden="true">🏆</span>
    <span>{score}</span>
  </div>
  <div class="stat mistakes" aria-label="Mistakes">
    <span class="stat-title">Mistakes</span>
    <span>{mistakes}</span>
  </div>
  <div class="stat time" aria-label="Time elapsed">
    <span class="stat-title">Time</span>
    <span>{isPaused ? '⏸' : timeLabel}</span>
  </div>
</div>

<style>
  .status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: min(100%, 540px);
    margin-inline: auto;
    padding-block: 0.25rem;
    font-variant-numeric: tabular-nums;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1rem;
    font-size: 0.95rem;
    color: var(--control-fg, #1a1a1a);
  }

  .stat-title {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--muted-fg, #777);
  }

  .score {
    flex-direction: row;
    gap: 0.3rem;
  }
</style>
