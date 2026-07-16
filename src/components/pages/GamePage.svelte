<script lang="ts">
  import Board from '../board/Board.svelte';
  import DifficultySelector from '../controls/DifficultySelector.svelte';
  import HintCard from '../controls/HintCard.svelte';
  import MistakesTimerBar from '../controls/MistakesTimerBar.svelte';
  import NumberPad from '../controls/NumberPad.svelte';
  import PauseOverlay from '../controls/PauseOverlay.svelte';
  import Toolbar from '../controls/Toolbar.svelte';
  import WinModal from '../shared/WinModal.svelte';
  import { gameStore } from '../../lib/stores/game.svelte';
  import { router } from '../../router/router.svelte';
  import { pathForDifficulty } from '../../router/routes';
  import type { Difficulty } from '../../lib/sudoku/types';

  interface Props {
    difficulty: Difficulty;
    onOpenNewGameMenu: () => void;
  }

  let { difficulty, onOpenNewGameMenu }: Props = $props();

  let loadedDifficulty: Difficulty | null = null;

  // Deep-linking to /easy/, /hard/, etc. (or the difficulty selector
  // navigating to a new route) should load that tier's puzzle.
  $effect(() => {
    if (loadedDifficulty !== difficulty) {
      loadedDifficulty = difficulty;
      gameStore.loadPuzzle(difficulty);
    }
  });

  function selectDifficulty(next: Difficulty): void {
    if (next === difficulty) return;
    const hasProgress = (gameStore.engine?.history.length ?? 0) > 0;
    if (hasProgress && !confirm('Current game progress will be lost. Continue?')) return;
    router.navigate(pathForDifficulty(next));
  }
</script>

<div class="game-page">
  <DifficultySelector current={difficulty} onSelect={selectDifficulty} />

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
    <Toolbar {onOpenNewGameMenu} />
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

  .board-wrapper {
    position: relative;
  }

  .loading {
    text-align: center;
    padding: 3rem 0;
    color: var(--muted-fg, #777);
  }
</style>
