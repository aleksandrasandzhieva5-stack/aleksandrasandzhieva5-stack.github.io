const Storage = {
  _prefix: 'corsic_',
  get(key, def = null) {
    try { const r = localStorage.getItem(this._prefix + key); return r ? JSON.parse(r) : def; } catch (e) { return def; }
  },
  set(key, value) {
    try { localStorage.setItem(this._prefix + key, JSON.stringify(value)); return true; } catch (e) { return false; }
  },
  remove(key) { try { localStorage.removeItem(this._prefix + key); } catch (e) {} }
};
