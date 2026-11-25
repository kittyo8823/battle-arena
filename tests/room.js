// 部屋を自動で進める確認：node tests/room.js 出力先 [場所] [キャラ] [無敵=1]
// 一番近い敵を狙い、間合いを取り、報酬は先頭を選び、扉が開いたら右へ。何部屋まで行けたか・被弾・時間
const {chromium}=require('playwright'),path=require('path'),fs=require('fs');const out=process.argv[2]||'/tmp/room';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:960,height:540}});const er=[];p.on('pageerror',e=>er.push(e.message));
await p.goto('file://'+path.resolve(__dirname,'../index.html'));await p.waitForTimeout(1000);
const shots=[];
const r=await p.evaluate(async([stg,chi,god])=>{GM.STG=stg;GM.CHI=chi;GM.newRun();const R0=()=>GM.RM;const log=[];let last=-1;
 for(let i=0;i<60*60*40;i++){if(GM.MODE==='lv')GM.pickOpt(0);if(GM.MODE!=='play')break;const P=GM.P,R=GM.RM;if(god)P.hp=P.s.mhp;
  let b=null,bd=1e9;for(const e of GM.EN){if(e.dead||e.lamp)continue;const d=Math.hypot(e.x-P.x,e.y-P.y);if(d<bd){bd=d;b=e}}
  let mx=0,my=0;const ch=GM.PK.find(k=>k.ty==='chest'&&!k.got);if(R.st==='open'&&ch&&!P._ch){mx=ch.x-P.x;my=ch.y-P.y;if(Math.hypot(mx,my)<20)P._ch=1}else if(R.st==='open'||R.st==='shop'){const M=GM.MAP;if(!M._bd){const D=new Int16Array(M.gw*M.gh).fill(-1),q=[];for(let j=M.door.j0;j<=M.door.j1;j++){const c=j*M.gw+M.gw-1;D[c]=0;q.push(c)}for(let h=0;h<q.length;h++){const c=q[h],x=c%M.gw,y=c/M.gw|0;for(const[a,b2]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+a,ny=y+b2;if(nx<0||ny<0||nx>=M.gw||ny>=M.gh)continue;const n=ny*M.gw+nx;if(D[n]<0&&M.G[n]===0){D[n]=D[c]+1;q.push(n)}}}M._bd=D}
  const i0=Math.floor(P.x/32),j0=Math.floor(P.y/32);let best=null,bv=M._bd[j0*M.gw+i0];for(const[a,b2]of[[1,0],[-1,0],[0,1],[0,-1]]){const v=M._bd[(j0+b2)*M.gw+i0+a];if(v>=0&&(bv<0||v<bv)){bv=v;best=[a,b2]}}if(best){const tx=(i0+best[0]+.5)*32,ty=(j0+best[1]+.5)*32;mx=tx-P.x;my=ty-P.y}else mx=1}else if(b){const dx=b.x-P.x,dy=b.y-P.y;P.ax=dx/bd;P.ay=(dy-12)/bd;const want=GM.P.ws[0].k==="sword"?60:150;if(bd>want+30){mx=dx/bd;my=dy/bd}else if(bd<want-30){mx=-dx/bd;my=-dy/bd}else{mx=-dy/bd;my=dx/bd}}
  if(i%120===0){if(Math.hypot(P.x-(P._ox||0),P.y-(P._oy||0))<20)P._jt=40;P._ox=P.x;P._oy=P.y}if(P._jt>0){P._jt--;mx=Math.cos(i/90);my=Math.sin(i/70)}
  GM.KEY.d=mx>.3?1:0;GM.KEY.a=mx<-.3?1:0;GM.KEY.s=my>.3?1:0;GM.KEY.w=my<-.3?1:0;
  // 近くの弾はダッシュでよける
  if(b&&i%8===0){P.atkq={};P.supq=1}
  {const it=GM.PK.find(k=>k.ty==='item'&&!k.got&&!k.price&&Math.hypot(k.x-P.x,k.y-P.y)<40);if(it&&i%30===0)GM.pick(it)}
  if(GM.EB.some(q=>Math.hypot(q.x-P.x,q.y-P.y+14)<40))GM.dash();
  GM.update(1/60);if(R.n!==last){last=R.n;P._ch=0;log.push([R.n,Math.round(GM.TIME),R.hits])}}
 return{log,mode:GM.MODE,res:GM.RESULT&&{rooms:GM.RESULT.rooms,hits:GM.RESULT.hits,time:Math.round(GM.RESULT.time),won:GM.RESULT.won,rk:GM.RESULT.rk},ws:GM.P.ws.map(w=>w.k+w.lv),st:R0().st,p:[Math.round(GM.P.x),Math.round(GM.P.y)],dm:GM.P.ws[0].dm,k:GM.KILLS,cell:GM.MAP.G.length,en:GM.EN.filter(e=>!e.dead).map(e=>[e.k,e.tier,Math.round(e.x),Math.round(e.y),Math.round(e.hp)])}},[process.argv[3]||'forest',+(process.argv[4]||0),process.argv[5]!=='0']);
await p.screenshot({path:out+'/end.png'});console.log(JSON.stringify(r));console.log(JSON.stringify(er.slice(0,5)));await b.close()})();
