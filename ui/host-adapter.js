/* Platform adapter: Electron keeps its secure preload bridge; ordinary web browsers
   receive equivalent browser-only capabilities without Node.js or OS access. */
(() => {
  const electronBridge = Boolean(window.xpHost && window.xpHost.browser && window.xpHost.files);
  window.XPPlatform = Object.freeze({
    mode: electronBridge ? 'electron' : 'web',
    isElectron: electronBridge,
    canResizeNativeWindow: electronBridge,
    storage: 'IndexedDB + browser storage'
  });
  if (electronBridge) return;

  const handles = new Map();
  let nextHandle = 1;
  const sessions = new Map();
  const stateListeners = new Set();
  const STORE_KEY = 'xp-browser-store-v1';
  const NEW_TAB = new URL('browser-newtab.html', document.baseURI).href;
  const defaultStore = { home: 'https://www.google.com', engine: 'google', bookmarks: [], history: [] };
  const engines = {
    google: q => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
    bing: q => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
    duckduckgo: q => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`
  };

  function loadStore() {
    try {
      const value = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      return { ...defaultStore, ...value, bookmarks: Array.isArray(value.bookmarks) ? value.bookmarks : [], history: Array.isArray(value.history) ? value.history : [] };
    } catch { return { ...defaultStore, bookmarks: [], history: [] }; }
  }
  const store = loadStore();
  function saveStore() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (error) { console.warn('Không thể lưu dữ liệu trình duyệt:', error); }
  }
  function validWebUrl(value) {
    try { const url = new URL(value); return url.protocol === 'http:' || url.protocol === 'https:'; }
    catch { return false; }
  }
  function normalizeUrl(raw, forceSearch = false) {
    const value = String(raw || '').trim();
    if (!value) return store.home;
    if (!forceSearch) {
      if (validWebUrl(value)) return value;
      if (!/\s/.test(value) && /^([\w-]+\.)+[a-z]{2,}(:\d+)?([/?#].*)?$/i.test(value)) return `https://${value}`;
      if (!/\s/.test(value) && /^(localhost|\d{1,3}(\.\d{1,3}){3})(:\d+)?([/?#].*)?$/i.test(value)) return `http://${value}`;
    }
    return (engines[store.engine] || engines.google)(value);
  }
  function getSession(id) { return sessions.get(String(id)); }
  function snapshot(session) {
    return {
      sessionId: session.id,
      activeTabId: session.activeTabId,
      tabs: session.tabs.map(tab => ({
        id: tab.id, url: tab.url, title: tab.title, favicon: '', loading: tab.loading,
        canBack: tab.historyIndex > 0,
        canForward: tab.historyIndex < tab.history.length - 1
      })),
      store: { ...store, bookmarks: [...store.bookmarks], history: [...store.history] }
    };
  }
  function notify(session) {
    const state = snapshot(session);
    for (const callback of stateListeners) {
      try { callback(state); } catch (error) { console.error(error); }
    }
  }
  function addHistory(url, title) {
    if (!validWebUrl(url)) return;
    store.history.unshift({ url, title: title || url, at: Date.now() });
    store.history = store.history.slice(0, 500);
    saveStore();
  }
  function attachFrame(session, tab) {
    if (!session.host) return;
    const frame = document.createElement('iframe');
    frame.className = 'web-browser-frame';
    frame.title = tab.title || 'Website';
    frame.referrerPolicy = 'no-referrer';
    frame.loading = 'eager';
    frame.setAttribute('sandbox', 'allow-scripts allow-forms allow-downloads');
    frame.setAttribute('allow', 'fullscreen; autoplay');
    frame.addEventListener('load', () => {
      tab.loading = false;
      if (tab.url === NEW_TAB) tab.title = 'Tab mới';
      else {
        try { tab.title = frame.contentDocument?.title || new URL(tab.url).hostname; }
        catch { tab.title = new URL(tab.url).hostname; }
      }
      notify(session);
    });
    frame.addEventListener('error', () => { tab.loading = false; tab.title = 'Không thể nhúng trang'; notify(session); });
    tab.frame = frame;
    session.host.append(frame);
    frame.src = tab.url || NEW_TAB;
  }
  function selectTab(session, id) {
    const tab = session.tabs.find(item => item.id === Number(id));
    if (!tab) return;
    session.activeTabId = tab.id;
    for (const item of session.tabs) if (item.frame) item.frame.style.display = item === tab ? 'block' : 'none';
    notify(session);
  }
  function createTab(session, rawUrl = '') {
    const id = session.nextTabId++;
    const url = rawUrl ? normalizeUrl(rawUrl) : NEW_TAB;
    const tab = { id, url, title: rawUrl ? new URL(url).hostname : 'Tab mới', loading: Boolean(rawUrl), history: [url], historyIndex: 0, frame: null };
    session.tabs.push(tab);
    attachFrame(session, tab);
    selectTab(session, id);
    if (rawUrl) addHistory(url, tab.title);
    return tab;
  }
  function navigate(session, tab, rawUrl, forceSearch = false, record = true) {
    if (!tab) return;
    const url = normalizeUrl(rawUrl, forceSearch);
    if (!validWebUrl(url)) return;
    tab.url = url;
    tab.title = new URL(url).hostname;
    tab.loading = true;
    tab.history = tab.history.slice(0, tab.historyIndex + 1);
    tab.history.push(url);
    tab.historyIndex = tab.history.length - 1;
    if (tab.frame) tab.frame.src = url;
    if (record) addHistory(url, tab.title);
    notify(session);
  }
  function activeTab(session) { return session?.tabs.find(tab => tab.id === session.activeTabId); }

  const browser = {
    create(sessionId) {
      const id = String(sessionId);
      if (sessions.has(id)) { notify(sessions.get(id)); return; }
      const host = [...document.querySelectorAll('.browser-page-host')].find(node => node.dataset.browserSession === id);
      const session = { id, host: host || null, tabs: [], nextTabId: 1, activeTabId: null };
      sessions.set(id, session);
      createTab(session);
      notify(session);
    },
    setBounds() { /* DOM layout owns iframe bounds in web mode. */ },
    setVisible() { /* WindowManager owns visibility via the containing desktop window. */ },
    destroy(sessionId) {
      const session = getSession(sessionId); if (!session) return;
      for (const tab of session.tabs) tab.frame?.remove();
      sessions.delete(String(sessionId));
    },
    onState(callback) {
      if (typeof callback !== 'function') return () => {};
      stateListeners.add(callback);
      for (const session of sessions.values()) callback(snapshot(session));
      return () => stateListeners.delete(callback);
    },
    async command(sessionId, command, payload = {}) {
      const session = getSession(sessionId); if (!session) return null;
      const tab = activeTab(session);
      switch (command) {
        case 'navigate': navigate(session, tab, payload.url, Boolean(payload.forceSearch)); break;
        case 'new-tab': createTab(session, payload.url || ''); break;
        case 'select-tab': selectTab(session, payload.tabId); break;
        case 'close-tab': {
          const index = session.tabs.findIndex(item => item.id === Number(payload.tabId));
          if (index < 0) break;
          const [removed] = session.tabs.splice(index, 1); removed.frame?.remove();
          if (!session.tabs.length) createTab(session);
          else if (removed.id === session.activeTabId) selectTab(session, session.tabs[Math.min(index, session.tabs.length - 1)].id);
          else notify(session);
          break;
        }
        case 'back': if (tab && tab.historyIndex > 0) { tab.historyIndex--; tab.url = tab.history[tab.historyIndex]; tab.loading = true; tab.frame.src = tab.url; notify(session); } break;
        case 'forward': if (tab && tab.historyIndex < tab.history.length - 1) { tab.historyIndex++; tab.url = tab.history[tab.historyIndex]; tab.loading = true; tab.frame.src = tab.url; notify(session); } break;
        case 'reload': if (tab?.frame) { tab.loading = true; tab.frame.contentWindow.location.reload(); notify(session); } break;
        case 'stop': if (tab?.frame) { try { tab.frame.contentWindow.stop(); } catch {} tab.loading = false; notify(session); } break;
        case 'home': navigate(session, tab, store.home); break;
        case 'bookmark': {
          if (!tab || !validWebUrl(tab.url)) break;
          const index = store.bookmarks.findIndex(item => item.url === tab.url);
          if (index >= 0) store.bookmarks.splice(index, 1);
          else store.bookmarks.unshift({ url: tab.url, title: tab.title });
          saveStore(); notify(session); break;
        }
        case 'open-bookmark': if (payload.url) navigate(session, tab, payload.url); break;
        case 'settings':
          if (validWebUrl(payload.home)) store.home = payload.home;
          if (engines[payload.engine]) store.engine = payload.engine;
          saveStore(); notify(session); break;
        case 'get-store': return { ...store, bookmarks: [...store.bookmarks], history: [...store.history] };
        default: break;
      }
      return snapshot(session);
    }
  };

  async function openTextFile() {
    if ('showOpenFilePicker' in window) {
      try {
        const [handle] = await window.showOpenFilePicker({
          multiple: false,
          types: [{ description: 'Text files', accept: { 'text/plain': ['.txt', '.md', '.log', '.json', '.csv'] } }]
        });
        if (!handle) return null;
        const file = await handle.getFile();
        const token = `web-file-${nextHandle++}`;
        handles.set(token, handle);
        return { name: file.name, text: await file.text(), token };
      } catch (error) { if (error?.name === 'AbortError') return null; throw error; }
    }
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = '.txt,.md,.log,.json,.csv,text/plain';
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        resolve(file ? { name: file.name, text: await file.text(), token: null } : null);
      }, { once: true });
      input.addEventListener('cancel', () => resolve(null), { once: true });
      input.click();
    });
  }
  function downloadText(text, name) {
    const blob = new Blob([String(text)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = String(name || 'Untitled.txt');
    document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    return { token: null, name: anchor.download };
  }
  async function writeText(handle, text, name) {
    if (handle) {
      let permission = await handle.queryPermission({ mode: 'readwrite' });
      if (permission !== 'granted') permission = await handle.requestPermission({ mode: 'readwrite' });
      if (permission === 'granted') {
        const writable = await handle.createWritable();
        await writable.write(String(text)); await writable.close();
        return { token: [...handles.entries()].find(([, value]) => value === handle)?.[0] || null, name: handle.name };
      }
    }
    return downloadText(text, name);
  }

  window.xpHost = Object.freeze({
    browser,
    files: Object.freeze({
      openText: openTextFile,
      saveText: async (token, content, name) => writeText(handles.get(token), content, name),
      saveTextAs: async (content, name) => {
        if ('showSaveFilePicker' in window) {
          try {
            const handle = await window.showSaveFilePicker({ suggestedName: name || 'Untitled.txt', types: [{ description: 'Text files', accept: { 'text/plain': ['.txt'] } }] });
            const token = `web-file-${nextHandle++}`; handles.set(token, handle);
            return writeText(handle, content, name);
          } catch (error) { if (error?.name === 'AbortError') return null; throw error; }
        }
        return downloadText(content, name);
      }
    }),
    window: Object.freeze({
      setSize: async () => { throw new Error('Kích thước cửa sổ do trình duyệt quản lý. Hãy thay đổi kích thước cửa sổ trình duyệt.'); }
    })
  });
})();
