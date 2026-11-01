import { existsSync, readFileSync, createReadStream, statSync } from 'node:fs';
import http from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { createSimulation, ApiError } from './simulation.mjs';
import {loadApprovedMedia} from './approved-media.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export function createLocalServer({ adminEmail = 'admin@cinevo.test', adminPassword, now, region='CA', reviewMedia=false, includeDemos=true, approvedMedia=true } = {}) {
  const variants = [{id:'flower-360',height:360,mime:'video/webm',file:resolve(root,'.local/media/flower-360.webm')},{id:'flower-540',height:540,mime:'video/mp4',file:existsSync(resolve(root,'.local/media/flower-540.mp4'))?resolve(root,'.local/media/flower-540.mp4'):resolve(root,'tests/.generated/flower.mp4')}].filter(variant=>existsSync(variant.file));
  if(!variants.length)throw new Error('No hay un archivo de demostración disponible. Ejecuta dev/prepare-demo.mjs con el MP4 existente.');
  if(approvedMedia)variants.push(...loadApprovedMedia(root,{review:reviewMedia}));
  const openFilms=JSON.parse(readFileSync(resolve(root,'index.html'),'utf8').match(/<script type="application\/json" id="openFilmsCatalog">([\s\S]*?)<\/script>/)?.[1]||'[]');
  const api = createSimulation({ adminEmail, adminPassword, now, region, variants, openFilms, includeDemos });
  const issuedDevices=new Set();
  const failures = new Map();
  const routes = new Map([
    ['/', ['index.html','text/html']], ['/index.html',['index.html','text/html']],
    ['/robots.txt',['seo/local-robots.txt','text/plain']],['/sitemap.xml',['seo/public/sitemap.xml','application/xml']],
    ['/tv-navigation.mjs',['tv-navigation.mjs','text/javascript']],
    ['/assets/posters/big-buck-bunny.jpg',['assets/posters/big-buck-bunny.jpg','image/jpeg']],
    ['/assets/posters/sprite-fright.jpg',['assets/posters/sprite-fright.jpg','image/jpeg']],
    ['/policies.mjs',['dev/policies.mjs','text/javascript']],['/brand-mark.svg',['brand-mark.svg','image/svg+xml']],['/i18n.mjs',['i18n.mjs','text/javascript']], ['/app.js',['app.js','text/javascript']], ['/styles.css',['styles.css','text/css']],
    ['/firebase.js',['dev/firebase-local.js','text/javascript']],
    ['/admin',['admin.html','text/html']], ['/admin.html',['admin.html','text/html']],
    ['/admin.js',['admin.js','text/javascript']], ['/admin.css',['admin.css','text/css']]
  ]);
  const server = http.createServer(async (req,res) => {
    const send = (status,data,type='application/json') => {
      res.writeHead(status, { 'Content-Type': type + '; charset=utf-8', 'Cache-Control':'no-store', 'X-Robots-Tag':'noindex, nofollow', 'X-Content-Type-Options':'nosniff', 'X-Frame-Options':'SAMEORIGIN', 'Referrer-Policy':'same-origin' });
      res.end(req.method === 'HEAD' ? undefined : Buffer.isBuffer(data) || typeof data === 'string' ? data : JSON.stringify(data));
    };
    try {
      const hosts = ['localhost:' + server.address().port, '127.0.0.1:' + server.address().port];
      if (!hosts.includes(req.headers.host)) throw new ApiError(403,'Host local no permitido.');
      const origin = req.headers.origin;
      if (origin && !hosts.map(host=>'http://' + host).includes(origin)) throw new ApiError(403,'Origen no permitido.');
      const path = new URL(req.url,'http://' + req.headers.host).pathname;
      if (!path.startsWith('/api/')) {
        const route = routes.get(path);
        if (!route) return send(404,{message:'No encontrado'});
        if (!['GET','HEAD'].includes(req.method)) return send(405,{message:'Método no permitido'});
        let body = await readFile(resolve(root,route[0]),route[1]==='image/jpeg'?undefined:'utf8');
        if(route[0]==='index.html'&&!includeDemos)body=body.replace('<body>','<body data-catalog-mode="real">');
        if (route[0] === 'index.html' || route[0] === 'admin.html') body = body.replace(/<body[^>]*>/,match=>match+'<aside class="local-notice" role="note">PRUEBA LOCAL AISLADA · Todos los clientes, suscripciones e ingresos son ficticios. Sin Firebase de producción ni cobros reales. Los datos se reinician al detener el servidor.</aside>');
        return send(200,body,route[1]);
      }
      const sessionName='cinevo_session_'+server.address().port+'=';
      const deviceName='cinevo_device_'+server.address().port+'=';
      const cookies=(req.headers.cookie||'').split(';').map(value=>value.trim());
      let deviceId=cookies.find(value=>value.startsWith(deviceName))?.slice(deviceName.length);
      const appendCookie=value=>{const existing=res.getHeader('Set-Cookie')||[];res.setHeader('Set-Cookie',[...(Array.isArray(existing)?existing:[existing]),value]);};
      if(!deviceId||!issuedDevices.has(deviceId)){deviceId=randomBytes(32).toString('hex');issuedDevices.add(deviceId);appendCookie(deviceName+deviceId+'; HttpOnly; SameSite=Strict; Path=/api; Max-Age=31536000');}
      const context={deviceId,deviceName:req.headers['user-agent']?.slice(0,80)||'Navegador local'};
      const cookie = (req.headers.cookie || '').split(';').map(value=>value.trim()).find(value=>value.startsWith(sessionName));
      const token = cookie?.slice(sessionName.length);
      const sessionCookie = value => { appendCookie(sessionName + value + '; HttpOnly; SameSite=Strict; Path=/api; Max-Age=' + (value ? '28800' : '0')); };
      if(path.startsWith('/api/media/') && ['GET','HEAD'].includes(req.method)){
        const variant=api.media(token,path.slice('/api/media/'.length),context);
        const size=statSync(variant.file).size;let start=0,end=size-1,status=200;
        if(req.headers.range){const match=req.headers.range.match(/^bytes=(\d*)-(\d*)$/);if(!match)return send(416,{message:'Rango inválido'});
          if(!match[1])start=Math.max(0,size-Number(match[2]));else{start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}
          if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=size){res.setHeader('Content-Range','bytes */'+size);return send(416,{message:'Rango inválido'});}status=206;res.setHeader('Content-Range','bytes '+start+'-'+end+'/'+size);
        }
        res.writeHead(status,{'Content-Type':variant.mime,'Content-Length':end-start+1,'Accept-Ranges':'bytes','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
        if(req.method==='HEAD')return res.end();
        const stream=createReadStream(variant.file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());return stream.pipe(res);
      }
      let data = {};
      if (req.method === 'POST') {
        if (!(req.headers['content-type'] || '').startsWith('application/json')) throw new ApiError(415,'Se requiere JSON.');
        let length = 0; const chunks=[];
        for await (const chunk of req) { length += chunk.length; if (length > 65536) throw new ApiError(413,'Solicitud demasiado grande.'); chunks.push(chunk); }
        try { data = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { throw new ApiError(400,'JSON inválido.'); }
        if (!data || Array.isArray(data) || typeof data !== 'object') throw new ApiError(400,'Datos inválidos.');
      }
      const key = req.method + ' ' + path;
      if(!['/api/auth/login','/api/auth/register','/api/auth/logout','/api/catalog','/api/config','/api/playback','/api/stream'].includes(path))api.verifyDevice(token,context);
      let result;
      if (['POST /api/auth/login','POST /api/auth/register'].includes(key)) {
        const ip = req.socket.remoteAddress;
        const attempt = failures.get(ip);
        if (attempt && attempt.until > Date.now() && attempt.count >= 10) throw new ApiError(429,'Demasiados intentos. Espera un minuto.','auth/too-many-requests');
        try { result = key.endsWith('login') ? api.login(data,context) : api.register(data,context); }
        catch(error) { const record = attempt && attempt.until > Date.now() ? attempt : {count:0,until:Date.now()+60000}; record.count++; failures.set(ip,record); throw error; }
        failures.delete(ip);
        if (token) api.logout(token);
        sessionCookie(result.token); return send(200,result.user);
      }
      if (['POST /api/favorites','POST /api/profile','POST /api/plan','POST /api/devices/remove','POST /api/renew','POST /api/preferences'].includes(key) && (!data.uid || api.me(token).uid !== data.uid)) throw new ApiError(409,'La sesión cambió en otra pestaña. Vuelve a entrar.','session-changed');
      switch (key) {
        case 'GET /api/config': result=api.configuration();break;
        case 'GET /api/devices': result=api.devices(token);break;
        case 'POST /api/devices/remove': result=api.removeDevice(token,data);break;
        case 'GET /api/history': result={uid:api.me(token).uid,rows:api.history(token)};break;
        case 'POST /api/stream': result=api.stream(token,data,context);break;
        case 'POST /api/renew': result=api.renew(token);break;
        case 'GET /api/me': result = api.me(token); break;
        case 'POST /api/auth/logout': result = api.logout(token); sessionCookie(''); break;
        case 'GET /api/favorites': result = {uid:api.me(token).uid,favorites:api.favorites(token)}; break;
        case 'POST /api/favorites': result = api.favorite(token,data); break;
        case 'POST /api/preferences': result=api.preferences(token,data);break;
        case 'POST /api/profile': result = api.profile(token,data); break;
        case 'POST /api/plan': result = api.choosePlan(token,data); break;
        case 'GET /api/catalog': result = api.catalog(token); break;
        case 'POST /api/playback': result = api.playback(token,data,context); break;
        case 'GET /api/admin/snapshot': result = api.adminSnapshot(token); break;
        case 'POST /api/admin/content': result = api.saveContent(token,data); break;
        case 'POST /api/admin/category': result = api.category(token,data); break;
        default: throw new ApiError(404,'Ruta no disponible.');
      }
      send(200,result);
    } catch(error) { send(error.status || 500,{message:error.status ? error.message : 'Error del servidor local.',code:error.code || 'server-error'}); }
  });
  server.requestTimeout = 10000; server.headersTimeout = 10000;
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), value = flag => args[args.indexOf(flag)+1];
  const port = args.includes('--port') ? Number(value('--port')) : 8082;
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Puerto inválido.');
  const adminEmail = args.includes('--admin-email') ? value('--admin-email').trim().toLowerCase() : 'admin@cinevo.test';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) throw new Error('Correo de prueba inválido.');
  const adminPassword = process.env.CINEVO_LOCAL_ADMIN_PASSWORD || randomBytes(18).toString('base64url');
  const server = createLocalServer({adminEmail,adminPassword,includeDemos:false});
  server.on('error',error=>{ console.error(error.code === 'EADDRINUSE' ? 'El puerto está ocupado. Detén la instancia anterior o usa -Port con otro número.' : error.message); process.exitCode=1; });
  server.listen(port,'127.0.0.1',async()=>{
    await mkdir(resolve(root,'.local'),{recursive:true});
    const credentials = 'SOLO SIMULACIÓN LOCAL. No usar credenciales reales.\nPanel: http://localhost:' + port + '/admin\nCorreo: ' + adminEmail + '\nContraseña temporal: ' + adminPassword + '\nLos datos se reinician al detener el servidor.\n';
    await writeFile(resolve(root,'.local/admin-acceso.txt'),credentials,{mode:0o600});
    console.log('VixunoTV: http://localhost:'+port+'/\nPanel: http://localhost:'+port+'/admin\nCuenta ficticia autorizada: '+adminEmail+'\nContraseña temporal solo en .local/admin-acceso.txt (excluido de Git).');
  });
}
