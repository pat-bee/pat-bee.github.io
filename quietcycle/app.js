'use strict';
const $=id=>document.getElementById(id), events=Array.from({length:25},(_,c)=>[4,6,12].map((n,k)=>({time:c*12+n,kind:c===24&&k===2?3:k}))).flat();
let ctx,master,track,source,testSource,wake,offset=0,anchor=0,running=false,completed=false,busy=false,testing=false,lastEvent=-1,flashTimer;
const supportsVibration=typeof navigator.vibrate==='function';
$('support').textContent=supportsVibration?'Brief vibration is available in this browser.':'iPhone Safari does not support timed vibration. You’ll hear the chimes and see a soft visual cue.';
function toneInto(data,start,kind,rate){
// Warm, clear, and rounded: one shared fundamental with distinct envelopes and spectra.
const profiles=[{weights:[1,.10,.025],attack:.025,decay:2.8,duration:1.65},
{weights:[1,.46,.22],attack:.008,decay:4,duration:1.3},
{weights:[1,.04,.34],attack:.045,decay:2.4,duration:1.9},
{weights:[1],attack:.08,decay:.30,duration:10}];
const p=profiles[kind];
for(let i=0;i<Math.round(rate*p.duration);i++){
const t=i/rate,tail=kind===3?Math.pow(Math.max(0,1-t/10),.7):Math.min(1,(p.duration-t)/.08);
const env=Math.min(1,t/p.attack)*Math.exp(-t*p.decay)*tail;
let sample=0;for(let h=0;h<p.weights.length;h++)sample+=p.weights[h]*Math.exp(-t*h*(kind===3?0:2))*Math.sin(2*Math.PI*432*(h+1)*t);
const index=Math.round(start*rate)+i;if(index<data.length)data[index]+=sample*env*.3;
}}
async function audio(){
// Select media playback before creating/resuming Web Audio on iOS.
try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch{}
if(!ctx){ctx=new(window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=Number($('volume').value)/100;master.connect(ctx.destination);ctx.onstatechange=()=>{if(running&&ctx.state!=='running')pause('Audio interrupted. Tap Resume to continue.');};}
// Resume directly in the tap handler, before preparing the long sound buffer.
const resumed=ctx.resume();
const unlock=ctx.createBufferSource();unlock.buffer=ctx.createBuffer(1,1,ctx.sampleRate);unlock.connect(master);unlock.start();
await Promise.race([resumed,new Promise((_,reject)=>setTimeout(()=>reject(Error('Audio start timed out')),5000))]);
if(ctx.state!=='running')throw Error('Audio could not start');
if(!track){track=ctx.createBuffer(1,Math.ceil(310*22050),22050);for(const e of events)toneInto(track.getChannelData(0),e.time,e.kind,22050);}
}
function stopSource(){testing=false;$('haptic-test').dataset.audioState='idle';if(source){source.onended=null;try{source.stop();}catch{}source=null;}if(testSource){try{testSource.stop();}catch{}testSource=null;}}
async function keepAwake(){try{if(navigator.wakeLock)wake=await navigator.wakeLock.request('screen');}catch{}}
function release(){if(wake){wake.release().catch(()=>{});wake=null;}}
function elapsed(){return running?Math.min(310,offset+Math.max(0,ctx.currentTime-anchor)):offset;}
function paint(){const t=elapsed(),seconds=Math.max(0,Math.ceil(300-t)),phase=t%12,index=phase<4?0:phase<6?1:2;$('time').textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');$('ring').style.strokeDashoffset=754*Math.min(t,300)/300;document.querySelectorAll('.step').forEach((el,i)=>el.classList.toggle('active',!completed&&t<300&&i===index));$('cycle').textContent=completed?'25 cycles complete':t>=300?'Closing tone · '+Math.ceil(310-t)+'s remaining':(running||offset>0)?`Cycle ${Math.min(25,Math.floor(t/12)+1)} of 25 · next chime in ${Math.ceil(([4,6,12][index])-phase)}s`:'25 cycles · 12 seconds each';}
function pause(message='Paused. Take your time.'){if(!running)return;offset=elapsed();running=false;stopSource();release();$('toggle').textContent='Resume';$('status').textContent=message;paint();}
async function start(reset=false){if(busy)return;busy=true;$('toggle').disabled=true;try{await audio();stopSource();if(reset||completed){offset=0;lastEvent=-1;completed=false;}source=ctx.createBufferSource();source.buffer=track;source.connect(master);anchor=ctx.currentTime;source.start(0,offset);running=true;$('toggle').textContent='Pause';$('status').textContent=offset>=300?'Closing tone · slowly fading.':'Follow the gentle chimes.';keepAwake();}catch(e){$('status').textContent='Audio was blocked. Open this page directly in Safari and tap Start again.';}finally{busy=false;$('toggle').disabled=false;paint();}}
$('toggle').onclick=()=>running?pause():start();$('restart').onclick=()=>{if(busy)return;if(running)pause();start(true);};
$('volume').oninput=()=>{const v=Number($('volume').value);$('level').textContent=v+'%';if(master)master.gain.setTargetAtTime(v/100,ctx.currentTime,.03);};
async function playTest(hapticOnly=false){
if(running||busy||testing)return;
testing=true;
const button=$('haptic-test');
button.dataset.audioState='starting';
$('preview').disabled=true;button.disabled=true;
try{
await audio();
stopSource();testing=true;
const duration=hapticOnly?1.65:16.5;
const buffer=ctx.createBuffer(1,Math.ceil(22050*duration),22050);
if(hapticOnly)toneInto(buffer.getChannelData(0),0,0,22050);
else [0,2,4,6.5].forEach((t,i)=>toneInto(buffer.getChannelData(0),t,i,22050));
const player=ctx.createBufferSource();player.buffer=buffer;player.connect(master);testSource=player;
player.onended=()=>{if(testSource===player){testSource=null;testing=false;button.dataset.audioState='idle';$('preview').disabled=running;button.disabled=running;}};
player.start();
button.dataset.audioState='playing';
$('status').textContent=hapticOnly?'One chime playing. Vibration requires the Safari share-sheet shortcut.':'Three longer chimes, followed by the 10-second closing tone.';
}catch{
testing=false;button.dataset.audioState='failed';$('preview').disabled=false;button.disabled=false;
$('status').textContent='Sound could not start. Open in Safari and tap the test button directly first.';
}}
$('preview').onclick=()=>playTest(false);
$('haptic-test').onclick=()=>playTest(true);
$('copy-shortcut').onclick=async()=>{try{await navigator.clipboard.writeText($('shortcut-code').value);$('copy-status').textContent='Copied. Paste into the shortcut’s JavaScript action.';}catch{$('shortcut-code').focus();$('shortcut-code').select();$('copy-status').textContent='Select and copy the code shown below.';}};
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(running)pause('Paused while away. Tap Resume to continue.');else stopSource();}});
setInterval(()=>{if(running){const t=elapsed();let latest=lastEvent;while(latest+1<events.length&&events[latest+1].time<=t)latest++;if(latest!==lastEvent){lastEvent=latest;if(t-events[latest].time<.3){if(events[latest].kind===0&&supportsVibration)navigator.vibrate(20);document.body.classList.add('flash');clearTimeout(flashTimer);flashTimer=setTimeout(()=>document.body.classList.remove('flash'),180);}}if(t>=300&&t<310)$('status').textContent='Closing tone · slowly fading.';if(t>=310){offset=310;running=false;completed=true;release();$('toggle').textContent='Start again';$('status').textContent='Session complete. A moment well spent.';}}$('preview').disabled=running||busy||testing;$('haptic-test').disabled=running||busy||testing;paint();},50);
