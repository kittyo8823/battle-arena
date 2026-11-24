// 画面ごとに撮る：node tests/screens.js 出力先 [スマホ=1]
const {chromium,devices}=require('playwright'),path=require('path'),fs=require('fs');const out=process.argv[2];fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch();const c=process.argv[3]==='1'?await b.newContext({...devices['iPhone 13 landscape']}):await b.newContext({viewport:{width:960,height:540}});const p=await c.newPage();const er=[];p.on('pageerror',e=>er.push(e.message));
await p.goto('file://'+path.resolve(__dirname,'../index.html'));await p.waitForTimeout(1500);
const shot=async(n,f)=>{if(f)await p.evaluate(f);await p.waitForTimeout(250);await p.screenshot({path:out+'/'+n+'.png'})};
await shot('title');await shot('char',()=>{GM.MODE='char'});await shot('stage',()=>{GM.MODE='stage'});await shot('shop',()=>{GM.MODE='shop'});
await shot('lv',()=>{GM.STG='heaven';GM.CHI=5;GM.newRun();for(let i=0;i<60*40;i++){GM.P.hp=GM.P.s.mhp;GM.update(1/60);if(GM.MODE==='lv')GM.pickOpt(0)}GM.addXp(999)});
await shot('chest',()=>{GM.MODE='play';GM.openChest(true)});
await shot('result',()=>{GM.MODE='play';GM.CHST=null;GM.endRun()});
console.log(JSON.stringify(er));await b.close()})();
