<script lang="ts">
  import Board from '../board/Board.svelte';
  import HintCard from '../controls/HintCard.svelte';
  import MistakesTimerBar from '../controls/MistakesTimerBar.svelte';
  import NumberPad from '../controls/NumberPad.svelte';
  import PauseOverlay from '../controls/PauseOverlay.svelte';
  import Toolbar from '../controls/Toolbar.svelte';
  import WinModal from '../shared/WinModal.svelte';
  import { gameStore } from '../../lib/stores/game.svelte';
  import type { Difficulty } from '../../lib/sudoku/types';

  interface Props {
    difficulty: Difficulty;
    onOpenNewGameMenu: () => void;
  }

  let { difficulty, onOpenNewGameMenu }: Props = $props();

  let loadedDifficulty: Difficulty | null = null;

  // Deep-linking to /easy/, /hard/, etc. (or the New Game menu navigating to
  // a new route) should load that tier's puzzle.
  $effect(() => {
    if (loadedDifficulty !== difficulty) {
      loadedDifficulty = difficulty;
      gameStore.loadPuzzle(difficulty);
    }
  });
</script>

<div class="game-page">
  {#if gameStore.isGenerating || !gameStore.engine}
    <p class="loading">Generating puzzle…</p>
  {:else}
    <MistakesTimerBar />
    <div class="board-wrapper">
      <Board />
      {#if gameStore.engine.isPaused}
        <PauseOverlay />
      {/if}
    </div>
    <NumberPad />
    <Toolbar />
    <HintCard />
    {#if gameStore.engine.isComplete}
      <WinModal onNewGame={onOpenNewGameMenu} />
    {/if}
  {/if}
</div>

<style>
  .game-page {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    max-width: 620px;
    margin: 0 auto;
    padding: 0 0.75rem 1.5rem;
  }

  @media (max-width: 640px) {
    .game-page {
      gap: 0.6rem;
      padding: 0 0.5rem 1rem;
    }
  }

  .board-wrapper {
    position: relative;
  }

  .loading {
    text-align: center;
    padding: 3rem 0;
    color: var(--muted-fg, #777);
  }
</style>
