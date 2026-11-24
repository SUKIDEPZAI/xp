(() => {
  const DB_NAME = 'xp-living-desktop';
  const DB_VERSION = 3;
  let dbPromise;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('IndexedDB không khả dụng'));
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        const tx = request.transaction;
        if (!db.objectStoreNames.contains('characters')) db.createObjectStore('characters', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('memories')) {
          const store = db.createObjectStore('memories', { keyPath: 'id' });
          store.createIndex('characterId', 'characterId', { unique: false });
          store.createIndex('createdAt', 'at', { unique: false });
        } else if (tx && !tx.objectStore('memories').indexNames.contains('createdAt')) {
          tx.objectStore('memories').createIndex('createdAt', 'at', { unique: false });
        }
        if (!db.objectStoreNames.contains('drawings')) {
          const store = db.createObjectStore('drawings', { keyPath: 'id' });
          store.createIndex('characterId', 'characterId', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
        if (!db.objectStoreNames.contains('animations')) {
          const store = db.createObjectStore('animations', { keyPath: 'id' });
          store.createIndex('characterId', 'characterId', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
        if (!db.objectStoreNames.contains('outbox')) {
          const store = db.createObjectStore('outbox', { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => { db.close(); dbPromise = null; };
        resolve(db);
      };
      request.onerror = () => { dbPromise = null; reject(request.error || new Error('Không thể mở cơ sở dữ liệu')); };
      request.onblocked = () => reject(new Error('Cơ sở dữ liệu đang bị khóa bởi cửa sổ khác'));
    });
    return dbPromise;
  }

  async function request(storeName, mode, action) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const req = action(tx.objectStore(storeName));
      let result;
      req.onsuccess = () => { result = req.result; };
      req.onerror = () => reject(req.error || new Error('Lỗi cơ sở dữ liệu'));
      tx.oncomplete = () => resolve(result);
      tx.onabort = () => reject(tx.error || new Error('Giao dịch đã bị hủy'));
      tx.onerror = () => reject(tx.error || new Error('Giao dịch cơ sở dữ liệu thất bại'));
    });
  }
  const list = store => request(store, 'readonly', s => s.getAll());
  const get = (store,id) => request(store, 'readonly', s => s.get(id));
  const put = (store,value) => request(store, 'readwrite', s => s.put(value));
  const remove = (store,id) => request(store, 'readwrite', s => s.delete(id));

  window.XPStorage = Object.freeze({
    saveCharacter:value=>put('characters',value), getCharacter:id=>get('characters',id),
    getCharacters:()=>list('characters'), deleteCharacter:id=>remove('characters',id),
    addMemory:value=>put('memories',value),
    getMemories:async id=>{const db=await openDB();return new Promise((resolve,reject)=>{const req=db.transaction('memories','readonly').objectStore('memories').index('characterId').getAll(id);req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error)});},
    deleteMemory:id=>remove('memories',id),
    clearMemories:async id=>{const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction('memories','readwrite');const cursor=tx.objectStore('memories').index('characterId').openCursor(IDBKeyRange.only(id));cursor.onsuccess=()=>{const c=cursor.result;if(c){c.delete();c.continue()}};tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)});},
    saveDrawing:value=>put('drawings',value), getDrawing:id=>get('drawings',id), getDrawings:()=>list('drawings'), deleteDrawing:id=>remove('drawings',id),
    saveAnimation:value=>put('animations',value), getAnimation:id=>get('animations',id), getAnimations:()=>list('animations'), deleteAnimation:id=>remove('animations',id),
    enqueueSync:value=>put('outbox',value), getSyncQueue:()=>list('outbox'), removeSyncItem:id=>remove('outbox',id),
    getSetting:async key=>(await get('settings',key))?.value,
    setSetting:(key,value)=>put('settings',{key,value,updatedAt:Date.now()})
  });
})();
