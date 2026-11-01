const results = [];
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const tick = () => new Promise(resolve => setTimeout(resolve, 30));
async function test(name, check) { try { await check(); results.push('PASS: ' + name); } catch (error) { results.push('FAIL: ' + name + ': ' + error.message); } }
const submit = id => document.getElementById(id).dispatchEvent(new Event('submit', { cancelable: true }));
await test('Simulador local registra A y guarda su favorito', async () => {
 $('registroEmail').value = 'prueba-a@example.test'; $('registroPassword').value = 'Cinevo123!'; $('registroNombre').value = 'Prueba A';
 submit('registerPanel'); await tick();
 assert($('estadoSesion').textContent.includes('prueba-a@example.test'), 'registro no termina');
 document.querySelector('.card button').click(); await tick(); assert($('favoritos').textContent === 'Movie 1', 'favorito no guardado');
});
await test('Simulador local registra B sin heredar favoritos de A', async () => {
 $('cerrarSesion').click(); await tick();
 $('registroEmail').value = 'prueba-b@example.test'; $('registroPassword').value = 'Cinevo123!';
 submit('registerPanel'); await tick(); assert(!$('favoritos').textContent.includes('Movie 1'), 'mezcla A con B');
 document.querySelector('.card[data-title="Series 1"]').querySelector('button').click(); await tick();
 assert($('favoritos').textContent === 'Series 1', 'lista B incorrecta');
});
await test('Simulador local rechaza clave incorrecta y restaura lista de A al entrar', async () => {
 $('cerrarSesion').click(); await tick(); $('loginEmail').value = 'prueba-a@example.test'; $('loginPassword').value = 'incorrecta';
 submit('loginPanel'); await tick(); assert($('loginPanel').querySelector('.auth-message').textContent.includes('incorrectos'), 'acepta clave incorrecta');
 $('loginPassword').value = 'Cinevo123!'; submit('loginPanel'); await tick();
 assert($('favoritos').textContent === 'Movie 1', 'no restaura lista A');
});

await test('Simulador conserva nombre editado después de salir y entrar', async () => {
 $('profileName').value = 'Ana Cinevo'; $('profileForm').dispatchEvent(new Event('submit', { cancelable: true })); await tick();
 assert($('profileHeading').textContent === 'Ana Cinevo', 'no edita perfil');
 $('cerrarSesion').click(); await tick(); $('loginEmail').value = 'prueba-a@example.test'; $('loginPassword').value = 'Cinevo123!'; submit('loginPanel'); await tick();
 assert($('profileHeading').textContent === 'Ana Cinevo', 'pierde nombre al volver');
});
await test('Simulador quita favorito y lo mantiene separado de B', async () => {
 document.querySelector('.card button').click(); await tick();
 assert($('favoriteCount').textContent === '0', 'no quita favorito de A');
 $('cerrarSesion').click(); await tick(); $('loginEmail').value = 'prueba-b@example.test'; $('loginPassword').value = 'Cinevo123!'; submit('loginPanel'); await tick();
 assert($('favoritos').textContent === 'Series 1', 'modifica lista de B');
});
await test('Simulador rechaza quitar y editar otro UID', async () => {
 let blocked = 0;
 try { await backend.removeFavorite('otro-uid', 'Series 1'); } catch { blocked++; }
 try { await backend.updateUserProfile('otro-uid', 'Intruso'); } catch { blocked++; }
 assert(blocked === 2 && $('favoritos').textContent === 'Series 1', 'operación ajena aceptada');
});
