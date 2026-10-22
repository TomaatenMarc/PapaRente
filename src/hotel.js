import { initBubbleGame } from './games/bubbles.js';

initBubbleGame({
  canvas: document.getElementById('bubble-game'),
  scoreEl: document.getElementById('bubble-score'),
  timeEl: document.getElementById('bubble-time'),
  startBtn: document.getElementById('bubble-start'),
});
