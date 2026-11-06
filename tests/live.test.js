import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LiveTranscriber } from '../src/live.js';
function harness(){
  const events={}, sent=[], text=[], errors=[], statuses=[];let done=0, closed=0;
  const player={paused:true,play(){this.paused=false;return Promise.resolve()},pause(){this.paused=true},addEventListener(n,f){events[n]=f},removeEventListener(n){delete events[n]}};
  const node=()=>({connect(){},disconnect(){}});
  const processor=node();
  const context={sampleRate:16000,destination:{},createMediaElementSource:node,createScriptProcessor:()=>processor,resume:async()=>{},close:async()=>{closed++}};
  const worker={postMessage(m){sent.push(m)},terminate(){}};
  const live=new LiveTranscriber({player,contextFactory:()=>context,workerFactory:()=>worker,onText:t=>text.push(t),onStatus:t=>statuses.push(t),onError:e=>errors.push(e),onDone:()=>done++});
  return {live,events,sent,text,errors,statuses,worker,player,get done(){return done},get closed(){return closed}};
}
test('live capture queues chunks serially and saves returned text',async()=>{
  const h=harness();await h.live.start();h.live.capture(new Float32Array(16000*12));h.live.capture(new Float32Array(16000*12));
  assert.equal(h.sent.length,1);assert.equal(h.sent[0].audio.length,16000*12);
  h.worker.onmessage({data:{type:'done',results:[' first ']}});assert.deepEqual(h.text,['first']);assert.equal(h.sent.length,2);
  h.worker.onmessage({data:{type:'done',results:['second']}});assert.deepEqual(h.text,['first','second']);h.live.stop();assert.equal(h.closed,1);
});
test('end of finite media flushes its last partial chunk',async()=>{
  const h=harness();await h.live.start();h.live.capture(new Float32Array(16000));h.events.ended();assert.equal(h.sent.length,1);assert.equal(h.sent[0].audio.length,16000);
  h.worker.onmessage({data:{type:'done',results:['last']}});assert.deepEqual(h.text,['last']);assert.equal(h.done,1);assert.equal(h.live.running,false);
});
test('slow recognition stops explicitly when bounded queue fills',async()=>{
  const h=harness();await h.live.start();for(let i=0;i<7;i++)h.live.capture(new Float32Array(16000*12));
  assert.equal(h.live.running,false);assert.match(h.errors[0],/could not keep up/i);assert.equal(h.sent.length,1);
});
