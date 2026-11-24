(() => {
  const API='/api/v1';let account=null,lastSyncAt=null,syncing=false;
  const accountReady=XPStorage.getSetting('cloudAccount').then(value=>{if(value&&typeof value.id==='string')account=value}).catch(()=>null);
  async function setAccount(user){account=user||null;if(account)await XPStorage.setSetting('cloudAccount',{id:account.id,username:account.username,email:account.email||null});else await XPStorage.setSetting('cloudAccount',null);return account;}
  async function request(path,{method='GET',body}={}){
    const response=await fetch(`${API}${path}`,{method,credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,cache:'no-store'});
    let result={};try{result=await response.json()}catch{}
    if(!response.ok)throw new Error(result.message||`HTTP ${response.status}`);
    return result;
  }
  async function me(){const result=await request('/auth/me');return setAccount(result.user)}
  async function login(login,password){const result=await request('/auth/login',{method:'POST',body:{login,password}});return setAccount(result.user)}
  async function register(username,email,password){const result=await request('/auth/register',{method:'POST',body:{username,email,password}});return setAccount(result.user)}
  async function logout(){await request('/auth/logout',{method:'POST',body:{}});await setAccount(null)}
  async function collectLocal(){
    const allCharacters=await XPStorage.getCharacters(),characters=[];
    for(const character of allCharacters){if(character.cloudOwnerId&&character.cloudOwnerId!==account.id)continue;if(!character.cloudOwnerId){character.cloudOwnerId=account.id;await XPStorage.saveCharacter(character)}characters.push(character)}
    const ownedIds=new Set(characters.map(c=>c.id)),memories=[];
    for(const character of characters){for(const memory of await XPStorage.getMemories(character.id))memories.push(memory)}
    const [allAnimations,allDrawings]=await Promise.all([XPStorage.getAnimations(),XPStorage.getDrawings()]);
    const animations=[],drawings=[];
    for(const item of allAnimations){if(item.cloudOwnerId&&item.cloudOwnerId!==account.id)continue;if(item.characterId&&!ownedIds.has(item.characterId))continue;item.cloudOwnerId=account.id;await XPStorage.saveAnimation(item);animations.push(item)}
    for(const item of allDrawings){if(item.cloudOwnerId&&item.cloudOwnerId!==account.id)continue;if(item.characterId&&!ownedIds.has(item.characterId))continue;item.cloudOwnerId=account.id;await XPStorage.saveDrawing(item);drawings.push(item)}
    let settings={};try{settings=JSON.parse(localStorage.getItem('xp-settings')||'{}')}catch{}
    try{settings.desktopLayout=JSON.parse(localStorage.getItem('xp-icon-layout')||'{}')}catch{}
    const ids=new Set(characters.map(c=>c.id)),relationshipMap=new Map(),goals=[];
    for(const character of characters){
      for(const [otherId,count] of Object.entries(character.relationships||{})){
        if(!ids.has(otherId)||otherId===character.id)continue;
        const [characterA,characterB]=[character.id,otherId].sort(),key=`${characterA}:${characterB}`;
        if(!relationshipMap.has(key))relationshipMap.set(key,{id:key,characterA,characterB,relationshipType:'friend',affinity:Math.max(-1,Math.min(1,(Number(count)||0)/10)),interactionCount:Math.max(0,Math.floor(Number(count)||0)),metadata:{source:'local-social-memory'},updatedAt:character.updatedAt||Date.now()});
      }
      for(const goal of character.goals||[])goals.push({...goal,id:goal.id||`${character.id}:${goal.type||'goal'}`,characterId:character.id,goalType:goal.type||goal.goalType||'explore',updatedAt:goal.updatedAt||character.updatedAt||Date.now()});
    }
    return{characters:characters.map(c=>({...c,updatedAt:c.updatedAt||Date.now()})),memories,relationships:[...relationshipMap.values()],goals,animations,drawings,settings};
  }
  function timestamp(value){const t=new Date(value||0).getTime();return Number.isFinite(t)?t:0}
  async function mergeRemote(remote){
    const local=await collectLocal(),localChars=new Map(local.characters.map(c=>[c.id,c]));
    for(const row of remote.characters||[]){
      const localValue=localChars.get(row.id),remoteAt=timestamp(row.updatedAt);
      if(!localValue||remoteAt>timestamp(localValue.updatedAt)){
        const merged={...(localValue||{}),id:row.id,cloudOwnerId:account?.id||null,name:row.name,color:row.color,personality:row.profile?.personality||row.personality?.name||'Curious',profile:row.profile||{},needs:row.needs||{},energy:row.energy,emotion:row.emotion,state:row.currentState,goal:row.currentGoal,x:row.position?.x||0,y:row.position?.y||0,updatedAt:remoteAt,createdAt:timestamp(row.createdAt)};
        await XPStorage.saveCharacter(merged);localChars.set(row.id,merged);
      }
    }
    for(const memory of remote.memories||[]){
      const existing=await XPStorage.getMemories(memory.characterId);if(!existing.some(x=>x.id===memory.id))await XPStorage.addMemory({id:memory.id,characterId:memory.characterId,text:memory.content,kind:memory.memoryType,importance:memory.importance,confidence:memory.confidence,metadata:memory.metadata,at:timestamp(memory.createdAt)});
    }
    for(const relation of remote.relationships||[]){
      const a=localChars.get(relation.characterA),b=localChars.get(relation.characterB);if(!a||!b)continue;
      a.relationships={...(a.relationships||{}),[b.id]:Math.max(Number(a.relationships?.[b.id])||0,Number(relation.interactionCount)||0)};
      b.relationships={...(b.relationships||{}),[a.id]:Math.max(Number(b.relationships?.[a.id])||0,Number(relation.interactionCount)||0)};
      await XPStorage.saveCharacter(a);await XPStorage.saveCharacter(b);
    }
    for(const goal of remote.goals||[]){const character=localChars.get(goal.characterId);if(!character)continue;character.goals=Array.isArray(character.goals)?character.goals:[];const item={id:goal.id,type:goal.goalType,priority:goal.priority,progress:goal.progress,status:goal.status,updatedAt:timestamp(goal.updatedAt)};const index=character.goals.findIndex(x=>x.id===goal.id);if(index<0)character.goals.push(item);else if(timestamp(item.updatedAt)>timestamp(character.goals[index].updatedAt))character.goals[index]=item;await XPStorage.saveCharacter(character)}
    for(const row of remote.animations||[]){const project={id:row.id,cloudOwnerId:account?.id||null,name:row.name,fps:row.fps,loop:row.loop,duration:row.timeline?.duration||48,frames:row.timeline?.frames||[],characterId:row.characterId,metadata:row.metadata,updatedAt:timestamp(row.updatedAt)};const old=await XPStorage.getAnimation(row.id);if(!old||timestamp(row.updatedAt)>timestamp(old.updatedAt))await XPStorage.saveAnimation(project)}
    for(const row of remote.drawings||[]){const drawing={...row.vectorData,id:row.id,cloudOwnerId:account?.id||null,name:row.name,characterId:row.characterId,metadata:row.metadata,updatedAt:timestamp(row.updatedAt)};const old=await XPStorage.getDrawing(row.id);if(!old||timestamp(row.updatedAt)>timestamp(old.updatedAt))await XPStorage.saveDrawing(drawing)}
    if(remote.settings){
      const settings={theme:remote.settings.theme,wallpaper:remote.settings.wallpaper,updatedAt:timestamp(remote.settings.updatedAt)};localStorage.setItem('xp-settings',JSON.stringify(settings));
      if(remote.settings.desktopLayout)localStorage.setItem('xp-icon-layout',JSON.stringify(remote.settings.desktopLayout));
      document.body.classList.remove('xp-theme-olive','xp-theme-silver','xp-theme-classic','xp-wallpaper-night');
      if(settings.theme==='olive')document.body.classList.add('xp-theme-olive');if(settings.theme==='silver')document.body.classList.add('xp-theme-silver');if(settings.theme==='classic')document.body.classList.add('xp-theme-classic');if(settings.wallpaper==='night')document.body.classList.add('xp-wallpaper-night');
    }
  }
  async function sync(){
    if(syncing)throw new Error('A sync is already running');syncing=true;
    let queueId=null;
    try{
      await accountReady;
      if(!account){try{await me()}catch(error){if(navigator.onLine!==false)throw error;const cached=await XPStorage.getSetting('cloudAccount');if(cached?.id)account=cached;else throw new Error('Sign in once while online before using offline cloud sync')}}
      if(!account)throw new Error('Please sign in first');
      const local=await collectLocal(),payload={characters:local.characters,memories:local.memories,relationships:local.relationships,goals:local.goals,animations:local.animations,drawings:local.drawings,settings:local.settings};
      queueId=`${account.id}:${Date.now()}`;await XPStorage.enqueueSync({id:queueId,ownerId:account.id,createdAt:Date.now(),payload});
      if(navigator.onLine===false)return{account,queued:true,queueId,lastSyncAt};
      const queue=await XPStorage.getSyncQueue(),accountQueue=queue.filter(entry=>(entry.ownerId||String(entry.id).split(':')[0])===account.id);for(const entry of accountQueue)await request('/sync',{method:'POST',body:entry.payload});
      const remote=await request('/sync');await mergeRemote(remote);
      for(const entry of await XPStorage.getSyncQueue())if((entry.ownerId||String(entry.id).split(':')[0])===account.id)await XPStorage.removeSyncItem(entry.id);
      lastSyncAt=Date.now();await XPStorage.setSetting('lastSyncedAt',lastSyncAt);
      window.XPBus?.emit('cloud:synced',{at:lastSyncAt,account:account.username});
      return{account,lastSyncAt,characters:(remote.characters||[]).length,drawings:(remote.drawings||[]).length,animations:(remote.animations||[]).length};
    }finally{syncing=false}
  }
  window.addEventListener('online',async()=>{try{await accountReady;if(!account)await me();if(account&&await XPStorage.getSyncQueue().then(x=>x.length))await sync()}catch(error){console.info('Cloud sync will retry when connected',error.message)}});
  window.XPCloudSync=Object.freeze({me,login,register,logout,sync,collectLocal,get account(){return account},get lastSyncAt(){return lastSyncAt}});
})();
