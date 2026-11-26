'use strict';
const crypto=require('node:crypto');
const {URL}=require('node:url');
const {getDatabase,pingDatabase}=require('./database');
const COOKIE='xp_session',SESSION_MS=30*24*60*60*1000,MAX_BODY=1024*1024;
const limitBuckets=new Map(),aiThrottle=new Map();
const now=()=>new Date();
const json=(res,status,payload,extra={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin',...extra});res.end(JSON.stringify(payload))};
function hashSessionToken(value){const secret=process.env.SESSION_SECRET||'';if(Buffer.byteLength(secret)<32)throw Object.assign(new Error('SESSION_SECRET must contain at least 32 bytes'),{code:'SESSION_SECRET_NOT_CONFIGURED'});return crypto.createHmac('sha256',secret).update(value).digest('hex')}
const id=()=>crypto.randomUUID();
const object=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
const bounded=(value,max=120)=>String(value??'').trim().slice(0,max);
const isEmail=value=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)&&value.length<=254;
const isColor=value=>/^#[0-9a-f]{6}$/i.test(String(value||''));
function rateLimit(req){
  const key=`${req.socket.remoteAddress||'unknown'}:${req.url.split('?')[0]}`,time=Date.now(),entry=limitBuckets.get(key)||{start:time,count:0};
  if(time-entry.start>60000){entry.start=time;entry.count=0}entry.count++;limitBuckets.set(key,entry);
  if(limitBuckets.size>2000)for(const [k,v]of limitBuckets)if(time-v.start>120000)limitBuckets.delete(k);
  const maximum=req.url.split('?')[0]==='/api/v1/ai/think'?120:35;
  return entry.count<=maximum;
}
function cookies(req){const value=req.headers.cookie||'';return Object.fromEntries(value.split(';').map(part=>part.trim().split('=').map(decodeURIComponent)).filter(p=>p.length===2))}
function cookieHeader(token,maxAge=SESSION_MS/1000){const secure=process.env.NODE_ENV==='production'?'; Secure':'';return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`}
async function readBody(req){return new Promise((resolve,reject)=>{let size=0,chunks=[];req.on('data',chunk=>{size+=chunk.length;if(size>MAX_BODY){reject(Object.assign(new Error('Request body too large'),{status:413}));req.resume();return}chunks.push(chunk)});req.on('end',()=>{if(!chunks.length)return resolve({});try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))}catch{reject(Object.assign(new Error('Invalid JSON body'),{status:400}))}});req.on('error',reject)})}
function sameOrigin(req){const origin=req.headers.origin;if(!origin)return true;try{const parsed=new URL(origin),proxyProtocol=String(req.headers['x-forwarded-proto']||'').split(',')[0].trim(),protocol=proxyProtocol|| (req.socket.encrypted?'https':'http');return parsed.host===req.headers.host&&parsed.protocol===`${protocol}:`}catch{return false}}
async function currentUser(req){const token=cookies(req)[COOKIE];if(!token||token.length>160)return null;const {eq,and,gt}=require('drizzle-orm');const {db,schema}=getDatabase(),{users,sessions}=schema;const rows=await db.select({id:users.id,username:users.username,email:users.email}).from(sessions).innerJoin(users,eq(sessions.userId,users.id)).where(and(eq(sessions.tokenHash,hashSessionToken(token)),gt(sessions.expiresAt,now()))).limit(1);return rows[0]||null}
function clamp(n,min,max,fallback=0){const v=Number(n);return Number.isFinite(v)?Math.max(min,Math.min(max,v)):fallback}
function deriveDisposition(traits={}){const v=k=>clamp(traits[k]??.5,0,1,.5);const ranked=[['Thân thiện',v('sociability')*.55+v('empathy')*.45],['Ham khám phá',v('curiosity')*.55+v('creativity')*.45],['Năng động',v('playfulness')*.6+v('energy')*.4],['Điềm tĩnh và suy xét',v('patience')*.55+v('cautiousness')*.45],['Quyết đoán',v('confidence')*.55+v('competitiveness')*.45]].sort((a,b)=>b[1]-a[1]);return ranked[0][0]}
function cleanCharacter(value,userId){const profile=object(value.profile),personalityName=bounded(profile.personality||value.personality?.name||value.personality,40)||'Curious';return{id:bounded(value.id,100),userId,name:bounded(value.name,32)||'Stickman',color:isColor(value.color)?value.color:'#202020',personality:{name:personalityName},profile,needs:object(value.needs),energy:clamp(value.energy,0,1,.8),emotion:bounded(value.emotion,40)||'calm',currentState:bounded(value.state||value.currentState,40)||'Idle',currentGoal:bounded(value.goal||value.currentGoal,160),position:{x:clamp(value.x??value.position?.x,-100000,100000),y:clamp(value.y??value.position?.y,-100000,100000)},version:Math.max(1,Math.floor(clamp(value.version,1,100000,1))),updatedAt:new Date(Number(value.updatedAt)||Date.now())}}
function cleanMemory(value,userId){return{id:bounded(value.id,100)||id(),characterId:bounded(value.characterId,100),userId,memoryType:bounded(value.kind||value.memoryType,40)||'event',content:bounded(value.text||value.content,280),importance:clamp(value.importance,0,1,.3),confidence:clamp(value.confidence,0,1,.8),metadata:object(value.metadata),createdAt:new Date(Number(value.at||value.createdAt)||Date.now()),lastAccessed:now()}}
function cleanAnimation(value,userId){return{id:bounded(value.id,100)||id(),userId,characterId:value.characterId?bounded(value.characterId,100):null,name:bounded(value.name,120)||'Untitled Animation',fps:Math.floor(clamp(value.fps,1,60,24)),loop:!!value.loop,timeline:{version:1,duration:clamp(value.duration,1,10000,48),frames:Array.isArray(value.frames)?value.frames.slice(0,500):[]},metadata:object(value.metadata),version:Math.max(1,Math.floor(clamp(value.version,1,100000,1))),updatedAt:new Date(Number(value.updatedAt)||Date.now())}}
function cleanDrawing(value,userId){const vector=object(value.vectorData||value);const serialized=JSON.stringify(vector);if(serialized.length>350000)throw Object.assign(new Error('Drawing is larger than 350 KB'),{status:413});return{id:bounded(value.id,100)||id(),userId,characterId:value.characterId?bounded(value.characterId,100):null,name:bounded(value.name,120)||'Untitled Drawing',format:'vector-json',vectorData:vector,metadata:object(value.metadata),version:Math.max(1,Math.floor(clamp(value.version,1,100000,1))),updatedAt:new Date(Number(value.updatedAt)||Date.now())}}
function cleanRelationship(value,userId){return{id:bounded(value.id,160)||id(),userId,characterA:bounded(value.characterA,100),characterB:bounded(value.characterB,100),relationshipType:bounded(value.relationshipType,40)||'acquaintance',affinity:clamp(value.affinity,-1,1,0),interactionCount:Math.floor(clamp(value.interactionCount,0,100000,0)),metadata:object(value.metadata),updatedAt:new Date(Number(value.updatedAt)||Date.now())}}
function cleanGoal(value,userId){return{id:bounded(value.id,100)||id(),userId,characterId:bounded(value.characterId,100),goalType:bounded(value.goalType||value.type,80)||'explore',priority:clamp(value.priority,0,1,.5),progress:clamp(value.progress,0,1,0),status:['active','paused','complete','cancelled'].includes(value.status)?value.status:'active',metadata:object(value.metadata),updatedAt:new Date(Number(value.updatedAt)||Date.now())}}
async function requireUser(req,res){let user;try{user=await currentUser(req)}catch(error){json(res,503,{error:'database_unavailable',message:'Database is unavailable'});return null}if(!user){json(res,401,{error:'unauthorized',message:'Please sign in'});return null}return user}
async function handleApi(req,res){
  const url=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);if(!url.pathname.startsWith('/api/'))return false;
  if(!rateLimit(req)){json(res,429,{error:'rate_limited',message:'Too many requests'});return true}
  try{
    if(req.method==='OPTIONS'){res.writeHead(204,{'Allow':'GET, POST, PUT, PATCH, DELETE, OPTIONS','Cache-Control':'no-store'});res.end();return true}
    if(url.pathname==='/api/v1/health'&&req.method==='GET'){
      const configured=!!process.env.DATABASE_URL;let database='not_configured';if(configured){try{await pingDatabase();database='ok'}catch{database='unavailable'}}
      json(res,200,{status:'ok',database,service:'xp-living-desktop-api'});return true;
    }
    if(url.pathname==='/api/v1/ready'&&req.method==='GET'){
      try{await pingDatabase();json(res,200,{status:'ready'})}catch(error){json(res,503,{status:'not_ready',reason:error.code==='DATABASE_NOT_CONFIGURED'?'database_not_configured':'database_unavailable'})}return true;
    }
    if(!sameOrigin(req)&&!['GET','HEAD'].includes(req.method)){json(res,403,{error:'origin_rejected'});return true}

    const {db,schema}=process.env.DATABASE_URL?getDatabase():{db:null,schema:null};
    if(!db){json(res,503,{error:'database_not_configured',message:'Set DATABASE_URL on the server to enable accounts and cloud sync'});return true}
    if(Buffer.byteLength(process.env.SESSION_SECRET||'')<32){json(res,503,{error:'session_secret_not_configured',message:'Set SESSION_SECRET to a random value of at least 32 bytes'});return true}
    const {eq,and,desc,gt,lt,or}=require('drizzle-orm');
    const {users,sessions,desktopSettings,characters,characterMemories,characterRelationships,characterGoals,animationProjects,drawingAssets}=schema;
    const parts=url.pathname.split('/').filter(Boolean);

    if(parts[2]==='auth'&&parts[3]==='register'&&req.method==='POST'){
      const body=await readBody(req),username=bounded(body.username,32).toLowerCase(),email=bounded(body.email,254).toLowerCase(),password=String(body.password||'');
      if(!/^[a-zA-Z0-9_.-]{3,32}$/.test(username)||!isEmail(email)||password.length<12||password.length>256){json(res,400,{error:'validation',message:'Username must be 3–32 characters, email must be valid, and password must be 12–256 characters.'});return true}
      const argon2=require('argon2'),passwordHash=await argon2.hash(password,{type:argon2.argon2id,memoryCost:65536,timeCost:3,parallelism:1}),userId=id();
      try{const [user]=await db.insert(users).values({id:userId,username,email,passwordHash}).returning({id:users.id,username:users.username,email:users.email});await createSession(db,sessions,userId,res);json(res,201,{user})}
      catch(error){if(error.code==='23505')json(res,409,{error:'account_exists',message:'Username or email is already in use'});else throw error}return true;
    }
    if(parts[2]==='auth'&&parts[3]==='login'&&req.method==='POST'){
      const body=await readBody(req),login=bounded(body.login||body.email||body.username,254).toLowerCase(),password=String(body.password||'');
      if(!login||!password||password.length>256){json(res,400,{error:'validation',message:'Enter your username or email and password'});return true}
      const [user]=await db.select().from(users).where(or(eq(users.email,login),eq(users.username,login))).limit(1);
      const argon2=require('argon2');if(!user||!(await argon2.verify(user.passwordHash,password))){json(res,401,{error:'invalid_credentials',message:'Username, email or password is incorrect'});return true}
      await createSession(db,sessions,user.id,res);json(res,200,{user:{id:user.id,username:user.username,email:user.email}});return true;
    }
    if(parts[2]==='auth'&&parts[3]==='logout'&&req.method==='POST'){
      const token=cookies(req)[COOKIE];if(token)await db.delete(sessions).where(eq(sessions.tokenHash,hashSessionToken(token)));json(res,200,{ok:true},{'Set-Cookie':cookieHeader('',0)});return true;
    }
    if(parts[2]==='auth'&&parts[3]==='me'&&req.method==='GET'){
      const token=cookies(req)[COOKIE];let user=null;if(token){const [row]=await db.select({id:users.id,username:users.username,email:users.email}).from(sessions).innerJoin(users,eq(sessions.userId,users.id)).where(and(eq(sessions.tokenHash,hashSessionToken(token)),gt(sessions.expiresAt,now()))).limit(1);user=row||null}json(res,200,{user});return true;
    }
    const user=await requireUser(req,res);if(!user)return true;

    if(parts[2]==='ai'&&parts[3]==='status'&&req.method==='GET'){
      const brain=require('./ai-orchestrator'),provider=brain.providerInfo(),runtime=require('./llama-runtime').status(),inference=await brain.inferenceHealthCheck();
      json(res,200,{mode:provider.configured?(provider.backend==='llama.cpp'?'model-local':'model'):'local-fallback',configured:provider.configured,provider:provider.provider,backend:provider.backend,model:provider.model,requiresApiToken:provider.requiresApiToken,runtime,inference,memoryStore:!!(process.env.AI_DATABASE_URLS||process.env.AI_DATABASE_URL||process.env.DATABASE_URL)});return true;
    }
    if(parts[2]==='ai'&&parts[3]==='think'&&req.method==='POST'){
      const body=await readBody(req),incoming=object(body.character),characterId=bounded(incoming.id,100);
      if(!characterId||incoming.id!==characterId){json(res,400,{error:'validation',message:'A valid Stickman ID is required'});return true}
      const brain=require('./ai-orchestrator'),provider=brain.providerInfo();
      if(!provider.configured){json(res,200,{mode:'local-fallback',decision:null,provider});return true}
      const throttleKey=`${user.id}:${characterId}`,lastCall=aiThrottle.get(throttleKey)||0;
      if(Date.now()-lastCall<1600){json(res,429,{error:'brain_throttled',message:'Please wait before asking this character again'});return true}
      aiThrottle.set(throttleKey,Date.now());
      const [existing]=await db.select().from(characters).where(and(eq(characters.id,characterId),eq(characters.userId,user.id))).limit(1);
      if(!existing){
        const row=cleanCharacter({...incoming,profile:object(incoming.profile)},user.id);
        await db.insert(characters).values(row).onConflictDoNothing();
      }
      const [owned]=await db.select().from(characters).where(and(eq(characters.id,characterId),eq(characters.userId,user.id))).limit(1);
      if(!owned){json(res,404,{error:'character_not_found'});return true}
      const store=require('./ai-store');
      try{
        const profile=object(incoming.profile||owned.profile),clientMind=object(body.mind||profile.mind),storedMind=object(await store.loadMind(user.id,characterId));
        const cloudMemories=await store.loadExperiences(user.id,characterId,12);
        const memoryMap=new Map();
        for(const item of [...(Array.isArray(storedMind.experiences)?storedMind.experiences:[]),...(Array.isArray(clientMind.experiences)?clientMind.experiences:[]),...cloudMemories]){
          if(item?.id)memoryMap.set(String(item.id),item);
        }
        const localMemories=Array.isArray(body.memories)?body.memories.slice(-12):[];
        for(const item of localMemories)if(item?.id)memoryMap.set(String(item.id),item);
        const mergedExperiences=[...memoryMap.values()].slice(-40);
        const clientIsNewer=Number(clientMind.updatedAt||0)>=Number(storedMind.updatedAt||0);
        const mind={...clientMind,...storedMind,id:`mind-${characterId}`,characterId,seed:Number(storedMind.seed||clientMind.seed)||0,
          createdAt:storedMind.createdAt||clientMind.createdAt||Date.now(),experiences:mergedExperiences,
          experienceCount:Math.max(Number(storedMind.experienceCount)||0,Number(clientMind.experienceCount)||0,mergedExperiences.length),
          values:clientIsNewer?{...object(storedMind.values),...object(clientMind.values)}:{...object(clientMind.values),...object(storedMind.values)},
          preferences:clientIsNewer?{...object(storedMind.preferences),...object(clientMind.preferences)}:{...object(clientMind.preferences),...object(storedMind.preferences)},
          relationships:{...object(clientMind.relationships),...object(storedMind.relationships)},disposition:bounded((clientIsNewer?clientMind.disposition:storedMind.disposition)||'Đang hình thành',60)};
        const combined=new Map();for(const item of [...cloudMemories,...localMemories])if(item?.id)combined.set(String(item.id),item);
        const memories=[...combined.values()].slice(-8);
        const character={...incoming,id:characterId,profile,personality:incoming.personality||owned.personality?.name||profile.personality||'Curious',needs:object(incoming.needs),action:bounded(incoming.action,40),goal:bounded(incoming.goal,140),emotion:bounded(incoming.emotion,40)};
        const result=await brain.think({character,context:object(body.context),memories,mind});
        if(brain.isModelResult(result.mode)&&result.decision){
          const nowMs=Date.now(),experienceMap=new Map(mergedExperiences.map(item=>[String(item.id),item]));
          const incomingExperiences=new Map();
          for(const item of [...memories,...(Array.isArray(clientMind.experiences)?clientMind.experiences.slice(-5):[])])if(item?.id)incomingExperiences.set(String(item.id),item);
          for(const item of incomingExperiences.values())await store.recordExperience(user.id,characterId,item);
          if(result.decision.memory){
            const generated={id:`thought-${crypto.randomUUID()}`,kind:'reflection',text:result.decision.memory.slice(0,220),at:nowMs,importance:.42,metadata:{action:result.decision.action,source:'central-ai'}};
            experienceMap.set(generated.id,generated);await store.recordExperience(user.id,characterId,generated);
          }
          const learning=object(result.decision.learning),nextTraits={...object(profile.traits)};
          for(const [key,delta] of Object.entries(learning))if(key in nextTraits)nextTraits[key]=clamp(Number(nextTraits[key])+clamp(delta,-.025,.025),0,1);
          const nextValues={...object(mind.values)};
          if(learning.curiosity!==undefined)nextValues.curiosity=clamp(Number(nextValues.curiosity??.5)+clamp(learning.curiosity,-.025,.025),0,1);
          if(learning.empathy!==undefined)nextValues.kindness=clamp(Number(nextValues.kindness??.5)+clamp(learning.empathy,-.025,.025),0,1);
          if(learning.creativity!==undefined)nextValues.creativity=clamp(Number(nextValues.creativity??.5)+clamp(learning.creativity,-.025,.025),0,1);
          if(learning.confidence!==undefined)nextValues.independence=clamp(Number(nextValues.independence??.5)+clamp(learning.confidence,-.025,.025),0,1);
          const nextExperiences=[...experienceMap.values()].slice(-40);
          const addedCount=Math.max(0,nextExperiences.length-mergedExperiences.length);
          const nextMind={...mind,values:nextValues,experienceCount:Math.max(mind.experienceCount+addedCount,nextExperiences.length),experiences:nextExperiences,
            disposition:deriveDisposition(nextTraits),lastReasoning:result.decision.thought||'',lastThoughtAt:nowMs,updatedAt:nowMs,model:{provider:provider.provider,status:'connected'}};
          const nextProfile={...profile,traits:nextTraits,mind:nextMind};
          await store.saveMind(user.id,characterId,nextMind);
          await store.recordDecision(user.id,characterId,result.decision);
          await db.update(characters).set({profile:nextProfile,updatedAt:now()}).where(and(eq(characters.id,characterId),eq(characters.userId,user.id)));
          json(res,200,{...result,mind:nextMind,profile:nextProfile});return true;
        }
        json(res,200,{mode:'local-fallback',decision:null,provider});return true;
      }catch(error){
        console.error('Stickman AI orchestration error:',error.message);
        json(res,503,{error:'brain_unavailable',message:'The central AI brain or its memory database is temporarily unavailable'});return true;
      }
    }

    if(parts[2]==='desktop'&&parts[3]==='settings'){
      if(req.method==='GET'){const [row]=await db.select().from(desktopSettings).where(eq(desktopSettings.userId,user.id)).limit(1);json(res,200,{settings:row||null});return true}
      if(req.method==='PUT'){const b=await readBody(req),theme=['blue','olive','silver','classic'].includes(b.theme)?b.theme:'blue',wallpaper=['bliss','night'].includes(b.wallpaper)?b.wallpaper:'bliss';const [row]=await db.insert(desktopSettings).values({id:id(),userId:user.id,theme,wallpaper,desktopLayout:object(b.desktopLayout),preferences:object(b.preferences),updatedAt:now()}).onConflictDoUpdate({target:desktopSettings.userId,set:{theme,wallpaper,desktopLayout:object(b.desktopLayout),preferences:object(b.preferences),updatedAt:now()}}).returning();json(res,200,{settings:row});return true}
    }
    if(parts[2]==='characters'){
      if(parts.length===3&&req.method==='GET'){const rows=await db.select().from(characters).where(eq(characters.userId,user.id)).orderBy(desc(characters.updatedAt));json(res,200,{characters:rows});return true}
      if(parts.length===3&&req.method==='POST'){const b=await readBody(req),row=cleanCharacter(b,user.id);if(!row.id){json(res,400,{error:'validation',message:'Character ID is required'});return true}const [created]=await db.insert(characters).values(row).returning();json(res,201,{character:created});return true}
      const characterId=parts[3];if(!characterId){json(res,404,{error:'not_found'});return true}
      if(parts.length===4&&req.method==='GET'){const [row]=await db.select().from(characters).where(and(eq(characters.id,characterId),eq(characters.userId,user.id))).limit(1);if(!row){json(res,404,{error:'not_found'});return true}json(res,200,{character:row});return true}
      if(parts.length===4&&req.method==='PUT'){const b=await readBody(req),row=cleanCharacter({...b,id:characterId},user.id);const [updated]=await db.update(characters).set({...row,updatedAt:now(),version:row.version+1}).where(and(eq(characters.id,characterId),eq(characters.userId,user.id))).returning();if(!updated){json(res,404,{error:'not_found'});return true}json(res,200,{character:updated});return true}
      if(parts.length===4&&req.method==='DELETE'){const [deleted]=await db.delete(characters).where(and(eq(characters.id,characterId),eq(characters.userId,user.id))).returning({id:characters.id});if(!deleted){json(res,404,{error:'not_found'});return true}json(res,200,{ok:true});return true}
      if(parts[4]==='memories'&&req.method==='GET'){const owned=await db.select({id:characters.id}).from(characters).where(and(eq(characters.id,characterId),eq(characters.userId,user.id))).limit(1);if(!owned.length){json(res,404,{error:'not_found'});return true}const rows=await db.select().from(characterMemories).where(and(eq(characterMemories.characterId,characterId),eq(characterMemories.userId,user.id))).orderBy(desc(characterMemories.createdAt)).limit(500);json(res,200,{memories:rows});return true}
      if(parts[4]==='relationships'&&req.method==='GET'){const owned=await db.select({id:characters.id}).from(characters).where(and(eq(characters.id,characterId),eq(characters.userId,user.id))).limit(1);if(!owned.length){json(res,404,{error:'not_found'});return true}const rows=await db.select().from(characterRelationships).where(and(eq(characterRelationships.userId,user.id),or(eq(characterRelationships.characterA,characterId),eq(characterRelationships.characterB,characterId))));json(res,200,{relationships:rows});return true}
    }
    if(parts[2]==='animations'){
      if(req.method==='GET'&&parts.length===3){const rows=await db.select().from(animationProjects).where(eq(animationProjects.userId,user.id)).orderBy(desc(animationProjects.updatedAt));json(res,200,{animations:rows});return true}
      if(req.method==='POST'&&parts.length===3){const b=await readBody(req),row=cleanAnimation(b,user.id),[created]=await db.insert(animationProjects).values(row).returning();json(res,201,{animation:created});return true}
      const animationId=parts[3];if(animationId&&req.method==='PUT'){const b=await readBody(req),row=cleanAnimation({...b,id:animationId},user.id),[updated]=await db.update(animationProjects).set(row).where(and(eq(animationProjects.id,animationId),eq(animationProjects.userId,user.id))).returning();if(!updated){json(res,404,{error:'not_found'});return true}json(res,200,{animation:updated});return true}
      if(animationId&&req.method==='DELETE'){const [deleted]=await db.delete(animationProjects).where(and(eq(animationProjects.id,animationId),eq(animationProjects.userId,user.id))).returning({id:animationProjects.id});if(!deleted){json(res,404,{error:'not_found'});return true}json(res,200,{ok:true});return true}
    }
    if(parts[2]==='drawings'){
      if(req.method==='GET'&&parts.length===3){const rows=await db.select().from(drawingAssets).where(eq(drawingAssets.userId,user.id)).orderBy(desc(drawingAssets.updatedAt));json(res,200,{drawings:rows});return true}
      if(req.method==='POST'&&parts.length===3){const b=await readBody(req),row=cleanDrawing(b,user.id),[created]=await db.insert(drawingAssets).values(row).returning();json(res,201,{drawing:created});return true}
      const drawingId=parts[3];if(drawingId&&req.method==='PUT'){const b=await readBody(req),row=cleanDrawing({...b,id:drawingId},user.id),[updated]=await db.update(drawingAssets).set(row).where(and(eq(drawingAssets.id,drawingId),eq(drawingAssets.userId,user.id))).returning();if(!updated){json(res,404,{error:'not_found'});return true}json(res,200,{drawing:updated});return true}
      if(drawingId&&req.method==='DELETE'){const [deleted]=await db.delete(drawingAssets).where(and(eq(drawingAssets.id,drawingId),eq(drawingAssets.userId,user.id))).returning({id:drawingAssets.id});if(!deleted){json(res,404,{error:'not_found'});return true}json(res,200,{ok:true});return true}
    }
    if(parts[2]==='sync'&&req.method==='GET'){
      const [settings,charRows,animRows,drawingRows]=await Promise.all([
        db.select().from(desktopSettings).where(eq(desktopSettings.userId,user.id)).limit(1),db.select().from(characters).where(eq(characters.userId,user.id)),db.select().from(animationProjects).where(eq(animationProjects.userId,user.id)),db.select().from(drawingAssets).where(eq(drawingAssets.userId,user.id))]);
      const charIds=charRows.map(x=>x.id);let memories=[],relationships=[],goals=[];if(charIds.length){memories=await db.select().from(characterMemories).where(eq(characterMemories.userId,user.id)).orderBy(desc(characterMemories.createdAt)).limit(5000);relationships=await db.select().from(characterRelationships).where(eq(characterRelationships.userId,user.id));goals=await db.select().from(characterGoals).where(eq(characterGoals.userId,user.id))}
      json(res,200,{settings:settings[0]||null,characters:charRows,memories,relationships,goals,animations:animRows,drawings:drawingRows,serverTime:Date.now()});return true;
    }
    if(parts[2]==='sync'&&req.method==='POST'){
      const b=await readBody(req),arrays=['characters','memories','relationships','goals','animations','drawings'];for(const key of arrays)if(b[key]!==undefined&&(!Array.isArray(b[key])||b[key].length>200)){json(res,400,{error:'validation',message:`${key} must be an array with at most 200 entries`});return true}
      await db.transaction(async tx=>{
        for(const item of b.characters||[]){
          const row=cleanCharacter(item,user.id);if(!row.id)continue;
          await tx.insert(characters).values(row).onConflictDoNothing();
          await tx.update(characters).set({...row,updatedAt:row.updatedAt,version:row.version+1}).where(and(eq(characters.id,row.id),eq(characters.userId,user.id),lt(characters.updatedAt,row.updatedAt)));
        }
        const ownedRows=await tx.select({id:characters.id}).from(characters).where(eq(characters.userId,user.id));
        const ownedIds=new Set(ownedRows.map(row=>row.id));
        for(const item of b.memories||[]){
          const row=cleanMemory(item,user.id);if(!row.characterId||!row.content||!ownedIds.has(row.characterId))continue;
          await tx.insert(characterMemories).values(row).onConflictDoNothing();
        }
        for(const item of b.relationships||[]){
          const row=cleanRelationship(item,user.id);
          if(!row.characterA||!row.characterB||row.characterA===row.characterB||!ownedIds.has(row.characterA)||!ownedIds.has(row.characterB))continue;
          const [a,c]=[row.characterA,row.characterB].sort();row.characterA=a;row.characterB=c;
          await tx.insert(characterRelationships).values(row).onConflictDoNothing();
          await tx.update(characterRelationships).set({...row,updatedAt:row.updatedAt}).where(and(eq(characterRelationships.userId,user.id),eq(characterRelationships.characterA,a),eq(characterRelationships.characterB,c),lt(characterRelationships.updatedAt,row.updatedAt)));
        }
        for(const item of b.goals||[]){
          const row=cleanGoal(item,user.id);if(!row.characterId||!ownedIds.has(row.characterId))continue;
          await tx.insert(characterGoals).values(row).onConflictDoNothing();
          await tx.update(characterGoals).set(row).where(and(eq(characterGoals.id,row.id),eq(characterGoals.userId,user.id),lt(characterGoals.updatedAt,row.updatedAt)));
        }
        for(const item of b.animations||[]){
          const row=cleanAnimation(item,user.id);if(row.characterId&&!ownedIds.has(row.characterId))continue;
          await tx.insert(animationProjects).values(row).onConflictDoNothing();
          await tx.update(animationProjects).set(row).where(and(eq(animationProjects.id,row.id),eq(animationProjects.userId,user.id),lt(animationProjects.updatedAt,row.updatedAt)));
        }
        for(const item of b.drawings||[]){
          const row=cleanDrawing(item,user.id);if(row.characterId&&!ownedIds.has(row.characterId))continue;
          await tx.insert(drawingAssets).values(row).onConflictDoNothing();
          await tx.update(drawingAssets).set(row).where(and(eq(drawingAssets.id,row.id),eq(drawingAssets.userId,user.id),lt(drawingAssets.updatedAt,row.updatedAt)));
        }
        if(b.settings){const x=b.settings,incomingAt=new Date(Number(x.updatedAt)||Date.now()),[currentSettings]=await tx.select({updatedAt:desktopSettings.updatedAt}).from(desktopSettings).where(eq(desktopSettings.userId,user.id)).limit(1);if(!currentSettings||new Date(currentSettings.updatedAt).getTime()<incomingAt.getTime()){const values={id:id(),userId:user.id,theme:['blue','olive','silver','classic'].includes(x.theme)?x.theme:'blue',wallpaper:['bliss','night'].includes(x.wallpaper)?x.wallpaper:'bliss',desktopLayout:object(x.desktopLayout),preferences:object(x.preferences),updatedAt:incomingAt};await tx.insert(desktopSettings).values(values).onConflictDoUpdate({target:desktopSettings.userId,set:{theme:values.theme,wallpaper:values.wallpaper,desktopLayout:values.desktopLayout,preferences:values.preferences,updatedAt:incomingAt}})}}
      });json(res,200,{ok:true,serverTime:Date.now(),policy:'last-write-wins-by-updatedAt'});return true;
    }
    json(res,404,{error:'not_found',message:'API route not found'});return true;
  }catch(error){
    const status=error.status||(error.code==='DATABASE_NOT_CONFIGURED'||error.code==='ECONNREFUSED'?503:500);if(status>=500)console.error('API request failed:',error.message);
    json(res,status,{error:status>=500?'server_error':error.code||'bad_request',message:status>=500?'The request could not be completed':error.message||'Bad request'});return true;
  }
}
async function createSession(db,sessions,userId,res){const token=crypto.randomBytes(32).toString('base64url'),expires=new Date(Date.now()+SESSION_MS);await db.insert(sessions).values({id:id(),userId,tokenHash:hashSessionToken(token),expiresAt:expires});res.setHeader('Set-Cookie',cookieHeader(token))}
module.exports={handleApi};
