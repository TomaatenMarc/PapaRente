import { initGrapeGame } from './games/grapes.js';
import { initScrollFloat } from './scroll-float.js';

initGrapeGame({
  canvas: document.getElementById('grape-game'),
  scoreEl: document.getElementById('grape-score'),
  timeEl: document.getElementById('grape-time'),
  startBtn: document.getElementById('grape-start'),
});

initScrollFloat(['🍇', '🍇', '🍃']);
