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

for(const l of levels) {
 assert(!l.freeStart);
 assert(!R.legal(l,[],(l.start+1)%l.cells.length));
 const all=R.solve(l,[],{shortcut:false,maxNodes:1000000,maxSolutions:1000});
 assert(!all.exhausted);assert.equal(all.solutions.length,l.solutionCount);
 for(const route of all.solutions) { const prefix=[];for(const i of route){assert(R.legal(l,prefix,i));prefix.push(i)}assert.equal(prefix.length,36) }
 assert(l.metrics.delayedBranches>=3);
}
function vertices([a,b]){return b-a===1?[[b%6,Math.floor(a/6)],[b%6,Math.floor(a/6)+1]]:[[a%6,Math.floor(b/6)],[a%6+1,Math.floor(b/6)]]}
const touching=(a,b)=>vertices(a).some(p=>vertices(b).some(q=>p[0]===q[0]&&p[1]===q[1]));
for(let g=0;g<2;g++) {
 const [a,b,c]=levels.slice(g*3,g*3+3);
 for(const l of [b,c]){assert.deepEqual(l.cells,a.cells);assert.equal(l.start,a.start);assert.equal(l.walls.length,4);assert(l.solutionCount<=a.solutionCount)}
 assert.equal(a.walls.length,0);
 for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)assert(!touching(b.walls[i],b.walls[j]));
 for(const [i,j] of [[0,1],[2,3]]){assert(touching(c.walls[i],c.walls[j]));assert.notEqual(c.walls[i][1]-c.walls[i][0],c.walls[j][1]-c.walls[j][0])}
}
console.log('Exact solution counts, all accepted routes, fixed starts, matched boards and wall geometry passed');
