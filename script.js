const startDate = new Date(2024, 6, 9, 0, 0, 0);
const loader = document.querySelector("#loader");
const cursorGlow = document.querySelector(".cursor-glow");
const musicToggle = document.querySelector("#musicToggle");
const canvas = document.querySelector("#sparkCanvas");
const ctx = canvas.getContext("2d");
const particles = [];
let audioContext;
let musicNodes = [];
let musicTimer;
let isMusicPlaying = false;

window.addEventListener("load", () => {
  setTimeout(() => loader.classList.add("is-hidden"), 900);
});

document.querySelectorAll("[data-scroll]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(button.dataset.scroll)?.scrollIntoView({ behavior: "smooth" });
    if (!isMusicPlaying) toggleMusic();
  });
});

window.addEventListener("pointermove", (event) => {
  cursorGlow.style.opacity = "1";
  cursorGlow.style.left = `${event.clientX}px`;
  cursorGlow.style.top = `${event.clientY}px`;
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    });
  },
  { threshold: 0.14 }
);

document.querySelectorAll(".reveal").forEach((item) => revealObserver.observe(item));

function updateCounter() {
  const now = new Date();
  let years = now.getFullYear() - startDate.getFullYear();
  let months = now.getMonth() - startDate.getMonth();
  let days = now.getDate() - startDate.getDate();

  if (days < 0) {
    months -= 1;
    const previousMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += previousMonth;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const anchor = new Date(
    startDate.getFullYear() + years,
    startDate.getMonth() + months,
    startDate.getDate()
  );
  const remainder = Math.max(0, now - anchor);
  const hours = Math.floor(remainder / 36e5) % 24;
  const minutes = Math.floor(remainder / 6e4) % 60;
  const seconds = Math.floor(remainder / 1e3) % 60;

  const values = { years, months, days, hours, minutes, seconds };
  Object.entries(values).forEach(([unit, value]) => {
    document.querySelector(`[data-unit="${unit}"]`).textContent = value;
  });
}

updateCounter();
setInterval(updateCounter, 1000);

const lightbox = document.querySelector("#lightbox");
const lightboxImage = lightbox.querySelector("img");

document.querySelectorAll(".gallery-item").forEach((item) => {
  item.addEventListener("click", () => {
    lightboxImage.src = item.dataset.full;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
  });
});

document.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeLightbox();
});

function closeLightbox() {
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImage.src = "";
}

function updateParallax() {
  document.querySelectorAll(".gallery-item").forEach((item) => {
    const rect = item.getBoundingClientRect();
    const offset = (rect.top - window.innerHeight / 2) * -0.035;
    item.style.setProperty("--parallax", `${Math.max(-18, Math.min(18, offset))}px`);
  });
}

window.addEventListener("scroll", updateParallax, { passive: true });
updateParallax();

function createStars(containerSelector, count = 46) {
  document.querySelectorAll(containerSelector).forEach((container) => {
    for (let i = 0; i < count; i += 1) {
      const star = document.createElement("span");
      star.className = "star";
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.setProperty("--duration", `${2 + Math.random() * 3.5}s`);
      star.style.animationDelay = `${Math.random() * 4}s`;
      container.appendChild(star);
    }
  });
}

createStars(".stars", 42);

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function addParticle(x, y, type = "confetti") {
  const colors = ["#ff5fa8", "#f6cb7a", "#9d66ff", "#ffffff", "#ff9ecb"];
  particles.push({
    x,
    y,
    vx: (Math.random() - 0.5) * (type === "firework" ? 8 : 5),
    vy: (Math.random() - 0.8) * (type === "heart" ? 4 : 7),
    gravity: type === "heart" ? 0.015 : 0.06,
    life: type === "firework" ? 90 : 130,
    size: type === "heart" ? 14 + Math.random() * 10 : 4 + Math.random() * 7,
    color: colors[Math.floor(Math.random() * colors.length)],
    type,
    rotation: Math.random() * Math.PI
  });
}

function burst() {
  const x = window.innerWidth / 2;
  const y = window.innerHeight * 0.42;
  for (let i = 0; i < 110; i += 1) addParticle(x, y, i % 3 === 0 ? "firework" : "confetti");
  for (let i = 0; i < 36; i += 1) addParticle(x + (Math.random() - 0.5) * 120, y + 80, "heart");
}

function drawHeart(x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(12, 21);
  ctx.bezierCurveTo(4, 14, 0, 10, 3, 5);
  ctx.bezierCurveTo(6, 1, 11, 3, 12, 7);
  ctx.bezierCurveTo(13, 3, 18, 1, 21, 5);
  ctx.bezierCurveTo(24, 10, 20, 14, 12, 21);
  ctx.fill();
  ctx.restore();
}

function animateParticles() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.life -= 1;
    p.rotation += 0.08;
    ctx.globalAlpha = Math.max(0, p.life / 130);

    if (p.type === "heart") {
      drawHeart(p.x, p.y, p.size, p.color);
    } else {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
      ctx.restore();
    }

    if (p.life <= 0) particles.splice(i, 1);
  }
  ctx.globalAlpha = 1;
  requestAnimationFrame(animateParticles);
}

animateParticles();

const giftBox = document.querySelector("#giftBox");
const surpriseMessage = document.querySelector("#surpriseMessage");

giftBox.addEventListener("click", () => {
  giftBox.classList.add("is-open");
  surpriseMessage.classList.add("is-visible");
  burst();
  setTimeout(burst, 500);
  if (!isMusicPlaying) toggleMusic();
});

musicToggle.addEventListener("click", toggleMusic);

function toggleMusic() {
  if (isMusicPlaying) {
    stopMusic();
  } else {
    startMusic();
  }
}

function startMusic() {
  audioContext = audioContext || new AudioContext();
  isMusicPlaying = true;
  musicToggle.classList.add("is-playing");
  playRomanticLoop();
}

function stopMusic() {
  isMusicPlaying = false;
  musicToggle.classList.remove("is-playing");
  clearTimeout(musicTimer);
  musicNodes.forEach((node) => {
    try {
      node.stop();
    } catch {
      node.disconnect?.();
    }
  });
  musicNodes = [];
}

function playTone(freq, start, duration, gainValue) {
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(gainValue, start + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(audioContext.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
  musicNodes.push(osc);
}

function playRomanticLoop() {
  if (!isMusicPlaying) return;
  const now = audioContext.currentTime + 0.05;
  const melody = [329.63, 392, 493.88, 440, 392, 329.63, 293.66, 329.63];
  const bass = [164.81, 196, 220, 196];
  melody.forEach((note, index) => playTone(note, now + index * 0.55, 0.72, 0.045));
  bass.forEach((note, index) => playTone(note, now + index * 1.1, 1.4, 0.03));
  musicTimer = setTimeout(playRomanticLoop, 4400);
}
