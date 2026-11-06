import { pipeline, env } from '@huggingface/transformers';
env.allowLocalModels = false;
let model;
self.onmessage=async ({data})=>{ try { if (!model) model=await pipeline('automatic-speech-recognition','onnx-community/whisper-tiny',{dtype:'q8',progress_callback: p=>self.postMessage({type:'progress',data:p})}); const results=[]; for(let i=0;i<data.passes;i++){ self.postMessage({type:'pass',current:i+1,total:data.passes}); const result=await model(data.audio,{chunk_length_s:30,stride_length_s:5,task:'transcribe'}); results.push(result.text); } self.postMessage({type:'done',results}); } catch(error){self.postMessage({type:'error',message:error.message || String(error)});} };
