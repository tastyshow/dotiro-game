const fs = require('node:fs');
const path = require('node:path');
const R = require('./core.js');
let seed = 10106026;
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
// chapter, dots, wall style, wall segments, target forks, target deep branches, title, lesson
const specs=[
 [1,0,'none',0,3,0,'连成一组','从“起”出发，连完同一种图案，再接下一种。'],
 [1,0,'none',0,4,0,'找好出口','看看这一组从哪里结束，才能接上下一组。'],
 [1,0,'none',0,5,0,'换个走法','同一组内也有走法选择，先看出口再下针。'],
 [1,0,'none',0,6,0,'提前看一组','连当前图案时，也留意下一组的入口。'],
 [1,2,'none',0,6,0,'认识空白针点','小针孔也要走完；经过针点不会改变当前图案。'],
 [1,4,'none',0,7,1,'借针点连接','针点可以连接图案，也要安排它们什么时候经过。'],
 [2,5,'none',0,8,1,'绣布大一点','规则不变。先观察新棋盘里各组图案的位置。'],
 [2,7,'none',0,10,1,'让路线有余地','连接图案时，记得把空白针点一起安排进去。'],
 [2,9,'straight',1,10,1,'遇见直墙','深色短墙不能穿过，找一条相邻的通路。'],
 [2,11,'straight',2,11,2,'绕行的出口','绕过墙后，还要能接上后面的图案。'],
 [2,11,'corner',2,11,2,'绕过转角','两段墙连成L形，观察转角两边如何进出。'],
 [2,13,'corner',3,12,2,'针点与墙','直墙和L墙一起出现，先留好绕行的针点。'],
 [3,14,'corner',3,12,2,'图案分开了','同类图案分散在不同位置，先安排怎样连接。'],
 [3,15,'corner',4,13,3,'通道留给谁','这组走完以后，下一组还需要哪些针点？'],
 [3,16,'corner',4,14,3,'先后有关系','图案顺序由你选择，但每次连接都会影响后面的路。'],
 [3,17,'corner',4,15,4,'穿过中间','经过中间之前，看看两侧还有哪些图案没连。'],
 [3,18,'corner',5,15,4,'跨区连针','先考虑几个区域之间怎样连接，再安排局部走法。'],
 [3,19,'corner',5,16,4,'留住最后的路','别急着用完眼前的针点，最后一组也需要通路。'],
 [4,19,'corner',4,16,3,'走进大绣布','熟悉的图案、针点和墙，先适应7×7的全盘布局。'],
 [4,21,'corner',4,17,4,'区域之间','看清各区域的进出口，再逐组连接。'],
 [4,23,'corner',5,18,5,'转角与通道','绕过转角时，留意后面的图案能否继续通过。'],
 [4,24,'corner',6,19,6,'全盘安排','把图案顺序、针点和绕行路线一起考虑。'],
];
function addWalls(l,style,n){if(!n)return true;const set=wallSets(l,style);if(!set)return false;l.walls=set.slice(0,Math.min(n,4));if(n>4){const route=new Set(l.solution.slice(1).map((v,i)=>R.edge(v,l.solution[i])));const extra=shuffle(l.cells.flatMap((_,i)=>R.neighbors(l,i).filter(j=>j>i&&!route.has(R.edge(i,j))&&!l.walls.some(([a,b])=>a===i&&b===j)).map(j=>[i,j])));l.walls.push(...extra.slice(0,n-4))}return l.walls.length===n}
const levels=[],reports=[];
for(const [index,s] of specs.entries()){
 const [chapter,dots,style,walls,targetForks,targetDeep,title,brief]=s,size=chapter===1?5:chapter===4?7:6;
 let best=null;
 for(let attempt=0;attempt<90;attempt++){
 const l=candidate([chapter,size,dots,0,title,brief]);if(!addWalls(l,style,walls))continue;
 const quick=inspect(l);if(quick.unresolved||Math.abs(quick.forks-targetForks)>5)continue;
 const m=measure(l);if(!m||m.wrongBranches<1||m.deepWrongBranches>6||m.longestPlausibleContinuation>32)continue;
 const score=Math.abs(m.forks-targetForks)*2+Math.abs(m.deepWrongBranches-targetDeep)*5+Math.abs(m.structurallyPlausibleWrongBranches-(targetDeep*2+1))*.35;
 if(!best||score<best.score)best={l,m,score};
 }
 if(!best)throw Error('No candidate for '+index);
 const {l,m}=best;l.chapter=chapter;l.stage=index%6+1;l.label=`${chapter}-${l.stage}`;l.id=`progression-${l.label}`;l.wallStyle=style;l.metrics={...m,witnesses:undefined};
 l.tag=`${size}×${size} · ${dots} 针点 · ${walls?walls+' 段墙':'无墙'}`;
 const counts=R.solve(l,[],{shortcut:false,maxNodes:300000,maxSolutions:10000});
 reports.push({label:l.label,size,dots,walls,solutions:counts.solutions.length,solutionsExact:!counts.exhausted&&counts.solutions.length<10000,...m});
 levels.push(l);console.log(l.label,title,'forks',m.forks,'deep',m.deepWrongBranches);
}
const vm=require('node:vm'),ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../difficulty-lab-v5/levels.js'),'utf8'),ctx);
for(const [i,original] of ctx.window.LAB_LEVELS.slice(2).entries()){
 const l=JSON.parse(JSON.stringify(original));l.chapter=4;l.stage=i+5;l.label=`4-${l.stage}`;l.id=`progression-${l.label}`;l.wallStyle='corner';l.source=`第五版${i?'D':'C'}`;l.brief+='（沿用你认可的'+(i?'D':'C')+'）';levels.push(l);
 reports.push({label:l.label,source:l.source,size:l.size,dots:l.cells.filter(c=>c===null).length,walls:l.walls.length,solutions:1,solutionsExact:true,...l.metrics});
}
fs.writeFileSync(path.join(__dirname,'levels.js'),'window.LAB_LEVELS = '+JSON.stringify(levels,null,2)+';\n');
fs.writeFileSync(path.join(__dirname,'analysis.json'),JSON.stringify(reports,null,2));
