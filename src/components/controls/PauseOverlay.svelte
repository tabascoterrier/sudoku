<script lang="ts">
  import { gameStore } from '../../lib/stores/game.svelte';
</script>

<div class="pause-overlay" role="dialog" aria-modal="true" aria-label="Game paused">
  <p class="label">Paused</p>
  <button type="button" class="resume-btn" onclick={() => gameStore.resume()}>Resume</button>
</div>

<style>
  .pause-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    background: var(--pause-overlay-bg, rgba(255, 255, 255, 0.92));
    backdrop-filter: blur(6px);
    z-index: 20;
    border-radius: 0.5rem;
  }

  .label {
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--card-fg, #1a1a1a);
    margin: 0;
  }

  .resume-btn {
    padding: 0.6rem 1.5rem;
    border-radius: 999px;
    border: none;
    background: var(--accent, #1b6ef3);
    color: #fff;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
  }
</style>
