// Única fuente de precios aprobados. Importes enteros en centavos, sin tipos de cambio.
export const PAID_PLANS = new Set(['premium','family']);
const entries={
 CA:{name:'Canadá',currency:'CAD',prices:{free:0,premium:699,family:999},annualPrices:{premium:6990,family:9990}},
 US:{name:'Estados Unidos',currency:'USD',prices:{free:0,premium:599,family:899},annualPrices:{premium:5990,family:8990}},
 MX:{name:'México',currency:'USD',prices:{free:0,premium:599,family:899},annualPrices:{premium:5990,family:8990}},
 ES:{name:'España',currency:'EUR',prices:{free:0,premium:499,family:799},annualPrices:{premium:4990,family:7990}},
 IE:{name:'Irlanda',currency:'EUR',prices:{free:0,premium:499,family:799},annualPrices:{premium:4990,family:7990}}
};
for(const entry of Object.values(entries)){Object.freeze(entry.prices);Object.freeze(entry.annualPrices);Object.freeze(entry);}
export const MARKETS=Object.freeze(entries);
export const PLAN_NAMES={free:'Gratis',premium:'Premium',family:'Familiar'};
export function features(plan){return {favorites:PAID_PLANS.has(plan),history:PAID_PLANS.has(plan),premium:PAID_PLANS.has(plan),ads:!PAID_PLANS.has(plan),maxHeight:PAID_PLANS.has(plan)?1080:null,maxDevices:plan==='family'?3:null,maxStreams:PAID_PLANS.has(plan)?2:null};}
export function quote(country,plan,period='month'){
 const market=MARKETS[country];if(!market||!['month','year'].includes(period)||!['free','premium','family'].includes(plan)||plan==='free'&&period==='year')return null;
 const amountCents=(period==='year'?market.annualPrices:market.prices)[plan];if(!Number.isSafeInteger(amountCents))return null;
 return {country,currency:market.currency,amountCents,period,months:period==='year'?12:1,available:true,savingsCents:period==='year'?market.prices[plan]*12-amountCents:0,savingsPercent:period==='year'?16.67:0};
}
if(typeof window!=='undefined')globalThis.VixunoPricing={MARKETS,quote,features};
