import{createWriteStream}from'node:fs';import{readFile,writeFile,mkdir,access}from'node:fs/promises';import{pipeline}from'node:stream/promises';import{Readable,Transform}from'node:stream';import{createHash}from'node:crypto';import{resolve}from'node:path';import{fileURLToPath}from'node:url';
import{loadApprovedMedia}from'./approved-media.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url))),dir=resolve(root,'.local/media');await mkdir(dir,{recursive:true});
const source='https://video.blender.org/object-storage/web_videos/bf1f3fb5-b119-4f9f-9930-8e20e892b898-360.mp4';
if(process.argv.includes('--download-authorized')){
  const target=resolve(dir,'big-buck-bunny-2008-360.mp4');try{await access(target);throw Error('La copia ya existe: no se sobrescribe ni se descarga otra.');}catch(e){if(e.code!=='ENOENT')throw e;}
  const response=await fetch(source,{redirect:'error',signal:AbortSignal.timeout(180000)});if(!response.ok||!response.headers.get('content-type')?.includes('video/mp4'))throw Error('Respuesta no autorizada o no compatible.');
  let bytes=0;const hash=createHash('sha256'),limit=new Transform({transform(chunk,enc,done){bytes+=chunk.length;if(bytes>70000000)return done(Error('Archivo mayor que el tamaño autorizado.'));hash.update(chunk);done(null,chunk);}});
  await pipeline(Readable.fromWeb(response.body),limit,createWriteStream(target,{flags:'wx'}));
  await writeFile(resolve(dir,'big-buck-bunny-download.json'),JSON.stringify({title:'Big Buck Bunny',contentId:'open-big-buck-bunny-2008',source,officialPage:'https://peach.blender.org/download/',license:'CC BY 3.0',licenseEvidence:'https://peach.blender.org/about/',bytes,sha256:hash.digest('hex'),downloadedAt:new Date().toISOString(),approvedDownload:true},null,2));
  console.log('Copia local descargada. Aún requiere prueba completa y revisión de créditos; no está activada.');
}else if(process.argv.includes('--record-approval')&&process.argv.includes('--credits-reviewed')){
  loadApprovedMedia(root,{review:true});const meta=JSON.parse(await readFile(resolve(dir,'big-buck-bunny-download.json'),'utf8')),proof=JSON.parse(await readFile(resolve(root,'tests/.generated/bbb-full-result.json'),'utf8'));
  if(!proof.fullPlayback||!proof.audioDecoded||!proof.videoDecoded||proof.frames<8000||proof.wallSeconds<580||proof.durationSeconds<590||proof.durationSeconds>600||Date.parse(proof.checkedAt)<Date.parse(meta.downloadedAt)||proof.creditsFrames?.length!==4)throw Error('Evidencia incompleta o anterior a la descarga.');
  await writeFile(resolve(dir,'big-buck-bunny-verified.json'),JSON.stringify({...proof,sha256:meta.sha256,creditsPreserved:true,creditsReview:'Revisión de fotogramas de créditos confirmada expresamente al ejecutar --credits-reviewed',license:'CC BY 3.0',licenseEvidence:'https://peach.blender.org/about/',status:'APROBADO'},null,2));console.log('Aprobación local registrada para el archivo comprobado.');
}else throw Error('No hay descarga automática. Usa --download-authorized solo tras aprobación; después de la prueba completa y de revisar créditos, --record-approval --credits-reviewed.');
