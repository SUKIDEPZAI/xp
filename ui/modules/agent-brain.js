(() => {
  'use strict';
  const bounded = (value, max = 180) => String(value ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
  async function request(path, payload) {
    const response = await fetch(path, {
      method: payload ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store',
      headers: payload ? { 'Content-Type': 'application/json' } : undefined,
      body: payload ? JSON.stringify(payload) : undefined
    });
    let data = {};
    try { data = await response.json(); } catch {}
    if (!response.ok) {
      const error = new Error(data.message || data.error || `Brain API HTTP ${response.status}`);
      error.status = response.status; error.code = data.error || 'brain_api_error'; throw error;
    }
    return data;
  }
  async function status() {
    try { return await request('/api/v1/ai/status'); }
    catch (error) { return { mode: 'local-fallback', configured: false, authenticated: error.status !== 401, error: error.code || 'unavailable' }; }
  }
  async function think(agent, context = {}) {
    if (!agent?.id) throw new Error('Missing Stickman identity');
    const profile = agent.profile || {};
    const payload = {
      character: {
        id: bounded(agent.id, 100), name: bounded(agent.name, 32), color: /^#[0-9a-f]{6}$/i.test(agent.color || '') ? agent.color : '#202020',
        personality: bounded(agent.personality || profile.personality || 'Curious', 40), profile: {
          traits: profile.traits || {}, appearance: profile.appearance || null, mind: profile.mind || {}
        }, needs: agent.needs || {}, action: bounded(agent.action, 40), goal: bounded(agent.goal, 140), emotion: bounded(agent.emotion, 40),
        energy: Math.max(0, Math.min(1, Number(agent.energy) || 0))
      },
      context: {
        event: bounded(context.event || '', 160), nearbyObject: bounded(context.nearbyObject || '', 80),
        pointerNear: !!context.pointerNear, nearCharacter: !!context.nearCharacter, paintOpen: !!context.paintOpen,
        userMessage: bounded(context.userMessage || '', 1200)
      },
      mind: profile.mind || {},
      memories: (Array.isArray(agent.memorySnapshot) ? agent.memorySnapshot : []).slice(-8).map(item => ({
        id: bounded(item.id, 100), kind: bounded(item.kind || item.memoryType, 40), text: bounded(item.text || item.content, 180),
        importance: Math.max(0, Math.min(1, Number(item.importance) || 0)), at: Number(item.at || item.createdAt) || 0
      }))
    };
    return request('/api/v1/ai/think', payload);
  }
  window.XPBrain = Object.freeze({ status, think, request });
})();
