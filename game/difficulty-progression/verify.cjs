const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const R = require('./core.js');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(__dirname + '/levels.js', 'utf8'), context);
const levels = JSON.parse(JSON.stringify(context.window.LAB_LEVELS));
let neutralChecks = 0, wallChecks = 0, wrongRouteChecks = 0;
for (const l of levels) {
  assert.equal(l.cells.length, l.size ** 2);
  assert.equal(new Set(l.solution).size, l.cells.length);
  assert.equal(l.solution.length, l.cells.length);
  if (l.size === 5) assert.equal(l.walls.length, 0);
  for (const [a, b] of l.walls) {
    assert(R.neighbors(l, a).includes(b));
    assert.equal(R.reason(l, [a], b), 'wall');
    assert.equal(R.reason(l, [b], a), 'wall');
    wallChecks++;
  }
  const p = [];
  for (const i of l.solution) {
    const before = R.current(l, p);
    assert(R.legal(l, p, i), `${l.id}: invalid cell ${i}`);
    p.push(i);
    if (l.cells[i] === null) { assert.equal(R.current(l, p), before); neutralChecks++; }
  }
  // Exercise search from a prefix without using the authored route shortcut.
  const offset = Math.floor(l.solution.length * .4);
  const result = R.solve(l, l.solution.slice(0, offset), { shortcut: false, maxNodes: 100000 });
  assert(result.solution, `${l.id}: search failed`);
  const replay = [];
  for (const i of result.solution) { assert(R.legal(l, replay, i)); replay.push(i); }
  // At least one legal-looking choice must actually affect completion.
  let found = false;
  for (let k = 1; k < l.solution.length && !found; k++) {
    const prefix = l.solution.slice(0, k);
    for (const next of R.neighbors(l, prefix.at(-1))) {
      if (next === l.solution[k] || !R.legal(l, prefix, next)) continue;
      const result = R.solve(l, [...prefix, next], { shortcut: false, maxNodes: 10000 });
      if (!result.solution && !result.exhausted) { found = true; wrongRouteChecks++; break; }
    }
  }
  assert(found, `${l.id}: no verified consequential choice`);
}
// A neutral cell must not let the player abandon an unfinished category.
const tiny = { size: 3, cells: [0, null, 1, 0, null, 1, 2, 2, 2], start: 0, walls: [] };
assert(R.legal(tiny, [0], 1));
assert.equal(R.reason(tiny, [0, 1], 2), 'category');
assert(R.legal(tiny, [0, 3, 4, 1], 2));
assert.equal(R.current(tiny, [0, 3, 4, 1]), 0);
assert.equal(R.current(tiny, [0, 3, 4, 1, 2]), 1);
assert.equal(R.reason(tiny, [0, 1], 0), 'visited');
// Last symbols may be completed before the final neutral cell.
const tail = { size: 2, cells: [0, 1, null, 1], start: 0, walls: [] };
const tailResult = R.solve(tail, [], { shortcut: false });
assert.deepEqual(tailResult.solution, [0, 1, 3, 2]);
console.log(JSON.stringify({ boards: levels.length, neutralChecks, wallChecks, wrongRouteChecks, result: 'passed' }));

assert.equal(levels.length,24);
const reports=JSON.parse(fs.readFileSync(__dirname+'/analysis.json','utf8'));
for(const [i,l] of levels.entries()){
 assert.equal(l.chapter,Math.floor(i/6)+1);assert.equal(l.stage,i%6+1);assert.equal(l.size,[5,6,6,7][l.chapter-1]);assert(!l.freeStart);
 assert.equal(l.label,`${l.chapter}-${l.stage}`);
 const dots=l.cells.filter(c=>c===null).length;
 if(i<4)assert.equal(dots,0);if(i>=4)assert(dots>0);if(i<8)assert.equal(l.walls.length,0);
 if(i===8)assert.equal(l.walls.length,1);if(i===9)assert.equal(l.walls.length,2);
 for(let c=0;c<5;c++)assert(l.cells.filter(v=>v===c).length>=2);
 assert(!R.legal(l,[],(l.start+1)%l.cells.length));
 if(l.wallStyle==='corner'){
 const ends=([a,b])=>b-a===1?[[b%l.size,Math.floor(a/l.size)],[b%l.size,Math.floor(a/l.size)+1]]:[[a%l.size,Math.floor(b/l.size)],[a%l.size+1,Math.floor(b/l.size)]];
 const [a,b]=l.walls;assert.notEqual(a[1]-a[0],b[1]-b[0]);assert(ends(a).some(p=>ends(b).some(q=>p[0]===q[0]&&p[1]===q[1])));
 }
 const search=R.solve(l,[],{shortcut:false,maxNodes:300000,maxSolutions:10000});assert(!search.exhausted);assert.equal(search.solutions.length,reports[i].solutions);assert(reports[i].solutionsExact);
}
const source={window:{}};vm.runInNewContext(fs.readFileSync(__dirname+'/../difficulty-lab-v5/levels.js','utf8'),source);
for(let i=0;i<2;i++)for(const k of ['size','cells','start','walls','solution'])assert.deepEqual(levels[i+22][k],JSON.parse(JSON.stringify(source.window.LAB_LEVELS[i+2][k])));
console.log('24-stage progression, all exact solution counts, fixed starts, L geometry and unchanged C/D passed');
