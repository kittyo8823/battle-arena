// Battle Arena（仮題）：Card Trail のキャラ・敵・場所・曲を使った、生き残り型のアクション（ヴァンパイアサバイバー風）
// 音（bgm / sfx / newAC / initAudio / AC / setVol / VOL）は Card Trail の「音」の区切りをそのまま読み込んだ大域の関数を使う
/* global bgm sfx newAC initAudio AC setVol VOL */
import A from './assets.json';

/* ===== 基本 ===== */
const R=Math.random,RI=n=>R()*n|0,pk=a=>a[RI(a.length)],cl=(v,a,b)=>v<a?a:v>b?b:v,hyp=Math.hypot,TAU=Math.PI*2;
const SNT={};const snd=(k,gap)=>{const t=performance.now();if(SNT[k]&&t-SNT[k]<(gap||70))return;SNT[k]=t;try{if(typeof sfx==='function')sfx(k)}catch(e){}};
const music=k=>{try{if(typeof bgm==='function')bgm(k)}catch(e){}};
const LS={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};

/* ===== 画面（論理座標 LW×LH を整数倍 K で描く。Card Trail と同じ作り） ===== */
const cv=document.createElement('canvas');document.body.appendChild(cv);const g=cv.getContext('2d');
let LW=800,LH=600,UW=640,UH=480,US=1.25,K=2,CS=1,OX=0,OY=0,TOUCH=matchMedia('(pointer:coarse)').matches?1:0;
function fit(){const w=innerWidth,h=innerHeight;LH=TOUCH?560:600;LW=cl(Math.round(LH*w/h),420,1400);US=LH/(TOUCH?400:480);UW=LW/US;UH=LH/US;CS=Math.min(w/LW,h/LH);K=cl(Math.ceil(CS*(devicePixelRatio||1)),1,4);cv.width=LW*K;cv.height=LH*K;cv.style.width=LW*CS+'px';cv.style.height=LH*CS+'px';OX=(w-LW*CS)/2;OY=(h-LH*CS)/2;cv.style.left=OX+'px';cv.style.top=OY+'px';VIG=null}
addEventListener('resize',fit);
const MKC=(w,h)=>{const c=document.createElement('canvas');c.width=Math.max(1,w);c.height=Math.max(1,h);return c};
const FT='"DotGothic16",monospace',FP='"Press Start 2P",monospace';
function tx(s,x,y,c,al,sz,f){g.font=(sz||12)+'px '+(f||FT);g.textAlign=al||'left';g.fillStyle='rgba(0,0,0,.45)';g.fillText(s,x+1,y+1);g.fillStyle=c;g.fillText(s,x,y)}
function box(x,y,w,h,c){g.fillStyle=c||'rgba(12,14,22,.86)';g.fillRect(x,y,w,h)}
let BTN=[];const btn=(x,y,w,h,f)=>BTN.push({x,y,w,h,f});

/* ===== 絵（Card Trail の SPR を半分＝1マス1点にして使う） ===== */
const SP={};/* k → {n,f,wn,wf,w,h} */
function sprite(url,sc){const key=url.length+url.slice(-48)+sc;if(SP[key])return SP[key];const o=SP[key]={ok:0};const im=new Image();im.onload=()=>{const w=Math.round(im.width*sc),h=Math.round(im.height*sc);
 const mk=(fl,wh)=>{const c=MKC(w,h),x=c.getContext('2d');x.imageSmoothingEnabled=false;if(fl){x.translate(w,0);x.scale(-1,1)}x.drawImage(im,0,0,w,h);if(wh){x.setTransform(1,0,0,1,0,0);x.globalCompositeOperation='source-in';x.fillStyle='#fff';x.fillRect(0,0,w,h)}return c};
 Object.assign(o,{n:mk(0,0),f:mk(1,0),wn:mk(0,1),wf:mk(1,1),w,h,ok:1})};im.src=url;return o}
const eSpr=(k,tier)=>sprite(A.spr[k],tier>=1?1:.5),cSpr=k=>sprite(A.ch[k].img,.5);
const IMG={};function img(url){if(!url)return null;if(IMG[url])return IMG[url];const i=new Image();i.src=url;return IMG[url]=i}
const ric=k=>A.rl[k]&&img(A.rl[k].img);
function icon(k,x,y,s,glow){const i=ric(k);if(glow){const gr=g.createRadialGradient(x+s/2,y+s/2,0,x+s/2,y+s/2,s*.7);gr.addColorStop(0,'rgba(255,214,110,.55)');gr.addColorStop(1,'rgba(255,214,110,0)');g.fillStyle=gr;g.fillRect(x-s*.2,y-s*.2,s*1.4,s*1.4)}if(i&&i.complete&&i.naturalWidth)g.drawImage(i,x,y,s,s)}
// 小さな絵（経験の結晶・金貨）
function pix(rows,pal){const h=rows.length,w=rows[0].length,c=MKC(w,h),x=c.getContext('2d');rows.forEach((r,j)=>[...r].forEach((ch,i)=>{if(ch!=='.'){x.fillStyle=pal[ch];x.fillRect(i,j,1,1)}}));return c}
const GEMR=['..a..','.abb.','abbbc','.bbc.','..c..'];
const GEM=[pix(GEMR,{a:'#bfe4ff',b:'#4a8ee0',c:'#24507e'}),pix(GEMR,{a:'#c8ffcf',b:'#3fae5a',c:'#1f5e30'}),pix(GEMR,{a:'#ffd0d6',b:'#d0384c',c:'#6e1824'}),pix(GEMR,{a:'#fff0c0',b:'#e0a830',c:'#7a5a14'})];
const COIN=pix(['.aab.','abbbc','abdbc','abbbc','.bcc.'],{a:'#fff2b0',b:'#e8b830',c:'#9a6e14',d:'#b88820'});

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
 {k:'pl',w:'sword',hp:120,b:{might:.1},col:'#a8323e',lt:'#ff9a7a',ep:'大兜の戦士',lore:'重い長剣を腰の高さで振り抜く。押し寄せる群れも、ひと薙ぎで道を開く。',d:'筋力に優れた戦士。ダメージ+10%'},
 {k:'si',w:'knife',hp:100,b:{cd:.05,move:.05},col:'#2f6a4a',lt:'#8ae0a8',ep:'外套の影',lore:'包帯の手に短剣を握る。足を止めず、進む先へ刃を投げ続ける。',d:'身軽な毒使い。待ち時間-5%・移動+5%'},
 {k:'sm',w:'moon',hp:110,b:{area:.1},col:'#7a2a34',lt:'#e8a0a8',ep:'居合の剣士',lore:'中段に構えた刀から、三日月の斬撃が飛ぶ。一列に並んだ敵ほど斬りやすい。',d:'居合の剣士。範囲+10%'},
 {k:'nn',w:'book',hp:90,b:{dur:.15,move:-.08},col:'#4a3a7a',lt:'#c0a8ff',ep:'名を捨てた魔導士',lore:'座ったまま、背後の魔導書が勝手に頁をめくる。歩みは遅いが、弾は敵を追う。',d:'老いた魔導士。持続+15%・移動-8%'},
 {k:'hori',w:'dumb',hp:140,b:{regen:.3},col:'#4a6a2a',lt:'#c8f08a',ep:'眠れる力自慢',lore:'迷彩の肌着に緑の杖。放り上げたダンベルが、落ちる先の敵をまとめて潰す。',d:'よく眠る男。最大HPが高く、回復+0.3/秒'},
 {k:'neb',w:'jelly',hp:100,b:{pspd:.15},col:'#2a5a7a',lt:'#8ad8ff',ep:'クラゲを連れた少女',lore:'淡く光るクラゲが周りを巡る。近づくものは触手に絡め取られる。',d:'クラゲを連れた少女。弾の速さ+15%'},
 {k:'seres',w:'spear',hp:100,b:{luck:.2},col:'#8a7a4a',lt:'#fff0c0',ep:'霊騎士を従える少女',lore:'白い頭巾で目を隠す。見えない騎士の光の槍が、敵の頭上から落ちる。',d:'霊騎士を従える少女。幸運+20%'}];

/* ===== 武器（最大Lv8）。i は Lv2〜8 で増える値 ===== */
const W={
 sword:{n:'薙ぎ払い',ic:'stsw',d:'向いている方を横に薙ぐ',b:{dmg:12,cd:1.35,amt:1,area:1,spd:1,dur:1,pierce:99},i:[{amt:1},{dmg:5},{dmg:5,area:.1},{dmg:5},{dmg:5,area:.1},{dmg:5},{dmg:5}],evo:{p:'might',n:'覇王の薙ぎ',ic:'burn2'}},
 knife:{n:'投げナイフ',ic:'kunai',d:'進む方へ小刀を投げる',b:{dmg:7,cd:.95,amt:1,area:1,spd:1,dur:1,pierce:1},i:[{amt:1},{amt:1,dmg:3},{amt:1},{pierce:1},{amt:1},{amt:1,dmg:3},{pierce:1}],evo:{p:'cd',n:'千本の苦無',ic:'snake2'}},
 moon:{n:'三日月',ic:'sya',d:'貫く三日月の斬撃を飛ばす',b:{dmg:14,cd:1.7,amt:1,area:1,spd:1,dur:1,pierce:99},i:[{dmg:5},{amt:1},{area:.15},{dmg:6},{amt:1},{area:.15},{dmg:8}],evo:{p:'area',n:'月影一閃',ic:'sya2'}},
 book:{n:'魔導の弾',ic:'grim',d:'近くの敵へ追う弾を撃つ',b:{dmg:10,cd:1.15,amt:1,area:1,spd:1,dur:1,pierce:1},i:[{amt:1},{cd:-.15},{amt:1},{dmg:6},{amt:1},{pierce:1},{dmg:8}],evo:{p:'dur',n:'禁書の嵐',ic:'grim2'}},
 dumb:{n:'ダンベル',ic:'dumb',d:'上へ放り、落ちて当たる',b:{dmg:18,cd:1.7,amt:1,area:1,spd:1,dur:1,pierce:3},i:[{amt:1},{dmg:8},{pierce:2},{amt:1},{dmg:8},{area:.2},{amt:1}],evo:{p:'mhp',n:'黄金のダンベル',ic:'eyemask2'}},
 jelly:{n:'クラゲの輪',ic:'ccore',d:'周りをクラゲが回る',b:{dmg:9,cd:3,amt:1,area:1,spd:1,dur:3,pierce:99},i:[{amt:1},{spd:.3},{dmg:4},{amt:1},{dur:.6},{area:.2},{amt:1}],evo:{p:'pspd',n:'星海のクラゲ',ic:'ccore2'}},
 spear:{n:'光の槍',ic:'whood',d:'敵の上から光の槍が落ちる',b:{dmg:16,cd:2,amt:2,area:1,spd:1,dur:1,pierce:99},i:[{amt:1},{dmg:6},{amt:1},{area:.25},{amt:1},{dmg:8},{amt:1}],evo:{p:'luck',n:'天の槍',ic:'nbat'}},
 poison:{n:'毒の霧',ic:'snake',d:'周りの敵を毒の霧が蝕む',b:{dmg:5,cd:.7,amt:1,area:1,spd:1,dur:1,pierce:99},i:[{area:.2},{dmg:2},{cd:-.08},{area:.2},{dmg:2},{cd:-.08},{area:.2}],evo:{p:'regen',n:'命喰らいの霧',ic:'fcore'}},
 fire:{n:'火炎瓶',ic:'ember',d:'敵の近くに炎の溜まりを作る',b:{dmg:7,cd:3,amt:1,area:1,spd:1,dur:2,pierce:99},i:[{amt:1},{dmg:3},{area:.2},{amt:1},{dur:.6},{dmg:4},{area:.2}],evo:{p:'amt',n:'業火の瓶',ic:'pumpkin'}}};
const WINC=i=>Object.entries(i).map(([k,v])=>({amt:'数',dmg:'ダメージ',cd:'待ち時間',area:'範囲',spd:'速さ',dur:'持続',pierce:'貫通'})[k]+(k==='area'||k==='spd'?(v>0?'+':'')+Math.round(v*100)+'%':k==='cd'||k==='dur'?(v>0?'+':'')+v+'秒':'+'+v)).join('・');
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
function stats(){const p=P,c=CHS[CHI],s={might:1,armor:0,mhp:c.hp,regen:0,cd:1,area:1,dur:1,amt:0,move:1,magnet:1,luck:1,growth:1,pspd:1,greed:1};
 for(const k in META.up){const u=MU[k],n=META.up[k];if(!u)continue;if(k==='armor')s.armor+=u.v*n;else if(k==='regen')s.regen+=u.v*n;else if(k==='cd')s.cd-=u.v*n;else if(k==='mhp')s.mhp*=1+u.v*n;else s[k]+=u.v*n}
 for(const k in c.b){if(k==='cd')s.cd-=c.b[k];else if(k==='regen')s.regen+=c.b[k];else s[k]+=c.b[k]}
 for(const k in p.pas){const n=p.pas[k];if(k==='might')s.might+=.1*n;else if(k==='armor')s.armor+=n;else if(k==='mhp')s.mhp*=1+.2*n;else if(k==='regen')s.regen+=.2*n;else if(k==='cd')s.cd-=.08*n;else if(k==='area')s.area+=.1*n;else if(k==='dur')s.dur+=.1*n;else if(k==='amt')s.amt+=n;else if(k==='move')s.move+=.1*n;else if(k==='magnet')s.magnet+=.25*n;else if(k==='luck')s.luck+=.1*n;else if(k==='growth')s.growth+=.08*n;else if(k==='pspd')s.pspd+=.1*n}
 s.mhp=Math.round(s.mhp);const om=p.s?p.s.mhp:s.mhp;p.s=s;if(s.mhp>om)p.hp+=s.mhp-om;p.hp=Math.min(p.hp,s.mhp)}
function ws(w){const d=W[w.k],s=Object.assign({},d.b);for(let i=0;i<w.lv-1;i++)for(const k in d.i[i])s[k]+=d.i[i][k];const ps=P.s;
 return {dmg:s.dmg*ps.might*(w.evo?1.6:1),cd:Math.max(.15,s.cd*ps.cd*(w.evo?.7:1)),amt:s.amt+ps.amt+(w.evo?1:0),area:s.area*ps.area*(w.evo?1.25:1),spd:s.spd*ps.pspd,dur:s.dur*ps.dur,pierce:s.pierce+(w.evo?2:0)}}

/* ===== 始める ===== */
function newRun(){TM=TH[STG];TILE=mkTile(TM);EN=[];BU=[];FX=[];DN=[];PK=[];TIME=0;KILLS=0;GOLD=0;SPWN=0;EVT={};DQ=[];BANK=0;LVQ=0;LVO=null;CHST=null;PAUSE=0;RESULT=null;
 const c=CHS[CHI];P={x:0,y:0,hp:1,lv:1,xp:0,face:1,dx:1,dy:0,inv:0,ws:[{k:c.w,lv:1,t:.5,dm:0}],pas:{},hit:0,walk:0,dead:0};stats();P.hp=P.s.mhp;
 for(let i=0;i<5;i++)spawnLamp();MODE='play';banner(TM.n,TM.sub);music(AREA().bgm)}
const AREA=()=>A.AR.find(a=>a.k===STG);
const xpNeed=l=>l<20?5+(l-1)*10:l<40?195+(l-20)*13:455+(l-40)*16;

/* ===== 敵 ===== */
const SPD={hum:34,beast:50,heavy:24,blob:30,fly:46,cast:32,stat:26};
function addE(k,x,y,tier,o){const d=A.en[k];if(!d)return null;const m=TIME/60,av=(d.hp[0]+d.hp[1])/2;
 const hp=tier===3?1e9:tier===2?av*3.2*(1+m*.3):tier===1?av*1.1*(1+m*.25):Math.max(3,av*.17*(1+m*.2));
 const sp=eSpr(k,tier),r=tier===2?26:tier===1?18:cl(Math.round(d.w*.12),7,16);
 const e=Object.assign({k,d,x,y,tier,hp,mhp:hp,spd:(SPD[d.cat]||32)*(tier===3?4.2:tier===2?.9:tier===1?.85:1)*(.9+R()*.2),dmg:tier===3?9999:tier===2?20+m*2.2:tier===1?12+m*1.8:5+m*1.1,r,sp,kx:0,ky:0,fl:0,hc:{},ph:R()*TAU},o||{});EN.push(e);return e}
function edgePos(){const a=R()*TAU,rr=hyp(LW,LH)/2+30;return[P.x+Math.cos(a)*rr,P.y+Math.sin(a)*rr]}
function spawnLamp(){let x,y;const a=R()*TAU,d=250+R()*350;x=P.x+Math.cos(a)*d;y=P.y+Math.sin(a)*d;EN.push({lamp:1,x,y,hp:1,mhp:1,r:10,hc:{},kx:0,ky:0,fl:0})}
function spawner(dt){const m=TIME/60,ar=AREA(),nm=ar.nm;const n=Math.min(nm.length,2+Math.floor(m*1.3));const pool=nm.slice(Math.max(0,n-5),n);
 const want=Math.min(320,30+m*20);const live=EN.reduce((a,e)=>a+(!e.lamp&&!e.tier&&!e.sw?1:0),0);SPWN-=dt;
 if(SPWN<=0){SPWN=.35;const k=Math.min(10,Math.ceil((want-live)/3));for(let i=0;i<k;i++){const[x,y]=edgePos();addE(pk(pool),x,y,0)}}
 // 決まった時刻の出来事
 const at=(s,f)=>{if(TIME>=s&&!EVT[s]){EVT[s]=1;f()}};
 for(let s=90;s<1800;s+=90)at(s,()=>{const gr=pk(ar.el);const[x,y]=edgePos();const e=addE(pk(gr),x,y,1);if(e)banner(e.d.n,'強い気配が近づく',1.6)});
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
function hitE(e,d,w,kx,ky){if(e.dead)return;if(e.lamp){e.dead=1;lampDrop(e);return}const v=Math.round(d*(.9+R()*.2));e.hp-=v;e.fl=.1;if(w)w.dm+=Math.min(v,e.hp+v);
 if(e.tier<2&&!e.sw){const kb=e.tier?.3:1;e.kx+=(kx||0)*60*kb;e.ky+=(ky||0)*60*kb}if(DN.length<70)DN.push({x:e.x+(R()-.5)*8,y:e.y-e.sp.h*.6,v,t:.6});snd('spa',90);if(e.hp<=0)killE(e)}
function killE(e){e.dead=1;KILLS++;const m=TIME/60;FX.push({ty:'die',x:e.x,y:e.y,t:.35,t0:.35,e});
 if(e.tier===2||e.tier===1){PK.push({ty:'chest',x:e.x,y:e.y,big:e.tier===2});if(e.tier===2&&!EN.some(o=>!o.dead&&o.tier===2))music(AREA().bgm)}
 const v=e.tier===2?100:e.tier===1?25:m>12&&R()<.3?5:m>5&&R()<.25?2:1;if(e.tier!==3)gem(e.x,e.y,v);if(R()<.012*P.s.luck)PK.push({ty:'coin',x:e.x+6,y:e.y,v:1})}
function gem(x,y,v){PK.push({ty:'xp',x,y,v,c:gc(v)})}
// 遠くに残った結晶は1つの赤い結晶にまとめ、画面の近くに置く
let BANK=0;function bankGems(){const D=hyp(LW,LH)*.9;for(const k of PK)if(k.ty==='xp'&&!k.bk&&hyp(k.x-P.x,k.y-P.y)>D){BANK+=k.v;k.got=1}PK=PK.filter(k=>!k.got);if(BANK>0){let r=PK.find(k=>k.bk);if(!r||hyp(r.x-P.x,r.y-P.y)>D){if(r)r.got=1;const a=R()*TAU;r={ty:'xp',bk:1,x:P.x+Math.cos(a)*LW*.35,y:P.y+Math.sin(a)*LH*.35,v:0,c:3};PK.push(r)}r.v+=BANK;BANK=0}}
const gc=v=>v>=50?3:v>=10?2:v>=2?1:0;
function lampDrop(e){FX.push({ty:'puff',x:e.x,y:e.y,t:.3,t0:.3});const r=R();PK.push(r<.6?{ty:'coin',x:e.x,y:e.y,v:R()<.1?10:1}:r<.85?{ty:'food',x:e.x,y:e.y}:{ty:'mag',x:e.x,y:e.y})}
function hurtP(d){const p=P;if(p.inv>0||p.dead)return;const v=Math.max(1,Math.round(d-p.s.armor));p.hp-=v;p.inv=.3;p.hit=.15;snd('ea',150);if(p.hp<=0){p.hp=0;p.dead=1;endRun()}}

/* ===== 武器を使う ===== */
function nearest(n,rmax){const a=[];for(const e of EN){if(e.dead||e.lamp)continue;const d=hyp(e.x-P.x,e.y-P.y);if(d<(rmax||420))a.push([d,e])}a.sort((x,y)=>x[0]-y[0]);return a.slice(0,n).map(x=>x[1])}
function onScreen(){return EN.filter(e=>!e.dead&&!e.lamp&&Math.abs(e.x-P.x)<LW/2&&Math.abs(e.y-P.y)<LH/2)}
function fire(w,s,dt){const p=P;
 if(w.k==='jelly'){w.on=(w.on||0)-dt;if(w.on<=0&&!w.evo){w.t-=dt;if(w.t<=0){w.on=s.dur;w.t=s.cd}}const act=w.evo||w.on>0;w.act=act;if(!act)return;w.ang=(w.ang||0)+dt*3*s.spd;const rr=58*s.area;
  for(let i=0;i<s.amt;i++){const a=w.ang+i/s.amt*TAU,x=p.x+Math.cos(a)*rr,y=p.y-10+Math.sin(a)*rr;near(x,y,12*s.area,e=>{if((e.hc.j||0)<T){e.hc.j=T+.45;hitE(e,s.dmg,w,Math.cos(a),Math.sin(a))}})}return}
 if(w.k==='poison'){w.t-=dt;const rr=46*s.area;w.rr=rr;if(w.t<=0){w.t=s.cd;near(p.x,p.y,rr,e=>{const d=hyp(e.x-p.x,e.y-p.y)||1;hitE(e,s.dmg,w,(e.x-p.x)/d*.4,(e.y-p.y)/d*.4)});if(w.evo&&R()<.3)p.hp=Math.min(p.s.mhp,p.hp+1)}return}
 w.t-=dt;if(w.t>0)return;w.t=s.cd;
 if(w.k==='sword'){for(let i=0;i<s.amt;i++){const side=i%2===0?P.face:-P.face;later(i*.12,()=>{const ww=96*s.area,hh=(w.evo?40:28)*s.area,cx=P.x+side*(ww/2+8),cy=P.y-14-(i>1?20:0);FX.push({ty:'slash',x:cx,y:cy,w:ww,h:hh,s:side,t:.2,t0:.2,ev:w.evo});near(cx,cy,ww/2,e=>{if(Math.abs(e.y-cy)<hh/2+e.r&&Math.abs(e.x-cx)<ww/2+e.r)hitE(e,s.dmg,w,side,0)})})}snd('wsw',100)}
 else if(w.k==='knife'){const d=hyp(p.dx,p.dy)||1,vx=p.dx/d,vy=p.dy/d;for(let i=0;i<s.amt;i++){const o=(i-(s.amt-1)/2)*7;later(i*(w.evo?.03:.07),()=>BU.push({ty:'knife',x:P.x-vy*o,y:P.y-14+vx*o,vx:vx*340*s.spd,vy:vy*340*s.spd,r:5,dmg:s.dmg,pc:s.pierce,t:1.1,w,hit:new Set()}))}snd('wkn',90)}
 else if(w.k==='moon'){for(let i=0;i<s.amt;i++){const dir=i%2?-p.face:p.face;const vy=i>=2?(i===2?-1:1):0,vx=vy?0:dir;BU.push({ty:'moon',x:p.x,y:p.y-14,vx:vx*230*s.spd,vy:vy*230*s.spd,r:16*s.area,dmg:s.dmg,pc:s.pierce,t:.85*s.dur,w,hit:new Set()})}snd('spk',100)}
 else if(w.k==='book'){const ts=nearest(s.amt);for(let i=0;i<s.amt;i++){const e=ts[i%Math.max(1,ts.length)];let vx=p.face,vy=0;if(e){const d=hyp(e.x-p.x,e.y-p.y)||1;vx=(e.x-p.x)/d;vy=(e.y-p.y)/d}BU.push({ty:'bolt',x:p.x,y:p.y-18,vx:vx*260*s.spd,vy:vy*260*s.spd,r:6,dmg:s.dmg,pc:s.pierce,t:2,w,hit:new Set(),tg:e,hm:1})}snd('horb',100)}
 else if(w.k==='dumb'){for(let i=0;i<s.amt;i++)BU.push({ty:'dumb',x:p.x,y:p.y-20,vx:(R()-.5)*160+(i-(s.amt-1)/2)*50,vy:-330*s.spd,g:620,r:10*s.area,dmg:s.dmg,pc:s.pierce,t:3,w,hit:new Set(),rot:0});snd('wsw',100)}
 else if(w.k==='spear'){const sc=onScreen();for(let i=0;i<s.amt;i++){const e=pk(sc);const x=e?e.x:p.x+(R()-.5)*LW*.6,y=e?e.y:p.y+(R()-.5)*LH*.6;FX.push({ty:'spear',x,y,t:.4,t0:.4,r:24*s.area,dmg:s.dmg,w,ev:w.evo})}}
 else if(w.k==='fire'){const sc=onScreen();for(let i=0;i<s.amt;i++){const e=pk(sc);const x=e?e.x+(R()-.5)*30:p.x+(R()-.5)*200,y=e?e.y+(R()-.5)*30:p.y+(R()-.5)*160;BU.push({ty:'bottle',x:p.x,y:p.y-20,sx:p.x,sy:p.y-20,tx:x,ty2:y,t:.5,t0:.5,w,s})}}}

let DQ=[];const later=(t,f)=>DQ.push({t,f});
/* ===== 経験・レベルアップ・宝箱 ===== */
function addXp(v){const p=P;p.xp+=v*p.s.growth;while(p.xp>=xpNeed(p.lv)){p.xp-=xpNeed(p.lv);p.lv++;LVQ++}if(LVQ&&MODE==='play')openLv()}
function canEvo(w){const d=W[w.k];return !w.evo&&w.lv>=8&&P.pas[d.evo.p]}
function lvChoices(){const p=P,o=[];
 for(const w of p.ws)if(w.lv<8)o.push({t:'w',k:w.k,wt:10});if(p.ws.length<6)for(const k in W)if(!p.ws.some(w=>w.k===k))o.push({t:'w',k,wt:6});
 for(const k in p.pas)if(p.pas[k]<PS[k].m)o.push({t:'p',k,wt:8});if(Object.keys(p.pas).length<6)for(const k in PS)if(!(k in p.pas))o.push({t:'p',k,wt:5});
 const n=R()<.15*(p.s.luck-.9)?4:3,r=[];while(r.length<n&&o.length){const tot=o.reduce((a,x)=>a+x.wt,0);let q=R()*tot,i=0;for(;i<o.length;i++){q-=o[i].wt;if(q<=0)break}r.push(o.splice(Math.min(i,o.length-1),1)[0])}
 if(!r.length)r.push({t:'g'},{t:'h'});return r}
function openLv(){if(MODE!=='play')return;LVQ--;MODE='lv';LVO=lvChoices();SEL=0;snd('tn')}
function takeOpt(o){const p=P;if(o.t==='w'){const w=p.ws.find(w=>w.k===o.k);if(w)w.lv++;else p.ws.push({k:o.k,lv:1,t:.2,dm:0})}else if(o.t==='p'){p.pas[o.k]=(p.pas[o.k]||0)+1;stats()}else if(o.t==='g')GOLD+=25;else if(o.t==='h')p.hp=Math.min(p.s.mhp,p.hp+30)}
function optInfo(o){if(o.t==='w'){const d=W[o.k],w=P.ws.find(w=>w.k===o.k);return{ic:d.ic,n:d.n,lv:w?'Lv'+(w.lv+1):'新しい武器',d:w?WINC(d.i[w.lv-1]):d.d}}if(o.t==='p'){const d=PS[o.k],n=P.pas[o.k]||0;return{ic:d.ic,n:d.n,lv:n?'Lv'+(n+1):'新しい持ち物',d:d.d}}return o.t==='g'?{ic:'purse',n:'金貨',lv:'',d:'金貨+25'}:{ic:'cheese',n:'チーズ',lv:'',d:'HP+30'}}
function openChest(big){const p=P,n=big?(R()<.3*p.s.luck?5:3):(R()<.08*p.s.luck?3:1),items=[];
 for(let i=0;i<n;i++){const ev=p.ws.find(canEvo);if(ev){ev.evo=1;items.push({ev:1,k:ev.k});continue}const up=p.ws.filter(w=>w.lv<8).map(w=>({t:'w',k:w.k})).concat(Object.keys(p.pas).filter(k=>p.pas[k]<PS[k].m).map(k=>({t:'p',k})));if(up.length){const o=pk(up);items.push(Object.assign({info:optInfo(o)},o));takeOpt(o)}else{items.push({t:'g',info:optInfo({t:'g'})});takeOpt({t:'g'})}}
 const gold=Math.round((big?60:20)*(1+TIME/600)*p.s.greed);GOLD+=gold;CHST={items,gold,t:0};MODE='chest';snd('wn')}

/* ===== 更新 ===== */
const KEY={},JOY={on:0,id:-1,ox:0,oy:0,x:0,y:0},MP={down:0,x:0,y:0};
function update(dt){T+=dt;if(CHST)CHST.t+=dt;if(BANNER){BANNER.t-=dt;if(BANNER.t<=0)BANNER=null}if(MODE!=='play'||PAUSE)return;const p=P;TIME+=dt;
 // 動く
 let mx=(KEY.d||KEY.arrowright?1:0)-(KEY.a||KEY.arrowleft?1:0),my=(KEY.s||KEY.arrowdown?1:0)-(KEY.w||KEY.arrowup?1:0),mv=1;
 if(JOY.on){const jx=JOY.x-JOY.ox,jy=JOY.y-JOY.oy,jl=hyp(jx,jy),R0=34;if(jl>R0){JOY.ox=JOY.x-jx/jl*R0;JOY.oy=JOY.y-jy/jl*R0}if(jl>4){mx=jx;my=jy;mv=Math.min(1,jl/R0*1.5)}}
 else if(MP.down&&!TOUCH){const jx=MP.x-LW/2,jy=MP.y-(LH/2-14);if(hyp(jx,jy)>10){mx=jx;my=jy}}
 const ml=hyp(mx,my);if(ml>0){const sp=92*p.s.move*mv;p.x+=mx/ml*sp*dt;p.y+=my/ml*sp*dt;p.dx=mx/ml;p.dy=my/ml;if(Math.abs(mx)>.1)p.face=mx>0?1:-1;p.walk+=dt}else p.walk=0;
 p.inv-=dt;p.hit-=dt;p.hp=Math.min(p.s.mhp,p.hp+p.s.regen*dt);
 spawner(dt);grid();
 for(const q of DQ)q.t-=dt;const dq=DQ.filter(q=>q.t<=0);DQ=DQ.filter(q=>q.t>0);dq.forEach(q=>q.f());
 for(const w of p.ws)fire(w,ws(w),dt);
 // 敵
 for(const e of EN){if(e.dead)continue;if(e.lamp){continue}e.fl-=dt;e.ph+=dt*6;
  if(e.sw){e.x+=e.sw.vx*dt;e.y+=e.sw.vy*dt;e.sw.t-=dt;if(e.sw.t<=0)e.dead=1}
  else{const dx=p.x-e.x,dy=p.y-e.y,d=hyp(dx,dy)||1;e.x+=(dx/d*e.spd+e.kx)*dt;e.y+=(dy/d*e.spd+e.ky)*dt;e.kx*=Math.pow(.02,dt);e.ky*=Math.pow(.02,dt);
   if(!e.tier&&d>hyp(LW,LH)*.85){const[x,y]=(()=>{const a=Math.atan2(p.dy,p.dx)+(R()-.5)*1.6,rr=hyp(LW,LH)/2+30;return[p.x+Math.cos(a)*rr,p.y+Math.sin(a)*rr]})();e.x=x;e.y=y}}
  if(hyp(p.x-e.x,p.y-e.y)<e.r+9)hurtP(e.dmg)}
 // 押し合い（軽く）
 for(const e of EN){if(e.dead||e.lamp||e.sw||e.tier===3)continue;near(e.x,e.y,e.r,o=>{if(o===e||o.lamp||o.sw)return;const dx=e.x-o.x,dy=e.y-o.y,d=hyp(dx,dy);const m=(e.r+o.r)*.8;if(d<m&&d>.01){const k=(m-d)*.25;e.x+=dx/d*k;e.y+=dy/d*k}})}
 for(let i=EN.length-1;i>=0;i--){const e=EN[i];if(e.dead&&!FX.some(f=>f.e===e))EN.splice(i,1);else if(e.lamp&&hyp(e.x-p.x,e.y-p.y)>1400)EN.splice(i,1)}
 // 弾
 for(const b of BU){b.t-=dt;
  if(b.ty==='bottle'){const k=1-b.t/b.t0;b.x=b.sx+(b.tx-b.sx)*k;b.y=b.sy+(b.ty2-b.sy)*k-Math.sin(k*Math.PI)*60;if(b.t<=0)FX.push({ty:'pool',x:b.tx,y:b.ty2,r:30*b.s.area*(b.w.evo?1.3:1),t:b.s.dur,t0:b.s.dur,tk:0,dmg:b.s.dmg,w:b.w});continue}
  if(b.hm&&b.tg&&!b.tg.dead){const dx=b.tg.x-b.x,dy=b.tg.y-12-b.y,d=hyp(dx,dy)||1,sp=hyp(b.vx,b.vy);b.vx+=(dx/d*sp-b.vx)*dt*5;b.vy+=(dy/d*sp-b.vy)*dt*5}
  if(b.g){b.vy+=b.g*dt;b.rot+=dt*10}b.x+=b.vx*dt;b.y+=b.vy*dt;
  near(b.x,b.y+12,b.r,e=>{if(b.hit.has(e)||b.pc<=0)return;b.hit.add(e);b.pc--;const d=hyp(b.vx,b.vy)||1;hitE(e,b.dmg,b.w,b.vx/d,b.vy/d);if(b.pc<=0){b.t=0;return false}})}
 BU=BU.filter(b=>b.t>0);
 // 演出と、時間で効くもの
 for(const f of FX){f.t-=dt;if(f.ty==='spear'&&!f.done&&f.t<=f.t0*.35){f.done=1;near(f.x,f.y,f.r,e=>hitE(e,f.dmg,f.w,0,0));snd('horb',120)}
  if(f.ty==='pool'){f.tk-=dt;if(f.tk<=0){f.tk=.4;near(f.x,f.y,f.r,e=>hitE(e,f.dmg,f.w,0,0))}}}
 FX=FX.filter(f=>f.t>0);for(const d of DN){d.t-=dt;d.y-=dt*24}DN=DN.filter(d=>d.t>0);
 // 拾う
 const mg=40*p.s.magnet;for(const k of PK){const d=hyp(k.x-p.x,k.y-p.y);if(k.ty==='chest'){if(d<20){k.got=1;openChest(k.big);break}continue}
  if(d<mg||k.mg){k.mg=1;k.sp=(k.sp||60)+dt*500;const dx=p.x-k.x,dy=p.y-6-k.y,dd=hyp(dx,dy)||1;k.x+=dx/dd*Math.min(dd,k.sp*dt);k.y+=dy/dd*Math.min(dd,k.sp*dt)}
  if(hyp(k.x-p.x,k.y-p.y+6)<12){k.got=1;if(k.ty==='xp'){addXp(k.v);snd('pk',40)}else if(k.ty==='coin'){GOLD+=Math.round(k.v*p.s.greed);snd('cl',60)}else if(k.ty==='food'){p.hp=Math.min(p.s.mhp,p.hp+30);snd('ps')}else if(k.ty==='mag'){for(const o of PK)if(o.ty==='xp')o.mg=1;snd('tn')}}}
 PK=PK.filter(k=>!k.got);if((T*2|0)!==((T-dt)*2|0))bankGems();
}
function endRun(){MODE='result';const g2=GOLD;META.gold+=g2;const bk=STG;META.bt=META.bt||{};META.bt[bk]=Math.max(META.bt[bk]||0,TIME);META.bc=META.bc||{};const o=META.bc[CHI]||{t:0,lv:0,k:0};META.bc[CHI]={t:Math.max(o.t,TIME),lv:Math.max(o.lv,P.lv),k:o.k+KILLS};LS.set('battlearena_meta',META);RESULT={time:TIME,lv:P.lv,kills:KILLS,gold:g2,ws:P.ws.map(w=>({...w}))};music('m');snd('ls')}
function banner(s,sub,t){BANNER={s,sub:sub||'',t:t||2.2}}

/* ===== 描画 ===== */
const mm=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(Math.floor(s%60)).padStart(2,'0');
let PMODE='';function draw(){if(MODE!==PMODE){if(MODE==='title')titleEnter();if(MODE==='char'){CSL.from=-1;CSL.t0=T-1;CSL.bx=0}PMODE=MODE}g.setTransform(K,0,0,K,0,0);g.imageSmoothingEnabled=false;BTN=[];const ui=()=>{g.setTransform(K*US,0,0,K*US,0,0);g.imageSmoothingEnabled=false};
 if(MODE==='title'){ui();return drawTitle()}if(MODE==='char'){ui();return drawChar()}if(MODE==='stage'){ui();return drawStage()}if(MODE==='shop'){ui();return drawShop()}
 drawWorld();ui();drawHUD();if(MODE==='lv')drawLv();if(MODE==='chest')drawChest();if(PAUSE)drawPause();if(MODE==='result')drawResult()}
function drawWorld(){const p=P;CAMX=Math.round(p.x-LW/2);CAMY=Math.round(p.y-LH/2-10);
 const ts=TILE.width,sx=-((CAMX%ts)+ts)%ts,sy=-((CAMY%ts)+ts)%ts;for(let x=sx;x<LW;x+=ts)for(let y=sy;y<LH;y+=ts)g.drawImage(TILE,x,y);
 const X=x=>Math.round(x-CAMX),Y=y=>Math.round(y-CAMY);
 // 毒の霧・炎の溜まり（地面）
 for(const w of p.ws)if(w.k==='poison'&&w.rr){const r=w.rr;const gr=g.createRadialGradient(X(p.x),Y(p.y-6),r*.2,X(p.x),Y(p.y-6),r);gr.addColorStop(0,'rgba(90,170,80,0)');gr.addColorStop(.75,`rgba(90,170,80,${.16+Math.sin(T*4)*.04})`);gr.addColorStop(1,'rgba(90,170,80,0)');g.fillStyle=gr;g.beginPath();g.ellipse(X(p.x),Y(p.y-6),r,r*.8,0,0,TAU);g.fill()}
 for(const f of FX)if(f.ty==='pool'){const a=Math.min(1,f.t*2);for(let i=0;i<10;i++){const an=i/10*TAU+T*.8,rr=f.r*(.4+.5*((i*37)%10)/10);const fx=X(f.x+Math.cos(an)*rr),fy=Y(f.y+Math.sin(an)*rr*.6),h=6+Math.sin(T*12+i)*3;g.fillStyle=`rgba(255,${120+i*8},40,${.55*a})`;g.fillRect(fx-2,fy-h,4,h);g.fillStyle=`rgba(255,220,120,${.5*a})`;g.fillRect(fx-1,fy-h+1,2,2)}
  const gr=g.createRadialGradient(X(f.x),Y(f.y),0,X(f.x),Y(f.y),f.r);gr.addColorStop(0,`rgba(255,130,40,${.3*a})`);gr.addColorStop(1,'rgba(255,90,30,0)');g.fillStyle=gr;g.beginPath();g.ellipse(X(f.x),Y(f.y),f.r,f.r*.6,0,0,TAU);g.fill()}
 // 拾い物
 for(const k of PK){const x=X(k.x),y=Y(k.y);if(x<-20||y<-20||x>LW+20||y>LH+20)continue;const b=Math.sin(T*4+k.x)*1.5;
  if(k.ty==='xp')g.drawImage(GEM[k.c],x-2,y-3+b|0);else if(k.ty==='coin')g.drawImage(COIN,x-2,y-3+b|0);else if(k.ty==='food')icon('cheese',x-8,y-12+b,16);else if(k.ty==='mag'){const gr=g.createRadialGradient(x,y-4,0,x,y-4,10);gr.addColorStop(0,'rgba(150,210,255,.9)');gr.addColorStop(1,'rgba(150,210,255,0)');g.fillStyle=gr;g.fillRect(x-10,y-14,20,20);g.fillStyle='#d8f0ff';g.fillRect(x-2,y-6,4,4)}
  else if(k.ty==='chest'){const s=k.big?28:20;const gr=g.createRadialGradient(x,y-s/2,0,x,y-s/2,s*1.2);gr.addColorStop(0,'rgba(255,214,110,.4)');gr.addColorStop(1,'rgba(255,214,110,0)');g.fillStyle=gr;g.fillRect(x-s*1.2,y-s*1.7,s*2.4,s*2.4);
   g.fillStyle='#5a3a1c';g.fillRect(x-s/2,y-s*.7,s,s*.7);g.fillStyle='#7a5228';g.fillRect(x-s/2,y-s*.95,s,s*.35);g.fillStyle='#d8b050';g.fillRect(x-s/2,y-s*.62,s,2);g.fillRect(x-2,y-s*.7,4,5);g.fillStyle='#3a2410';g.fillRect(x-s/2,y-2,s,2)}}
 // 体（足元の y の順に）
 const list=EN.filter(e=>Math.abs(e.x-p.x)<LW/2+120&&Math.abs(e.y-p.y)<LH/2+160);list.sort((a,b)=>a.y-b.y);list.push(p);
 for(const e of list){const x=X(e.x),y=Y(e.y);g.fillStyle='rgba(0,0,0,.28)';g.beginPath();g.ellipse(x,y,(e===p?10:e.r||8),(e===p?4:(e.r||8)*.4),0,0,TAU);g.fill()}
 for(const e of list){const x=X(e.x),y=Y(e.y);
  if(e===p){const s=cSpr(CHS[CHI].k);if(!s.ok)continue;const bob=p.walk?Math.abs(Math.sin(p.walk*11))*2:0,fl=p.face<0;const c=p.hit>0?(fl?s.wf:s.wn):(fl?s.f:s.n);if(p.inv>0&&(T*20|0)%2)g.globalAlpha=.6;g.drawImage(c,x-s.w/2|0,y-s.h+2-bob|0);g.globalAlpha=1;continue}
  if(e.lamp){icon('lamp',x-10,y-24+Math.sin(T*3+e.x)*1,20);continue}
  const s=e.sp;if(!s.ok)continue;const dying=e.dead;const fx=FX.find(f=>f.e===e);let a=1,sq=1;if(dying&&fx){a=fx.t/fx.t0;sq=a}
  const fl=p.x>e.x;const c=e.fl>0?(fl?s.wf:s.wn):(fl?s.f:s.n);const bob=Math.sin(e.ph)*(e.d&&e.d.cat==='fly'?3:1),st=1+Math.sin(e.ph)*.03;
  g.globalAlpha=a;if(e.tier===3){g.globalAlpha=.85}const w=s.w*(2-st),h=s.h*st*sq;g.drawImage(c,x-w/2|0,y-h+2-(e.d&&e.d.cat==='fly'?8+bob:Math.max(0,bob))|0,w|0,h|0);g.globalAlpha=1;
  if(e.tier===1||e.tier===2){const bw=e.tier===2?60:40;g.fillStyle='rgba(0,0,0,.5)';g.fillRect(x-bw/2,y+6,bw,3);g.fillStyle='#c03040';g.fillRect(x-bw/2,y+6,bw*Math.max(0,e.hp/e.mhp),3)}}
 // 弾
 for(const b of BU){const x=X(b.x),y=Y(b.y);
  if(b.ty==='knife'){const a=Math.atan2(b.vy,b.vx);g.save();g.translate(x,y);g.rotate(a);g.fillStyle='#d8dce4';g.fillRect(-2,-1,9,2);g.fillStyle='#8a5a30';g.fillRect(-6,-1,4,2);g.fillStyle=b.w.evo?'rgba(150,230,170,.45)':'rgba(220,230,255,.35)';g.fillRect(-16,-1,10,2);g.restore()}
  else if(b.ty==='moon'){const a=Math.atan2(b.vy,b.vx),r=b.r,al=Math.min(1,b.t*3);g.save();g.translate(x,y);g.rotate(a);g.globalAlpha=al;g.fillStyle=b.w.evo?'rgba(200,190,255,.85)':'rgba(190,225,255,.85)';g.beginPath();g.arc(0,0,r,-1.25,1.25);g.arc(-r*.45,0,r*.85,1.1,-1.1,true);g.fill();g.fillStyle='rgba(255,255,255,.9)';g.beginPath();g.arc(0,0,r,-.9,.9);g.arc(-r*.2,0,r*.85,.85,-.85,true);g.fill();g.globalAlpha=1;g.restore()}
  else if(b.ty==='bolt'){const gr=g.createRadialGradient(x,y,0,x,y,12);gr.addColorStop(0,b.w.evo?'rgba(255,210,140,.95)':'rgba(220,170,255,.95)');gr.addColorStop(.4,b.w.evo?'rgba(230,120,60,.5)':'rgba(150,80,230,.5)');gr.addColorStop(1,'rgba(120,60,200,0)');g.fillStyle=gr;g.fillRect(x-12,y-12,24,24);g.fillStyle='#fff';g.fillRect(x-1,y-1,3,3)}
  else if(b.ty==='dumb'){g.save();g.translate(x,y);g.rotate(b.rot);const s=b.r/10;g.scale(s,s);g.fillStyle=b.w.evo?'#e8c050':'#7a8088';g.fillRect(-9,-1,18,3);g.fillStyle=b.w.evo?'#b88a20':'#3a3e46';g.fillRect(-12,-5,5,11);g.fillRect(7,-5,5,11);g.fillStyle='rgba(255,255,255,.35)';g.fillRect(-12,-5,5,2);g.fillRect(7,-5,5,2);g.restore()}
  else if(b.ty==='bottle'){g.fillStyle='#8a3a2a';g.fillRect(x-2,y-4,5,7);g.fillStyle='#e0a050';g.fillRect(x-1,y-7,3,3)}}
 // 回るクラゲ
 for(const w of p.ws)if(w.k==='jelly'&&w.act){const s=ws(w),rr=58*s.area;for(let i=0;i<s.amt;i++){const a=w.ang+i/s.amt*TAU,x=X(p.x+Math.cos(a)*rr),y=Y(p.y-10+Math.sin(a)*rr),r=9*s.area;const gr=g.createRadialGradient(x,y,0,x,y,r*1.8);gr.addColorStop(0,w.evo?'rgba(190,170,255,.5)':'rgba(255,150,200,.45)');gr.addColorStop(1,'rgba(255,150,200,0)');g.fillStyle=gr;g.fillRect(x-r*2,y-r*2,r*4,r*4);
  g.fillStyle=w.evo?'rgba(200,190,255,.85)':'rgba(255,170,210,.85)';g.beginPath();g.arc(x,y-2,r*.7,Math.PI,0);g.fill();g.fillRect(x-r*.7,y-2,r*1.4,2);g.fillStyle='rgba(255,210,230,.7)';for(let j=-1;j<=1;j++)g.fillRect(x+j*r*.4-.5,y,1,4+Math.sin(T*8+j+i)*2)}}
 // 演出
 for(const f of FX){const x=X(f.x),y=Y(f.y),k=f.t/f.t0;
  if(f.ty==='slash'){g.save();g.globalAlpha=k;g.translate(x,y);g.scale(f.s,1);const w=f.w,h=f.h;const gr=g.createLinearGradient(-w/2,0,w/2,0);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.6,f.ev?'rgba(255,190,120,.7)':'rgba(255,240,210,.6)');gr.addColorStop(1,'rgba(255,255,255,.95)');g.fillStyle=gr;g.beginPath();g.ellipse(0,0,w/2,h/2*(.5+k*.5),0,Math.PI,TAU);g.ellipse(0,-h*.1,w/2*.95,h/2*.25,0,TAU,Math.PI,true);g.fill();g.restore();g.globalAlpha=1}
  else if(f.ty==='spear'){const hit=f.t<=f.t0*.35,r=f.r;if(!hit){g.fillStyle=`rgba(255,240,200,${.25*(1-k)+.1})`;g.beginPath();g.ellipse(x,y,r*(1-k*.5),r*.5*(1-k*.5),0,0,TAU);g.fill();const top=y-LH,yy=top+(y-top)*Math.min(1,(1-k)/0.65);g.fillStyle=f.ev?'rgba(255,220,140,.9)':'rgba(230,240,255,.9)';g.fillRect(x-1,yy-60,3,60);g.fillRect(x-3,yy-6,7,6)}
   else{const a=f.t/(f.t0*.35);const gr=g.createRadialGradient(x,y-10,0,x,y-10,r*1.4);gr.addColorStop(0,`rgba(255,250,230,${.9*a})`);gr.addColorStop(1,'rgba(255,230,160,0)');g.fillStyle=gr;g.fillRect(x-r*1.5,y-r*1.6,r*3,r*3);g.fillStyle=`rgba(255,255,240,${.8*a})`;g.fillRect(x-1,y-70,3,70);for(let i=0;i<6;i++){const an=i/6*TAU+f.x;g.fillRect(x+Math.cos(an)*r*(1.2-a*.5)|0,y+Math.sin(an)*r*.5*(1.2-a*.5)|0,2,1)}}}
  else if(f.ty==='die'){const r=(1-k)*16;g.fillStyle=`rgba(255,240,220,${k*.7})`;for(let i=0;i<6;i++){const an=i/6*TAU;g.fillRect(x+Math.cos(an)*r|0,y-10+Math.sin(an)*r*.6|0,2,2)}}
  else if(f.ty==='puff'){g.fillStyle=`rgba(255,200,120,${k*.6})`;g.beginPath();g.arc(x,y-10,(1-k)*14+4,0,TAU);g.fill()}}
 // ダメージの数字
 g.font='8px '+FP;g.textAlign='center';for(const d of DN){g.globalAlpha=Math.min(1,d.t*3);g.fillStyle='rgba(0,0,0,.6)';g.fillText(d.v,X(d.x)+1,Y(d.y)+1);g.fillStyle='#fff';g.fillText(d.v,X(d.x),Y(d.y))}g.globalAlpha=1;
 // 暗さ（場所の雰囲気）
 if(TM.dark){if(!VIG){VIG=MKC(LW,LH);const x=VIG.getContext('2d'),gr=x.createRadialGradient(LW/2,LH/2,LH*.25,LW/2,LH/2,hyp(LW,LH)*.55);gr.addColorStop(0,'rgba(0,0,10,0)');gr.addColorStop(1,`rgba(0,0,10,${TM.dark})`);x.fillStyle=gr;x.fillRect(0,0,LW,LH)}g.drawImage(VIG,0,0)}
 // 自分のHP
 const px=X(p.x),py=Y(p.y);g.fillStyle='rgba(0,0,0,.6)';g.fillRect(px-14,py+5,28,3);g.fillStyle='#d83848';g.fillRect(px-14,py+5,28*p.hp/p.s.mhp,3)}
function drawHUD(){const p=P;
 // 経験
 g.fillStyle='#10131c';g.fillRect(0,0,UW,9);g.fillStyle='#3a6ad8';g.fillRect(0,0,UW*Math.min(1,p.xp/xpNeed(p.lv)),9);g.fillStyle='rgba(255,255,255,.15)';g.fillRect(0,0,UW*Math.min(1,p.xp/xpNeed(p.lv)),2);tx('Lv '+p.lv,UW-6,8,'#fff','right',8,FP);
 tx(mm(TIME),UW/2,30,'#fff','center',14,FP);
 // 武器・持ち物
 p.ws.forEach((w,i)=>{const x=4+i*19,y=13;box(x,y,17,17,'rgba(10,12,20,.7)');icon(w.evo?W[w.k].evo.ic:W[w.k].ic,x+1,y+1,15,w.evo);if(!w.evo){g.fillStyle='#ffd23f';for(let j=0;j<w.lv;j++)g.fillRect(x+1+j*2,y+16,1,1)}});
 Object.keys(p.pas).forEach((k,i)=>{const x=4+i*19,y=33;box(x,y,17,17,'rgba(10,12,20,.7)');icon(PS[k].ic,x+1,y+1,15);g.fillStyle='#8ac8ff';for(let j=0;j<p.pas[k];j++)g.fillRect(x+1+j*2,y+16,1,1)});
 tx('撃破 '+KILLS,UW-8,26,'#e8e0d0','right',11);tx('G '+GOLD,UW-8,40,'#ffd860','right',11);
 // 一時停止
 box(UW-34,46,28,18,'rgba(10,12,20,.6)');tx('II',UW-20,59,'#c8d0e0','center',9,FP);btn(UW-40,44,40,26,()=>{if(MODE==='play')PAUSE=!PAUSE});
 if(BANNER){const a=Math.min(1,BANNER.t*2);g.globalAlpha=a;tx(BANNER.s,UW/2,UH*.3,'#f0e6c8','center',20);if(BANNER.sub)tx(BANNER.sub,UW/2,UH*.3+18,'#b8b0a8','center',11);g.globalAlpha=1}
 if(JOY.on&&MODE==='play'){g.strokeStyle='rgba(255,255,255,.25)';g.lineWidth=1.5;g.beginPath();g.arc(JOY.ox/US,JOY.oy/US,34/US,0,TAU);g.stroke();g.fillStyle='rgba(240,230,200,.4)';g.beginPath();g.arc(JOY.x/US,JOY.y/US,13/US,0,TAU);g.fill()}}
function panel(w,h){const x=(UW-w)/2|0,y=(UH-h)/2|0;g.fillStyle='rgba(0,0,0,.45)';g.fillRect(0,0,UW,UH);box(x,y,w,h,'rgba(16,18,28,.95)');g.fillStyle='rgba(216,184,96,.5)';g.fillRect(x,y,w,1);g.fillRect(x,y+h-1,w,1);return[x,y]}
function drawLv(){const n=LVO.length,w=Math.min(UW-20,330),h=50+n*52;const[x,y]=panel(w,h);tx('レベルアップ',UW/2,y+26,'#ffd860','center',15);
 LVO.forEach((o,i)=>{const r=optInfo(o),yy=y+40+i*52,on=SEL===i;box(x+8,yy,w-16,46,on?'rgba(70,60,40,.9)':'rgba(34,36,50,.9)');icon(r.ic,x+14,yy+7,32);tx(r.n,x+54,yy+19,'#f0e6c8','left',12);tx(r.lv,x+w-14,yy+19,r.lv.startsWith('新')?'#8ae0a0':'#c8c0b0','right',10);tx(r.d,x+54,yy+36,'#b8c0d0','left',10);
  btn(x+8,yy,w-16,46,()=>pickOpt(i))})}
function pickOpt(i){if(MODE!=='lv')return;takeOpt(LVO[i]);MODE='play';LVO=null;if(LVQ>0)openLv()}
function drawChest(){const c=CHST;const w=Math.min(UW-20,300),h=74+c.items.length*30;const[x,y]=panel(w,h);tx('宝箱',UW/2,y+24,'#ffd860','center',15);
 c.items.forEach((it,i)=>{if(c.t<.3+i*.35)return;const yy=y+36+i*30;if(it.ev){const d=W[it.k];icon(d.evo.ic,x+14,yy,24,1);tx(d.evo.n,x+46,yy+11,'#ffd860','left',12);tx(d.n+' が進化した',x+46,yy+24,'#c8c0b0','left',10)}else{icon(it.info.ic,x+14,yy,24);tx(it.info.n,x+46,yy+11,'#f0e6c8','left',12);tx(it.info.lv?it.info.lv:it.info.d,x+46,yy+24,'#b8c0d0','left',10)}});
 tx('金貨 +'+c.gold,UW/2,y+h-26,'#ffd860','center',11);tx(TOUCH?'押して続ける':'クリックで続ける',UW/2,y+h-10,'#8890a0','center',9);btn(0,0,UW,UH,()=>{if(c.t>.3+c.items.length*.35){MODE='play';CHST=null;if(LVQ>0)openLv()}})}
function drawPause(){const p=P,w=Math.min(UW-20,360),h=280;const[x,y]=panel(w,h);tx('一時停止',UW/2,y+24,'#f0e6c8','center',15);
 p.ws.forEach((wp,i)=>{const yy=y+40+i*20;icon(wp.evo?W[wp.k].evo.ic:W[wp.k].ic,x+12,yy,16,wp.evo);tx((wp.evo?W[wp.k].evo.n:W[wp.k].n)+'  Lv'+wp.lv,x+32,yy+12,'#e8e0d0','left',10)});
 Object.keys(p.pas).forEach((k,i)=>{const yy=y+40+i*20;icon(PS[k].ic,x+w/2+6,yy,16);tx(PS[k].n+'  Lv'+p.pas[k],x+w/2+26,yy+12,'#e8e0d0','left',10)});
 const s=p.s;tx(`力 ${Math.round(s.might*100)}%　鎧 ${s.armor}　最大HP ${s.mhp}　回復 ${s.regen.toFixed(1)}　待ち時間 ${Math.round(s.cd*100)}%`,UW/2,y+180,'#a8b0c0','center',9);tx(`範囲 ${Math.round(s.area*100)}%　持続 ${Math.round(s.dur*100)}%　移動 ${Math.round(s.move*100)}%　磁力 ${Math.round(s.magnet*100)}%　幸運 ${Math.round(s.luck*100)}%`,UW/2,y+194,'#a8b0c0','center',9);
 const b=(lab,yy,f,c)=>{box(UW/2-70,yy,140,24,c||'rgba(50,56,80,.95)');tx(lab,UW/2,yy+16,'#fff','center',11);btn(UW/2-70,yy,140,24,f)};b('再開',y+208,()=>{PAUSE=0});b('諦める',y+240,()=>{PAUSE=0;P.dead=1;endRun()},'rgba(90,40,40,.95)')}
function drawResult(){const r=RESULT,w=Math.min(UW-20,380),h=290;const[x,y]=panel(w,h);const ok=r.time>=1800;tx(ok?'生き延びた':'力尽きた',UW/2,y+30,ok?'#ffd860':'#e05a5a','center',18);
 tx(`${TM.n}　${A.ch[CHS[CHI].k].n}`,UW/2,y+50,'#b8b0a8','center',10);tx(`生存 ${mm(r.time)}　Lv ${r.lv}　撃破 ${r.kills}　金貨 ${r.gold}`,UW/2,y+70,'#f0e6c8','center',12);
 tx('武器',x+20,y+94,'#8890a0','left',9);tx('与えたダメージ',x+w-20,y+94,'#8890a0','right',9);r.ws.forEach((wp,i)=>{const yy=y+100+i*22;icon(wp.evo?W[wp.k].evo.ic:W[wp.k].ic,x+18,yy,18,wp.evo);tx((wp.evo?W[wp.k].evo.n:W[wp.k].n)+'  Lv'+wp.lv,x+42,yy+13,'#e8e0d0','left',10);tx(String(Math.round(wp.dm)),x+w-20,yy+13,'#e8e0d0','right',10)});
 box(UW/2-70,y+h-36,140,26,'rgba(50,56,80,.95)');tx('戻る',UW/2,y+h-18,'#fff','center',12);btn(UW/2-70,y+h-36,140,26,()=>{MODE='title';music('t')})}
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
 const ba=cl((t-.8)/.4,0,1);g.globalAlpha=ba;const by=UH*.17+fs*1.55+22;g.fillStyle='rgba(150,20,16,.85)';g.beginPath();g.moveTo(UW/2-118,by);g.lineTo(UW/2+124,by);g.lineTo(UW/2+118,by+20);g.lineTo(UW/2-124,by+20);g.fill();tx('30分、生き延びろ',UW/2,by+15,'#ffe0c0','center',12);g.globalAlpha=1;
 // メニュー：斜めの札
 const ma=cl((t-1.1)/.4,0,1);g.globalAlpha=ma;const items=[['開始',()=>{MODE='char';SEL=CHI}],['強化',()=>{MODE='shop'}],['音　'+(typeof VOL!=='undefined'&&VOL>0?'あり':'なし'),()=>{try{setVol(VOL>0?0:10)}catch(e){}}]];
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
 if(wide){tx((SEL+1)+' / '+CHS.length,px,py,'#6a7088','left',10,FP);tx(A.ch[c.k].n,px+(1-ee)*12,py+34,'#fff4e0','left',28);tx(c.ep,px,py+56,c.lt,'left',13);
  wrapT(c.lore,px,py+80,pw,'#b8bed0',11,16);
  // 能力
  const st=[['最大HP',c.hp/140],['ダメージ',1+(c.b.might||0)],['待ち時間',1-(c.b.cd||0)],['範囲',1+(c.b.area||0)],['移動',1+(c.b.move||0)],['持続',1+(c.b.dur||0)],['弾の速さ',1+(c.b.pspd||0)],['幸運',1+(c.b.luck||0)]].filter((s,i)=>i<2||s[1]!==1);
  st.forEach(([n,v],i)=>{const y=py+120+i*17;tx(n,px,y+8,'#9098b0','left',10);const bw=pw-110;g.fillStyle='rgba(255,255,255,.07)';g.fillRect(px+70,y,bw,6);const f=n==='最大HP'?v:v/1.3;g.fillStyle=v>1||n==='待ち時間'&&v<1?c.lt:'#8890a8';g.fillRect(px+70,y,bw*cl(f,0,1)*Math.min(1,t*3),6);tx(n==='最大HP'?String(c.hp):Math.round(v*100)+'%',px+pw,y+8,'#e8e0d0','right',10)});
  // 初めの武器
  const wy=py+128+st.length*17;const w=W[c.w];box(px,wy,pw,64,'rgba(255,255,255,.04)');g.fillStyle=hexA(c.lt,.6);g.fillRect(px,wy,2,64);icon(w.ic,px+10,wy+8,30);tx('初めの武器',px+48,wy+14,'#7a8098','left',9);tx(w.n,px+48,wy+30,'#f0e6c8','left',13);tx(w.d,px+48,wy+46,'#a8b0c4','left',10);
  icon(w.evo.ic,px+pw-28,wy+8,20,1);tx('進化',px+pw-18,wy+40,'#c8a860','center',9);tx(w.evo.n,px+pw-18,wy+53,'#e0c888','center',9);
  const r=META.bc&&META.bc[SEL];if(r)tx(`最長生存 ${mm(r.t)}　最高 Lv${r.lv}　撃破 ${r.k}`,px,wy+82,'#8890a8','left',10)}
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
const THT={};
function drawStage(){bgScene();tx('場所を選ぶ',UW/2,30,'#f0e6c8','center',15);const cols=UW>560?3:2,cw=Math.min(240,(UW-20)/cols),ch=Math.min(140,(UH-120)/Math.ceil(6/cols)-6);
 STAGES.forEach((k,i)=>{const t=TH[k],col=i%cols,row=i/cols|0,x=(UW-cols*cw)/2+col*cw,y=44+row*(ch+6);if(!THT[k])THT[k]=mkTile(t);g.save();g.beginPath();g.rect(x+3,y,cw-6,ch);g.clip();g.drawImage(THT[k],x+3,y);const ar=A.AR.find(a=>a.k===k);ar.nm.slice(0,3).forEach((ek,j)=>{const s=eSpr(ek,0);if(s.ok)g.drawImage(s.f,x+18+j*44|0,y+ch-12-s.h*.7|0,s.w*.7|0,s.h*.7|0)});g.restore();
  if(SEL===i){g.fillStyle='rgba(255,214,110,.8)';g.fillRect(x+3,y,cw-6,2);g.fillRect(x+3,y+ch-2,cw-6,2)}box(x+3,y,cw-6,18,'rgba(10,12,20,.7)');tx(t.n,x+9,y+13,'#f0e6c8','left',11);const bt=META.bt&&META.bt[k];if(bt)tx('最長 '+mm(bt),x+cw-9,y+13,bt>=1800?'#ffd860':'#a8b0c0','right',9);btn(x+3,y,cw-6,ch,()=>{if(SEL===i){STG=k;newRun()}else SEL=i})});
 tx(TH[STAGES[SEL]].sub,UW/2,UH-40,'#b8c0d0','center',10);const b=(lab,x,f)=>{box(x,UH-30,110,24,'rgba(40,44,64,.92)');tx(lab,x+55,UH-13,'#fff','center',11);btn(x,UH-30,110,24,f)};b('戻る',UW/2-120,()=>{MODE='char';SEL=CHI});b('出発',UW/2+10,()=>{STG=STAGES[SEL];newRun()})}
function drawShop(){bgScene();tx('強化',UW/2,30,'#f0e6c8','center',15);tx('金貨 '+META.gold,UW/2,48,'#ffd860','center',11);const ks=Object.keys(MU),cols=UW>620?4:UW>460?3:2,cw=Math.min(150,(UW-20)/cols);
 ks.forEach((k,i)=>{const u=MU[k],n=META.up[k]||0,col=i%cols,row=i/cols|0,x=(UW-cols*cw)/2+col*cw,y=58+row*58,cost=u.c*(n+1),can=n<u.m&&META.gold>=cost;box(x+3,y,cw-6,52,'rgba(30,34,50,.88)');icon(u.ic,x+8,y+6,24);tx(u.n,x+36,y+16,'#f0e6c8','left',11);
  g.fillStyle='#3a3e50';for(let j=0;j<u.m;j++){g.fillStyle=j<n?'#ffd860':'#3a3e50';g.fillRect(x+36+j*7,y+22,5,4)}tx(u.d,x+8,y+40,'#a8b0c0','left',9);tx(n>=u.m?'最大':cost+'G',x+cw-9,y+16,n>=u.m?'#8ae0a0':can?'#ffd860':'#806860','right',9);
  btn(x+3,y,cw-6,52,()=>{if(!can)return;META.gold-=cost;META.up[k]=n+1;LS.set('battlearena_meta',META);snd('tn')})});
 box(UW/2-55,UH-30,110,24,'rgba(40,44,64,.92)');tx('戻る',UW/2,UH-13,'#fff','center',11);btn(UW/2-55,UH-30,110,24,()=>{MODE='title'})}

/* ===== 入力 ===== */
const lx=cx=>(cx-OX)/CS,ly=cy=>(cy-OY)/CS;
function hitBtn(x,y){for(let i=BTN.length-1;i>=0;i--){const b=BTN[i];if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h){b.f();return 1}}return 0}
let AUD=0;function audioOn(){if(AUD){try{if(AC&&AC.state!=='running')initAudio()}catch(e){}return}AUD=1;try{newAC();music(MODE==='play'?AREA().bgm:'t')}catch(e){}}
cv.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('pointerdown',e=>{audioOn();if(e.pointerType==='touch'&&!TOUCH){TOUCH=1;fit()}const x=lx(e.clientX),y=ly(e.clientY);if(hitBtn(x/US,y/US))return;if(MODE==='char')CSL.sx={x,y};
 if(MODE==='play'&&!PAUSE){if(e.pointerType!=='mouse'){Object.assign(JOY,{on:1,id:e.pointerId,ox:x,oy:y,x,y})}else{MP.down=1;MP.x=x;MP.y=y}}});
addEventListener('pointermove',e=>{const x=lx(e.clientX),y=ly(e.clientY);if(e.pointerId===JOY.id){JOY.x=x;JOY.y=y}MP.x=x;MP.y=y});
const up=e=>{if(MODE==='char'&&CSL.sx){const dx=lx(e.clientX)-CSL.sx.x;if(Math.abs(dx)>40)charGo(SEL+(dx<0?1:-1),dx<0?1:-1);CSL.sx=null}if(e.pointerId===JOY.id){JOY.on=0;JOY.id=-1}if(e.pointerType==='mouse')MP.down=0};addEventListener('pointerup',up);addEventListener('pointercancel',up);
addEventListener('keydown',e=>{audioOn();const k=e.key.toLowerCase();KEY[k]=1;
 if(MODE==='lv'){if(k==='arrowdown'||k==='s')SEL=(SEL+1)%LVO.length;if(k==='arrowup'||k==='w')SEL=(SEL+LVO.length-1)%LVO.length;if(k==='enter'||k===' ')pickOpt(SEL);const n=+k;if(n>=1&&n<=LVO.length)pickOpt(n-1)}
 else if(MODE==='chest'&&(k==='enter'||k===' ')){if(CHST.t>.3+CHST.items.length*.35){MODE='play';CHST=null;if(LVQ>0)openLv()}}
 else if(MODE==='play'&&(k==='escape'||k==='p'))PAUSE=!PAUSE;
 else if(MODE==='title'){if(k==='arrowdown'||k==='s')TS.sel=(TS.sel+1)%3;if(k==='arrowup'||k==='w')TS.sel=(TS.sel+2)%3;if(k==='enter'||k===' '){if(TS.sel===0){MODE='char';SEL=CHI}else if(TS.sel===1)MODE='shop';else{try{setVol(VOL>0?0:10)}catch(e){}}}}
 else if(MODE==='char'){if(k==='arrowright'||k==='d')charGo(SEL+1,1);if(k==='arrowleft'||k==='a')charGo(SEL-1,-1);if(k==='enter'||k===' ')charDecide();if(k==='escape')MODE='title'}
 else if(MODE==='stage'){if(k==='arrowright'||k==='d')SEL=(SEL+1)%STAGES.length;if(k==='arrowleft'||k==='a')SEL=(SEL+STAGES.length-1)%STAGES.length;if(k==='enter'||k===' '){STG=STAGES[SEL];newRun()}if(k==='escape')MODE='char'}
 else if(MODE==='result'&&(k==='enter'||k===' ')){MODE='title';music('t')}
 if(k==='m'){try{setVol(VOL>0?0:10)}catch(e){}}});
addEventListener('keyup',e=>{KEY[e.key.toLowerCase()]=0});
addEventListener('blur',()=>{for(const k in KEY)KEY[k]=0;if(MODE==='play')PAUSE=1});

/* ===== 回す ===== */
fit();TILE=mkTile(TH.forest);let last=performance.now();
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;update(dt);draw();requestAnimationFrame(loop)}requestAnimationFrame(loop);
window.GM={get P(){return P},get EN(){return EN},get MODE(){return MODE},set MODE(v){MODE=v},get TIME(){return TIME},set TIME(v){TIME=v},get LVO(){return LVO},newRun,update,pickOpt,openChest,addXp,set STG(v){STG=v},set CHI(v){CHI=v},get KILLS(){return KILLS},get PK(){return PK},endRun,stats,get CHST(){return CHST},set CHST(v){CHST=v}};
