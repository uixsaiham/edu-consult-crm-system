import fs from 'node:fs/promises';
const tabs=await (await fetch('http://127.0.0.1:9223/json/list')).json();
const tab=tabs.find(t=>t.type==='page');
const ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let id=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}};
function call(method,params={}){return new Promise((resolve,reject)=>{const i=++id;pending.set(i,{resolve,reject});ws.send(JSON.stringify({id:i,method,params}))})}
await call('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
await call('Page.navigate',{url:'http://127.0.0.1:3000/case-study.html'});
let ready=false;for(let i=0;i<60&&!ready;i++){const r=await call('Runtime.evaluate',{expression:"document.readyState==='complete' && typeof html2canvas==='function'"});ready=r.result.value;if(!ready)await new Promise(r=>setTimeout(r,500))}
const r=await call('Runtime.evaluate',{expression:`(async()=>{await document.fonts.ready;const section=document.getElementById('final-ui');await Promise.all([...section.querySelectorAll('img')].map(async img=>{img.loading='eager';await img.decode()}));const canvas=await html2canvas(section,{scale:4,windowWidth:1600,backgroundColor:'#f7f8fa',useCORS:true,onclone:doc=>{const t=doc.getElementById('final-ui');t.style.width='1600px';t.style.maxWidth='none';t.style.margin='0'}});return {data:canvas.toDataURL('image/png').split(',')[1],width:canvas.width,height:canvas.height}})()`,awaitPromise:true,returnByValue:true});
if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));
const out='design/case-study/png-exports/10-final-ui-high-resolution.png';await fs.writeFile(out,Buffer.from(r.result.value.data,'base64'));console.log(JSON.stringify({file:out,width:r.result.value.width,height:r.result.value.height}));ws.close();
