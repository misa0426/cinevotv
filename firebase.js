import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import { getFirestore, doc, onSnapshot, runTransaction } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js';

// Configuración pública del cliente existente. La autorización depende de las reglas desplegadas.
const firebaseConfig = {
    apiKey: "AIzaSyDQascHh2rzhDDpWdKRX-xthKtA6oz0p6U",
    authDomain: "cinevotv-a3378.firebaseapp.com",
    projectId: "cinevotv-a3378",
    storageBucket: "cinevotv-a3378.firebasestorage.app",
    messagingSenderId: "495427023735",
    appId: "1:495427023735:web:89eb3588d847ba88862772"
  };

export function createBackend(config = firebaseConfig) {
  // Esta rama de desarrollo nunca debe contactar con el proyecto de producción.
  if (!config.projectId || config.projectId === 'cinevotv-a3378' || JSON.stringify(config).includes('495427023735')) {
    throw new Error('Producción bloqueada en desarrollo. Usa Start-CinevoTV.ps1 o un proyecto de pruebas separado.');
  }
  const app = initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);
  return {
    onAuth(callback) { return onAuthStateChanged(auth, callback); },
    login(email, password) { return signInWithEmailAndPassword(auth, email, password); },
    async register(email, password, name) {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        try { await updateProfile(result.user, { displayName: name }); }
        catch { alert('Tu cuenta se creó correctamente, pero no se pudo guardar el nombre. Ya puedes iniciar sesión.'); }
      }
    },
    logout() { return signOut(auth); },
    watchFavorites(uid, success, failure) {
      return onSnapshot(doc(db, 'usuarios', uid), snapshot => {
        success(snapshot.exists() ? (snapshot.data().favoritos === undefined ? [] : snapshot.data().favoritos) : []);
      }, failure);
    },
    async updateUserProfile(uid, name) {
      if (!auth.currentUser || auth.currentUser.uid !== uid) throw new Error('Sesión cambiada');
      if (!name.trim() || name.length > 100) throw new Error('Nombre inválido');
      await updateProfile(auth.currentUser, { displayName: name.trim() });
    },
    async removeFavorite(uid, title) {
      if (!auth.currentUser || auth.currentUser.uid !== uid) throw new Error('Sesión cambiada');
      const reference = doc(db, 'usuarios', uid);
      return runTransaction(db, async transaction => {
        const snapshot = await transaction.get(reference);
        if (!auth.currentUser || auth.currentUser.uid !== uid) throw new Error('Sesión cambiada');
        const values = snapshot.exists() ? (snapshot.data().favoritos === undefined ? [] : snapshot.data().favoritos) : [];
        if (!Array.isArray(values) || values.some(value => typeof value !== 'string')) throw new Error('Formato inesperado');
        if (values.includes(title)) transaction.set(reference, { favoritos: values.filter(value => value !== title) }, { merge: true });
      });
    },
    async saveFavorite(uid, title) {
      if (!auth.currentUser || auth.currentUser.uid !== uid) throw new Error('Sesión cambiada');
      const reference = doc(db, 'usuarios', uid);
      // La transacción evita perder favoritos de otra pestaña o dispositivo.
      // Mantener títulos y ruta conserva la compatibilidad con los datos existentes.
      return runTransaction(db, async transaction => {
        const snapshot = await transaction.get(reference);
        if (!auth.currentUser || auth.currentUser.uid !== uid) throw new Error('Sesión cambiada');
        const values = snapshot.exists() ? (snapshot.data().favoritos === undefined ? [] : snapshot.data().favoritos) : [];
        if (!Array.isArray(values) || values.some(value => typeof value !== 'string')) throw new Error('Formato inesperado');
        if (!values.includes(title)) transaction.set(reference, { favoritos: [...values, title] }, { merge: true });
      });
    }
  };
}
