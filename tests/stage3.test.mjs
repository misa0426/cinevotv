import test from 'node:test';
import assert from 'node:assert/strict';
import { createSimulation, DEMO_RIGHTS, DEMO_VIDEO } from '../dev/simulation.mjs';
import { createLocalServer } from '../dev/server.mjs';
const adminPassword='Ficticia-Solo-Test-123!';
function fixture(iso='2026-11-01T12:00:00.000Z') {
 let time=new Date(iso);const api=createSimulation({adminPassword,now:()=>new Date(time)});
 const admin=api.login({email:'admin@cinevo.test',password:adminPassword});
 const a=api.register({email:'a@example.test',password:'Ficticia123!',name:'Ana',role:'admin'});
 const b=api.register({email:'b@example.test',password:'Ficticia123!',name:'Bea'});
 return {api,admin,a,b,advance:value=>{time=new Date(value);}};
}
const rejects=(operation,status)=>assert.throws(operation,error=>error.status===status);
const data=(overrides={})=>({title:'Demo original',description:'Video de flores de prueba.',type:'movie',category:'Demostración',access:'free',palette:2,status:'draft',rights:'pending',...overrides});

test('Solo la cuenta reservada tiene permiso de administrador',()=>{
 const {api,admin,a}=fixture();assert.equal(a.user.role,'user');
 rejects(()=>api.adminSnapshot(),401);rejects(()=>api.adminSnapshot(a.token),403);
 assert.equal(api.adminSnapshot(admin.token).simulated,true);
 rejects(()=>api.register({email:'ADMIN@CINEVO.TEST',password:'Intruso123!'}),409);
 rejects(()=>api.login({email:'admin@cinevo.test',password:'incorrecta'}),401);
});
test('Las sesiones caducan, no se pueden inventar y se revocan al salir',()=>{
 const {api,a,advance}=fixture();rejects(()=>api.me('inventada'),401);api.logout(a.token);rejects(()=>api.me(a.token),401);
 const session=api.login({email:'a@example.test',password:'Ficticia123!'});advance('2026-11-01T20:00:00Z');rejects(()=>api.me(session.token),401);
});
test('El panel no devuelve contraseñas, hashes ni sales',()=>{
 const {api,admin,a}=fixture();const serialized=JSON.stringify(api.adminSnapshot(admin.token));
 assert.ok(!serialized.includes('"hash"')&&!serialized.includes('"salt"')&&!serialized.includes(adminPassword));assert.equal(api.me(a.token).email,'a@example.test');
});
test('Métricas coherentes: clientes sin administrador, pagos netos y mes UTC',()=>{
 const {api,admin}=fixture();const s=api.adminSnapshot(admin.token);
 assert.equal(s.metrics.users,8);assert.equal(s.metrics.premium,2);assert.equal(s.metrics.free,6);
 assert.equal(s.metrics.users,s.metrics.premium+s.metrics.free);assert.equal(s.metrics.active,2);assert.equal(s.metrics.canceled,1);
 assert.equal(s.metrics.totalRevenueCents,1398);assert.equal(s.metrics.monthlyRevenueCents,699);
 assert.ok(s.payments.some(p=>p.status==='failed'));assert.ok(s.payments.some(p=>p.status==='refunded'));
});
test('Premium simulado crea historial ficticio una vez y Gratis cancela sin cobros reales',()=>{
 const {api,admin,a}=fixture();const before=api.adminSnapshot(admin.token);
 api.choosePlan(a.token,{plan:'premium'});api.choosePlan(a.token,{plan:'premium'});
 const after=api.adminSnapshot(admin.token);assert.equal(after.payments.length,before.payments.length+1);assert.equal(after.metrics.totalRevenueCents,before.metrics.totalRevenueCents+699);
 api.choosePlan(a.token,{plan:'free'});const client=api.adminSnapshot(admin.token).clients.find(c=>c.uid===a.user.uid);
 assert.equal(client.subscription.status,'canceled');assert.equal(client.plan,'free');assert.equal(client.payments.length,1);assert.ok(client.payments[0].simulated);
 rejects(()=>api.choosePlan(a.token,{plan:'superadmin'}),400);
});
test('Renovación mensual limita el día al último del siguiente mes',()=>{
 const {api,admin,a}=fixture('2027-01-31T12:00:00Z');api.choosePlan(a.token,{plan:'premium'});
 assert.equal(api.adminSnapshot(admin.token).clients.find(c=>c.uid===a.user.uid).subscription.renewalAt,'2027-02-28T12:00:00.000Z');
});
test('Favoritos por usuario, duplicados y edición de nombre conservan aislamiento',()=>{
 const {api,a,b}=fixture();api.choosePlan(a.token,{plan:'premium'});api.choosePlan(b.token,{plan:'premium'});api.favorite(a.token,{title:'Movie 1'});api.favorite(a.token,{title:'Movie 1'});
 assert.deepEqual(api.favorites(a.token),['Movie 1']);assert.deepEqual(api.favorites(b.token),[]);
 api.profile(a.token,{name:'  Ana nueva  ',role:'admin'});assert.equal(api.me(a.token).displayName,'Ana nueva');assert.equal(api.me(a.token).role,'user');
 api.favorite(a.token,{title:'Movie 1',remove:true});assert.deepEqual(api.favorites(a.token),[]);
});
test('Usuarios normales no pueden agregar, editar, retirar ni categorizar',()=>{
 const {api,a,admin}=fixture();const item=api.adminSnapshot(admin.token).catalog[0];
 rejects(()=>api.saveContent(a.token,data()),403);rejects(()=>api.saveContent(a.token,{...item,status:'withdrawn'}),403);rejects(()=>api.category(a.token,{name:'Intrusa'}),403);
});
test('Agregar borrador no lo hace visible; publicar exige derechos verificados',()=>{
 const {api,admin}=fixture();const item=api.saveContent(admin.token,data());assert.ok(!api.catalog().some(c=>c.id===item.id));
 rejects(()=>api.saveContent(admin.token,{...item,status:'published'}),400);
 const published=api.saveContent(admin.token,{...item,status:'published',rights:'demo-verified',rightsEvidence:DEMO_RIGHTS});assert.ok(api.catalog().some(c=>c.id===published.id));
});
test('Se rechazan videos externos y evidencias de derechos no verificadas',()=>{
 const {api,admin}=fixture();rejects(()=>api.saveContent(admin.token,data({video:'https://example.com/pelicula.mp4'})),400);
 rejects(()=>api.saveContent(admin.token,data({status:'published',rights:'demo-verified',rightsEvidence:'marcado por usuario'})),400);
 rejects(()=>api.saveContent(admin.token,data({rights:'licensed-commercial'})),400);
});
test('Editar título y carátula conserva el identificador y los favoritos',()=>{
 const {api,admin,a}=fixture();api.choosePlan(a.token,{plan:'premium'});api.favorite(a.token,{title:'Movie 1'});const item=api.adminSnapshot(admin.token).catalog[0];
 const updated=api.saveContent(admin.token,{...item,title:'Flores al amanecer',palette:6,description:'Descripción editada.'});
 assert.equal(updated.id,item.id);assert.equal(updated.favoriteKey,'Movie 1');assert.deepEqual(api.favorites(a.token),['Movie 1']);assert.equal(api.catalog()[0].palette,6);
});
test('Edición concurrente obsoleta no sobrescribe la última versión',()=>{
 const {api,admin}=fixture();const item=api.adminSnapshot(admin.token).catalog[0];api.saveContent(admin.token,{...item,title:'Primera edición'});
 rejects(()=>api.saveContent(admin.token,{...item,title:'Edición obsoleta'}),409);assert.equal(api.adminSnapshot(admin.token).catalog[0].title,'Primera edición');
});
test('Categorías se agregan y solo se quitan cuando no tienen contenido',()=>{
 const {api,admin}=fixture();api.category(admin.token,{name:'Originales'});assert.ok(api.adminSnapshot(admin.token).categories.includes('Originales'));
 rejects(()=>api.category(admin.token,{name:'Demostración',remove:true}),409);api.category(admin.token,{name:'Originales',remove:true});assert.ok(!api.adminSnapshot(admin.token).categories.includes('Originales'));
});
test('Retirar conserva registro y favoritos pero revoca disponibilidad y reproducción',()=>{
 const {api,admin,a}=fixture();const item=api.adminSnapshot(admin.token).catalog[0];api.choosePlan(a.token,{plan:'premium'});api.favorite(a.token,{title:item.favoriteKey});api.saveContent(admin.token,{...item,status:'withdrawn'});
 assert.ok(!api.catalog(a.token).some(c=>c.id===item.id));assert.equal(api.adminSnapshot(admin.token).catalog[0].status,'withdrawn');rejects(()=>api.playback(a.token,{id:item.id}),404);
 rejects(()=>api.favorite(a.token,{title:item.favoriteKey}),404);assert.equal(api.favorites(a.token).length,1);api.favorite(a.token,{title:item.favoriteKey,remove:true});assert.equal(api.favorites(a.token).length,0);
});
test('Premium se comprueba en servidor aunque se solicite directamente el video',()=>{
 const {api,admin,a,b}=fixture();const item=api.adminSnapshot(admin.token).catalog[0];api.saveContent(admin.token,{...item,access:'premium'});
 rejects(()=>api.playback(null,{id:item.id}),403);rejects(()=>api.playback(b.token,{id:item.id}),403);api.choosePlan(a.token,{plan:'premium'});assert.ok(api.playback(a.token,{id:item.id}).video.startsWith('/api/media/'));
 api.choosePlan(a.token,{plan:'free'});rejects(()=>api.playback(a.token,{id:item.id}),403);assert.ok(!('video' in api.catalog()[0]));
});
test('Promoción gratuita usa reloj del servidor: inicio inclusivo, fin exclusivo',()=>{
 const {api,admin,b,advance}=fixture();const item=api.adminSnapshot(admin.token).catalog[0];api.saveContent(admin.token,{...item,access:'premium',freeFrom:'2026-11-01T13:00:00Z',freeUntil:'2026-11-01T14:00:00Z'});
 rejects(()=>api.playback(b.token,{id:item.id}),403);advance('2026-11-01T13:00:00Z');assert.equal(api.playback(b.token,{id:item.id}).access,'free');advance('2026-11-01T14:00:00Z');rejects(()=>api.playback(b.token,{id:item.id}),403);
});
test('Fechas incompletas e invertidas y categorías/paletas inválidas se rechazan',()=>{
 const {api,admin}=fixture();for(const overrides of [{freeFrom:'2026-11-01T13:00:00Z'},{freeFrom:'2026-11-01T15:00:00Z',freeUntil:'2026-11-01T14:00:00Z'},{freeFrom:'1',freeUntil:'2'},{category:'No existe'},{palette:9},{title:'  '}])rejects(()=>api.saveContent(admin.token,data(overrides)),400);
});

test('API HTTP real: cookies, permisos, CSRF, UID, rutas privadas y revocación',async t=>{
 const server=createLocalServer({approvedMedia:false,adminPassword});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
 const base='http://127.0.0.1:'+server.address().port;
 const call=async(path,{cookie,body,origin}={})=>fetch(base+path,{headers:{...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{}),...(origin?{Origin:origin}:{})},...(body?{method:'POST',body:JSON.stringify(body)}:{})});
 assert.equal((await call('/api/admin/snapshot')).status,401);assert.equal((await call('/.local/admin-acceso.txt')).status,404);assert.equal((await call('/.git/config')).status,404);
 const registered=await call('/api/auth/register',{body:{email:'web@example.test',name:'Web',password:'Ficticia123!',role:'admin'}});const user=await registered.json();const cookie=registered.headers.getSetCookie().map(cookie=>cookie.split(';')[0]).join('; ');
 assert.equal(user.role,'user');assert.match(registered.headers.get('set-cookie'),/HttpOnly/);assert.match(registered.headers.get('set-cookie'),/SameSite=Strict/);
 assert.equal((await call('/api/admin/snapshot',{cookie})).status,403);assert.equal((await call('/api/admin/content',{cookie,body:data()})).status,403);
 assert.equal((await call('/api/profile',{cookie,body:{uid:'otra-cuenta',name:'Intruso'}})).status,409);
 assert.equal((await call('/api/plan',{cookie,body:{uid:user.uid,plan:'premium'},origin:'https://otro-sitio.example'})).status,403);
 await call('/api/plan',{cookie,body:{uid:user.uid,plan:'premium'}});
 assert.equal((await call('/api/favorites',{cookie,body:{uid:user.uid,title:'Movie 1'}})).status,200);
 const favorites=await (await call('/api/favorites',{cookie})).json();assert.equal(favorites.uid,user.uid);assert.deepEqual(favorites.favorites,['Movie 1']);
 const adminLogin=await call('/api/auth/login',{body:{email:'admin@cinevo.test',password:adminPassword}});const adminCookie=adminLogin.headers.getSetCookie().map(cookie=>cookie.split(';')[0]).join('; ');assert.equal((await call('/api/admin/snapshot',{cookie:adminCookie})).status,200);
 await call('/api/auth/logout',{cookie:adminCookie,body:{}});assert.equal((await call('/api/admin/snapshot',{cookie:adminCookie})).status,401);
});
