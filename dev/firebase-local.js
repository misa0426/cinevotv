// Cliente del simulador HTTP local. Nunca importa el SDK de Firebase.
export function createBackend() {
  let active = null;
  let authVersion = 0;
  let initialized = false;
  let authPoll;
  const authListeners = new Set();
  async function request(path, body, options={}) {
    const response = await fetch('/api/' + path,{credentials:'same-origin',cache:'no-store',...options,...(body === undefined ? {} : {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})});
    const data = await response.json();
    if (!response.ok) throw Object.assign(new Error(data.message || 'Error local'),{code:data.code,status:response.status});
    return data;
  }
  function emit(user) { initialized = true; active = user; authListeners.forEach(callback=>callback(user)); }
  function watch(path, success, failure=()=>{}) {
    let canceled = false, running = false;
    const load = async () => {
      if (running || canceled) return; running = true; const version = authVersion;
      try { const data = await request(path); if (!canceled) success(data); }
      catch(error) { if (!canceled) { failure(error); if (version === authVersion && error.status === 401 && active) emit(null); } }
      finally { running = false; }
    };
    load(); const interval = setInterval(load,2000);
    return () => { canceled=true;clearInterval(interval); };
  }
  return {
    onAuth(callback) {
      authListeners.add(callback);
      const refresh = async () => {
        const version=authVersion;
        try { const user=await request('me'); if(version===authVersion && JSON.stringify(user)!==JSON.stringify(active))emit(user); }
        catch(error) { if(version===authVersion && error.status===401 && (!initialized || active!==null))emit(null); }
      };
      refresh(); authPoll=setInterval(refresh,2000);
      return ()=>{authListeners.delete(callback);clearInterval(authPoll);};
    },
    async login(email,password) { const version=++authVersion; const user=await request('auth/login',{email,password}); if(version===authVersion)emit(user); },
    async register(email,password,name) { const version=++authVersion; const user=await request('auth/register',{email,password,name,language:globalThis.CinevoI18n?.getLanguage()||'en'}); if(version===authVersion)emit(user); },
    async logout() { const version=++authVersion; await request('auth/logout',{}); if(version===authVersion)emit(null); },
    watchFavorites(uid,success,failure) { return watch('favorites',data=>{if(active?.uid===uid && data.uid===uid)success(data.favorites);},failure); },
    async saveFavorite(uid,title) { if(active?.uid!==uid)throw new Error('Sesión cambiada'); await request('favorites',{uid,title}); },
    async removeFavorite(uid,title) { if(active?.uid!==uid)throw new Error('Sesión cambiada'); await request('favorites',{uid,title,remove:true}); },
    async updateUserProfile(uid,name) { if(active?.uid!==uid)throw new Error('Sesión cambiada'); await request('profile',{uid,name}); active={...active,displayName:name}; },
    async selectPlan(plan,options={}) { const user=await request('plan',{uid:active?.uid,plan,...options}); active=user; return user; },
    async setLanguage(language){const user=await request('preferences',{uid:active?.uid,language});active=user;return user;},
    watchCatalog(success,failure) { return watch('catalog',success,failure); },
    configuration(){return request('config');},
    async devices(){const data=await request('devices');if(data.uid!==active?.uid)throw new Error('La sesión cambió. Actualiza el perfil.');return data;},
    removeDevice(id){return request('devices/remove',{uid:active?.uid,id});},
    async history(){const data=await request('history');if(data.uid!==active?.uid)throw new Error('La sesión cambió. Actualiza el perfil.');return data.rows;},
    renew(){return request('renew',{uid:active?.uid});},
    stream(leaseId,details={}){return request('stream',{leaseId,...details},{keepalive:true});},
    getPlayback(id,options={}) { return request('playback',{uid:active?.uid,id,...options}); }
  };
}
