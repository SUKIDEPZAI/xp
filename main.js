'use strict';
const { app, BrowserWindow, WebContentsView, ipcMain, session, Menu, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { randomUUID } = require('node:crypto');

const UI_DIR = path.join(__dirname, 'ui');
const UI_URL = pathToFileURL(UI_DIR + path.sep).href;
const BROWSER_NEW_TAB_URL = pathToFileURL(path.join(UI_DIR, 'browser-newtab.html')).href;
const BROWSER_PARTITION = 'persist:xp-living-browser';
const SEARCH_ENGINES = Object.freeze({
  google: 'https://www.google.com/search?q=%s',
  bing: 'https://www.bing.com/search?q=%s',
  duckduckgo: 'https://duckduckgo.com/?q=%s'
});
let mainWindow = null;
let browserStoreFile = null;
let browserStore = { home: 'https://www.google.com', engine: 'google', bookmarks: [], history: [] };
const browserSessions = new Map();
const approvedTextFiles = new Map();
const MAX_TEXT_FILE_BYTES = 8 * 1024 * 1024;

const isWebURL = value => {
  try { const u = new URL(value); return u.protocol === 'http:' || u.protocol === 'https:'; }
  catch { return false; }
};
function saveBrowserStore() {
  try { fs.writeFileSync(browserStoreFile, JSON.stringify(browserStore, null, 2), { mode: 0o600 }); }
  catch (error) { console.error('Cannot save browser store:', error); }
}
function normalizeURL(input, forceSearch = false) {
  const value = String(input || '').trim();
  if (!value) return null;
  if (!forceSearch) {
    if (isWebURL(value)) return value;
    if (!/\s/.test(value) && /^([\w-]+\.)+[a-z]{2,}(:\d+)?([/?#].*)?$/i.test(value)) return `https://${value}`;
    if (!/\s/.test(value) && /^(localhost|\d{1,3}(\.\d{1,3}){3})(:\d+)?([/?#].*)?$/i.test(value)) return `http://${value}`;
  }
  const engine = SEARCH_ENGINES[browserStore.engine] || SEARCH_ENGINES.google;
  return engine.replace('%s', encodeURIComponent(value));
}
function sendBrowserState(sessionId) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const sessionData = browserSessions.get(sessionId);
  if (!sessionData) return;
  const tabs = sessionData.tabs.map(tab => ({
    id: tab.id,
    title: tab.title || tab.url || 'Tab mới',
    url: tab.url || '',
    loading: tab.loading,
    favicon: tab.favicon,
    active: tab.id === sessionData.activeTabId,
    canBack: tab.view.webContents.navigationHistory.canGoBack(),
    canForward: tab.view.webContents.navigationHistory.canGoForward()
  }));
  mainWindow.webContents.send('xp:browser-state', { sessionId, activeTabId: sessionData.activeTabId, tabs, store: browserStore });
}
function pushHistory(url, title) {
  if (!isWebURL(url)) return;
  browserStore.history.unshift({ url, title: title || url, at: Date.now() });
  browserStore.history = browserStore.history.slice(0, 1000);
  saveBrowserStore();
}
function getTab(sessionData, tabId) {
  return sessionData.tabs.find(tab => tab.id === tabId);
}
function addBrowserTab(sessionId, url = '') {
  const data = browserSessions.get(sessionId);
  if (!data) return null;
  const id = data.nextTabId++;
  const view = new WebContentsView({
    webPreferences: {
      partition: BROWSER_PARTITION,
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  });
  const tab = { id, view, url: '', title: 'Tab mới', favicon: '', loading: false };
  data.tabs.push(tab);
  const wc = view.webContents;
  const guard = (event, destination) => {
    if (!isWebURL(destination) && destination.split(/[?#]/)[0] !== BROWSER_NEW_TAB_URL) event.preventDefault();
  };
  wc.on('will-navigate', guard);
  wc.on('will-redirect', guard);
  wc.setWindowOpenHandler(({ url: destination }) => {
    if (isWebURL(destination)) addBrowserTab(sessionId, destination);
    return { action: 'deny' };
  });
  wc.on('page-title-updated', (_event, title) => {
    tab.title = String(title || '').slice(0, 160);
    sendBrowserState(sessionId);
  });
  wc.on('page-favicon-updated', (_event, favicons) => {
    tab.favicon = Array.isArray(favicons) ? (favicons[0] || '') : '';
    sendBrowserState(sessionId);
  });
  wc.on('did-start-loading', () => { tab.loading = true; sendBrowserState(sessionId); });
  wc.on('did-stop-loading', () => { tab.loading = false; sendBrowserState(sessionId); });
  wc.on('did-navigate', (_event, destination) => {
    if (isWebURL(destination)) {
      tab.url = destination;
      pushHistory(destination, tab.title);
    }
    sendBrowserState(sessionId);
  });
  wc.on('did-navigate-in-page', (_event, destination) => {
    if (isWebURL(destination)) tab.url = destination;
    sendBrowserState(sessionId);
  });
  wc.on('did-fail-load', (_event, code, description, failedUrl, isMainFrame) => {
    if (isMainFrame && code !== -3) {
      tab.loading = false;
      tab.title = `Không thể mở trang`;
      tab.url = isWebURL(failedUrl) ? failedUrl : tab.url;
      sendBrowserState(sessionId);
    }
  });
  wc.on('render-process-gone', () => {
    tab.loading = false;
    tab.title = 'Trang đã dừng';
    sendBrowserState(sessionId);
  });
  wc.on('context-menu', (_event, params) => {
    const template = [];
    if (params.linkURL && isWebURL(params.linkURL)) template.push({ label: 'Open Link in New Tab', click: () => addBrowserTab(sessionId, params.linkURL) });
    if (params.selectionText) template.push({ role: 'copy', label: 'Copy selected text' });
    template.push(
      { label: 'Back', enabled: wc.navigationHistory.canGoBack(), click: () => wc.navigationHistory.goBack() },
      { label: 'Forward', enabled: wc.navigationHistory.canGoForward(), click: () => wc.navigationHistory.goForward() },
      { label: 'Reload', click: () => wc.reload() },
      { type: 'separator' },
      { role: 'copy' },
      { role: 'selectAll' }
    );
    Menu.buildFromTemplate(template).popup({ window: mainWindow });
  });
  if (url && isWebURL(url)) wc.loadURL(url).catch(() => {});
  else wc.loadFile(path.join(UI_DIR, 'browser-newtab.html')).catch(() => {});
  selectBrowserTab(sessionId, id);
  return tab;
}
function selectBrowserTab(sessionId, tabId) {
  const data = browserSessions.get(sessionId);
  const tab = data && getTab(data, tabId);
  if (!tab) return;
  const previous = getTab(data, data.activeTabId);
  if (previous && previous !== tab && data.attached) {
    try { mainWindow.contentView.removeChildView(previous.view); } catch {}
  }
  data.activeTabId = tabId;
  if (data.visible && mainWindow && !mainWindow.isDestroyed()) {
    try { mainWindow.contentView.addChildView(tab.view); data.attached = true; }
    catch (error) { console.error('Could not attach browser WebContentsView:', error); }
    if (data.bounds) tab.view.setBounds(data.bounds);
  }
  sendBrowserState(sessionId);
}
function createBrowserSession(sessionId) {
  if (browserSessions.has(sessionId)) return sendBrowserState(sessionId);
  const data = { tabs: [], nextTabId: 1, activeTabId: null, bounds: null, visible: false, attached: false };
  browserSessions.set(sessionId, data);
  addBrowserTab(sessionId);
  return sendBrowserState(sessionId);
}
function destroyBrowserSession(sessionId) {
  const data = browserSessions.get(sessionId);
  if (!data) return;
  for (const tab of data.tabs) {
    try { mainWindow?.contentView.removeChildView(tab.view); } catch {}
    try { tab.view.webContents.close(); } catch {}
  }
  browserSessions.delete(sessionId);
}
function setBrowserVisible(sessionId, visible) {
  const data = browserSessions.get(sessionId);
  if (!data || !mainWindow || mainWindow.isDestroyed()) return;
  data.visible = Boolean(visible);
  const tab = getTab(data, data.activeTabId);
  if (!data.visible) {
    if (tab) { try { mainWindow.contentView.removeChildView(tab.view); } catch {} }
    data.attached = false;
    return;
  }
  if (tab) {
    try { mainWindow.contentView.addChildView(tab.view); data.attached = true; }
    catch (error) { console.error('Could not show browser view:', error); }
    if (data.bounds) tab.view.setBounds(data.bounds);
  }
}
function setBrowserBounds(sessionId, rawBounds) {
  const data = browserSessions.get(sessionId);
  if (!data || !rawBounds || typeof rawBounds !== 'object') return;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, Math.round(Number(v) || 0)));
  const bounds = {
    x: clamp(rawBounds.x, 0, 20000),
    y: clamp(rawBounds.y, 0, 20000),
    width: clamp(rawBounds.width, 1, 20000),
    height: clamp(rawBounds.height, 1, 20000)
  };
  data.bounds = bounds;
  const tab = getTab(data, data.activeTabId);
  if (tab && data.visible) {
    if (!data.attached) setBrowserVisible(sessionId, true);
    try { tab.view.setBounds(bounds); } catch (error) { console.error('setBounds failed:', error); }
  }
}
function browserCommand(sessionId, command, payload = {}) {
  const data = browserSessions.get(sessionId);
  if (!data) return;
  const tab = getTab(data, data.activeTabId);
  const wc = tab?.view.webContents;
  switch (command) {
    case 'navigate': {
      const url = normalizeURL(payload.url, Boolean(payload.forceSearch));
      if (url && isWebURL(url) && wc) wc.loadURL(url).catch(() => {});
      break;
    }
    case 'new-tab': addBrowserTab(sessionId, payload.url || ''); break;
    case 'select-tab': selectBrowserTab(sessionId, Number(payload.tabId)); break;
    case 'close-tab': {
      const index = data.tabs.findIndex(item => item.id === Number(payload.tabId));
      if (index < 0) break;
      const [removed] = data.tabs.splice(index, 1);
      try { mainWindow.contentView.removeChildView(removed.view); } catch {}
      try { removed.view.webContents.close(); } catch {}
      if (!data.tabs.length) addBrowserTab(sessionId);
      else if (removed.id === data.activeTabId) selectBrowserTab(sessionId, data.tabs[Math.min(index, data.tabs.length - 1)].id);
      else sendBrowserState(sessionId);
      break;
    }
    case 'back': if (wc?.navigationHistory.canGoBack()) wc.navigationHistory.goBack(); break;
    case 'forward': if (wc?.navigationHistory.canGoForward()) wc.navigationHistory.goForward(); break;
    case 'reload': wc?.reload(); break;
    case 'stop': wc?.stop(); break;
    case 'home': if (wc) wc.loadURL(browserStore.home).catch(() => {}); break;
    case 'bookmark': {
      if (!tab?.url || !isWebURL(tab.url)) break;
      const index = browserStore.bookmarks.findIndex(item => item.url === tab.url);
      if (index >= 0) browserStore.bookmarks.splice(index, 1);
      else browserStore.bookmarks.unshift({ url: tab.url, title: tab.title });
      saveBrowserStore(); sendBrowserState(sessionId); break;
    }
    case 'open-bookmark': if (payload.url && isWebURL(payload.url) && wc) wc.loadURL(payload.url).catch(() => {}); break;
    case 'settings': {
      if (payload.home && isWebURL(payload.home)) browserStore.home = payload.home;
      if (SEARCH_ENGINES[payload.engine]) browserStore.engine = payload.engine;
      saveBrowserStore(); sendBrowserState(sessionId); break;
    }
    case 'get-store': return browserStore;
    default: return;
  }
}
function isTrustedRenderer(event) {
  return Boolean(mainWindow && !mainWindow.isDestroyed() && event.sender === mainWindow.webContents);
}
function registerIPC() {
  ipcMain.handle('xp:browser:create', (event, sessionId) => {
    if (!isTrustedRenderer(event) || typeof sessionId !== 'string' || sessionId.length > 100) return;
    createBrowserSession(sessionId);
  });
  ipcMain.handle('xp:browser:bounds', (event, sessionId, bounds) => {
    if (!isTrustedRenderer(event)) return;
    setBrowserBounds(sessionId, bounds);
  });
  ipcMain.handle('xp:browser:visible', (event, sessionId, visible) => {
    if (!isTrustedRenderer(event)) return;
    setBrowserVisible(sessionId, visible);
  });
  ipcMain.handle('xp:browser:destroy', (event, sessionId) => {
    if (!isTrustedRenderer(event)) return;
    destroyBrowserSession(sessionId);
  });
  ipcMain.handle('xp:browser:command', (event, sessionId, command, payload) => {
    if (!isTrustedRenderer(event) || typeof command !== 'string') return;
    return browserCommand(sessionId, command, payload);
  });
  ipcMain.handle('xp:files:open-text', async event => {
    if (!isTrustedRenderer(event)) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'Text and code', extensions: ['txt','md','js','html','css','json','csv','xml','log','yml','yaml','ini','svg'] }, { name: 'All files', extensions: ['*'] }]
    });
    if (result.canceled || !result.filePaths[0]) return null;
    const filePath = result.filePaths[0];
    const info = await fs.promises.stat(filePath);
    if (!info.isFile() || info.size > MAX_TEXT_FILE_BYTES) throw new Error('Tệp văn bản vượt quá giới hạn 8 MB.');
    const token = randomUUID();
    approvedTextFiles.set(token, filePath);
    const text = await fs.promises.readFile(filePath, 'utf8');
    return { token, name: path.basename(filePath), text };
  });
  ipcMain.handle('xp:files:save-text', async (event, token, content, suggestedName) => {
    if (!isTrustedRenderer(event) || typeof content !== 'string' || Buffer.byteLength(content, 'utf8') > MAX_TEXT_FILE_BYTES) {
      throw new Error('Nội dung không hợp lệ hoặc vượt quá 8 MB.');
    }
    let filePath = typeof token === 'string' ? approvedTextFiles.get(token) : null;
    if (!filePath) {
      const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: path.basename(String(suggestedName || 'Untitled.txt')),
        filters: [{ name: 'Text files', extensions: ['txt'] }, { name: 'All files', extensions: ['*'] }]
      });
      if (result.canceled || !result.filePath) return null;
      filePath = result.filePath;
      const newToken = randomUUID();
      approvedTextFiles.set(newToken, filePath);
      await fs.promises.writeFile(filePath, content, 'utf8');
      return { token: newToken, name: path.basename(filePath) };
    }
    await fs.promises.writeFile(filePath, content, 'utf8');
    return { token, name: path.basename(filePath) };
  });
  ipcMain.handle('xp:files:save-text-as', async (event, content, suggestedName) => {
    if (!isTrustedRenderer(event) || typeof content !== 'string' || Buffer.byteLength(content, 'utf8') > MAX_TEXT_FILE_BYTES) {
      throw new Error('Nội dung không hợp lệ hoặc vượt quá 8 MB.');
    }
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: path.basename(String(suggestedName || 'Untitled.txt')),
      filters: [{ name: 'Text files', extensions: ['txt'] }, { name: 'All files', extensions: ['*'] }]
    });
    if (result.canceled || !result.filePath) return null;
    const token = randomUUID();
    approvedTextFiles.set(token, result.filePath);
    await fs.promises.writeFile(result.filePath, content, 'utf8');
    return { token, name: path.basename(result.filePath) };
  });
  ipcMain.handle('xp:window:set-size', (event, width, height) => {
    if (!isTrustedRenderer(event)) return;
    const w = Math.max(800, Math.min(3840, Math.round(Number(width) || 0)));
    const h = Math.max(540, Math.min(2160, Math.round(Number(height) || 0)));
    mainWindow.setSize(w, h);
    return { width: w, height: h };
  });
}
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1366, height: 860, minWidth: 800, minHeight: 540,
    title: 'Windows XP — Living Desktop',
    backgroundColor: '#245edc',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, destination) => {
    if (!destination.startsWith(UI_URL)) event.preventDefault();
  });
  mainWindow.webContents.on('will-attach-webview', event => event.preventDefault());
  mainWindow.on('closed', () => {
    for (const id of [...browserSessions.keys()]) destroyBrowserSession(id);
    mainWindow = null;
  });
  mainWindow.loadFile(path.join(UI_DIR, 'index.html'));
}

app.whenReady().then(() => {
  browserStoreFile = path.join(app.getPath('userData'), 'browser-store.json');
  try {
    const parsed = JSON.parse(fs.readFileSync(browserStoreFile, 'utf8'));
    browserStore = { ...browserStore, ...parsed };
    if (!SEARCH_ENGINES[browserStore.engine]) browserStore.engine = 'google';
    if (!Array.isArray(browserStore.bookmarks)) browserStore.bookmarks = [];
    if (!Array.isArray(browserStore.history)) browserStore.history = [];
  } catch {}
  const browserSession = session.fromPartition(BROWSER_PARTITION);
  browserSession.setUserAgent(browserSession.getUserAgent().replace(/\sElectron\/\S+/g, ''));
  browserSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
  browserSession.on('will-download', (_event, item) => {
    const downloads = app.getPath('downloads');
    const base = path.basename(item.getFilename()).replace(/[<>:"/\\|?*\x00-\x1F]/g, '_') || 'download';
    let target = path.join(downloads, base);
    if (fs.existsSync(target)) target = path.join(downloads, `${Date.now()}-${base}`);
    item.setSavePath(target);
  });
  registerIPC();
  createMainWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createMainWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', () => { for (const id of [...browserSessions.keys()]) destroyBrowserSession(id); });
