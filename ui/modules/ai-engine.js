(() => {
  const PERSONALITIES = ['Curious','Playful','Shy','Energetic','Calm','Competitive','Creative','Friendly','Mischievous'];
  const ABILITIES = [
    {id:'shadow-step',name:'Shadow Step',description:'Bước nhanh trong thế giới mô phỏng.',cooldown:9000,effect:'blink'},
    {id:'echo-motion',name:'Echo Motion',description:'Lặp lại một cử chỉ vừa quan sát.',cooldown:7000,effect:'echo'},
    {id:'energy-bounce',name:'Energy Bounce',description:'Tạo một cú bật nảy.',cooldown:6500,effect:'bounce'},
    {id:'gravity-shift',name:'Gravity Shift',description:'Lơ lửng trong chốc lát.',cooldown:12000,effect:'float'},
    {id:'canvas-creator',name:'Canvas Creator',description:'Tạo một tác phẩm vector nhỏ.',cooldown:10000,effect:'draw'},
    {id:'super-speed',name:'Super Speed',description:'Tăng tốc trong thời gian ngắn.',cooldown:8000,effect:'speed'},
    {id:'spark-burst',name:'Spark Burst',description:'Tạo hạt sáng trang trí.',cooldown:8500,effect:'spark'},
    {id:'tiny-builder',name:'Tiny Builder',description:'Tạo vật thể trang trí ảo.',cooldown:14000,effect:'build'}
  ];
  const TRAITS=['curiosity','sociability','playfulness','creativity','energy','patience','confidence','empathy','competitiveness','cautiousness'];
  const NEEDS=['energy','curiosity','social','entertainment','creativity','comfort','exploration'];
  const DEFAULT_NEEDS={energy:.82,curiosity:.48,social:.55,entertainment:.58,creativity:.5,comfort:.78,exploration:.42};
  const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,Number.isFinite(v)?v:min));
  const hash=text=>{let h=2166136261;for(let i=0;i<String(text).length;i++){h^=String(text).charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
  function rand(seed){let x=seed>>>0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}}
  function profile(name,id,personality='Curious',existingTraits=null){
    const seed=window.XPWasm?.stableHash?window.XPWasm.stableHash(name,String(id||name||'character')):hash(String(id||name||'character')),generated=window.XPWasm?.randomValues?.(seed,32);let cursor=0;const fallback=rand(seed),r=()=>generated&&cursor<generated.length?generated[cursor++]:fallback();
    const first=Math.floor(r()*ABILITIES.length);let second=Math.floor(r()*ABILITIES.length);if(second===first)second=(second+1)%ABILITIES.length;
    const base=Object.fromEntries(TRAITS.map(t=>[t,.2+r()*.8]));
    const biases={Curious:{curiosity:.22,cautiousness:-.08},Playful:{playfulness:.3,energy:.18},Shy:{confidence:-.25,sociability:-.18,cautiousness:.2},Energetic:{energy:.3,playfulness:.15},Calm:{patience:.3,energy:-.2,cautiousness:.1},Competitive:{competitiveness:.3,confidence:.15},Creative:{creativity:.3,curiosity:.15},Friendly:{sociability:.3,empathy:.2},Mischievous:{playfulness:.25,confidence:.12}};
    for(const[k,v]of Object.entries(biases[personality]||{}))base[k]=clamp(base[k]+v);
    if(existingTraits)for(const t of TRAITS)if(Number.isFinite(existingTraits[t]))base[t]=clamp(existingTraits[t]);
    return{personality:PERSONALITIES.includes(personality)?personality:'Curious',abilities:[ABILITIES[first],ABILITIES[second]],traits:base,seed};
  }
  function normalizeNeeds(needs={}){const source=needs&&typeof needs==='object'?needs:{};return Object.fromEntries(NEEDS.map(k=>[k,clamp(Number.isFinite(Number(source[k]))?Number(source[k]):DEFAULT_NEEDS[k],0,1)]));}
  function decayNeeds(needs,dt,action){
    const n=normalizeNeeds(needs),s=Math.max(0,Math.min(dt,60000))/60000;
    n.energy=clamp(n.energy-((action==='run'?.08:action==='explore'?.025:0)*s)+.01*s);
    n.curiosity=clamp(n.curiosity-.01*s+(action==='observe'?.025:0));
    n.social=clamp(n.social-.012*s+(action==='socialize'||action==='talk'?.05:0));
    n.entertainment=clamp(n.entertainment-.01*s+(action==='play'?.06:0));
    n.creativity=clamp(n.creativity-.008*s+(action==='create'||action==='draw'?.05:0));
    n.comfort=clamp(n.comfort-.008*s+(action==='rest'||action==='sleep'?.08:0));
    n.exploration=clamp(n.exploration-.01*s+(action==='explore'?.05:0));
    return n;
  }
  function emotion(agent,context={}){
    const n=normalizeNeeds(agent.needs),p=agent.profile?.traits||{};
    if(n.energy<.18)return'restless';if(context.surprise)return'surprised';if(context.socialSuccess)return'happy';
    if(context.newObject&&p.curiosity>.6)return'curious';if(n.entertainment<.25)return'bored';
    if(agent.personality==='Shy'&&context.userActive)return'shy';if(context.nearCharacter)return'friendly';return'calm';
  }
  function retrieveMemories(memories=[],context={}){
    const tokens=String(context.query||context.event||'').toLowerCase().split(/\W+/).filter(Boolean);
    return [...memories].map(m=>{const text=String(m.text||m.content||'').toLowerCase();const hits=tokens.reduce((sum,t)=>sum+(text.includes(t)?1:0),0);const age=Math.max(0,Date.now()-(m.at||m.createdAt||Date.now()));const freshness=Math.max(0,1-age/(30*86400000));return{...m,_score:(Number(m.importance)||.2)*.6+(Number(m.confidence)||.5)*.15+freshness*.15+Math.min(.1,hits*.05)}}).sort((a,b)=>b._score-a._score).slice(0,8).map(({_score,...m})=>m);
  }
  function decide(agent,context={}){
    const p=agent.profile||profile(agent.name,agent.id,agent.personality),t=p.traits||{},n=normalizeNeeds(agent.needs),cool=agent.cooldowns||{},now=context.now||Date.now();
    const goal=agent.goals?.find(g=>g.status!=='complete'&&g.status!=='cancelled')||null;
    const last=window.XPActions?.normalize(agent.action)||agent.action||'idle',repeat=agent.repetition||0;
    const choices=[
      ['observe',.12+t.curiosity*.42+n.curiosity*.42+(context.newObject?.38:0)+(context.pointerNear?.12:0)+(context.memoryCue?.12:0)],
      ['explore',.1+t.curiosity*.28+t.energy*.2+n.exploration*.5+(context.unvisitedIcon?.28:0)],
      ['socialize',.06+t.sociability*.38+t.empathy*.18+n.social*.45+(context.nearCharacter?.34:0)+(context.newFriend?.16:0)+(context.socialMemory?.12:0)],
      ['play',.08+t.playfulness*.4+n.entertainment*.48+(p.personality==='Playful'?.22:0)],
      ['create',.06+t.creativity*.48+n.creativity*.5+(context.paintOpen?.3:0)+(context.artworkNeeded?.18:0)+(context.animationNeeded?.18:0)+(context.creativeMemory?.12:0)],
      ['rest',.05+(1-n.energy)*.78+(1-n.comfort)*.18],
      ['follow',.04+t.confidence*.2+(context.pointerNear?.22:0)+(agent.follow?.35:0)],
      ['think',.08+t.patience*.3+(context.memoryMatch?.16:0)+(context.memoryConflict?.12:0)],
      ['wave',.04+t.sociability*.25+(context.userActive?.18:0)+(context.nearCharacter?.12:0)]
    ];
    const goalType=goal?.type==='friend'?'socialize':goal?.type;
    const goalBias={explore:.34,socialize:.3,create:.34,rest:.32,play:.28,draw:.3};
    if(goalType&&goalBias[goalType])for(const item of choices)if(item[0]===(goalType==='draw'?'create':goalType))item[1]+=goalBias[goalType];
    for(const item of choices){
      if((cool[item[0]]||0)>now)item[1]*=.05;
      if(item[0]===last)item[1]*=Math.max(.06,.58-repeat*.13);
      const noise=(hash(`${agent.id}:${Math.floor(now/1800)}:${item[0]}`)%100)/1800;
      item[1]+=noise;
    }
    const wasmHint=window.XPWasm?.chooseAction?.({curiosity:t.curiosity,sociability:t.sociability,energyTrait:t.energy,creativity:t.creativity,agentEnergy:n.energy,personality:p.personality,pointerNear:context.pointerNear,userActive:context.userActive,previous:last});
    if(wasmHint){const hinted=choices.find(item=>item[0]===wasmHint);if(hinted)hinted[1]+=.015}
    choices.sort((a,b)=>b[1]-a[1]);
    return window.XPActions?.normalize(choices[0]?.[0]||'idle')||choices[0]?.[0]||'idle';
  }
  window.XPAI=Object.freeze({PERSONALITIES,ABILITIES,TRAITS,NEEDS,DEFAULT_NEEDS,hash,profile,decide,normalizeNeeds,decayNeeds,emotion,retrieveMemories});
})();
