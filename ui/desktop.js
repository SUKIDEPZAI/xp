
const $=s=>document.querySelector(s);
let fs,bin;try{fs=JSON.parse(localStorage.xpfs);bin=JSON.parse(localStorage.xpbin)}catch(e){}
fs=fs||{'Chào mừng.txt':'Chào mừng đến Windows XP bản web!\nMở Paint, Notepad, Minesweeper... từ menu Start.\nMở "Máy tính của tôi" > chọn ổ đĩa để duyệt thư mục thật trên máy.'};bin=bin||[];
const sv=()=>{try{localStorage.xpfs=JSON.stringify(fs);localStorage.xpbin=JSON.stringify(bin)}catch(e){}};
const btn=(bar,l,f)=>{const k=document.createElement('button');k.textContent=l;k.onclick=event=>{window.XPSounds?.play?.();return f?.(event)};bar.append(k);return k};
const pick=(acc,cb,dir)=>{const i=document.createElement('input');i.type='file';i.accept=acc;if(dir){i.webkitdirectory=true;i.multiple=true}i.onchange=()=>cb(i.files);i.click()};
const dl=(blob,n)=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=n;a.click()};
const S=b=>`<svg viewBox="0 0 32 32">${b}</svg>`;
const I={
folder:S(`<path d="M2 7h11l2 3h15v18H2z" fill="#f2c94c" stroke="#a97c12"/><path d="M2 13h28v15H2z" fill="#fbe28a" stroke="#a97c12"/>`),
file:S(`<path d="M6 2h14l6 6v22H6z" fill="#fff" stroke="#777"/><path d="M20 2v6h6" fill="#ddd" stroke="#777"/><path d="M10 14h12M10 18h12M10 22h12" stroke="#99a"/>`),
img:S(`<rect x=4 y=6 width=24 height=20 fill="#bfdcf5" stroke="#468"/><path d="M4 26l8-10 6 6 4-4 6 8z" fill="#4aa63a"/>`),
pc:S(`<rect x=3 y=3 width=26 height=18 rx=2 fill="#cfd8e8" stroke="#456"/><rect x=6 y=6 width=20 height=12 fill="#3b82e8"/><rect x=7 y=24 width=18 height=5 rx=1 fill="#cdd5dd" stroke="#789"/>`),
drive:S(`<rect x=3 y=11 width=26 height=13 rx=2 fill="#c9ced6" stroke="#566"/><rect x=6 y=19 width=14 height=2 fill="#789"/><circle cx=25 cy=20 r=1.5 fill="#4c4"/>`),
cd:S(`<circle cx=16 cy=16 r=13 fill="#d8dde6" stroke="#789"/><circle cx=16 cy=16 r=3 fill="#fff" stroke="#789"/>`),
bin:S(`<path d="M7 8h18l-2 21H9z" fill="#dfe8f0" stroke="#567"/><path d="M5 5h22v4H5z" fill="#bcd0e0" stroke="#567"/><path d="M12 12v13M16 12v13M20 12v13" stroke="#789"/>`),
note:S(`<rect x=5 y=3 width=22 height=26 fill="#fff" stroke="#46a"/><path d="M5 3h22v5H5z" fill="#4a7de0"/><path d="M9 13h14M9 17h14M9 21h10" stroke="#89b"/>`),
paint:S(`<path d="M16 3C8 3 3 9 3 15s5 12 12 12c3 0 3-3 1-4s0-4 3-4h6c3 0 4-2 4-5C29 8 23 3 16 3z" fill="#f2deb0" stroke="#975"/><circle cx=10 cy=12 r=2 fill="#e33"/><circle cx=16 cy=8 r=2 fill="#2b2"/><circle cx=22 cy=11 r=2 fill="#23e"/><circle cx=9 cy=19 r=2 fill="#fd0"/>`),
calc:S(`<rect x=6 y=2 width=20 height=28 rx=2 fill="#c8d3df" stroke="#456"/><rect x=9 y=5 width=14 height=6 fill="#9fd89f"/><path d="M10 16h3M15 16h3M20 16h3M10 21h3M15 21h3M20 21h3M10 26h3M15 26h3M20 26h3" stroke="#345" stroke-width="3"/>`),
mine:S(`<circle cx=16 cy=17 r=8 fill="#222"/><path d="M16 5v24M4 17h24M8 9l16 16M24 9L8 25" stroke="#222" stroke-width="2"/><circle cx=13 cy=14 r=2 fill="#fff"/><circle cx=25 cy=6 r=2 fill="#e22"/>`),
sol:S(`<rect x=3 y=6 width=16 height=22 rx=2 fill="#fff" stroke="#555" transform="rotate(-12 11 17)"/><rect x=12 y=5 width=16 height=22 rx=2 fill="#fff" stroke="#555"/><text x=14 y=18 font-size=11 fill="#d00">A♥</text>`),
ie:S(`<circle cx=16 cy=16 r=11 fill="#2d8ceb"/><text x=9 y=23 font-size=20 font-family="Arial" fill="#fff" font-weight="bold">e</text><ellipse cx=16 cy=16 rx=15 ry=5 fill="none" stroke="#f5c518" stroke-width="2" transform="rotate(-25 16 16)"/>`),
wmp:S(`<circle cx=16 cy=16 r=13 fill="#f58a1f"/><circle cx=16 cy=16 r=10 fill="#2a6fd6"/><path d="M13 10l9 6-9 6z" fill="#fff"/>`)};
I.real=I.drive;
let desktopLayout={};try{desktopLayout=JSON.parse(localStorage.getItem('xp-icon-layout')||'{}')}catch{}
try{const saved=JSON.parse(localStorage.getItem('xp-settings')||'{}');document.body.classList.remove('xp-theme-olive','xp-theme-silver','xp-theme-classic','xp-wallpaper-night','xp-pointer-precision');if(saved.theme==='olive')document.body.classList.add('xp-theme-olive');if(saved.theme==='silver')document.body.classList.add('xp-theme-silver');if(saved.theme==='classic')document.body.classList.add('xp-theme-classic');if(saved.wallpaper==='night')document.body.classList.add('xp-wallpaper-night');if(saved.pointer==='precision')document.body.classList.add('xp-pointer-precision');if(saved.taskbarLocked)document.body.classList.add('taskbar-locked');if(saved.showIcons===false)document.getElementById('icons').style.display='none';if(saved.showQuickLaunch===false)document.getElementById('quick-launch').style.display='none'}catch{}
function touchDesktopSettings(){try{const settings=JSON.parse(localStorage.getItem('xp-settings')||'{}');settings.updatedAt=Date.now();localStorage.setItem('xp-settings',JSON.stringify(settings))}catch{}}
function saveIconLayout(icon){
 const key=icon.dataset.iconId||icon.dataset.appId;if(!key)return;
 const r=icon.getBoundingClientRect(),base=$('#icons').getBoundingClientRect();
 desktopLayout[key]={left:Math.max(0,Math.round(r.left-base.left)),top:Math.max(0,Math.round(r.top-base.top))};
 try{localStorage.setItem('xp-icon-layout',JSON.stringify(desktopLayout))}catch{}
 touchDesktopSettings();
}
function restoreIconLayout(icon){const key=icon.dataset.iconId||icon.dataset.appId,position=desktopLayout[key];if(!position)return;icon.style.position='absolute';icon.style.left=`${Math.max(0,Number(position.left)||0)}px`;icon.style.top=`${Math.max(0,Number(position.top)||0)}px`;icon.style.margin='0'}
function openWin(t,ic,w,h,build,appId='unknown'){
 return XPWM.create({title:t,icon:ic,width:w,height:h,build,appId});
}
function IL(items){const d=document.createElement('div');d.className='il';items.forEach(it=>{const a=document.createElement('div');a.innerHTML=`<big>${it.i}</big>${it.n}`;a.onclick=()=>{d.querySelectorAll('.s').forEach(x=>x.classList.remove('s'));a.classList.add('s');d.sel=it};a.ondblclick=()=>it.o&&it.o();d.append(a)});return d}
const ico=n=>/\.(png|jpe?g|gif|bmp|webp)$/i.test(n)?I.img:/\.(mp3|mp4|wav|ogg|webm|m4a)$/i.test(n)?I.wmp:I.file;
async function openF(e){const f=e.getFile?await e.getFile():e;
 if(/\.(png|jpe?g|gif|bmp|webp)$/i.test(f.name))run('paint',f);
 else if(/\.(mp3|mp4|wav|ogg|webm|m4a)$/i.test(f.name))run('wmp',f);
 else if(f.size>2e6)alert('Tệp quá lớn để mở bằng Notepad.');
 else run('note',{name:f.name,text:await f.text()})}

/* Máy tính của tôi */
const SYS={'Windows':{'system32':{'notepad.exe':'(tệp hệ thống giả)'},'win.ini':'[windows]\nload=\nrun='},'Program Files':{'Internet Explorer':{},'Windows Media Player':{},'MSN Gaming Zone':{}}};
function myc(b,startAt){
 b.innerHTML=`<div class=bar></div><div class=ad><span>Địa chỉ:</span><input readonly></div><div style="flex:1;display:flex;min-height:0"><div class=tp></div><div class=lst></div></div><div class=sb></div>`;
 const [bar,ad,row,sbar]=b.children,[tp,L]=row.children,inp=ad.lastChild;let stack=[],cur={},lsm=0;
 const show=(t,items,ctx)=>{inp.value=t;cur=ctx||{};const d=IL(items);d.classList.toggle('ls',lsm);L.replaceChildren(d);sbar.textContent=items.length+' mục'};
 const go=fn=>{stack.push(fn);fn()},ref=()=>stack.at(-1)(),sel=()=>L.firstChild.sel;
 const docs=()=>go(()=>list(fs,'Tài liệu của tôi',1));
 const root=()=>show('Máy tính của tôi',[{n:'Tài liệu của tôi',i:I.folder,o:docs},{n:'Ổ đĩa cục bộ (C:)',i:I.drive,o:()=>go(c)},{n:'Ổ đĩa mềm 3½ (A:)',i:I.drive,o:()=>alert('Ổ đĩa chưa sẵn sàng.')},{n:'Ổ đĩa CD (D:)',i:I.cd,o:()=>alert('Vui lòng đưa đĩa vào ổ.')},{n:'Thư mục thật trên máy…',i:I.real,o:pickDir}]);
 const c=()=>show('C:\\',[...Object.entries(SYS).map(([n,v])=>({n,i:I.folder,o:()=>go(()=>list(v,'C:\\'+n))})),{n:'Tài liệu của tôi',i:I.folder,o:docs}]);
 const list=(node,t,rw)=>{const it=Object.keys(node).map(n=>{const v=node[n],d=typeof v=='object';return{n,d,i:d?I.folder:ico(n),o:()=>d?go(()=>list(v,t+'\\'+n,rw)):run('note',{name:n,text:v}),
  del:rw&&(()=>{bin.push({n,t:v});delete node[n];sv();ref()}),ren:rw&&(()=>{const m=prompt('Tên mới:',n);if(m&&!(m in node)){node[m]=v;delete node[n];sv();ref()}})}});
  it.sort((a,e)=>e.d-a.d||a.n.localeCompare(e.n));show(t,it,{node,rw})};
 const dir=async(h,p)=>{const it=[];for await(const [n,e] of h.entries()){const d=e.kind=='directory';it.push({n,d,i:d?I.folder:ico(n),o:()=>d?go(()=>dir(e,p+'\\'+n)):openF(e)})}it.sort((a,e)=>e.d-a.d||a.n.localeCompare(e.n));show(p,it)};
 const pickDir=async()=>{if(window.showDirectoryPicker){try{const h=await window.showDirectoryPicker();go(()=>dir(h,h.name))}catch(e){}}
  else pick('',fl=>go(()=>show('Thư mục đã chọn',[...fl].map(f=>({n:f.name,i:ico(f.name),o:()=>openF(f)})))),1)};
 const mk=v=>{if(!cur.rw)return alert('Hãy mở Tài liệu của tôi trước.');const n=prompt('Tên:',typeof v=='object'?'Thư mục mới':'Tệp mới.txt');if(n&&!(n in cur.node)){cur.node[n]=v;sv();ref()}};
 const act=(h,fn)=>{const d=document.createElement('div');d.className='tpl';d.textContent=h;d.onclick=fn;tp.append(d)};
 tp.innerHTML='<h4>Tác vụ tệp và thư mục</h4>';
 act('Tạo thư mục mới',()=>mk({}));act('Tạo tệp văn bản',()=>mk(''));
 act('Đổi tên mục đã chọn',()=>{const x=sel();x&&x.ren?x.ren():alert('Không thể đổi tên mục này.')});
 act('Xóa mục đã chọn',()=>{const x=sel();x&&x.del?x.del():alert('Chỉ xóa được trong Tài liệu của tôi.')});
 tp.insertAdjacentHTML('beforeend','<h4>Nơi khác</h4>');
 act('Máy tính của tôi',()=>go(root));act('Tài liệu của tôi',docs);act('Thùng rác',()=>run('bin'));
 btn(bar,'⬆ Lên',()=>{if(stack.length>1){stack.pop();ref()}});btn(bar,'⟳ Làm mới',()=>ref());
 btn(bar,'☰ Kiểu xem',()=>{lsm=!lsm;L.firstChild.classList.toggle('ls',lsm)});
 if(startAt==='documents')docs();
 else if(startAt==='pictures'){fs['My Pictures']=fs['My Pictures']||{};go(()=>list(fs['My Pictures'],'My Pictures',1))}
 else go(root);
}
function binw(b){
 b.innerHTML=`<div class=bar></div><div class=lst></div>`;const [bar,L]=b.children;
 const r=()=>L.replaceChildren(IL(bin.map((x,k)=>({n:x.n,i:typeof x.t=='object'?I.folder:I.file,k}))));
 btn(bar,'↩ Khôi phục',()=>{const x=L.firstChild.sel;if(x){fs[x.n]=bin[x.k].t;bin.splice(x.k,1);sv();r()}});
 btn(bar,'🔥 Dọn sạch',()=>{bin.length=0;sv();r()});r();
}
/* Notepad — UTF-8 file dialogs are owned by the Electron main process */
function notepad(b,f,record){
 b.innerHTML=`<div class=bar></div><textarea spellcheck="false"></textarea><div class=sb></div>`;
 const [bar,ta,status]=b.children;let nm=f?.name||'',token=null,dirty=false,undoStack=[];
 if(nm){let recent=[];try{recent=JSON.parse(localStorage.getItem('xp-recent-files')||'[]')}catch{};recent=[{name:nm,at:Date.now()},...recent.filter(x=>x.name!==nm)].slice(0,8);try{localStorage.setItem('xp-recent-files',JSON.stringify(recent))}catch{}}
 if(f)ta.value=f.text||'';
 const mark=()=>{dirty=true;renderStatus()};
 const renderStatus=()=>{const before=ta.value.slice(0,ta.selectionStart);const lines=before.split('\n');status.textContent=`${dirty?'● Chưa lưu · ':''}Dòng ${lines.length}, Cột ${lines.at(-1).length+1} · ${ta.value.length} ký tự · ${nm||'Không có tên'}`};
 const save=async asNew=>{
  try{
   const result=asNew?await window.xpHost.files.saveTextAs(ta.value,nm||'Untitled.txt'):await window.xpHost.files.saveText(token,ta.value,nm||'Untitled.txt');
   if(result){token=result.token;nm=result.name;dirty=false;renderStatus()}
  }catch(error){alert('Không thể lưu tệp: '+error.message)}
 };
 const maybeDiscard=()=>!dirty||confirm('Nội dung chưa được lưu. Bạn có muốn đóng hoặc bỏ thay đổi?');
 btn(bar,'File ▾',()=>{
  const choice=prompt('File: 1 New · 2 Open · 3 Save · 4 Save As · 5 Export');
  if(choice==='1'){if(!maybeDiscard())return;ta.value='';nm='';token=null;dirty=false;renderStatus()}
  if(choice==='2')openFile();
  if(choice==='3')save(false);
  if(choice==='4')save(true);
  if(choice==='5')dl(new Blob([ta.value],{type:'text/plain;charset=utf-8'}),nm||'ghichu.txt');
 });
 btn(bar,'Mới',()=>{if(!maybeDiscard())return;ta.value='';nm='';token=null;dirty=false;renderStatus();ta.focus()});
 async function openFile(){
  if(!maybeDiscard())return;
  try{const file=await window.xpHost.files.openText();if(file){ta.value=file.text;nm=file.name;token=file.token;dirty=false;renderStatus()}}
  catch(error){alert('Không thể mở tệp: '+error.message)}
 }
 btn(bar,'Mở…',openFile);
 btn(bar,'Lưu',()=>save(false));
 btn(bar,'Lưu thành…',()=>save(true));
 btn(bar,'Hoàn tác',()=>document.execCommand('undo'));
 btn(bar,'Tìm',()=>{const q=prompt('Tìm nội dung:');if(!q)return;const i=ta.value.indexOf(q,ta.selectionEnd);const j=i<0?ta.value.indexOf(q):i;if(j>=0){ta.focus();ta.setSelectionRange(j,j+q.length)}else alert('Không tìm thấy nội dung.')});
 btn(bar,'Thay thế',()=>{const q=prompt('Từ cần thay:');if(q===null||!q)return;const v=prompt('Thay bằng:','');if(v===null)return;ta.value=ta.value.split(q).join(v);mark()});
 const wrap=btn(bar,'Word Wrap',()=>{ta.style.whiteSpace=ta.style.whiteSpace==='pre'?'pre-wrap':'pre';wrap.textContent='Word Wrap: '+(ta.style.whiteSpace==='pre'?'Off':'On')});
 btn(bar,'A+',()=>ta.style.fontSize=(parseInt(getComputedStyle(ta).fontSize)+1)+'px');
 btn(bar,'A-',()=>ta.style.fontSize=Math.max(9,parseInt(getComputedStyle(ta).fontSize)-1)+'px');
 btn(bar,'Lưu vào My Documents',()=>{nm=nm||prompt('Tên tệp:','Không tên.txt');if(nm){fs[nm]=ta.value;sv();dirty=false;renderStatus();alert('Đã lưu trong dữ liệu ảo My Documents.')}});
 ta.addEventListener('input',mark);ta.addEventListener('keyup',renderStatus);ta.addEventListener('click',renderStatus);
 record.beforeClose=maybeDiscard;
 renderStatus();
}

/* Paint — canvas tools with undo/redo and clipboard image support */
function paint(b,f,record){
 b.innerHTML=`<div class=bar></div><div class=cv><canvas width=700 height=460 style="display:block;background:#fff;cursor:crosshair"></canvas></div><div class=bar></div>`;
 const [tb,cv,pl]=b.children,c=cv.firstChild,x=c.getContext('2d');
 cv.style.position='relative';
 const draft=document.createElement('canvas');draft.className='stickman-draft-layer';draft.width=c.width;draft.height=c.height;
 Object.assign(draft.style,{position:'absolute',left:'3px',top:'3px',pointerEvents:'none',zIndex:'2'});cv.append(draft);
 const dx=draft.getContext('2d');
 let tool='pen',col='#000000',sz=3,d=null,s,p0,U=[],R=[],selection=null,stickmanMode=false,activeStroke=null,draftStrokes=[];
 x.fillStyle='#fff';x.fillRect(0,0,700,460);
 const status=document.createElement('small');status.className='paint-mode-status';status.style.cssText='display:block;padding:3px 7px;color:#30496c;background:#f4f3ee;border-bottom:1px solid #aca899';status.textContent='Paint — tự do vẽ và chỉnh sửa ảnh.';b.insertBefore(status,cv);
 const snapshot=()=>{U.push(x.getImageData(0,0,c.width,c.height));if(U.length>40)U.shift();R=[]};
 const undo=()=>{if(!U.length)return;R.push(x.getImageData(0,0,c.width,c.height));x.putImageData(U.pop(),0,0)};
 const redo=()=>{if(!R.length)return;U.push(x.getImageData(0,0,c.width,c.height));x.putImageData(R.pop(),0,0)};
 [['Pencil','pen'],['Brush','brush'],['Eraser','eraser'],['Line','line'],['Rectangle','rect'],['Fill','fill'],['Circle','ellipse'],['Spray','spray']].forEach(([i,t])=>btn(tb,i,()=>{if(!stickmanMode)tool=t}).title=t);
 const se=document.createElement('select');[1,3,6,12].forEach(v=>se.add(new Option(v+'px',v,v===3,v===3)));se.onchange=()=>sz=+se.value;tb.append(se);
 const colpick=document.createElement('input');colpick.type='color';colpick.value=col;colpick.title='Color Picker';colpick.oninput=()=>col=colpick.value;tb.append(colpick);
 btn(tb,'↶ Undo',undo);btn(tb,'↷ Redo',redo);
 btn(tb,'Xóa hết',()=>{if(stickmanMode){cancelStickmanMode();return}snapshot();x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height)});
 btn(tb,'Resize Canvas',()=>{if(stickmanMode){alert('Hãy hoàn tất hoặc hủy chế độ vẽ Stickman trước khi đổi kích thước canvas.');return}const dimensions=prompt('Canvas size (width,height):',`${c.width},${c.height}`);if(!dimensions)return;const [w,h]=dimensions.split(/[x, ]+/).map(Number);if(!Number.isInteger(w)||!Number.isInteger(h)||w<64||h<64||w>2048||h>2048){alert('Choose width and height between 64 and 2048 pixels.');return}const copy=document.createElement('canvas');copy.width=c.width;copy.height=c.height;copy.getContext('2d').drawImage(c,0,0);c.width=w;c.height=h;draft.width=w;draft.height=h;x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(copy,0,0,w,h);U=[x.getImageData(0,0,w,h)];R=[]});
 btn(tb,'Mở ảnh',()=>{if(stickmanMode){alert('Hãy hoàn tất hoặc hủy chế độ vẽ Stickman trước khi mở ảnh.');return}pick('image/*',l=>load(l[0]))});
 const modeButton=btn(tb,'Chế độ vẽ Stickman',startStickmanMode);
 const finishButton=btn(tb,'Hoàn tất & Tự làm đẹp',finishStickmanDrawing);finishButton.disabled=true;
 const cancelButton=btn(tb,'Hủy vẽ',cancelStickmanMode);cancelButton.disabled=true;
 const editSelect=document.createElement('select');editSelect.title='Chỉnh ngoại hình Stickman';
 const refreshEditOptions=()=>{const selected=editSelect.value;editSelect.replaceChildren(new Option('Chỉnh ngoại hình…',''));for(const person of XPStickman.list())editSelect.add(new Option(person.name,person.id));if([...editSelect.options].some(option=>option.value===selected))editSelect.value=selected};
 refreshEditOptions();
 editSelect.onchange=()=>{const id=editSelect.value;if(id){if(stickmanMode)cancelStickmanMode();createStickman({canvas:c,snapshot,addToCanvas,character:XPStickman.get(id)})}editSelect.value=''};
 tb.append(editSelect);
 const offCreated=XPBus.on('stickman:created',refreshEditOptions),offLoaded=XPBus.on('stickman:loaded',refreshEditOptions);
 btn(tb,'Lưu PNG',exportPNG);
 '#000000,#808080,#800000,#808000,#008000,#008080,#000080,#800080,#ffffff,#c0c0c0,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff'.split(',').forEach(k=>{const e=btn(pl,'',()=>{col=k;colpick.value=k});e.className='sw';e.style.background=k});
 function load(fl){if(!fl)return;const im=new Image();im.onload=()=>{snapshot();c.width=im.width;c.height=im.height;draft.width=im.width;draft.height=im.height;x.drawImage(im,0,0);URL.revokeObjectURL(im.src)};im.src=URL.createObjectURL(fl)}
 function exportPNG(){c.toBlob(bl=>{if(bl)dl(bl,'paint.png')},'image/png')}
 async function copy(){
  try{const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));if(navigator.clipboard?.write&&window.ClipboardItem)await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);else exportPNG()}
  catch(error){console.warn(error);exportPNG()}
 }
 async function paste(){
  try{if(!navigator.clipboard?.read)return;const items=await navigator.clipboard.read();for(const item of items){const type=item.types.find(t=>t.startsWith('image/'));if(!type)continue;const blob=await item.getType(type),im=await createImageBitmap(blob);snapshot();x.drawImage(im,0,0);return}}
  catch(error){alert('Không thể đọc ảnh từ clipboard.')}
 }
 function addToCanvas(agent){const px=Math.max(42,Math.min(c.width-42,c.width/2)),py=Math.max(90,Math.min(c.height-16,c.height*.76));XPAnimation.draw(x,px,py,XPAnimation.poseFor('idle',0),agent.color,1.45,{},agent.profile?.appearance);XPBus.emit('desktop:event',{kind:'paint-draw',source:'stickman-creator',characterId:agent.id})}
 function startStickmanMode(){
  if(stickmanMode)return;stickmanMode=true;draftStrokes=[];activeStroke=null;dx.clearRect(0,0,draft.width,draft.height);modeButton.disabled=true;finishButton.disabled=false;cancelButton.disabled=false;
  status.textContent='Chế độ vẽ Stickman: chỉ các nét vẽ mới trên lớp riêng sẽ được làm đẹp. Ảnh đang mở không bị đọc hoặc thay đổi.';c.style.cursor='crosshair';
 }
 function cancelStickmanMode(){
  if(!stickmanMode)return;stickmanMode=false;activeStroke=null;draftStrokes=[];dx.clearRect(0,0,draft.width,draft.height);modeButton.disabled=false;finishButton.disabled=true;cancelButton.disabled=true;
  status.textContent='Đã hủy bản vẽ Stickman. Ảnh Paint và các nét cũ được giữ nguyên.';c.style.cursor='crosshair';
 }
 async function finishStickmanDrawing(){
  if(!stickmanMode)return;
  if(activeStroke){draftStrokes.push(activeStroke);activeStroke=null}
  let model;
  try{model=XPStickmanDrawing.beautify(draftStrokes,c.width,c.height)}catch(error){status.textContent=error.message;return}
  const suggested=`Stickman ${XPStickman.list().length+1}`,name=prompt('Tên cho Stickman mới:',suggested);if(name===null)return;
  finishButton.disabled=true;status.textContent='Đang làm mượt nét vẽ, tạo ngoại hình và cấp một trí tuệ riêng…';
  try{
   const seedName=String(name||suggested).trim().slice(0,32)||suggested,color=model.strokes[0]?.color||'#202020',id=`drawn-${Date.now()}-${Math.random().toString(16).slice(2,8)}`;
   const appearance=XPStickmanAppearance.refine(XPStickmanAppearance.create(id,color,'Curious'),{seed:id,personality:'Curious',primaryColor:color});
   const composite=document.createElement('canvas');composite.width=c.width;composite.height=c.height;XPStickmanDrawing.draw(composite.getContext('2d'),model);
   const agent=await XPStickman.spawn({name:seedName,color,personality:'Curious',appearance});
   snapshot();x.drawImage(composite,0,0);
   try{const document=XPStickmanDrawing.toDocument(model,{name:`${seedName} — Bản vẽ gốc`,characterId:agent.id,width:c.width,height:c.height});const saved=await XPDrawing.save(document);await XPStickman.attachDrawing?.(agent.id,saved.id)}
   catch(saveError){console.warn('Không lưu được vector sketch',saveError);status.textContent='Đã tạo Stickman; bản vẽ vector chưa lưu được.'}
   XPBus.emit('desktop:event',{kind:'paint-draw',tool:'stickman-finish',characterId:agent.id});
   stickmanMode=false;activeStroke=null;draftStrokes=[];dx.clearRect(0,0,draft.width,draft.height);modeButton.disabled=false;finishButton.disabled=true;cancelButton.disabled=true;c.style.cursor='crosshair';
   status.textContent=`Đã hoàn tất ${agent.name}. Nét vẽ đã được làm mượt và hồ sơ ngoại hình được tối ưu tự động.`;showStickmanProfile(agent.id);refreshEditOptions();
  }catch(error){finishButton.disabled=false;status.textContent=`Chưa thể tạo Stickman: ${error.message}`}
 }
 const actions={undo,redo,copy,cut:async()=>{await copy();snapshot();x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height)},paste,selectAll:()=>{selection={x:0,y:0,w:c.width,h:c.height};x.save();x.strokeStyle='#1764c0';x.setLineDash([5,4]);x.strokeRect(1,1,c.width-2,c.height-2);x.restore()},createStickman:(characterId=null)=>characterId?createStickman({canvas:c,snapshot,addToCanvas,character:XPStickman.get(characterId)}):startStickmanMode(),startStickmanMode,editStickman:characterId=>createStickman({canvas:c,snapshot,addToCanvas,character:XPStickman.get(characterId)}),export:exportPNG};
 window.XPPaint=window.XPPaint||{};window.XPPaint[record.id]=actions;
 record.cleanup=()=>{if(stickmanMode)cancelStickmanMode();delete window.XPPaint[record.id];offCreated();offLoaded()};
 function pos(e){const r=c.getBoundingClientRect();return[(e.clientX-r.left)*c.width/r.width,(e.clientY-r.top)*c.height/r.height]}
 function fill(sx,sy){
  const im=x.getImageData(0,0,c.width,c.height),q=im.data,W=c.width,H=c.height,h=parseInt(col.slice(1),16),R=h>>16,G=h>>8&255,B=h&255,i0=(sy*W+sx)*4,tr=q[i0],tg=q[i0+1],tbb=q[i0+2];if(tr===R&&tg===G&&tbb===B)return;const stack=[[sx,sy]];
  while(stack.length){const [a,e]=stack.pop();if(a<0||e<0||a>=W||e>=H)continue;const i=(e*W+a)*4;if(q[i]!==tr||q[i+1]!==tg||q[i+2]!==tbb)continue;q[i]=R;q[i+1]=G;q[i+2]=B;stack.push([a+1,e],[a-1,e],[a,e+1],[a,e-1])}x.putImageData(im,0,0);
 }
 c.onpointerdown=e=>{
  const [X,Y]=pos(e);p0=[X,Y];
  if(stickmanMode){activeStroke={id:`stroke-${Date.now()}-${draftStrokes.length}`,points:[{x:X,y:Y}],color:col,width:sz};c.setPointerCapture(e.pointerId);dx.strokeStyle=col;dx.lineWidth=sz;dx.lineCap='round';dx.beginPath();dx.moveTo(X,Y);dx.lineTo(X+.1,Y+.1);dx.stroke();return}
  if(tool==='fill'){snapshot();fill(X|0,Y|0);XPBus.emit('desktop:event',{kind:'paint-draw',tool,appId:'paint'});return}
  snapshot();d=1;s=x.getImageData(0,0,c.width,c.height);c.setPointerCapture(e.pointerId);x.lineCap='round';x.lineWidth=tool==='eraser'?sz*4:sz;x.strokeStyle=tool==='eraser'?'#fff':col;x.beginPath();x.moveTo(X,Y);x.lineTo(X+.1,Y);x.stroke();x.beginPath();x.moveTo(X,Y);
 };
 c.onpointermove=e=>{
  const [X,Y]=pos(e);
  if(stickmanMode&&activeStroke){const last=activeStroke.points.at(-1);if(Math.hypot(X-last.x,Y-last.y)>=1){activeStroke.points.push({x:X,y:Y});dx.lineTo(X,Y);dx.stroke();dx.beginPath();dx.moveTo(X,Y)}return}
  if(!d)return;
  if(tool==='pen'||tool==='brush'||tool==='eraser'){x.lineTo(X,Y);x.stroke();x.beginPath();x.moveTo(X,Y)}
  else if(tool==='spray'){x.fillStyle=col;for(let i=0;i<14;i++)x.fillRect(X+(Math.random()-.5)*sz*6,Y+(Math.random()-.5)*sz*6,1,1)}
  else{x.putImageData(s,0,0);x.beginPath();if(tool==='line'){x.moveTo(...p0);x.lineTo(X,Y)}else if(tool==='ellipse')x.ellipse((p0[0]+X)/2,(p0[1]+Y)/2,Math.abs(X-p0[0])/2,Math.abs(Y-p0[1])/2,0,0,7);else x.rect(p0[0],p0[1],X-p0[0],Y-p0[1]);x.stroke()}
 };
 c.onpointerup=()=>{if(stickmanMode){if(activeStroke){draftStrokes.push(activeStroke);activeStroke=null;status.textContent=`Đã ghi ${draftStrokes.length} nét. Tiếp tục vẽ hoặc chọn Hoàn tất & Tự làm đẹp.`}return}if(d)XPBus.emit('desktop:event',{kind:'paint-draw',tool,appId:'paint'});d=null};
 c.onpointercancel=()=>{d=null;if(stickmanMode)activeStroke=null};
 if(f)load(f);
}
/* Calculator — safe arithmetic parser, no eval/Function */
function parseArithmetic(source){
 const tokens=source.match(/\d+(?:\.\d+)?|[()+\-*/]/g)||[];
 if(tokens.join('')!==source.replace(/\s+/g,''))throw new Error('Biểu thức không hợp lệ');
 let i=0;
 const primary=()=>{
  const t=tokens[i++];
  if(t==='+')return primary();
  if(t==='-')return -primary();
  if(t==='('){const v=expression();if(tokens[i++]!==')')throw new Error('Thiếu dấu )');return v}
  if(!t||!(/^\d+(?:\.\d+)?$/.test(t)))throw new Error('Thiếu số');
  return Number(t);
 };
 const term=()=>{let v=primary();while(tokens[i]==='*'||tokens[i]==='/'){const op=tokens[i++],r=primary();if(op==='/'&&r===0)throw new Error('Không thể chia cho 0');v=op==='*'?v*r:v/r}return v};
 const expression=()=>{let v=term();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],r=term();v=op==='+'?v+r:v-r}return v};
 const result=expression();if(i!==tokens.length||!Number.isFinite(result))throw new Error('Biểu thức không hợp lệ');return Number(result.toFixed(10));
}
function calc(b){
 b.innerHTML=`<div id=calcd>0</div><div class=ck></div><div class=sb>Memory: 0 · Lịch sử: 0</div>`;
 const dp=b.firstChild,grid=b.children[1],status=b.children[2];let expression='',memory=0,history=[];
 const update=()=>{dp.textContent=expression||'0';status.textContent=`Memory: ${memory} · Lịch sử: ${history.length}`};
 const keys='MC,MR,M+,M-,C,⌫,(,),7,8,9,/,4,5,6,*,1,2,3,-,0,.,=,+'.split(',');
 keys.forEach(k=>btn(grid,k,()=>{
  if(k==='C')expression='';
  else if(k==='⌫')expression=expression.slice(0,-1);
  else if(k==='='){
   try{const result=parseArithmetic(expression);history.unshift(`${expression} = ${result}`);history=history.slice(0,20);expression=String(result)}
   catch(error){expression='Lỗi';status.textContent=error.message}
  }else if(k==='MC')memory=0;
  else if(k==='MR')expression=String(memory);
  else if(k==='M+')memory+=Number(parseArithmetic(expression||'0'));
  else if(k==='M-')memory-=Number(parseArithmetic(expression||'0'));
  else expression=(expression==='Lỗi'?'':expression)+k;
  update();
 }));
 b.tabIndex=0;
 b.addEventListener('keydown',e=>{
  if(!/^[0-9.+\-*/()]$/.test(e.key)&&!['Backspace','Delete','Enter','Escape'].includes(e.key))return;
  e.preventDefault();
  if(e.key==='Enter')grid.querySelector('button:nth-last-child(2)')?.click();
  else if(e.key==='Escape')grid.querySelectorAll('button')[4]?.click();
  else if(e.key==='Backspace')expression=expression.slice(0,-1);
  else expression+=e.key;
  update();
 });
 const historyButton=document.createElement('button');historyButton.textContent='Lịch sử';
 historyButton.onclick=()=>alert(history.length?history.join('\n'):'Chưa có phép tính nào.');
 b.insertBefore(historyButton,status);
 update();
}

/* Minesweeper */
function mines(b){
 const LV={1:[9,9,10],2:[16,16,40],3:[30,16,99]},col=['','#00f','#080','#f00','#008','#800','#088','#000','#888'];let lv=1,W,H,M,g,over,first,fl,t,iv;
 const bar=document.createElement('div');bar.className='bar';const el=document.createElement('div');el.className='ms';b.append(bar,el);b.style.overflow='auto';
 [['Dễ',1],['Vừa',2],['Khó',3]].forEach(([n,k])=>btn(bar,n,()=>{lv=k;init()}));
 const nb=i=>{const r=[],x=i%W,y=i/W|0;for(let dy=-1;dy<2;dy++)for(let dx=-1;dx<2;dx++){const a=x+dx,c=y+dy;if((dx||dy)&&a>=0&&a<W&&c>=0&&c<H)r.push(c*W+a)}return r};
 function init(){[W,H,M]=LV[lv];clearInterval(iv);t=0;over=0;first=1;fl=0;g=[...Array(W*H)].map(()=>({m:0,o:0,f:0,n:0}));const w=b.parentElement;w.style.width=Math.max(240,W*22+50)+'px';w.style.height=H*22+160+'px';draw()}
 function open(i){const c=g[i];if(c.o||c.f)return;c.o=1;if(c.m){over=1;g.forEach(z=>z.m&&!z.f&&(z.o=1));return}if(!c.n)nb(i).forEach(open)}
 function draw(){el.innerHTML=`<div class=mh><span>${String(M-fl).padStart(3,0)}</span><b data-i=r>${over?over>1?'😎':'😵':'🙂'}</b><span>${String(Math.min(t,999)).padStart(3,0)}</span></div><div class=mg style="grid-template-columns:repeat(${W},22px)">`+g.map((c,i)=>`<i data-i=${i} class="${c.o?'o':''}" style="color:${col[c.n]}">${c.o?c.m?'💣':c.n||'':c.f?'🚩':''}</i>`).join('')+'</div>'}
 el.onclick=e=>{const i=e.target.dataset.i;if(i=='r')return init();if(i==null||over)return;const k=+i,c=g[k];
  if(first){first=0;let n=0;while(n<M){const r=Math.random()*W*H|0;if(r!=k&&!g[r].m&&!nb(k).includes(r)){g[r].m=1;n++}}g.forEach((z,j)=>z.n=nb(j).filter(q=>g[q].m).length);iv=setInterval(()=>{if(!el.isConnected||over)return clearInterval(iv);t++;draw()},1000)}
  if(c.o&&c.n){const ns=nb(k);if(ns.filter(q=>g[q].f).length==c.n)ns.forEach(open)}else open(k);
  if(!over&&g.filter(z=>z.o).length==W*H-M)over=2;draw()};
 el.oncontextmenu=e=>{e.preventDefault();const i=e.target.dataset.i;if(i==null||i=='r'||over||first)return;const c=g[+i];if(!c.o){c.f=!c.f;fl+=c.f?1:-1;draw()}};
 init();
}
/* Solitaire */
function solitaire(b){
 const bar=document.createElement('div');bar.className='bar';const el=document.createElement('div');el.className='sol';b.append(bar,el);const ms=document.createElement('span');let H=[],moves=0,n=1,won=0;
 btn(bar,'Ván mới',()=>init());btn(bar,'↶ Hoàn tác',()=>{if(H.length){[st,wa,fo,ta]=JSON.parse(H.pop());sel=null;draw()}});const bn=btn(bar,'Rút: 1',()=>{n=n==1?3:1;bn.textContent='Rút: '+n});bar.append(ms);
 const R='A,2,3,4,5,6,7,8,9,10,J,Q,K'.split(','),S='♠♥♦♣';let st,wa,fo,ta,sel;
 const red=c=>c.s==1||c.s==2,pile=id=>id=='w'?wa:id[0]=='f'?fo[+id[1]]:ta[+id[1]];
 function init(){let d=[];for(let s=0;s<4;s++)for(let r=0;r<13;r++)d.push({r,s,up:0});d.sort(()=>Math.random()-.5);ta=[];for(let i=0;i<7;i++){ta.push(d.splice(0,i+1));ta[i][i].up=1}st=d;wa=[];fo=[[],[],[],[]];sel=null;H=[];moves=0;won=0;draw()}
 const can=(c,p,F)=>{const t=p.at(-1);return F?(t?t.s==c.s&&c.r==t.r+1:c.r==0):(t?red(t)!=red(c)&&t.r==c.r+1:c.r==12)};
 function mv(p,F){if(!sel||sel.p==p||(F&&sel.i!=sel.p.length-1)||!can(sel.p[sel.i],p,F))return 0;H.push(JSON.stringify([st,wa,fo,ta]));moves++;sel.p.splice(sel.i).forEach(x=>p.push(x));const l=sel.p.at(-1);if(l)l.up=1;sel=null;return 1}
 function draw(){const cd=(c,p,i,x,y)=>`<div class="cd${c.up?red(c)?' r':'':' dn'}${sel&&sel.p===pile(p)&&i>=sel.i?' sl':''}" data-p="${p}" data-i="${i}" style="left:${x}px;top:${y}px">${c.up?R[c.r]+S[c.s]:''}</div>`;
  let h=`<div class="cd e" data-p=s style="left:6px;top:6px">${st.length?'':'↺'}</div>`;if(st.length)h+=`<div class="cd dn" data-p=s style="left:6px;top:6px"></div>`;
  if(wa.length)h+=cd(wa.at(-1),'w',wa.length-1,68,6);
  fo.forEach((f,k)=>{const x=(3+k)*62+6;h+=`<div class="cd e" data-p=f${k} style="left:${x}px;top:6px"></div>`;if(f.length)h+=cd(f.at(-1),'f'+k,f.length-1,x,6)});
  ta.forEach((t,k)=>{h+=`<div class="cd e" data-p=t${k} style="left:${k*62+6}px;top:100px"></div>`;let y=100;t.forEach((c,j)=>{h+=cd(c,'t'+k,j,k*62+6,y);y+=c.up?20:6})});
  el.innerHTML=h;ms.textContent='Nước đi: '+moves;if(!won&&fo.every(f=>f.length==13)){won=1;setTimeout(()=>alert('🎉 Bạn đã thắng!'),50)}}
 el.onclick=e=>{const c=e.target.closest('[data-p]');if(!c)return;const id=c.dataset.p,i=+c.dataset.i||0;
  if(id=='s'){if(st.length){H.push(JSON.stringify([st,wa,fo,ta]));for(let k=0;k<n&&st.length;k++){const x=st.pop();x.up=1;wa.push(x)}}else{st=wa.reverse();st.forEach(x=>x.up=0);wa=[]}sel=null;return draw()}
  const p=pile(id);if(mv(p,id[0]=='f'))return draw();
  sel=p[i]&&p[i].up&&(id!='w'||i==p.length-1)?{p,i}:null;draw()};
 el.ondblclick=()=>{if(sel&&sel.i==sel.p.length-1)for(const f of fo)if(mv(f,1))break;draw()};
 init();
}
/* Internet Explorer — Electron uses WebContentsView; web hosting uses a sandboxed iframe adapter. */
function ie(b,_arg,record){
 const sessionId=record.browserSessionId;
 b.innerHTML=`<div class="browser-tabs"></div><div class="browser-toolbar"></div><div class="browser-page-host"></div><div class="sb browser-status">Tab mới</div>`;
 const [tabbar,toolbar,host,status]=b.children;
 host.classList.add('browser-page-host');
 host.dataset.browserSession=sessionId;
 let state={tabs:[],activeTabId:null,store:{home:'https://www.google.com',engine:'google',bookmarks:[],history:[]}};
 const command=(name,payload={})=>window.xpHost.browser.command(sessionId,name,payload);
 const back=btn(toolbar,'◀',()=>command('back'));back.title='Quay lại';
 const forward=btn(toolbar,'▶',()=>command('forward'));forward.title='Tiến tới';
 const reload=btn(toolbar,'⟳',()=>command(state.tabs.find(t=>t.id===state.activeTabId)?.loading?'stop':'reload'));reload.title='Tải lại hoặc dừng';
 btn(toolbar,'⌂',()=>command('home')).title='Trang chủ';
 const address=document.createElement('input');address.className='browser-address';address.placeholder='Nhập địa chỉ web hoặc từ khóa';address.spellcheck=false;
 address.addEventListener('keydown',e=>{if(e.key==='Enter'){command('navigate',{url:address.value});address.blur()}});
 address.addEventListener('focus',()=>address.select());
 toolbar.append(address);
 const engineSelect=document.createElement('select');engineSelect.className='browser-engine';engineSelect.title='Công cụ tìm kiếm';
 [['google','Google'],['bing','Bing'],['duckduckgo','DuckDuckGo']].forEach(([value,label])=>engineSelect.add(new Option(label,value)));
 engineSelect.onchange=()=>command('settings',{home:state.store?.home||'https://www.google.com',engine:engineSelect.value});
 toolbar.append(engineSelect);
 btn(toolbar,'Tìm',()=>command('navigate',{url:address.value,forceSearch:true})).title='Tìm nội dung, không mở như địa chỉ';
 btn(toolbar,'Đi',()=>command('navigate',{url:address.value}));
 const star=btn(toolbar,'☆',()=>command('bookmark'));star.title='Thêm hoặc bỏ dấu trang';
 btn(toolbar,'Dấu trang',async()=>{
  const store=await command('get-store');const list=(store.bookmarks||[]).slice(0,30);
  if(!list.length){alert('Chưa có dấu trang.');return}
  const choice=prompt('Dấu trang:\n'+list.map((x,i)=>`${i+1}. ${x.title||x.url}`).join('\n')+'\n\nNhập số để mở:');
  const item=list[Number(choice)-1];if(item)command('open-bookmark',{url:item.url});
 });
 btn(toolbar,'Lịch sử',async()=>{
  const store=await command('get-store');const list=(store.history||[]).slice(0,30);
  if(!list.length){alert('Lịch sử đang trống.');return}
  const choice=prompt('Lịch sử gần đây:\n'+list.map((x,i)=>`${i+1}. ${x.title||x.url}`).join('\n')+'\n\nNhập số để mở:');
  const item=list[Number(choice)-1];if(item)command('navigate',{url:item.url});
 });
 btn(toolbar,'Tab mới',()=>command('new-tab'));
 btn(toolbar,'Mở ngoài',()=>{const current=state.tabs.find(t=>t.id===state.activeTabId);if(current?.url&&/^https?:\/\//i.test(current.url)){const opened=window.open(current.url,'_blank','noopener,noreferrer');if(!opened)status.textContent='Popup bị chặn. Hãy cho phép mở tab mới trên trình duyệt.'}}).title='Mở trang trong tab trình duyệt thật, ngoài iframe';
 btn(toolbar,'Trang chủ…',async()=>{
  const store=await command('get-store');const home=prompt('Trang chủ (HTTP/HTTPS):',store.home||'https://www.google.com');
  if(home)command('settings',{home,engine:store.engine});
 });
 function render(s){
  if(!s||s.sessionId!==sessionId)return;
  state=s;tabbar.replaceChildren();engineSelect.value=s.store?.engine||'google';
  for(const tab of s.tabs){
   const t=document.createElement('button');t.className='browser-tab'+(tab.id===s.activeTabId?' active':'');t.type='button';t.dataset.tabId=String(tab.id);
   const label=document.createElement('span');label.textContent=(tab.loading?'◌ ':'')+(tab.title||'Tab mới');
   const close=document.createElement('b');close.textContent='×';close.title='Đóng tab';
   close.onclick=e=>{e.stopPropagation();command('close-tab',{tabId:tab.id})};
   t.append(label,close);t.onclick=()=>command('select-tab',{tabId:tab.id});tabbar.append(t);
  }
  const current=s.tabs.find(t=>t.id===s.activeTabId);
  if(current&&document.activeElement!==address)address.value=current.url||'';
  const saved=(s.store?.bookmarks||[]).some(x=>x.url===current?.url);
  star.textContent=saved?'★':'☆';
  back.disabled=!current?.canBack;forward.disabled=!current?.canForward;
  reload.textContent=current?.loading?'×':'⟳';
  status.textContent=current?.loading?'Đang tải trang…':(current?.url||'Tab mới')+' · Website chặn iframe? Chọn Mở ngoài.';
 }
 const off=window.xpHost.browser.onState(render);
 record.cleanup=()=>off();
 window.xpHost.browser.create(sessionId);
}
/* Media Player */
function media(b,f){
 b.innerHTML=`<div class=bar></div><div style="flex:1;background:#000;display:flex"><video controls style="width:100%;height:100%"></video></div><div class=sb>Chưa có tệp nào.</div>`;
 const [bar,box,sb]=b.children,v=box.firstChild;
 const play=fl=>{if(!fl)return;if(v.src?.startsWith('blob:'))URL.revokeObjectURL(v.src);v.src=URL.createObjectURL(fl);v.play().catch(()=>{});sb.textContent='Đang phát: '+fl.name};
 btn(bar,'📂 Mở tệp nhạc/video',()=>pick('audio/*,video/*',l=>play(l[0])));if(f)play(f);
 record.cleanup=()=>{v.pause();if(v.src?.startsWith('blob:'))URL.revokeObjectURL(v.src);v.removeAttribute('src');v.load()};
}
/* Stickman manager — algorithmic simulation with IndexedDB-backed memories */
function stickmanApp(b,_arg,record){
 b.innerHTML=`<div class="bar"><button data-new>Mở Paint · Vẽ Stickman</button><button data-export>Xuất dữ liệu JSON</button><button data-import>Nhập dữ liệu JSON</button><button data-refresh>Làm mới</button></div><div class="stickman-manager"></div>`;
 const list=b.querySelector('.stickman-manager');
 const refresh=()=>{
  list.replaceChildren();
  const people=XPStickman.list();
  if(!people.length){const p=document.createElement('p');p.textContent='Chưa có nhân vật. Hãy tạo stickman đầu tiên.';list.append(p);return}
  for(const a of people){
   const row=document.createElement('div');row.className='stickman-row';
   const dot=document.createElement('i');dot.style.background=a.color;
   const info=document.createElement('div');info.className='stickman-info';
   const name=document.createElement('b');name.textContent=a.name;
   const sub=document.createElement('small');sub.textContent=`${a.personality} · ${a.state} · ${a.memoryCount} ký ức · AI: ${a.profile?.mind?.model?.status==='connected'?'Online':'Local'}`;
   info.append(name,sub);
   const profile=btn(row,'Hồ sơ',()=>showStickmanProfile(a.id));
   const edit=btn(row,'Ngoại hình',()=>openPaintStickmanCreator(a.id));
   const memories=btn(row,'Ký ức',()=>XPStickman.showMemory(a.id));
   const follow=btn(row,a.follow?'Dừng theo':'Theo chuột',()=>XPStickman.command(a.id,a.follow?'stay':'follow'));
   row.append(dot,info,profile,edit,memories,follow);list.append(row);
  }
 };
 b.querySelector('[data-new]').onclick=()=>openPaintStickmanCreator();
 b.querySelector('[data-export]').onclick=()=>XPStickman.exportAll();
 b.querySelector('[data-import]').onclick=()=>pick('.json',async files=>{
  if(!files?.[0])return;
  try{const data=JSON.parse(await files[0].text());await XPStickman.importAll(data);refresh()}catch(e){alert('JSON không hợp lệ: '+e.message)}
 });
 b.querySelector('[data-refresh]').onclick=refresh;
 const offCreated=XPBus.on('stickman:created',refresh);const offLoaded=XPBus.on('stickman:loaded',refresh);const offMemory=XPBus.on('stickman:memory',refresh);
 record.cleanup=()=>{offCreated();offLoaded();offMemory()};
 setTimeout(()=>{if(record.el.isConnected)refresh()},300);
}
function createStickman({canvas=null,snapshot=null,addToCanvas=null,character=null}={}){
 if(!character){alert('Hãy bật Chế độ vẽ Stickman trong Paint để vẽ nhân vật.');return}
 const appearanceApi=window.XPStickmanAppearance;
 if(!appearanceApi){alert('Stickman Appearance chưa sẵn sàng.');return}
 const shade=document.createElement('div');shade.className='xp-dialog-shade';
 const form=document.createElement('form');form.className='xp-dialog xp-stickman-creator';
 const title=document.createElement('h3');title.textContent='Edit Stickman Appearance';
 const layout=document.createElement('div');layout.className='stickman-creator-layout';
 const controls=document.createElement('div');controls.className='stickman-creator-controls';
 const preview=document.createElement('canvas');preview.width=260;preview.height=250;preview.className='stickman-creator-preview';
 const field=(label,control)=>{const wrap=document.createElement('label');wrap.textContent=label;wrap.append(control);controls.append(wrap);return control};
 const name=document.createElement('input');name.required=true;name.maxLength=32;name.value=character?.name||'Shadow';field('Tên nhân vật',name);
 const personality=document.createElement('select');XPAI.PERSONALITIES.forEach(value=>personality.add(new Option(value,value)));personality.value=character?.personality||'Curious';field('Tính cách',personality);
 const lineColor=document.createElement('input');lineColor.type='color';lineColor.value=character?.color||'#202020';field('Màu nét chính',lineColor);
 const currentAppearance=()=>appearanceApi.normalize(character?.profile?.appearance||appearanceApi.create(character?.id||name.value,lineColor.value,personality.value),lineColor.value);
 let look=currentAppearance();
 const selectField=(label,values,selected)=>{const control=document.createElement('select');values.forEach(value=>control.add(new Option(({tee:'T-shirt',hoodie:'Hoodie',jacket:'Jacket',sweater:'Sweater',none:'Không có',glasses:'Kính',scarf:'Khăn',headphones:'Tai nghe',badge:'Huy hiệu',short:'Tóc ngắn',spiky:'Tóc nhọn',fringe:'Mái',long:'Tóc dài',cap:'Mũ',round:'Tròn',soft:'Bo mềm',square:'Vuông',smile:'Cười',neutral:'Trung tính',focused:'Tập trung'}[value]||value),value)));control.value=selected;field(label,control);return control};
 const skin=selectField('Tông da',appearanceApi.SKIN_TONES,look.skinTone);
 const hairStyle=selectField('Kiểu tóc',appearanceApi.HAIR,look.hairStyle);
 const hairColor=document.createElement('input');hairColor.type='color';hairColor.value=look.hairColor;field('Màu tóc',hairColor);
 const outfitStyle=selectField('Trang phục',appearanceApi.OUTFITS,look.outfitStyle);
 const outfitColor=document.createElement('input');outfitColor.type='color';outfitColor.value=look.outfitColor;field('Màu trang phục',outfitColor);
 const accessory=selectField('Phụ kiện',appearanceApi.ACCESSORIES,look.accessory);
 const expression=selectField('Biểu cảm',appearanceApi.EXPRESSIONS,look.expression);
 const headShape=selectField('Kiểu đầu',appearanceApi.HEAD_SHAPES,look.headShape);
 const accentColor=document.createElement('input');accentColor.type='color';accentColor.value=look.accentColor;field('Màu nhấn',accentColor);
 const previewPanel=document.createElement('div');previewPanel.className='stickman-creator-preview-panel';
 const previewLabel=document.createElement('b');previewLabel.textContent='Live Preview';const previewNote=document.createElement('small');previewNote.textContent='Tối ưu chỉ tác động lên hồ sơ ngoại hình Stickman, không quét hoặc chỉnh sửa ảnh Paint.';previewPanel.append(previewLabel,preview,previewNote);
 layout.append(controls,previewPanel);
 const status=document.createElement('p');status.className='creator-status';status.textContent='Chỉnh sửa ngoại hình riêng của nhân vật. Bộ não và ký ức không bị đặt lại.';
 const actions=document.createElement('div');actions.className='dialog-actions';
 const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Hủy';cancel.onclick=()=>shade.remove();
 const optimize=document.createElement('button');optimize.type='button';optimize.textContent='✨ Tối ưu ngoại hình';
 const save=document.createElement('button');save.type='submit';save.textContent='Lưu ngoại hình';
 actions.append(cancel,optimize,save);form.append(title,layout,status,actions);shade.append(form);document.body.append(shade);
 const readLook=()=>appearanceApi.normalize({headShape:headShape.value,skinTone:skin.value,hairStyle:hairStyle.value,hairColor:hairColor.value,outfitStyle:outfitStyle.value,outfitColor:outfitColor.value,accessory:accessory.value,expression:expression.value,accentColor:accentColor.value},lineColor.value);
 const paintLook=()=>{look=readLook();const ctx=preview.getContext('2d');ctx.clearRect(0,0,preview.width,preview.height);ctx.fillStyle='#f5f8fc';ctx.fillRect(0,0,preview.width,preview.height);ctx.strokeStyle='#d7e2f0';ctx.strokeRect(8,8,preview.width-16,preview.height-16);XPAnimation.draw(ctx,preview.width/2,195,XPAnimation.poseFor('idle',0),lineColor.value,2.55,{},look);ctx.fillStyle='#52657b';ctx.font='11px Tahoma';ctx.textAlign='center';ctx.fillText(name.value||'Stickman',preview.width/2,22)};
 [name,personality,lineColor,skin,hairStyle,hairColor,outfitStyle,outfitColor,accessory,expression,headShape,accentColor].forEach(control=>control.addEventListener('input',paintLook));
 optimize.onclick=()=>{look=appearanceApi.refine(readLook(),{seed:character?.id||name.value,personality:personality.value,primaryColor:lineColor.value});skin.value=look.skinTone;hairStyle.value=look.hairStyle;hairColor.value=look.hairColor;outfitStyle.value=look.outfitStyle;outfitColor.value=look.outfitColor;accessory.value=look.accessory;expression.value=look.expression;headShape.value=look.headShape;accentColor.value=look.accentColor;paintLook();status.textContent='Đã cân chỉnh bảng màu, kiểu tóc, trang phục và phụ kiện cho riêng Stickman.'};
 form.onsubmit=async event=>{event.preventDefault();save.disabled=true;try{const data={color:lineColor.value,appearance:readLook(),name:name.value,personality:personality.value};await XPStickman.updateAppearance(character.id,data);status.textContent='Đã lưu ngoại hình nhân vật; ký ức và trí tuệ được giữ nguyên.';shade.remove()}catch(error){save.disabled=false;status.textContent=`Không thể lưu ngoại hình: ${error.message}`} };
 paintLook();name.focus();
}
function openPaintStickmanCreator(characterId=null){
 const existing=[...XPWM.windows.values()].find(item=>item.appId==='paint'&&!item.destroyed);
 if(existing){if(existing.minimized)XPWM.restore(existing.id);else XPWM.focus(existing.id);window.XPPaint?.[existing.id]?.createStickman(characterId);return existing}
 const record=run('paint');if(record)window.XPPaint?.[record.id]?.createStickman(characterId);return record;
}
function previewStickmanAnimation(project,character){
 const record=XPWM.create({title:project.name||'Stickman Animation Preview',icon:'▶',width:500,height:340,appId:'animation-preview',build:(body,el,windowRecord)=>{
  body.innerHTML='<div class="stickman-animation-preview"><canvas width="460" height="250"></canvas><div class="bar"><button data-play>▶ Play</button><span data-status>Generated animation</span></div></div>';
  const canvas=body.querySelector('canvas'),ctx=canvas.getContext('2d'),play=body.querySelector('[data-play]'),status=body.querySelector('[data-status]');let frame=0,started=0,raf=0,playing=false;
  const appearance=character?.profile?.appearance||project.metadata?.appearance||null,color=character?.color||'#202020';
  const render=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='#dce5ef';ctx.strokeRect(8,8,canvas.width-16,canvas.height-16);const value=XPAnimation.interpolate(project,frame);const pose=value.poseData||XPAnimation.poseFor(value.pose,frame*1000/project.fps);XPAnimation.draw(ctx,canvas.width/2+value.x,canvas.height/2+value.y+28,pose,value.color||color,1.65*value.scale,{},appearance);status.textContent=`${project.fps} FPS · Frame ${Math.round(frame)} / ${project.duration}`};
  const stop=()=>{playing=false;if(raf)cancelAnimationFrame(raf);raf=0;play.textContent='▶ Play'};
  play.onclick=()=>{if(playing){stop();return}playing=true;play.textContent='Ⅱ Pause';started=performance.now()-frame*1000/project.fps;const tick=now=>{if(!playing)return;frame=((now-started)*project.fps/1000)%project.duration;render();raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick)};
  render();windowRecord.cleanup=stop;
 }});return record;
}

function showStickmanProfile(id){
 const a=XPStickman.get(id);if(!a)return;
 const body=document.createElement('div');body.className='stickman-profile';
 const heading=document.createElement('div');heading.className='profile-heading';
 const avatar=document.createElement('span');avatar.className='profile-avatar';avatar.style.color=a.color;avatar.textContent='●';
 const title=document.createElement('div');const h=document.createElement('h2');h.textContent=a.name;const caption=document.createElement('small');caption.textContent=`${a.personality} · ${a.state} · ${a.action}`;title.append(h,caption);heading.append(avatar,title);body.append(heading);
 const fields=document.createElement('div');fields.className='profile-stats';
 const addStat=(label,value)=>{const item=document.createElement('div');const name=document.createElement('small');name.textContent=label;const strong=document.createElement('b');strong.textContent=String(value);item.append(name,strong);fields.append(item)};
 addStat('Emotion',a.emotion);addStat('Energy',`${Math.round(a.energy*100)}%`);addStat('Memory Count',a.memoryCount);addStat('User Affinity',`${Math.round(a.userAffinity||0)}/100`);addStat('Autonomy',a.autonomy?'Automatic':'Manual');addStat('Bộ não',a.profile?.mind?.model?.status==='connected'?'AI trung tâm':'AI cục bộ / chờ cấu hình');addStat('Trải nghiệm',a.profile?.mind?.experienceCount||0);addStat('Khuynh hướng',a.profile?.mind?.disposition||'Đang hình thành');body.append(fields);
 const addMeters=(headingText,values)=>{const section=document.createElement('section');section.className='profile-section';const h3=document.createElement('h3');h3.textContent=headingText;section.append(h3);for(const [key,value] of Object.entries(values||{})){const row=document.createElement('div');row.className='profile-meter';const label=document.createElement('span');label.textContent=key;const track=document.createElement('div');track.className='profile-meter-track';const fill=document.createElement('i');const amount=Math.max(0,Math.min(1,Number(value)||0));fill.style.width=`${amount*100}%`;track.append(fill);const number=document.createElement('small');number.textContent=`${Math.round(amount*100)}%`;row.append(label,track,number);section.append(row)}body.append(section)};
 addMeters('Personality Traits',a.profile?.traits||{});addMeters('Needs',a.needs||{});
 const chatSection=document.createElement('section');chatSection.className='profile-section';const chatTitle=document.createElement('h3');chatTitle.textContent='Trò chuyện với trí tuệ riêng';const chatInput=document.createElement('textarea');chatInput.rows=2;chatInput.maxLength=1200;chatInput.placeholder='Nói chuyện với '+a.name+'…';chatInput.className='stickman-chat-input';chatSection.append(chatTitle,chatInput);const chatSend=btn(chatSection,'Gửi tin nhắn',async()=>{const message=chatInput.value.trim();if(!message)return;chatSend.disabled=true;chatTitle.textContent='Bộ não đang xử lý…';try{await XPStickman.chat(id,message);chatInput.value='';chatTitle.textContent='Trò chuyện với trí tuệ riêng';refreshHeader()}catch(error){chatTitle.textContent='AI chưa phản hồi: '+error.message}finally{chatSend.disabled=false}});body.append(chatSection);
 const abilities=document.createElement('section');abilities.className='profile-section';const abilityTitle=document.createElement('h3');abilityTitle.textContent='Special Abilities';abilities.append(abilityTitle);
 (a.profile?.abilities||[]).forEach(ab=>{const p=document.createElement('p');p.textContent=`${ab.name} — ${ab.description} · Cooldown ${ab.cooldown/1000}s`;abilities.append(p)});body.append(abilities);
 const goals=document.createElement('section');goals.className='profile-section';const goalTitle=document.createElement('h3');goalTitle.textContent='Goals';goals.append(goalTitle);
 if(!(a.goals||[]).length){const p=document.createElement('p');p.textContent='No saved goals yet. The autonomous planner creates short-term goals from desktop context.';goals.append(p)}else for(const goal of a.goals){const p=document.createElement('p');p.textContent=`${goal.type||goal.goalType} · ${goal.status||'active'} · ${Math.round((goal.progress||0)*100)}%`;goals.append(p)}body.append(goals);
 const social=document.createElement('section');social.className='profile-section';const socialTitle=document.createElement('h3');socialTitle.textContent='Relationships';social.append(socialTitle);
 const entries=Object.entries(a.relationships||{});if(!entries.length){const p=document.createElement('p');p.textContent='No relationships recorded yet.';social.append(p)}else entries.slice(0,12).forEach(([otherId,affinity])=>{const other=XPStickman.get(otherId);const p=document.createElement('p');p.textContent=`${other?.name||'Unknown Stickman'} · ${affinity} interactions`;social.append(p)});body.append(social);
 const actions=document.createElement('div');actions.className='bar profile-actions';let refreshAssets=()=>{};
 [['Talk','talk'],['Follow','follow'],['Stay','stay'],['Wave','wave'],['Play','play'],['Rest','rest'],['Create Artwork','create'],['Interact','interact']].forEach(([label,command])=>btn(actions,label,async()=>{await XPStickman.command(id,command);refreshHeader()}));
 btn(actions,'Chỉnh ngoại hình trong Paint',()=>openPaintStickmanCreator(id));
 btn(actions,'Tạo animation',async()=>{const project=await XPStickman.generateAnimation(id);if(project){previewStickmanAnimation(project,XPStickman.get(id));refreshAssets()}});
 btn(actions,'View Memory',()=>XPStickman.showMemory(id));btn(actions,'Rename',async()=>{await XPStickman.rename(id);const updated=XPStickman.get(id);h.textContent=updated?.name||a.name;caption.textContent=`${updated?.personality||a.personality} · ${updated?.state||a.state} · ${updated?.action||a.action}`});
 btn(actions,'Duplicate',()=>XPStickman.duplicate(id));btn(actions,'Delete',async()=>{if(await XPStickman.remove(id))window.XPWM.close(record.id)});btn(actions,'Toggle Autonomy',()=>{XPStickman.setAutonomy(id,!a.autonomy);a.autonomy=!a.autonomy;refreshHeader()});body.append(actions);
 const assets=document.createElement('section');assets.className='profile-section';const assetsTitle=document.createElement('h3');assetsTitle.textContent='Sáng tạo của Stickman';assets.append(assetsTitle);const assetList=document.createElement('div');assetList.className='profile-assets';const loading=document.createElement('small');loading.textContent='Loading creative assets…';assetList.append(loading);assets.append(assetList);body.append(assets);
 const refreshHeader=()=>{const latest=XPStickman.get(id);if(!latest)return;h.textContent=latest.name;caption.textContent=`${latest.personality} · ${latest.state} · ${latest.action}`};
 const record=XPWM.create({title:`Character Profile — ${a.name}`,icon:'🧠',width:520,height:660,appId:'stickman-profile',build:bd=>bd.append(body)});
 refreshAssets=()=>Promise.all([XPStorage.getDrawings(),XPStorage.getAnimations()]).then(([drawings,animations])=>{
   assetList.replaceChildren();const items=[...drawings.filter(x=>x.characterId===id).map(x=>({...x,kind:'drawing'})),...animations.filter(x=>x.characterId===id).map(x=>({...x,kind:'animation'}))];
   if(!items.length){const p=document.createElement('p');p.textContent='Chưa có bản vẽ hoặc animation cho Stickman này.';assetList.append(p)}
   for(const item of items){const row=document.createElement('div');row.className='profile-asset';const label=document.createElement('span');label.textContent=`${item.kind==='drawing'?'Bản vẽ':'Animation'} · ${item.name}`;row.append(label);row.append(btn(row,'Mở',()=>{if(item.kind==='animation')previewStickmanAnimation(item,XPStickman.get(id));else{const blob=new Blob([XPDrawing.toSVG(item)],{type:'image/svg+xml'});Object.defineProperty(blob,'name',{value:`${item.name}.svg`});window.launchApp?.('paint',blob)}}));assetList.append(row)}
 }).catch(error=>{assetList.textContent=error.message});
 refreshAssets();
 const offAction=XPBus.on('stickman:action',event=>{if(event.id===id)refreshHeader()}),offMemory=XPBus.on('stickman:memory',event=>{if(event.id===id)refreshHeader()});
 record.cleanup=()=>{offAction();offMemory()};
}
window.showStickmanProfile=showStickmanProfile;
window.createStickman=()=>openPaintStickmanCreator();

/* Central Stickman AI brain server monitor */
function brainServerApp(b,_arg,record){
 b.innerHTML=`<div class="bar"><b>Stickman Central Brain Server</b><button data-refresh>Refresh</button></div><div class="brain-server-panel"><section class="brain-server-status" data-status>Checking central AI service…</section><h3>Independent Stickman minds</h3><div class="brain-server-agents" data-agents></div><p class="brain-server-note">Mỗi Stickman có mind ID, giá trị, sở thích, quan hệ và ký ức riêng. Các agent dùng chung model AI server nhưng có ngữ cảnh độc lập; server kiểm tra JSON đầu ra rồi chuyển kế hoạch khớp tới rig animation. API key không được gửi xuống trình duyệt.</p><p>Để bật model thật, cấu hình AI_API_URL hoặc AI_API_BASE_URL, AI_MODEL và AI_API_KEY trong biến môi trường server. Có thể đặt AI_DATABASE_URLS thành mảng JSON tối đa 8 Neon connection strings để phân shard trí tuệ.</p></div>`;
 const status=b.querySelector('[data-status]'),list=b.querySelector('[data-agents]');
 const refresh=async()=>{status.textContent='Đang kiểm tra…';list.replaceChildren();const result=await XPBrain.status();status.textContent=result.configured?`AI model đã cấu hình: ${result.provider} · ${result.model||'model chưa rõ'} · Memory DB: ${result.memoryStore?'đã chọn (kiểm tra kết nối ở lượt AI đầu tiên)':'chưa cấu hình'}`:`AI model chưa được cấu hình (${result.error||'chưa đăng nhập hoặc chưa cấu hình'}). Stickman đang dùng planner cục bộ.`;
  const people=XPStickman.list();if(!people.length){list.textContent='Chưa có Stickman.';return}
  for(const person of people){const row=document.createElement('div');row.className='brain-agent-row';const name=document.createElement('b');name.textContent=person.name;const detail=document.createElement('small');detail.textContent=`${person.profile?.mind?.disposition||person.personality} · ${person.profile?.mind?.experienceCount||0} trải nghiệm · ${person.profile?.mind?.model?.status||'local-fallback'}`;row.append(name,detail,btn(row,'Hồ sơ',()=>showStickmanProfile(person.id)));list.append(row)}
 };
 b.querySelector('[data-refresh]').onclick=refresh;const off=XPBus.on('stickman:created',refresh);const offMem=XPBus.on('stickman:memory',refresh);record.cleanup=()=>{off();offMem()};refresh();
}

/* Control Panel, Search and Run utilities */
function controlPanelApp(b){
 const defaults={theme:'blue',wallpaper:'bliss',showIcons:true,showQuickLaunch:true,showDate:true,taskbarLocked:false,sounds:false,pointer:'arrow'};
 let settings={...defaults};
 try{settings={...settings,...JSON.parse(localStorage.getItem('xp-settings')||'{}')}}catch{}
 b.innerHTML=`<div class="bar"><b>Control Panel · Cài đặt Windows XP</b><button data-restore>Khôi phục mặc định</button></div>
 <div class="control-panel">
  <section><h3>Display Properties</h3><label>Theme<select data-theme><option value="blue">Windows XP Luna Blue</option><option value="olive">Olive Green</option><option value="silver">Silver</option><option value="classic">Windows Classic</option></select></label><label>Desktop wallpaper<select data-wallpaper><option value="bliss">Bliss Meadow</option><option value="night">Night Sky</option></select></label><button data-saver>Preview Screen Saver</button></section>
  <section><h3>Taskbar and Start Menu</h3><label><input type="checkbox" data-lock> Lock the Taskbar</label><label><input type="checkbox" data-quick> Show Quick Launch</label><label><input type="checkbox" data-date> Show date below clock</label><small>Taskbar, Start Menu và Quick Launch được lưu vào cài đặt cục bộ.</small></section>
  <section><h3>Desktop</h3><label><input type="checkbox" data-icons> Show desktop icons</label><button data-arrange>Arrange Icons by Name</button><button data-refresh>Refresh Desktop</button></section>
  <section><h3>Sounds and Audio Devices</h3><label><input type="checkbox" data-sounds> Enable simulated system sounds</label><button data-test-sound>Test sound</button><small>Âm báo ngắn được tạo trực tiếp trong trình duyệt; không phát âm thanh khi chưa bật.</small></section>
  <section><h3>Mouse Properties</h3><label>Pointer style<select data-pointer><option value="arrow">Windows arrow</option><option value="precision">Precision</option></select></label><small>Chỉ thay đổi con trỏ trong desktop mô phỏng, không can thiệp hệ điều hành thật.</small></section>
  <section><h3>System and Display Resolution</h3><label>Resolution<select data-size><option value="1024x768">1024 × 768</option><option value="1280x720">1280 × 720</option><option value="1366x768">1366 × 768</option><option value="1600x900">1600 × 900</option><option value="1920x1080">1920 × 1080</option></select></label><button data-apply-size>Apply Resolution</button><small data-size-note>Trong bản web, hãy thay đổi kích thước cửa sổ trình duyệt. Electron có thể đổi kích thước cửa sổ mô phỏng.</small></section>
  <section><h3>Date and Time</h3><strong data-clock></strong><small data-date-label></small><button data-time-refresh>Refresh Clock</button></section>
  <section><h3>Network and Internet</h3><button data-ie>Open Internet Explorer</button><button data-account>Online Account and Sync</button><small>Website chặn iframe cần mở bằng tab trình duyệt thật qua nút Mở ngoài trong Internet Explorer.</small></section>
 </div>`;
 const $p=selector=>b.querySelector(selector),theme=$p('[data-theme]'),wall=$p('[data-wallpaper]'),size=$p('[data-size]');
 theme.value=settings.theme;wall.value=settings.wallpaper;
 $p('[data-lock]').checked=!!settings.taskbarLocked;$p('[data-quick]').checked=settings.showQuickLaunch!==false;
 $p('[data-date]').checked=settings.showDate!==false;$p('[data-icons]').checked=settings.showIcons!==false;
 $p('[data-sounds]').checked=!!settings.sounds;$p('[data-pointer]').value=settings.pointer||'arrow';
 if(!window.XPPlatform?.canResizeNativeWindow){size.disabled=true;$p('[data-apply-size]').disabled=true}
 const persist=()=>{settings={...settings,theme:theme.value,wallpaper:wall.value,taskbarLocked:$p('[data-lock]').checked,showQuickLaunch:$p('[data-quick]').checked,showDate:$p('[data-date]').checked,showIcons:$p('[data-icons]').checked,sounds:$p('[data-sounds]').checked,pointer:$p('[data-pointer]').value,updatedAt:Date.now()};try{localStorage.setItem('xp-settings',JSON.stringify(settings))}catch{};apply()};
 const apply=()=>{
  document.body.classList.remove('xp-theme-olive','xp-theme-silver','xp-theme-classic','xp-wallpaper-night','xp-pointer-precision');
  if(settings.theme==='olive')document.body.classList.add('xp-theme-olive');if(settings.theme==='silver')document.body.classList.add('xp-theme-silver');if(settings.theme==='classic')document.body.classList.add('xp-theme-classic');if(settings.wallpaper==='night')document.body.classList.add('xp-wallpaper-night');if(settings.pointer==='precision')document.body.classList.add('xp-pointer-precision');
  document.body.classList.toggle('taskbar-locked',!!settings.taskbarLocked);
  $('#icons').style.display=settings.showIcons===false?'none':'';$('#quick-launch').style.display=settings.showQuickLaunch===false?'none':'';$('#clk').classList.toggle('clock-date-hidden',settings.showDate===false);
  window.XPSounds={enabled:!!settings.sounds,play(){if(!settings.sounds)return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const audio=new C(),osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.value=660;gain.gain.setValueAtTime(.04,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.075);osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(audio.currentTime+.08);osc.onended=()=>audio.close()}catch{}}};
 };
 const refreshClock=()=>{const now=new Date();$p('[data-clock]').textContent=now.toLocaleTimeString('vi-VN');$p('[data-date-label]').textContent=now.toLocaleDateString('vi-VN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})};
 [theme,wall,$p('[data-lock]'),$p('[data-quick]'),$p('[data-date]'),$p('[data-icons]'),$p('[data-sounds]'),$p('[data-pointer]')].forEach(control=>control.addEventListener('change',persist));
 $p('[data-restore]').onclick=()=>{settings={...defaults};theme.value=defaults.theme;wall.value=defaults.wallpaper;$p('[data-lock]').checked=false;$p('[data-quick]').checked=true;$p('[data-date]').checked=true;$p('[data-icons]').checked=true;$p('[data-sounds]').checked=false;$p('[data-pointer]').value='arrow';persist();refreshClock()};
 $p('[data-arrange]').onclick=()=>window.arrangeDesktopIcons?.('name');$p('[data-refresh]').onclick=()=>{window.XPBus?.emit('desktop:event',{kind:'refresh'});refreshClock()};
 $p('[data-test-sound]').onclick=()=>{if(!settings.sounds)alert('Enable simulated system sounds first.')};
 $p('[data-time-refresh]').onclick=refreshClock;$p('[data-ie]').onclick=()=>run('ie');$p('[data-account]').onclick=()=>run('account');
 $p('[data-apply-size]').onclick=async()=>{const [w,h]=size.value.split('x').map(Number);try{await window.xpHost.window.setSize(w,h)}catch(error){alert('Không đổi được kích thước: '+error.message)}};
 $p('[data-saver]').onclick=()=>{const layer=document.createElement('div');layer.className='xp-screensaver';const label=document.createElement('span');label.textContent='Windows XP';layer.append(label);const close=()=>layer.remove();layer.addEventListener('click',close);layer.addEventListener('keydown',e=>{if(e.key==='Escape')close()});document.body.append(layer);layer.tabIndex=0;layer.focus()};
 apply();refreshClock();
}
function searchApp(b){
 b.innerHTML=`<div class=bar><input class=search-query placeholder="Tìm trong My Documents"><button data-search>Tìm</button></div><div class=lst data-results></div><div class=sb data-count>Nhập tên tệp hoặc nội dung cần tìm.</div>`;
 const input=b.querySelector('.search-query'),results=b.querySelector('[data-results]'),count=b.querySelector('[data-count]');
 const search=()=>{
  const q=input.value.trim().toLowerCase();results.replaceChildren();if(!q){count.textContent='Nhập từ khóa để tìm.';return}
  const hits=[];
  const walk=(node,prefix='My Documents')=>{
   for(const [name,value] of Object.entries(node||{})){
    const pathName=prefix+'\\'+name;
    if(name.toLowerCase().includes(q)||(typeof value==='string'&&value.toLowerCase().includes(q)))hits.push({name,path:pathName,value});
    if(value&&typeof value==='object')walk(value,pathName);
   }
  };walk(fs);
  if(!hits.length){count.textContent='Không tìm thấy mục phù hợp.';return}
  hits.slice(0,100).forEach(hit=>{
   const row=document.createElement('button');row.className='search-result';row.type='button';
   const strong=document.createElement('b');strong.textContent=hit.name;
   const small=document.createElement('small');small.textContent=hit.path;
   row.append(strong,small);row.onclick=()=>{if(typeof hit.value==='string')run('note',{name:hit.name,text:hit.value});else run('pc')};results.append(row);
  });
  count.textContent=`Tìm thấy ${hits.length} mục.`;
 };
 b.querySelector('[data-search]').onclick=search;
 input.addEventListener('keydown',e=>{if(e.key==='Enter')search()});
}
function helpApp(b){
 b.innerHTML=`<div class=bar><b>Help and Support Center</b></div><div class=help-content>
 <h2>Windows XP — Living Desktop</h2><p>Đây là môi trường máy tính Windows XP mô phỏng chạy trong trình duyệt web hoặc Electron.</p>
 <h3>Desktop</h3><p>Nhấp đúp biểu tượng để mở ứng dụng. Kéo biểu tượng để sắp xếp. Chuột phải để mở menu thao tác.</p>
 <h3>Windows</h3><p>Kéo thanh tiêu đề để di chuyển, kéo cạnh/góc để thay đổi kích thước, dùng các nút góc phải để thu nhỏ, phóng to hoặc đóng.</p>
 <h3>Internet Explorer</h3><p>Trong Electron, website chạy bằng WebContentsView cô lập. Khi chạy dạng website, trang được thử nhúng qua iframe sandbox; website chặn nhúng cần dùng nút Mở ngoài. Chỉ HTTP/HTTPS được mở và trang ngoài không được truy cập API nội bộ.</p>
 <h3>Stickman</h3><p>Mở Paint → Chế độ vẽ Stickman, vẽ trên lớp riêng rồi chọn Hoàn tất & Tự làm đẹp. Ảnh đang mở không được đọc hoặc chỉnh sửa. Mỗi nhân vật có mind ID và ký ức riêng; có thể cấu hình model AI server và Neon shard. Đây là agent ảo có bộ nhớ và mô hình ngôn ngữ hỗ trợ, không phải ý thức/con người thật.</p>
 </div>`;
}
function runApp(b){
 b.innerHTML=`<div class=bar><label>Open:</label><input class=run-entry placeholder="notepad, paint, calc, ie..."><button data-run>OK</button></div><p>Nhập tên một ứng dụng có sẵn trong desktop. Lệnh hệ điều hành và terminal không được thực thi.</p>`;
 const input=b.querySelector('.run-entry');
 const launch=()=>{
  const value=input.value.trim().toLowerCase();
  const app=A.find(x=>x[0]===value||x[1].toLowerCase()===value);
  if(app)run(app[0]);else alert('Ứng dụng không tồn tại trong danh sách cho phép.');
 };
 b.querySelector('[data-run]').onclick=launch;input.addEventListener('keydown',e=>{if(e.key==='Enter')launch()});
}

/* Same-origin account and offline-first cloud sync; passwords never enter browser storage. */
function accountApp(b,_arg,record){
 b.innerHTML=`<div class="bar"><b>Online Account & Cloud Sync</b></div><div class="account-panel"><section><h3>Sign in / Register</h3><form data-auth><label>Username or email<input name="login" autocomplete="username" required></label><label>Email (for registration)<input name="email" type="email" autocomplete="email"></label><label>Password<input name="password" type="password" autocomplete="current-password" minlength="12" required></label><label>New username (for registration)<input name="username" autocomplete="username"></label><div><button type="submit" data-mode="login">Sign In</button><button type="submit" data-mode="register">Create Account</button></div></form><p>Passwords are sent only to this site's API over the same origin and are not saved in local storage.</p></section><section><h3>Cloud Storage</h3><p data-user>Checking session…</p><div class="account-status" data-status>Local data remains available while offline. Sign in to enable cloud sync.</div><div><button data-sync>Sync Now</button><button data-logout>Sign Out</button></div><p>Only Stickman profiles, their memories, drawings, animations and desktop appearance settings are synchronized. Notepad contents, passwords typed into Notepad and browser page contents are not collected.</p></section></div>`;
 const form=b.querySelector('[data-auth]'),user=b.querySelector('[data-user]'),status=b.querySelector('[data-status]');let mode='login';
 const showStatus=(message)=>{status.textContent=message};
 const update=async()=>{try{const account=await XPCloudSync.me();user.textContent=account?`Signed in as ${account.username} (${account.email})`:'Not signed in';showStatus(account?'Cloud account ready. Local data is retained on this device.':'Local-only mode. Sign in to sync across devices.')}catch(error){user.textContent='Cloud service unavailable';showStatus(error.message)}};
 form.querySelector('[data-mode="register"]').onclick=()=>{mode='register';form.querySelector('[name=username]').required=true;form.querySelector('[name=email]').required=true;form.querySelector('[name=login]').required=false;form.querySelector('[name=login]').placeholder='Optional for registration';form.querySelector('[name=password]').autocomplete='new-password';showStatus('Enter a username, email, and password with at least 12 characters, then select Create Account.')};
 form.querySelector('[data-mode="login"]').onclick=()=>{mode='login';form.querySelector('[name=username]').required=false;form.querySelector('[name=email]').required=false;form.querySelector('[name=login]').required=true;form.querySelector('[name=login]').placeholder='Username or email';form.querySelector('[name=password]').autocomplete='current-password'};
 form.addEventListener('submit',async event=>{event.preventDefault();const data=new FormData(form),password=String(data.get('password')||'');try{if(mode==='register')await XPCloudSync.register(String(data.get('username')||''),String(data.get('email')||''),password);else await XPCloudSync.login(String(data.get('login')||''),password);form.reset();await update();showStatus('Signed in. Starting synchronization…');const result=await XPCloudSync.sync();showStatus(result.queued?'Offline: sync snapshot queued locally and will retry when you reconnect.':`Sync complete · ${result.characters} characters · ${result.drawings} drawings · ${result.animations} animations.`)}catch(error){showStatus(error.message)}});
 b.querySelector('[data-sync]').onclick=async()=>{try{const result=await XPCloudSync.sync();showStatus(result.queued?'Offline: your sync snapshot is queued for the next connection.':`Sync complete at ${new Date(result.lastSyncAt).toLocaleString('vi-VN')}.`)}catch(error){showStatus(error.message)}};
 b.querySelector('[data-logout]').onclick=async()=>{try{await XPCloudSync.logout();await update()}catch(error){showStatus(error.message)}};
 const off=XPBus.on('cloud:synced',()=>showStatus('Cloud data synchronized.'));record.cleanup=off;update();
}

/* Đăng ký ứng dụng */
const A=[
 ['pc','Máy tính của tôi',I.pc,620,430,myc],
 ['bin','Thùng rác',I.bin,480,340,binw],
 ['note','Notepad',I.note,540,400,notepad],
 ['paint','Paint',I.paint,760,560,paint],
 ['calc','Calculator',I.calc,230,310,calc],
 ['mine','Minesweeper',I.mine,260,340,mines],
 ['sol','Solitaire',I.sol,480,490,solitaire],
 ['ie','Internet Explorer',I.ie,820,580,ie],
 ['wmp','Media Player',I.wmp,560,420,media],
 ['stickman','Stickman Manager',S(`<circle cx="16" cy="6" r="4" fill="#222"/><path d="M16 10v10M16 13l-9 6m9-6 9 6m-9 1-7 10m7-10 7 10" stroke="#222" stroke-width="3" stroke-linecap="round"/>`),520,420,stickmanApp],
 ['control','Control Panel',S(`<rect x="4" y="3" width="24" height="26" rx="2" fill="#d5e4f6" stroke="#345"/><path d="M9 9h14M9 15h14M9 21h14" stroke="#3866a4" stroke-width="2"/><circle cx="9" cy="9" r="2" fill="#e9a22b"/>`),520,440,controlPanelApp,false],
 ['search','Search',S(`<circle cx="13" cy="13" r="8" fill="#dce9f8" stroke="#345" stroke-width="2"/><path d="M19 19l8 8" stroke="#345" stroke-width="4" stroke-linecap="round"/>`),500,400,searchApp,false],
 ['help','Help and Support',S(`<circle cx="16" cy="16" r="13" fill="#3e88d4" stroke="#24528a"/><text x="11" y="23" font-size="22" fill="#fff">?</text>`),520,440,helpApp,false],
 ['run','Run',S(`<rect x="3" y="6" width="26" height="20" rx="2" fill="#e4edf7" stroke="#456"/><path d="M8 12h16M8 17h10" stroke="#456" stroke-width="2"/>`),360,190,runApp,false],
 ['documents','My Documents',I.folder,620,430,b=>myc(b,'documents'),false],
 ['pictures','My Pictures',I.img,620,430,b=>myc(b,'pictures'),false],
 ['account','Online Account & Sync',I.pc,680,470,accountApp,false],
 ['brain','Stickman Brain Server',I.pc,620,490,brainServerApp]
];
const run=(k,arg)=>{const a=A.find(z=>z[0]===k);if(!a)return null;return openWin(a[1],a[2],a[3],a[4],(bd,el,record)=>a[5](bd,arg,record),k)};
window.launchApp=run;
A.forEach(a=>{
 if(a[6]!==false){
 const d=document.createElement('div');d.className='ic';d.dataset.appId=a[0];d.dataset.iconId=`desktop-${a[0]}`;
 const big=document.createElement('big');big.innerHTML=a[2];
 const label=document.createElement('span');label.className='icon-name';label.textContent=a[1];
 d.append(big,label);
 d.onclick=()=>{document.querySelectorAll('.ic').forEach(x=>x.classList.remove('s'));d.classList.add('s')};
 d.ondblclick=()=>run(a[0]);restoreIconLayout(d);
 let drag=null;
 d.addEventListener('pointerdown',e=>{
  if(e.button!==0||e.target.closest('button')||document.body.classList.contains('auto-arrange'))return;
  const r=d.getBoundingClientRect(),parent=$('#icons').getBoundingClientRect();
  drag={id:e.pointerId,startX:e.clientX,startY:e.clientY,left:r.left-parent.left,top:r.top-parent.top,moved:false,parent};
  d.setPointerCapture?.(e.pointerId);
 });
 d.addEventListener('pointermove',e=>{
  if(!drag||drag.id!==e.pointerId)return;
  const dx=e.clientX-drag.startX,dy=e.clientY-drag.startY;
  if(Math.abs(dx)+Math.abs(dy)>6)drag.moved=true;
  if(drag.moved){
   d.style.position='absolute';d.style.left=`${Math.max(0,drag.left+dx)}px`;
   d.style.top=`${Math.max(0,drag.top+dy)}px`;d.style.margin='0';
  }
 });
 d.addEventListener('pointerup',e=>{
  if(!drag||drag.id!==e.pointerId)return;
  if(drag.moved&&document.body.classList.contains('align-grid')){
   d.style.left=`${Math.round(parseFloat(d.style.left)/84)*84}px`;
   d.style.top=`${Math.round(parseFloat(d.style.top)/76)*76}px`;
  }
  if(drag.moved){saveIconLayout(d);XPBus.emit('desktop:event',{kind:'icon-move',appId:a[0]})};
  drag=null;
 });
 $('#icons').append(d);
 }
 const m=document.createElement('button');m.type='button';m.innerHTML=a[2]+' '+a[1];
 m.onclick=()=>{$('#sm').hidden=true;run(a[0])};
 $('#sm .'+(['pc','documents','pictures','control','search','help','run'].includes(a[0])?'r':'l')).append(m);
});
function addStartMenuEntry(parent,icon,label,action){
 const item=document.createElement('button');item.type='button';item.innerHTML=`${icon}<span>${label}</span>`;item.addEventListener('click',()=>{$('#sm').hidden=true;action()});parent.append(item);return item;
}
const rightMenu=$('#sm .r');
const separator=()=>{const node=document.createElement('div');node.className='start-separator';rightMenu.append(node)};
addStartMenuEntry(rightMenu,I.file,'My Recent Documents',()=>{
 let recent=[];try{recent=JSON.parse(localStorage.getItem('xp-recent-files')||'[]')}catch{}
 if(!recent.length){alert('No recent documents.');return}
 const menu=recent.slice(0,8).map(item=>({n:item.name,i:I.file,o:()=>run('note',{name:item.name,text:typeof fs[item.name]==='string'?fs[item.name]:''})}));
 const box=document.createElement('div');box.className='xp-dialog-shade';const panel=document.createElement('div');panel.className='xp-dialog';const h=document.createElement('h3');h.textContent='My Recent Documents';panel.append(h);menu.forEach(item=>{const button=document.createElement('button');button.textContent=item.n;button.onclick=()=>{box.remove();item.o()};panel.append(button)});const close=btn(panel,'Close',()=>box.remove());box.append(panel);document.body.append(box);
});
addStartMenuEntry(rightMenu,I.wmp,'My Music',()=>run('wmp'));
addStartMenuEntry(rightMenu,I.ie,'My Network Places',()=>run('ie'));
addStartMenuEntry(rightMenu,I.drive,'Printers and Faxes',()=>alert('No printers are configured in this simulated desktop.'));
separator();
addStartMenuEntry(rightMenu,I.pc,'Online Account & Sync',()=>run('account'));
window.arrangeDesktopIcons=mode=>{
 const icons=[...$('#icons').querySelectorAll('.ic')];
 icons.sort((a,b)=>{
  const an=a.querySelector('.icon-name').textContent,bn=b.querySelector('.icon-name').textContent;
  return mode==='type'?a.dataset.appId.localeCompare(b.dataset.appId):an.localeCompare(bn);
 });
 icons.forEach(icon=>{icon.style.position='';icon.style.left='';icon.style.top='';icon.style.margin='2px';$('#icons').append(icon)});
 if(document.body.classList.contains('auto-arrange')){
  const columns=Math.max(1,Math.floor($('#desk').clientHeight/78));
  icons.forEach((icon,index)=>{
   icon.style.position='absolute';icon.style.margin='0';
   icon.style.left=`${Math.floor(index/columns)*82+6}px`;
   icon.style.top=`${(index%columns)*76+6}px`;
  });
 }
};
window.setAutoArrange=enabled=>{
 document.body.classList.toggle('auto-arrange',!!enabled);
 window.arrangeDesktopIcons('name');
};
window.renameDesktopIcon=icon=>{
 const label=icon.querySelector('.icon-name'),name=prompt('Tên shortcut:',label.textContent);
 if(name?.trim())label.textContent=name.trim().slice(0,40);
};
window.addDesktopShortcut=(appId,title)=>{
 const app=A.find(entry=>entry[0]===appId);if(!app)return null;
 const icon=document.createElement('div');icon.className='ic';icon.dataset.appId=appId;icon.dataset.iconId=`shortcut-${globalThis.crypto?.randomUUID?.()||Date.now()}`;
 const big=document.createElement('big');big.innerHTML=app[2];
 const label=document.createElement('span');label.className='icon-name';label.textContent=String(title||app[1]).slice(0,40);
 icon.append(big,label);
 icon.onclick=()=>{document.querySelectorAll('.ic').forEach(node=>node.classList.remove('s'));icon.classList.add('s')};
 icon.ondblclick=()=>run(appId);restoreIconLayout(icon);
 let drag=null;
 icon.addEventListener('pointerdown',e=>{
  if(e.button!==0||document.body.classList.contains('auto-arrange'))return;
  const r=icon.getBoundingClientRect(),parent=$('#icons').getBoundingClientRect();
  drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:r.left-parent.left,top:r.top-parent.top,moved:false};
  icon.setPointerCapture?.(e.pointerId);
 });
 icon.addEventListener('pointermove',e=>{
  if(!drag||drag.id!==e.pointerId)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>6)drag.moved=true;
  if(drag.moved){icon.style.position='absolute';icon.style.left=`${Math.max(0,drag.left+dx)}px`;icon.style.top=`${Math.max(0,drag.top+dy)}px`;icon.style.margin='0'}
 });
 icon.addEventListener('pointerup',e=>{
  if(!drag||drag.id!==e.pointerId)return;
  if(drag.moved&&document.body.classList.contains('align-grid')){icon.style.left=`${Math.round(parseFloat(icon.style.left)/84)*84}px`;icon.style.top=`${Math.round(parseFloat(icon.style.top)/76)*76}px`}
  if(drag.moved){saveIconLayout(icon);XPBus.emit('desktop:event',{kind:'icon-move',appId})}drag=null;
 });
 $('#icons').append(icon);return icon;
};
window.duplicateDesktopIcon=icon=>window.addDesktopShortcut(icon.dataset.appId,icon.querySelector('.icon-name')?.textContent+' Shortcut');
window.pinDesktopIcon=icon=>{
 const btn=document.createElement('button');btn.type='button';btn.textContent=icon.querySelector('.icon-name').textContent;
 btn.onclick=()=>{$('#sm').hidden=true;run(icon.dataset.appId)};
 $('#sm .l').append(btn);
};
window.createVirtualItem=kind=>{
 if(kind==='shortcut'){
  const target=prompt('Ứng dụng đích (notepad, paint, ie, calc, mine, sol, wmp, pc, bin, stickman):','notepad');
  if(!target)return;
  const app=A.find(entry=>entry[0]===target.trim().toLowerCase()||entry[1].toLowerCase()===target.trim().toLowerCase());
  if(!app){alert('Ứng dụng không nằm trong danh sách cho phép.');return}
  const label=prompt('Tên shortcut:',app[1]);if(label?.trim())window.addDesktopShortcut(app[0],label.trim());
  return;
 }
 const name=prompt(kind==='folder'?'Tên thư mục:':'Tên tệp: ',kind==='folder'?'Thư mục mới':'Tài liệu mới.txt');
 if(!name?.trim())return;
 fs[name.trim()]=kind==='folder'?{}:'';sv();
 if(kind==='text')run('note',{name:name.trim(),text:''});
};
document.querySelectorAll('#quick-launch [data-launch]').forEach(button=>{
 const app=A.find(a=>a[0]===button.dataset.launch);if(app)button.innerHTML=app[2];
 button.addEventListener('click',()=>run(button.dataset.launch));
});
$('#st').onclick=()=>$('#sm').hidden=!$('#sm').hidden;
document.addEventListener('mousedown',e=>{if(!$('#sm').contains(e.target)&&e.target!=$('#st'))$('#sm').hidden=true;if(!e.target.closest('.ic'))document.querySelectorAll('.ic').forEach(x=>x.classList.remove('s'))});
$('#offb').onclick=()=>{$('#sm').hidden=true;$('#off').style.display='grid'};$('#off').onclick=()=>$('#off').style.display='none';$('#off').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('#off').style.display='none'}};$('#logoff').onclick=()=>{$('#sm').hidden=true;run('account')};
const tick=()=>{const now=new Date(),time=now.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}),date=now.toLocaleDateString('vi-VN');$('#clk').innerHTML=`<span>${time}</span><small>${date}</small>`;$('#clk').title=now.toLocaleDateString('vi-VN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})};tick();setInterval(tick,10000);
run('note',{name:'Chào mừng.txt',text:fs['Chào mừng.txt']||''});
