const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');const E=require('./engine.js');
const stages=E.catalog.stages;assert.equal(stages.length,24);
let variants=0,moves=0;
for(const s of stages)for(let seed=0;seed<40;seed++){
 let a=E.createAttempt(s.stageId,{seed});const before=JSON.stringify(a.boardSnapshot);
 assert.deepEqual(a,E.createAttempt(s.stageId,{seed}));
 assert.equal(E.move(a,undefined).reason,'bounds');assert.equal(E.move(a,-1).reason,'bounds');
 for(const i of a.boardSnapshot.solution){const r=E.move(a,i);assert(r.ok,`${s.stageId}:${seed}:${i}`);a=r.attempt;moves++}
 assert(E.summary(a).won);assert.equal(JSON.stringify(a.boardSnapshot),before);
 assert.deepEqual(E.restoreAttempt(JSON.parse(JSON.stringify(a))),a);
 const restarted=E.restart(a);assert.equal(restarted.path.length,0);assert.equal(restarted.puzzleId,a.puzzleId);assert.equal(JSON.stringify(restarted.boardSnapshot),before);variants++;
}
let persisted;const storage={getItem:()=>persisted,setItem:(_,v)=>{persisted=v}};
let session=E.createSession({storage});assert.equal(session.open('chapter-02-01').reason,'locked');
for(const s of stages){assert(session.open(s.stageId).ok);const a=session.attempt;for(const i of a.boardSnapshot.solution)assert(session.move(i).ok);assert(session.state.permanent.completedStageIds.includes(s.stageId));const permanent=session.artwork(s.chapterId).amount;
 const id=session.attempt.puzzleId;session.open(s.stageId);assert.equal(session.attempt.puzzleId,id);assert(E.summary(session.attempt).won);
 session.open(s.stageId,{replay:true});assert.notEqual(session.attempt.puzzleId,id);assert.equal(session.artwork(s.chapterId).amount,permanent);assert.equal(session.artwork(s.chapterId,{mode:'attempt',attempt:session.attempt}).amount,s.order-1);
 const current=session.attempt;session.move(current.boardSnapshot.start);const once=session.attempt;session.restart();assert.equal(session.attempt.puzzleId,current.puzzleId);session.move(current.boardSnapshot.start);
 session=E.createSession({storage});assert.deepEqual(session.attempt,once);
}
assert.equal(session.state.permanent.completedStageIds.length,24);
for(const s of stages.filter(s=>s.chapterId==='cabin')){const a=E.createAttempt(s.stageId);for(const i of a.boardSnapshot.solution){a.path.push(i);assert.equal(E.artwork(session.state,'cabin',{mode:'attempt',attempt:a}).catVisible,s.order===6&&a.path.length>1)}}
const corrupt=JSON.parse(persisted);corrupt.attempts['chapter-04-06'].boardSnapshot.cells[0]=corrupt.attempts['chapter-04-06'].boardSnapshot.cells[0]===null?0:null;const result=E.restore(corrupt);assert.equal(result.warnings.length,1);assert(!result.state.attempts['chapter-04-06']);assert.equal(result.state.permanent.completedStageIds.length,24);
assert.throws(()=>E.restore({...E.initialState(),contentVersion:'other'}));
const denied=E.createSession({storage:{getItem:()=>null,setItem:()=>{throw Error('quota')}}});denied.open('cabin-01');assert(denied.saveError);assert(denied.move(denied.attempt.boardSnapshot.start).ok);
const report=JSON.parse(fs.readFileSync(__dirname+'/../difficulty-progression/analysis.json','utf8'));const index=report.findIndex(r=>r.witnesses?.length);let dead=E.createAttempt(stages[index].stageId);const w=report[index].witnesses[0];dead.path=w.path.slice(0,w.branchAt+1);const h=E.hint(dead);assert(['rewind','restart'].includes(h.status));assert.equal(E.hint(dead,{maxNodes:0}).status,'limited');
const context={window:{}};vm.runInNewContext(fs.readFileSync(__dirname+'/../difficulty-progression/levels.js','utf8'),context);for(let i=0;i<24;i++)for(const k of ['cells','start','walls','solution'])assert.deepEqual(stages[i][k],JSON.parse(JSON.stringify(context.window.LAB_LEVELS[i][k])));
console.log(JSON.stringify({stages:24,deterministicSolvableVariants:variants,legalMoves:moves,orderedUnlock:'passed',resumeReplayPermanentSeparation:'passed',catGate:'passed',corruptSave:'passed',storageFailure:'passed',hintStatuses:'passed',authoredBoardsUnchanged:'passed'}));
