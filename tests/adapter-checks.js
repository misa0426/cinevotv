// Ejecutar el adaptador real con sustitutos de las funciones del SDK; sin red.
const sdk = {
 initializeApp: () => ({}), getAuth: () => sdk.auth, getFirestore: () => ({}),
 auth: { currentUser: { uid: 'A' } }, values: ['Movie 1'], exists: true, calls: [],
 doc: (_db, collection, uid) => ({ collection, uid }),
 onAuthStateChanged: (_auth, callback) => { callback(sdk.auth.currentUser); return () => {}; },
 signInWithEmailAndPassword: async (_auth, email, password) => { sdk.calls.push({ action: 'login', email, password }); },
 createUserWithEmailAndPassword: async (_auth, email, password) => { sdk.calls.push({ action: 'register', email, password }); return { user: { uid: 'new' } }; },
 updateProfile: async (user, data) => { sdk.calls.push({ action: 'profile', uid: user.uid, data }); },
 signOut: async () => { sdk.calls.push({ action: 'logout' }); },
 onSnapshot: (ref, success) => { sdk.ref = ref; success({ exists: () => sdk.exists, data: () => ({ favoritos: sdk.values }) }); return () => {}; },
 runTransaction: async (_db, callback) => callback({
  get: async ref => { sdk.ref = ref; return { exists: () => sdk.exists, data: () => ({ favoritos: sdk.values, untouched: 'keep' }) }; },
  set: (ref, data, options) => { sdk.calls.push({ action: 'set', ref, data, options }); }
 })
};
const adapter = new Function(...Object.keys(sdk), ADAPTER_SOURCE + "; return createBackend({ projectId: 'cinevo-tests', appId: 'test', apiKey: 'test' });")(...Object.values(sdk));
await test('Adaptador escribe por UID y conserva campos con merge', async () => {
 await adapter.saveFavorite('A', 'Series 1'); const write = sdk.calls.at(-1);
 assert(write.action === 'set' && write.ref.collection === 'usuarios' && write.ref.uid === 'A', 'ruta alterada');
 assert(write.options.merge === true && Object.keys(write.data).join() === 'favoritos', 'sobrescribe campos ajenos');
 assert(write.data.favoritos.join() === 'Movie 1,Series 1', 'pierde favoritos');
});
await test('Adaptador no escribe duplicados ni listas malformadas', async () => {
 const count = sdk.calls.length; await adapter.saveFavorite('A', 'Movie 1'); assert(sdk.calls.length === count, 'duplicado');
 for (const invalid of [{ invalid: true }, null, ['Movie 1', 42]]) {
  sdk.values = invalid; let failed = false; try { await adapter.saveFavorite('A', 'Movie 2'); } catch { failed = true; }
  assert(failed && sdk.calls.length === count, 'sobrescribe datos inesperados');
 }
 sdk.values = ['Movie 1'];
});
await test('Adaptador rechaza UID ajeno o sesión cerrada', async () => {
 const count = sdk.calls.length; let failures = 0;
 try { await adapter.saveFavorite('B', 'Movie 2'); } catch { failures++; }
 sdk.auth.currentUser = null; try { await adapter.saveFavorite('A', 'Movie 2'); } catch { failures++; }
 assert(failures === 2 && sdk.calls.length === count, 'escritura sin autorización de sesión'); sdk.auth.currentUser = { uid: 'A' };
});
await test('Adaptador crea solo favoritos al faltar documento y escucha la ruta existente', async () => {
 sdk.exists = false; await adapter.saveFavorite('A', 'Movie 3');
 assert(sdk.calls.at(-1).data.favoritos.join() === 'Movie 3', 'documento nuevo incorrecto');
 let values; adapter.watchFavorites('A', result => { values = result; }, () => {});
 assert(values.length === 0 && sdk.ref.uid === 'A', 'escucha incorrecta'); sdk.exists = true;
});
await test('Adaptador conserva integración de Authentication y nombre de cuenta nueva', async () => {
 await adapter.login('a@example.test', 'secret'); await adapter.register('new@example.test', 'secret123', 'Cinevo'); await adapter.logout();
 assert(sdk.calls.some(call => call.action === 'login' && call.email === 'a@example.test'), 'login desconectado');
 assert(sdk.calls.some(call => call.action === 'profile' && call.uid === 'new' && call.data.displayName === 'Cinevo'), 'nombre no guardado');
 assert(sdk.calls.at(-1).action === 'logout', 'logout desconectado');
});

await test('Adaptador bloquea producción antes de inicializar Firebase', () => {
 let blocked = false;
 try { new Function(...Object.keys(sdk), ADAPTER_SOURCE + '; return createBackend();')(...Object.values(sdk)); } catch { blocked = true; }
 assert(blocked, 'producción no bloqueada');
});
await test('Adaptador quita solo el título solicitado y preserva los demás campos', async () => {
 sdk.values = ['Movie 1', 'Series 1']; await adapter.removeFavorite('A', 'Movie 1'); const write = sdk.calls.at(-1);
 assert(write.ref.uid === 'A' && write.options.merge && write.data.favoritos.join() === 'Series 1', 'elimina datos ajenos');
 const count = sdk.calls.length; await adapter.removeFavorite('A', 'Movie 2'); assert(sdk.calls.length === count, 'escribe título ausente');
 for (const invalid of [null, { invalid: true }]) {
  sdk.values = invalid; let blocked = false; try { await adapter.removeFavorite('A', 'Movie 1'); } catch { blocked = true; }
  assert(blocked && sdk.calls.length === count, 'sobrescribe lista malformada');
 }
 sdk.values = ['Movie 1'];
});
await test('Adaptador protege eliminación y edición de perfiles por UID', async () => {
 const count = sdk.calls.length; let blocked = 0;
 try { await adapter.removeFavorite('B', 'Movie 1'); } catch { blocked++; }
 try { await adapter.updateUserProfile('B', 'Intruso'); } catch { blocked++; }
 try { await adapter.updateUserProfile('A', '  '); } catch { blocked++; }
 assert(blocked === 3 && sdk.calls.length === count, 'acepta operación inválida');
 await adapter.updateUserProfile('A', '  Ana  ');
 assert(sdk.calls.at(-1).uid === 'A' && sdk.calls.at(-1).data.displayName === 'Ana', 'perfil incorrecto');
});
