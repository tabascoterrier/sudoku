<script lang="ts">
  import { settingsStore, type Theme } from '../../lib/stores/settings.svelte';

  const THEME_OPTIONS: { value: Theme; label: string }[] = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];
</script>

<div class="page">
  <h1>Settings</h1>

  <section>
    <h2 id="theme-label">Theme</h2>
    <div class="theme-options" role="radiogroup" aria-labelledby="theme-label">
      {#each THEME_OPTIONS as option (option.value)}
        <button
          type="button"
          role="radio"
          aria-checked={settingsStore.theme === option.value}
          class="theme-btn"
          class:selected={settingsStore.theme === option.value}
          onclick={() => settingsStore.setTheme(option.value)}
        >
          {option.label}
        </button>
      {/each}
    </div>
    <p class="hint">"System" follows your device's light/dark preference automatically.</p>
  </section>
</div>

<style>
  .page {
    max-width: 640px;
    margin: 0 auto;
    padding: 0.5rem 1rem 3rem;
  }

  h1 {
    font-size: 1.6rem;
    margin-bottom: 1.25rem;
  }

  section {
    margin-bottom: 1.5rem;
  }

  h2 {
    font-size: 1.05rem;
    margin-bottom: 0.6rem;
  }

  .theme-options {
    display: inline-flex;
    border: 1px solid var(--control-border, #ccc);
    border-radius: 999px;
    padding: 0.25rem;
    gap: 0.25rem;
  }

  .theme-btn {
    padding: 0.7rem 1.1rem;
    border-radius: 999px;
    border: none;
    background: transparent;
    color: var(--control-fg, #1a1a1a);
    font-size: 0.9rem;
    cursor: pointer;
  }

  .theme-btn.selected {
    background: var(--accent, #1b6ef3);
    color: #fff;
    font-weight: 600;
  }

  .hint {
    margin: 0.6rem 0 0 0;
    font-size: 0.85rem;
    color: var(--muted-fg, #777);
  }
</style>
