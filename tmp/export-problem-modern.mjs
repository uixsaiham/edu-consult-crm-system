import fs from 'node:fs/promises';
const tabs=await (await fetch('http://127.0.0.1:9223/json/list')).json();
const tab=tabs.find(t=>t.type==='page');
const ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let id=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}};
function call(method,params={}){return new Promise((resolve,reject)=>{const i=++id;pending.set(i,{resolve,reject});ws.send(JSON.stringify({id:i,method,params}))})}
await call('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:4,mobile:false});
await call('Page.navigate',{url:'http://127.0.0.1:3000/case-study.html'});
await new Promise(r=>setTimeout(r,1500));
await call('Runtime.evaluate',{expression:"document.fonts.ready",awaitPromise:true});
await call('Runtime.evaluate',{expression:`(()=>{const section=document.getElementById('problem-goals');document.body.innerHTML=section.outerHTML;document.body.style.margin='0';const el=document.getElementById('problem-goals');el.style.width='1600px';el.style.maxWidth='none';el.style.margin='0'})()`,awaitPromise:true});
await call('Runtime.evaluate',{expression:"document.fonts.ready",awaitPromise:true});
const size=await call('Runtime.evaluate',{expression:"Math.ceil(document.getElementById('problem-goals').getBoundingClientRect().height)",returnByValue:true});const height=size.result.value;
await call('Emulation.setDeviceMetricsOverride',{width:1600,height,deviceScaleFactor:4,mobile:false});
const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width:1600,height,scale:1}});
const out='design/case-study/png-exports/04-problem-goals-modern-4x.png';await fs.writeFile(out,Buffer.from(r.data,'base64'));
await call('Emulation.setDeviceMetricsOverride',{width:1600,height,deviceScaleFactor:1,mobile:false});const preview=await call('Page.captureScreenshot',{format:'jpeg',quality:85});await fs.writeFile('/private/tmp/bhe-problem-modern.jpg',Buffer.from(preview.data,'base64'));console.log(JSON.stringify({out,width:6400,height:height*4}));ws.close();
