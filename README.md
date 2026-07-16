# Sudoku

A fast, installable Sudoku game that runs entirely in your browser. Puzzles are generated
on demand by a solver running in a Web Worker, so there's an endless supply at four
difficulty levels.

## Playing

Fill the 9×9 grid so that every row, every column, and every 3×3 box contains each
digit 1–9 exactly once.

- **Select a cell**, then enter a digit with the number pad or your keyboard.
- **Notes mode** lets you pencil in candidate digits instead of committing an answer.
- **Undo** steps back through your moves one at a time.
- **Hints** walk you through a real deduction — naming the technique and explaining
  why a digit must go where it does — rather than just revealing an answer.

Choose Easy, Medium, Hard, or Expert from the tabs above the board — each difficulty
has its own shareable URL (`/easy/`, `/medium/`, `/hard/`, `/expert/`).

## Scoring

Scoring rewards solving the puzzle yourself:

| Action | Points |
|---|---|
| Correct entry | +10 |
| Wrong entry | −5 |
| Completing a row, column, or box | +20 (per unit, stacks if a move completes more than one) |
| Using a hint | −25 |

Score can never drop below zero. Hints are there to get you unstuck, but working out a
digit yourself always pays off better than asking for the answer.

## Installing

The game is a PWA — visit it in a browser and use "Add to Home Screen" (iOS) or the
install prompt (Chrome/Edge) to run it offline like a native app.

## Development

```bash
npm install
npm run dev       # start the dev server
npm run build     # production build
npm run preview   # preview the production build
npm test          # run the test suite
npm run check     # type-check
```

Built with Svelte 5, Vite, and TypeScript. 