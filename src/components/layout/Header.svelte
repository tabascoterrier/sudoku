<script lang="ts">
  import { router } from '../../router/router.svelte';
  import HamburgerMenu from './HamburgerMenu.svelte';

  interface Props {
    onOpenNewGameMenu: () => void;
  }

  let { onOpenNewGameMenu }: Props = $props();

  let menuOpen = $state(false);

  function navigate(path: string): void {
    menuOpen = false;
    router.navigate(path);
  }
</script>

<header class="site-header">
  <button type="button" class="logo" onclick={() => navigate('/')}>Sudoku</button>

  <nav class="desktop-nav" aria-label="Site">
    <button type="button" onclick={() => navigate('/rules/')}>Rules</button>
    <button type="button" onclick={() => navigate('/settings/')}>Settings</button>
  </nav>

  <div class="header-actions">
    <button type="button" class="new-game-btn" onclick={onOpenNewGameMenu}>New Game</button>
    <button
      type="button"
      class="hamburger"
      aria-label="Menu"
      aria-expanded={menuOpen}
      onclick={() => (menuOpen = !menuOpen)}
    >
      ☰
    </button>
  </div>
</header>

{#if menuOpen}
  <HamburgerMenu onNavigate={navigate} onClose={() => (menuOpen = false)} />
{/if}

<style>
  .site-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    max-width: 960px;
    margin-inline: auto;
    padding: 0.75rem 1rem;
  }

  .logo {
    border: none;
    background: transparent;
    color: var(--page-fg, #1a1a1a);
    font-size: 1.3rem;
    font-weight: 800;
    cursor: pointer;
    padding: 0;
  }

  .desktop-nav {
    display: flex;
    gap: 1.25rem;
    flex: 1;
    justify-content: center;
  }

  .desktop-nav button {
    border: none;
    background: transparent;
    color: var(--control-fg, #1a1a1a);
    font-size: 0.95rem;
    cursor: pointer;
    padding: 0.3rem 0;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .new-game-btn {
    padding: 0.7rem 1.1rem;
    border-radius: 999px;
    border: none;
    background: var(--accent, #1b6ef3);
    color: #fff;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
  }

  .hamburger {
    display: none;
    border: 1px solid var(--control-border, #ccc);
    background: var(--control-bg, #fff);
    color: var(--control-fg, #1a1a1a);
    border-radius: 0.4rem;
    font-size: 1.1rem;
    line-height: 1;
    padding: 0.65rem 0.75rem;
    cursor: pointer;
  }

  @media (max-width: 640px) {
    .desktop-nav {
      display: none;
    }

    .hamburger {
      display: block;
    }
  }

  @media (orientation: landscape) and (max-height: 600px) {
    .site-header {
      padding-block: 0.2rem;
    }
  }
</style>
