/* ===== Employee App ===== */
const EmployeeApp = {
  state: {
    currentStage: parseInt(Storage.get('stage') || '2'),
    completed: Storage.get('completed') || [],
    unlockedBadges: Storage.get('badges') || ['first_hello'],
    theme: Storage.get('theme') || 'light',
    userName: Storage.get('name') || 'Александр',
  },
  
  init() {
    this.applyTheme(this.state.theme);
    this.renderTimeline();
    this.renderCurrentStage();
    this.renderChecklist();
    this.renderAchievements();
    this.updateProgress();
    this.bindEvents();
    ChatModule.init();
    this.updateTip();
  },
  
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.state.theme = theme;
    Storage.set('theme', theme);
    const icon = document.getElementById('themeIcon');
    icon.innerHTML = theme === 'dark'
      ? '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'
      : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
  },
  
  renderTimeline() {
    const list = document.getElementById('timelineList');
    list.innerHTML = STAGES.map(s => {
      const isCompleted = this.state.completed.includes(s.id);
      const isCurrent = s.id === this.state.currentStage;
      const cls = isCompleted ? 'completed' : (isCurrent ? 'current' : '');
      return `
        <div class="stage ${cls}" data-stage="${s.id}">
          <div class="stage-dot">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="stage-card">
            <div class="stage-header">
              <div class="stage-title">${s.title}</div>
              <div class="stage-date">${s.date}</div>
            </div>
            <div class="stage-desc">${s.desc}</div>
            <span class="stage-badge">${isCompleted ? '✓ Пройдено' : (isCurrent ? '● Текущий' : '○ Впереди')}</span>
          </div>
        </div>
      `;
    }).join('');
    
    list.querySelectorAll('.stage').forEach(el => {
      el.addEventListener('click', () => {
        const id = parseInt(el.dataset.stage);
        this.openStageDetail(id);
      });
    });
  },
  
  renderCurrentStage() {
    const s = STAGES.find(x => x.id === this.state.currentStage) || STAGES[0];
    document.getElementById('currentStageTitle').textContent = s.title;
    document.getElementById('currentStageDesc').textContent = s.desc;
    document.getElementById('userName').textContent = this.state.userName + ' 👋';
  },
  
  updateProgress() {
    const total = STAGES.length - 1;
    const done = this.state.completed.filter(x => typeof x === 'number').length;
    const pct = Math.round((done / total) * 100);
    document.getElementById('progressValue').textContent = pct + '%';
    document.getElementById('progressFill').style.width = pct + '%';
    document.getElementById('stageCounter').textContent = `Этап ${this.state.currentStage} из ${total}`;
    const daysLeft = Math.max(0, 90 - this.state.currentStage * 7);
    document.getElementById('daysLeft').textContent = `Осталось ~${daysLeft} дн.`;
  },
  
  renderChecklist() {
    const items = ['Паспорт, СНИЛС, ИНН', 'Трудовая книжка / сведения СТД-Р', 'Документ об образовании', 'Фото 3×4 (2 шт.)', 'Реквизиты для зарплаты', 'Настройка корп. почты', 'Знакомство с руководителем'];
    const list = document.getElementById('checklist');
    list.innerHTML = items.map((t, i) => `
      <label class="resource" style="cursor:pointer">
        <input type="checkbox" ${this.state.completed.includes('cl_'+i) ? 'checked' : ''} data-cl="${i}" style="width:20px;height:20px;accent-color:var(--primary)">
        <div style="flex:1"><div class="resource-title">${t}</div></div>
      </label>
    `).join('');
    list.querySelectorAll('input[type=checkbox]').forEach(cb => {
      cb.addEventListener('change', e => {
        const key = 'cl_' + e.target.dataset.cl;
        if (e.target.checked) {
          if (!this.state.completed.includes(key)) this.state.completed.push(key);
        } else {
          this.state.completed = this.state.completed.filter(x => x !== key);
        }
        Storage.set('completed', this.state.completed);
      });
    });
  },
  
  renderAchievements() {
    const list = document.getElementById('achievementsList');
    list.innerHTML = ACHIEVEMENTS.map(b => {
      const unlocked = this.state.unlockedBadges.includes(b.id);
      return `
        <div class="badge ${unlocked ? 'unlocked' : 'locked'}" title="${b.desc}">
          <div class="badge-icon">${b.icon}</div>
          <div class="badge-name">${b.name}</div>
        </div>
      `;
    }).join('');
  },
  
  unlockBadge(id) {
    if (!this.state.unlockedBadges.includes(id)) {
      this.state.unlockedBadges.push(id);
      Storage.set('badges', this.state.unlockedBadges);
      this.renderAchievements();
      const b = ACHIEVEMENTS.find(x => x.id === id);
      this.showToast(` Достижение: ${b.name}`);
    }
  },
  
  updateTip() {
    const tip = TIPS[this.state.currentStage % TIPS.length];
    document.getElementById('tipTitle').textContent = tip.title;
    document.getElementById('tipText').textContent = tip.text;
  },
  
  bindEvents() {
    document.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
        document.querySelectorAll('.section').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        document.getElementById(t.dataset.tab).classList.add('active');
      });
    });
    
    document.querySelectorAll('.nav-item').forEach(n => {
      n.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(x => x.classList.remove('active'));
        document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
        n.classList.add('active');
        const tab = document.querySelector(`.tab[data-tab="${n.dataset.nav}"]`);
        if (tab) tab.classList.add('active');
        document.querySelectorAll('.section').forEach(x => x.classList.remove('active'));
        document.getElementById(n.dataset.nav).classList.add('active');
      });
    });
    
    document.getElementById('themeToggle').addEventListener('click', () => {
      this.applyTheme(this.state.theme === 'light' ? 'dark' : 'light');
    });
    
    document.getElementById('hrAccessBtn').addEventListener('click', () => {
      HRModule.openLogin();
    });
    
    document.querySelectorAll('.action').forEach(a => {
      a.addEventListener('click', () => this.handleAction(a.dataset.action));
    });
    document.querySelectorAll('.resource').forEach(r => {
      if (r.dataset.link) r.addEventListener('click', () => window.open(r.dataset.link, '_blank'));
      else if (r.dataset.action) r.addEventListener('click', () => this.handleAction(r.dataset.action));
    });
    
    document.getElementById('currentStageCta').addEventListener('click', () => this.completeCurrentStage());
  },
  
  handleAction(action) {
    const map = {
      hr: () => ChatModule.openWith('Хочу связаться с HR-специалистом'),
      recruiter: () => this.showToast(' AMATSEROVA@ALFABANK.RU скопирован'),
      docs: () => this.showToast('📄 Список документов открыт'),
      map: () => this.showToast('🗺️ Карта офиса загружается'),
      food: () => this.showToast('🍽️ PDF с заведениями скачан'),
      contacts: () => window.open('https://my.polyplastic.ru/employees/Pages/address-book.aspx', '_blank'),
      films: () => alert(' Фильмы:\n\n1. Дьявол носит Prada\n2. Стажёр\n3. В погоне за счастьем\n4. Мне бы в небо\n5. Я не знаю, как она делает это'),
      books: () => alert(' Книги:\n\n• Ты способна на большее\n• Найти своё призвание\n• Кради как художник\n• Между надо и хочу\n• Предназначение\n• Работа твоей мечты\n• Работа\n• Энергия — новая валюта'),
      sport: () => this.showToast('💪 Спортивный комплекс: Пн-Пт 7:00-22:00'),
      transport: () => this.showToast('🚌 Расписание транспорта обновлено'),
    };
    (map[action] || (() => this.showToast('Раздел в разработке')))();
  },
  
  completeCurrentStage() {
    if (!this.state.completed.includes(this.state.currentStage)) {
      this.state.completed.push(this.state.currentStage);
      Storage.set('completed', this.state.completed);
    }
    if (this.state.currentStage < STAGES.length - 1) {
      this.state.currentStage++;
      Storage.set('stage', this.state.currentStage);
      this.renderTimeline();
      this.renderCurrentStage();
      this.updateProgress();
      this.updateTip();
      const map = { 0: 'first_hello', 2: 'day_one', 3: 'foodie', 5: 'plan_master', 7: 'survey_1', 8: 'month_1' };
      if (map[this.state.currentStage]) this.unlockBadge(map[this.state.currentStage]);
      this.showToast(`✅ Этап пройден! Следующий: ${STAGES[this.state.currentStage].title}`);
    } else {
      this.unlockBadge('finisher');
      this.showToast('🎉 Поздравляем! Онбординг завершён!');
    }
  },
  
  openStageDetail(id) {
    const s = STAGES.find(x => x.id === id);
    if (id < this.state.currentStage) {
      this.showToast(`✓ ${s.title} — уже пройдено`);
    } else if (id === this.state.currentStage) {
      this.completeCurrentStage();
    } else {
      this.showToast(`⏳ Этап откроется ${s.date}`);
    }
  },
  
  showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
  }
};

document.addEventListener('DOMContentLoaded', () => EmployeeApp.init());
