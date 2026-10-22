import { initGrapeGame } from './games/grapes.js';

initGrapeGame({
  canvas: document.getElementById('grape-game'),
  scoreEl: document.getElementById('grape-score'),
  timeEl: document.getElementById('grape-time'),
  startBtn: document.getElementById('grape-start'),
});
