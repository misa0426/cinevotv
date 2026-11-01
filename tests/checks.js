const results = [];
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
async function test(name, check) { try { await check(); results.push('PASS: ' + name); } catch (error) { results.push('FAIL: ' + name + ': ' + error.message); } }
const allCards = [...document.querySelectorAll('.card')];
const visibleTitles = () => allCards.filter(card => card.style.display !== 'none').map(card => card.dataset.title);
const query = value => { document.querySelector('.search').value = value; document.querySelector('.search').dispatchEvent(new Event('input')); };
const submit = form => form.dispatchEvent(new Event('submit', { cancelable: true }));
await test('Catálogo conserva ocho títulos y añade dos fichas abiertas, con formularios únicos', () => {
 assert(allCards.length === 10, 'catálogo incompleto');
 const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
 assert(new Set(ids).size === ids.length, 'IDs duplicados');
 assert(document.querySelectorAll('.auth-panel').length === 2 && document.querySelectorAll('#profileForm').length === 1, 'formularios duplicados');
});
await test('Reproducción de los ocho títulos sin incluir texto del botón', async () => {
 for (const card of allCards.filter(card => /^(Movie|Series) /.test(card.dataset.title))) {
  card.click(); assert($('detailsTitle').textContent === card.dataset.title, 'título contaminado');
  assert($('videoSource').getAttribute('src') === demoVideo, 'URL incorrecta');
  assert($('detailsType').textContent.includes(card.dataset.title.startsWith('Movie') ? 'Movie' : 'Series'), 'tipo incorrecto');
  $('playMovie').click(); await tick(); assert($('playerBox').style.display === 'block', 'reproductor oculto');
  $('closeDetails').click(); assert($('details').style.display === 'none', 'no cierra');
 }
 assert(mediaCalls.plays === 8 && mediaCalls.pauses >= 16, 'ciclo de reproducción incompleto');
});
await test('Error de reproducción visible y cierre con Escape', async () => {
 mediaCalls.reject = true; allCards[0].click(); $('playMovie').click(); await tick();
 assert($('playerStatus').textContent.includes('No se pudo'), 'fallo silencioso');
 $('details').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
 assert($('details').style.display === 'none', 'Escape no cierra'); mediaCalls.reject = false;
});
await test('Buscador ignora botón y normaliza mayúsculas, acentos y espacios', () => {
 query('guardar'); assert(visibleTitles().length === 0, 'busca botones');
 assert($('searchStatus').textContent.includes('No se encontraron'), 'sin aviso');
 query('  MÓVIE   1  '); assert(visibleTitles().join() === 'Movie 1', 'normalización incorrecta');
 query('series'); document.querySelector('[data-filter=movie]').click(); assert(visibleTitles().length === 0, 'filtro no combinado');
 document.querySelector('[data-filter=series]').click(); assert(visibleTitles().length === 4, 'series ocultas');
 query(''); document.querySelector('[data-filter=all]').click(); assert(visibleTitles().length === 10, 'no restaura catálogo');
});
await test('Invitado no guarda y caché compartida antigua no se importa', async () => {
 localStorage.setItem('cinevoFavoritos', '["Movie 4"]');
 allCards[0].querySelector('button').click(); await tick();
 assert(testState.writes.length === 0, 'escritura sin sesión');
 assert($('loginPanel').style.display === 'block', 'no solicita sesión');
 testState.auth({ uid: 'A', email: '<img src=x onerror=alert(1)>' });
 assert($('estadoSesion').querySelector('img') === null, 'HTML inyectado');
 assert(!document.querySelector('#estadoSesion img'), 'HTML inseguro');
 testState.watches.at(-1).success(['Movie 1']);
 assert(!$('favoritos').textContent.includes('Movie 4'), 'importa caché compartida');
 assert(localStorage.getItem('cinevoFavoritos') === '["Movie 4"]', 'elimina caché existente');
});
await test('Cuenta A, cuenta B y respuestas tardías no se mezclan', () => {
 const old = testState.watches.at(-1);
 testState.auth({ uid: 'B', email: 'b@example.test' });
 assert(old.stopped, 'suscripción anterior activa');
 assert(!$('favoritos').textContent.includes('Movie 1'), 'no limpia al cambiar');
 old.success(['Movie 4']); old.failure(new Error('late'));
 testState.watches.at(-1).success(['Series 2']);
 assert($('favoritos').textContent === 'Series 2', 'mezcla de cuentas');
 assert(allCards[0].querySelector('button').textContent.includes('Guardar'), 'botón de A persistente');
});
await test('Guardado en UID correcto, evita dobles clics y duplicados', async () => {
 let release; testState.holdSave = new Promise(resolve => { release = resolve; });
 const button = allCards[1].querySelector('button'); button.click(); button.click();
 assert(testState.writes.length === 1 && testState.writes[0].uid === 'B', 'escrituras duplicadas o UID incorrecto');
 release(); await tick(); testState.holdSave = null;
 assert(button.textContent.includes('Guardado'), 'no confirma'); button.click(); button.click(); await tick(); assert(testState.writes.length === 1 && testState.removes.length === 1, 'duplicado al quitar');
});
await test('Guardado pendiente de B no contamina nueva sesión de A', async () => {
 let release; testState.holdSave = new Promise(resolve => { release = resolve; });
 allCards[2].querySelector('button').click();
 testState.auth({ uid: 'A', email: 'a@example.test' }); testState.watches.at(-1).success(['Movie 1']);
 release(); await tick(); testState.holdSave = null;
 assert($('favoritos').textContent === 'Movie 1', 'respuesta antigua contamina A');
});
await test('Lista malformada y error de permisos bloquean escritura sin borrar datos', () => {
 const watch = testState.watches.at(-1); watch.success({ unexpected: true });
 assert($('favoritos').textContent.includes('formato inesperado'), 'formato no detectado');
 assert(allCards.every(card => card.querySelector('button').disabled), 'permite sobrescribir formato inválido');
 watch.failure(new Error('permission-denied')); assert($('favoritos').textContent.includes('No se pudo cargar'), 'error invisible');
 watch.success(['Movie 1']);
});
await test('Error al guardar permite reintentar', async () => {
 testState.holdSave = Promise.reject(new Error('offline'));
 allCards[3].querySelector('button').click(); await tick(); testState.holdSave = null;
 assert($('favoritos').textContent.includes('No se pudo guardar'), 'error invisible');
 assert(!allCards[3].querySelector('button').disabled, 'reintento bloqueado');
});
await test('Salir limpia lista, botones y contraseña; ignora snapshot tardío', async () => {
 const watch = testState.watches.at(-1); $('loginPassword').value = 'secret'; $('cerrarSesion').click(); await tick();
 assert($('favoritos').textContent.includes('Inicia sesión'), 'lista persiste');
 assert($('loginPassword').value === '', 'contraseña persiste');
 watch.success(['Movie 1']); assert(!$('favoritos').textContent.includes('Movie 1'), 'snapshot reaparece');
 assert($('cerrarSesion').hidden, 'botón salir visible');
});
await test('Formulario inválido no llama a Firebase', async () => {
 $('loginEmail').value = 'incorrecto'; $('loginPassword').value = 'secret'; submit($('loginPanel')); await tick();
 assert(testState.loginCalls.length === 0, 'acepta correo inválido');
 $('registroEmail').value = 'new@example.test'; $('registroPassword').value = '123'; submit($('registerPanel')); await tick();
 assert(testState.registerCalls.length === 0, 'acepta contraseña débil');
});
await test('Error de acceso en español y reintento exitoso', async () => {
 testState.loginError = { code: 'auth/invalid-credential' };
 $('loginEmail').value = 'a@example.test'; $('loginPassword').value = 'secret'; submit($('loginPanel')); await tick();
 assert($('loginPanel').querySelector('.auth-message').textContent.includes('incorrectos'), 'mensaje incorrecto');
 testState.loginError = null; submit($('loginPanel')); await tick();
 assert($('loginPanel').style.display === 'none' && $('loginPassword').value === '', 'no limpia al entrar');
});
await test('Registro único conserva correo, contraseña y nombre', async () => {
 testState.auth(null); $('registroEmail').value = 'new@example.test'; $('registroPassword').value = 'secret123'; $('registroNombre').value = '  Cinevo  ';
 submit($('registerPanel')); submit($('registerPanel')); await tick();
 assert(testState.registerCalls.length === 1, 'registro duplicado');
 assert(testState.registerCalls[0].name === 'Cinevo' && testState.registerCalls[0].password === 'secret123', 'datos incorrectos');
 assert($('registerPanel').style.display === 'none', 'registro sigue abierto');
});
