/* ===== LocalStorage wrapper с fallback ===== */
const Storage = {
  _prefix: 'corsic_',
  
  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(this._prefix + key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch (e) {
      console.warn('Storage get error:', e);
      return defaultValue;
    }
  },
  
  set(key, value) {
    try {
      localStorage.setItem(this._prefix + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('Storage set error:', e);
      return false;
    }
  },
  
  remove(key) {
    try {
      localStorage.removeItem(this._prefix + key);
      return true;
    } catch (e) {
      return false;
    }
  },
  
  clear() {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(this._prefix))
        .forEach(k => localStorage.removeItem(k));
      return true;
    } catch (e) {
      return false;
    }
  }
};
