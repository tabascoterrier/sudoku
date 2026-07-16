<script lang="ts">
</script>

<div class="page">
  <h1>How to Play Sudoku</h1>

  <section>
    <h2>The goal</h2>
    <p>
      Fill the 9×9 grid so that every row, every column, and every one of the nine 3×3 boxes
      contains each of the digits 1 through 9 exactly once. No digit may repeat within the same
      row, column, or box.
    </p>
  </section>

  <section>
    <h2>Getting started</h2>
    <p>
      Some cells are already filled in — these <strong>given</strong> cells are fixed and can't be
      changed. Tap or click an empty cell to select it, then enter a digit using the number pad
      below the board or your keyboard's number keys.
    </p>
    <p>
      Selecting a cell also highlights its row, column, and box, along with any other cells that
      already hold the same digit — useful for spotting conflicts and options at a glance.
    </p>
  </section>

  <section>
    <h2>Mistakes</h2>
    <p>
      If a digit you enter doesn't match the puzzle's solution, the cell is flagged immediately
      and the mistakes counter goes up. There's no limit on mistakes — keep going and correct them
      as you spot them.
    </p>
  </section>

  <section>
    <h2>Notes (pencil marks)</h2>
    <p>
      Turn on <strong>Notes</strong> in the toolbar to switch the number pad into candidate mode:
      tapping digits adds or removes small pencil marks in the selected cell instead of committing
      a final answer, so you can track multiple possibilities in one cell. Tapping a digit already
      marked removes just that candidate. Notes clear automatically from a cell once you commit a
      final digit there, and matching pencil marks are cleared from peer cells too — but only for
      that specific digit, leaving your other notes untouched.
    </p>
  </section>

  <section>
    <h2>Undo &amp; Eraser</h2>
    <p>
      <strong>Undo</strong> steps back through your moves one at a time, restoring cell values and
      notes exactly as they were. <strong>Eraser</strong> clears the selected cell's value or
      notes without needing to overwrite it with something else.
    </p>
  </section>

  <section>
    <h2>Hints</h2>
    <p>
      Stuck? Use a <strong>Hint</strong>, as many times as you need. Each one walks you through a
      real deduction step by step — naming the technique, highlighting the relevant cells, and
      explaining why a particular digit must go in a particular cell — rather than just filling in
      a random answer. Applying a hint commits the digit as a final answer, but costs you points —
      solving cells yourself is always worth more.
    </p>
  </section>

  <section>
    <h2>Scoring</h2>
    <p>
      Each correct entry earns you points, and completing a row, column, or 3×3 box earns a bonus
      on top. Wrong entries and hints both cost points instead — a hint is handy in a pinch, but
      never pays off as well as working out the digit yourself. Score can't drop below zero.
    </p>
  </section>

  <section>
    <h2>Difficulty</h2>
    <p>
      Difficulty is controlled by how many cells are filled in to start: Easy puzzles leave more
      digits in place, while Expert puzzles start with the fewest and require deeper chains of
      deduction. Switch difficulty at any time from the tabs above the board — this starts a fresh
      puzzle, so any progress on the current one will be lost.
    </p>
  </section>

  <section>
    <h2>Finishing up</h2>
    <p>
      The puzzle is solved once every cell matches the correct solution. Use
      <strong>Pause</strong> any time you need to step away — it freezes the timer and hides the
      board until you resume.
    </p>
  </section>
</div>

<style>
  .page {
    max-width: 640px;
    margin: 0 auto;
    padding: 0.5rem 1rem 3rem;
    line-height: 1.55;
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
    margin-bottom: 0.4rem;
  }

  p {
    margin: 0 0 0.6rem 0;
    color: var(--control-fg, #1a1a1a);
  }
</style>
