await wait(()=>document.querySelector('.card .poster-label')?.textContent==='PREMIUM');
await test('El sondeo de sesión no borra contraseñas de invitados',async()=>{
 document.querySelector('[data-open=loginPanel]').click();el('loginPassword').value='Ficticia123!';await new Promise(resolve=>setTimeout(resolve,2200));assert(el('loginPassword').value==='Ficticia123!','se borra contraseña mientras se escribe');document.querySelector('[data-close=loginPanel]').click();
});
await test('Contenido Premium bloqueado para invitado por la API',async()=>{
 document.querySelector('.card').click();el('playMovie').click();await wait(()=>el('playerStatus').textContent.includes('Premium'));assert(window.realMediaPlays===0,'reproducción sin permiso');el('closeDetails').click();
});
await test('Registro local no concede permiso de administración',async()=>{
 document.querySelector('[data-open=registerPanel]').click();el('registroEmail').value='e2e-a@example.test';el('registroPassword').value='Ficticia123!';el('registroNombre').value='Ana E2E';submit('registerPanel');await wait(()=>el('estadoSesion').textContent.includes('e2e-a@example.test'));assert(el('adminLink').hidden,'usuario con enlace de administrador');assert((await fetch('/api/admin/snapshot')).status===403,'API sin protección');
});
await test('Premium simulado habilita reproducción y oculta espacio publicitario',async()=>{
 document.querySelector('[data-plan=premium]').click();await wait(()=>el('profilePlan').textContent.includes('Premium'));document.querySelector('.card').click();el('playMovie').click();await wait(()=>window.realMediaPlays===1);assert(el('adSlot').hidden,'anuncio visible en Premium');el('closeDetails').click();
});
await test('Perfil y favoritos funcionan con la API HTTP',async()=>{
 el('profileName').value='Ana actualizada';submit('profileForm');await wait(()=>el('profileStatus').textContent.includes('actualizado'));assert(el('profileHeading').textContent==='Ana actualizada','no actualiza nombre');document.querySelector('.card button').click();await wait(()=>el('favoriteCount').textContent==='1');
});
await test('Cerrar, registrar B y volver a A conserva separación y Premium',async()=>{
 el('cerrarSesion').click();await wait(()=>el('cerrarSesion').hidden);document.querySelector('[data-open=registerPanel]').click();el('registroEmail').value='e2e-b@example.test';el('registroPassword').value='Ficticia123!';submit('registerPanel');await wait(()=>el('estadoSesion').textContent.includes('e2e-b@example.test'));assert(el('favoriteCount').textContent==='—'&&el('profilePlan').textContent.includes('Gratis'),'cuentas mezcladas');
 el('cerrarSesion').click();await wait(()=>el('cerrarSesion').hidden);document.querySelector('[data-open=loginPanel]').click();el('loginEmail').value='e2e-a@example.test';el('loginPassword').value='Ficticia123!';submit('loginPanel');await wait(()=>el('favoriteCount').textContent==='1');assert(el('profilePlan').textContent.includes('Premium')&&el('profileHeading').textContent==='Ana actualizada','no recupera cuenta A');
});

await test('Familiar aparece en perfil y mantiene Mi Lista sin anuncios',async()=>{
 document.querySelector('[data-plan=family]').click();await wait(()=>el('profilePlan').textContent.includes('Familiar'));assert(el('adSlot').hidden,'anuncios en Familiar');await wait(()=>el('favoriteCount').textContent==='1');
});
await test('Cancelar bloquea Mi Lista sin borrar y Familiar la recupera',async()=>{
 document.querySelector('[data-plan=free]').click();await wait(()=>el('profilePlan').textContent.includes('Gratis'));assert(el('favoritos').textContent.includes('se conservan'),'no explica conservación');assert((await fetch('/api/favorites')).status===403,'Gratis lee favoritos');document.querySelector('[data-plan=family]').click();await wait(()=>el('favoriteCount').textContent==='1');
});
await test('Precios internacionales muestran los importes USD aprobados',async()=>{
 el('pricingCountry').value='US';el('pricingCountry').dispatchEvent(new Event('change'));await wait(()=>document.querySelector('.premium .price').textContent.includes('5.99'));assert(!document.querySelector('[data-plan=family]').disabled&&document.querySelector('.family .price').textContent.includes('8.99'),'precio Familiar incorrecto');assert(document.querySelector('.premium .price').textContent.includes('USD'),'moneda incorrecta');el('pricingCountry').value='CA';el('pricingCountry').dispatchEvent(new Event('change'));await wait(()=>document.querySelector('.family .price').textContent.includes('9.99'));
});
await test('Perfil distingue dispositivos registrados y reproducciones simultáneas',async()=>{
 el('refreshDevices').click();await wait(()=>el('deviceList').children.length>0);assert(el('deviceLimits').textContent.includes('3 dispositivos')&&el('deviceLimits').textContent.includes('2 reproducciones'),'límites confusos');assert(el('deviceList').textContent.includes('Actual'),'no identifica dispositivo actual');
});
await test('Historial alimenta Continuar viendo y respeta las variantes reales',async()=>{
 const start=await(await fetch('/api/playback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:'movie-1',playbackId:'history-test'})})).json();assert(start.qualities.includes(360)&&start.qualities.includes(540)&&!start.qualities.includes(1080),'calidades inventadas');await fetch('/api/stream',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({leaseId:start.leaseId,position:1,duration:5,stop:true})});document.querySelector('[data-plan=family]').click();await wait(()=>el('continueList').textContent.includes('Movie 1'));assert(el('continueList').querySelector('progress').value===1,'progreso incorrecto');
});
