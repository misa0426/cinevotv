import { createLocalServer } from '../dev/server.mjs';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=resolve(root,'tests/.generated');await mkdir(out,{recursive:true});
const password='Ficticia-Solo-Test-123!';
const server=createLocalServer({approvedMedia:false,adminPassword:password});
const original=server.listeners('request')[0];server.removeAllListeners('request');
const common=await readFile(resolve(root,'tests/stage3-browser-common.js'),'utf8');
const report="const report=document.createElement('pre');report.id='stage3-results';report.textContent=results.join('\\n');document.body.append(report);";
const pages=new Map();
for(const [name,source,script]of [['app','index.html','app.js'],['admin','admin.html','admin.js']]){
 let html=await readFile(resolve(root,source),'utf8');
 html=html.replace('<script type="module" src="./i18n.mjs"></script>','');
 const checks=await readFile(resolve(root,'tests/stage3-'+name+'-checks.js'),'utf8');
 const module='import("/'+script+'").then(async()=>{'+common+checks+report+'}).catch(error=>{const pre=document.createElement("pre");pre.id="stage3-results";pre.textContent="FAIL: "+error.message;document.body.append(pre);});';
 html=html.replace('<script type="module" src="./'+script+'"></script>','<script>window.realMediaPlays=0;HTMLMediaElement.prototype.load=function(){};HTMLMediaElement.prototype.pause=function(){};HTMLMediaElement.prototype.play=async function(){window.realMediaPlays++;};</script><script type="module">'+module+'</script>');
 pages.set('/__test-'+name,html);
}
server.on('request',(req,res)=>{if(pages.has(req.url)){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(pages.get(req.url));}else original(req,res);});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
try{
 const adminResponse=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'admin@cinevo.test',password})});
 const cookie=adminResponse.headers.getSetCookie().map(cookie=>cookie.split(';')[0]).join('; ');
 const initial=await(await fetch(base+'/api/admin/snapshot',{headers:{cookie}})).json();
 await fetch(base+'/api/admin/content',{method:'POST',headers:{cookie,'Content-Type':'application/json'},body:JSON.stringify({...initial.catalog[0],access:'premium'})});
 let failed=false;
 for(const name of ['app','admin']){
  const profile=resolve(out,'edge-stage3-'+name+'-'+Date.now());
  const edge='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
  const args=['--headless','--disable-gpu','--no-first-run','--disable-background-networking','--no-proxy-server','--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1','--user-data-dir='+profile,'--virtual-time-budget=30000','--dump-dom',base+'/__test-'+name];
  const child=spawn(edge,args,{windowsHide:true});let stdout='',stderr='';child.stdout.on('data',chunk=>stdout+=chunk);child.stderr.on('data',chunk=>stderr+=chunk);
  const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',resolve);});
  await writeFile(resolve(out,'stage3-'+name+'-result.html'),stdout);await writeFile(resolve(out,'stage3-'+name+'-stderr.txt'),stderr);
  const match=stdout.match(/<pre id="stage3-results">([\s\S]*?)<\/pre>/);
  if(!match||code){console.log('FAIL: navegador '+name+' sin resultados completos');failed=true;}
  else{console.log(match[1]);if(match[1].includes('FAIL:'))failed=true;}
 }
 if(failed)process.exitCode=1;
}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
