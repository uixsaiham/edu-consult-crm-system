import fs from 'node:fs/promises';
const tabs=await (await fetch('http://127.0.0.1:9223/json/list')).json();
const tab=tabs.find(t=>t.type==='page');
const ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let id=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}};
function call(method,params={}){return new Promise((resolve,reject)=>{const i=++id;pending.set(i,{resolve,reject});ws.send(JSON.stringify({id:i,method,params}))})}
await call('Emulation.setDeviceMetricsOverride',{width:1600,height:1100,deviceScaleFactor:1,mobile:false});
await call('Page.bringToFront');
await call('Emulation.setFocusEmulationEnabled',{enabled:true});
await call('Page.addScriptToEvaluateOnNewDocument',{source:`window.ResizeObserver=class{constructor(cb){this.cb=cb;this.targets=new Set();this.timer=setInterval(()=>{if(this.targets.size)this.cb([...this.targets].map(target=>({target,contentRect:target.getBoundingClientRect()})),this)},250)}observe(t){this.targets.add(t)}unobserve(t){this.targets.delete(t)}disconnect(){this.targets.clear();clearInterval(this.timer)}}`});
await call('Page.navigate',{url:'http://127.0.0.1:3000/dashboard-export'});
await new Promise(r=>setTimeout(r,1500));
await call('Runtime.evaluate',{expression:`(()=>{const st=document.createElement('style');st.textContent='html,body{height:1100px!important;overflow:hidden!important}body .h-dvh{height:1100px!important;min-height:0!important;overflow:hidden!important}body .h-dvh>aside{height:1100px!important}body .h-dvh>div:last-child{overflow:hidden!important}body main{overflow:hidden!important}nextjs-portal{display:none!important}';document.head.appendChild(st)})()`});
await call('Runtime.evaluate',{expression:`(()=>{document.querySelectorAll('.recharts-responsive-container').forEach(el=>{const rect=el.parentElement.getBoundingClientRect();el.style.width=rect.width+'px';el.style.height=rect.height+'px'});window.dispatchEvent(new Event('resize'))})()`});
await new Promise(r=>setTimeout(r,3000));
const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width:1600,height:1100,scale:4}});
const out='public/final-ui-screens/thumbnail-dashboard-navigation.png';await fs.writeFile(out,Buffer.from(r.data,'base64'));console.log(JSON.stringify({file:out,width:6400,height:4000}));ws.close();
