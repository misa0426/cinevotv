import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';

// Registro cerrado: no admite rutas o URLs proporcionadas por clientes o por el editor.
export function loadApprovedMedia(root,{review=false}={}) {
  const file=resolve(root,'.local/media/big-buck-bunny-2008-360.mp4');
  const download=resolve(root,'.local/media/big-buck-bunny-download.json');
  const evidence=resolve(root,'.local/media/big-buck-bunny-verified.json');
  if(!existsSync(file)||!existsSync(download)||(!review&&!existsSync(evidence)))return [];
  const meta=JSON.parse(readFileSync(download,'utf8'));
  const source='https://video.blender.org/object-storage/web_videos/bf1f3fb5-b119-4f9f-9930-8e20e892b898-360.mp4';
  const bytes=readFileSync(file),hash=createHash('sha256').update(bytes).digest('hex');
  if(meta.source!==source||meta.sha256!==hash||meta.bytes!==bytes.length||meta.license!=='CC BY 3.0')throw new Error('La copia de Big Buck Bunny no coincide con su evidencia de descarga.');
  let durationSeconds=null;
  if(!review){const proof=JSON.parse(readFileSync(evidence,'utf8'));
    if(proof.sha256!==hash||!['fullPlayback','audioDecoded','videoDecoded','creditsPreserved'].every(key=>proof[key]===true)||proof.durationSeconds<590||proof.durationSeconds>600||proof.qualityHeight!==360)throw new Error('Big Buck Bunny requiere evidencia completa de reproducción y créditos.');
    durationSeconds=proof.durationSeconds;
  }
  return [{durationSeconds,id:'bbb-2008-360',contentId:'open-big-buck-bunny-2008',height:360,mime:'video/mp4',file,license:'CC BY 3.0',source,verificationStatus:review?'PENDIENTE':'APROBADO'}];
}
