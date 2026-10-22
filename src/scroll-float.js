export function initScrollFloat(emojis, count = 18) {
  let triggered = false;

  function trigger() {
    if (triggered) return;
    triggered = true;
    window.removeEventListener('scroll', trigger);

    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');
      el.className = 'float-up-emoji';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      el.style.left = `${Math.random() * 96}vw`;
      el.style.fontSize = `${1.2 + Math.random() * 1.6}rem`;
      el.style.animationDuration = `${3 + Math.random() * 2}s`;
      el.style.animationDelay = `${Math.random() * 0.4}s`;
      document.body.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    }
  }

  window.addEventListener('scroll', trigger, { passive: true });
}
