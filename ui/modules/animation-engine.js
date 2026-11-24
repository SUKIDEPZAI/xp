(() => {
  const VERSION=1,uid=()=>globalThis.crypto?.randomUUID?.()||`anim-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number.isFinite(Number(n))?Number(n):min));
  const POSES=Object.freeze({
    idle:{armL:[-10,8],armR:[10,8],legL:[-8,20],legR:[8,20],body:0,bob:0},
    walk:{armL:[-22,26],armR:[22,-26],legL:[22,-28],legR:[-22,28],body:2,bob:1},
    run:{armL:[-35,42],armR:[35,-42],legL:[35,-45],legR:[-35,45],body:10,bob:3},
    jump:{armL:[-55,-35],armR:[55,-35],legL:[-18,25],legR:[18,25],body:-8,bob:-5},
    wave:{armL:[-8,10],armR:[-55,-40],legL:[-8,18],legR:[8,18],body:-2,bob:1},
    climb:{armL:[-35,-30],armR:[35,-35],legL:[-20,30],legR:[20,-25],body:8,bob:0},
    fall:{armL:[-50,25],armR:[50,-25],legL:[-30,45],legR:[30,-45],body:18,bob:3},
    landing:{armL:[-35,20],armR:[35,20],legL:[-25,38],legR:[25,38],body:-5,bob:2},
    draw:{armL:[-8,12],armR:[32,42],legL:[-8,18],legR:[8,18],body:0,bob:0},
    push:{armL:[-12,-40],armR:[12,-40],legL:[-28,18],legR:[28,18],body:13,bob:0},
    pull:{armL:[-25,-35],armR:[25,-35],legL:[-30,15],legR:[30,15],body:-8,bob:0},
    celebrate:{armL:[-70,-55],armR:[70,55],legL:[-22,28],legR:[22,-28],body:-8,bob:4},
    'tab-prank':{armL:[-42,-26],armR:[40,-32],legL:[-8,18],legR:[8,18],body:-5,bob:1},
    startled:{armL:[-60,-55],armR:[60,55],legL:[-10,35],legR:[10,-35],body:-12,bob:2},
    sneak:{armL:[-15,18],armR:[18,-12],legL:[10,28],legR:[-10,-28],body:13,bob:0},
    think:{armL:[-8,14],armR:[-28,-22],legL:[-8,18],legR:[8,18],body:4,bob:0},
    rest:{armL:[-15,18],armR:[15,18],legL:[-8,25],legR:[8,25],body:4,bob:0},
    talk:{armL:[-20,18],armR:[20,0],legL:[-8,18],legR:[8,18],body:0,bob:1},
    drag:{armL:[-35,-42],armR:[35,-42],legL:[-25,20],legR:[25,20],body:10,bob:0},
    avoid:{armL:[-35,20],armR:[35,-20],legL:[-25,35],legR:[25,-35],body:-10,bob:1},
    sleep:{armL:[-15,18],armR:[15,18],legL:[-10,22],legR:[10,22],body:4,bob:0}
  });
  function poseFor(action,time=0){
    const actionName=window.XPActions?.normalize(action)||action||'idle';
    const pose=POSES[actionName]||POSES.idle,phase=time/170;
    const offset=actionName==='walk'||actionName==='run'?Math.sin(phase):actionName==='wave'?Math.sin(phase*1.5):0;
    return {...pose,armL:[pose.armL[0]+offset*9,pose.armL[1]-offset*7],armR:[pose.armR[0]-offset*9,pose.armR[1]+offset*7],legL:[pose.legL[0]+offset*12,pose.legL[1]],legR:[pose.legR[0]-offset*12,pose.legR[1]],bob:pose.bob+Math.sin(phase*2)*(actionName==='idle'?1:2)};
  }
  function draw(ctx,x,y,pose,color='#202020',scale=1,layers={}){
    const line=(a,b,c,d)=>{ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c,d);ctx.stroke()};
    ctx.save();ctx.translate(x,y+(pose.bob||0));ctx.scale(scale,scale);ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=color;ctx.fillStyle=color;
    if(layers.head!==false){ctx.beginPath();ctx.arc(0,-39,8,0,Math.PI*2);ctx.fill()}
    const rot=(angle,len)=>({x:Math.sin(angle*Math.PI/180)*len,y:-Math.cos(angle*Math.PI/180)*len});
    line(0,-30,Math.sin((pose.body||0)*Math.PI/180)*5,-8);
    const shoulderX=Math.sin((pose.body||0)*Math.PI/180)*5;
    for(const [key,originY] of (layers.arms===false?[]:[['armL',-26],['armR',-26]])){const [a,b]=pose[key]||[0,15],p=rot(a,13),q=rot(b,12);line(shoulderX,originY,shoulderX+p.x,originY+p.y);line(shoulderX+p.x,originY+p.y,shoulderX+p.x+q.x,originY+p.y+q.y)}
    for(const [key] of (layers.legs===false?[]:[['legL'],['legR']])){const [a,b]=pose[key]||[0,20],p=rot(a,13),q=rot(b,14);line(0,-8,p.x,-8+p.y);line(p.x,-8+p.y,p.x+q.x,-8+p.y+q.y)}
    ctx.restore();
  }
  function normalizeFrame(frame,index){return{id:String(frame.id||`frame-${index}`).slice(0,80),at:clamp(frame.at??index*4,0,10000),x:clamp(frame.x??0,-10000,10000),y:clamp(frame.y??0,-10000,10000),pose:window.XPActions?.normalize(frame.pose||'idle')||'idle',scale:clamp(frame.scale??1,.2,4),color:/^#[0-9a-f]{6}$/i.test(frame.color||'')?frame.color:'#202020'};}
  function validateProject(value){
    if(!value||typeof value!=='object')throw new Error('Animation project không hợp lệ');
    const frames=Array.isArray(value.frames)?value.frames:[];if(!frames.length||frames.length>500)throw new Error('Animation cần từ 1 đến 500 frames');
    const normalized=frames.map(normalizeFrame).sort((a,b)=>a.at-b.at);
    return{version:VERSION,id:String(value.id||uid()).slice(0,80),name:String(value.name||'Untitled Animation').slice(0,120),fps:clamp(value.fps??24,1,60),loop:!!value.loop,duration:clamp(value.duration??Math.max(24,normalized.at(-1).at+1),1,10000),frames:normalized,characterId:value.characterId?String(value.characterId).slice(0,100):null,createdAt:Number(value.createdAt)||Date.now(),updatedAt:Date.now(),metadata:value.metadata&&typeof value.metadata==='object'?value.metadata:{}};
  }
  function create(name='New Animation',characterId=null){return validateProject({name,characterId,fps:24,loop:true,duration:48,frames:[{at:0,pose:'idle',x:0,y:0},{at:12,pose:'walk',x:24,y:0},{at:24,pose:'walk',x:48,y:0},{at:36,pose:'idle',x:48,y:0}]});}
  function interpolate(project,frameNumber){
    const p=validateProject(project),time=p.loop?((frameNumber%p.duration)+p.duration)%p.duration:clamp(frameNumber,0,p.duration);
    let a=p.frames[0],b=p.frames.at(-1);for(let i=0;i<p.frames.length-1;i++){if(time>=p.frames[i].at&&time<=p.frames[i+1].at){a=p.frames[i];b=p.frames[i+1];break}}
    const span=Math.max(.0001,b.at-a.at),raw=clamp((time-a.at)/span,0,1),t=raw*raw*(3-2*raw);
    return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,pose:raw<.5?a.pose:b.pose,scale:a.scale+(b.scale-a.scale)*t,color:raw<.5?a.color:b.color,time};
  }
  async function save(project){const p=validateProject(project);await window.XPStorage.saveAnimation(p);window.XPBus?.emit('animation:saved',{id:p.id,name:p.name,characterId:p.characterId});return p;}
  function sampleProjects(){return ['idle','walk','run','jump','wave','climb','fall','landing','draw','push','pull','celebrate','startled','sneak','tab-prank'].map((pose,i)=>{const p=create(pose[0].toUpperCase()+pose.slice(1),null);p.frames=[{id:`${pose}-0`,at:0,pose,x:0,y:0},{id:`${pose}-1`,at:12,pose,x:pose==='walk'||pose==='run'?28:0,y:pose==='jump'?-35:pose==='fall'?20:0},{id:`${pose}-2`,at:24,pose:pose==='jump'?'landing':pose,x:pose==='walk'||pose==='run'?56:0,y:0}];p.duration=36;p.fps=i===2?30:24;p.loop=!['jump','fall','landing','celebrate','startled'].includes(pose);return validateProject(p)});}
  window.XPAnimation=Object.freeze({VERSION,POSES,poseFor,draw,validateProject,create,interpolate,save,sampleProjects});
})();
