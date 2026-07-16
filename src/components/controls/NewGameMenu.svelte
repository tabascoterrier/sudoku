<script lang="ts">
  import Modal from '../shared/Modal.svelte';
  import { DIFFICULTIES, DIFFICULTY_LABELS } from '../../lib/sudoku/difficulty';
  import type { Difficulty } from '../../lib/sudoku/types';

  interface Props {
    currentDifficulty: Difficulty;
    onClose: () => void;
    onSelectDifficulty: (difficulty: Difficulty) => void;
    onRestart: () => void;
  }

  let { currentDifficulty, onClose, onSelectDifficulty, onRestart }: Props = $props();

  function handleSelect(difficulty: Difficulty): void {
    onClose();
    onSelectDifficulty(difficulty);
  }

  function handleRestart(): void {
    onClose();
    onRestart();
  }
</script>

<Modal labelledBy="new-game-title" onDismiss={onClose}>
  <button type="button" class="close" onclick={onClose} aria-label="Close">×</button>
  <h2 id="new-game-title">Select Game Mode</h2>
  <p class="warning">Starting a new game or restarting will lose your current progress.</p>

  <div class="difficulty-grid" role="group" aria-label="Difficulty">
    {#each DIFFICULTIES as difficulty (difficulty)}
      <button
        type="button"
        class="difficulty-btn"
        class:current={difficulty === currentDifficulty}
        onclick={() => handleSelect(difficulty)}
      >
        {DIFFICULTY_LABELS[difficulty]}
      </button>
    {/each}
  </div>

  <button type="button" class="restart-btn" onclick={handleRestart}>
    Restart current puzzle
  </button>
</Modal>

<style>
  .close {
    position: absolute;
    top: 0.3rem;
    right: 0.5rem;
    padding: 0.5rem;
    border: none;
    background: transparent;
    font-size: 1.3rem;
    line-height: 1;
    cursor: pointer;
    color: var(--muted-fg, #777);
  }

  h2 {
    margin: 0 1.5rem 0.5rem 0;
    font-size: 1.2rem;
  }

  .warning {
    margin: 0 0 1.2rem 0;
    font-size: 0.85rem;
    color: var(--muted-fg, #777);
  }

  .difficulty-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.6rem;
    margin-bottom: 1.5rem;
  }

  .difficulty-btn {
    padding: 0.7rem;
    border-radius: 0.5rem;
    border: 1px solid var(--control-border, #ccc);
    background: var(--control-bg, #fff);
    color: var(--control-fg, #1a1a1a);
    font-size: 0.95rem;
    cursor: pointer;
  }

  .difficulty-btn.current {
    background: var(--accent, #1b6ef3);
    border-color: var(--accent, #1b6ef3);
    color: #fff;
    font-weight: 600;
  }

  .restart-btn {
    width: 100%;
    padding: 0.7rem;
    border-radius: 0.5rem;
    border: 1px solid var(--control-border, #ccc);
    background: transparent;
    color: var(--control-fg, #1a1a1a);
    font-size: 0.95rem;
    cursor: pointer;
  }
</style>
