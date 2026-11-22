
const $=s=>document.querySelector(s);
let fs,bin;try{fs=JSON.parse(localStorage.xpfs);bin=JSON.parse(localStorage.xpbin)}catch(e){}
fs=fs||{'Chào mừng.txt':'Chào mừng đến Windows XP bản web!\nMở Paint, Notepad, Minesweeper... từ menu Start.\nMở "Máy tính của tôi" > chọn ổ đĩa để duyệt thư mục thật trên máy.'};bin=bin||[];
const sv=()=>{try{localStorage.xpfs=JSON.stringify(fs);localStorage.xpbin=JSON.stringify(bin)}catch(e){}};
const btn=(bar,l,f)=>{const k=document.createElement('button');k.textContent=l;k.onclick=f;bar.append(k);return k};
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
 b.innerHTML=`<div class=bar></div><div class=cv><canvas width=700 height=460 style="background:#fff;cursor:crosshair"></canvas></div><div class=bar></div>`;
 const [tb,cv,pl]=b.children,c=cv.firstChild,x=c.getContext('2d');
 let tool='pen',col='#000000',sz=3,d,s,p0,U=[],R=[],selection=null;
 x.fillStyle='#fff';x.fillRect(0,0,700,460);
 const snapshot=()=>{U.push(x.getImageData(0,0,c.width,c.height));if(U.length>40)U.shift();R=[]};
 const undo=()=>{if(!U.length)return;R.push(x.getImageData(0,0,c.width,c.height));x.putImageData(U.pop(),0,0)};
 const redo=()=>{if(!R.length)return;U.push(x.getImageData(0,0,c.width,c.height));x.putImageData(R.pop(),0,0)};
 [['✏️','pen'],['🧽','eraser'],['📏','line'],['⬜','rect'],['🪣','fill'],['⭕','ellipse'],['🖌️','spray']].forEach(([i,t])=>btn(tb,i,()=>tool=t).title=t);
 const se=document.createElement('select');[1,3,6,12].forEach(v=>se.add(new Option(v+'px',v,v===3,v===3)));se.onchange=()=>sz=+se.value;tb.append(se);
 const colpick=document.createElement('input');colpick.type='color';colpick.value=col;colpick.title='Color Picker';colpick.oninput=()=>col=colpick.value;tb.append(colpick);
 btn(tb,'↶ Undo',undo);btn(tb,'↷ Redo',redo);
 btn(tb,'Xóa hết',()=>{snapshot();x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height)});
 btn(tb,'Mở ảnh',()=>pick('image/*',l=>load(l[0])));
 btn(tb,'Lưu PNG',exportPNG);
 '#000000,#808080,#800000,#808000,#008000,#008080,#000080,#800080,#ffffff,#c0c0c0,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff'.split(',').forEach(k=>{const e=btn(pl,'',()=>{col=k;colpick.value=k});e.className='sw';e.style.background=k});
 function load(fl){if(!fl)return;const im=new Image();im.onload=()=>{snapshot();c.width=im.width;c.height=im.height;x.drawImage(im,0,0);URL.revokeObjectURL(im.src)};im.src=URL.createObjectURL(fl)}
 function exportPNG(){c.toBlob(bl=>{if(bl)dl(bl,'paint.png')},'image/png')}
 async function copy(){
  try{
   const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));
   if(navigator.clipboard?.write&&window.ClipboardItem)await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);
   else exportPNG();
  }catch(error){console.warn(error);exportPNG()}
 }
 async function paste(){
  try{
   if(!navigator.clipboard?.read)return;
   const items=await navigator.clipboard.read();
   for(const item of items){const type=item.types.find(t=>t.startsWith('image/'));if(!type)continue;
    const blob=await item.getType(type),im=await createImageBitmap(blob);snapshot();x.drawImage(im,0,0);return}
  }catch(error){alert('Không thể đọc ảnh từ clipboard.')}
 }
 const actions={undo,redo,copy,cut:async()=>{await copy();snapshot();x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height)},paste,selectAll:()=>{selection={x:0,y:0,w:c.width,h:c.height};x.save();x.strokeStyle='#1764c0';x.setLineDash([5,4]);x.strokeRect(1,1,c.width-2,c.height-2);x.restore()},createStickman:()=>createStickman(),export:exportPNG};
 window.XPPaint=window.XPPaint||{};window.XPPaint[record.id]=actions;
 record.cleanup=()=>{delete window.XPPaint[record.id]};
 function pos(e){const r=c.getBoundingClientRect();return[(e.clientX-r.left)*c.width/r.width,(e.clientY-r.top)*c.height/r.height]}
 function fill(sx,sy){
  const im=x.getImageData(0,0,c.width,c.height),q=im.data,W=c.width,H=c.height,h=parseInt(col.slice(1),16),R=h>>16,G=h>>8&255,B=h&255,i0=(sy*W+sx)*4,tr=q[i0],tg=q[i0+1],tbb=q[i0+2];
  if(tr===R&&tg===G&&tbb===B)return;
  const stack=[[sx,sy]];
  while(stack.length){
   const [a,e]=stack.pop();if(a<0||e<0||a>=W||e>=H)continue;
   const i=(e*W+a)*4;if(q[i]!==tr||q[i+1]!==tg||q[i+2]!==tbb)continue;
   q[i]=R;q[i+1]=G;q[i+2]=B;stack.push([a+1,e],[a-1,e],[a,e+1],[a,e-1]);
  }x.putImageData(im,0,0);
 }
 c.onpointerdown=e=>{
  const [X,Y]=pos(e);p0=[X,Y];
  if(tool==='fill'){snapshot();fill(X|0,Y|0);XPBus.emit('desktop:event',{kind:'paint-draw',tool,appId:'paint'});return}
  snapshot();d=1;s=x.getImageData(0,0,c.width,c.height);c.setPointerCapture(e.pointerId);
  x.lineCap='round';x.lineWidth=tool==='eraser'?sz*4:sz;x.strokeStyle=tool==='eraser'?'#fff':col;
  x.beginPath();x.moveTo(X,Y);x.lineTo(X+.1,Y);x.stroke();x.beginPath();x.moveTo(X,Y);
 };
 c.onpointermove=e=>{
  if(!d)return;const [X,Y]=pos(e);
  if(tool==='pen'||tool==='eraser'){x.lineTo(X,Y);x.stroke();x.beginPath();x.moveTo(X,Y)}
  else if(tool==='spray'){x.fillStyle=col;for(let i=0;i<14;i++)x.fillRect(X+(Math.random()-.5)*sz*6,Y+(Math.random()-.5)*sz*6,1,1)}
  else{x.putImageData(s,0,0);x.beginPath();if(tool==='line'){x.moveTo(...p0);x.lineTo(X,Y)}else if(tool==='ellipse')x.ellipse((p0[0]+X)/2,(p0[1]+Y)/2,Math.abs(X-p0[0])/2,Math.abs(Y-p0[1])/2,0,0,7);else x.rect(p0[0],p0[1],X-p0[0],Y-p0[1]);x.stroke()}
 };
 c.onpointerup=()=>{if(d)XPBus.emit('desktop:event',{kind:'paint-draw',tool,appId:'paint'});d=0};
 c.onpointercancel=()=>{d=0};
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
 btn(toolbar,'Mở ngoài',()=>{const current=state.tabs.find(t=>t.id===state.activeTabId);if(current?.url&&/^https?:\/\//i.test(current.url))window.open(current.url,'_blank','noopener,noreferrer')}).title='Mở trang trong tab trình duyệt mới';
 btn(toolbar,'Trang chủ…',async()=>{
  const store=await command('get-store');const home=prompt('Trang chủ (HTTP/HTTPS):',store.home||'https://www.google.com');
  if(home)command('settings',{home,engine:store.engine});
 });
 function render(s){
  if(!s||s.sessionId!==sessionId)return;
  state=s;tabbar.replaceChildren();
  for(const tab of s.tabs){
   const t=document.createElement('button');t.className='browser-tab'+(tab.id===s.activeTabId?' active':'');t.type='button';
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
  status.textContent=current?.loading?'Đang tải trang…':(current?.url||'Tab mới');
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
 b.innerHTML=`<div class="bar"><button data-new>Tạo Stickman</button><button data-export>Xuất dữ liệu JSON</button><button data-import>Nhập dữ liệu JSON</button><button data-refresh>Làm mới</button></div><div class="stickman-manager"></div>`;
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
   const sub=document.createElement('small');sub.textContent=`${a.personality} · ${a.state} · ${a.memoryCount} ký ức`;
   info.append(name,sub);
   const profile=btn(row,'Hồ sơ',()=>showStickmanProfile(a.id));
   const memories=btn(row,'Ký ức',()=>XPStickman.showMemory(a.id));
   const follow=btn(row,a.follow?'Dừng theo':'Theo chuột',()=>XPStickman.command(a.id,a.follow?'stay':'follow'));
   row.append(dot,info,profile,memories,follow);list.append(row);
  }
 };
 b.querySelector('[data-new]').onclick=createStickman;
 b.querySelector('[data-export]').onclick=()=>XPStickman.exportAll();
 b.querySelector('[data-import]').onclick=()=>pick('.json',async files=>{
  if(!files?.[0])return;
  try{const data=JSON.parse(await files[0].text());await XPStickman.importAll(data);refresh()}catch(e){alert('JSON không hợp lệ: '+e.message)}
 });
 b.querySelector('[data-refresh]').onclick=refresh;
 const offCreated=XPBus.on('stickman:created',refresh);const offMemory=XPBus.on('stickman:memory',refresh);
 record.cleanup=()=>{offCreated();offMemory()};
 setTimeout(()=>{if(record.el.isConnected)refresh()},300);
}
function createStickman(){
 const shade=document.createElement('div');shade.className='xp-dialog-shade';
 const form=document.createElement('form');form.className='xp-dialog';
 const title=document.createElement('h3');title.textContent='New Stickman — Character Identity';
 const field=(label,control)=>{const wrap=document.createElement('label');wrap.textContent=label;wrap.append(control);form.append(wrap);return control};
 const name=document.createElement('input');name.required=true;name.maxLength=32;name.value='Shadow';field('Character Name',name);
 const color=document.createElement('input');color.type='color';color.value='#202020';field('Character Color',color);
 const personality=document.createElement('select');XPAI.PERSONALITIES.forEach(x=>personality.add(new Option(x,x)));field('Personality',personality);
 const note=document.createElement('p');note.textContent='Intelligence Profile và năng lực được tạo ổn định từ tên cùng ID nhân vật.';form.append(note);
 const actions=document.createElement('div');actions.className='dialog-actions';
 const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Hủy';cancel.onclick=()=>shade.remove();
 const save=document.createElement('button');save.type='submit';save.textContent='Tạo nhân vật';
 actions.append(cancel,save);form.append(actions);form.prepend(title);shade.append(form);document.body.append(shade);name.focus();
 form.onsubmit=async e=>{e.preventDefault();const a=await XPStickman.spawn({name:name.value,color:color.value,personality:personality.value});shade.remove();showStickmanProfile(a.id)};
}
function showStickmanProfile(id){
 const a=XPStickman.get(id);if(!a)return;
 const body=document.createElement('div');body.className='stickman-profile';
 const h=document.createElement('h2');h.textContent=a.name;body.append(h);
 const fields=[
  ['Personality',a.personality],['Current Mood',a.state],['Current Goal',a.goal],
  ['Current Action',a.action],['Memory Count',String(a.memoryCount)],
  ['Energy',Math.round(a.energy*100)+'%'],['Relationship With User','Đang được mô phỏng']
 ];
 fields.forEach(([k,v])=>{const p=document.createElement('p');const strong=document.createElement('b');strong.textContent=k+': ';p.append(strong,document.createTextNode(v));body.append(p)});
 const abilities=document.createElement('h3');abilities.textContent='Special Abilities';body.append(abilities);
 a.profile.abilities.forEach(ab=>{const p=document.createElement('p');p.textContent=`${ab.name} — ${ab.description} (Cooldown: ${ab.cooldown/1000}s)`;body.append(p)});
 const actions=document.createElement('div');actions.className='bar';
 [['Talk','talk'],['Follow Cursor','follow'],['Stay Here','stay'],['Animate','animate']].forEach(([label,action])=>btn(actions,label,()=>XPStickman.command(id,action)));
 btn(actions,'View Memory',()=>XPStickman.showMemory(id));
 btn(actions,'Rename',()=>XPStickman.rename(id));
 body.append(actions);
 XPWM.create({title:`Character Profile — ${a.name}`,icon:'🧠',width:430,height:420,appId:'stickman-profile',build:bd=>bd.append(body)});
}
window.showStickmanProfile=showStickmanProfile;
window.createStickman=createStickman;

/* Control Panel, Search and Run utilities */
function controlPanelApp(b){
 b.innerHTML=`<div class="bar"><b>Thuộc tính hệ thống mô phỏng</b></div><div class="control-panel">
 <section><h3>Themes / Appearance</h3><select data-theme><option value="blue">Windows XP Luna Blue</option><option value="olive">Olive Green</option><option value="silver">Silver</option></select></section>
 <section><h3>Desktop Background</h3><select data-wallpaper><option value="bliss">Bliss Meadow</option><option value="night">Night Sky</option></select></section>
 <section><h3>Screen Resolution</h3><select data-size><option value="1024x768">1024 × 768</option><option value="1280x720">1280 × 720</option><option value="1366x768">1366 × 768</option><option value="1600x900">1600 × 900</option><option value="1920x1080">1920 × 1080</option></select><button data-apply-size>Apply</button><small>Khi chạy web, kích thước làm việc do trình duyệt quản lý; chế độ Electron có thể đổi kích thước cửa sổ.</small></section>
 <section><h3>Screensaver</h3><button data-screensaver>Preview Screensaver</button></section>
 </div>`;
 const theme=b.querySelector('[data-theme]'),wall=b.querySelector('[data-wallpaper]'),size=b.querySelector('[data-size]');
 let settings={theme:'blue',wallpaper:'bliss'};
 try{settings={...settings,...JSON.parse(localStorage.getItem('xp-settings')||'{}')}}catch{}
 theme.value=settings.theme;wall.value=settings.wallpaper;
 if(!window.XPPlatform?.canResizeNativeWindow){
  size.disabled=true;b.querySelector('[data-apply-size]').disabled=true;
  b.querySelector('[data-size]').closest('section').querySelector('small').textContent='Kích thước cửa sổ do trình duyệt quản lý. Hãy thay đổi kích thước cửa sổ trình duyệt.';
 }
 const apply=()=>{
  document.body.classList.remove('xp-theme-olive','xp-theme-silver','xp-wallpaper-night');
  if(theme.value==='olive')document.body.classList.add('xp-theme-olive');
  if(theme.value==='silver')document.body.classList.add('xp-theme-silver');
  if(wall.value==='night')document.body.classList.add('xp-wallpaper-night');
  localStorage.setItem('xp-settings',JSON.stringify({theme:theme.value,wallpaper:wall.value}));
 };
 theme.onchange=apply;wall.onchange=apply;apply();
 b.querySelector('[data-apply-size]').onclick=async()=>{
  const [w,h]=size.value.split('x').map(Number);
  try{await window.xpHost.window.setSize(w,h)}catch(error){alert('Không đổi được kích thước: '+error.message)}
 };
 b.querySelector('[data-screensaver]').onclick=()=>{
  const layer=document.createElement('div');layer.className='xp-screensaver';
  const label=document.createElement('span');label.textContent='Windows XP';layer.append(label);
  const close=()=>layer.remove();layer.addEventListener('click',close);layer.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  document.body.append(layer);layer.tabIndex=0;layer.focus();
 };
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
 <h3>Stickman</h3><p>Tạo nhân vật trong Stickman Manager. Mỗi nhân vật có profile, năng lực được tạo bằng seed ổn định và bộ nhớ cục bộ riêng. Đây là mô phỏng hành vi theo thuật toán, không phải ý thức.</p>
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
 ['pictures','My Pictures',I.img,620,430,b=>myc(b,'pictures'),false]
];
const run=(k,arg)=>{const a=A.find(z=>z[0]===k);if(!a)return null;return openWin(a[1],a[2],a[3],a[4],(bd,el,record)=>a[5](bd,arg,record),k)};
window.launchApp=run;
A.forEach(a=>{
 if(a[6]!==false){
 const d=document.createElement('div');d.className='ic';d.dataset.appId=a[0];
 const big=document.createElement('big');big.innerHTML=a[2];
 const label=document.createElement('span');label.className='icon-name';label.textContent=a[1];
 d.append(big,label);
 d.onclick=()=>{document.querySelectorAll('.ic').forEach(x=>x.classList.remove('s'));d.classList.add('s')};
 d.ondblclick=()=>run(a[0]);
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
  if(drag.moved)XPBus.emit('desktop:event',{kind:'icon-move',appId:a[0]});
  drag=null;
 });
 $('#icons').append(d);
 }
 const m=document.createElement('button');m.type='button';m.innerHTML=a[2]+' '+a[1];
 m.onclick=()=>{$('#sm').hidden=true;run(a[0])};
 $('#sm .'+(['pc','documents','pictures','control','search','help','run'].includes(a[0])?'r':'l')).append(m);
});
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
 const icon=document.createElement('div');icon.className='ic';icon.dataset.appId=appId;
 const big=document.createElement('big');big.innerHTML=app[2];
 const label=document.createElement('span');label.className='icon-name';label.textContent=String(title||app[1]).slice(0,40);
 icon.append(big,label);
 icon.onclick=()=>{document.querySelectorAll('.ic').forEach(node=>node.classList.remove('s'));icon.classList.add('s')};
 icon.ondblclick=()=>run(appId);
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
  if(drag.moved)XPBus.emit('desktop:event',{kind:'icon-move',appId});drag=null;
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
$('#offb').onclick=()=>{$('#sm').hidden=true;$('#off').style.display='grid'};$('#off').onclick=()=>$('#off').style.display='none';
const tick=()=>{const now=new Date();$('#clk').textContent=now.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});$('#clk').title=now.toLocaleDateString('vi-VN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})};tick();setInterval(tick,10000);
run('note',{name:'Chào mừng.txt',text:fs['Chào mừng.txt']||''});
