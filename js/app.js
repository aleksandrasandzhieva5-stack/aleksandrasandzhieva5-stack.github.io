/* Универсальное окно «Написать в MAX» */
const Contact = {
  open({ name, role, link }) {
    document.getElementById('contactAvatar').textContent = initials(name);
    document.getElementById('contactName').textContent = name;
    document.getElementById('contactRole').textContent = role || '';
    ['contactLink', 'contactOpen'].forEach(id => document.getElementById(id).href = link);
    document.getElementById('contactLink').textContent = link.replace('https://', '');
    this.link = link;
    document.getElementById('contactModal').classList.add('open');
  },
  init() {
    document.getElementById('contactCopy').addEventListener('click', () => {
      const done = () => EmployeeApp.showToast('🔗 Ссылка скопирована');
      if (navigator.clipboard) navigator.clipboard.writeText(this.link).then(done, done); else done();
    });
    document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => document.getElementById(b.dataset.close).classList.remove('open')));
    document.querySelectorAll('.modal-overlay.center').forEach(o => o.addEventListener('click', e => {
      if (e.target === o && !['uploadModal', 'consentModal'].includes(o.id)) o.classList.remove('open');
    }));
  }
};

const BADGE_BY_STAGE = { 0: 'first_hello', 2: 'day_one', 3: 'foodie', 5: 'plan_master', 7: 'survey_1', 8: 'month_1', 12: 'finisher' };

const EmployeeApp = {
  state: {
    /* progress: { stageId: 'done' | 'skipped' }, tasks: { stageId: [индексы выполненных шагов] } */
    progress: Storage.get('progress', { 0: 'done', 1: 'done' }),
    tasks: Storage.get('tasks', {}),
    unlockedBadges: Storage.get('badges', ['first_hello']),
    theme: Storage.get('theme', 'light'),
    userName: Storage.get('name', 'Александр'),
  },
  /* Текущий этап = первый необработанный. Этап «открыт», если все предыдущие done/skipped */
  currentId() { const s = STAGES.find(x => !this.state.progress[x.id]); return s ? s.id : null; },
  statusOf(id) {
    const p = this.state.progress[id];
    if (p) return p;
    return id === this.currentId() ? 'current' : 'locked';
  },
  save() { Storage.set('progress', this.state.progress); Storage.set('tasks', this.state.tasks); },

  init() {
    this.applyTheme(this.state.theme);
    this.renderAll(); this.renderChecklist(); this.renderAchievements();
    this.bindEvents();
    ChatModule.init(); Contact.init(); this.initConsent();
  },
  renderAll() { this.renderTimeline(); this.renderCurrentStage(); this.updateProgress(); this.updateTip(); },

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.state.theme = theme; Storage.set('theme', theme);
    document.getElementById('themeIcon').innerHTML = theme === 'dark'
      ? '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'
      : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
  },

  /* ---------- этапы ---------- */
  renderTimeline() {
    const list = document.getElementById('timelineList');
    const label = { done: '✓ Пройдено', skipped: '⏭ Пропущено', current: '● Текущий — нажмите, чтобы открыть', locked: '🔒 Откроется позже' };
    list.innerHTML = STAGES.map(s => {
      const st = this.statusOf(s.id), doneT = (this.state.tasks[s.id] || []).length;
      return `<div class="stage ${st === 'done' ? 'completed' : st}" data-stage="${s.id}">
        <div class="stage-dot"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
        <div class="stage-card">
          <div class="stage-header"><div class="stage-title">${s.title}</div><div class="stage-date">${s.date}</div></div>
          <div class="stage-desc">${s.desc}</div>
          <div class="stage-meta"><span class="stage-badge">${label[st]}</span>
            ${s.mandatory ? '<span class="stage-badge must">Обязательный</span>' : '<span class="stage-badge">Можно пропустить</span>'}
            ${st === 'current' || st === 'done' ? `<span class="stage-badge">${doneT}/${s.tasks.length} шагов</span>` : ''}</div>
        </div></div>`;
    }).join('');
    list.querySelectorAll('.stage').forEach(el => el.addEventListener('click', () => this.openStage(+el.dataset.stage)));
  },
  renderCurrentStage() {
    const id = this.currentId(), s = STAGES.find(x => x.id === id);
    document.getElementById('currentStageTitle').textContent = s ? s.title : 'Онбординг завершён 🎉';
    document.getElementById('currentStageDesc').textContent = s ? s.desc : 'Вы прошли все этапы. Спасибо, что были с нами!';
    document.getElementById('currentStageCta').style.display = s ? '' : 'none';
    document.getElementById('userName').textContent = this.state.userName + ' 👋';
  },
  updateProgress() {
    const total = STAGES.length, p = this.state.progress;
    const done = STAGES.filter(s => p[s.id] === 'done').length, skipped = STAGES.filter(s => p[s.id] === 'skipped').length;
    const pct = Math.round(done / total * 100), cur = this.currentId();
    document.getElementById('progressValue').textContent = pct + '%';
    document.getElementById('progressFill').style.width = pct + '%';
    document.getElementById('stageCounter').textContent = `Пройдено ${done} из ${total}` + (skipped ? ` · пропущено ${skipped}` : '');
    document.getElementById('daysLeft').textContent = cur === null ? 'Всё готово' : `Сейчас: этап ${cur + 1}`;
  },
  updateTip() {
    const t = TIPS[(this.currentId() || 0) % TIPS.length];
    document.getElementById('tipTitle').textContent = t.title;
    document.getElementById('tipText').textContent = t.text;
  },

  openStage(id) {
    const s = STAGES.find(x => x.id === id), st = this.statusOf(id);
    const done = this.state.tasks[id] || [];
    const canAct = st === 'current';
    const allDone = done.length === s.tasks.length;
    const statusTxt = { done: '✓ Пройдено', skipped: '⏭ Пропущено', current: 'Текущий этап', locked: '🔒 Откроется после предыдущих этапов' }[st];
    document.getElementById('stageBody').innerHTML = `
      <div class="st-head"><small>${statusTxt} · ${s.date}</small><h2>${s.title}</h2>
        <span class="stage-badge ${s.mandatory ? 'must' : ''}">${s.mandatory ? 'Обязательный этап' : 'Необязательный этап'}</span></div>
      <p class="st-desc">${s.desc}</p>
      ${s.tasks.map((t, i) => `<label class="task ${done.includes(i) ? 'done' : ''} ${canAct ? '' : 'disabled'}">
        <input type="checkbox" data-task="${i}" ${done.includes(i) ? 'checked' : ''} ${canAct ? '' : 'disabled'}><span>${t}</span></label>`).join('')}
      <div class="st-progress">Выполнено шагов: ${done.length} из ${s.tasks.length}</div>
      ${canAct ? `<div class="st-actions">
          <button class="btn-primary" id="stFinish" ${allDone ? '' : 'disabled'}>Завершить этап ✓</button>
          ${s.mandatory ? '' : '<button class="btn-secondary" id="stSkip">Пропустить этап</button>'}
        </div>
        <div class="st-note">${allDone ? 'Всё выполнено — можно завершать этап.' : 'Отметьте все шаги, чтобы завершить этап.'}${s.mandatory ? ' Этап обязательный, пропустить его нельзя.' : ''}</div>`
      : st === 'locked' ? '<div class="st-note">Этап откроется автоматически после завершения предыдущих. Пропустить его заранее нельзя.</div>'
      : '<div class="st-note">Этап уже обработан — его можно просматривать в любой момент.</div>'}`;
    const body = document.getElementById('stageBody');
    body.querySelectorAll('[data-task]').forEach(cb => cb.addEventListener('change', e => {
      const set = new Set(this.state.tasks[id] || []);
      e.target.checked ? set.add(+e.target.dataset.task) : set.delete(+e.target.dataset.task);
      this.state.tasks[id] = [...set]; this.save();
      this.openStage(id); this.renderTimeline();
    }));
    const fin = document.getElementById('stFinish'), skip = document.getElementById('stSkip');
    if (fin) fin.addEventListener('click', () => this.finishStage(id, 'done'));
    if (skip) skip.addEventListener('click', () => { if (confirm('Пропустить этап «' + s.title + '»? Вернуться к нему позже будет нельзя.')) this.finishStage(id, 'skipped'); });
    document.getElementById('stageModal').classList.add('open');
  },
  finishStage(id, how) {
    this.state.progress[id] = how; this.save();
    document.getElementById('stageModal').classList.remove('open');
    if (how === 'done' && BADGE_BY_STAGE[id]) this.unlockBadge(BADGE_BY_STAGE[id]);
    this.renderAll();
    const next = STAGES.find(x => x.id === this.currentId());
    this.showToast(how === 'done' ? (next ? '✅ Этап завершён! Далее: ' + next.title : '🎉 Онбординг завершён!') : '⏭ Этап пропущен');
  },

  /* ---------- остальное ---------- */
  renderChecklist() {
    const items = ['Паспорт, СНИЛС, ИНН', 'Трудовая книжка / сведения СТД-Р', 'Документ об образовании', 'Фото 3×4 (2 шт.)', 'Реквизиты для зарплаты', 'Настройка корп. почты', 'Знакомство с руководителем'];
    const done = Storage.get('checklist', []);
    const list = document.getElementById('checklist');
    list.innerHTML = items.map((t, i) => `<label class="resource"><input type="checkbox" ${done.includes(i) ? 'checked' : ''} data-cl="${i}" style="width:20px;height:20px;accent-color:var(--primary)"><div class="resource-title">${t}</div></label>`).join('');
    list.querySelectorAll('input').forEach(cb => cb.addEventListener('change', e => {
      const set = new Set(Storage.get('checklist', []));
      e.target.checked ? set.add(+e.target.dataset.cl) : set.delete(+e.target.dataset.cl);
      Storage.set('checklist', [...set]);
    }));
  },
  renderAchievements() {
    document.getElementById('achievementsList').innerHTML = ACHIEVEMENTS.map(b => {
      const u = this.state.unlockedBadges.includes(b.id);
      return `<div class="badge ${u ? 'unlocked' : 'locked'}" title="${b.desc}"><div class="badge-icon">${b.icon}</div><div class="badge-name">${b.name}</div></div>`;
    }).join('');
  },
  unlockBadge(id) {
    if (this.state.unlockedBadges.includes(id)) return;
    this.state.unlockedBadges.push(id); Storage.set('badges', this.state.unlockedBadges);
    this.renderAchievements();
    setTimeout(() => this.showToast('🏆 Достижение: ' + ACHIEVEMENTS.find(x => x.id === id).name), 1200);
  },
  switchSection(id) {
    document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x.dataset.tab === id));
    document.querySelectorAll('.nav-item').forEach(x => x.classList.toggle('active', x.dataset.nav === id));
    document.querySelectorAll('.section').forEach(x => x.classList.toggle('active', x.id === id));
  },
  bindEvents() {
    document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => this.switchSection(t.dataset.tab)));
    document.querySelectorAll('.nav-item').forEach(n => n.addEventListener('click', () => this.switchSection(n.dataset.nav)));
    document.getElementById('themeToggle').addEventListener('click', () => this.applyTheme(this.state.theme === 'light' ? 'dark' : 'light'));
    document.getElementById('hrAccessBtn').addEventListener('click', () => HRModule.openLogin());
    document.querySelectorAll('.action').forEach(a => a.addEventListener('click', () => this.handleAction(a.dataset.action)));
    document.querySelectorAll('.resource').forEach(r => {
      if (r.dataset.link) r.addEventListener('click', () => window.open(r.dataset.link, '_blank', 'noopener'));
      else if (r.dataset.action) r.addEventListener('click', () => this.handleAction(r.dataset.action));
    });
    document.getElementById('currentStageCta').addEventListener('click', () => { const id = this.currentId(); if (id !== null) this.openStage(id); });
  },
  handleAction(a) {
    const map = {
      hr: () => Contact.open({ name: HRS[1].name, role: 'Ваш HR · ' + HRS[1].role, link: HRS[1].max }),
      recruiter: () => Contact.open({ name: HRS[0].name, role: 'Рекрутер', link: HRS[0].max }),
      docs: () => this.showToast('📄 Список документов — в чек-листе ниже'),
      map: () => this.showToast('🗺️ Карта офиса загружается'),
      food: () => this.showToast('🍽️ PDF с заведениями скачан'),
      contacts: () => window.open('https://my.polyplastic.ru/employees/Pages/address-book.aspx', '_blank', 'noopener'),
      privacy: () => this.openPrivacy(),
      films: () => alert('🎬 Фильмы:\n\n1. Дьявол носит Prada\n2. Стажёр\n3. В погоне за счастьем\n4. Мне бы в небо\n5. Я не знаю, как она делает это'),
      books: () => alert('📖 Книги:\n\n• Ты способна на большее\n• Найти своё призвание\n• Кради как художник\n• Между надо и хочу\n• Предназначение\n• Работа твоей мечты\n• Работа\n• Энергия — новая валюта'),
      sport: () => this.showToast('💪 Спортивный комплекс: Пн-Пт 7:00-22:00'),
      transport: () => this.showToast('🚌 Расписание транспорта обновлено'),
    };
    (map[a] || (() => this.showToast('Раздел в разработке')))();
  },

  /* ---------- 152-ФЗ: согласие, экспорт, удаление ---------- */
  initConsent() {
    const pd = document.getElementById('consentPd'), sv = document.getElementById('consentSurvey'), ok = document.getElementById('consentOk');
    document.getElementById('policyLink').addEventListener('click', e => { e.preventDefault(); alert('Здесь будет ссылка на «Политику обработки персональных данных» Группы ПОЛИПЛАСТИК (документ предоставляет юридический отдел).'); });
    pd.addEventListener('change', () => ok.disabled = !pd.checked);
    ok.addEventListener('click', () => {
      Storage.set('consent', { pd: true, survey: sv.checked, date: new Date().toISOString() });
      document.getElementById('consentModal').classList.remove('open');
    });
    if (!Storage.get('consent')) document.getElementById('consentModal').classList.add('open');
    document.getElementById('privSurvey').addEventListener('change', e => {
      const c = Storage.get('consent', {}); c.survey = e.target.checked; Storage.set('consent', c);
      this.showToast(e.target.checked ? '✅ Согласие на анализ опросов дано' : '⚪ Согласие на анализ опросов отозвано');
    });
    document.getElementById('privExport').addEventListener('click', () => this.exportData());
    document.getElementById('privDelete').addEventListener('click', () => {
      if (!confirm('Отозвать согласие и удалить все ваши данные из приложения? Действие необратимо.')) return;
      Object.keys(localStorage).filter(k => k.startsWith('corsic_')).forEach(k => localStorage.removeItem(k));
      location.reload();
    });
  },
  openPrivacy() {
    const c = Storage.get('consent', {});
    document.getElementById('privacyInfo').innerHTML =
      `<b>Согласие на обработку ПДн:</b> ${c.pd ? 'дано ' + new Date(c.date).toLocaleDateString('ru-RU') : 'не дано'}<br>
       <b>Что хранится:</b> прогресс этапов, отметки шагов, чек-лист, достижения, ваши обращения в чат.<br>
       <b>Где:</b> только в памяти вашего браузера (демо-версия). Паспортные данные, СНИЛС и ИНН приложение не запрашивает.`;
    document.getElementById('privSurvey').checked = !!c.survey;
    document.getElementById('privacyModal').classList.add('open');
  },
  exportData() {
    const data = {}; Object.keys(localStorage).filter(k => k.startsWith('corsic_')).forEach(k => data[k.replace('corsic_', '')] = JSON.parse(localStorage.getItem(k)));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    a.download = 'my-data.json'; a.click();
  },

  showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(this._tt); this._tt = setTimeout(() => t.classList.remove('show'), 2500);
  }
};
document.addEventListener('DOMContentLoaded', () => EmployeeApp.init());
