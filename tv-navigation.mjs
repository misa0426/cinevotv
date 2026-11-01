export function nextIndex(boxes,current,direction){
  if(!boxes.length)return -1;if(current<0)return 0;
  const a=boxes[current],horizontal=['ArrowLeft','ArrowRight'].includes(direction),positive=['ArrowRight','ArrowDown'].includes(direction);
  let best=-1,score=Infinity;
  boxes.forEach((b,i)=>{if(i===current)return;const dx=b.x-a.x,dy=b.y-a.y,along=horizontal?dx:dy,cross=horizontal?dy:dx;
    if((positive?along:-along)<=1)return;const value=Math.abs(along)+Math.abs(cross)*2.5;
    if(value<score){score=value;best=i;}});return best;
}
if(typeof document!=='undefined'&&new URLSearchParams(location.search).get('tv')==='1'){
  document.documentElement.classList.add('tv-mode');
  globalThis.VixunoTVBack=()=>{
    if(document.fullscreenElement){document.exitFullscreen();return true;}
    const details=document.getElementById('details');if(details?.style.display==='flex'){document.getElementById('closeDetails').click();return true;}
    const panel=[...document.querySelectorAll('.auth-panel')].find(p=>p.style.display!=='none');if(panel){panel.querySelector('[data-close]').click();return true;}
    return false;
  };
  document.addEventListener('keydown',event=>{
    if(['Escape','BrowserBack'].includes(event.key)&&VixunoTVBack()){event.preventDefault();return;}
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)||event.target.matches('input,textarea,select,video,[contenteditable=true]'))return;
    const modal=[...document.querySelectorAll('[role=dialog]')].find(p=>p.style.display!=='none'&&p.getClientRects().length);
    const root=modal||document;
    const targets=[...root.querySelectorAll('a[href],button,input,select,textarea,.card')].filter(el=>!el.disabled&&!el.closest('[inert]')&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden');
    const boxes=targets.map(el=>{const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}});
    const index=nextIndex(boxes,targets.indexOf(document.activeElement),event.key);
    if(index>=0){event.preventDefault();targets[index].focus();targets[index].scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});}
  });
}
