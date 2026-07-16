<script lang="ts">
  import Modal from './Modal.svelte';
  import { gameStore } from '../../lib/stores/game.svelte';

  interface Props {
    onNewGame: () => void;
  }

  let { onNewGame }: Props = $props();

  const engine = $derived(gameStore.engine);
  const mistakes = $derived(engine?.mistakes ?? 0);
  const score = $derived(engine?.score ?? 0);
  const elapsedMs = $derived(engine?.elapsedMs ?? 0);

  const timeLabel = $derived.by(() => {
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });
</script>

<Modal labelledBy="win-title">
  <h2 id="win-title">Congratulations!</h2>
  <p class="subtitle">You solved the puzzle.</p>

  <dl class="stats">
    <div class="stat">
      <dt>Time</dt>
      <dd>{timeLabel}</dd>
    </div>
    <div class="stat">
      <dt>Mistakes</dt>
      <dd>{mistakes}</dd>
    </div>
    <div class="stat">
      <dt>Score</dt>
      <dd>{score}</dd>
    </div>
  </dl>

  <button type="button" class="primary" onclick={onNewGame}>New Game</button>
</Modal>

<style>
  h2 {
    margin: 0 0 0.25rem 0;
    font-size: 1.4rem;
  }

  .subtitle {
    margin: 0 0 1.25rem 0;
    color: var(--muted-fg, #777);
  }

  .stats {
    display: flex;
    justify-content: space-between;
    margin: 0 0 1.5rem 0;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
  }

  .stat dt {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--muted-fg, #777);
  }

  .stat dd {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 700;
  }

  .primary {
    width: 100%;
    padding: 0.75rem;
    border-radius: 0.5rem;
    border: none;
    background: var(--accent, #1b6ef3);
    color: #fff;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
  }
</style>
