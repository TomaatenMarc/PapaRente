export function initGrapeGame({ canvas, scoreEl, timeEl, startBtn, duration = 30 }) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  const basket = { w: 70, h: 34, x: W / 2 - 35, y: H - 46 };
  let grapes = [];
  let popups = [];
  let score = 0;
  let timeLeft = duration;
  let running = false;
  let rafId = null;
  let timerId = null;
  let spawnAcc = 0;
  let lastTs = 0;
  let elapsed = 0;

  let idleItems = [];
  let idleRafId = null;
  let idleLastTs = 0;
  let idleBasketT = 0;

  function spawnGrape() {
    const isTrash = Math.random() < 0.26;
    const r = 11 + Math.random() * 6;
    const speedBoost = Math.min(elapsed / duration, 1) * 60;
    grapes.push({
      x: r + Math.random() * (W - 2 * r),
      y: -r,
      r,
      speed: 90 + Math.random() * 60 + speedBoost,
      rot: Math.random() * Math.PI,
      trash: isTrash,
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

  function drawGrapeCluster(g, forcedAlpha) {
    ctx.save();
    ctx.globalAlpha = forcedAlpha ?? 1;
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

  function drawTrash(g, forcedAlpha) {
    ctx.save();
    ctx.globalAlpha = forcedAlpha ?? 1;
    ctx.translate(g.x, g.y);
    ctx.rotate(g.rot);
    ctx.fillStyle = '#6b5a3c';
    ctx.beginPath();
    ctx.moveTo(-g.r, 0);
    ctx.quadraticCurveTo(-g.r * 0.3, -g.r * 0.9, g.r, 0);
    ctx.quadraticCurveTo(g.r * 0.3, g.r * 0.9, -g.r, 0);
    ctx.fill();
    ctx.strokeStyle = '#4a3d29';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-g.r * 0.8, 0);
    ctx.lineTo(g.r * 0.8, 0);
    ctx.stroke();
    ctx.restore();
  }

  function drawItem(g, forcedAlpha) {
    if (g.trash) {
      drawTrash(g, forcedAlpha);
    } else {
      drawGrapeCluster(g, forcedAlpha);
    }
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

  function drawPopups(dt) {
    popups.forEach((p) => {
      p.age += dt;
      p.y -= 26 * dt;
    });
    popups = popups.filter((p) => p.age < 0.7);
    popups.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - p.age / 0.7);
      ctx.fillStyle = p.color;
      ctx.font = '800 15px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.text, p.x, p.y);
      ctx.restore();
    });
  }

  function addPopup(x, y, text, color) {
    popups.push({ x, y, text, color, age: 0 });
  }

  function drawEndState(label) {
    ctx.fillStyle = 'rgba(63, 88, 38, 0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '700 22px Fredoka, sans-serif';
    ctx.fillText(label, W / 2, H / 2 - 10);
    ctx.font = '600 16px Nunito, sans-serif';
    ctx.fillText(`${score} Punkte 🍇`, W / 2, H / 2 + 20);
  }

  function tick(ts) {
    if (!running) return;
    const dt = lastTs ? (ts - lastTs) / 1000 : 0;
    lastTs = ts;
    elapsed += dt;

    spawnAcc += dt;
    const spawnEvery = Math.max(0.32, 0.62 - elapsed * 0.012);
    if (spawnAcc > spawnEvery) {
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
        if (g.trash) {
          score = Math.max(0, score - 1);
          addPopup(g.x, basket.y, '-1', '#c0392b');
        } else {
          score++;
          addPopup(g.x, basket.y, '+1', '#3f5826');
        }
        scoreEl.textContent = score;
        return false;
      }
      return g.y - g.r < H;
    });

    grapes.forEach((g) => drawItem(g));
    drawBasket();
    drawPopups(dt);

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
    cancelAnimationFrame(idleRafId);
    cancelAnimationFrame(rafId);
    clearInterval(timerId);
    grapes = [];
    popups = [];
    score = 0;
    elapsed = 0;
    scoreEl.textContent = '0';
    basket.x = W / 2 - basket.w / 2;
    running = true;
    lastTs = 0;
    spawnAcc = 0;
    startBtn.textContent = 'Läuft...';
    startTimer();
    rafId = requestAnimationFrame(tick);
  }

  function spawnIdleItem() {
    const r = 10 + Math.random() * 7;
    idleItems.push({
      x: r + Math.random() * (W - 2 * r),
      y: -r - Math.random() * H,
      r,
      speed: 18 + Math.random() * 16,
      rot: Math.random() * Math.PI,
      trash: Math.random() < 0.2,
    });
  }

  function idleTick(ts) {
    if (running) return;
    const dt = idleLastTs ? (ts - idleLastTs) / 1000 : 0;
    idleLastTs = ts;
    idleBasketT += dt;

    drawBackground();

    idleItems.forEach((g) => {
      g.y += g.speed * dt;
      if (g.y - g.r > H) {
        g.y = -g.r;
        g.x = g.r + Math.random() * (W - 2 * g.r);
      }
      drawItem(g, 0.35);
    });

    basket.x = W / 2 - basket.w / 2 + Math.sin(idleBasketT * 1.4) * 40;
    drawBasket();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#3f5826cc';
    ctx.font = '700 16px Fredoka, sans-serif';
    ctx.fillText('Bereit?', W / 2, H / 2 - 24);
    ctx.font = '600 13px Nunito, sans-serif';
    ctx.fillStyle = '#3f5826aa';
    ctx.fillText('Tippe auf „Spiel starten“', W / 2, H / 2 - 2);
    ctx.restore();

    idleRafId = requestAnimationFrame(idleTick);
  }

  for (let i = 0; i < 6; i++) spawnIdleItem();
  idleRafId = requestAnimationFrame(idleTick);

  canvas.addEventListener('mousemove', handleMove);
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    handleMove(e);
  }, { passive: false });
  startBtn.addEventListener('click', start);
}
