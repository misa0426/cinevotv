await test('Panel no muestra métricas privadas antes de autenticar',async()=>{assert(el('adminWorkspace').hidden&&el('adminMetrics').children.length===0,'panel visible sin sesión');});
await test('Administrador ve métricas y clientes ficticios',async()=>{
 el('adminEmail').value='admin@cinevo.test';el('adminPassword').value='Ficticia-Solo-Test-123!';submit('adminLogin');await wait(()=>!el('adminWorkspace').hidden);assert(el('adminMetrics').children.length===7,'faltan métricas');assert(el('clientsBody').textContent.includes('e2e-a@example.test'),'registro no integrado');assert(el('adminPassword').value==='','contraseña no limpiada');
});
await test('Clientes filtrados muestran historial de pagos ficticios',async()=>{
 document.querySelector('[data-tab=clients]').click();el('clientSearch').value='e2e-a@';el('clientSearch').dispatchEvent(new Event('input'));assert(el('clientsBody').querySelectorAll('tr').length===1,'filtro no funciona');el('clientsBody').querySelector('button').click();assert(el('clientDetail').textContent.includes('Aprobado ficticio'),'historial no integrado');el('clientSearch').value='';el('clientSearch').dispatchEvent(new Event('input'));
});
await test('Editor crea borrador y rechaza publicación sin derechos',async()=>{
 document.querySelector('[data-tab=content]').click();el('newContent').click();el('contentTitle').value='Flores E2E';el('contentDescription').value='Demostración original de prueba';submit('contentForm');await wait(()=>!el('contentDialog').open);assert(el('contentBody').textContent.includes('Flores E2E'),'no guarda borrador');
 const row=[...el('contentBody').querySelectorAll('tr')].find(row=>row.textContent.includes('Flores E2E'));row.querySelector('button').click();el('contentState').value='published';submit('contentForm');await wait(()=>el('contentStatus').textContent.includes('derechos pendientes'));assert(el('contentDialog').open,'publica sin derechos');
});
await test('Editor publica demo autorizada y sincroniza catálogo público',async()=>{
 el('contentRights').value='demo-verified';el('contentPalette').value='6';el('contentAccess').value='premium';el('contentFreeFrom').value='2030-01-01T00:00';el('contentFreeUntil').value='2030-01-02T00:00';submit('contentForm');await wait(()=>!el('contentDialog').open);
 const catalog=await(await fetch('/api/catalog')).json();const item=catalog.find(item=>item.title==='Flores E2E');assert(item?.palette===6&&item.effectiveAccess==='premium','catálogo no sincroniza');
});
await test('Retirar conserva registro y quita disponibilidad pública',async()=>{
 const row=[...el('contentBody').querySelectorAll('tr')].find(row=>row.textContent.includes('Flores E2E'));[...row.querySelectorAll('button')].find(button=>button.textContent==='Retirar').click();await wait(()=>[...el('contentBody').querySelectorAll('tr')].some(row=>row.textContent.includes('Flores E2E')&&row.textContent.includes('Retirado')));const catalog=await(await fetch('/api/catalog')).json();assert(!catalog.some(item=>item.title==='Flores E2E'),'contenido retirado visible');
});
await test('Categorías nuevas y protección de categorías utilizadas',async()=>{
 el('categoryName').value='Categoría E2E';submit('categoryForm');await wait(()=>el('categoryList').textContent.includes('Categoría E2E'));[...el('categoryList').querySelectorAll('button')].find(button=>button.textContent.startsWith('Demostración')).click();await wait(()=>el('adminStatus').textContent.includes('tiene contenido'));
});
await test('Cerrar sesión limpia métricas, tablas y acceso privado',async()=>{
 el('adminLogout').click();await wait(()=>el('adminWorkspace').hidden);assert(el('adminMetrics').children.length===0&&el('clientsBody').children.length===0,'datos quedan en DOM');assert((await fetch('/api/admin/snapshot')).status===401,'sesión sigue activa');
});
