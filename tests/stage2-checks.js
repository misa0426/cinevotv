await test('Planes exigen sesión y muestran precio CAD sin cobros', () => {
 testState.auth(null); document.querySelector('[data-plan=premium]').click();
 assert($('loginPanel').style.display === 'block', 'invitado selecciona plan');
 assert($('planStatus').textContent.includes('Inicia sesión'), 'sin indicación de acceso');
 assert(document.querySelector('.premium .price').textContent.includes('6.99') && document.querySelector('.premium .price').textContent.includes('CAD'), 'precio incorrecto');
 closeAuth();
});
await test('Planes simulados quedan separados por UID y se recuperan al volver', () => {
 const writes = testState.writes.length;
 testState.auth({ uid: 'plan-A', email: 'a@example.test', displayName: 'Ana' }); testState.watches.at(-1).success([]);
 document.querySelector('[data-plan=premium]').click();
 assert($('profilePlan').textContent.includes('Premium') && $('planStatus').textContent.includes('No se realizará ningún cobro'), 'plan no seleccionado');
 testState.auth({ uid: 'plan-B', email: 'b@example.test' }); testState.watches.at(-1).success([]);
 assert($('profilePlan').textContent.includes('Gratis'), 'plan mezclado');
 document.querySelector('[data-plan=free]').click();
 testState.auth(null); assert($('profilePlan').textContent === 'Sin sesión', 'plan persiste sin sesión');
 testState.auth({ uid: 'plan-A', email: 'a@example.test', displayName: 'Ana' }); testState.watches.at(-1).success([]);
 assert($('profilePlan').textContent.includes('Premium'), 'pierde plan de A');
 document.querySelector('[data-plan=free]').click(); assert($('profilePlan').textContent.includes('Gratis'), 'no cambia a Gratis');
 assert(testState.writes.length === writes, 'plan escribe en favoritos');
});
await test('Perfil actualiza nombre y avatar sin interpretar HTML', async () => {
 $('profileName').value = '  <img src=x>  ';
 $('profileForm').dispatchEvent(new Event('submit', { cancelable: true })); await tick();
 assert(testState.profiles.at(-1).uid === 'plan-A' && testState.profiles.at(-1).name === '<img src=x>', 'UID o nombre incorrectos');
 assert($('profileHeading').textContent === '<img src=x>' && !$('profileHeading').querySelector('img'), 'inyección HTML');
 assert($('profileStatus').textContent.includes('actualizado'), 'sin confirmación');
 $('profileName').value = '   '; const count = testState.profiles.length;
 $('profileForm').dispatchEvent(new Event('submit', { cancelable: true })); await tick(); assert(testState.profiles.length === count, 'nombre vacío aceptado');
});
await test('Perfil ignora respuestas de sesión anterior y permite reintentar fallo', async () => {
 let release; testState.holdProfile = new Promise(resolve => { release = resolve; });
 $('profileName').value = 'Anterior'; $('profileForm').dispatchEvent(new Event('submit', { cancelable: true }));
 testState.auth({ uid: 'profile-B', email: 'b@example.test', displayName: 'Bea' }); testState.watches.at(-1).success([]);
 release(); await tick(); testState.holdProfile = null;
 assert($('profileHeading').textContent === 'Bea', 'perfil anterior contamina B');
 testState.holdProfile = Promise.reject(new Error('offline')); $('profileName').value = 'Nuevo';
 $('profileForm').dispatchEvent(new Event('submit', { cancelable: true })); await tick(); testState.holdProfile = null;
 assert($('profileStatus').textContent.includes('No se pudo') && !$('profileForm').querySelector('[type=submit]').disabled, 'no permite reintentar');
});
await test('Mi Lista permite quitar desde la lista y guardar de nuevo', async () => {
 testState.watches.at(-1).success(['Movie 1']);
 const remove = $('favoritos').querySelector('button'); assert(remove.getAttribute('aria-label').includes('Movie 1'), 'control sin nombre');
 remove.click(); await tick(); assert($('favoriteCount').textContent === '0' && !$('favoritos').textContent.includes('Movie 1'), 'no quita');
 allCards[0].querySelector('button').click(); await tick(); assert($('favoriteCount').textContent === '1' && $('favoritos').textContent === 'Movie 1', 'no guarda de nuevo');
});
await test('Quitar fallido conserva favoritos; respuesta tardía no contamina otra cuenta', async () => {
 testState.holdRemove = Promise.reject(new Error('offline'));
 allCards[0].querySelector('button').click(); await tick(); testState.holdRemove = null;
 assert($('favoritos').textContent.includes('No se pudo quitar') && allCards[0].querySelector('button').getAttribute('aria-pressed') === 'true', 'pierde favorito ante fallo');
 let release; testState.holdRemove = new Promise(resolve => { release = resolve; });
 allCards[0].querySelector('button').click();
 testState.auth({ uid: 'remove-B', email: 'b@example.test' }); testState.watches.at(-1).success(['Movie 1','Series 1']);
 release(); await tick(); testState.holdRemove = null;
 assert($('favoriteCount').textContent === '2' && favorites.includes('Movie 1'), 'eliminación antigua contamina B');
});
await test('Mostrar contraseña se restablece al cerrar y Escape libera la página', () => {
 testState.auth(null); openPanel('loginPanel'); $('loginPassword').value = 'secret';
 document.querySelector('[data-password=loginPassword]').click(); assert($('loginPassword').type === 'text', 'no muestra');
 $('loginPanel').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
 assert($('loginPassword').value === '' && $('loginPassword').type === 'password', 'credencial visible al cerrar');
 assert(!$('contenido').inert && !document.body.classList.contains('modal-open'), 'página sigue bloqueada');
});
await test('Cambio de cuenta no deja visibles nombre ni plan anteriores', () => {
 testState.auth({ uid: 'clear-A', email: 'a@example.test', displayName: 'Ana' }); testState.watches.at(-1).success([]);
 document.querySelector('[data-plan=premium]').click(); testState.auth(null);
 assert($('profileForm').style.display === 'none' && $('profileName').value === '' && $('profileHeading').textContent === 'Mi perfil', 'nombre persiste');
 assert($('accountLink').hidden && $('profilePlan').textContent === 'Sin sesión', 'estado privado persiste');
});

await test('Autenticación impide enviar registro mientras hay un acceso pendiente', async () => {
 testState.auth(null); openPanel('loginPanel'); $('loginEmail').value = 'a@example.test'; $('loginPassword').value = 'secret';
 let release; const originalLogin = backend.login;
 backend.login = async (...args) => { await new Promise(resolve => { release = resolve; }); return originalLogin(...args); };
 const registrations = testState.registerCalls.length;
 submit($('loginPanel')); openPanel('registerPanel'); submit($('registerPanel'));
 assert($('loginPanel').style.display === 'block' && testState.registerCalls.length === registrations, 'operaciones de acceso concurrentes');
 release(); await tick(); backend.login = originalLogin;
 assert(!authBusy && !$('contenido').inert, 'acceso no libera la página');
});
await test('Portada abre y reproduce demostración, y el cierre restaura la página', async () => {
 const plays = mediaCalls.plays; $('heroPlay').click(); await tick();
 assert($('detailsTitle').textContent === 'Movie 1' && mediaCalls.plays === plays + 1, 'portada no reproduce');
 assert($('contenido').inert && document.body.classList.contains('modal-open'), 'foco no aislado');
 $('closeDetails').click(); assert(!$('contenido').inert && !document.body.classList.contains('modal-open'), 'no restaura');
});
