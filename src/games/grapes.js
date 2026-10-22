export function initGrapeGame({ canvas, scoreEl, timeEl, startBtn, duration = 30 }) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  const basket = { w: 70, h: 34, x: W / 2 - 35, y: H - 46 };
  let grapes = [];
  let score = 0;
  let timeLeft = duration;
  let running = false;
  let rafId = null;
  let timerId = null;
  let spawnAcc = 0;
  let lastTs = 0;
  let caught = [];

  function spawnGrape() {
    const r = 12 + Math.random() * 6;
    grapes.push({
      x: r + Math.random() * (W - 2 * r),
      y: -r,
      r,
      speed: 70 + Math.random() * 60,
      rot: Math.random() * Math.PI,
    });
  }

  function drawBackground() {
    ctx.clearRect(0, 0, W, H);
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#faf1da');
    grad.addColorStop(1, '#efe0b2');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // einfache Weinreben-Silhouette oben
    ctx.strokeStyle = '#8a9d5a66';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 18);
    ctx.lineTo(W, 18);
    ctx.stroke();
  }

  function drawGrapeCluster(g) {
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(g.rot * 0.1);
    const circles = [
      [0, -g.r * 0.6],
      [-g.r * 0.5, 0],
      [g.r * 0.5, 0],
      [0, g.r * 0.5],
      [-g.r * 0.25, g.r],
      [g.r * 0.25, g.r],
    ];
    ctx.fillStyle = '#6b3f6b';
    circles.forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.arc(dx, dy, g.r * 0.42, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawBasket() {
    ctx.save();
    ctx.translate(basket.x, basket.y);
    ctx.fillStyle = '#a24b6f';
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(basket.w - 4, 0);
    ctx.lineTo(basket.w - 10, basket.h);
    ctx.lineTo(10, basket.h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#5c7a3a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.quadraticCurveTo(basket.w / 2, -20, basket.w - 10, 0);
    ctx.stroke();
    ctx.restore();
  }

  function drawEndState(label) {
    ctx.fillStyle = 'rgba(63, 88, 38, 0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '700 22px Fredoka, sans-serif';
    ctx.fillText(label, W / 2, H / 2 - 10);
    ctx.font = '600 16px Nunito, sans-serif';
    ctx.fillText(`${score} Trauben gesammelt 🍇`, W / 2, H / 2 + 20);
  }

  function tick(ts) {
    if (!running) return;
    const dt = lastTs ? (ts - lastTs) / 1000 : 0;
    lastTs = ts;

    spawnAcc += dt;
    if (spawnAcc > 0.7) {
      spawnAcc = 0;
      spawnGrape();
    }

    drawBackground();

    grapes.forEach((g) => {
      g.y += g.speed * dt;
    });

    grapes = grapes.filter((g) => {
      const hitBasket =
        g.y + g.r >= basket.y &&
        g.y - g.r <= basket.y + basket.h &&
        g.x >= basket.x - g.r &&
        g.x <= basket.x + basket.w + g.r;
      if (hitBasket) {
        score++;
        scoreEl.textContent = score;
        return false;
      }
      return g.y - g.r < H;
    });

    grapes.forEach(drawGrapeCluster);
    drawBasket();

    rafId = requestAnimationFrame(tick);
  }

  function moveBasketTo(clientX) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const x = (clientX - rect.left) * scaleX;
    basket.x = Math.min(Math.max(x - basket.w / 2, 0), W - basket.w);
  }

  function handleMove(evt) {
    if (!running) return;
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    moveBasketTo(clientX);
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
    drawEndState('Zeit um! 🍷');
    startBtn.textContent = 'Nochmal spielen';
  }

  function start() {
    cancelAnimationFrame(rafId);
    clearInterval(timerId);
    grapes = [];
    score = 0;
    scoreEl.textContent = '0';
    basket.x = W / 2 - basket.w / 2;
    running = true;
    lastTs = 0;
    spawnAcc = 0;
    startBtn.textContent = 'Läuft...';
    startTimer();
    rafId = requestAnimationFrame(tick);
  }

  drawBackground();
  drawBasket();
  canvas.addEventListener('mousemove', handleMove);
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    handleMove(e);
  }, { passive: false });
  startBtn.addEventListener('click', start);
}
