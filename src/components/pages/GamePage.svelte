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
    display: grid;
    grid-template-areas:
      'stats'
      'board'
      'numpad'
      'toolbar';
    grid-template-rows: auto auto auto auto;
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

  /* Landscape viewports without the vertical room for the portrait stack —
     a phone on its side, or a tablet like a 1024x768 iPad — don't fit
     header, stats, board, numpad, and toolbar stacked (~813px tall),
     forcing a mid-game scroll to reach the controls. Re-flowing into
     board-left/controls-right fits everything in view without touching
     DOM/tab order, so keyboard and screen-reader navigation still moves
     stats → board → numpad → toolbar. */
  @media (orientation: landscape) and (max-height: 900px) {
    .game-page {
      height: 100%;
      max-width: none;
      grid-template-areas:
        'board stats'
        'board numpad'
        'board toolbar';
      grid-template-columns: auto 1fr;
      grid-template-rows: auto 1fr auto;
      align-items: center;
      justify-content: center;
      gap: 0.2rem 1.25rem;
      padding: 0.15rem 0.75rem;
      /* viewport-fit=cover (index.html) lets content draw under the home
         indicator on notched/indicator phones — without this, the toolbar's
         bottom row ends up drawn underneath (and obscured by) it. */
      padding-bottom: max(0.15rem, env(safe-area-inset-bottom));
    }
  }

  .game-page > :global(.status-bar) {
    grid-area: stats;
  }

  .game-page > :global(.number-pad) {
    grid-area: numpad;
  }

  .game-page > :global(.toolbar) {
    grid-area: toolbar;
  }

  .board-wrapper {
    grid-area: board;
    position: relative;
  }

  @media (orientation: landscape) and (max-height: 900px) {
    .board-wrapper {
      height: 100%;
      /* The board itself caps at 480px (Board.svelte) — on a short phone
         column that's close to the wrapper's full height anyway, but on a
         taller tablet column it would otherwise sit pinned to the top with
         dead space below. Centering keeps it level with the numpad/toolbar
         cluster docked at the bottom of the opposite column. */
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .loading {
    text-align: center;
    padding: 3rem 0;
    color: var(--muted-fg, #777);
  }
</style>
