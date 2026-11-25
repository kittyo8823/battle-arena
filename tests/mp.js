// マルチの確認（同じブラウザの2〜4タブ、BroadcastChannel）：node tests/mp.js 出力先 [人数]
const {chromium}=require('playwright'),path=require('path'),fs=require('fs');const out=process.argv[2];fs.mkdirSync(out,{recursive:true});const N=+(process.argv[3]||2);
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:960,height:540}});const ps=[],er=[];
for(let i=0;i<N;i++){const p=await c.newPage();p.on('pageerror',e=>er.push(i+':'+e.message));await p.goto('file://'+path.resolve(__dirname,'../index.html'));ps.push(p)}
await ps[0].waitForTimeout(1200);await ps[0].evaluate(()=>GM.mpHost());await ps[0].waitForTimeout(300);const code=await ps[0].evaluate(()=>GM.MPS.code);
for(let i=1;i<N;i++){await ps[i].evaluate(c=>GM.mpJoin(c),code);}await ps[0].waitForTimeout(2500);
for(let i=1;i<N;i++)await ps[i].evaluate(i=>{for(let k=0;k<i;k++)GM.mpCi(1)},i);await ps[0].waitForTimeout(500);
const lob=await ps[0].evaluate(()=>GM.MPS.pl.map(q=>q.nm+':'+q.ci));await ps[0].screenshot({path:out+'/lobby.png'});
await ps[0].evaluate(()=>GM.mpStart());await ps[0].waitForTimeout(800);
// 仲間を右へ歩かせる
await ps[1].keyboard.down('d');await ps[0].waitForTimeout(2500);await ps[1].keyboard.up('d');
const h1=await ps[0].evaluate(()=>GM.PLS.map(q=>[Math.round(q.x),Math.round(q.y),q.nm]));const c1=await ps[1].evaluate(()=>({n:GM.EN.length,pl:GM.PLS.map(q=>[Math.round(q.x),Math.round(q.y)]),mode:GM.MODE,netc:GM.NETC}));
await ps[0].waitForTimeout(6000);await ps[0].screenshot({path:out+'/host.png'});await ps[1].screenshot({path:out+'/client.png'});
// レベルアップの順番：ホストの経験を足す
await ps[0].evaluate(()=>{GM.MODE==='lv'&&GM.pickOpt(0)});await ps[0].evaluate(()=>{GM.P.s.growth=1;GM.addXp(5000)});await ps[0].waitForTimeout(600);
const m0=await ps[0].evaluate(()=>GM.MODE),m1=await ps[1].evaluate(()=>GM.MODE);await ps[1].screenshot({path:out+'/client_lv.png'});
// 順番に選ばせる
for(let k=0;k<6;k++){for(const p of ps){await p.evaluate(()=>{if(GM.MODE==='lv')GM.pickOpt(0)})}await ps[0].waitForTimeout(400)}
const m2=await ps[0].evaluate(()=>[GM.MODE,GM.PLS.map(q=>q.ws.map(w=>w.k+w.lv).join('/'))]);
console.log(JSON.stringify({code,lob,h1,c1,m0,m1,m2,er:er.slice(0,6)}));await b.close()})();
