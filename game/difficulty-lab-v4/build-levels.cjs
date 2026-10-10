const fs = require('node:fs');
const path = require('node:path');
const R = require('./core.js');
let seed = 10104026;
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
  return { freeStart:false, group, size, cells, start: solution[0], solution, walls, title, brief };
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
// A wall segment lies on a cell boundary, with endpoints at grid vertices.
function endpoints(l,[a,b]) {const n=l.size;if(b-a===1){const x=b%n,y=Math.floor(a/n);return [[x,y],[x,y+1]]}const x=a%n,y=Math.floor(b/n);return [[x,y],[x+1,y]]}
function touches(l,a,b){return endpoints(l,a).some(p=>endpoints(l,b).some(q=>p[0]===q[0]&&p[1]===q[1]))}
function wallSets(l,kind){
 const route=new Set(l.solution.slice(1).map((v,i)=>R.edge(v,l.solution[i])));
 const edges=shuffle(l.cells.flatMap((_,i)=>R.neighbors(l,i).filter(j=>j>i&&!route.has(R.edge(i,j))).map(j=>[i,j])));
 if(kind==='straight') {const result=[];for(const e of edges)if(!result.some(v=>touches(l,e,v))){result.push(e);if(result.length===4)return result}return null}
 const pairs=[];for(let i=0;i<edges.length;i++)for(let j=i+1;j<edges.length;j++)if((edges[i][1]-edges[i][0]===1)!==(edges[j][1]-edges[j][0]===1)&&touches(l,edges[i],edges[j]))pairs.push([edges[i],edges[j]]);
 for(const a of shuffle(pairs))for(const b of shuffle(pairs))if(!a.some(e=>b.some(v=>touches(l,e,v))))return [...a,...b];
 return null;
}
function count(l){const r=R.solve(l,[],{shortcut:false,maxNodes:300000,maxSolutions:13});return !r.exhausted&&r.solutions.length<13?r:null}
// Measure how long a proven wrong branch can remain locally legal, no solver pruning.
function delay(l,p,budget=15000){let nodes=0,max=0;const base=p.length;function walk(){if(++nodes>budget)return;max=Math.max(max,p.length-base);for(const j of R.neighbors(l,p.at(-1)))if(R.legal(l,p,j)){p.push(j);walk();p.pop();if(nodes>budget)return}}walk();return {moves:max,capped:nodes>budget}}
function metrics(l){let wrong=0,delayed=0,longest=0,capped=0,forks=0;for(let k=1;k<l.solution.length;k++){const p=l.solution.slice(0,k),options=R.neighbors(l,p.at(-1)).filter(j=>R.legal(l,p,j));if(options.length>1)forks++;for(const j of options){if(j===l.solution[k])continue;const r=R.solve(l,[...p,j],{shortcut:false,maxNodes:100000});if(r.exhausted)continue;if(!r.solution){wrong++;const d=delay(l,[...p,j]);longest=Math.max(longest,d.moves);if(d.moves>=5)delayed++;if(d.capped)capped++}}}return {wrongBranches:wrong,delayedBranches:delayed,longestDeadContinuation:longest,delayCapped:capped,forks}}
const selected=[];
for(let attempt=0;attempt<450;attempt++){
 const l=candidate([1,6,16+attempt%3,0,'','']);const base=count(l);if(!base||base.solutions.length<2||base.solutions.length>8)continue;
 const straight=wallSets(l,'straight'),corner=wallSets(l,'corner');if(!straight||!corner)continue;
 const variants=[l,{...l,walls:straight},{...l,walls:corner}];let valid=true;
 for(const v of variants){const c=count(v);if(!c||!c.solutions.length){valid=false;break}v.solutionCount=c.solutions.length;v.metrics=metrics(v)}
 if(!valid||variants.some(v=>v.metrics.delayedBranches<3))continue;
 const score=Math.min(...variants.map(v=>v.metrics.delayedBranches))*10+variants.reduce((s,v)=>s+v.metrics.wrongBranches,0);
 selected.push({variants,score});selected.sort((a,b)=>b.score-a.score);selected.splice(8);
 if(attempt%50===0)console.log('candidates',attempt,'best',selected[0].score);
}
if(selected.length<2)throw Error('Insufficient verified candidates');
const levels=[];
selected.slice(0,2).forEach(({variants},g)=>variants.forEach((l,j)=>{
 l.group=g+1;l.id=`v4-${g+1}-${j}`;l.label=`${g+1}${['A','B','C'][j]}`;l.title=['无墙 · 看布局','直墙 · 换通路','L墙 · 看转角'][j];
 l.brief=`与 ${g+1} 组其他两张图案、起点相同。${['先试没有墙的路线。','四段分开的直墙，观察哪些选择被改变。','四段墙组成两个 L 形，观察拐角的进出。'][j]}`;
 l.tag=`6×6 · ${l.cells.filter(c=>c===null).length} 针点 · ${['无墙','4 段直墙','2 组 L 墙'][j]}`;
 levels.push(l);console.log(l.label,'solutions',l.solutionCount,JSON.stringify(l.metrics));
}));
fs.writeFileSync(path.join(__dirname,'levels.js'),'window.LAB_LEVELS = '+JSON.stringify(levels,null,2)+';\n');
fs.writeFileSync(path.join(__dirname,'analysis.json'),JSON.stringify(levels.map(l=>({label:l.label,solutions:l.solutionCount,...l.metrics})),null,2));
