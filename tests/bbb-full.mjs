import {createLocalServer} from '../dev/server.mjs';
import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const out=resolve('tests/.generated');await mkdir(out,{recursive:true});
const server=createLocalServer({adminPassword:'BBB-Ficticia-Solo-Pruebas!',reviewMedia:true,includeDemos:false});
const original=server.listeners('request')[0];server.removeAllListeners('request');let evidence;
const script=String.raw`
const v=document.getElementById('v');const wait=()=>fetch('/__wait');
const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
const api=async(path,body)=>{const r=await fetch('/api/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const j=await r.json();if(!r.ok)throw Error(j.message);return j};
try{
const lease=await api('playback',{id:'open-big-buck-bunny-2008',playbackId:'full-review'});v.src=lease.video;
v.muted=true;
await v.play();for(let i=0;i<20&&v.currentTime<.5;i++)await wait();
assert(v.videoWidth>0&&v.videoHeight===360,'No decodifica imagen 360p');assert(v.duration>590&&v.duration<600,'Duración no corresponde al archivo completo');
v.pause();const paused=v.currentTime;await wait();assert(Math.abs(v.currentTime-paused)<.1,'La pausa no se mantiene');
v.currentTime=120;await v.play();await wait();assert(v.currentTime>=120,'No avanza');v.currentTime=10;await wait();assert(v.currentTime<20,'No retrocede');
v.pause();v.currentTime=0;await new Promise(r=>v.addEventListener('seeked',r,{once:true}));
const started=Date.now();let audio=false,decoded=0,ticks=0,last=0,maxGap=0;const captures=new Set();await v.play();
while(!v.ended){await wait();if(v.error)throw Error('MediaError '+v.error.code);ticks++;maxGap=Math.max(maxGap,v.currentTime-last);last=v.currentTime;
audio=audio||(v.webkitAudioDecodedByteCount||0)>0;
decoded=Math.max(decoded,v.webkitAudioDecodedByteCount||0);
if(ticks%20===0){await api('stream',{leaseId:lease.leaseId,position:v.currentTime,duration:v.duration});await fetch('/__progress',{method:'POST',body:JSON.stringify({position:v.currentTime,duration:v.duration,decodedAudioBytes:decoded})});}
for(const t of [545,565,580,590])if(v.currentTime>=t&&!captures.has(t)){captures.add(t);const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d').drawImage(v,0,0);await fetch('/__frame/'+t,{method:'POST',body:c.toDataURL('image/png')});}
assert(Date.now()-started<850000,'Tiempo máximo superado');}
const frames=v.getVideoPlaybackQuality().totalVideoFrames;assert(frames>8000,'No se verificaron suficientes fotogramas');assert(audio||decoded>0,'No se detectó audio decodificado');assert(Date.now()-started>580000,'La reproducción completa no ocurrió a velocidad normal');assert(maxGap<8,'Saltos inesperados en la reproducción completa');
await fetch('/__result',{method:'POST',body:JSON.stringify({fullPlayback:true,audioDecoded:audio||decoded>0,videoDecoded:true,qualityHeight:v.videoHeight,durationSeconds:v.duration,frames,audioSignalDetected:audio,decodedAudioBytes:decoded,wallSeconds:(Date.now()-started)/1000,maxGap,pause:true,seekForward:true,seekBackward:true,creditsFrames:[...captures],fullscreen:'PENDIENTE: requiere interacción real',audibleSpeakers:'PENDIENTE: prueba automatizada con salida silenciada',checkedAt:new Date().toISOString()})});
document.body.dataset.done='true';
}catch(e){await fetch('/__result',{method:'POST',body:JSON.stringify({error:e.message})});}
`;
server.on('request',async(req,res)=>{
if(req.url==='/__review'){res.setHeader('Content-Type','text/html');return res.end('<!doctype html><title>Revisión Big Buck Bunny</title><video id="v" controls playsinline></video><script type="module">'+script+'</script>');}
if(req.url==='/__wait')return setTimeout(()=>res.end('ok'),1000);
if(req.url.startsWith('/__frame/')||req.url==='/__result'||req.url==='/__progress'){
let body='';for await(const chunk of req){body+=chunk;if(body.length>2000000){res.writeHead(413);return res.end();}}
if(req.url==='/__result'){evidence=JSON.parse(body);await writeFile(resolve(out,'bbb-full-result.json'),JSON.stringify(evidence,null,2));console.log('RESULTADO',JSON.stringify(evidence));setTimeout(()=>child.kill(),500);}
else if(req.url==='/__progress')console.log('PROGRESO BBB',body);
else await writeFile(resolve(out,'bbb-credits-'+req.url.split('/').at(-1)+'.png'),Buffer.from(body.split(',')[1],'base64'));
return res.end('ok');}
return original(req,res);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const child=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless','--disable-gpu','--no-first-run','--no-proxy-server','--autoplay-policy=no-user-gesture-required','--user-data-dir='+resolve(out,'edge-bbb-full-'+Date.now()),'--remote-debugging-port=0','http://127.0.0.1:'+server.address().port+'/__review'],{windowsHide:true});let stdout='',stderr='';child.stdout.on('data',d=>stdout+=d);child.stderr.on('data',d=>stderr+=d);
const timeout=setTimeout(()=>child.kill(),900000);
try{await new Promise((r,j)=>{child.on('exit',r);child.on('error',j);});if(!evidence||evidence.error){process.exitCode=1;console.log('FAIL',evidence||'Sin evidencia completa');}}
finally{await writeFile(resolve(out,'bbb-full-browser.html'),stdout);await writeFile(resolve(out,'bbb-full-stderr.txt'),stderr);clearTimeout(timeout);server.closeAllConnections();await new Promise(r=>server.close(r));}
