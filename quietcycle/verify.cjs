// Run with node verify.cjs. The HTML is the application source; no app.js is required.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
assert(!/<script[^>]+src=/i.test(html),'Timer must run without external scripts');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length,1);
const code = scripts[0][1];
function setup({noAudio=false, omitHaptics=false} = {}) {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  const elements = Object.fromEntries(ids.map(id => [id,{value:id==='volume'?'40':'',textContent:'',dataset:{},style:{},disabled:false,focus(){},select(){},click(){if(!this.disabled)return this.onclick?.();}}]));
  if (omitHaptics) for (const id of ['haptic-test','copy-shortcut','shortcut-code','copy-status','support']) delete elements[id];
  let tick, ctx;
  const sources=[], visibility=[];
  class AudioContext {
    constructor(){this.state='running';this.currentTime=0;this.sampleRate=22050;ctx=this;}
    resume(){return Promise.resolve();}
    createGain(){return {gain:{value:0,setTargetAtTime(){}},connect(){}};}
    createBuffer(_,length,rate){const data=new Float32Array(length);return {duration:length/rate,getChannelData(){return data;}};}
    createBufferSource(){const s={connect(){},start(_,position){this.position=position||0;this.started=true;},stop(){this.stopped=true;}};sources.push(s);return s;}
  }
  const document = {documentElement:{dataset:{}},body:{classList:{add(){},remove(){}}},hidden:false,getElementById(id){return elements[id]||null;},querySelectorAll(){return [];},addEventListener(name,fn){if(name==='visibilitychange')visibility.push(fn);}};
  const sandbox = {window:{AudioContext:noAudio?undefined:AudioContext,addEventListener(){}},document,navigator:{vibrate(){throw Error('haptics unavailable');}},console,setInterval(fn){tick=fn;},setTimeout(){},clearTimeout(){}};
  vm.runInNewContext(code,sandbox);
  return {elements,document,sources,get ctx(){return ctx;},tick(){tick();},hide(){document.hidden=true;visibility.forEach(fn=>fn());}};
}
(async()=>{
  const app=setup(), e=app.elements;
  assert.equal(app.document.documentElement.dataset.quietCycleReady,'4');
  await e.toggle.click();
  assert.equal(e.toggle.textContent,'Pause');
  const fullTrack=app.sources.find(s=>s.buffer?.duration===310);
  assert(fullTrack?.started);
  app.ctx.currentTime=4;app.tick();assert.equal(e.time.textContent,'4:56');
  app.ctx.currentTime=6;app.tick();assert.match(e.cycle.textContent,/next chime in 6s/);
  await e.toggle.click();assert.equal(e.toggle.textContent,'Resume');
  app.ctx.currentTime=100;app.tick();assert.equal(e.time.textContent,'4:54');
  await e.toggle.click();assert.equal(app.sources.at(-1).position,6);
  app.ctx.currentTime+=294;app.tick();assert.equal(e.time.textContent,'0:00');assert.match(e.status.textContent,/Closing tone/);
  app.ctx.currentTime+=5;app.tick();await e.toggle.click();
  await e.toggle.click();assert.equal(app.sources.at(-1).position,305);
  app.ctx.currentTime+=5;app.tick();assert.equal(e.toggle.textContent,'Start again');
  assert.match(e.status.textContent,/Session complete/);
  const d=fullTrack.buffer.getChannelData(0);
  function rms(t){let total=0;for(let i=Math.round(t*22050);i<Math.round((t+.1)*22050);i++)total+=d[i]**2;return Math.sqrt(total/2205);}
  assert(rms(300.2)>rms(304)&&rms(304)>rms(309));
  assert(Math.abs(d.at(-1))<1e-5);
  await e.restart.click();assert.equal(e.time.textContent,'5:00');assert.equal(app.sources.at(-1).position,0);
  await e.toggle.click();await e['haptic-test'].click();assert.equal(e['haptic-test'].dataset.audioState,'playing');
  assert(Math.abs(app.sources.at(-1).buffer.duration-1.65)<1/22050);
  app.sources.at(-1).onended();await e.preview.click();assert.equal(app.sources.at(-1).buffer.duration,16.5);
  await e.restart.click();app.ctx.currentTime+=1;app.hide();assert.equal(e.toggle.textContent,'Resume');
  const blocked=setup({noAudio:true});await blocked.elements.toggle.click();assert.equal(blocked.elements.toggle.disabled,false);assert.match(blocked.elements.status.textContent,/Sound could not start/);
  const noHaptics=setup({omitHaptics:true});await noHaptics.elements.toggle.click();assert.equal(noHaptics.elements.toggle.textContent,'Pause');
  console.log('PASS: self-contained bootstrap; controls; 4/6/12 cues; pause/resume; restart; longer previews; 10s closing fade; hidden-page pause; audio failure recovery; optional haptic controls cannot break timer.');
})().catch(error=>{console.error(error);process.exitCode=1;});
