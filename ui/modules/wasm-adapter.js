(() => {
  let core=null;
  const hash=(name,id)=>{let value=2166136261;for(const unit of `${name}|${id}`){value^=unit.charCodeAt(0);value=Math.imul(value,16777619)}return value>>>0};
  const hashId=id=>{let value=2166136261;for(const unit of String(id)){value^=unit.charCodeAt(0);value=Math.imul(value,16777619)}return value>>>0};
  function randomValues(seed,count=16){let state=seed>>>0;return Array.from({length:Math.max(0,Math.min(128,count|0))},()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return(state>>>0)/4294967296})}
  function chooseAction(input={}){
    const args=[input.curiosity||0,input.sociability||0,input.energyTrait||0,input.creativity||0,input.agentEnergy??.8,input.personality||'Curious',!!input.pointerNear,!!input.userActive,input.previous||'idle'];
    if(core)return core.choose_action(...args);
    const choices=[
      ['observe',.28+args[0]*.45+(args[6]?.35:0)],['explore',.12+args[2]*.55+(args[5]==='Energetic'?.35:0)],
      ['wave',.08+args[1]*.45+(args[7]?.35:0)],['think',.18+(args[5]==='Calm'?.4:0)],
      ['rest',args[4]<.35?1.2:.08+(args[5]==='Shy'?.15:0)],['play',.1+(args[5]==='Playful'?.55:0)],
      ['create',.1+args[3]*.4+(args[5]==='Creative'?.55:0)]
    ];
    return (choices.filter(x=>x[0]!==args[8]).sort((a,b)=>b[1]-a[1])[0]||choices[0])[0];
  }
  function integrateMotion(input={}){
    const x=Number(input.x)||0,y=Number(input.y)||0,vx=Number(input.vx)||0,vy=Number(input.vy)||0;
    const dt=Math.max(0,Math.min(100,Number(input.dt)||0)),floor=Number(input.floor)||0,width=Number(input.width)||0;
    let nextX=x,nextY=y,nextVx=vx,nextVy=vy,nextFacing=Number(input.facing)||1;
    if(input.pointerActive){nextVx+=(Number(input.pointerX)-nextX)*.00035*dt;const direction=Math.sign(Number(input.pointerX)-nextX);if(direction)nextFacing=direction}
    else if(!input.stay&&input.wandering){nextVx+=Math.sign(Number(input.goalX)-nextX)*.004*dt}
    nextVx*=(input.stay?.225:.90)**(dt/16.67);nextVy+=.00055*dt;nextX+=nextVx*dt/16.67;nextY+=nextVy*dt/16.67;
    if(nextY>floor){nextY=floor;nextVy=0}
    const maxX=Math.max(width-20,20);if(nextX<20){nextX=20;nextVx=Math.abs(nextVx);nextFacing=1}if(nextX>maxX){nextX=maxX;nextVx=-Math.abs(nextVx);nextFacing=-1}
    return{x:nextX,y:nextY,vx:nextVx,vy:nextVy,facing:nextFacing};
  }
  const ready=(async()=>{
    try{
      const module=await import('../wasm-core/xp_core.js');
      await module.default();core=module;return true;
    }catch(error){console.info('Rust/WASM module unavailable; using JavaScript fallback.',error?.message||error);return false}
  })();
  window.XPWasm=Object.freeze({ready,get available(){return !!core},stableHash:(name,id)=>core?core.stable_hash('',String(id)):hashId(id),randomValues:(seed,count)=>core?Array.from(core.random_values(seed>>>0,count>>>0)):randomValues(seed,count),chooseAction,integrateMotion});
})();
