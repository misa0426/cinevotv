import { MARKETS, PAID_PLANS, features, quote } from './policies.mjs';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';

export const DEMO_VIDEO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
export const DEMO_RIGHTS = 'https://github.com/mdn/interactive-examples/blob/main/LICENSE';
export class ApiError extends Error {
  constructor(status, message, code = 'invalid-request') { super(message); this.status = status; this.code = code; }
}
const fail = (status, message, code) => { throw new ApiError(status, message, code); };
const clean = (value, max = 160) => typeof value === 'string' && value.trim().length <= max ? value.trim() : '';
const copy = value => structuredClone(value);
function passwordHash(password, salt) { return scryptSync(password, salt, 32); }

export function createSimulation({ adminEmail = 'admin@cinevo.test', adminPassword, now = () => new Date(), region = 'CA', variants = [{id:'flower-540',height:540,mime:'video/mp4'}], openFilms = [], includeDemos = true } = {}) {
  if (!adminPassword || adminPassword.length < 12) throw new Error('Se requiere una contraseña local de al menos 12 caracteres.');
  adminEmail = adminEmail.trim().toLowerCase();
  if (!MARKETS[region]) throw new Error('Región local no admitida.');
  const leases = new Map(), history = new Map();
  const users = new Map(), sessions = new Map(), content = new Map();
  const payments = [], subscriptions = [], categories = new Set(['Demostración', 'Naturaleza']);
  const categoryLabels=new Map([['Demostración',{es:'Demostración',en:'Demonstration'}],['Naturaleza',{es:'Naturaleza',en:'Nature'}]]);
  const stamp = () => now().toISOString();
  const passwordOk = password => typeof password === 'string' && password.length >= 6 && password.length <= 256;
  function addUser(email, password, name, role = 'user', registeredAt = stamp()) {
    const salt = randomBytes(16).toString('hex');
    const user = { uid: randomUUID(), email, name, role, registeredAt, plan: 'free',period:'month',language:({CA:'en',US:'en',MX:'es',ES:'es',IE:'en'})[region], favorites: [], devices: [], country: region, salt, hash: passwordHash(password, salt).toString('hex') };
    users.set(user.uid, user); return user;
  }
  const admin = addUser(adminEmail, adminPassword, 'Administrador local', 'admin');
  function publicUser(user) { return user ? { uid: user.uid, email: user.email, displayName: user.name, role: user.role, registeredAt: user.registeredAt, plan: user.plan,period:user.period||'month',language:user.language,country:user.country,currency:MARKETS[user.country].currency,subscription:copy(currentSubscription(user.uid)||null), features:features(user.plan) } : null; }
  function account(token, adminOnly = false) {
    const session = sessions.get(token);
    if (!session || session.expires <= now().getTime()) { if (session) sessions.delete(token); fail(401, 'Inicia sesión para continuar.', 'auth/invalid-credential'); }
    const user = users.get(session.uid);
    if (!user || (adminOnly && user.role !== 'admin')) fail(403, 'No tienes permiso de administrador.', 'permission-denied');
    return user;
  }
  function newSession(user, context = {}) {
    const deviceId = context.deviceId || randomUUID();
    let device = user.devices.find(device => device.id === deviceId);
    if (!device && user.plan === 'family' && user.devices.length >= 3) fail(409,'Familiar permite 3 dispositivos registrados. Quita uno desde un dispositivo autorizado.','device-limit');
    if (!device) { device = {id:deviceId,name:clean(context.deviceName,80)||'Navegador local',registeredAt:stamp(),lastSeenAt:stamp()}; user.devices.push(device); }
    device.lastSeenAt=stamp();
    const token = randomBytes(32).toString('hex');
    sessions.set(token, { uid: user.uid, deviceId, expires: now().getTime() + 8 * 3600000 });
    return { token, user: publicUser(user) };
  }
  function currentSubscription(uid) { return [...subscriptions].reverse().find(sub => sub.uid === uid); }
  function subscription(user, plan, renewal = false, period = 'month') {
    const prior = currentSubscription(user.uid);
    if (prior?.status === 'active') { prior.status = renewal ? 'renewed' : 'canceled'; prior.canceledAt = renewal ? null : stamp(); }
    for(const [id,lease] of leases) if(lease.uid===user.uid) leases.delete(id);
    user.plan = plan;user.period=plan==='free'?'month':period;
    if (PAID_PLANS.has(plan)) {
      const renewal = new Date(now()); const day = renewal.getUTCDate(); renewal.setUTCDate(1); renewal.setUTCMonth(renewal.getUTCMonth() + (period==='year'?12:1)); const last = new Date(Date.UTC(renewal.getUTCFullYear(),renewal.getUTCMonth()+1,0)).getUTCDate(); renewal.setUTCDate(Math.min(day,last));
      const price=quote(user.country,plan,period);
      const sub = { id: randomUUID(), uid: user.uid, plan,period,country:user.country,language:user.language,currency:price.currency,amountCents:price.amountCents, status: 'active', startedAt: stamp(), renewalAt: renewal.toISOString(), canceledAt: null };
      subscriptions.push(sub);
      payments.push({ id: randomUUID(), uid: user.uid, subscriptionId: sub.id, period,country:user.country,language:user.language,amountCents: price.amountCents, currency: price.currency, status: 'paid', date: stamp(), simulated: true });
    }
  }
  // Fixtures exclusivos de desarrollo: nunca proceden de Firebase.
  for (let i = 1; i <= 6; i++) {
    const registeredAt = new Date(now().getTime() - i * 86400000).toISOString();
    const user = addUser('cliente-' + i + '@example.test', randomBytes(24).toString('hex'), 'Cliente de prueba ' + i, 'user', registeredAt);
    if (region === 'CA' && i <= 3) subscription(user, 'premium');
    if (region === 'CA' && i === 3) {
      subscription(user, 'free');
      payments.push({ id: randomUUID(), uid: user.uid, amountCents: 699, currency: 'CAD', status: 'refunded', date: stamp(), simulated: true });
    }
  }
  for (const type of ['movie', 'series']) for (let number = 1; number <= 4; number++) {
    const title = (type === 'movie' ? 'Movie ' : 'Series ') + number;
    content.set(type + '-' + number, { id: type + '-' + number, favoriteKey: title, title, type, description: 'Video de flores de demostración. No es una película o episodio comercial.', category: 'Demostración', palette: (number - 1 + (type === 'series' ? 4 : 0)), access: 'free', freeFrom: null, freeUntil: null, status: 'published', rights: 'demo-verified', rightsEvidence: DEMO_RIGHTS, video: DEMO_VIDEO, territories:['CA'], freeMaxHeight:number===4?480:null, createdAt: stamp(), updatedAt: stamp(), version: 1 });
  }
  for(const film of openFilms){
    if(!['open-big-buck-bunny-2008','open-sprite-fright-2021'].includes(film.id)||film.video!==null||film.playbackPending!==true)throw new Error('La ficha abierta debe conservar reproducción pendiente y sin URL de vídeo.');
    categories.add(film.category);categoryLabels.set(film.category,film.categoryLabels);
    content.set(film.id,{...copy(film),playbackPending:!variants.some(v=>v.contentId===film.id),verificationStatus:variants.some(v=>v.contentId===film.id)?'APROBADO':'PENDIENTE',rights:'open-verified',status:'published',territories:Object.keys(MARKETS),freeFrom:null,freeUntil:null,freeMaxHeight:null,palette:0,createdAt:stamp(),updatedAt:stamp(),version:1});
  }
  if(region==='CA') payments.push({id:randomUUID(),uid:[...users.values()].find(user=>user.email==='cliente-4@example.test').uid,amountCents:699,currency:'CAD',status:'failed',date:stamp(),simulated:true});
  if(payments[0]) payments[0].date = new Date(now().getTime()-40*86400000).toISOString();
  const isFree = item => item.access === 'free' || (!!item.freeFrom && now().getTime() >= Date.parse(item.freeFrom) && now().getTime() < Date.parse(item.freeUntil));
  const itemVariants = item => variants.filter(v => item.rights==='open-verified' ? v.contentId===item.id : !v.contentId);
  function canPlay(item, user) { return item.territories.includes(region) && (includeDemos||item.rights!=='demo-verified') && item.status === 'published' && ['demo-verified','open-verified'].includes(item.rights) && itemVariants(item).length>0 && !item.playbackPending && (isFree(item) || PAID_PLANS.has(user?.plan)); }
  function publicCatalog(user) {
    return [...content.values()].filter(item => (includeDemos||item.rights!=='demo-verified') && item.status === 'published' && ['demo-verified','open-verified'].includes(item.rights) && item.territories.includes(region)).map(item => {
      const { video, rightsEvidence, ...metadata } = item;
      return { ...copy(metadata),durationSeconds:itemVariants(item).find(v=>v.durationSeconds)?.durationSeconds||null,categoryLabels:copy(categoryLabels.get(item.category)||{es:item.category,en:item.category}), qualities:item.playbackPending?[]:itemVariants(item).filter(v=>v.height<=(PAID_PLANS.has(user?.plan)?1080:item.freeMaxHeight||1080)).map(v=>v.height), canPlay: canPlay(item, user), effectiveAccess: isFree(item) ? 'free' : 'premium' };
    });
  }
  function optionalUser(token) { try { return account(token); } catch { return null; } }
  function requireContent(data, existing) {
    const title = clean(data.title), description = clean(data.description, 2000), category = clean(data.category, 60);
    if (!title || !description || !categories.has(category) || !['movie','series'].includes(data.type) || !['free','premium'].includes(data.access)) fail(400, 'Revisa título, descripción, categoría, tipo y acceso.');
    if (!Number.isInteger(data.palette) || data.palette < 0 || data.palette > 7) fail(400, 'Selecciona una carátula original válida.');
    if (!['draft','published','withdrawn'].includes(data.status)) fail(400, 'Estado de contenido inválido.');
    if (!['pending','demo-verified'].includes(data.rights)) fail(400, 'Derechos no verificados. Solo se permite la demostración autorizada.');
    const video = data.video || DEMO_VIDEO;
    if (video !== DEMO_VIDEO || (data.rights === 'demo-verified' && data.rightsEvidence !== DEMO_RIGHTS)) fail(400, 'Solo se permite el video de demostración con su licencia registrada.');
    if (data.status === 'published' && data.rights !== 'demo-verified') fail(400, 'No se puede publicar contenido con derechos pendientes.');
    let freeFrom = null, freeUntil = null;
    if (data.freeFrom || data.freeUntil) {
      if (!data.freeFrom || !data.freeUntil || !/T.*(?:Z|[+-]\d\d:\d\d)$/.test(data.freeFrom) || !/T.*(?:Z|[+-]\d\d:\d\d)$/.test(data.freeUntil) || !Number.isFinite(Date.parse(data.freeFrom)) || !Number.isFinite(Date.parse(data.freeUntil)) || Date.parse(data.freeUntil) <= Date.parse(data.freeFrom)) fail(400, 'El periodo gratuito requiere inicio y fin válidos, con fin posterior al inicio.');
      freeFrom = new Date(data.freeFrom).toISOString(); freeUntil = new Date(data.freeUntil).toISOString();
    }
    const territories = data.territories ?? existing?.territories ?? ['CA'];
    if(!Array.isArray(territories)||!territories.length||territories.some(code=>!MARKETS[code]))fail(400,'Selecciona territorios con licencia verificada.');
    const freeMaxHeight = Object.hasOwn(data,'freeMaxHeight') ? data.freeMaxHeight : existing?.freeMaxHeight ?? null;
    if(freeMaxHeight!==null && freeMaxHeight!==480)fail(400,'El límite gratuito admitido es 480p.');
    return { territories:[...new Set(territories)],freeMaxHeight, id: existing?.id || randomUUID(), favoriteKey: existing?.favoriteKey || 'content-' + randomUUID(), title, description, category, type: data.type, access: data.access, palette: data.palette, status: data.status, rights: data.rights, rightsEvidence: data.rights === 'demo-verified' ? DEMO_RIGHTS : '', video, freeFrom, freeUntil, createdAt: existing?.createdAt || stamp(), updatedAt: stamp(), version: (existing?.version || 0) + 1 };
  }
  function requirePaid(user){if(!PAID_PLANS.has(user.plan))fail(403,'Mi Lista e historial están disponibles con Premium o Familiar. Tus datos se conservan.','paid-feature');}
  function prune(){for(const [id,lease]of leases)if(lease.expires<=now().getTime())leases.delete(id);}
  function validateLease(token,id,context){
    prune();const lease=leases.get(id);if(!lease)fail(403,'La reproducción caducó o fue detenida.','stream-expired');
    if(lease.uid){const user=account(token);if(user.uid!==lease.uid||sessions.get(token).deviceId!==lease.deviceId||context.deviceId&&context.deviceId!==lease.deviceId)fail(403,'Esta reproducción pertenece a otro dispositivo.');}
    else if(context.deviceId!==lease.deviceId)fail(403,'Dispositivo no autorizado.');
    const item=content.get(lease.contentId),user=optionalUser(token);
    if(!item||!canPlay(item,user)) {leases.delete(id);fail(403,'El contenido ya no está disponible para esta cuenta.');}
    const variant=itemVariants(item).find(v=>v.id===lease.variant);if(!variant||(!PAID_PLANS.has(user?.plan)&&item.freeMaxHeight&&variant.height>item.freeMaxHeight))fail(403,'Calidad no permitida.');
    return lease;
  }
  function saveProgress(lease,data){
    const user=lease.uid?users.get(lease.uid):null;if(!user||!features(user.plan).history)return;
    const duration=Number(data.duration),position=Number(data.position);if(!Number.isFinite(duration)||duration<=0||duration>86400||!Number.isFinite(position)||position<0)return;
    if(!history.has(user.uid))history.set(user.uid,new Map());history.get(user.uid).set(lease.contentId,{contentId:lease.contentId,position:Math.min(position,duration),duration,updatedAt:stamp()});
  }
  const api = {
    register(data,context) {
      const email = clean(data.email, 254).toLowerCase(), name = clean(data.name, 100);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !passwordOk(data.password)) fail(400, 'Correo inválido o contraseña de entre 6 y 256 caracteres.', 'auth/invalid-email');
      if ([...users.values()].some(user => user.email === email)) fail(409, 'Ese correo ya está registrado o reservado.', 'auth/email-already-in-use');
      if (users.size >= 1000) fail(429, 'Límite de cuentas locales alcanzado.');
      const created=addUser(email,data.password,name);if(['en','es'].includes(data.language))created.language=data.language;return newSession(created,context); // Ignorar cualquier rol enviado por el cliente.
    },
    login(data,context) {
      const user = [...users.values()].find(user => user.email === clean(data.email,254).toLowerCase());
      if (!passwordOk(data.password) || !user || !timingSafeEqual(passwordHash(data.password, user.salt), Buffer.from(user.hash,'hex'))) fail(401, 'Correo o contraseña incorrectos.', 'auth/invalid-credential');
      return newSession(user,context);
    },
    logout(token) { for(const [id,lease]of leases)if(lease.token===token)leases.delete(id); sessions.delete(token); return { ok: true }; },
    verifyDevice(token,context){account(token);if(sessions.get(token).deviceId!==context.deviceId)fail(401,'Sesión no válida para este dispositivo.','auth/invalid-credential');return true;},
    me(token) { return publicUser(account(token)); },
    favorites(token) { const user=account(token); requirePaid(user); return [...user.favorites]; },
    favorite(token, data) {
      const user = account(token); requirePaid(user); const item = [...content.values()].find(item => item.favoriteKey === data.title);
      if ((!item || item.status !== 'published' || !['demo-verified','open-verified'].includes(item.rights)) && data.remove !== true) fail(404, 'Título no disponible.');
      if (data.remove === true) user.favorites = user.favorites.filter(key => key !== data.title);
      else if (!user.favorites.includes(item.favoriteKey)) user.favorites.push(item.favoriteKey);
      return [...user.favorites];
    },
    preferences(token,data){const user=account(token);if(!['en','es'].includes(data.language))fail(400,'Idioma no válido.');user.language=data.language;return publicUser(user);},
    profile(token, data) {
      const user = account(token), name = clean(data.name,100);
      if (!name) fail(400,'Introduce un nombre de entre 1 y 100 caracteres.');
      user.name = name; return publicUser(user);
    },
    choosePlan(token, data) {
      const user = account(token);
      if (!['free','premium','family'].includes(data.plan)) fail(400, 'Plan inválido.');
      const country=data.country??user.country,period=data.period??(data.plan==='free'?'month':user.period||'month');
      if (!quote(country,data.plan,period)?.available) fail(409,'País, plan o modalidad no válidos.','quote-invalid');
      if (data.plan==='family' && user.devices.length>3)fail(409,'Quita dispositivos hasta tener como máximo 3 antes de seleccionar Familiar.','device-limit');
      if(!['en','es'].includes(data.language??user.language))fail(400,'Idioma no válido.');
      if(data.language)user.language=data.language;
      if (user.plan !== data.plan || user.period!==period || user.country!==country){user.country=country;if(data.language)user.language=data.language;subscription(user,data.plan,false,period);}
      return publicUser(user);
    },
    catalog(token) { return publicCatalog(optionalUser(token)); },
    configuration() { return {region,markets:copy(MARKETS),plans:{free:features('free'),premium:features('premium'),family:features('family')},payments:{mode:'simulation',providers:['simulation']}}; },
    playback(token,data,context={}) {
      const item=content.get(data.id),user=optionalUser(token);
      if(data.uid!==undefined&&data.uid!==user?.uid)fail(409,'La sesión cambió en otra pestaña.','session-changed');
      if(item?.playbackPending)fail(409,'Reproducción pendiente de configurar. No hay una URL oficial reproducible verificada.','playback-pending');
      if(!item||item.status!=='published'||!['demo-verified','open-verified'].includes(item.rights)||!item.territories.includes(region))fail(404,'Contenido no disponible en este territorio.');
      if(!canPlay(item,user))fail(403,'Este título requiere Premium o Familiar.','premium-required');
      prune();
      const maxHeight=PAID_PLANS.has(user?.plan)?1080:item.freeMaxHeight||1080;
      const available=itemVariants(item).filter(variant=>variant.height<=maxHeight);
      const variant=data.height?available.find(v=>v.height===Number(data.height)):available.sort((a,b)=>b.height-a.height)[0];
      if(!variant)fail(403,'No hay un archivo disponible en una calidad permitida por tu plan.','quality-unavailable');
      const deviceId=user?sessions.get(token).deviceId:context.deviceId;
      if(!deviceId)fail(400,'Falta identificar el dispositivo de reproducción.');
      const playbackId=clean(data.playbackId,100)||randomUUID();
      let lease=[...leases.values()].find(lease=>lease.uid===(user?.uid||null)&&lease.deviceId===deviceId&&lease.playbackId===playbackId);
      if(features(user?.plan).maxStreams!==null&&(!lease||lease.paused)&&[...leases.values()].filter(other=>other.uid===user.uid&&!other.paused&&other.id!==lease?.id).length>=features(user.plan).maxStreams)fail(409,'Ya hay 2 reproducciones activas en tu plan. Pausa una o espera a que termine.','stream-limit');
      lease={id:lease?.id||randomUUID(),uid:user?.uid||null,token:user?token:null,deviceId,playbackId,contentId:item.id,variant:variant.id,paused:false,expires:now().getTime()+65000};leases.set(lease.id,lease);
      const saved=user&&features(user.plan).history?history.get(user.uid)?.get(item.id):null;
      return {leaseId:lease.id,video:'/api/media/'+lease.id,quality:variant.height,mime:variant.mime,qualities:available.map(v=>v.height).sort((a,b)=>a-b),resumePosition:saved&&saved.position<saved.duration-Math.min(5,saved.duration*.05)?saved.position:0,access:isFree(item)?'free':'premium',simulated:true};
    },
    stream(token,data,context={}) {
      const lease=validateLease(token,data.leaseId,context);
      if(data.stop){saveProgress(lease,data);leases.delete(lease.id);return {ok:true};}
      if(data.paused===false&&lease.paused&&lease.uid){const user=account(token);const max=features(user.plan).maxStreams;if(max!==null&&[...leases.values()].filter(other=>other.uid===user.uid&&!other.paused&&other.id!==lease.id).length>=max)fail(409,'Ya hay 2 reproducciones activas en tu plan. Pausa una o espera a que termine.','stream-limit');}
      if(typeof data.paused==='boolean')lease.paused=data.paused;
      lease.expires=now().getTime()+(lease.paused?1800000:65000);saveProgress(lease,data);return {ok:true,expiresAt:new Date(lease.expires).toISOString()};
    },
    media(token,id,context={}) {const lease=validateLease(token,id,context);return variants.find(v=>v.id===lease.variant);},
    history(token) {const user=account(token);requirePaid(user);return [...(history.get(user.uid)?.values()||[])].filter(row=>content.get(row.contentId)?.territories.includes(region)).map(row=>({...copy(row),title:content.get(row.contentId)?.title||'Contenido no disponible'})).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));},
    devices(token) {const user=account(token);prune();return {uid:user.uid,currentDeviceId:sessions.get(token).deviceId,limit:features(user.plan).maxDevices,streamLimit:features(user.plan).maxStreams,devices:user.devices.map(device=>({...copy(device),activeStreams:[...leases.values()].filter(lease=>lease.uid===user.uid&&lease.deviceId===device.id&&!lease.paused).length}))};},
    removeDevice(token,data) {const user=account(token);if(!user.devices.some(d=>d.id===data.id))fail(404,'Dispositivo no encontrado.');user.devices=user.devices.filter(d=>d.id!==data.id);for(const [key,session]of sessions)if(session.uid===user.uid&&session.deviceId===data.id)sessions.delete(key);for(const [key,lease]of leases)if(lease.uid===user.uid&&lease.deviceId===data.id)leases.delete(key);return {ok:true};},
    renew(token) {const user=account(token);requirePaid(user);const sub=currentSubscription(user.uid);if(!sub||sub.status!=='active'||Date.parse(sub.renewalAt)>now().getTime())fail(409,'La renovación aún no corresponde.');subscription(user,user.plan,true,user.period||'month');return publicUser(user);},
    adminSnapshot(token) {
      account(token,true);
      const clients = [...users.values()].filter(user => user.role !== 'admin').map(user => ({ ...publicUser(user), subscription: copy(currentSubscription(user.uid) || null), payments: copy(payments.filter(payment => payment.uid === user.uid)) }));
      const signed = payment => payment.status === 'paid' ? payment.amountCents : payment.status === 'refunded' ? -payment.amountCents : 0;
      const month = stamp().slice(0,7);
      const revenueByCurrency=Object.fromEntries(['CAD','USD','EUR'].map(currency=>[currency,{monthlyRevenueCents:payments.filter(p=>p.currency===currency&&p.date.startsWith(month)).reduce((sum,p)=>sum+signed(p),0),totalRevenueCents:payments.filter(p=>p.currency===currency).reduce((sum,p)=>sum+signed(p),0)}]));
      return { simulated: true, currency: 'CAD',revenueByCurrency, generatedAt: stamp(), metrics: { users: clients.length, premium: clients.filter(user => user.plan === 'premium').length, family: clients.filter(user => user.plan === 'family').length, free: clients.filter(user => user.plan === 'free').length, monthlyRevenueCents: payments.filter(payment => payment.currency==='CAD'&&payment.date.startsWith(month)).reduce((sum,payment) => sum + signed(payment),0), totalRevenueCents: payments.filter(payment=>payment.currency==='CAD').reduce((sum,payment) => sum + signed(payment),0), active: subscriptions.filter(sub => sub.status === 'active').length, canceled: subscriptions.filter(sub => sub.status === 'canceled').length }, clients, payments: copy(payments), subscriptions: copy(subscriptions), catalog: copy([...content.values()]), categories: [...categories],categoryLabels:Object.fromEntries(categoryLabels),markets:copy(MARKETS) };
    },
    saveContent(token, data) {
      account(token,true); const existing = data.id ? content.get(data.id) : null;
      if (data.id && !existing) fail(404,'Contenido no encontrado.');
      if (existing && data.version !== existing.version) fail(409,'El contenido cambió en otra ventana. Recarga antes de guardar.');
      const item = requireContent(data,existing); content.set(item.id,item); return copy(item);
    },
    category(token, data) {
      account(token,true); const name = clean(data.name,60);
      if (!name) fail(400,'Categoría inválida.');
      if (data.remove) {
        if ([...content.values()].some(item => item.category === name)) fail(409,'La categoría tiene contenido. Reasígnalo antes de quitarla.');
        categories.delete(name);categoryLabels.delete(name);
      } else {const english= data.englishName===undefined?(categoryLabels.get(name)?.en||name):clean(data.englishName,60);if(!english)fail(400,'Introduce una traducción inglesa de entre 1 y 60 caracteres.');categories.add(name);categoryLabels.set(name,{es:name,en:english});}
      return [...categories];
    }
  };
  return api;
}
