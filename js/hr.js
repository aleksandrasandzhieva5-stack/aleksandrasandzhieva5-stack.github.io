const RISK_RANK = { critical: 0, high: 0, medium: 1, low: 2 };
const riskLabel = r => ({ low: 'Низкий', medium: 'Средний', high: 'Высокий', critical: 'Критический' }[r]);
const riskLevel = e => (e.risk === 'critical' || e.risk === 'high') ? 'critical' : e.risk === 'medium' ? 'warning' : (e.mood < 7 ? 'monitor' : null);

const HRModule = {
  employees: [...SYNTHETIC_EMPLOYEES],
  kbFiles: [...SYNTHETIC_KB],
  f: { loc: 'all', sort: 'date', risk: 'all', kb: 'all', q: '', qf: 'all' },
  titles: {
    dashboard: ['Дашборд', 'Обзор метрик адаптации'],
    onboarding: ['Онбординг', 'Воронка новых сотрудников'],
    risk: ['Зона риска', 'Сотрудники, требующие внимания'],
    questions: ['Вопросы бота', 'Вопросы, на которые ИИ-агент не смог ответить'],
    knowledge: ['База знаний', 'Управление документами бота'],
    sentiment: ['Sentiment Analysis', 'Анализ тональности опросов'],
    settings: ['Настройки', 'Конфигурация бота'],
  },

  init() {
    this.bindLogin(); this.bindNav(); this.bindFilters(); this.bindSearch(); this.bindKb(); this.bindLists();
    document.querySelectorAll('.toggle input').forEach(t => t.addEventListener('change', e => EmployeeApp.showToast(e.target.checked ? '✅ Включено' : '⚪ Отключено')));
    this.renderAll();
  },

  /* ---------- auth ---------- */
  openLogin() { document.getElementById('hrLoginModal').classList.add('open'); setTimeout(() => document.getElementById('hrCode').focus(), 200); },
  closeLogin() { document.getElementById('hrLoginModal').classList.remove('open'); document.getElementById('hrCode').value = ''; document.getElementById('loginError').classList.remove('show'); },
  enter(msg) {
    this.closeLogin();
    document.getElementById('employee-app').classList.add('hidden');
    document.getElementById('hr-app').classList.remove('hidden');
    this.renderAll(); EmployeeApp.showToast(msg);
  },
  bindLogin() {
    document.getElementById('hrLoginForm').addEventListener('submit', e => {
      e.preventDefault();
      if (document.getElementById('hrCode').value === HR_ACCESS_CODE) this.enter('✅ Добро пожаловать в HR-панель');
      else { const er = document.getElementById('loginError'); er.classList.add('show'); setTimeout(() => er.classList.remove('show'), 2000); }
    });
    document.getElementById('hrLoginClose').addEventListener('click', () => this.closeLogin());
    document.getElementById('demoAccess').addEventListener('click', () => this.enter('🔓 Демо-режим (данные синтетические)'));
    document.getElementById('hrLogout').addEventListener('click', () => {
      document.getElementById('hr-app').classList.add('hidden');
      document.getElementById('employee-app').classList.remove('hidden');
    });
  },
  bindNav() {
    document.querySelectorAll('.hr-nav-item').forEach(b => b.addEventListener('click', () => this.switchTab(b.dataset.hrTab)));
    document.getElementById('hrThemeToggle').addEventListener('click', () => EmployeeApp.applyTheme(EmployeeApp.state.theme === 'light' ? 'dark' : 'light'));
  },
  switchTab(tab) {
    document.querySelectorAll('.hr-nav-item').forEach(x => x.classList.toggle('active', x.dataset.hrTab === tab));
    document.querySelectorAll('.hr-section').forEach(x => x.classList.toggle('active', x.id === 'hr-' + tab));
    document.getElementById('hrPageTitle').textContent = this.titles[tab][0];
    document.getElementById('hrPageSubtitle').textContent = this.titles[tab][1];
  },

  /* ---------- search ---------- */
  hay(e) { return [e.name, e.role, e.dept, LOCATION_LABELS[e.location], hrById(e.hrId).name].join(' ').toLowerCase(); },
  matches(e) { const q = this.f.q.trim().toLowerCase(); return !q || q.split(/\s+/).every(w => this.hay(e).includes(w)); },
  hl(text) {
    const words = this.f.q.trim().split(/\s+/).filter(Boolean).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const safe = esc(text);
    return words.length ? safe.replace(new RegExp('(' + words.join('|') + ')', 'gi'), '<mark>$1</mark>') : safe;
  },
  bindSearch() {
    const input = document.getElementById('hrSearch'), box = document.getElementById('searchResults');
    input.addEventListener('input', () => { this.f.q = input.value; this.renderSearch(); this.renderPipeline(); this.renderRisk(); this.renderQuestions(); });
    input.addEventListener('focus', () => this.renderSearch());
    input.addEventListener('keydown', e => {
      if (e.key === 'Escape') { input.value = ''; this.f.q = ''; this.renderSearch(); this.renderPipeline(); this.renderRisk(); this.renderQuestions(); input.blur(); }
      if (e.key === 'Enter') { const first = this.employees.find(x => this.matches(x)); if (first && this.f.q.trim()) this.openEmployee(first.id); }
    });
    box.addEventListener('click', e => { const it = e.target.closest('.sr-item'); if (it) this.openEmployee(+it.dataset.emp); });
    document.addEventListener('click', e => { if (!e.target.closest('#searchBox')) box.classList.remove('open'); });
  },
  renderSearch() {
    const box = document.getElementById('searchResults');
    if (!this.f.q.trim()) return box.classList.remove('open');
    const res = this.employees.filter(e => this.matches(e));
    box.innerHTML = res.length ? res.map(e => `
      <div class="sr-item" data-emp="${e.id}"><div class="avatar">${initials(e.name)}</div>
        <div><div class="sr-name">${this.hl(e.name)}</div><div class="sr-meta">${this.hl(e.role)} · ${this.hl(e.dept)} · HR: ${this.hl(hrById(e.hrId).name)}</div></div></div>`).join('')
      : '<div class="sr-empty">Никого не найдено</div>';
    box.classList.add('open');
  },

  /* ---------- filters / delegated clicks ---------- */
  chipGroup(id, attr, key, rerender) {
    document.getElementById(id).addEventListener('click', e => {
      const c = e.target.closest('.filter-chip'); if (!c) return;
      document.querySelectorAll('#' + id + ' .filter-chip').forEach(x => x.classList.toggle('active', x === c));
      this.f[key] = c.dataset[attr]; rerender();
    });
  },
  bindFilters() {
    this.chipGroup('locFilters', 'filter', 'loc', () => this.renderPipeline());
    this.chipGroup('riskFilters', 'risk', 'risk', () => this.renderRisk());
    this.chipGroup('qFilters', 'q', 'qf', () => this.renderQuestions());
    document.getElementById('pipelineSort').addEventListener('change', e => { this.f.sort = e.target.value; this.renderPipeline(); });
  },
  bindLists() {
    document.getElementById('pipelineBoard').addEventListener('click', e => { const c = e.target.closest('[data-emp]'); if (c) this.openEmployee(+c.dataset.emp); });
    document.getElementById('riskList').addEventListener('click', e => {
      const btn = e.target.closest('[data-contact]');
      if (btn) { e.stopPropagation(); return this.contactEmployee(+btn.dataset.contact); }
      const c = e.target.closest('[data-emp]'); if (c) this.openEmployee(+c.dataset.emp);
    });
    document.getElementById('qList').addEventListener('click', e => {
      const t = e.target.closest('[data-act]'); if (!t) return;
      const id = t.dataset.q, act = t.dataset.act;
      if (act === 'emp') this.openEmployee(+t.dataset.emp);
      if (act === 'hr') { const h = hrById(+t.dataset.hr); Contact.open({ name: h.name, role: h.role, link: h.max }); }
      if (act === 'toggle') document.getElementById('reply-' + id).classList.toggle('open');
      if (act === 'send') this.sendReply(id);
    });
    document.getElementById('empBody').addEventListener('click', e => {
      const t = e.target.closest('[data-act]'); if (!t) return;
      const emp = this.employees.find(x => x.id === +t.dataset.emp);
      if (t.dataset.act === 'emp-msg') this.contactEmployee(emp.id);
      if (t.dataset.act === 'hr-msg') { const h = hrById(emp.hrId); Contact.open({ name: h.name, role: h.role, link: h.max }); }
    });
  },
  contactEmployee(id) {
    const e = this.employees.find(x => x.id === id);
    Contact.open({ name: e.name, role: `${e.role} · ${e.dept}`, link: e.max });
  },

  /* ---------- employee card ---------- */
  openEmployee(id) {
    const e = this.employees.find(x => x.id === id); if (!e) return;
    const hr = hrById(e.hrId), lvl = riskLevel(e);
    document.getElementById('searchResults').classList.remove('open');
    document.getElementById('empBody').innerHTML = `
      <div class="emp-head"><div class="avatar">${initials(e.name)}</div>
        <div><h2>${esc(e.name)}</h2><div class="muted">${esc(e.role)} · ${esc(e.dept)}</div></div></div>
      <div class="emp-hr"><div class="avatar">${hr.short}</div>
        <div class="grow"><small class="muted">Закреплённый HR</small><div><b>${esc(hr.name)}</b> · <span class="muted">${esc(hr.role)}</span></div></div>
        <button class="btn-secondary btn-sm" data-act="hr-msg" data-emp="${e.id}">Написать HR</button></div>
      <div class="emp-grid">
        <div class="emp-field"><small>Дата выхода</small><b>${e.startDate.split('-').reverse().join('.')}</b></div>
        <div class="emp-field"><small>Формат работы</small><b>${LOCATION_LABELS[e.location]}</b></div>
        <div class="emp-field"><small>Этап онбординга</small><b>${e.stage} из 12 · ${esc(STAGES[e.stage].title)}</b></div>
        <div class="emp-field"><small>Настроение</small><b>${e.mood}/10</b></div>
        <div class="emp-field"><small>Уровень риска</small><b>${riskLabel(e.risk)}</b></div>
        <div class="emp-field"><small>Статус</small><b>${lvl ? 'Требует внимания' : 'Всё хорошо'}</b></div>
      </div>
      ${e.signals.length ? `<div class="risk-signals">${e.signals.map(s => `<span class="risk-signal">${esc(s)}</span>`).join('')}</div>` : ''}
      <button class="btn-primary" style="width:100%" data-act="emp-msg" data-emp="${e.id}">💬 Написать сотруднику в MAX</button>`;
    document.getElementById('empModal').classList.add('open');
  },

  /* ---------- renders ---------- */
  renderDashboard() {
    const risk = this.employees.filter(e => riskLevel(e)).length;
    document.getElementById('kpiActive').textContent = this.employees.length;
    document.getElementById('kpiRisk').textContent = risk;
    document.getElementById('riskBadge').textContent = risk;
    document.getElementById('kpiNps').textContent = 78;
    document.getElementById('kpiRetention').textContent = '92%';
    const data = STAGES.slice(0, 11).map(s => ({ label: s.title.split('·')[0].trim(), n: this.employees.filter(e => e.stage === s.id).length })).filter(x => x.n);
    const max = Math.max(1, ...data.map(x => x.n));
    document.getElementById('funnelChart').innerHTML = data.map(x => `<div class="funnel-row"><div class="funnel-label">${esc(x.label)}</div><div class="funnel-bar-wrap"><div class="funnel-bar" style="width:${x.n / max * 100}%">${x.n}</div></div></div>`).join('');
    const row = (l, v, c) => `<div class="sentiment-row"><div class="sentiment-label">${l}</div><div class="sentiment-bar-wrap"><div class="sentiment-bar ${c}" style="width:${v}%"></div></div><div class="sentiment-value">${v}%</div></div>`;
    document.getElementById('sentimentChart').innerHTML = row('Позитив', 62, 'positive') + row('Нейтрально', 24, 'neutral') + row('Негатив', 14, 'negative');
    document.getElementById('activityList').innerHTML = SYNTHETIC_ACTIVITIES.map(a => `<div class="activity-item"><div class="activity-icon">${a.icon}</div><div class="activity-content"><div class="activity-title">${esc(a.title)}</div><div class="activity-meta">${esc(a.meta)}</div></div><div class="activity-time">${a.time}</div></div>`).join('');
  },

  renderPipeline() {
    const cols = [
      { t: '🌱 Первые дни', s: [0, 1, 2, 3] }, { t: '🚀 Активная адаптация', s: [4, 5, 6, 7] },
      { t: '🎯 Середина пути', s: [8, 9] }, { t: '🏁 Финишная прямая', s: [10, 11, 12] },
    ];
    const sorters = {
      date: (a, b) => b.startDate.localeCompare(a.startDate),
      stage: (a, b) => a.stage - b.stage,
      risk: (a, b) => RISK_RANK[a.risk] - RISK_RANK[b.risk],
    };
    const list = this.employees.filter(e => (this.f.loc === 'all' || e.location === this.f.loc) && this.matches(e)).sort(sorters[this.f.sort]);
    document.getElementById('pipelineBoard').innerHTML = cols.map(c => {
      const emps = list.filter(e => c.s.includes(e.stage));
      return `<div class="pipeline-column"><div class="pipeline-column-header"><div class="pipeline-column-title">${c.t}</div><div class="pipeline-column-count">${emps.length}</div></div>
        ${emps.map(e => { const hr = hrById(e.hrId); return `
          <div class="pipeline-card" data-emp="${e.id}">
            <div class="pipeline-card-name">${this.hl(e.name)}</div>
            <div class="pipeline-card-role">${this.hl(e.role)} · ${this.hl(e.dept)}</div>
            <div class="pipeline-card-hr">👤 HR: ${this.hl(hr.name)}</div>
            <div class="pipeline-card-meta"><span>Этап ${e.stage} · ${LOCATION_LABELS[e.location]}</span><span class="rk ${e.risk}">${riskLabel(e.risk)}</span></div>
          </div>`; }).join('') || '<div class="empty">Нет сотрудников</div>'}</div>`;
    }).join('');
  },

  renderRisk() {
    const all = this.employees.map(e => ({ ...e, level: riskLevel(e) })).filter(e => e.level);
    const cnt = l => all.filter(e => e.level === l).length;
    document.getElementById('riskTotal').textContent = all.length;
    document.getElementById('riskCritical').textContent = cnt('critical');
    document.getElementById('riskWarning').textContent = cnt('warning');
    document.getElementById('riskMonitor').textContent = cnt('monitor');
    const order = { critical: 0, warning: 1, monitor: 2 };
    const list = all.filter(e => (this.f.risk === 'all' || e.level === this.f.risk) && this.matches(e)).sort((a, b) => order[a.level] - order[b.level]);
    const lbl = { critical: 'Критический', warning: 'Внимание', monitor: 'Мониторинг' };
    document.getElementById('riskList').innerHTML = list.map(e => `
      <div class="risk-card ${e.level}" data-emp="${e.id}">
        <div class="risk-card-header"><div><div class="risk-card-name">${this.hl(e.name)}</div><div class="risk-card-role">${this.hl(e.role)} · ${this.hl(e.dept)}</div></div><span class="risk-level ${e.level}">${lbl[e.level]}</span></div>
        <div class="risk-signals"><span class="risk-signal">👤 HR: ${esc(hrById(e.hrId).name)}</span>${e.signals.map(s => `<span class="risk-signal">${esc(s)}</span>`).join('')}</div>
        <div class="risk-card-footer"><span class="risk-card-date">Настроение: ${e.mood}/10 · Этап ${e.stage}</span><button class="btn-primary btn-sm" data-contact="${e.id}">Связаться</button></div>
      </div>`).join('') || '<div class="empty">Ничего не найдено</div>';
  },

  /* ---------- bot questions ---------- */
  allQuestions() {
    const answers = Storage.get('botAnswers', {});
    const synth = SYNTHETIC_QUESTIONS.map(q => { const e = this.employees.find(x => x.id === q.empId); return { ...q, author: e.name, dept: e.dept, hrId: e.hrId, empId: e.id }; });
    return [...Storage.get('botQuestions', []), ...synth].map(q => ({ ...q, answered: answers[q.id] || q.answered }))
      .sort((a, b) => b.date.localeCompare(a.date));
  },
  renderQuestions() {
    const all = this.allQuestions();
    document.getElementById('qBadge').textContent = all.filter(q => !q.answered).length;
    const q = this.f.q.trim().toLowerCase();
    const list = all.filter(x =>
      (this.f.qf === 'all' || (this.f.qf === 'open' && !x.answered) || (this.f.qf === 'done' && x.answered) || (this.f.qf === 'mine' && x.hrId === CURRENT_HR_ID)) &&
      (!q || q.split(/\s+/).every(w => (x.author + ' ' + x.text + ' ' + x.dept + ' ' + hrById(x.hrId).name).toLowerCase().includes(w))));
    document.getElementById('qList').innerHTML = list.map(x => {
      const hr = hrById(x.hrId), mine = hr.id === CURRENT_HR_ID;
      const author = x.empId ? `<span class="q-author" data-act="emp" data-emp="${x.empId}">${this.hl(x.author)}</span>` : `<b>${esc(x.author)}</b>`;
      return `<div class="q-card ${x.answered ? 'done' : ''}">
        <div class="q-top"><span>${author} · ${esc(x.dept)}</span><span>📅 ${fmtDate(x.date)}</span></div>
        <div class="q-text">«${esc(x.text)}»</div>
        <span class="q-hr">👤 Закреплён: ${esc(hr.name)}</span><span class="q-reason">${esc(x.reason)}</span>
        ${x.answered ? `<div class="q-answer">${esc(x.answered.text)}<small>Ответил(а): ${esc(x.answered.by)}${x.answered.instead ? ` (вместо ${esc(hr.name)})` : ''} · ${fmtDate(x.answered.date)}</small></div>` : `
        <div class="q-actions">
          <button class="btn-primary btn-sm" data-act="toggle" data-q="${x.id}">${mine ? '✍️ Ответить' : `✍️ Ответить вместо ${esc(hr.name)}`}</button>
          <button class="btn-secondary btn-sm" data-act="hr" data-hr="${hr.id}">Написать ${esc(hr.name)}</button>
        </div>
        <div class="q-reply" id="reply-${x.id}">
          <textarea class="reply-box" id="text-${x.id}" placeholder="Ваш ответ сотруднику…"></textarea>
          <div class="q-actions"><button class="btn-primary btn-sm" data-act="send" data-q="${x.id}">Отправить ответ</button></div>
        </div>`}
      </div>`;
    }).join('') || '<div class="empty">Вопросов нет</div>';
  },
  sendReply(id) {
    const ta = document.getElementById('text-' + id), text = ta.value.trim();
    if (!text) return EmployeeApp.showToast('Введите текст ответа');
    const q = this.allQuestions().find(x => x.id === id);
    const me = hrById(CURRENT_HR_ID);
    const answers = Storage.get('botAnswers', {});
    answers[id] = { text, by: me.name, date: new Date().toISOString().slice(0, 16), instead: q.hrId !== CURRENT_HR_ID };
    Storage.set('botAnswers', answers);
    this.renderQuestions();
    EmployeeApp.showToast('✅ Ответ отправлен сотруднику (демо)');
  },

  /* ---------- knowledge base ---------- */
  bindKb() {
    const zone = document.getElementById('uploadZone'), input = document.getElementById('fileInput');
    document.getElementById('kbUploadBtn').addEventListener('click', () => document.getElementById('uploadModal').classList.add('open'));
    ['uploadClose', 'uploadCancel'].forEach(id => document.getElementById(id).addEventListener('click', () => this.closeUpload()));
    document.getElementById('uploadModal').addEventListener('click', e => { if (e.target.id === 'uploadModal') this.closeUpload(); });
    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('dragover'); if (e.dataTransfer.files.length) this.handleFile(e.dataTransfer.files[0]); });
    input.addEventListener('change', e => { if (e.target.files.length) this.handleFile(e.target.files[0]); });
    document.getElementById('uploadConfirm').addEventListener('click', () => this.confirmUpload());
    document.querySelectorAll('.kb-cat').forEach(b => b.addEventListener('click', () => {
      document.querySelectorAll('.kb-cat').forEach(x => x.classList.toggle('active', x === b));
      this.f.kb = b.dataset.cat; this.renderKb();
    }));
    document.getElementById('kbList').addEventListener('click', e => {
      const b = e.target.closest('[data-del]'); if (!b || !confirm('Удалить файл из базы знаний?')) return;
      this.kbFiles = this.kbFiles.filter(f => f.id !== +b.dataset.del); this.renderKb();
    });
  },
  handleFile(file) { this._file = file; document.getElementById('uploadConfirm').disabled = false; document.querySelector('.upload-text').textContent = file.name; },
  confirmUpload() {
    if (!this._file) return;
    this.kbFiles.unshift({ id: Date.now(), name: this._file.name, category: document.getElementById('uploadCategory').value, size: (this._file.size / 1048576).toFixed(2) + ' МБ', updated: new Date().toISOString().slice(0, 10), downloads: 0 });
    this.renderKb(); this.closeUpload(); EmployeeApp.showToast('✅ Файл загружен в базу знаний');
  },
  closeUpload() {
    document.getElementById('uploadModal').classList.remove('open');
    document.getElementById('uploadConfirm').disabled = true;
    document.getElementById('fileInput').value = '';
    document.querySelector('.upload-text').textContent = 'Перетащите файл сюда или нажмите для выбора';
    this._file = null;
  },
  renderKb() {
    const icons = { policy: '📋', faq: '❓', benefits: '🎁', process: '⚙️' };
    const list = this.f.kb === 'all' ? this.kbFiles : this.kbFiles.filter(f => f.category === this.f.kb);
    document.getElementById('kbTotalFiles').textContent = this.kbFiles.length;
    document.getElementById('kbTotalSize').textContent = this.kbFiles.reduce((s, f) => s + parseFloat(f.size), 0).toFixed(1) + ' МБ';
    document.getElementById('kbLastUpdate').textContent = this.kbFiles[0] ? this.kbFiles[0].updated : '—';
    document.getElementById('kbList').innerHTML = list.map(f => `
      <div class="kb-item"><div class="kb-item-icon">${icons[f.category] || '📄'}</div>
        <div class="kb-item-content"><div class="kb-item-title">${esc(f.name)}</div><div class="kb-item-meta"><span>${f.size}</span><span>Обновлён: ${f.updated}</span><span>📥 ${f.downloads}</span></div></div>
        <div class="kb-item-actions"><button class="kb-action-btn" title="Скачать">⬇️</button><button class="kb-action-btn" title="Редактировать">✏️</button><button class="kb-action-btn danger" title="Удалить" data-del="${f.id}">🗑️</button></div></div>`).join('');
  },

  renderSentiment() {
    document.getElementById('gaugeValue').textContent = 72;
    document.getElementById('gaugeFill').style.width = '72%';
    document.getElementById('metricPositive').textContent = '62%';
    document.getElementById('metricNeutral').textContent = '24%';
    document.getElementById('metricNegative').textContent = '14%';
    document.getElementById('clustersList').innerHTML = SYNTHETIC_CLUSTERS.map(c => `<div class="cluster-item"><div class="cluster-title">${c.title}</div><div class="cluster-meta"><span>${c.count} упоминаний</span><span>${c.percent}%</span></div><div class="cluster-bar"><div class="cluster-bar-fill" style="width:${c.percent}%"></div></div></div>`).join('');
  },

  renderAll() { this.renderDashboard(); this.renderPipeline(); this.renderRisk(); this.renderQuestions(); this.renderKb(); this.renderSentiment(); }
};
document.addEventListener('DOMContentLoaded', () => HRModule.init());
