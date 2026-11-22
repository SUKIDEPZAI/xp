'use strict';
const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args);
contextBridge.exposeInMainWorld('xpHost', Object.freeze({
  browser: Object.freeze({
    create: sessionId => invoke('xp:browser:create', sessionId),
    setBounds: (sessionId, bounds) => invoke('xp:browser:bounds', sessionId, bounds),
    setVisible: (sessionId, visible) => invoke('xp:browser:visible', sessionId, visible),
    destroy: sessionId => invoke('xp:browser:destroy', sessionId),
    command: (sessionId, command, payload) => invoke('xp:browser:command', sessionId, command, payload),
    onState: callback => {
      if (typeof callback !== 'function') return () => {};
      const listener = (_event, data) => callback(data);
      ipcRenderer.on('xp:browser-state', listener);
      return () => ipcRenderer.removeListener('xp:browser-state', listener);
    }
  }),
  files: Object.freeze({
    openText: () => invoke('xp:files:open-text'),
    saveText: (token, content, suggestedName) => invoke('xp:files:save-text', token, content, suggestedName),
    saveTextAs: (content, suggestedName) => invoke('xp:files:save-text-as', content, suggestedName)
  }),
  window: Object.freeze({
    setSize: (width, height) => invoke('xp:window:set-size', width, height)
  })
}));
