const HRModule = {
  currentTab: 'dashboard',
  kbFiles: [...SYNTHETIC_KB],
  employees: [...SYNTHETIC_EMPLOYEES],
  isAuthenticated: false,

  init() {
    this.bindLoginEvents();
    this.bindNavEvents();
    this.bindKbEvents();
    this.bindSettingsEvents();
    this.renderAll();
  },

  openLogin() {
    document.getElementById('hrLoginModal').classList.add('open');
    setTimeout(() => document.getElementById('hrCode').focus(), 300);
  },
  closeLogin() {
    document.getElementById('hrLoginModal').classList.remove('open');
    document.getElementById('loginError').classList.remove('show');
    document.getElementById('hrCode').value = '';
  },
  login(code) {
    if (code === HR_ACCESS_CODE) {
      this.isAuthenticated = true;
      this.closeLogin();
      document.getElementById('employee-app').classList.add('hidden');
      document.getElementById('hr-app').classList.remove('hidden');
      this.renderAll();
      EmployeeApp.showToast('✅ Добро пожаловать в HR-панель');
    } else {
      document.getElementById('loginError').classList.add('show');
      setTimeout(() => document.getElementById('loginError').classList.remove('show'), 2000);
    }
  },
  logout() {
    this.isAuthenticated = false;
    document.getElementById('hr-app').classList.add('hidden');
    document.getElementById('employee-app').classList.remove('hidden');
    EmployeeApp.showToast('👋 Вы вышли из HR-панели');
  },

  bindLoginEvents() {
    document.getElementById('hrLoginForm').addEventListener('submit', e => { e.preventDefault(); this.login(document.getElementById('hrCode').value); });
    document.getElementById('hrLoginClose').addEventListener('click', () => this.closeLogin());
    document.getElementById('hrLoginModal').addEventListener('click', e => { if (e.target.id === 'hrLoginModal') this.closeLogin(); });
    document.getElementById('demoAccess').addEventListener('click', () => {
      this.isAuthenticated = true;
      this.closeLogin();
      document.getElementById('employee-app').classList.add('hidden');
      document.getElementById('hr-app').classList.remove('hidden');
      this.renderAll();
      EmployeeApp.showToast('🔓 Демо-режим (данные синтетические)');
    });
  },

  bindNavEvents() {
    document.querySelectorAll('.hr-nav-item').forEach(btn => btn.addEventListener('click', () => this.switchTab(btn.dataset.hrTab)));
    document.getElementById('hrLogout').addEventListener('click', () => this.logout());
    document.getElementById('hrThemeToggle').addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      EmployeeApp.applyTheme(current === 'light' ? 'dark' : 'light');
    });
  },

  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.hr-nav-item').forEach(x => x.classList.remove('active'));
    document.querySelector(`.hr-nav-item[data-hr-tab="${tab}"]`).classList.add('active');
    document.querySelectorAll('.hr-section').forEach(x => x.classList.remove('active'));
    document.getElementById('hr-' + tab).classList.add('active');
    const titles = {
      dashboard: ['Дашборд', 'Обзор метрик адаптации'],
      onboarding: ['Онбординг', 'Воронка новых сотрудников'],
      risk: ['Зона риска', 'Сотрудники, требующие внимания'],
      knowledge: ['База знаний', 'Управление документами бота'],
      sentiment: ['Sentiment Analysis', 'Анализ тональности опросов'],
      settings: ['Настройки', 'Конфигурация бота'],
    };
    document.getElementById('hrPageTitle').textContent = titles[tab][0];
    document.getElementById('hrPageSubtitle').textContent = titles[tab][1];
  },

  renderDashboard() {
    const active = this.employees.length;
    const risk = this.employees.filter(e => e.risk !== 'low').length;
    document.getElementById('kpiActive').textContent = active;
    document.getElementById('kpiRisk').textContent = risk;
    document.getElementById('kpiNps').textContent = 78;
    document.getElementById('kpiRetention').textContent = '92%';
    document.getElementById('riskBadge').textContent = risk;

    const funnelData = STAGES.slice(0, 8).map((s, i) => {
      const count = this.employees.filter(e => e.stage === i).length || Math.floor(Math.random() * 8) + 2;
      return { label: s.title.split('·')[0].trim(), count };
    });
    const maxCount = Math.max(...funnelData.map(x => x.count));
    document.getElementById('funnelChart').innerHTML = funnelData.map(x => `
      <div class="funnel-row">
        <div class="funnel-label">${x.label}</div>
        <div class="funnel-bar-wrap"><div class="funnel-bar" style="width:${(x.count / maxCount) * 100}%">${x.count}</div></div>
        <div class="funnel-count">${x.count}</div>
      </div>
    `).join('');

    document.getElementById('sentimentChart').innerHTML = `
      <div class="sentiment-row"><div class="sentiment-label">Позитив</div><div class="sentiment-bar-wrap"><div class="sentiment-bar positive" style="width:62%"></div></div><div class="sentiment-value">62%</div></div>
      <div class="sentiment-row"><div class="sentiment-label">Нейтрально</div><div class="sentiment-bar-wrap"><div class="sentiment-bar neutral" style="width:24%"></div></div><div class="sentiment-value">24%</div></div>
      <div class="sentiment-row"><div class="sentiment-label">Негатив</div><div class="sentiment-bar-wrap"><div class="sentiment-bar negative" style="width:14%"></div></div><div class="sentiment-value">14%</div></div>
    `;

    document.getElementById('activityList').innerHTML = SYNTHETIC_ACTIVITIES.map(a => `
      <div class="activity-item">
        <div class="activity-icon" style="background:${a.color}">${a.icon}</div>
        <div class="activity-content"><div class="activity-title">${a.title}</div><div class="activity-meta">${a.meta}</div></div>
        <div class="activity-time">${a.time}</div>
      </div>
    `).join('');
  },

  renderPipeline() {
    const columns = [
      { id: 'early', title: '🌱 Первые дни', stages: [0, 1, 2, 3] },
      { id: 'active', title: ' Активная адаптация', stages: [4, 5, 6, 7] },
      { id: 'mid', title: '🎯 Середина пути', stages: [8, 9] },
      { id: 'final', title: '🏁 Финишная прямая', stages: [10, 11, 12] },
    ];
    document.getElementById('pipelineBoard').innerHTML = columns.map(col => {
      const emps = this.employees.filter(e => col.stages.includes(e.stage));
      return `
        <div class="pipeline-column">
          <div class="pipeline-column-header">
            <div class="pipeline-column-title">${col.title}</div>
            <div class="pipeline-column-count">${emps.length}</div>
          </div>
          ${emps.map(e => `
            <div class="pipeline-card">
              <div class="pipeline-card-name">${e.name}</div>
              <div class="pipeline-card-role">${e.role} · ${e.dept}</div>
              <div class="pipeline-card-meta">
                <span class="pipeline-card-date">Этап ${e.stage}</span>
                <span class="pipeline-card-risk ${e.risk}">${e.risk === 'low' ? 'Низкий' : e.risk === 'medium' ? 'Средний' : 'Высокий'}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }).join('');
  },

  renderRisk() {
    const critical = this.employees.filter(e => e.risk === 'critical');
    const warning = this.employees.filter(e => e.risk === 'medium');
    const monitor = this.employees.filter(e => e.risk === 'low' && e.mood < 7);
    const total = critical.length + warning.length + monitor.length;
    document.getElementById('riskTotal').textContent = total;
    document.getElementById('riskCritical').textContent = critical.length;
    document.getElementById('riskWarning').textContent = warning.length;
    document.getElementById('riskMonitor').textContent = monitor.length;

    const atRisk = [
      ...critical.map(e => ({...e, level: 'critical'})),
      ...warning.map(e => ({...e, level: 'warning'})),
      ...monitor.map(e => ({...e, level: 'monitor'}))
    ];
    document.getElementById('riskList').innerHTML = atRisk.map(e => `
      <div class="risk-card ${e.level}">
        <div class="risk-card-header">
          <div><div class="risk-card-name">${e.name}</div><div class="risk-card-role">${e.role} · ${e.dept}</div></div>
          <span class="risk-level ${e.level}">${e.level === 'critical' ? 'Критический' : e.level === 'warning' ? 'Внимание' : 'Мониторинг'}</span>
        </div>
        <div class="risk-signals">${e.signals.map(s => `<span class="risk-signal">${s}</span>`).join('')}</div>
        <div class="risk-card-footer">
          <span class="risk-card-date">Настроение: ${e.mood}/10 · Этап ${e.stage}</span>
          <button class="risk-card-action">Связаться</button>
        </div>
      </div>
    `).join('');
  },

  bindKbEvents() {
    document.getElementById('kbUploadBtn').addEventListener('click', () => document.getElementById('uploadModal').classList.add('open'));
    document.getElementById('uploadClose').addEventListener('click', () => this.closeUpload());
    document.getElementById('uploadCancel').addEventListener('click', () => this.closeUpload());
    document.getElementById('uploadModal').addEventListener('click', e => { if (e.target.id === 'uploadModal') this.closeUpload(); });
    const zone = document.getElementById('uploadZone');
    const input = document.getElementById('fileInput');
    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('dragover'); if (e.dataTransfer.files.length) this.handleFile(e.dataTransfer.files[0]); });
    input.addEventListener('change', e => { if (e.target.files.length) this.handleFile(e.target.files[0]); });
    document.getElementById('uploadConfirm').addEventListener('click', () => this.confirmUpload());
    document.querySelectorAll('.kb-cat').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.kb-cat').forEach(x => x.classList.remove('active'));
        btn.classList.add('active');
        this.renderKbList(btn.dataset.cat);
      });
    });
  },

  handleFile(file) {
    this._pendingFile = file;
    document.getElementById('uploadConfirm').disabled = false;
    document.querySelector('.upload-text').textContent = file.name;
  },
  confirmUpload() {
    if (!this._pendingFile) return;
    const cat = document.getElementById('uploadCategory').value;
    const newFile = {
      id: Date.now(), name: this._pendingFile.name, category: cat,
      size: (this._pendingFile.size / 1024 / 1024).toFixed(2) + ' МБ',
      updated: new Date().toISOString().split('T')[0], downloads: 0,
    };
    this.kbFiles.unshift(newFile);
    this.renderKbList('all');
    this.closeUpload();
    EmployeeApp.showToast('✅ Файл загружен в базу знаний');
  },
  deleteFile(id) {
    if (!confirm('Удалить файл из базы знаний?')) return;
    this.kbFiles = this.kbFiles.filter(f => f.id !== id);
    this.renderKbList('all');
    EmployeeApp.showToast('🗑️ Файл удалён');
  },
  closeUpload() {
    document.getElementById('uploadModal').classList.remove('open');
    document.getElementById('uploadConfirm').disabled = true;
    document.getElementById('fileInput').value = '';
    document.querySelector('.upload-text').textContent = 'Перетащите файл сюда или нажмите для выбора';
    this._pendingFile = null;
  },
  renderKbList(category = 'all') {
    const filtered = category === 'all' ? this.kbFiles : this.kbFiles.filter(f => f.category === category);
    const icons = { policy: '📋', faq: '❓', benefits: '🎁', process: '⚙️' };
    document.getElementById('kbTotalFiles').textContent = this.kbFiles.length;
    document.getElementById('kbTotalSize').textContent = this.kbFiles.reduce((s, f) => s + parseFloat(f.size), 0).toFixed(1) + ' МБ';
    document.getElementById('kbLastUpdate').textContent = this.kbFiles[0]?.updated || '—';
    document.getElementById('kbList').innerHTML = filtered.map(f => `
      <div class="kb-item">
        <div class="kb-item-icon">${icons[f.category] || '📄'}</div>
        <div class="kb-item-content">
          <div class="kb-item-title">${f.name}</div>
          <div class="kb-item-meta"><span>${f.size}</span><span>·</span><span>Обновлён: ${f.updated}</span><span>·</span><span>📥 ${f.downloads}</span></div>
        </div>
        <div class="kb-item-actions">
          <button class="kb-action-btn" title="Скачать">⬇️</button>
          <button class="kb-action-btn" title="Редактировать">✏️</button>
          <button class="kb-action-btn danger" title="Удалить" onclick="HRModule.deleteFile(${f.id})">🗑️</button>
        </div>
      </div>
    `).join('');
  },

  renderSentiment() {
    const gauge = 72;
    document.getElementById('gaugeValue').textContent = gauge;
    document.getElementById('gaugeFill').style.width = gauge + '%';
    document.getElementById('metricPositive').textContent = '62%';
    document.getElementById('metricNeutral').textContent = '24%';
    document.getElementById('metricNegative').textContent = '14%';
    document.getElementById('clustersList').innerHTML = SYNTHETIC_CLUSTERS.map(c => `
      <div class="cluster-item">
        <div class="cluster-title">${c.title}</div>
        <div class="cluster-meta"><span>${c.count} упоминаний</span><span>${c.percent}%</span></div>
        <div class="cluster-bar"><div class="cluster-bar-fill" style="width:${c.percent}%"></div></div>
      </div>
    `).join('');
  },

  bindSettingsEvents() {
    document.querySelectorAll('.toggle input').forEach(toggle => {
      toggle.addEventListener('change', e => EmployeeApp.showToast(e.target.checked ? '✅ Включено' : '⚪ Отключено'));
    });
  },

  renderAll() {
    this.renderDashboard();
    this.renderPipeline();
    this.renderRisk();
    this.renderKbList('all');
    this.renderSentiment();
  }
};

document.addEventListener('DOMContentLoaded', () => HRModule.init());
