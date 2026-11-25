// 拠点戦の画面を撮る：node tests/td.js 出力先 [スマホ=1]（地図全体・本塔・門・店・音量、塔を押して店が開くか、ずらすと押されないか）
const {chromium,devices}=require('playwright'),path=require('path'),fs=require('fs');const out=process.argv[2];fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch();const mob=process.argv[3]==='1';const c=mob?await b.newContext({...devices['iPhone 13 landscape']}):await b.newContext({viewport:{width:960,height:540}});const p=await c.newPage();const er=[];p.on('pageerror',e=>er.push(e.message));
await p.goto('file://'+path.resolve(__dirname,'../index.html'));await p.waitForTimeout(1200);const res={};
for(const s of['forest','sunk','hall','jungle','temple','heaven']){
 await p.evaluate(s=>{GM.STG=s;GM.CHI=0;GM.newRun();for(let i=0;i<60*70;i++){GM.P.hp=GM.P.s.mhp;GM.P.x=GM.MAP.base.x;GM.P.y=GM.MAP.base.y+90;GM.update(1/60)}},s);
 await p.waitForTimeout(200);await p.screenshot({path:`${out}/${s}_base.png`});
 // 全体図
 await p.evaluate(()=>{const M=GM.MAP;const c=document.createElement('canvas');c.width=M.W/8;c.height=M.H/8;c.id='full';const g=c.getContext('2d');for(let y=0;y<M.h;y++)for(let x=0;x<M.w;x++){const v=M.c[y*M.w+x];g.fillStyle=['#8a8','#333','#46a','#363'][v];g.fillRect(x*4,y*4,4,4)}g.fillStyle='#fd0';g.fillRect(M.base.x/8-6,M.base.y/8-6,12,12);g.fillStyle='#f30';for(const q of M.gates)g.fillRect(q.x/8-5,q.y/8-5,10,10);document.body.appendChild(c);c.style.cssText='position:fixed;left:0;top:0;z-index:99;background:#000'});
 await p.locator('#full').screenshot({path:`${out}/${s}_map.png`});await p.evaluate(()=>document.getElementById('full').remove());
 const g=await p.evaluate(()=>{const q=GM.MAP.gates[0];GM.P.x=q.x;GM.P.y=q.y;for(let i=0;i<20;i++)GM.update(1/60);return GM.MAP.gates.length});
 await p.waitForTimeout(200);await p.screenshot({path:`${out}/${s}_gate.png`});res[s]={gates:g};
}
// 本塔を押して店
await p.evaluate(()=>{GM.STG='forest';GM.newRun();GM.P.x=GM.MAP.base.x+60;GM.P.y=GM.MAP.base.y+70;for(let i=0;i<30;i++)GM.update(1/60)});await p.waitForTimeout(200);
const cv=await p.evaluate(()=>{const c=document.querySelector('canvas').getBoundingClientRect();const[cx,cy,K]=GM.CAM;const t=GM.TW[0];return{x:c.left+(t.x-cx)*c.width/(document.querySelector('canvas').width/K),y:c.top+(t.y-60-cy)*c.height/(document.querySelector('canvas').height/K)}});
await p.mouse.move(cv.x,cv.y);await p.mouse.down();await p.mouse.move(cv.x+60,cv.y+40,{steps:4});await p.mouse.up();res.dragNoShop=!(await p.evaluate(()=>GM.SHOPO));
await p.mouse.move(cv.x,cv.y);await p.mouse.down();await p.mouse.up();await p.waitForTimeout(250);res.tapShop=await p.evaluate(()=>GM.SHOPO);
await p.screenshot({path:`${out}/shop.png`});
await p.keyboard.press('Escape');await p.keyboard.press('Escape');await p.waitForTimeout(250);await p.screenshot({path:`${out}/pause.png`});
console.log(JSON.stringify({res,er}));await b.close()})();
