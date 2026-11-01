import { createLocalServer } from '../dev/server.mjs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),out=resolve(root,'tests/.generated');await mkdir(out,{recursive:true});
const password='Ficticia-Captura-123!';const server=createLocalServer({approvedMedia:false,adminPassword:password});const original=server.listeners('request')[0];server.removeAllListeners('request');
let html=await readFile(resolve(root,'admin.html'),'utf8');
const script='await import("/admin.js");document.getElementById("adminEmail").value="admin@cinevo.test";document.getElementById("adminPassword").value="Ficticia-Captura-123!";document.getElementById("adminLogin").dispatchEvent(new Event("submit",{cancelable:true}));while(document.getElementById("adminWorkspace").hidden)await new Promise(resolve=>setTimeout(resolve,30));const pre=document.createElement("pre");pre.id="capture-result";pre.textContent=document.documentElement.scrollWidth<=innerWidth?"PASS: panel privado sin desbordamiento a "+innerWidth+"px":"FAIL: desbordamiento";pre.style.cssText="font-size:10px;color:#e0bb78";document.body.append(pre);';
html=html.replace('<script type="module" src="./admin.js"></script>','<script type="module">'+script+'</script>');
server.on('request',(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/__capture'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end(html);}
 if(url.pathname==='/__frame'){
  const width=Number(url.searchParams.get('width'));
  const body='<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#101114}iframe{display:block;border:0}</style><iframe id="view" src="/__capture" style="width:'+width+'px;height:1100px"></iframe><script>const timer=setInterval(()=>{const result=document.getElementById("view").contentDocument?.getElementById("capture-result");if(result){clearInterval(timer);const pre=document.createElement("pre");pre.id="capture-result";pre.textContent=result.textContent;document.body.append(pre);}},30);</script>';
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end(body);
 }
 original(req,res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try{
 for(const width of [1440,390]){
  const path=resolve(out,'admin-preview-'+width+'.png'),profile=resolve(out,'edge-admin-capture-'+width+'-'+Date.now());
  const child=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless','--disable-gpu','--no-first-run','--hide-scrollbars','--no-proxy-server','--force-device-scale-factor=1','--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1','--user-data-dir='+profile,'--window-size='+Math.max(550,width+40)+',1140','--virtual-time-budget=15000','--screenshot='+path,'--dump-dom','http://127.0.0.1:'+server.address().port+'/__frame?width='+width],{windowsHide:true});
  let stdout='',stderr='';child.stdout.on('data',chunk=>stdout+=chunk);child.stderr.on('data',chunk=>stderr+=chunk);await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',resolve);});await writeFile(resolve(out,'admin-capture-'+width+'.html'),stdout);await writeFile(resolve(out,'admin-capture-'+width+'-stderr.txt'),stderr);
  const matches=[...stdout.matchAll(/<pre id="capture-result"[^>]*>([^<]+)<\/pre>/g)];const result=matches.at(-1)?.[1];console.log(result||'FAIL: captura sin resultados');if(!result?.startsWith('PASS:'))process.exitCode=1;
 }
}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
