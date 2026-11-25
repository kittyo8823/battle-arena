// 拠点戦を早送りで自動プレイ：本塔のそばで立ち、金貨がたまると店で買う。node tests/play.js 出力先 [場所] [キャラ番号] [買う=1]
const {chromium}=require('playwright'),path=require('path'),fs=require('fs');
const out=process.argv[2]||path.join(__dirname,'out');fs.mkdirSync(out,{recursive:true});const stg=process.argv[3]||'forest',chi=+(process.argv[4]||0),buy=process.argv[5]!=='0';
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:960,height:540}});const er=[];p.on('pageerror',e=>er.push(e.message));
await p.route('**/fonts.googleapis.com/**',r=>r.abort());await p.goto('file://'+path.resolve(__dirname,'../index.html'));await p.waitForTimeout(700);
const r=await p.evaluate(([stg,chi,buy])=>{GM.STG=stg;GM.CHI=chi;GM.newRun();const log=[];
 for(let i=0;i<60*60*17&&GM.MODE==='play';i++){const P=GM.P;const a=i/400;if(!P.dead){P.x=GM.MAP.base.x+Math.cos(a)*90;P.y=GM.MAP.base.y+60+Math.sin(a)*40}
  if(buy&&i%120===0)for(const t of[0,1,2])for(const r of GM.shopRows(t))if(r.a&&r.c&&P.gold>=r.c)GM.shopBuy(r.a);
  GM.update(1/60);if(i%(60*60)===0)log.push([Math.round(GM.TIME),GM.WV.n,GM.KILLS,GM.P.lv,Math.round(GM.TW[0].hp),GM.TW.filter(t=>t.dead).length])}
 return{left:GM.EN.filter(e=>!e.dead&&!e.lamp).map(e=>[e.k,e.tier,e.x|0,e.y|0,Math.round(e.hp),e.d.cat]),q:GM.WV.q.length,mode:GM.MODE,wave:GM.WV.n,won:!!GM.WV.won,log,ws:GM.P.ws.map(w=>w.k+w.lv+(w.evo?'*':'')),tw:GM.TW.map(t=>t.lv)}},[stg,chi,buy]);
await p.screenshot({path:out+'/end.png'});console.log(JSON.stringify(r),JSON.stringify(er.slice(0,5)));await b.close()})();
