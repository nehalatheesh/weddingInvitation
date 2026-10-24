/**
 * Christian Wedding Invitation - Interactive Engine
 * Couple: Sarah Elizabeth & Jonathan David
 * Date: 22 November 2026
 */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. Audio Engine & Controls
  // ==========================================
  const audio = document.getElementById('wedding-audio');
  const audioWidget = document.getElementById('audio-widget');
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const discIcon = document.querySelector('.disc-icon i');
  const trackStatus = document.getElementById('track-status');
  let isPlaying = false;
  let webAudioSynthActive = false;
  let webAudioCtx = null;
  let synthLoopTimeout = null;

  // Web Audio API Synthesizer Fallback for Pachelbel's Canon in D
  function initWebAudioFallback() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      webAudioCtx = new AudioCtx();
      playWebAudioCanon();
    } catch (e) {
      console.warn('Web Audio fallback initialization error:', e);
    }
  }

  function playWebAudioCanon() {
    if (!webAudioCtx || !isPlaying) return;
    if (webAudioCtx.state === 'suspended') {
      webAudioCtx.resume();
    }

    const noteFreqs = {
      'D4': 293.66, 'F#4': 369.99, 'A4': 440.00, 'B4': 493.88,
      'C#5': 554.37, 'D5': 587.33, 'E5': 659.25, 'F#5': 739.99,
      'G4': 392.00, 'E4': 329.63, 'D3': 146.83, 'A2': 110.00,
      'B2': 123.47, 'F#2': 92.50, 'G2': 98.00
    };

    const bpm = 70;
    const beat = 60 / bpm;
    const pattern = [
      { bass: 'D3', mel: 'F#5', t: 0, d: 2 },
      { bass: 'A2', mel: 'E5', t: 2, d: 2 },
      { bass: 'B2', mel: 'D5', t: 4, d: 2 },
      { bass: 'F#2', mel: 'C#5', t: 6, d: 2 },
      { bass: 'G2', mel: 'B4', t: 8, d: 2 },
      { bass: 'D3', mel: 'A4', t: 10, d: 2 },
      { bass: 'G2', mel: 'B4', t: 12, d: 2 },
      { bass: 'A2', mel: 'C#5', t: 14, d: 2 }
    ];

    const now = webAudioCtx.currentTime;

    pattern.forEach(p => {
      // Play Bass note
      schedulePianoNote(noteFreqs[p.bass], now + p.t * beat, p.d * beat * 1.5, 0.28);
      // Play Melody note
      schedulePianoNote(noteFreqs[p.mel], now + p.t * beat, p.d * beat * 1.2, 0.35);
      // Play subtle chime harmonic
      schedulePianoNote(noteFreqs[p.mel] * 2, now + p.t * beat + 0.02, p.d * beat * 0.7, 0.08);
    });

    synthLoopTimeout = setTimeout(() => {
      if (isPlaying && webAudioSynthActive) {
        playWebAudioCanon();
      }
    }, 16 * beat * 1000);
  }

  function schedulePianoNote(freq, startTime, duration, volume) {
    if (!freq || !webAudioCtx) return;
    const osc = webAudioCtx.createOscillator();
    const gain = webAudioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(webAudioCtx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
  }

  function startMusic() {
    isPlaying = true;
    audio.play().then(() => {
      updateAudioWidgetUI(true);
    }).catch(err => {
      console.log('Audio file autoplay prevented or format issue, using Web Audio engine fallback:', err);
      webAudioSynthActive = true;
      initWebAudioFallback();
      updateAudioWidgetUI(true);
    });
  }

  function toggleMusic() {
    if (isPlaying) {
      isPlaying = false;
      audio.pause();
      if (synthLoopTimeout) clearTimeout(synthLoopTimeout);
      if (webAudioCtx && webAudioCtx.state === 'running') {
        webAudioCtx.suspend();
      }
      updateAudioWidgetUI(false);
    } else {
      isPlaying = true;
      if (webAudioSynthActive) {
        if (webAudioCtx && webAudioCtx.state === 'suspended') {
          webAudioCtx.resume();
        }
        playWebAudioCanon();
        updateAudioWidgetUI(true);
      } else {
        audio.play().then(() => {
          updateAudioWidgetUI(true);
        }).catch(() => {
          webAudioSynthActive = true;
          initWebAudioFallback();
          updateAudioWidgetUI(true);
        });
      }
    }
  }

  function updateAudioWidgetUI(playing) {
    if (playing) {
      discIcon.classList.remove('spin-paused');
      discIcon.classList.add('spin-animation');
      trackStatus.textContent = 'Playing Music';
    } else {
      discIcon.classList.remove('spin-animation');
      discIcon.classList.add('spin-paused');
      trackStatus.textContent = 'Paused';
    }
  }

  audioToggleBtn.addEventListener('click', toggleMusic);

  // ==========================================
  // 2. Interactive Invitation Wax Seal Open
  // ==========================================
  const openBtn = document.getElementById('open-invitation-btn');
  const overlay = document.getElementById('invitation-overlay');
  const mainContent = document.getElementById('main-content');

  openBtn.addEventListener('click', () => {
    // Add open animation classes
    overlay.classList.add('opened');
    mainContent.classList.remove('blur-locked');
    audioWidget.classList.remove('hidden');

    // Start Wedding Music
    startMusic();

    // Trigger celebration petal burst
    burstPetals();
  });

  // ==========================================
  // 3. Wedding Countdown Timer
  // Wedding Date: 22 November 2026, 10:30 AM
  // ==========================================
  const weddingDate = new Date('2026-11-22T10:30:00+05:30').getTime();

  function updateCountdown() {
    const now = new Date().getTime();
    const distance = weddingDate - now;

    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    if (distance < 0) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    daysEl.textContent = String(days).padStart(2, '0');
    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // ==========================================
  // 4. Download Calendar Event (.ics)
  // ==========================================
  const downloadIcsBtn = document.getElementById('download-ics-btn');
  downloadIcsBtn.addEventListener('click', () => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Sarah & Jonathan Wedding//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:wedding-sarah-jonathan-20261122@invitation',
      'DTSTAMP:20261024T050000Z',
      'DTSTART:20261122T050000Z',
      'DTEND:20261122T083000Z',
      'SUMMARY:Sarah & Jonathan\'s Holy Matrimony',
      'DESCRIPTION:Sacrament of Holy Matrimony & Nuptial Blessing of Sarah Elizabeth and Jonathan David. Please join us in prayer and thanksgiving.',
      'LOCATION:St. Mary\'s Christian Cathedral, Cathedral Road',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'Sarah_and_Jonathan_Wedding_22Nov2026.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // ==========================================
  // 5. Falling Petals & Golden Dust Animation
  // ==========================================
  const canvas = document.getElementById('petals-canvas');
  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const petals = [];
  const TOTAL_PETALS = 32;

  class Petal {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : -20;
      this.size = Math.random() * 8 + 8;
      this.speedY = Math.random() * 0.9 + 0.6;
      this.speedX = Math.random() * 0.6 - 0.3;
      this.rotation = Math.random() * 360;
      this.rotationSpeed = (Math.random() - 0.5) * 1.5;
      this.opacity = Math.random() * 0.45 + 0.35;
      // White, soft champagne, and gentle rose petals
      const types = ['white', 'rose', 'gold'];
      this.type = types[Math.floor(Math.random() * types.length)];
    }

    update() {
      this.y += this.speedY;
      this.x += Math.sin(this.y * 0.015) * 0.6 + this.speedX;
      this.rotation += this.rotationSpeed;

      if (this.y > height + 20) {
        this.reset();
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(this.size / 2, -this.size / 2, this.size, 0, 0, this.size);
      ctx.bezierCurveTo(-this.size, 0, -this.size / 2, -this.size / 2, 0, 0);

      if (this.type === 'gold') {
        ctx.fillStyle = `rgba(212, 175, 55, ${this.opacity * 0.8})`;
      } else if (this.type === 'rose') {
        ctx.fillStyle = `rgba(247, 218, 218, ${this.opacity})`;
      } else {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
      }

      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < TOTAL_PETALS; i++) {
    petals.push(new Petal());
  }

  function burstPetals() {
    for (let i = 0; i < 20; i++) {
      const p = new Petal();
      p.x = width / 2 + (Math.random() - 0.5) * 200;
      p.y = height / 2 + (Math.random() - 0.5) * 200;
      p.speedY = (Math.random() - 0.5) * 4;
      p.speedX = (Math.random() - 0.5) * 4;
      petals.push(p);
    }
  }

  function renderAnimation() {
    ctx.clearRect(0, 0, width, height);
    petals.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(renderAnimation);
  }

  renderAnimation();

  // ==========================================
  // 6. Prayers & Blessings Guest Greetings
  // ==========================================
  const initialBlessings = [
    {
      name: "Rev. Father Thomas & Cathedral Parish",
      message: "May the grace of our Lord Jesus Christ, the love of God, and the fellowship of the Holy Spirit be with Sarah & Jonathan always as you enter this holy covenant."
    },
    {
      name: "Uncle Joseph & Aunt Miriam",
      message: "So thrilled to celebrate this blessed milestone! We are upholding both of you in our prayers as 22 November approaches."
    },
    {
      name: "The Mathew Family",
      message: "May God richly shower your marriage with abundant joy, peace, and lasting love!"
    }
  ];

  const blessingForm = document.getElementById('blessing-form');
  const blessingsList = document.getElementById('blessings-list');
  const blessingsCount = document.getElementById('blessings-count');

  function getStoredBlessings() {
    const saved = localStorage.getItem('wedding_blessings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return initialBlessings;
      }
    }
    return initialBlessings;
  }

  function renderBlessings() {
    const blessings = getStoredBlessings();
    blessingsCount.textContent = blessings.length;
    blessingsList.innerHTML = '';

    blessings.slice().reverse().forEach(item => {
      const card = document.createElement('div');
      card.className = 'blessing-item';
      card.innerHTML = `
        <p class="blessing-author"><i class="fa-solid fa-cross"></i> ${escapeHTML(item.name)}</p>
        <p class="blessing-text">&ldquo;${escapeHTML(item.message)}&rdquo;</p>
      `;
      blessingsList.appendChild(card);
    });
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  blessingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('guest-name');
    const msgInput = document.getElementById('guest-message');

    const name = nameInput.value.trim();
    const message = msgInput.value.trim();

    if (!name || !message) return;

    const current = getStoredBlessings();
    current.push({ name, message });
    localStorage.setItem('wedding_blessings', JSON.stringify(current));

    nameInput.value = '';
    msgInput.value = '';

    renderBlessings();

    // Visual feedback
    const btn = document.getElementById('submit-blessing-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-check"></i> Blessing Sent!`;
    btn.style.background = '#2E7D32';
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.style.background = '';
    }, 2500);
  });

  renderBlessings();

});
