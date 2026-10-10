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

const reports=JSON.parse(fs.readFileSync(__dirname+'/analysis.json','utf8'));
for(const [k,l] of levels.entries()) {
 assert(!l.freeStart);assert(!R.legal(l,[],(l.start+1)%l.cells.length));
 const all=R.solve(l,[],{shortcut:false,maxNodes:1000000,maxSolutions:2});
 assert(!all.exhausted);assert.equal(all.solutions.length,1);assert.equal(l.solutionCount,1);
 assert.deepEqual(all.solution,l.solution);
 const adj=R.prepare(l).adj;
 const viable=p=>{const used=new Set(p),head=p.at(-1),seen=new Set([head]),q=[head];while(q.length)for(const j of adj[q.pop()])if(!used.has(j)&&!seen.has(j)){seen.add(j);q.push(j)}if(seen.size!==l.cells.length-p.length+1)return false;let leaves=0;for(const j of seen)if(j!==head&&adj[j].filter(v=>v===head||!used.has(v)).length===1&&++leaves>1)return false;return true};
 assert(reports[k].witnesses.length>=3);
 for(const w of reports[k].witnesses) {
  assert(w.continuation>=6);const prefix=[];
  for(const i of w.path){assert(R.legal(l,prefix,i));prefix.push(i);if(prefix.length>=w.branchAt+1)assert(viable(prefix))}
  const dead=R.solve(l,w.path.slice(0,w.branchAt+1),{shortcut:false,maxNodes:1000000});assert(!dead.exhausted);assert.equal(dead.solution,null);
 }
 const edges=new Set(l.walls.map(([a,b])=>R.edge(a,b)));assert.equal(edges.size,l.walls.length);
 // Two initial pairs must form connected right angles in board coordinates.
 const ends=([a,b])=>b-a===1?[[b%l.size,Math.floor(a/l.size)],[b%l.size,Math.floor(a/l.size)+1]]:[[a%l.size,Math.floor(b/l.size)],[a%l.size+1,Math.floor(b/l.size)]];
 for(const [i,j] of [[0,1],[2,3]]){assert.notEqual(l.walls[i][1]-l.walls[i][0],l.walls[j][1]-l.walls[j][0]);assert(ends(l.walls[i]).some(a=>ends(l.walls[j]).some(b=>a[0]===b[0]&&a[1]===b[1])))}
}
assert.deepEqual(levels.map(l=>l.size),[6,6,7,7]);
console.log('All four unique solutions, fixed starts, L geometry and structurally plausible dead-branch witnesses verified');
