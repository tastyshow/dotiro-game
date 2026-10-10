const fs = require('node:fs');
const path = require('node:path');
const R = require('./core.js');
let seed = 10105026;
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
// Reject immediately visible sealed regions and excess dead ends before measuring traps.
function viable(l,p,adj) {
 const used=new Set(p),head=p.at(-1),seen=new Set([head]),q=[head];
 while(q.length)for(const j of adj[q.pop()])if(!used.has(j)&&!seen.has(j)){seen.add(j);q.push(j)}
 if(seen.size!==l.cells.length-p.length+1)return false;
 let leaves=0;for(const j of seen)if(j!==head&&adj[j].filter(k=>k===head||!used.has(k)).length===1&&++leaves>1)return false;
 return true;
}
function continuation(l,p,adj,budget=25000){let nodes=0,max=0,best=p.slice();const base=p.length;function walk(){if(++nodes>budget)return;if(!viable(l,p,adj))return;if(p.length-base>max){max=p.length-base;best=p.slice()}for(const j of adj[p.at(-1)])if(R.legal(l,p,j)){p.push(j);walk();p.pop();if(nodes>budget)return}}walk();return {moves:max,nodes,capped:nodes>budget,witness:best}}
function measure(l){const adj=R.prepare(l).adj;let forks=0,wrong=0,subtle=0,deep=0,max=0;const witnesses=[];
 for(let k=1;k<l.solution.length;k++){
 const p=l.solution.slice(0,k),opts=adj[p.at(-1)].filter(j=>R.legal(l,p,j));if(opts.length>1)forks++;
 for(const j of opts){if(j===l.solution[k])continue;const r=R.solve(l,[...p,j],{shortcut:false,maxNodes:200000});if(r.exhausted)return null;if(r.solution)continue;wrong++;if(!viable(l,[...p,j],adj))continue;subtle++;
 const d=continuation(l,[...p,j],adj);if(d.capped)return null;max=Math.max(max,d.moves);if(d.moves>=6){deep++;witnesses.push({branchAt:k,wrongCell:j,continuation:d.moves,path:d.witness})}}
 }
 const shared=l.cells.filter((c,i)=>c===null&&new Set(adj[i].map(j=>l.cells[j]).filter(R.isSymbol)).size>1).length;
 return {forks,wrongBranches:wrong,structurallyPlausibleWrongBranches:subtle,deepWrongBranches:deep,longestPlausibleContinuation:max,sharedDots:shared,witnesses};
}
const levels=[];
for(const size of [6,7]){
 const pool=[];
 for(let attempt=0;attempt<650;attempt++){
  const dots=size===6?16+attempt%6:23+attempt%8;
  const l=candidate([1,size,dots,0,'','']);const corner=wallSets(l,'corner');if(!corner)continue;l.walls=corner;
  const route=new Set(l.solution.slice(1).map((v,i)=>R.edge(v,l.solution[i])));
  const edges=shuffle(l.cells.flatMap((_,i)=>R.neighbors(l,i).filter(j=>j>i&&!route.has(R.edge(i,j))&&!l.walls.some(([a,b])=>a===i&&b===j)).map(j=>[i,j])));
  l.walls.push(...edges.slice(0,(size===6?0:2)+attempt%3));
  const count=R.solve(l,[],{shortcut:false,maxNodes:250000,maxSolutions:3});if(count.exhausted||count.solutions.length!==1)continue;
  l.solutionCount=1;l.solution=count.solution;l.searchNodes=count.nodes;
  const m=measure(l);if(!m||m.deepWrongBranches<3||m.forks<(size===6?13:19))continue;l.metrics=m;
  const score=m.deepWrongBranches*15+m.structurallyPlausibleWrongBranches*3+m.forks+m.sharedDots+Math.log2(count.nodes)*3;
  pool.push({l,score});pool.sort((a,b)=>b.score-a.score);pool.splice(5);
  if(attempt%100===0)console.log('search',size,attempt,'best',Math.round(pool[0].score));
 }
 if(pool.length<2)throw Error(`Not enough high difficulty boards ${size}`);
 for(const {l} of pool.slice(0,2)){l.id=`v5-${levels.length+1}`;l.label=['A','B','C','D'][levels.length];l.group=size===6?1:2;
 l.title=['留住通道','跨区连针','转角之后','整盘布局'][levels.length];l.brief=['先观察各组图案需要经过哪些空针点。','同类图案分散，先安排怎样进入和离开。','绕过转角时，留意另一侧尚未连接的图案。','先看全盘的连接关系，再决定每一段路线。'][levels.length];
 l.tag=`${size}×${size} · ${l.cells.filter(c=>c===null).length} 针点 · ${l.walls.length} 段墙`;
 levels.push(l);console.log(l.label,l.tag,JSON.stringify({...l.metrics,witnesses:undefined}));}
}
fs.writeFileSync(path.join(__dirname,'levels.js'),'window.LAB_LEVELS = '+JSON.stringify(levels.map(l=>({...l,metrics:{...l.metrics,witnesses:undefined}})),null,2)+';\n');
fs.writeFileSync(path.join(__dirname,'analysis.json'),JSON.stringify(levels.map(l=>({label:l.label,size:l.size,solutions:l.solutionCount,searchNodes:l.searchNodes,...l.metrics})),null,2));
