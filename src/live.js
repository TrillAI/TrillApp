// Captures the application's own player, not other applications or protected media.
// The queue is bounded: if inference cannot keep up, stop and report the gap.
export class LiveTranscriber {
  constructor({player, onText, onStatus, onError, onDone = () => {}, workerFactory = () => new Worker(new URL('./worker.js', import.meta.url), {type:'module'}), contextFactory = () => new AudioContext()}) {
    Object.assign(this, {player, onText, onStatus, onError, onDone, workerFactory, contextFactory});
    this.queue=[]; this.frames=[]; this.frameLength=0; this.running=false; this.inFlight=false; this.ending=false;
  }
  async start() {
    this.context=this.contextFactory();
    // A MediaElementAudioSourceNode may only be created once per element.
    this.source=this.context.createMediaElementSource(this.player);
    this.processor=this.context.createScriptProcessor(4096, 1, 1);
    this.source.connect(this.context.destination); this.source.connect(this.processor); this.processor.connect(this.context.destination);
    this.worker=this.workerFactory();
    this.worker.onmessage=({data})=>{
      if(!this.running)return;
      if(data.type==='progress') this.onStatus('Loading speech model; audio is being buffered…');
      if(data.type==='pass') this.onStatus('Listening and transcribing…');
      if(data.type==='error') return this.fail('Speech model failed: '+data.message);
      if(data.type==='done'){
        this.inFlight=false;
        const text=data.results?.[0]?.trim(); if(text)this.onText(text);
        this.drain();
        if(this.ending && !this.inFlight && !this.queue.length){this.stop();this.onDone();}
      }
    };
    this.worker.onerror=e=>this.fail('Speech worker failed: '+e.message);
    this.processor.onaudioprocess=e=>this.capture(e.inputBuffer.getChannelData(0));
    this.running=true;
    this.onEnded=()=>{this.ending=true;this.flush();if(!this.running)return;if(!this.inFlight && !this.queue.length){this.stop();this.onDone();}else this.onStatus('Playback ended; finishing buffered audio…');};
    this.player.addEventListener('ended',this.onEnded);
    try { await this.context.resume(); if(!this.running)return; await this.player.play(); }
    catch(e) { this.stop(); throw e; }
    if(this.running)this.onStatus('Listening to the selected player. Transcripts are saved as chunks finish.');
  }
  capture(input) {
    if(!this.running || this.player.paused)return;
    this.frames.push(new Float32Array(input)); this.frameLength+=input.length;
    if(this.frameLength < this.context.sampleRate*12)return;
    this.flush();
  }
  flush() {
    if(!this.frameLength || !this.running)return;
    const data=new Float32Array(this.frameLength);let offset=0;
    for(const frame of this.frames){data.set(frame,offset);offset+=frame.length;}
    this.frames=[];this.frameLength=0;
    const size=Math.floor(data.length*16000/this.context.sampleRate), audio=new Float32Array(size);
    for(let i=0;i<size;i++) {const x=i*this.context.sampleRate/16000, lo=Math.floor(x), hi=Math.min(lo+1,data.length-1);audio[i]=data[lo]+(data[hi]-data[lo])*(x-lo);}
    if(this.queue.length>=5) return this.fail('Transcription could not keep up with the stream. Stopped to avoid silently dropping audio. Try a faster device or shorter recording.');
    this.queue.push(audio);this.drain();
  }
  drain() {
    if(!this.running || this.inFlight || !this.queue.length)return;
    this.inFlight=true;const audio=this.queue.shift();this.worker.postMessage({audio,passes:1},[audio.buffer]);
  }
  fail(message) {if(!this.running)return;this.stop();this.onError(message);}
  stop() {
    this.running=false;this.player.removeEventListener('ended',this.onEnded);this.queue=[];this.frames=[];this.frameLength=0;
    if(this.processor){this.processor.onaudioprocess=null;this.processor.disconnect();}
    this.source?.disconnect();this.worker?.terminate();this.context?.close().catch(()=>{});
    this.player.pause();
  }
}
