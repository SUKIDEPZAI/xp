(() => {
  const desk=document.getElementById('desk');
  const canvas=document.createElement('canvas');canvas.className='stickman-layer';canvas.setAttribute('aria-hidden','true');desk.append(canvas);
  const ctx=canvas.getContext('2d'),agents=new Map(),particles=[];
  let lastFrame=0,lastAI=0,lastSave=0,animationFrame=0,running=false,visible=true;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const uid=()=>globalThis.crypto?.randomUUID?.()||`char-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const action=value=>window.XPActions?.normalize(value)||'idle';
  const stateNames={observe:'Quan sát',curious:'Tò mò',explore:'Khám phá',walk:'Đang đi',run:'Đang chạy',sneak:'Đi rón rén',follow:'Đang theo',avoid:'Đang né',jump:'Đang nhảy',fall:'Đang rơi',climb:'Đang leo',hang:'Đang bám',grab:'Đang nắm',drag:'Đang kéo',push:'Đang đẩy',pull:'Đang kéo về',wave:'Đang vẫy tay',think:'Đang suy nghĩ',talk:'Đang trò chuyện',draw:'Đang vẽ',interact:'Đang tương tác',play:'Đang chơi',rest:'Đang nghỉ',sleep:'Đang ngủ',celebrate:'Ăn mừng',startled:'Giật mình',escape:'Đang chạy trốn',socialize:'Đang giao tiếp',create:'Đang sáng tạo',idle:'Đứng yên'};
  function resize(){const dpr=Math.max(1,Math.min(2,window.devicePixelRatio||1)),w=desk.clientWidth,h=desk.clientHeight;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=`${w}px`;canvas.style.height=`${h}px`;ctx.setTransform(dpr,0,0,dpr,0,0)}
  if(window.ResizeObserver)new ResizeObserver(resize).observe(desk);else window.addEventListener('resize',resize);resize();
  function safeAgent(a={}){
    const id=String(a.id||uid()),rawProfile=a.profile||XPAI.profile(a.name,id,a.personality),color=/^#[0-9a-f]{6}$/i.test(a.color||'')?a.color:'#202020';
    const profile={...rawProfile,appearance:window.XPStickmanAppearance?.normalize(rawProfile.appearance,color)||rawProfile.appearance||null};
    profile.mind=XPAI.normalizeMind?.(rawProfile.mind,id,profile)||rawProfile.mind||XPAI.createMind?.(id,profile)||null;
    return{id,name:String(a.name||'Stickman').slice(0,32),color,personality:profile.personality||a.personality||'Curious',profile,
      state:a.state||'Idle',action:action(a.action),goal:String(a.goal||'Explore the desktop').slice(0,120),
      energy:Number.isFinite(a.energy)?clamp(a.energy,0,1):.8,happiness:Number.isFinite(a.happiness)?clamp(a.happiness,0,1):.6,
      needs:XPAI.normalizeNeeds(a.needs),emotion:a.emotion||'calm',goals:Array.isArray(a.goals)?a.goals.slice(0,30):[],repetition:Number.isFinite(a.repetition)?a.repetition:0,previousAction:action(a.previousAction||'idle'),
      x:Number.isFinite(a.x)?a.x:80+Math.random()*Math.max(80,desk.clientWidth-160),y:Number.isFinite(a.y)?a.y:desk.clientHeight-8,vx:Number.isFinite(a.vx)?a.vx:0,vy:Number.isFinite(a.vy)?a.vy:0,
      facing:a.facing===-1?-1:1,follow:!!a.follow,stay:!!a.stay,createdAt:a.createdAt||Date.now(),cloudOwnerId:a.cloudOwnerId||null,relationships:a.relationships&&typeof a.relationships==='object'?a.relationships:{},userAffinity:Number.isFinite(a.userAffinity)?a.userAffinity:0,
      memoryCount:Number.isFinite(a.memoryCount)?a.memoryCount:0,lastActionAt:a.lastActionAt||0,lastEventAt:a.lastEventAt||0,lastDrawingAt:a.lastDrawingAt||0,lastAnimationAt:a.lastAnimationAt||0,memorySnapshot:Array.isArray(a.memorySnapshot)?a.memorySnapshot.slice(-180):[],cooldowns:a.cooldowns&&typeof a.cooldowns==='object'?a.cooldowns:{},bubble:'',bubbleUntil:0,poseTime:0,goalX:Number.isFinite(a.goalX)?a.goalX:null,actionStartedAt:a.actionStartedAt||Date.now(),visitedObjects:Array.isArray(a.visitedObjects)?a.visitedObjects.slice(-60):[],autonomy:a.autonomy!==false,brainBusy:false,brainNextAt:Number(a.brainNextAt)||0,modelDecision:null,modelDecisionUntil:0,motionProject:null,motionStartedAt:0,lastBrainAnimationSavedAt:Number(a.lastBrainAnimationSavedAt)||0,innerThought:String(a.innerThought||'').slice(0,320)};
  }
  async function persist(agent){try{const {bubble,bubbleUntil,poseTime,memorySnapshot,brainBusy,brainNextAt,modelDecision,modelDecisionUntil,motionProject,motionStartedAt,...value}=agent;await XPStorage.saveCharacter({...value,updatedAt:Date.now()})}catch(error){console.warn('Không thể lưu stickman',error)}}
  async function addMemory(agent,message,kind='event',importance=.35,metadata={}){
    const content=String(message).slice(0,280),record={id:uid(),characterId:agent.id,text:content,kind:String(kind).slice(0,40),importance:clamp(importance,0,1),confidence:clamp(metadata.confidence??.8,0,1),metadata:{...metadata},at:Date.now(),createdAt:Date.now()};
    try{
      const current=await XPStorage.getMemories(agent.id);const duplicate=current.find(m=>m.text===content&&Date.now()-(m.at||0)<120000);
      if(duplicate)return duplicate;
      await XPStorage.addMemory(record);agent.memorySnapshot=[...(agent.memorySnapshot||current),record].slice(-180);XPAI.learnFromExperience?.(agent,record);const all=[...current,record];
      if(all.length>180){all.sort((a,b)=>((a.importance||.2)*.7+(a.confidence||.5)*.2+(1-Math.min(1,(Date.now()-(a.at||0))/(45*86400000)))*.1)-((b.importance||.2)*.7+(b.confidence||.5)*.2+(1-Math.min(1,(Date.now()-(b.at||0))/(45*86400000)))*.1));for(const old of all.slice(0,all.length-180))await XPStorage.deleteMemory(old.id)}
      agent.memoryCount=Math.min(all.length,180);await persist(agent);XPBus.emit('stickman:memory',{id:agent.id,name:agent.name,text:content,kind});return record;
    }catch(error){console.warn('Memory storage error',error);return null}
  }
  function bubble(agent,message,duration=2300){agent.bubble=String(message).slice(0,80);agent.bubbleUntil=Date.now()+duration}
  function setAction(agent,next){
    const normalized=action(next);if(agent.action===normalized)return;
    agent.action=normalized;agent.state=stateNames[normalized]||normalized;agent.lastActionAt=Date.now();agent.actionStartedAt=Date.now();
    agent.goal=({observe:'Quan sát hoạt động trên desktop',explore:'Khám phá một vùng desktop mới',socialize:'Tìm một người bạn để trò chuyện',play:'Chơi một trò vui',create:'Tạo một tác phẩm mới',rest:'Nạp lại năng lượng',follow:'Theo dõi con trỏ mô phỏng',think:'Suy nghĩ về những sự kiện gần đây',wave:'Chào người dùng',draw:'Tự vẽ một hình mới',climb:'Khám phá cạnh cửa sổ',celebrate:'Chia sẻ niềm vui'})[normalized]||`Thực hiện: ${stateNames[normalized]||normalized}`;
    XPBus.emit('stickman:action',{id:agent.id,name:agent.name,action:normalized,state:agent.state});
  }
  function addParticle(x,y,color='#ffd45c',count=5){for(let i=0;i<count;i++)particles.push({x,y,vx:(Math.random()-.5)*2.6,vy:-Math.random()*2.4,life:1,color})}
  function nearbyAgent(agent){let best=null,distance=Infinity;for(const other of agents.values()){if(other.id===agent.id)continue;const d=Math.hypot(other.x-agent.x,other.y-agent.y);if(d<distance){distance=d;best=other}}return best&&distance<260?{agent:best,distance}:null}
  function nearestWorld(agent){const objects=window.XPPerception?.near(agent.x,agent.y,260)||[];return objects.sort((a,b)=>Math.hypot(a.bounds.x+a.bounds.width/2-agent.x,a.bounds.y+a.bounds.height/2-agent.y)-Math.hypot(b.bounds.x+b.bounds.width/2-agent.x,b.bounds.y+b.bounds.height/2-agent.y))[0]||null}
  async function createArtwork(agent){
    if(Date.now()-(agent.cooldowns.artwork||0)<45000)return;
    agent.cooldowns.artwork=Date.now();
    try{const drawing=await XPDrawing.generateAndSave(agent);agent.lastDrawingAt=Date.now();bubble(agent,'Mình vừa tạo một bức tranh!');addParticle(agent.x,agent.y-42,agent.color,9);await addMemory(agent,`Đã hoàn thành tác phẩm “${drawing.name}”.`,'creative',.9,{drawingId:drawing.id});XPBus.emit('desktop:event',{kind:'stickman-created-artwork',id:agent.id,drawingId:drawing.id});}
    catch(error){console.warn('Không thể tạo tác phẩm',error);bubble(agent,'Ý tưởng chưa thành hình…')}
  }
  async function createAnimation(agent,{force=false}={}){
    if(!force&&Date.now()-(agent.cooldowns.animation||0)<90000)return null;
    agent.cooldowns.animation=Date.now();
    try{
      const project=await XPAnimation.generateAndSave(agent);
      agent.lastAnimationAt=Date.now();
      bubble(agent,'Mình vừa tự tạo một hoạt ảnh riêng!');addParticle(agent.x,agent.y-42,'#8bd4ff',10);
      await addMemory(agent,`Đã tự tạo hoạt ảnh “${project.name}”.`,'creative',.94,{animationId:project.id,generator:project.metadata?.generator});
      XPBus.emit('desktop:event',{kind:'stickman-created-animation',id:agent.id,animationId:project.id});
      return project;
    }catch(error){console.warn('Không thể tạo hoạt ảnh',error);bubble(agent,'Hoạt ảnh chưa hoàn thành…');return null}
  }
  async function socialMeet(agent,other){
    if(!other)return;
    const before=Number(agent.relationships[other.id]||0);agent.relationships[other.id]=clamp(before+1,0,100);other.relationships[agent.id]=clamp(Number(other.relationships[agent.id]||0)+1,0,100);
    agent.vx*=.25;other.vx*=.25;bubble(agent,`Chào ${other.name}!`);bubble(other,`Chào ${agent.name}!`);addParticle((agent.x+other.x)/2,Math.min(agent.y,other.y)-36,'#ffe17b',8);
    await addMemory(agent,`Gặp và chào ${other.name}.`,'social',.72,{relatedCharacter:other.id});await addMemory(other,`Gặp và chào ${agent.name}.`,'social',.72,{relatedCharacter:agent.id});
    agent.cooldowns.social=Date.now()+9000;other.cooldowns.social=Date.now()+9000;
  }
  function execute(agent,decision,context,now){
    if(agent.follow&&context.pointer.active)decision='follow';if(agent.stay&&['explore','walk','run','follow'].includes(decision))decision='observe';
    setAction(agent,decision);
    if(decision==='explore'||decision==='walk'||decision==='run'||decision==='sneak'){
      if(agent.goalX===null||Math.abs(agent.x-agent.goalX)<20){agent.goalX=20+Math.random()*Math.max(40,desk.clientWidth-40);agent.visitedObjects=agent.visitedObjects.slice(-60)}
      const speed=decision==='run'?1.25:decision==='sneak'?.24:.62;agent.vx+=Math.sign(agent.goalX-agent.x)*speed;agent.facing=Math.sign(agent.goalX-agent.x)||agent.facing;
    }else if(decision==='follow'){
      if(context.pointer.active){agent.vx+=(context.pointer.x-agent.x)*.0018;agent.facing=Math.sign(context.pointer.x-agent.x)||agent.facing}
      else if(context.pointer.lastKnown){agent.goalX=context.pointer.lastKnown.x;agent.vx+=Math.sign(agent.goalX-agent.x)*.28}
    }else if(decision==='avoid'){
      const dx=agent.x-context.pointer.x;agent.vx+=Math.sign(dx||agent.facing)*.85;agent.facing=Math.sign(dx)||agent.facing;
    }else if(decision==='jump'){
      if(Math.abs(agent.vy)<.5)agent.vy=-7.2;
    }else if(decision==='wave'){
      if(now-agent.lastEventAt>7000){bubble(agent,'Xin chào!');agent.lastEventAt=now;addMemory(agent,'Đã chào người dùng.','interaction',.62)}
    }else if(decision==='think')bubble(agent,'Đang suy nghĩ…',1000);
    else if(decision==='rest'||decision==='sleep'){
      agent.vx*=.65;if(agent.needs.energy>.86&&decision==='sleep')bubble(agent,'Zzz…',1400);
    }else if(decision==='socialize'){
      const meeting=nearbyAgent(agent);if(meeting&&meeting.distance<62&&now>(agent.cooldowns.social||0))socialMeet(agent,meeting.agent);else if(meeting){agent.goalX=meeting.agent.x;agent.vx+=Math.sign(meeting.agent.x-agent.x)*.48}
      else if(now-(agent.cooldowns.social||0)>5000)bubble(agent,'Đang tìm bạn…',1100);
    }else if(decision==='create'){
      if(context.animationNeeded&&(agent.profile.traits.creativity||0)>.65)createAnimation(agent);else createArtwork(agent);agent.vx*=.5;
    }else if(decision==='draw'){
      createArtwork(agent);agent.vx*=.5;
    }else if(decision==='play'){
      if(Math.abs(agent.vy)<.5)agent.vy=-5.3;addParticle(agent.x,agent.y-30,'#8bd4ff',3);
    }else if(decision==='startled'){
      agent.vx+=agent.facing*-1*1.2;agent.vy=-3;bubble(agent,'Ồ!');
    }else if(decision==='climb'){
      const target=nearestWorld(agent);if(target?.type==='window'){agent.goalX=target.bounds.x+target.bounds.width/2;agent.vx+=Math.sign(agent.goalX-agent.x)*.4;agent.vy=-.22}else setAction(agent,'explore');
    }else if(decision==='interact'){
      const target=nearestWorld(agent);if(target?.type==='icon'){bubble(agent,'Có gì bên trong nhỉ?');XPInteraction.openApp(target.id.split(':')[1])}else if(target?.type==='tab'){setAction(agent,'tab-prank');bubble(agent,'Để xem tab này rung thế nào!');XPInteraction.playTabPrank(target.id.slice(4))}
    }
    const abilities=agent.profile.abilities||[];
    if(now-(agent.cooldowns.ability||0)>24000&&agent.energy>.48&&abilities.length&&Math.random()<.06){activateAbility(agent,abilities[(now>>4)%abilities.length]);agent.cooldowns.ability=now}
  }
  function activateAbility(agent,ability){
    const effects={blink:()=>{agent.x=clamp(agent.x+(agent.facing||1)*72,20,desk.clientWidth-20);bubble(agent,'Shadow Step!')},echo:()=>{setAction(agent,'wave');bubble(agent,'Echo Motion!')},bounce:()=>{agent.vy=-8;bubble(agent,'Energy Bounce!')},float:()=>{agent.vy=-5;bubble(agent,'Gravity Shift!')},draw:()=>createArtwork(agent),speed:()=>{agent.vx+=(agent.facing||1)*4;bubble(agent,'Super Speed!')},spark:()=>{addParticle(agent.x,agent.y-28,'#ffe066',12);bubble(agent,'Spark Burst!')},build:()=>{addParticle(agent.x,agent.y-15,'#7fd4ff',8);bubble(agent,'Tiny Builder!')}};
    effects[ability.effect]?.();addMemory(agent,`Đã sử dụng năng lực ${ability.name}.`,'ability',.65);
  }
  function applyBrainDecision(agent,result,{showReply=false}={}){
    const decision=result?.decision;if(!decision)return false;
    const traits={...(agent.profile?.traits||{})};
    for(const [key,delta] of Object.entries(decision.learning||{}))if(key in traits){const amount=Number(delta);if(Number.isFinite(amount))traits[key]=clamp(traits[key]+clamp(amount,-.025,.025),0,1)}
    const previousMind=agent.profile?.mind||XPAI.createMind?.(agent.id,agent.profile)||{};
    agent.profile={...agent.profile,traits,mind:{...previousMind,...(result.mind||{}),lastReasoning:String(decision.thought||'').slice(0,320),lastThoughtAt:Date.now(),model:{provider:result.provider?.provider||'central-ai',status:'connected'}}};
    if(decision.goal)agent.goal=String(decision.goal).slice(0,140);
    if(decision.emotion)agent.emotion=decision.emotion;
    agent.innerThought=String(decision.thought||'').slice(0,320);
    agent.modelDecision=decision;agent.modelDecisionUntil=Date.now()+9000;
    if(decision.animation&&window.XPAnimation?.fromMotionPlan){
      try{agent.motionProject=XPAnimation.fromMotionPlan(agent,{...decision.animation,action:decision.action});agent.motionStartedAt=performance.now();if(Date.now()-(agent.lastBrainAnimationSavedAt||0)>60000){agent.lastBrainAnimationSavedAt=Date.now();XPAnimation.save(agent.motionProject).catch(error=>console.warn('Could not save AI motion project',error))}}catch(error){console.warn('Invalid AI motion plan',error);agent.motionProject=null}
    }
    if(showReply&&decision.reply)bubble(agent,decision.reply,6500);
    if(showReply&&decision.memory)addMemory(agent,decision.memory,'important',.42,{source:'central-ai'});
    persist(agent);return true;
  }
  function requestBrain(agent,context={}, {force=false,showReply=false}={}){
    const now=Date.now();if(!window.XPBrain||agent.brainBusy||(!force&&(!agent.autonomy||now<(agent.brainNextAt||0))))return Promise.resolve(null);
    agent.brainBusy=true;agent.brainNextAt=now+25000;
    return window.XPBrain.think(agent,context).then(result=>{
      if(result?.mode==='model'&&result.decision){applyBrainDecision(agent,result,{showReply});return result}
      agent.profile={...agent.profile,mind:{...(agent.profile?.mind||{}),model:{provider:'server-gateway',status:'local-fallback'}}};agent.brainNextAt=Date.now()+60000;persist(agent);return result;
    }).catch(error=>{
      agent.profile={...agent.profile,mind:{...(agent.profile?.mind||{}),model:{provider:'server-gateway',status:'unavailable'}}};
      agent.brainNextAt=Date.now()+(error.status===401?120000:60000);console.warn(`Central AI unavailable for ${agent.name}:`,error.message);return null;
    }).finally(()=>{agent.brainBusy=false});
  }
  function updateGoal(agent,context,now){
    let goal=agent.goals.find(item=>item.status==='active');
    if(goal){
      const target=goal.type==='friend'?'socialize':goal.type==='draw'?'create':goal.type;
      if(agent.action===target)goal.progress=clamp((goal.progress||0)+.16,0,1);
      goal.updatedAt=now;
      if(goal.progress>=1||now-(goal.createdAt||now)>90000){goal.status='complete';goal.completedAt=now;goal=null}
    }
    if(!goal){
      const t=agent.profile.traits||{},n=agent.needs;
      const choices=[
        ['explore',t.curiosity*.38+n.exploration*.46+(context.unvisitedIcon?.18:0)],
        ['socialize',t.sociability*.35+t.empathy*.2+n.social*.35+(context.nearCharacter?.22:0)],
        ['create',t.creativity*.42+n.creativity*.3+(context.animationNeeded?.18:0)],
        ['play',t.playfulness*.4+n.entertainment*.35],
        ['rest',(1-n.energy)*.8+(1-n.comfort)*.15]
      ].sort((a,b)=>b[1]-a[1]);
      const chosen=choices[0];
      goal={id:uid(),type:chosen[0],status:'active',priority:clamp(chosen[1],.1,1),progress:0,createdAt:now,updatedAt:now};
      agent.goals=[...agent.goals.filter(item=>item.status==='active').map(item=>({...item,status:'complete',completedAt:now})),goal].slice(-20);
      agent.currentGoal=goal.type;agent.goal=({explore:'Khám phá desktop',socialize:'Kết nối với Stickman khác',create:'Tạo tác phẩm mới',play:'Tìm trò chơi',rest:'Nghỉ ngơi và hồi phục'})[goal.type]||goal.type;
    }
    return goal;
  }
  function plan(now){
    const pointer=window.XPPerception?.pointer()||{active:false,x:0,y:0,movingAt:0},objects=window.XPPerception?.scan()||[],events=window.XPPerception?.events()||[];
    for(const agent of agents.values()){
      agent.needs=XPAI.decayNeeds(agent.needs,1000,agent.action);agent.energy=agent.needs.energy;
      const near=nearbyAgent(agent),world=nearestWorld(agent),recent=events.at(-1),memoryCue=world?.type||recent?.type||'';
      const recalled=memoryCue?XPAI.retrieveMemories(agent.memorySnapshot||[],{query:memoryCue,event:recent?.type||''}):[];
      agent.recalledMemoryIds=recalled.slice(0,4).map(memory=>memory.id);
      const memoryKinds=new Set(recalled.map(memory=>memory.kind||memory.memoryType));
      const pointerNear=pointer.active&&Math.hypot(pointer.x-agent.x,pointer.y-agent.y)<190;
      const context={pointer,pointerNear,userActive:Date.now()-pointer.movingAt<5000,nearCharacter:!!near,newFriend:!!near&&!(agent.relationships[near.agent.id]>0),newObject:!!world&&world.id!==agent.lastWorldObject,
        unvisitedIcon:objects.some(o=>o.type==='icon'&&!agent.visitedObjects.includes(o.id)),paintOpen:[...document.querySelectorAll('.win[data-app-id="paint"]')].length>0,
        memoryMatch:(!!recent&&now-recent.at<60000)||recalled.length>0,memoryCue:!!memoryCue,socialMemory:memoryKinds.has('social'),creativeMemory:memoryKinds.has('creative'),
        artworkNeeded:now-(agent.lastDrawingAt||0)>120000,animationNeeded:now-(agent.lastAnimationAt||0)>180000};
      updateGoal(agent,context,now);
      agent.emotion=XPAI.emotion(agent,{...context,surprise:recent&&now-recent.at<700&&recent.type==='window-open'});
      if(world&&world.id!==agent.lastWorldObject){agent.lastWorldObject=world.id;if(world.type==='icon')agent.visitedObjects.push(world.id)}
      if(agent.autonomy){
        agent.repetition=agent.previousAction===agent.action?agent.repetition+1:0;agent.previousAction=agent.action;
        const modelDecision=agent.modelDecision&&Date.now()<agent.modelDecisionUntil?agent.modelDecision:null;
        const decision=modelDecision?.action||XPAI.decide(agent,context);execute(agent,decision,context,now);
      }
      const newestEvent=recent?.type?`${recent.type}: ${recent.label||recent.title||''}`:'';
      if(agent.autonomy)requestBrain(agent,{event:newestEvent,nearbyObject:world?.label||world?.type||'',pointerNear,nearCharacter:!!near,paintOpen:context.paintOpen});
    }
  }
  function physics(dt){
    const floor=desk.clientHeight-8;
    for(const agent of agents.values()){
      const motion=window.XPWasm?.integrateMotion({x:agent.x,y:agent.y,vx:agent.vx,vy:agent.vy,dt,floor,width:desk.clientWidth,stay:agent.stay,wandering:['walk','run','explore','follow','sneak','escape'].includes(agent.action),goalX:agent.goalX??agent.x,facing:agent.facing})||(()=>{
        let vx=agent.vx,vy=agent.vy,x=agent.x,y=agent.y,facing=agent.facing||1;
        vx*=Math.pow(agent.stay?.225:.90,dt/16.67);vy+=.00055*dt;x+=vx*dt/16.67;y+=vy*dt/16.67;
        if(y>floor){y=floor;vy=0}const maxX=Math.max(desk.clientWidth-20,20);
        if(x<20){x=20;vx=Math.abs(vx);facing=1}if(x>maxX){x=maxX;vx=-Math.abs(vx);facing=-1}
        return{x,y,vx,vy,facing};
      })();
      Object.assign(agent,motion);
      if(agent.y>=floor){if(agent.vy>1&&agent.action==='fall')setAction(agent,'landing');agent.y=floor;agent.vy=0;if(agent.action==='landing'&&Date.now()-agent.actionStartedAt>400)setAction(agent,'idle')}
      agent.poseTime+=dt;
      if(agent.action==='jump'&&Math.abs(agent.vy)<.1&&agent.y>=floor-1)setAction(agent,'landing');
    }
  }
  function render(now){
    ctx.clearRect(0,0,desk.clientWidth,desk.clientHeight);
    for(const agent of agents.values()){
      const walking=['walk','run','explore','follow','sneak','escape'].includes(agent.action);
      let motion=null;if(agent.motionProject){const frameNumber=Math.max(0,(now-agent.motionStartedAt)*agent.motionProject.fps/1000);if(frameNumber<agent.motionProject.duration-1)motion=window.XPAnimation?.interpolate(agent.motionProject,frameNumber)||null;else agent.motionProject=null}
      const pose=motion?.poseData||window.XPAnimation?.poseFor(agent.action,agent.poseTime)||{armL:[0,16],armR:[0,16],legL:[0,20],legR:[0,20],bob:Math.sin(agent.poseTime/250)};
      const x=agent.x+(motion?.x||0),y=agent.y+(motion?.y||0)+(walking&&!motion?Math.sin(agent.poseTime/105)*.8:0),facing=agent.facing||1;
      ctx.save();ctx.translate(x,y);ctx.scale(facing,1);window.XPAnimation?.draw(ctx,0,0,pose,motion?.color||agent.color,motion?.scale||1,{},agent.profile?.appearance);ctx.restore();
      ctx.font='11px Tahoma';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.62)';ctx.strokeText(agent.name,x,y-54);ctx.fillStyle='#fff';ctx.fillText(agent.name,x,y-54);
      if(agent.bubble&&now<agent.bubbleUntil){const bw=Math.max(54,ctx.measureText(agent.bubble).width+14),bx=clamp(x-bw/2,4,desk.clientWidth-bw-4),by=Math.max(5,y-87);ctx.fillStyle='#fffde8';ctx.strokeStyle='#344e7a';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(bx,by,bw,23,5);ctx.fill();ctx.stroke();ctx.fillStyle='#172b4d';ctx.font='11px Tahoma';ctx.fillText(agent.bubble,bx+bw/2,by+15)}
    }
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=.025;p.x+=p.vx;p.y+=p.vy;p.vy+=.04;if(p.life<=0){particles.splice(i,1);continue}ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,2+2*(1-p.life),0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
  }
  function loop(now){
    if(!running||!visible||document.hidden)return;
    if(!lastFrame)lastFrame=now;const dt=Math.min(40,Math.max(0,now-lastFrame));lastFrame=now;
    if(agents.size){physics(dt);if(now-lastAI>1300){plan(now);lastAI=now}render(now);if(now-lastSave>5000){for(const agent of agents.values())persist(agent);lastSave=now}animationFrame=requestAnimationFrame(loop)}
    else{ctx.clearRect(0,0,desk.clientWidth,desk.clientHeight);running=false;animationFrame=0}
  }
  function ensureLoop(){if(running||!agents.size||document.hidden)return;running=true;lastFrame=0;animationFrame=requestAnimationFrame(loop)}
  document.addEventListener('visibilitychange',()=>{visible=!document.hidden;if(!visible&&animationFrame)cancelAnimationFrame(animationFrame);else if(visible){running=false;ensureLoop()}});
  window.addEventListener('pagehide',()=>{for(const a of agents.values())persist(a)});
  desk.addEventListener('click',event=>{const icon=event.target.closest('.ic');if(icon)addMemoryForAll(`Người dùng chọn biểu tượng ${icon.querySelector('.icon-name')?.textContent||icon.dataset.appId}.`,'observation',.2)});
  function addMemoryForAll(message,kind,importance){for(const agent of agents.values())addMemory(agent,message,kind,importance)}
  XPBus.on('desktop:event',event=>{
    for(const agent of agents.values()){
      if(event.kind==='window-open')addMemory(agent,`Người dùng mở ứng dụng ${event.title||event.appId}.`,'observation',.3);
      else if(event.kind==='window-close')addMemory(agent,`Người dùng đóng ứng dụng ${event.title||event.appId}.`,'observation',.22);
      else if(event.kind==='paint-draw')addMemory(agent,'Một nét vẽ mới xuất hiện trong Paint.','observation',.32);
      else if(event.kind==='stickman-created'&&event.id!==agent.id){agent.relationships[event.id]=(agent.relationships[event.id]||0)+1;addMemory(agent,`Một stickman mới xuất hiện: ${event.name}.`,'social',.48,{relatedCharacter:event.id})}
    }
  });
  async function load(){try{await window.XPWasm?.ready;const saved=await XPStorage.getCharacters();for(const value of saved){const agent=safeAgent(value);try{agent.memorySnapshot=(await XPStorage.getMemories(agent.id)).slice(-180)}catch{}agents.set(agent.id,agent)}window.XPPerception?.scan();XPBus.emit('stickman:loaded',{count:agents.size});ensureLoop()}catch(error){console.warn('Không thể phục hồi stickman',error)}}
  async function spawn(input={}){
    await window.XPWasm?.ready;
    const id=uid(),name=String(input.name||'Stickman').trim().slice(0,32)||'Stickman',personality=input.personality||'Curious',color=/^#[0-9a-f]{6}$/i.test(input.color||'')?input.color:'#202020',profile=XPAI.profile(name,id,personality);
    profile.appearance=window.XPStickmanAppearance?.normalize(input.appearance||window.XPStickmanAppearance?.create(id,color,personality),color)||null;
    profile.mind=XPAI.createMind?.(id,profile)||null;
    const agent=safeAgent({id,name,color,profile,personality,state:'Idle',action:'idle',x:60+Math.random()*Math.max(50,desk.clientWidth-120),y:desk.clientHeight-8});
    agent.memorySnapshot=[];agents.set(id,agent);ensureLoop();await persist(agent);await addMemory(agent,`Đã tạo nhân vật ${name}.`,'milestone',.9);
    XPBus.emit('stickman:created',{id,name,personality});XPBus.emit('desktop:event',{kind:'stickman-created',id,name});
    // Every new character receives a unique, personality-driven animation project.
    await createAnimation(agent,{force:true});await persist(agent);return agent;
  }
  async function updateAppearance(id,{color,appearance,name,personality}={}){
    const agent=agents.get(id);if(!agent)return false;
    if(/^#[0-9a-f]{6}$/i.test(color||''))agent.color=color;
    if(typeof name==='string'&&name.trim())agent.name=name.trim().slice(0,32);
    const nextPersonality=window.XPAI.PERSONALITIES.includes(personality)?personality:agent.personality;
    if(nextPersonality!==agent.personality){const previous=agent.profile;agent.personality=nextPersonality;const fresh=XPAI.profile(agent.name,agent.id,nextPersonality,previous.traits);agent.profile={...fresh,sketchAssetId:previous.sketchAssetId,mind:previous.mind}}
    agent.profile={...agent.profile,appearance:window.XPStickmanAppearance?.normalize(appearance,agent.color)||agent.profile.appearance};
    await persist(agent);await addMemory(agent,'Ngoại hình hoặc hồ sơ cá nhân được cập nhật trong Paint.','milestone',.75);
    XPBus.emit('stickman:appearance-changed',{id:agent.id,name:agent.name});return true;
  }
  function findHit(clientX,clientY){const r=desk.getBoundingClientRect(),x=clientX-r.left,y=clientY-r.top;for(const agent of [...agents.values()].reverse())if(Math.hypot(x-agent.x,y-(agent.y-25))<26)return agent;return null}
  document.addEventListener('dblclick',event=>{const agent=findHit(event.clientX,event.clientY);if(!agent)return;event.preventDefault();event.stopPropagation();window.showStickmanProfile?.(agent.id)},true);
  async function attachDrawing(id,assetId){const agent=agents.get(id);if(!agent)return false;agent.profile={...agent.profile,sketchAssetId:String(assetId||'').slice(0,100)};await persist(agent);return true}
  async function chat(id,message){
    const agent=agents.get(id),content=String(message||'').trim().slice(0,1200);if(!agent||!content)return false;
    await addMemory(agent,`Người dùng nói: ${content}`,'interaction',.68,{source:'user-chat'});
    if(agent.brainBusy){bubble(agent,'Mình đang suy nghĩ một chút nhé…');return false}
    const result=await requestBrain(agent,{event:'user-chat',userMessage:content},{force:true,showReply:true});
    if(result?.mode==='model'&&result.decision){agent.userAffinity=clamp(agent.userAffinity+1,0,100);await addMemory(agent,`Mình đã trả lời: ${result.decision.reply||result.decision.thought||'Đã phản hồi.'}`,'interaction',.52,{source:'central-ai'});await persist(agent);return true}
    bubble(agent,'Bộ não AI trung tâm chưa kết nối. Mình vẫn ghi nhớ và suy nghĩ bằng bộ não cục bộ.',6000);return false;
  }
  async function command(id,commandName){
    const agent=agents.get(id);if(!agent)return false;const commandValue=String(commandName||'').toLowerCase();
    if(commandValue==='follow'){agent.follow=true;agent.stay=false;setAction(agent,'follow');bubble(agent,'Mình đi theo nhé!')}
    else if(commandValue==='stay'){agent.follow=false;agent.stay=true;agent.vx=0;setAction(agent,'observe');bubble(agent,'Mình ở đây nhé!')}
    else if(commandValue==='talk'){setAction(agent,'talk');bubble(agent,'Chào bạn! Mình đang ở đây.');agent.userAffinity=clamp(agent.userAffinity+1,0,100);await addMemory(agent,'Người dùng bắt đầu trò chuyện.','interaction',.6)}
    else if(commandValue==='interact'){setAction(agent,'interact');agent.userAffinity=clamp(agent.userAffinity+2,0,100);const target=nearestWorld(agent);if(target?.type==='icon')window.XPInteraction?.openApp(target.id.split(':')[1]);else if(target?.type==='tab')window.XPInteraction?.highlightTab(target.id.slice(4));bubble(agent,'Mình đang tương tác!');await addMemory(agent,'Đã tương tác với một đối tượng desktop.','interaction',.6)}
    else if(commandValue==='wave'||commandValue==='animate'){setAction(agent,'wave');bubble(agent,'Xin chào!')}
    else if(commandValue==='rest'){setAction(agent,'rest');agent.needs.energy=clamp(agent.needs.energy+.12,0,1)}
    else if(commandValue==='play'){setAction(agent,'play');agent.vy=-5.5}
    else if(commandValue==='create'||commandValue==='draw'){setAction(agent,'create');await createArtwork(agent)}
    else return false;
    await persist(agent);ensureLoop();return true;
  }
  async function rename(id){const agent=agents.get(id);if(!agent)return;const name=prompt('Tên nhân vật:',agent.name);if(!name?.trim())return;agent.name=name.trim().slice(0,32);const previous=agent.profile;agent.profile={...XPAI.profile(agent.name,agent.id,agent.personality,previous.traits),appearance:previous.appearance,mind:previous.mind,sketchAssetId:previous.sketchAssetId};await persist(agent);await addMemory(agent,`Tên nhân vật đã đổi thành ${agent.name}.`,'milestone',.75)}
  async function duplicate(id){const a=agents.get(id);if(!a)return;return spawn({name:`${a.name} Copy`,color:a.color,personality:a.personality,appearance:a.profile.appearance})}
  async function remove(id){const agent=agents.get(id);if(!agent)return false;if(!confirm(`Xóa stickman ${agent.name} và toàn bộ ký ức của nhân vật này?`))return false;agents.delete(id);await XPStorage.deleteCharacter(id);await XPStorage.clearMemories(id);if(!agents.size&&animationFrame){cancelAnimationFrame(animationFrame);animationFrame=0;running=false;ctx.clearRect(0,0,desk.clientWidth,desk.clientHeight)}return true}
  async function remember(id,message='Người dùng yêu cầu ghi nhớ một sự kiện.'){const agent=agents.get(id);if(agent)await addMemory(agent,message,'important',1)}
  async function showMemory(id){
    const agent=agents.get(id);if(!agent)return;const memories=(await XPStorage.getMemories(id)).sort((a,b)=>b.at-a.at),body=document.createElement('div');body.className='memory-view';
    const title=document.createElement('h3');title.textContent=`Ký ức của ${agent.name}`;body.append(title);const list=document.createElement('div');list.className='memory-list';
    memories.slice(0,150).forEach(memory=>{const row=document.createElement('p');row.textContent=`${new Date(memory.at).toLocaleString('vi-VN')} · ${memory.text}`;list.append(row)});body.append(list);
    const actions=document.createElement('div');actions.className='bar';const clear=document.createElement('button');clear.textContent='Xóa ký ức';clear.onclick=async()=>{if(confirm('Xóa toàn bộ ký ức của nhân vật?')){await XPStorage.clearMemories(id);agent.memoryCount=0;agent.memorySnapshot=[];agent.profile={...agent.profile,mind:{...(agent.profile?.mind||{}),experienceCount:0,experiences:[],longTermSummary:''}};await persist(agent);list.replaceChildren()}};
    const exportBtn=document.createElement('button');exportBtn.textContent='Xuất JSON';exportBtn.onclick=()=>downloadJSON({character:agent,memories},`${agent.name}-memory.json`);actions.append(clear,exportBtn);body.append(actions);XPWM.create({title:`Memory — ${agent.name}`,icon:'🧠',width:480,height:420,appId:'memory',build:winBody=>winBody.append(body)});
  }
  function downloadJSON(value,filename){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
  function showProfile(id){const agent=agents.get(id);if(agent)window.showStickmanProfile?.(id)}
  window.XPStickman=Object.freeze({spawn,load,list:()=>[...agents.values()],get:id=>agents.get(id),findHit,command,chat,attachDrawing,rename,duplicate,remove,remember,showMemory,showProfile,updateAppearance,generateAnimation:id=>{const agent=agents.get(id);return agent?createAnimation(agent,{force:true}):Promise.resolve(null)},
    setAutonomy:(id,enabled)=>{const a=agents.get(id);if(a){a.autonomy=!!enabled;persist(a)}},
    exportAll:async()=>{const values=[];for(const agent of agents.values())values.push({character:agent,memories:await XPStorage.getMemories(agent.id)});downloadJSON(values,'xp-stickmen-backup.json')},
    importAll:async values=>{for(const item of values||[]){if(!item.character?.id)continue;const agent=safeAgent(item.character);agents.set(agent.id,agent);await persist(agent);for(const memory of item.memories||[])await XPStorage.addMemory({...memory,characterId:agent.id})}ensureLoop()}
  });
  load();
})();
