<script lang="ts">
  interface Props {
    onNavigate: (path: string) => void;
    onClose: () => void;
  }

  let { onNavigate, onClose }: Props = $props();

  function stop(event: MouseEvent): void {
    event.stopPropagation();
  }

  // A window-level listener (rather than one scoped to this component's DOM)
  // so Escape closes the menu regardless of where focus currently is —
  // including on the hamburger trigger button that opened it, which sits
  // outside this backdrop's subtree and would never see a bubbled keydown.
  $effect(() => {
    function handleWindowKeydown(event: KeyboardEvent): void {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleWindowKeydown);
    return () => window.removeEventListener('keydown', handleWindowKeydown);
  });
</script>

<div class="menu-backdrop" role="presentation" onclick={onClose}>
  <div class="menu-panel-wrapper" role="presentation" onclick={stop}>
    <nav class="menu-panel" aria-label="Site">
      <button type="button" onclick={() => onNavigate('/rules/')}>Rules</button>
      <button type="button" onclick={() => onNavigate('/settings/')}>Settings</button>
    </nav>
  </div>
</div>

<style>
  .menu-backdrop {
    position: fixed;
    inset: 0;
    z-index: 90;
  }

  .menu-panel {
    position: absolute;
    top: 3.2rem;
    right: 0.75rem;
    display: flex;
    flex-direction: column;
    min-width: 10rem;
    background: var(--card-bg, #fff);
    color: var(--card-fg, #1a1a1a);
    border-radius: 0.6rem;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
    overflow: hidden;
  }

  .menu-panel button {
    padding: 0.8rem 1rem;
    border: none;
    background: transparent;
    color: inherit;
    font-size: 0.95rem;
    text-align: left;
    cursor: pointer;
  }

  /* Guarded to real hover-capable pointers — see Toolbar.svelte for why. */
  @media (hover: hover) {
    .menu-panel button:hover {
      background: var(--control-bg-hover, #eef4ff);
    }
  }
</style>
