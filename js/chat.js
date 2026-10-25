/* Адрес функции на Vercel */
const CHAT_API_URL = 'https://aleksandrasandzhieva5-stackgithubio.vercel.app/api/reply';

const ChatModule = {
  history: [],      // {role, content} для GigaChat
  busy: false,
  init() {
    this.messagesEl = document.getElementById('chatMessages');
    this.inputEl = document.getElementById('chatInput');
    this.modal = document.getElementById('chatModal');
    this.badge = document.getElementById('chatBadge');
    document.getElementById('chatFab').addEventListener('click', () => this.open());
    document.getElementById('chatClose').addEventListener('click', () => this.close());
    this.modal.addEventListener('click', e => { if (e.target === this.modal) this.close(); });
    document.getElementById('chatSend').addEventListener('click', () => this.sendMessage());
    this.inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') this.sendMessage(); });
    CHAT_BOT.greetings.forEach((g, i) => setTimeout(() => this.addMessage('bot', g), 300 + i * 600));
  },
  open() { this.modal.classList.add('open'); this.badge.style.display = 'none'; setTimeout(() => this.inputEl.focus(), 300); },
  close() { this.modal.classList.remove('open'); },
  addMessage(who, text) {
    const d = document.createElement('div');
    d.className = 'msg ' + who; d.textContent = text;
    this.messagesEl.appendChild(d);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    return d;
  },
  async sendMessage() {
    const text = this.inputEl.value.trim();
    if (!text || this.busy) return;
    this.addMessage('user', text);
    this.inputEl.value = '';

    // 1. Быстрые ответы на типовые вопросы (проверенные факты компании)
    const low = text.toLowerCase();
    const found = CHAT_BOT.responses.find(r => r.keys.some(k => low.includes(k)));
    if (found) {
      this.history.push({ role: 'user', content: this.mask(text) }, { role: 'assistant', content: found.reply });
      return setTimeout(() => this.addMessage('bot', found.reply), 500);
    }

    // 2. Остальное уходит в GigaChat (персональные номера маскируются до отправки)
    this.history.push({ role: 'user', content: this.mask(text) });
    this.busy = true;
    const typing = this.addMessage('bot', 'Корсик печатает…');
    try {
      const res = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'onboarding', messages: this.history.slice(-10) })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.answer) throw new Error(data.error || 'error');
      typing.textContent = data.answer;
      this.history.push({ role: 'assistant', content: data.answer });
    } catch (e) {
      this.history.pop();                        // не оставляем вопрос без ответа в контексте
      typing.textContent = CHAT_BOT.fallback;    // ИИ недоступен → передаём HR
      this.saveUnanswered(text);
    } finally {
      this.busy = false;
      this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    }
  },
  /* Нераспознанный вопрос попадает во вкладку HR «Вопросы бота» */
  mask(t) { return t.replace(/\d{3}[-\s]?\d{3}[-\s]?\d{3}[-\s]?\d{2}|\d{4}[\s-]?\d{6}|\d{10,20}/g, '[скрыто]'); },
  saveUnanswered(text) {
    text = this.mask(text);
    const list = Storage.get('botQuestions', []);
    list.unshift({ id: 'u' + Date.now(), author: EmployeeApp.state.userName + ' Новичков', dept: 'Новый сотрудник', hrId: 1, date: new Date().toISOString().slice(0, 16), text, reason: 'Не распознан запрос' });
    Storage.set('botQuestions', list);
  }
};
