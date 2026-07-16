<script lang="ts">
  import Header from './components/layout/Header.svelte';
  import GamePage from './components/pages/GamePage.svelte';
  import NotFoundPage from './components/pages/NotFoundPage.svelte';
  import RulesPage from './components/pages/RulesPage.svelte';
  import SettingsPage from './components/pages/SettingsPage.svelte';
  import NewGameMenu from './components/controls/NewGameMenu.svelte';
  import { gameStore } from './lib/stores/game.svelte';
  import { pathForDifficulty } from './router/routes';
  import { router } from './router/router.svelte';
  import { settingsStore } from './lib/stores/settings.svelte';
  import type { Difficulty } from './lib/sudoku/types';

  let newGameMenuOpen = $state(false);

  const currentDifficulty = $derived<Difficulty>(
    router.route.name === 'game' && router.route.difficulty
      ? router.route.difficulty
      : (gameStore.engine?.puzzle.difficulty ?? 'easy'),
  );

  $effect(() => {
    document.documentElement.dataset.theme = settingsStore.theme === 'system' ? '' : settingsStore.theme;
  });

  function selectDifficulty(next: Difficulty): void {
    // Navigating to the difficulty we're already on is a no-op for the
    // router, so GamePage's route-driven puzzle-load effect never fires.
    // Force a fresh puzzle directly in that case (e.g. "New Game" after
    // winning, reselecting the same tier).
    if (next === currentDifficulty) {
      gameStore.loadPuzzle(next, true);
      return;
    }
    router.navigate(pathForDifficulty(next));
  }

  function handleRestart(): void {
    gameStore.restart();
  }
</script>

<Header onOpenNewGameMenu={() => (newGameMenuOpen = true)} />

<main>
  {#if router.route.name === 'game' && router.route.difficulty}
    <GamePage difficulty={router.route.difficulty} onOpenNewGameMenu={() => (newGameMenuOpen = true)} />
  {:else if router.route.name === 'rules'}
    <RulesPage />
  {:else if router.route.name === 'settings'}
    <SettingsPage />
  {:else}
    <NotFoundPage />
  {/if}
</main>

{#if newGameMenuOpen}
  <NewGameMenu
    {currentDifficulty}
    onClose={() => (newGameMenuOpen = false)}
    onSelectDifficulty={selectDifficulty}
    onRestart={handleRestart}
  />
{/if}
