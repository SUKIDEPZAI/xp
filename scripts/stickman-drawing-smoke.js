'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
let validated = null;
const window = { XPDrawing: { validateDocument(value) { validated = value; return { ...value, version: 1 }; } } };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../ui/modules/stickman-drawing.js'), 'utf8'), { window, Math, String, Number, Array, Object, Error });
const tool = window.XPStickmanDrawing;
const line = (a, b, count = 8) => Array.from({length: count}, (_, i) => ({x:a.x+(b.x-a.x)*i/(count-1),y:a.y+(b.y-a.y)*i/(count-1)}));
const strokes = [
  {id:'head', color:'#202020', width:2, points:Array.from({length:18},(_,i)=>({x:100+14*Math.cos(i*Math.PI*2/18),y:60+14*Math.sin(i*Math.PI*2/18)}))},
  {id:'body', color:'#202020', width:2, points:line({x:100,y:75},{x:100,y:135},12)},
  {id:'arms', color:'#202020', width:2, points:line({x:100,y:90},{x:55,y:115},10)},
  {id:'arm-right', color:'#202020', width:2, points:line({x:100,y:90},{x:145,y:115},10)},
  {id:'leg-left', color:'#202020', width:2, points:line({x:100,y:135},{x:68,y:188},10)},
  {id:'leg-right', color:'#202020', width:2, points:line({x:100,y:135},{x:132,y:188},10)}
];
const model = tool.beautify(strokes, 700, 460);
assert.equal(model.strokes.length, 6);
assert.ok(model.pathLength > 200);
assert.ok(model.strokes.every(stroke => stroke.points.length >= 2 && stroke.width >= 2));
const doc = tool.toDocument(model, {id:'drawing-test',name:'Sketch',characterId:'stickman-test',width:700,height:460});
assert.equal(validated.characterId, 'stickman-test');
assert.equal(doc.commands.length, 6);
assert.ok(doc.commands.every(command => command.op === 'path' && command.fill === 'none'));
assert.throws(() => tool.beautify([{points:[{x:1,y:1}]}],700,460));
console.log('PASS: Stickman-only stroke smoothing, shape bounds and safe vector document generation');
