(() => {
  const listeners = new Map();
  const allowed = new Set([
    'desktop:event','window:opened','window:closed','window:focused',
    'stickman:created','stickman:loaded','stickman:appearance-changed','stickman:action','stickman:memory','perception:event','drawing:saved','animation:saved','cloud:synced'
  ]);
  window.XPBus = Object.freeze({
    on(type, callback) {
      if (!allowed.has(type) || typeof callback !== 'function') return () => {};
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(callback);
      return () => listeners.get(type)?.delete(callback);
    },
    emit(type, detail = {}) {
      if (!allowed.has(type)) return;
      for (const callback of listeners.get(type) || []) {
        try { callback(Object.freeze({ ...detail, at: Date.now() })); } catch (error) { console.error(error); }
      }
    }
  });
})();
