'use strict';
const E=window.DOTIRO_CHAPTERS,C=E.catalog,A=document.querySelector('#app');
const SAVE_KEY='dotiro.chapters.v1',OLD_KEY='dotiro.chapter1.v1',MIGRATION_KEY='dotiro.chapters.migration.v1',PREFS_KEY='dotiro.ui.v1';
const reviewMode=new URLSearchParams(location.search).get('review')==='first-stage',reviewSave=new Map();
const storage=reviewMode?{getItem:k=>reviewSave.get(k)??null,setItem:(k,v)=>reviewSave.set(k,v)}:{getItem:k=>window.localStorage.getItem(k),setItem:(k,v)=>window.localStorage.setItem(k,v)};
let migrationNotice='',storageNotice='',sound=false;
function migrateLegacy(){
 try{
  const existing=storage.getItem(SAVE_KEY),mark=storage.getItem(MIGRATION_KEY);
  if(mark){try{if(!JSON.parse(mark).acknowledged)migrationNotice='旧版完成记录已保留，未完成的旧题将从新题开始。'}catch{} }
  if(existing!==null||mark!==null)return null;
  const raw=storage.getItem(OLD_KEY);if(raw===null)return null;
  let old;try{old=JSON.parse(raw)}catch{return null}
  if(!old||!Number.isInteger(old.completed)||old.completed<0||old.completed>6)return null;
  const migrated=E.initialState();migrated.permanent.completedStageIds=C.chapters[0].stageIds.slice(0,old.completed);
  migrated.activeStageId=C.stages[Math.min(old.completed,C.stages.length-1)].stageId;
  migrationNotice='旧版完成记录已保留，未完成的旧题将从新题开始。';
  try{storage.setItem(SAVE_KEY,E.serialize(migrated));storage.setItem(MIGRATION_KEY,JSON.stringify({version:1,completed:old.completed,acknowledged:false}));}
  catch{storageNotice='暂时无法保存迁移记录，旧版存档仍保留。'}
  return migrated;
 }catch{storageNotice='暂时无法读取本机存档。';return null}
}
const migrated=migrateLegacy();
let session=E.createSession({saved:migrated,storage,storageKey:SAVE_KEY});
try{sound=JSON.parse(storage.getItem(PREFS_KEY)||'{}').sound===true}catch{}
let selectedChapter=E.getStage(session.state.activeStageId).chapterId;
let current=session.attempt,page='home',activePointer=null,timer=null,raf=0,hinted=-1,cancelDrag=()=>{};
let displayed=0,paintTarget=0,paintRunning=false,lastPaintTime=0,lastPathKey=null,priorThreadLength=0,threadRAF=0,catSoundPlayed=false,panMode=false;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const positions=[[15,10],[85,39],[29,53],[66,68],[22,81],[82,92]];
const colors=C.symbolIds,symbolNames=['圆环','四瓣花','月牙','三角','十字'];
const cloth=new Image(),artAssets=new Map();let ready=false;
function chapterMeta(){return E.getChapter(selectedChapter)}
function completedCount(id=selectedChapter){return session.artwork(id).amount}
function won(){return current&&E.summary(current).won}
function stageIndex(){return current?E.getStage(current.stageId).order-1:0}
function hasArt(id=selectedChapter){return E.getChapter(id).artwork.layerUrls.every(Boolean)}
function board(){return current.boardSnapshot}
function refreshAttempt(){current=session.attempt}
function stop(){cancelDrag();cancelAnimationFrame(threadRAF);cancelAnimationFrame(raf);clearTimeout(timer);timer=null;paintRunning=false;holdUntil=0;lastPathKey=null;activePointer=null;hinted=-1}
function nav(p){stop();page=p;render()}
function safe(text){return String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function art(id='art'){return `<canvas class="art" id="${id}" width="2172" height="724" aria-label="已绣出的作品"></canvas>`}
function back(){return `<button class="quiet back" data-action="back">${label('返回')}</button>`}
function fabric(ctx,w,h){ctx.save();const scale=w/390;ctx.scale(scale,scale);ctx.fillStyle=ctx.createPattern(cloth,'repeat');ctx.fillRect(0,0,w/scale,h/scale);ctx.restore()}
const stitchSurface=document.createElement('canvas');stitchSurface.width=2172;stitchSurface.height=724;
const revealOrder=window.DOTIRO_OBJECT_REVEAL;
const revealMask=document.createElement('canvas');revealMask.width=2172;revealMask.height=724;
let maskKey='',maskCursor=0,holdUntil=0,pauseBudget=0;
function prepareStitches(asset){asset.sequences=[];asset.boundaries=[]}
function sequenceFor(asset,index,id=selectedChapter){if(asset.sequences[index])return asset.sequences[index];const sample=document.createElement('canvas');sample.width=2172;sample.height=724;const ctx=sample.getContext('2d',{willReadFrequently:true});ctx.drawImage(asset.layers[index],0,0);const pixels=ctx.getImageData(0,0,2172,724).data;const sequence=revealOrder.buildSequence(pixels,revealOrder.config[id]?.[index],id==='cabin'?{width:32,height:10}:undefined);asset.sequences[index]=sequence;asset.boundaries[index]=sequence.flatMap((t,i)=>i&&t.batch!==sequence[i-1].batch?[{at:i,objectChange:t.object!==sequence[i-1].object}]:[]);return sequence}
function paintTo(sequence,end,key){const ctx=revealMask.getContext('2d');if(maskKey!==key||end<maskCursor){ctx.clearRect(0,0,2172,724);maskCursor=0;maskKey=key}ctx.strokeStyle='#fff';ctx.lineCap='round';while(maskCursor<end){const t=sequence[maskCursor++],w=t.width||revealOrder.CW,h=t.height||revealOrder.CH;if(t.island)continue;if(w===32){const cx=t.x+w/2,cy=t.y+h/2,dx=Math.cos(t.angle||0)*(w-h)/2,dy=Math.sin(t.angle||0)*(w-h)/2;ctx.lineWidth=h*1.7;ctx.beginPath();ctx.moveTo(cx-dx,cy-dy);ctx.lineTo(cx+dx,cy+dy);ctx.stroke()}else{ctx.fillStyle='#fff';ctx.fillRect(t.x,t.y,w,h)}}}
function completedCanvas(n,id=selectedChapter){const asset=artAssets.get(id);if(asset.completed[n])return asset.completed[n];const c=document.createElement('canvas');c.width=2172;c.height=724;const x=c.getContext('2d');x.globalCompositeOperation='source-over';if(n){x.drawImage(completedCanvas(n-1,id),0,0);x.drawImage(asset.layers[n-1],0,0)}else if(asset.cloth)x.drawImage(asset.cloth,0,0);else fabric(x,2172,724);asset.completed[n]=c;return c}
function draw(c,amount,id=selectedChapter){const asset=artAssets.get(id);if(!c||!ready||!asset)return;amount=Math.max(0,Math.min(6,amount));const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);c.dataset.amount=String(amount);c.dataset.masterId=E.getChapter(id).artwork.masterId;const full=Math.floor(amount),fraction=amount-full;x.drawImage(completedCanvas(full,id),0,0,c.width,c.height);
if(full<6&&fraction>0){const sequence=sequenceFor(asset,full,id),groups=E.getChapter(id).artwork.revealGroupsPerStage||current?.boardSnapshot?.cells.length||25,group=Math.floor(fraction*groups+1e-7),end=Math.min(sequence.length,Math.floor((id==='cabin'?fraction:group/groups)*sequence.length));paintTo(sequence,end,id+':'+full);const m=stitchSurface.getContext('2d');m.clearRect(0,0,2172,724);m.globalCompositeOperation='source-over';m.drawImage(asset.layers[full],0,0);m.globalCompositeOperation='destination-in';m.drawImage(revealMask,0,0);m.globalCompositeOperation='source-over';x.drawImage(stitchSurface,0,0,c.width,c.height);const tip=sequence[Math.max(0,end-1)];if(tip){c.dataset.revealObject=tip.label;c.dataset.revealColor=tip.color;c.dataset.revealBatch=tip.batch;if(paintRunning){x.save();x.scale(c.width/2172,c.height/724);x.strokeStyle='#fff8dd';x.lineWidth=1.7;x.beginPath();const tw=tip.width||revealOrder.CW,th=tip.height||revealOrder.CH,a=tip.angle||0,px=tip.x+tw/2,py=tip.y+th/2;const ux=Math.cos(a),uy=Math.sin(a);x.lineWidth=2.5;x.moveTo(px-ux*9-uy*3,py-uy*9+ux*3);x.lineTo(px,py);x.stroke();x.strokeStyle='#b88d63';x.lineWidth=th/3;x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px+ux*12-uy*12,py+uy*12+ux*12,px+ux*22-uy*4,py+uy*22+ux*4);x.stroke();x.restore()}}}else{delete c.dataset.revealObject;delete c.dataset.revealColor;delete c.dataset.revealBatch}}

let textId=0;
const atlasRects={作品册:[15,130,280,115],林间小屋:[320,130,300,115],绣好了:[640,130,290,115],返回:[1020,60,165,240],再绣一次:[0,389,310,190],欣赏作品:[313,389,310,190],下一关:[626,389,310,190],重置进度:[939,389,310,190],待开启:[650,1040,265,120],继续:[960,1040,280,120]};
function crop(file,rect,w,h,cls=''){const id='sprite-clip-'+(++textId);return `<svg class="sprite ${cls}" viewBox="${rect.join(' ')}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><clipPath id="${id}" clipPathUnits="userSpaceOnUse"><rect x="${rect[0]}" y="${rect[1]}" width="${rect[2]}" height="${rect[3]}"/></clipPath></defs><image href="assets/${file}" width="${w}" height="${h}" clip-path="url(#${id})"/></svg>`}
// Needle-eye anchors in the original 2172 x 724 embroidery atlas.
const symbolEyes={red:[216,360],green:[675,365],blue:[1100,362],gold:[1522,390],brown:[1950,365]};
function symbolArt(color){const [x,y]=symbolEyes[color],size=2172/5;return crop('symbols-transparent.png',[x-size/2,y-size/2,size,size],2172,724,'symbol-art')}
function sprite(name){return crop('ui-atlas-v4.png',atlasRects[name],1254,1254)}
function digit(n){const rects=[[29,1026,75,135],[105,1026,93,135],[199,1026,87,135],[330,1026,94,135],[425,1026,86,135],[514,1026,88,135]];return crop('ui-atlas-v4.png',rects[n-1],1254,1254,'digit')}
function embroideredText(text){return `<span class="thread-text">${safe(text)}</span>`}
function label(text){if(text==='连完同一种图案')return `<span class="stitched-label instruction-art" aria-label="${text}">${crop('play-skin.png',[250,1415,365,75],863,1823)}</span>`;return `<span class="stitched-label" aria-label="${text}">${atlasRects[text]?sprite(text):embroideredText(text)}</span>`}
function fabricButton(action,text){return `<button class="fabric-button" data-action="${action}" aria-label="${text}">${sprite(text)}</button>`}
function frame(){return crop('play-skin.png',[0,231,863,352],863,1823,'frame-sprite')}
function resetThread(){cancelAnimationFrame(threadRAF);A.querySelector('.cell.piercing')?.classList.remove('piercing');for(const id of ['line','stitch','thread-shadow']){const p=A.querySelector('#'+id);if(p){p.style.strokeDasharray='';p.style.strokeDashoffset=''}}A.querySelector('#loose-thread')?.setAttribute('d','');const n=A.querySelector('#needle');if(n)n.style.display='none'}
function animateThread(){
 resetThread();const line=A.querySelector('#line'),needle=A.querySelector('#needle'),loose=A.querySelector('#loose-thread');if(!line)return;
 const length=line.getTotalLength(),previous=priorThreadLength;priorThreadLength=length;const head=current.path.at(-1);
 if(head===undefined||(length<=previous&&current.path.length!==1)||reduced)return;
 const end=cellCenter(board(),head),cell=A.querySelector(`[data-cell="${head}"]`),t0=performance.now();cell?.classList.add('piercing');
 function frame(t){if(page!=='play')return;const phase=Math.min(1,(t-t0)/180),lift=Math.sin(Math.PI*phase),dip=Math.max(0,(phase-.55)/.45);
  needle.style.display='';needle.style.opacity=String(1-dip);needle.setAttribute('transform',`translate(${end.x} ${end.y+dip*.7}) scale(${1-dip*.82})`);
  loose.setAttribute('d',`M${end.x} ${end.y} q${-3*lift} ${-4*lift} ${-5*lift} ${-1.5*lift}`);
  if(phase<1)threadRAF=requestAnimationFrame(frame);else resetThread();
 }
 threadRAF=requestAnimationFrame(frame);
}
function needleEyes(l,rim=false){return l.cells.map((c,i)=>{const p=cellCenter(l,i),radius=Math.min(1.3,6.5/l.width),gap=radius*.45;return rim?`<g class="eye-stitch" data-eye="${i}"><circle class="eye-core" cx="${p.x}" cy="${p.y}" r="${gap}"/><path class="eye-rim" d="M${p.x-radius} ${p.y-gap} Q${p.x} ${p.y-radius*1.25} ${p.x+radius} ${p.y-gap} M${p.x-radius} ${p.y+gap} Q${p.x} ${p.y+radius*1.25} ${p.x+radius} ${p.y+gap}"/></g>`:`<circle class="eye-recess" data-eye="${i}" cx="${p.x}" cy="${p.y}" r="${radius}"/>`}).join('')}

let audio;
function audioContext(){audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();return audio}
function tone(){if(!sound)return;try{const a=audioContext(),t=a.currentTime,b=a.createBuffer(1,a.sampleRate*.14,a.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/d.length*5);const src=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();src.buffer=b;f.type='bandpass';f.frequency.value=1600;f.Q.value=.7;g.gain.setValueAtTime(.065,t);g.gain.exponentialRampToValueAtTime(.001,t+.14);src.connect(f).connect(g).connect(a.destination);src.start(t);src.stop(t+.15)}catch{}}
function meow(){if(!sound)return;try{const a=audioContext(),t=a.currentTime,o=a.createOscillator(),g=a.createGain(),f=a.createBiquadFilter();o.type='sawtooth';o.frequency.setValueAtTime(680,t);o.frequency.exponentialRampToValueAtTime(940,t+.13);o.frequency.exponentialRampToValueAtTime(440,t+.52);f.type='lowpass';f.frequency.value=1700;g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(.026,t+.08);g.gain.exponentialRampToValueAtTime(.001,t+.58);o.connect(f).connect(g).connect(a.destination);o.start(t);o.stop(t+.6)}catch{}}
function cellCenter(l,i){return {x:(i%l.width+.5)*100/l.width,y:(Math.floor(i/l.width)+.5)*100/l.height}}
function soundButton(){return `<button class="sound" data-action="sound" aria-label="${sound?'关闭':'打开'}声音" aria-pressed="${sound}">${crop('play-skin.png',[723,16,122,124],863,1823)}</button>`}
function header(){return `<header><button class="logo" data-action="${page==='play'?'map':'home'}" aria-label="${page==='play'?'退出并保存，返回选关':'回到首页'}"></button><div class="header-actions">${page==='play'?`<button class="exit-game" data-action="map" aria-label="退出并保存，返回选关">${icon('undo')}</button>`:''}${soundButton()}</div></header>`}
function textButton(action,text){return `<button class="quiet text-action" data-action="${action}">${label(text)}</button>`}
function pendingArt(){return '<div class="pending-art" role="status"><strong>画卷待装裱</strong><span>关卡可玩，作品待绑定</span></div>'}
function artArea(id='art'){return hasArt()?art(id):pendingArt()}
function render(){
 if(!ready){A.innerHTML='<p class="instruction">正在展开绣布…</p>';return}
 const meta=chapterMeta(),done=session.state.permanent.completedStageIds;
 let html=header();
 if(page==='home')html=`<section class="home-exact"><div class="home-main">${crop('home-transparent-v4.png',[0,15,864,1585],864,1821,'home-art')}<button class="home-hotspot home-sound" data-action="sound" aria-label="${sound?'关闭':'打开'}声音" aria-pressed="${sound}"></button><button class="home-hotspot home-start" data-action="album" aria-label="一起绣"></button></div><div class="home-footer">${fabricButton('reset','重置进度')}<button class="quiet" data-action="album" aria-label="作品册">${label('作品册')}</button></div></section>`;
 if(page==='album')html+=`<h1>${label('作品册')}</h1><div class="chapter-list" aria-label="大关选择">${C.chapters.map(ch=>{const unlocked=session.isUnlocked(ch.stageIds[0]),n=completedCount(ch.chapterId);return `<button class="patch chapter-card ${unlocked?'':'chapter-locked-entry'}" data-chapter="${ch.chapterId}" ${unlocked?'':'disabled'} aria-label="${ch.title}，已完成${n}/6，${unlocked?'进入小关选择':'待开启'}">${hasArt(ch.chapterId)?art('cover-'+ch.chapterId):pendingArt()}<div class="card-bottom"><h2>${label(ch.title)}</h2><span class="thread-text chapter-progress">${n} / 6</span></div>${unlocked?'':`<span class="chapter-lock-label">${label('待开启')}</span>`}</button>`}).join('')}</div>${back()}`;
 if(page==='map')html+=`<div class="title"><h1>${label(meta.title)}</h1><span class="counter" aria-label="已完成${completedCount()}关">${completedCount()?digit(completedCount()):'<span>0</span>'}<b class="sewn-divider" aria-hidden="true"></b>${digit(6)}</span></div>${hasArt()?'':pendingArt()}<section class="map"><canvas id="map-art" width="1086" height="1450" aria-label="${hasArt()?'同源全景画卷，保持原比例':'画卷待装裱的小关路线'}"></canvas><svg class="map-thread" viewBox="0 0 100 100" preserveAspectRatio="none">${mapThreads()}</svg>${positions.map(([x,y],i)=>{const id=meta.stageIds[i],isDone=done.includes(id),unlocked=session.isUnlocked(id);return `<button class="node ${isDone?'done':unlocked?'current':''}" style="left:${x}%;top:${y}%" data-stage="${id}" ${unlocked?'':'disabled'} aria-label="第${i+1}关${isDone?'，已完成，进入重玩或续玩':unlocked?'，继续':'，待开启'}">${crop('ui-atlas-v4.png',[isDone?20:unlocked?334:649,659,270,270],1254,1254,'node-cloth')}${digit(i+1)}${isDone?crop('ui-atlas-v4.png',[995,700,185,195],1254,1254,'node-check'):''}</button>`}).join('')}</section><div class="map-footer">${back()}${completedCount()===6?fabricButton('gallery','欣赏作品'):''}</div>`;
 if(page==='gallery')html+=`<section class="gallery-page"><h1>${label(meta.title)}${hasArt()?label('绣好了'):label('六关完成')}</h1><section class="gallery art-frame">${artArea()}</section><div class="actions">${fabricButton('map','再绣一次')}${fabricButton('album','作品册')}</div>${nextChapterButton()}${back()}</section>`;
 if(page==='play')html=playMarkup();
 html+=`<div class="system-notices" aria-live="polite">${page!=='play'&&migrationNotice?`<p>${safe(migrationNotice)} <button class="quiet" data-action="dismiss-migration">知道了</button></p>`:''}<p id="save-error" class="save-error" role="status"></p>${session.warnings.length?'<p class="save-warning">部分存档无法恢复，对应题目将重新开始。</p>':''}</div>`;
 A.innerHTML=html;
 if(page==='play'){bindBoard();update()}else if(page==='map')drawMap();else if(page==='album'){for(const ch of C.chapters)draw(A.querySelector('#cover-'+ch.chapterId),completedCount(ch.chapterId),ch.chapterId);}else if(page==='gallery'&&hasArt())draw(A.querySelector('#art'),completedCount());
 showSaveError();
}
function nextChapterButton(){const next=C.chapters[chapterMeta().order];return next&&session.isUnlocked(next.stageIds[0])?`<button class="quiet next-chapter" data-chapter="${next.chapterId}">${label('下一章')}</button>`:''}
function wallMarkup(l){return l.walls.map(([a,b])=>{const ax=a%l.width,ay=Math.floor(a/l.width),bx=b%l.width,by=Math.floor(b/l.width);let x1,y1,x2,y2;if(ay===by){x1=x2=Math.max(ax,bx)*100/l.width;y1=ay*100/l.height;y2=(ay+1)*100/l.height}else{y1=y2=Math.max(ay,by)*100/l.height;x1=ax*100/l.width;x2=(ax+1)*100/l.width}const d=`M${x1} ${y1}L${x2} ${y2}`;return `<g class="wall" data-wall="${a}:${b}"><path class="wall-shadow" d="${d}"/><path class="wall-thread" d="${d}"/><path class="wall-stitches" d="${d}"/></g>`}).join('')}
function playMarkup(){const l=board(),meta=chapterMeta(),n=stageIndex();return `<section class="game-shell" data-grid="${l.width}" data-stage="${current.stageId}" style="--board-min:${l.width*44+14}px">${header()}<div class="chapter-heading"><h1>${label(meta.title)}</h1><span class="stage-count">${digit(n+1)}<b class="sewn-divider" aria-hidden="true"></b>${digit(6)}</span></div><div class="art-frame">${artArea()}</div><div class="progress-dots" aria-label="第${n+1}关">${Array.from({length:6},(_,i)=>`<i>${crop('ui-atlas-v4.png',[i<=n?20:649,659,270,270],1254,1254)}</i>`).join('')}</div><div class="board-space"><div class="board" id="board" tabindex="0" role="group" aria-label="${l.width}乘${l.height}连线棋盘，${l.pins.length}个针点，${l.walls.length}段墙" aria-describedby="board-rules">${crop('play-skin.png',[45,628,775,765],863,1823,'frame-sprite')}<div class="cells" style="--columns:${l.width};--rows:${l.height}">${l.cells.map((c,i)=>`<button class="cell ${c===null?'pin-cell':colors[c]}" data-cell="${i}" tabindex="-1" style="--cell-right:${i%l.width===l.width-1?0:1}px;--cell-bottom:${i>=l.cells.length-l.width?0:1}px" aria-label="第${Math.floor(i/l.width)+1}行第${i%l.width+1}列${c===null?'针点':symbolNames[c]}"><span class="start-marker" aria-hidden="true">${icon('hint')}</span>${c===null?'<span class="needle-pin" aria-hidden="true"></span>':`<span class="symbol">${symbolArt(colors[c])}</span>`}</button>`).join('')}</div><svg class="route" viewBox="0 0 100 100" aria-hidden="true"><defs><pattern id="twisted-thread" width="1.2" height="1.2" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><rect width="1.2" height="1.2" fill="#b6533d"/><path d="M0 0H1.2" stroke="#efb18b" stroke-width=".3"/><path d="M0 1H1.2" stroke="#7c3627" stroke-width=".2"/></pattern></defs><g class="needle-eyes">${needleEyes(l)}</g><polyline class="thread-shadow" id="thread-shadow"/><polyline id="line"/><polyline class="stitch" id="stitch"/><path id="loose-thread"/><g class="needle-eye-rims">${needleEyes(l,true)}</g><g id="needle"><path d="M-4-7 0 0"/><ellipse cx="-4" cy="-7" rx=".45" ry="1" transform="rotate(-30 -4 -7)"/></g></svg><svg class="walls" viewBox="0 0 100 100" aria-hidden="true">${wallMarkup(l)}</svg></div></div><div class="message-space"><p class="instruction" id="instruction" role="status"></p><div id="finish" class="finish"></div></div><div class="toolbar"><button data-action="undo" aria-label="退一针">${crop('play-skin.png',[50,1560,225,114],863,1823)}</button><button data-action="restart" aria-label="重来同一题">${crop('play-skin.png',[350,1560,183,114],863,1823)}</button><button data-action="hint" aria-label="提示">${crop('play-skin.png',[622,1560,187,114],863,1823)}</button><button class="pan-button" data-action="pan" aria-label="移动棋盘" aria-pressed="false">移动</button></div><span class="sr-only" id="board-rules">上下左右连线，同一种图案全部连完再换类。针点也要经过，经过针点不会换类。格间绣线墙不能跨越。</span></section>`}
function icon(type){const r=type==='undo'?[56,1572,84,87]:type==='restart'?[356,1570,90,90]:[629,1564,86,98];return crop('play-skin.png',r,863,1823,'control-icon')}
function mapThread(from=0,to=5){return positions.slice(from,to+1).reduce((d,p,i)=>{if(!i)return `M${p[0]} ${p[1]}`;const a=positions[from+i-1],mid=(a[1]+p[1])/2;return d+` C${a[0]} ${mid} ${p[0]} ${mid} ${p[0]} ${p[1]}`},'')}
function mapThreads(){const end=Math.min(5,completedCount());return `<path class="pending-thread" d="${mapThread(end)}"/><path class="rope-shadow" d="${mapThread(0,end)}"/><path class="rope-main" d="${mapThread(0,end)}"/><path class="rope-stitches" d="${mapThread(0,end)}"/>`}
function drawMap(){const c=A.querySelector('#map-art');if(!c)return;const r=c.getBoundingClientRect();if(!r.width||!r.height)return;const ratio=Math.min(devicePixelRatio||1,2);c.width=Math.round(r.width*ratio);c.height=Math.round(r.height*ratio);const x=c.getContext('2d');fabric(x,c.width,c.height);c.dataset.completed=completedCount();if(!hasArt())return;
const panorama=document.createElement('canvas');panorama.width=2172;panorama.height=724;draw(panorama,completedCount(),selectedChapter);const w=Math.min(c.width,c.height*3),h=w/3,y=(c.height-h)/2;x.drawImage(panorama,0,0,2172,724,(c.width-w)/2,y,w,h);c.dataset.masterId=chapterMeta().artwork.masterId;c.dataset.panoramaRect=JSON.stringify({width:w,height:h,y});}
function showSaveError(){const el=A.querySelector('#save-error');if(el)el.textContent=session.saveError?'暂时无法保存进度，离开后可能丢失。':storageNotice}
function openStage(id,{replay=false}={}){const result=session.open(id,{replay});if(!result.ok)return result;stop();refreshAttempt();selectedChapter=current.chapterId;catSoundPlayed=hasArt()&&stageIndex()===5&&current.path.length>1;page='play';render();return result}
function selectStage(id){const snapshot=session.state,old=snapshot.attempts[id],completed=snapshot.permanent.completedStageIds.includes(id);return openStage(id,{replay:completed&&(!old||E.summary(old).won)})}
function targetAmount(){return current?session.artwork(current.chapterId,{mode:'attempt',attempt:current}).amount:0}
function afterCompletion(){if(!won())return;if(stageIndex()===5)nav('gallery');else openStage(chapterMeta().stageIds[stageIndex()+1])}
function finishAfterPaint(){if(reviewMode||page!=='play'||timer||!won()||Math.abs(displayed-targetAmount())>.0001)return;const puzzleId=current.puzzleId;timer=setTimeout(()=>{timer=null;if(page==='play'&&current.puzzleId===puzzleId&&won())afterCompletion()},stageIndex()===5?1300:750)}
function revealAudio(){if(page==='play'&&hasArt()&&stageIndex()===5&&displayed>5.01&&!catSoundPlayed){catSoundPlayed=true;meow()}}
function paintAnimate(target){const retreat=target<paintTarget;paintTarget=target;
if(reduced||!hasArt()||retreat||target<=displayed){cancelAnimationFrame(raf);paintRunning=false;holdUntil=0;displayed=target;if(hasArt())draw(A.querySelector('#art'),displayed);revealAudio();finishAfterPaint();return}
if(paintRunning)return;paintRunning=true;pauseBudget=280;holdUntil=0;lastPaintTime=performance.now();
function frame(t){if(page!=='play'){paintRunning=false;return}const dt=Math.min(50,Math.max(0,t-lastPaintTime));lastPaintTime=t;if(t<holdUntil){raf=requestAnimationFrame(frame);return}
let next=displayed+(paintTarget-displayed)*(1-Math.exp(-dt/(selectedChapter==='cabin'?100:55)));if(Math.abs(paintTarget-next)<.001)next=paintTarget;
const index=stageIndex(),asset=artAssets.get(selectedChapter),sequence=sequenceFor(asset,index),from=Math.floor(Math.max(0,displayed-index)*sequence.length),to=Math.floor(Math.max(0,next-index)*sequence.length);
if(pauseBudget>0){const boundary=asset.boundaries[index].find(b=>b.at>=from&&b.at<to);if(boundary){next=Math.min(paintTarget,index+(boundary.at+1)/sequence.length);const pause=Math.min(pauseBudget,boundary.objectChange?180:100);pauseBudget-=pause;holdUntil=t+pause}}
displayed=next;draw(A.querySelector('#art'),displayed);revealAudio();if(displayed!==paintTarget)raf=requestAnimationFrame(frame);else{paintRunning=false;draw(A.querySelector('#art'),displayed);finishAfterPaint()}}
raf=requestAnimationFrame(frame)}
function update(message=''){
 if(page!=='play'||!current)return;const l=board(),info=E.summary(current),path=current.path,key=current.puzzleId+':'+path.join(','),changed=key!==lastPathKey;lastPathKey=key;
 const points=path.map(i=>{const p=cellCenter(l,i);return `${p.x},${p.y}`}).join(' ');for(const id of ['line','stitch','thread-shadow'])A.querySelector('#'+id).setAttribute('points',points);
 A.querySelectorAll('[data-cell]').forEach(b=>{const i=Number(b.dataset.cell);b.classList.toggle('start',!path.length&&i===l.start);b.classList.toggle('head',i===path.at(-1));b.classList.toggle('hinted',i===hinted)});
 const sewnCells=new Set(path);A.querySelectorAll('.route [data-eye]').forEach(eye=>eye.classList.toggle('sewn-eye',sewnCells.has(Number(eye.dataset.eye))));
 const instruction=A.querySelector('#instruction');let prompt=info.won?'这一段，完成了。':!path.length?'从针头的位置开始':l.cells[path.at(-1)]===null?'针点连过去，图案不换类':info.completed.includes(info.current)?'接着连下一种图案':'连完同一种图案';
 instruction.setAttribute('aria-label',message||prompt);instruction.innerHTML='';instruction.classList.toggle('error',!!message);A.querySelector('#board').classList.toggle('move-rejected',!!message);
 A.querySelector('[data-action="undo"]').disabled=!path.length||info.won;
 A.querySelector('[data-action="restart"]').disabled=!path.length;
 A.querySelector('[data-action="hint"]').disabled=info.won;
 if(changed){animateThread();paintAnimate(targetAmount())}
 const finish=A.querySelector('#finish');finish.innerHTML='';if(!info.won){clearTimeout(timer);timer=null}else finishAfterPaint();
 showSaveError();
}
function attemptCell(i,options){if(!current||won())return false;hinted=-1;const result=session.move(i,options);if(result.ok){refreshAttempt();update();if(result.changed)tone();return true}update(({start:'从针头的位置开始',adjacent:'只能上下左右相邻连接',wall:'这里有绣线墙，请绕过去',category:'这一种图案还没连完',visited:'沿线回拖，或点旧位置撤回'})[result.reason]||'');return false}
function bindBoard(){if(hasArt())sequenceFor(artAssets.get(selectedChapter),stageIndex());panMode=false;priorThreadLength=0;lastPathKey=null;const b=A.querySelector('#board');displayed=targetAmount();if(hasArt())draw(A.querySelector('#art'),displayed);let rect=null,lastPoint=null;
 function cellAt(x,y){const l=board(),col=Math.floor((x-rect.left)/rect.width*l.width),row=Math.floor((y-rect.top)/rect.height*l.height);return col>=0&&col<l.width&&row>=0&&row<l.height?row*l.width+col:-1}
 cancelDrag=()=>{const id=activePointer;activePointer=null;lastPoint=null;rect=null;if(id!==null&&b.hasPointerCapture(id))b.releasePointerCapture(id)};
 b.addEventListener('pointerdown',e=>{if(activePointer!==null||won()||panMode)return;rect=b.querySelector('.cells').getBoundingClientRect();const i=cellAt(e.clientX,e.clientY);if(i<0)return;const path=current.path,at=path.indexOf(i);if(at>=0&&i!==path.at(-1))attemptCell(i,{rewind:true});else if(path.length&&i!==path.at(-1)){update('从线的末端继续');return}else attemptCell(i);activePointer=e.pointerId;lastPoint={x:e.clientX,y:e.clientY};b.setPointerCapture(e.pointerId);e.preventDefault()});
 b.addEventListener('pointermove',e=>{if(activePointer!==e.pointerId||!rect||!lastPoint)return;const events=e.getCoalescedEvents?.();for(const point of events?.length?events:[e]){const from=lastPoint,to={x:point.clientX,y:point.clientY},l=board(),steps=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.y-from.y)/(Math.min(rect.width/l.width,rect.height/l.height)*.2)));let lastCell=cellAt(from.x,from.y);for(let k=1;k<=steps;k++){const i=cellAt(from.x+(to.x-from.x)*k/steps,from.y+(to.y-from.y)*k/steps);if(i===lastCell)continue;lastCell=i;if(i<0||!attemptCell(i))break}lastPoint=to}e.preventDefault()});
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,cancelDrag);
 b.addEventListener('keydown',e=>{if(won())return;const l=board(),i=current.path.at(-1)??l.start;if(!current.path.length&&(e.key==='Enter'||e.key===' ')){attemptCell(i);e.preventDefault();return}const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-l.width,ArrowDown:l.width}[e.key];if(delta){attemptCell(i+delta);e.preventDefault()}if(e.key==='Backspace'){session.undo();refreshAttempt();update();e.preventDefault()}});
}
function showReset(){stop();const dialog=document.createElement('dialog');dialog.className='reset-dialog';dialog.innerHTML='<form method="dialog"><h2>重新开始绣？</h2><p>清空当前24关进度与连线。旧版备份保留，不会自动重新导入。</p><div><button value="cancel">取消</button><button value="reset">重置进度</button></div></form>';document.body.append(dialog);dialog.addEventListener('close',()=>{if(dialog.returnValue==='reset'){const initial=E.initialState();try{storage.setItem(SAVE_KEY,E.serialize(initial));storage.setItem(MIGRATION_KEY,JSON.stringify({version:1,acknowledged:true,reset:true}));storageNotice=''}catch{storageNotice='暂时无法保存重置结果，刷新后可能恢复旧进度。'}session=E.createSession({saved:initial,storage,storageKey:SAVE_KEY});current=null;selectedChapter='cabin';migrationNotice='';nav('album')}else if(page==='play'){lastPathKey=null;update()}dialog.remove()});dialog.showModal()}
function syncViewport(){cancelDrag();document.documentElement.style.setProperty('--app-height',`${Math.round(window.visualViewport?.height||innerHeight)}px`)}
syncViewport();window.visualViewport?.addEventListener('resize',syncViewport);window.addEventListener('resize',()=>{syncViewport();if(page==='map'&&ready)requestAnimationFrame(drawMap)});
A.addEventListener('click',e=>{
 const chapterButton=e.target.closest('[data-chapter]');if(chapterButton&&!chapterButton.disabled){selectedChapter=chapterButton.dataset.chapter;nav('map');return}
 const node=e.target.closest('[data-stage]');if(node&&!node.disabled){selectStage(node.dataset.stage);return}
 const button=e.target.closest('[data-action]');if(!button||button.disabled)return;const action=button.dataset.action;
 if(action==='sound'){sound=!sound;try{storage.setItem(PREFS_KEY,JSON.stringify({sound}))}catch{storageNotice='声音设置暂时无法保存。'}for(const b of A.querySelectorAll('[data-action="sound"]')){b.setAttribute('aria-pressed',sound);b.setAttribute('aria-label',sound?'关闭声音':'打开声音')}tone();showSaveError();return}
 if(action==='dismiss-migration'){migrationNotice='';try{const marker=JSON.parse(storage.getItem(MIGRATION_KEY)||'{}');storage.setItem(MIGRATION_KEY,JSON.stringify({...marker,version:1,acknowledged:true}))}catch{}render();return}
 if(action==='pan'){cancelDrag();panMode=!panMode;A.querySelector('#board').classList.toggle('pan-mode',panMode);button.textContent=panMode?'连线':'移动';button.setAttribute('aria-pressed',panMode);button.setAttribute('aria-label',panMode?'返回连线模式':'移动棋盘');update(panMode?'移动棋盘后，点“连线”继续':'');return}
 if(action==='reset'){showReset();return}
 if(action==='back'){nav(page==='map'?'album':page==='gallery'?'map':'home');return}
 if(action==='undo'||action==='restart'){cancelDrag();hinted=-1;if(action==='undo')session.undo();else session.restart();refreshAttempt();update();return}
 if(action==='hint'){cancelDrag();if(won())return;const h=session.hint({maxNodes:60000});hinted=h.cell??-1;update(({found:'试着连到亮起的位置',rewind:'点亮起的位置撤回，再试试',restart:'可以重来本关，从起点再试试',limited:'暂时没找到提示，可以先撤回',unsolvable:'这张题暂时无法继续，请返回选关',complete:'这一段，完成了。'})[h.status]||'暂时没找到提示');return}
 nav(action);
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else if(page==='play'){lastPathKey=null;update()}});
window.DOTIRO={get catalog(){return E.catalog},get session(){return session},get attempt(){return session.attempt},get state(){return {path:current?.path.slice()||[]}},get saved(){return session.state},get page(){return page},get chapterId(){return selectedChapter},get artworkAmount(){return targetAmount()},get displayedAmount(){return displayed},openStage,selectStage,move:attemptCell,nav};
function loadImage(url){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Missing image: '+url));im.src=url})}
Promise.all([new Promise((resolve,reject)=>{cloth.onload=resolve;cloth.onerror=reject;cloth.src='assets/fabric-approved.svg'}),...C.chapters.filter(ch=>hasArt(ch.chapterId)).map(async ch=>{const loaded=await Promise.all(ch.artwork.layerUrls.map(loadImage));const asset={layers:loaded,cloth:ch.artwork.clothUrl?await loadImage(ch.artwork.clothUrl):null,completed:[],layerStitches:[]};prepareStitches(asset);artAssets.set(ch.chapterId,asset)})]).then(()=>{ready=true;if(reviewMode)openStage('cabin-01');else render()}).catch(()=>{A.innerHTML='<p>绣布暂时没能展开。</p><button onclick="location.reload()">重试</button>'});
render();
