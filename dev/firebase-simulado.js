// Adaptador exclusivo del servidor local. No importa ni contacta con Firebase.
export function createBackend() {
  const accounts = new Map();
  const listeners = new Set();
  let active = null;
  let authListener;
  const error = code => Object.assign(new Error(code), { code });
  const digest = async password => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password)))).map(value => value.toString(16).padStart(2, '0')).join('');
  function notify() {
    authListener?.(active ? { uid: active.uid, email: active.email, displayName: active.name } : null);
  }
  return {
    onAuth(callback) { authListener = callback; notify(); return () => { authListener = null; }; },
    async register(email, password, name) {
      const key = email.toLowerCase();
      const hash = await digest(password);
      if (accounts.has(key)) throw error('auth/email-already-in-use');
      if (password.length < 6) throw error('auth/weak-password');
      active = { uid: crypto.randomUUID(), email, name, hash, favorites: [] };
      accounts.set(key, active); notify();
    },
    async login(email, password) {
      const account = accounts.get(email.toLowerCase());
      if (!account || account.hash !== await digest(password)) throw error('auth/invalid-credential');
      active = account; notify();
    },
    async logout() { active = null; notify(); },
    watchFavorites(uid, success, failure) {
      const listener = { uid, success, failure }; listeners.add(listener);
      if (active?.uid === uid) success([...active.favorites]);
      else failure(error('permission-denied'));
      return () => listeners.delete(listener);
    },
    async updateUserProfile(uid, name) {
      if (active?.uid !== uid) throw error('permission-denied');
      if (!name.trim() || name.length > 100) throw error('invalid-name');
      active.name = name.trim();
    },
    async removeFavorite(uid, title) {
      if (active?.uid !== uid) throw error('permission-denied');
      active.favorites = active.favorites.filter(value => value !== title);
      for (const listener of listeners) if (listener.uid === uid) listener.success([...active.favorites]);
    },
    async saveFavorite(uid, title) {
      if (active?.uid !== uid) throw error('permission-denied');
      if (!active.favorites.includes(title)) active.favorites.push(title);
      for (const listener of listeners) if (listener.uid === uid) listener.success([...active.favorites]);
    }
  };
}
