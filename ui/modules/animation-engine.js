(() => {
  const VERSION=1,uid=()=>globalThis.crypto?.randomUUID?.()||`anim-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const hash=value=>{let h=2166136261;for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number.isFinite(Number(n))?Number(n):min));
  const POSES=Object.freeze({
    idle:{armL:[-10,8],armR:[10,8],legL:[-8,20],legR:[8,20],body:0,bob:0},
    observe:{armL:[-12,12],armR:[12,-8],legL:[-8,20],legR:[8,20],body:-3,bob:0},
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
  function draw(ctx,x,y,pose,color='#202020',scale=1,layers={},appearance=null){
    const line=(a,b,c,d)=>{ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c,d);ctx.stroke()};
    const look=window.XPStickmanAppearance?.normalize(appearance,color)||null;
    const ink=look?.outlineColor||color,bodyX=Math.sin((pose.body||0)*Math.PI/180)*5;
    const rot=(angle,len)=>({x:Math.sin(angle*Math.PI/180)*len,y:-Math.cos(angle*Math.PI/180)*len});
    ctx.save();ctx.translate(x,y+(pose.bob||0));ctx.scale(scale,scale);ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=ink;ctx.fillStyle=ink;
    if(look){
      // Outfit and head are rendered only for the Stickman model, never inferred from Paint pixels.
      ctx.fillStyle=look.outfitColor;ctx.strokeStyle=ink;ctx.lineWidth=1.8;
      ctx.beginPath();ctx.moveTo(bodyX-5,-29);ctx.lineTo(bodyX+5,-29);ctx.lineTo(bodyX+6,-9);ctx.quadraticCurveTo(bodyX,-5,bodyX-6,-9);ctx.closePath();ctx.fill();ctx.stroke();
      if(look.outfitStyle==='hoodie'){
        ctx.beginPath();ctx.arc(bodyX,-29,5,Math.PI,Math.PI*2);ctx.stroke();
        ctx.strokeStyle=look.accentColor;line(bodyX,-22,bodyX,-10);
      }else if(look.outfitStyle==='jacket'){
        ctx.strokeStyle=look.accentColor;line(bodyX,-27,bodyX,-9);line(bodyX-3,-19,bodyX+3,-19);
      }else if(look.outfitStyle==='sweater'){
        ctx.strokeStyle=look.accentColor;for(let yy=-24;yy<-10;yy+=5)line(bodyX-4,yy,bodyX+4,yy);
      }
    }
    if(layers.head!==false){
      const radius=look?.headShape==='square'?8.2:look?.headShape==='soft'?8.8:8;
      ctx.beginPath();
      if(look?.headShape==='square')ctx.roundRect(-radius,-39-radius,radius*2,radius*2,3);
      else ctx.arc(0,-39,radius,0,Math.PI*2);
      ctx.fillStyle=look?.skinTone||ink;ctx.strokeStyle=ink;ctx.lineWidth=1.8;ctx.fill();ctx.stroke();
      if(look){
        ctx.fillStyle=look.hairColor;ctx.strokeStyle=look.hairColor;ctx.lineWidth=2.3;
        if(look.hairStyle==='spiky'){
          ctx.beginPath();ctx.moveTo(-7,-44);ctx.lineTo(-7,-51);ctx.lineTo(-3,-46);ctx.lineTo(0,-53);ctx.lineTo(3,-46);ctx.lineTo(8,-50);ctx.lineTo(7,-43);ctx.closePath();ctx.fill();
        }else if(look.hairStyle==='fringe'){
          ctx.beginPath();ctx.moveTo(-8,-43);ctx.quadraticCurveTo(-3,-53,7,-45);ctx.lineTo(2,-39);ctx.lineTo(-2,-43);ctx.lineTo(-6,-39);ctx.closePath();ctx.fill();
        }else if(look.hairStyle==='long'){
          ctx.beginPath();ctx.arc(0,-40,9,Math.PI,Math.PI*2);ctx.stroke();line(-8,-41,-8,-32);line(8,-41,8,-32);
        }else if(look.hairStyle==='cap'){
          ctx.beginPath();ctx.arc(0,-40,8,Math.PI,Math.PI*2);ctx.lineTo(10,-43);ctx.lineTo(-8,-43);ctx.fill();
          ctx.strokeStyle=look.accentColor;line(-5,-43,6,-43);
        }else{
          ctx.beginPath();ctx.arc(0,-41,8,Math.PI*1.08,Math.PI*1.95);ctx.stroke();
        }
        ctx.fillStyle='#20242b';
        if(look.expression==='focused'){
          ctx.fillRect(-4,-41,2,2);ctx.fillRect(3,-41,2,2);ctx.strokeStyle=ink;line(-5,-44,-2,-45);line(2,-45,5,-44);
        }else{
          ctx.beginPath();ctx.arc(-3,-41,1.1,0,Math.PI*2);ctx.arc(3,-41,1.1,0,Math.PI*2);ctx.fill();
        }
        ctx.strokeStyle='#7b453b';ctx.lineWidth=1.1;ctx.beginPath();
        if(look.expression==='smile')ctx.arc(0,-37,3,0.15,Math.PI-.15);
        else line(-2,-36,2,-36);
        ctx.stroke();
        if(look.accessory==='glasses'){
          ctx.strokeStyle=look.accentColor;ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(-3,-40,3,0,Math.PI*2);ctx.arc(3,-40,3,0,Math.PI*2);ctx.moveTo(0,-40);ctx.lineTo(0,-40);ctx.stroke();
        }else if(look.accessory==='headphones'){
          ctx.strokeStyle=look.accentColor;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-40,10,Math.PI,Math.PI*2);ctx.stroke();ctx.fillStyle=look.accentColor;ctx.fillRect(-10,-41,3,6);ctx.fillRect(7,-41,3,6);
        }else if(look.accessory==='badge'){
          ctx.fillStyle=look.accentColor;ctx.beginPath();ctx.arc(bodyX+3,-20,1.8,0,Math.PI*2);ctx.fill();
        }
      }
    }
    line(0,-30,bodyX,-8);
    const shoulderX=bodyX;
    for(const [key,originY] of (layers.arms===false?[]:[['armL',-26],['armR',-26]])){
      const [a,b]=pose[key]||[0,15],p=rot(a,13),q=rot(b,12);ctx.strokeStyle=look?.outfitColor||ink;ctx.lineWidth=look?4:3;
      line(shoulderX,originY,shoulderX+p.x,originY+p.y);ctx.strokeStyle=ink;ctx.lineWidth=2.6;line(shoulderX+p.x,originY+p.y,shoulderX+p.x+q.x,originY+p.y+q.y);
    }
    for(const [key] of (layers.legs===false?[]:[['legL'],['legR']])){
      const [a,b]=pose[key]||[0,20],p=rot(a,13),q=rot(b,14);ctx.strokeStyle=ink;ctx.lineWidth=3;
      line(0,-8,p.x,-8+p.y);line(p.x,-8+p.y,p.x+q.x,-8+p.y+q.y);
      if(look){ctx.strokeStyle=look.accentColor;ctx.lineWidth=2;line(p.x+q.x,-8+p.y+q.y,p.x+q.x+3,-8+p.y+q.y)}
    }
    if(look&&look.accessory==='scarf'){
      ctx.strokeStyle=look.accentColor;ctx.lineWidth=3;line(bodyX-4,-29,bodyX+4,-29);line(bodyX+3,-27,bodyX+6,-19);
    }
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
  function generateForCharacter(character, { name = null, seed = null } = {}) {
    if (!character?.id) throw new Error('Cần một Stickman hợp lệ để tạo animation');
    const personality=String(character.personality||character.profile?.personality||'Curious');
    const traits=character.profile?.traits||{};
    const sequences={
      Curious:['think','observe','walk','wave','idle'], Playful:['wave','jump','landing','run','celebrate'],
      Shy:['idle','think','wave','rest','idle'], Energetic:['run','jump','landing','celebrate','walk'],
      Calm:['idle','think','rest','observe','idle'], Competitive:['run','push','celebrate','landing','idle'],
      Creative:['think','draw','wave','celebrate','idle'], Friendly:['wave','talk','walk','celebrate','idle'],
      Mischievous:['sneak','observe','tab-prank','run','wave']
    };
    const sequence=[...(sequences[personality]||sequences.Curious)];
    const baseSeed=Number(seed)||Number(character.profile?.seed)||hash(character.id);
    const r=(()=>{let state=baseSeed>>>0;return()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return(state>>>0)/4294967296}})();
    if((traits.playfulness||0)>.75&&personality!=='Playful')sequence.splice(2,0,'jump');
    if((traits.creativity||0)>.78&&personality!=='Creative')sequence.splice(2,0,'draw');
    const colorValue=/^#[0-9a-f]{6}$/i.test(character.color||'')?character.color:'#202020';
    const frames=[];let at=0,x=0;
    sequence.forEach((pose,index)=>{
      const moving=['walk','run','sneak'].includes(pose),jumping=['jump','landing'].includes(pose);
      const stride=moving?(pose==='run'?22:pose==='sneak'?5:12):0;
      x+=stride;
      frames.push({id:`auto-${index}-a`,at,pose,x,y:jumping?-16:0,color:colorValue,scale:1});
      frames.push({id:`auto-${index}-b`,at:at+5,pose,x:x+(moving?stride:0),y:pose==='jump'?-34:pose==='landing'?4:0,color:colorValue,scale:1});
      at+=8+Math.floor(r()*3);
    });
    frames.push({id:'auto-end',at:at+4,pose:'idle',x,y:0,color:colorValue,scale:1});
    return validateProject({name:name||`${character.name||'Stickman'} — ${personality} Motion`,characterId:character.id,fps:24,loop:true,duration:at+12,frames,metadata:{generated:true,generator:'personality-motion-v1',personality,appearance:window.XPStickmanAppearance?.normalize(character.profile?.appearance,colorValue)||null,seed:baseSeed,createdBy:'autonomous-stickman'}});
  }
  async function generateAndSave(character, options={}) { const project=generateForCharacter(character,options);return save(project); }
  window.XPAnimation=Object.freeze({VERSION,POSES,poseFor,draw,validateProject,create,interpolate,save,sampleProjects,generateForCharacter,generateAndSave});
})();
