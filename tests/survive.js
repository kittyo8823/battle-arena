// 難しさの目安：簡単な逃げ方で自動に動かし、何分生き残るかを見る。node tests/survive.js [場所] [キャラ] [回数]
const {chromium}=require('playwright'),path=require('path');const stg=process.argv[2]||'forest',chi=+(process.argv[3]||0),N=+(process.argv[4]||3);
(async()=>{const b=await chromium.launch();const p=await b.newPage();const er=[];p.on('pageerror',e=>er.push(e.message));await p.goto('file://'+path.resolve(__dirname,'../index.html'));await p.waitForTimeout(500);
const out=[];for(let r=0;r<N;r++)out.push(await p.evaluate(([stg,chi])=>{GM.STG=stg;GM.CHI=chi;GM.newRun();let i=0;
 for(;i<60*60*31&&GM.MODE!=='result';i++){const P=GM.P;let ax=0,ay=0;for(const e of GM.EN){if(e.dead||e.lamp)continue;const dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy);if(d<140){ax+=dx/d/(d+20);ay+=dy/d/(d+20)}}
  const gm=GM.PK.find(k=>k.ty!=='xp'&&Math.hypot(k.x-P.x,k.y-P.y)<200);if(gm){ax+=(gm.x-P.x)*.0004;ay+=(gm.y-P.y)*.0004}
  const l=Math.hypot(ax,ay);const sp=92*P.s.move/60;if(l>.0005){P.x+=ax/l*sp;P.y+=ay/l*sp}
  if(GM.MODE==='lv')GM.pickOpt(0);if(GM.MODE==='chest'){GM.MODE='play';GM.CHST=null}GM.update(1/60)}
 return [Math.round(GM.TIME),GM.P.lv,GM.KILLS]},[stg,chi]));
console.log(stg,chi,JSON.stringify(out),JSON.stringify(er.slice(0,3)));await b.close()})();
