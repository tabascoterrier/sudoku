<script lang="ts">
  import { DIFFICULTIES, DIFFICULTY_LABELS } from '../../lib/sudoku/difficulty';
  import type { Difficulty } from '../../lib/sudoku/types';

  interface Props {
    current: Difficulty;
    onSelect: (difficulty: Difficulty) => void;
  }

  let { current, onSelect }: Props = $props();

  function handleSelectChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as Difficulty;
    onSelect(value);
  }
</script>

<!-- Desktop: a row of tabs. Mobile: a native <select> (SPEC §12). Both are
     rendered; CSS shows exactly one per viewport, so only one is ever in the
     tab order (the hidden one has display:none, which removes it). -->
<div class="tabs" role="tablist" aria-label="Difficulty">
  {#each DIFFICULTIES as difficulty (difficulty)}
    <button
      type="button"
      role="tab"
      aria-selected={difficulty === current}
      class="tab"
      class:selected={difficulty === current}
      onclick={() => onSelect(difficulty)}
    >
      {DIFFICULTY_LABELS[difficulty]}
    </button>
  {/each}
</div>

<label class="select-wrapper">
  <span class="sr-only">Difficulty</span>
  <select value={current} onchange={handleSelectChange}>
    {#each DIFFICULTIES as difficulty (difficulty)}
      <option value={difficulty}>{DIFFICULTY_LABELS[difficulty]}</option>
    {/each}
  </select>
</label>

<style>
  .tabs {
    display: flex;
    justify-content: center;
    gap: 0.4rem;
  }

  .tab {
    padding: 0.4rem 0.9rem;
    border: 1px solid var(--control-border, #ccc);
    border-radius: 999px;
    background: var(--control-bg, #fff);
    color: var(--control-fg, #1a1a1a);
    cursor: pointer;
    font-size: 0.9rem;
  }

  .tab.selected {
    background: var(--accent, #1b6ef3);
    border-color: var(--accent, #1b6ef3);
    color: #fff;
    font-weight: 600;
  }

  .select-wrapper {
    display: none;
  }

  .select-wrapper select {
    font-size: 1rem;
    padding: 0.4rem 0.6rem;
    border-radius: 0.4rem;
    border: 1px solid var(--control-border, #ccc);
    background: var(--control-bg, #fff);
    color: var(--control-fg, #1a1a1a);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @media (max-width: 640px) {
    .tabs {
      display: none;
    }

    .select-wrapper {
      display: block;
    }
  }
</style>
