(() => {
  const ALLOWED_APPS=new Set(['pc','bin','note','paint','calc','mine','sol','ie','wmp','stickman','control','search','help','run','documents','pictures','animation','artwork','account']);
  function openApp(appId){if(!ALLOWED_APPS.has(String(appId)))return false;return !!window.launchApp?.(String(appId));}
  function focusWindow(id){const record=window.XPWM?.get?.(String(id));if(!record)return false;window.XPWM.focus(record.id);return true;}
  function drawAtPaint(commands){
    if(!Array.isArray(commands)||commands.length>120)return false;
    let safe;try{safe=commands.map(window.XPDrawing.validateCommand)}catch{return false}
    const win=[...(window.XPWM?.windows?.values?.()||[])].find(x=>x.appId==='paint'&&!x.minimized);
    if(!win)return false;
    const canvas=win.body.querySelector('canvas');if(!canvas)return false;
    const ctx=canvas.getContext('2d');
    for(const c of safe){
      if(c.op==='line'){ctx.beginPath();ctx.strokeStyle=c.stroke;ctx.lineWidth=c.width;ctx.moveTo(c.x1,c.y1);ctx.lineTo(c.x2,c.y2);ctx.stroke()}
      else if(c.op==='circle'){ctx.beginPath();ctx.strokeStyle=c.stroke;ctx.fillStyle=c.fill;ctx.lineWidth=c.width;ctx.arc(c.x,c.y,c.r,0,Math.PI*2);if(c.fill!=='none')ctx.fill();ctx.stroke()}
      else if(c.op==='rect'){ctx.strokeStyle=c.stroke;ctx.fillStyle=c.fill;ctx.lineWidth=c.width;if(c.fill!=='none')ctx.fillRect(c.x,c.y,c.w,c.h);ctx.strokeRect(c.x,c.y,c.w,c.h)}
    }
    window.XPBus?.emit('desktop:event',{kind:'paint-draw',source:'stickman'});return true;
  }
  function highlightTab(id){const tab=document.querySelector(`.browser-tab[data-tab-id="${CSS.escape(String(id))}"]`);if(!tab)return false;tab.classList.remove('stickman-tab-tap');void tab.offsetWidth;tab.classList.add('stickman-tab-tap');setTimeout(()=>tab.classList.remove('stickman-tab-tap'),900);return true;}
  function playTabPrank(id){const tab=document.querySelector(`.browser-tab[data-tab-id="${CSS.escape(String(id))}"]`);if(!tab)return false;tab.classList.remove('stickman-tab-prank');void tab.offsetWidth;tab.classList.add('stickman-tab-prank');setTimeout(()=>tab.classList.remove('stickman-tab-prank'),1200);window.XPBus?.emit('desktop:event',{kind:'stickman-tab-prank',tabId:String(id)});return true;}
  window.XPInteraction=Object.freeze({openApp,focusWindow,drawAtPaint,highlightTab,playTabPrank,allowedApps:[...ALLOWED_APPS]});
})();
