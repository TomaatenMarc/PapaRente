const COLORS = ['#7fd8c4', '#aee6da', '#f3b96f', '#9fd6c0', '#c9f2e4'];

export function initBubbleGame({ canvas, scoreEl, timeEl, startBtn, duration = 30 }) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  let bubbles = [];
  let score = 0;
  let timeLeft = duration;
  let running = false;
  let rafId = null;
  let timerId = null;
  let spawnAcc = 0;
  let lastTs = 0;

  function spawnBubble() {
    const r = 16 + Math.random() * 22;
    bubbles.push({
      x: r + Math.random() * (W - 2 * r),
      y: H + r,
      r,
      speed: 28 + Math.random() * 40,
      wobble: Math.random() * Math.PI * 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      popped: false,
      popT: 0,
    });
  }

  function drawBackground() {
    ctx.clearRect(0, 0, W, H);
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#eaf5f1');
    grad.addColorStop(1, '#d7eee6');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  function drawBubble(b) {
    ctx.save();
    if (b.popped) {
      const t = b.popT;
      ctx.globalAlpha = Math.max(0, 1 - t * 4);
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * (1 + t * 1.5), 0, Math.PI * 2);
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
      return;
    }
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.1, b.x, b.y, b.r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, b.color);
    grad.addColorStop(1, '#ffffffaa');
    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.restore();
  }

  function drawEndState(label) {
    ctx.fillStyle = 'rgba(20, 90, 77, 0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '700 22px Fredoka, sans-serif';
    ctx.fillText(label, W / 2, H / 2 - 10);
    ctx.font = '600 16px Nunito, sans-serif';
    ctx.fillText(`${score} Blasen gepoppt 🫧`, W / 2, H / 2 + 20);
  }

  function tick(ts) {
    if (!running) return;
    const dt = lastTs ? (ts - lastTs) / 1000 : 0;
    lastTs = ts;

    spawnAcc += dt;
    const spawnEvery = 0.55;
    if (spawnAcc > spawnEvery) {
      spawnAcc = 0;
      spawnBubble();
    }

    drawBackground();

    bubbles.forEach((b) => {
      if (b.popped) {
        b.popT += dt;
      } else {
        b.y -= b.speed * dt;
        b.wobble += dt * 2;
        b.x += Math.sin(b.wobble) * 0.4;
      }
      drawBubble(b);
    });

    bubbles = bubbles.filter((b) => (b.popped ? b.popT < 0.3 : b.y + b.r > -10));

    rafId = requestAnimationFrame(tick);
  }

  function handlePointer(evt) {
    if (!running) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      if (b.popped) continue;
      const d = Math.hypot(b.x - x, b.y - y);
      if (d <= b.r) {
        b.popped = true;
        b.popT = 0;
        score++;
        scoreEl.textContent = score;
        break;
      }
    }
  }

  function startTimer() {
    timeLeft = duration;
    timeEl.textContent = timeLeft;
    timerId = setInterval(() => {
      timeLeft--;
      timeEl.textContent = Math.max(timeLeft, 0);
      if (timeLeft <= 0) {
        endGame();
      }
    }, 1000);
  }

  function endGame() {
    running = false;
    clearInterval(timerId);
    cancelAnimationFrame(rafId);
    drawEndState('Zeit um! ✨');
    startBtn.textContent = 'Nochmal spielen';
  }

  function start() {
    cancelAnimationFrame(rafId);
    clearInterval(timerId);
    bubbles = [];
    score = 0;
    scoreEl.textContent = '0';
    running = true;
    lastTs = 0;
    spawnAcc = 0;
    startBtn.textContent = 'Läuft...';
    startTimer();
    rafId = requestAnimationFrame(tick);
  }

  drawBackground();
  canvas.addEventListener('click', handlePointer);
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handlePointer(e);
  }, { passive: false });
  startBtn.addEventListener('click', start);
}
