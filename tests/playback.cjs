// Run: node tests/playback.cjs. DOM/media doubles; no network or account writes.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(require('node:path').join(__dirname, '../index.html'), 'utf8');
function element() { return {style:{}, dataset:{}, attrs:{}, listeners:{}, textContent:'', disabled:false, addEventListener(k,f){this.listeners[k]=f}, getAttribute(k){return this.attrs[k] ?? null}, removeAttribute(k){delete this.attrs[k]}, set src(v){this.attrs.src=v}, load(){}, pause(){this.paused=true}, play(){return this.failure ? Promise.reject(this.failure) : Promise.resolve()}, focus(){this.focused=true}}; }
const ids = Object.fromEntries(['moviePlayer','videoSource','playButton','playbackStatus','details','detailsTitle','detailsType','detailsDescription','playerBox'].map(id=>[id,element()]));
const cards = ['Movie','Series'].flatMap(type=>[1,2,3,4].map(n=>Object.assign(element(), {dataset:{title:`${type} ${n}`},textContent:`${type} ${n}❤️ Guardar`,closest(){return {id:type==='Series'?'series':'peliculas'}}})));
const document={getElementById:id=>ids[id],querySelectorAll:()=>cards,addEventListener(){}};
const context=vm.createContext({document});
const script=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('let selectedCard'));
vm.runInContext(script,context);
(async()=>{
for(const card of cards){card.listeners.click();assert.equal(ids.detailsTitle.textContent,card.dataset.title);assert.match(ids.videoSource.src || ids.videoSource.getAttribute('src'),/flower.mp4$/);assert.equal(ids.playButton.disabled,false);assert.equal(ids.details.style.display,'flex');await vm.runInContext('playMovie()',context);assert.match(ids.playbackStatus.textContent,/Reproduciendo/);vm.runInContext('closeDetails()',context);assert.equal(ids.videoSource.getAttribute('src'),null);assert.equal(ids.moviePlayer.paused,true);assert.equal(card.focused,true)}
cards[0].listeners.click();ids.moviePlayer.failure={name:'NotAllowedError'};await vm.runInContext('playMovie()',context);assert.match(ids.playbackStatus.textContent,/Pulsa el control/);ids.moviePlayer.failure={name:'NotSupportedError'};await vm.runInContext('playMovie()',context);assert.match(ids.playbackStatus.textContent,/No se pudo/);ids.moviePlayer.listeners.error();assert.match(ids.playbackStatus.textContent,/no está disponible/);ids.videoSource.removeAttribute('src');await vm.runInContext('playMovie()',context);assert.match(ids.playbackStatus.textContent,/fuente autorizada/);
// Both favorite handlers must still stop propagation and pass the plain title.
assert.equal((html.match(/event.stopPropagation\(\)/g)||[]).length,2);assert.equal((html.match(/guardarFavoritoFirebase\(title\)/g)||[]).length,2);
console.log('PASS: 8 movie/series selections, Play, close/reset/focus, blocked/failed/missing media, favorite-handler invariants.');
})().catch(e=>{console.error(e);process.exitCode=1});
