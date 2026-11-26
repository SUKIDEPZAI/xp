'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class FakeElement {
  constructor(tag) {
    this.tagName = tag.toUpperCase(); this.children = []; this.dataset = {}; this.style = {};
    this.attributes = {}; this.listeners = new Map(); this.className = ''; this.src = '';
    this.contentWindow = { history: { back(){}, forward(){} }, location: { reload(){} }, stop(){} };
  }
  append(...items) { this.children.push(...items); }
  appendChild(item) { this.append(item); return item; }
  remove() { this.removed = true; }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  addEventListener(name, fn) { if (!this.listeners.has(name)) this.listeners.set(name, []); this.listeners.get(name).push(fn); }
  fire(name) { for (const fn of this.listeners.get(name) || []) fn({ type: name }); }
}

(async () => {
  const host = new FakeElement('div'); host.className = 'browser-page-host'; host.dataset.browserSession = 'browser-test';
  const document = {
    baseURI: 'https://xp.example/',
    body: new FakeElement('body'),
    querySelectorAll: selector => selector === '.browser-page-host' ? [host] : [],
    createElement: tag => new FakeElement(tag)
  };
  const data = new Map();
  const localStorage = { getItem: key => data.get(key) || null, setItem: (key, value) => data.set(key, value) };
  const window = { showOpenFilePicker: undefined, showSaveFilePicker: undefined };
  const context = { window, document, localStorage, URL, Map, Set, Promise, Blob, setTimeout, console };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../ui/host-adapter.js'), 'utf8'), context);

  assert.equal(window.XPPlatform.mode, 'web');
  const states = [];
  const off = window.xpHost.browser.onState(state => states.push(state));
  window.xpHost.browser.create('browser-test');
  assert.ok(states.length >= 1, 'Electron-compatible listener registered before session creation must receive its first state');
  assert.equal(states.at(-1).tabs.length, 1);
  assert.equal(host.children.length, 1);
  assert.equal(host.children[0].attributes.sandbox, 'allow-scripts allow-forms allow-downloads allow-popups allow-popups-to-escape-sandbox allow-modals allow-presentation');
  assert.equal(host.children[0].attributes.allow, 'fullscreen; autoplay; clipboard-read; clipboard-write');

  await window.xpHost.browser.command('browser-test', 'navigate', { url: 'https://example.org/path' });
  assert.equal(states.at(-1).tabs[0].url, 'https://example.org/path');
  assert.equal(host.children[0].src, 'https://example.org/path');
  await window.xpHost.browser.command('browser-test', 'navigate', { url: 'javascript://alert(1)' });
  assert.match(states.at(-1).tabs[0].url, /^https:\/\/www\.google\.com\/search\?q=/, 'non-web protocols must never be loaded as executable iframe URLs');
  await window.xpHost.browser.command('browser-test', 'navigate', { url: 'cats' });
  assert.match(states.at(-1).tabs[0].url, /^https:\/\/www\.google\.com\/search\?q=cats$/, 'single-word input should be searched rather than opened as https://cats');
  await window.xpHost.browser.command('browser-test', 'navigate', { url: 'funny stickman animation' });
  assert.match(states.at(-1).tabs[0].url, /q=funny%20stickman%20animation$/, 'multi-word input should use the current search engine');
  await window.xpHost.browser.command('browser-test', 'navigate', { url: 'example.org/docs' });
  assert.equal(states.at(-1).tabs[0].url, 'https://example.org/docs');
  await window.xpHost.browser.command('browser-test', 'navigate', { url: 'localhost:8080/ready' });
  assert.equal(states.at(-1).tabs[0].url, 'http://localhost:8080/ready');
  await window.xpHost.browser.command('browser-test', 'navigate', { url: 'duckduckgo', forceSearch: true });
  assert.match(states.at(-1).tabs[0].url, /^https:\/\/www\.google\.com\/search\?q=duckduckgo$/, 'explicit search must force a query even when text resembles a URL');
  await window.xpHost.browser.command('browser-test', 'settings', { home: 'https://www.google.com', engine: 'duckduckgo' });
  await window.xpHost.browser.command('browser-test', 'navigate', { url: 'stickman brain' });
  assert.match(states.at(-1).tabs[0].url, /^https:\/\/duckduckgo\.com\/\?q=stickman%20brain$/, 'the selected search engine must be respected by the web adapter');

  await window.xpHost.browser.command('browser-test', 'new-tab');
  assert.equal(states.at(-1).tabs.length, 2);
  await window.xpHost.browser.command('browser-test', 'close-tab', { tabId: 2 });
  assert.equal(states.at(-1).tabs.length, 1);
  off();
  window.xpHost.browser.destroy('browser-test');
  assert.equal(host.children[0].removed, true);
  console.log('PASS: web adapter browser lifecycle, sandboxed external navigation, protocol validation and subscribe-before-create ordering');
})().catch(error => { console.error(error); process.exitCode = 1; });
