import fs from 'node:fs/promises';
const tabs=await (await fetch('http://127.0.0.1:9223/json/list')).json();
const tab=tabs.find(t=>t.type==='page');
const ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let id=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}};
function call(method,params={}){return new Promise((resolve,reject)=>{const i=++id;pending.set(i,{resolve,reject});ws.send(JSON.stringify({id:i,method,params}))})}
await call('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:8,mobile:false});
await call('Page.navigate',{url:'http://127.0.0.1:3000/case-study.html'});
await new Promise(r=>setTimeout(r,1500));
await call('Runtime.evaluate',{expression:"document.fonts.ready",awaitPromise:true});
await call('Runtime.evaluate',{expression:`(async()=>{const hero=document.getElementById('final-screens-overview');await Promise.all([...hero.querySelectorAll('img')].map(i=>i.decode()));document.body.innerHTML='<section class="final-page" style="padding:0;margin:0">'+hero.outerHTML+'</section>';await Promise.all([...document.images].map(i=>i.decode()));document.body.style.margin='0';const h=document.querySelector('.final-overview');h.style.margin='0';h.style.width='1600px';h.style.height='1120px'})()`,awaitPromise:true});
await call('Emulation.setDeviceMetricsOverride',{width:1600,height:1120,deviceScaleFactor:8,mobile:false});
const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width:1600,height:1120,scale:1}});
const out='design/case-study/png-exports/final-screens-overview-8x.png';await fs.writeFile(out,Buffer.from(r.data,'base64'));
console.log(out);ws.close();
