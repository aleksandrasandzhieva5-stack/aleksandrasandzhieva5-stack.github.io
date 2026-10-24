/* ===== Модуль чата ===== */
const ChatModule = {
  init() {
    this.messagesEl = document.getElementById('chatMessages');
    this.inputEl = document.getElementById('chatInput');
    this.sendBtn = document.getElementById('chatSend');
    this.modal = document.getElementById('chatModal');
    this.closeBtn = document.getElementById('chatClose');
    this.fab = document.getElementById('chatFab');
    this.badge = document.getElementById('chatBadge');
    
    this.bindEvents();
    this.showGreetings();
  },
  
  bindEvents() {
    this.fab.addEventListener('click', () => this.open());
    this.closeBtn.addEventListener('click', () => this.close());
    this.modal.addEventListener('click', e => { if (e.target === this.modal) this.close(); });
    this.sendBtn.addEventListener('click', () => this.sendMessage());
    this.inputEl.addEventListener('keypress', e => { if (e.key === 'Enter') this.sendMessage(); });
  },
  
  open() {
    this.modal.classList.add('open');
    this.badge.style.display = 'none';
    setTimeout(() => this.inputEl.focus(), 300);
  },
  
  close() {
    this.modal.classList.remove('open');
  },
  
  showGreetings() {
    setTimeout(() => this.addBotMessage(CHAT_BOT.greetings[0]), 300);
    setTimeout(() => this.addBotMessage(CHAT_BOT.greetings[1]), 900);
  },
  
  addBotMessage(text) {
    const div = document.createElement('div');
    div.className = 'msg bot';
    div.textContent = text;
    this.messagesEl.appendChild(div);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  },
  
  addUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'msg user';
    div.textContent = text;
    this.messagesEl.appendChild(div);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  },
  
  sendMessage() {
    const text = this.inputEl.value.trim();
    if (!text) return;
    this.addUserMessage(text);
    this.inputEl.value = '';
    
    setTimeout(() => {
      const lower = text.toLowerCase();
      const found = CHAT_BOT.responses.find(r => r.keys.some(k => lower.includes(k)));
      this.addBotMessage(found ? found.reply : CHAT_BOT.fallback);
    }, 500 + Math.random() * 400);
  },
  
  openWith(text) {
    this.open();
    setTimeout(() => {
      this.addUserMessage(text);
      setTimeout(() => this.addBotMessage('Понял! Передаю твой запрос HR-специалисту. Обычно отвечают в течение рабочего дня. 📨'), 600);
    }, 300);
  }
};
