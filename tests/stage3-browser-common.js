const results=[];
const el=id=>document.getElementById(id);
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
const wait=async predicate=>{const start=Date.now();while(!predicate()){if(Date.now()-start>8000)throw new Error('Tiempo de espera agotado');await new Promise(resolve=>setTimeout(resolve,40));}};
const submit=id=>el(id).dispatchEvent(new Event('submit',{cancelable:true}));
async function test(name,check){try{await check();results.push('PASS: '+name);}catch(error){results.push('FAIL: '+name+': '+error.message);}}
