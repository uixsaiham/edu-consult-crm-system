import fs from 'node:fs/promises';
const tabs=await (await fetch('http://127.0.0.1:9223/json/list')).json();
const tab=tabs.find(t=>t.type==='page');
const ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let id=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}};
function call(method,params={}){return new Promise((resolve,reject)=>{const i=++id;pending.set(i,{resolve,reject});ws.send(JSON.stringify({id:i,method,params}))})}
await call('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
await call('Page.navigate',{url:'file:///Users/saiham.info21gmail.com/Documents/Dev%20Projects/BHE%20CRM/design/case-study/dashboard-mockups/crm-case-study-cover.html'});
await new Promise(r=>setTimeout(r,1500));
await call('Runtime.evaluate',{expression:"Promise.all([document.fonts.ready,...[...document.images].map(i=>i.decode())])",awaitPromise:true});
const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width:1600,height:1000,scale:4}});
const out='design/case-study/dashboard-mockups/crm-case-study-cover-4x.png';await fs.writeFile(out,Buffer.from(r.data,'base64'));await fs.copyFile(out,'output/case-study-images/case-study-thumbnail-6400x4000.png');console.log(JSON.stringify({file:out,width:6400,height:4000}));ws.close();
