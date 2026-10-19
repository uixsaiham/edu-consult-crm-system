import fs from 'node:fs/promises';
const tabs=await (await fetch('http://127.0.0.1:9223/json/list')).json();
const tab=tabs.find(t=>t.type==='page');
const ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let id=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}};
function call(method,params={}){return new Promise((resolve,reject)=>{const i=++id;pending.set(i,{resolve,reject});ws.send(JSON.stringify({id:i,method,params}))})}
async function evaluate(expression){const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
await call('Emulation.setDeviceMetricsOverride',{width:1600,height:1100,deviceScaleFactor:1,mobile:false});
await call('Page.navigate',{url:'http://127.0.0.1:3000/leads'});
let ready=false;for(let i=0;i<90&&!ready;i++){ready=await evaluate("!!document.querySelector('table tbody tr td:nth-child(11)')");if(!ready)await new Promise(r=>setTimeout(r,500))}if(!ready)throw Error('Leads did not load');
await evaluate(`(async()=>{await document.fonts.ready;const style=document.createElement('style');style.textContent='nextjs-portal{display:none!important}';document.head.append(style)})()`);
await evaluate(`(()=>{const table=document.querySelector('table');const available=table.parentElement.clientWidth;const natural=table.scrollWidth;if(natural>available)table.style.zoom=String(available/natural)})()`);
const height=await evaluate("Math.max(1100,document.querySelector('main').scrollHeight+document.querySelector('main').getBoundingClientRect().top+24)");
await call('Emulation.setDeviceMetricsOverride',{width:1600,height,deviceScaleFactor:1,mobile:false});
const metrics=await evaluate(`(()=>{const t=document.querySelector('table'),p=t.parentElement;return {rows:t.tBodies[0].rows.length,columns:t.tHead.rows[0].cells.length,tableWidth:Math.round(t.getBoundingClientRect().width),availableWidth:p.clientWidth,mainHeight:document.querySelector('main').clientHeight,mainScrollHeight:document.querySelector('main').scrollHeight,height:innerHeight}})()`);
if(metrics.tableWidth>metrics.availableWidth||metrics.mainScrollHeight>metrics.mainHeight)throw Error('Table is clipped: '+JSON.stringify(metrics));
const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width:1600,height,scale:4}});
for(const path of ['public/final-ui-screens/02-lead-management-4x.png','design/case-study/crm-screens-4x/02-lead-management-4x.png'])await fs.writeFile(path,Buffer.from(r.data,'base64'));
const preview=await call('Page.captureScreenshot',{format:'jpeg',quality:80});await fs.writeFile('/private/tmp/bhe-leads-preview.jpg',Buffer.from(preview.data,'base64'));
console.log(JSON.stringify(metrics));ws.close();
