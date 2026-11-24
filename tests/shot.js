// 見せる用：node tests/shot.js 出力.png [場所] [キャラ番号] [分]
const {chromium}=require('playwright'),path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:960,height:540},deviceScaleFactor:1});const er=[];p.on('pageerror',e=>er.push(e.message));
await p.goto('file://'+path.resolve(__dirname,'../index.html'));await p.waitForTimeout(1500);
const [stg,chi,min]=[process.argv[3]||'jungle',+(process.argv[4]||0),+(process.argv[5]||6)];
await p.evaluate(([stg,chi,min])=>{GM.STG=stg;GM.CHI=chi;GM.newRun();for(let i=0;i<60*60*min;i++){const P=GM.P;P.hp=P.s.mhp;const a=i/600;P.x+=Math.cos(a)*.6;P.y+=Math.sin(a)*.6;if(GM.MODE==='lv')GM.pickOpt(0);if(GM.MODE==='chest'){GM.MODE='play';GM.CHST=null}GM.update(1/60)}},[stg,chi,min]);
await p.waitForTimeout(400);await p.screenshot({path:process.argv[2]});console.log(JSON.stringify(er));await b.close()})();
