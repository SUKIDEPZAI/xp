(() => {
  const PERSONALITIES = ['Curious','Playful','Shy','Energetic','Calm','Competitive','Creative','Friendly','Mischievous'];
  const ABILITIES = [
    { id:'shadow-step', name:'Shadow Step', description:'Dịch chuyển một quãng ngắn trong thế giới mô phỏng.', cooldown:9000, effect:'blink' },
    { id:'echo-motion', name:'Echo Motion', description:'Lặp lại một cử chỉ vừa quan sát.', cooldown:7000, effect:'echo' },
    { id:'energy-bounce', name:'Energy Bounce', description:'Tạo một cú bật nảy mạnh hơn.', cooldown:6500, effect:'bounce' },
    { id:'gravity-shift', name:'Gravity Shift', description:'Thay đổi trọng lực trong thời gian ngắn.', cooldown:12000, effect:'float' },
    { id:'canvas-creator', name:'Canvas Creator', description:'Tạo một nét vẽ trang trí trên vùng mô phỏng.', cooldown:10000, effect:'draw' },
    { id:'super-speed', name:'Super Speed', description:'Tăng tốc chạy trong thời gian ngắn.', cooldown:8000, effect:'speed' },
    { id:'spark-burst', name:'Spark Burst', description:'Tạo hạt sáng mô phỏng quanh nhân vật.', cooldown:8500, effect:'spark' },
    { id:'tiny-builder', name:'Tiny Builder', description:'Tạo một vật thể trang trí ảo.', cooldown:14000, effect:'build' }
  ];

  let rustCore = null;
  const rustReady = (async () => {
    try {
      const url = new URL('wasm-core/xp_core.js', document.baseURI).href;
      const module = await import(/* @vite-ignore */ url);
      await module.default();
      if (typeof module.stable_hash === 'function' && typeof module.choose_action === 'function' && typeof module.integrate_motion === 'function') {
        rustCore = module;
        window.XPRustCore = Object.freeze({ available: true, version: 'wasm32', ready: true });
        console.info('XP Living Core: Rust/WebAssembly active');
        return true;
      }
      throw new Error('Rust WASM module is missing required exports');
    } catch (error) {
      window.XPRustCore = Object.freeze({ available: false, version: 'javascript-fallback', ready: false });
      console.info('XP Living Core: JavaScript fallback active', error?.message || 'WASM not built');
      return false;
    }
  })();

  function hash(text) {
    let h = 2166136261;
    for (let i=0;i<text.length;i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rand(seed) {
    let x = seed >>> 0;
    return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) / 4294967296; };
  }
  function profile(name, id, personality='Curious') {
    const validPersonality = PERSONALITIES.includes(personality) ? personality : 'Curious';
    const seed = rustCore ? rustCore.stable_hash(String(name), String(id)) : hash(`${name}|${id}`);
    const values = rustCore ? rustCore.random_values(seed, 6) : (() => { const next=rand(seed); return Array.from({length:6},next); })();
    const first = Math.min(ABILITIES.length-1, Math.floor(values[0]*ABILITIES.length));
    let second = Math.min(ABILITIES.length-1, Math.floor(values[1]*ABILITIES.length));
    if (second === first) second = (second + 1) % ABILITIES.length;
    return {
      personality: validPersonality,
      abilities: [ABILITIES[first], ABILITIES[second]],
      traits: {
        curiosity: 0.35 + values[2]*0.65,
        sociability: 0.25 + values[3]*0.75,
        energy: 0.35 + values[4]*0.65,
        creativity: 0.25 + values[5]*0.75
      }
    };
  }
  function decide(agent, context = {}) {
    const p = agent.profile || profile(agent.name, agent.id);
    const traits = p.traits || {};
    if (rustCore) {
      return rustCore.choose_action(
        traits.curiosity || 0.5, traits.sociability || 0.5,
        traits.energy || 0.5, traits.creativity || 0.5,
        Number.isFinite(agent.energy) ? agent.energy : 0.8,
        p.personality || 'Curious', Boolean(context.pointerNear),
        Boolean(context.userActive), agent.action || ''
      );
    }
    const choices = [
      ['look', 0.28 + (traits.curiosity||0.5)*0.45 + (context.pointerNear ? 0.35 : 0)],
      ['wander', 0.12 + (traits.energy||0.5)*0.55 + (p.personality==='Energetic' ? 0.35 : 0)],
      ['wave', 0.08 + (traits.sociability||0.5)*0.45 + (context.userActive ? 0.35 : 0)],
      ['think', 0.18 + (p.personality==='Calm' ? 0.4 : 0)],
      ['rest', agent.energy < 0.35 ? 1.2 : 0.08 + (p.personality==='Shy' ? 0.15 : 0)],
      ['play', 0.1 + (p.personality==='Playful' ? 0.55 : 0)],
      ['create', 0.1 + (traits.creativity||0.5)*0.4 + (p.personality==='Creative' ? 0.55 : 0)]
    ];
    choices.sort((a,b)=>b[1]-a[1]);
    const previous = agent.action;
    const best = choices.find(item => item[0] !== previous) || choices[0];
    return best[0];
  }
  function integrateMotion(agent, options) {
    const { dt, floor, width, pointerX=0, pointerActive=false, stay=false, wandering=false, goalX=agent.x } = options;
    if (rustCore) {
      const result = rustCore.integrate_motion(
        agent.x, agent.y, agent.vx, agent.vy, dt, floor, width,
        pointerX, Boolean(pointerActive), Boolean(stay), Boolean(wandering),
        Number.isFinite(goalX) ? goalX : agent.x, agent.facing || 1
      );
      return { x:result[0], y:result[1], vx:result[2], vy:result[3], facing:result[4] };
    }
    let {x,y,vx,vy,facing}=agent;
    if(pointerActive){vx+=(pointerX-x)*0.00035*dt;facing=Math.sign(pointerX-x)||facing}
    else if(!stay&&wandering)vx+=Math.sign(goalX-x)*0.004*dt;
    vx*=Math.pow(0.92,dt/16.67);vy+=0.00055*dt;
    x+=vx*dt/16.67;y+=vy*dt/16.67;
    if(y>floor){y=floor;vy=0}
    if(x<20){x=20;vx=Math.abs(vx);facing=1}
    if(x>width-20){x=width-20;vx=-Math.abs(vx);facing=-1}
    return {x,y,vx,vy,facing};
  }

  window.XPAI = Object.freeze({ PERSONALITIES, ABILITIES, hash, profile, decide, integrateMotion, ready: rustReady });
})();
