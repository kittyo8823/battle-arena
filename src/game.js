// Battle Arena（仮題）：Card Trail のキャラ・敵・場所・曲を使った、生き残り型のアクション（ヴァンパイアサバイバー風）
// 音（bgm / sfx / newAC / initAudio / AC / setVol / VOL）は Card Trail の「音」の区切りをそのまま読み込んだ大域の関数を使う
/* global bgm sfx newAC initAudio AC setVol VOL */
import A from './assets.json';

/* ===== 基本 ===== */
const R=Math.random,RI=n=>R()*n|0,pk=a=>a[RI(a.length)],cl=(v,a,b)=>v<a?a:v>b?b:v,hyp=Math.hypot,TAU=Math.PI*2;
const SNT={};const snd=(k,gap)=>{const t=performance.now();if(SNT[k]&&t-SNT[k]<(gap||70))return;SNT[k]=t;try{if(MPON&&MPS.host&&EVQ.length<200)EVQ.push(['s',k])}catch(e){}try{if(typeof sfx==='function')sfx(k)}catch(e){}};
const music=k=>{try{if(MPON&&MPS.host&&EVQ.length<200)EVQ.push(['m',k])}catch(e){}try{if(typeof bgm==='function')bgm(k)}catch(e){}};
const LS={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};

/* ===== 画面（論理座標 LW×LH を整数倍 K で描く。Card Trail と同じ作り） ===== */
const cv=document.createElement('canvas');document.body.appendChild(cv);const g=cv.getContext('2d');
let LW=800,LH=600,UW=640,UH=480,US=1.25,K=2,CS=1,OX=0,OY=0,TOUCH=matchMedia('(pointer:coarse)').matches?1:0;
function fit(){const w=innerWidth,h=innerHeight;LH=TOUCH?560:600;LW=cl(Math.round(LH*w/h),420,1400);US=LH/(TOUCH?400:480);UW=LW/US;UH=LH/US;CS=Math.min(w/LW,h/LH);K=cl(Math.ceil(CS*(devicePixelRatio||1)),1,4);cv.width=LW*K;cv.height=LH*K;cv.style.width=LW*CS+'px';cv.style.height=LH*CS+'px';OX=(w-LW*CS)/2;OY=(h-LH*CS)/2;cv.style.left=OX+'px';cv.style.top=OY+'px';VIG=null}
addEventListener('resize',fit);
const MKC=(w,h)=>{const c=document.createElement('canvas');c.width=Math.max(1,w);c.height=Math.max(1,h);return c};
const FT='"DotGothic16",monospace',FP='"Press Start 2P",monospace';
// ◀▶ は端末によって絵文字になるので、三角を描いて置き換える（ユーザー指定：絵文字のように見えるのは嫌）
function tx(s,x,y,c,al,sz,f){s=String(s);const z=sz||12;g.font=z+'px '+(f||FT);g.textAlign=al||'left';if(!/[◀▶]/.test(s)){g.fillStyle='rgba(0,0,0,.45)';g.fillText(s,x+1,y+1);g.fillStyle=c;g.fillText(s,x,y);return}
 const parts=s.split(/([◀▶])/).filter(q=>q!==''),aw=z*.7,ws=parts.map(q=>q==='◀'||q==='▶'?aw:g.measureText(q).width),tw=ws.reduce((a,b)=>a+b,0);let cx=g.textAlign==='center'?x-tw/2:g.textAlign==='right'?x-tw:x;g.textAlign='left';
 parts.forEach((q,i)=>{if(q==='◀'||q==='▶'){const d=q==='▶'?1:-1,mx=cx+aw/2,my=y-z*.36,h=z*.32;for(const[o,col]of[[1,'rgba(0,0,0,.45)'],[0,c]]){g.fillStyle=col;g.beginPath();g.moveTo(mx+d*h*.8+o,my+o);g.lineTo(mx-d*h*.6+o,my-h+o);g.lineTo(mx-d*h*.6+o,my+h+o);g.fill()}}else{g.fillStyle='rgba(0,0,0,.45)';g.fillText(q,cx+1,y+1);g.fillStyle=c;g.fillText(q,cx,y)}cx+=ws[i]})}
function box(x,y,w,h,c){g.fillStyle=c||'rgba(12,14,22,.86)';g.fillRect(x,y,w,h)}
let BTN=[];const btn=(x,y,w,h,f)=>BTN.push({x,y,w,h,f});

/* ===== 絵（Card Trail の SPR を半分＝1マス1点にして使う） ===== */
const SP={};/* k → {n,f,wn,wf,w,h} */
function sprite(url,sc){const key=url.length+url.slice(-48)+sc;if(SP[key])return SP[key];const o=SP[key]={ok:0,w:40,h:40};const im=new Image();im.onload=()=>{let ih=im.height;try{const t=MKC(im.width,im.height),tx2=t.getContext('2d');tx2.drawImage(im,0,0);const d=tx2.getImageData(0,0,im.width,im.height).data;let b=im.height-1;out:for(;b>0;b--){for(let i=0;i<im.width;i++)if(d[(b*im.width+i)*4+3]>20)break out}ih=b+1}catch(e){}const w=Math.round(im.width*sc),h=Math.round(ih*sc);
 const mk=(fl,wh)=>{const c=MKC(w,h),x=c.getContext('2d');x.imageSmoothingEnabled=false;if(fl){x.translate(w,0);x.scale(-1,1)}x.drawImage(im,0,0,w,h);if(wh){x.setTransform(1,0,0,1,0,0);x.globalCompositeOperation='source-in';x.fillStyle='#fff';x.fillRect(0,0,w,h)}return c};
 Object.assign(o,{n:mk(0,0),f:mk(1,0),wn:mk(0,1),wf:mk(1,1),w,h,ok:1})};im.src=url;return o}
const eSpr=(k,tier)=>sprite(A.spr[k],tier>=1?1:.5),cSpr=k=>sprite(A.ch[k].img,.5);
const IMG={};function img(url){if(!url)return null;if(IMG[url])return IMG[url];const i=new Image();i.src=url;return IMG[url]=i}
const ric=k=>A.rl[k]&&img(A.rl[k].img);
function icon(k,x,y,s,glow){if(k==='onigiri'){g.drawImage(ONIG,x+s*.05|0,y+s*.1|0,s*.9|0,s*.82|0);return}const i=ric(k);if(glow){const gr=g.createRadialGradient(x+s/2,y+s/2,0,x+s/2,y+s/2,s*.7);gr.addColorStop(0,'rgba(255,214,110,.55)');gr.addColorStop(1,'rgba(255,214,110,0)');g.fillStyle=gr;g.fillRect(x-s*.2,y-s*.2,s*1.4,s*1.4)}if(i&&i.complete&&i.naturalWidth)g.drawImage(i,x,y,s,s)}
// 小さな絵（経験の結晶・金貨）
function pix(rows,pal){const h=rows.length,w=rows[0].length,c=MKC(w,h),x=c.getContext('2d');rows.forEach((r,j)=>[...r].forEach((ch,i)=>{if(ch!=='.'){x.fillStyle=pal[ch];x.fillRect(i,j,1,1)}}));return c}
const GEMR=['...a...','..awb..','.aabbc.','aabbbcc','.abbcc.','..bcc..','...c...'];
const GEM=[pix(GEMR,{a:'#bfe4ff',w:'#ffffff',b:'#4a8ee0',c:'#24507e'}),pix(GEMR,{a:'#c8ffcf',w:'#ffffff',b:'#3fae5a',c:'#1f5e30'}),pix(GEMR,{a:'#ffd0d6',w:'#ffffff',b:'#d0384c',c:'#6e1824'}),pix(GEMR,{a:'#fff0c0',w:'#ffffff',b:'#e0a830',c:'#7a5a14'})];
const COIN=pix(['..aab..','.abbbc.','abbdbcc','abbdbcc','abbdbcc','.bbbcc.','..ccc..'],{a:'#fff2b0',b:'#e8b830',c:'#9a6e14',d:'#b88820'});
const MAGN=pix(['ss.....ss','ss.....ss','rr.....rd','rr.....rd','rr.....rd','rrr...rrd','.rrr.rrd.','..rrrrd..','...rdd...'],{s:'#e8eef4',r:'#d0343e',d:'#7a1820'});

/* ===== 場所（Card Trail の層） ===== */
const TH={
 forest:{n:'黒い森',g:['#1d2620','#222c25','#1a221d','#263027'],d:['#2e2a22','#353024'],acc:['#3a4a30','#2b3a28','#4a3a4a'],dark:.55,sub:'枯れ木の森。夜は長い。'},
 sunk:{n:'沈没都市',g:['#22343a','#27393f','#1e3035','#2c4046'],d:['#1a2a30','#30484c'],acc:['#3a6a6a','#7a4a5a','#4a5a7a'],dark:.45,sub:'沈んだ街の石畳。'},
 hall:{n:'地下の広間',g:['#36302a','#3c352e','#322c26','#40382f'],d:['#2a241f','#4a4036'],acc:['#5a4a3a','#6a5a48','#4a3a2e'],dark:.5,tile:1,sub:'石造りの広間。灯りは遠い。'},
 jungle:{n:'密林の遺跡',g:['#2e4026','#33462a','#2a3a22','#3a4e2e'],d:['#4e422e','#5a4c34'],acc:['#4a6a32','#5a7a3a','#6a5a3a'],dark:.15,sub:'苔むした遺跡と密林。'},
 temple:{n:'機神の神殿',g:['#252a33','#2a2f39','#21262e','#2e343f'],d:['#1c2028','#3a4250'],acc:['#3a8aa0','#4a5a70','#6a5a40'],dark:.35,tile:1,sub:'動き続ける機械の神殿。'},
 heaven:{n:'天上の聖堂',g:['#cfc7b5','#d6cebd','#c8c0ae','#ddd5c4'],d:['#b8ae9a','#e8e0cc'],acc:['#d8b860','#a8a0c0','#c0b8a0'],dark:0,tile:1,sub:'白い石と金の聖堂。'}};
const STAGES=['forest','sunk','hall','jungle','temple','heaven'];
function mkTile(t){const S=256,c=MKC(S,S),x=c.getContext('2d');x.fillStyle=t.g[0];x.fillRect(0,0,S,S);
 for(let i=0;i<2600;i++){x.fillStyle=pk(t.g);x.fillRect(RI(S/2)*2,RI(S/2)*2,2,2)}
 if(t.tile){x.fillStyle='rgba(0,0,0,.18)';for(let i=0;i<S;i+=32){x.fillRect(i,0,1,S);x.fillRect(0,i,S,1)}x.fillStyle='rgba(255,255,255,.05)';for(let i=0;i<S;i+=32){x.fillRect(i+1,0,1,S);x.fillRect(0,i+1,S,1)}}
 // 土・水たまり・石などの斑
 for(let i=0;i<5;i++){const cx=RI(S),cy=RI(S),r=6+RI(14);x.fillStyle=pk(t.d);for(let j=0;j<r*6;j++){const a=R()*TAU,d=R()*r;x.fillRect(((cx+Math.cos(a)*d)|0)%S,((cy+Math.sin(a)*d*.6)|0)%S,2,2)}}
 // 小物（草・花・ひび・光る線）
 for(let i=0;i<26;i++){const px=RI(S),py=RI(S);x.fillStyle=pk(t.acc);const ty=RI(3);if(ty===0){x.fillRect(px,py,1,3);x.fillRect(px+2,py+1,1,2);x.fillRect(px-2,py+1,1,2)}else if(ty===1){x.fillRect(px,py,3,2);x.fillStyle='rgba(0,0,0,.25)';x.fillRect(px,py+2,3,1)}else{x.fillRect(px,py,1,1);x.fillRect(px+1,py+1,1,1);x.fillRect(px+2,py+1,1,1)}}
 return c}

/* ===== キャラ ===== */
const CHS=[
 {k:'pl',w:'sword',hp:120,b:{might:.1},col:'#a8323e',lt:'#ff9a7a',ep:'大兜の戦士',lore:'重い長剣を腰の高さで振り抜く。押し寄せる群れも、ひと薙ぎで道を開く。',d:'筋力に優れた戦士'},
 {k:'si',w:'knife',hp:100,b:{cd:.05,move:.05},col:'#2f6a4a',lt:'#8ae0a8',ep:'外套の影',lore:'包帯の手に短剣を握る。足を止めず、進む先へ刃を投げ続ける。',d:'身軽な毒使い'},
 {k:'sm',w:'moon',hp:110,b:{area:.1},col:'#7a2a34',lt:'#e8a0a8',ep:'居合の剣士',lore:'中段に構えた刀から、三日月の斬撃が飛ぶ。一列に並んだ敵ほど斬りやすい。',d:'居合の剣士'},
 {k:'nn',w:'book',hp:90,b:{dur:.15,move:-.08},col:'#4a3a7a',lt:'#c0a8ff',ep:'名を捨てた魔導士',lore:'座ったまま、背後の魔導書が勝手に頁をめくる。歩みは遅いが、弾は敵を追う。',d:'老いた魔導士'},
 {k:'hori',w:'dumb',hp:140,b:{regen:.3},col:'#4a6a2a',lt:'#c8f08a',ep:'眠れる力自慢',lore:'迷彩の肌着に緑の杖。放り上げたダンベルが、落ちる先の敵をまとめて潰す。',d:'よく眠る男'},
 {k:'neb',w:'jelly',hp:100,b:{pspd:.15},col:'#2a5a7a',lt:'#8ad8ff',ep:'クラゲを連れた少女',lore:'淡く光るクラゲが周りを巡る。近づくものは触手に絡め取られる。',d:'クラゲを連れた少女'},
 {k:'seres',w:'spear',hp:100,b:{luck:.2},col:'#8a7a4a',lt:'#fff0c0',ep:'霊騎士を従える少女',lore:'白い頭巾で目を隠す。見えない騎士の光の槍が、敵の頭上から落ちる。',d:'霊騎士を従える少女'}];

/* ===== キャラ固有の力（Lv が上がると伸びる。ユーザー指定：本家のようにキャラごとに） ===== */
const CPV=[
 {n:'剛力',ic:'burn',d:'ダメージ+10%。Lv10ごとにさらに+10%（最大+50%）',f:(s,l)=>{s.might+=.1+.1*Math.min(4,l/10|0)}},
 {n:'投げ足',ic:'choker',d:'移動+10%。Lv15で弾の数+1、Lv30でさらに+1',f:(s,l)=>{s.move+=.1;s.amt+=(l>=15?1:0)+(l>=30?1:0)}},
 {n:'居合の間合い',ic:'kensei',d:'範囲+10%。Lv10ごとに+5%（最大+30%）',f:(s,l)=>{s.area+=.1+.05*Math.min(4,l/10|0)}},
 {n:'詠唱',ic:'tome',d:'待ち時間-10%。Lv10ごとに-2%（最大-18%）。動きは8%遅い',f:(s,l)=>{s.cd-=.1+.02*Math.min(4,l/10|0);s.move-=.08}},
 {n:'昼寝',ic:'eyemask',d:'立ち止まると HP がみるみる回復する。最大HP+20%',f:(s,l)=>{s.mhp*=1.2;s.nap=1}},
 {n:'漂うもの',ic:'insr',d:'弾の速さ+15%。Lv10ごとに持続+10%（最大+40%）',f:(s,l)=>{s.pspd+=.15;s.dur+=.1*Math.min(4,l/10|0)}},
 {n:'霊騎士の盾',ic:'rcap',d:'幸運+20%。Lv10ごとに受けるダメージ-1（最大-4）',f:(s,l)=>{s.luck+=.2;s.armor+=Math.min(4,l/10|0)}}];
/* ===== 武器（最大Lv8）。i は Lv2〜8 で増える値 ===== */
const W={
 sword:{n:'薙ぎ払い',ic:'stsw',d:'向いている方を横に薙ぐ',b:{dmg:12,cd:1.35,amt:1,area:1,spd:1,dur:1,pierce:99},i:[{amt:1},{dmg:5},{dmg:5,area:.1},{dmg:5},{dmg:5,area:.1},{dmg:5},{dmg:5}],evo:{p:'might',n:'覇王の薙ぎ',ic:'burn2'}},
 knife:{n:'投げナイフ',ic:'kunai',d:'進む方へ小刀を投げる',b:{dmg:7,cd:.95,amt:1,area:1,spd:1,dur:1,pierce:1},i:[{amt:1},{amt:1,dmg:3},{amt:1},{pierce:1},{amt:1},{amt:1,dmg:3},{pierce:1}],evo:{p:'cd',n:'千本の苦無',ic:'snake2'}},
 moon:{n:'三日月',ic:'sya',d:'貫く三日月の斬撃を飛ばす',b:{dmg:14,cd:1.7,amt:1,area:1,spd:1,dur:1,pierce:99},i:[{dmg:5},{amt:1},{area:.15},{dmg:6},{amt:1},{area:.15},{dmg:8}],evo:{p:'area',n:'月影一閃',ic:'sya2'}},
 book:{n:'魔導の弾',ic:'grim',d:'近くの敵へ追う弾を撃つ',b:{dmg:10,cd:1.15,amt:1,area:1,spd:1,dur:1,pierce:1},i:[{amt:1},{cd:-.15},{amt:1},{dmg:6},{amt:1},{pierce:1},{dmg:8}],evo:{p:'dur',n:'禁書の嵐',ic:'grim2'}},
 dumb:{n:'ダンベル',ic:'dumb',d:'上へ放り、落ちて当たる',b:{dmg:18,cd:1.7,amt:1,area:1,spd:1,dur:1,pierce:3},i:[{amt:1},{dmg:8},{pierce:2},{amt:1},{dmg:8},{area:.2},{amt:1}],evo:{p:'mhp',n:'黄金のダンベル',ic:'eyemask2'}},
 jelly:{n:'クラゲの輪',ic:'ccore',d:'周りをクラゲが回る',b:{dmg:11,cd:3,amt:1,area:1,spd:1,dur:3,pierce:99},i:[{amt:1},{spd:.3},{dmg:4},{amt:1},{dur:.6},{area:.2},{amt:1}],evo:{p:'pspd',n:'星海のクラゲ',ic:'ccore2'}},
 spear:{n:'光の槍',ic:'whood',d:'敵の上から光の槍が落ちる',b:{dmg:16,cd:2,amt:2,area:1,spd:1,dur:1,pierce:99},i:[{amt:1},{dmg:6},{amt:1},{area:.25},{amt:1},{dmg:8},{amt:1}],evo:{p:'luck',n:'天の槍',ic:'nbat'}},
 poison:{n:'毒の霧',ic:'snake',d:'周りの敵を毒の霧が蝕む',b:{dmg:5,cd:.7,amt:1,area:1,spd:1,dur:1,pierce:99},i:[{area:.2},{dmg:2},{cd:-.08},{area:.2},{dmg:2},{cd:-.08},{area:.2}],evo:{p:'regen',n:'命喰らいの霧',ic:'fcore'}},
 fire:{n:'火炎瓶',ic:'ember',d:'敵の近くに炎の溜まりを作る',b:{dmg:7,cd:3,amt:1,area:1,spd:1,dur:2,pierce:99},i:[{amt:1},{dmg:3},{area:.2},{amt:1},{dur:.6},{dmg:4},{area:.2}],evo:{p:'amt',n:'業火の瓶',ic:'pumpkin'}}};
/* ===== ランク（ユーザー指定：強いほど高い）C/B/A/S。初めの武器は B ===== */
const RKN=['C','B','A','S'],RKC=['#9aa4b4','#6cc0ff','#d890ff','#ffc850'],RKD=[.8,1,1.3,1.7];
const WRK={pen:0,sakura:0,thorn:0,poison:0,sword:1,knife:1,moon:1,book:1,dumb:1,jelly:1,spear:1,marble:1,frost:1,fire:2,chain:2,oni:2,bell:2,lwisp:2,bomb:3,lens:3};
const PRK={move:0,pspd:0,dur:0,luck:0,magnet:0,growth:0,might:1,armor:1,regen:1,area:1,slow:1,inv:1,cd:2,mhp:2,crit:2,vamp:2,barr:2,greed:2,amt:3,rev:3};
const wrk=k=>WRK[k]??1,prk=k=>PRK[k]??1;
const WINC=i=>Object.entries(i).map(([k,v])=>({amt:'数',dmg:'ダメージ',cd:'待ち時間',area:'範囲',spd:'速さ',dur:'持続',pierce:'貫通・連鎖'})[k]+(k==='area'||k==='spd'?(v>0?'+':'')+Math.round(v*100)+'%':k==='cd'||k==='dur'?(v>0?'+':'')+v+'秒':'+'+v)).join('・');
/* ===== 持ち物（最大Lv5） ===== */
const PS={
 might:{n:'力の指輪',ic:'ring',d:'ダメージ+10%',m:5},armor:{n:'小さな盾',ic:'buckler',d:'受けるダメージ-1',m:5},mhp:{n:'ハートの石',ic:'heart',d:'最大HP+20%',m:5},
 regen:{n:'金の林檎',ic:'apple',d:'HP回復+0.2/秒',m:5},cd:{n:'コーヒー',ic:'drip',d:'待ち時間-8%',m:5},area:{n:'星の望遠鏡',ic:'astro',d:'範囲+10%',m:5},
 dur:{n:'お香',ic:'incense',d:'持続+10%',m:5},amt:{n:'サイコロ',ic:'dice',d:'数+1',m:2},move:{n:'ブーツ',ic:'boot',d:'移動の速さ+10%',m:5},
 magnet:{n:'金のカエル',ic:'frog',d:'拾う範囲+25%',m:5},luck:{n:'四つ葉',ic:'clover',d:'幸運+10%',m:5},growth:{n:'巻物',ic:'scroll',d:'経験+8%',m:5},pspd:{n:'扇子',ic:'fan',d:'弾の速さ+10%',m:5}};
/* ===== 強化（金貨で買う、ずっと残る） ===== */
const MU={might:{n:'力',ic:'ring',m:5,c:200,v:.05,d:'ダメージ+5%'},armor:{n:'鎧',ic:'buckler',m:3,c:600,v:1,d:'受けるダメージ-1'},mhp:{n:'最大HP',ic:'heart',m:3,c:200,v:.1,d:'最大HP+10%'},
 regen:{n:'回復',ic:'apple',m:5,c:200,v:.1,d:'HP回復+0.1/秒'},cd:{n:'速さ',ic:'drip',m:2,c:900,v:.025,d:'待ち時間-2.5%'},area:{n:'範囲',ic:'astro',m:2,c:300,v:.05,d:'範囲+5%'},
 move:{n:'移動',ic:'boot',m:2,c:300,v:.05,d:'移動の速さ+5%'},magnet:{n:'磁力',ic:'frog',m:2,c:300,v:.25,d:'拾う範囲+25%'},growth:{n:'成長',ic:'scroll',m:5,c:900,v:.03,d:'経験+3%'},
 luck:{n:'幸運',ic:'clover',m:3,c:600,v:.1,d:'幸運+10%'},greed:{n:'金運',ic:'purse',m:5,c:200,v:.1,d:'金貨+10%'}};
let META=LS.get('battlearena_meta',{gold:0,up:{},best:{}});

/* ===== 状態 ===== */
let MODE='title',T=0,TM=null,STG='forest',CHI=0,P=null,EN=[],BU=[],FX=[],DN=[],PK=[],TIME=0,KILLS=0,GOLD=0,SPWN=0,EVT={},LVQ=0,LVO=null,CHST=null,PAUSE=0,BANNER=null,TILE=null,VIG=null,RESULT=null,SEL=0;
let CAMX=0,CAMY=0;

/* ===== 能力の計算 ===== */
function stats(){const p=P,c=CHS[p.ci==null?CHI:p.ci],s={might:1,armor:0,mhp:c.hp,regen:0,cd:1,area:1,dur:1,amt:0,move:1,magnet:1,luck:1,growth:1,pspd:1,greed:1,crit:0,vamp:0,rev:0,invb:0,es:1,barr:0};
 if(0)for(const k in META.up){const u=MU[k],n=META.up[k];if(!u)continue;if(k==='armor')s.armor+=u.v*n;else if(k==='regen')s.regen+=u.v*n;else if(k==='cd')s.cd-=u.v*n;else if(k==='mhp')s.mhp*=1+u.v*n;else s[k]+=u.v*n}
 {const ci=p.ci==null?CHI:p.ci,lv=1+2*(WV&&WV.n||0);CPV[ci].f(s,lv)}
 for(const k in p.pas){const n=p.pas[k];if(k==='might')s.might+=.1*n;else if(k==='armor')s.armor+=n;else if(k==='mhp')s.mhp*=1+.2*n;else if(k==='regen')s.regen+=.2*n;else if(k==='cd')s.cd-=.08*n;else if(k==='area')s.area+=.1*n;else if(k==='dur')s.dur+=.1*n;else if(k==='amt')s.amt+=n;else if(k==='move')s.move+=.1*n;else if(k==='magnet')s.magnet+=.25*n;else if(k==='luck')s.luck+=.1*n;else if(k==='growth')s.growth+=.08*n;else if(k==='pspd')s.pspd+=.1*n;else if(k==='crit')s.crit+=.05*n;else if(k==='vamp')s.vamp+=.03*n;else if(k==='greed')s.greed+=.2*n;else if(k==='rev')s.rev+=n;else if(k==='inv')s.invb+=.1*n;else if(k==='slow')s.es-=.05*n;else if(k==='barr')s.barr=23-3*n}
 s.mhp=Math.round(s.mhp);const om=p.s?p.s.mhp:s.mhp;p.s=s;if(s.mhp>om)p.hp+=s.mhp-om;p.hp=Math.min(p.hp,s.mhp)}
function ws(w){const d=W[w.k],s=Object.assign({},d.b);for(let i=0;i<w.lv-1;i++)for(const k in d.i[i])s[k]+=d.i[i][k];const ps=P.s;
 return {dmg:s.dmg*ps.might*RKD[wrk(w.k)]*(w.evo?1.6:1),cd:Math.max(.15,s.cd*ps.cd*(w.evo?.7:1)),amt:s.amt+ps.amt+(w.evo?1:0),area:s.area*ps.area*(w.evo?1.25:1),spd:s.spd*ps.pspd,dur:s.dur*ps.dur,pierce:s.pierce+(w.evo?2:0)}}

/* ===== 始める ===== */
function newRun(){TM=TH[STG];TILE=mkTile(TM);EN=[];BU=[];FX=[];DN=[];PK=[];INF=null;LOUT=null;EVL=0;DEATH=null;HURT=0;TIME=0;KILLS=0;GOLD=0;SPWN=0;EVT={};DQ=[];BANK=0;PT=[];EB=[];TG=[];SHAKE=0;LVQ=0;LVO=null;CHST=null;PAUSE=0;RESULT=null;
 const roster=MPON&&MPS.pl?MPS.pl:[{ci:CHI,id:'me',nm:''}];NP=roster.length;TX={lv:1,xp:0};LVT=0;EID=0;BID=0;EVQ=[];
 MAP=mkMap(STG,MPS.seed||(Math.random()*1e9|0));mkTowers();WV={n:0,t:6,q:[]};TB=[];TOAST=[];
 PLS=roster.map((r,i)=>{const c=CHS[r.ci];const q={isPl:1,gold:120,x:MAP.base.x+(i-(roster.length-1)/2)*40,y:MAP.base.y+70,hp:1,lv:1,xp:0,face:1,dx:1,dy:0,inv:0,ws:[{k:c.w,lv:1,t:.5,dm:0,oi:i}],pas:{},hit:0,walk:0,dead:0,ci:r.ci,id:r.id,nm:r.nm,pi:i,in:[0,0]};P=q;stats();q.hp=q.s.mhp;q.off=mkOffers(q);return q});LPI=0;P=PLS[0];
 MODE='play';banner(TM.n,TM.sub);music(AREA().bgm)}
const AREA=()=>A.AR.find(a=>a.k===STG);
const xpNeed=l=>l<20?5+(l-1)*10:l<40?195+(l-20)*13:455+(l-40)*16;

/* ===== 敵 ===== */
const SPD={hum:50,beast:70,heavy:36,blob:44,fly:64,cast:46,stat:38};
function addE(k,x,y,tier,o){const d=A.en[k];if(!d)return null;const m=TIME/60,av=(d.hp[0]+d.hp[1])/2;
 let hp=tier===3?1e9:tier===2?av*6.5*(1+m*.4):tier===1?av*2.2*(1+m*.35):Math.max(4,av*.3*(1+m*.32));
 if(tier!==3)hp*=1+.75*(NP-1);const sp=eSpr(k,tier),r=tier===2?26:tier===1?18:cl(Math.round(d.w*.12),7,16);
 const e=Object.assign({k,d,x,y,tier,hp,mhp:hp,spd:(SPD[d.cat]||32)*(tier===3?4.2:tier===2?.95:tier===1?.9:1.1)*(.9+R()*.2),dmg:tier===3?9999:tier===2?20+m*2.2:tier===1?12+m*1.8:6+m*1.3,r,sp,kx:0,ky:0,fl:0,hc:{},ph:R()*TAU,id:++EID},o||{});if(o&&o.hp)e.hp=e.mhp=o.hp*(1+.75*(NP-1));EN.push(e);return e}
function edgePos(){const q=pk(PLS.filter(q=>!q.dead))||P,a=R()*TAU,rr=hyp(LW,LH)/2+30;return[q.x+Math.cos(a)*rr,q.y+Math.sin(a)*rr]}
const nearPl=(x,y)=>{let b=null,bd=1e9;for(const q of PLS){if(q.dead)continue;const d=hyp(q.x-x,q.y-y);if(d<bd){bd=d;b=q}}return b||PLS[0]};const minPlD=(x,y)=>{let bd=1e9;for(const q of PLS)bd=Math.min(bd,hyp(q.x-x,q.y-y));return bd};
function spawnLamp(){let x,y,k=0;do{x=R()*MAP.W;y=R()*MAP.H;k++}while(k<50&&(cellAt(x,y)!==0||hyp(x-MAP.base.x,y-MAP.base.y)<200));EN.push({lamp:1,x,y,hp:1,mhp:1,r:15,hc:{},kx:0,ky:0,fl:0,id:++EID})}
function spawner(dt){const P0=P;P=pk(PLS.filter(q=>!q.dead))||P;spawner0(dt);P=P0}
function spawner0(dt){const m=TIME/60,ar=AREA(),nm=ar.nm;const n=Math.min(nm.length,2+Math.floor(m*1.3));const pool=nm.slice(Math.max(0,n-5),n);
 const want=Math.min(380,(40+m*24)*(1+.35*(NP-1)));const live=EN.reduce((a,e)=>a+(!e.lamp&&!e.tier&&!e.sw?1:0),0);SPWN-=dt;
 if(SPWN<=0){SPWN=.35;const k=Math.min(10,Math.ceil((want-live)/3));for(let i=0;i<k;i++){const[x,y]=edgePos();addE(pk(pool),x,y,0)}}
 // 決まった時刻の出来事
 const at=(s,f)=>{if(TIME>=s&&!EVT[s]){EVT[s]=1;f()}};
 for(let s=150;s<1800;s+=180)at(s,()=>{const gr=pk(ar.el);const[x,y]=edgePos();const e=addE(pk(gr),x,y,1);if(e)banner(e.d.n,'強い気配が近づく',1.6)});
 for(const s of[180,480,780,1080,1380])at(s,()=>swarm(pool));
 for(const s of[360,960,1560])at(s,()=>ring(pool));
 for(const[s,j]of[[600,0],[1200,1],[1500,2]])at(s,()=>{const gr=ar.bo[j%ar.bo.length];const[x,y]=edgePos();let b=null;gr.forEach((k,i)=>{const e=addE(k,x+(i-(gr.length-1)/2)*60,y,i===(gr.length>>1)||gr.length===1?2:1);if(e&&e.tier===2)b=e});if(b){banner(b.d.n,'主が現れた',2.4);music(ar.bx)}});
 at(1800,()=>{const[x,y]=edgePos();addE('reaper',x,y,3);banner('死神','時が満ちた',3);music('x')});
 if(R()<dt*.5&&EN.filter(e=>e.lamp).length<5)spawnLamp()}
function swarm(pool){const fl=pool.filter(k=>A.en[k].cat==='fly'||A.en[k].cat==='beast');const k=pk(fl.length?fl:pool);const a=R()*TAU,vx=Math.cos(a),vy=Math.sin(a),px=-vy,py=vx;
 for(let i=0;i<26;i++){const o=(i-13)*16,x=P.x-vx*(LW*.7)+px*o+(R()-.5)*20,y=P.y-vy*(LW*.7)+py*o+(R()-.5)*20;addE(k,x,y,0,{sw:{vx:vx*110,vy:vy*110,t:14},hp:4+TIME/60*2,mhp:4+TIME/60*2})}}
function ring(pool){const k=pk(pool.filter(k=>A.en[k].cat==='heavy'||A.en[k].cat==='stat').concat(pool).slice(0,3));const n=40,rr=Math.min(LW,LH)*.62;for(let i=0;i<n;i++){const a=i/n*TAU;addE(k,P.x+Math.cos(a)*rr,P.y+Math.sin(a)*rr,0,{spd:12})}banner('包囲','',1.4)}

/* ===== 当たり：格子に入れて探す ===== */
const GC=64;let GRID=new Map();
function grid(){GRID=new Map();for(const e of EN){if(e.dead)continue;const k=((e.x/GC)|0)+((e.x<0)?-1:0)+','+(((e.y/GC)|0)+((e.y<0)?-1:0));let a=GRID.get(k);if(!a)GRID.set(k,a=[]);a.push(e)}}
function near(x,y,r,f){const x0=Math.floor((x-r-28)/GC),x1=Math.floor((x+r+28)/GC),y0=Math.floor((y-r-28)/GC),y1=Math.floor((y+r+28)/GC);for(let i=x0;i<=x1;i++)for(let j=y0;j<=y1;j++){const a=GRID.get(i+','+j);if(a)for(const e of a)if(!e.dead&&hyp(e.x-x,e.y-y)<r+e.r)if(f(e)===false)return}}
function hitE(e,d,w,kx,ky){if(e.dead)return;if(e.lamp){e.dead=1;lampDrop(e);return}const sh=w&&PLS[w.oi]||P;let v=Math.round(d*(.9+R()*.2)),cr=0;if(w&&R()<sh.s.crit){v*=2;cr=1}if(MPON&&EVQ.length<120)evq(['h',e.x|0,e.y-e.sp.h*.4|0,v,WCOL[w&&w.k]||'255,240,220',cr,e.y-e.sp.h*.6|0]);e.hp-=v;e.fl=.1;if(w)w.dm+=Math.min(v,e.hp+v);
 if(e.tier<2&&!e.sw){const kb=e.tier?.3:1;e.kx+=(kx||0)*60*kb;e.ky+=(ky||0)*60*kb}if(DN.length<70)DN.push({x:e.x+(R()-.5)*8,y:e.y-e.sp.h*.6,v,t:.6,c:cr?'#ffd040':0});if(PT.length<600){const c=WCOL[w&&w.k]||'255,240,220',hy=e.y-e.sp.h*.4;glowAt(e.x,hy,c,9+Math.min(10,v*.3),.14);sparks(e.x,hy,2,c,110)}snd('spa',90);if(e.hp<=0)killE(e,w?sh:null)}
function killE(e,kl){e.dead=1;KILLS++;if(MPON)evq(['d',e.id]);if(R()<P.s.vamp)P.hp=Math.min(P.s.mhp,P.hp+1);const m=TIME/60;FX.push({ty:'die',x:e.x,y:e.y,t:.35,t0:.35,e});const hy=e.y-e.sp.h*.35,nb=e.tier?26:6;for(let i=0;i<nb;i++){const a=R()*TAU,v=40+R()*90;part(e.x,hy,Math.cos(a)*v,Math.sin(a)*v*.6-20,.35+R()*.3,pk(['70,20,24','40,30,40','120,30,30']),1+RI(2),0,160)}part(e.x,e.y-4,0,-8,.5,'60,50,60',e.r*.6,2);if(e.tier){glowAt(e.x,hy,'255,200,120',60,.35);shake(e.tier===2?8:4)}
 if(e.tier===2||e.tier===1){PK.push({ty:'chest',x:e.x,y:e.y,big:e.tier===2});if(e.tier===2&&!EN.some(o=>!o.dead&&o.tier===2))music(AREA().bgm)}
 const gk=Math.round(Math.sqrt(e.mhp)*(e.tier===2?6:e.tier===1?3:1.1));if(e.tier){for(const q of PLS)q.gold+=gk;DN.push({x:e.x,y:e.y-e.sp.h-10,v:'+'+gk+'G',t:1.2,c:'#ffd860',big:1})}else{const q=kl||P;q.gold+=gk*q.s.greed;for(const o of PLS)if(o!==q)o.gold+=gk*.3;if(q===LP()&&R()<.5)DN.push({x:e.x,y:e.y-14,v:'+'+Math.round(gk*q.s.greed),t:.7,c:'#ffd860'})}
 if(e.fin){/* 最後の主 */}}
function gem(x,y,v){PK.push({ty:'xp',x,y,v,c:gc(v)})}
// 遠くに残った結晶は1つの赤い結晶にまとめ、画面の近くに置く
let BANK=0;function bankGems(){const D=hyp(LW,LH)*.9;for(const k of PK)if(k.ty==='xp'&&!k.bk&&minPlD(k.x,k.y)>D){BANK+=k.v;k.got=1}PK=PK.filter(k=>!k.got);if(BANK>0){let r=PK.find(k=>k.bk);if(!r||hyp(r.x-P.x,r.y-P.y)>D){if(r)r.got=1;const a=R()*TAU;r={ty:'xp',bk:1,x:P.x+Math.cos(a)*LW*.35,y:P.y+Math.sin(a)*LH*.35,v:0,c:3};PK.push(r)}r.v+=BANK;BANK=0}}
const gc=v=>v>=50?3:v>=10?2:v>=2?1:0;
function lampDrop(e){FX.push({ty:'puff',x:e.x,y:e.y,t:.3,t0:.3});PK.push({ty:'food',x:e.x,y:e.y})}
function hurtP(d){const p=P;if(p.inv>0||p.dead||DEATH||NETC)return;if(p.s.barr&&(p.bar||0)<=0){p.bar=p.s.barr;p.inv=.5;FX.push({ty:'wave',x:p.x,y:p.y-10,r:40,t:.35,t0:.35,c:'200,230,255'});snd('tn',100);return}
 const v=Math.max(1,Math.round(d-p.s.armor));p.hp-=v;p.inv=.3+p.s.invb;p.hit=.2;p.hurtT=.4;if(p===LP())HURT=Math.min(1,.45+v/40);if(MPON)evq(['u',p.pi,v]);DN.push({x:p.x+(R()-.5)*6,y:p.y-44,v:'-'+v,t:.8,c:'#ff5a5a',big:1});sparks(p.x,p.y-20,8,'255,80,70',130);glowAt(p.x,p.y-20,'255,60,50',26,.2);shake(2+Math.min(5,v*.25));snd('ea',150);if(p.hp<=0){if((p.s.rev-(p.revU||0))>0){p.revU=(p.revU||0)+1;p.hp=p.s.mhp*.5;p.inv=2.5;banner('お守りが砕けた','もう一度立ち上がる',1.8);FX.push({ty:'bellw',x:p.x,y:p.y-8,r:0,rm:220,t:.7,t0:.7,hit:new Set(),dmg:0,w:null});glowAt(p.x,p.y-20,'255,230,160',90,.6);shake(8);return}p.hp=0;p.dead=1;p.dT=0;p.hpLag=0;p.rsp=6+TX.lv*.4;if(p===LP()){HURT=1;shake(10)}if(MPON)evq(['u',p.pi,0,1]);for(let i=0;i<30;i++){const a=R()*TAU,v=40+R()*120;part(p.x,p.y-20,Math.cos(a)*v,Math.sin(a)*v*.6-30,.7,pk(['200,30,40','120,20,30','255,90,80']),2,0,200)}snd('ls')}}
let HURT=0,DEATH=null;const LP=()=>PLS[LPI]||P;

/* ===== 武器を使う ===== */
function nearest(n,rmax){const a=[];for(const e of EN){if(e.dead||e.lamp)continue;const d=hyp(e.x-P.x,e.y-P.y);if(d<(rmax||420))a.push([d,e])}a.sort((x,y)=>x[0]-y[0]);return a.slice(0,n).map(x=>x[1])}
function onScreen(){return EN.filter(e=>!e.dead&&!e.lamp&&Math.abs(e.x-P.x)<LW/2&&Math.abs(e.y-P.y)<LH/2)}
function fire(w,s,dt){const p=P;if(FIRE2[w.k])return FIRE2[w.k](w,s,dt,p);
 if(w.k==='jelly'){w.on=(w.on||0)-dt;if(w.on<=0&&!w.evo){w.t-=dt;if(w.t<=0){w.on=s.dur;w.t=s.cd}}const act=w.evo||w.on>0;w.act=act;if(!act)return;w.ang=(w.ang||0)+dt*3*s.spd;const rr=58*s.area;
  for(let i=0;i<s.amt;i++){const a=w.ang+i/s.amt*TAU,x=p.x+Math.cos(a)*rr,y=p.y-10+Math.sin(a)*rr;near(x,y,12*s.area,e=>{if((e.hc.j||0)<T){e.hc.j=T+.45;hitE(e,s.dmg,w,Math.cos(a),Math.sin(a))}})}return}
 if(w.k==='poison'){w.t-=dt;const rr=46*s.area;w.rr=rr;if(w.t<=0){w.t=s.cd;near(p.x,p.y,rr,e=>{const d=hyp(e.x-p.x,e.y-p.y)||1;hitE(e,s.dmg,w,(e.x-p.x)/d*.4,(e.y-p.y)/d*.4)});if(w.evo&&R()<.3)p.hp=Math.min(p.s.mhp,p.hp+1)}return}
 w.t-=dt;if(w.t>0)return;w.t=s.cd;
 if(w.k==='sword'){for(let i=0;i<s.amt;i++){const side=i%2===0?P.face:-P.face;later(i*.12,()=>{const ww=96*s.area,hh=(w.evo?40:28)*s.area,cx=P.x+side*(ww/2+8),cy=P.y-14-(i>1?20:0);FX.push({ty:'slash',x:cx,y:cy,w:ww,h:hh,s:side,t:.24,t0:.24,ev:w.evo});for(let j=0;j<7;j++){const q=j/6,ex=cx+side*(q-.5)*ww,ey=cy-Math.sin(q*Math.PI)*hh*.45;part(ex,ey,side*(60+R()*80),-20-R()*30,.25,w.evo?'255,190,120':'255,240,210',1,3)}if(w.evo)shake(2);near(cx,cy,ww/2,e=>{if(Math.abs(e.y-cy)<hh/2+e.r&&Math.abs(e.x-cx)<ww/2+e.r)hitE(e,s.dmg,w,side,0)})})}snd('wsw',100)}
 else if(w.k==='knife'){const d=hyp(p.dx,p.dy)||1,vx=p.dx/d,vy=p.dy/d;for(let i=0;i<s.amt;i++){const o=(i-(s.amt-1)/2)*7;later(i*(w.evo?.03:.07),()=>BU.push({ty:'knife',x:P.x-vy*o,y:P.y-14+vx*o,vx:vx*340*s.spd,vy:vy*340*s.spd,r:5,dmg:s.dmg,pc:s.pierce,t:1.1,w,hit:new Set()}))}snd('wkn',90)}
 else if(w.k==='moon'){for(let i=0;i<s.amt;i++){const dir=i%2?-p.face:p.face;const vy=i>=2?(i===2?-1:1):0,vx=vy?0:dir;BU.push({ty:'moon',x:p.x,y:p.y-14,vx:vx*230*s.spd,vy:vy*230*s.spd,r:16*s.area,dmg:s.dmg,pc:s.pierce,t:.85*s.dur,w,hit:new Set()})}snd('spk',100)}
 else if(w.k==='book'){const ts=nearest(s.amt);for(let i=0;i<s.amt;i++){const e=ts[i%Math.max(1,ts.length)];let vx=p.face,vy=0;if(e){const d=hyp(e.x-p.x,e.y-p.y)||1;vx=(e.x-p.x)/d;vy=(e.y-p.y)/d}BU.push({ty:'bolt',x:p.x,y:p.y-18,vx:vx*260*s.spd,vy:vy*260*s.spd,r:6,dmg:s.dmg,pc:s.pierce,t:2,w,hit:new Set(),tg:e,hm:1})}snd('horb',100)}
 else if(w.k==='dumb'){for(let i=0;i<s.amt;i++)BU.push({ty:'dumb',x:p.x,y:p.y-20,vx:(R()-.5)*160+(i-(s.amt-1)/2)*50,vy:-330*s.spd,g:620,r:10*s.area,dmg:s.dmg,pc:s.pierce,t:3,w,hit:new Set(),rot:0});snd('wsw',100)}
 else if(w.k==='spear'){const sc=onScreen();for(let i=0;i<s.amt;i++){const e=pk(sc);const x=e?e.x:p.x+(R()-.5)*LW*.6,y=e?e.y:p.y+(R()-.5)*LH*.6;FX.push({ty:'spear',x,y,t:.4,t0:.4,r:24*s.area,dmg:s.dmg,w,ev:w.evo})}}
 else if(w.k==='fire'){const sc=onScreen();for(let i=0;i<s.amt;i++){const e=pk(sc);const x=e?e.x+(R()-.5)*30:p.x+(R()-.5)*200,y=e?e.y+(R()-.5)*30:p.y+(R()-.5)*160;BU.push({ty:'bottle',x:p.x,y:p.y-20,sx:p.x,sy:p.y-20,tx:x,ty2:y,t:.5,t0:.5,w,s})}}}

let DQ=[];const later=(t,f)=>DQ.push({t,f,p:P});
/* ===== 経験・レベルアップ・宝箱 ===== */
function addXp(v){const p=P;TX.xp+=v*p.s.growth;while(TX.xp>=xpNeed(TX.lv)){TX.xp-=xpNeed(TX.lv);TX.lv++;LVQ++;for(const q of PLS){FX.push({ty:'lvup',x:q.x,y:q.y,t:.6,t0:.6});for(let i=0;i<16;i++)part(q.x+(R()-.5)*30,q.y-R()*20,(R()-.5)*20,-40-R()*60,.8,'255,220,140',1,0);}}for(const q of PLS){q.xp=TX.xp;q.lv=TX.lv}if(LVQ){LVQ=0;const P0=P;for(const q of PLS){P=q;stats()}P=P0;snd('tn');if(MPON)evq(['s','tn'])}}
function canEvo(w){const d=W[w.k];return !w.evo&&w.lv>=8&&P.pas[d.evo.p]}
function lvChoices(){const p=P,o=[];
 for(const w of p.ws)if(w.lv<8)o.push({t:'w',k:w.k,wt:10});if(p.ws.length<WSL())for(const k in W)if(!p.ws.some(w=>w.k===k))o.push({t:'w',k,wt:6});
 for(const k in p.pas)if(p.pas[k]<PS[k].m)o.push({t:'p',k,wt:8});if(Object.keys(p.pas).length<WSL())for(const k in PS)if(!(k in p.pas))o.push({t:'p',k,wt:5});
 const n=R()<.15*(p.s.luck-.9)?4:3,r=[];while(r.length<n&&o.length){const tot=o.reduce((a,x)=>a+x.wt,0);let q=R()*tot,i=0;for(;i<o.length;i++){q-=o[i].wt;if(q<=0)break}r.push(o.splice(Math.min(i,o.length-1),1)[0])}
 if(!r.length)r.push({t:'g'},{t:'h'});return r}
function openLv(){if(MODE!=='play')return;LVQ--;let ch=PLS[0];if(MPON){const al=PLS.filter(q=>!q.dead);ch=al[LVT%Math.max(1,al.length)]||PLS[0];LVT++}const P0=P;P=ch;const opts=lvChoices();P=P0;
 if(ch===LP()){MODE='lv';LVO=opts;SEL=0;LVA={t0:T,pick:-1,pt:0};snd('tn')}else{MODE='lvw';LVW={pi:ch.pi,opts,t0:T};netTo(ch.id,{ty:'lv',opts,lv:TX.lv-LVQ},1)}}
const WSL=()=>[6,4,3,3][Math.max(0,NP-1)]||3;let LVW=null,TX={lv:1,xp:0},LVT=0,NP=1,PLS=[],LPI=0,EID=0,BID=0,EVQ=[];
function takeOpt(o){const p=P;if(o.t==='w'){const w=p.ws.find(w=>w.k===o.k);if(w)w.lv++;else p.ws.push({k:o.k,lv:1,t:.2,dm:0,oi:p.pi||0})}else if(o.t==='p'){p.pas[o.k]=(p.pas[o.k]||0)+1;stats()}else if(o.t==='g')GOLD+=25;else if(o.t==='h')p.hp=Math.min(p.s.mhp,p.hp+30)}
function optInfo(o){if(o.t==='w'){const d=W[o.k],w=P.ws.find(w=>w.k===o.k);return{ic:d.ic,n:d.n,lv:w?'Lv'+(w.lv+1):'新しい武器',d:w?WINC(d.i[w.lv-1]):d.d}}if(o.t==='p'){const d=PS[o.k],n=P.pas[o.k]||0;return{ic:d.ic,n:d.n,lv:n?'Lv'+(n+1):'新しい持ち物',d:d.d}}return o.t==='g'?{ic:'purse',n:'金貨',lv:'',d:'金貨+25'}:{ic:'onigiri',n:'おにぎり',lv:'',d:'HP+30'}}
function openChest(big){const p=P,n=big?(R()<.3*p.s.luck?5:3):(R()<.08*p.s.luck?3:1),items=[];
 for(let i=0;i<n;i++){const ev=p.ws.find(canEvo);if(ev){ev.evo=1;META.evd=META.evd||{};if(!META.evd[ev.k]){META.evd[ev.k]=1;LS.set('battlearena_meta',META)}items.push({ev:1,k:ev.k});continue}const up=p.ws.filter(w=>w.lv<8).map(w=>({t:'w',k:w.k})).concat(Object.keys(p.pas).filter(k=>p.pas[k]<PS[k].m).map(k=>({t:'p',k})));if(up.length){const o=pk(up);items.push(Object.assign({info:optInfo(o)},o));takeOpt(o)}else{items.push({t:'g',info:optInfo({t:'g'})});takeOpt({t:'g'})}}
 const gold=Math.round((big?60:20)*(1+TIME/600)*p.s.greed);GOLD+=gold;CHST={items,gold,t:0,big,ev:items.some(i=>i.ev),pi:p.pi||0};UPT=[];ULT=T;MODE='chest';snd('cl');chestJingle(CHST);if(MPON)netAll({ty:'ch',c:{items:items.map(i=>({ev:i.ev,k:i.k,info:i.info})),gold,big,ev:CHST.ev,pi:CHST.pi}},1)}

/* ===== 更新 ===== */
const KEY={},JOY={on:0,id:-1,ox:0,oy:0,x:0,y:0},MP={down:0,x:0,y:0};
function update(dt){T+=dt;HURT=Math.max(0,HURT-dt*1.6);if(CHST)CHST.t+=dt;SHAKE*=Math.pow(.004,dt);if(BANNER){BANNER.t-=dt;if(BANNER.t<=0)BANNER=null}
 if(NETC){cUpdate(dt);return}if(MPON&&MPS.host)hostNet(dt);
 if(MODE==='chest'&&MPON&&CHST&&CHST.pi!==LPI&&CHST.t>chestTimes(CHST).end+4)chestClose();
 if(MODE!=='play'||(PAUSE||INF)&&!MPON)return;if(DEATH){DEATH.t+=dt;if(DEATH.t>2.3){DEATH=null;endRun();return}dt*=.2}else TIME+=dt;
 // 動く（自分は手元の操作、仲間は届いた操作）
 for(const p of PLS){P=p;let mx=0,my=0,mv=1;
  if(p===LP()){mx=(KEY.d||KEY.arrowright?1:0)-(KEY.a||KEY.arrowleft?1:0);my=(KEY.s||KEY.arrowdown?1:0)-(KEY.w||KEY.arrowup?1:0);
   if(JOY.on){const jx=JOY.x-JOY.ox,jy=JOY.y-JOY.oy,jl=hyp(jx,jy),R0=34;if(jl>R0){JOY.ox=JOY.x-jx/jl*R0;JOY.oy=JOY.y-jy/jl*R0}if(jl>4){mx=jx;my=jy;mv=Math.min(1,jl/R0*1.5)}}
   else if(MP.down&&!TOUCH){const jx=MP.x-LW/2,jy=MP.y-(LH/2-14);if(hyp(jx,jy)>10){mx=jx;my=jy}}}
  else{mx=p.in[0];my=p.in[1];mv=Math.min(1,hyp(mx,my))}
  if(p.dead){mx=0;my=0;p.dT=(p.dT||0)+dt;if(!DEATH&&p.rsp!=null&&!p.left){p.rsp-=dt;if(p.rsp<=0){p.dead=0;p.rsp=null;p.hp=p.s.mhp;p.inv=2.5;p.x=MAP.base.x+(R()-.5)*60;p.y=MAP.base.y+60;p.dT=0;glowAt(p.x,p.y-20,'140,200,255',60,.6);snd('tn')}}}const ml=hyp(mx,my);if(ml>.05){const sp=118*p.s.move*mv;walkTo(p,p.x+mx/ml*sp*dt,p.y+my/ml*sp*dt,0);p.dx=mx/ml;p.dy=my/ml;if(Math.abs(mx)>.1)p.face=mx>0?1:-1;p.walk+=dt}else p.walk=0;
  p.inv-=dt;p.hit-=dt;p.hurtT=Math.max(0,(p.hurtT||0)-dt);p.hpLag=p.hpLag==null?p.hp:Math.max(p.hp,p.hpLag-dt*40);p.bar=(p.bar||0)-dt;p.still=ml>.05?0:(p.still||0)+dt;p.gold=(p.gold||0)+(2+(WV?WV.n*.25:0))*dt;if(!p.dead)p.hp=Math.min(p.s.mhp,p.hp+(p.s.regen+(p.s.nap&&p.still>.6?2.5+p.s.mhp*.012:0))*dt);if(p.s.nap&&p.still>.6&&R()<dt*3)part(p.x+6,p.y-40,4,-14,1.2,'200,230,255',2,0)}
 P=LP();const p=P;
 updWave(dt);updHeal(dt);grid();updPT(dt);updTG(dt);updEB(dt);updTowers(dt);for(const t of TOAST)t.t-=dt;TOAST=TOAST.filter(t=>t.t>0);
 for(const q of DQ)q.t-=dt;const dq=DQ.filter(q=>q.t<=0);DQ=DQ.filter(q=>q.t>0);dq.forEach(q=>{P=q.p||P;q.f()});P=LP();
 for(const pl of PLS){if(pl.dead)continue;P=pl;const p=pl;const vis=EN.some(e=>!e.dead&&!e.lamp&&Math.abs(e.x-p.x)<LW/2+16&&Math.abs(e.y-p.y)<LH/2+16);if(vis)for(const w of p.ws)fire(w,ws(w),dt);
 for(const w of p.ws)if(w.k==='poison'&&w.rr&&R()<.5){const a=R()*TAU,r=R()*w.rr;part(p.x+Math.cos(a)*r,p.y-6+Math.sin(a)*r*.8,(R()-.5)*10,-8-R()*10,1,w.evo?'160,60,90':'110,190,90',3+R()*3,2)}
 for(const w of p.ws)if(w.k==='jelly'&&w.act&&R()<.3){const s=ws(w),a=w.ang+RI(s.amt)/s.amt*TAU,rr=58*s.area;part(p.x+Math.cos(a)*rr,p.y-10+Math.sin(a)*rr,0,-25,.6,'255,200,230',1,0)}}P=LP();
 // 敵
 for(const e of EN){if(e.dead)continue;if(e.lamp){continue}e.fl-=dt;e.ph+=dt*6;const p=nearPl(e.x,e.y);P=p;
  if(bossAI(e,dt)){}
  else if(e.sw){e.x+=e.sw.vx*dt;e.y+=e.sw.vy*dt;e.sw.t-=dt;if(e.sw.t<=0)e.dead=1}
  else if(e.frz>0){e.frz-=dt;e.x+=e.kx*dt;e.y+=e.ky*dt;e.kx*=Math.pow(.02,dt);e.ky*=Math.pow(.02,dt)}
  else{const fly=e.d.cat==='fly',dp=p.dead?1e9:hyp(p.x-e.x,p.y-e.y);let tw=null,dtw=1e9;for(const t of TW){if(t.dead)continue;const d2=hyp(t.x-e.x,t.y-e.y)-t.r;if(d2<dtw){dtw=d2;tw=t}}
   let vx=0,vy=0;const es=p.s.es;const goTo=(tx2,ty2)=>{if(losOK(e.x,e.y,tx2,ty2,fly)){const d=hyp(tx2-e.x,ty2-e.y)||1;vx=(tx2-e.x)/d;vy=(ty2-e.y)/d;return 1}return 0};
   const flow=()=>{const f=flowDir(e.x,e.y);if(f&&(f[0]||f[1])){const l=hyp(f[0],f[1]);vx=f[0]/l;vy=f[1]/l}else{const d=hyp(MAP.base.x-e.x,MAP.base.y-e.y)||1;vx=(MAP.base.x-e.x)/d;vy=(MAP.base.y-e.y)/d}};
   if(tw&&dtw<230){if(!goTo(tw.x,tw.y))flow()}else if(dp<170){if(!goTo(p.x,p.y))flow()}else flow();
   if(tw&&dtw<e.r+6){vx*=.05;vy*=.05;e.at=(e.at||0)-dt;if(e.at<=0){e.at=1;hurtTower(tw,e.dmg*(e.tier===2?.85:e.tier?1:.7));e.atkT=.2}}
   walkTo(e,e.x+(vx*e.spd*es+e.kx)*dt,e.y+(vy*e.spd*es+e.ky)*dt,fly);e.kx*=Math.pow(.02,dt);e.ky*=Math.pow(.02,dt);
   // 引っかかったら道の次のマスへ押し出す（だめなら近くの門から出直す）
   e.stT=(e.stT||0)+dt;if(e.stT>1.5){e.stT=0;const mv=hyp(e.x-(e.sx0||0),e.y-(e.sy0||0));e.sx0=e.x;e.sy0=e.y;if(mv<6&&!(tw&&dtw<e.r+8)&&dp>40){const f=flowDir(e.x,e.y);if(f&&(f[0]||f[1])){const i=Math.floor(e.x/CSZ)+f[0],j=Math.floor(e.y/CSZ)+f[1];e.x=(i+.5)*CSZ;e.y=(j+.5)*CSZ}else{const c=nearOpen(e.x,e.y);if(c){e.x=c[0];e.y=c[1]}}}}}
  for(const q of PLS)if(!q.dead&&hyp(q.x-e.x,q.y-e.y)<e.r+9){P=q;hurtP(e.dmg)}}P=LP();
 // 押し合い（軽く）
 for(const e of EN){if(e.dead||e.lamp||e.sw||e.tier===3)continue;near(e.x,e.y,e.r,o=>{if(o===e||o.lamp||o.sw)return;const dx=e.x-o.x,dy=e.y-o.y,d=hyp(dx,dy),big=o.tier>=1&&!e.tier;const m=(e.r+o.r)*(big?1.15:.8);if(d<m&&d>.01){const k=(m-d)*(big?.9:.25);e.x+=dx/d*k;e.y+=dy/d*k}})}
 for(let i=EN.length-1;i>=0;i--){const e=EN[i];if(e.dead&&!FX.some(f=>f.e===e))EN.splice(i,1);else if(e.lamp&&minPlD(e.x,e.y)>1400)EN.splice(i,1)}
 // 弾
 for(const b of BU){b.t-=dt;
  if(b.ty==='bottle'){const k=1-b.t/b.t0;b.x=b.sx+(b.tx-b.sx)*k;b.y=b.sy+(b.ty2-b.sy)*k-Math.sin(k*Math.PI)*60;if(b.t<=0){FX.push({ty:'pool',x:b.tx,y:b.ty2,r:30*b.s.area*(b.w.evo?1.3:1),t:b.s.dur,t0:b.s.dur,tk:0,dmg:b.s.dmg,w:b.w});sparks(b.tx,b.ty2,10,'255,170,80',140);glowAt(b.tx,b.ty2,'255,140,60',34,.3);for(let i=0;i<4;i++)part(b.tx+(R()-.5)*20,b.ty2-6,(R()-.5)*10,-20,.8,'70,50,50',6,2);snd('efire',150)}continue}
  if(b.ty==='bomb'){const k=1-b.t/b.t0;b.x=b.sx+(b.tx-b.sx)*k;b.y=b.sy+(b.ty2-b.sy)*k-Math.sin(k*Math.PI)*70;b.rot=(b.rot||0)+dt*8;if(R()<.6)part(b.x+3,b.y-6,(R()-.5)*20,-20,.2,'255,200,120',1,0);if(b.t<=0){const r=46*b.s.area*(b.w.evo?1.35:1);near(b.tx,b.ty2,r,e=>{const d=hyp(e.x-b.tx,e.y-b.ty2)||1;hitE(e,b.s.dmg,b.w,(e.x-b.tx)/d,(e.y-b.ty2)/d)});FX.push({ty:'boom',x:b.tx,y:b.ty2,r,t:.4,t0:.4});sparks(b.tx,b.ty2-6,16,'255,180,90',200);for(let i=0;i<7;i++)part(b.tx+(R()-.5)*r,b.ty2-6+(R()-.5)*r*.5,(R()-.5)*20,-25,1,'70,60,60',7,2);shake(b.w.evo?5:3);snd('eslam',120)}continue}
  if(b.ax){b.vx+=b.ax*dt;b.vy+=b.ay*dt;b.rot+=dt*14}
  if(b.bn){const O=PLS[b.w.oi]||P,L=O.x-LW/2+6,Rr=O.x+LW/2-6,Tp=O.y-LH/2+6,Bt=O.y+LH/2-6;if(b.x<L&&b.vx<0||b.x>Rr&&b.vx>0)b.vx*=-1;if(b.y<Tp&&b.vy<0||b.y>Bt&&b.vy>0)b.vy*=-1}
  if(b.hm&&b.tg&&!b.tg.dead){const dx=b.tg.x-b.x,dy=b.tg.y-12-b.y,d=hyp(dx,dy)||1,sp=hyp(b.vx,b.vy);b.vx+=(dx/d*sp-b.vx)*dt*5;b.vy+=(dy/d*sp-b.vy)*dt*5}
  if(b.g){b.vy+=b.g*dt;b.rot+=dt*10}(b.tr||(b.tr=[])).unshift({x:b.x,y:b.y,r:b.rot});if(b.tr.length>7)b.tr.pop();b.x+=b.vx*dt;b.y+=b.vy*dt;
  if(b.ty==='bolt'&&R()<.8)part(b.x+(R()-.5)*4,b.y+(R()-.5)*4,(R()-.5)*20,(R()-.5)*20,.35,b.w.evo?'255,170,90':'190,130,255',4,1);if(b.ty==='moon'&&R()<.6)part(b.x+(R()-.5)*b.r,b.y+(R()-.5)*b.r,-b.vx*.1,-b.vy*.1,.3,'210,235,255',1,0);
  if(b.rh){near(b.x,b.y+12,b.r,e=>{if((b.hh.get(e)||0)>T)return;b.hh.set(e,T+b.rh);const d=hyp(b.vx,b.vy)||1;hitE(e,b.dmg,b.w,b.vx/d,b.vy/d)});continue}
  near(b.x,b.y+12,b.r,e=>{if(b.hit.has(e)||b.pc<=0)return;b.hit.add(e);b.pc--;const d=hyp(b.vx,b.vy)||1;hitE(e,b.dmg,b.w,b.vx/d,b.vy/d);if(b.frz&&!e.dead&&e.tier!==3){e.frz=e.tier===2?b.frz*.3:b.frz;sparks(e.x,e.y-10,4,'190,230,255',80)}if(b.pc<=0){b.t=0;return false}})}
 BU=BU.filter(b=>b.t>0);
 // 演出と、時間で効くもの
 for(const f of FX){f.t-=dt;if(f.ty==='spear'&&!f.done&&f.t<=f.t0*.35){f.done=1;near(f.x,f.y,f.r,e=>hitE(e,f.dmg,f.w,0,0));snd('horb',120);FX.push({ty:'wave',x:f.x,y:f.y,r:f.r*1.8,t:.35,t0:.35,c:f.ev?'255,210,120':'235,240,255'});sparks(f.x,f.y-4,12,f.ev?'255,210,120':'240,245,255',160);for(let i=0;i<6;i++)part(f.x+(R()-.5)*f.r,f.y,(R()-.5)*40,-30-R()*40,.5,'150,140,130',2,0,180);shake(2)}
  if(f.ty==='pool'&&R()<.35)part(f.x+(R()-.5)*f.r*1.4,f.y+(R()-.5)*f.r*.7,(R()-.5)*8,-30-R()*30,.7,R()<.5?'255,190,90':'255,120,50',1+RI(2),0)
  if(f.ty==='bellw'){f.r=f.rm*(1-f.t/f.t0);near(f.x,f.y+8,f.r,e=>{if(f.hit.has(e))return;const d=hyp(e.x-f.x,e.y-f.y)||1;if(d<f.r-30)return;f.hit.add(e);if(f.dmg)hitE(e,f.dmg,f.w,(e.x-f.x)/d*3,(e.y-f.y)/d*3);else if(!e.lamp&&e.tier<2){e.kx+=(e.x-f.x)/d*300;e.ky+=(e.y-f.y)/d*300}})}
  if(f.ty==='pool'){f.tk-=dt;if(f.tk<=0){f.tk=.4;near(f.x,f.y,f.r,e=>hitE(e,f.dmg,f.w,0,0))}}}
 FX=FX.filter(f=>f.t>0);for(const d of DN){d.t-=dt;d.y-=dt*24}DN=DN.filter(d=>d.t>0);
 // 拾う
 for(const p of PLS){if(p.dead||MODE!=='play')continue;P=p;const mg=40*p.s.magnet;for(const k of PK){if(k.got)continue;const d=hyp(k.x-p.x,k.y-p.y);if(k.ty==='chest'){if(d<24){k.got=1;openChest2(p,k.big,k.x,k.y)}continue}if(k.mg&&k.mp!==p&&k.mp)continue;
  if(d<mg||k.mg){k.mg=1;k.mp=k.mp||p;k.sp=(k.sp||60)+dt*500;const dx=p.x-k.x,dy=p.y-6-k.y,dd=hyp(dx,dy)||1;k.x+=dx/dd*Math.min(dd,k.sp*dt);k.y+=dy/dd*Math.min(dd,k.sp*dt)}
  if(hyp(k.x-p.x,k.y-p.y+6)<12){k.got=1;if(k.ty==='xp'){addXp(k.v);snd('pk',40)}else if(k.ty==='coin'){GOLD+=Math.round(k.v*p.s.greed);snd('cl',60)}else if(k.ty==='food'){p.hp=Math.min(p.s.mhp,p.hp+30);snd('ps')}else if(k.ty==='mag'){for(const o of PK)if(o.ty==='xp'||o.ty==='coin'){o.mg=1;o.mp=p}snd('tn');glowAt(p.x,p.y-10,'140,200,255',60,.4)}}}}P=LP();
 PK=PK.filter(k=>!k.got);
}
function endRun(){if(NETC)return;const wn=WV?WV.n:0,won=!!(WV&&WV.won);const GOLDM=Math.round(PLS.reduce((a,q)=>a+(q.gold||0),0)*.2+KILLS*.3+(won?300:0));GOLD=GOLDM;if(MPON&&MPS.host){netAll({ty:'end',r:{time:TIME,lv:TX.lv,kills:KILLS,gold:GOLD,wn,won}});MPS.started=0}MODE='result';const g2=GOLD;META.gold+=g2;const bk=STG;META.bt=META.bt||{};META.bw=META.bw||{};META.bw[bk]=Math.max(META.bw[bk]||0,won?NWAVE+1:wn);META.bt[bk]=Math.max(META.bt[bk]||0,TIME);META.bc=META.bc||{};const o=META.bc[CHI]||{t:0,lv:0,k:0};META.bc[CHI]={t:Math.max(o.t,TIME),lv:Math.max(o.lv,P.lv),k:o.k+KILLS};LS.set('battlearena_meta',META);RESULT={time:TIME,lv:TX.lv,kills:KILLS,gold:g2,wn,won,ws:LP().ws.map(w=>({...w}))};music('m');snd(won?'wn':'ls')}
function banner(s,sub,t){BANNER={s,sub:sub||'',t:t||2.2}}

/* ===== 粒（演出）・画面の揺れ ===== */
let PT=[],SHAKE=0,EB=[],TG=[];
function part(x,y,vx,vy,t,c,s,ty,gv){if(PT.length<900)PT.push({x,y,vx,vy,t,t0:t,c,s:s||2,ty:ty||0,g:gv||0})}
/* ty 0:四角の点 1:光のにじみ 2:煙 3:短い線（速さの向き） */
function sparks(x,y,n,c,sp){for(let i=0;i<n;i++){const a=R()*TAU,v=(.4+R())*(sp||90);part(x,y,Math.cos(a)*v,Math.sin(a)*v*.7,.18+R()*.2,c,1,3)}}
function glowAt(x,y,c,s,t){part(x,y,0,0,t||.18,c,s||10,1)}
const shake=v=>{SHAKE=Math.max(SHAKE,v)};
const GLC={};function glowC(c){if(GLC[c])return GLC[c];const n=32,cv2=MKC(n,n),x=cv2.getContext('2d'),gr=x.createRadialGradient(n/2,n/2,0,n/2,n/2,n/2);gr.addColorStop(0,`rgba(${c},1)`);gr.addColorStop(.35,`rgba(${c},.45)`);gr.addColorStop(1,`rgba(${c},0)`);x.fillStyle=gr;x.fillRect(0,0,n,n);return GLC[c]=cv2}
function updPT(dt){for(const p of PT){p.t-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.g*dt;if(p.ty===3||p.ty===0){p.vx*=Math.pow(.05,dt);p.vy*=Math.pow(.05,dt)}}PT=PT.filter(p=>p.t>0)}
function drawPT(X,Y,list){const L=list||PT;for(const p of L){const k=p.t/p.t0,x=X(p.x),y=Y(p.y);
 if(p.ty===1){g.globalCompositeOperation='lighter';g.globalAlpha=k;const s=p.s*(1.2-k*.2);g.drawImage(glowC(p.c),x-s,y-s,s*2,s*2);g.globalAlpha=1;g.globalCompositeOperation='source-over'}
 else if(p.ty===2){g.fillStyle=`rgba(${p.c},${.28*k})`;g.beginPath();g.arc(x,y,p.s*(1+(1-k)*1.8),0,TAU);g.fill()}
 else if(p.ty===3){const v=hyp(p.vx,p.vy)||1,l=Math.min(7,v*.05+2);g.strokeStyle=`rgba(${p.c},${k})`;g.lineWidth=1;g.beginPath();g.moveTo(x,y);g.lineTo(x-p.vx/v*l,y-p.vy/v*l);g.stroke()}
 else{g.fillStyle=`rgba(${p.c},${k})`;g.fillRect(x-p.s/2|0,y-p.s/2|0,p.s,p.s)}}}
const WCOL={sword:'255,226,180',knife:'220,232,255',moon:'180,220,255',book:'200,150,255',dumb:'235,235,225',jelly:'255,170,210',spear:'255,244,210',poison:'140,220,110',fire:'255,150,60'};

/* ===== 追加の武器（11種）の撃ち方 ===== */
const FIRE2={
 chain(w,s,dt,p){if((w.t-=dt)>0)return;w.t=s.cd;const st=nearest(s.amt,320);for(const e0 of st){let e=e0,px=p.x,py=p.y-18;const pts=[[px,py]],hit=new Set();for(let j=0;j<=s.pierce&&e;j++){hit.add(e);const ey=e.y-e.sp.h*.45;pts.push([e.x,ey]);hitE(e,s.dmg,w,0,0);let nb=null,bd=110*s.area;near(e.x,e.y,bd,o=>{if(hit.has(o)||o.lamp)return;const d=hyp(o.x-e.x,o.y-e.y);if(d<bd){bd=d;nb=o}});e=nb}FX.push({ty:'zap',pts,t:.22,t0:.22,c:w.evo?'255,220,120':'170,210,255'})}snd('ebolt',120)},
 bomb(w,s,dt,p){if((w.t-=dt)>0)return;w.t=s.cd;const sc=onScreen();for(let i=0;i<s.amt;i++){const e=pk(sc);const x=e?e.x:p.x+(R()-.5)*220,y=e?e.y:p.y+(R()-.5)*160;BU.push({ty:'bomb',x:p.x,y:p.y-20,sx:p.x,sy:p.y-20,tx:x,ty2:y,t:.6,t0:.6,w,s})}},
 thorn(w,s,dt,p){if((w.t-=dt)>0)return;w.t=s.cd;const n=4+s.amt*2,o=R()*TAU;for(let i=0;i<n;i++){const a=o+i/n*TAU;BU.push({ty:'spike',x:p.x,y:p.y-14,vx:Math.cos(a)*260*s.spd,vy:Math.sin(a)*260*s.spd,r:5,dmg:s.dmg,pc:s.pierce,t:.45*s.dur,w,hit:new Set()})}snd('ebite',120)},
 pen(w,s,dt,p){if((w.t-=dt)>0)return;w.t=s.cd;const ts=nearest(s.amt,500);for(let i=0;i<s.amt;i++){const e=ts[i%Math.max(1,ts.length)];let vx=p.face,vy=0;if(e){const d=hyp(e.x-p.x,e.y-12-p.y)||1;vx=(e.x-p.x)/d;vy=(e.y-12-p.y)/d}BU.push({ty:'needle',x:p.x,y:p.y-16,vx:vx*560*s.spd,vy:vy*560*s.spd,r:4,dmg:s.dmg,pc:s.pierce,t:.9,w,hit:new Set()})}snd('wkn',80)},
 marble(w,s,dt,p){if((w.t-=dt)>0)return;w.t=s.cd;for(let i=0;i<s.amt;i++){const a=R()*TAU;BU.push({ty:'marble',x:p.x,y:p.y-14,vx:Math.cos(a)*230*s.spd,vy:Math.sin(a)*230*s.spd,r:7*s.area,dmg:s.dmg,pc:999,t:3*s.dur,w,hit:new Set(),rh:.45,hh:new Map(),bn:1,c:pk(['120,200,255','255,140,180','160,255,170','255,220,120'])})}snd('cl',80)},
 oni(w,s,dt,p){if((w.t-=dt)>0)return;w.t=s.cd;const ts=nearest(s.amt,400);for(let i=0;i<s.amt;i++){const e=ts[i];const a=e?Math.atan2(e.y-12-p.y,e.x-p.x):(i/s.amt*TAU);BU.push({ty:'oni',x:p.x,y:p.y-14,vx:Math.cos(a)*330*s.spd,vy:Math.sin(a)*330*s.spd,ax:-Math.cos(a)*330*s.spd/0.9,ay:-Math.sin(a)*330*s.spd/0.9,r:11*s.area,dmg:s.dmg,pc:999,t:2.2,w,hit:new Set(),rh:.5,hh:new Map(),rot:0})}snd('wsw',100)},
 sakura(w,s,dt,p){if((w.t-=dt)>0)return;w.t=s.cd;const d=hyp(p.dx,p.dy)||1,a0=Math.atan2(p.dy/d,p.dx/d),n=s.amt+3,sp=.9*s.area;for(let i=0;i<n;i++){const a=a0+(i/(n-1)-.5)*sp;BU.push({ty:'petal',x:p.x,y:p.y-14,vx:Math.cos(a)*250*s.spd,vy:Math.sin(a)*250*s.spd,r:5,dmg:s.dmg,pc:s.pierce,t:.6*s.dur,w,hit:new Set(),rot:R()*6})}snd('wkn',90)},
 bell(w,s,dt,p){if((w.t-=dt)>0)return;w.t=s.cd;for(let i=0;i<s.amt;i++)later(i*.25,()=>{FX.push({ty:'bellw',x:P.x,y:P.y-8,r:0,rm:150*s.area,t:.6,t0:.6,hit:new Set(),dmg:s.dmg,w});snd('tn',100)})},
 lwisp(w,s,dt,p){const W2=w.wsp||(w.wsp=[]);while(W2.length<s.amt)W2.push({x:p.x+(R()-.5)*40,y:p.y-30,vx:0,vy:0,hh:new Map()});W2.length=s.amt;
  for(const q of W2){let tg=null,bd=260;for(const e of EN){if(e.dead||e.lamp)continue;const d=hyp(e.x-q.x,e.y-q.y);if(d<bd&&hyp(e.x-p.x,e.y-p.y)<300){bd=d;tg=e}}const tx2=tg?tg.x:p.x+Math.cos(T*2+W2.indexOf(q))*40,ty2=tg?tg.y-12:p.y-30+Math.sin(T*2+W2.indexOf(q))*20;const dx=tx2-q.x,dy=ty2-q.y,d=hyp(dx,dy)||1,sp=170*s.spd;q.vx+=(dx/d*sp-q.vx)*dt*4;q.vy+=(dy/d*sp-q.vy)*dt*4;q.x+=q.vx*dt;q.y+=q.vy*dt;
   if(hyp(q.x-p.x,q.y-p.y)>340){q.x=p.x;q.y=p.y-30}near(q.x,q.y+12,10*s.area,e=>{if(e.lamp){hitE(e,1);return}if((q.hh.get(e)||0)>T)return;q.hh.set(e,T+.4);hitE(e,s.dmg,w,q.vx/(hyp(q.vx,q.vy)||1),q.vy/(hyp(q.vx,q.vy)||1))});if(R()<.4)part(q.x,q.y,(R()-.5)*10,-20,.4,w.evo?'200,160,255':'120,230,220',3,1)}},
 frost(w,s,dt,p){if((w.t-=dt)>0)return;w.t=s.cd;const sc=onScreen();for(let i=0;i<s.amt;i++){const e=pk(sc);const a=e?Math.atan2(e.y-12-p.y,e.x-p.x):R()*TAU;BU.push({ty:'shard',x:p.x,y:p.y-16,vx:Math.cos(a)*300*s.spd,vy:Math.sin(a)*300*s.spd,r:5,dmg:s.dmg,pc:s.pierce,t:1.2,w,hit:new Set(),frz:(w.evo?1.8:1)*s.dur})}snd('eice',100)},
 lens(w,s,dt,p){if((w.t-=dt)>0)return;w.t=s.cd;const ts=nearest(s.amt,500);for(let i=0;i<s.amt;i++){const e=ts[i];const a=e?Math.atan2(e.y-12-(p.y-16),e.x-p.x):R()*TAU,L=420,wd=(w.evo?16:9)*s.area,x0=p.x,y0=p.y-16;
  const c=Math.cos(a),sn=Math.sin(a);for(const o of EN){if(o.dead)continue;const ox=o.x-x0,oy=o.y-12-y0,t=ox*c+oy*sn;if(t<0||t>L)continue;if(Math.abs(-ox*sn+oy*c)<wd+o.r)hitE(o,s.dmg,w,c*.5,sn*.5)}FX.push({ty:'beam',x:x0,y:y0,a,L,wd,t:.28,t0:.28,ev:w.evo});glowAt(x0+c*10,y0+sn*10,'255,250,220',20,.2)}snd('ebeam',120)}};
const W2D={
 chain:{n:'雷の鎖',ic:'gcab',d:'近くの敵に雷が落ち、次々と伝わる',b:{dmg:11,cd:1.7,amt:1,area:1,spd:1,dur:1,pierce:2},i:[{pierce:1},{dmg:4},{amt:1},{pierce:1},{dmg:5},{area:.25},{amt:1}],evo:{p:'crit',n:'雷神の鎖',ic:'ddisk'}},
 bomb:{n:'火薬玉',ic:'bomb',d:'放った火薬玉が爆ぜて周りを焼く',b:{dmg:24,cd:2.6,amt:1,area:1,spd:1,dur:1,pierce:99},i:[{dmg:8},{area:.2},{amt:1},{dmg:10},{cd:-.3},{area:.2},{amt:1}],evo:{p:'armor',n:'大火薬玉',ic:'pandora'}},
 thorn:{n:'棘の輪',ic:'thorn',d:'周り全部の方へ棘を飛ばす',b:{dmg:8,cd:1.5,amt:1,area:1,spd:1,dur:1,pierce:1},i:[{amt:1},{dmg:3},{pierce:1},{amt:1},{dmg:4},{dur:.3},{amt:1}],evo:{p:'barr',n:'茨の城',ic:'gaunt'}},
 pen:{n:'ペン先',ic:'pen',d:'近くの敵へ鋭い筆先を撃ち抜く',b:{dmg:6,cd:.55,amt:1,area:1,spd:1,dur:1,pierce:3},i:[{dmg:2},{amt:1},{pierce:2},{cd:-.08},{dmg:3},{amt:1},{pierce:3}],evo:{p:'growth',n:'万年の筆',ic:'quill'}},
 marble:{n:'ビー玉',ic:'marble',d:'画面の端で跳ね返る玉',b:{dmg:9,cd:2.6,amt:1,area:1,spd:1,dur:1,pierce:999},i:[{amt:1},{dmg:4},{dur:.3},{amt:1},{spd:.25},{dmg:5},{amt:1}],evo:{p:'move',n:'跳ね回る星',ic:'rcube'}},
 oni:{n:'鬼の面',ic:'oni',d:'投げた面が戻ってくる',b:{dmg:13,cd:1.9,amt:1,area:1,spd:1,dur:1,pierce:999},i:[{dmg:5},{area:.2},{amt:1},{dmg:6},{spd:.2},{amt:1},{dmg:7}],evo:{p:'vamp',n:'鬼神の面',ic:'pflesh'}},
 sakura:{n:'桜のかんざし',ic:'sakura',d:'進む方へ花びらを扇に撒く',b:{dmg:6,cd:1.25,amt:1,area:1,spd:1,dur:1,pierce:1},i:[{amt:1},{dmg:2},{area:.2},{amt:1},{pierce:1},{dmg:3},{amt:2}],evo:{p:'greed',n:'千本桜',ic:'flower'}},
 bell:{n:'呼び鈴',ic:'calling',d:'鈴の音の輪が広がり、敵を押し返す',b:{dmg:9,cd:2.6,amt:1,area:1,spd:1,dur:1,pierce:999},i:[{area:.15},{dmg:4},{cd:-.3},{amt:1},{area:.15},{dmg:5},{amt:1}],evo:{p:'inv',n:'時告げの鐘',ic:'echip'}},
 lwisp:{n:'迷い火',ic:'lwisp',d:'敵を追う火の玉が付き従う',b:{dmg:7,cd:0,amt:1,area:1,spd:1,dur:1,pierce:999},i:[{dmg:3},{amt:1},{spd:.25},{dmg:4},{amt:1},{area:.25},{amt:1}],evo:{p:'magnet',n:'群れる迷い火',ic:'ecto'}},
 frost:{n:'氷の欠片',ic:'oriah',d:'当たった敵を凍らせて止める',b:{dmg:9,cd:1.6,amt:2,area:1,spd:1,dur:1,pierce:1},i:[{amt:1},{dmg:3},{dur:.3},{amt:1},{pierce:1},{dmg:4},{amt:1}],evo:{p:'slow',n:'永久凍土',ic:'dome'}},
 lens:{n:'片眼鏡',ic:'lens',d:'近くの敵へ貫く光線を放つ',b:{dmg:18,cd:2.8,amt:1,area:1,spd:1,dur:1,pierce:999},i:[{dmg:6},{area:.25},{cd:-.3},{amt:1},{dmg:8},{area:.25},{amt:1}],evo:{p:'rev',n:'天眼の光',ic:'bstar'}}};
Object.assign(W,W2D);Object.assign(WCOL,{chain:'170,210,255',bomb:'255,160,80',thorn:'200,230,160',pen:'120,150,220',marble:'200,220,255',oni:'255,120,110',sakura:'255,180,210',bell:'255,230,160',lwisp:'120,230,220',frost:'170,220,255',lens:'255,250,220'});
Object.assign(PS,{crit:{n:'勇気の勲章',ic:'skull',d:'会心+5%（会心は2倍のダメージ）',m:5},vamp:{n:'吸血のキバ',ic:'fang',d:'倒すと3%でHP+1',m:5},greed:{n:'ルビー',ic:'ruby',d:'金貨+20%',m:5},rev:{n:'お守り',ic:'amulet',d:'倒れた時に1回だけ起き上がる',m:1},
 inv:{n:'鳥居',ic:'torii',d:'攻撃を受けた後の無敵時間+0.1秒',m:5},slow:{n:'お茶',ic:'tea',d:'敵の動き-5%',m:5},barr:{n:'木札',ic:'kifuda',d:'一定の間隔で攻撃を1回防ぐ（20秒ごと、Lvごとに-3秒）',m:5}});

/* ===== 主・強い敵の技（場所の敵の見た目の分類で決める） ===== */
const PAT={cast:['ring','aim','spiral','rain'],stat:['ring','spiral','rain','aim'],heavy:['quake','rain','summon','dash'],beast:['dash','aim','dash','summon'],fly:['dash','ring','rain','spiral'],blob:['quake','ring','summon','rain'],hum:['dash','aim','rain','quake']};
function shootE(e,a,sp,big){EB.push({x:e.x,y:e.y-e.sp.h*.4,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:big?7:5,dmg:e.dmg*.45,t:6,c:e.tier===2?'255,80,70':'200,110,255'})}
function bossAI(e,dt){if(e.tier!==1&&e.tier!==2)return 0;if(e.acd==null)e.acd=e.tier===2?2:4;e.acd-=dt;
 if(e.cast>0){e.cast-=dt;if(R()<.5){const a=R()*TAU,r=e.r*2.2;part(e.x+Math.cos(a)*r,e.y-e.sp.h*.4+Math.sin(a)*r,-Math.cos(a)*r*2.5,-Math.sin(a)*r*2.5,.4,e.tier===2?'255,90,80':'255,170,90',1,0)}if(e.cast<=0)doPat(e);return 1}
 if(e.dash>0){e.dash-=dt;walkTo(e,e.x+e.dvx*dt,e.y+e.dvy*dt,e.d.cat==='fly');if(R()<.7)part(e.x+(R()-.5)*e.r,e.y,-e.dvx*.1,-e.dvy*.1-10,.5,'120,100,90',4,2);return 1}
 if(e.spi>0){e.spi-=dt;e.spt-=dt;if(e.spt<=0){e.spt=.08;e.spa+=.42;shootE(e,e.spa,105);shootE(e,e.spa+Math.PI,105)}return 1}
 if(e.acd<=0&&hyp(P.x-e.x,P.y-e.y)<Math.max(LW,LH)*.6){const L=e.tier===2?PAT[e.d.cat]||PAT.hum:(e.d.cat==='cast'||e.d.cat==='stat'||e.d.cat==='fly'?['aim','ring']:['dash','quake']);e.pi=(e.pi||0);e.pat=L[e.pi%L.length];e.pi++;
  e.acd=(e.tier===2?3.2:5.5)*(1-Math.min(.35,TIME/3600));e.cast=e.pat==='dash'?.8:e.pat==='quake'?1.1:e.pat==='rain'?.5:.65;
  const mv=e.d.mv.filter(m=>m.nm||m.lb);if(mv.length){const m=pk(mv);e.lbs=m.nm||m.lb;e.lbt=1.6}
  if(e.pat==='dash'){const a=Math.atan2(P.y-e.y,P.x-e.x);e.da=a;TG.push({ty:'line',x:e.x,y:e.y,a,len:300,w:e.r*1.6,t:e.cast,t0:e.cast,e})}
  else if(e.pat==='quake'){const r=e.tier===2?130:90;TG.push({ty:'circle',x:e.x,y:e.y,r,t:e.cast,t0:e.cast,dmg:e.dmg*.85,e,big:1})}
  else if(e.pat==='rain'){const n=e.tier===2?6:3;for(let i=0;i<n;i++){const ox=i?(R()-.5)*170:0,oy=i?(R()-.5)*120:0,t=1+i*.12;TG.push({ty:'circle',x:P.x+ox,y:P.y+oy,r:36,t,t0:t,dmg:e.dmg*.75,e,fall:1})}}
  snd('emagic',200);return 1}
 return 0}
function doPat(e){const a=Math.atan2(P.y-e.y,P.x-e.x);
 if(e.pat==='dash'){e.dash=.5;e.dvx=Math.cos(e.da)*520;e.dvy=Math.sin(e.da)*520;snd('eslam',150)}
 else if(e.pat==='ring'){const n=e.tier===2?18:10,o=R();for(let i=0;i<n;i++)shootE(e,o+i/n*TAU,115,1);glowAt(e.x,e.y-e.sp.h*.4,'255,120,100',e.r*2.4,.3);snd('emagic',150)}
 else if(e.pat==='aim'){const n=e.tier===2?5:3;for(let i=0;i<n;i++)shootE(e,a+(i-(n-1)/2)*.22,175);snd('emagic',150)}
 else if(e.pat==='spiral'){e.spi=2.4;e.spt=0;e.spa=a}
 else if(e.pat==='summon'){const ar=AREA();for(let i=0;i<6;i++){const an=i/6*TAU,x=e.x+Math.cos(an)*50,y=e.y+Math.sin(an)*40;const o=addE(pk(ar.nm.slice(0,Math.min(ar.nm.length,4+TIME/120|0))),x,y,0);if(o){part(x,y-8,0,-20,.5,'90,40,120',8,2);glowAt(x,y-8,'190,120,255',14,.3)}}snd('emagic',150)}}
function updTG(dt){for(const t of TG){t.t-=dt;if(t.t<=0){if(t.ty==='circle'){for(const q of PLS)if(!q.dead&&hyp(q.x-t.x,q.y-t.y)<t.r+6){P=q;hurtP(t.dmg)}P=LP();for(const w2 of TW)if(!w2.dead&&hyp(w2.x-t.x,w2.y-t.y)<t.r+w2.r)hurtTower(w2,t.dmg*1.5);for(let i=0;i<(t.big?28:14);i++){const a=R()*TAU,v=60+R()*120;part(t.x+Math.cos(a)*t.r*.3,t.y+Math.sin(a)*t.r*.2,Math.cos(a)*v,Math.sin(a)*v*.6,.4,'255,140,90',1,3)}part(t.x,t.y,0,-14,.6,'90,70,60',t.r*.5,2);glowAt(t.x,t.y,'255,110,70',t.r*1.3,.25);shake(t.big?6:3);snd('eslam',100)}}}TG=TG.filter(t=>t.t>0)}
function updEB(dt){for(const b of EB){b.t-=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;for(const q of PLS){if(q.dead||b.t<=0)continue;if(hyp(b.x-q.x,b.y-(q.y-14))<b.r+7){P=q;hurtP(b.dmg);b.t=0;sparks(b.x,b.y,5,b.c,80)}}if(minPlD(b.x,b.y)>LW)b.t=0}P=LP();EB=EB.filter(b=>b.t>0)}
function drawTG(X,Y){for(const t of TG){const k=1-t.t/t.t0;
 if(t.ty==='circle'){const x=X(t.x),y=Y(t.y);g.fillStyle=`rgba(255,40,30,${.10+.12*k})`;g.beginPath();g.ellipse(x,y,t.r,t.r*.62,0,0,TAU);g.fill();g.fillStyle=`rgba(255,70,40,${.25})`;g.beginPath();g.ellipse(x,y,t.r*k,t.r*.62*k,0,0,TAU);g.fill();g.strokeStyle=`rgba(255,120,90,${.5+.4*Math.sin(T*20)})`;g.lineWidth=1;g.beginPath();g.ellipse(x,y,t.r,t.r*.62,0,0,TAU);g.stroke();
  if(t.fall){const fy=y-(1-k)*200;g.globalCompositeOperation='lighter';g.drawImage(glowC('255,120,70'),x-9,fy-9,18,18);g.globalCompositeOperation='source-over';g.fillStyle='#ffe0c0';g.fillRect(x-1,fy-1,3,3)}}
 else if(t.ty==='line'){const x=X(t.x),y=Y(t.y);g.save();g.translate(x,y-8);g.rotate(t.a);g.fillStyle=`rgba(255,40,30,${.12+.15*k})`;g.fillRect(0,-t.w/2,t.len,t.w);g.fillStyle=`rgba(255,90,60,${.35})`;g.fillRect(0,-t.w/2,t.len*k,t.w);for(let i=0;i<4;i++){const ax=((T*160+i*t.len/4)%t.len);g.fillStyle='rgba(255,170,140,.5)';g.beginPath();g.moveTo(ax+6,0);g.lineTo(ax,-4);g.lineTo(ax,4);g.fill()}g.restore()}}}
function drawEB(X,Y){g.globalCompositeOperation='lighter';for(const b of EB){const x=X(b.x),y=Y(b.y),s=b.r*2.6;g.drawImage(glowC(b.c),x-s,y-s,s*2,s*2)}g.globalCompositeOperation='source-over';for(const b of EB){g.fillStyle='#fff0e8';g.fillRect(X(b.x)-1,Y(b.y)-1,3,3)}}

/* ===== レベルアップの画面 ===== */
let LVA={t0:0,pick:-1,pt:0},LVR=[];
function wrapC(s,x,y,w,c,sz,lh,max){g.font=sz+'px '+FT;const L=[];let line='';for(const ch of s){if(g.measureText(line+ch).width>w){L.push(line);line=''}line+=ch}if(line)L.push(line);L.slice(0,max||9).forEach((l,i)=>tx(l,x,y+i*lh,c,'center',sz))}
function drawLv(){const t=T-LVA.t0,n=LVO.length;g.fillStyle=`rgba(5,3,8,${Math.min(.74,t*3)})`;g.fillRect(0,0,UW,UH);
 g.save();g.translate(UW/2,UH*.5);g.rotate(T*.12);g.globalCompositeOperation='lighter';for(let i=0;i<14;i++){g.rotate(TAU/14);g.fillStyle=`rgba(255,190,100,${.045*Math.min(1,t*2)})`;g.beginPath();g.moveTo(0,0);g.lineTo(-40,-UW);g.lineTo(40,-UW);g.fill()}g.restore();g.globalCompositeOperation='source-over';
 const k=cl(t/.28,0,1),e=1-Math.pow(1-k,3),sz=Math.min(30,UW/18)*(1.7-.7*e);g.font=sz+'px '+FP;g.textAlign='center';g.globalAlpha=e;const ty=UH*.15;for(let i=4;i>0;i--){g.fillStyle='#3a1a04';g.fillText('LEVEL UP',UW/2+i*.7,ty+i)}const gd=g.createLinearGradient(0,ty-sz,0,ty);gd.addColorStop(0,'#fff6d0');gd.addColorStop(.5,'#ffc850');gd.addColorStop(1,'#c87818');g.fillStyle=gd;g.fillText('LEVEL UP',UW/2,ty);g.globalAlpha=1;
 tx('Lv '+(P.lv-LVQ),UW/2,ty+20,'#d8c8a0','center',12);
 const gap=10,cw=Math.min(150,(UW-30-(n-1)*gap)/n),ch=Math.min(220,UH*.62),x0=UW/2-(n*cw+(n-1)*gap)/2,y0=UH*.24;LVR=[];
 LVO.forEach((o,i)=>{const r=optInfo(o),dl=.15+i*.09,a=cl((t-dl)/.32,0,1),ee=1-Math.pow(1-a,3)*(1-a*.0);if(a<=0)return;let x=x0+i*(cw+gap),y=y0+(1-ee)*70,al=ee;const on=SEL===i;
  if(on)y-=5+Math.sin(T*4)*1.5;
  LVR.push({x,y,w:cw,h:ch,i});g.globalAlpha=al;
  const tc=o.t==='w'?'216,160,80':o.t==='p'?'110,168,224':'170,170,170';
  if(on||LVA.pick===i){g.globalCompositeOperation='lighter';g.drawImage(glowC(tc),x-26,y-26,cw+52,ch+52);g.globalCompositeOperation='source-over'}
  const bg=g.createLinearGradient(0,y,0,y+ch);bg.addColorStop(0,'#221c26');bg.addColorStop(1,'#110d14');g.fillStyle=bg;g.fillRect(x,y,cw,ch);g.fillStyle=`rgba(${tc},${on?.95:.55})`;g.fillRect(x,y,cw,2);g.fillRect(x,y+ch-2,cw,2);g.fillRect(x,y,1,ch);g.fillRect(x+cw-1,y,1,ch);
  // 光が走る
  if(on){const sx=x+((T*120)%(cw+60))-30;g.save();g.beginPath();g.rect(x,y,cw,ch);g.clip();g.fillStyle='rgba(255,255,255,.07)';g.beginPath();g.moveTo(sx,y);g.lineTo(sx+18,y);g.lineTo(sx-22,y+ch);g.lineTo(sx-40,y+ch);g.fill();g.restore()}
  // 上：新しい／段の目盛り
  const isNew=r.lv.startsWith('新');if(isNew){g.fillStyle='#2e8a50';g.beginPath();g.moveTo(x+8,y+8);g.lineTo(x+48,y+8);g.lineTo(x+44,y+22);g.lineTo(x+4,y+22);g.fill();tx('NEW',x+26,y+19,'#e8ffe8','center',8,FP)}
  else if(o.t==='w'||o.t==='p'){const mx=o.t==='w'?8:PS[o.k].m,cur=o.t==='w'?P.ws.find(w=>w.k===o.k).lv:P.pas[o.k],pw=Math.min(9,(cw-20)/mx);for(let j=0;j<mx;j++){const px=x+cw/2-mx*pw/2+j*pw;g.fillStyle=j<cur?`rgba(${tc},.9)`:j===cur?((T*4|0)%2?'#fff4c0':`rgba(${tc},.4)`):'rgba(255,255,255,.1)';g.fillRect(px+1,y+12,pw-2,5)}}
  // 絵
  const iy=y+ch*.2,is=Math.min(48,cw*.4);g.globalCompositeOperation='lighter';g.globalAlpha=al*.6;g.drawImage(glowC(tc),x+cw/2-is,iy-is*.2,is*2,is*1.6);g.globalCompositeOperation='source-over';g.globalAlpha=al;icon(r.ic,x+cw/2-is/2,iy,is);
  tx(r.n,x+cw/2,iy+is+22,'#fff2dc','center',13);tx(o.t==='w'?'武器':o.t==='p'?'持ち物':'',x+cw/2,iy+is+37,`rgba(${tc},1)`,'center',9);
  // 一度でも進化させたことがある組み合わせは、札の下に小さく出す
  let hint=null;const evd=META.evd||{};if(o.t==='p'){const wk=Object.keys(W).find(k=>W[k].evo.p===o.k&&evd[k]);if(wk)hint={a:W[wk].ic,b:W[wk].evo.ic,n:W[wk].n,on:P.ws.some(w=>w.k===wk)}}else if(o.t==='w'&&evd[o.k]){const D=W[o.k];hint={a:PS[D.evo.p].ic,b:D.evo.ic,n:PS[D.evo.p].n,on:!!P.pas[D.evo.p]}}
  wrapC(r.d,x+cw/2,iy+is+56,cw-16,'#c0c4d4',10,14,hint?3:4);
  if(hint){const hy=y+ch-44,hw=cw-16,hx=x+8;g.fillStyle=hint.on?'rgba(255,200,90,.18)':'rgba(255,255,255,.05)';g.fillRect(hx,hy,hw,22);g.fillStyle=hint.on?'rgba(255,210,110,.8)':'rgba(255,210,110,.3)';g.fillRect(hx,hy,hw,1);
   if(hint.on){g.globalCompositeOperation='lighter';g.globalAlpha=.35+.2*Math.sin(T*5);g.drawImage(glowC('255,200,90'),hx,hy-6,hw,34);g.globalAlpha=1;g.globalCompositeOperation='source-over'}
   const cx2=hx+hw/2;tx('進化',hx+4,hy+14,'#c8a860','left',8);icon(hint.a,cx2-24,hy+3,16);tx('→',cx2+2,hy+15,'#a89878','center',9);icon(hint.b,cx2+12,hy+3,16,1);if(hint.on)tx('手持ち',hx+hw-4,hy+14,'#ffd880','right',8)}if(!isNew&&r.lv)tx(r.lv,x+cw/2,y+ch-12,'#d8c8a0','center',9);if(!TOUCH)tx(String(i+1),x+10,y+ch-10,'#5a5470','left',9,FP);
  g.globalAlpha=1;btn(x,y,cw,ch,()=>{if(SEL!==i&&TOUCH){SEL=i;return}pickOpt(i)})});
 if(TOUCH&&LVA.pick<0)tx('もう一度押して決める',UW/2,y0+ch+22,'#8a8498','center',10)}
function pickOpt(i){if(MODE!=='lv')return;const o=LVO[i],r=LVR.find(q=>q.i===i);LOUT={o,info:optInfo(o),r:r||{x:UW/2-60,y:UH*.3,w:120,h:180},t0:T};if(NETC)netTo(MPS.hid,{ty:'pk',i});else takeOpt(o);snd('tn');MODE='play';LVO=null;LVA.pick=-1;if(LVQ>0)openLv()}
let LOUT=null;
function drawLvOut(){const q=cl((T-LOUT.t0)/.38,0,1);if(q>=1){LOUT=null;return}const e=q*q,r=LOUT.r;g.fillStyle=`rgba(5,3,8,${.74*(1-q)*(1-q)})`;g.fillRect(0,0,UW,UH);
 const x=r.x+(30-r.x-r.w/2)*e,y=r.y+(20-r.y-r.h/2)*e,sc=1-e*.8;g.globalAlpha=1-q*.6;const cx=x+r.w/2,cy=y+r.h/2;g.globalCompositeOperation='lighter';g.drawImage(glowC('255,210,140'),cx-r.w*sc,cy-r.h*sc*.7,r.w*sc*2,r.h*sc*1.4);g.globalCompositeOperation='source-over';g.fillStyle='rgba(30,24,34,.9)';g.fillRect(cx-r.w*sc/2,cy-r.h*sc/2,r.w*sc,r.h*sc);icon(LOUT.info.ic,cx-20*sc-4,cy-20*sc-4,40*sc+8);g.globalAlpha=1}

/* ===== 宝箱の演出：落ちて震え、開いて光が立ち、中身が回って止まる ===== */
/* ===== 宝箱の専用の音（太鼓の連打→開くとファンファーレ→きらめきが続く。その間は戦闘の曲を絞る） ===== */
let CJ={iv:null,nb:null};
function cjO(f,t,d,ty,v,f2){const o=AC.createOscillator(),gn=AC.createGain();o.type=ty;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(v,t+.012);gn.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(gn);gn.connect(MG);o.start(t);o.stop(t+d+.05)}
function cjN(t,d,v,fc){if(!CJ.nb||CJ.nb.ctx!==AC){const L=AC.sampleRate,b=AC.createBuffer(1,L,AC.sampleRate),a=b.getChannelData(0);for(let i=0;i<L;i++)a[i]=Math.random()*2-1;CJ.nb={b,ctx:AC}}const s=AC.createBufferSource(),f=AC.createBiquadFilter(),gn=AC.createGain();s.buffer=CJ.nb.b;f.type='bandpass';f.frequency.value=fc;f.Q.value=1.2;gn.gain.setValueAtTime(v,t);gn.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(f);f.connect(gn);gn.connect(MG);s.start(t);s.stop(t+d+.02)}
const mf=m=>440*Math.pow(2,(m-69)/12);
function chestJingle(c){try{if(!AC||typeof MG==='undefined'||!MG||VOL<=0)return;const t0=AC.currentTime,tm=chestTimes(c);CJ.duck=1;
 // 連打（だんだん速く）
 let tt=t0+.35;while(tt<t0+tm.op-.05){const k=(tt-t0)/tm.op;cjN(tt,.08,.5+k*.4,1800);cjO(110+k*40,tt,.08,'triangle',.18);tt+=.11-k*.07}
 // 開く：ファンファーレ
 const to=t0+tm.op,ch=c.ev?[60,64,67,71]:[60,64,67];cjN(to,.5,.9,3000);cjO(55,to,.5,'sine',.5,40);ch.forEach(m=>{cjO(mf(m+12),to,.5,'square',.06);cjO(mf(m),to,.9,'sawtooth',.05)});
 [72,76,79,84,88].forEach((m,i)=>cjO(mf(m),to+.12+i*.08,.35,'square',.07));ch.forEach(m=>cjO(mf(m+12),to+.55,1.6,'triangle',.08));[96,100,103].forEach((m,i)=>cjO(mf(m),to+.6+i*.15,.9,'sine',.05));
 if(c.ev)[79,84,88,91,96].forEach((m,i)=>cjO(mf(m),to+1.3+i*.1,.6,'square',.06));
 // 中身が止まるたびの高い音
 c.items.forEach((it,i)=>{const ts=t0+tm.st+i*.7+.5;cjO(mf(84+i*2),ts,.4,'sine',.12);cjO(mf(91+i*2),ts+.06,.4,'sine',.08)});
 // 続くきらめき
 clearInterval(CJ.iv);let n=0;CJ.iv=setInterval(()=>{if(!AC||!CHST){clearInterval(CJ.iv);return}const t=AC.currentTime+.05,b=[72,76,79,83][n%4];[0,4,7,12].forEach((d,i)=>cjO(mf(b+d),t+i*.11,.5,'triangle',.035));n++},900)}catch(e){}}
function chestJingleEnd(){clearInterval(CJ.iv);CJ.duck=0}

/* ===== 宝箱の演出（大きく、派手に） ===== */
let UPT=[],ULT=0;
function chestTimes(c){const op=c.big?1.6:1.3,st=op+.7;return{op,st,end:st+c.items.length*.7+.6}}
function drawChestG(x,y,s,open,big,shk){const W2=22*s,H2=13*s;x+=shk;g.fillStyle='rgba(0,0,0,.45)';g.beginPath();g.ellipse(x,y+2*s,W2*.62,3*s,0,0,TAU);g.fill();
 const body=big?'#6a1c20':'#5a3a1c',dk=big?'#3a0c10':'#38220e',band=big?'#f0c860':'#c8a050',bd2=big?'#a07820':'#7a6030';
 g.fillStyle=body;g.fillRect(x-W2/2,y-H2,W2,H2);g.fillStyle=dk;g.fillRect(x-W2/2,y-2*s,W2,2*s);for(let i=1;i<4;i++){g.fillStyle='rgba(0,0,0,.18)';g.fillRect(x-W2/2,y-H2+i*3*s,W2,s*.5)}g.fillStyle='rgba(255,255,255,.06)';g.fillRect(x-W2/2,y-H2,s,H2);
 g.fillStyle=band;g.fillRect(x-W2/2+2*s,y-H2,2*s,H2);g.fillRect(x+W2/2-4*s,y-H2,2*s,H2);g.fillStyle=bd2;g.fillRect(x-W2/2+3.4*s,y-H2,.6*s,H2);g.fillRect(x+W2/2-2.6*s,y-H2,.6*s,H2);
 if(open<=0){g.fillStyle=big?'#882428':'#704a24';g.fillRect(x-W2/2,y-H2-7*s,W2,7*s);g.fillStyle='rgba(255,255,255,.14)';g.fillRect(x-W2/2,y-H2-7*s,W2,s);g.fillStyle=band;g.fillRect(x-W2/2,y-H2-1*s,W2,s*1.2);g.fillRect(x-W2/2+2*s,y-H2-7*s,2*s,7*s);g.fillRect(x+W2/2-4*s,y-H2-7*s,2*s,7*s);g.fillRect(x-2*s,y-H2-2.5*s,4*s,5.5*s);g.fillStyle='#2a1808';g.fillRect(x-.5*s,y-H2-.5*s,s,2*s);
  const gl=.5+.5*Math.sin(T*10);g.globalCompositeOperation='lighter';g.globalAlpha=gl*.6;g.drawImage(glowC('255,220,140'),x-W2*.6,y-H2-4*s,W2*1.2,6*s);g.globalAlpha=1;g.globalCompositeOperation='source-over'}
 else{const ly=y-H2-7*s-open*14*s;g.save();g.translate(x,ly+4*s);g.rotate(-open*.25);g.fillStyle=big?'#5a1418':'#4a3016';g.fillRect(-W2/2,-4*s,W2,4*s);g.fillStyle=band;g.fillRect(-W2/2,-s,W2,s);g.restore();
  const gl=g.createLinearGradient(0,y-H2-3*s,0,y-H2+3*s);gl.addColorStop(0,'rgba(255,240,180,0)');gl.addColorStop(1,'rgba(255,240,180,1)');g.fillStyle=gl;g.fillRect(x-W2/2+s,y-H2-3*s,W2-2*s,6*s)}}
function drawChest(){const c=CHST,tm=chestTimes(c),t=c.t,cx=UW/2,cy=UH*.84;const dt=Math.min(.05,Math.max(0,T-ULT));ULT=T;const s=c.big?7:6;
 g.fillStyle=`rgba(4,3,6,${Math.min(.85,t*3)})`;g.fillRect(0,0,UW,UH);
 const opened=t>=tm.op,q=opened?cl((t-tm.op)/.5,0,1):0,ccx=cx,ccy=cy-13*s;
 // 開く前：箱に光が集まる
 if(!opened&&t>.4){const k=(t-.4)/(tm.op-.4);for(let i=0;i<3;i++){const a=R()*TAU,r=(1-k)*UW*.5+40;UPT.push({x:ccx+Math.cos(a)*r,y:ccy+Math.sin(a)*r,vx:-Math.cos(a)*r*1.6,vy:-Math.sin(a)*r*1.6,t:.5,t0:.5,ty:'gl'})}}
 if(opened){const hue=c.ev?(T*120)%360:0,rc=c.ev?`hsla(${hue},90%,70%,`:'rgba(255,214,130,';
  g.save();g.translate(ccx,ccy);g.globalCompositeOperation='lighter';g.rotate(T*.25);for(let i=0;i<18;i++){g.rotate(TAU/18);g.fillStyle=rc+(.08*q)+')';g.beginPath();g.moveTo(0,0);g.lineTo(-26,-UW);g.lineTo(26,-UW);g.fill()}g.rotate(-T*.6);for(let i=0;i<10;i++){g.rotate(TAU/10);g.fillStyle=rc+(.06*q)+')';g.beginPath();g.moveTo(0,0);g.lineTo(-10,-UW*.7);g.lineTo(10,-UW*.7);g.fill()}g.restore();
  g.globalCompositeOperation='lighter';const bw=110*q;const bm=g.createLinearGradient(0,0,0,ccy);bm.addColorStop(0,'rgba(255,220,140,0)');bm.addColorStop(1,`rgba(255,230,160,${.45*q})`);g.fillStyle=bm;g.fillRect(ccx-bw/2,0,bw,ccy);g.globalAlpha=.7;g.drawImage(glowC('255,220,150'),ccx-160,ccy-120,320,240);g.globalAlpha=1;g.globalCompositeOperation='source-over';
  // 衝撃の輪と白い閃光
  const w0=cl((t-tm.op)/.6,0,1);if(w0<1){g.strokeStyle=`rgba(255,240,200,${1-w0})`;g.lineWidth=6*(1-w0)+1;g.beginPath();g.ellipse(ccx,ccy,40+w0*UW*.6,(40+w0*UW*.6)*.45,0,0,TAU);g.stroke()}const fl=cl(1-(t-tm.op)/.35,0,1);if(fl>0){g.fillStyle=`rgba(255,250,235,${fl*.85})`;g.fillRect(0,0,UW,UH)}}
 // 箱：上から落ちて、震えて、開く
 const dk=cl(t/.4,0,1),dy=(1-Math.pow(dk,2))*-UH,land=t>.4&&t<.55,shk=t>.45&&!opened?Math.sin(T*70)*Math.min(7,(t-.45)*8):0;
 if(land&&!c.ld){c.ld=1;for(let i=0;i<20;i++){const a=Math.PI+R()*Math.PI,v=80+R()*120;UPT.push({x:cx+(R()-.5)*120,y:cy,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.4,t:.6,t0:.6,ty:'dust'})}}
 g.save();if(land){g.translate(cx,cy);g.scale(1.08,.92);g.translate(-cx,-cy)}drawChestG(cx,cy+dy,s,opened?cl((t-tm.op)/.3,0,1):0,c.big,shk);g.restore();
 if(!c.op&&opened){c.op=1;for(let i=0;i<90;i++){const a=-Math.PI/2+(R()-.5)*2,v=200+R()*320;UPT.push({x:ccx,y:ccy,vx:Math.cos(a)*v,vy:Math.sin(a)*v,t:1.6+R(),t0:2.6,ty:'coin'})}for(let i=0;i<40;i++){const a=R()*TAU,v=100+R()*240;UPT.push({x:ccx,y:ccy,vx:Math.cos(a)*v,vy:Math.sin(a)*v,t:.7+R()*.5,t0:1.2,ty:'sh',r:R()*6,c:c.ev?`hsl(${R()*360|0},90%,75%)`:'#fff0c8'})}}
 if(opened&&t<tm.end&&R()<.6)UPT.push({x:ccx+(R()-.5)*40,y:ccy,vx:(R()-.5)*120,vy:-200-R()*200,t:1.6,t0:1.6,ty:'coin'});if(opened&&R()<.5)UPT.push({x:ccx+(R()-.5)*80,y:ccy,vx:(R()-.5)*40,vy:-80-R()*120,t:1.4,t0:1.4,ty:'gl'});
 for(const p of UPT){p.t-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.ty==='coin'){p.vy+=520*dt;if(p.y>cy+4){p.y=cy+4;p.vy*=-.35;p.vx*=.6}}else if(p.ty==='sh'){p.vx*=.96;p.vy*=.96;p.r+=dt*8}else if(p.ty==='dust'){p.vx*=.92;p.vy*=.92}else p.vx*=.97}UPT=UPT.filter(p=>p.t>0);
 for(const p of UPT){const k=Math.min(1,p.t/.4);if(p.ty==='coin'){g.globalAlpha=k;g.drawImage(COIN,p.x-5|0,p.y-5|0,10,10);g.globalAlpha=1}else if(p.ty==='sh'){g.save();g.translate(p.x,p.y);g.rotate(p.r);g.globalAlpha=k;g.fillStyle=p.c;g.fillRect(-4,-1,8,2);g.restore();g.globalAlpha=1}else if(p.ty==='dust'){g.fillStyle=`rgba(180,150,120,${k*.4})`;g.beginPath();g.arc(p.x,p.y,6+(1-k)*8,0,TAU);g.fill()}else{g.globalCompositeOperation='lighter';g.globalAlpha=k;const sz=p.ty==='gl'?8:5;g.drawImage(glowC(p.ty==='gl'?'255,220,150':'255,240,200'),p.x-sz,p.y-sz,sz*2,sz*2);g.globalAlpha=1;g.globalCompositeOperation='source-over'}}
 // 中身：回って止まる（大きな丸）
 const n=c.items.length,sw=Math.min(120,(UW-40)/n),x0=cx-n*sw/2+sw/2,iy=UH*.3,R0=Math.min(34,sw*.36);const KS=Object.keys(W).map(k=>W[k].ic).concat(Object.keys(PS).map(k=>PS[k].ic));
 c.items.forEach((it,i)=>{const t0=tm.st+i*.7,lt=t-t0;if(lt<0)return;const x=x0+i*sw,lock=lt>.55,ev=it.ev;const a=cl(lt/.2,0,1),pop=lock?1+Math.max(0,.35-(lt-.55)*1.5):.6+.4*a;g.globalAlpha=a;
  const ic=ev?W[it.k].evo.ic:it.info.ic;g.globalCompositeOperation='lighter';g.globalAlpha=a*(lock?.8:.4);g.drawImage(glowC(ev?'255,200,90':'255,230,170'),x-R0*2,iy-R0*2,R0*4,R0*4);g.globalAlpha=a;g.globalCompositeOperation='source-over';
  g.save();g.translate(x,iy);g.scale(pop,pop);g.fillStyle='rgba(14,10,18,.9)';g.beginPath();g.arc(0,0,R0,0,TAU);g.fill();g.strokeStyle=ev?'#ffd060':'rgba(240,220,170,.75)';g.lineWidth=2;g.beginPath();g.arc(0,0,R0,0,TAU);g.stroke();
  if(!lock){g.save();g.beginPath();g.arc(0,0,R0-2,0,TAU);g.clip();const sp=24,off=((T*sp)%1)*R0*1.6;icon(KS[(T*sp+i*5|0)%KS.length],-R0*.7,-R0*.7-off+R0*.8,R0*1.4);icon(KS[(T*sp+i*5+1|0)%KS.length],-R0*.7,-R0*.7-off+R0*2.4,R0*1.4);g.restore()}
  else{if(!it.lk){it.lk=1;snd(ev?'wn':'tn');for(let j=0;j<26;j++){const an=R()*TAU,v=80+R()*140;UPT.push({x,y:iy,vx:Math.cos(an)*v,vy:Math.sin(an)*v,t:.6,t0:.6,ty:j%3?'sp':'sh',r:R()*6,c:ev?'#ffd060':'#fff8e0'})}}
   if(ev){g.save();g.rotate(T*.8);g.globalCompositeOperation='lighter';for(let j=0;j<12;j++){g.rotate(TAU/12);g.fillStyle=`hsla(${(T*120+j*30)%360},90%,70%,.16)`;g.beginPath();g.moveTo(0,0);g.lineTo(-8,-R0*2.4);g.lineTo(8,-R0*2.4);g.fill()}g.restore();g.globalCompositeOperation='source-over'}
   icon(ic,-R0*.75,-R0*.75,R0*1.5,ev);const fl2=cl(1-(lt-.55)/.25,0,1);if(fl2>0){g.fillStyle=`rgba(255,255,255,${fl2*.85})`;g.beginPath();g.arc(0,0,R0*(1+(1-fl2)*.5),0,TAU);g.fill()}}
  g.restore();if(lock){tx(ev?W[it.k].evo.n:it.info.n,x,iy+R0+20,ev?'#ffd060':'#fff0dc','center',13);tx(ev?'進化した':it.info.lv||it.info.d,x,iy+R0+36,ev?'#e0b060':'#b8c0d0','center',10)}
  g.globalAlpha=1});
 if(c.ev&&t>tm.st){g.font='18px '+FP;g.textAlign='center';const a=cl((t-tm.st)/.3,0,1);g.globalAlpha=a;g.fillStyle='rgba(40,20,0,.8)';g.fillText('EVOLUTION',cx+2,UH*.12+2);g.fillStyle=`hsl(${(T*120)%360},90%,72%)`;g.fillText('EVOLUTION',cx,UH*.12);g.globalAlpha=1}
 const gk=cl((t-tm.st-n*.7+.3)/.6,0,1);if(gk>0){g.drawImage(COIN,cx-58,UH*.3+R0+50,14,14);tx('+'+Math.round(c.gold*gk),cx-38,UH*.3+R0+62,'#ffd860','left',14,FP)}
 const done=t>=tm.end;if(done)tx(TOUCH?'押して続ける':'クリックで続ける',cx,UH-10,`rgba(220,220,230,${.5+.4*Math.sin(T*4)})`,'center',10);
 btn(0,0,UW,UH,()=>{if(c.t<tm.end){c.t=tm.end;c.op=1;for(const it of c.items)it.lk=1}else chestClose()})}
function chestClose(){if(NETC){if(CHST&&CHST.pi===LPI)netTo(MPS.hid,{ty:'cc'},1);CHST=null;UPT=[];chestJingleEnd();MODE='play';return}MODE='play';CHST=null;UPT=[];chestJingleEnd();if(LVQ>0)openLv()}

/* ===== 持ち物の詳しい説明（左上の欄や一時停止の欄を押すと出る。出ている間は止まる） ===== */
const wrapL=(s,n)=>{const r=[];for(let i=0;i<s.length;i+=n)r.push(s.slice(i,i+n));return r};
let INF=null;function openInf(t,k){if(MODE!=='play')return;INF={t,k,t0:T};snd('cl')}
const PSV={crit:n=>'会心 +'+n*5+'%',vamp:n=>'倒すと '+n*3+'% でHP+1',greed:n=>'金貨 +'+n*20+'%',rev:n=>'起き上がる '+n+'回',inv:n=>'無敵時間 +'+(n/10).toFixed(1)+'秒',slow:n=>'敵の動き -'+n*5+'%',barr:n=>n?(23-3*n)+'秒ごとに1回防ぐ':'なし',might:n=>'ダメージ +'+n*10+'%',armor:n=>'受けるダメージ -'+n,mhp:n=>'最大HP +'+n*20+'%',regen:n=>'HP回復 +'+(n*.2).toFixed(1)+'/秒',cd:n=>'待ち時間 -'+n*8+'%',area:n=>'範囲 +'+n*10+'%',dur:n=>'持続 +'+n*10+'%',amt:n=>'数 +'+n,move:n=>'移動の速さ +'+n*10+'%',magnet:n=>'拾う範囲 +'+n*25+'%',luck:n=>'幸運 +'+n*10+'%',growth:n=>'経験 +'+n*8+'%',pspd:n=>'弾の速さ +'+n*10+'%'};
function drawInf(){const p=P,I=INF,q=cl((T-I.t0)/.15,0,1),w=Math.min(UW-24,300);let lines=[],ic,nm,lv,d,col,evo=null;
 if(I.t==='w'){const wp=p.ws.find(x=>x.k===I.k);if(!wp){INF=null;return}const D=W[I.k],s=ws(wp);ic=wp.evo?D.evo.ic:D.ic;nm=wp.evo?D.evo.n:D.n;lv=wp.evo?'進化済み':'Lv '+wp.lv+' / 8';d=D.d;col='255,200,80';
  lines=[['ダメージ',Math.round(s.dmg)],['待ち時間',s.cd.toFixed(2)+'秒'],['数',s.amt],['範囲',Math.round(s.area*100)+'%']];if(s.pierce<90)lines.push(['貫通',s.pierce]);if(I.k==='jelly'||I.k==='fire')lines.push(['持続',s.dur.toFixed(1)+'秒']);lines.push(['与えたダメージ',Math.round(wp.dm)]);
  if(!wp.evo&&wp.lv<8)lines.push(['次のLv',WINC(D.i[wp.lv-1])]);evo={n:D.evo.n,ic:D.evo.ic,need:PS[D.evo.p].n,has:!!p.pas[D.evo.p],lv8:wp.lv>=8,done:wp.evo}}
 else if(I.t==='c'){const cp=CPV[p.ci==null?CHI:p.ci];ic=cp.ic;nm=cp.n;lv='固有の力（'+A.ch[CHS[p.ci==null?CHI:p.ci].k].n+'）';d='';col='255,200,90';lines=wrapL(cp.d,20).map((l,i)=>[i?'':'効果',l]);lines.push(['育ち方','時間とともに強くなる'])}
 else{const D=PS[I.k],n=p.pas[I.k]||0;ic=D.ic;nm=D.n;lv='Lv '+n+' / '+D.m;d='1段ごとに '+D.d;col='130,190,255';lines=[['今の効果',PSV[I.k](n)]];if(n<D.m)lines.push(['次のLv',PSV[I.k](n+1)]);const ew=Object.keys(W).find(k=>W[k].evo.p===I.k);if(ew)lines.push(['進化に使う',W[ew].n+' → '+W[ew].evo.n])}
 const h=96+lines.length*17+(evo?40:0);g.fillStyle=`rgba(0,0,0,${.45*q})`;g.fillRect(0,0,UW,UH);const x=(UW-w)/2|0,y=((UH-h)/2|0)+(1-q)*10;g.globalAlpha=q;box(x,y,w,h,'rgba(18,16,24,.96)');g.fillStyle=`rgba(${col},.8)`;g.fillRect(x,y,w,2);
 g.globalCompositeOperation='lighter';g.drawImage(glowC(col),x+4,y+4,60,60);g.globalCompositeOperation='source-over';icon(ic,x+14,y+14,40,I.t==='w'&&evo&&evo.done);tx(nm,x+64,y+30,'#fff2dc','left',15);tx(lv,x+64,y+48,`rgba(${col},1)`,'left',10);tx(I.t==='w'?'武器':I.t==='c'?'':'持ち物',x+w-12,y+22,'#8a8498','right',9);
 tx(d,x+14,y+74,'#c8cad8','left',10);lines.forEach(([a,b],i)=>{const yy=y+94+i*17;g.fillStyle='rgba(255,255,255,.04)';g.fillRect(x+10,yy-11,w-20,15);tx(a,x+16,yy,'#9a98ac','left',10);tx(String(b),x+w-16,yy,'#ece4d4','right',10)});
 if(evo){const yy=y+h-36;g.fillStyle='rgba(255,210,110,.08)';g.fillRect(x+10,yy-4,w-20,30);icon(evo.ic,x+16,yy,22,1);tx(evo.done?'進化した：'+evo.n:'進化：'+evo.n,x+44,yy+9,'#ffd880','left',10);tx(evo.done?'':`Lv8${evo.lv8?'（済）':''}　＋　${evo.need}${evo.has?'（済）':''}　→　宝箱`,x+44,yy+22,'#b8a890','left',9)}
 tx(TOUCH?'押して閉じる':'クリックで閉じる',UW/2,y+h+16,'#8a8498','center',9);g.globalAlpha=1;btn(0,0,UW,UH,()=>{INF=null})}

/* ===== 拠点戦（ユーザー指定：LoL のように本塔と小塔を守る。塔は自動で撃つ。育ち方は本塔の店で買う） ===== */
const CSZ=32;let MAP=null,TW=[],WV=null,TOAST=[];const NWAVE=15;
function srng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
// 地図（ユーザー指定：広く、変わった形。敵は1〜2方向の遠い門から来る）。140×100マス。0床・1壁（森・壁）・2水や虚空（飛ぶ敵だけ越える）・3障害物
const STL={// 本塔・門・道（太さ）・広場・小塔の位置（マス）・外側の種類
 forest:{bg:1,base:[16,50],gates:[[131,50]],lanes:[[[16,50],[34,30],[56,30],[70,62],[96,72],[110,40],[131,50]]],w:9,clr:[[56,46,11],[100,56,10],[34,70,12]]},
 sunk:{bg:2,base:[70,90],gates:[[18,8],[122,8]],lanes:[[[70,90],[52,70],[34,48],[22,26],[18,8]],[[70,90],[88,70],[106,48],[118,26],[122,8]]],w:9,clr:[[70,72,14],[30,40,9],[110,40,9]]},
 hall:{bg:1,base:[12,50],gates:[[132,26],[132,74]],lanes:[[[12,50],[28,26],[80,22],[132,26]],[[12,50],[28,74],[80,78],[132,74]],[[70,26],[70,74]]],w:9,clr:[[70,50,12],[106,24,9],[106,76,9]]},
 jungle:{bg:1,base:[16,86],gates:[[128,12],[130,86]],lanes:[[[16,86],[40,72],[58,46],[86,34],[110,22],[128,12]],[[130,86],[104,84],[80,64],[58,46]]],w:9,clr:[[58,46,12],[96,30,9],[30,60,11]]},
 temple:{bg:2,base:[14,50],gates:[[134,50]],lanes:[[[14,50],[38,20],[62,80],[88,20],[112,80],[134,50]]],w:8,clr:[[38,20,10],[62,80,10],[88,20,10],[112,80,10]]},
 heaven:{bg:2,base:[16,50],gates:[[131,28],[131,72]],lanes:[[[16,50],[48,24],[84,50],[120,28],[131,28]],[[16,50],[48,76],[84,50],[120,72],[131,72]]],w:7,clr:[[16,50,15],[48,24,12],[48,76,12],[84,50,14],[120,28,11],[120,72,11]]}};
function mkMap(stg,seed){const r=srng(seed),L=STL[stg],gw=140,gh=100,G=new Uint8Array(gw*gh).fill(L.bg),obs=[];const at=(i,j)=>i<0||j<0||i>=gw||j>=gh?1:G[j*gw+i],set=(i,j,v)=>{if(i>0&&j>0&&i<gw-1&&j<gh-1)G[j*gw+i]=v};
 const disc=(x,y,rr,v)=>{for(let j=Math.floor(y-rr);j<=y+rr;j++)for(let i=Math.floor(x-rr);i<=x+rr;i++)if(hyp(i-x,j-y)<=rr)set(i,j,v)};
 const lane=(pts,w)=>{for(let k=0;k<pts.length-1;k++){const[a,b]=pts[k],[c,d]=pts[k+1],n=Math.ceil(hyp(c-a,d-b)*2);for(let s=0;s<=n;s++){const t=s/n,wob=Math.sin((k*7+t*5)*1.3)*.8;disc(a+(c-a)*t,b+(d-b)*t,w/2+wob,0)}}};
 for(const pts of L.lanes)lane(pts,L.w);for(const[x,y,rr]of L.clr)disc(x,y,rr,0);disc(L.base[0],L.base[1],stg==='heaven'?12:9,0);for(const[x,y]of L.gates)disc(x,y,4.5,0);
 // 道の中心線（障害物を置かない）
 const ctr=[];for(const pts of L.lanes)for(let k=0;k<pts.length-1;k++){const[a,b]=pts[k],[c,d]=pts[k+1],n=Math.ceil(hyp(c-a,d-b));for(let s=0;s<=n;s++)ctr.push([a+(c-a)*s/n,b+(d-b)*s/n])}
 const keep=(i,j,m)=>{if(hyp(i-L.base[0],j-L.base[1])<11)return 1;for(const[x,y]of L.gates)if(hyp(i-x,j-y)<6)return 1;for(const[x,y]of ctr)if(hyp(i-x,j-y)<m)return 1;return 0};
 const OT={forest:['tree','tree','rock','stump'],sunk:['column','coral','rock','wreck'],hall:['pillar','pillar','statue','crate'],jungle:['palm','bush','ruin','palm'],temple:['mech','gear','mech','pylon'],heaven:['col','cloudp','col','lampst']}[stg];
 for(let t=0,k=0;t<2400&&k<190;t++){const i=2+RI2(r,gw-4),j=2+RI2(r,gh-4);if(at(i,j)!==0)continue;const ty=OT[RI2(r,OT.length)],sz=ty==='tree'||ty==='palm'||ty==='ruin'||ty==='mech'?2+RI2(r,2):ty==='pillar'||ty==='col'||ty==='statue'?2:1+RI2(r,2);let ok=1;for(let y=j-1;y<=j+sz;y++)for(let x=i-1;x<=i+sz;x++)if(at(x,y)!==0||keep(x,y,L.w*.35+1))ok=0;if(!ok)continue;for(let y=j;y<j+sz;y++)for(let x=i;x<i+sz;x++)set(x,y,3);obs.push({ty,i,j,w:sz,h:sz,sd:(r()*1e9)|0});k++}
 // 通じているか確かめ、だめなら道を太くする
 const bx=L.base[0],by=L.base[1];const bfs=()=>{const D=new Int16Array(gw*gh).fill(-1),q=[bx+by*gw];D[q[0]]=0;for(let h=0;h<q.length;h++){const c=q[h],i=c%gw,j=c/gw|0;for(const[di,dj]of[[1,0],[-1,0],[0,1],[0,-1]]){const ni=i+di,nj=j+dj;if(ni<0||nj<0||ni>=gw||nj>=gh)continue;const n=nj*gw+ni;if(D[n]<0&&G[n]===0){D[n]=D[c]+1;q.push(n)}}}return D};
 let D=bfs();for(const[x,y]of L.gates)if(D[y*gw+x]<0){for(const pts of L.lanes)lane(pts,L.w+2);D=bfs();break}
 const dir=new Int8Array(gw*gh*2);for(let j=0;j<gh;j++)for(let i=0;i<gw;i++){const c=j*gw+i;if(D[c]<0)continue;let bd=D[c],ax=0,ay=0;for(const[di,dj]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const ni=i+di,nj=j+dj;if(ni<0||nj<0||ni>=gw||nj>=gh)continue;const n=nj*gw+ni;if(D[n]>=0&&D[n]<bd&&(di===0||dj===0||G[j*gw+ni]===0&&G[nj*gw+i]===0)){bd=D[n];ax=di;ay=dj}}dir[c*2]=ax;dir[c*2+1]=ay}
 const sc=[];for(let j=1;j<gh-1;j++)for(let i=1;i<gw-1;i++){const c=j*gw+i;if(D[c]>=17&&D[c]<=19&&L.gates.some(([gx,gy])=>hyp(i-gx,j-gy)<hyp(bx-gx,by-gy)-4)&&[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]].every(([a,b])=>G[c+a+b*gw]===0))sc.push([i,j])}
 let sb=[[bx+8,by-6],[bx+8,by+6]],bd=-1;for(let a=0;a<sc.length;a++)for(let b=a+1;b<sc.length;b++){const d=hyp(sc[a][0]-sc[b][0],sc[a][1]-sc[b][1]);if(d>bd){bd=d;sb=[sc[a],sc[b]]}}
 const M={gw,gh,W:gw*CSZ,H:gh*CSZ,G,D,dir,obs,stg,bg:L.bg,gates:L.gates.map(([i,j])=>({x:(i+.5)*CSZ,y:(j+.5)*CSZ})),base:{x:(bx+.5)*CSZ,y:(by+.5)*CSZ},subs:sb.map(([i,j])=>({x:(i+.5)*CSZ,y:(j+.5)*CSZ})),chunks:new Map(),seed};return M}
const RI2=(r,n)=>r()*n|0;
// 近くの、本塔へつながっている床のマス（引っかかった時の逃げ先）
function nearOpen(x,y){const i0=Math.floor(x/CSZ),j0=Math.floor(y/CSZ);for(let rr=1;rr<12;rr++)for(let dj=-rr;dj<=rr;dj++)for(let di=-rr;di<=rr;di++){if(Math.max(Math.abs(di),Math.abs(dj))!==rr)continue;const i=i0+di,j=j0+dj;if(i<0||j<0||i>=MAP.gw||j>=MAP.gh)continue;const c=j*MAP.gw+i;if(MAP.D[c]>=0)return[(i+.5)*CSZ,(j+.5)*CSZ]}return null}
const cellAt=(x,y)=>{if(!MAP)return 0;const i=Math.floor(x/CSZ),j=Math.floor(y/CSZ);return i<0||j<0||i>=MAP.gw||j>=MAP.gh?1:MAP.G[j*MAP.gw+i]};
const blocked=(x,y,fly)=>{const c=cellAt(x,y);return c===1||(c===3||c===2)&&!fly};
function walkTo(o,nx,ny,fly){if(!MAP){o.x=nx;o.y=ny;return}if(!blocked(nx,ny,fly)){o.x=nx;o.y=ny;return}if(!blocked(nx,o.y,fly))o.x=nx;else if(!blocked(o.x,ny,fly))o.y=ny}
function flowDir(x,y){const i=Math.floor(x/CSZ),j=Math.floor(y/CSZ);if(!MAP||i<0||j<0||i>=MAP.gw||j>=MAP.gh)return null;const c=j*MAP.gw+i;if(MAP.D[c]<0)return null;return[MAP.dir[c*2],MAP.dir[c*2+1]]}
const losOK=(x0,y0,x1,y1,fly)=>{const n=Math.ceil(hyp(x1-x0,y1-y0)/24);for(let k=1;k<n;k++){const t=k/n;if(blocked(x0+(x1-x0)*t,y0+(y1-y0)*t,fly))return 0}return 1};

/* --- 地図の絵：512 四方ごとに必要な分だけ描いてとっておく --- */
const CHK=512;
function mapChunk(ci,cj){const key=ci+','+cj,M=MAP;let c=M.chunks.get(key);if(c)return c;if(M.chunks.size>40){const k0=M.chunks.keys().next().value;M.chunks.delete(k0)}
 c=MKC(CHK,CHK);const x=c.getContext('2d'),ox=ci*CHK,oy=cj*CHK,t=TH[M.stg],S=CSZ;if(!M.tile)M.tile=mkTile(t);x.save();x.translate(-ox,-oy);const pat=x.createPattern(M.tile,'repeat');x.fillStyle=pat;x.fillRect(ox,oy,CHK,CHK);
 const i0=Math.floor(ox/S)-1,j0=Math.floor(oy/S)-1,i1=i0+CHK/S+2,j1=j0+CHK/S+2,G=(i,j)=>i<0||j<0||i>=M.gw||j>=M.gh?1:M.G[j*M.gw+i];
 const r=srng(M.seed^(ci*7919+cj*104729));
 // 外側（森・壁・水・虚空）
 for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const v=G(i,j),X=i*S,Y=j*S;if(v===1)bgWall(x,M.stg,X,Y,S,r,G(i,j+1)!==1,G(i,j-1)!==1);else if(v===2)bgVoid(x,M.stg,X,Y,S,r,G(i,j-1)===0||G(i,j-1)===3)}
 // 道すじを少し明るく
 // 床の縁：影と光
 for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const v=G(i,j);if(v!==0&&v!==3)continue;const X=i*S,Y=j*S;const up=G(i,j-1),dn=G(i,j+1),lf=G(i-1,j),rt=G(i+1,j);
  if(up===1){x.fillStyle='rgba(0,0,0,.45)';x.fillRect(X,Y,S,8)}else if(up===2){x.fillStyle='rgba(0,0,0,.2)';x.fillRect(X,Y,S,4)}
  if(dn===2){edgeDown(x,M.stg,X,Y,S,r)}else if(dn===1){x.fillStyle='rgba(0,0,0,.25)';x.fillRect(X,Y+S-3,S,3)}
  if(lf===1||lf===2){x.fillStyle='rgba(0,0,0,.28)';x.fillRect(X,Y,5,S)}if(rt===1||rt===2){x.fillStyle='rgba(0,0,0,.2)';x.fillRect(X+S-4,Y,4,S)}}
 // 障害物（隣の区画にかかる分も描く）
 for(const o of M.obs){const X0=o.i*S,Y0=o.j*S,w=o.w*S,h=o.h*S;if(X0+w+40<ox||Y0+h+40<oy||X0-40>ox+CHK||Y0-40>oy+CHK)continue;drawObs(x,o,X0,Y0,w,h,M.stg)}
 x.restore();M.chunks.set(key,c);return c}
function bgWall(x,stg,X,Y,S,r,openBelow,openAbove){
 if(stg==='hall'){x.fillStyle='#1a1612';x.fillRect(X,Y,S,S);x.fillStyle='#2a241e';for(let k=0;k<4;k++){const yy=Y+k*8;x.fillRect(X+(k%2?0:8),yy,14,7);x.fillRect(X+(k%2?16:24),yy,14,7)}if(openBelow){x.fillStyle='#3e352c';x.fillRect(X,Y+S-10,S,10);x.fillStyle='#544838';x.fillRect(X,Y+S-10,S,2)}return}
 // 森・密林：重なる木の頭
 const dk=stg==='forest'?['#0c120e','#111a14','#16221a','#1d2c22']:['#0f1e0e','#152a14','#1d381a','#284822'];x.fillStyle=dk[0];x.fillRect(X,Y,S,S);
 for(let k=0;k<3;k++){const cx=X+r()*S,cy=Y+r()*S,rr=10+r()*10;x.fillStyle=dk[1];x.beginPath();x.arc(cx,cy,rr,0,TAU);x.fill();x.fillStyle=dk[2];x.beginPath();x.arc(cx-rr*.25,cy-rr*.3,rr*.6,0,TAU);x.fill();if(r()<.5){x.fillStyle=dk[3];x.beginPath();x.arc(cx-rr*.4,cy-rr*.45,rr*.25,0,TAU);x.fill()}}
 if(openBelow){x.fillStyle='rgba(0,0,0,.35)';x.fillRect(X,Y+S-6,S,6)}}
function bgVoid(x,stg,X,Y,S,r,shore){
 if(stg==='sunk'){const g2=x.createLinearGradient(0,Y,0,Y+S);g2.addColorStop(0,'#123444');g2.addColorStop(1,'#0e2c3a');x.fillStyle=g2;x.fillRect(X,Y,S,S);x.fillStyle='rgba(140,210,230,.16)';for(let k=0;k<3;k++){const xx=X+r()*S,yy=Y+r()*S;x.fillRect(xx|0,yy|0,6+r()*8|0,1);x.fillRect(xx+2|0,yy+1|0,3,1)}if(r()<.04){x.fillStyle='#2a5a3a';x.beginPath();x.ellipse(X+r()*S,Y+r()*S,5,3,r(),0,TAU);x.fill()}return}
 const base=stg==='heaven'?'#141030':'#05070c';x.fillStyle=base;x.fillRect(X,Y,S,S);if(r()<.35){x.fillStyle=stg==='heaven'?'rgba(230,220,255,.7)':'rgba(80,200,240,.5)';x.fillRect(X+r()*S|0,Y+r()*S|0,1,1)}if(stg==='heaven'&&r()<.05){x.fillStyle='rgba(255,255,255,.06)';x.beginPath();x.ellipse(X+r()*S,Y+r()*S,30,10,0,0,TAU);x.fill()}if(stg==='temple'&&r()<.06){x.strokeStyle='rgba(60,180,220,.18)';x.beginPath();x.moveTo(X,Y+r()*S);x.lineTo(X+S,Y+r()*S);x.stroke()}}
function edgeDown(x,stg,X,Y,S,r){if(stg==='sunk'){x.fillStyle='rgba(220,240,240,.5)';for(let k=0;k<4;k++)x.fillRect(X+r()*S|0,Y+S-2-(r()*2|0),3+r()*4|0,1);x.fillStyle='rgba(0,0,0,.25)';x.fillRect(X,Y+S-2,S,2);return}
 // 崖：床の下に岩肌
 const cl1=stg==='heaven'?'#b8b0c8':'#2a3040',cl2=stg==='heaven'?'#8a809c':'#1a1e2a';x.fillStyle=cl1;x.fillRect(X,Y+S,S,10);x.fillStyle=cl2;x.fillRect(X,Y+S+6,S,8);for(let k=0;k<3;k++){x.fillStyle='rgba(0,0,0,.25)';x.fillRect(X+r()*S|0,Y+S+2,2,8+r()*6|0)}if(stg==='heaven'){x.fillStyle='rgba(255,255,255,.8)';for(let k=0;k<3;k++){x.beginPath();x.arc(X+r()*S,Y+S-1,3+r()*4,0,TAU);x.fill()}}}
function drawObs(x,o,X0,Y0,w,h,stg){const r=srng(o.sd),cx=X0+w/2,cy=Y0+h/2,sh=(a,b,rx,ry)=>{x.fillStyle='rgba(0,0,0,.35)';x.beginPath();x.ellipse(a,b,rx,ry,0,0,TAU);x.fill()};
 const blob=(px,py,rr,cols)=>{x.fillStyle=cols[0];x.beginPath();x.arc(px,py,rr,0,TAU);x.fill();x.fillStyle=cols[1];x.beginPath();x.arc(px-rr*.18,py-rr*.22,rr*.78,0,TAU);x.fill();x.fillStyle=cols[2];x.beginPath();x.arc(px-rr*.34,py-rr*.4,rr*.42,0,TAU);x.fill();x.fillStyle=cols[3]||cols[2];x.fillRect(px-rr*.5|0,py-rr*.6|0,2,2)};
 if(o.ty==='tree'){sh(cx+6,cy+10,w*.55,h*.38);const cols=['#16201a','#1f2c22','#2c3c2e','#4a5a44'];x.fillStyle='#2a2018';x.fillRect(cx-3,cy,6,h*.45);for(let k=0;k<6;k++){const a=k/6*TAU+r(),d=w*.2*r();blob(cx+Math.cos(a)*d,cy-h*.1+Math.sin(a)*d*.7,w*(.22+r()*.12),cols)}blob(cx,cy-h*.18,w*.3,cols);x.strokeStyle='rgba(30,24,20,.8)';x.lineWidth=1.5;for(let k=0;k<3;k++){x.beginPath();x.moveTo(cx,cy-h*.1);x.lineTo(cx+(r()-.5)*w*.8,cy-h*.1-(r())*h*.4);x.stroke()}}
 else if(o.ty==='palm'||o.ty==='bush'){sh(cx+5,cy+8,w*.5,h*.35);if(o.ty==='palm'){x.strokeStyle='#5a4028';x.lineWidth=4;x.beginPath();x.moveTo(cx,cy+h*.3);x.quadraticCurveTo(cx+8,cy,cx+4,cy-h*.2);x.stroke();const n=8;for(let k=0;k<n;k++){const a=k/n*TAU+r()*.3,L=w*(.55+r()*.2);x.strokeStyle=k%2?'#2e6a2a':'#3c8236';x.lineWidth=5;x.beginPath();x.moveTo(cx+4,cy-h*.2);x.quadraticCurveTo(cx+4+Math.cos(a)*L*.5,cy-h*.2+Math.sin(a)*L*.5-8,cx+4+Math.cos(a)*L,cy-h*.2+Math.sin(a)*L*.7);x.stroke()}x.fillStyle='#6a4a2a';x.beginPath();x.arc(cx+4,cy-h*.2,4,0,TAU);x.fill()}
  else{const cols=['#1c3a1a','#2a5226','#3a6a30','#c86a8a'];for(let k=0;k<5;k++)blob(cx+(r()-.5)*w*.6,cy+(r()-.5)*h*.5,w*(.2+r()*.12),cols)}}
 else if(o.ty==='rock'||o.ty==='cloudp'||o.ty==='stump'){sh(cx+4,cy+6,w*.5,h*.35);if(o.ty==='stump'){x.fillStyle='#3a2a1e';x.beginPath();x.ellipse(cx,cy,w*.38,h*.32,0,0,TAU);x.fill();x.fillStyle='#6a5236';x.beginPath();x.ellipse(cx,cy-3,w*.33,h*.25,0,0,TAU);x.fill();x.strokeStyle='#4a3a28';x.lineWidth=1;for(let k=1;k<3;k++){x.beginPath();x.ellipse(cx,cy-3,w*.33*k/3,h*.25*k/3,0,0,TAU);x.stroke()}return}
  const c1=o.ty==='cloudp'?['#9a92b0','#c8c0d8','#ece6f6']:['#2c2e32','#44474e','#62666e'];x.fillStyle=c1[0];x.beginPath();x.moveTo(X0+2,cy+h*.3);x.lineTo(X0+w*.15,Y0+4);x.lineTo(X0+w*.7,Y0+2);x.lineTo(X0+w-2,cy-2);x.lineTo(X0+w*.75,Y0+h-2);x.lineTo(X0+w*.2,Y0+h-3);x.fill();x.fillStyle=c1[1];x.beginPath();x.moveTo(X0+w*.18,Y0+6);x.lineTo(X0+w*.68,Y0+4);x.lineTo(X0+w*.85,cy-2);x.lineTo(X0+w*.4,cy+2);x.fill();x.fillStyle=c1[2];x.beginPath();x.moveTo(X0+w*.25,Y0+7);x.lineTo(X0+w*.55,Y0+5);x.lineTo(X0+w*.42,cy-4);x.fill();if(o.ty==='rock'&&stg==='forest'){x.fillStyle='rgba(70,100,60,.7)';x.fillRect(X0+w*.2|0,Y0+5,w*.3|0,3)}}
 else if(o.ty==='coral'){sh(cx+4,cy+6,w*.5,h*.35);const cs=['#8a3a4a','#a8505e','#3a7a7a','#58a0a0'];for(let k=0;k<6;k++){const a=-Math.PI/2+(r()-.5)*2,L=h*(.35+r()*.3);x.strokeStyle=cs[(k%2)+(r()<.5?0:2)];x.lineWidth=4;x.beginPath();x.moveTo(cx,cy+h*.3);x.quadraticCurveTo(cx+Math.cos(a)*L*.4,cy+Math.sin(a)*L*.4,cx+Math.cos(a)*L,cy+h*.1+Math.sin(a)*L);x.stroke()}}
 else if(o.ty==='wreck'){sh(cx+4,cy+6,w*.55,h*.35);x.fillStyle='#3a2a20';x.beginPath();x.moveTo(X0,cy);x.lineTo(X0+w,cy-6);x.lineTo(X0+w-6,cy+h*.3);x.lineTo(X0+6,cy+h*.35);x.fill();x.fillStyle='#5a4230';for(let k=0;k<4;k++)x.fillRect(X0+4+k*w/4,cy-4+k,w/5,2);x.fillStyle='rgba(60,120,100,.5)';x.fillRect(X0+6,cy+2,w*.5,3)}
 else{const T2={pillar:['#4a4036','#6a5c4c','#857560'],statue:['#4a4848','#6a6a68','#8a8a86'],crate:['#4a3420','#6a4a2c','#8a6438'],column:['#2a3a3c','#46585a','#64787a'],ruin:['#4a5046','#666c60','#848a7c'],mech:['#232831','#3a4250','#55607a'],gear:['#3a3020','#6a5530','#8a7040'],pylon:['#1e2430','#34405a','#4a5a80'],col:['#a8a094','#d4ccbc','#f0eadc'],lampst:['#8a7a50','#c0a860','#f0d890']}[o.ty]||['#333','#555','#777'];
  if(o.ty==='gear'){sh(cx+4,cy+6,w*.5,h*.35);x.fillStyle=T2[1];x.beginPath();x.arc(cx,cy,w*.42,0,TAU);x.fill();for(let k=0;k<8;k++){const a=k/8*TAU;x.fillRect(cx+Math.cos(a)*w*.42-3,cy+Math.sin(a)*w*.42-3,6,6)}x.fillStyle=T2[0];x.beginPath();x.arc(cx,cy,w*.16,0,TAU);x.fill();x.fillStyle=T2[2];x.fillRect(cx-w*.3,cy-w*.3,4,2);return}
  const hh=o.ty==='crate'?8:o.ty==='statue'||o.ty==='col'||o.ty==='pillar'||o.ty==='pylon'||o.ty==='lampst'?18:12;sh(cx+6,cy+8,w*.6,h*.4);x.fillStyle=T2[0];x.fillRect(X0,Y0+hh,w,h-hh+2);x.fillStyle=T2[1];x.fillRect(X0,Y0,w,h-4);x.fillStyle=T2[2];x.fillRect(X0,Y0,w,3);x.fillStyle='rgba(0,0,0,.18)';x.fillRect(X0+w-6,Y0+3,6,h-7);
  if(o.ty==='pillar'||o.ty==='col'){x.fillStyle=T2[2];x.fillRect(X0-2,Y0-2,w+4,6);x.fillStyle='rgba(0,0,0,.15)';for(let k=1;k<4;k++)x.fillRect(X0+k*w/4,Y0+6,1,h-12);if(o.ty==='col'){x.fillStyle='#d8b860';x.fillRect(X0-2,Y0-2,w+4,2)}}
  else if(o.ty==='statue'){x.fillStyle=T2[2];x.beginPath();x.arc(cx,Y0+8,6,0,TAU);x.fill();x.fillStyle=T2[1];x.fillRect(cx-7,Y0+12,14,10)}
  else if(o.ty==='crate'){x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=2;x.strokeRect(X0+3,Y0+3,w-6,h-10);x.beginPath();x.moveTo(X0+3,Y0+3);x.lineTo(X0+w-3,Y0+h-7);x.stroke()}
  else if(o.ty==='ruin'){x.fillStyle='rgba(0,0,0,.2)';for(let k=0;k<o.w*o.h*2;k++)x.fillRect(X0+(r()*w|0),Y0+(r()*(h-6)|0),6,1);x.fillStyle='#3e6a2e';for(let k=0;k<4;k++)x.fillRect(X0+r()*w|0,Y0+(r()*4|0),3+r()*6|0,3);x.fillStyle='#2e5a22';x.fillRect(X0+w*.6|0,Y0+2,2,h*.6|0)}
  else if(o.ty==='mech'||o.ty==='pylon'){x.fillStyle='rgba(80,220,255,.75)';x.fillRect(X0+4,Y0+h*.4,w-8,2);x.fillRect(cx-1,Y0+5,2,h-14);x.fillStyle='rgba(0,0,0,.3)';x.fillRect(X0+5,Y0+6,w*.3,4);x.fillStyle=o.ty==='pylon'?'#ff6a50':'#7affa0';x.fillRect(X0+w-8,Y0+6,3,3)}
  else if(o.ty==='lampst'){x.fillStyle='#fff0b0';x.beginPath();x.arc(cx,Y0+6,4,0,TAU);x.fill();x.fillStyle='rgba(255,240,180,.25)';x.beginPath();x.arc(cx,Y0+6,12,0,TAU);x.fill()}}}

/* --- 塔 --- */
const twLv=t=>{const k=1+.45*(t.lv-1);return{dmg:t.dmg*k*(1+TIME/600),rng:t.rng*(1+.1*(t.lv-1)),cd:t.cd/(1+.12*(t.lv-1))}};
let HB=[];
function updHeal(dt){for(const b of HB)b.t-=dt;HB=HB.filter(b=>b.t>-.15);if(NETC)return;
 for(const t of TW){if(t.dead)continue;t.ht=(t.ht||0)-dt;if(t.ht>0)continue;const R0=t.main?260:190;let q=null,qd=R0;for(const p of PLS){if(p.dead||p.hp>=p.s.mhp)continue;const d=hyp(p.x-t.x,p.y-t.y);if(d<qd){qd=d;q=p}}if(!q){t.ht=.3;continue}
  t.ht=t.main?.9:1.3;const v=Math.max(2,Math.round(q.s.mhp*(t.main?.05:.035)*(1+.15*(t.lv-1))));HB.push({ti:t.id,p:q,t:.28,t0:.28,v});if(MPON)evq(['hb',t.id,q.pi])}
 for(const b of HB)if(b.t<=0&&!b.done){b.done=1;const q=b.p;if(!q.dead&&b.v){q.hp=Math.min(q.s.mhp,q.hp+b.v);if(q===LP())DN.push({x:q.x,y:q.y-46,v:'+'+b.v,t:.7,c:'#7ef0a0'})}for(let i=0;i<6;i++)part(q.x+(R()-.5)*16,q.y-16,(R()-.5)*30,-30-R()*30,.6,'120,240,150',2,0)}}
function drawHeal(X,Y){g.globalCompositeOperation='lighter';for(const b of HB){const t=TW[b.ti];if(!t||!b.p)continue;const sx=t.x,sy=t.y-(t.main?110:60),ex=b.p.x,ey=b.p.y-20,k=cl(1-b.t/b.t0,0,1),hx=sx+(ex-sx)*k,hy=sy+(ey-sy)*k,a=b.t>0?1:Math.max(0,1+b.t/.15);
  g.strokeStyle=`rgba(90,230,130,${.35*a})`;g.lineWidth=3;g.beginPath();g.moveTo(X(sx),Y(sy));g.lineTo(X(hx),Y(hy));g.stroke();g.strokeStyle=`rgba(200,255,210,${.8*a})`;g.lineWidth=1;g.beginPath();g.moveTo(X(sx),Y(sy));g.lineTo(X(hx),Y(hy));g.stroke();
  g.globalAlpha=a;g.drawImage(glowC('120,240,150'),X(hx)-12,Y(hy)-12,24,24);g.globalAlpha=1}g.globalCompositeOperation='source-over'}
function updTowers(dt){for(const t of TW){if(t.dead)continue;t.fl-=dt;t.t-=dt;const st=twLv(t);if(t.t>0)continue;let b=null,bd=st.rng;for(const e of EN){if(e.dead||e.lamp)continue;const d=hyp(e.x-t.x,e.y-t.y)-(e.tier?40:0);if(d<bd){bd=d;b=e}}if(!b)continue;t.t=st.cd;
  for(let k=0;k<(t.main&&t.lv>=3?2:1);k++)TB.push({x:t.x,y:t.y-(t.main?78:52),tg:b,dmg:st.dmg,sp:520,t:1.2,main:t.main,id:++BID});snd('horb',160)}
 for(const s of TB){s.t-=dt;const e=s.tg;if(!e||e.dead){s.t=0;continue}const dx=e.x-s.x,dy=e.y-e.sp.h*.4-s.y,d=hyp(dx,dy);if(d<10){hitE(e,s.dmg,null,dx/d*.5,dy/d*.5);sparks(s.x,s.y,4,'170,210,255',100);s.t=0;continue}s.x+=dx/d*s.sp*dt;s.y+=dy/d*s.sp*dt;if(R()<.6)part(s.x,s.y,0,0,.25,'150,200,255',4,1)}TB=TB.filter(s=>s.t>0)}
let TB=[];
function hurtTower(t,d){if(t.dead||NETC)return;t.hp-=d;t.fl=.12;if(MPON)evq(['tw',t.id]);if(t.hp<=0){t.hp=0;t.dead=1;for(let i=0;i<40;i++){const a=R()*TAU,v=60+R()*160;part(t.x,t.y-30,Math.cos(a)*v,Math.sin(a)*v*.6-40,.8,pk(['120,110,100','80,80,90','170,200,255']),2+RI(3),0,260)}for(let i=0;i<8;i++)part(t.x+(R()-.5)*40,t.y-10,(R()-.5)*20,-20,1.2,'80,70,70',10,2);shake(t.main?14:8);snd('eslam');
  if(t.main){banner('本塔が崩れた','',3);for(const q of PLS)q.dead=1;DEATH={t:0,tw:1}}else banner('小塔が崩れた','本塔の店で建て直せる',2)}}
const M_DARK=()=>!MAP?'#050508':MAP.stg==='heaven'?'#141030':MAP.stg==='sunk'?'#0e2c3a':MAP.stg==='hall'?'#1a1612':MAP.stg==='forest'?'#0c120e':MAP.stg==='jungle'?'#0f1e0e':'#05070c';
/* --- 波（門から押し寄せる） --- */
function waveStart(){const n=++WV.n,ar=AREA(),nm=ar.nm,k=Math.min(nm.length,2+Math.floor(n*1.1)),pool=nm.slice(Math.max(0,k-5),k),cnt=Math.round((12+5.5*n)*(1+.45*(NP-1)));
 WV.q=[];for(let i=0;i<cnt;i++)WV.q.push({k:pk(pool),t:1+i*(56/cnt),tier:0});if(n%3===0){const gr=pk(ar.el);for(const k2 of gr)WV.q.push({k:k2,t:4,tier:1})}
 if(n%5===0){const gr=ar.bo[(n/5-1)%ar.bo.length];gr.forEach((k2,i)=>WV.q.push({k:k2,t:6,tier:i===(gr.length>>1)||gr.length===1?2:1,boss:1,fin:n===NWAVE}))}
 WV.t=n===NWAVE?1e9:60;WV.st=0;WV.gate=RI(MAP.gates.length);if(n%5===0){banner('主が来る',n===NWAVE?'これが最後':'',1.8);snd('wn')}else if(n%3===0)banner('強い敵が来る','',1.4);for(const q of PLS){q.off=mkOffers(q);const P0=P;P=q;stats();P=P0}}
function updWave(dt){if(!WV)return;if(WV.n===0){WV.t-=dt;if(WV.t<=0)waveStart();return}WV.st+=dt;WV.t-=dt;
 for(const s of WV.q){if(s.done||s.t>WV.st)continue;s.done=1;const gt=MAP.gates[(WV.gate+(s.tier?0:RI(MAP.gates.length)))%MAP.gates.length];const e=addE(s.k,gt.x+(R()-.5)*50,gt.y+(R()-.5)*50,s.tier);if(e&&s.boss&&e.tier===2){banner(e.d.n,'主が現れた',2.4);if(s.fin)e.fin=1}}
 WV.q=WV.q.filter(s=>!s.done);const live=EN.some(e=>!e.dead&&!e.lamp);
 if(!WV.q.length&&!live){if(WV.n>=NWAVE){if(!WV.win){WV.win=1;banner('守り抜いた','',3);later(2.5,()=>{WV.won=1;endRun()})}return}}
 if(WV.t<=0)waveStart()}

/* --- 店（本塔のそばで開く。ゲームは止まらない） --- */
const WCO=[140,320,650,1200],PCO=[110,240,480,950];
const COST={wn:k=>WCO[wrk(k)],pn:k=>PCO[prk(k)],wu:(k,l)=>Math.round(WCO[wrk(k)]*(.3+.22*l)),pu:(k,l)=>Math.round(PCO[prk(k)]*(.45+.3*l)),we:k=>WCO[wrk(k)]*3,tr:150,tu:l=>220*l,tb:350};
function mkOffers(p){const n=WV?WV.n:0,wt=r=>[1,1,.35+n*.08,.1+n*.06][r];const ws=Object.keys(W).filter(k=>!p.ws.some(w=>w.k===k)),ps=Object.keys(PS).filter(k=>!(k in p.pas)&&k!=='magnet'&&k!=='growth');
 const pick=(a,f,m)=>{a=a.slice();const o=[];while(o.length<m&&a.length){let tot=0;for(const k of a)tot+=wt(f(k));let q=R()*tot,i=0;for(;i<a.length-1;i++){q-=wt(f(a[i]));if(q<=0)break}o.push(a[i]);a.splice(i,1)}return o.sort((x,y)=>f(x)-f(y))};return{w:pick(ws,wrk,4),p:pick(ps,prk,4)}}
function shopBuy(p,a){if(!p||p.dead||!nearBase(p))return 0;const P0=P;P=p;let ok=0;const pay=c=>{if(p.gold<c)return 0;p.gold-=c;return 1};
 if(a.t==='wu'){const w=p.ws.find(w=>w.k===a.k);if(w&&!w.evo&&w.lv<8&&pay(COST.wu(w.k,w.lv))){w.lv++;ok=1}}
 else if(a.t==='we'){const w=p.ws.find(w=>w.k===a.k);if(w&&canEvo(w)&&pay(COST.we(w.k))){w.evo=1;ok=1;META.evd=META.evd||{};META.evd[w.k]=1;LS.set('battlearena_meta',META)}}
 else if(a.t==='wn'){if(p.ws.length<WSL()&&!p.ws.some(w=>w.k===a.k)&&pay(COST.wn(a.k))){p.ws.push({k:a.k,lv:1,t:.2,dm:0,oi:p.pi});p.off.w=p.off.w.filter(k=>k!==a.k);ok=1}}
 else if(a.t==='pu'){const n=p.pas[a.k];if(n&&n<PS[a.k].m&&pay(COST.pu(a.k,n))){p.pas[a.k]++;stats();ok=1}}
 else if(a.t==='pn'){if(Object.keys(p.pas).length<WSL()&&!(a.k in p.pas)&&pay(COST.pn(a.k))){p.pas[a.k]=1;stats();p.off.p=p.off.p.filter(k=>k!==a.k);ok=1}}
 else if(a.t==='tr'){const t=TW[0];if(t.hp<t.mhp&&pay(COST.tr)){t.hp=Math.min(t.mhp,t.hp+t.mhp*.25);ok=1}}
 else if(a.t==='tu'){const t=TW[a.i];if(t&&!t.main){if(t.dead){if(pay(COST.tb)){t.dead=0;t.hp=t.mhp;ok=1}}else if(t.lv<5&&pay(COST.tu(t.lv))){t.lv++;t.mhp*=1.3;t.hp=Math.min(t.mhp,t.hp*1.3+t.mhp*.1);ok=1}}}
 else if(a.t==='tb'){const ds=TW.filter(t=>!t.main&&t.dead);if(ds.length&&pay(COST.tb*ds.length)){for(const t of ds){t.dead=0;t.hp=t.mhp}ok=1}}
 else if(a.t==='ts'){const ss=TW.filter(t=>!t.main),lv=ss[0]&&ss[0].lv;if(lv&&lv<5&&pay(COST.tu(lv)*1.6|0)){for(const t of ss){t.lv=lv+1;t.mhp*=1.3;t.hp=t.dead?t.hp:Math.min(t.mhp,t.hp*1.3+t.mhp*.1)}ok=1}}
 else if(a.t==='tm'){const t=TW[0];if(t.lv<5&&pay(COST.tu(t.lv)*1.5|0)){t.lv++;t.mhp*=1.25;t.hp=Math.min(t.mhp,t.hp+t.mhp*.25);ok=1}}
 P=P0;if(ok){FX.push({ty:'lvup',x:p.x,y:p.y,t:.5,t0:.5});snd('tn')}return ok}
let SHT=0,SHR=[];/* 店のタブ */
function shopRows(p){const R2=[],tab=SHT;
 if(tab===0){for(const w of p.ws){const D=W[w.k];if(w.evo)R2.push({ic:D.evo.ic,n:D.evo.n,s:'進化済み',c:0,gl:1});else if(canEvo(w))R2.push({ic:D.evo.ic,n:'進化：'+D.evo.n,s:D.n+' Lv8＋'+PS[D.evo.p].n,c:COST.we(w.k),a:{t:'we',k:w.k},gl:1,rk:wrk(w.k)});else if(w.lv<8)R2.push({ic:D.ic,n:D.n+'  Lv'+w.lv+'→'+(w.lv+1),s:WINC(D.i[w.lv-1]),c:COST.wu(w.k,w.lv),a:{t:'wu',k:w.k},rk:wrk(w.k)});else R2.push({ic:D.ic,n:D.n+'  Lv8',s:'進化には '+PS[D.evo.p].n,c:0})}
  if(p.ws.length<WSL())for(const k of p.off.w)R2.push({ic:W[k].ic,n:W[k].n,s:'新しい武器：'+W[k].d,c:COST.wn(k),a:{t:'wn',k},nw:1,rk:wrk(k)});else R2.push({n:'武器の枠がいっぱい（'+WSL()+'）',s:'',c:0})}
 else if(tab===1){for(const k in p.pas){const n=p.pas[k],D=PS[k];R2.push({ic:D.ic,n:D.n+'  Lv'+n+(n<D.m?'→'+(n+1):''),s:D.d,c:n<D.m?COST.pu(k,n):0,a:n<D.m?{t:'pu',k}:null,rk:prk(k)})}
  if(Object.keys(p.pas).length<WSL())for(const k of p.off.p)R2.push({ic:PS[k].ic,n:PS[k].n,s:'新しい持ち物：'+PS[k].d,c:COST.pn(k),a:{t:'pn',k},nw:1,rk:prk(k)});else R2.push({n:'持ち物の枠がいっぱい（'+WSL()+'）',s:'',c:0})}
 else{const m=TW[0];R2.push({tw:1,n:'本塔を直す',s:'HP '+Math.ceil(m.hp)+' / '+Math.ceil(m.mhp)+'　+25%',c:m.hp<m.mhp?COST.tr:0,a:{t:'tr'}});R2.push({tw:1,n:'本塔を強くする  Lv'+m.lv,s:'攻撃・射程・HP が上がる',c:m.lv<5?COST.tu(m.lv)*1.5|0:0,a:m.lv<5?{t:'tm'}:null});
  {const ss=TW.slice(1),lv=ss.length?ss[0].lv:1,nd=ss.filter(t=>t.dead).length;if(nd)R2.push({tw:1,n:'小塔を建て直す（'+nd+'つ）',s:'崩れた小塔を元に戻す',c:COST.tb*nd,a:{t:'tb'},dead:1});R2.push({tw:1,n:'小塔を強くする（'+ss.length+'つとも）  Lv'+lv,s:'攻撃・射程・HP が上がり、見た目も変わる',c:lv<5?COST.tu(lv)*1.6|0:0,a:lv<5?{t:'ts'}:null})}
  if(0)TW.slice(1).forEach((t,i)=>R2.push({tw:1,n:'小塔'+(i+1)+(t.dead?'（崩れている）':'  Lv'+t.lv),s:t.dead?'建て直す':'攻撃・射程・HP が上がる',c:t.dead?COST.tb:t.lv<5?COST.tu(t.lv):0,a:t.dead||t.lv<5?{t:'tu',i:i+1}:null,dead:t.dead}))}
 return R2}
function shopAct(a){if(!a)return;if(NETC){netTo(MPS.hid,{ty:'buy',a});snd('cl');return}shopBuy(LP(),a)}
/* --- 宝箱（止めない。その場で開き、ただで1つ強くなる） --- */
function openChest2(p,big,x,y){const P0=P;P=p;const n=big?2:1,got=[];for(let i=0;i<n;i++){const ev=p.ws.find(canEvo);if(ev){ev.evo=1;META.evd=META.evd||{};META.evd[ev.k]=1;LS.set('battlearena_meta',META);got.push(W[ev.k].evo.n+' に進化');continue}const up=p.ws.filter(w=>w.lv<8&&!w.evo).map(w=>({t:'w',k:w.k})).concat(Object.keys(p.pas).filter(k=>p.pas[k]<PS[k].m).map(k=>({t:'p',k})));if(up.length){const o=pk(up);takeOpt(o);const inf=o.t==='w'?W[o.k].n+' Lv'+p.ws.find(w=>w.k===o.k).lv:PS[o.k].n+' Lv'+p.pas[o.k];got.push(inf)}}
 const gold=Math.round((big?120:50)*(1+TIME/600)*p.s.greed);p.gold+=gold;P=P0;FX.push({ty:'chest2',x,y,t:1.6,t0:1.6,big});for(let i=0;i<40;i++){const a=-Math.PI/2+(R()-.5)*1.8,v=120+R()*200;part(x,y-20,Math.cos(a)*v,Math.sin(a)*v,1.1,R()<.7?'255,210,90':'255,250,220',2,0,420)}glowAt(x,y-20,'255,220,140',90,.6);shake(5);cjQuick(big);toast(p,'宝箱：'+got.join('・')+'　金貨 +'+gold)}
function toast(p,s){if(p===LP())TOAST.push({s,t:4});if(MPON)evq(['to',p.pi,s])}
function cjQuick(big){try{if(!AC||!MG||VOL<=0)return;const t=AC.currentTime+.02;[60,64,67,72].forEach((m,i)=>cjO(mf(m+12),t+i*.07,.4,'square',.06));[72,76,79].forEach(m=>cjO(mf(m),t+.3,1,'triangle',.07));cjN(t,.3,.5,2500);if(big)[84,88,91,96].forEach((m,i)=>cjO(mf(m),t+.55+i*.08,.5,'sine',.06))}catch(e){}}

/* --- 塔（ユーザー指定：見た目を凝る）。動かない部分は一度描いてとっておき、光る石・輪・旗などは毎フレーム --- */
function mkTowers(){TW=[];const m=1+.6*(NP-1);TW.push({id:0,main:1,x:MAP.base.x,y:MAP.base.y,hp:3600*m,mhp:3600*m,lv:1,rng:310,dmg:36,cd:.65,t:0,r:34,dead:0,fl:0});MAP.subs.forEach((s,i)=>TW.push({id:i+1,main:0,x:s.x,y:s.y,hp:2000*m,mhp:2000*m,lv:1,rng:250,dmg:20,cd:.8,t:0,r:22,dead:0,fl:0}))}
const TWC={};
function twArt(main,lv){const key=(main?'m':'s')+lv;if(TWC[key])return TWC[key];const W2=main?150:84,H2=main?205:135,c=MKC(W2,H2),x=c.getContext('2d'),cx=W2/2,by=H2-8,r=srng(main?77:33),gold=lv>=3;
 // Lv ごとの石の色：1 暗い石 → 2 青みの石 → 3 明るい石と金 → 4 白い大理石 → 5 白と紺、光る紋
 const PAL=[['#2a2834','#3a3748','#4c4860','#625d7a'],['#283246','#3a4660','#50607e','#6c7c9c'],['#3e3a44','#5a5562','#7a7484','#9c96a6'],['#6a6672','#9894a2','#bcb8c6','#dedae6'],['#2c3a6a','#b8bccc','#dcdeea','#f6f6fc']],stone=PAL[lv-1],trim=lv>=5?'#ffd870':gold?'#d8b050':lv>=2?'#9ab0d8':'#7a7a90',rune=lv>=4?'255,220,140':'140,200,255';
 const step=(w,h,y,c1,c2)=>{x.fillStyle=c1;x.beginPath();x.ellipse(cx,y,w,h,0,0,TAU);x.fill();x.fillStyle=c2;x.beginPath();x.ellipse(cx,y-3,w,h,0,0,TAU);x.fill()};
 const up=(lv-1)*(main?7:6);
 // 台座（段々）。Lv が上がると段が増える
 if(main){step(60,19,by,stone[0],stone[1]);step(52,16,by-6,stone[1],stone[2]);if(lv>=3)step(44,13,by-11,stone[2],stone[3]);const ry=by-(lv>=3?14:9);x.strokeStyle=`rgba(${rune},.6)`;x.lineWidth=1.5;x.beginPath();x.ellipse(cx,ry,40,12,0,0,TAU);x.stroke();for(let k=0;k<(lv>=4?12:8);k++){const a=k/(lv>=4?12:8)*TAU;x.fillStyle=`rgba(${rune},.85)`;x.fillRect(cx+Math.cos(a)*40-1,ry+Math.sin(a)*12-1,3,2)}}
 else{step(30,10,by,stone[0],stone[1]);step(25,8,by-4,stone[1],stone[2]);if(lv>=3)step(20,6,by-7,stone[2],stone[3])}
 const bw=main?30:15,tw2=main?22:10,top=(main?82:62)-up,bot=by-(main?(lv>=3?18:14):(lv>=3?10:7));
 // 脇の小さな塔（本塔 Lv4〜）／脇の柱（小塔 Lv4〜）
 if(lv>=4){for(const sd of[-1,1]){const tx2=cx+sd*(main?44:20),tt=main?top+56:top+34,tw3=main?8:4;x.fillStyle=stone[1];x.fillRect(tx2-tw3,tt,tw3*2,bot-tt+4);x.fillStyle=stone[2];x.fillRect(tx2-tw3,tt,tw3*.8,bot-tt+4);x.fillStyle=stone[3];x.fillRect(tx2-tw3-2,tt-4,tw3*2+4,5);x.fillStyle=trim;x.beginPath();x.moveTo(tx2-tw3-1,tt-4);x.lineTo(tx2,tt-(main?18:12));x.lineTo(tx2+tw3+1,tt-4);x.fill();x.fillStyle=`rgba(${rune},.9)`;x.fillRect(tx2-1,tt+8,2,main?8:5)}}
 // 本体：細くなる石の塔、石積み
 x.fillStyle=stone[1];x.beginPath();x.moveTo(cx-bw,bot);x.lineTo(cx-tw2,top);x.lineTo(cx+tw2,top);x.lineTo(cx+bw,bot);x.fill();
 x.fillStyle=stone[2];x.beginPath();x.moveTo(cx-bw,bot);x.lineTo(cx-tw2,top);x.lineTo(cx-tw2*.2,top);x.lineTo(cx-bw*.2,bot);x.fill();
 x.fillStyle=lv>=4?'rgba(60,50,80,.14)':'rgba(0,0,0,.18)';for(let yy=top+6;yy<bot;yy+=(main?9:7)){const k=(yy-top)/(bot-top),hw=tw2+(bw-tw2)*k;x.fillRect(cx-hw,yy,hw*2,1);for(let xx=-hw+((yy/9|0)%2?4:9);xx<hw;xx+=10)x.fillRect(cx+xx,yy,1,main?9:7)}
 // 帯（Lv2〜：光る紋の帯、Lv3〜：金の帯）
 if(lv>=2){const nb=main?(lv>=5?3:2):1;for(let b=0;b<nb;b++){const yy=top+(bot-top)*(.3+b*.25),k=(yy-top)/(bot-top),hw=tw2+(bw-tw2)*k;x.fillStyle=gold?trim:stone[3];x.fillRect(cx-hw,yy,hw*2,2);if(lv>=5||b===0&&lv>=2){x.fillStyle=`rgba(${rune},.8)`;for(let q=-hw+3;q<hw-2;q+=6)x.fillRect(cx+q,yy+3,3,1)}}}
 if(main){for(const sd of[-1,1]){x.fillStyle=stone[0];x.beginPath();x.moveTo(cx+sd*bw,bot);x.lineTo(cx+sd*(bw+10),bot);x.lineTo(cx+sd*(tw2+4),top+40);x.lineTo(cx+sd*(tw2+1),top+40);x.fill()}
  const wc=lv>=3?'255,215,150':'140,200,255';for(const[wx,wy]of[[0,top+22],[-10,top+48],[10,top+48],[0,top+74]].concat(lv>=4?[[0,top+100-up]]:[])){if(wy>bot-24)continue;x.fillStyle='#120e1c';x.fillRect(cx+wx-3,wy-6,6,10);x.fillStyle=`rgba(${wc},.85)`;x.fillRect(cx+wx-2,wy-4,4,7);x.fillStyle='rgba(255,255,255,.6)';x.fillRect(cx+wx-2,wy-4,1,3)}
  x.fillStyle='#120e1c';x.beginPath();x.moveTo(cx-8,bot);x.lineTo(cx-8,bot-14);x.quadraticCurveTo(cx,bot-22,cx+8,bot-14);x.lineTo(cx+8,bot);x.fill();x.fillStyle=lv>=3?'rgba(255,200,120,.4)':'rgba(120,180,255,.35)';x.fillRect(cx-6,bot-12,12,12);if(gold){x.fillStyle=trim;x.fillRect(cx-9,bot-16,18,2)}}
 else{x.fillStyle=`rgba(${lv>=3?'255,215,150':'140,200,255'},.8)`;x.fillRect(cx-1,top+16,3,24+up*.5);x.fillStyle='rgba(255,255,255,.5)';x.fillRect(cx-1,top+16,1,8)}
 // 胸壁と冠（Lv で冠が高くなる）
 const cw=tw2+(main?8:4);x.fillStyle=stone[3];x.fillRect(cx-cw,top-6,cw*2,8);x.fillStyle=stone[2];for(let k=-cw;k<cw;k+=main?8:6)x.fillRect(cx+k,top-12,main?5:4,7);x.fillStyle=trim;x.fillRect(cx-cw,top+1,cw*2,2);
 if(main){const sh=lv>=5?42:lv>=3?34:26;x.fillStyle=stone[1];x.beginPath();x.moveTo(cx-16,top-10);x.lineTo(cx,top-10-sh);x.lineTo(cx+16,top-10);x.fill();x.fillStyle=stone[2];x.beginPath();x.moveTo(cx-16,top-10);x.lineTo(cx,top-10-sh);x.lineTo(cx-3,top-10);x.fill();x.fillStyle=trim;x.fillRect(cx-1,top-14-sh,2,6);if(gold){x.fillRect(cx-16,top-11,32,2)}}
 else if(lv>=2){const sh=lv>=4?18:11;x.fillStyle=stone[1];x.beginPath();x.moveTo(cx-8,top-10);x.lineTo(cx,top-10-sh);x.lineTo(cx+8,top-10);x.fill();x.fillStyle=trim;x.fillRect(cx,top-12-sh,1,4)}
 // 苔（Lv1・2 だけ。年季）
 if(lv<=2){x.fillStyle='rgba(80,110,70,.35)';for(let k=0;k<(main?8:4);k++)x.fillRect(cx+(r()-.5)*bw*1.6|0,bot-r()*30|0,3+r()*5|0,2)}
 return TWC[key]={c,W:W2,H:H2,top}}
function drawTower(t,x,y){const m=t.main;if(t._lv!=null&&t.lv>t._lv)t.up=1.4;t._lv=t.lv;const a=twArt(m,t.lv),dx=x-a.W/2|0,dy=y-a.H+8|0,top=dy+a.top;
 g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(x+6,y+4,m?62:30,m?20:10,0,0,TAU);g.fill();
 if(t.dead){g.fillStyle='#2e2a36';for(let k=0;k<7;k++){const bx=x+((k*37)%(m?70:36))-(m?35:18),by=y-((k*13)%10);g.beginPath();g.moveTo(bx-6,by+4);g.lineTo(bx-2,by-6-k%3*3);g.lineTo(bx+6,by-2);g.lineTo(bx+5,by+4);g.fill()}g.fillStyle='rgba(80,80,90,.4)';g.beginPath();g.ellipse(x,y,m?40:20,m?12:6,0,0,TAU);g.fill();return}
 // 本体
 g.drawImage(a.c,dx,dy);if(t.fl>0){g.globalCompositeOperation='lighter';g.globalAlpha=t.fl*5;g.drawImage(a.c,dx,dy);g.globalAlpha=1;g.globalCompositeOperation='source-over'}
 // 傷み：ひびと煙
 const hr=t.hp/t.mhp;if(hr<.6){g.strokeStyle='rgba(10,8,14,.8)';g.lineWidth=1;for(let k=0;k<(hr<.3?4:2);k++){const sx=x+((k*17)%20)-10,sy=top+20+k*18;g.beginPath();g.moveTo(sx,sy);g.lineTo(sx+4,sy+6);g.lineTo(sx+1,sy+12);g.lineTo(sx+5,sy+18);g.stroke()}}
 if(hr<.35&&R()<.3)part(x+(R()-.5)*20,top+10,(R()-.5)*8,-20,1.4,'60,55,60',6,2);
 // 光る石と輪
 const cy=top-(m?(t.lv>=5?58:t.lv>=3?50:42):(t.lv>=4?34:t.lv>=2?28:20))+Math.sin(T*2+t.id)*3,cs=(m?16:9)*(1+(t.lv-1)*.08),col=t.lv>=4?'255,210,120':t.lv>=2?'170,220,255':'120,180,255';
 g.globalCompositeOperation='lighter';g.globalAlpha=.55+.2*Math.sin(T*3+t.id);g.drawImage(glowC(col),x-cs*3,cy-cs*3,cs*6,cs*6);g.globalAlpha=1;g.globalCompositeOperation='source-over';
 if(m){for(let k=0;k<2;k++){g.strokeStyle=`rgba(${col},${.55-k*.15})`;g.lineWidth=1.5;g.beginPath();g.ellipse(x,cy,cs*1.9+k*7,cs*.55+k*2,T*(k?-.6:.8),0,TAU);g.stroke()}const a2=T*1.6;for(let k=0;k<3;k++){const an=a2+k*TAU/3;g.fillStyle=`rgba(${col},.9)`;g.fillRect(x+Math.cos(an)*cs*2.2-1,cy+Math.sin(an)*cs*.7-1,3,3)}}
 g.fillStyle=`rgb(${col})`;g.beginPath();g.moveTo(x,cy-cs);g.lineTo(x+cs*.6,cy);g.lineTo(x,cy+cs*.8);g.lineTo(x-cs*.6,cy);g.fill();g.fillStyle='rgba(255,255,255,.8)';g.beginPath();g.moveTo(x,cy-cs);g.lineTo(x+cs*.2,cy-cs*.1);g.lineTo(x-cs*.25,cy);g.fill();g.fillStyle='rgba(0,0,40,.25)';g.beginPath();g.moveTo(x,cy+cs*.8);g.lineTo(x+cs*.6,cy);g.lineTo(x+cs*.1,cy+cs*.1);g.fill();
 // 旗（本塔）
 if(m)for(const s of[-1,1]){const fx=x+s*24,fy=top-6;g.fillStyle='#6a5a40';g.fillRect(fx,fy-24,2,24);const wv=Math.sin(T*4+s)*2;g.fillStyle=t.lv>=3?'#c89a30':'#a8323e';g.beginPath();g.moveTo(fx+1,fy-24);g.lineTo(fx+1+s*16,fy-20+wv);g.lineTo(fx+1+s*14,fy-12+wv);g.lineTo(fx+1,fy-14);g.fill();g.fillStyle='rgba(255,230,160,.6)';g.fillRect(fx+1,fy-24,s*12,1)}
 // HP と Lv
 const bw=m?70:42;if(t.up>0){t.up-=1/60;g.globalCompositeOperation='lighter';g.globalAlpha=Math.min(1,t.up);g.drawImage(glowC('255,230,160'),x-80,top-60,160,200);g.globalAlpha=1;g.globalCompositeOperation='source-over'}g.fillStyle='rgba(0,0,0,.6)';g.fillRect(x-bw/2,y+8,bw,5);g.fillStyle=hr<.3?'#ff6050':'#5aa0ff';g.fillRect(x-bw/2,y+8,bw*hr,5);g.fillStyle='rgba(255,255,255,.3)';g.fillRect(x-bw/2,y+8,bw*hr,1);if(t.lv>1){g.font='8px '+FP;g.textAlign='center';g.fillStyle='#ffe8a0';g.fillText('Lv'+t.lv,x,y+24)}
 // 店を開ける合図（本塔のそばにいる時）
 if(m&&P&&!P.dead&&nearBase(P)&&!SHOPO){const pu=.5+.5*Math.sin(T*5);g.strokeStyle=`rgba(255,220,140,${.4+.4*pu})`;g.lineWidth=2;g.beginPath();g.ellipse(x,y-4,60+pu*4,20+pu*1.5,0,0,TAU);g.stroke();g.font='10px '+FT;g.textAlign='center';g.fillStyle='rgba(0,0,0,.6)';g.fillText(TOUCH?'塔を押して店':'塔を押す／E で店',x+1,dy-5);g.fillStyle='#ffe0a0';g.fillText(TOUCH?'塔を押して店':'塔を押す／E で店',x,dy-6)}}

/* --- 店（本塔を押すと開く。ユーザー指定：使いやすく） --- */
let SHOPO=0;const nearBase=p=>MAP&&TW[0]&&!TW[0].dead&&p&&hyp(p.x-MAP.base.x,p.y-MAP.base.y)<190;
function openShop(){if(nearBase(LP())&&!LP().dead){SHOPO=1;snd('cl')}}
function drawShopUI(){const p=P;if(!SHOPO)return;if(!p||p.dead||!nearBase(p)){SHOPO=0;return}const rows=shopRows(p),w=Math.min(UW-24,600),cols=w>=500?3:2,gap=6,cw=(w-24-(cols-1)*gap)/cols,chh=62,rowsN=Math.ceil(rows.length/cols),h=Math.min(UH-70,92+rowsN*(chh+gap)),x=(UW-w)/2|0,y=Math.max(46,(UH-h)/2|0);
 g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,0,UW,UH);btn(0,0,UW,UH,()=>{SHOPO=0});
 g.fillStyle='rgba(14,12,22,.95)';g.fillRect(x,y,w,h);g.fillStyle='rgba(120,180,255,.8)';g.fillRect(x,y,w,2);btn(x,y,w,h,()=>{});
 tx('本塔の店',x+14,y+22,'#d8e6ff','left',15);tx('ゲームは止まっていない',x+14,y+38,'#7a8098','left',9);g.drawImage(COIN,x+w-150,y+10,16,16);tx(String(Math.floor(p.gold)),x+w-128,y+25,'#ffd860','left',14,FP);
 box(x+w-34,y+8,26,24,'rgba(60,40,50,.9)');g.strokeStyle='#e8d8d8';g.lineWidth=2;g.beginPath();g.moveTo(x+w-27,y+14);g.lineTo(x+w-15,y+26);g.moveTo(x+w-15,y+14);g.lineTo(x+w-27,y+26);g.stroke();btn(x+w-38,y+4,34,32,()=>{SHOPO=0;snd('cl')});
 ['武器','持ち物','塔'].forEach((n,i)=>{const tw3=(w-28)/3,bx=x+12+i*(tw3+2),on=SHT===i;g.fillStyle=on?'rgba(70,110,190,.95)':'rgba(40,44,62,.9)';g.fillRect(bx,y+46,tw3,28);if(on){g.fillStyle='#bcd6ff';g.fillRect(bx,y+72,tw3,2)}tx(n,bx+tw3/2,y+65,on?'#fff':'#a8b0c8','center',13);btn(bx,y+44,tw3,32,()=>{SHT=i;snd('cl')})});
 const y0=y+82;g.save();g.beginPath();g.rect(x,y0,w,h-86);g.clip();
 rows.forEach((r,i)=>{const cx=x+12+(i%cols)*(cw+gap),cy=y0+(i/cols|0)*(chh+gap),can=!!r.a&&p.gold>=r.c;const bg=r.gl&&r.a?'rgba(80,60,20,.85)':r.nw?'rgba(24,46,32,.85)':'rgba(30,32,46,.9)';g.fillStyle=bg;g.fillRect(cx,cy,cw,chh);g.fillStyle=r.gl?'rgba(255,210,110,.8)':r.nw?'rgba(120,230,150,.6)':'rgba(140,160,210,.35)';g.fillRect(cx,cy,cw,1);
  if(r.ic){g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.arc(cx+24,cy+26,18,0,TAU);g.fill();icon(r.ic,cx+10,cy+12,28,r.gl)}else if(r.tw){g.fillStyle=r.dead?'#5a5060':'#5aa0ff';g.beginPath();g.moveTo(cx+24,cy+10);g.lineTo(cx+33,cy+26);g.lineTo(cx+24,cy+42);g.lineTo(cx+15,cy+26);g.fill()}
  if(r.rk!=null){const rc=RKC[r.rk];g.fillStyle='rgba(0,0,0,.55)';g.fillRect(cx+31,cy+30,15,15);g.fillStyle=rc;g.fillRect(cx+31,cy+30,15,2);tx(RKN[r.rk],cx+38.5,cy+42,rc,'center',10,FP)}
  if(r.nw){g.fillStyle='#2e8a50';g.fillRect(cx+cw-36,cy+4,32,12);tx('NEW',cx+cw-20,cy+14,'#e8ffe8','center',7,FP)}
  tx(r.n,cx+48,cy+20,'#f4ecdc','left',11);g.font='9px '+FT;const s2=r.s;const mxw=cw-56;let line=s2;if(g.measureText(line).width>mxw){while(line.length&&g.measureText(line+'…').width>mxw)line=line.slice(0,-1);line+='…'}tx(line,cx+48,cy+35,'#a8b0c4','left',9);
  if(r.c){const pw2=58,px2=cx+cw-pw2-6,py2=cy+chh-22;g.fillStyle=can?'rgba(60,130,70,.95)':'rgba(70,50,50,.7)';g.fillRect(px2,py2,pw2,17);g.drawImage(COIN,px2+5,py2+4,9,9);tx(String(r.c),px2+pw2-6,py2+13,can?'#fff':'#c8a0a0','right',10)}else if(!r.a&&r.n.indexOf('いっぱい')<0)tx('最大',cx+cw-8,cy+chh-9,'#8ae0a0','right',10);
  if(r.a)btn(cx,cy,cw,chh,()=>{if(p.gold>=r.c){shopAct(r.a);SHF={i,t:T}}else snd('cl')});
  if(SHF&&SHF.i===i&&T-SHF.t<.3){g.fillStyle=`rgba(255,240,200,${.4*(1-(T-SHF.t)/.3)})`;g.fillRect(cx,cy,cw,chh)}});g.restore()}
let SHF=null;
let VOLP=0,BGV=10;try{const v=localStorage.getItem('battlearena_bgv');if(v!=null)BGV=cl(+v,0,10)}catch(e){}
function setBGV(v){BGV=cl(v,0,10);try{localStorage.setItem('battlearena_bgv',BGV)}catch(e){}}
function applyBGV(){try{if(typeof BG!=='undefined'&&BG&&AC){const tg=BGV/10*(CJ.duck?.12:1);if(BG._t!==tg){BG.gain.setTargetAtTime(tg,AC.currentTime,.08);BG._t=tg}}}catch(e){}}
function volRow(x,y,w,lab,v,f){tx(lab,x,y+14,'#d8d0c8','left',12);const bx=x+78,bw=w-78-70;box(bx-36,y,28,22,'rgba(50,54,76,.95)');tx('−',bx-22,y+16,'#fff','center',14);btn(bx-40,y-4,36,30,()=>{f(v-1);snd('cl')});
 for(let i=0;i<10;i++){const sx=bx+i*(bw/10);g.fillStyle=i<v?'#e0b050':'rgba(255,255,255,.1)';g.fillRect(sx+1,y+4,bw/10-3,14);btn(sx,y-4,bw/10,30,()=>{f(i+1);snd('cl')})}
 box(bx+bw+6,y,28,22,'rgba(50,54,76,.95)');tx('+',bx+bw+20,y+16,'#fff','center',14);btn(bx+bw+4,y-4,36,30,()=>{f(v+1);snd('cl')});tx(v?String(v):'切',x+w,y+15,'#a8a0b0','right',11)}
function drawVolP(){const w=Math.min(UW-30,380),h=150;const[x,y]=panel(w,h);btn(0,0,UW,UH,()=>{VOLP=0});btn(x,y,w,h,()=>{});tx('音量',UW/2,y+24,'#f0e6c8','center',15);
 volRow(x+20,y+44,w-40,'全体',typeof VOL!=='undefined'?VOL:10,v=>{try{setVol(cl(v,0,10))}catch(e){}});volRow(x+20,y+80,w-40,'曲',BGV,v=>setBGV(v));
 box(UW/2-50,y+h-30,100,22,'rgba(50,56,80,.95)');tx('閉じる',UW/2,y+h-14,'#fff','center',11);btn(UW/2-50,y+h-30,100,22,()=>{VOLP=0})}

/* --- 小さな地図（右上、小さめ） --- */
let MMC=null;const MMW=()=>Math.min(108,UW*.15);
function drawMini(){if(!MAP)return;const w=MMW(),h=w*MAP.H/MAP.W,x=UW-w-6,y=6,sx=w/MAP.W,sy=h/MAP.H;
 if(!MMC||MMC.m!==MAP){const c=MKC(MAP.gw,MAP.gh),cx=c.getContext('2d');for(let j=0;j<MAP.gh;j++)for(let i=0;i<MAP.gw;i++){const v=MAP.G[j*MAP.gw+i];cx.fillStyle=v===0?'rgba(170,170,180,.6)':v===2?'rgba(50,80,120,.45)':v===3?'rgba(90,90,100,.7)':'rgba(0,0,0,0)';cx.fillRect(i,j,1,1)}MMC={m:MAP,c}}
 g.fillStyle='rgba(8,8,14,.72)';g.fillRect(x-3,y-3,w+6,h+6);g.imageSmoothingEnabled=false;g.drawImage(MMC.c,x,y,w,h);
 for(const gt of MAP.gates){g.fillStyle='#e03040';g.fillRect(x+gt.x*sx-2,y+gt.y*sy-2,4,4)}
 for(const e of EN){if(e.dead||e.lamp)continue;g.fillStyle=e.tier===2?'#ff3050':e.tier?'#ff9040':'#d04040';const s=e.tier?3:1.5;g.fillRect(x+e.x*sx-s/2,y+e.y*sy-s/2,s,s)}
 for(const t of TW){g.fillStyle=t.dead?'#555':t.main?'#8ac0ff':'#5a90e0';const s=t.main?5:3;g.fillRect(x+t.x*sx-s/2,y+t.y*sy-s/2,s,s)}
 for(const k of PK)if(k.ty==='chest'){g.fillStyle='#ffd060';g.fillRect(x+k.x*sx-1.5,y+k.y*sy-1.5,3,3)}
 PLS.forEach((q,i)=>{if(q.dead)return;g.fillStyle=MPON?PCOL[i]:'#60ff90';g.fillRect(x+q.x*sx-1.5,y+q.y*sy-1.5,3,3)});
 g.strokeStyle='rgba(255,255,255,.45)';g.lineWidth=1;g.strokeRect(x+CAMX*sx,y+CAMY*sy,LW*sx,LH*sy)}

/* ===== 描画 ===== */
const mm=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(Math.floor(s%60)).padStart(2,'0');
let PMODE='';function draw(){if(MODE!==PMODE){if(MODE==='title')titleEnter();if(MODE==='char'){CSL.from=-1;CSL.t0=T-1;CSL.bx=0}PMODE=MODE}g.setTransform(K,0,0,K,0,0);g.imageSmoothingEnabled=false;BTN=[];const ui=()=>{g.setTransform(K*US,0,0,K*US,0,0);g.imageSmoothingEnabled=false};
 if(MODE==='title'){ui();drawTitle();if(VOLP)drawVolP();return}if(MODE==='char'){ui();return drawChar()}if(MODE==='stage'){ui();return drawStage()}if(MODE==='shop'){ui();return drawShop()}if(MODE==='mpm'){ui();return drawMpm()}if(MODE==='mpj'){ui();return drawMpj()}if(MODE==='lobby'){ui();return drawLobby()}
 drawWorld();ui();drawHUD();if(MODE==='lv')drawLv();else if(MODE==='lvw')drawLvWait();else if(LOUT)drawLvOut();if(MODE==='chest')drawChest();if(PAUSE)drawPause();if(INF)drawInf();if(VOLP)drawVolP();if(MODE==='result')drawResult()}
function drawWorld(){const p=P;const cx0=MAP?cl(p.x-LW/2,-60,Math.max(-60,MAP.W-LW+60)):p.x-LW/2,cy0=MAP?cl(p.y-LH/2-10,-60,Math.max(-60,MAP.H-LH+60)):p.y-LH/2-10;CAMX=Math.round(cx0+(R()-.5)*SHAKE);CAMY=Math.round(cy0+(R()-.5)*SHAKE);
 if(MAP){g.fillStyle=M_DARK();g.fillRect(0,0,LW,LH);const c0=Math.floor(CAMX/CHK),c1=Math.floor((CAMX+LW)/CHK),r0=Math.floor(CAMY/CHK),r1=Math.floor((CAMY+LH)/CHK);for(let cj=r0;cj<=r1;cj++)for(let ci=c0;ci<=c1;ci++){if(ci<0||cj<0||ci*CHK>=MAP.W||cj*CHK>=MAP.H)continue;g.drawImage(mapChunk(ci,cj),ci*CHK-CAMX,cj*CHK-CAMY)}}else{const ts=TILE.width,sx=-((CAMX%ts)+ts)%ts,sy=-((CAMY%ts)+ts)%ts;for(let x=sx;x<LW;x+=ts)for(let y=sy;y<LH;y+=ts)g.drawImage(TILE,x,y)}
 const X=x=>Math.round(x-CAMX),Y=y=>Math.round(y-CAMY);
 // 毒の霧・炎の溜まり（地面）
 for(const p of PLS)for(const w of p.ws)if(w.k==='poison'&&w.rr&&!p.dead){const r=w.rr;const gr=g.createRadialGradient(X(p.x),Y(p.y-6),r*.2,X(p.x),Y(p.y-6),r);gr.addColorStop(0,'rgba(90,170,80,0)');gr.addColorStop(.75,`rgba(90,170,80,${.16+Math.sin(T*4)*.04})`);gr.addColorStop(1,'rgba(90,170,80,0)');g.fillStyle=gr;g.beginPath();g.ellipse(X(p.x),Y(p.y-6),r,r*.8,0,0,TAU);g.fill()}
 for(const f of FX)if(f.ty==='pool'){const a=Math.min(1,f.t*2);for(let i=0;i<10;i++){const an=i/10*TAU+T*.8,rr=f.r*(.4+.5*((i*37)%10)/10);const fx=X(f.x+Math.cos(an)*rr),fy=Y(f.y+Math.sin(an)*rr*.6),h=6+Math.sin(T*12+i)*3;g.fillStyle=`rgba(255,${120+i*8},40,${.55*a})`;g.fillRect(fx-2,fy-h,4,h);g.fillStyle=`rgba(255,220,120,${.5*a})`;g.fillRect(fx-1,fy-h+1,2,2)}
  const gr=g.createRadialGradient(X(f.x),Y(f.y),0,X(f.x),Y(f.y),f.r);gr.addColorStop(0,`rgba(255,130,40,${.3*a})`);gr.addColorStop(1,'rgba(255,90,30,0)');g.fillStyle=gr;g.beginPath();g.ellipse(X(f.x),Y(f.y),f.r,f.r*.6,0,0,TAU);g.fill()}
 if(MAP)for(const gt of MAP.gates){const x=X(gt.x),y=Y(gt.y);if(x<-80||y<-80||x>LW+80||y>LH+80)continue;const pu=.5+.5*Math.sin(T*3);g.fillStyle='rgba(20,0,6,.75)';g.beginPath();g.ellipse(x,y,34,16,0,0,TAU);g.fill();g.globalCompositeOperation='lighter';g.globalAlpha=.4+.2*pu;g.drawImage(glowC('200,30,40'),x-46,y-30,92,52);g.globalAlpha=1;g.globalCompositeOperation='source-over';g.strokeStyle=`rgba(255,70,60,${.5+.3*pu})`;g.lineWidth=1.5;for(let k=0;k<3;k++){g.beginPath();g.ellipse(x,y,34-k*9+Math.sin(T*4+k)*2,16-k*4,T*.5*(k%2?1:-1),0,TAU);g.stroke()}}
 drawTG(X,Y);
 // 拾い物
 for(const k of PK){const x=X(k.x),y=Y(k.y);if(x<-20||y<-20||x>LW+20||y>LH+20)continue;const b=Math.sin(T*4+k.x)*1.5;
  if(k.ty==='xp')g.drawImage(GEM[k.c],x-3,y-4+b|0);else if(k.ty==='coin')g.drawImage(COIN,x-3,y-4+b|0);else if(k.ty==='food'){g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(x,y+1,8,3,0,0,TAU);g.fill();g.drawImage(ONIG,x-11,y-19+b|0,22,20)}else if(k.ty==='mag'){g.globalCompositeOperation='lighter';g.globalAlpha=.6+.3*Math.sin(T*5);g.drawImage(glowC('140,200,255'),x-20,y-30+b,40,40);g.globalAlpha=1;g.globalCompositeOperation='source-over';g.drawImage(MAGN,x-9,y-19+b|0,18,18)}
  else if(k.ty==='chest'){const s=k.big?28:20;const gr=g.createRadialGradient(x,y-s/2,0,x,y-s/2,s*1.2);gr.addColorStop(0,'rgba(255,214,110,.4)');gr.addColorStop(1,'rgba(255,214,110,0)');g.fillStyle=gr;g.fillRect(x-s*1.2,y-s*1.7,s*2.4,s*2.4);
   g.fillStyle='#5a3a1c';g.fillRect(x-s/2,y-s*.7,s,s*.7);g.fillStyle='#7a5228';g.fillRect(x-s/2,y-s*.95,s,s*.35);g.fillStyle='#d8b050';g.fillRect(x-s/2,y-s*.62,s,2);g.fillRect(x-2,y-s*.7,4,5);g.fillStyle='#3a2410';g.fillRect(x-s/2,y-2,s,2)}}
 // 体（足元の y の順に）
 const list=EN.filter(e=>Math.abs(e.x-p.x)<LW/2+120&&Math.abs(e.y-p.y)<LH/2+160);list.push(...PLS);for(const t of TW)if(Math.abs(t.x-p.x)<LW/2+80&&Math.abs(t.y-p.y)<LH/2+140)list.push(t);list.sort((a,b)=>a.y-b.y);
 for(const e of list){if(!e.tier||e.dead||e.tier===3)continue;const x=X(e.x),y=Y(e.y),rr=e.r*(e.tier===2?2:1.6),pu=.5+.5*Math.sin(T*4);g.globalCompositeOperation='lighter';g.globalAlpha=.35+.2*pu;g.drawImage(glowC(e.tier===2?'255,40,40':'255,140,40'),x-rr*1.6,y-rr*.8,rr*3.2,rr*1.6);g.globalAlpha=1;g.globalCompositeOperation='source-over';g.strokeStyle=e.tier===2?`rgba(255,70,60,${.55+.3*pu})`:`rgba(255,160,70,${.5+.3*pu})`;g.lineWidth=2;g.beginPath();g.ellipse(x,y,rr,rr*.45,0,0,TAU);g.stroke();g.lineWidth=1;g.beginPath();g.ellipse(x,y,rr*(1.15+.1*pu),rr*.45*(1.15+.1*pu),0,0,TAU);g.stroke()}
 for(const e of list){const x=X(e.x),y=Y(e.y);g.fillStyle='rgba(0,0,0,.28)';g.beginPath();g.ellipse(x,y,(e.isPl?10:e.main!=null?0:e.r||8),(e.isPl?4:e.main!=null?0:(e.r||8)*.4),0,0,TAU);g.fill()}
 for(const e of list){const x=X(e.x),y=Y(e.y);
  if(e.main!=null){drawTower(e,x,y);continue}
  if(e.isPl){const p=e;const s=cSpr(CHS[p.ci].k);if(!s.ok)continue;if(MPON){const c=PCOL[p.pi];g.strokeStyle=c;g.globalAlpha=.8;g.lineWidth=1.5;g.beginPath();g.ellipse(x,y,13,5,0,0,TAU);g.stroke();g.globalAlpha=1;if(!p.dead){g.font='9px '+FT;g.textAlign='center';g.fillStyle='rgba(0,0,0,.6)';g.fillText(p.nm,x+1,y-s.h-5);g.fillStyle=c;g.fillText(p.nm,x,y-s.h-6)}}const bob=p.walk?Math.abs(Math.sin(p.walk*11))*2:0,fl=p.face<0;
   if(p.dead){const q=cl((p.dT||0)/.45,0,1),ang=(fl?1:-1)*Math.PI/2*(1-Math.pow(1-q,3)),bo=q>=1?Math.max(0,Math.sin(((p.dT||0)-.45)*14))*Math.max(0,1-((p.dT||0)-.45)*2)*3:0;g.save();g.translate(x,y-bo);g.rotate(ang);g.globalAlpha=Math.max(.35,1-(p.dT||0)*.3);g.drawImage(fl?s.f:s.n,-s.w/2|0,-s.h+2|0);g.globalCompositeOperation='source-atop';g.restore();g.globalAlpha=1;continue}
   if(p.hurtT>0){g.globalCompositeOperation='lighter';g.globalAlpha=p.hurtT*1.5;g.drawImage(glowC('255,60,50'),x-26,y-s.h-6,52,s.h+12);g.globalAlpha=1;g.globalCompositeOperation='source-over'}
   const c=p.hit>0?(fl?s.wf:s.wn):(fl?s.f:s.n);if(p.inv>0&&(T*20|0)%2)g.globalAlpha=.55;const sh=p.hurtT>.25?(R()-.5)*3:0;g.drawImage(c,x-s.w/2+sh|0,y-s.h+2-bob|0);g.globalAlpha=1;continue}
  if(e.lamp){const fy=y-34+Math.sin(T*3+e.x);g.globalCompositeOperation='lighter';g.globalAlpha=.55+.15*Math.sin(T*9+e.x);g.drawImage(glowC('255,170,80'),x-26,fy-14,52,52);g.globalAlpha=1;g.globalCompositeOperation='source-over';icon('lamp',x-16,y-38+Math.sin(T*3+e.x)*1,32);continue}
  const s=e.sp;if(!s.ok)continue;const dying=e.dead;const fx=FX.find(f=>f.e===e);let a=1,sq=1;if(dying&&fx){a=fx.t/fx.t0;sq=a}
  const fl=p.x>e.x;const c=e.fl>0?(fl?s.wf:s.wn):(fl?s.f:s.n);const bob=Math.sin(e.ph)*(e.d&&e.d.cat==='fly'?3:1),st=1+Math.sin(e.ph)*.03;
  if(e.cast>0){const q=.5+.5*Math.sin(T*18),gs=Math.max(s.w,s.h)*.75;g.globalCompositeOperation='lighter';g.globalAlpha=.35+.25*q;g.drawImage(glowC(e.tier===2?'255,60,40':'255,140,60'),x-gs,y-s.h*.5-gs,gs*2,gs*2);g.globalAlpha=1;g.globalCompositeOperation='source-over'}
  g.globalAlpha=a;if(e.tier===3){g.globalAlpha=.85}const w=s.w*(2-st),h=s.h*st*sq;g.drawImage(c,x-w/2|0,y-h+2-(e.d&&e.d.cat==='fly'?8+bob:Math.max(0,bob))|0,w|0,h|0);g.globalAlpha=1;
  if(e.frz>0){g.globalCompositeOperation='lighter';g.globalAlpha=.5;g.drawImage(glowC('150,210,255'),x-s.w*.6,y-s.h,s.w*1.2,s.h*1.1);g.globalAlpha=1;g.globalCompositeOperation='source-over'}
  if(e.lbt>0&&e.lbs){e.lbt-=1/60;g.globalAlpha=Math.min(1,e.lbt*2);tx(e.lbs,x,y-h-8,e.tier===2?'#ff8a70':'#ffc890','center',11);g.globalAlpha=1}
  if(e.tier===1||e.tier===2){const bw=e.tier===2?60:40;g.fillStyle='rgba(0,0,0,.5)';g.fillRect(x-bw/2,y+6,bw,3);g.fillStyle='#c03040';g.fillRect(x-bw/2,y+6,bw*Math.max(0,e.hp/e.mhp),3)}}
 // 弾
 for(const b of BU){const x=X(b.x),y=Y(b.y);
  if(b.ty==='knife'){const a=Math.atan2(b.vy,b.vx);if(b.tr)b.tr.forEach((q,i)=>{if(i%2)return;g.save();g.translate(X(q.x),Y(q.y));g.rotate(a);g.fillStyle=`rgba(${b.w.evo?'150,230,170':'220,230,255'},${.25-i*.03})`;g.fillRect(-4,-1,10,2);g.restore()});g.save();g.translate(x,y);g.rotate(a);g.fillStyle='#e8ecf4';g.fillRect(-2,-1,10,3);g.fillStyle='#fff';g.fillRect(4,-1,4,1);g.fillStyle='#7a4a24';g.fillRect(-7,-1,5,3);g.fillStyle='#c8a050';g.fillRect(-2,-2,1,5);g.restore()}
  else if(b.ty==='moon'){const a=Math.atan2(b.vy,b.vx),r=b.r,al=Math.min(1,b.t*3),cres=(xx,yy,aa,sc)=>{g.save();g.translate(xx,yy);g.rotate(a);g.globalAlpha=al*aa;g.fillStyle=b.w.evo?'rgba(200,180,255,.85)':'rgba(170,215,255,.85)';g.beginPath();g.arc(0,0,r*sc,-1.3,1.3);g.arc(-r*.5*sc,0,r*.9*sc,1.1,-1.1,true);g.fill();if(aa>.9){g.fillStyle='rgba(255,255,255,.95)';g.beginPath();g.arc(0,0,r,-1,1);g.arc(-r*.2,0,r*.88,.9,-.9,true);g.fill()}g.restore()};
   if(b.tr)[5,3,1].forEach((i,j)=>{const q=b.tr[i];if(q)cres(X(q.x),Y(q.y),.18+j*.12,.92)});g.globalCompositeOperation='lighter';g.globalAlpha=al*.5;g.drawImage(glowC(b.w.evo?'190,160,255':'150,200,255'),x-r*1.6,y-r*1.6,r*3.2,r*3.2);g.globalAlpha=1;g.globalCompositeOperation='source-over';cres(x,y,1,1);g.globalAlpha=1}
  else if(b.ty==='bolt'){g.globalCompositeOperation='lighter';const c=b.w.evo?'255,170,90':'190,130,255';if(b.tr)b.tr.forEach((q,i)=>{const s2=9-i;g.globalAlpha=.5-i*.06;g.drawImage(glowC(c),X(q.x)-s2,Y(q.y)-s2,s2*2,s2*2)});g.globalAlpha=1;const pu=12+Math.sin(T*30)*2;g.drawImage(glowC(c),x-pu,y-pu,pu*2,pu*2);g.globalCompositeOperation='source-over';g.fillStyle='#fff';g.fillRect(x-1,y-1,3,3)}
  else if(b.ty==='dumb'){const dd=(rot,xx,yy,al2)=>{g.save();g.globalAlpha=al2;g.translate(xx,yy);g.rotate(rot);const s2=b.r/10;g.scale(s2,s2);g.fillStyle=b.w.evo?'#f0d070':'#8a9098';g.fillRect(-9,-1,18,3);g.fillStyle=b.w.evo?'#b88a20':'#30343c';g.fillRect(-13,-6,6,13);g.fillRect(7,-6,6,13);g.fillStyle='rgba(255,255,255,.4)';g.fillRect(-13,-6,6,2);g.fillRect(7,-6,6,2);g.restore()};if(b.tr){const q=b.tr[2],q2=b.tr[5];if(q2)dd(q2.r,X(q2.x),Y(q2.y),.15);if(q)dd(q.r,X(q.x),Y(q.y),.3)}dd(b.rot,x,y,1);g.globalAlpha=1}
  else if(b.ty==='bomb'){g.save();g.translate(x,y);g.rotate(b.rot||0);g.fillStyle='#22242c';g.beginPath();g.arc(0,0,5,0,TAU);g.fill();g.fillStyle='#4a4e5a';g.fillRect(-3,-3,2,2);g.fillStyle='#8a6a40';g.fillRect(-1,-8,2,3);g.restore();g.globalCompositeOperation='lighter';g.drawImage(glowC('255,200,120'),x-6,y-14,12,12);g.globalCompositeOperation='source-over'}
  else if(b.ty==='spike'){const a=Math.atan2(b.vy,b.vx);g.save();g.translate(x,y);g.rotate(a);g.fillStyle=b.w.evo?'#e0f0a0':'#b8c8a0';g.beginPath();g.moveTo(7,0);g.lineTo(-5,-2);g.lineTo(-5,2);g.fill();g.fillStyle='rgba(200,230,160,.3)';g.fillRect(-13,-1,8,2);g.restore()}
  else if(b.ty==='needle'){const a=Math.atan2(b.vy,b.vx);g.save();g.translate(x,y);g.rotate(a);g.strokeStyle=b.w.evo?'rgba(255,220,140,.5)':'rgba(120,150,230,.45)';g.lineWidth=2;g.beginPath();g.moveTo(-18,0);g.lineTo(0,0);g.stroke();g.fillStyle='#1c2440';g.fillRect(-4,-1,8,2);g.fillStyle='#e8ecf4';g.fillRect(3,-1,4,2);g.restore()}
  else if(b.ty==='marble'){if(b.tr)b.tr.forEach((q,i)=>{g.fillStyle=`rgba(${b.c},${.3-i*.04})`;g.beginPath();g.arc(X(q.x),Y(q.y),b.r*(1-i*.1),0,TAU);g.fill()});g.globalCompositeOperation='lighter';g.drawImage(glowC(b.c),x-b.r*2,y-b.r*2,b.r*4,b.r*4);g.globalCompositeOperation='source-over';g.fillStyle=`rgba(${b.c},.9)`;g.beginPath();g.arc(x,y,b.r,0,TAU);g.fill();g.fillStyle='rgba(255,255,255,.85)';g.fillRect(x-b.r*.5,y-b.r*.5,2,2)}
  else if(b.ty==='oni'){g.save();g.translate(x,y);g.rotate(b.rot);const s2=b.r/11;g.scale(s2,s2);g.fillStyle=b.w.evo?'#e8c060':'#c83838';g.beginPath();g.arc(0,0,10,0,TAU);g.fill();g.fillStyle=b.w.evo?'#8a6a10':'#6a1414';g.fillRect(-5,-2,3,3);g.fillRect(2,-2,3,3);g.fillRect(-4,4,8,2);g.fillStyle='#f0e0c0';g.beginPath();g.moveTo(-7,-7);g.lineTo(-4,-14);g.lineTo(-2,-8);g.fill();g.beginPath();g.moveTo(7,-7);g.lineTo(4,-14);g.lineTo(2,-8);g.fill();g.restore();if(b.tr){const q=b.tr[3];if(q){g.globalAlpha=.25;g.fillStyle='#c83838';g.beginPath();g.arc(X(q.x),Y(q.y),b.r*.9,0,TAU);g.fill();g.globalAlpha=1}}}
  else if(b.ty==='petal'){g.save();g.translate(x,y);g.rotate(b.rot+T*6);g.fillStyle=b.w.evo?'rgba(255,230,140,.95)':'rgba(255,180,210,.95)';g.beginPath();g.ellipse(0,0,5,3,0,0,TAU);g.fill();g.fillStyle='rgba(255,255,255,.6)';g.fillRect(-1,-1,2,1);g.restore()}
  else if(b.ty==='shard'){const a=Math.atan2(b.vy,b.vx);g.globalCompositeOperation='lighter';g.drawImage(glowC('170,220,255'),x-9,y-9,18,18);g.globalCompositeOperation='source-over';g.save();g.translate(x,y);g.rotate(a);g.fillStyle='#e8f6ff';g.beginPath();g.moveTo(7,0);g.lineTo(0,-3);g.lineTo(-6,0);g.lineTo(0,3);g.fill();g.fillStyle='#8ac8f0';g.fillRect(-4,0,8,1);g.restore()}
  else if(b.ty==='bottle'){g.save();g.translate(x,y);g.rotate(T*12);g.fillStyle='#8a3a2a';g.fillRect(-3,-4,6,8);g.fillStyle='#c86040';g.fillRect(-3,-4,2,8);g.fillStyle='#e0a050';g.fillRect(-1,-7,3,3);g.restore();g.globalCompositeOperation='lighter';g.drawImage(glowC('255,160,70'),x-6,y-12,12,12);g.globalCompositeOperation='source-over'}}
 // 回るクラゲ
 for(const p of PLS)for(const w of p.ws)if(w.k==='jelly'&&w.act&&!p.dead&&p.s){P=p;const s=ws(w),rr=58*s.area;for(let i=0;i<s.amt;i++)for(let j=1;j<4;j++){const a=w.ang-j*.18+i/s.amt*TAU,x=X(p.x+Math.cos(a)*rr),y=Y(p.y-10+Math.sin(a)*rr);g.globalCompositeOperation='lighter';g.globalAlpha=.3-j*.08;g.drawImage(glowC(w.evo?'190,170,255':'255,150,200'),x-8,y-8,16,16);g.globalAlpha=1;g.globalCompositeOperation='source-over'}for(let i=0;i<s.amt;i++){const a=w.ang+i/s.amt*TAU,x=X(p.x+Math.cos(a)*rr),y=Y(p.y-10+Math.sin(a)*rr),r=9*s.area;const gr=g.createRadialGradient(x,y,0,x,y,r*1.8);gr.addColorStop(0,w.evo?'rgba(190,170,255,.5)':'rgba(255,150,200,.45)');gr.addColorStop(1,'rgba(255,150,200,0)');g.fillStyle=gr;g.fillRect(x-r*2,y-r*2,r*4,r*4);
  g.fillStyle=w.evo?'rgba(200,190,255,.85)':'rgba(255,170,210,.85)';g.beginPath();g.arc(x,y-2,r*.7,Math.PI,0);g.fill();g.fillRect(x-r*.7,y-2,r*1.4,2);g.fillStyle='rgba(255,210,230,.7)';for(let j=-1;j<=1;j++)g.fillRect(x+j*r*.4-.5,y,1,4+Math.sin(T*8+j+i)*2)}}
 P=LP();
 // 迷い火
 for(const p of PLS)for(const w of p.ws)if(w.k==='lwisp'&&w.wsp&&!p.dead)for(const q of w.wsp){const x=X(q.x),y=Y(q.y),c=w.evo?'200,160,255':'120,230,220',f2=Math.sin(T*14+q.x)*1.5;g.globalCompositeOperation='lighter';g.drawImage(glowC(c),x-14,y-14,28,28);g.globalCompositeOperation='source-over';g.fillStyle=`rgba(${c},.9)`;g.beginPath();g.moveTo(x-4,y+3);g.quadraticCurveTo(x-5,y-4,x+f2*.5,y-9-f2);g.quadraticCurveTo(x+5,y-4,x+4,y+3);g.fill();g.fillStyle='#fff';g.fillRect(x-1,y-1,2,2)}
 // 演出
 for(const f of FX){const x=X(f.x),y=Y(f.y),k=f.t/f.t0;
  if(f.ty==='slash'){const pr=1-k,w=f.w,h=f.h;g.save();g.translate(x,y);g.scale(f.s,1);
   const arc=(sc,col,al,th)=>{g.globalAlpha=al*Math.min(1,k*2.2);g.fillStyle=col;g.beginPath();g.ellipse(0,0,w/2*sc,h/2*sc,0,Math.PI*(1.05-pr*.2),Math.PI*(1.05-pr*.2)+Math.PI*(.4+pr*.75));g.ellipse(0,h*th,w/2*sc*.94,h/2*sc*(1-th*2.2),0,Math.PI*(1.05-pr*.2)+Math.PI*(.4+pr*.75),Math.PI*(1.05-pr*.2),true);g.fill()};
   g.globalCompositeOperation='lighter';arc(1.12,f.ev?'rgba(255,140,70,.5)':'rgba(255,220,160,.35)',.9,.12);g.globalCompositeOperation='source-over';arc(1,f.ev?'rgba(255,200,140,.85)':'rgba(255,244,220,.8)',1,.18);arc(.97,'#ffffff',1,.3);g.restore();g.globalAlpha=1}
  else if(f.ty==='spear'){const hit=f.t<=f.t0*.35,r=f.r,c=f.ev?'255,210,120':'235,240,255';if(!hit){const q=1-k;g.strokeStyle=`rgba(${c},${.3+.4*q})`;g.lineWidth=1;g.beginPath();g.ellipse(x,y,r,r*.55,0,0,TAU);g.stroke();for(let i=0;i<6;i++){const an=i/6*TAU+T*3;g.fillStyle=`rgba(${c},${.6*q})`;g.fillRect(x+Math.cos(an)*r|0,y+Math.sin(an)*r*.55|0,2,2)}
    const yy=y-LH*(1-Math.min(1,q/.65));g.globalCompositeOperation='lighter';g.globalAlpha=.7;g.drawImage(glowC(c),x-10,yy-90,20,90);g.globalAlpha=1;g.globalCompositeOperation='source-over';g.fillStyle=`rgba(${c},.95)`;g.fillRect(x-1,yy-70,3,70);g.fillStyle='#fff';g.fillRect(x,yy-70,1,70);g.beginPath();g.moveTo(x-5,yy-6);g.lineTo(x+5,yy-6);g.lineTo(x,yy+4);g.fill()}
   else{const a=f.t/(f.t0*.35);g.globalCompositeOperation='lighter';g.globalAlpha=a;g.drawImage(glowC(c),x-r*1.6,y-r*1.6-10,r*3.2,r*3.2);g.drawImage(glowC(c),x-8,y-110,16,110);g.globalAlpha=1;g.globalCompositeOperation='source-over';g.fillStyle=`rgba(255,255,255,${a})`;g.fillRect(x-1,y-90,3,90)}}
  else if(f.ty==='zap'){g.strokeStyle=`rgba(${f.c},${k})`;g.lineWidth=2;g.beginPath();f.pts.forEach((q,i)=>{if(!i){g.moveTo(X(q[0]),Y(q[1]));return}const pq=f.pts[i-1];for(let j=1;j<=4;j++){const tt=j/4;g.lineTo(X(pq[0]+(q[0]-pq[0])*tt)+(j<4?(R()-.5)*8:0),Y(pq[1]+(q[1]-pq[1])*tt)+(j<4?(R()-.5)*8:0))}});g.stroke();g.strokeStyle=`rgba(255,255,255,${k})`;g.lineWidth=1;g.stroke();g.globalCompositeOperation='lighter';for(const q of f.pts){g.globalAlpha=k;g.drawImage(glowC(f.c),X(q[0])-10,Y(q[1])-10,20,20)}g.globalAlpha=1;g.globalCompositeOperation='source-over'}
  else if(f.ty==='boom'){const q=1-k;g.globalCompositeOperation='lighter';g.globalAlpha=k;g.drawImage(glowC('255,160,70'),x-f.r*1.4,y-f.r*1.2,f.r*2.8,f.r*2.4);g.globalAlpha=1;g.globalCompositeOperation='source-over';g.strokeStyle=`rgba(255,220,160,${k})`;g.lineWidth=3*k+.5;g.beginPath();g.ellipse(x,y,f.r*(.5+q*.6),f.r*.55*(.5+q*.6),0,0,TAU);g.stroke();g.fillStyle=`rgba(255,240,200,${k*k})`;g.beginPath();g.arc(x,y-4,f.r*.35*(1-q*.5),0,TAU);g.fill()}
  else if(f.ty==='bellw'){g.strokeStyle=`rgba(255,230,160,${k*.8})`;g.lineWidth=3*k+1;g.beginPath();g.ellipse(x,y,f.r,f.r*.62,0,0,TAU);g.stroke();g.strokeStyle=`rgba(255,250,220,${k*.5})`;g.lineWidth=1;g.beginPath();g.ellipse(x,y,f.r*.9,f.r*.56,0,0,TAU);g.stroke()}
  else if(f.ty==='beam'){g.save();g.translate(x,y);g.rotate(f.a);const w2=f.wd*(.4+.6*k);g.globalCompositeOperation='lighter';g.globalAlpha=k;g.drawImage(glowC(f.ev?'255,200,120':'255,250,220'),0,-w2*2.2,f.L,w2*4.4);g.globalAlpha=1;g.globalCompositeOperation='source-over';g.fillStyle=`rgba(255,255,245,${k})`;g.fillRect(0,-w2*.45,f.L,w2*.9);g.restore()}
  else if(f.ty==='wave'){g.strokeStyle=`rgba(${f.c},${k*.8})`;g.lineWidth=2*k+.5;g.beginPath();g.ellipse(x,y,f.r*(1-k*.7),f.r*.55*(1-k*.7),0,0,TAU);g.stroke()}
  else if(f.ty==='lvup'){const q=1-k;g.strokeStyle=`rgba(255,220,140,${k})`;g.lineWidth=2;g.beginPath();g.ellipse(x,y-4,10+q*60,(10+q*60)*.55,0,0,TAU);g.stroke();g.globalCompositeOperation='lighter';g.globalAlpha=k;g.drawImage(glowC('255,220,140'),x-30,y-70,60,70);g.globalAlpha=1;g.globalCompositeOperation='source-over'}
  else if(f.ty==='die'){const r=(1-k)*16;g.fillStyle=`rgba(255,240,220,${k*.7})`;for(let i=0;i<6;i++){const an=i/6*TAU;g.fillRect(x+Math.cos(an)*r|0,y-10+Math.sin(an)*r*.6|0,2,2)}}
  else if(f.ty==='puff'){g.fillStyle=`rgba(255,200,120,${k*.6})`;g.beginPath();g.arc(x,y-10,(1-k)*14+4,0,TAU);g.fill()}}
 g.globalCompositeOperation='lighter';for(const s2 of TB){g.drawImage(glowC('150,200,255'),X(s2.x)-8,Y(s2.y)-8,16,16)}g.globalCompositeOperation='source-over';for(const s2 of TB){g.fillStyle='#e8f4ff';g.fillRect(X(s2.x)-1,Y(s2.y)-1,3,3)}
 for(const f of FX)if(f.ty==='chest2'){const k=1-f.t/f.t0,x=X(f.x),y=Y(f.y);g.globalCompositeOperation='lighter';g.globalAlpha=Math.min(1,f.t*1.5);const bw=30*(1-k*.5);const gr=g.createLinearGradient(0,y-200,0,y);gr.addColorStop(0,'rgba(255,220,140,0)');gr.addColorStop(1,'rgba(255,230,160,.6)');g.fillStyle=gr;g.fillRect(x-bw/2,y-200,bw,200);g.drawImage(glowC('255,220,140'),x-50,y-60,100,80);g.globalAlpha=1;g.globalCompositeOperation='source-over';g.save();g.globalAlpha=Math.min(1,f.t*2);drawChestG(x,y,f.big?2:1.6,cl(k*4,0,1),f.big,0);g.restore();g.globalAlpha=1}
 drawEB(X,Y);drawPT(X,Y);
 // ダメージの数字
 g.textAlign='center';for(const d of DN){g.font=(d.big?12:8)+'px '+FP;g.globalAlpha=Math.min(1,d.t*3);g.fillStyle='rgba(0,0,0,.6)';g.fillText(d.v,X(d.x)+1,Y(d.y)+1);g.fillStyle=d.c||'#fff';g.fillText(d.v,X(d.x),Y(d.y))}g.globalAlpha=1;
 drawHeal(X,Y);
 // 長押しで本塔へ：足元の輪が満ちていく
 if(HOLD&&HOLD.t>.6&&LP()&&!LP().dead){const q=LP(),k=Math.min(1,(HOLD.t-.6)/(HOLDT-.6)),hx=X(q.x),hy=Y(q.y)-18;g.strokeStyle='rgba(0,0,0,.45)';g.lineWidth=4;g.beginPath();g.arc(hx,hy,26,0,TAU);g.stroke();g.strokeStyle='rgba(150,210,255,.95)';g.lineWidth=3;g.beginPath();g.arc(hx,hy,26,-Math.PI/2,-Math.PI/2+k*TAU);g.stroke();g.font='9px '+FT;g.textAlign='center';g.fillStyle='rgba(0,0,0,.6)';g.fillText('本塔へ戻る',hx+1,hy-33);g.fillStyle='#cfe6ff';g.fillText('本塔へ戻る',hx,hy-34)}
 // 暗さ（場所の雰囲気）
 if(TM.dark){if(!VIG){VIG=MKC(LW,LH);const x=VIG.getContext('2d'),gr=x.createRadialGradient(LW/2,LH/2,LH*.25,LW/2,LH/2,hyp(LW,LH)*.55);gr.addColorStop(0,'rgba(0,0,10,0)');gr.addColorStop(1,`rgba(0,0,10,${TM.dark})`);x.fillStyle=gr;x.fillRect(0,0,LW,LH)}g.drawImage(VIG,0,0)}
 // 画面の外の主・強い敵：赤い矢印と名前
 for(const e of EN){if(e.dead||!e.tier||e.tier===3&&0)continue;const sx=X(e.x),sy=Y(e.y)-e.sp.h*.4;if(sx>-10&&sx<LW+10&&sy>-10&&sy<LH+10)continue;const cx=LW/2,cy=LH/2,dx=sx-cx,dy=sy-cy,m=34,f=Math.min((LW/2-m)/Math.abs(dx||1e-6),(LH/2-m)/Math.abs(dy||1e-6)),ax=cx+dx*f,ay=cy+dy*f,a=Math.atan2(dy,dx),pu=1+Math.sin(T*8)*.15,c=e.tier===2?'255,60,50':e.tier===3?'200,120,255':'255,150,60';
  g.globalCompositeOperation='lighter';g.globalAlpha=.7;g.drawImage(glowC(c),ax-28,ay-28,56,56);g.globalAlpha=1;g.globalCompositeOperation='source-over';g.save();g.translate(ax,ay);g.rotate(a);g.scale(pu,pu);g.fillStyle=`rgb(${c})`;g.beginPath();g.moveTo(20,0);g.lineTo(4,-12);g.lineTo(8,0);g.lineTo(4,12);g.fill();g.restore();
  const s=e.sp;if(s.ok){const k2=Math.min(30/s.w,30/s.h);g.save();g.beginPath();g.arc(ax-Math.cos(a)*12,ay-Math.sin(a)*12,16,0,TAU);g.fillStyle='rgba(10,6,8,.85)';g.fill();g.clip();g.drawImage(e.x<p.x?s.f:s.n,ax-Math.cos(a)*12-s.w*k2/2,ay-Math.sin(a)*12-s.h*k2/2,s.w*k2,s.h*k2);g.restore();g.strokeStyle=`rgb(${c})`;g.lineWidth=1.5;g.beginPath();g.arc(ax-Math.cos(a)*12,ay-Math.sin(a)*12,16,0,TAU);g.stroke()}}
 // 画面の外の宝箱：画面の端に矢印
 for(const k of PK){if(k.ty!=='chest')continue;const sx=X(k.x),sy=Y(k.y)-10;if(sx>-6&&sx<LW+6&&sy>-6&&sy<LH+6)continue;const cx=LW/2,cy=LH/2,dx=sx-cx,dy=sy-cy,m=30,f=Math.min((LW/2-m)/Math.abs(dx||1e-6),(LH/2-m)/Math.abs(dy||1e-6)),ax=cx+dx*f,ay=cy+dy*f,a=Math.atan2(dy,dx),pu=1+Math.sin(T*6)*.12,d=Math.round(hyp(k.x-p.x,k.y-p.y)/10);
  g.globalCompositeOperation='lighter';g.globalAlpha=.6;g.drawImage(glowC(k.big?'255,120,90':'255,200,100'),ax-22,ay-22,44,44);g.globalAlpha=1;g.globalCompositeOperation='source-over';g.save();g.translate(ax,ay);g.rotate(a);g.scale(pu,pu);g.fillStyle=k.big?'#ff8a60':'#ffd060';g.beginPath();g.moveTo(16,0);g.lineTo(4,-9);g.lineTo(4,9);g.fill();g.restore();
  const s2=1.4;g.save();g.translate(ax-Math.cos(a)*8,ay-Math.sin(a)*8+4);g.scale(s2,s2);g.fillStyle=k.big?'#7a2024':'#6a4420';g.fillRect(-5,-5,10,6);g.fillStyle=k.big?'#9a2c30':'#80542a';g.fillRect(-5,-8,10,3);g.fillStyle='#e8c060';g.fillRect(-5,-5,10,1);g.fillRect(-1,-5,2,2);g.restore();g.font='8px '+FP;g.textAlign='center';g.fillStyle='rgba(0,0,0,.6)';g.fillText(d+'m',ax-Math.cos(a)*8+1,ay-Math.sin(a)*8+17);g.fillStyle='#ffe0a0';g.fillText(d+'m',ax-Math.cos(a)*8,ay-Math.sin(a)*8+16)}
 // 被弾の赤い縁・HPが少ない時の脈打つ赤・倒れた時の暗さ
 {const low=!p.dead&&p.hp/p.s.mhp<.3?(.25+.15*Math.sin(T*6)):0,a=Math.max(HURT*.75,low);if(a>0){const gr=g.createRadialGradient(LW/2,LH/2,LH*.3,LW/2,LH/2,hyp(LW,LH)*.55);gr.addColorStop(0,'rgba(200,0,0,0)');gr.addColorStop(1,`rgba(200,10,10,${a})`);g.fillStyle=gr;g.fillRect(0,0,LW,LH)}
  if(p.dead){const q=Math.min(1,(p.dT||0)/2);g.fillStyle=`rgba(0,0,0,${q*.6})`;g.fillRect(0,0,LW,LH);const gr=g.createRadialGradient(X(p.x),Y(p.y)-20,20,X(p.x),Y(p.y)-20,hyp(LW,LH)*(.7-q*.45));gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,`rgba(0,0,0,${q})`);g.fillStyle=gr;g.fillRect(0,0,LW,LH)}}
 // 自分のHP
 if(p.s.barr&&(p.bar||0)<=0){g.strokeStyle=`rgba(200,230,255,${.35+.15*Math.sin(T*4)})`;g.lineWidth=1;g.beginPath();g.ellipse(X(p.x),Y(p.y)-18,18,24,0,0,TAU);g.stroke()}
 for(const p of PLS){if(!p.s)continue;const px=X(p.x),py=Y(p.y);if(!p.dead){g.fillStyle='rgba(0,0,0,.6)';g.fillRect(px-16,py+5,32,4);g.fillStyle='#fff';g.fillRect(px-16,py+5,32*Math.max(0,(p.hpLag||p.hp))/p.s.mhp,4);g.fillStyle=p.hp/p.s.mhp<.3&&(T*4|0)%2?'#ff7070':'#d83848';g.fillRect(px-16,py+5,32*Math.max(0,p.hp)/p.s.mhp,4)}}}
function drawHUD(){const p=P;
 // 経験
 
 // 波と本塔
 if(WV){const nb=Math.floor(WV.n/5)*5+5,bt=WV.n===0?0:WV.t+(nb-WV.n-1)*60,wl=WV.n===0?'敵が来るまで '+Math.ceil(WV.t)+'秒':mm(WV.n>=NWAVE?(NWAVE-1)*60+WV.st:Math.max(0,(WV.n-1)*60+60-WV.t)),nx=WV.n===0?'':WV.n>=NWAVE?'　最後の主':'　主まで '+mm(bt);g.font='12px '+FT;const ww=g.measureText(wl+nx).width+20;box(UW/2-ww/2,9,ww,17,'rgba(6,8,14,.6)');tx(wl+nx,UW/2,22,'#f0e6d8','center',12);const m=TW[0];if(m){const w=Math.min(260,UW*.34),x=UW/2-w/2;g.fillStyle='rgba(6,10,20,.75)';g.fillRect(x-3,27,w+6,11);g.fillStyle='#14203a';g.fillRect(x,29,w,7);g.fillStyle=m.hp/m.mhp<.3&&(T*4|0)%2?'#ff6050':'#4a90f0';g.fillRect(x,29,w*m.hp/m.mhp,7);g.fillStyle='rgba(255,255,255,.3)';g.fillRect(x,29,w*m.hp/m.mhp,1);tx('本塔',x-6,36,'#a8c8ff','right',9);if(m.fl>0){g.fillStyle='rgba(255,80,60,.4)';g.fillRect(x,29,w,7)}}}
 {const gx=UW-MMW()-16,gs=String(Math.floor(p.gold||0));g.font='12px '+FP;const gw2=g.measureText(gs).width;g.drawImage(COIN,gx-gw2-16,10,11,11);tx(gs,gx,20,'#ffd860','right',12,FP)}
 if(p.dead&&p.rsp!=null&&!DEATH){tx('本塔で復活まで '+Math.ceil(p.rsp)+' 秒',UW/2,UH*.4,'#ffb0a0','center',14)}
 TOAST.slice(-3).forEach((t2,i)=>{const a=Math.min(1,t2.t*2);g.globalAlpha=a;g.font='11px '+FT;const w=g.measureText(t2.s).width+20;box(UW/2-w/2,UH-74-i*22,w,18,'rgba(40,30,10,.85)');tx(t2.s,UW/2,UH-61-i*22,'#ffe0a0','center',11);g.globalAlpha=1});

 {const bs=EN.filter(e=>!e.dead&&e.tier===2).slice(0,2);bs.forEach((e,i)=>{const w=Math.min(300,UW*.4),x=UW/2-w/2,y=44+i*24;g.fillStyle='rgba(10,4,6,.75)';g.fillRect(x-4,y-2,w+8,20);tx(e.d.n,x,y+8,'#ffb0a0','left',10);g.fillStyle='#2a0c10';g.fillRect(x,y+11,w,5);g.fillStyle='#d02838';g.fillRect(x,y+11,w*Math.max(0,e.hp/e.mhp),5);g.fillStyle='rgba(255,255,255,.25)';g.fillRect(x,y+11,w*Math.max(0,e.hp/e.mhp),1)})}
 // 武器・持ち物
 const SZ=TOUCH?30:28,GP=SZ+3;
 const slot=(x,y,ic,glow,lv,mx,col,f,sel)=>{box(x,y,SZ,SZ,sel?'rgba(70,56,30,.9)':'rgba(10,12,20,.72)');g.fillStyle=`rgba(${col},.45)`;g.fillRect(x,y,SZ,1);icon(ic,x+3,y+2,SZ-6,glow);const pw=(SZ-4)/mx;for(let j=0;j<mx;j++){g.fillStyle=j<lv?`rgba(${col},1)`:'rgba(255,255,255,.12)';g.fillRect(x+2+j*pw|0,y+SZ-3,Math.max(1,pw-1|0),2)}btn(x,y,SZ,SZ,f)};
 {const cp=CPV[p.ci==null?CHI:p.ci],x=4,y=13;box(x,y,SZ,SZ*2+3,'rgba(40,30,14,.8)');g.fillStyle='rgba(255,200,90,.7)';g.fillRect(x,y,SZ,1);icon(cp.ic,x+3,y+SZ/2+2,SZ-6,1);btn(x,y,SZ,SZ*2+3,()=>openInf('c',0))}
 p.ws.forEach((w,i)=>slot(4+(i+1)*GP,13,w.evo?W[w.k].evo.ic:W[w.k].ic,w.evo,w.evo?8:w.lv,8,w.evo?'255,210,110':'255,200,80',()=>openInf('w',w.k),INF&&INF.k===w.k));
 Object.keys(p.pas).forEach((k,i)=>slot(4+(i+1)*GP,13+GP,PS[k].ic,0,p.pas[k],PS[k].m,'130,190,255',()=>openInf('p',k),INF&&INF.k===k));
 tx('撃破 '+KILLS,8,UH-10,'#a8a0b0','left',10);if(MPON)PLS.forEach((q,i)=>{if(i===LPI)return;const y=86+i*14;tx(q.nm+(q.dead&&q.rsp!=null?' '+Math.ceil(q.rsp):''),8,y+4,PCOL[i],'left',9);g.fillStyle='rgba(0,0,0,.5)';g.fillRect(40,y-1,60,5);g.fillStyle=q.dead?'#555':'#d83848';g.fillRect(40,y-1,60*Math.max(0,q.hp)/((q.s&&q.s.mhp)||100),5)});
 // 一時停止
 {const bx=UW-MMW()-46;box(bx,42,30,20,'rgba(10,12,20,.6)');tx('II',bx+15,56,'#c8d0e0','center',9,FP);btn(bx-6,38,42,30,()=>{if(MODE==='play'&&!INF)PAUSE=!PAUSE})}
 if(MODE==='play'&&!PAUSE){drawMini();drawShopUI()}
 if(BANNER){const a=Math.min(1,BANNER.t*2);g.globalAlpha=a;tx(BANNER.s,UW/2,UH*.3,'#f0e6c8','center',20);if(BANNER.sub)tx(BANNER.sub,UW/2,UH*.3+18,'#b8b0a8','center',11);g.globalAlpha=1}
 if(JOY.on&&MODE==='play'){g.strokeStyle='rgba(255,255,255,.25)';g.lineWidth=1.5;g.beginPath();g.arc(JOY.ox/US,JOY.oy/US,34/US,0,TAU);g.stroke();g.fillStyle='rgba(240,230,200,.4)';g.beginPath();g.arc(JOY.x/US,JOY.y/US,13/US,0,TAU);g.fill()}}
function panel(w,h){const x=(UW-w)/2|0,y=(UH-h)/2|0;g.fillStyle='rgba(0,0,0,.45)';g.fillRect(0,0,UW,UH);box(x,y,w,h,'rgba(16,18,28,.95)');g.fillStyle='rgba(216,184,96,.5)';g.fillRect(x,y,w,1);g.fillRect(x,y+h-1,w,1);return[x,y]}
function drawPause(){if(EVL)return drawEvl();const p=P,w=Math.min(UW-20,360),h=310;const[x,y]=panel(w,h);tx('一時停止',UW/2,y+24,'#f0e6c8','center',15);
 p.ws.forEach((wp,i)=>{const yy=y+40+i*20;icon(wp.evo?W[wp.k].evo.ic:W[wp.k].ic,x+12,yy,16,wp.evo);tx((wp.evo?W[wp.k].evo.n:W[wp.k].n)+'  Lv'+wp.lv,x+32,yy+12,'#e8e0d0','left',10);btn(x+8,yy-1,w/2-12,19,()=>openInf('w',wp.k))});
 Object.keys(p.pas).forEach((k,i)=>{const yy=y+40+i*20;icon(PS[k].ic,x+w/2+6,yy,16);tx(PS[k].n+'  Lv'+p.pas[k],x+w/2+26,yy+12,'#e8e0d0','left',10);btn(x+w/2+2,yy-1,w/2-10,19,()=>openInf('p',k))});
 {const cp=CPV[p.ci==null?CHI:p.ci];icon(cp.ic,x+12,y+156,16,1);tx('固有の力：'+cp.n,x+32,y+168,'#ffe0a0','left',10);btn(x+8,y+154,w-16,18,()=>openInf('c',0))}const s=p.s;tx(`力 ${Math.round(s.might*100)}%　鎧 ${s.armor}　最大HP ${s.mhp}　回復 ${s.regen.toFixed(1)}　待ち時間 ${Math.round(s.cd*100)}%`,UW/2,y+180,'#a8b0c0','center',9);tx(`範囲 ${Math.round(s.area*100)}%　持続 ${Math.round(s.dur*100)}%　移動 ${Math.round(s.move*100)}%　磁力 ${Math.round(s.magnet*100)}%　幸運 ${Math.round(s.luck*100)}%`,UW/2,y+194,'#a8b0c0','center',9);
 const b=(lab,yy,f,c)=>{box(UW/2-70,yy,140,24,c||'rgba(50,56,80,.95)');tx(lab,UW/2,yy+16,'#fff','center',11);btn(UW/2-70,yy,140,24,f)};b('進化の一覧',y+208,()=>{EVL=1;snd('cl')},'rgba(80,64,30,.95)');{const bx2=UW/2+76;box(bx2,y+238,60,24,'rgba(50,56,80,.95)');tx('音量',bx2+30,y+254,'#fff','center',11);btn(bx2,y+238,60,24,()=>{VOLP=1;snd('cl')})}b('再開',y+238,()=>{PAUSE=0});if(MPON)b('部屋を抜ける',y+270,()=>{PAUSE=0;mpLeave()},'rgba(90,40,40,.95)');else b('諦める',y+270,()=>{PAUSE=0;P.dead=1;endRun()},'rgba(90,40,40,.95)')}
// 進化の組み合わせ一覧（一時停止から）：武器 Lv8 ＋ 持ち物 → 宝箱で進化。持っている物は明るく、そろった物は金色
function drawResult(){if(!RESULT)return;const r=RESULT,w=Math.min(UW-20,380),h=290;const[x,y]=panel(w,h);const ok=r.won;tx(ok?'守り抜いた':'本塔が崩れた',UW/2,y+30,ok?'#ffd860':'#e05a5a','center',18);
 tx(`${TM.n}　${A.ch[CHS[CHI].k].n}`,UW/2,y+50,'#b8b0a8','center',10);tx(`${mm(r.time)}　撃破 ${r.kills}`,UW/2,y+70,'#f0e6c8','center',12);
 tx('武器',x+20,y+94,'#8890a0','left',9);tx('与えたダメージ',x+w-20,y+94,'#8890a0','right',9);r.ws.forEach((wp,i)=>{const yy=y+100+i*22;icon(wp.evo?W[wp.k].evo.ic:W[wp.k].ic,x+18,yy,18,wp.evo);tx((wp.evo?W[wp.k].evo.n:W[wp.k].n)+'  Lv'+wp.lv,x+42,yy+13,'#e8e0d0','left',10);tx(String(Math.round(wp.dm)),x+w-20,yy+13,'#e8e0d0','right',10)});
 box(UW/2-70,y+h-36,140,26,'rgba(50,56,80,.95)');tx(MPS.code?'部屋に戻る':'戻る',UW/2,y+h-18,'#fff','center',12);btn(UW/2-70,y+h-36,140,26,()=>{if(MPS.code&&NET.kind){MPON=0;NETC=0;MPS.started=0;PLS=[];MODE='lobby';music('t');if(MPS.host)lobSend()}else{MODE='title';music('t')}})}
function bgScene(){g.fillStyle='#0a0c14';g.fillRect(0,0,UW,UH);if(TILE){g.globalAlpha=.35;for(let x=0;x<UW;x+=TILE.width)for(let y=0;y<UH;y+=TILE.height)g.drawImage(TILE,x,y);g.globalAlpha=1}}
/* ===== タイトル画面：真上から見た円形の闘技場。群れが渦を巻いて中心へ迫る（キャラは置かない） ===== */
const TS={t0:0,sel:0,sw:[],arena:null,shk:0};
// 闘技場の床（半分の大きさで描いて2倍＝ドット）
function arenaCanvas(){if(TS.arena)return TS.arena;const N=360,c=MKC(N,N),x=c.getContext('2d'),C=N/2;x.fillStyle='#120a09';x.fillRect(0,0,N,N);
 const ring=(r0,r1,n,cols,gap)=>{for(let i=0;i<n;i++){const a0=i/n*TAU+(r0%2)*.1,a1=(i+1)/n*TAU-gap/r1+(r0%2)*.1;x.fillStyle=pk(cols);x.beginPath();x.arc(C,C,r1,a0,a1);x.arc(C,C,r0,a1,a0,true);x.fill()}};
 const st=['#3a2620','#41291f','#34221c','#472d22','#3d2a24'];
 for(let r=22;r<150;r+=13)ring(r,r+11,Math.round(r*.45),st,1.4);
 ring(150,166,64,['#2a1814','#301c16'],.8);ring(166,180,80,['#5a3a2a','#4e3226','#644230'],.6);
 // 砂・血の染み・ひび
 for(let i=0;i<900;i++){const a=R()*TAU,d=R()*150;x.fillStyle=pk(['rgba(120,80,50,.25)','rgba(20,8,6,.35)','rgba(150,100,60,.18)']);x.fillRect(C+Math.cos(a)*d|0,C+Math.sin(a)*d|0,1,1)}
 for(let i=0;i<7;i++){const a=R()*TAU,d=30+R()*110,cx=C+Math.cos(a)*d,cy=C+Math.sin(a)*d;x.fillStyle='rgba(90,14,16,.35)';for(let j=0;j<40;j++)x.fillRect(cx+(R()-.5)*14|0,cy+(R()-.5)*10|0,1,1)}
 x.strokeStyle='rgba(10,4,3,.6)';x.lineWidth=1;for(let i=0;i<10;i++){let px=C+(R()-.5)*240,py=C+(R()-.5)*240;x.beginPath();x.moveTo(px|0,py|0);for(let j=0;j<5;j++){px+=(R()-.5)*16;py+=(R()-.5)*16;x.lineTo(px|0,py|0)}x.stroke()}
 // 中央の印
 x.fillStyle='#24140f';x.beginPath();x.arc(C,C,20,0,TAU);x.fill();x.fillStyle='#5a3a2a';for(let i=0;i<8;i++){const a=i/8*TAU;x.fillRect(C+Math.cos(a)*14-1|0,C+Math.sin(a)*14-1|0,2,2)}
 const b=MKC(N*2,N*2),y=b.getContext('2d');y.imageSmoothingEnabled=false;y.drawImage(c,0,0,N*2,N*2);return TS.arena=b}
function titleEnter(){TS.t0=T;TS.sel=0;TS.sw=[];for(let i=0;i<340;i++)TS.sw.push(swP(R()))}
const swP=f=>({a:R()*TAU,r:180+f*260,s:.6+R()*.8,e:R()<.25,ph:R()*TAU});
function drawTitle(){const t=T-TS.t0,cx=UW/2,cy=UH*.56,sc=Math.max(UW,UH)/520;
 g.fillStyle='#070304';g.fillRect(0,0,UW,UH);
 // 床（ゆっくり回る）
 const ar=arenaCanvas();g.save();g.translate(cx,cy);g.rotate(T*.03);g.scale(sc*.75,sc*.75);g.globalAlpha=.62;g.drawImage(ar,-ar.width/2,-ar.height/2);g.globalAlpha=1;g.restore();
 // 中央の空いた場所：脈打つ光の輪
 const pr=(26+Math.sin(T*2.4)*2)*sc;const cg=g.createRadialGradient(cx,cy,0,cx,cy,pr*2.4);cg.addColorStop(0,'rgba(255,150,60,.28)');cg.addColorStop(1,'rgba(255,90,30,0)');g.fillStyle=cg;g.fillRect(0,0,UW,UH);
 g.strokeStyle=`rgba(255,190,110,${.45+.2*Math.sin(T*2.4)})`;g.lineWidth=1.5;g.beginPath();g.ellipse(cx,cy,pr,pr,0,0,TAU);g.stroke();
 // 群れ：渦を巻いて中心へ
 for(const p of TS.sw){p.a+=(.25+40/p.r)*p.s/60;p.r-=(6+p.s*8)/60;if(p.r<48)Object.assign(p,swP(1));const x=cx+Math.cos(p.a)*p.r*sc*.75,y=cy+Math.sin(p.a)*p.r*sc*.75;if(x<-8||y<-8||x>UW+8||y>UH+8)continue;
  const near=cl(1-(p.r-48)/200,0,1),z=p.s>1?1:0,b=Math.abs(Math.sin(T*8+p.ph))*1.5;g.fillStyle='rgba(0,0,0,.45)';g.fillRect(x-4|0,y+2|0,9+z*2,3);g.fillStyle='#060203';g.fillRect(x-3|0,y-5-b|0,7+z*2,6+z);g.fillRect(x-2|0,y-7-b|0,5+z*2,2);g.fillStyle='#24100e';g.fillRect(x-2|0,y-7-b|0,5+z*2,1);
  g.fillStyle=`rgba(255,${60+near*80|0},40,${.55+.45*Math.sin(T*6+p.ph)})`;g.fillRect(x-1|0,y-4-b|0,1,1);g.fillRect(x+2+z|0,y-4-b|0,1,1)}
 // 散らばる結晶
 for(let i=0;i<18;i++){const a=i*2.4+T*.03,d=(60+((i*53)%140))*sc*.75,x=cx+Math.cos(a)*d,y=cy+Math.sin(a)*d;const gi=GEM[i%7===0?2:i%3===0?1:0];g.globalAlpha=.6+.4*Math.sin(T*3+i);g.drawImage(gi,x|0,y|0);g.globalAlpha=1}
 // 熱気の色と暗いふち
 const hg=g.createLinearGradient(0,0,0,UH);hg.addColorStop(0,'rgba(120,10,10,.35)');hg.addColorStop(.5,'rgba(60,0,0,0)');hg.addColorStop(1,'rgba(30,0,0,.5)');g.fillStyle=hg;g.fillRect(0,0,UW,UH);
 const vg=g.createRadialGradient(cx,cy,UH*.2,cx,cy,hyp(UW,UH)*.62);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.85)');g.fillStyle=vg;g.fillRect(0,0,UW,UH);
 // 題字：上から叩きつける
 const L1='BATTLE',L2='ARENA',fs=Math.min(52,UW/10),k=cl(t/.35,0,1),drop=1-Math.pow(1-k,4);if(t>.35&&t<.42)TS.shk=6;TS.shk*=.85;const sx=(R()-.5)*TS.shk,sy=(R()-.5)*TS.shk;
 const word=(s,y,dl)=>{const kk=cl((t-dl)/.3,0,1);if(kk<=0)return;const d=1-Math.pow(1-kk,4),sz=fs*(1.8-.8*d);g.font=sz+'px '+FP;g.textAlign='center';g.globalAlpha=d;
  for(let i=7;i>0;i--){g.fillStyle=i>4?'#1a0404':'#5a0e0c';g.fillText(s,UW/2+sx+i*.8,y+sy+i)}const gr=g.createLinearGradient(0,y-sz,0,y);gr.addColorStop(0,'#ffe9b0');gr.addColorStop(.45,'#ffb040');gr.addColorStop(1,'#d8381c');g.fillStyle=gr;g.fillText(s,UW/2+sx,y+sy);g.globalAlpha=1};
 word(L1,UH*.17+fs*.45,0);word(L2,UH*.17+fs*1.55,.22);
 // 30分の帯
 const ba=cl((t-.8)/.4,0,1);g.globalAlpha=ba;const by=UH*.17+fs*1.55+22;g.fillStyle='rgba(150,20,16,.85)';g.beginPath();g.moveTo(UW/2-118,by);g.lineTo(UW/2+124,by);g.lineTo(UW/2+118,by+20);g.lineTo(UW/2-124,by+20);g.fill();tx('本塔を守り抜け',UW/2,by+15,'#ffe0c0','center',12);g.globalAlpha=1;
 // メニュー：斜めの札
 const ma=cl((t-1.1)/.4,0,1);g.globalAlpha=ma;const items=[['開始',()=>{MODE='char';SEL=CHI}],['マルチ',()=>{MODE='mpm'}],['音量',()=>{VOLP=1}]];
 const mw=150,mh=26,gp=8,tot=items.length*(mh+gp)-gp,my0=UH-tot-34;
 items.forEach(([lab,f],i)=>{const on=TS.sel===i,y=my0+i*(mh+gp),x=UW/2-mw/2+(on?Math.sin(T*6)*1.5:0);g.fillStyle=on?'#c0281c':'rgba(30,10,10,.82)';g.beginPath();g.moveTo(x+10,y);g.lineTo(x+mw,y);g.lineTo(x+mw-10,y+mh);g.lineTo(x,y+mh);g.fill();if(on){g.fillStyle='rgba(255,220,170,.5)';g.fillRect(x+10,y,mw-10,1)}
  tx(lab,UW/2,y+18,on?'#fff4e0':'#c8a898','center',i===0?14:12);btn(x,y,mw,mh,()=>{TS.sel=i;f();snd('cl')})});
 g.globalAlpha=ma*.9;tx('金貨 '+META.gold,14,UH-12,'#ffc860','left',11);const bc=META.bc?Math.max(0,...Object.values(META.bc).map(o=>o.t||0)):0;if(bc)tx('最長生存 '+mm(bc),14,UH-28,'#c8a898','left',10);tx('v0.3',UW-12,UH-12,'#6a4a44','right',9);g.globalAlpha=1}
/* ===== キャラ選択：光の中に1人ずつ立たせる ===== */
const CSL={from:-1,t0:0,dir:1,bx:0,sx:null,dust:[]};
function charGo(i,dir){i=(i+CHS.length)%CHS.length;if(i===SEL)return;CSL.from=SEL;CSL.dir=dir||(i>SEL?1:-1);CSL.t0=T;SEL=i;snd('cl')}
function charDecide(){CHI=SEL;MODE='stage';SEL=STAGES.indexOf(STG);snd('tn')}
function drawChar(){const c=CHS[SEL],col=c.col,UWs=UW,wide=UW>=640;const t=T-CSL.t0,e=cl(t/.32,0,1),ee=1-Math.pow(1-e,3);
 // 背景：闘技場の床をキャラの色に染め、斜めの帯と流れる線
 g.fillStyle='#070405';g.fillRect(0,0,UW,UH);const sx=wide?UW*.3:UW/2,gy=UH*.7;const arc=arenaCanvas(),sc=Math.max(UW,UH)/520;g.save();g.globalAlpha=.45;g.translate(sx,gy-40);g.rotate(-T*.02);g.scale(sc,sc);g.drawImage(arc,-arc.width/2,-arc.height/2);g.restore();g.globalAlpha=1;
 g.fillStyle=hexA(col,.35);g.fillRect(0,0,UW,UH);g.globalCompositeOperation='source-over';
 const band=(x0,w,a)=>{g.fillStyle=a;g.beginPath();g.moveTo(x0+90,0);g.lineTo(x0+90+w,0);g.lineTo(x0-90+w,UH);g.lineTo(x0-90,UH);g.fill()};band(sx-100+(1-ee)*CSL.dir*60,200,hexA(col,.75));band(sx+104+(1-ee)*CSL.dir*90,14,hexA(c.lt,.5));band(sx-130+(1-ee)*CSL.dir*40,8,hexA(c.lt,.3));
 for(let i=0;i<14;i++){const q=((T*.6+i*.137)%1),x=sx-160+((i*97)%320)+q*-60,y=q*UH*1.2-40;g.fillStyle=hexA(c.lt,.25*(1-q));g.fillRect(x|0,y|0,1,26)}
 const vg=g.createRadialGradient(sx,gy-60,UH*.15,sx,gy-60,hyp(UW,UH)*.7);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.8)');g.fillStyle=vg;g.fillRect(0,0,UW,UH);
 // 足元の円（闘技場の中央の印）
 g.strokeStyle=hexA(c.lt,.5);g.lineWidth=1.5;g.beginPath();g.ellipse(sx,gy+4,70,16,0,0,TAU);g.stroke();g.strokeStyle=hexA(c.lt,.2);g.beginPath();g.ellipse(sx,gy+4,96,22,0,0,TAU);g.stroke();
 // 立ち姿（前の者は流れ去り、次の者が滑り込む）
 const big=k=>sprite(A.ch[CHS[k].k].img,1),K2=UH>=440?1.5:1;
 const drawFig=(k,ox,al)=>{const s=big(k);if(!s.ok)return;const w=s.w*K2,h=s.h*K2,bob=Math.sin(T*1.8)*2;g.globalAlpha=al;g.fillStyle='rgba(0,0,0,.4)';g.beginPath();g.ellipse(sx+ox,gy+4,w*.3,7,0,0,TAU);g.fill();g.drawImage(s.n,sx+ox-w/2|0,gy+4-h+bob|0,w|0,h|0);g.globalAlpha=1};
 if(CSL.from>=0&&e<1)drawFig(CSL.from,-CSL.dir*ee*140,1-ee);drawFig(SEL,CSL.dir*(1-ee)*140,ee);
 // 左右の矢印
 const ar=(x,d)=>{const a=.5+.3*Math.sin(T*3);g.fillStyle=hexA('#f0e6c8',a);g.beginPath();g.moveTo(x+d*8,gy-80);g.lineTo(x-d*4,gy-92);g.lineTo(x-d*4,gy-68);g.fill();btn(x-22,gy-112,44,64,()=>charGo(SEL+d,d))};ar(sx-126,-1);ar(sx+126,1);
 // 右の説明
 const px=wide?UW*.56:16,pw=wide?UW*.4:UW-32,py=wide?56:UH*.72-6;const pa=ee;g.globalAlpha=pa;
 if(wide){// 下（顔の並び）から上へ積んで、重ならないようにする
  const fwL=Math.min(54,(UW-140)/CHS.length),lim=UH-fwL-22,r0=META.bc&&META.bc[SEL];
  tx((SEL+1)+' / '+CHS.length,px,py,'#6a7088','left',10,FP);tx(A.ch[c.k].n,px+(1-ee)*12,py+30,'#fff4e0','left',UH<440?22:26);tx(c.ep,px,py+50,c.lt,'left',12);
  const le=wrapT(c.lore,px,py+70,pw,'#b8bed0',10,14);
  const ry=lim,cpH=48,wpH=52,cy0=ry-(r0?14:0)-cpH,wy=cy0-6-wpH;
  // 能力
  const ss={might:1,cd:1,area:1,move:1,dur:1,pspd:1,luck:1,mhp:c.hp,armor:0,amt:0,regen:0};CPV[SEL].f(ss,1);let st=[['最大HP',ss.mhp/170],['ダメージ',ss.might],['待ち時間',ss.cd],['範囲',ss.area],['移動',ss.move],['持続',ss.dur],['弾の速さ',ss.pspd],['幸運',ss.luck]].filter((s,i)=>i<2||Math.abs(s[1]-1)>.001);
  const sy0=le+12,avail=wy-6-sy0,rh=cl(avail/Math.max(1,st.length),0,16);if(rh<10)st=st.slice(0,Math.max(0,Math.floor(avail/10)));const rh2=st.length?Math.min(16,avail/st.length):0;
  st.forEach(([n,v],i)=>{const y=sy0+i*rh2;tx(n,px,y+7,'#9098b0','left',9);const bw=pw-110;g.fillStyle='rgba(255,255,255,.07)';g.fillRect(px+70,y,bw,5);const f=n==='最大HP'?v:v/1.3;g.fillStyle=v>1||n==='待ち時間'&&v<1?c.lt:'#8890a8';g.fillRect(px+70,y,bw*cl(f,0,1)*Math.min(1,t*3),5);tx(n==='最大HP'?String(Math.round(ss.mhp)):Math.round(v*100)+'%',px+pw,y+7,'#e8e0d0','right',9)});
  // 初めの武器
  const w=W[c.w];box(px,wy,pw,wpH,'rgba(255,255,255,.04)');g.fillStyle=hexA(c.lt,.6);g.fillRect(px,wy,2,wpH);icon(w.ic,px+10,wy+11,28);tx('初めの武器',px+46,wy+13,'#7a8098','left',9);tx(w.n,px+46,wy+28,'#f0e6c8','left',12);tx(w.d,px+46,wy+43,'#a8b0c4','left',9);
  icon(w.evo.ic,px+pw-28,wy+6,20,1);tx('進化',px+pw-18,wy+36,'#c8a860','center',8);tx(w.evo.n,px+pw-18,wy+47,'#e0c888','center',8);
  // 固有の力
  {const cp=CPV[SEL],yy=cy0;box(px,yy,pw,cpH,'rgba(255,200,90,.06)');g.fillStyle='rgba(255,200,90,.7)';g.fillRect(px,yy,2,cpH);icon(cp.ic,px+10,yy+7,26,1);tx('固有の力　'+cp.n,px+44,yy+16,'#ffe0a0','left',11);wrapT(cp.d,px+44,yy+29,pw-52,'#c8c0b0',9,11)}
  if(r0)tx(`最高 Lv${r0.lv}　撃破 ${r0.k}`,px,ry+8,'#8890a8','left',9)}
 else{tx(A.ch[c.k].n,UW/2,py,'#fff4e0','center',22);tx(c.ep,UW/2,py+20,c.lt,'center',12);const w=W[c.w];icon(w.ic,UW/2-110,py+30,22);tx(w.n+'：'+w.d,UW/2-82,py+46,'#d8d0c0','left',11)}
 g.globalAlpha=1;
 // 下の顔の並び
 const n=CHS.length,fw=Math.min(54,(UW-140)/n),fy=UH-fw-14,fx0=UW/2-n*fw/2-(wide?0:0);CSL.bx+=(fx0+SEL*fw-CSL.bx)*.25;
 CHS.forEach((ch,i)=>{const s=cSpr(ch.k),x=fx0+i*fw,on=i===SEL;g.fillStyle=on?hexA(ch.col,.35):'rgba(255,255,255,.05)';g.fillRect(x+2,fy,fw-4,fw);if(s.ok){const cw=Math.min(s.w,s.h*.55),k=(fw-8)/cw;g.save();g.beginPath();g.rect(x+2,fy,fw-4,fw);g.clip();g.globalAlpha=on?1:.55;g.drawImage(s.n,(s.w-cw)/2,0,cw,cw,x+4,fy+3,cw*k,cw*k);g.restore();g.globalAlpha=1}btn(x+2,fy,fw-4,fw,()=>charGo(i))});
 g.fillStyle='#f0c860';g.fillRect(CSL.bx+4,fy+fw+3,fw-8,2);
 // ボタン
 tx('キャラを選ぶ',UW/2,24,'#c8c0b0','center',13);box(10,8,74,24,'rgba(255,255,255,.06)');tx('◀ 戻る',47,25,'#d8d0c0','center',11);btn(6,4,84,32,()=>{MODE='title'});
 const bx=UW-150,by=fy-8,bw2=140;if(wide){const pulse=.75+.25*Math.sin(T*3);g.fillStyle=hexA(c.col,.85*pulse);g.fillRect(UW-162,UH-58,150,40);g.fillStyle='rgba(255,255,255,.12)';g.fillRect(UW-162,UH-58,150,2);tx('この者で出る',UW-87,UH-32,'#fff','center',14);btn(UW-162,UH-58,150,40,charDecide)}
 else{g.fillStyle=hexA(c.col,.85);g.fillRect(UW-104,8,96,26);tx('決定',UW-56,26,'#fff','center',12);btn(UW-104,4,96,34,charDecide)}}
function wrapT(s,x,y,w,c,sz,lh){g.font=sz+'px '+FT;let line='',yy=y;for(const ch of s){if(g.measureText(line+ch).width>w){tx(line,x,yy,c,'left',sz);line='';yy+=lh}line+=ch}if(line)tx(line,x,yy,c,'left',sz);return yy}
function hexA(h,a){const n=parseInt(h.slice(1),16);return`rgba(${n>>16},${n>>8&255},${n&255},${a})`}
function shadeC(h,k){const n=parseInt(h.slice(1),16);return`rgb(${(n>>16)*k|0},${(n>>8&255)*k|0},${(n&255)*k|0})`}
/* ===== おにぎり（回復）の絵 ===== */
const ONIG=pix(['....aaa....','...abbba...','..abbbbba..','.abbbbbbba.','.abbbbbbba.','abbbbbbbbba','abbcccccbba','abcccccccba','.accccccca.','..aaaaaaa..'],{a:'#c8c0b0',b:'#f4f0e6',c:'#1c2a20'});
/* ===== 進化の一覧（10件ずつのページ） ===== */
let EVL=0,EVP=0;const EVN=10;
function drawEvl(){const p=P,ks=Object.keys(W),pages=Math.ceil(ks.length/EVN);EVP=cl(EVP,0,pages-1);const list=ks.slice(EVP*EVN,EVP*EVN+EVN),rh=Math.min(36,(UH-120)/EVN),w=Math.min(UW-20,520),h=70+EVN*rh+40;const[x,y]=panel(w,h);btn(0,0,UW,UH,()=>{});
 tx('進化の組み合わせ',UW/2,y+26,'#ffd880','center',16);tx('武器を Lv8 にして、対の持ち物を持っていれば、宝箱から進化する',UW/2,y+46,'#9a98ac','center',10);
 list.forEach((k,i)=>{const D=W[k],wp=p.ws.find(q=>q.k===k),hp=!!p.pas[D.evo.p],yy=y+58+i*rh,ok=wp&&(wp.lv>=8||wp.evo)&&hp,done=wp&&wp.evo;g.fillStyle=ok||done?'rgba(255,210,110,.1)':i%2?'rgba(255,255,255,.03)':'rgba(255,255,255,.0)';g.fillRect(x+8,yy,w-16,rh-3);
  const c1=x+14,c2=x+w*.4,c3=x+w*.66,is=Math.min(28,rh-6),ty=yy+rh/2+3;
  g.globalAlpha=wp?1:.45;icon(D.ic,c1,yy+(rh-3-is)/2,is);tx(D.n,c1+is+8,ty-(wp?5:0),wp&&wp.lv>=8?'#ffd880':'#e8e0d0','left',12);if(wp&&!wp.evo)tx('Lv'+wp.lv,c1+is+8,ty+9,'#c8a860','left',9);g.globalAlpha=1;
  tx('＋',c2-14,ty,'#8a8498','center',12);g.globalAlpha=hp?1:.45;icon(PS[D.evo.p].ic,c2,yy+(rh-3-is)/2,is);tx(PS[D.evo.p].n,c2+is+8,ty,hp?'#a8d0ff':'#c8c4d0','left',12);g.globalAlpha=1;
  tx('→',c3-12,ty,'#8a8498','center',12);g.globalAlpha=done||ok?1:.6;icon(D.evo.ic,c3,yy+(rh-3-is)/2,is,done||ok);tx(D.evo.n,c3+is+8,ty-(done||ok?5:0),done?'#ffd860':ok?'#ffe8a0':'#c8c4d0','left',12);if(done)tx('進化済み',c3+is+8,ty+9,'#ffd860','left',9);else if(ok)tx('宝箱を待つ',c3+is+8,ty+9,'#e8c070','left',9);g.globalAlpha=1});
 const by=y+h-30;const pb=(lab,bx,f,on)=>{box(bx,by,60,22,on?'rgba(60,64,90,.95)':'rgba(30,32,44,.6)');tx(lab,bx+30,by+15,on?'#fff':'#5a5a6a','center',11);if(on)btn(bx,by,60,22,f)};
 pb('◀',x+12,()=>{EVP--;snd('cl')},EVP>0);pb('▶',x+w-72,()=>{EVP++;snd('cl')},EVP<pages-1);tx((EVP+1)+' / '+pages,UW/2-70,by+15,'#a8a0b8','center',10,FP);
 box(UW/2-10,by,90,22,'rgba(50,56,80,.95)');tx('戻る',UW/2+35,by+15,'#fff','center',11);btn(UW/2-10,by,90,22,()=>{EVL=0})}

/* ===== 場所を選ぶ画面：左に場所の札、右に大きな見本（敵が歩き、主の影が立つ） ===== */
function silo(s,col){if(!s.ok)return null;const k='_s'+col;if(s[k])return s[k];const c=MKC(s.w,s.h),x=c.getContext('2d');x.drawImage(s.f,0,0);x.globalCompositeOperation='source-in';x.fillStyle=col;x.fillRect(0,0,s.w,s.h);return s[k]=c}
const THT={},STS={t0:0,from:-1,wk:[]};
function stageGo(i){i=(i+STAGES.length)%STAGES.length;if(i===SEL)return;STS.from=SEL;STS.t0=T;SEL=i;STS.wk=[];snd('cl')}
function drawStage(){const k=STAGES[SEL],t=TH[k],ar=A.AR.find(a=>a.k===k),e2=cl((T-STS.t0)/.35,0,1),ee=1-Math.pow(1-e2,3);g.fillStyle='#070608';g.fillRect(0,0,UW,UH);
 const wide=UW>=640,lw=wide?Math.min(230,UW*.3):0,px=wide?lw+24:10,pw=UW-px-12,ph=wide?UH-96:UH*.5,py=40;
 // 見本：その場所の地面を大きく、敵が横切る
 if(!THT[k])THT[k]=mkTile(t);g.save();g.beginPath();g.rect(px,py,pw,ph);g.clip();const sc=2,ox=-(T*12)%(THT[k].width*sc);for(let xx=ox;xx<pw;xx+=THT[k].width*sc)for(let yy=0;yy<ph;yy+=THT[k].height*sc)g.drawImage(THT[k],px+xx,py+yy,THT[k].width*sc,THT[k].height*sc);
 if(STS.wk.length<7&&R()<.04){const ek=pk(ar.nm);STS.wk.push({k:ek,x:-40,y:py+ph*.45+R()*ph*.45,v:20+R()*25})}for(const w of STS.wk){w.x+=w.v/60;const s=eSpr(w.k,0);if(s.ok){const bob=Math.abs(Math.sin(T*6+w.y))*2;g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(px+w.x,w.y,s.w*.3,4,0,0,TAU);g.fill();g.drawImage(s.f,px+w.x-s.w/2|0,w.y-s.h-bob|0)}}STS.wk=STS.wk.filter(w=>w.x<pw+60);
 // 主の影（奥に大きく）
 const bk=ar.bo[0][ar.bo[0].length>>1],bs=eSpr(bk,1);if(bs.ok){const c=silo(bs,'#000');if(c){g.globalAlpha=.55;const hh=ph*.62,ww=bs.w*hh/bs.h;g.drawImage(c,px+pw-ww-18,py+ph*.08,ww,hh);g.globalAlpha=1}}
 const vg=g.createLinearGradient(0,py,0,py+ph);vg.addColorStop(0,'rgba(0,0,0,.55)');vg.addColorStop(.4,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.6)');g.fillStyle=vg;g.fillRect(px,py,pw,ph);
 if(t.dark){const v2=g.createRadialGradient(px+pw/2,py+ph/2,ph*.2,px+pw/2,py+ph/2,pw*.7);v2.addColorStop(0,'rgba(0,0,10,0)');v2.addColorStop(1,`rgba(0,0,10,${t.dark})`);g.fillStyle=v2;g.fillRect(px,py,pw,ph)}
 g.restore();g.fillStyle='rgba(255,214,110,.6)';g.fillRect(px,py,pw,1);g.fillRect(px,py+ph-1,pw,1);
 // 名前と説明
 g.globalAlpha=ee;tx(t.n,px+16+(1-ee)*20,py+40,'#fff4e0','left',26);tx(t.sub,px+18,py+60,'#d0c8b8','left',11);g.globalAlpha=1;
 const bw=META.bw&&META.bw[k];tx(bw?(bw>NWAVE?'守り抜いた':'最高 '+bw+'分'):'未踏',px+pw-12,py+22,bw>NWAVE?'#ffd860':'#a8b0c0','right',11);
 // 出る敵・主
 const ry=py+ph-46;box(px+8,ry,pw-16,38,'rgba(8,8,12,.7)');tx('出る敵',px+16,ry+14,'#8a8498','left',9);ar.nm.slice(0,Math.floor((pw-200)/30)).forEach((ek,j)=>{const s=eSpr(ek,0);if(s.ok){const k2=Math.min(26/s.w,26/s.h);g.drawImage(s.f,px+16+j*30,ry+36-s.h*k2|0,s.w*k2|0,s.h*k2|0)}});
 tx('主',px+pw-150,ry+14,'#c86060','left',9);ar.bo.slice(0,3).forEach((gr,j)=>{const ek=gr[gr.length>>1],s=eSpr(ek,0);if(s.ok){const k2=Math.min(30/s.w,30/s.h);g.drawImage(s.f,px+pw-150+j*44,ry+37-s.h*k2|0,s.w*k2|0,s.h*k2|0)}});
 // 左：場所の札
 tx('場所を選ぶ',wide?lw/2+10:UW/2,26,'#c8c0b0','center',13);
 STAGES.forEach((kk,i)=>{const tt=TH[kk],on=SEL===i;let x,y,w,h;if(wide){w=lw;h=Math.min(52,(UH-120)/6-6);x=12+(on?8:0);y=40+i*(h+6)}else{w=(UW-24)/3-4;h=34;x=12+(i%3)*(w+6);y=py+ph+8+(i/3|0)*(h+6)}
  if(!THT[kk])THT[kk]=mkTile(tt);g.save();g.beginPath();g.rect(x,y,w,h);g.clip();g.globalAlpha=on?1:.55;g.drawImage(THT[kk],x,y-20);g.globalAlpha=1;const gr=g.createLinearGradient(x,0,x+w,0);gr.addColorStop(0,'rgba(0,0,0,.7)');gr.addColorStop(1,'rgba(0,0,0,.1)');g.fillStyle=gr;g.fillRect(x,y,w,h);g.restore();
  if(on){g.fillStyle='#e8c060';g.fillRect(x,y,3,h);g.fillStyle='rgba(255,214,110,.5)';g.fillRect(x,y,w,1);g.fillRect(x,y+h-1,w,1)}tx(tt.n,x+12,y+h/2+5,on?'#fff4e0':'#a8a0a0','left',wide?13:11);const b2=META.bw&&META.bw[kk];if(b2&&wide)tx(b2>NWAVE?'制覇':b2+'分',x+w-8,y+h/2+4,b2>NWAVE?'#ffd860':'#7a7a88','right',9);
  btn(x,y,w,h,()=>{if(SEL===i&&!TOUCH){STG=kk;newRun()}else stageGo(i)})});
 const b=(lab,x,y,w,f,c)=>{g.fillStyle=c;g.beginPath();g.moveTo(x+8,y);g.lineTo(x+w,y);g.lineTo(x+w-8,y+28);g.lineTo(x,y+28);g.fill();tx(lab,x+w/2,y+19,'#fff','center',12);btn(x,y,w,28,f)};
 b('◀ 戻る',12,UH-38,100,()=>{MODE='char';SEL=CHI},'rgba(40,44,64,.92)');const pu=.8+.2*Math.sin(T*3);b('出発する',UW-152,UH-38,140,()=>{STG=STAGES[SEL];newRun()},`rgba(192,40,28,${pu})`)}

/* ===== 強化の画面：金貨の山、札を押して買う。買うと光が弾ける ===== */
let SHP={sel:0,fx:[],t:0,cf:0};
function drawShop(){const ks=Object.keys(MU),dt=1/60;g.fillStyle='#09070a';g.fillRect(0,0,UW,UH);const ar=arenaCanvas(),sc=Math.max(UW,UH)/520;g.save();g.globalAlpha=.25;g.translate(UW/2,UH*.6);g.rotate(T*.02);g.scale(sc,sc);g.drawImage(ar,-ar.width/2,-ar.height/2);g.restore();g.globalAlpha=1;
 const hg=g.createLinearGradient(0,0,0,UH);hg.addColorStop(0,'rgba(80,50,10,.45)');hg.addColorStop(1,'rgba(0,0,0,.7)');g.fillStyle=hg;g.fillRect(0,0,UW,UH);
 // 見出しと金貨
 g.font='22px '+FP;g.textAlign='left';const hd='POWER UP';const gd=g.createLinearGradient(0,10,0,36);gd.addColorStop(0,'#fff4d0');gd.addColorStop(1,'#c88a20');g.fillStyle='rgba(30,14,4,.8)';g.fillText(hd,22,38);g.fillStyle=gd;g.fillText(hd,20,36);tx('強化　ずっと残る力。金貨は戦いで拾う',22,54,'#c8b898','left',10);
 const gx=UW-24;g.globalCompositeOperation='lighter';g.globalAlpha=.5+.2*Math.sin(T*3);g.drawImage(glowC('255,200,90'),gx-110,8,90,40);g.globalAlpha=1;g.globalCompositeOperation='source-over';for(let i=0;i<5;i++)g.drawImage(COIN,gx-96+i*3,30-i*3,14,14);tx(String(META.gold),gx,40,'#ffd860','right',20,FP);
 // 札
 const cols=UW>700?4:UW>480?3:2,gap=8,cw=Math.min(170,(UW-40-(cols-1)*gap)/cols),chh=Math.min(74,(UH-150)/Math.ceil(ks.length/cols)-gap),x0=UW/2-(cols*cw+(cols-1)*gap)/2,y0=66;
 ks.forEach((k,i)=>{const u=MU[k],n=META.up[k]||0,x=x0+(i%cols)*(cw+gap),y=y0+(i/cols|0)*(chh+gap),cost=u.c*(n+1),mx=n>=u.m,can=!mx&&META.gold>=cost,on=SHP.sel===i;const pop=SHP.k===k?Math.max(0,1-(T-SHP.t)*4):0;
  g.save();g.translate(x+cw/2,y+chh/2);g.scale(1+pop*.06,1+pop*.06);g.translate(-cw/2,-chh/2);
  const bg=g.createLinearGradient(0,0,0,chh);bg.addColorStop(0,on?'#3a2c1a':'#1e1a22');bg.addColorStop(1,on?'#1e140a':'#121016');g.fillStyle=bg;g.fillRect(0,0,cw,chh);g.fillStyle=mx?'rgba(140,220,160,.7)':on?'rgba(255,200,100,.9)':'rgba(255,200,100,.25)';g.fillRect(0,0,cw,1);g.fillRect(0,chh-1,cw,1);
  g.fillStyle='rgba(0,0,0,.4)';g.beginPath();g.arc(22,chh/2-4,16,0,TAU);g.fill();if(mx||on){g.globalCompositeOperation='lighter';g.globalAlpha=.5;g.drawImage(glowC(mx?'140,220,160':'255,200,100'),2,chh/2-24,40,40);g.globalAlpha=1;g.globalCompositeOperation='source-over'}icon(u.ic,10,chh/2-16,24);
  tx(u.n,44,16,'#fff2dc','left',12);for(let j=0;j<u.m;j++){const gx2=44+j*10,gy2=22;g.fillStyle=j<n?'#ffd040':'rgba(255,255,255,.12)';g.beginPath();g.moveTo(gx2+3,gy2);g.lineTo(gx2+6,gy2+3);g.lineTo(gx2+3,gy2+6);g.lineTo(gx2,gy2+3);g.fill()}
  tx(u.d,44,chh/2+12,'#a8a0b0','left',9);if(mx)tx('最大',cw-8,chh-8,'#8ae0a0','right',10);else{g.drawImage(COIN,cw-8-g.measureText(String(cost)).width-24,chh-17,10,10);tx(String(cost),cw-8,chh-8,can?'#ffd860':'#806860','right',11)}
  if(pop>0){g.fillStyle=`rgba(255,240,200,${pop*.4})`;g.fillRect(0,0,cw,chh)}g.restore();
  btn(x,y,cw,chh,()=>{if(SHP.sel!==i&&TOUCH){SHP.sel=i;return}SHP.sel=i;buyUp(k,x+cw/2,y+chh/2)})});
 // 光の粒
 for(const p of SHP.fx){p.t-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=300*dt}SHP.fx=SHP.fx.filter(p=>p.t>0);for(const p of SHP.fx){if(p.c){g.globalAlpha=Math.min(1,p.t*2);g.drawImage(COIN,p.x-3,p.y-3);g.globalAlpha=1}else{g.globalCompositeOperation='lighter';g.globalAlpha=Math.min(1,p.t*2);g.drawImage(glowC('255,220,150'),p.x-5,p.y-5,10,10);g.globalAlpha=1;g.globalCompositeOperation='source-over'}}
 // 下のボタン
 const b=(lab,x,y,w,f,c)=>{g.fillStyle=c;g.beginPath();g.moveTo(x+8,y);g.lineTo(x+w,y);g.lineTo(x+w-8,y+26);g.lineTo(x,y+26);g.fill();tx(lab,x+w/2,y+18,'#fff','center',11);btn(x,y,w,26,f)};
 b('◀ 戻る',12,UH-36,100,()=>{MODE='title';SHP.cf=0},'rgba(40,44,64,.92)');
 const spent=ks.reduce((a,k)=>{let s2=0;for(let j=0;j<(META.up[k]||0);j++)s2+=MU[k].c*(j+1);return a+s2},0);if(spent){b(SHP.cf?'もう一度押すと戻す':'払い戻し（'+spent+'G）',UW-196,UH-36,184,()=>{if(!SHP.cf){SHP.cf=1;return}META.gold+=spent;META.up={};LS.set('battlearena_meta',META);SHP.cf=0;snd('cl')},SHP.cf?'rgba(150,40,30,.95)':'rgba(70,50,30,.9)')}}
function buyUp(k,x,y){const u=MU[k],n=META.up[k]||0,cost=u.c*(n+1);if(n>=u.m||META.gold<cost){snd('cl');return}META.gold-=cost;META.up[k]=n+1;LS.set('battlearena_meta',META);SHP.k=k;SHP.t=T;snd('tn');for(let i=0;i<24;i++){const a=R()*TAU,v=60+R()*120;SHP.fx.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-80,t:.6+R()*.4,c:i%3===0})}}

/* ===== マルチプレイ（最大4人の協力）=====
   ホストが全部を計算し、仲間には様子（スナップショット）を送る。仲間は操作だけを送る。
   つなぎ方：無料の公開 MQTT サーバーで知り合い、WebRTC（端末どうしの直通）に切り替える。直通できない時は MQTT で中継。
   同じ端末のタブどうし（ファイルを直接開いた時・テスト）は BroadcastChannel。 */
let MPON=0,NETC=0,MPS={pl:[],host:0,hid:'',code:'',stg:'forest',started:0,me:0};const PCOL=['#ffd23f','#5ff6ff','#ff6ad0','#7dff9a'];
const NET={id:Math.random().toString(36).slice(2,10),kind:'',code:'',mq:null,bc:null,tp:'',rtc:{},err:'',last:{},rx:0,tx:0,st:0,ib:0,sb:0};
const MQB=['wss://broker.emqx.io:8084/mqtt','wss://broker.hivemq.com:8884/mqtt','wss://test.mosquitto.org:8081/mqtt'],MQJ=['https://cdn.jsdelivr.net/npm/mqtt@5.10.1/dist/mqtt.min.js','https://unpkg.com/mqtt@5.10.1/dist/mqtt.min.js'];
const ICE={iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun.cloudflare.com:3478'}]};
const EKS=Object.keys(A.en),EKI={};EKS.forEach((k,i)=>EKI[k]=i);
function loadMqtt(){return new Promise(res=>{if(window.mqtt)return res(true);let i=0;const nx=()=>{if(i>=MQJ.length)return res(false);const sc=document.createElement('script');sc.src=MQJ[i++];sc.onload=()=>res(!!window.mqtt);sc.onerror=nx;document.head.appendChild(sc)};nx()})}
async function netOpen(code){netClose();NET.code=code;NET.tp='battlearena/v1/'+code;NET.err='';
 if(location.protocol==='file:'||window.__BC||!window.WebSocket){NET.kind='bc';NET.bc=new BroadcastChannel(NET.tp);NET.bc.onmessage=e=>onRelay(e.data);return true}
 if(!await loadMqtt()){NET.err='通信の部品を読み込めない';return false}
 for(const url of(window.__MQB||MQB)){const c=await new Promise(res=>{let done=0;const cl=mqtt.connect(url,{clientId:'ba'+NET.id,clean:true,connectTimeout:6000,reconnectPeriod:3000,keepalive:30});const fin=ok=>{if(done)return;done=1;if(!ok){try{cl.end(true)}catch(e){}}res(ok?cl:null)};cl.on('connect',()=>fin(1));cl.on('error',()=>fin(0));setTimeout(()=>fin(0),7000)});
  if(!c)continue;if(NET.code!==code){c.end(true);return false}NET.mq=c;NET.kind='mq';c.subscribe(NET.tp,{qos:0});c.on('connect',()=>c.subscribe(NET.tp,{qos:0}));c.on('message',(t,buf)=>{if(t===NET.tp)onRelay(buf.toString())});return true}
 NET.err='公開サーバーにつながらない';return false}
function netClose(){try{NET.mq&&NET.mq.end(true)}catch(e){}try{NET.bc&&NET.bc.close()}catch(e){}for(const id in NET.rtc)rtcClose(id);NET.mq=null;NET.bc=null;NET.kind='';NET.rtc={};NET.last={}}
function relay(o){o.f=NET.id;const s=JSON.stringify(o);NET.tx++;try{if(NET.bc)NET.bc.postMessage(s);else if(NET.mq)NET.mq.publish(NET.tp,s,{qos:0})}catch(e){}}
function onRelay(raw){let o;try{o=JSON.parse(raw)}catch(e){return}if(!o||o.f===NET.id)return;if(o.to&&o.to!=='*'&&o.to!==NET.id)return;NET.rx++;NET.last[o.f]=performance.now();if(o.sig)return onSig(o.f,o.sig);onMsg(o.f,o.m)}
function netTo(id,m){if(!id)return;const r=NET.rtc[id],ch=r&&r.ch;if(ch&&ch.readyState==='open'){try{ch.send(JSON.stringify(m));NET.tx++;return}catch(e){}}relay({to:id,m})}
function netAll(m){if(MPS.host){for(const q of MPS.pl)if(q.id!==NET.id)netTo(q.id,m)}else netTo(MPS.hid,m)}
const rtcOK=id=>{const r=NET.rtc[id];return !!(r&&r.ch&&r.ch.readyState==='open')};
// WebRTC：ホストが申し込む
function rtcNew(id){const pc=new RTCPeerConnection(ICE),r=NET.rtc[id]={pc,id,cq:[]};pc.onicecandidate=e=>{if(e.candidate)relay({to:id,sig:{c:e.candidate.toJSON?e.candidate.toJSON():e.candidate}})};pc.ondatachannel=e=>rtcCh(r,e.channel);return r}
function rtcCh(r,ch){r.ch=ch;ch.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch(_){return}NET.rx++;NET.last[r.id]=performance.now();onMsg(r.id,m)}}
function rtcStart(id){if(NET.kind!=='mq'&&!window.__RTC||!window.RTCPeerConnection)return;try{rtcClose(id);const r=rtcNew(id);rtcCh(r,r.pc.createDataChannel('g',{ordered:true}));r.pc.createOffer().then(o=>r.pc.setLocalDescription(o)).then(()=>relay({to:id,sig:{d:r.pc.localDescription}})).catch(()=>{})}catch(e){}}
function onSig(f,sg){try{let r=NET.rtc[f];
 if(sg.d){if(sg.d.type==='offer'){rtcClose(f);r=rtcNew(f);r.pc.setRemoteDescription(sg.d).then(()=>{r.rd=1;r.cq.forEach(c=>r.pc.addIceCandidate(c).catch(()=>{}));return r.pc.createAnswer()}).then(a=>r.pc.setLocalDescription(a)).then(()=>relay({to:f,sig:{d:r.pc.localDescription}})).catch(()=>{})}
  else if(r)r.pc.setRemoteDescription(sg.d).then(()=>{r.rd=1;r.cq.forEach(c=>r.pc.addIceCandidate(c).catch(()=>{}))}).catch(()=>{})}
 else if(sg.c&&r){if(r.rd)r.pc.addIceCandidate(sg.c).catch(()=>{});else r.cq.push(sg.c)}}catch(e){}}
function rtcClose(id){const r=NET.rtc[id];if(!r)return;try{r.ch&&r.ch.close()}catch(e){}try{r.pc.close()}catch(e){}delete NET.rtc[id]}
const evq=a=>{if(MPON&&MPS.host&&EVQ.length<200)EVQ.push(a)};

/* --- 部屋 --- */
async function mpHost(){const code=String(10000+RI(90000));MPS={pl:[{id:NET.id,ci:CHI,nm:'P1'}],host:1,hid:NET.id,code,stg:STG,started:0,me:0};MODE='lobby';NET.st=1;const ok=await netOpen(code);NET.st=ok?2:3}
async function mpJoin(code){MPS={pl:[],host:0,hid:'',code,stg:STG,started:0,me:-1};MODE='lobby';NET.st=1;const ok=await netOpen(code);NET.st=ok?2:3;if(!ok)return;MPS.hiT=0}
function mpLeave(){try{netAll({ty:'bye'})}catch(e){}netClose();MPON=0;NETC=0;MPS={pl:[],host:0};PLS=[];MODE='title';music('t')}
function lobSend(){netAll({ty:'lob',pl:MPS.pl,stg:MPS.stg})}
function mpStart(){if(!MPS.host)return;MPS.started=1;MPON=1;NETC=0;STG=MPS.stg;MPS.seed=Math.random()*1e9|0;netAll({ty:'go',stg:STG,pl:MPS.pl,seed:MPS.seed});CHI=MPS.pl[0].ci;newRun();LPI=0;P=PLS[0]}
function onMsg(f,m){if(!m||!m.ty)return;const H=MPS.host;
 if(H){const pi=MPS.pl.findIndex(q=>q.id===f);
  if(m.ty==='hi'){if(pi<0){if(MPS.pl.length>=4||MPS.started){relay({to:f,m:{ty:'full'}});return}MPS.pl.push({id:f,ci:m.ci||0,nm:'P'+(MPS.pl.length+1)});rtcStart(f)}netTo(f,{ty:'wel',hid:NET.id,code:MPS.code});lobSend();snd('cl')}
  else if(pi<0)return;
  else if(m.ty==='ci'){MPS.pl[pi].ci=m.ci;lobSend()}
  else if(m.ty==='bye'){if(MPS.started&&PLS[pi]){PLS[pi].dead=1;PLS[pi].left=1;banner(MPS.pl[pi].nm+' が抜けた','',1.6);if(PLS.every(q=>q.dead))DEATH=DEATH||{t:0}}else{MPS.pl.splice(pi,1);MPS.pl.forEach((q,i)=>q.nm='P'+(i+1));lobSend()}rtcClose(f)}
  else if(m.ty==='in'&&PLS[pi])PLS[pi].in=[cl(+m.v[0]||0,-1,1),cl(+m.v[1]||0,-1,1)];
  else if(m.ty==='pk'&&LVW&&LVW.pi===pi&&MODE==='lvw'){P=PLS[pi];takeOpt(LVW.opts[m.i|0]||LVW.opts[0]);P=LP();LVW=null;MODE='play';if(LVQ>0)openLv()}
  else if(m.ty==='cc'&&CHST&&CHST.pi===pi&&MODE==='chest')chestClose();
  else if(m.ty==='buy'&&PLS[pi]&&m.a)shopBuy(PLS[pi],m.a);
  else if(m.ty==='warp'&&PLS[pi])warpBase(PLS[pi]);
  return}
 // 仲間の側
 if(f!==MPS.hid&&MPS.hid&&m.ty!=='wel')return;
 if(m.ty==='wel'){MPS.hid=f;NET.last[f]=performance.now()}
 else if(m.ty==='full'){NET.err='部屋がいっぱいか、もう始まっている';NET.st=3}
 else if(m.ty==='lob'){MPS.pl=m.pl;MPS.stg=m.stg;MPS.me=m.pl.findIndex(q=>q.id===NET.id);if(MODE==='result'&&!MPS.started)MODE='lobby'}
 else if(m.ty==='go'){MPS.started=1;MPON=1;NETC=1;STG=m.stg;MPS.pl=m.pl;MPS.seed=m.seed;cStart()}
 else if(m.ty==='sn'&&NETC)cApply(m);
 else if(m.ty==='lv'&&NETC){MODE='lv';LVO=m.opts;SEL=0;LVA={t0:T,pick:-1,pt:0};snd('tn')}
 else if(m.ty==='ch'&&NETC){CHST=Object.assign({t:0},m.c);UPT=[];ULT=T;MODE='chest';chestJingle(CHST)}
 else if(m.ty==='end'&&NETC){cEnd(m.r)}
 else if(m.ty==='bye'){NET.err='ホストが部屋を閉じた';if(MPS.started){NETC=0;MPON=0;MPS.started=0}MODE='lobby';NET.st=3}}

/* --- ホスト：様子を送る --- */
function hostNet(dt){const now=performance.now();NET.sb-=dt;
 for(let i=1;i<MPS.pl.length;i++){const q=MPS.pl[i],l=NET.last[q.id]||now;if(now-l>12000&&PLS[i]&&!PLS[i].left){PLS[i].dead=1;PLS[i].left=1;banner(q.nm+' との通信が切れた','',1.8);if(PLS.every(x=>x.dead))DEATH=DEATH||{t:0}}}
 if(NET.sb>0)return;NET.sb=1/12;NET.fr=(NET.fr||0)+1;const sn=snap();EVQ=[];for(let i=1;i<MPS.pl.length;i++){const id=MPS.pl[i].id;if(PLS[i]&&PLS[i].left)continue;if(rtcOK(id)||NET.kind==='bc'||NET.fr%2===0)netTo(id,sn)}}
function snap(){const r=Math.round,f2=v=>Math.round(v*100)/100,D=hyp(LW,LH)*.75;
 const pl=PLS.map(q=>[r(q.x),r(q.y),Math.ceil(q.hp),q.face,q.walk>0?1:0,q.hit>0?1:0,q.inv>0?1:0,q.dead?1:0,f2(q.dT||0),f2(q.hurtT||0),(q.bar||0)<=0?1:0,q.ws.map(w=>[w.k,w.lv,w.evo?1:0,r(w.dm),f2(w.ang||0),w.act?1:0,r(w.rr||0),w.wsp?w.wsp.map(o=>[r(o.x),r(o.y)]):0]),q.pas,q.s,f2(q.dx||1),f2(q.dy||0),q.left?1:0]);
 const en=[];for(const e of EN){if(e.dead)continue;if(minPlD(e.x,e.y)>D)continue;en.push([e.id,e.lamp?-1:EKI[e.k],r(e.x),r(e.y),e.tier|0,e.lamp?100:r(e.hp/e.mhp*100),e.fl>0?1:0,e.frz>0?1:0,e.cast>0?1:0,e.lbt>0?e.lbs:0]);if(en.length>360)break}
 const bu=[];for(const b of BU){if(minPlD(b.x,b.y)>D)continue;if(!b.id)b.id=++BID;bu.push([b.id,b.ty,r(b.x),r(b.y),r(b.vx||0),r(b.vy||0),f2(b.r||0),f2(b.rot||0),b.w&&b.w.evo?1:0,b.c||0,f2(b.t),b.g||0]);if(bu.length>220)break}
 const pk=[];for(const k of PK){if(minPlD(k.x,k.y)>D)continue;pk.push([k.ty,r(k.x),r(k.y),k.c|0,k.big?1:0]);if(pk.length>320)break}
 const tg=TG.map(t=>[t.ty,r(t.x),r(t.y),r(t.r||0),f2(t.a||0),t.len||0,r(t.w||0),f2(t.t/t.t0),t.fall?1:0,t.big?1:0]);
 const eb=EB.map(b=>[r(b.x),r(b.y),r(b.vx),r(b.vy),b.r,b.c]);
 const fx=[];for(const f of FX){if(f.e||f.ty==='die')continue;const o={};for(const k in f){if(k==='w'||k==='hit'||k==='dmg'||k==='hh'||k==='tk')continue;const v=f[k];o[k]=typeof v==='number'?f2(v):v}fx.push(o)}
 const tw=TW.map(t=>[r(t.hp),r(t.mhp),t.lv,t.dead?1:0]);const gp=PLS.map(q=>[r(q.gold||0),q.off||null,q.rsp!=null?f2(q.rsp):-1]);
 const tb=TB.map(b=>[r(b.x),r(b.y)]);
 return{ty:'sn',tw,tb,wv:WV?[WV.n,r(WV.t)]:null,gp,txp:[TX.lv,f2(TX.xp)],t:f2(TIME),k:KILLS,g:GOLD,lv:TX.lv,xp:f2(TX.xp),lq:LVQ,md:MODE,lw:LVW?LVW.pi:-1,cp:CHST?CHST.pi:-1,sh:f2(SHAKE),bn:BANNER,pl,en,bu,pk,tg,eb,fx,ev:EVQ}}

/* --- 仲間：様子を受け取って描く（自分の動きだけは手元で先に動かす） --- */
let CEN=new Map(),CBU=new Map(),CLS=0;
function cStart(){TM=TH[STG];TILE=mkTile(TM);MAP=mkMap(STG,MPS.seed||1);NP=MPS.pl.length;mkTowers();WV={n:0,t:6,q:[]};TB=[];TOAST=[];EN=[];BU=[];FX=[];DN=[];PK=[];PT=[];EB=[];TG=[];CEN=new Map();CBU=new Map();INF=null;LOUT=null;EVL=0;DEATH=null;HURT=0;TIME=0;KILLS=0;GOLD=0;LVQ=0;LVO=null;CHST=null;PAUSE=0;RESULT=null;NP=MPS.pl.length;TX={lv:1,xp:0};
 PLS=MPS.pl.map((r,i)=>{const q={isPl:1,gold:120,x:MAP.base.x+(i-(MPS.pl.length-1)/2)*40,y:MAP.base.y+70,hp:1,lv:1,xp:0,face:1,dx:1,dy:0,inv:0,ws:[],pas:{},hit:0,walk:0,dead:0,ci:r.ci,id:r.id,nm:r.nm,pi:i,in:[0,0]};P=q;stats();q.hp=q.s.mhp;return q});LPI=Math.max(0,MPS.pl.findIndex(q=>q.id===NET.id));P=PLS[LPI];CHI=PLS[LPI].ci;CLS=performance.now();MODE='play';banner(TM.n,TM.sub);music(AREA().bgm)}
function cApply(m){CLS=performance.now();if(m.tw)m.tw.forEach((a,i)=>{const t=TW[i];if(!t)return;if(a[0]<t.hp)t.fl=.12;t.hp=a[0];t.mhp=a[1];t.lv=a[2];t.dead=a[3]});if(m.wv){WV.n=m.wv[0];WV.t=m.wv[1]}if(m.tb)TB=m.tb.map(a=>({x:a[0],y:a[1]}));if(m.gp)m.gp.forEach((a,i)=>{const q=PLS[i];if(!q)return;q.gold=a[0];if(a[1])q.off=a[1];q.rsp=a[2]<0?null:a[2]});TIME=m.t;KILLS=m.k;GOLD=m.g;TX={lv:m.lv,xp:m.xp};SHAKE=Math.max(SHAKE,m.sh);if(m.bn&&(!BANNER||BANNER.s!==m.bn.s))BANNER=m.bn;
 m.pl.forEach((a,i)=>{const q=PLS[i];if(!q)return;const me=i===LPI;const[x,y]=a;if(me){if(hyp(q.x-x,q.y-y)>56||a[7]){q.x=x;q.y=y}else{q.sx=x;q.sy=y}}else{q.tx=x;q.ty=y;if(q.x==null||hyp(q.x-x,q.y-y)>200){q.x=x;q.y=y}}
  q.hp=a[2];if(!me)q.face=a[3];q.walk=me?q.walk:a[4]?(q.walk||0)+.01:0;q.hit=a[5]?.1:0;q.inv=a[6]?.1:0;q.dead=a[7];q.dT=a[8];q.hurtT=Math.max(q.hurtT||0,a[9]);q.bar=a[10]?0:1;q.ws=a[11].map(w=>({k:w[0],lv:w[1],evo:w[2],dm:w[3],ang:w[4],act:w[5],rr:w[6],wsp:w[7]?w[7].map(o=>({x:o[0],y:o[1]})):null}));q.pas=a[12];q.s=a[13];if(!me){q.dx=a[14];q.dy=a[15]}q.left=a[16];q.xp=m.xp;q.lv=m.lv;if(me)for(const w of q.ws)if(w.evo){META.evd=META.evd||{};if(!META.evd[w.k]){META.evd[w.k]=1;LS.set('battlearena_meta',META)}}});
 const seen=new Set();for(const a of m.en){const[id,ki,x,y,tier,hp,fl,frz,cast,lbs]=a;seen.add(id);let e=CEN.get(id);if(!e){if(ki<0)e={lamp:1,id,x,y,r:15,hp:1,mhp:1};else{const k=EKS[ki],d=A.en[k];e={id,k,d,tier,sp:eSpr(k,tier),r:tier===2?26:tier===1?18:cl(Math.round(d.w*.12),7,16),ph:R()*TAU,x,y,hp,mhp:100}}CEN.set(id,e)}
  e.tx=x;e.ty=y;e.hp=hp;e.fl=fl?.1:0;e.frz=frz;e.cast=cast;if(lbs&&e.lbs!==lbs){e.lbs=lbs;e.lbt=1.6}}
 for(const[id,e]of CEN)if(!seen.has(id)&&!e.dead)CEN.delete(id);EN=[...CEN.values()];
 const nb=new Map();BU=m.bu.map(a=>{const[id,ty,x,y,vx,vy,rr,rot,ev,c,t,gg]=a;const o=CBU.get(id)||{id,tr:[]};Object.assign(o,{ty,x,y,vx,vy,r:rr,rot,w:{evo:ev,k:''},c:c||'200,220,255',t,g:gg});nb.set(id,o);return o});CBU=nb;
 PK=m.pk.map(a=>({ty:a[0],x:a[1],y:a[2],c:a[3],big:a[4]}));TG=m.tg.map(a=>({ty:a[0],x:a[1],y:a[2],r:a[3],a:a[4],len:a[5],w:a[6],t:Math.max(.001,a[7]),t0:1,fall:a[8],big:a[9]}));
 EB=m.eb.map(a=>({x:a[0],y:a[1],vx:a[2],vy:a[3],r:a[4],c:a[5]}));FX=FX.filter(f=>f.ty==='die'||f.loc).concat(m.fx);
 for(const ev of m.ev){const t=ev[0];
  if(t==='h'){const[,x,y,v,c,cr,dy]=ev;if(DN.length<70)DN.push({x:x+(R()-.5)*8,y:dy,v,t:.6,c:cr?'#ffd040':0});if(PT.length<600){glowAt(x,y,c,9+Math.min(10,v*.3),.14);sparks(x,y,2,c,110)}}
  else if(t==='d'){const e=CEN.get(ev[1]);if(e&&!e.dead&&!e.lamp){e.dead=1;FX.push({ty:'die',x:e.x,y:e.y,t:.35,t0:.35,e});const hy=e.y-e.sp.h*.35;for(let i=0;i<(e.tier?26:6);i++){const a=R()*TAU,v=40+R()*90;part(e.x,hy,Math.cos(a)*v,Math.sin(a)*v*.6-20,.35+R()*.3,pk(['70,20,24','40,30,40','120,30,30']),1+RI(2),0,160)}}else if(e)CEN.delete(ev[1])}
  else if(t==='hb'){const q=PLS[ev[2]];if(q)HB.push({ti:ev[1],p:q,t:.28,t0:.28,v:0})}
  else if(t==='to'){if(ev[1]===LPI)TOAST.push({s:ev[2],t:4})}else if(t==='tw'){}
  else if(t==='s')snd(ev[1]);else if(t==='b')banner(ev[1],ev[2],ev[3]);else if(t==='m')music(ev[1]);
  else if(t==='u'){const q=PLS[ev[1]];if(q){q.hurtT=.4;sparks(q.x,q.y-20,8,'255,80,70',130);if(ev[2])DN.push({x:q.x,y:q.y-44,v:'-'+ev[2],t:.8,c:'#ff5a5a',big:1});if(ev[1]===LPI){HURT=ev[3]?1:Math.min(1,.45+ev[2]/40);shake(ev[3]?10:3)}}}}
 // 画面の状態
 if(m.md==='play'&&(MODE==='lvw'))MODE='play';if((m.md==='lv'||m.md==='lvw')&&m.lw!==LPI&&MODE==='play'){MODE='lvw';LVW={pi:m.md==='lv'?0:m.lw}}if(m.md==='chest'&&MODE==='play'&&!CHST&&m.cp!==LPI){MODE='lvw';LVW={pi:m.cp,ch:1}}if(m.md==='play'&&MODE==='chest'&&CHST&&CHST.t>chestTimes(CHST).end)chestClose()}
function cUpdate(dt){updHeal(dt);const now=performance.now();if(MPS.started&&now-CLS>9000){NET.err='ホストとの通信が切れた';MPON=0;NETC=0;MPS.started=0;MODE='lobby';NET.st=3;return}
 // 操作を送る
 let mx=(KEY.d||KEY.arrowright?1:0)-(KEY.a||KEY.arrowleft?1:0),my=(KEY.s||KEY.arrowdown?1:0)-(KEY.w||KEY.arrowup?1:0),mv=1;
 if(JOY.on){const jx=JOY.x-JOY.ox,jy=JOY.y-JOY.oy,jl=hyp(jx,jy),R0=34;if(jl>R0){JOY.ox=JOY.x-jx/jl*R0;JOY.oy=JOY.y-jy/jl*R0}if(jl>4){mx=jx/jl;my=jy/jl;mv=Math.min(1,jl/R0*1.5)}}else if(MP.down&&!TOUCH){const jx=MP.x-LW/2,jy=MP.y-(LH/2-14),jl=hyp(jx,jy);if(jl>10){mx=jx/jl;my=jy/jl}}
 const ml=hyp(mx,my);if(ml>0){mx=mx/ml*mv;my=my/ml*mv}if(MODE!=='play'){mx=0;my=0}const p=P;if(p.dead){mx=0;my=0}
 NET.ib-=dt;const iv=[Math.round(mx*100)/100,Math.round(my*100)/100];if(NET.ib<=0||(iv[0]!==NET.lin0||iv[1]!==NET.lin1)&&NET.ib<.03){NET.ib=rtcOK(MPS.hid)||NET.kind==='bc'?.05:.1;NET.lin0=iv[0];NET.lin1=iv[1];netTo(MPS.hid,{ty:'in',v:iv})}
 // 自分は手元で動かし、届いた位置へ少しずつ寄せる
 if(MODE==='play'&&p.s&&!p.dead){if(hyp(mx,my)>.05){const sp=118*p.s.move;walkTo(p,p.x+mx*sp*dt,p.y+my*sp*dt,0);p.dx=mx;p.dy=my;if(Math.abs(mx)>.1)p.face=mx>0?1:-1;p.walk=(p.walk||0)+dt}else p.walk=0}if(p.sx!=null){p.x+=(p.sx-p.x)*Math.min(1,dt*4);p.y+=(p.sy-p.y)*Math.min(1,dt*4)}
 p.hpLag=p.hpLag==null?p.hp:Math.max(p.hp,p.hpLag-dt*40);p.hurtT=Math.max(0,(p.hurtT||0)-dt);
 for(const q of PLS){if(q===p||q.tx==null)continue;const k=Math.min(1,dt*12);q.x+=(q.tx-q.x)*k;q.y+=(q.ty-q.y)*k;q.hurtT=Math.max(0,(q.hurtT||0)-dt);if(q.walk)q.walk+=dt}
 for(const e of EN){if(e.tx!=null&&!e.dead){const k=Math.min(1,dt*12);e.x+=(e.tx-e.x)*k;e.y+=(e.ty-e.y)*k}if(e.ph!=null)e.ph+=dt*6;e.fl-=dt}
 for(const b of BU){if(b.tr){b.tr.unshift({x:b.x,y:b.y,r:b.rot});if(b.tr.length>7)b.tr.pop()}if(b.g)b.vy+=b.g*dt;if(b.ty!=='bottle'&&b.ty!=='bomb'){b.x+=b.vx*dt;b.y+=b.vy*dt}b.rot=(b.rot||0)+dt*(b.ty==='dumb'?10:b.ty==='oni'?14:0);b.t-=dt;if(b.ty==='bolt'&&R()<.6)part(b.x,b.y,(R()-.5)*20,(R()-.5)*20,.35,b.w.evo?'255,170,90':'190,130,255',4,1)}
 for(const b of EB){b.x+=b.vx*dt;b.y+=b.vy*dt}for(const t of TG)t.t=Math.max(.001,t.t-dt);
 for(const f of FX){f.t-=dt;if(f.ty==='bellw'&&f.rm)f.r=f.rm*(1-f.t/f.t0);if(f.ty==='pool'&&R()<.35)part(f.x+(R()-.5)*f.r*1.4,f.y+(R()-.5)*f.r*.7,(R()-.5)*8,-30-R()*30,.7,R()<.5?'255,190,90':'255,120,50',1+RI(2),0)}FX=FX.filter(f=>f.t>0);for(const[id,e]of CEN)if(e.dead&&!FX.some(f=>f.e===e))CEN.delete(id);
 for(const q of PLS)if(!q.dead)for(const w of q.ws)if(w.k==='poison'&&w.rr&&R()<.4){const a=R()*TAU,r=R()*w.rr;part(q.x+Math.cos(a)*r,q.y-6+Math.sin(a)*r*.8,(R()-.5)*10,-8-R()*10,1,w.evo?'160,60,90':'110,190,90',3+R()*3,2)}
 updPT(dt);for(const d of DN){d.t-=dt;d.y-=dt*24}DN=DN.filter(d=>d.t>0)}
function cEnd(r){MPS.started=0;NETC=0;const P0=P;RESULT={time:r.time,lv:r.lv,kills:r.kills,gold:r.gold,wn:r.wn,won:r.won,ws:P0.ws.map(w=>({...w}))};META.gold+=r.gold;LS.set('battlearena_meta',META);MODE='result';music('m');snd('ls')}

/* --- 部屋の画面 --- */
let MPM={code:'',sel:0};
function mpBtn(lab,x,y,w,h,f,c){g.fillStyle=c||'rgba(40,44,64,.92)';g.beginPath();g.moveTo(x+8,y);g.lineTo(x+w,y);g.lineTo(x+w-8,y+h);g.lineTo(x,y+h);g.fill();tx(lab,x+w/2,y+h/2+5,'#fff','center',13);btn(x,y,w,h,f)}
function mpBg(){g.fillStyle='#07050a';g.fillRect(0,0,UW,UH);const ar=arenaCanvas(),sc=Math.max(UW,UH)/520;g.save();g.globalAlpha=.3;g.translate(UW/2,UH*.6);g.rotate(T*.02);g.scale(sc,sc);g.drawImage(ar,-ar.width/2,-ar.height/2);g.restore();g.globalAlpha=1;const vg=g.createRadialGradient(UW/2,UH/2,UH*.2,UW/2,UH/2,hyp(UW,UH)*.6);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.8)');g.fillStyle=vg;g.fillRect(0,0,UW,UH)}
function drawMpm(){mpBg();g.font='26px '+FP;g.textAlign='center';g.fillStyle='#3a1206';g.fillText('CO-OP',UW/2+2,UH*.2+2);g.fillStyle='#ffc050';g.fillText('CO-OP',UW/2,UH*.2);tx('最大4人で、同じ戦場を生き延びる',UW/2,UH*.2+24,'#c8b0a0','center',12);
 mpBtn('部屋を作る',UW/2-90,UH*.38,180,36,()=>{mpHost()},'rgba(170,40,30,.92)');mpBtn('部屋に入る',UW/2-90,UH*.38+48,180,36,()=>{MODE='mpj';MPM.code=''});mpBtn('◀ 戻る',UW/2-90,UH*.38+96,180,30,()=>{MODE='title'});
 tx('部屋を作ると5桁の番号が出る。仲間はその番号で入る',UW/2,UH*.86,'#8a8098','center',10);tx('通信は無料の公開サーバーで知り合い、つながれば端末どうしで直接やりとりする',UW/2,UH*.86+16,'#6a6078','center',9)}
function drawMpj(){mpBg();tx('部屋の番号',UW/2,UH*.16,'#e8d8c0','center',14);const c=MPM.code;for(let i=0;i<5;i++){const x=UW/2-110+i*46;box(x,UH*.2,38,46,'rgba(30,24,34,.9)');g.fillStyle=i===c.length?'#ffc050':'rgba(255,200,100,.3)';g.fillRect(x,UH*.2+44,38,2);if(c[i])tx(c[i],x+19,UH*.2+33,'#fff','center',22,FP)}
 const ks=['1','2','3','4','5','6','7','8','9','消','0','入'],bw=Math.min(70,UW/6),bh=34,x0=UW/2-bw*1.5-6,y0=UH*.36;ks.forEach((k,i)=>{const x=x0+(i%3)*(bw+6),y=y0+(i/3|0)*(bh+6);const go=k==='入',ok=!go||c.length===5;mpBtn(k==='消'?'消す':go?'入る':k,x,y,bw,bh,()=>mpKey(k),go?(ok?'rgba(170,40,30,.92)':'rgba(60,40,40,.6)'):'rgba(40,44,64,.92)')});
 mpBtn('◀ 戻る',12,UH-40,100,28,()=>{MODE='mpm'})}
function mpKey(k){const c=MPM.code;if(k==='消')MPM.code=c.slice(0,-1);else if(k==='入'){if(c.length===5)mpJoin(c)}else if(c.length<5)MPM.code=c+k;snd('cl')}
function drawLobby(){mpBg();const H=MPS.host;tx(H?'あなたの部屋':'部屋',UW/2,26,'#c8b8a8','center',12);g.font='30px '+FP;g.textAlign='center';g.fillStyle='#ffc050';g.fillText(MPS.code||'-----',UW/2,64);tx('この番号を仲間に伝える',UW/2,82,'#8a8098','center',10);
 const st=NET.st===1?'つないでいます…':NET.st===3?(NET.err||'つながらない'):NET.kind==='bc'?'同じ端末のタブどうしでつながっている':'公開サーバーにつながった';tx(st,UW/2,98,NET.st===3?'#ff8070':'#8ac8a0','center',10);
 if(!H&&NET.st===2&&!MPS.hid){MPS.hiT=(MPS.hiT||0)-1/60;if(MPS.hiT<=0){MPS.hiT=1.5;relay({to:'*',m:{ty:'hi',ci:CHI}})}tx('ホストを探しています…',UW/2,UH*.5,'#c8c0b0','center',12)}
 const n=4,cw=Math.min(150,(UW-40)/n-8),x0=UW/2-(n*cw+(n-1)*8)/2,y0=112,chh=Math.min(200,UH-200);
 for(let i=0;i<n;i++){const q=MPS.pl[i],x=x0+i*(cw+8);box(x,y0,cw,chh,q?'rgba(30,24,34,.92)':'rgba(20,18,24,.5)');g.fillStyle=PCOL[i];g.fillRect(x,y0,cw,2);
  if(!q){tx('空き',x+cw/2,y0+chh/2,'#4a4458','center',12);continue}const c=CHS[q.ci],s=sprite(A.ch[c.k].img,1);if(s.ok){const k=Math.min((cw-16)/s.w,(chh-60)/s.h,1.2);g.drawImage(s.n,x+cw/2-s.w*k/2|0,y0+chh-34-s.h*k|0,s.w*k|0,s.h*k|0)}
  tx(q.nm+(q.id===NET.id?'（自分）':''),x+8,y0+18,PCOL[i],'left',11);if(i===0)tx('ホスト',x+cw-8,y0+18,'#c8a060','right',9);tx(A.ch[c.k].n,x+cw/2,y0+chh-16,'#f0e6d8','center',12);
  if(H&&i>0)tx(rtcOK(q.id)?'直通':NET.kind==='bc'?'同じ端末':'中継',x+cw-8,y0+32,rtcOK(q.id)||NET.kind==='bc'?'#8ae0a0':'#e0c070','right',9);
  if(q.id===NET.id){mpBtn('◀',x+4,y0+chh/2-14,26,28,()=>mpCi(-1));mpBtn('▶',x+cw-30,y0+chh/2-14,26,28,()=>mpCi(1))}}
 const by=y0+chh+12;tx('場所：'+TH[MPS.stg].n,UW/2,by+12,'#e8d8c0','center',13);if(H){mpBtn('◀',UW/2-130,by,30,22,()=>{MPS.stg=STAGES[(STAGES.indexOf(MPS.stg)+5)%6];lobSend()});mpBtn('▶',UW/2+100,by,30,22,()=>{MPS.stg=STAGES[(STAGES.indexOf(MPS.stg)+1)%6];lobSend()})}
 tx('武器・持ち物の枠：'+([6,4,3,3][Math.max(0,MPS.pl.length-1)]||3)+'つずつ　レベルアップは順番に選ぶ',UW/2,by+34,'#8a8098','center',10);
 mpBtn('◀ 抜ける',12,UH-40,100,28,()=>mpLeave());if(H){const ok=MPS.pl.length>=1&&NET.st===2;mpBtn(MPS.pl.length>1?'出発する':'1人で出発',UW-172,UH-42,160,32,()=>{if(ok)mpStart()},ok?'rgba(170,40,30,.92)':'rgba(60,40,40,.6)')}else tx('ホストの出発を待っています',UW-20,UH-22,'#c8b8a8','right',11)}
function mpCi(d){const me=MPS.pl.find(q=>q.id===NET.id);if(!me)return;me.ci=(me.ci+d+CHS.length)%CHS.length;CHI=me.ci;if(MPS.host)lobSend();else netTo(MPS.hid,{ty:'ci',ci:me.ci});snd('cl')}
function drawLvWait(){g.fillStyle='rgba(5,3,8,.55)';g.fillRect(0,0,UW,UH);const q=PLS[LVW&&LVW.pi]||PLS[0];tx((q?q.nm:'')+(LVW&&LVW.ch?' が宝箱を開けています':' がレベルアップを選んでいます'),UW/2,UH*.45,q?PCOL[q.pi]:'#fff','center',15);tx('少し待つ',UW/2,UH*.45+22,'#a8a0b8','center',11)}

/* ===== 入力 ===== */
const lx=cx=>(cx-OX)/CS,ly=cy=>(cy-OY)/CS;
function findBtn(x,y){for(let i=BTN.length-1;i>=0;i--){const b=BTN[i];if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h)return b}return null}
function hitBtn(x,y){const b=findBtn(x,y);if(b){b.f();return 1}return 0}
let PDN=null,PTW=null,HOLD=null;const HOLDT=5;
function warpBase(p){if(!p||p.dead||!MAP)return;glowAt(p.x,p.y-20,'140,200,255',50,.5);p.x=MAP.base.x+(R()-.5)*80;p.y=MAP.base.y+70;p.inv=Math.max(p.inv,1);glowAt(p.x,p.y-20,'140,200,255',70,.7);for(let i=0;i<24;i++){const a=R()*TAU;part(p.x,p.y-16,Math.cos(a)*90,Math.sin(a)*60-30,.8,'170,220,255',2,0)}snd('tn')}
function holdWarp(dt){if(!HOLD)return;const p=LP();if(MODE!=='play'||PAUSE||INF||SHOPO||!p||p.dead){HOLD=null;return}HOLD.t+=dt;if(HOLD.t>=HOLDT){HOLD=null;if(NETC)netTo(MPS.hid,{ty:'warp'});else warpBase(p)}}const TAPMV=12;
let AUD=0;function audioOn(){if(AUD){try{if(AC&&AC.state!=='running')initAudio()}catch(e){}return}AUD=1;try{newAC();music(MODE==='play'?AREA().bgm:'t')}catch(e){}}
cv.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('pointerdown',e=>{audioOn();if(e.pointerType==='touch'&&!TOUCH){TOUCH=1;fit()}const x=lx(e.clientX),y=ly(e.clientY);const b=findBtn(x/US,y/US);if(b){PDN={id:e.pointerId,b,x0:x,y0:y,c:0};return}if(MODE==='char')CSL.sx={x,y};
 if(MODE==='play'&&!PAUSE&&!INF&&!SHOPO&&TW[0]&&!TW[0].dead){const wx=x+CAMX,wy=y+CAMY,t=TW[0];if(Math.abs(wx-t.x)<48&&wy>t.y-200&&wy<t.y+16&&nearBase(LP()))PTW={id:e.pointerId,x0:x,y0:y}}
 if(MODE==='play'&&!PAUSE&&!INF&&!SHOPO){HOLD={id:e.pointerId,x0:x,y0:y,t:0};if(e.pointerType!=='mouse'){Object.assign(JOY,{on:1,id:e.pointerId,ox:x,oy:y,x,y})}else{MP.down=1;MP.x=x;MP.y=y}}});
addEventListener('pointermove',e=>{const x=lx(e.clientX),y=ly(e.clientY);if(PDN&&PDN.id===e.pointerId&&hyp(x-PDN.x0,y-PDN.y0)>TAPMV*US)PDN.c=1;if(PTW&&PTW.id===e.pointerId&&hyp(x-PTW.x0,y-PTW.y0)>TAPMV*US)PTW=null;if(HOLD&&HOLD.id===e.pointerId&&hyp(x-HOLD.x0,y-HOLD.y0)>TAPMV*1.5*US)HOLD=null;if(MODE==='lv'&&e.pointerType==='mouse'&&LVA.pick<0)for(const r of LVR)if(x/US>=r.x&&x/US<=r.x+r.w&&y/US>=r.y&&y/US<=r.y+r.h)SEL=r.i;if(e.pointerId===JOY.id){JOY.x=x;JOY.y=y}MP.x=x;MP.y=y});
const up=e=>{if(HOLD&&HOLD.id===e.pointerId)HOLD=null;if(PDN&&PDN.id===e.pointerId){const b=PDN.b,x=lx(e.clientX)/US,y=ly(e.clientY)/US;if(!PDN.c&&e.type==='pointerup'&&x>=b.x-4&&x<=b.x+b.w+4&&y>=b.y-4&&y<=b.y+b.h+4)b.f();PDN=null}if(PTW&&PTW.id===e.pointerId){if(e.type==='pointerup')openShop();PTW=null}if(MODE==='char'&&CSL.sx){const dx=lx(e.clientX)-CSL.sx.x;if(Math.abs(dx)>40)charGo(SEL+(dx<0?1:-1),dx<0?1:-1);CSL.sx=null}if(e.pointerId===JOY.id){JOY.on=0;JOY.id=-1}if(e.pointerType==='mouse')MP.down=0};addEventListener('pointerup',up);addEventListener('pointercancel',up);
addEventListener('keydown',e=>{audioOn();const k=e.key.toLowerCase();KEY[k]=1;if(MODE==='play'&&!PAUSE&&(k==='e'||k==='b')){if(SHOPO)SHOPO=0;else openShop();return}if(SHOPO&&k==='escape'){SHOPO=0;return}if(VOLP&&(k==='escape'||k==='enter')){VOLP=0;return}
 if(MODE==='lv'){if(k==='arrowdown'||k==='s'||k==='arrowright'||k==='d')SEL=(SEL+1)%LVO.length;if(k==='arrowup'||k==='w'||k==='arrowleft'||k==='a')SEL=(SEL+LVO.length-1)%LVO.length;if(k==='enter'||k===' ')pickOpt(SEL);const n=+k;if(n>=1&&n<=LVO.length)pickOpt(n-1)}
 else if(MODE==='chest'&&(k==='enter'||k===' ')){const tm=chestTimes(CHST);if(CHST.t<tm.end){CHST.t=tm.end;CHST.op=1;for(const it of CHST.items)it.lk=1}else chestClose()}
 else if(INF&&(k==='escape'||k==='enter'||k===' '))INF=null;
 else if(EVL){if(k==='escape'||k==='enter'||k===' ')EVL=0;if(k==='arrowright'||k==='d')EVP++;if(k==='arrowleft'||k==='a')EVP--}
 else if(MODE==='play'&&(k==='escape'||k==='p'))PAUSE=!PAUSE;
 else if(MODE==='title'){if(k==='arrowdown'||k==='s')TS.sel=(TS.sel+1)%4;if(k==='arrowup'||k==='w')TS.sel=(TS.sel+3)%4;if(k==='enter'||k===' '){if(TS.sel===0){MODE='char';SEL=CHI}else if(TS.sel===1)MODE='mpm';else if(TS.sel===2)MODE='shop';else VOLP=1}}
 else if(MODE==='char'){if(k==='arrowright'||k==='d')charGo(SEL+1,1);if(k==='arrowleft'||k==='a')charGo(SEL-1,-1);if(k==='enter'||k===' ')charDecide();if(k==='escape')MODE='title'}
 else if(MODE==='stage'){if(k==='arrowright'||k==='d')SEL=(SEL+1)%STAGES.length;if(k==='arrowleft'||k==='a')SEL=(SEL+STAGES.length-1)%STAGES.length;if(k==='enter'||k===' '){STG=STAGES[SEL];newRun()}if(k==='escape')MODE='char'}
 else if(MODE==='result'&&(k==='enter'||k===' ')&&!MPS.code){MODE='title';music('t')}
 else if(MODE==='mpj'){if(/^[0-9]$/.test(k))mpKey(k);if(k==='backspace')mpKey('消');if(k==='enter')mpKey('入');if(k==='escape')MODE='mpm'}
 if(k==='m'){try{setVol(VOL>0?0:10)}catch(e){}}});
addEventListener('keyup',e=>{KEY[e.key.toLowerCase()]=0});
addEventListener('blur',()=>{for(const k in KEY)KEY[k]=0;if(MODE==='play')PAUSE=1});

/* ===== 回す ===== */
fit();TILE=mkTile(TH.forest);let last=performance.now();
function loop(now){applyBGV();holdWarp(1/60);const dt=Math.min(.05,(now-last)/1000);last=now;update(dt);draw();requestAnimationFrame(loop)}requestAnimationFrame(loop);
window.GM={get SHOPO(){return SHOPO},get VOLP(){return VOLP},set VOLP(v){VOLP=v},get BGV(){return BGV},get CAM(){return[CAMX,CAMY,K]},shopAct,shopBuy:(a)=>shopBuy(LP(),a),shopRows:(t)=>{SHT=t;return shopRows(LP())},get TB(){return TB},get PAUSE(){return PAUSE},get INF(){return INF},get TW(){return TW},get WV(){return WV},get MAP(){return MAP},set LVO(v){LVO=v},setP:i=>{P=PLS[i]},get MPS(){return MPS},get NET(){return NET},get PLS(){return PLS},get NETC(){return NETC},mpHost,mpJoin,mpStart,mpCi,W,hurtP:(d)=>hurtP(d),set PAUSE(v){PAUSE=v},set EVL(v){EVL=v},get P(){return P},get EN(){return EN},get MODE(){return MODE},set MODE(v){MODE=v},get TIME(){return TIME},set TIME(v){TIME=v},get LVO(){return LVO},newRun,update,pickOpt,openChest,addXp,set STG(v){STG=v},set CHI(v){CHI=v},get KILLS(){return KILLS},get PK(){return PK},endRun,stats,get CHST(){return CHST},set CHST(v){CHST=v}};
