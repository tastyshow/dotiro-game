(function(root,factory){if(typeof module!=='undefined')module.exports=factory(require('../difficulty-progression/core.js'),require('./catalog.js'));else root.DOTIRO_CHAPTERS=factory(root.DOTIRO_RULES,root.DOTIRO_CHAPTER_CATALOG)})(typeof window!=='undefined'?window:globalThis,function(R,C){
'use strict';
if(!R||!C)throw Error('Load rules, catalog, then engine');
const clone=x=>JSON.parse(JSON.stringify(x));
const byId=new Map(C.stages.map(s=>[s.stageId,s]));
const chapterById=new Map(C.chapters.map(c=>[c.chapterId,c]));
function getStage(id){if(!byId.has(id))throw Error('Unknown stageId');return clone(byId.get(id))}
function getChapter(id){if(!chapterById.has(id))throw Error('Unknown chapterId');return clone(chapterById.get(id))}
function uint(n){if(!Number.isInteger(n)||n<0||n>4294967295)throw Error('Invalid seed');return n}
function rng(seed){let x=seed||0x9e3779b9;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}}
function boardFor(stageId,seed=0){uint(seed);const b=getStage(stageId),n=b.size;
 if(seed){const random=rng(seed),transform=seed%8,colors=[0,1,2,3,4];for(let i=4;i>0;i--){const j=Math.floor(random()*(i+1));[colors[i],colors[j]]=[colors[j],colors[i]]}
 const map=i=>{let x=i%n,y=Math.floor(i/n);if(transform>=4)x=n-1-x;for(let t=0;t<transform%4;t++)[x,y]=[n-1-y,x];return y*n+x};
 const cells=Array(n*n);b.cells.forEach((c,i)=>{cells[map(i)]=c===null?null:colors[c]});b.cells=cells;b.start=map(b.start);b.walls=b.walls.map(([a,c])=>[map(a),map(c)]);b.solution=b.solution.map(map);b.pins=b.cells.flatMap((c,i)=>c===null?[i]:[]);
 }
 b.seed=seed;b.puzzleId=`${stageId}:isomorphic-v1:${seed}`;return b;
}
function createAttempt(stageId,{seed=0,attemptNumber=0}={}){return {schemaVersion:1,stageId,chapterId:getStage(stageId).chapterId,puzzleId:`${stageId}:isomorphic-v1:${uint(seed)}`,seed,attemptNumber,boardSnapshot:boardFor(stageId,seed),path:[]}}
function summary(a){const b=a.boardSnapshot,counts=Array(5).fill(0),totals=R.prepare(b).totals;for(const i of a.path)if(R.isSymbol(b.cells[i]))counts[b.cells[i]]++;return {current:R.current(b,a.path),counts,totals,completed:totals.flatMap((v,i)=>counts[i]===v?[i]:[]),visited:a.path.length,total:b.cells.length,won:a.path.length===b.cells.length}}
function move(a,i,{rewind=false}={}){const fail=reason=>({ok:false,reason,attempt:a});if(!Number.isInteger(i)||i<0||i>=a.boardSnapshot.cells.length)return fail('bounds');if(summary(a).won)return fail('complete');if(i===a.path.at(-1))return {ok:true,attempt:a,changed:false};const at=a.path.indexOf(i);if(at>=0){if(!rewind&&i!==a.path.at(-2))return fail('visited');return {ok:true,attempt:{...a,path:a.path.slice(0,at+1)},changed:true,backtracked:true}}const reason=R.reason(a.boardSnapshot,a.path,i);return reason?fail(reason):{ok:true,attempt:{...a,path:[...a.path,i]},changed:true}}
function undo(a){return {...a,path:a.path.slice(0,-1)}}
function restart(a){return {...a,path:[]}}
function hint(a,{maxNodes=60000}={}){if(!Number.isInteger(maxNodes)||maxNodes<0)throw Error('Invalid search budget');if(summary(a).won)return {status:'complete'};let budget=maxNodes;
 for(let k=a.path.length;k>=0;k--){const r=R.solve(a.boardSnapshot,a.path.slice(0,k),{maxNodes:budget});budget-=r.nodes;if(r.solution){if(k===a.path.length)return {status:'found',cell:r.solution[k],nodes:maxNodes-budget};return k?{status:'rewind',cell:a.path[k-1],rewindTo:k-1,nodes:maxNodes-budget}:{status:'restart',cell:r.solution[0],nodes:maxNodes-budget}}if(r.exhausted||budget<=0)return {status:'limited',nodes:maxNodes-budget}}
 return {status:'unsolvable',nodes:maxNodes-budget};
}
function restoreAttempt(raw){if(!raw||!byId.has(raw.stageId)||raw.schemaVersion!==1||!Array.isArray(raw.path))throw Error('Invalid attempt');const a=createAttempt(raw.stageId,{seed:uint(raw.seed),attemptNumber:Number.isInteger(raw.attemptNumber)&&raw.attemptNumber>=0?raw.attemptNumber:0});if(raw.puzzleId!==a.puzzleId)throw Error('Puzzle identity mismatch');
 // Persisted snapshots must match deterministic identity; never silently swap a changed board.
 if(!raw.boardSnapshot)throw Error('Missing board snapshot');for(const k of ['size','width','height','cells','start','walls','pins','solution'])if(JSON.stringify(raw.boardSnapshot[k])!==JSON.stringify(a.boardSnapshot[k]))throw Error('Board snapshot mismatch');
 for(const i of raw.path){if(!R.legal(a.boardSnapshot,a.path,i))throw Error('Invalid saved path');a.path.push(i)}return a;
}
function initialState(){return {schemaVersion:1,contentVersion:C.contentVersion,permanent:{completedStageIds:[]},attempts:{},activeStageId:C.stages[0].stageId}}
function restore(raw){if(typeof raw==='string')raw=JSON.parse(raw);if(!raw||raw.schemaVersion!==1||raw.contentVersion!==C.contentVersion)throw Error('Unsupported save version');const state=initialState(),warnings=[];
 const ids=new Set(Array.isArray(raw.permanent?.completedStageIds)?raw.permanent.completedStageIds:[]);state.permanent.completedStageIds=C.stages.filter(s=>ids.has(s.stageId)).map(s=>s.stageId);
 // Only retain a contiguous earned prefix; malformed saves cannot unlock later chapters.
 let gap=false;state.permanent.completedStageIds=C.stages.filter(s=>{if(!ids.has(s.stageId))gap=true;return !gap}).map(s=>s.stageId);
 if(raw.attempts&&typeof raw.attempts==='object')for(const id of Object.keys(raw.attempts)){try{const a=restoreAttempt(raw.attempts[id]);if(a.stageId!==id)throw Error('ID mismatch');state.attempts[id]=a}catch(e){warnings.push({stageId:id,reason:e.message})}}
 if(byId.has(raw.activeStageId))state.activeStageId=raw.activeStageId;return {state,warnings};
}
function serialize(state){return JSON.stringify(state)}
function unlocked(state,id){const s=getStage(id);return !s.unlockAfter||state.permanent.completedStageIds.includes(s.unlockAfter)}
function artwork(state,chapterId,{mode='permanent',attempt=null}={}){const chapter=getChapter(chapterId);let amount;
 if(mode==='permanent'){amount=0;for(const id of chapter.stageIds){if(state.permanent.completedStageIds.includes(id))amount++;else break}}
 else if(mode==='attempt'){if(!attempt||attempt.chapterId!==chapterId)throw Error('Attempt chapter mismatch');amount=getStage(attempt.stageId).order-1+(chapter.artwork.revealGroupsPerStage?attempt.path.length/chapter.artwork.revealGroupsPerStage:Math.max(0,attempt.path.length-1)/(attempt.boardSnapshot.cells.length-1))}else throw Error('Unknown artwork mode');
 const layers=chapter.artwork.layerUrls.map((url,i)=>({layerId:getStage(chapter.stageIds[i]).reveal.layerId,url,progress:Math.max(0,Math.min(1,amount-i)),masterId:chapter.artwork.masterId}));
 return {mode,chapterId,amount,layers,catVisible:!!chapter.artwork.cat&&amount>chapter.artwork.cat.layerIndex,artworkStatus:chapter.artworkStatus,masterId:chapter.artwork.masterId};
}
function createSession({saved=null,storage=null,storageKey='dotiro.chapters.v1',unlockAll=false}={}){let state=initialState(),warnings=[],saveError=null;
 try{const raw=saved??storage?.getItem(storageKey);if(raw){const result=restore(raw);state=result.state;warnings=result.warnings}}catch(e){warnings.push({reason:e.message})}
 const persist=()=>{try{storage?.setItem(storageKey,serialize(state));saveError=null}catch(e){saveError=e.message}};
 const active=()=>state.attempts[state.activeStageId]||null;
 const commit=a=>{state.attempts[a.stageId]=a;if(summary(a).won&&unlocked(state,a.stageId)&&!state.permanent.completedStageIds.includes(a.stageId))state.permanent.completedStageIds.push(a.stageId);persist();return clone(a)};
 function open(stageId,{replay=false}={}){getStage(stageId);if(!unlockAll&&!unlocked(state,stageId))return {ok:false,reason:'locked'};const old=state.attempts[stageId];let a=old;
 if(replay){if(!state.permanent.completedStageIds.includes(stageId)&&!unlockAll)return {ok:false,reason:'not-completed'};let seed=((old?.seed||0)+1)>>>0;if(!seed)seed=1;a=createAttempt(stageId,{seed,attemptNumber:(old?.attemptNumber||0)+1});while(old&&JSON.stringify([a.boardSnapshot.cells,a.boardSnapshot.walls,a.boardSnapshot.start])===JSON.stringify([old.boardSnapshot.cells,old.boardSnapshot.walls,old.boardSnapshot.start])){seed=(seed+1)>>>0||1;a=createAttempt(stageId,{seed,attemptNumber:a.attemptNumber})}}
 else if(!a)a=createAttempt(stageId);
 state.activeStageId=stageId;commit(a);return {ok:true,attempt:clone(a)};
 }
 return {open,get state(){return clone(state)},get attempt(){const a=active();return a?clone(a):null},get warnings(){return clone(warnings)},get saveError(){return saveError},isUnlocked:id=>unlockAll||unlocked(state,id),move(i,options){if(!active())return {ok:false,reason:'no-attempt'};const r=move(active(),i,options);if(r.ok)commit(r.attempt);return {...r,attempt:r.attempt?clone(r.attempt):null}},undo(){if(!active())return null;return commit(undo(active()))},restart(){if(!active())return null;return commit(restart(active()))},hint(options){return active()?hint(active(),options):{status:'no-attempt'}},artwork(chapterId,options){return artwork(state,chapterId,options)},serialize:()=>serialize(state)};
}
function toLegacyBoard(b){return {...clone(b),id:b.stageId,chapter:b.chapterId,cells:b.cells.map(c=>c===null?null:C.symbolIds[c])}}
return {version:1,get catalog(){return clone(C)},rules:R,getStage,getChapter,boardFor,createAttempt,restoreAttempt,move,undo,restart,summary,hint,initialState,restore,serialize,unlocked,artwork,createSession,toLegacyBoard};
});
