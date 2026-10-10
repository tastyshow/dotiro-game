const fs = require('node:fs');
const path = require('node:path');
const R = require('./core.js');
let seed = 10103026;
function random() { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; }
function shuffle(items) { const a = items.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function routeFor(size) {
  const l = { size }, length = size * size;
  for (let attempt = 0; attempt < 30; attempt++) {
    const used = new Set(), route = []; let budget = 30000;
    function visit(i) {
      if (--budget < 0) return false;
      used.add(i); route.push(i); if (route.length === length) return true;
      const next = shuffle(R.neighbors(l, i).filter(j => !used.has(j)));
      next.sort((a, b) => R.neighbors(l, a).filter(j => !used.has(j)).length - R.neighbors(l, b).filter(j => !used.has(j)).length);
      for (const j of next) if (visit(j)) return true;
      used.delete(i); route.pop(); return false;
    }
    const starts = Array.from({ length }, (_, i) => i).filter(i => size % 2 === 0 || (i % size + Math.floor(i / size)) % 2 === 0);
    if (visit(starts[Math.floor(random() * starts.length)])) {
      // Backbite moves retain a full path while mixing its spatial shape.
      for (let k=0;k<length*40;k++) {
        if(random()<.5) route.reverse();
        const choices=R.neighbors(l,route[0]).filter(j=>j!==route[1]);
        const target=choices[Math.floor(random()*choices.length)], at=route.indexOf(target);
        if(at>1) route.splice(0,at,...route.slice(0,at).reverse());
      }
      return route;
    }
  }
  throw Error('Could not generate route');
}
const specs = [
 [2,6,18,0,'断开的图案','同一种图案散在不同位置，针点怎么分配？'],
 [2,6,20,0,'远处还有一朵','先看清同类的位置，再决定从哪里起针。'],
 [3,6,21,0,'中央留给谁','经过中央之前，想想后面还有谁需要它。'],
 [3,6,22,0,'几条路都像对','一步连得上，还要确保剩余区域能走完。'],
 [4,7,26,3,'挡线与空针','起点、绕行和图案顺序一起安排。'],
 [4,7,28,4,'整盘推演','任何一格都能起针，能否走完由路线决定。'],
];
function candidate(spec) {
  const [group, size, dots, wallCount, title, brief] = spec, solution = routeFor(size), colors = shuffle([0, 1, 2, 3, 4]);
  const lengths = Array(5).fill(Math.floor(size * size / 5));
  for (let i = lengths.reduce((a, b) => a + b); i < size * size; i++) lengths[Math.floor(random() * 5)]++;
  const cells = Array(size * size); let at = 0;
  colors.forEach((c, i) => { for (let k = 0; k < lengths[i]; k++) cells[solution[at++]] = c; });
  const remaining = [...lengths];
  let erased = 0;
  for (const i of shuffle(solution.slice(1, -1))) {
    const groupIndex = colors.indexOf(cells[i]);
    if (remaining[groupIndex] <= 2) continue;
    cells[i] = null; remaining[groupIndex]--; if (++erased === dots) break;
  }
  if (!dots) { at = 0; colors.forEach((c, i) => { for (let k = 0; k < lengths[i]; k++) cells[solution[at++]] = c; }); }
  const usedEdges = new Set(solution.slice(1).map((v, i) => R.edge(v, solution[i])));
  const edges = cells.flatMap((_, i) => R.neighbors({ size }, i).filter(j => j > i && !usedEdges.has(R.edge(i, j))).map(j => [i, j]));
  const walls = shuffle(edges).slice(0, wallCount);
  return { freeStart:true, group, size, cells, start: solution[0], solution, walls, title, brief };
}
function inspect(l) {
  let forced = 0, forks = 0, categoryChoices = 0, falseBranches = 0, unresolved = 0;
  const p = [];
  for (const i of l.solution) {
    p.push(i); if (p.length === l.cells.length) break;
    const next = R.neighbors(l, i).filter(j => R.legal(l, p, j));
    if (next.length === 1) forced++; else forks++;
    if (new Set(next.filter(j => R.isSymbol(l.cells[j])).map(j => l.cells[j])).size > 1) categoryChoices++;
    for (const j of next) if (j !== l.solution[p.length]) {
      const result = R.solve(l, [...p, j], { maxNodes: 1800, shortcut: false });
      if (result.exhausted) unresolved++;
      else if (!result.solution) falseBranches++;
    }
  }
  const sharedDots = l.cells.filter((c, i) => c === null && new Set(R.neighbors(l, i).filter(j => R.isSymbol(l.cells[j])).map(j => l.cells[j])).size >= 2).length;
  return { forced, forks, categoryChoices, falseBranches, unresolved, sharedDots };
}
const levels = specs.map((spec, index) => {
  const shortlist = [];
  for (let attempt = 0; attempt < 100; attempt++) {
    const l = candidate(spec); let forks = 0;
    for (let k = 1; k < l.solution.length; k++) if (R.neighbors(l, l.solution[k - 1]).filter(j => R.legal(l, l.solution.slice(0, k), j)).length > 1) forks++;
    shortlist.push({ l, forks });
  }
  shortlist.sort((a, b) => b.forks - a.forks);
  const analyzed = shortlist.slice(0, 12).map(({ l }) => {
    l.metrics = inspect(l);
    let components=0;
    for(let c=0;c<5;c++) { const seen=new Set();for(let i=0;i<l.cells.length;i++) if(l.cells[i]===c&&!seen.has(i)){components++;const q=[i];seen.add(i);while(q.length)for(const j of R.neighbors(l,q.pop()))if(l.cells[j]===c&&!seen.has(j)){seen.add(j);q.push(j)}} }
    l.metrics.symbolComponents=components;
    return { l, score: l.metrics.falseBranches * 3 + l.metrics.categoryChoices * 2 + l.metrics.sharedDots + (l.metrics.symbolComponents-5)*8 - l.metrics.unresolved };
  }).sort((a, b) => b.score - a.score);
  const l = analyzed[0].l;
  l.id = `v3-${index + 3}`;
  l.tag = `${l.size}×${l.size} · ${l.cells.filter(c => c === null).length} 针点 · ${l.walls.length ? l.walls.length + ' 挡线' : '无障碍'} · 自选起点`;
  console.log(l.id, l.title, JSON.stringify(l.metrics));
  return l;
});
const vm=require('node:vm'), context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../difficulty-lab/levels.js'),'utf8'),context);
const baseline=JSON.parse(JSON.stringify(context.window.LAB_LEVELS[4]));
levels.unshift({...baseline,id:'v3-1',group:1,title:'旧版对照 · 给起点',brief:'沿用第二版 3A，比较同一盘有没有起点提示的区别。'}, {...baseline,id:'v3-2',group:1,freeStart:true,title:'同一盘 · 自选起点',brief:'棋盘完全相同，任选一格起针；所有合法走法都算通关。',tag:baseline.tag+' · 自选起点'});
fs.writeFileSync(path.join(__dirname, 'levels.js'), 'window.LAB_LEVELS = ' + JSON.stringify(levels, null, 2) + ';\n');
