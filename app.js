const uiText = value => globalThis.CinevoI18n?.translate(value) ?? value;
const $ = (id) => document.getElementById(id);
const demoVideo = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
const openFilms = JSON.parse($('openFilmsCatalog')?.textContent || '[]');
const withOpenFilms = items => [...items, ...openFilms.filter(film => !items.some(item => item.id === film.id))];
let catalog = ['movie', 'series'].flatMap(type => [1, 2, 3, 4].map(number => ({
  id: type + '-' + number, type, title: (type === 'movie' ? 'Movie ' : 'Series ') + number, video: demoVideo
})));
catalog = withOpenFilms(catalog);
if(document.body.dataset.catalogMode==='real')catalog=[...openFilms];
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
let filter = 'all';
let backend;
let user = null;
let session = 0;
let favorites = [];
let favoritesReady = false;
let unsubscribe = () => {};
let previousFocus;
let playback = 0;
let selectedItem = null;
let catalogUnsubscribe = () => {};
let lastCatalogJSON = '';
let planBusy = false;
let billingPeriod='month';
let currentLease = null;
let stopOperation=Promise.resolve();
let startingPlayback = false;
let suppressPause = false;
const playbackInstance = crypto.randomUUID();
const paidAccess = () => user?.features ? user.features.favorites : user?.plan ? ['premium','family'].includes(user.plan) : true;
const pending = new Set();
const cards = new Map();

// Las elecciones de plan son estado de demostración, nunca derechos de acceso reales.
const planChoices = new Map();
function renderFavorites(message) {
  const container = $('favoritos');
  if (user && !paidAccess()) {
    container.replaceChildren(); const label=document.createElement('span');label.textContent='Mi Lista está disponible con Premium y Familiar. Tus favoritos se conservan.';const upgrade=document.createElement('a');upgrade.href='#suscripciones';upgrade.className='button-outline upsell-button';upgrade.textContent='Ver planes';container.append(label,upgrade);$('favoriteCount').textContent='—';
    for(const card of cards.values()){const button=card.querySelector('button');button.disabled=false;button.textContent='Ver Premium';button.setAttribute('aria-pressed','false');}
    return;
  }
  container.replaceChildren();
  $('favoriteCount').textContent = String(favorites.length);
  if (message || !user || !favorites.length) container.textContent = message ?? (user ? 'Tu próxima historia favorita empieza en el catálogo.' : 'Inicia sesión para crear una lista que sea solo tuya.');
  else for (const title of favorites) {
    const chip = document.createElement('div'); chip.className = 'favorite-chip';
    const displayTitle = catalog.find(item => (item.favoriteKey || item.title) === title)?.title || (title.startsWith('content-') ? 'Contenido no disponible' : title);
    const text = document.createElement('span'); text.className = 'favorite-title'; text.textContent = displayTitle;
    const remove = document.createElement('button'); remove.type = 'button';
    remove.className = 'remove-favorite'; remove.setAttribute('aria-label', 'Quitar ' + displayTitle + ' de Mi Lista');
    remove.title = 'Quitar de Mi Lista';
    remove.disabled = pending.has(title) || !favoritesReady || !backend?.removeFavorite;
    remove.addEventListener('click', () => changeFavorite(title, true));
    chip.append(text, remove); container.append(chip);
  }
  for (const item of catalog) {
    const button = cards.get(item.id).querySelector('button');
    const key = item.favoriteKey || item.title;
    const saved = favorites.includes(key);
    button.textContent = saved ? '✓ Guardado · Quitar' : '+ Guardar';
    button.setAttribute('aria-pressed', String(saved));
    button.setAttribute('aria-label', (saved ? 'Quitar ' : 'Guardar ') + item.title + (saved ? ' de' : ' en') + ' Mi Lista');
    button.disabled = pending.has(key) || (!!user && !favoritesReady) || (saved && !backend?.removeFavorite);
  }
}
async function changeFavorite(title, remove = false) {
  if (!backend) { $('favoritos').textContent = 'La conexión con Firebase no está disponible.'; return; }
  if (!user) { $('favoritos').textContent = 'Inicia sesión para guardar tus favoritos.'; openPanel('loginPanel'); return; }
  if (!paidAccess()) { $('planStatus').textContent='Mi Lista requiere Premium o Familiar. Tus favoritos se conservan.';document.getElementById('suscripciones').scrollIntoView({block:'start'});return; }
  if (!favoritesReady || pending.has(title) || (!remove && favorites.includes(title))) return;
  if (remove && !backend.removeFavorite) { renderFavorites('Quitar favoritos no está disponible en este entorno.'); return; }
  const currentSession = session;
  const uid = user.uid;
  pending.add(title); renderFavorites();
  let errorMessage;
  try {
    await (remove ? backend.removeFavorite(uid, title) : backend.saveFavorite(uid, title));
    if (session !== currentSession) return;
    favorites = remove ? favorites.filter(value => value !== title) : [...new Set([...favorites, title])];
  } catch {
    if (session === currentSession) errorMessage = remove ? 'No se pudo quitar el favorito. Inténtalo de nuevo.' : 'No se pudo guardar el favorito. Inténtalo de nuevo.';
  } finally {
    if (session === currentSession) { pending.delete(title); renderFavorites(errorMessage); }
  }
}
function saveFavorite(item) { return changeFavorite(item.favoriteKey || item.title); }
const palettes = [
 ['#294651','#10262d','#e6c48a','#55716a'], ['#633e48','#271d32','#dba582','#754b63'],
 ['#55482d','#231f1a','#e5d6a2','#7d704d'], ['#353e63','#161e32','#b8bdde','#565779'],
 ['#4c5862','#172b35','#d2d5c4','#7d8c88'], ['#704b3b','#302126','#e1ba87','#9b7051'],
 ['#46624d','#172d28','#c4d2a6','#68805c'], ['#4f4765','#262133','#c5afc2','#70687e']
];
function renderCatalog() {
for (const selector of ['#peliculas .catalog','#series .catalog']) document.querySelector(selector).replaceChildren();
cards.clear();
for (const [index, item] of catalog.entries()) {
  const card = document.createElement('div'); card.className = 'card'; card.dataset.title = item.title; card.dataset.contentId=item.id; card.tabIndex = 0;
  card.setAttribute('aria-label', 'Ver detalles de ' + item.title);
  const poster = document.createElement('div'); poster.className = 'poster'; poster.setAttribute('aria-hidden', 'true');
  ['--sky','--earth','--glow','--hill'].forEach((key, color) => poster.style.setProperty(key, palettes[item.palette ?? index % palettes.length][color]));
  const number = document.createElement('span'); number.className = 'poster-number'; number.textContent = 'C / ' + String(index + 1).padStart(2,'0');
  const mark = document.createElement('span'); mark.className = 'poster-mark'; mark.textContent = item.title;
  if(item.poster){const image=document.createElement('img');image.src=item.poster;image.alt='';image.loading='lazy';image.className='official-poster';poster.append(image);poster.classList.add('has-official-poster');}
  const badge = document.createElement('span'); badge.className = 'poster-label'; badge.textContent = item.attribution ? (item.playbackPending?uiText('PENDIENTE'):uiText('Gratis')) : item.effectiveAccess === 'premium' ? 'PREMIUM' : 'DEMO';
  const play = document.createElement('span'); play.className = 'play-mark'; play.textContent = item.playbackPending?'ℹ':'▶'; poster.append(number, mark, badge, play);
  const info = document.createElement('div'); info.className = 'card-info';
  const text = document.createElement('div'); text.className = 'card-text';
  const title = document.createElement('span'); title.className = 'card-title'; title.textContent = item.title;
  const meta = document.createElement('span'); meta.className = 'card-meta'; meta.dataset.i18n='off'; meta.textContent = uiText(item.type === 'movie' ? 'Película' : 'Serie') + (item.year ? ' · '+item.year : '') + ' · ' + categoryLabel(item.category || 'Demostración'); text.append(title, meta);
  const button = document.createElement('button'); button.type = 'button'; button.className = 'favorite-button';
  button.addEventListener('click', event => { event.stopPropagation(); const key = item.favoriteKey || item.title; changeFavorite(key, favorites.includes(key)); });
  info.append(text, button); card.append(poster, info);
  card.addEventListener('click', () => openDetails(item));
  card.addEventListener('keydown', event => {
    if (event.target === card && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); openDetails(item); }
  });
  document.querySelector(item.type === 'movie' ? '#peliculas .catalog' : '#series .catalog').append(card); cards.set(item.id, card);
}
if(!catalog.some(item=>item.type==='series'))document.querySelector('#series .catalog').textContent=uiText('Las series están en revisión de derechos y reproducción.');
$('heroPlay').disabled=!catalog.some(item=>!item.playbackPending&&item.canPlay!==false);
}
renderCatalog();
renderCategoryOptions();
$('heroPlay').addEventListener('click', () => { const item = catalog.find(item => item.canPlay !== false) || catalog[0]; if (!item) { $('conexionEstado').textContent = 'No hay contenido disponible.'; return; } openDetails(item); $('playMovie').click(); });

function search() {
  const text = normalize(document.querySelector('.search').value);
  let count = 0;
  for (const item of catalog) {
    const visible = (filter === 'all' || filter === item.type) && (!$('categoryFilter') || $('categoryFilter').value === 'all' || (item.category || 'Demostración') === $('categoryFilter').value) && normalize(item.title).includes(text);
    cards.get(item.id).style.display = visible ? '' : 'none';
    if (visible) count++;
  }
  $('peliculas').style.display = filter === 'series' ? 'none' : 'block';
  $('series').style.display = filter === 'movie' ? 'none' : 'block';
  $('searchStatus').textContent = count ? (text ? count + ' resultado(s).' : '') : 'No se encontraron títulos.';
  document.querySelectorAll('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
}
document.querySelector('.search').addEventListener('input', search);
$('categoryFilter')?.addEventListener('change', search);
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => { filter = button.dataset.filter; search(); }));

function openDetails(item) {
  if($('qualitySelect')){$('qualitySelect').replaceChildren();const automatic=document.createElement('option');automatic.value='';automatic.textContent='Automática';$('qualitySelect').append(automatic);}
  stopLease();
  selectedItem = item;
  previousFocus = document.activeElement;
  playback++;
  $('moviePlayer').pause();
  if (!backend?.getPlayback && !item.playbackPending) $('videoSource').src = item.video;
  else $('videoSource').removeAttribute('src');
  $('moviePlayer').load();
  $('detailsTitle').textContent = item.title;
  if($('qualitySelect'))$('qualitySelect').closest('label').hidden=(item.qualities?.length||0)<=1;
  document.querySelector('.details-heading .eyebrow').textContent=item.attribution?'VIXUNO / CREATIVE COMMONS':'VIXUNO / DEMOSTRACIÓN';
  $('detailsType').textContent = item.year ? item.year+' · '+categoryLabel(item.category)+' · '+uiText('Gratis') : item.type === 'series' ? 'Tipo: Series' : 'Tipo: Movie';
  let attribution=$('filmAttribution');if(!attribution){attribution=document.createElement('div');attribution.id='filmAttribution';attribution.className='film-attribution';$('detailsDescription').after(attribution);}attribution.replaceChildren();
  if(item.attribution){const credit=document.createElement('p');credit.textContent=item.attribution;attribution.append(credit);for(const [label,url]of [['Fuente oficial',item.source],[item.license,item.licenseUrl],['Licencia del póster: '+item.posterLicense,item.posterLicenseUrl],['Créditos completos',item.creditsUrl]]){const a=document.createElement('a');a.textContent=label;a.href=url;a.target='_blank';a.rel='noopener noreferrer';attribution.append(a);}const note=document.createElement('p');note.textContent=item.playbackPending?uiText('Póster sin modificar, ajustado al espacio de la tarjeta. Reproducción pendiente de configurar; se conservarán los créditos finales íntegros.'):uiText('Película completa con créditos originales. Póster sin modificar y licencia indicada por recurso.');attribution.append(note);}
  $('playMovie').textContent=item.playbackPending?uiText('▶ Reproducir · Pendiente de configurar'):uiText('▶ Reproducir');
  const playerNote=document.querySelector('#details .player-note:last-child');if(playerNote)playerNote.textContent=item.attribution&&!item.playbackPending?uiText('Película completa autorizada. Se conservan los créditos finales y la pista de audio original.'):item.playbackPending?uiText('Película gratuita con atribución. Archivo de reproducción pendiente de verificar y configurar.'):'Video de demostración existente. No es una película o episodio comercial.';
  if(item.durationSeconds)$('detailsType').textContent+=' · '+Math.floor(item.durationSeconds/60)+':'+String(Math.floor(item.durationSeconds%60)).padStart(2,'0');
  $('detailsDescription').textContent = translatedDescription(item);$('detailsDescription').dataset.i18n='off';
  $('playerStatus').textContent = '';
  $('details').style.display = 'flex';
  $('playerBox').style.display = 'none';
  document.body.classList.add('modal-open');
  setBackgroundInert(true);
  $('closeDetails').focus();
}
function closeDetails() {
  stopLease();
  playback++;
  $('moviePlayer').pause();
  $('details').style.display = 'none';
  document.body.classList.remove('modal-open');
  setBackgroundInert(false);
  previousFocus?.focus();
  selectedItem = null;
}
$('closeDetails').addEventListener('click', closeDetails);
$('details').addEventListener('keydown', event => {
  if (event.key === 'Escape') closeDetails();
  if (event.key === 'Tab') {
    const first = $('closeDetails');
    const last = $('playerBox').style.display === 'none' ? $('playMovie') : $('moviePlayer');
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
function progressData(){return {position:$('moviePlayer').currentTime,duration:$('moviePlayer').duration};}
function stopLease(){const lease=currentLease;currentLease=null;if(lease&&backend?.stream)stopOperation=backend.stream(lease.leaseId,{...progressData(),stop:true}).catch(()=>{});return stopOperation;}
async function beginPlayback(){
  if(selectedItem?.playbackPending){$('playerStatus').textContent=uiText('Reproducción pendiente de configurar. No hay una URL oficial reproducible verificada.');$('playerBox').style.display='none';return;}
  if(startingPlayback||!selectedItem)return;startingPlayback=true;
  const currentPlayback=playback,position=$('moviePlayer').currentTime;
  $('playerBox').style.display='block';$('playerStatus').textContent='';
  try{
    await stopOperation;
    if(backend?.getPlayback){
      const result=await backend.getPlayback(selectedItem.id,{playbackId:playbackInstance,height:$('qualitySelect')?.value||undefined});
      if(currentPlayback!==playback){if(result.leaseId)backend.stream(result.leaseId,{stop:true}).catch(()=>{});return;}
      currentLease=result.leaseId?result:null;
      suppressPause=true;$('videoSource').src=result.video;$('videoSource').type=result.mime||'video/mp4';$('moviePlayer').load();
      if($('qualitySelect')&&result.qualities){const selected=String(result.quality);$('qualitySelect').replaceChildren();for(const height of result.qualities){const option=document.createElement('option');option.value=height;option.textContent=height+'p';$('qualitySelect').append(option);}$('qualitySelect').value=selected;$('qualityInfo').textContent='Archivo real: '+selected+'p. Hasta 1080p solo cuando exista esa variante.';}
      const resume=position>0?position:result.resumePosition||0;if(resume)$('moviePlayer').addEventListener('loadedmetadata',()=>{if(currentPlayback===playback)$('moviePlayer').currentTime=resume;},{once:true});
    }
    await $('moviePlayer').play();
  }catch(error){stopLease();if(currentPlayback===playback)$('playerStatus').textContent=error.code==='premium-required'?'Este título requiere Premium o Familiar. Puedes seleccionarlo en Planes, sin cobros.':error.status?error.message:'No se pudo reproducir el video. Comprueba tu conexión y vuelve a intentarlo.';}
  finally{startingPlayback=false;setTimeout(()=>{suppressPause=false;},0);}
}
$('playMovie').addEventListener('click',beginPlayback);
function syncPlaybackState(paused){const lease=currentLease;if(!lease||!backend?.stream)return;stopOperation=stopOperation.catch(()=>{}).then(async()=>{if(currentLease?.leaseId!==lease.leaseId)return;await backend.stream(lease.leaseId,{...progressData(),paused});}).catch(error=>{if(currentLease?.leaseId===lease.leaseId){currentLease=null;$('moviePlayer').pause();$('playerStatus').textContent=error.message;}});}
$('moviePlayer').addEventListener('pause',()=>{if(!suppressPause){syncPlaybackState(true);refreshHistory();}});
$('moviePlayer').addEventListener('ended',async()=>{await stopLease();refreshHistory();});
$('moviePlayer').addEventListener('play',()=>{if(currentLease)syncPlaybackState(false);if(backend?.stream&&!currentLease&&!startingPlayback){suppressPause=true;$('moviePlayer').pause();beginPlayback();}});
$('qualitySelect')?.addEventListener('change',async()=>{await stopLease();beginPlayback();});
const playbackHeartbeat=setInterval(async()=>{if(!currentLease)return;try{await backend.stream(currentLease.leaseId,{...progressData(),paused:$('moviePlayer').paused});}catch(error){currentLease=null;$('moviePlayer').pause();$('playerStatus').textContent=error.message;}},20000);

function mediaError() {
  if ($('details').style.display === 'flex') $('playerStatus').textContent = 'No se pudo cargar el video. Comprueba tu conexión y vuelve a intentarlo.';
}
$('moviePlayer').addEventListener('error', mediaError);
$('videoSource').addEventListener('error', mediaError);

let authFocus;
let authBusy = false;
function setBackgroundInert(value) {
  document.querySelector('main').inert = value;
  document.querySelector('header').inert = value;
  document.querySelector('footer').inert = value;
}
function resetPasswordVisibility() {
  document.querySelectorAll('[data-password]').forEach(button => {
    $(button.dataset.password).type = 'password'; button.textContent = 'Mostrar'; button.setAttribute('aria-pressed', 'false'); button.setAttribute('aria-label', 'Mostrar contraseña');
  });
}
function closeAuth() {
  for (const panel of [$('loginPanel'), $('registerPanel')]) { panel.style.display = 'none'; panel.querySelector('input[type=password]')?.setAttribute('type', 'password'); }
  for (const id of ['loginPassword','registroPassword']) $(id).value = '';
  resetPasswordVisibility(); document.body.classList.remove('modal-open'); setBackgroundInert(false);
  if (authFocus?.isConnected && authFocus.getClientRects().length) authFocus.focus();
  else (user ? $('accountLink') : document.querySelector('[data-open=loginPanel]'))?.focus();
}
function openPanel(id) {
  if (authBusy) return;
  if (!document.activeElement?.closest('.auth-panel')) authFocus = document.activeElement;
  for (const panel of [$('loginPanel'), $('registerPanel')]) { panel.style.display = panel.id === id ? 'block' : 'none'; panel.querySelector('.auth-message').textContent = ''; }
  for (const input of [$('loginPassword'),$('registroPassword')]) input.value = '';
  resetPasswordVisibility(); document.body.classList.add('modal-open'); setBackgroundInert(true);
  $(id).querySelector('input').focus();
}
document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => openPanel(button.dataset.open)));
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', closeAuth));
document.querySelectorAll('[data-password]').forEach(button => button.addEventListener('click', () => {
  const input = $(button.dataset.password); const visible = input.type === 'password';
  input.type = visible ? 'text' : 'password'; button.textContent = visible ? 'Ocultar' : 'Mostrar';
  button.setAttribute('aria-pressed', String(visible)); button.setAttribute('aria-label', visible ? 'Ocultar contraseña' : 'Mostrar contraseña');
}));
for (const panel of [$('loginPanel'), $('registerPanel')]) panel.addEventListener('keydown', event => {
  if (event.key === 'Escape') { event.preventDefault(); closeAuth(); }
  if (event.key === 'Tab') {
    const controls = [...panel.querySelectorAll('button:not(:disabled), input')];
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});

function renderAccount() {
  const name = user?.displayName?.trim() || uiText('Mi perfil');
  $('profileHeading').textContent = name;
  const initials = user ? (user.displayName || user.email || 'C').trim().slice(0,2).toUpperCase() : 'C';
  $('profileAvatar').textContent = initials; $('headerAvatar').textContent = initials;
  $('accountLink').hidden = !user; $('profileLogin').hidden = !!user;
  $('profileForm').style.display = user ? 'grid' : 'none';
  $('profileName').value = user?.displayName || '';
  $('profileForm').querySelector('[type=submit]').disabled = !backend?.updateUserProfile;
  $('profileStatus').textContent = user && !backend?.updateUserProfile ? 'La edición del perfil no está disponible en este entorno.' : '';
  if ($('adminLink')) $('adminLink').hidden = user?.role !== 'admin';
  renderPlans();
}
function renderPlans(message) {
  const plan = user ? user.plan || planChoices.get(user.uid) || 'free' : null;
  const planName = ({premium:'Premium',family:'Familiar',free:'Gratis'})[plan]||'Gratis';
  if ($('adSlot')) $('adSlot').hidden = ['premium','family'].includes(plan);
  $('profilePlan').textContent = user ? uiText(planName) + ' · '+uiText(user.period==='year'?'Anual':'Mensual')+' · '+uiText('simulación') : 'Sin sesión';
  if($('profileSubscription')){const sub=user?.plan!=='free'?user?.subscription:null;$('profileSubscription').textContent=sub?uiText('Suscripción simulada')+': '+(sub.amountCents/100).toFixed(2)+' '+sub.currency+' / '+uiText(sub.period==='year'?'año':'mes')+' · '+uiText('Renovación simulada')+': '+new Intl.DateTimeFormat(globalThis.CinevoI18n?.getLanguage()||'es',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(sub.renewalAt))+' UTC':'';}
  $('planStatus').textContent = message || (user ? 'Plan ' + planName + ' seleccionado en simulación. No se realizará ningún cobro.' : 'Inicia sesión para probar un plan.');
  document.querySelectorAll('[data-plan]').forEach(button => {
    const selected = button.dataset.plan === plan && (plan==='free'||((user?.period||'month')===billingPeriod&&(!user?.country||user.country===($('pricingCountry')?.value||'CA'))));
    button.setAttribute('aria-pressed', String(selected));
    button.closest('.plan-card').classList.toggle('selected', selected);
    button.textContent = selected ? '✓ Seleccionado · simulación' : 'Probar ' + ({premium:'Premium',family:'Familiar',free:'Gratis'})[button.dataset.plan];
  });
}
document.querySelectorAll('[data-plan]').forEach(button => button.addEventListener('click', async () => {
  if (!user) { renderPlans('Inicia sesión para probar un plan. No hay cobros reales.'); openPanel('loginPanel'); return; }
  if (planBusy) return;
  if (!backend?.selectPlan) { planChoices.set(user.uid, button.dataset.plan); renderPlans(); return; }
  const currentSession = session; planBusy = true;
  document.querySelectorAll('[data-plan]').forEach(control => { control.disabled = true; });
  try {
    await stopLease();
    const updated = await backend.selectPlan(button.dataset.plan,{country:$('pricingCountry')?.value||user.country||'CA',period:button.dataset.plan==='free'?'month':billingPeriod,language:globalThis.CinevoI18n?.getLanguage()||'es'});
    if (session !== currentSession) return;
    user = updated; authChanged(user); renderPlans(); renderFavorites(); refreshHistory(); refreshDevices();
  } catch (error) { if (session === currentSession) renderPlans(error.message || 'No se pudo cambiar el plan. Inténtalo de nuevo.'); }
  finally { if (session === currentSession) { planBusy = false; document.querySelectorAll('[data-plan]').forEach(control => { control.disabled = false; }); } }
}));
let profileBusy = false;
$('profileForm').addEventListener('submit', async event => {
  event.preventDefault();
  if (profileBusy || !user || !backend?.updateUserProfile || !$('profileForm').reportValidity()) return;
  const name = $('profileName').value.trim();
  if (!name || name.length > 100) { $('profileStatus').textContent = 'Introduce un nombre de entre 1 y 100 caracteres.'; return; }
  const currentSession = session, uid = user.uid;
  profileBusy = true;
  const button = $('profileForm').querySelector('[type=submit]'); button.disabled = true;
  $('profileStatus').textContent = 'Guardando…';
  try {
    await backend.updateUserProfile(uid, name);
    if (currentSession !== session) return;
    user = { ...user, displayName: name }; renderAccount(); $('profileStatus').textContent = 'Nombre actualizado.';
  } catch { if (currentSession === session) $('profileStatus').textContent = 'No se pudo actualizar el nombre. Inténtalo de nuevo.'; }
  finally { if (currentSession === session) { profileBusy = false; button.disabled = false; } }
});
const authError = error => ({
  'device-limit': 'Familiar permite hasta 3 dispositivos registrados. Quita uno desde un dispositivo autorizado para poder entrar aquí.',
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'Correo o contraseña incorrectos.',
  'auth/email-already-in-use': 'No se pudo crear la cuenta con ese correo. Intenta iniciar sesión.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/invalid-email': 'Introduce un correo electrónico válido.',
  'auth/too-many-requests': 'Demasiados intentos. Espera y vuelve a intentarlo.',
  'auth/network-request-failed': 'No se pudo conectar. Comprueba tu conexión.'
}[error.code] || 'No se pudo completar la operación. Inténtalo de nuevo.');
for (const kind of ['login', 'register']) {
  const form = $(kind + 'Panel');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (authBusy || !backend || !form.reportValidity()) return;
    // minlength no se aplica a valores autocompletados o asignados por código en todos los navegadores.
    if (kind === 'register' && $('registroPassword').value.length < 6) {
      form.querySelector('.auth-message').textContent = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }
    authBusy = true;
    document.querySelectorAll('.auth-panel [type=submit]').forEach(control => { control.disabled = true; });
    const button = form.querySelector('[type=submit]');
    button.disabled = true;
    const message = form.querySelector('.auth-message');
    message.textContent = 'Procesando…';
    try {
      if (kind === 'login') await backend.login($('loginEmail').value.trim(), $('loginPassword').value);
      else await backend.register($('registroEmail').value.trim(), $('registroPassword').value, $('registroNombre').value.trim());
      form.reset();
      closeAuth();
      message.textContent = '';
    } catch (error) { message.textContent = authError(error); }
    finally { authBusy = false; document.querySelectorAll('.auth-panel [type=submit]').forEach(control => { control.disabled = false; }); }
  });
}
$('cerrarSesion').addEventListener('click', async () => {
  $('cerrarSesion').disabled = true;
  try { await backend.logout(); }
  catch { $('conexionEstado').textContent = 'No se pudo cerrar sesión. Inténtalo de nuevo.'; }
  finally { $('cerrarSesion').disabled = false; }
});

function authChanged(nextUser) {
  session++;
  const currentSession = session;
  unsubscribe();
  unsubscribe = () => {};
  stopLease();
  user = nextUser;
  planBusy = false;
  document.querySelectorAll('[data-plan]').forEach(control => { control.disabled = false; });
  if ($('details').style.display === 'flex') { playback++; $('moviePlayer').pause(); }
  if ($('adSlot')) $('adSlot').hidden = ['premium','family'].includes(user?.plan);
  favorites = [];
  favoritesReady = false;
  pending.clear();
  profileBusy = false;
  resetPasswordVisibility();
  renderAccount();
  $('estadoSesion').textContent = user ? 'Bienvenido a VixunoTV, ' + (user.email || 'usuario') : 'No has iniciado sesión.';
  $('cerrarSesion').hidden = !user;
  document.querySelector('.auth-buttons').style.display = user ? 'none' : 'flex';
  for (const id of ['loginPassword', 'registroPassword']) $(id).value = '';
  if (user && [$('loginPanel'), $('registerPanel')].some(panel => panel.style.display !== 'none')) closeAuth();
  renderFavorites(user ? 'Cargando tu lista…' : undefined);
  refreshHistory();refreshDevices();
  if (!user || !paidAccess()) return;
  unsubscribe = backend.watchFavorites(user.uid, values => {
    if (session !== currentSession) return;
    if (!Array.isArray(values) || values.some(value => typeof value !== 'string')) {
      favorites = []; favoritesReady = false;
      renderFavorites('Tu lista tiene un formato inesperado. No se han modificado tus datos.'); return;
    }
    favorites = [...new Set(values)];
    favoritesReady = true;
    renderFavorites();
  }, () => {
    if (session !== currentSession) return;
    favorites = []; favoritesReady = false;
    renderFavorites('No se pudo cargar tu lista. Comprueba tu conexión y vuelve a iniciar sesión.');
  });
}
renderFavorites();
renderAccount();
search();
try {
  const { createBackend } = await import('./firebase.js');
  backend = createBackend();
  backend.onAuth(authChanged);
  if (backend.watchCatalog) catalogUnsubscribe = backend.watchCatalog(items => {
    const json = JSON.stringify(items); if (json === lastCatalogJSON) return; lastCatalogJSON = json;
    // El servidor conserva autoridad sobre retiradas y disponibilidad del catálogo.
    catalog = items;
    renderCategoryOptions();
    if (selectedItem && (!items.some(item => item.id === selectedItem.id) || items.find(item => item.id === selectedItem.id)?.canPlay === false)) {
      playback++; $('moviePlayer').pause(); $('videoSource').removeAttribute('src'); $('moviePlayer').load();
      $('playerStatus').textContent = 'La disponibilidad de este título ha cambiado. Vuelve a abrirlo desde el catálogo.';
    }
    renderCatalog(); renderFavorites(); search();
  }, () => { $('conexionEstado').textContent = 'No se pudo actualizar el catálogo local.'; });
  document.querySelectorAll('.auth-panel [type=submit]').forEach(button => { button.disabled = false; });
  $('conexionEstado').textContent = '';
} catch {
  $('conexionEstado').textContent = 'Firebase no está disponible. Recarga la página para volver a intentarlo. Puedes seguir explorando el catálogo.';
  $('estadoSesion').textContent = 'No se pudo comprobar la sesión.';
}

window.addEventListener('pagehide', () => { clearInterval(playbackHeartbeat);stopLease(); catalogUnsubscribe(); unsubscribe(); });

async function refreshDevices(){
 const section=$('deviceSection');if(!section)return;section.hidden=!user||!backend?.devices;if(section.hidden)return;
 const current=session;
 try{const state=await backend.devices();if(current!==session)return;$('deviceLimits').textContent=state.limit?'Familiar: hasta 3 dispositivos registrados y 2 reproducciones simultáneas.':state.streamLimit===2?'Premium: hasta 2 reproducciones simultáneas. No hay un límite de dispositivos registrados definido.':'No hay límites individuales definidos para este plan.';$('deviceList').replaceChildren();
 for(const device of state.devices){const row=document.createElement('div');row.className='device-item';const title=document.createElement('strong');title.textContent=device.name;title.dataset.i18n='off';const currentLabel=document.createElement('span');currentLabel.textContent=device.id===state.currentDeviceId?'Actual':'';const info=document.createElement('p');info.textContent=device.activeStreams+' reproducción(es) activa(s)';const remove=document.createElement('button');remove.type='button';remove.className='button-outline';remove.textContent='Quitar dispositivo';remove.addEventListener('click',async()=>{try{await backend.removeDevice(device.id);if(device.id===state.currentDeviceId)await backend.logout();else await refreshDevices();}catch(error){$('deviceStatus').textContent=error.message;}});row.append(title,currentLabel,info,remove);$('deviceList').append(row);}
 $('renewSimulation').hidden=!['premium','family'].includes(user?.plan);
 }catch(error){if(current===session)$('deviceStatus').textContent=error.message;}
}
async function refreshHistory(){
 if(!$('historyList'))return;for(const id of ['historyList','continueList'])$(id).replaceChildren();
 if(!user||!paidAccess()){for(const id of ['historyList','continueList'])$(id).textContent='Disponible con Premium y Familiar. Tus datos anteriores se conservan.';return;}
 if(!backend?.history)return;const current=session;
 try{const rows=await backend.history();if(current!==session)return;
 for(const row of rows){const isContinuing=row.position>0&&row.position<row.duration-Math.min(5,row.duration*.05);for(const id of isContinuing?['historyList','continueList']:['historyList']){const card=document.createElement('article');card.className='history-item';const title=document.createElement('strong');title.textContent=row.title;const info=document.createElement('p');info.textContent=Math.floor(row.position)+' de '+Math.floor(row.duration)+' segundos';const progress=document.createElement('progress');progress.max=row.duration;progress.value=row.position;const play=document.createElement('button');play.className='button-outline';play.textContent=isContinuing?'Continuar':'Ver de nuevo';const item=catalog.find(item=>item.id===row.contentId);play.disabled=!item;play.addEventListener('click',()=>{openDetails(item);beginPlayback();});card.append(title,info,progress,play);$(id).append(card);}}
 for(const id of ['historyList','continueList'])if(!$(id).children.length)$(id).textContent='Todavía no hay reproducciones guardadas.';
 }catch(error){if(current===session)$('historyList').textContent=error.message;}
}
$('refreshDevices')?.addEventListener('click',refreshDevices);
$('renewSimulation')?.addEventListener('click',async()=>{try{await backend.renew();$('deviceStatus').textContent='Renovación simulada registrada.';}catch(error){$('deviceStatus').textContent=error.message;}});
$('pricingCountry')?.addEventListener('change',refreshPrices);
async function refreshPrices(){
 const country=$('pricingCountry')?.value||'CA';
 try{
  const pricing=globalThis.VixunoPricing;if(!pricing?.quote)throw new Error('No se pudo consultar la configuración de precios.');
  for(const button of document.querySelectorAll('[data-plan]')){
   const period=button.dataset.plan==='free'?'month':billingPeriod;const value=pricing.quote(country,button.dataset.plan,period);if(!value)throw new Error('Cotización no válida.');
   const price=button.closest('.plan-card').querySelector('.price');price.replaceChildren(document.createTextNode((value.amountCents/100).toFixed(2)));price.dataset.amountCents=value.amountCents;price.dataset.currency=value.currency;price.dataset.period=period;
   const suffix=document.createElement('span');suffix.textContent=' '+value.currency+' / '+(period==='year'?'año':'mes');price.append(suffix);button.disabled=planBusy;
   const detail=button.closest('.plan-card').querySelector('[data-annual-detail]');if(detail){detail.hidden=period!=='year';detail.textContent=period==='year'?uiText('Un pago anual por adelantado.')+' '+uiText('Ahorro')+': '+(value.savingsCents/100).toFixed(2)+' '+value.currency+' · 16.67 % '+uiText('frente a 12 mensualidades.') : '';}
  }
  $('annualOffer').hidden=billingPeriod!=='year';document.querySelectorAll('[data-period]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.period===billingPeriod)));
  $('pricingNotice').textContent='Precios aprobados por país. El idioma no modifica la moneda. Pagos exclusivamente simulados.';renderPlans();
 }catch(error){$('pricingNotice').textContent=uiText('No se pudo consultar la configuración de precios.');document.querySelectorAll('[data-plan]').forEach(button=>{button.disabled=true;});}
}
document.querySelectorAll('[data-period]').forEach(button=>button.addEventListener('click',()=>{billingPeriod=button.dataset.period;refreshPrices();}));

refreshPrices();

function translatedDescription(item){if(item.descriptionEn&&globalThis.CinevoI18n?.getLanguage()==='en')return item.descriptionEn;const source=item.description||(item.type==='series'?'Descripción de la serie.':'Descripción de la película.');return ['Video de flores de demostración. No es una película o episodio comercial.','Descripción de la serie.','Descripción de la película.'].includes(source)?uiText(source):source;}
document.addEventListener('cinevo:languagechange',()=>{if(!user?.displayName?.trim())$('profileHeading').textContent=uiText('Mi perfil');if(selectedItem){$('detailsDescription').textContent=translatedDescription(selectedItem);if(selectedItem.year)$('detailsType').textContent=selectedItem.year+' · '+categoryLabel(selectedItem.category)+' · '+uiText('Gratis');}});

function categoryLabel(name){const labels=catalog.find(item=>item.category===name)?.categoryLabels;const language=globalThis.CinevoI18n?.getLanguage()||'es';return labels?.[language]||uiText(name);}
function renderCategoryOptions(){if(!$('categoryFilter'))return;const selected=$('categoryFilter').value;$('categoryFilter').replaceChildren();for(const name of ['all',...new Set(catalog.map(item=>item.category||'Demostración'))]){const option=document.createElement('option');option.value=name;option.textContent=name==='all'?uiText('Todas las categorías'):categoryLabel(name);option.dataset.i18n='off';$('categoryFilter').append(option);}$('categoryFilter').value=[...$('categoryFilter').options].some(option=>option.value===selected)?selected:'all';}
document.addEventListener('cinevo:languagechange',()=>{renderCatalog();renderCategoryOptions();renderFavorites();search();});

document.addEventListener('cinevo:languagechange',()=>{refreshPrices();if(user&&backend?.setLanguage){const current=session;backend.setLanguage(globalThis.CinevoI18n.getLanguage()).then(updated=>{if(current===session)user=updated;}).catch(()=>{});}});
