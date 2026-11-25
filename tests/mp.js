// マルチの確認（同じブラウザのタブ、BroadcastChannel）：node tests/mp.js 出力先 [人数]
const {chromium}=require('playwright'),path=require('path'),fs=require('fs');const out=process.argv[2];fs.mkdirSync(out,{recursive:true});const N=+(process.argv[3]||2);
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:960,height:540}});const ps=[],er=[];
for(let i=0;i<N;i++){const p=await c.newPage();p.on('pageerror',e=>er.push(i+':'+e.message));await p.goto('file://'+path.resolve(__dirname,'../index.html'));ps.push(p)}
await ps[0].waitForTimeout(1000);await ps[0].evaluate(()=>GM.mpHost());await ps[0].waitForTimeout(300);const code=await ps[0].evaluate(()=>GM.MPS.code);
for(let i=1;i<N;i++)await ps[i].evaluate(c=>GM.mpJoin(c),code);await ps[0].waitForTimeout(2500);for(let i=1;i<N;i++)await ps[i].evaluate(i=>{for(let k=0;k<i;k++)GM.mpCi(1)},i);
await ps[0].evaluate(()=>GM.mpStart());await ps[0].waitForTimeout(1500);
await ps[1].keyboard.down('d');await ps[0].waitForTimeout(1500);await ps[1].keyboard.up('d');
// 仲間が店で買う（本塔のそば）
const g0=await ps[1].evaluate(()=>GM.P.gold);await ps[1].keyboard.down('a');await ps[0].waitForTimeout(1500);await ps[1].keyboard.up('a');await ps[0].waitForTimeout(500);
const rows=await ps[1].evaluate(()=>{const r=GM.shopRows(0).filter(r=>r.a&&r.c);return r.map(x=>x.n)});await ps[1].evaluate(()=>{const r=GM.shopRows(0).find(r=>r.a&&r.a.t==='wu');if(r)GM.shopBuy&&0;});
await ps[1].evaluate(()=>{const r=GM.shopRows(0).find(r=>r.a&&r.a.t==='wu');if(r)window.__a=r.a});await ps[1].evaluate(()=>{if(window.__a){GM.shopAct?GM.shopAct(window.__a):0}});await ps[0].waitForTimeout(800);
const h=await ps[0].evaluate(()=>GM.PLS.map(q=>[Math.round(q.x),Math.round(q.y),Math.round(q.gold),q.ws.map(w=>w.k+w.lv).join('/')]));
await ps[0].waitForTimeout(8000);await ps[0].screenshot({path:out+'/host.png'});await ps[1].screenshot({path:out+'/client.png'});
const cl=await ps[1].evaluate(()=>({en:GM.EN.length,tw:GM.TW.map(t=>Math.round(t.hp)),wave:GM.WV.n}));
console.log(JSON.stringify({code,g0,rows,h,cl,er:er.slice(0,6)}));await b.close()})();
