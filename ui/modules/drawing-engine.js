(() => {
  const VERSION=1, MAX_COMMANDS=2000, MAX_COORD=10000;
  const uid=()=>globalThis.crypto?.randomUUID?.()||`draw-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const number=(value,fallback=0)=>Number.isFinite(Number(value))?Math.max(-MAX_COORD,Math.min(MAX_COORD,Number(value))):fallback;
  const color=value=>/^#[0-9a-f]{6}$/i.test(String(value||''))?String(value):'#202020';
  const text=value=>String(value??'').slice(0,240);
  function validateCommand(command){
    if(!command||typeof command!=='object'||typeof command.op!=='string')throw new Error('Lệnh vẽ không hợp lệ');
    const c={op:command.op,stroke:color(command.stroke),fill:command.fill==='none'?'none':color(command.fill),width:Math.max(.5,Math.min(80,number(command.width,2)))};
    if(command.op==='line')Object.assign(c,{x1:number(command.x1),y1:number(command.y1),x2:number(command.x2),y2:number(command.y2)});
    else if(command.op==='circle')Object.assign(c,{x:number(command.x),y:number(command.y),r:Math.max(0,Math.min(MAX_COORD,number(command.r)))});
    else if(command.op==='rect'||command.op==='erase')Object.assign(c,{x:number(command.x),y:number(command.y),w:number(command.w),h:number(command.h)});
    else if(command.op==='path'){
      if(!Array.isArray(command.points)||command.points.length<2||command.points.length>300)throw new Error('Path phải có từ 2 đến 300 điểm');
      c.points=command.points.map(p=>({x:number(p?.x),y:number(p?.y)}));c.closed=!!command.closed;
    }else if(command.op==='text')Object.assign(c,{x:number(command.x),y:number(command.y),value:text(command.value),size:Math.max(8,Math.min(96,number(command.size,16)))});
    else if(command.op==='fill')Object.assign(c,{x:number(command.x),y:number(command.y),w:number(command.w,800),h:number(command.h,600)});
    else throw new Error(`Không hỗ trợ lệnh vẽ: ${command.op}`);
    return c;
  }
  function validateDocument(value){
    if(!value||typeof value!=='object')throw new Error('Drawing document không hợp lệ');
    const commands=Array.isArray(value.commands)?value.commands:[];
    if(commands.length>MAX_COMMANDS)throw new Error('Drawing vượt quá giới hạn lệnh');
    return {version:VERSION,id:String(value.id||uid()).slice(0,80),name:text(value.name||'Untitled Drawing'),width:Math.max(32,Math.min(4096,number(value.width,800))),height:Math.max(32,Math.min(4096,number(value.height,600))),commands:commands.map(validateCommand),createdAt:Number(value.createdAt)||Date.now(),updatedAt:Date.now(),characterId:value.characterId?String(value.characterId).slice(0,100):null,metadata:value.metadata&&typeof value.metadata==='object'?value.metadata:{}};
  }
  function render(ctx,document,{clear=true}={}){
    const doc=validateDocument(document);if(clear)ctx.clearRect(0,0,doc.width,doc.height);
    for(const c of doc.commands){
      ctx.save();ctx.lineWidth=c.width;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=c.stroke;ctx.fillStyle=c.fill;
      if(c.op==='line'){ctx.beginPath();ctx.moveTo(c.x1,c.y1);ctx.lineTo(c.x2,c.y2);ctx.stroke()}
      else if(c.op==='circle'){ctx.beginPath();ctx.arc(c.x,c.y,c.r,0,Math.PI*2);if(c.fill!=='none')ctx.fill();ctx.stroke()}
      else if(c.op==='rect'){if(c.fill!=='none')ctx.fillRect(c.x,c.y,c.w,c.h);ctx.strokeRect(c.x,c.y,c.w,c.h)}
      else if(c.op==='erase'){ctx.clearRect(c.x,c.y,c.w,c.h)}
      else if(c.op==='fill'){ctx.fillStyle=c.fill;ctx.fillRect(c.x,c.y,c.w,c.h)}
      else if(c.op==='path'){ctx.beginPath();ctx.moveTo(c.points[0].x,c.points[0].y);for(const p of c.points.slice(1))ctx.lineTo(p.x,p.y);if(c.closed)ctx.closePath();if(c.fill!=='none'&&c.closed)ctx.fill();ctx.stroke()}
      else if(c.op==='text'){ctx.font=`${c.size}px Tahoma`;ctx.textBaseline='alphabetic';ctx.fillText(c.value,c.x,c.y)}
      ctx.restore();
    }
    return doc;
  }
  const escapeXml=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));
  function toSVG(value){
    const d=validateDocument(value),body=d.commands.map(c=>{
      const attrs=`stroke="${c.stroke}" stroke-width="${c.width}" stroke-linecap="round" stroke-linejoin="round"`;
      if(c.op==='line')return `<line x1="${c.x1}" y1="${c.y1}" x2="${c.x2}" y2="${c.y2}" ${attrs}/>`;
      if(c.op==='circle')return `<circle cx="${c.x}" cy="${c.y}" r="${c.r}" ${attrs} fill="${c.fill}"/>`;
      if(c.op==='rect')return `<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" ${attrs} fill="${c.fill}"/>`;
      if(c.op==='path')return `<path d="M ${c.points.map(p=>`${p.x} ${p.y}`).join(' L ')}${c.closed?' Z':''}" ${attrs} fill="${c.fill}"/>`;
      if(c.op==='text')return `<text x="${c.x}" y="${c.y}" font-family="Tahoma" font-size="${c.size}" fill="${c.fill==='none'?c.stroke:c.fill}">${escapeXml(c.value)}</text>`;
      return '';
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${d.width}" height="${d.height}" viewBox="0 0 ${d.width} ${d.height}">${body}</svg>`;
  }
  function generateArtwork(agent){
    const id=uid(),accent=color(agent?.color||'#2383d8'),name=text(agent?.name||'Stickman');
    const c=[
      {op:'fill',x:0,y:0,w:800,h:560,fill:'#f7fbff'},
      {op:'circle',x:620,y:95,r:45,stroke:'#e7b735',fill:'#ffd85a',width:3},
      {op:'path',points:[{x:0,y:400},{x:150,y:315},{x:310,y:380},{x:480,y:300},{x:650,y:360},{x:800,y:305},{x:800,y:560},{x:0,y:560}],closed:true,stroke:'#4d8b42',fill:'#86bf68',width:2},
      {op:'rect',x:150,y:285,w:190,h:150,stroke:'#8d5b37',fill:'#f4d7a2',width:4},
      {op:'path',points:[{x:130,y:290},{x:245,y:195},{x:360,y:290}],closed:true,stroke:'#9a4339',fill:'#d96a53',width:5},
      {op:'rect',x:224,y:352,w:52,h:83,stroke:'#795234',fill:'#ad8053',width:3},
      {op:'circle',x:440,y:350,r:32,stroke:accent,fill:'none',width:5},
      {op:'line',x1:440,y1:382,x2:440,y2:470,stroke:accent,width:7},
      {op:'line',x1:440,y1:405,x2:390,y2:435,stroke:accent,width:7},
      {op:'line',x1:440,y1:405,x2:488,y2:435,stroke:accent,width:7},
      {op:'line',x1:440,y1:470,x2:405,y2:520,stroke:accent,width:7},
      {op:'line',x1:440,y1:470,x2:478,y2:520,stroke:accent,width:7},
      {op:'text',x:28,y:48,value:`A little world by ${name}`,size:23,fill:'#263c58',stroke:'#263c58'}
    ];
    return validateDocument({id,name:`${name} — Desktop World`,width:800,height:560,commands:c,characterId:agent?.id,metadata:{generated:true,seed:agent?.profile?.seed||0}});
  }
  async function save(value){const doc=validateDocument(value);await window.XPStorage.saveDrawing(doc);window.XPBus?.emit('drawing:saved',{id:doc.id,name:doc.name,characterId:doc.characterId});return doc}
  async function generateAndSave(agent){return save(generateArtwork(agent))}
  function download(value,format='svg'){
    const doc=validateDocument(value),content=format==='json'?JSON.stringify(doc,null,2):toSVG(doc),mime=format==='json'?'application/json':'image/svg+xml';
    const url=URL.createObjectURL(new Blob([content],{type:mime}));const a=document.createElement('a');a.href=url;a.download=`${doc.name.replace(/[^a-z0-9-_]+/gi,'-')}.${format}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function exportPNG(value){
    const doc=validateDocument(value),canvas=document.createElement('canvas');canvas.width=doc.width;canvas.height=doc.height;render(canvas.getContext('2d'),doc);
    return new Promise(resolve=>canvas.toBlob(blob=>{if(!blob)return resolve(null);const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${doc.name.replace(/[^a-z0-9-_]+/gi,'-')}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);resolve(blob)},'image/png'));
  }
  window.XPDrawing=Object.freeze({VERSION,validateCommand,validateDocument,render,toSVG,generateArtwork,generateAndSave,save,download,exportPNG});
})();
