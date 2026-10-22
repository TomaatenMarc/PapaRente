import { initBubbleGame } from './games/bubbles.js';
import { initScrollFloat } from './scroll-float.js';

initBubbleGame({
  canvas: document.getElementById('bubble-game'),
  scoreEl: document.getElementById('bubble-score'),
  timeEl: document.getElementById('bubble-time'),
  startBtn: document.getElementById('bubble-start'),
});

initScrollFloat(['🫧', '🫧', '✨']);
