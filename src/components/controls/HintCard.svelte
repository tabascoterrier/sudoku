<script lang="ts">
  import { gameStore } from '../../lib/stores/game.svelte';

  const engine = $derived(gameStore.engine);
  const hint = $derived(engine?.activeHint ?? null);
  const stepIndex = $derived(engine?.hintStepIndex ?? 0);
  const step = $derived(hint?.steps[stepIndex]);
  const stepCount = $derived(hint?.steps.length ?? 0);
  const isFirstStep = $derived(stepIndex === 0);
  const isLastStep = $derived(stepIndex === stepCount - 1);

  function handleBack(): void {
    gameStore.prevHintStep();
  }

  function handleNext(): void {
    if (isLastStep) {
      gameStore.commitHint();
    } else {
      gameStore.nextHintStep();
    }
  }

  function handleDismiss(): void {
    gameStore.cancelHint();
  }
</script>

{#if hint && step}
  <div class="hint-card" role="dialog" aria-label="Hint" aria-live="polite">
    <button type="button" class="dismiss" onclick={handleDismiss} aria-label="Close hint">×</button>
    <h2 class="title">{step.title}</h2>
    <p class="body">{step.body}</p>
    <div class="footer">
      <div class="dots" aria-hidden="true">
        {#each hint.steps as _step, i (i)}
          <span class="dot" class:active={i === stepIndex}></span>
        {/each}
      </div>
      <div class="nav">
        <button type="button" class="nav-btn" onclick={handleBack} disabled={isFirstStep} aria-label="Previous step">
          ‹
        </button>
        <button
          type="button"
          class="nav-btn primary"
          onclick={handleNext}
          aria-label={isLastStep ? 'Apply hint' : 'Next step'}
        >
          {isLastStep ? '✓' : '›'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .hint-card {
    position: fixed;
    left: 50%;
    bottom: 1rem;
    transform: translateX(-50%);
    width: min(92vw, 420px);
    background: var(--card-bg, #fff);
    color: var(--card-fg, #1a1a1a);
    border-radius: 0.75rem;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
    padding: 1rem 1.25rem;
    z-index: 50;
  }

  .dismiss {
    position: absolute;
    top: 0.1rem;
    right: 0.2rem;
    padding: 0.5rem;
    border: none;
    background: transparent;
    font-size: 1.1rem;
    line-height: 1;
    cursor: pointer;
    color: var(--muted-fg, #777);
  }

  .title {
    margin: 0 1.5rem 0.4rem 0;
    font-size: 1.05rem;
  }

  .body {
    margin: 0 0 0.9rem 0;
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .dots {
    display: flex;
    gap: 0.35rem;
  }

  .dot {
    width: 0.45rem;
    height: 0.45rem;
    border-radius: 50%;
    background: var(--control-border, #ccc);
  }

  .dot.active {
    background: var(--accent, #1b6ef3);
  }

  .nav {
    display: flex;
    gap: 0.5rem;
  }

  .nav-btn {
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 50%;
    border: 1px solid var(--control-border, #ccc);
    background: var(--control-bg, #fff);
    color: var(--control-fg, #1a1a1a);
    font-size: 1.1rem;
    cursor: pointer;
  }

  .nav-btn:disabled {
    opacity: 0.35;
    cursor: default;
  }

  .nav-btn.primary {
    background: var(--accent, #1b6ef3);
    border-color: var(--accent, #1b6ef3);
    color: #fff;
  }

  /* Bottom-center spanning the full width covers the number pad/toolbar
     column in the board-left/controls-right landscape layout, so pin it
     over the board side instead, narrow enough to clear the controls. */
  @media (orientation: landscape) and (max-height: 900px) {
    .hint-card {
      left: 1rem;
      bottom: 0.5rem;
      transform: none;
      width: min(60vw, 360px);
      padding: 0.75rem 1rem;
    }

    .body {
      margin-bottom: 0.6rem;
    }
  }
</style>
