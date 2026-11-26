(() => {
  'use strict';
  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number.isFinite(Number(value)) ? Number(value) : min));
  const distance = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
  function cleanStrokes(strokes, width, height) {
    if (!Array.isArray(strokes)) throw new Error('Không tìm thấy nét vẽ Stickman trong chế độ vẽ.');
    const normalized = strokes.slice(0, 80).map((stroke, index) => {
      const points = (Array.isArray(stroke.points) ? stroke.points : []).slice(0, 600)
        .map(point => ({ x: clamp(point.x, 0, width), y: clamp(point.y, 0, height) }))
        .filter((point, i, list) => i === 0 || distance(point, list[i - 1]) >= 1.2);
      return { id: String(stroke.id || `stroke-${index}`).slice(0, 40), points,
        color: /^#[0-9a-f]{6}$/i.test(stroke.color || '') ? stroke.color : '#202020',
        width: clamp(stroke.width, 1, 16) };
    }).filter(stroke => stroke.points.length >= 2 && stroke.points.some((p, i) => i > 0 && distance(p, stroke.points[i - 1]) > 2));
    const all = normalized.flatMap(item => item.points);
    if (normalized.length < 3 || all.length < 16) throw new Error('Hãy vẽ Stickman bằng ít nhất 3 nét rõ ràng rồi chọn Hoàn tất.');
    const xs = all.map(p => p.x), ys = all.map(p => p.y);
    const bounds = { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
    const pathLength = normalized.reduce((sum, stroke) => sum + stroke.points.reduce((n, point, i) => n + (i ? distance(point, stroke.points[i - 1]) : 0), 0), 0);
    if (bounds.width < 18 || bounds.height < 36 || pathLength < 100) throw new Error('Bản vẽ còn quá nhỏ hoặc chưa đủ nét để nhận dạng là Stickman.');
    return { strokes: normalized, bounds, pathLength };
  }
  function chaikin(points, iterations = 1) {
    let current = points.map(point => ({ ...point }));
    for (let round = 0; round < iterations; round++) {
      if (current.length < 3) break;
      const next = [current[0]];
      for (let i = 0; i < current.length - 1; i++) {
        const a = current[i], b = current[i + 1];
        next.push({ x: a.x * .75 + b.x * .25, y: a.y * .75 + b.y * .25 });
        next.push({ x: a.x * .25 + b.x * .75, y: a.y * .25 + b.y * .75 });
      }
      next.push(current.at(-1)); current = next;
    }
    return current;
  }
  function beautify(strokes, width, height) {
    const cleaned = cleanStrokes(strokes, width, height);
    return { ...cleaned, strokes: cleaned.strokes.map(stroke => ({ ...stroke, points: chaikin(stroke.points, stroke.points.length > 12 ? 2 : 1), width: clamp(stroke.width * 1.08, 2, 7) })) };
  }
  function draw(ctx, model, { clear = false, offsetX = 0, offsetY = 0 } = {}) {
    if (!ctx || !model?.strokes) return;
    if (clear) ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    for (const stroke of model.strokes) {
      if (stroke.points.length < 2) continue;
      ctx.save(); ctx.strokeStyle = stroke.color; ctx.lineWidth = stroke.width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(offsetX + stroke.points[0].x, offsetY + stroke.points[0].y);
      for (const point of stroke.points.slice(1)) ctx.lineTo(offsetX + point.x, offsetY + point.y);
      ctx.stroke(); ctx.restore();
    }
  }
  function toDocument(model, { id, name, characterId, width, height } = {}) {
    const commands = [];
    for (const stroke of model.strokes) {
      if (stroke.points.length < 2) continue;
      commands.push({ op: 'path', points: stroke.points.slice(0, 300), stroke: stroke.color, fill: 'none', width: stroke.width });
    }
    return window.XPDrawing.validateDocument({ id, name: name || 'Stickman Sketch', characterId, width, height, commands,
      metadata: { type: 'stickman-sketch', beautifier: 'stroke-smoothing-v1', bounds: model.bounds, pathLength: model.pathLength } });
  }
  window.XPStickmanDrawing = Object.freeze({ cleanStrokes, chaikin, beautify, draw, toDocument });
})();
