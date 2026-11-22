const assert = require('node:assert/strict');
const EventEmitter = require('node:events');
const Module = require('node:module');
const fs = require('node:fs');
const path = require('node:path');

const handlers = new Map();
const mainWindows = [];
const attachedViews = [];
const createdViews = [];
class FakeWebContents extends EventEmitter {
  constructor() {
    super();
    this.navigationHistory = { canGoBack:()=>false,canGoForward:()=>false,goBack(){},goForward(){} };
    this._url='';
  }
  setWindowOpenHandler(fn){this.openHandler=fn}
  setUserAgent(){}
  getURL(){return this._url}
  loadFile(file){this._url='file://'+file;return Promise.resolve()}
  loadURL(url){this._url=url;return Promise.resolve()}
  send(){}
  close(){this.closed=true}
  reload(){}
  stop(){}
}
class FakeView {
  constructor(options){this.options=options;this.webContents=new FakeWebContents();this.bounds=null;createdViews.push(this)}
  setBounds(bounds){this.bounds=bounds}
}
class FakeBrowserWindow extends EventEmitter {
  constructor(options){
    super();this.options=options;this.webContents=new FakeWebContents();this.destroyed=false;
    this.contentView={
      addChildView:view=>{attachedViews.push(view);view.parent=this},
      removeChildView:view=>{const i=attachedViews.lastIndexOf(view);if(i>=0)attachedViews.splice(i,1);view.parent=null}
    };
    mainWindows.push(this);
  }
  loadFile(file){this.loadedFile=file;return Promise.resolve()}
  setSize(width,height){this.size={width,height}}
  isDestroyed(){return this.destroyed}
  static getAllWindows(){return mainWindows.filter(w=>!w.destroyed)}
}
const fakeApp = new EventEmitter();
fakeApp.whenReady=()=>Promise.resolve();
fakeApp.getPath=key=>key==='userData'?path.join(__dirname,'.smoke-userdata'):path.join(__dirname,'.smoke-downloads');
const fakeSession = {
  setUserAgent(){},getUserAgent(){return 'Mock Chromium Electron/33.0.0'},
  setPermissionRequestHandler(){},on(){}
};
const fakeElectron = {
  app:fakeApp,BrowserWindow:FakeBrowserWindow,WebContentsView:FakeView,
  ipcMain:{handle:(channel,fn)=>handlers.set(channel,fn)},
  session:{fromPartition:()=>fakeSession},
  Menu:{buildFromTemplate:()=>({popup(){}})},
  dialog:{showOpenDialog:async()=>({canceled:true,filePaths:[]}),showSaveDialog:async()=>({canceled:true})}
};
const originalLoad=Module._load;
Module._load=function(request,parent,isMain){
  if(request==='electron')return fakeElectron;
  return originalLoad.call(this,request,parent,isMain);
};
require(path.join(__dirname,'..','main.js'));

(async()=>{
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(mainWindows.length,1,'one desktop BrowserWindow should start');
  const main=mainWindows[0];
  assert.ok(main.loadedFile.endsWith(path.join('ui','index.html')),'desktop UI should be the main entry point');
  const sender=main.webContents;
  const invoke=(channel,...args)=>handlers.get(channel)({sender},...args);
  await handlers.get('xp:browser:create')({sender:{}},'untrusted-session');
  assert.equal(createdViews.length,0,'untrusted WebContents must not be able to create browser sessions');
  await invoke('xp:browser:create','smoke-ie');
  assert.equal(createdViews.length,1);
  assert.equal(createdViews[0].options.webPreferences.nodeIntegration,false);
  assert.equal(createdViews[0].options.webPreferences.contextIsolation,true);
  assert.equal(createdViews[0].options.webPreferences.sandbox,true);
  const prevented={value:false,preventDefault(){this.value=true}};
  createdViews[0].webContents.emit('will-navigate',prevented,'file:///etc/passwd');
  assert.equal(prevented.value,true,'browser view must reject arbitrary file URLs');
  const newTabUrl=require('node:url').pathToFileURL(path.join(__dirname,'..','ui','browser-newtab.html')).href;
  const allowed={value:false,preventDefault(){this.value=true}};
  createdViews[0].webContents.emit('will-navigate',allowed,newTabUrl);
  assert.equal(allowed.value,false,'only the bundled new-tab file may be opened internally');
  assert.equal(createdViews[0].webContents.openHandler({url:'javascript:alert(1)'}).action,'deny');
  await invoke('xp:browser:bounds','smoke-ie',{x:80,y:120,width:800,height:500});
  await invoke('xp:browser:visible','smoke-ie',true);
  assert.equal(attachedViews.length,1,'active WebContentsView should attach when visible');
  assert.deepEqual(attachedViews[0].bounds,{x:80,y:120,width:800,height:500});
  await invoke('xp:browser:command','smoke-ie','new-tab',{});
  assert.equal(attachedViews.length,1,'switching tabs should keep one active view attached');
  await invoke('xp:browser:visible','smoke-ie',false);
  assert.equal(attachedViews.length,0,'hiding IE should detach its view');
  await invoke('xp:browser:destroy','smoke-ie');
  assert.equal(attachedViews.length,0,'destroy should leave no browser views attached');
  assert.ok(handlers.has('xp:files:open-text'));
  assert.ok(handlers.has('xp:files:save-text'));
  const size=await invoke('xp:window:set-size',1280,720);
  assert.deepEqual(size,{width:1280,height:720});
  assert.deepEqual(main.size,{width:1280,height:720});
  fs.rmSync(path.join(__dirname,'.smoke-userdata'),{recursive:true,force:true});
  console.log('PASS: mocked Electron main process starts one desktop BrowserWindow');
  console.log('PASS: IPC sender validation and isolated WebContentsView security settings');
  console.log('PASS: WebContentsView rejects arbitrary file URLs and non-HTTP(S) popups');
  console.log('PASS: WebContentsView create, bounds, visible, tab switch and destroy IPC');
  console.log('PASS: file-dialog IPC handlers are registered');
})().catch(error=>{console.error(error);process.exitCode=1});
