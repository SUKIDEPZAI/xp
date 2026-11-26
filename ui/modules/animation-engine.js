(() => {
  'use strict';
  const VERSION = 2;
  const uid = () => globalThis.crypto?.randomUUID?.() || `anim-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const clamp = (value, min, max, fallback = min) => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
  };
  const ACTION = value => window.XPActions?.normalize(value) || String(value || 'idle');
  const copyPose = pose => ({
    armL: [...pose.armL], armR: [...pose.armR], legL: [...pose.legL], legR: [...pose.legR],
    body: pose.body || 0, bob: pose.bob || 0
  });

  // Angles are measured from the downward vertical. The second number is the elbow/knee bend.
  // This gives the renderer a consistent coordinate system for both arms and legs.
  const POSES = Object.freeze({
    idle:       { armL: [-12, 12], armR: [12, -12], legL: [-8, -5], legR: [8, 5], body: 0, bob: 0 },
    observe:    { armL: [-17, 12], armR: [20, -24], legL: [-9, -4], legR: [9, 4], body: -2, bob: 0 },
    walk:       { armL: [-34, 40], armR: [34, -40], legL: [-28, 54], legR: [28, -54], body: 2, bob: 1 },
    run:        { armL: [-54, 64], armR: [54, -64], legL: [-48, 92], legR: [48, -92], body: 8, bob: 2 },
    jump:       { armL: [-128, 18], armR: [128, -18], legL: [-38, 28], legR: [38, -28], body: -6, bob: -8 },
    wave:       { armL: [-12, 8], armR: [132, -92], legL: [-8, -5], legR: [8, 5], body: -2, bob: 1 },
    climb:      { armL: [-132, 42], armR: [122, -38], legL: [-48, 42], legR: [42, -36], body: 7, bob: 0 },
    fall:       { armL: [-118, 42], armR: [118, -42], legL: [-72, 55], legR: [72, -55], body: 18, bob: 2 },
    landing:    { armL: [-78, 48], armR: [78, -48], legL: [-42, 55], legR: [42, -55], body: -5, bob: 1 },
    draw:       { armL: [-16, 12], armR: [52, -24], legL: [-8, -5], legR: [8, 5], body: 1, bob: 0 },
    push:       { armL: [-72, 34], armR: [72, -34], legL: [-42, 28], legR: [42, -28], body: 12, bob: 0 },
    pull:       { armL: [-118, 58], armR: [118, -58], legL: [-45, 32], legR: [45, -32], body: -8, bob: 0 },
    celebrate:  { armL: [-145, 12], armR: [145, -12], legL: [-32, 58], legR: [32, -58], body: -7, bob: 3 },
    'tab-prank':{ armL: [-58, 34], armR: [62, -38], legL: [-8, 12], legR: [8, -12], body: -4, bob: 1 },
    startled:   { armL: [-142, 22], armR: [142, -22], legL: [-42, 45], legR: [42, -45], body: -9, bob: 2 },
    sneak:      { armL: [-26, 30], armR: [22, -24], legL: [-24, 38], legR: [24, -38], body: 12, bob: 0 },
    think:      { armL: [-10, 12], armR: [128, -100], legL: [-8, -5], legR: [8, 5], body: 3, bob: 0 },
    rest:       { armL: [-24, 18], armR: [24, -18], legL: [-12, -4], legR: [12, 4], body: 7, bob: 0 },
    talk:       { armL: [-28, 22], armR: [42, -28], legL: [-8, -5], legR: [8, 5], body: 0, bob: 1 },
    drag:       { armL: [-102, 35], armR: [102, -35], legL: [-35, 30], legR: [35, -30], body: 10, bob: 0 },
    avoid:      { armL: [-104, 36], armR: [104, -36], legL: [-48, 64], legR: [48, -64], body: -8, bob: 1 },
    sleep:      { armL: [-32, 22], armR: [32, -22], legL: [-12, -4], legR: [12, 4], body: 9, bob: 0 },
    socialize:  { armL: [-24, 18], armR: [38, -22], legL: [-8, 12], legR: [8, -12], body: -1, bob: 1 },
    create:     { armL: [-24, 15], armR: [68, -42], legL: [-8, 12], legR: [8, -12], body: 0, bob: 0 },
    play:       { armL: [-95, 38], armR: [95, -38], legL: [-46, 70], legR: [46, -70], body: -5, bob: 3 },
    idle:       { armL: [-12, 12], armR: [12, -12], legL: [-8, -5], legR: [8, 5], body: 0, bob: 0 }
  });
  const POSE_NAMES = new Set(Object.keys(POSES));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t * t * (3 - 2 * t);

  function poseFor(actionName, time = 0) {
    const name = ACTION(actionName);
    const base = copyPose(POSES[name] || POSES.idle);
    const phase = Number(time || 0) / (name === 'run' ? 74 : 118);
    const swing = Math.sin(phase);
    if (name === 'walk' || name === 'explore' || name === 'follow' || name === 'escape') {
      base.armL[0] += swing * 18; base.armR[0] -= swing * 18;
      base.legL[0] += swing * 20; base.legR[0] -= swing * 20;
      base.bob += Math.abs(Math.cos(phase * 2)) * .8;
    } else if (name === 'run') {
      base.armL[0] += swing * 28; base.armR[0] -= swing * 28;
      base.legL[0] += swing * 34; base.legR[0] -= swing * 34;
      base.bob += Math.abs(Math.cos(phase * 2)) * 1.8;
    } else if (name === 'wave') {
      base.armR[1] += Math.sin(phase * 2) * 24;
      base.armR[0] += Math.sin(phase) * 8;
    } else if (name === 'idle' || name === 'observe' || name === 'think') {
      base.bob += Math.sin(phase * .65) * .65;
      base.body += Math.sin(phase * .35) * .6;
      if (name === 'think') base.armR[1] += Math.sin(phase * .7) * 5;
    } else if (name === 'talk' || name === 'socialize') {
      base.armR[0] += Math.sin(phase * 1.6) * 12;
      base.armR[1] += Math.cos(phase * 1.6) * 9;
      base.bob += Math.sin(phase * 2) * .8;
    }
    return base;
  }

  function draw(ctx, x, y, pose, color = '#202020', scale = 1, layers = {}, appearance = null) {
    if (!ctx) return;
    const normalizedPose = typeof pose === 'string' ? poseFor(pose, 0) : { ...POSES.idle, ...(pose || {}) };
    const look = window.XPStickmanAppearance?.normalize(appearance, color) || null;
    const ink = look?.outlineColor || color;
    const bodyLean = clamp(normalizedPose.body || 0, -35, 35);
    const bodyX = Math.sin(bodyLean * Math.PI / 180) * 2.3;
    const bodyY = -Math.cos(bodyLean * Math.PI / 180) * 1.2;
    const vector = (angle, length) => {
      const radians = clamp(angle, -180, 180) * Math.PI / 180;
      return { x: Math.sin(radians) * length, y: Math.cos(radians) * length };
    };
    const line = (x1, y1, x2, y2) => {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    };
    const drawLimb = (rootX, rootY, values, upperLength, lowerLength, limbColor, width, isArm = false) => {
      const first = vector(values?.[0] || 0, upperLength);
      const elbow = { x: rootX + first.x, y: rootY + first.y };
      const second = vector((values?.[0] || 0) + (values?.[1] || 0), lowerLength);
      const end = { x: elbow.x + second.x, y: elbow.y + second.y };
      ctx.strokeStyle = limbColor; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      line(rootX, rootY, elbow.x, elbow.y);
      line(elbow.x, elbow.y, end.x, end.y);
      ctx.fillStyle = look?.skinTone || ink;
      ctx.beginPath(); ctx.arc(end.x, end.y, isArm ? 2.2 : 0, 0, Math.PI * 2); if (isArm) ctx.fill();
      if (!isArm) {
        ctx.strokeStyle = ink; ctx.lineWidth = 2.2;
        const toe = rootX < 0 ? -1 : 1;
        line(end.x - toe * 1.2, end.y + 1, end.x + toe * 4.2, end.y + 1.8);
      }
    };

    ctx.save();
    ctx.translate(x, y + (normalizedPose.bob || 0));
    ctx.scale(clamp(scale, .2, 5), clamp(scale, .2, 5));

    // Legs are drawn first so the torso naturally overlaps the hip joints.
    if (layers.legs !== false) {
      drawLimb(-3.6 + bodyX * .25, -17 + bodyY, normalizedPose.legL, 8.5, 8.5, ink, 3.35);
      drawLimb(3.6 + bodyX * .25, -17 + bodyY, normalizedPose.legR, 8.5, 8.5, ink, 3.35);
    }

    // Arms sit behind the body, with visible elbows and hand endpoints.
    if (layers.arms !== false) {
      const sleeve = look?.outfitColor || ink;
      drawLimb(-6 + bodyX, -26 + bodyY, normalizedPose.armL, 11.5, 10.5, sleeve, look ? 4.6 : 3.2, true);
      drawLimb(6 + bodyX, -26 + bodyY, normalizedPose.armR, 11.5, 10.5, sleeve, look ? 4.6 : 3.2, true);
    }

    // Neck and a proportionate torso: broad shoulders, gently tapered waist.
    ctx.strokeStyle = ink; ctx.lineWidth = 2.1;
    line(bodyX * .65, -33 + bodyY, bodyX, -28 + bodyY);
    ctx.fillStyle = look?.outfitColor || ink;
    ctx.beginPath();
    ctx.moveTo(-6.8 + bodyX, -28 + bodyY);
    ctx.quadraticCurveTo(bodyX, -31 + bodyY, 6.8 + bodyX, -28 + bodyY);
    ctx.lineTo(6.2 + bodyX, -10 + bodyY);
    ctx.quadraticCurveTo(bodyX, -7 + bodyY, -6.2 + bodyX, -10 + bodyY);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    if (look) {
      ctx.save(); ctx.strokeStyle = look.accentColor; ctx.lineWidth = 1.35;
      if (look.outfitStyle === 'hoodie') {
        ctx.beginPath(); ctx.arc(bodyX, -28 + bodyY, 4.7, Math.PI, Math.PI * 2); ctx.stroke();
        line(bodyX, -22 + bodyY, bodyX, -12 + bodyY);
      } else if (look.outfitStyle === 'jacket') {
        line(bodyX, -27 + bodyY, bodyX, -10 + bodyY);
        line(bodyX - 3.2, -19 + bodyY, bodyX + 3.2, -19 + bodyY);
      } else if (look.outfitStyle === 'sweater') {
        for (let yy = -23; yy < -11; yy += 4) line(bodyX - 4, yy + bodyY, bodyX + 4, yy + bodyY);
      }
      if (look.accessory === 'badge') {
        ctx.fillStyle = look.accentColor; ctx.beginPath(); ctx.arc(bodyX + 3.2, -19 + bodyY, 1.7, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    // Head: face, hairstyle and accessories are profile data only (never inferred from Paint images).
    if (layers.head !== false) {
      const radius = look?.headShape === 'square' ? 8.3 : look?.headShape === 'soft' ? 8.9 : 8.6;
      const headY = -42.2 + bodyY * .7;
      ctx.beginPath();
      if (look?.headShape === 'square') ctx.roundRect(-radius, headY - radius, radius * 2, radius * 2, 3.2);
      else ctx.arc(bodyX * .55, headY, radius, 0, Math.PI * 2);
      ctx.fillStyle = look?.skinTone || '#f1c7a5'; ctx.strokeStyle = ink; ctx.lineWidth = 1.8; ctx.fill(); ctx.stroke();
      if (look) {
        ctx.fillStyle = look.hairColor; ctx.strokeStyle = look.hairColor; ctx.lineWidth = 2.7;
        if (look.hairStyle === 'spiky') {
          ctx.beginPath(); ctx.moveTo(-7.5, headY - 3); ctx.lineTo(-8, headY - 10); ctx.lineTo(-3.5, headY - 5); ctx.lineTo(0, headY - 12); ctx.lineTo(3.5, headY - 5); ctx.lineTo(8, headY - 9); ctx.lineTo(7.5, headY - 2); ctx.closePath(); ctx.fill();
        } else if (look.hairStyle === 'fringe') {
          ctx.beginPath(); ctx.moveTo(-8, headY - 2); ctx.quadraticCurveTo(-4, headY - 12, 7, headY - 5); ctx.lineTo(2, headY + 1); ctx.lineTo(-2, headY - 3); ctx.lineTo(-6, headY + 1); ctx.closePath(); ctx.fill();
        } else if (look.hairStyle === 'long') {
          ctx.beginPath(); ctx.arc(0, headY - 1, 9.3, Math.PI, Math.PI * 2); ctx.stroke();
          line(-8.8, headY - 1, -8.8, headY + 9); line(8.8, headY - 1, 8.8, headY + 9);
        } else if (look.hairStyle === 'cap') {
          ctx.beginPath(); ctx.arc(0, headY - 1, 8.4, Math.PI, Math.PI * 2); ctx.lineTo(10, headY - 3); ctx.lineTo(-8, headY - 3); ctx.fill();
          ctx.strokeStyle = look.accentColor; line(-5, headY - 3, 6, headY - 3);
        } else {
          ctx.beginPath(); ctx.arc(0, headY - 1, 8.4, Math.PI * 1.08, Math.PI * 1.95); ctx.stroke();
        }
        ctx.fillStyle = '#20242b';
        if (look.expression === 'focused') {
          ctx.fillRect(-4.3, headY + .2, 2, 2); ctx.fillRect(2.3, headY + .2, 2, 2);
          ctx.strokeStyle = ink; ctx.lineWidth = 1.05; line(-5.5, headY - 2.7, -2.3, headY - 3.5); line(2.3, headY - 3.5, 5.5, headY - 2.7);
        } else {
          ctx.beginPath(); ctx.arc(-3, headY + .2, 1.05, 0, Math.PI * 2); ctx.arc(3, headY + .2, 1.05, 0, Math.PI * 2); ctx.fill();
        }
        ctx.strokeStyle = '#7b453b'; ctx.lineWidth = 1.15; ctx.beginPath();
        if (look.expression === 'smile') ctx.arc(0, headY + 4, 2.8, .15, Math.PI - .15);
        else line(-2.1, headY + 4, 2.1, headY + 4);
        ctx.stroke();
        if (look.accessory === 'glasses') {
          ctx.strokeStyle = look.accentColor; ctx.lineWidth = 1.25; ctx.beginPath();
          ctx.arc(-3, headY + .3, 3, 0, Math.PI * 2); ctx.arc(3, headY + .3, 3, 0, Math.PI * 2); ctx.moveTo(0, headY + .3); ctx.lineTo(0, headY + .3); ctx.stroke();
        } else if (look.accessory === 'headphones') {
          ctx.strokeStyle = look.accentColor; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(0, headY - 1, 10.1, Math.PI, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = look.accentColor; ctx.fillRect(-10.2, headY - 1, 3, 7); ctx.fillRect(7.2, headY - 1, 3, 7);
        }
        if (look.accessory === 'scarf') {
          ctx.strokeStyle = look.accentColor; ctx.lineWidth = 3; line(bodyX - 5, -28 + bodyY, bodyX + 5, -28 + bodyY); line(bodyX + 4, -26 + bodyY, bodyX + 7, -17 + bodyY);
        }
      }
    }
    ctx.restore();
  }

  function cleanJointPose(value = {}) {
    const base = copyPose(POSES.idle);
    const result = { ...base };
    for (const key of ['armL', 'armR', 'legL', 'legR']) {
      const pair = Array.isArray(value[key]) ? value[key] : base[key];
      result[key] = [clamp(pair[0], -175, 175, base[key][0]), clamp(pair[1], -175, 175, base[key][1])];
    }
    result.body = clamp(value.body, -35, 35, 0); result.bob = clamp(value.bob, -18, 18, 0);
    return result;
  }
  function normalizeFrame(frame, index) {
    const value = frame && typeof frame === 'object' ? frame : {};
    const poseName = POSE_NAMES.has(String(value.pose || 'idle')) ? String(value.pose || 'idle') : 'idle';
    return {
      id: String(value.id || `frame-${index}`).slice(0, 80),
      at: clamp(value.at ?? index * 4, 0, 10000),
      x: clamp(value.x ?? 0, -10000, 10000), y: clamp(value.y ?? 0, -10000, 10000),
      pose: poseName, jointPose: value.jointPose ? cleanJointPose(value.jointPose) : null,
      scale: clamp(value.scale ?? 1, .45, 2),
      color: /^#[0-9a-f]{6}$/i.test(value.color || '') ? value.color : '#202020'
    };
  }
  function validateProject(value) {
    if (!value || typeof value !== 'object') throw new Error('Animation project không hợp lệ');
    const frames = Array.isArray(value.frames) ? value.frames : [];
    if (!frames.length || frames.length > 500) throw new Error('Animation cần từ 1 đến 500 frames');
    const normalized = frames.map(normalizeFrame).sort((a, b) => a.at - b.at);
    const duration = clamp(value.duration ?? Math.max(24, normalized.at(-1).at + 1), 1, 10000);
    return {
      version: VERSION, id: String(value.id || uid()).slice(0, 80),
      name: String(value.name || 'Untitled Animation').slice(0, 120),
      fps: clamp(value.fps ?? 24, 1, 60), loop: !!value.loop, duration,
      frames: normalized, characterId: value.characterId ? String(value.characterId).slice(0, 100) : null,
      createdAt: Number(value.createdAt) || Date.now(), updatedAt: Date.now(),
      metadata: value.metadata && typeof value.metadata === 'object' ? value.metadata : {}
    };
  }
  function create(name = 'New Animation', characterId = null) {
    return validateProject({ name, characterId, fps: 24, loop: true, duration: 48,
      frames: [{ at: 0, pose: 'idle', x: 0, y: 0 }, { at: 12, pose: 'walk', x: 24, y: 0 }, { at: 24, pose: 'walk', x: 48, y: 0 }, { at: 36, pose: 'idle', x: 48, y: 0 }] });
  }
  function framePose(frame) { return frame.jointPose || poseFor(frame.pose, frame.at * 1000 / 24); }
  function interpolate(project, frameNumber) {
    const p = validateProject(project);
    const time = p.loop ? ((frameNumber % p.duration) + p.duration) % p.duration : clamp(frameNumber, 0, p.duration);
    if (p.frames.length === 1) {
      const only = p.frames[0];
      return { x: only.x, y: only.y, pose: only.pose, poseData: framePose(only), scale: only.scale, color: only.color, time };
    }
    let a, b, atA, atB, tTime = time;
    if (time < p.frames[0].at) {
      a = p.frames.at(-1); b = p.frames[0]; atA = a.at - p.duration; atB = b.at;
    } else if (time > p.frames.at(-1).at) {
      a = p.frames.at(-1); b = p.frames[0]; atA = a.at; atB = b.at + p.duration;
    } else {
      let index = p.frames.length - 2;
      for (let i = 0; i < p.frames.length - 1; i++) {
        if (time >= p.frames[i].at && time <= p.frames[i + 1].at) { index = i; break; }
      }
      a = p.frames[index]; b = p.frames[index + 1]; atA = a.at; atB = b.at;
    }
    if (tTime < atA) tTime += p.duration;
    const span = Math.max(.0001, atB - atA), raw = clamp((tTime - atA) / span, 0, 1), t = ease(raw);
    const pa = framePose(a), pb = framePose(b), poseData = {};
    for (const key of ['armL', 'armR', 'legL', 'legR']) poseData[key] = [lerp(pa[key][0], pb[key][0], t), lerp(pa[key][1], pb[key][1], t)];
    poseData.body = lerp(pa.body || 0, pb.body || 0, t); poseData.bob = lerp(pa.bob || 0, pb.bob || 0, t);
    return {
      x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t),
      pose: raw < .5 ? a.pose : b.pose, poseData,
      scale: lerp(a.scale, b.scale, t), color: raw < .5 ? a.color : b.color, time
    };
  }
  async function save(project) {
    const normalized = validateProject(project);
    await window.XPStorage.saveAnimation(normalized);
    window.XPBus?.emit('animation:saved', { id: normalized.id, name: normalized.name, characterId: normalized.characterId });
    return normalized;
  }
  function sampleProjects() {
    return ['idle', 'walk', 'run', 'jump', 'wave', 'climb', 'fall', 'landing', 'draw', 'push', 'pull', 'celebrate', 'startled', 'sneak', 'tab-prank']
      .map((pose, i) => {
        const p = create(pose[0].toUpperCase() + pose.slice(1), null);
        p.frames = [
          { id: `${pose}-0`, at: 0, pose: 'idle', x: 0, y: 0 },
          { id: `${pose}-1`, at: 10, pose, x: ['walk', 'run', 'sneak'].includes(pose) ? 20 : 0, y: pose === 'jump' ? -18 : 0 },
          { id: `${pose}-2`, at: 22, pose: pose === 'jump' ? 'landing' : pose, x: ['walk', 'run', 'sneak'].includes(pose) ? 40 : 0, y: 0 },
          { id: `${pose}-3`, at: 34, pose: 'idle', x: ['walk', 'run', 'sneak'].includes(pose) ? 40 : 0, y: 0 }
        ];
        p.duration = 40; p.fps = i === 2 ? 30 : 24; p.loop = !['jump', 'fall', 'landing', 'celebrate', 'startled'].includes(pose);
        return validateProject(p);
      });
  }
  function generateForCharacter(character, { name = null, seed = null } = {}) {
    if (!character?.id) throw new Error('Cần một Stickman hợp lệ để tạo animation');
    const personality = String(character.personality || character.profile?.personality || 'Curious');
    const traits = character.profile?.traits || {};
    const sequences = {
      Curious: ['idle', 'think', 'observe', 'walk', 'observe', 'wave', 'idle'],
      Playful: ['idle', 'observe', 'jump', 'landing', 'run', 'celebrate', 'idle'],
      Shy: ['idle', 'observe', 'think', 'wave', 'rest', 'idle'],
      Energetic: ['idle', 'run', 'jump', 'landing', 'run', 'celebrate', 'idle'],
      Calm: ['idle', 'observe', 'think', 'rest', 'observe', 'idle'],
      Competitive: ['idle', 'observe', 'run', 'push', 'celebrate', 'idle'],
      Creative: ['idle', 'think', 'draw', 'observe', 'celebrate', 'idle'],
      Friendly: ['idle', 'wave', 'talk', 'walk', 'wave', 'idle'],
      Mischievous: ['idle', 'sneak', 'observe', 'tab-prank', 'run', 'wave', 'idle']
    };
    const sequence = [...(sequences[personality] || sequences.Curious)];
    const baseSeed = Number(seed) || Number(character.profile?.seed) || (window.XPAI?.hash?.(character.id) || 1);
    let state = baseSeed >>> 0;
    const random = () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4294967296; };
    if ((traits.playfulness || 0) > .78 && !sequence.includes('jump')) sequence.splice(2, 0, 'jump', 'landing');
    if ((traits.creativity || 0) > .78 && !sequence.includes('draw')) sequence.splice(2, 0, 'think', 'draw');
    const colorValue = /^#[0-9a-f]{6}$/i.test(character.color || '') ? character.color : '#202020';
    const frames = []; let at = 0, x = 0;
    sequence.forEach((pose, index) => {
      const moving = ['walk', 'run', 'sneak'].includes(pose), stride = moving ? (pose === 'run' ? 14 : pose === 'sneak' ? 3 : 8) : 0;
      if (moving) x += stride;
      const jitter = (random() - .5) * .8;
      frames.push({ id: `auto-${index}-in`, at, pose: index ? sequence[index - 1] : pose, x: x - stride * .35, y: 0, color: colorValue, scale: 1, jointPose: { ...poseFor(index ? sequence[index - 1] : pose, at * 1000 / 24), bob: jitter } });
      at += 5 + Math.floor(random() * 3);
      frames.push({ id: `auto-${index}-hold`, at, pose, x, y: pose === 'jump' ? -12 : 0, color: colorValue, scale: 1 });
      at += 5 + Math.floor(random() * 3);
    });
    frames.push({ id: 'auto-settle', at: at + 4, pose: 'idle', x, y: 0, color: colorValue, scale: 1 });
    const duration = at + 16;
    return validateProject({
      name: name || `${character.name || 'Stickman'} — ${personality} Motion`, characterId: character.id,
      fps: 24, loop: true, duration, frames,
      metadata: { generated: true, generator: 'articulated-motion-v2', personality,
        appearance: window.XPStickmanAppearance?.normalize(character.profile?.appearance, colorValue) || null,
        traits: { playfulness: clamp(traits.playfulness, 0, 1), creativity: clamp(traits.creativity, 0, 1), energy: clamp(traits.energy, 0, 1) },
        seed: baseSeed, createdBy: 'stickman-brain' }
    });
  }
  function fromMotionPlan(character, plan = {}) {
    if (!character?.id) throw new Error('Cần nhân vật hợp lệ');
    const fps = 24, durationMs = clamp(plan.durationMs, 700, 10000, 2200), duration = Math.max(18, Math.round(durationMs * fps / 1000));
    let sourceFrames = Array.isArray(plan.frames) ? plan.frames.slice(0, 32) : [];
    const poseAliases = { explore: 'walk', follow: 'walk', escape: 'run', curious: 'observe', interact: 'observe', socialize: 'talk', create: 'draw', draw: 'draw', hang: 'climb', grab: 'pull' };
    const actionName = String(plan.action || 'observe');
    const actionPose = POSE_NAMES.has(actionName) ? actionName : (poseAliases[actionName] || 'observe');
    if (sourceFrames.length < 2) {
      const end = Math.max(1, Math.min(duration - 1, Math.round(duration * .86)));
      sourceFrames = [
        { at: 0, pose: 'idle', x: 0, y: 0, joints: { body: 0, bob: 0 } },
        { at: Math.round(duration * .16 * 1000 / fps), pose: 'think', x: 0, y: -1.2, joints: { body: -3, bob: 0 } },
        { at: Math.round(duration * .38 * 1000 / fps), pose: actionPose, x: 0, y: actionPose === 'jump' ? -8 : 0 },
        { at: Math.round(duration * .68 * 1000 / fps), pose: actionPose, x: 2.5, y: actionPose === 'jump' ? -4 : 0 },
        { at: Math.round(end * 1000 / fps), pose: 'idle', x: 0, y: 0 }
      ];
    }
    const frames = sourceFrames.map((frame, index) => ({
      id: `brain-${index}`, at: clamp(Number(frame.at) * fps / 1000, 0, duration - 1),
      pose: POSE_NAMES.has(String(frame.pose)) ? String(frame.pose) : 'idle',
      x: clamp(frame.x, -150, 150, 0), y: clamp(frame.y, -90, 90, 0),
      scale: clamp(frame.scale, .8, 1.2, 1), color: character.color || '#202020',
      jointPose: frame.joints ? cleanJointPose(frame.joints) : null
    }));
    if (!frames.length) frames.push({ id: 'brain-0', at: 0, pose: actionPose, x: 0, y: 0 });
    frames.sort((a, b) => a.at - b.at);
    if (frames[0].at > 0) frames.unshift({ ...frames[0], id: 'brain-start', at: 0, pose: 'idle', x: 0, y: 0 });
    if (frames.at(-1).at < duration) frames.push({ ...frames.at(-1), id: 'brain-end', at: duration - 1 });
    return validateProject({ name: `${character.name || 'Stickman'} — ${String(plan.clip || plan.action || 'Motion').slice(0, 40)}`,
      characterId: character.id, fps, loop: false, duration, frames,
      metadata: { generated: true, generator: 'stickman-ai-motion-v1', source: 'agent-decision', planVersion: 1 } });
  }
  async function generateAndSave(character, options = {}) { return save(generateForCharacter(character, options)); }

  window.XPAnimation = Object.freeze({ VERSION, POSES, poseFor, draw, validateProject, create, interpolate, save, sampleProjects, generateForCharacter, generateAndSave, fromMotionPlan });
})();
