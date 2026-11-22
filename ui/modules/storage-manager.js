(() => {
  const DB_NAME = 'xp-living-desktop';
  const DB_VERSION = 1;
  let dbPromise;
  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('IndexedDB không khả dụng'));
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('characters')) db.createObjectStore('characters', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('memories')) {
          const store = db.createObjectStore('memories', { keyPath: 'id' });
          store.createIndex('characterId', 'characterId', { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Không thể mở cơ sở dữ liệu'));
      request.onblocked = () => reject(new Error('Cơ sở dữ liệu đang bị khóa bởi cửa sổ khác'));
    });
    return dbPromise;
  }
  async function request(store, mode, action) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, mode);
      const req = action(tx.objectStore(store));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('Lỗi cơ sở dữ liệu'));
      tx.onabort = () => reject(tx.error || new Error('Giao dịch đã bị hủy'));
    });
  }
  window.XPStorage = Object.freeze({
    saveCharacter: value => request('characters', 'readwrite', s => s.put(value)),
    getCharacter: id => request('characters', 'readonly', s => s.get(id)),
    getCharacters: () => request('characters', 'readonly', s => s.getAll()),
    deleteCharacter: id => request('characters', 'readwrite', s => s.delete(id)),
    addMemory: value => request('memories', 'readwrite', s => s.put(value)),
    getMemories: id => request('memories', 'readonly', s => s.index('characterId').getAll(id)),
    deleteMemory: id => request('memories', 'readwrite', s => s.delete(id)),
    clearMemories: async id => {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('memories', 'readwrite');
        const cursor = tx.objectStore('memories').index('characterId').openCursor(IDBKeyRange.only(id));
        cursor.onsuccess = () => { const c = cursor.result; if (c) { c.delete(); c.continue(); } };
        tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
      });
    }
  });
})();
