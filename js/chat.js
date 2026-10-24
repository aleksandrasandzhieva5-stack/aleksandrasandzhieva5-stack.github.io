const ChatModule = {
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
  },
  sendMessage() {
    const text = this.inputEl.value.trim();
    if (!text) return;
    this.addMessage('user', text);
    this.inputEl.value = '';
    setTimeout(() => {
      const low = text.toLowerCase();
      const found = CHAT_BOT.responses.find(r => r.keys.some(k => low.includes(k)));
      if (found) return this.addMessage('bot', found.reply);
      this.addMessage('bot', CHAT_BOT.fallback);
      this.saveUnanswered(text);
    }, 500);
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
