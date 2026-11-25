(() => {
  let root;
  function close(){if(root){root._dispose?.();root.remove();root=null}}
  function item(label, action, children=null, checked=false) {
    return {label,action,children,checked};
  }
  function draw(items, parent, x, y, depth=0) {
    const menu=document.createElement('div');menu.className='xp-context-menu';
    for(const spec of items){
      const row=document.createElement('button');row.type='button';row.className='xp-menu-item';
      const check=document.createElement('span');check.className='xp-menu-check';check.textContent=spec.checked?'✓':'';
      const label=document.createElement('span');label.className='xp-menu-label';label.textContent=spec.label;
      const arrow=document.createElement('span');arrow.className='xp-menu-arrow';arrow.textContent=spec.children?'▶':'';
      row.append(check,label,arrow);menu.append(row);
      if(spec.children){
        let sub=null;
        const open=()=>{
          if(sub)return;
          const r=row.getBoundingClientRect();
          sub=draw(spec.children,root,r.right-3,r.top,depth+1);
          row.classList.add('submenu-open');
        };
        row.addEventListener('mouseenter',open);
        row.addEventListener('click',e=>{e.stopPropagation();open()});
      }else{
        row.addEventListener('click',e=>{e.stopPropagation();close();try{spec.action?.()}catch(err){console.error(err)}});
      }
    }
    parent.append(menu);
    const rect=menu.getBoundingClientRect();
    menu.style.left=`${Math.max(4,Math.min(x,innerWidth-rect.width-4))}px`;
    menu.style.top=`${Math.max(4,Math.min(y,innerHeight-rect.height-4))}px`;
    return menu;
  }
  function show(e,items){
    close();
    root=document.createElement('div');root.className='xp-context-layer';document.body.append(root);
    const menuRoot=root;
    draw(items,menuRoot,e.clientX,e.clientY);
    const outside=ev=>{if(!menuRoot.contains(ev.target)){if(root===menuRoot)close()}};
    const key=ev=>{
      if(ev.key==='Escape'){if(root===menuRoot)close();return}
      if(['ArrowDown','ArrowUp'].includes(ev.key)){
        const rows=[...menuRoot.querySelectorAll('.xp-menu-item')].filter(x=>x.offsetParent);
        if(!rows.length)return;
        ev.preventDefault();
        const current=rows.indexOf(document.activeElement);
        rows[(current+(ev.key==='ArrowDown'?1:-1)+rows.length)%rows.length].focus();
      }
      if(ev.key==='ArrowRight'&&document.activeElement?.classList.contains('xp-menu-item'))document.activeElement.click();
      if(ev.key==='Enter'&&document.activeElement?.classList.contains('xp-menu-item'))document.activeElement.click();
    };
    setTimeout(()=>{
      if(!menuRoot.isConnected)return;
      document.addEventListener('pointerdown',outside,true);
      document.addEventListener('keydown',key);
      menuRoot._cleanup=()=>{document.removeEventListener('pointerdown',outside,true);document.removeEventListener('keydown',key)};
      menuRoot._dispose=()=>menuRoot._cleanup?.();
      menuRoot.querySelector('.xp-menu-item')?.focus();
    },0);
  }
  const hide=()=>{if(root){root._dispose?.();root.remove();root=null}};
  document.addEventListener('contextmenu',e=>{
    if(!e.target.closest('#desk,#task,#sm'))return;
    e.preventDefault();
    const actor=e.target.closest('.win')?null:window.XPStickman?.findHit?.(e.clientX,e.clientY);
    const icon=e.target.closest('.ic');
    const win=window.XPWM?.findByElement(e.target);
    const task=e.target.closest('#task');
    if(actor){
      e.preventDefault();
      show(e,[
        item('Talk',()=>window.XPStickman.command(actor.id,'talk')),
        item('Interact',()=>window.XPStickman.command(actor.id,'interact')),
        item('Follow Cursor',()=>window.XPStickman.command(actor.id,'follow')),
        item('Stay Here',()=>window.XPStickman.command(actor.id,'stay')),
        item('Remember This',()=>window.XPStickman.remember(actor.id,'Người dùng đã yêu cầu ghi nhớ một sự kiện.')),
        item('View Memory',()=>window.XPStickman.showMemory(actor.id)),
        item('View Abilities',()=>window.XPStickman.showProfile(actor.id)),
        item('Animate',()=>window.XPStickman.command(actor.id,'wave')),
        item('Rename',()=>window.XPStickman.rename(actor.id)),
        item('Duplicate',()=>window.XPStickman.duplicate(actor.id)),
        item('Delete',()=>window.XPStickman.remove(actor.id))
      ]);return;
    }
    if(icon){
      e.preventDefault();const appId=icon.dataset.appId;const launch=()=>window.launchApp?.(appId);
      show(e,[
        item('Open',launch),item('Explore',launch),
        item('Rename',()=>window.renameDesktopIcon?.(icon)),
        item('Delete',()=>icon.remove()),
        item('Create Shortcut',()=>window.duplicateDesktopIcon?.(icon)),
        item('Add to Start Menu',()=>window.pinDesktopIcon?.(icon)),
        item('Pin to Desktop',()=>{icon.hidden=false})
      ]);return;
    }
    if(win?.appId==='paint'){
      e.preventDefault();const paint=window.XPPaint?.[win.id]||{};
      show(e,[
        item('Undo',()=>paint.undo?.()),
        item('Redo',()=>paint.redo?.()),
        item('Cut',()=>paint.cut?.()),
        item('Copy',()=>paint.copy?.()),
        item('Paste',()=>paint.paste?.()),
        item('Select All',()=>paint.selectAll?.()),
        item('Tạo Stickman trong Paint',()=>paint.createStickman?.()),
        item('Export',()=>paint.export?.())
      ]);return;
    }
    if(win){
      e.preventDefault();show(e,[
        item('Restore',()=>win.maximized?window.XPWM.toggleMaximize(win.id):window.XPWM.restore(win.id)),
        item('Move',()=>window.XPWM.keyboardControl(win.id,'move')),item('Size',()=>window.XPWM.keyboardControl(win.id,'size')),
        item('Minimize',()=>window.XPWM.minimize(win.id)),
        item('Maximize',()=>window.XPWM.toggleMaximize(win.id)),
        item('Close',()=>window.XPWM.close(win.id))
      ]);return;
    }
    if(task){
      e.preventDefault();show(e,[
        item('Toolbars',()=>{const bar=document.getElementById('quick-launch');if(bar)bar.hidden=!bar.hidden}),
        item('Cascade Windows',()=>window.XPWM.arrange('cascade')),
        item('Tile Windows Horizontally',()=>window.XPWM.arrange('horizontal')),
        item('Tile Windows Vertically',()=>window.XPWM.arrange('vertical')),
        item('Show Desktop',()=>window.XPWM.showDesktop()),
        item('Lock the Taskbar',()=>document.body.classList.toggle('taskbar-locked'),null,document.body.classList.contains('taskbar-locked')),
        item('Properties',()=>window.launchApp?.('control'))
      ]);return;
    }
    if(e.target.closest('#sm'))return;
    if(e.target.closest('#desk')){
      show(e,[
        item('Arrange Icons By',null,[item('Name',()=>window.arrangeDesktopIcons?.('name')),item('Type',()=>window.arrangeDesktopIcons?.('type'))]),
        item('Refresh',()=>window.XPBus?.emit('desktop:event',{kind:'refresh'})),
        item('Sort By Name',()=>window.arrangeDesktopIcons?.('name')),
        item('Sort By Type',()=>window.arrangeDesktopIcons?.('type')),
        item('Auto Arrange',()=>window.setAutoArrange?.(!document.body.classList.contains('auto-arrange')),null,document.body.classList.contains('auto-arrange')),
        item('Align to Grid',()=>document.body.classList.toggle('align-grid'),null,document.body.classList.contains('align-grid')),
        item('New',null,[item('Folder',()=>window.createVirtualItem?.('folder')),item('Text Document',()=>window.createVirtualItem?.('text')),item('Shortcut',()=>window.createVirtualItem?.('shortcut')),item('New Stickman',()=>window.createStickman?.()),item('New Drawing',()=>window.launchApp?.('paint'))]),
        item('Properties',()=>window.launchApp?.('control'))
      ]);
    }
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape')hide()});
  window.XPContextMenu=Object.freeze({close:hide});
})();
