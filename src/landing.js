// Kleine Spielerei: zufällige Verzögerung für die schwebenden Icons, damit es weniger synchron wirkt.
document.querySelectorAll('.choice-float').forEach((el) => {
  const delay = Math.random() * 3;
  el.style.animationDelay = `${delay}s`;
});
