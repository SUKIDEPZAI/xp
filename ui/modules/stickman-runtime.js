(() => {
  const desk=document.getElementById('desk');
  const canvas=document.createElement('canvas');
  canvas.className='stickman-layer';canvas.setAttribute('aria-hidden','true');
  desk.append(canvas);
  const ctx=canvas.getContext('2d');
  const agents=new Map();
  const bubbles=[];
  let lastFrame=0,lastAI=0,lastSave=0,lastPointer=0,animationFrame=0,running=false;
  const pointer={x:0,y:0,active:false};
  document.addEventListener('pointermove',event=>{
    const rect=desk.getBoundingClientRect();
    const inside=event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom;
    pointer.active=inside;
    if(inside){pointer.x=event.clientX-rect.left;pointer.y=event.clientY-rect.top;lastPointer=Date.now()}
  },{passive:true});
  desk.addEventListener('pointerleave',()=>{pointer.active=false});
  const stateNames={look:'Curious',wander:'Exploring',wave:'Interacting',think:'Thinking',rest:'Resting',play:'Playing',create:'Creating'};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const uid=()=>crypto.randomUUID?crypto.randomUUID():`char-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  function resize(){
    const dpr=Math.max(1,Math.min(2,window.devicePixelRatio||1));
    const w=desk.clientWidth,h=desk.clientHeight;
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    canvas.style.width=`${w}px`;canvas.style.height=`${h}px`;
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  new ResizeObserver(resize).observe(desk);resize();
  function safeAgent(a){
    const profile=a.profile||XPAI.profile(a.name,a.id,a.personality);
    return {
      id:a.id||uid(),name:String(a.name||'Stickman').slice(0,32),color:a.color||'#202020',
      personality:profile.personality||a.personality||'Curious',profile,
      state:a.state||'Idle',action:a.action||'idle',goal:a.goal||'Explore the desktop',
      energy:Number.isFinite(a.energy)?a.energy:0.8,happiness:Number.isFinite(a.happiness)?a.happiness:0.6,
      x:Number.isFinite(a.x)?a.x:80+Math.random()*Math.max(80,desk.clientWidth-160),
      y:Number.isFinite(a.y)?a.y:desk.clientHeight-34,vx:a.vx||0,vy:a.vy||0,
      facing:a.facing||1,follow:!!a.follow,stay:!!a.stay,createdAt:a.createdAt||Date.now(),
      relationships:a.relationships||{},userAffinity:Number.isFinite(a.userAffinity)?a.userAffinity:0,memoryCount:a.memoryCount||0,lastActionAt:a.lastActionAt||0,
      lastEventAt:a.lastEventAt||0,cooldowns:a.cooldowns||{},bubble:'',bubbleUntil:0,poseTime:0
    };
  }
  async function persist(a){
    try{
      const {bubble,bubbleUntil,poseTime,...value}=a;
      await XPStorage.saveCharacter({...value,updatedAt:Date.now()});
    }catch(error){console.warn('Không thể lưu stickman',error)}
  }
  async function addMemory(a,text,kind='event',importance=0.45){
    const record={id:uid(),characterId:a.id,text:String(text).slice(0,280),kind,importance,at:Date.now()};
    a.memoryCount=(a.memoryCount||0)+1;
    try{
      await XPStorage.addMemory(record);
      const all=await XPStorage.getMemories(a.id);
      if(all.length>180){
        all.sort((x,y)=>x.at-y.at);
        const remove=all.slice(0,all.length-180);
        for(const old of remove) await XPStorage.deleteMemory(old.id);
      }
      a.memoryCount=Math.min(all.length,180);
      await persist(a);
      XPBus.emit('stickman:memory',{id:a.id,name:a.name,text,kind});
    }catch(error){console.warn('Memory storage error',error)}
  }
  function bubble(a,text,duration=2600){
    a.bubble=String(text).slice(0,80);a.bubbleUntil=Date.now()+duration;
  }
  function setAction(a,action){
    if(a.action===action)return;
    a.action=action;a.state=stateNames[action]||action;
    a.goal=({
      look:'Observe something interesting',
      wander:'Explore an open area of the desktop',
      wave:'Acknowledge the user',
      think:'Review recent events and memories',
      rest:'Recover energy',
      play:'Do something playful',
      create:'Try a creative action'
    })[action]||'Continue exploring';
    a.lastActionAt=Date.now();
    XPBus.emit('stickman:action',{id:a.id,name:a.name,action});
    if(['wave','create','play'].includes(action))addMemory(a,`Bắt đầu hành động: ${a.state}`,'action',0.35);
  }
  function plan(now){
    for(const a of agents.values()){
      a.energy=clamp(a.energy-(a.action==='wander'?0.025:0.008)+ (a.action==='rest'?0.07:0),0,1);
      const pointerNear=Math.hypot(pointer.x-a.x,pointer.y-a.y)<180;
      if(a.follow&&pointer.active){a.goal='Follow the cursor';a.vx+=(pointer.x-a.x)*0.00045;a.vy-=0.15}
      else if(a.stay){a.vx*=0.5;a.goal='Stay at the chosen place'}
      else if(!a.goalX||Math.abs(a.x-a.goalX)<18){
        a.goalX=30+Math.random()*Math.max(60,desk.clientWidth-60);
      }
      const decision=XPAI.decide(a,{pointerNear,userActive:Date.now()-lastPointer<5000});
      if(a.action==='rest'&&a.energy>0.72)setAction(a,decision==='rest'?'look':decision);
      else setAction(a,decision);
      if(decision==='wander'&&!a.stay){a.vx+=(Math.sign((a.goalX||a.x)-a.x)*0.5);a.facing=Math.sign(a.vx)||a.facing}
      if(decision==='wave'&&now-a.lastEventAt>9000){bubble(a,'Xin chào!');a.lastEventAt=now;addMemory(a,'Đã chào người dùng.','interaction',0.65)}
      if(decision==='think')bubble(a,'Đang suy nghĩ…',1200);
      if(decision==='create'&&now-(a.cooldowns.create||0)>15000){
        a.cooldowns.create=now;bubbles.push({x:a.x+20,y:a.y-30,life:1,color:a.color});
        bubble(a,'Một ý tưởng mới!',1800);
      }
      if(now-(a.cooldowns.ability||0)>22000&&a.profile.abilities?.length){
        const ability=a.profile.abilities[(now>>4)%a.profile.abilities.length];
        if(a.energy>0.4&&Math.random()<0.12){activateAbility(a,ability);a.cooldowns.ability=now}
      }
    }
  }
  function activateAbility(a,ability){
    const effects={
      blink:()=>{a.x=clamp(a.x+(a.facing||1)*90,20,desk.clientWidth-20);bubble(a,'Shadow Step!')},
      echo:()=>{a.action='wave';bubble(a,'Echo Motion!')},
      bounce:()=>{a.vy=-9;bubble(a,'Energy Bounce!')},
      float:()=>{a.vy=-5;bubble(a,'Gravity Shift!')},
      draw:()=>{bubbles.push({x:a.x,y:a.y-28,life:1,color:a.color});bubble(a,'Canvas Creator!')},
      speed:()=>{a.vx+=(a.facing||1)*5;bubble(a,'Super Speed!')},
      spark:()=>{for(let i=0;i<7;i++)bubbles.push({x:a.x+(Math.random()-.5)*30,y:a.y-25+(Math.random()-.5)*30,life:1,color:'#ffe066'});bubble(a,'Spark Burst!')},
      build:()=>{bubbles.push({x:a.x,y:a.y-8,life:1,color:'#7fd4ff'});bubble(a,'Tiny Builder!')}
    };
    effects[ability.effect]?.();
    addMemory(a,`Đã sử dụng năng lực ${ability.name}.`,'ability',0.7);
  }
  function physics(dt){
    const floor=desk.clientHeight-8;
    for(const a of agents.values()){
      const motion=XPAI.integrateMotion(a,{
        dt,floor,width:desk.clientWidth,pointerX:pointer.x,
        pointerActive:a.follow&&pointer.active,stay:a.stay,
        wandering:a.action==='wander',goalX:a.goalX||a.x
      });
      Object.assign(a,motion);
      a.poseTime+=dt;
    }
  }
  function line(x1,y1,x2,y2,color,width=2){
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  }
  function render(now){
    ctx.clearRect(0,0,desk.clientWidth,desk.clientHeight);
    for(const a of agents.values()){
      const walk=Math.sin(a.poseTime/115)*Math.min(7,Math.abs(a.vx)*1.5);
      const bob=a.action==='wave'?Math.sin(now/140)*2:Math.sin(a.poseTime/260)*1.2;
      const x=a.x,y=a.y+bob,c=a.color;
      ctx.save();ctx.translate(x,y);ctx.scale(a.facing||1,1);
      ctx.fillStyle=c;ctx.strokeStyle=c;ctx.lineWidth=3;ctx.lineCap='round';
      ctx.beginPath();ctx.arc(0,-39,8,0,Math.PI*2);ctx.fill();
      line(0,-30,0,-8,c,3);
      if(a.action==='wave'){line(0,-26,13,-39+Math.sin(now/120)*4,c,3);line(0,-26,-10,-15,c,3)}
      else {line(0,-26,10,-14+walk*.3,c,3);line(0,-26,-10,-14-walk*.3,c,3)}
      line(0,-8,9+walk,-0,c,3);line(0,-8,-9-walk,0,c,3);
      ctx.restore();
      ctx.font='11px Tahoma';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.55)';ctx.strokeText(a.name,x,y-53);ctx.fillStyle='#fff';ctx.fillText(a.name,x,y-53);
      if(a.bubble&&now<a.bubbleUntil){
        const bw=Math.max(54,ctx.measureText(a.bubble).width+14),bx=clamp(x-bw/2,4,desk.clientWidth-bw-4),by=Math.max(5,y-85);
        ctx.fillStyle='#fffde8';ctx.strokeStyle='#344e7a';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(bx,by,bw,23,5);ctx.fill();ctx.stroke();
        ctx.fillStyle='#172b4d';ctx.font='11px Tahoma';ctx.fillText(a.bubble,bx+bw/2,by+15);
      }
    }
    for(let i=bubbles.length-1;i>=0;i--){
      const p=bubbles[i];p.life-=0.035;if(p.life<=0){bubbles.splice(i,1);continue}
      ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y-(1-p.life)*25,3+3*(1-p.life),0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    }
  }
  function loop(now){
    if(!running)return;
    if(!lastFrame)lastFrame=now;
    const dt=Math.min(40,now-lastFrame);lastFrame=now;
    if(agents.size){
      physics(dt);
      if(now-lastAI>1500){plan(now);lastAI=now}
      render(now);
      if(now-lastSave>5000){for(const a of agents.values())persist(a);lastSave=now}
      animationFrame=requestAnimationFrame(loop);
    }else{
      ctx.clearRect(0,0,desk.clientWidth,desk.clientHeight);
      running=false;animationFrame=0;
    }
  }
  function ensureLoop(){
    if(running||!agents.size)return;
    running=true;lastFrame=0;animationFrame=requestAnimationFrame(loop);
  }
  desk.addEventListener('click',event=>{
    const icon=event.target.closest('.ic');
    if(icon)addMemoryForAll(`Lựa chọn biểu tượng ${icon.querySelector('.icon-name')?.textContent||icon.dataset.appId}.`,'observation',0.25);
  });
  function addMemoryForAll(text,kind,importance){for(const a of agents.values())addMemory(a,text,kind,importance)}
  XPBus.on('desktop:event',event=>{
    for(const a of agents.values()){
      if(event.kind==='window-open')addMemory(a,`Người dùng mở ứng dụng ${event.title||event.appId}.`,'observation',0.4);
      else if(event.kind==='window-close')addMemory(a,`Người dùng đóng ứng dụng ${event.title||event.appId}.`,'observation',0.3);
      else if(event.kind==='paint-draw')addMemory(a,'Người dùng vừa tạo nét vẽ trong Paint.','observation',0.35);
      else if(event.kind==='stickman-created'&&event.id!==a.id){
        a.relationships[event.id]=(a.relationships[event.id]||0)+1;
        addMemory(a,`Một stickman mới xuất hiện: ${event.name}.`,'social',0.5);
      }
    }
  });
  async function load(){
    try{const saved=await XPStorage.getCharacters();for(const data of saved){const a=safeAgent(data);agents.set(a.id,a)}ensureLoop()}
    catch(error){console.warn('Không thể phục hồi stickman',error)}
  }
  async function spawn(input={}){
    const id=uid(),name=String(input.name||'Stickman').trim().slice(0,32)||'Stickman';
    const personality=input.personality||'Curious';
    const profile=XPAI.profile(name,id,personality);
    const a=safeAgent({id,name,color:input.color||'#202020',profile,personality,state:'Idle',action:'idle',x:60+Math.random()*Math.max(50,desk.clientWidth-120),y:desk.clientHeight-8});
    agents.set(id,a);ensureLoop();await persist(a);await addMemory(a,`Đã tạo nhân vật ${name}.`,'milestone',0.9);
    XPBus.emit('stickman:created',{id,name,personality});
    XPBus.emit('desktop:event',{kind:'stickman-created',id,name});
    return a;
  }
  function findHit(clientX,clientY){
    const r=desk.getBoundingClientRect(),x=clientX-r.left,y=clientY-r.top;
    for(const a of [...agents.values()].reverse())if(Math.hypot(x-a.x,y-(a.y-25))<25)return a;
    return null;
  }
  document.addEventListener('dblclick',e=>{
    const a=findHit(e.clientX,e.clientY);if(!a)return;
    e.preventDefault();e.stopPropagation();window.showStickmanProfile?.(a.id);
  },true);
  async function command(id,action){
    const a=agents.get(id);if(!a)return;
    if(action==='follow'){a.follow=true;a.stay=false;a.goal='Follow cursor';bubble(a,'Aku ikut!')}
    else if(action==='stay'){a.follow=false;a.stay=true;a.vx=0;a.goal='Stay here';bubble(a,'Ở đây nhé!')}
    else if(action==='talk'){bubble(a,'Chào bạn! Mình đang ở đây.');a.userAffinity=clamp(a.userAffinity+1,0,100);await addMemory(a,'Người dùng bắt đầu trò chuyện.','interaction',0.6)}
    else if(action==='interact'){bubble(a,'Mình đang tương tác!');a.action='wave';a.userAffinity=clamp(a.userAffinity+2,0,100);await addMemory(a,'Đã tương tác với người dùng.','interaction',0.6)}
    else if(action==='wave'){a.action='wave';a.state='Interacting';bubble(a,'Xin chào!')}
    else if(action==='rest'){a.action='rest';a.state='Resting'}
    else if(action==='animate'){a.action='play';a.state='Playing';bubble(a,'Đang tạo chuyển động…')}
    await persist(a);
  }
  async function rename(id){
    const a=agents.get(id);if(!a)return;
    const name=prompt('Tên nhân vật:',a.name);if(!name?.trim())return;
    a.name=name.trim().slice(0,32);a.profile=XPAI.profile(a.name,a.id,a.personality);
    await persist(a);await addMemory(a,`Tên nhân vật đã đổi thành ${a.name}.`,'milestone',0.75);
  }
  async function duplicate(id){
    const a=agents.get(id);if(!a)return;
    return spawn({name:`${a.name} Copy`,color:a.color,personality:a.personality});
  }
  async function remove(id){
    const a=agents.get(id);if(!a)return;
    if(!confirm(`Xóa stickman ${a.name} và toàn bộ ký ức của nhân vật này?`))return;
    agents.delete(id);await XPStorage.deleteCharacter(id);await XPStorage.clearMemories(id);if(!agents.size&&animationFrame){cancelAnimationFrame(animationFrame);animationFrame=0;running=false;ctx.clearRect(0,0,desk.clientWidth,desk.clientHeight)}
  }
  async function remember(id,text='Người dùng yêu cầu ghi nhớ một thông tin.'){
    const a=agents.get(id);if(a)await addMemory(a,text,'important',1);
  }
  async function showMemory(id){
    const a=agents.get(id);if(!a)return;
    const memories=(await XPStorage.getMemories(id)).sort((x,y)=>y.at-x.at);
    const body=document.createElement('div');body.className='memory-view';
    const title=document.createElement('h3');title.textContent=`Ký ức của ${a.name}`;body.append(title);
    const list=document.createElement('div');list.className='memory-list';
    memories.slice(0,150).forEach(m=>{const row=document.createElement('p');row.textContent=`${new Date(m.at).toLocaleString('vi-VN')} · ${m.text}`;list.append(row)});
    body.append(list);
    const actions=document.createElement('div');actions.className='bar';
    const clear=document.createElement('button');clear.textContent='Xóa ký ức';clear.onclick=async()=>{if(confirm('Xóa toàn bộ ký ức của nhân vật?')){await XPStorage.clearMemories(id);a.memoryCount=0;await persist(a);list.replaceChildren()}};
    const exportBtn=document.createElement('button');exportBtn.textContent='Xuất JSON';exportBtn.onclick=()=>downloadJSON({character:a,memories},`${a.name}-memory.json`);
    actions.append(clear,exportBtn);body.append(actions);
    window.XPWM.create({title:`Memory — ${a.name}`,icon:'🧠',width:480,height:420,appId:'memory',build:b=>b.append(body)});
  }
  function downloadJSON(value,filename){
    const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function showProfile(id){const a=agents.get(id);if(a)window.showStickmanProfile?.(id)}
  window.XPStickman=Object.freeze({
    spawn,load,list:()=>[...agents.values()],get:id=>agents.get(id),findHit,
    command,rename,duplicate,remove,remember,showMemory,showProfile,
    exportAll:async()=>{const values=[];for(const a of agents.values())values.push({character:a,memories:await XPStorage.getMemories(a.id)});downloadJSON(values,'xp-stickmen-backup.json')},
    importAll:async values=>{for(const item of values||[]){if(!item.character?.id)continue;const a=safeAgent(item.character);agents.set(a.id,a);await persist(a);for(const m of item.memories||[])await XPStorage.addMemory({...m,characterId:a.id})}}
  });
  load();
})();
