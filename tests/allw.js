// 武器を全部持たせて動かす（エラーと見た目の確認）：node tests/allw.js 出力先 [進化=1]
const {chromium}=require('playwright'),path=require('path');const out=process.argv[2],evo=process.argv[3]==='1';
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:960,height:540}});const er=[];p.on('pageerror',e=>er.push(e.message));
await p.goto('file://'+path.resolve(__dirname,'../index.html'));await p.waitForTimeout(1200);
const ks=await p.evaluate(()=>Object.keys(GM.W));const groups=[];for(let i=0;i<ks.length;i+=6)groups.push(ks.slice(i,i+6));
for(let gi=0;gi<groups.length;gi++){const r=await p.evaluate(([gr,evo,STILL])=>{GM.STG='forest';GM.CHI=0;GM.newRun();const P=GM.P;P.ws=gr.map(k=>({k,lv:8,t:.2,dm:0,evo:evo?1:0}));P.pas={crit:5,vamp:5,rev:1,inv:5,slow:5,barr:5};GM.stats();
 for(let i=0;i<60*60*6;i++){P.hp=P.s.mhp;const a=i/600;if(!STILL){P.x+=Math.cos(a)*.6;P.y+=Math.sin(a)*.6}if(GM.MODE==="lv"){GM.MODE="play"}if(GM.MODE==='chest'){GM.MODE='play';GM.CHST=null}GM.update(1/60)}return P.ws.map(w=>w.k+':'+Math.round(w.dm)).join(' ')},[groups[gi],evo,!!process.env.STILL]);
 await p.waitForTimeout(400);await p.screenshot({path:out+'/allw'+gi+(evo?'e':'')+'.png'});console.log(r)}
console.log(JSON.stringify(er.slice(0,5)));await b.close()})();
