const chapter={"id": "cabin", "version": 1, "title": "林间小屋", "levels": [{"width": 5, "height": 5, "start": 0, "cells": ["red", "blue", "blue", "blue", "blue", "red", "blue", "blue", "gold", "green", "red", "gold", "gold", "gold", "green", "red", "gold", "brown", "brown", "green", "brown", "brown", "brown", "green", "green"], "id": "cabin-01", "chapter": "cabin", "region": "house", "difficulty": "温和入门", "solution": [0, 5, 10, 15, 16, 11, 12, 13, 8, 7, 6, 1, 2, 3, 4, 9, 14, 19, 24, 23, 18, 17, 22, 21, 20], "teaching": {"wrongExit": [0, 5, 10, 15, 20, 21, 22, 17, 18, 23, 24, 19, 14, 9, 4, 3, 2, 7, 6, 1], "undoSteps": 3}, "layers": {"red": "roof-door", "gold": "walls", "blue": "windows", "green": "plants", "brown": "timber"}, "title": "小屋主体", "number": 1}, {"width": 5, "height": 5, "start": 22, "cells": ["red", "red", "red", "blue", "blue", "red", "red", "blue", "blue", "green", "gold", "gold", "gold", "gold", "green", "brown", "brown", "brown", "green", "green", "brown", "brown", "brown", "green", "green"], "id": "cabin-02", "number": 2, "title": "花坛", "chapter": "cabin", "region": "花坛", "difficulty": "轻松", "solution": [22, 17, 16, 21, 20, 15, 10, 11, 12, 13, 18, 23, 24, 19, 14, 9, 4, 3, 8, 7, 6, 5, 0, 1, 2], "layers": {"red": "level-2-flowers", "gold": "level-2-petals", "blue": "level-2-pots", "green": "level-2-grass", "brown": "level-2-beds"}, "validation": {"solutions": 3, "nodes": 120, "deadEnds": 28}}, {"width": 5, "height": 5, "start": 0, "cells": ["gold", "gold", "red", "red", "blue", "gold", "gold", "red", "red", "blue", "green", "green", "red", "blue", "blue", "green", "green", "brown", "brown", "brown", "green", "green", "brown", "brown", "brown"], "id": "cabin-03", "number": 3, "title": "树林", "chapter": "cabin", "region": "树林", "difficulty": "轻松", "solution": [0, 1, 6, 5, 10, 11, 16, 15, 20, 21, 22, 23, 24, 19, 18, 17, 12, 7, 2, 3, 8, 13, 14, 9, 4], "layers": {"red": "level-3-berries", "gold": "level-3-leaves", "blue": "level-3-mist", "green": "level-3-canopy", "brown": "level-3-trunks"}, "validation": {"solutions": 2, "nodes": 173, "deadEnds": 35}}, {"width": 5, "height": 5, "start": 22, "cells": ["red", "red", "red", "red", "red", "red", "red", "red", "brown", "gold", "blue", "blue", "brown", "brown", "gold", "blue", "green", "green", "gold", "gold", "blue", "green", "green", "gold", "gold"], "id": "cabin-04", "number": 4, "title": "庭院", "chapter": "cabin", "region": "庭院", "difficulty": "思考", "solution": [22, 21, 16, 17, 18, 23, 24, 19, 14, 9, 4, 3, 2, 1, 0, 5, 6, 7, 8, 13, 12, 11, 10, 15, 20], "layers": {"red": "level-4-mailbox", "gold": "level-4-path", "blue": "level-4-post", "green": "level-4-vines", "brown": "level-4-fence"}, "validation": {"solutions": 3, "nodes": 240, "deadEnds": 50}}, {"width": 5, "height": 5, "start": 20, "cells": ["gold", "gold", "gold", "gold", "gold", "gold", "gold", "gold", "green", "green", "brown", "brown", "blue", "blue", "green", "brown", "red", "blue", "blue", "green", "brown", "red", "red", "green", "green"], "id": "cabin-05", "number": 5, "title": "天空", "chapter": "cabin", "region": "天空", "difficulty": "思考", "solution": [20, 15, 10, 11, 12, 13, 18, 17, 16, 21, 22, 23, 24, 19, 14, 9, 8, 7, 6, 5, 0, 1, 2, 3, 4], "layers": {"red": "level-5-sunset", "gold": "level-5-sun", "blue": "level-5-sky", "green": "level-5-hill", "brown": "level-5-cloud"}, "validation": {"solutions": 3, "nodes": 282, "deadEnds": 60}}, {"width": 5, "height": 5, "start": 0, "cells": ["brown", "brown", "blue", "blue", "blue", "green", "brown", "red", "red", "red", "green", "green", "red", "red", "red", "gold", "green", "red", "red", "red", "gold", "gold", "gold", "gold", "gold"], "id": "cabin-06", "number": 6, "title": "小惊喜", "chapter": "cabin", "region": "小惊喜", "difficulty": "收尾", "solution": [0, 1, 6, 5, 10, 11, 16, 15, 20, 21, 22, 23, 24, 19, 18, 17, 12, 13, 14, 9, 8, 7, 2, 3, 4], "layers": {"red": "level-6-butterflies", "gold": "level-6-cat", "blue": "level-6-bird", "green": "level-6-details", "brown": "level-6-nest"}, "validation": {"solutions": 4, "nodes": 351, "deadEnds": 68}}]};
function validateLevel(l) {
 if(!Number.isInteger(l.width)||!Number.isInteger(l.height)||l.width<1||l.height<1||l.cells.length!==l.width*l.height||l.cells.some(c=>typeof c!=='string'||!c)||!Number.isInteger(l.start)||l.start<0||l.start>=l.cells.length)throw new Error('Invalid level');
 return l;
}
function createState(l){validateLevel(l);return {path:[]};}
function summary(l,s){
 const totals={},counts={};for(const c of l.cells)totals[c]=(totals[c]||0)+1;
 for(const i of s.path)counts[l.cells[i]]=(counts[l.cells[i]]||0)+1;
 return {totals,counts,completed:Object.keys(totals).filter(c=>counts[c]===totals[c]),current:l.cells[s.path.at(-1)],won:s.path.length===l.cells.length};
}
function undo(s){return {path:s.path.slice(0,-1)};}
function neighbors(l,i){const x=i%l.width,y=Math.floor(i/l.width);return [x>0?i-1:-1,x<l.width-1?i+1:-1,y>0?i-l.width:-1,y<l.height-1?i+l.width:-1].filter(n=>n>=0);}
function move(l,s,i){
 const fail=reason=>({ok:false,state:s,reason});
 if(!Number.isInteger(i)||i<0||i>=l.cells.length)return fail('bounds');
 if(!s.path.length)return i===l.start?{ok:true,state:{path:[i]}}:fail('start');
 if(s.path.length>1&&i===s.path.at(-2))return {ok:true,state:undo(s),backtracked:true};
 if(s.path.includes(i))return fail('visited');
 if(!neighbors(l,s.path.at(-1)).includes(i))return fail('adjacent');
 const info=summary(l,s);
 if(l.cells[i]!==info.current&&info.counts[info.current]!==info.totals[info.current])return fail('category');
 return {ok:true,state:{path:[...s.path,i]}};
}
function solve(l,{maxNodes=1000000,maxSolutions=1000,prefix=[]}={}){
 validateLevel(l);let s=createState(l);for(const i of prefix){const r=move(l,s,i);if(!r.ok||r.backtracked)throw new Error('Invalid solver prefix');s=r.state;}
 const solutions=[];let nodes=0,deadEnds=0,limited=false;
 function visit(state){
  if(nodes>=maxNodes||solutions.length>=maxSolutions){limited=true;return;}
  nodes++;if(state.path.length===l.cells.length){solutions.push(state.path);return;}
  const candidates=state.path.length?neighbors(l,state.path.at(-1)):[l.start];let branches=0;
  for(const i of candidates){if(state.path.includes(i))continue;const r=move(l,state,i);if(r.ok){branches++;visit(r.state);if(limited)break;}}
  if(!branches)deadEnds++;
 }
 visit(s);return {solutions,nodes,deadEnds,exhaustive:!limited};
}
function hint(l,s){
 if(summary(l,s).won)return {solvable:false,cell:-1,rewindTo:-1};
 const result=solve(l,{prefix:s.path,maxSolutions:1});
 if(result.solutions.length){const path=result.solutions[0];return {solvable:true,cell:path[s.path.length],rewindTo:-1};}
 for(let i=s.path.length-2;i>=0;i--){
  const prefix=s.path.slice(0,i+1);
  if(solve(l,{prefix,maxSolutions:1}).solutions.length)return {solvable:false,cell:-1,rewindTo:i};
 }
 return {solvable:false,cell:-1,rewindTo:-1};
}

// A complete route is generated first; each symbol occupies one contiguous run.
const baseLevels=chapter.levels.map(l=>JSON.parse(JSON.stringify(l)));
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function randomRoute(base){
 let budget=6000;const path=[],seen=new Set();
 function visit(i){if(--budget<0)return false;path.push(i);seen.add(i);if(path.length===25)return true;
 const next=shuffle(neighbors(base,i).filter(n=>!seen.has(n))).sort((a,b)=>neighbors(base,a).filter(n=>!seen.has(n)).length-neighbors(base,b).filter(n=>!seen.has(n)).length);
 for(const n of next)if(visit(n))return true;seen.delete(i);path.pop();return false;}
 const start=shuffle(Array.from({length:25},(_,i)=>i).filter(i=>(i%5+Math.floor(i/5))%2===0))[0];
 return visit(start)?path:base.solution.slice();
}
function validBoard(b){try{validateLevel(b);if(b.width!==5||b.height!==5||!Array.isArray(b.solution)||b.solution.length!==25||new Set(b.cells).size!==5||b.cells.some(c=>!['red','green','blue','gold','brown'].includes(c)))return false;let st=createState(b);for(const i of b.solution){const r=move(b,st,i);if(!r.ok||r.backtracked)return false;st=r.state}return summary(b,st).won}catch{return false}}
function generateBoard(index,previous){
 const base=baseLevels[index],target=[35,60,90,140,200,260][index];let best=null,score=Infinity;
 for(let k=0;k<24;k++){
  const route=randomRoute(base),colors=shuffle(['red','green','blue','gold','brown']),sizes=[3,3,3,3,3];for(let n=0;n<10;n++)sizes[Math.floor(Math.random()*5)]++;
  const cells=Array(25);let at=0;colors.forEach((c,j)=>{for(let n=0;n<sizes[j];n++)cells[route[at++]]=c});
  if(previous&&cells.join()===previous.cells.join())continue;
  const board={...base,cells,start:route[0],solution:route};
  const result=solve(board,{maxNodes:8000,maxSolutions:100});if(!result.exhaustive)continue;
  const distance=Math.abs(Math.log((result.nodes+1)/(target+1)));
  if(distance<score){best=board;score=distance}if(score<.15)break;
 }
 // Relabeling a known solution is a bounded, always-solvable fallback.
 if(!best){const colors=['red','green','blue','gold','brown'],old=previous||base;const cells=old.cells.map(c=>colors[(colors.indexOf(c)+1)%5]);best={...old,cells,solution:old.solution.slice()}}
 return best;
}

const A=document.querySelector('#app'), symbols={red:'◉',green:'✿',blue:'☾',gold:'▲',brown:'✚'};
const names=['天空与远山','树林','小屋','庭院','花草','小惊喜'];
const positions=[[15,15],[83,29],[25,44],[68,60],[24,76],[80,90]];
const key='dotiro.chapter1.v1';let saved={completed:0,level:0,paths:{},sound:false};
try{const raw=JSON.parse(localStorage.getItem(key));if(raw&&Number.isInteger(raw.completed)&&raw.completed>=0&&raw.completed<=6){saved={...saved,...raw};saved.paths=raw.paths||{};saved.level=Math.max(0,Math.min(5,Number(raw.level)||0));}}catch{}
saved.boards=saved.boards&&typeof saved.boards==='object'?saved.boards:{};
saved.tutorialSeen=Boolean(saved.tutorialSeen||saved.completed>0||saved.paths[0]?.length);
for(let i=0;i<6;i++){
 const stored=saved.boards[i];
 if(validBoard(stored))chapter.levels[i]=stored;
 else{delete saved.boards[i];if(stored)delete saved.paths[i];else if(saved.paths[i]?.length)saved.boards[i]=baseLevels[i];}
}
let page='home',level=saved.level,state={path:[]},activePointer=null,saveFailed=false,timer=null,raf=0,animationToken=0,hinted=-1;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const cloth=new Image(),layers=Array.from({length:6},()=>new Image());let ready=false;
Promise.all([cloth,...layers].map((im,i)=>new Promise((resolve,reject)=>{im.onload=resolve;im.onerror=reject;im.src=i===0?'assets/fabric-approved.svg':`assets/layers/${String(i).padStart(2,'0')}.png`}))).then(()=>{prepareStitches();ready=true;render()}).catch(()=>{A.innerHTML='<p>绣布暂时没能展开。</p><button onclick="location.reload()">重试</button>'});
let saveTimer=0;
function queueSave(){clearTimeout(saveTimer);saveTimer=setTimeout(flushSave,120)}
function flushSave(){clearTimeout(saveTimer);saveTimer=0;persist()}
function persist(){try{localStorage.setItem(key,JSON.stringify(saved));saveFailed=false}catch{saveFailed=true}}
let cancelDrag=()=>{};
function stop(){cancelDrag();flushSave();lastPathKey=null;paintRunning=false;cancelAnimationFrame(threadRAF);clearTimeout(timer);timer=null;cancelAnimationFrame(raf);animationToken++;activePointer=null;hinted=-1}
function nav(p){stop();page=p;render()}

function art(id='art'){return `<canvas class="art" id="${id}" width="2172" height="724" aria-label="已绣出的作品"></canvas>`}
function back(){return `<button class="quiet back" data-action="back">${label('返回')}</button>`}
function fabric(ctx,w,h){ctx.save();const scale=w/390;ctx.scale(scale,scale);ctx.fillStyle=ctx.createPattern(cloth,'repeat');ctx.fillRect(0,0,w/scale,h/scale);ctx.restore()}
const stitchSurface=document.createElement('canvas');stitchSurface.width=2172;stitchSurface.height=724;
const stitches=[],layerStitches=[];
function weaveOrder(x,y){let n=0;for(let b=0;b<8;b++){n|=((x>>b)&1)<<(2*b);n|=((y>>b)&1)<<(2*b+1)}return n}
for(let y=0;y<46;y++)for(let x=0;x<91;x++)stitches.push({x:x*24+12,y:y*16+8,flip:(x+y)%2,order:weaveOrder(x,y)});
stitches.sort((a,b)=>a.order-b.order);
function prepareStitches(){for(let i=0;i<6;i++){try{const sample=document.createElement('canvas');sample.width=2172;sample.height=724;const ctx=sample.getContext('2d',{willReadFrequently:true});ctx.drawImage(layers[i],0,0);const px=ctx.getImageData(0,0,2172,724).data;layerStitches[i]=stitches.filter(p=>{const j=(Math.min(723,p.y)*2172+Math.min(2171,p.x))*4;return px[j+3]>20}).map(p=>{const j=(Math.min(723,p.y)*2172+Math.min(2171,p.x))*4;return {...p,color:`rgb(${px[j]},${px[j+1]},${px[j+2]})`}})}catch{layerStitches[i]=stitches}}}
const completedCanvases=[];
function completedCanvas(n){if(completedCanvases[n])return completedCanvases[n];const c=document.createElement('canvas');c.width=1086;c.height=362;const x=c.getContext('2d');if(n){x.drawImage(completedCanvas(n-1),0,0);x.drawImage(layers[n-1],0,0,1086,362)}else fabric(x,1086,362);completedCanvases[n]=c;return c}
function draw(c,amount){if(!c||!ready)return;amount=Math.max(0,Math.min(6,amount));const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);c.dataset.amount=String(amount);const full=Math.floor(amount),fraction=amount-full;x.drawImage(completedCanvas(full),0,0,c.width,c.height);
if(full<6&&fraction>0){const m=stitchSurface.getContext('2d');m.clearRect(0,0,2172,724);m.globalCompositeOperation='source-over';m.strokeStyle='#fff';m.lineWidth=23;m.lineCap='round';const sequence=layerStitches[full]||stitches;const count=fraction*sequence.length,n=Math.floor(count);m.beginPath();for(let i=0;i<n;i++){const p=sequence[i],d=p.flip?1:-1;m.moveTo(p.x-14,p.y-7*d);m.lineTo(p.x+14,p.y+7*d)}m.stroke();const p=sequence[n];if(p){const t=count-n,d=p.flip?1:-1;m.beginPath();m.moveTo(p.x-14,p.y-7*d);m.lineTo(p.x-14+28*t,p.y-7*d+14*d*t);m.stroke()}m.globalCompositeOperation='source-in';m.drawImage(layers[full],0,0);m.globalCompositeOperation='source-over';x.drawImage(stitchSurface,0,0,c.width,c.height);
// A short moving thread, clipped to the artwork layer, makes the current stitch legible.
if(p){const sx=c.width/2172,sy=c.height/724,px=p.x*sx,py=p.y*sy;x.save();x.strokeStyle=p.color||'#8d6950';x.lineWidth=9*sx;x.lineCap='round';x.beginPath();x.moveTo(px-70*sx,py-34*sy);x.bezierCurveTo(px-42*sx,py-70*sy,px-30*sx,py+20*sy,px+10*sx,py+4*sy);x.stroke();const phase=count-n,lift=Math.sin(phase*Math.PI)*22*sx;x.strokeStyle='#a09276';x.lineWidth=4*sx;x.beginPath();x.moveTo(px+10*sx,py+4*sy);x.lineTo(px-24*sx,py-32*sy-lift);x.stroke();x.fillStyle='#79543366';x.beginPath();x.ellipse(px+10*sx,py+4*sy,5*sx,3*sy,0,0,Math.PI*2);x.fill();x.restore()}}
}

let textId=0;
const atlasRects={作品册:[15,130,280,115],林间小屋:[320,130,300,115],绣好了:[640,130,290,115],返回:[1020,60,165,240],再绣一次:[0,389,310,190],欣赏作品:[313,389,310,190],下一关:[626,389,310,190],重置进度:[939,389,310,190],待开启:[650,1040,265,120],继续:[960,1040,280,120]};
function crop(file,rect,w,h,cls=''){const id='sprite-clip-'+(++textId);return `<svg class="sprite ${cls}" viewBox="${rect.join(' ')}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><clipPath id="${id}" clipPathUnits="userSpaceOnUse"><rect x="${rect[0]}" y="${rect[1]}" width="${rect[2]}" height="${rect[3]}"/></clipPath></defs><image href="assets/${file}" width="${w}" height="${h}" clip-path="url(#${id})"/></svg>`}
// Needle-eye anchors in the original 2172 x 724 embroidery atlas.
const symbolEyes={red:[216,360],green:[675,365],blue:[1100,362],gold:[1522,390],brown:[1950,365]};
function symbolArt(color){const [x,y]=symbolEyes[color],size=2172/5;return crop('symbols-transparent.png',[x-size/2,y-size/2,size,size],2172,724,'symbol-art')}
function sprite(name){return crop('ui-atlas-v4.png',atlasRects[name],1254,1254)}
function digit(n){const rects=[[29,1026,75,135],[105,1026,93,135],[199,1026,87,135],[330,1026,94,135],[425,1026,86,135],[514,1026,88,135]];return crop('ui-atlas-v4.png',rects[n-1],1254,1254,'digit')}
function embroideredText(text){return `<span class="thread-text">${text}</span>`}
function label(text){if(text==='连完同一种图案')return `<span class="stitched-label instruction-art" aria-label="${text}">${crop('play-skin.png',[250,1415,365,75],863,1823)}</span>`;return `<span class="stitched-label" aria-label="${text}">${atlasRects[text]?sprite(text):embroideredText(text)}</span>`}
function fabricButton(action,text){return `<button class="fabric-button" data-action="${action}" aria-label="${text}">${sprite(text)}</button>`}
function frame(){return crop('play-skin.png',[0,231,863,352],863,1823,'frame-sprite')}
function soundButton(){return `<button class="sound" data-action="sound" aria-label="${saved.sound?'关闭':'打开'}声音" aria-pressed="${saved.sound}">${crop('play-skin.png',[723,16,122,124],863,1823)}</button>`}
function header(){return `<header><button class="logo" data-action="${page==='play'?'map':'home'}" aria-label="${page==='play'?'回到画卷':'回到首页'}"></button>${soundButton()}</header>`}
function render(){if(!ready){A.innerHTML='<p class="instruction">正在展开绣布…</p>';return}let html=header();if(page==='home'){html=`<section class="home-exact"><div class="home-main">${crop('home-transparent-v4.png',[0,15,864,1585],864,1821,'home-art')}<button class="home-hotspot home-sound" data-action="sound" aria-label="${saved.sound?'关闭':'打开'}声音" aria-pressed="${saved.sound}"></button><button class="home-hotspot home-start" data-action="continue" aria-label="${saved.completed===6?'再绣一次':'一起绣'}"></button></div><div class="home-footer">${fabricButton('reset','重置进度')}<button class="quiet" data-action="album" aria-label="作品册">${label('作品册')}</button></div></section>`}
if(page==='album'){html+=`<h1>${label('作品册')}</h1><section class="patch">${frame()}${art()}<div class="card-bottom"><div><h2>${label('林间小屋')}</h2><div class="collection-dots">${Array.from({length:6},(_,i)=>`<i class="${i<saved.completed?'filled':''}">${crop('ui-atlas-v4.png',[i<saved.completed?20:649,659,270,270],1254,1254)}</i>`).join('')}</div></div>${fabricButton('map',saved.completed===6?'再绣一次':'继续')}</div></section><section class="patch upcoming">${frame()}${label('待开启')}</section>${back()}`}
if(page==='map'){html+=`<div class="title"><h1>${label('林间小屋')}</h1><span class="counter">${saved.completed?digit(saved.completed):'<span>0</span>'}<b>/</b>${digit(6)}</span></div><section class="map">${frame()}<canvas id="map-art" width="1086" height="1450" aria-label="章节画卷"></canvas><svg class="map-thread" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="${mapThread()}" fill="none" stroke="#865133" stroke-width="1.1" stroke-linecap="round"/><path d="${mapThread()}" fill="none" stroke="#dca16b" stroke-width=".75" stroke-linecap="round"/><path d="${mapThread()}" fill="none" stroke="#f3cd99" stroke-width=".3" stroke-dasharray=".6 .45"/></svg>${positions.map(([x,y],i)=>`<button class="node ${i<saved.completed?'done':i===saved.completed?'current':''}" style="left:${x}%;top:${y}%" data-level="${i}" ${i>saved.completed?'disabled':''} aria-label="第${i+1}关${i<saved.completed?'，已完成':i===saved.completed?'，继续':'，待开启'}">${crop('ui-atlas-v4.png',[i<saved.completed?20:i===saved.completed?334:649,659,270,270],1254,1254,'node-cloth')}${digit(i+1)}${i<saved.completed?crop('ui-atlas-v4.png',[995,700,185,195],1254,1254,'node-check'):''}</button>`).join('')}</section><div class="map-footer">${back()}${saved.completed===6?fabricButton('gallery','欣赏作品'):''}</div>`}
if(page==='gallery'){html+=`<section class="gallery-page"><h1>${label('林间小屋')}${label('绣好了')}</h1><section class="gallery art-frame">${frame()}${art()}</section><div class="actions">${fabricButton('map','再绣一次')}${fabricButton('album','作品册')}</div>${back()}</section>`}
if(page==='play'){const l=chapter.levels[level];html=`<section class="game-shell">${header()}<div class="chapter-heading"><h1>${label('林间小屋')}</h1><span class="stage-count">${digit(level+1)}<b>/</b>${digit(6)}</span></div><div class="art-frame">${frame()}${art()}</div><div class="progress-dots" aria-label="第${level+1}关">${Array.from({length:6},(_,i)=>`<i class="${i<=level?'filled':''}">${crop('ui-atlas-v4.png',[i<=level?20:649,659,270,270],1254,1254)}</i>`).join('')}</div><div class="board-space"><div class="board" id="board" tabindex="0" aria-label="5乘5连线棋盘">${crop('play-skin.png',[45,628,775,765],863,1823,'frame-sprite')}<div class="cells">${l.cells.map((c,i)=>`<button class="cell ${c}" data-cell="${i}" aria-label="第${Math.floor(i/5)+1}行第${i%5+1}列${({red:'圆环',green:'四瓣花',blue:'月牙',gold:'三角',brown:'十字'})[c]}"><span class="start-marker" aria-hidden="true">${icon('hint')}</span><span class="symbol">${symbolArt(c)}</span></button>`).join('')}</div><svg class="route" viewBox="0 0 100 100"><defs><pattern id="twisted-thread" width="1.2" height="1.2" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><rect width="1.2" height="1.2" fill="#b6533d"/><path d="M0 0H1.2" stroke="#efb18b" stroke-width=".3"/><path d="M0 1H1.2" stroke="#7c3627" stroke-width=".2"/></pattern></defs><polyline class="thread-shadow" id="thread-shadow"/><polyline id="line"/><polyline class="stitch" id="stitch"/><path id="loose-thread"/><g id="needle"><path d="M-4-7 0 0"/><ellipse cx="-4" cy="-7" rx=".45" ry="1" transform="rotate(-30 -4 -7)"/></g></svg></div></div><div class="message-space"><p class="instruction" id="instruction" role="status"></p><div id="finish" class="finish"></div></div><div class="toolbar"><button data-action="undo" aria-label="退一针">${crop('play-skin.png',[50,1560,225,114],863,1823)}</button><button data-action="restart" aria-label="重来">${crop('play-skin.png',[350,1560,183,114],863,1823)}</button><button data-action="hint" aria-label="提示">${crop('play-skin.png',[622,1560,187,114],863,1823)}</button></div></section>`}

html+='<p class="save-error" id="save-error" role="status"></p>';A.innerHTML=html;A.querySelector('#save-error').textContent=saveFailed?'暂时无法保存进度，离开后可能丢失。':'';if(page==='play'){bindBoard();update()}else if(page==='map')drawMap();else draw(A.querySelector('#art'),saved.completed)}
function icon(type){const r=type==='undo'?[56,1572,84,87]:type==='restart'?[356,1570,90,90]:[629,1564,86,98];return crop('play-skin.png',r,863,1823,'control-icon')}
function mapThread(){return positions.reduce((d,p,i)=>{if(!i)return `M${p[0]} ${p[1]}`;const a=positions[i-1],mid=(a[1]+p[1])/2;return d+` C${a[0]} ${mid} ${p[0]} ${mid} ${p[0]} ${p[1]}`},'')}
function drawMap(){const c=A.querySelector('#map-art');if(!c)return;const r=c.getBoundingClientRect();if(!r.width||!r.height)return;const ratio=Math.min(devicePixelRatio||1,2);c.width=Math.round(r.width*ratio);c.height=Math.round(r.height*ratio);const x=c.getContext('2d');fabric(x,c.width,c.height);const artHeight=c.width/3;x.drawImage(completedCanvas(saved.completed),0,0,c.width,artHeight)}
let catSoundPlayed=false;
function openLevel(i,{fresh=false}={}){
 stop();catSoundPlayed=false;level=i;saved.level=i;
 let board=saved.boards[i],path=saved.paths[i]||[];
 // Selecting an unfinished replay resumes it; completed attempts get a new board.
 const needsNew=!board||(fresh&&path.length===25);
 if(needsNew){board=i===0&&!saved.tutorialSeen?JSON.parse(JSON.stringify(baseLevels[0])):generateBoard(i,board);saved.boards[i]=board;path=[];saved.paths[i]=[];if(i===0)saved.tutorialSeen=true}
 chapter.levels[i]=board;state=createState(board);
 for(const cell of path){const result=move(board,state,cell);if(!result.ok)break;state=result.state}
 if(summary(board,state).won)state=createState(board);
 saved.paths[i]=state.path.slice();page='play';persist();render();
}
let displayed=0;function targetAmount(){return level+Math.max(0,state.path.length-1)/(chapter.levels[level].cells.length-1)}
let paintTarget=0,paintRunning=false,lastPaintTime=0,lastPathKey=null;
function finishAfterPaint(){if(page!=='play'||timer||!summary(chapter.levels[level],state).won||Math.abs(displayed-targetAmount())>.0001)return;const finishedLevel=level;timer=setTimeout(()=>{timer=null;if(page!=='play'||level!==finishedLevel||!summary(chapter.levels[level],state).won)return;if(level===5)nav('gallery');else openLevel(level+1,{fresh:true})},level===5?1300:750)}
function revealAudio(){if(page==='play'&&level===5&&displayed>5.01&&!catSoundPlayed){catSoundPlayed=true;meow()}}
function paintAnimate(target){paintTarget=target;if(reduced||target<=displayed){cancelAnimationFrame(raf);paintRunning=false;displayed=target;draw(A.querySelector('#art'),displayed);revealAudio();finishAfterPaint();return}if(paintRunning)return;paintRunning=true;lastPaintTime=performance.now();function frame(t){if(page!=='play'){paintRunning=false;return}const dt=Math.min(50,Math.max(0,t-lastPaintTime));lastPaintTime=t;displayed+=(paintTarget-displayed)*(1-Math.exp(-dt/55));if(Math.abs(paintTarget-displayed)<.001)displayed=paintTarget;draw(A.querySelector('#art'),displayed);revealAudio();if(displayed!==paintTarget)raf=requestAnimationFrame(frame);else{paintRunning=false;finishAfterPaint()}}raf=requestAnimationFrame(frame)}
let priorThreadLength=0,threadRAF=0;
function resetThread(){cancelAnimationFrame(threadRAF);for(const id of ['line','stitch','thread-shadow']){const p=A.querySelector('#'+id);if(p){p.style.strokeDasharray='';p.style.strokeDashoffset=''}}A.querySelector('#loose-thread')?.setAttribute('d','');const n=A.querySelector('#needle');if(n)n.style.display='none'}
function animateThread(){resetThread();const line=A.querySelector('#line'),needle=A.querySelector('#needle'),loose=A.querySelector('#loose-thread');if(!line)return;const length=line.getTotalLength(),previous=priorThreadLength;priorThreadLength=length;const head=state.path.at(-1);if(head===undefined||length<=previous||reduced)return;const end={x:(head%5)*20+10,y:Math.floor(head/5)*20+10};const t0=performance.now();function frame(t){if(page!=='play')return;const phase=Math.min(1,(t-t0)/110);needle.style.display='';needle.setAttribute('transform',`translate(${end.x} ${end.y}) scale(${1-phase*.75})`);loose.setAttribute('d',`M${end.x} ${end.y} q${-3*(1-phase)} ${-5*(1-phase)} ${-5*(1-phase)} ${-2*(1-phase)}`);if(phase<1)threadRAF=requestAnimationFrame(frame);else resetThread()}threadRAF=requestAnimationFrame(frame)}
function update(message=''){const l=chapter.levels[level],info=summary(l,state);const pathKey=level+':'+state.path.join(',');const pathChanged=pathKey!==lastPathKey;lastPathKey=pathKey;const complete=info.won&&level===5;A.querySelector('.game-shell').classList.toggle('is-complete',complete);if(pathChanged){saved.paths[level]=state.path.slice();queueSave();}const points=state.path.map(i=>`${(i%5)*20+10},${Math.floor(i/5)*20+10}`).join(' ');for(const id of ['line','stitch','thread-shadow'])A.querySelector('#'+id)?.setAttribute('points',points);A.querySelectorAll('[data-cell]').forEach(b=>{const i=Number(b.dataset.cell);b.classList.toggle('start',!state.path.length&&i===l.start);b.classList.toggle('head',i===state.path.at(-1));b.classList.toggle('hinted',i===hinted)});const instruction=A.querySelector('#instruction');const instructionMessage=message||(info.won?'这一段，绣好了。':!state.path.length?'从亮起的位置开始':info.completed.includes(info.current)?'接着连下一种图案':'连完同一种图案');instruction.innerHTML=label(instructionMessage);instruction.classList.toggle('error',!!message);instruction.classList.toggle('has-message',!!message||info.won);if(!message&&!info.won)instruction.innerHTML=label('连完同一种图案');if(pathChanged){animateThread();paintAnimate(targetAmount());}const finish=A.querySelector('#finish');if(!info.won){clearTimeout(timer);timer=null;finish.innerHTML=''}else{if(saved.completed<level+1){saved.completed=level+1;flushSave()}if(!finish.firstChild)finish.innerHTML=fabricButton(level===5?'gallery':'next',level===5?'欣赏作品':'下一关');finishAfterPaint()}A.querySelector('#save-error').textContent=saveFailed?'暂时无法保存进度，离开后可能丢失。':''}
function attempt(i){const l=chapter.levels[level];if(summary(l,state).won)return false;hinted=-1;const r=move(l,state,i);if(r.ok){state=r.state;update();tone();return true}else if(i!==state.path.at(-1)){update(({start:'从亮起的位置开始',adjacent:'只能上下左右相邻连接',category:'这一种图案还没连完',visited:'沿线回拖，或点旧位置撤回'})[r.reason]||'');return false}return true}
function bindBoard(){priorThreadLength=0;lastPathKey=null;const b=A.querySelector('#board');displayed=targetAmount();let rect=null,lastPoint=null;
function cellAt(x,y){const col=Math.floor((x-rect.left)/rect.width*5),row=Math.floor((y-rect.top)/rect.height*5);return col>=0&&col<5&&row>=0&&row<5?row*5+col:-1}
cancelDrag=()=>{const id=activePointer;activePointer=null;lastPoint=null;rect=null;if(id!==null&&b.hasPointerCapture(id))b.releasePointerCapture(id)};
b.addEventListener('pointerdown',e=>{if(activePointer!==null)return;rect=b.querySelector('.cells').getBoundingClientRect();const i=cellAt(e.clientX,e.clientY);if(i<0)return;const at=state.path.indexOf(i);if(at>=0&&i!==state.path.at(-1)&&!summary(chapter.levels[level],state).won){state={path:state.path.slice(0,at+1)};update()}else if(state.path.length&&i!==state.path.at(-1)){update('从线的末端继续');return}else attempt(i);activePointer=e.pointerId;lastPoint={x:e.clientX,y:e.clientY};b.setPointerCapture(e.pointerId);e.preventDefault()});
b.addEventListener('pointermove',e=>{if(activePointer!==e.pointerId||!rect||!lastPoint)return;const events=e.getCoalescedEvents?.();for(const point of events?.length?events:[e]){const from=lastPoint,to={x:point.clientX,y:point.clientY},steps=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.y-from.y)/(rect.width/5*.2)));let lastCell=cellAt(from.x,from.y);for(let k=1;k<=steps;k++){const i=cellAt(from.x+(to.x-from.x)*k/steps,from.y+(to.y-from.y)*k/steps);if(i===lastCell)continue;lastCell=i;if(i<0||!attempt(i))break}lastPoint=to}e.preventDefault()});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,cancelDrag);
b.addEventListener('keydown',e=>{const l=chapter.levels[level],head=state.path.at(-1);let i=head??l.start;if(!state.path.length&&(e.key==='Enter'||e.key===' ')){attempt(i);e.preventDefault();return}const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-5,ArrowDown:5}[e.key];if(delta){attempt(i+delta);e.preventDefault()}if(e.key==='Backspace'){state=undo(state);update();e.preventDefault()}})}
let audio;
function audioContext(){audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();return audio}
function tone(){if(!saved.sound)return;try{const a=audioContext(),t=a.currentTime,b=a.createBuffer(1,a.sampleRate*.14,a.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/d.length*5);const src=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();src.buffer=b;f.type='bandpass';f.frequency.value=1600;f.Q.value=.7;g.gain.setValueAtTime(.065,t);g.gain.exponentialRampToValueAtTime(.001,t+.14);src.connect(f).connect(g).connect(a.destination);src.start(t);src.stop(t+.15)}catch{}}
function meow(){if(!saved.sound)return;try{const a=audioContext(),t=a.currentTime,o=a.createOscillator(),g=a.createGain(),f=a.createBiquadFilter();o.type='sawtooth';o.frequency.setValueAtTime(680,t);o.frequency.exponentialRampToValueAtTime(940,t+.13);o.frequency.exponentialRampToValueAtTime(440,t+.52);f.type='lowpass';f.frequency.value=1700;g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(.026,t+.08);g.gain.exponentialRampToValueAtTime(.001,t+.58);o.connect(f).connect(g).connect(a.destination);o.start(t);o.stop(t+.6)}catch{}}
function showReset(){stop();const dialog=document.createElement('dialog');dialog.className='reset-dialog';dialog.innerHTML='<form method="dialog"><h2>重新开始绣？</h2><p>将清空六关进度和当前连线。</p><div><button value="cancel">取消</button><button value="reset">重置进度</button></div></form>';document.body.append(dialog);dialog.addEventListener('close',()=>{if(dialog.returnValue==='reset'){const sound=saved.sound;saved={completed:0,level:0,paths:{},boards:{},tutorialSeen:saved.tutorialSeen,sound};persist();openLevel(0,{fresh:true})}dialog.remove()});dialog.showModal()}
// Safari toolbars change the visible viewport without a navigation.
function syncViewport(){cancelDrag();document.documentElement.style.setProperty('--app-height',`${Math.round(window.visualViewport?.height||innerHeight)}px`);if(page==='map'&&ready)requestAnimationFrame(drawMap)}
syncViewport();window.visualViewport?.addEventListener('resize',syncViewport);window.addEventListener('resize',syncViewport);
A.addEventListener('click',e=>{const node=e.target.closest('[data-level]');if(node&&!node.disabled){openLevel(Number(node.dataset.level),{fresh:Number(node.dataset.level)<saved.completed});return}const button=e.target.closest('[data-action]');if(!button)return;const action=button.dataset.action;if(action==='sound'){saved.sound=!saved.sound;persist();if(button.classList.contains('sound'))button.outerHTML=soundButton();button.setAttribute('aria-pressed',saved.sound);button.setAttribute('aria-label',saved.sound?'关闭声音':'打开声音');tone();return}if(action==='reset'){showReset();return}if(action==='continue'){saved.completed===6?nav('map'):openLevel(saved.level<=saved.completed?saved.level:Math.min(saved.completed,5));return}if(action==='back'){nav(page==='map'?'album':'home');return}if(action==='next'){openLevel(Math.min(5,level+1),{fresh:true});return}if(action==='undo'){hinted=-1;state=undo(state);update();return}if(action==='restart'){hinted=-1;state=createState(chapter.levels[level]);update();return}if(action==='hint'){if(summary(chapter.levels[level],state).won)return;const h=hint(chapter.levels[level],state);hinted=h.solvable?h.cell:h.rewindTo>=0?state.path[h.rewindTo]:-1;update(h.solvable?'试着连到亮起的位置':h.rewindTo>=0?'点亮起的位置撤回，再试试':'暂时没找到提示，可以先撤回');return}nav(action)});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();persist()}else if(page==='play'){lastPathKey=null;update()}});render();
window.DOTIRO={chapter,get artworkAmount(){return targetAmount()},get displayedAmount(){return displayed},get state(){return state},get saved(){return saved},openLevel,move:attempt,nav};
