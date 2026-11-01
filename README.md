# Deekshith Tap Bird — Engineering Mathematics Challenge

A tap-to-fly browser game starring Deekshith. Fly through gaps between towers of Engineering Mathematics
subjects (M1, M2, M3, DM, AM). Plain HTML5 + CSS + vanilla JavaScript. No frameworks, no server, no internet needed.

## Run it

1. Unzip the folder (keep all files together).
2. Double-click **`index.html`** — it opens in your browser. That's it.

A single-file copy, **`Deekshith_Tap_Bird_Standalone.html`**, is also included. It has the artwork and audio built in,
so it can be sent to a friend as one file.

## Controls

| Action | Desktop | Mobile |
|---|---|---|
| Fly | Space, Arrow Up, or left mouse click | Tap the game area |
| Pause / resume | `P`, `Esc`, or the pause button | Pause button |
| Sound on / off | `M` or the speaker button | Speaker button |
| Restart | Restart button (or Space after game over) | Restart button |

## Rules

- Each pair of towers you pass is **1 point**.
- Hitting a tower or the ground ends the run.
- Speed rises and the gap narrows as your score grows, up to a cap at 35 points.
- Your best score is saved in the browser (`localStorage`).

## Project structure

```
Deekshith_Tap_Bird/
├── index.html
├── css/style.css
├── js/
│   ├── game.js        configuration, game loop, state machine, input, background
│   ├── player.js      the flying character (physics + drawing)
│   ├── obstacles.js   subject/topic configuration, obstacle spawning, collisions, drawing
│   ├── audio.js       music, game-over sound, small sound effects, mute
│   └── ui.js          start / pause / game-over screens, HUD, buttons
├── assets/
│   ├── friend.png  obstacle-1.png  obstacle-2.png
│   ├── gameplay.mp3  gameover.mp3
│   └── assets-guide.txt
└── README.md
```

## Replace the artwork or audio (no code changes)

Overwrite these files, keeping the exact names (details in `assets/assets-guide.txt`):

- `assets/friend.png` — the character. Transparent PNG, cropped around the face.
- `assets/obstacle-1.png`, `assets/obstacle-2.png` — obstacle art. Horizontal images (like the ruler) are rotated
  to vertical automatically and tiled — never stretched.
- `assets/gameplay.mp3` — looping background music.
- `assets/gameover.mp3` — short sound on crash.

Anything missing falls back to built-in art (a cartoon bird / stacks of textbooks) or silence; the game never breaks.
Reload with Ctrl+F5 / Cmd+Shift+R to bypass the browser cache after swapping files.

## Change the maths topics

Open `js/obstacles.js` and edit the `SUBJECTS` object at the top. Each subject has a colour and a list of topics:

```js
M1: { name: 'Engineering Mathematics I', color: '#3f51b5', dark: '#2a378a',
      topics: ['Matrices', 'Jacobians', ...] }
```

Add, remove, or rename topics freely. Long names are wrapped and shrunk automatically.

## Tune the difficulty

Open `js/game.js` and edit the `CONFIG` object at the top (gravity, jump strength, obstacle width and spacing,
starting/maximum speed, starting/minimum gap). All values are in a fixed 480×720 game world, so the game
plays the same on every screen size and frame rate.

## Notes

- The supplied `friend.png` (4096×5174, 3.4 MB) and `obstacle-1.png` were cropped and downsized (to ~420 px tall and
  900 px wide) so the game loads instantly; the look is unchanged. `obstacle-2.png` is a teal colour variant of the
  ruler and `gameover.mp3` is a short generated jingle — replace either with your own.
- Browsers only allow audio after a click/tap, so music begins when you press Start. If audio is blocked or a file is
  missing, the game simply runs silently.
- Needs a modern browser (Chrome, Edge, Firefox, Safari from the last few years).
