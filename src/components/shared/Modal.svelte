<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    labelledBy: string;
    onDismiss?: () => void;
    children: Snippet;
  }

  let { labelledBy, onDismiss, children }: Props = $props();

  function handleBackdropClick(): void {
    onDismiss?.();
  }

  function stop(event: MouseEvent): void {
    event.stopPropagation();
  }

  // Window-level (not scoped to this component's DOM) so Escape dismisses
  // the modal regardless of where focus currently is — including on
  // whatever trigger button opened it, which sits outside this backdrop's
  // subtree and would never see a bubbled keydown.
  $effect(() => {
    if (!onDismiss) return;
    function handleWindowKeydown(event: KeyboardEvent): void {
      if (event.key === 'Escape') onDismiss?.();
    }
    window.addEventListener('keydown', handleWindowKeydown);
    return () => window.removeEventListener('keydown', handleWindowKeydown);
  });
</script>

<div class="backdrop" role="presentation" onclick={handleBackdropClick}>
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabindex="-1" onclick={stop}>
    {@render children()}
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 1rem;
  }

  .modal {
    position: relative;
    width: min(92vw, 420px);
    max-height: 85vh;
    overflow-y: auto;
    background: var(--card-bg, #fff);
    color: var(--card-fg, #1a1a1a);
    border-radius: 0.9rem;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
    padding: 1.5rem;
  }
</style>
