const Storage = {
  _prefix: 'corsic_',
  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(this._prefix + key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch (e) { return defaultValue; }
  },
  set(key, value) {
    try { localStorage.setItem(this._prefix + key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  },
  remove(key) {
    try { localStorage.removeItem(this._prefix + key); return true; }
    catch (e) { return false; }
  }
};
