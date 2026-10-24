/* ===== Corsic Mascot — полноценный SVG-персонаж ===== */
const CorsicMascot = {
  prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,

  /* SVG-шаблон маскота (бело-чёрный робот с голубыми деталями) */
  svgTemplate(size) {
    return `
      <svg class="mascot-svg" viewBox="0 0 200 240" width="${size}" height="${size * 1.2}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Корсик — маскот ПОЛИПЛАСТИК">
        <defs>
          <radialGradient id="headGrad_${size}" cx="35%" cy="30%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="60%" stop-color="#e0e7ff"/>
            <stop offset="100%" stop-color="#a5b4fc"/>
          </radialGradient>
          <radialGradient id="bodyGrad_${size}" cx="50%" cy="40%">
            <stop offset="0%" stop-color="#2a3650"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </radialGradient>
          <linearGradient id="logoGrad_${size}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#6366f1"/>
            <stop offset="100%" stop-color="#8b5cf6"/>
          </linearGradient>
          <filter id="shadow_${size}">
            <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.15"/>
          </filter>
        </defs>

        <!-- Ноги -->
        <g id="legLeft" class="leg" style="transform-origin: 75px 180px;">
          <ellipse cx="75" cy="210" rx="18" ry="22" fill="#e0e7ff" stroke="#cbd5e1" stroke-width="2"/>
          <rect x="65" y="175" width="20" height="30" rx="10" fill="#2a3650"/>
          <circle cx="75" cy="180" r="8" fill="#6366f1" opacity="0.6"/>
        </g>
        <g id="legRight" class="leg" style="transform-origin: 125px 180px;">
          <ellipse cx="125" cy="210" rx="18" ry="22" fill="#e0e7ff" stroke="#cbd5e1" stroke-width="2"/>
          <rect x="115" y="175" width="20" height="30" rx="10" fill="#2a3650"/>
          <circle cx="125" cy="180" r="8" fill="#6366f1" opacity="0.6"/>
        </g>

        <!-- Торс -->
        <g id="torso" filter="url(#shadow_${size})">
          <rect x="50" y="110" width="100" height="80" rx="20" fill="url(#bodyGrad_${size})"/>
          <rect x="55" y="115" width="90" height="15" rx="7" fill="#1e293b" opacity="0.5"/>
          <rect x="55" y="135" width="90" height="15" rx="7" fill="#1e293b" opacity="0.5"/>
          <rect x="55" y="155" width="90" height="15" rx="7" fill="#1e293b" opacity="0.5"/>
          <circle cx="100" cy="145" r="18" fill="url(#logoGrad_${size})"/>
          <text x="100" y="142" font-family="Inter, sans-serif" font-size="8" font-weight="800" fill="white" text-anchor="middle">POLY</text>
          <text x="100" y="152" font-family="Inter, sans-serif" font-size="7" font-weight="700" fill="white" text-anchor="middle">PLASTIC</text>
        </g>

        <!-- Руки -->
        <g id="armLeft" class="arm" style="transform-origin: 50px 130px;">
          <rect x="20" y="120" width="35" height="18" rx="9" fill="#2a3650"/>
          <circle cx="25" cy="129" r="12" fill="#e0e7ff" stroke="#cbd5e1" stroke-width="2"/>
          <circle cx="20" cy="125" r="3" fill="#0f172a"/>
          <circle cx="15" cy="129" r="3" fill="#0f172a"/>
          <circle cx="15" cy="134" r="3" fill="#0f172a"/>
          <circle cx="20" cy="137" r="3" fill="#0f172a"/>
          <circle cx="28" cy="137" r="3" fill="#0f172a"/>
        </g>
        <g id="armRight" class="arm" style="transform-origin: 150px 130px;">
          <rect x="145" y="120" width="35" height="18" rx="9" fill="#2a3650"/>
          <circle cx="175" cy="129" r="12" fill="#e0e7ff" stroke="#cbd5e1" stroke-width="2"/>
          <circle cx="180" cy="125" r="3" fill="#0f172a"/>
          <circle cx="185" cy="129" r="3" fill="#0f172a"/>
          <circle cx="185" cy="134" r="3" fill="#0f172a"/>
          <circle cx="180" cy="137" r="3" fill="#0f172a"/>
          <circle cx="172" cy="137" r="3" fill="#0f172a"/>
        </g>

        <!-- Голова -->
        <g id="mascotHead" class="head" style="transform-origin: 100px 80px;">
          <circle cx="100" cy="80" r="50" fill="url(#headGrad_${size})" stroke="#cbd5e1" stroke-width="2" filter="url(#shadow_${size})"/>
          <ellipse cx="100" cy="35" rx="45" ry="8" fill="#a5b4fc" opacity="0.3"/>
          <circle cx="55" cy="80" r="12" fill="#2a3650"/>
          <circle cx="55" cy="80" r="8" fill="#6366f1" opacity="0.6"/>
          <circle cx="55" cy="80" r="4" fill="#a5b4fc"/>
          <g id="eyes">
            <ellipse id="eyeLeft" cx="82" cy="75" rx="6" ry="8" fill="#6366f1"/>
            <ellipse id="eyeRight" cx="118" cy="75" rx="6" ry="8" fill="#6366f1"/>
            <circle cx="84" cy="73" r="2" fill="white"/>
            <circle cx="120" cy="73" r="2" fill="white"/>
          </g>
          <path id="mouth" d="M 90 90 Q 100 98 110 90" stroke="#6366f1" stroke-width="3" fill="none" stroke-linecap="round"/>
        </g>
      </svg>
    `;
  },

  /* Анимации */
  animations: {
    idle(svg) {
      if (CorsicMascot.prefersReducedMotion) return;
      const head = svg.querySelector('#mascotHead');
      const breathe = () => {
        head.style.transition = 'transform 3s ease-in-out';
        head.style.transform = 'translateY(-3px)';
        setTimeout(() => { head.style.transform = 'translateY(0)'; }, 1500);
      };
      breathe();
      svg._idleInterval = setInterval(breathe, 3000);
    },
    wave(svg) {
      if (CorsicMascot.prefersReducedMotion) return;
      const arm = svg.querySelector('#armRight');
      let count = 0;
      const wave = () => {
        arm.style.transition = 'transform 0.4s ease-in-out';
        arm.style.transform = 'rotate(-30deg)';
        setTimeout(() => { arm.style.transform = 'rotate(0deg)'; }, 400);
        count++;
        if (count < 3) setTimeout(wave, 800);
      };
      wave();
    },
    step(svg) {
      if (CorsicMascot.prefersReducedMotion) return;
      const legL = svg.querySelector('#legLeft');
      const legR = svg.querySelector('#legRight');
      let count = 0;
      const step = () => {
        legL.style.transition = 'transform 0.3s ease';
        legR.style.transition = 'transform 0.3s ease';
        legL.style.transform = 'rotate(15deg)';
        legR.style.transform = 'rotate(-15deg)';
        setTimeout(() => {
          legL.style.transform = 'rotate(-15deg)';
          legR.style.transform = 'rotate(15deg)';
        }, 300);
        setTimeout(() => {
          legL.style.transform = 'rotate(0)';
          legR.style.transform = 'rotate(0)';
        }, 600);
        count++;
        if (count < 2) setTimeout(step, 700);
      };
      step();
    },
    happy(svg) {
      if (CorsicMascot.prefersReducedMotion) return;
      const eyes = svg.querySelectorAll('#eyeLeft, #eyeRight');
      const mouth = svg.querySelector('#mouth');
      eyes.forEach(eye => {
        eye.style.transition = 'all 0.3s ease';
        eye.setAttribute('ry', '3');
        eye.setAttribute('rx', '8');
      });
      mouth.setAttribute('d', 'M 85 88 Q 100 102 115 88');
      setTimeout(() => {
        eyes.forEach(eye => { eye.setAttribute('ry', '8'); eye.setAttribute('rx', '6'); });
        mouth.setAttribute('d', 'M 90 90 Q 100 98 110 90');
      }, 2000);
    },
    reset(svg) {
      const elements = svg.querySelectorAll('.head, .arm, .leg, #eyeLeft, #eyeRight, #mouth');
      elements.forEach(el => { el.style.transition = 'all 0.5s ease'; el.style.transform = ''; });
      svg.querySelector('#eyeLeft').setAttribute('ry', '8');
      svg.querySelector('#eyeRight').setAttribute('ry', '8');
      svg.querySelector('#mouth').setAttribute('d', 'M 90 90 Q 100 98 110 90');
      if (svg._idleInterval) { clearInterval(svg._idleInterval); svg._idleInterval = null; }
    }
  },

  /* Инициализация всех маскотов на странице */
  initAll() {
    const slots = [
      { id: 'headerMascot', size: 28, animation: 'idle' },
      { id: 'stageMascot', size: 110, animation: 'wave' },
      { id: 'tipMascot', size: 48, animation: 'happy' },
      { id: 'fabMascot', size: 36, animation: 'idle' },
      { id: 'loginMascot', size: 130, animation: 'wave' },
      { id: 'hrLogoMascot', size: 32, animation: 'idle' },
      { id: 'chatMascot', size: 36, animation: 'happy' },
    ];
    slots.forEach(slot => {
      const el = document.getElementById(slot.id);
      if (el) {
        el.innerHTML = this.svgTemplate(slot.size);
        const svg = el.querySelector('.mascot-svg');
        setTimeout(() => this.animations[slot.animation](svg), 100);
      }
    });
    this.initCursorFollow();
  },

  /* Слежение за курсором для крупных маскотов */
  initCursorFollow() {
    const largeSlots = ['loginMascot', 'stageMascot'];
    if (this.prefersReducedMotion) return;
    document.addEventListener('mousemove', (e) => {
      largeSlots.forEach(id => {
        const container = document.getElementById(id);
        if (!container) return;
        const svg = container.querySelector('.mascot-svg');
        if (!svg) return;
        const rect = container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = (e.clientX - centerX) / 60;
        const deltaY = (e.clientY - centerY) / 60;
        const head = svg.querySelector('#mascotHead');
        const eyes = svg.querySelectorAll('#eyeLeft, #eyeRight');
        head.style.transition = 'transform 0.1s ease-out';
        head.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        eyes.forEach(eye => {
          const cx = parseFloat(eye.getAttribute('cx'));
          eye.setAttribute('cx', cx + deltaX * 0.3);
        });
      });
    });
  },

  /* Запуск конкретной анимации на контейнере */
  triggerAnimation(containerId, animation) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const svg = container.querySelector('.mascot-svg');
    if (svg && this.animations[animation]) {
      this.animations.reset(svg);
      setTimeout(() => this.animations[animation](svg), 100);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => CorsicMascot.initAll());
