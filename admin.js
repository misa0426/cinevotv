const uiText=value=>globalThis.CinevoI18n?.translate(value)??value;
const uiLocale=()=>globalThis.CinevoI18n?.getLanguage()==='en'?'en-CA':'es-CA';
const categoryLabel=name=>snapshot?.categoryLabels?.[name]?.[globalThis.CinevoI18n?.getLanguage()||'es']||uiText(name);
const byId = id => document.getElementById(id);
let selectedClientId=null;
let snapshot = null, generation = 0, editing = false, loading = false;
const money = (cents,currency='CAD') => new Intl.NumberFormat(uiLocale(),{style:'currency',currency,currencyDisplay:'code'}).format(cents/100);
const periodName=value=>uiText(value==='year'?'Anual':'Mensual');
const groupedRevenue=key=>Object.entries(snapshot.revenueByCurrency||{CAD:{[key]:snapshot.metrics[key]}}).map(([currency,values])=>money(values[key],currency)).join(' · ');
const date = value => value ? new Intl.DateTimeFormat(uiLocale(),{dateStyle:'medium',timeStyle:'short',timeZone:'UTC'}).format(new Date(value)) + ' UTC' : '—';
const plan = value => uiText(({premium:'Premium',family:'Familiar',free:'Gratis'})[value] || 'Gratis');
const state = value => uiText({renewed:'Renovada',active:'Activa',canceled:'Cancelada',paid:'Aprobado ficticio',refunded:'Reembolsado ficticio',failed:'Fallido ficticio',draft:'Borrador',published:'Publicado',withdrawn:'Retirado'}[value] || 'Sin suscripción');
function element(tag,text,className) { const node=document.createElement(tag);if(text!==undefined)node.textContent=String(text);if(className)node.className=className;return node; }
function cell(row,text) { const td=element('td',text);td.dataset.i18n='off';row.append(td); }
function button(text,action) { const node=element('button',text,'button-outline');node.type='button';node.addEventListener('click',action);return node; }
function locked(message='Acceso exclusivo de la cuenta administradora local.') {
  generation++;snapshot=null;selectedClientId=null;editing=false;
  byId('adminWorkspace').hidden=true;byId('adminGate').hidden=false;
  for(const id of ['adminMetrics','clientsBody','paymentsBody','subscriptionsBody','contentBody','categoryList','clientDetail'])byId(id).replaceChildren();
  for(const id of ['subscriptionSummary','snapshotTime','adminStatus'])byId(id).textContent='';
  byId('clientDetail').hidden=true;byId('contentDialog').close();byId('contentForm').reset();byId('adminPassword').value='';
  byId('gateStatus').textContent=message;
}
async function request(path,data) {
  const response=await fetch('/api/'+path,{credentials:'same-origin',cache:'no-store',...(data===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})});
  const value=await response.json();
  if(!response.ok){if(response.status===401||response.status===403)locked(value.message);throw Object.assign(new Error(value.message),{status:response.status});}
  return value;
}
function fillRows(id,items,render) {
  const body=byId(id);body.replaceChildren();
  for(const item of items){const row=element('tr');render(row,item);body.append(row);}
  if(!items.length){const row=element('tr');const empty=element('td','No hay registros disponibles.','empty-row');empty.colSpan=10;row.append(empty);body.append(row);}
}
function renderClients() {
  if(!snapshot)return;
  const term=byId('clientSearch').value.trim().toLocaleLowerCase();const selected=byId('clientPlan').value;
  const clients=snapshot.clients.filter(client=>(selected==='all'||client.plan===selected)&&(client.displayName+' '+client.email).toLocaleLowerCase().includes(term));
  fillRows('clientsBody',clients,(row,client)=>{
    cell(row,client.displayName||uiText('Sin nombre'));cell(row,client.email);cell(row,date(client.registeredAt));cell(row,uiText(snapshot.markets?.[client.country]?.name||client.country||'Canadá'));cell(row,client.language==='es'?'Español':'English');cell(row,client.currency||'CAD');cell(row,plan(client.plan));cell(row,periodName(client.period));cell(row,money(client.plan==='free'?0:client.subscription?.amountCents||0,client.currency||'CAD'));cell(row,state(client.subscription?.status));
    const action=element('td');action.append(button('Ver pagos',()=>{
      selectedClientId=client.uid;showClientDetail(client);
    }));row.append(action);
  });
}
function render() {
  const metricBox=byId('adminMetrics');metricBox.replaceChildren();
  const m=snapshot.metrics;
  for(const [title,value,note] of [['Usuarios registrados',m.users,'Clientes ficticios; excluye al administrador'],['Suscriptores Premium',m.premium,'Plan activo en la simulación'],['Suscriptores Familiares',m.family,'Hasta 3 dispositivos y 2 reproducciones'],['Usuarios gratuitos',m.free,'Clientes con plan Gratis'],['Ingresos del mes',groupedRevenue('monthlyRevenueCents'),'Netos simulados · separados por moneda · mes UTC'],['Ingresos totales',groupedRevenue('totalRevenueCents'),'Netos simulados · sin dinero real'],['Suscripciones activas',m.active,m.canceled+' canceladas en el historial']]) {
    const card=element('article',undefined,'metric');card.append(element('h2',title),element('strong',value),element('p',note));metricBox.append(card);
  }
  byId('subscriptionSummary').textContent=m.active+' suscripciones activas · '+m.canceled+' canceladas. Importes separados por moneda y modalidad.';
  byId('snapshotTime').textContent='Actualizado: '+date(snapshot.generatedAt);
  renderClients();
  const clientName=uid=>snapshot.clients.find(client=>client.uid===uid)?.email||'Cuenta de prueba';
  fillRows('paymentsBody',[...snapshot.payments].reverse(),(row,payment)=>{cell(row,date(payment.date));cell(row,clientName(payment.uid));cell(row,money(payment.amountCents,payment.currency));cell(row,state(payment.status));});
  fillRows('subscriptionsBody',[...snapshot.subscriptions].reverse(),(row,sub)=>{cell(row,clientName(sub.uid));cell(row,uiText(snapshot.markets?.[sub.country]?.name||sub.country||'Canadá'));cell(row,sub.language==='es'?'Español':'English');cell(row,sub.currency||'CAD');cell(row,plan(sub.plan));cell(row,periodName(sub.period));cell(row,money(sub.amountCents||0,sub.currency||'CAD'));cell(row,state(sub.status));cell(row,date(sub.startedAt));cell(row,sub.status==='active'?date(sub.renewalAt):'—');cell(row,date(sub.canceledAt));});
  fillRows('contentBody',snapshot.catalog,(row,item)=>{
    cell(row,item.title);cell(row,uiText(item.type==='movie'?'Película':'Serie')+' / '+categoryLabel(item.category)+' · '+(item.territories||['CA']).join(', '));
    cell(row,plan(item.access)+(item.freeFrom?' · Gratis: '+date(item.freeFrom)+' — '+date(item.freeUntil):''));
    cell(row,state(item.status)+' / '+uiText(item.rights==='demo-verified'?'Demo CC0':'Derechos pendientes'));
    const actions=element('td');actions.className='row-actions';actions.append(button('Editar',()=>editContent(item)));
    if(item.status!=='withdrawn')actions.append(button('Retirar',async()=>{try{await request('admin/content',{...item,status:'withdrawn'});await load();byId('adminStatus').textContent='Contenido retirado. Se conserva el registro.';}catch(error){byId('adminStatus').textContent=error.message;}}));row.append(actions);
  });
  byId('categoryList').replaceChildren();
  for(const category of snapshot.categories){const chip=button(categoryLabel(category)+' ×',async()=>{try{await request('admin/category',{name:category,remove:true});await load();}catch(error){byId('adminStatus').textContent=error.message;}});chip.dataset.i18n='off';chip.setAttribute('aria-label',uiText('Quitar categoría')+' '+categoryLabel(category));byId('categoryList').append(chip);}
}
async function load() {
  if(loading)return;loading=true;const current=++generation;
  try{const data=await request('admin/snapshot');if(current!==generation)return;snapshot=data;byId('adminGate').hidden=true;byId('adminWorkspace').hidden=false;render();}
  catch(error){if(current===generation)byId('gateStatus').textContent=error.message;}
  finally{loading=false;}
}
byId('adminLogin').addEventListener('submit',async event=>{
  event.preventDefault();const form=byId('adminLogin');if(!form.reportValidity())return;
  const submit=form.querySelector('[type=submit]');if(submit.disabled)return;submit.disabled=true;
  try{await request('auth/login',{email:byId('adminEmail').value.trim(),password:byId('adminPassword').value});byId('adminPassword').value='';await load();}
  catch(error){byId('gateStatus').textContent=error.message;byId('adminPassword').value='';}
  finally{submit.disabled=false;}
});
byId('adminLogout').addEventListener('click',async()=>{try{await request('auth/logout',{});locked('Sesión cerrada.');}catch(error){byId('adminStatus').textContent=error.message;}});
byId('adminRefresh').addEventListener('click',()=>load());
byId('clientSearch').addEventListener('input',renderClients);byId('clientPlan').addEventListener('change',renderClients);
document.querySelectorAll('[data-tab]').forEach(tab=>tab.addEventListener('click',()=>{
  document.querySelectorAll('[data-tab]').forEach(button=>button.setAttribute('aria-pressed',String(button===tab)));
  document.querySelectorAll('.admin-tab').forEach(section=>{section.hidden=section.id!=='tab-'+tab.dataset.tab;});
}));
function editContent(item=null){
  if(!snapshot)return;editing=true;byId('contentForm').reset();byId('contentStatus').textContent='';
  byId('contentFormHeading').textContent=item?'Editar contenido':'Agregar contenido';
  const fields={contentId:item?.id||'',contentVersion:item?.version||'',contentTitle:item?.title||'',contentDescription:item?.description||'',contentType:item?.type||'movie',contentAccess:item?.access||'free',contentPalette:item?.palette??0,contentState:item?.status||'draft',contentRights:item?.rights||'pending',contentFreeFrom:item?.freeFrom?.slice(0,16)||'',contentFreeUntil:item?.freeUntil?.slice(0,16)||''};
  byId('contentCategory').replaceChildren();for(const name of snapshot.categories){const option=element('option',categoryLabel(name));option.dataset.i18n='off';option.value=name;byId('contentCategory').append(option);}
  byId('contentCategory').value=item?.category||snapshot.categories[0];
  for(const[id,value]of Object.entries(fields))byId(id).value=value;
  for(const option of byId('contentTerritories').options)option.selected=(item?.territories||['CA']).includes(option.value);byId('contentFree480').checked=item?.freeMaxHeight===480;
  byId('contentDialog').showModal();byId('contentTitle').focus();
}
byId('newContent').addEventListener('click',()=>editContent());
byId('closeContent').addEventListener('click',()=>{byId('contentDialog').close();editing=false;});
byId('contentDialog').addEventListener('close',()=>{editing=false;});
byId('contentForm').addEventListener('submit',async event=>{
  event.preventDefault();if(!byId('contentForm').reportValidity())return;const submit=byId('saveContent');if(submit.disabled)return;submit.disabled=true;
  const current=generation;const data={territories:[...byId('contentTerritories').selectedOptions].map(option=>option.value),freeMaxHeight:byId('contentFree480').checked?480:null,id:byId('contentId').value||undefined,version:Number(byId('contentVersion').value),title:byId('contentTitle').value,description:byId('contentDescription').value,type:byId('contentType').value,category:byId('contentCategory').value,palette:Number(byId('contentPalette').value),access:byId('contentAccess').value,status:byId('contentState').value,rights:byId('contentRights').value,rightsEvidence:'https://github.com/mdn/interactive-examples/blob/main/LICENSE',freeFrom:byId('contentFreeFrom').value?byId('contentFreeFrom').value+':00Z':null,freeUntil:byId('contentFreeUntil').value?byId('contentFreeUntil').value+':00Z':null};
  try{await request('admin/content',data);if(current!==generation)return;byId('contentDialog').close();editing=false;await load();byId('adminStatus').textContent='Contenido guardado en el simulador.';}
  catch(error){if(current===generation)byId('contentStatus').textContent=error.message;}
  finally{submit.disabled=false;}
});
byId('categoryForm').addEventListener('submit',async event=>{event.preventDefault();if(!byId('categoryForm').reportValidity())return;try{await request('admin/category',{name:byId('categoryName').value,englishName:byId('categoryEnglish').value.trim()||undefined});byId('categoryForm').reset();await load();}catch(error){byId('adminStatus').textContent=error.message;}});
await load();
const sessionCheck=setInterval(async()=>{if(!snapshot)return;try{const user=await request('me');if(user.role!=='admin')locked('Acceso no autorizado.');}catch{/* request ya limpia el panel ante 401/403. */}},5000);
window.addEventListener('pagehide',()=>{clearInterval(sessionCheck);generation++;});

document.addEventListener('cinevo:languagechange',()=>{if(snapshot){render();const client=snapshot.clients.find(client=>client.uid===selectedClientId);if(client)showClientDetail(client);if(byId('contentDialog').open)for(const option of byId('contentCategory').options)option.textContent=categoryLabel(option.value);}});

function showClientDetail(client){
      const detail=byId('clientDetail');detail.replaceChildren(element('h2','Historial de '+(client.displayName||client.email)));
      for(const payment of client.payments)detail.append(element('p',date(payment.date)+' · '+money(payment.amountCents)+' · '+state(payment.status)));
      if(!client.payments.length)detail.append(element('p','Este cliente no tiene pagos ficticios registrados.'));
      detail.hidden=false;detail.scrollIntoView({block:'nearest'});
}
