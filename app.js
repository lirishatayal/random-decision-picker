/* Random Decision Picker — wheel logic & interactions */

const SEGMENT_COLORS = [
  ['#8b5cf6', '#6d28d9'],
  ['#ec4899', '#be185d'],
  ['#3b82f6', '#1d4ed8'],
  ['#14b8a6', '#0f766e'],
  ['#f59e0b', '#b45309'],
  ['#ef4444', '#b91c1c'],
  ['#06b6d4', '#0e7490'],
  ['#a855f7', '#7e22ce'],
  ['#10b981', '#047857'],
  ['#f97316', '#c2410c'],
  ['#6366f1', '#4338ca'],
  ['#e879f9', '#a21caf'],
];

const DEFAULT_OPTIONS = ['Pizza', 'Sushi', 'Tacos', 'Burger', 'Pasta'];

const PRESETS = {
  dinner: ['Pizza', 'Sushi', 'Tacos', 'Burger', 'Pasta'],
  movie: ['Comedy', 'Thriller', 'Sci-Fi', 'Romance', 'Documentary'],
  team: ['Alice', 'Bob', 'Carol', 'Dave', 'Eve'],
  weekend: ['Hike', 'Movie night', 'Board games', 'Brunch', 'Stay in'],
};

const state = {
  options: [...DEFAULT_OPTIONS],
  rotation: 0,
  spinning: false,
  soundEnabled: true,
  highlightedIndex: -1,
};

const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const wheelHint = document.getElementById('wheelHint');
const addForm = document.getElementById('addForm');
const optionInput = document.getElementById('optionInput');
const optionsList = document.getElementById('optionsList');
const optionCount = document.getElementById('optionCount');
const clearBtn = document.getElementById('clearBtn');
const resultModal = document.getElementById('resultModal');
const resultText = document.getElementById('resultText');
const spinAgainBtn = document.getElementById('spinAgainBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const soundToggle = document.getElementById('soundToggle');
const confettiCanvas = document.getElementById('confettiCanvas');
const exampleChips = document.getElementById('exampleChips');
const mobileTabs = document.getElementById('mobileTabs');
const tabOptionCount = document.getElementById('tabOptionCount');

function getSegmentAngle() {
  return (2 * Math.PI) / state.options.length;
}

function truncate(text, max = 18) {
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

function drawWheel() {
  const size = canvas.width;
  const center = size / 2;
  const radius = center - 14;
  const n = state.options.length;

  ctx.clearRect(0, 0, size, size);

  // Dark base disc
  ctx.beginPath();
  ctx.arc(center, center, radius + 6, 0, 2 * Math.PI);
  ctx.fillStyle = '#0c0c18';
  ctx.fill();

  if (n === 0) {
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    const emptyGrad = ctx.createRadialGradient(center, center, 0, center, center, radius);
    emptyGrad.addColorStop(0, 'rgba(255,255,255,0.06)');
    emptyGrad.addColorStop(1, 'rgba(255,255,255,0.02)');
    ctx.fillStyle = emptyGrad;
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '600 14px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Add options to begin', center, center);
    return;
  }

  const segmentAngle = getSegmentAngle();

  ctx.save();
  ctx.translate(center, center);
  ctx.rotate((state.rotation * Math.PI) / 180);
  ctx.translate(-center, -center);

  for (let i = 0; i < n; i++) {
    const startAngle = i * segmentAngle - Math.PI / 2;
    const endAngle = startAngle + segmentAngle;
    const [colorLight, colorDark] = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
    const isHighlighted = i === state.highlightedIndex;
    const midAngle = startAngle + segmentAngle / 2;

    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, startAngle, endAngle);
    ctx.closePath();

    const segGrad = ctx.createRadialGradient(center, center, radius * 0.15, center, center, radius);
    segGrad.addColorStop(0, colorLight);
    segGrad.addColorStop(1, colorDark);
    ctx.fillStyle = segGrad;

    if (isHighlighted) {
      ctx.shadowColor = colorLight;
      ctx.shadowBlur = 30;
    }
    ctx.fill();
    ctx.shadowBlur = 0;

    // Gloss highlight on segment
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.clip();
    const glossX = center + Math.cos(midAngle) * radius * 0.35;
    const glossY = center + Math.sin(midAngle) * radius * 0.35;
    const gloss = ctx.createRadialGradient(glossX, glossY, 0, glossX, glossY, radius * 0.55);
    gloss.addColorStop(0, 'rgba(255,255,255,0.18)');
    gloss.addColorStop(1, 'transparent');
    ctx.fillStyle = gloss;
    ctx.fillRect(0, 0, size, size);
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, startAngle, endAngle);
    ctx.strokeStyle = isHighlighted ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)';
    ctx.lineWidth = isHighlighted ? 2.5 : 1;
    ctx.stroke();

    // Label
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(midAngle);
    const fontSize = Math.max(11, Math.min(14, radius / n * 1.5));
    ctx.font = `700 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 1;
    ctx.fillText(truncate(state.options[i]), radius - 22, 0);
    ctx.restore();
  }

  // Rim dots
  const dotCount = Math.min(n * 2, 36);
  for (let d = 0; d < dotCount; d++) {
    const angle = (d / dotCount) * Math.PI * 2 - Math.PI / 2;
    const dotR = radius + 2;
    const dx = center + Math.cos(angle) * dotR;
    const dy = center + Math.sin(angle) * dotR;
    ctx.beginPath();
    ctx.arc(dx, dy, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = d % 2 === 0 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)';
    ctx.fill();
  }

  ctx.restore();

  // Center hub — metallic
  const hubR = 36;
  const hubGrad = ctx.createRadialGradient(center - 8, center - 8, 0, center, center, hubR);
  hubGrad.addColorStop(0, '#3a3a5c');
  hubGrad.addColorStop(0.5, '#1e1e32');
  hubGrad.addColorStop(1, '#0a0a14');
  ctx.beginPath();
  ctx.arc(center, center, hubR, 0, 2 * Math.PI);
  ctx.fillStyle = hubGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(center, center, hubR - 6, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const innerDot = ctx.createRadialGradient(center - 2, center - 2, 0, center, center, 8);
  innerDot.addColorStop(0, 'rgba(255,255,255,0.5)');
  innerDot.addColorStop(1, 'rgba(255,255,255,0.1)');
  ctx.beginPath();
  ctx.arc(center, center, 8, 0, 2 * Math.PI);
  ctx.fillStyle = innerDot;
  ctx.fill();
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function spin() {
  if (state.spinning || state.options.length < 2) return;

  if (state.soundEnabled) unlockAudioSync();

  state.spinning = true;
  state.highlightedIndex = -1;
  spinBtn.disabled = true;
  canvas.classList.add('spinning');
  wheelHint.textContent = 'Spinning…';

  const n = state.options.length;
  const segmentDeg = 360 / n;
  const winnerIndex = Math.floor(Math.random() * n);
  const segmentCenter = winnerIndex * segmentDeg + segmentDeg / 2;
  const extraSpins = 5 + Math.floor(Math.random() * 4);
  const currentNorm = ((state.rotation % 360) + 360) % 360;
  const targetOffset = (360 - segmentCenter + 360) % 360;
  let delta = targetOffset - currentNorm;
  if (delta <= 0) delta += 360;
  const totalRotation = state.rotation + extraSpins * 360 + delta;

  const duration = 4200 + Math.random() * 800;
  const startRotation = state.rotation;
  const startTime = performance.now();

  if (state.soundEnabled) {
    const spinSound = { durationMs: duration, segmentDeg, startRotation, totalRotation };
    if (useMobileAudio()) {
      scheduleMobileSpinAudio(spinSound);
    } else {
      playSpinStartSound();
      scheduleSpinAudio(spinSound);
    }
  }

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);

    state.rotation = startRotation + (totalRotation - startRotation) * eased;
    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      state.rotation = totalRotation;
      state.spinning = false;
      state.highlightedIndex = winnerIndex;
      drawWheel();
      canvas.classList.remove('spinning');
      spinBtn.disabled = false;
      wheelHint.textContent = 'Tap Spin to decide again';

      const winner = state.options[winnerIndex];
      setTimeout(() => showResult(winner), 400);
    }
  }

  requestAnimationFrame(animate);
}

function showResult(winner) {
  resultText.textContent = winner;
  resultModal.hidden = false;
  launchConfetti();
}

function closeModal() {
  resultModal.hidden = true;
}

function renderOptionsList() {
  optionsList.innerHTML = '';
  state.options.forEach((option, i) => {
    const li = document.createElement('li');
    li.className = 'option-chip';
    const [colorLight] = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
    li.innerHTML = `
      <span class="option-chip-color" style="background:linear-gradient(180deg,${colorLight},${SEGMENT_COLORS[i % SEGMENT_COLORS.length][1]}); color:${colorLight}"></span>
      <span class="option-chip-label">${escapeHtml(option)}</span>
      <button class="remove-btn" type="button" aria-label="Remove ${escapeHtml(option)}">×</button>
    `;
    li.querySelector('.remove-btn').addEventListener('click', () => removeOption(i));
    optionsList.appendChild(li);
  });

  const count = state.options.length;
  optionCount.textContent = count;
  if (tabOptionCount) tabOptionCount.textContent = count;
  clearBtn.disabled = count === 0;
  spinBtn.disabled = count < 2 || state.spinning;
  wheelHint.textContent = count < 2
    ? 'Add at least 2 options to start spinning'
    : 'Ready to spin!';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function addOption(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  if (state.options.some(o => o.toLowerCase() === trimmed.toLowerCase())) return;
  state.options.push(trimmed);
  state.highlightedIndex = -1;
  clearActivePreset();
  renderOptionsList();
  drawWheel();
  switchMobilePanel('options');
}

function removeOption(index) {
  if (state.spinning) return;
  state.options.splice(index, 1);
  state.highlightedIndex = -1;
  clearActivePreset();
  renderOptionsList();
  drawWheel();
}

function clearOptions() {
  if (state.spinning) return;
  state.options = [];
  state.highlightedIndex = -1;
  clearActivePreset();
  renderOptionsList();
  drawWheel();
}

function loadPreset(presetKey) {
  if (state.spinning || !PRESETS[presetKey]) return;
  state.options = [...PRESETS[presetKey]];
  state.highlightedIndex = -1;
  state.rotation = 0;
  setActivePreset(presetKey);
  renderOptionsList();
  drawWheel();
  wheelHint.textContent = 'Ready to spin!';
}

function setActivePreset(presetKey) {
  exampleChips?.querySelectorAll('.example-chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.preset === presetKey);
  });
}

function clearActivePreset() {
  exampleChips?.querySelectorAll('.example-chip').forEach((chip) => {
    chip.classList.remove('active');
  });
}

/* ── Sound ───────────────────────────────────────────────────── */
let audioCtx = null;
let mobileAudioUnlocked = false;
let spinSoundTimeouts = [];
const beepUriCache = new Map();

const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isTouchDevice = isIOS || 'ontouchstart' in window || navigator.maxTouchPoints > 0;

function useMobileAudio() {
  return isTouchDevice;
}

function createBeepWavDataUri(frequency, durationSec, volume = 0.4) {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataLength = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const attack = Math.min(1, t * 30);
    const release = Math.min(1, (durationSec - t) * 30);
    const sample = Math.sin(2 * Math.PI * frequency * t) * volume * attack * release;
    view.setInt16(44 + i * 2, sample * 0x7fff, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return `data:audio/wav;base64,${btoa(binary)}`;
}

function getBeepUri(frequency, durationSec, volume = 0.4) {
  const key = `${Math.round(frequency)}-${durationSec}-${volume}`;
  if (!beepUriCache.has(key)) {
    beepUriCache.set(key, createBeepWavDataUri(frequency, durationSec, volume));
  }
  return beepUriCache.get(key);
}

function playMobileBeep(frequency, durationSec = 0.08, volume = 0.5) {
  if (!state.soundEnabled) return;
  const audio = new Audio(getBeepUri(frequency, durationSec, volume));
  audio.volume = 1;
  audio.setAttribute('playsinline', '');
  audio.play().catch(() => {});
}

function unlockAudioSync() {
  if (useMobileAudio() && !mobileAudioUnlocked) {
    const audio = new Audio(getBeepUri(440, 0.05, 0.02));
    audio.volume = 0.01;
    audio.setAttribute('playsinline', '');
    audio.play().then(() => {
      audio.pause();
      mobileAudioUnlocked = true;
    }).catch(() => {});
    mobileAudioUnlocked = true;
  }

  const ac = getAudioCtx();
  if (ac?.state === 'suspended') ac.resume().catch(() => {});
}

function getAudioCtx() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
}

function clearSpinSoundTimeouts() {
  spinSoundTimeouts.forEach(clearTimeout);
  spinSoundTimeouts = [];
}

function scheduleMobileSpinAudio({ durationMs, segmentDeg, startRotation, totalRotation }) {
  clearSpinSoundTimeouts();
  playMobileBeep(280, 0.1, 0.55);

  let lastSeg = Math.floor((((startRotation % 360) + 360) % 360) / segmentDeg);
  const steps = Math.ceil(durationMs / 40);

  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    const eased = easeOutCubic(progress);
    const rot = startRotation + (totalRotation - startRotation) * eased;
    const norm = ((rot % 360) + 360) % 360;
    const seg = Math.floor(norm / segmentDeg);

    if (seg !== lastSeg) {
      lastSeg = seg;
      const delay = progress * durationMs;
      const freq = 480 + Math.random() * 120;
      spinSoundTimeouts.push(setTimeout(() => playMobileBeep(freq, 0.07, 0.45), delay));
    }
  }

  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    spinSoundTimeouts.push(setTimeout(
      () => playMobileBeep(freq, 0.28, 0.55),
      durationMs + 400 + i * 100,
    ));
  });
}

function playToneAt(when, { frequency, duration = 0.12, volume = 0.2, type = 'sine' }) {
  const ac = getAudioCtx();
  if (!ac || !state.soundEnabled) return;

  const oscillator = ac.createOscillator();
  const gainNode = ac.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(ac.destination);

  oscillator.type = type;
  oscillator.frequency.value = frequency;

  gainNode.gain.setValueAtTime(0.0001, when);
  gainNode.gain.linearRampToValueAtTime(volume, when + 0.008);
  gainNode.gain.linearRampToValueAtTime(0.0001, when + duration);

  oscillator.start(when);
  oscillator.stop(when + duration + 0.02);
}

function playSpinStartSound() {
  const ac = getAudioCtx();
  if (!ac || ac.state !== 'running' || !state.soundEnabled) return;
  playToneAt(ac.currentTime, { frequency: 280, duration: 0.1, volume: 0.22, type: 'triangle' });
}

function scheduleSpinAudio({ durationMs, segmentDeg, startRotation, totalRotation }) {
  const ac = getAudioCtx();
  if (!ac || ac.state !== 'running' || !state.soundEnabled) return;

  const base = ac.currentTime;
  const durationSec = durationMs / 1000;
  let lastSeg = Math.floor((((startRotation % 360) + 360) % 360) / segmentDeg);
  const steps = Math.ceil(durationMs / 40);

  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    const eased = easeOutCubic(progress);
    const rot = startRotation + (totalRotation - startRotation) * eased;
    const norm = ((rot % 360) + 360) % 360;
    const seg = Math.floor(norm / segmentDeg);

    if (seg !== lastSeg) {
      lastSeg = seg;
      playToneAt(base + progress * durationSec, {
        frequency: 480 + Math.random() * 120,
        duration: 0.05,
        volume: 0.16,
        type: 'triangle',
      });
    }
  }

  const winAt = base + durationSec + 0.4;
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    playToneAt(winAt + i * 0.1, {
      frequency: freq,
      duration: 0.28,
      volume: 0.28,
      type: 'sine',
    });
  });
}

function playTestSound() {
  unlockAudioSync();
  if (useMobileAudio()) {
    playMobileBeep(440, 0.15, 0.6);
  } else {
    const ac = getAudioCtx();
    if (ac) ac.resume().then(() => playSpinStartSound());
  }
}

/* ── Confetti ────────────────────────────────────────────────── */
const confettiParticles = [];

function launchConfetti() {
  const colors = SEGMENT_COLORS.map(([light]) => light);
  const w = confettiCanvas.width = window.innerWidth;
  const h = confettiCanvas.height = window.innerHeight;
  const cx = w / 2;
  const cy = h / 2;

  for (let i = 0; i < 120; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 8;
    confettiParticles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      w: 6 + Math.random() * 6,
      h: 4 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 12,
      opacity: 1,
      gravity: 0.15 + Math.random() * 0.1,
    });
  }

  if (!confettiAnimating) {
    confettiAnimating = true;
    animateConfetti();
  }
}

let confettiAnimating = false;

function animateConfetti() {
  const cctx = confettiCanvas.getContext('2d');
  const w = confettiCanvas.width;
  const h = confettiCanvas.height;
  cctx.clearRect(0, 0, w, h);

  for (let i = confettiParticles.length - 1; i >= 0; i--) {
    const p = confettiParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.vx *= 0.99;
    p.rotation += p.rotSpeed;
    p.opacity -= 0.008;

    if (p.opacity <= 0 || p.y > h + 20) {
      confettiParticles.splice(i, 1);
      continue;
    }

    cctx.save();
    cctx.translate(p.x, p.y);
    cctx.rotate((p.rotation * Math.PI) / 180);
    cctx.globalAlpha = p.opacity;
    cctx.fillStyle = p.color;
    cctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    cctx.restore();
  }

  if (confettiParticles.length > 0) {
    requestAnimationFrame(animateConfetti);
  } else {
    confettiAnimating = false;
    cctx.clearRect(0, 0, w, h);
  }
}

function switchMobilePanel(panel) {
  if (!mobileTabs || window.matchMedia('(min-width: 900px)').matches) return;
  mobileTabs.querySelectorAll('.mobile-tab').forEach((tab) => {
    tab.classList.toggle('is-active', tab.dataset.panel === panel);
  });
  document.querySelectorAll('.wheel-stage, .options-panel').forEach((el) => {
    el.classList.toggle('is-active', el.dataset.panel === panel);
  });
}

exampleChips?.addEventListener('click', (e) => {
  const chip = e.target.closest('.example-chip');
  if (!chip) return;
  loadPreset(chip.dataset.preset);
  switchMobilePanel('options');
});

mobileTabs?.addEventListener('click', (e) => {
  const tab = e.target.closest('.mobile-tab');
  if (!tab) return;
  switchMobilePanel(tab.dataset.panel);
});

/* ── Event listeners ─────────────────────────────────────────── */
addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addOption(optionInput.value);
  optionInput.value = '';
  optionInput.focus();
});

let lastTouchSpinAt = 0;

spinBtn.addEventListener('touchend', () => {
  lastTouchSpinAt = Date.now();
  if (state.soundEnabled) unlockAudioSync();
  spin();
}, { passive: true });
spinBtn.addEventListener('click', () => {
  if (Date.now() - lastTouchSpinAt < 500) return;
  spin();
});
clearBtn.addEventListener('click', clearOptions);
closeModalBtn.addEventListener('click', closeModal);
spinAgainBtn.addEventListener('click', () => {
  closeModal();
  spin();
});

resultModal.addEventListener('click', (e) => {
  if (e.target === resultModal) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !resultModal.hidden) closeModal();
  if (e.key === 'Enter' && document.activeElement === optionInput) {
    e.preventDefault();
    addForm.dispatchEvent(new Event('submit'));
  }
});

soundToggle.addEventListener('click', () => {
  state.soundEnabled = !state.soundEnabled;
  soundToggle.setAttribute('aria-pressed', String(state.soundEnabled));
  if (state.soundEnabled) playTestSound();
});
soundToggle.addEventListener('touchstart', () => unlockAudioSync(), { passive: true });

document.addEventListener('touchstart', unlockAudioSync, { once: true, passive: true });

window.addEventListener('resize', () => drawWheel());

/* ── Init ────────────────────────────────────────────────────── */
renderOptionsList();
drawWheel();
setActivePreset('dinner');
