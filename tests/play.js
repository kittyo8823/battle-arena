// 自動で遊ぶ：時間を早送りして、レベルアップ・宝箱・主・死神まで通す。node tests/play.js 出力先 [場所] [キャラ番号]
const {chromium}=require('playwright'),path=require('path'),fs=require('fs');
const out=process.argv[2]||path.join(__dirname,'out');fs.mkdirSync(out,{recursive:true});const SPD0=+(process.env.SPD||.6),stg=process.argv[3]||'jungle',chi=+(process.argv[4]||0);
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:960,height:540}});const er=[];p.on('pageerror',e=>er.push(e.message));
await p.route('**/fonts.googleapis.com/**',r=>r.abort());await p.goto('file://'+path.resolve(__dirname,'../index.html'));await p.waitForTimeout(700);
await p.screenshot({path:out+'/title.png'});
const r=await p.evaluate(([stg,chi,SPD])=>{GM.STG=stg;GM.CHI=chi;GM.newRun();const log=[];let lv=0,ch=0;
 for(let i=0;i<60*60*31;i++){const P=GM.P;P.hp=P.s.mhp;// 円を描いて逃げ回る
  const a=i/600+Math.sin(i/1300)*3;P.x+=Math.cos(a)*SPD;P.y+=Math.sin(a)*SPD;const c=GM.PK.find(k=>k.ty==="chest");if(c&&i%600===0){P.x=c.x;P.y=c.y}
  if(GM.MODE==='lv'){GM.pickOpt(0);lv++}if(GM.MODE==='chest'){GM.MODE='play';GM.CHST=null;ch++}
  GM.update(1/60);if(i%(60*120)===0)log.push([Math.round(GM.TIME),GM.EN.length,P.lv,GM.KILLS])}
 const P=GM.P;return{log,lv,ch,ws:P.ws.map(w=>w.k+w.lv+(w.evo?'*':'')+':'+Math.round(w.dm)),pas:P.pas,mode:GM.MODE}},[stg,chi,SPD0]);
await p.evaluate(()=>{GM.P.hp=1;GM.P.inv=0});await p.waitForTimeout(300);await p.screenshot({path:out+'/late.png'});
console.log(JSON.stringify(r),JSON.stringify(er.slice(0,5)));await b.close()})();
