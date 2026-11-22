(() => {
  class WindowManager {
    constructor() {
      this.desk = document.getElementById('desk');
      this.tasks = document.getElementById('tasks');
      this.windows = new Map();
      this.nextId = 1;
      this.z = 30;
      this.cascade = 0;
      window.addEventListener('resize', () => this.syncAll());
    }
    create({ title, icon, width=560, height=400, appId='unknown', build }) {
      const id = `xpwin-${this.nextId++}`;
      const offset = (this.cascade++ % 9) * 24;
      const el = document.createElement('section');
      el.className = 'win';
      el.dataset.windowId = id;
      el.dataset.appId = appId;
      el.style.left = `${Math.max(0,40+offset)}px`;
      el.style.top = `${Math.max(0,20+offset)}px`;
      el.style.width = `${Math.max(260,Math.min(width,this.desk.clientWidth-8))}px`;
      el.style.height = `${Math.max(180,Math.min(height,this.desk.clientHeight-8))}px`;
      el.style.zIndex = String(++this.z);
      const head = document.createElement('div');
      head.className = 'tb';
      const titleIcon = document.createElement('span');
      titleIcon.className = 'window-app-icon';
      if (typeof icon === 'string' && icon.trim().startsWith('<svg')) titleIcon.innerHTML = icon;
      else titleIcon.textContent = String(icon || '');
      const text = document.createElement('span');
      text.className = 'tt';
      text.textContent = `${title}`;
      const controls = document.createElement('div');
      controls.className = 'window-controls';
      const min = this.control('_','Thu nhỏ');
      const max = this.control('□','Phóng to / Khôi phục');
      const close = this.control('×','Đóng');
      close.classList.add('x');
      controls.append(min,max,close);
      head.append(titleIcon,text,controls);
      const body = document.createElement('div');
      body.className = 'bd';
      el.append(head,body);
      const task = document.createElement('button');
      task.className = 'tbn';
      task.type = 'button';
      const taskIcon = document.createElement('span');
      taskIcon.className = 'task-icon';
      if (typeof icon === 'string' && icon.trim().startsWith('<svg')) taskIcon.innerHTML = icon;
      else taskIcon.textContent = String(icon || '');
      const taskTitle = document.createElement('span');
      taskTitle.className = 'task-title';
      taskTitle.textContent = title;
      task.append(taskIcon, taskTitle);
      task.title = title;
      this.tasks.append(task);
      this.desk.append(el);
      const record = {
        id, appId, title, icon, el, head, body, task, min, max, close,
        minimized:false, maximized:false, previous:null, focused:false,
        browserSessionId: appId === 'ie' ? `browser-${id}` : null,
        destroyed:false
      };
      this.windows.set(id,record);
      const focus = () => this.focus(id);
      el.addEventListener('pointerdown', focus);
      task.addEventListener('click', () => {
        if (record.minimized) this.restore(id);
        else if (record.focused) this.minimize(id);
        else this.focus(id);
      });
      min.addEventListener('click', e => { e.stopPropagation(); this.minimize(id); });
      max.addEventListener('click', e => { e.stopPropagation(); this.toggleMaximize(id); });
      close.addEventListener('click', e => { e.stopPropagation(); this.close(id); });
      head.addEventListener('dblclick', e => { if (!e.target.closest('button')) this.toggleMaximize(id); });
      this.enableDrag(record);
      this.enableResize(record);
      if (window.ResizeObserver) {
        record.resizeObserver = new ResizeObserver(() => this.syncBrowser(record));
        record.resizeObserver.observe(el);
      }
      try { build?.(body,el,record); } catch (error) { console.error(`App ${appId} failed`,error); body.textContent=`Không thể mở ứng dụng: ${error.message}`; }
      this.focus(id);
      window.XPBus?.emit('window:opened',{ id, appId, title });
      window.XPBus?.emit('desktop:event',{ kind:'window-open', appId, title });
      requestAnimationFrame(() => this.syncBrowser(record));
      return record;
    }
    control(label,title) {
      const b=document.createElement('button');
      b.type='button';b.className='window-control';b.textContent=label;b.title=title;b.setAttribute('aria-label',title);
      return b;
    }
    enableDrag(r) {
      r.head.addEventListener('pointerdown', e => {
        if (e.button!==0 || e.target.closest('button') || r.maximized) return;
        e.preventDefault();
        const start={x:e.clientX,y:e.clientY,left:r.el.offsetLeft,top:r.el.offsetTop};
        r.head.setPointerCapture?.(e.pointerId);
        const move=v=>{
          r.el.style.left=`${Math.max(0,Math.min(this.desk.clientWidth-r.el.offsetWidth,start.left+v.clientX-start.x))}px`;
          r.el.style.top=`${Math.max(0,Math.min(this.desk.clientHeight-36,start.top+v.clientY-start.y))}px`;
          this.syncBrowser(r);
        };
        const up=()=>{r.head.removeEventListener('pointermove',move);r.head.removeEventListener('pointerup',up);r.head.removeEventListener('pointercancel',up);this.syncBrowser(r)};
        r.head.addEventListener('pointermove',move);
        r.head.addEventListener('pointerup',up,{once:true});
        r.head.addEventListener('pointercancel',up,{once:true});
      });
    }
    keyboardControl(id, mode) {
      const r=this.windows.get(id);if(!r)return;
      this.focus(id);r.head.tabIndex=0;r.head.dataset.keyboardControl=mode;r.head.title=`${mode==='move'?'Move':'Size'}: dùng phím mũi tên, Enter hoặc Escape để kết thúc`;r.head.focus();
      const step=10;
      const handler=e=>{
        if(e.key==='Escape'||e.key==='Enter'){
          document.removeEventListener('keydown',handler,true);r.head.removeAttribute('data-keyboard-control');r.head.title='';return;
        }
        if(!e.key.startsWith('Arrow'))return;
        e.preventDefault();e.stopPropagation();
        const dx=e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0;
        const dy=e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0;
        if(mode==='move'&&!r.maximized){
          r.el.style.left=`${Math.max(0,Math.min(this.desk.clientWidth-r.el.offsetWidth,r.el.offsetLeft+dx))}px`;
          r.el.style.top=`${Math.max(0,Math.min(this.desk.clientHeight-r.el.offsetHeight,r.el.offsetTop+dy))}px`;
        }else if(mode==='size'&&!r.maximized){
          r.el.style.width=`${Math.max(260,Math.min(this.desk.clientWidth-r.el.offsetLeft,r.el.offsetWidth+dx))}px`;
          r.el.style.height=`${Math.max(180,Math.min(this.desk.clientHeight-r.el.offsetTop,r.el.offsetHeight+dy))}px`;
        }
        this.syncBrowser(r);
      };
      document.addEventListener('keydown',handler,true);
    }
    enableResize(r) {
      const edges=['n','s','e','w','ne','nw','se','sw'];
      for (const edge of edges) {
        const h=document.createElement('i');h.className=`resize-handle ${edge}`;h.dataset.edge=edge;elSafeAppend(r.el,h);
        h.addEventListener('pointerdown',e=>{
          if(e.button!==0||r.maximized)return;
          this.focus(r.id);
          e.preventDefault();e.stopPropagation();
          const start={x:e.clientX,y:e.clientY,left:r.el.offsetLeft,top:r.el.offsetTop,w:r.el.offsetWidth,h:r.el.offsetHeight};
          const move=v=>{
            let {left,top,w,height}= {left:start.left,top:start.top,w:start.w,height:start.h};
            const dx=v.clientX-start.x,dy=v.clientY-start.y;
            if(edge.includes('e'))w=Math.max(260,start.w+dx);
            if(edge.includes('s'))height=Math.max(180,start.h+dy);
            if(edge.includes('w')){w=Math.max(260,start.w-dx);left=start.left+start.w-w}
            if(edge.includes('n')){height=Math.max(180,start.h-dy);top=start.top+start.h-height}
            w=Math.min(w,this.desk.clientWidth-left);height=Math.min(height,this.desk.clientHeight-top);
            r.el.style.left=`${Math.max(0,left)}px`;r.el.style.top=`${Math.max(0,top)}px`;
            r.el.style.width=`${w}px`;r.el.style.height=`${height}px`;this.syncBrowser(r);
          };
          const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);this.syncBrowser(r)};
          window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});
        });
      }
    }
    focus(id) {
      const r=this.windows.get(id);if(!r||r.minimized)return;
      for(const item of this.windows.values()) {
        item.focused=item===r;item.el.classList.toggle('active',item===r);item.task.classList.toggle('on',item===r);
      }
      r.el.style.zIndex=String(++this.z);
      for(const item of this.windows.values()) {
        if(item.browserSessionId) window.xpHost?.browser?.setVisible(item.browserSessionId,item===r);
      }
      this.syncBrowser(r);
      window.XPBus?.emit('window:focused',{id,appId:r.appId,title:r.title});
      window.XPBus?.emit('desktop:event',{kind:'window-focus',appId:r.appId,title:r.title});
    }
    minimize(id) {
      const r=this.windows.get(id);if(!r)return;
      r.minimized=true;r.el.style.display='none';r.task.classList.remove('on');
      if(r.browserSessionId)window.xpHost?.browser?.setVisible(r.browserSessionId,false);
      window.XPBus?.emit('desktop:event',{kind:'window-minimize',appId:r.appId});
    }
    restore(id) {
      const r=this.windows.get(id);if(!r)return;
      r.minimized=false;r.el.style.display='flex';this.focus(id);
      window.XPBus?.emit('desktop:event',{kind:'window-restore',appId:r.appId});
    }
    toggleMaximize(id) {
      const r=this.windows.get(id);if(!r)return;
      if(!r.maximized) {
        r.previous={left:r.el.style.left,top:r.el.style.top,width:r.el.style.width,height:r.el.style.height};
        Object.assign(r.el.style,{left:'0px',top:'0px',width:`${this.desk.clientWidth}px`,height:`${this.desk.clientHeight}px`});
        r.maximized=true;r.max.textContent='❐';
      } else {
        if(r.previous)Object.assign(r.el.style,r.previous);
        r.maximized=false;r.max.textContent='□';
      }
      this.focus(id);this.syncBrowser(r);
    }
    close(id) {
      const r=this.windows.get(id);if(!r)return;
      if(r.beforeClose&&r.beforeClose()===false)return;
      r.destroyed=true;r.resizeObserver?.disconnect();r.cleanup?.();
      if(r.browserSessionId)window.xpHost?.browser?.destroy(r.browserSessionId);
      r.el.remove();r.task.remove();this.windows.delete(id);
      window.XPBus?.emit('window:closed',{id,appId:r.appId,title:r.title});
      window.XPBus?.emit('desktop:event',{kind:'window-close',appId:r.appId,title:r.title});
      const remaining=[...this.windows.values()].filter(x=>!x.minimized);
      if(remaining.length)this.focus(remaining.sort((a,b)=>Number(a.el.style.zIndex)-Number(b.el.style.zIndex)).at(-1).id);
    }
    syncBrowser(r) {
      if(!r.browserSessionId||r.destroyed)return;
      const host=r.body.querySelector('.browser-page-host');
      const visible=!!host&&!r.minimized&&r.focused&&r.el.isConnected&&getComputedStyle(r.el).display!=='none';
      if(!visible){window.xpHost?.browser?.setVisible(r.browserSessionId,false);return}
      const rect=host.getBoundingClientRect();
      window.xpHost?.browser?.setBounds(r.browserSessionId,{
        x:Math.round(rect.left),y:Math.round(rect.top),
        width:Math.max(1,Math.round(rect.width)),height:Math.max(1,Math.round(rect.height))
      });
      window.xpHost?.browser?.setVisible(r.browserSessionId,true);
    }
    syncAll(){for(const r of this.windows.values())this.syncBrowser(r)}
    showDesktop(){for(const r of this.windows.values())this.minimize(r.id)}
    arrange(mode) {
      const list=[...this.windows.values()].filter(r=>!r.minimized);
      if(!list.length)return;
      const w=this.desk.clientWidth,h=this.desk.clientHeight;
      if(mode==='cascade')list.forEach((r,i)=>{r.el.style.left=`${24+i*28}px`;r.el.style.top=`${16+i*28}px`;r.el.style.width=`${Math.min(700,w-40)}px`;r.el.style.height=`${Math.min(480,h-40)}px`;r.maximized=false});
      else {
        const vertical=mode==='vertical';const each=vertical?w/list.length:h/list.length;
        list.forEach((r,i)=>{r.el.style.left=vertical?`${i*each}px`:'0px';r.el.style.top=vertical?'0px':`${i*each}px`;r.el.style.width=vertical?`${each}px`:`${w}px`;r.el.style.height=vertical?`${h}px`:`${each}px`;r.maximized=true});
      }
      list.forEach(r=>this.syncBrowser(r));this.focus(list.at(-1).id);
    }
    get(id){return this.windows.get(id)}
    findByElement(el){const node=el?.closest?.('.win');return node?this.windows.get(node.dataset.windowId):null}
  }
  function elSafeAppend(parent,child){parent.append(child)}
  window.XPWM = new WindowManager();
})();
