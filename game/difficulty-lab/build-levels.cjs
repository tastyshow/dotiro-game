const fs = require('node:fs');
const path = require('node:path');
const R = require('./core.js');
let seed = 10102026;
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
    if (visit(starts[Math.floor(random() * starts.length)])) return route;
  }
  throw Error('Could not generate route');
}
const specs = [
  [1, 5, 0, 0, '先看出口', '这一组从哪里结束，下一组才接得上？'],
  [1, 5, 0, 0, '多看一组', '连得上还不够，也看看再下一组的入口。'],
  [2, 6, 6, 0, '认识针点', '小针孔也要走完。经过它，不会换图案。'],
  [2, 6, 8, 0, '直走还是绕行', '图案数量看得见，每一段走多长由你决定。'],
  [3, 6, 10, 0, '留一点空间', '中间的针点，后面的图案也可能需要。'],
  [3, 6, 12, 0, '先连哪一组', '图案没有规定顺序，先观察哪一组更需要通路。'],
  [4, 6, 10, 3, '绕过挡线', '两格之间的短挡线不能穿过，试着安排别的入口。'],
  [4, 7, 16, 4, '看完整张绣布', '先看区域之间怎么连接，再安排图案与针点。'],
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
  return { group, size, cells, start: solution[0], solution, walls, title, brief };
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
  for (let attempt = 0; attempt < 30; attempt++) {
    const l = candidate(spec); let forks = 0;
    for (let k = 1; k < l.solution.length; k++) if (R.neighbors(l, l.solution[k - 1]).filter(j => R.legal(l, l.solution.slice(0, k), j)).length > 1) forks++;
    shortlist.push({ l, forks });
  }
  shortlist.sort((a, b) => b.forks - a.forks);
  const analyzed = shortlist.slice(0, 5).map(({ l }) => {
    l.metrics = inspect(l);
    return { l, score: l.metrics.falseBranches * 3 + l.metrics.categoryChoices * 2 + l.metrics.sharedDots - l.metrics.unresolved };
  }).sort((a, b) => b.score - a.score);
  const l = analyzed[0].l;
  l.id = `v2-${index + 1}`;
  l.tag = `${l.size}×${l.size} · ${l.cells.filter(c => c === null).length} 针点 · ${l.walls.length ? l.walls.length + ' 挡线' : '无障碍'}`;
  console.log(l.id, l.title, JSON.stringify(l.metrics));
  return l;
});
fs.writeFileSync(path.join(__dirname, 'levels.js'), 'window.LAB_LEVELS = ' + JSON.stringify(levels, null, 2) + ';\n');
