window.testState = { auth: null, watches: [], writes: [], removes: [], profiles: [], holdRemove: null, holdProfile: null, loginCalls: [], registerCalls: [], loginError: null, holdSave: null, logoutError: false };
window.fakeBackend = {
  onAuth(callback) { testState.auth = callback; callback(null); },
  watchFavorites(uid, success, failure) { const watch = { uid, success, failure, stopped: false }; testState.watches.push(watch); return () => { watch.stopped = true; }; },
  async saveFavorite(uid, title) { testState.writes.push({ uid, title }); if (testState.holdSave) await testState.holdSave; },
  async removeFavorite(uid, title) { testState.removes.push({ uid, title }); if (testState.holdRemove) await testState.holdRemove; },
  async updateUserProfile(uid, name) { testState.profiles.push({ uid, name }); if (testState.holdProfile) await testState.holdProfile; },
  async login(email, password) { testState.loginCalls.push({ email, password }); if (testState.loginError) throw testState.loginError; testState.auth({ uid: 'login-user', email }); },
  async register(email, password, name) { testState.registerCalls.push({ email, password, name }); testState.auth({ uid: 'new-user', email }); },
  async logout() { if (testState.logoutError) throw new Error('offline'); testState.auth(null); }
};
// Bloquear la descarga de contenido externo; probar por separado éxito y fallo del reproductor.
window.mediaCalls = { loads: 0, pauses: 0, plays: 0, reject: false };
HTMLMediaElement.prototype.load = function () { mediaCalls.loads++; };
HTMLMediaElement.prototype.pause = function () { mediaCalls.pauses++; };
HTMLMediaElement.prototype.play = async function () { mediaCalls.plays++; if (mediaCalls.reject) throw new Error('offline'); };
