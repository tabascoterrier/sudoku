# Sudoku

A fast, installable Sudoku game that runs entirely in your browser. Puzzles are generated on 
demand by a Web Worker, so there's an endless supply across four difficulty levels.

## Playing

Fill the 9×9 grid so every row, column, and 3×3 box ends up with each digit 1–9
exactly once.

- **Select a cell**, then enter a digit with the number pad or your keyboard.
- **Notes mode** lets you pencil in candidates instead of committing to an answer.
- **Undo** steps back through your moves one at a time.
- **Hints** walk you through a real deduction — naming the technique and explaining
  why a digit has to go where it does, instead of just handing you the answer.

Pick Easy, Medium, Hard, or Expert from the tabs above the board.

## Scoring

Scoring rewards solving it yourself rather than leaning on hints:

| Action | Points |
|---|---|
| Correct entry | +10 |
| Wrong entry | −5 |
| Completing a row, column, or box | +20 (per unit — stacks if one move finishes more than one) |
| Using a hint | −25 |

Finish under a difficulty's par time and you'll also pick up a speed bonus, worth up to
200 points. It tapers off the longer you take past par and disappears once you're at
double par — but it never turns into a penalty, so there's no rush once it's gone.

Score can't drop below zero. Hints will get you unstuck, but working out a digit
yourself always pays better than asking for the answer.

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