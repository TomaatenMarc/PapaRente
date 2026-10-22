const COLORS = ['#7fd8c4', '#aee6da', '#f3b96f', '#9fd6c0', '#c9f2e4'];
const BAD_COLOR = '#8a7b63';

export function initBubbleGame({ canvas, scoreEl, timeEl, startBtn, duration = 30 }) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  let bubbles = [];
  let popups = [];
  let score = 0;
  let timeLeft = duration;
  let running = false;
  let rafId = null;
  let timerId = null;
  let spawnAcc = 0;
  let lastTs = 0;
  let elapsed = 0;

  let idleBubbles = [];
  let idleRafId = null;
  let idleLastTs = 0;

  function spawnBubble() {
    const isBad = Math.random() < 0.24;
    const r = 9 + Math.random() * 11;
    const speedBoost = Math.min(elapsed / duration, 1) * 55;
    bubbles.push({
      x: r + Math.random() * (W - 2 * r),
      y: H + r,
      r,
      speed: 55 + Math.random() * 55 + speedBoost,
      wobble: Math.random() * Math.PI * 2,
      color: isBad ? BAD_COLOR : COLORS[Math.floor(Math.random() * COLORS.length)],
      bad: isBad,
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

  function drawBubbleShape(b, forcedAlpha) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.1, b.x, b.y, b.r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, b.color);
    grad.addColorStop(1, '#ffffffaa');
    ctx.fillStyle = grad;
    ctx.globalAlpha = forcedAlpha ?? 0.85;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = b.bad ? '#5c4f3c' : '#ffffff';
    ctx.stroke();
    if (b.bad) {
      ctx.globalAlpha = (forcedAlpha ?? 0.85) * 0.9;
      ctx.strokeStyle = '#4a3f2e';
      ctx.lineWidth = Math.max(1.4, b.r * 0.14);
      const k = b.r * 0.38;
      ctx.beginPath();
      ctx.moveTo(b.x - k, b.y - k);
      ctx.lineTo(b.x + k, b.y + k);
      ctx.moveTo(b.x + k, b.y - k);
      ctx.lineTo(b.x - k, b.y + k);
      ctx.stroke();
    }
  }

  function drawBubble(b) {
    ctx.save();
    if (b.popped) {
      const t = b.popT;
      ctx.globalAlpha = Math.max(0, 1 - t * 4);
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * (1 + t * 1.5), 0, Math.PI * 2);
      ctx.strokeStyle = b.bad ? '#c0392b' : b.color;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
      return;
    }
    drawBubbleShape(b);
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

  function drawEndState(label) {
    ctx.fillStyle = 'rgba(20, 90, 77, 0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '700 22px Fredoka, sans-serif';
    ctx.fillText(label, W / 2, H / 2 - 10);
    ctx.font = '600 16px Nunito, sans-serif';
    ctx.fillText(`${score} Punkte 🫧`, W / 2, H / 2 + 20);
  }

  function tick(ts) {
    if (!running) return;
    const dt = lastTs ? (ts - lastTs) / 1000 : 0;
    lastTs = ts;
    elapsed += dt;

    spawnAcc += dt;
    const spawnEvery = Math.max(0.24, 0.5 - elapsed * 0.01);
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
        b.wobble += dt * 2.4;
        b.x += Math.sin(b.wobble) * 0.5;
      }
      drawBubble(b);
    });

    bubbles = bubbles.filter((b) => (b.popped ? b.popT < 0.3 : b.y + b.r > -10));

    drawPopups(dt);

    rafId = requestAnimationFrame(tick);
  }

  function addPopup(x, y, text, color) {
    popups.push({ x, y, text, color, age: 0 });
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
        if (b.bad) {
          score = Math.max(0, score - 1);
          addPopup(b.x, b.y, '-1', '#c0392b');
        } else {
          score++;
          addPopup(b.x, b.y, '+1', '#1f7a68');
        }
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
    cancelAnimationFrame(idleRafId);
    cancelAnimationFrame(rafId);
    clearInterval(timerId);
    bubbles = [];
    popups = [];
    score = 0;
    elapsed = 0;
    scoreEl.textContent = '0';
    running = true;
    lastTs = 0;
    spawnAcc = 0;
    startBtn.textContent = 'Läuft...';
    startTimer();
    rafId = requestAnimationFrame(tick);
  }

  function spawnIdleBubble() {
    const r = 10 + Math.random() * 16;
    idleBubbles.push({
      x: r + Math.random() * (W - 2 * r),
      y: H + r + Math.random() * H,
      r,
      speed: 10 + Math.random() * 10,
      wobble: Math.random() * Math.PI * 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    });
  }

  function idleTick(ts) {
    if (running) return;
    const dt = idleLastTs ? (ts - idleLastTs) / 1000 : 0;
    idleLastTs = ts;

    drawBackground();

    idleBubbles.forEach((b) => {
      b.y -= b.speed * dt;
      b.wobble += dt * 1.2;
      b.x += Math.sin(b.wobble) * 0.3;
      if (b.y + b.r < 0) {
        b.y = H + b.r;
        b.x = b.r + Math.random() * (W - 2 * b.r);
      }
      ctx.save();
      drawBubbleShape(b, 0.35);
      ctx.restore();
    });

    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1f7a6899';
    ctx.font = '700 17px Fredoka, sans-serif';
    ctx.fillText('🫧', W / 2, H / 2 - 24);
    ctx.fillStyle = '#145a4dcc';
    ctx.font = '700 16px Fredoka, sans-serif';
    ctx.fillText('Bereit?', W / 2, H / 2 + 6);
    ctx.font = '600 13px Nunito, sans-serif';
    ctx.fillStyle = '#145a4daa';
    ctx.fillText('Tippe auf „Spiel starten“', W / 2, H / 2 + 28);
    ctx.restore();

    idleRafId = requestAnimationFrame(idleTick);
  }

  for (let i = 0; i < 7; i++) spawnIdleBubble();
  idleRafId = requestAnimationFrame(idleTick);

  canvas.addEventListener('click', handlePointer);
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handlePointer(e);
  }, { passive: false });
  startBtn.addEventListener('click', start);
}
