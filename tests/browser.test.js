import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { indexedDB } from 'fake-indexeddb';
import { createServer } from 'vite';
import http from 'node:http';

const waitFor = async (check) => {
  for (let i=0; i<200; i++) { if (check()) return; await new Promise(r=>setTimeout(r,10)); }
  throw new Error('Timed out waiting for UI state');
};

test('Cloudflare tunnel host is allowed but arbitrary hosts are not', async () => {
  const server = await createServer({server:{port:0}});
  await server.listen();
  try {
    const port=server.httpServer.address().port;
    const requestHost=host=>new Promise((resolve,reject)=>http.get({host:'127.0.0.1',port,headers:{host}},r=>{r.resume();r.on('end',()=>resolve(r.statusCode))}).on('error',reject));
    assert.equal(await requestHost('example.trycloudflare.com'),200);
    assert.equal(await requestHost('evil.example'),403);
  } finally { await server.close(); }
});

test('UI consent, save, search, cancellation, mocked recognition and delete', {timeout:30000}, async () => {
  const bundle=await build({entryPoints:['src/main.js'],bundle:true,write:false,format:'iife',platform:'browser',loader:{'.css':'empty'},define:{'import.meta.url':'"https://example.test/main.js"'}});
  const dom=new JSDOM('<!doctype html><div id="app"></div>',{url:'https://example.test/',runScripts:'dangerously'});
  const w=dom.window;
  Object.defineProperty(w,'indexedDB',{value:indexedDB});
  w.URL.createObjectURL=()=> 'blob:https://example.test/mock'; w.URL.revokeObjectURL=()=>{};
  w.confirm=()=>true;
  let workers=0;
  w.Worker=class {constructor(){workers++}postMessage(){setTimeout(()=>this.onmessage?.({data:{type:'done',results:['Testing one two three']}}),10)}terminate(){}};
  w.AudioContext=class {async decodeAudioData(){return {length:4,numberOfChannels:1,sampleRate:16000,getChannelData:()=>new Float32Array(4)}} async close(){}};
  try {
    w.eval(bundle.outputFiles[0].text);
    const click=selector=>{const e=w.document.querySelector(selector);assert.ok(e,`missing ${selector}`);e.click()};
    click('#skip');click('[data-mode="media"]');
    assert.equal(w.document.querySelector('[data-mode="media"]').getAttribute('aria-pressed'),'true');
    click('[data-action="start"]');click('[data-action="continue"]');
    assert.match(w.document.querySelector('.toast').textContent,/check the agreement/);
    w.document.querySelector('#agree').checked=true;click('[data-action="continue"]');
    await waitFor(()=>w.document.querySelector('#transcript'));
    let textarea=w.document.querySelector('#transcript');textarea.value='Original transcript';textarea.dispatchEvent(new w.Event('input',{bubbles:true}));
    click('[data-action="sync"]');
    await waitFor(()=>w.document.querySelector('.toast')?.textContent.includes('Saved'));
    click('[data-action="library"]');await waitFor(()=>w.document.querySelector('[data-open]'));
    const search=w.document.querySelector('#search');search.value='Original';search.dispatchEvent(new w.Event('input',{bubbles:true}));
    click('[data-open]');await waitFor(()=>w.document.querySelector('#transcript'));
    assert.equal(w.document.querySelector('#transcript').value,'Original transcript');
    let resolveRead;
    const file=w.document.querySelector('#file');
    Object.defineProperty(file,'files',{configurable:true,value:[{name:'slow.wav',arrayBuffer:()=>new Promise(resolve=>{resolveRead=resolve})}]});
    file.dispatchEvent(new w.Event('change',{bubbles:true}));click('[data-action="transcribe"]');click('[data-action="stop"]');
    resolveRead(new ArrayBuffer(16));await new Promise(r=>setTimeout(r,30));
    assert.equal(workers,0,'cancelled preparation must not start a worker');
    assert.match(w.document.querySelector('#status').textContent,/stopped/i);
    Object.defineProperty(file,'files',{configurable:true,value:[{name:'sample.wav',arrayBuffer:async()=>new ArrayBuffer(16)}]});
    file.dispatchEvent(new w.Event('change',{bubbles:true}));
    click('[data-action="transcribe"]');
    await waitFor(()=>w.document.querySelector('#transcript').value.includes('Testing one two three'));
    assert.match(w.document.querySelector('#status').textContent,/review/i);
    click('[data-action="settings"]');await waitFor(()=>w.document.querySelector('#passes'));
    const passes=w.document.querySelector('#passes');passes.checked=true;passes.dispatchEvent(new w.Event('input',{bubbles:true}));
    assert.equal(w.localStorage.getItem('trill-passes'),'7');
    click('[data-action="library"]');await waitFor(()=>w.document.querySelector('[data-open]'));click('[data-open]');
    await waitFor(()=>w.document.querySelector('#transcript'));
    assert.match(w.document.querySelector('#transcript').value,/Testing one two three/);
    click('[data-action="delete"]');await waitFor(()=>w.document.body.textContent.includes('No matching transcripts yet'));
    click('[data-action="home"]');await waitFor(()=>w.document.querySelector('[data-action="start"]'));
    click('[data-action="library"]');await waitFor(()=>w.document.body.textContent.includes('No matching transcripts yet'));
  } finally {w.close()}
});
