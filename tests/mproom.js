// 部屋のマルチの確認（同じブラウザのタブ、BroadcastChannel）：node tests/mproom.js 出力先 [人数]
// 仲間が動く・撃つ・ダッシュする → ホストで反映されるか。部屋を制して扉・次の部屋が仲間にも届くか
const {chromium}=require('playwright'),path=require('path'),fs=require('fs');const out=process.argv[2]||'/tmp/mpr';fs.mkdirSync(out,{recursive:true});const N=+(process.argv[3]||2);
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:960,height:540}});const ps=[],er=[];
for(let i=0;i<N;i++){const p=await c.newPage();p.on('pageerror',e=>er.push(i+':'+e.message));await p.goto('file://'+path.resolve(__dirname,'../index.html'));ps.push(p)}
await ps[0].waitForTimeout(1000);await ps[0].evaluate(()=>GM.mpHost());await ps[0].waitForTimeout(300);const code=await ps[0].evaluate(()=>GM.MPS.code);
for(let i=1;i<N;i++)await ps[i].evaluate(c=>GM.mpJoin(c),code);await ps[0].waitForTimeout(2500);for(let i=1;i<N;i++)await ps[i].evaluate(i=>{for(let k=0;k<i;k++)GM.mpCi(1)},i);
await ps[0].evaluate(()=>GM.mpStart());await ps[0].waitForTimeout(2500);
const before=await ps[0].evaluate(()=>GM.PLS.map(q=>[Math.round(q.x),Math.round(q.y)]));
await ps[1].mouse.move(800,200);await ps[1].keyboard.down('d');await ps[0].waitForTimeout(800);for(let i=0;i<6;i++){await ps[1].mouse.click(800,200);await ps[0].waitForTimeout(120)}await ps[1].keyboard.press('Space');await ps[0].waitForTimeout(600);await ps[1].keyboard.up('d');
const after=await ps[0].evaluate(()=>({pl:GM.PLS.map(q=>[Math.round(q.x),Math.round(q.y),q.ax&&q.ax.toFixed(2),q.ay&&q.ay.toFixed(2),(q.dcd||0).toFixed(2)]),bu:GM.PLS[1].ws[0]&&GM.PLS[1].ws[0].k}));
await ps[0].screenshot({path:out+'/host1.png'});await ps[1].screenshot({path:out+'/client1.png'});
// 部屋を片付ける→扉・宝箱
await ps[0].evaluate(()=>{GM.RM.wv=[[]];GM.RM.wi=1;GM.EN.forEach(e=>e.dead=1)});await ps[0].waitForTimeout(2500);
const c1=await ps[1].evaluate(()=>({st:GM.RM&&GM.RM.st,door:GM.MAP.door.open,pk:GM.PK.map(k=>k.ty)}));
await ps[0].evaluate(()=>{GM.RM.st='trans';GM.RM.tt=0});await ps[0].waitForTimeout(2500);
const c2=await ps[1].evaluate(()=>({n:GM.RM.n,w:GM.MAP.gw,en:GM.EN.length,sp:0}));const h2=await ps[0].evaluate(()=>({n:GM.RM.n,w:GM.MAP.gw}));
await ps[0].screenshot({path:out+'/host2.png'});await ps[1].screenshot({path:out+'/client2.png'});
console.log(JSON.stringify({code,before,after,c1,c2,h2,er:er.slice(0,6)}));await b.close()})();
