// ランクの総合の強さの目安：武器を1つずつ Lv4 で持たせ、近くの敵に寄って戦わせる。敵の HP は40倍（倒しきって無駄になる分を減らす）。
// 3回ずつ200秒の与えたダメージの平均。node tests/rank.js [武器,武器…]
const {chromium}=require('playwright'),path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:960,height:540}});const er=[];p.on('pageerror',e=>er.push(e.message));
await p.goto('file://'+path.resolve(__dirname,'../index.html'));await p.waitForTimeout(1000);
const ks=process.argv[2]?process.argv[2].split(','):await p.evaluate(()=>Object.keys(GM.W));const out={};
for(const k of ks){out[k]=await p.evaluate((k)=>{let tot=0;for(let rep=0;rep<3;rep++){GM.STG='forest';GM.CHI=0;GM.newRun();const P=GM.P;P.ws=[{k,lv:4,t:.2,dm:0,oi:0}];GM.stats();
 for(let i=0;i<60*200;i++){P.hp=P.s.mhp;GM.TW.forEach(t=>{t.hp=t.mhp;t.t=99});for(const e of GM.EN)if(!e.dead&&!e.lamp&&!e._m){e._m=1;e.hp*=40;e.mhp*=40}
  let b=null,bd=1e9;for(const e of GM.EN){if(e.dead||e.lamp)continue;const d=Math.hypot(e.x-P.x,e.y-P.y);if(d<bd){bd=d;b=e}}if(b&&bd>110){P.x+=(b.x-P.x)/bd*2;P.y+=(b.y-P.y)/bd*2;P.dx=(b.x-P.x)/bd;P.dy=(b.y-P.y)/bd;P.face=b.x>P.x?1:-1}GM.update(1/60)}tot+=P.ws[0].dm}return Math.round(tot/3)},k)}
console.log(JSON.stringify(out));console.log(JSON.stringify(er.slice(0,3)));await b.close()})();
