<script lang="ts">
  import { router } from '../../router/router.svelte';
</script>

<div class="page">
  <h1>Page not found</h1>
  <button type="button" onclick={() => router.navigate('/')}>Go to the game</button>
</div>

<style>
  .page {
    max-width: 620px;
    margin: 0 auto;
    padding: 3rem 1rem;
    text-align: center;
  }

  button {
    margin-top: 1rem;
    padding: 0.6rem 1.2rem;
    border-radius: 999px;
    border: none;
    background: var(--accent, #1b6ef3);
    color: #fff;
    font-size: 0.95rem;
    cursor: pointer;
  }
</style>
