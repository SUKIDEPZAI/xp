(() => {
  const desk=document.getElementById('desk'),objects=new Map(),events=[];
  let pointer={x:0,y:0,active:false,movingAt:0},lastScan=0;
  const safeRect=rect=>({x:Math.round(rect.x),y:Math.round(rect.y),width:Math.max(0,Math.round(rect.width)),height:Math.max(0,Math.round(rect.height))});
  function upsert(id,type,node,extra={}){
    if(!id||!node?.getBoundingClientRect)return null;
    const r=node.getBoundingClientRect(),d=desk.getBoundingClientRect();
    const value={id:String(id).slice(0,120),type,bounds:safeRect({x:r.left-d.left,y:r.top-d.top,width:r.width,height:r.height}),zIndex:Number.parseInt(getComputedStyle(node).zIndex)||0,visible:r.width>0&&r.height>0&&getComputedStyle(node).display!=='none',interactable:!!extra.interactable,actions:Array.isArray(extra.actions)?extra.actions.slice(0,8):[]};
    objects.set(value.id,value);return value;
  }
  function scan(){
    const now=Date.now();if(now-lastScan<350)return [...objects.values()];lastScan=now;
    const alive=new Set();
    for(const el of desk.querySelectorAll('.ic')){const id=`icon:${el.dataset.appId||el.id||objects.size}`;alive.add(id);upsert(id,'icon',el,{interactable:true,actions:['approach','sit','interact']})}
    for(const el of desk.querySelectorAll('.win')){const id=`window:${el.dataset.windowId}`;alive.add(id);upsert(id,'window',el,{interactable:true,actions:['approach','climb','enter','focus']})}
    for(const el of desk.querySelectorAll('.browser-tab')){const id=`tab:${el.dataset.tabId||el.textContent.slice(0,30)}`;alive.add(id);upsert(id,'tab',el,{interactable:true,actions:['approach','tap','wave']})}
    for(const id of objects.keys())if(!alive.has(id))objects.delete(id);
    return [...objects.values()];
  }
  function record(type,detail={}){
    const structural={type:String(type).slice(0,80),at:Date.now(),appId:detail.appId?String(detail.appId).slice(0,60):undefined,objectId:detail.id?String(detail.id).slice(0,100):undefined,title:detail.title?String(detail.title).slice(0,80):undefined,kind:detail.kind?String(detail.kind).slice(0,60):undefined};
    events.push(structural);if(events.length>100)events.shift();
    window.XPBus?.emit('perception:event',structural);
  }
  document.addEventListener('pointermove',event=>{const d=desk.getBoundingClientRect();pointer.active=event.clientX>=d.left&&event.clientX<=d.right&&event.clientY>=d.top&&event.clientY<=d.bottom;if(pointer.active){pointer.x=event.clientX-d.left;pointer.y=event.clientY-d.top;pointer.movingAt=Date.now()}},{passive:true});
  window.XPBus?.on('desktop:event',event=>record(event.kind,event));
  window.XPBus?.on('window:opened',event=>{record('window-open',event);scan()});
  window.XPBus?.on('window:closed',event=>record('window-close',event));
  const observer=new MutationObserver(()=>{lastScan=0;scan()});observer.observe(desk,{subtree:true,childList:true,attributes:true,attributeFilter:['style','class']});
  window.XPPerception=Object.freeze({scan,record,objects:()=>scan(),get:id=>objects.get(id),events:()=>events.slice(-40),pointer:()=>({...pointer}),near:(x,y,r=180)=>[...scan()].filter(o=>o.visible&&Math.hypot(o.bounds.x+o.bounds.width/2-x,o.bounds.y+o.bounds.height/2-y)<r)});
  scan();
})();
