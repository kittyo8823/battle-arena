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
function newRun(){TM=TH[STG];TILE=mkTile(TM);EN=[];BU=[];FX=[];DN=[];PK=[];INF=null;LOUT=null;EVL=0;TIME=0;KILLS=0;GOLD=0;SPWN=0;EVT={};DQ=[];BANK=0;PT=[];EB=[];TG=[];SHAKE=0;LVQ=0;LVO=null;CHST=null;PAUSE=0;RESULT=null;
 const c=CHS[CHI];P={x:0,y:0,hp:1,lv:1,xp:0,face:1,dx:1,dy:0,inv:0,ws:[{k:c.w,lv:1,t:.5,dm:0}],pas:{},hit:0,walk:0,dead:0};stats();P.hp=P.s.mhp;
 for(let i=0;i<5;i++)spawnLamp();MODE='play';banner(TM.n,TM.sub);music(AREA().bgm)}
const AREA=()=>A.AR.find(a=>a.k===STG);
const xpNeed=l=>l<20?5+(l-1)*10:l<40?195+(l-20)*13:455+(l-40)*16;

/* ===== 敵 ===== */
const SPD={hum:34,beast:50,heavy:24,blob:30,fly:46,cast:32,stat:26};
function addE(k,x,y,tier,o){const d=A.en[k];if(!d)return null;const m=TIME/60,av=(d.hp[0]+d.hp[1])/2;
 const hp=tier===3?1e9:tier===2?av*6.5*(1+m*.4):tier===1?av*2.2*(1+m*.35):Math.max(4,av*.3*(1+m*.32));
 const sp=eSpr(k,tier),r=tier===2?26:tier===1?18:cl(Math.round(d.w*.12),7,16);
 const e=Object.assign({k,d,x,y,tier,hp,mhp:hp,spd:(SPD[d.cat]||32)*(tier===3?4.2:tier===2?.95:tier===1?.9:1.1)*(.9+R()*.2),dmg:tier===3?9999:tier===2?24+m*3:tier===1?14+m*2.4:7+m*1.6,r,sp,kx:0,ky:0,fl:0,hc:{},ph:R()*TAU},o||{});EN.push(e);return e}
function edgePos(){const a=R()*TAU,rr=hyp(LW,LH)/2+30;return[P.x+Math.cos(a)*rr,P.y+Math.sin(a)*rr]}
function spawnLamp(){let x,y;const a=R()*TAU,d=250+R()*350;x=P.x+Math.cos(a)*d;y=P.y+Math.sin(a)*d;EN.push({lamp:1,x,y,hp:1,mhp:1,r:15,hc:{},kx:0,ky:0,fl:0})}
function spawner(dt){const m=TIME/60,ar=AREA(),nm=ar.nm;const n=Math.min(nm.length,2+Math.floor(m*1.3));const pool=nm.slice(Math.max(0,n-5),n);
 const want=Math.min(380,40+m*24);const live=EN.reduce((a,e)=>a+(!e.lamp&&!e.tier&&!e.sw?1:0),0);SPWN-=dt;
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
function hitE(e,d,w,kx,ky){if(e.dead)return;if(e.lamp){e.dead=1;lampDrop(e);return}const v=Math.round(d*(.9+R()*.2));e.hp-=v;e.fl=.1;if(w)w.dm+=Math.min(v,e.hp+v);
 if(e.tier<2&&!e.sw){const kb=e.tier?.3:1;e.kx+=(kx||0)*60*kb;e.ky+=(ky||0)*60*kb}if(DN.length<70)DN.push({x:e.x+(R()-.5)*8,y:e.y-e.sp.h*.6,v,t:.6});if(PT.length<600){const c=WCOL[w&&w.k]||'255,240,220',hy=e.y-e.sp.h*.4;glowAt(e.x,hy,c,9+Math.min(10,v*.3),.14);sparks(e.x,hy,2,c,110)}snd('spa',90);if(e.hp<=0)killE(e)}
function killE(e){e.dead=1;KILLS++;const m=TIME/60;FX.push({ty:'die',x:e.x,y:e.y,t:.35,t0:.35,e});const hy=e.y-e.sp.h*.35,nb=e.tier?26:6;for(let i=0;i<nb;i++){const a=R()*TAU,v=40+R()*90;part(e.x,hy,Math.cos(a)*v,Math.sin(a)*v*.6-20,.35+R()*.3,pk(['70,20,24','40,30,40','120,30,30']),1+RI(2),0,160)}part(e.x,e.y-4,0,-8,.5,'60,50,60',e.r*.6,2);if(e.tier){glowAt(e.x,hy,'255,200,120',60,.35);shake(e.tier===2?8:4)}
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
 if(w.k==='sword'){for(let i=0;i<s.amt;i++){const side=i%2===0?P.face:-P.face;later(i*.12,()=>{const ww=96*s.area,hh=(w.evo?40:28)*s.area,cx=P.x+side*(ww/2+8),cy=P.y-14-(i>1?20:0);FX.push({ty:'slash',x:cx,y:cy,w:ww,h:hh,s:side,t:.24,t0:.24,ev:w.evo});for(let j=0;j<7;j++){const q=j/6,ex=cx+side*(q-.5)*ww,ey=cy-Math.sin(q*Math.PI)*hh*.45;part(ex,ey,side*(60+R()*80),-20-R()*30,.25,w.evo?'255,190,120':'255,240,210',1,3)}if(w.evo)shake(2);near(cx,cy,ww/2,e=>{if(Math.abs(e.y-cy)<hh/2+e.r&&Math.abs(e.x-cx)<ww/2+e.r)hitE(e,s.dmg,w,side,0)})})}snd('wsw',100)}
 else if(w.k==='knife'){const d=hyp(p.dx,p.dy)||1,vx=p.dx/d,vy=p.dy/d;for(let i=0;i<s.amt;i++){const o=(i-(s.amt-1)/2)*7;later(i*(w.evo?.03:.07),()=>BU.push({ty:'knife',x:P.x-vy*o,y:P.y-14+vx*o,vx:vx*340*s.spd,vy:vy*340*s.spd,r:5,dmg:s.dmg,pc:s.pierce,t:1.1,w,hit:new Set()}))}snd('wkn',90)}
 else if(w.k==='moon'){for(let i=0;i<s.amt;i++){const dir=i%2?-p.face:p.face;const vy=i>=2?(i===2?-1:1):0,vx=vy?0:dir;BU.push({ty:'moon',x:p.x,y:p.y-14,vx:vx*230*s.spd,vy:vy*230*s.spd,r:16*s.area,dmg:s.dmg,pc:s.pierce,t:.85*s.dur,w,hit:new Set()})}snd('spk',100)}
 else if(w.k==='book'){const ts=nearest(s.amt);for(let i=0;i<s.amt;i++){const e=ts[i%Math.max(1,ts.length)];let vx=p.face,vy=0;if(e){const d=hyp(e.x-p.x,e.y-p.y)||1;vx=(e.x-p.x)/d;vy=(e.y-p.y)/d}BU.push({ty:'bolt',x:p.x,y:p.y-18,vx:vx*260*s.spd,vy:vy*260*s.spd,r:6,dmg:s.dmg,pc:s.pierce,t:2,w,hit:new Set(),tg:e,hm:1})}snd('horb',100)}
 else if(w.k==='dumb'){for(let i=0;i<s.amt;i++)BU.push({ty:'dumb',x:p.x,y:p.y-20,vx:(R()-.5)*160+(i-(s.amt-1)/2)*50,vy:-330*s.spd,g:620,r:10*s.area,dmg:s.dmg,pc:s.pierce,t:3,w,hit:new Set(),rot:0});snd('wsw',100)}
 else if(w.k==='spear'){const sc=onScreen();for(let i=0;i<s.amt;i++){const e=pk(sc);const x=e?e.x:p.x+(R()-.5)*LW*.6,y=e?e.y:p.y+(R()-.5)*LH*.6;FX.push({ty:'spear',x,y,t:.4,t0:.4,r:24*s.area,dmg:s.dmg,w,ev:w.evo})}}
 else if(w.k==='fire'){const sc=onScreen();for(let i=0;i<s.amt;i++){const e=pk(sc);const x=e?e.x+(R()-.5)*30:p.x+(R()-.5)*200,y=e?e.y+(R()-.5)*30:p.y+(R()-.5)*160;BU.push({ty:'bottle',x:p.x,y:p.y-20,sx:p.x,sy:p.y-20,tx:x,ty2:y,t:.5,t0:.5,w,s})}}}

let DQ=[];const later=(t,f)=>DQ.push({t,f});
/* ===== 経験・レベルアップ・宝箱 ===== */
function addXp(v){const p=P;p.xp+=v*p.s.growth;while(p.xp>=xpNeed(p.lv)){p.xp-=xpNeed(p.lv);p.lv++;LVQ++;FX.push({ty:'lvup',x:p.x,y:p.y,t:.6,t0:.6});for(let i=0;i<16;i++)part(p.x+(R()-.5)*30,p.y-R()*20,(R()-.5)*20,-40-R()*60,.8,'255,220,140',1,0)}if(LVQ&&MODE==='play')openLv()}
function canEvo(w){const d=W[w.k];return !w.evo&&w.lv>=8&&P.pas[d.evo.p]}
function lvChoices(){const p=P,o=[];
 for(const w of p.ws)if(w.lv<8)o.push({t:'w',k:w.k,wt:10});if(p.ws.length<6)for(const k in W)if(!p.ws.some(w=>w.k===k))o.push({t:'w',k,wt:6});
 for(const k in p.pas)if(p.pas[k]<PS[k].m)o.push({t:'p',k,wt:8});if(Object.keys(p.pas).length<6)for(const k in PS)if(!(k in p.pas))o.push({t:'p',k,wt:5});
 const n=R()<.15*(p.s.luck-.9)?4:3,r=[];while(r.length<n&&o.length){const tot=o.reduce((a,x)=>a+x.wt,0);let q=R()*tot,i=0;for(;i<o.length;i++){q-=o[i].wt;if(q<=0)break}r.push(o.splice(Math.min(i,o.length-1),1)[0])}
 if(!r.length)r.push({t:'g'},{t:'h'});return r}
function openLv(){if(MODE!=='play')return;LVQ--;MODE='lv';LVO=lvChoices();SEL=0;LVA={t0:T,pick:-1,pt:0};snd('tn')}
function takeOpt(o){const p=P;if(o.t==='w'){const w=p.ws.find(w=>w.k===o.k);if(w)w.lv++;else p.ws.push({k:o.k,lv:1,t:.2,dm:0})}else if(o.t==='p'){p.pas[o.k]=(p.pas[o.k]||0)+1;stats()}else if(o.t==='g')GOLD+=25;else if(o.t==='h')p.hp=Math.min(p.s.mhp,p.hp+30)}
function optInfo(o){if(o.t==='w'){const d=W[o.k],w=P.ws.find(w=>w.k===o.k);return{ic:d.ic,n:d.n,lv:w?'Lv'+(w.lv+1):'新しい武器',d:w?WINC(d.i[w.lv-1]):d.d}}if(o.t==='p'){const d=PS[o.k],n=P.pas[o.k]||0;return{ic:d.ic,n:d.n,lv:n?'Lv'+(n+1):'新しい持ち物',d:d.d}}return o.t==='g'?{ic:'purse',n:'金貨',lv:'',d:'金貨+25'}:{ic:'cheese',n:'チーズ',lv:'',d:'HP+30'}}
function openChest(big){const p=P,n=big?(R()<.3*p.s.luck?5:3):(R()<.08*p.s.luck?3:1),items=[];
 for(let i=0;i<n;i++){const ev=p.ws.find(canEvo);if(ev){ev.evo=1;items.push({ev:1,k:ev.k});continue}const up=p.ws.filter(w=>w.lv<8).map(w=>({t:'w',k:w.k})).concat(Object.keys(p.pas).filter(k=>p.pas[k]<PS[k].m).map(k=>({t:'p',k})));if(up.length){const o=pk(up);items.push(Object.assign({info:optInfo(o)},o));takeOpt(o)}else{items.push({t:'g',info:optInfo({t:'g'})});takeOpt({t:'g'})}}
 const gold=Math.round((big?60:20)*(1+TIME/600)*p.s.greed);GOLD+=gold;CHST={items,gold,t:0,big,ev:items.some(i=>i.ev)};UPT=[];ULT=T;MODE='chest';snd('cl')}

/* ===== 更新 ===== */
const KEY={},JOY={on:0,id:-1,ox:0,oy:0,x:0,y:0},MP={down:0,x:0,y:0};
function update(dt){T+=dt;if(CHST)CHST.t+=dt;SHAKE*=Math.pow(.004,dt);if(BANNER){BANNER.t-=dt;if(BANNER.t<=0)BANNER=null}if(MODE!=='play'||PAUSE||INF)return;const p=P;TIME+=dt;
 // 動く
 let mx=(KEY.d||KEY.arrowright?1:0)-(KEY.a||KEY.arrowleft?1:0),my=(KEY.s||KEY.arrowdown?1:0)-(KEY.w||KEY.arrowup?1:0),mv=1;
 if(JOY.on){const jx=JOY.x-JOY.ox,jy=JOY.y-JOY.oy,jl=hyp(jx,jy),R0=34;if(jl>R0){JOY.ox=JOY.x-jx/jl*R0;JOY.oy=JOY.y-jy/jl*R0}if(jl>4){mx=jx;my=jy;mv=Math.min(1,jl/R0*1.5)}}
 else if(MP.down&&!TOUCH){const jx=MP.x-LW/2,jy=MP.y-(LH/2-14);if(hyp(jx,jy)>10){mx=jx;my=jy}}
 const ml=hyp(mx,my);if(ml>0){const sp=92*p.s.move*mv;p.x+=mx/ml*sp*dt;p.y+=my/ml*sp*dt;p.dx=mx/ml;p.dy=my/ml;if(Math.abs(mx)>.1)p.face=mx>0?1:-1;p.walk+=dt}else p.walk=0;
 p.inv-=dt;p.hit-=dt;p.hp=Math.min(p.s.mhp,p.hp+p.s.regen*dt);
 spawner(dt);grid();updPT(dt);updTG(dt);updEB(dt);
 for(const q of DQ)q.t-=dt;const dq=DQ.filter(q=>q.t<=0);DQ=DQ.filter(q=>q.t>0);dq.forEach(q=>q.f());
 for(const w of p.ws)fire(w,ws(w),dt);
 for(const w of p.ws)if(w.k==='poison'&&w.rr&&R()<.5){const a=R()*TAU,r=R()*w.rr;part(p.x+Math.cos(a)*r,p.y-6+Math.sin(a)*r*.8,(R()-.5)*10,-8-R()*10,1,w.evo?'160,60,90':'110,190,90',3+R()*3,2)}
 for(const w of p.ws)if(w.k==='jelly'&&w.act&&R()<.3){const s=ws(w),a=w.ang+RI(s.amt)/s.amt*TAU,rr=58*s.area;part(p.x+Math.cos(a)*rr,p.y-10+Math.sin(a)*rr,0,-25,.6,'255,200,230',1,0)}
 // 敵
 for(const e of EN){if(e.dead)continue;if(e.lamp){continue}e.fl-=dt;e.ph+=dt*6;
  if(bossAI(e,dt)){}
  else if(e.sw){e.x+=e.sw.vx*dt;e.y+=e.sw.vy*dt;e.sw.t-=dt;if(e.sw.t<=0)e.dead=1}
  else{const dx=p.x-e.x,dy=p.y-e.y,d=hyp(dx,dy)||1;e.x+=(dx/d*e.spd+e.kx)*dt;e.y+=(dy/d*e.spd+e.ky)*dt;e.kx*=Math.pow(.02,dt);e.ky*=Math.pow(.02,dt);
   if(!e.tier&&d>hyp(LW,LH)*.85){const[x,y]=(()=>{const a=Math.atan2(p.dy,p.dx)+(R()-.5)*1.6,rr=hyp(LW,LH)/2+30;return[p.x+Math.cos(a)*rr,p.y+Math.sin(a)*rr]})();e.x=x;e.y=y}}
  if(hyp(p.x-e.x,p.y-e.y)<e.r+9)hurtP(e.dmg)}
 // 押し合い（軽く）
 for(const e of EN){if(e.dead||e.lamp||e.sw||e.tier===3)continue;near(e.x,e.y,e.r,o=>{if(o===e||o.lamp||o.sw)return;const dx=e.x-o.x,dy=e.y-o.y,d=hyp(dx,dy);const m=(e.r+o.r)*.8;if(d<m&&d>.01){const k=(m-d)*.25;e.x+=dx/d*k;e.y+=dy/d*k}})}
 for(let i=EN.length-1;i>=0;i--){const e=EN[i];if(e.dead&&!FX.some(f=>f.e===e))EN.splice(i,1);else if(e.lamp&&hyp(e.x-p.x,e.y-p.y)>1400)EN.splice(i,1)}
 // 弾
 for(const b of BU){b.t-=dt;
  if(b.ty==='bottle'){const k=1-b.t/b.t0;b.x=b.sx+(b.tx-b.sx)*k;b.y=b.sy+(b.ty2-b.sy)*k-Math.sin(k*Math.PI)*60;if(b.t<=0){FX.push({ty:'pool',x:b.tx,y:b.ty2,r:30*b.s.area*(b.w.evo?1.3:1),t:b.s.dur,t0:b.s.dur,tk:0,dmg:b.s.dmg,w:b.w});sparks(b.tx,b.ty2,10,'255,170,80',140);glowAt(b.tx,b.ty2,'255,140,60',34,.3);for(let i=0;i<4;i++)part(b.tx+(R()-.5)*20,b.ty2-6,(R()-.5)*10,-20,.8,'70,50,50',6,2);snd('efire',150)}continue}
  if(b.hm&&b.tg&&!b.tg.dead){const dx=b.tg.x-b.x,dy=b.tg.y-12-b.y,d=hyp(dx,dy)||1,sp=hyp(b.vx,b.vy);b.vx+=(dx/d*sp-b.vx)*dt*5;b.vy+=(dy/d*sp-b.vy)*dt*5}
  if(b.g){b.vy+=b.g*dt;b.rot+=dt*10}(b.tr||(b.tr=[])).unshift({x:b.x,y:b.y,r:b.rot});if(b.tr.length>7)b.tr.pop();b.x+=b.vx*dt;b.y+=b.vy*dt;
  if(b.ty==='bolt'&&R()<.8)part(b.x+(R()-.5)*4,b.y+(R()-.5)*4,(R()-.5)*20,(R()-.5)*20,.35,b.w.evo?'255,170,90':'190,130,255',4,1);if(b.ty==='moon'&&R()<.6)part(b.x+(R()-.5)*b.r,b.y+(R()-.5)*b.r,-b.vx*.1,-b.vy*.1,.3,'210,235,255',1,0);
  near(b.x,b.y+12,b.r,e=>{if(b.hit.has(e)||b.pc<=0)return;b.hit.add(e);b.pc--;const d=hyp(b.vx,b.vy)||1;hitE(e,b.dmg,b.w,b.vx/d,b.vy/d);if(b.pc<=0){b.t=0;return false}})}
 BU=BU.filter(b=>b.t>0);
 // 演出と、時間で効くもの
 for(const f of FX){f.t-=dt;if(f.ty==='spear'&&!f.done&&f.t<=f.t0*.35){f.done=1;near(f.x,f.y,f.r,e=>hitE(e,f.dmg,f.w,0,0));snd('horb',120);FX.push({ty:'wave',x:f.x,y:f.y,r:f.r*1.8,t:.35,t0:.35,c:f.ev?'255,210,120':'235,240,255'});sparks(f.x,f.y-4,12,f.ev?'255,210,120':'240,245,255',160);for(let i=0;i<6;i++)part(f.x+(R()-.5)*f.r,f.y,(R()-.5)*40,-30-R()*40,.5,'150,140,130',2,0,180);shake(2)}
  if(f.ty==='pool'&&R()<.35)part(f.x+(R()-.5)*f.r*1.4,f.y+(R()-.5)*f.r*.7,(R()-.5)*8,-30-R()*30,.7,R()<.5?'255,190,90':'255,120,50',1+RI(2),0)
  if(f.ty==='pool'){f.tk-=dt;if(f.tk<=0){f.tk=.4;near(f.x,f.y,f.r,e=>hitE(e,f.dmg,f.w,0,0))}}}
 FX=FX.filter(f=>f.t>0);for(const d of DN){d.t-=dt;d.y-=dt*24}DN=DN.filter(d=>d.t>0);
 // 拾う
 const mg=40*p.s.magnet;for(const k of PK){const d=hyp(k.x-p.x,k.y-p.y);if(k.ty==='chest'){if(d<20){k.got=1;openChest(k.big);break}continue}
  if(d<mg||k.mg){k.mg=1;k.sp=(k.sp||60)+dt*500;const dx=p.x-k.x,dy=p.y-6-k.y,dd=hyp(dx,dy)||1;k.x+=dx/dd*Math.min(dd,k.sp*dt);k.y+=dy/dd*Math.min(dd,k.sp*dt)}
  if(hyp(k.x-p.x,k.y-p.y+6)<12){k.got=1;if(k.ty==='xp'){addXp(k.v);snd('pk',40)}else if(k.ty==='coin'){GOLD+=Math.round(k.v*p.s.greed);snd('cl',60)}else if(k.ty==='food'){p.hp=Math.min(p.s.mhp,p.hp+30);snd('ps')}else if(k.ty==='mag'){for(const o of PK)if(o.ty==='xp'||o.ty==='coin')o.mg=1;snd('tn');glowAt(p.x,p.y-10,'140,200,255',60,.4)}}}
 PK=PK.filter(k=>!k.got);if((T*2|0)!==((T-dt)*2|0))bankGems();
}
function endRun(){MODE='result';const g2=GOLD;META.gold+=g2;const bk=STG;META.bt=META.bt||{};META.bt[bk]=Math.max(META.bt[bk]||0,TIME);META.bc=META.bc||{};const o=META.bc[CHI]||{t:0,lv:0,k:0};META.bc[CHI]={t:Math.max(o.t,TIME),lv:Math.max(o.lv,P.lv),k:o.k+KILLS};LS.set('battlearena_meta',META);RESULT={time:TIME,lv:P.lv,kills:KILLS,gold:g2,ws:P.ws.map(w=>({...w}))};music('m');snd('ls')}
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

/* ===== 主・強い敵の技（場所の敵の見た目の分類で決める） ===== */
const PAT={cast:['ring','aim','spiral','rain'],stat:['ring','spiral','rain','aim'],heavy:['quake','rain','summon','dash'],beast:['dash','aim','dash','summon'],fly:['dash','ring','rain','spiral'],blob:['quake','ring','summon','rain'],hum:['dash','aim','rain','quake']};
function shootE(e,a,sp,big){EB.push({x:e.x,y:e.y-e.sp.h*.4,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:big?7:5,dmg:e.dmg*.55,t:6,c:e.tier===2?'255,80,70':'200,110,255'})}
function bossAI(e,dt){if(e.tier!==1&&e.tier!==2)return 0;if(e.acd==null)e.acd=e.tier===2?2:4;e.acd-=dt;
 if(e.cast>0){e.cast-=dt;if(R()<.5){const a=R()*TAU,r=e.r*2.2;part(e.x+Math.cos(a)*r,e.y-e.sp.h*.4+Math.sin(a)*r,-Math.cos(a)*r*2.5,-Math.sin(a)*r*2.5,.4,e.tier===2?'255,90,80':'255,170,90',1,0)}if(e.cast<=0)doPat(e);return 1}
 if(e.dash>0){e.dash-=dt;e.x+=e.dvx*dt;e.y+=e.dvy*dt;if(R()<.7)part(e.x+(R()-.5)*e.r,e.y,-e.dvx*.1,-e.dvy*.1-10,.5,'120,100,90',4,2);return 1}
 if(e.spi>0){e.spi-=dt;e.spt-=dt;if(e.spt<=0){e.spt=.08;e.spa+=.42;shootE(e,e.spa,105);shootE(e,e.spa+Math.PI,105)}return 1}
 if(e.acd<=0&&hyp(P.x-e.x,P.y-e.y)<Math.max(LW,LH)*.6){const L=e.tier===2?PAT[e.d.cat]||PAT.hum:(e.d.cat==='cast'||e.d.cat==='stat'||e.d.cat==='fly'?['aim','ring']:['dash','quake']);e.pi=(e.pi||0);e.pat=L[e.pi%L.length];e.pi++;
  e.acd=(e.tier===2?3.2:5.5)*(1-Math.min(.35,TIME/3600));e.cast=e.pat==='dash'?.8:e.pat==='quake'?1.1:e.pat==='rain'?.5:.65;
  const mv=e.d.mv.filter(m=>m.nm||m.lb);if(mv.length){const m=pk(mv);e.lbs=m.nm||m.lb;e.lbt=1.6}
  if(e.pat==='dash'){const a=Math.atan2(P.y-e.y,P.x-e.x);e.da=a;TG.push({ty:'line',x:e.x,y:e.y,a,len:300,w:e.r*1.6,t:e.cast,t0:e.cast,e})}
  else if(e.pat==='quake'){const r=e.tier===2?130:90;TG.push({ty:'circle',x:e.x,y:e.y,r,t:e.cast,t0:e.cast,dmg:e.dmg*1.2,e,big:1})}
  else if(e.pat==='rain'){const n=e.tier===2?6:3;for(let i=0;i<n;i++){const ox=i?(R()-.5)*170:0,oy=i?(R()-.5)*120:0,t=1+i*.12;TG.push({ty:'circle',x:P.x+ox,y:P.y+oy,r:36,t,t0:t,dmg:e.dmg*1.1,e,fall:1})}}
  snd('emagic',200);return 1}
 return 0}
function doPat(e){const a=Math.atan2(P.y-e.y,P.x-e.x);
 if(e.pat==='dash'){e.dash=.5;e.dvx=Math.cos(e.da)*520;e.dvy=Math.sin(e.da)*520;snd('eslam',150)}
 else if(e.pat==='ring'){const n=e.tier===2?18:10,o=R();for(let i=0;i<n;i++)shootE(e,o+i/n*TAU,115,1);glowAt(e.x,e.y-e.sp.h*.4,'255,120,100',e.r*2.4,.3);snd('emagic',150)}
 else if(e.pat==='aim'){const n=e.tier===2?5:3;for(let i=0;i<n;i++)shootE(e,a+(i-(n-1)/2)*.22,175);snd('emagic',150)}
 else if(e.pat==='spiral'){e.spi=2.4;e.spt=0;e.spa=a}
 else if(e.pat==='summon'){const ar=AREA();for(let i=0;i<6;i++){const an=i/6*TAU,x=e.x+Math.cos(an)*50,y=e.y+Math.sin(an)*40;const o=addE(pk(ar.nm.slice(0,Math.min(ar.nm.length,4+TIME/120|0))),x,y,0);if(o){part(x,y-8,0,-20,.5,'90,40,120',8,2);glowAt(x,y-8,'190,120,255',14,.3)}}snd('emagic',150)}}
function updTG(dt){for(const t of TG){t.t-=dt;if(t.t<=0){if(t.ty==='circle'){if(hyp(P.x-t.x,P.y-t.y)<t.r+6)hurtP(t.dmg);for(let i=0;i<(t.big?28:14);i++){const a=R()*TAU,v=60+R()*120;part(t.x+Math.cos(a)*t.r*.3,t.y+Math.sin(a)*t.r*.2,Math.cos(a)*v,Math.sin(a)*v*.6,.4,'255,140,90',1,3)}part(t.x,t.y,0,-14,.6,'90,70,60',t.r*.5,2);glowAt(t.x,t.y,'255,110,70',t.r*1.3,.25);shake(t.big?6:3);snd('eslam',100)}}}TG=TG.filter(t=>t.t>0)}
function updEB(dt){for(const b of EB){b.t-=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;if(hyp(b.x-P.x,b.y-(P.y-14))<b.r+7){hurtP(b.dmg);b.t=0;sparks(b.x,b.y,5,b.c,80)}if(Math.abs(b.x-P.x)>LW||Math.abs(b.y-P.y)>LH)b.t=0}EB=EB.filter(b=>b.t>0)}
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
  wrapC(r.d,x+cw/2,iy+is+56,cw-16,'#c0c4d4',10,14,4);if(!isNew&&r.lv)tx(r.lv,x+cw/2,y+ch-12,'#d8c8a0','center',9);if(!TOUCH)tx(String(i+1),x+10,y+ch-10,'#5a5470','left',9,FP);
  g.globalAlpha=1;btn(x,y,cw,ch,()=>{if(SEL!==i&&TOUCH){SEL=i;return}pickOpt(i)})});
 if(TOUCH&&LVA.pick<0)tx('もう一度押して決める',UW/2,y0+ch+22,'#8a8498','center',10)}
function pickOpt(i){if(MODE!=='lv')return;const o=LVO[i],r=LVR.find(q=>q.i===i);LOUT={o,info:optInfo(o),r:r||{x:UW/2-60,y:UH*.3,w:120,h:180},t0:T};takeOpt(o);snd('tn');MODE='play';LVO=null;LVA.pick=-1;if(LVQ>0)openLv()}
let LOUT=null;
function drawLvOut(){const q=cl((T-LOUT.t0)/.38,0,1);if(q>=1){LOUT=null;return}const e=q*q,r=LOUT.r;g.fillStyle=`rgba(5,3,8,${.74*(1-q)*(1-q)})`;g.fillRect(0,0,UW,UH);
 const x=r.x+(30-r.x-r.w/2)*e,y=r.y+(20-r.y-r.h/2)*e,sc=1-e*.8;g.globalAlpha=1-q*.6;const cx=x+r.w/2,cy=y+r.h/2;g.globalCompositeOperation='lighter';g.drawImage(glowC('255,210,140'),cx-r.w*sc,cy-r.h*sc*.7,r.w*sc*2,r.h*sc*1.4);g.globalCompositeOperation='source-over';g.fillStyle='rgba(30,24,34,.9)';g.fillRect(cx-r.w*sc/2,cy-r.h*sc/2,r.w*sc,r.h*sc);icon(LOUT.info.ic,cx-20*sc-4,cy-20*sc-4,40*sc+8);g.globalAlpha=1}

/* ===== 宝箱の演出：落ちて震え、開いて光が立ち、中身が回って止まる ===== */
let UPT=[],ULT=0;
function chestTimes(c){const op=c.big?1.4:1.1,st=op+.45;return{op,st,end:st+c.items.length*.6+.5}}
function drawChestG(x,y,s,open,big,shk){const W2=22*s,H2=13*s;x+=shk;g.fillStyle='rgba(0,0,0,.4)';g.beginPath();g.ellipse(x,y+2*s,W2*.6,3*s,0,0,TAU);g.fill();
 const body=big?'#6a1c20':'#5a3a1c',dk=big?'#3a0c10':'#38220e',band=big?'#e8c060':'#c8a050';
 g.fillStyle=body;g.fillRect(x-W2/2,y-H2,W2,H2);g.fillStyle=dk;g.fillRect(x-W2/2,y-2*s,W2,2*s);for(let i=1;i<4;i++){g.fillStyle='rgba(0,0,0,.18)';g.fillRect(x-W2/2,y-H2+i*3*s,W2,s*.5)}g.fillStyle=band;g.fillRect(x-W2/2+2*s,y-H2,2*s,H2);g.fillRect(x+W2/2-4*s,y-H2,2*s,H2);
 if(open<=0){g.fillStyle=big?'#882428':'#704a24';g.fillRect(x-W2/2,y-H2-7*s,W2,7*s);g.fillStyle='rgba(255,255,255,.12)';g.fillRect(x-W2/2,y-H2-7*s,W2,s);g.fillStyle=band;g.fillRect(x-W2/2,y-H2-1*s,W2,s*1.2);g.fillRect(x-W2/2+2*s,y-H2-7*s,2*s,7*s);g.fillRect(x+W2/2-4*s,y-H2-7*s,2*s,7*s);g.fillStyle=band;g.fillRect(x-2*s,y-H2-2*s,4*s,5*s);g.fillStyle='#2a1808';g.fillRect(x-.5*s,y-H2,s,1.5*s)}
 else{const ly=y-H2-7*s-open*10*s;g.fillStyle=big?'#5a1418':'#4a3016';g.fillRect(x-W2/2,ly,W2,4*s);g.fillStyle=band;g.fillRect(x-W2/2,ly+3*s,W2,s);const gl=g.createLinearGradient(0,y-H2-2*s,0,y-H2+2*s);gl.addColorStop(0,'rgba(255,230,150,0)');gl.addColorStop(1,'rgba(255,230,150,.9)');g.fillStyle=gl;g.fillRect(x-W2/2+s,y-H2-2*s,W2-2*s,4*s)}}
function drawChest(){const c=CHST,tm=chestTimes(c),t=c.t,cx=UW/2,cy=UH*.78;const dt=Math.min(.05,Math.max(0,T-ULT));ULT=T;
 g.fillStyle=`rgba(4,3,6,${Math.min(.8,t*3)})`;g.fillRect(0,0,UW,UH);
 const opened=t>=tm.op;if(opened){const q=cl((t-tm.op)/.5,0,1);
  g.save();g.translate(cx,cy-40);g.rotate(T*.2);g.globalCompositeOperation='lighter';for(let i=0;i<16;i++){g.rotate(TAU/16);g.fillStyle=`rgba(255,${c.ev?200:210},${c.ev?90:130},${.06*q})`;g.beginPath();g.moveTo(0,0);g.lineTo(-22,-UW*.8);g.lineTo(22,-UW*.8);g.fill()}g.restore();
  const bw=70*q;const bm=g.createLinearGradient(0,0,0,cy);bm.addColorStop(0,'rgba(255,220,140,0)');bm.addColorStop(1,`rgba(255,220,140,${.35*q})`);g.fillStyle=bm;g.fillRect(cx-bw/2,0,bw,cy-30);g.globalCompositeOperation='source-over'}
 // 箱：上から落ちて、震えて、開く
 const dk=cl(t/.35,0,1),dy=(1-Math.pow(dk,2))*-UH*.6,shk=t>.35&&!opened?Math.sin(T*60)*Math.min(4,(t-.35)*5):0,s=c.big?4:3;
 drawChestG(cx,cy+dy,s,opened?cl((t-tm.op)/.25,0,1):0,c.big,shk);
 if(!c.op&&opened){c.op=1;snd('wn');for(let i=0;i<50;i++){const a=-Math.PI/2+(R()-.5)*1.6,v=150+R()*200;UPT.push({x:cx,y:cy-50,vx:Math.cos(a)*v,vy:Math.sin(a)*v,t:1.4+R(),t0:2.2,ty:'coin'})}for(let i=0;i<30;i++){const a=R()*TAU,v=60+R()*120;UPT.push({x:cx,y:cy-50,vx:Math.cos(a)*v,vy:Math.sin(a)*v,t:.5+R()*.4,t0:.9,ty:'sp'})}}
 if(opened&&R()<.4)UPT.push({x:cx+(R()-.5)*50,y:cy-50,vx:(R()-.5)*40,vy:-60-R()*80,t:1.2,t0:1.2,ty:'gl'});
 for(const p of UPT){p.t-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.ty==='coin'){p.vy+=420*dt;if(p.y>cy+6){p.y=cy+6;p.vy*=-.35;p.vx*=.6}}else p.vx*=.97}UPT=UPT.filter(p=>p.t>0);
 for(const p of UPT){const k=Math.min(1,p.t/.4);if(p.ty==='coin'){g.globalAlpha=k;g.drawImage(COIN,p.x-3|0,p.y-3|0);g.globalAlpha=1}else{g.globalCompositeOperation='lighter';g.globalAlpha=k;const sz=p.ty==='gl'?6:4;g.drawImage(glowC(p.ty==='gl'?'255,220,150':'255,240,200'),p.x-sz,p.y-sz,sz*2,sz*2);g.globalAlpha=1;g.globalCompositeOperation='source-over'}}
 // 中身：回って止まる
 const n=c.items.length,sw=Math.min(84,(UW-40)/n),x0=cx-n*sw/2+sw/2,iy=UH*.34;const KS=Object.keys(W).map(k=>W[k].ic).concat(Object.keys(PS).map(k=>PS[k].ic));
 c.items.forEach((it,i)=>{const t0=tm.st+i*.6,lt=t-t0;if(lt<0)return;const x=x0+i*sw,lock=lt>.45,ev=it.ev;const a=cl(lt/.2,0,1);g.globalAlpha=a;
  const ic=ev?W[it.k].evo.ic:it.info.ic;const fr=g.createRadialGradient(x,iy,0,x,iy,30);fr.addColorStop(0,ev?'rgba(255,210,110,.5)':'rgba(255,230,180,.22)');fr.addColorStop(1,'rgba(255,230,180,0)');g.fillStyle=fr;g.fillRect(x-32,iy-32,64,64);
  g.fillStyle='rgba(14,10,18,.85)';g.beginPath();g.arc(x,iy,23,0,TAU);g.fill();g.strokeStyle=ev?'#ffd060':'rgba(240,220,170,.6)';g.lineWidth=1.5;g.beginPath();g.arc(x,iy,23,0,TAU);g.stroke();
  if(!lock){const ri=KS[(T*18+i*5|0)%KS.length];g.save();g.beginPath();g.arc(x,iy,22,0,TAU);g.clip();const off=((T*18)%1)*30;icon(ri,x-15,iy-15-off+15,30);icon(KS[(T*18+i*5+1|0)%KS.length],x-15,iy-15-off+45,30);g.restore()}
  else{if(!it.lk){it.lk=1;snd(ev?'wn':'tn');for(let j=0;j<18;j++){const an=R()*TAU,v=60+R()*80;UPT.push({x,y:iy,vx:Math.cos(an)*v,vy:Math.sin(an)*v,t:.5,t0:.5,ty:'sp'})}}
   const fl=cl(1-(lt-.45)/.25,0,1);if(ev){g.save();g.translate(x,iy);g.rotate(T*.8);g.globalCompositeOperation='lighter';for(let j=0;j<10;j++){g.rotate(TAU/10);g.fillStyle='rgba(255,200,90,.12)';g.beginPath();g.moveTo(0,0);g.lineTo(-6,-46);g.lineTo(6,-46);g.fill()}g.restore();g.globalCompositeOperation='source-over'}
   icon(ic,x-16,iy-16,32,ev);if(fl>0){g.fillStyle=`rgba(255,255,255,${fl*.8})`;g.beginPath();g.arc(x,iy,23*(1+(1-fl)*.4),0,TAU);g.fill()}
   tx(ev?W[it.k].evo.n:it.info.n,x,iy+40,ev?'#ffd060':'#f0e6c8','center',11);tx(ev?'進化':it.info.lv||it.info.d,x,iy+54,ev?'#e0b060':'#a8b0c4','center',9)}
  g.globalAlpha=1});
 // 金貨
 const gk=cl((t-tm.st-n*.6+.3)/.6,0,1);if(gk>0)tx('金貨 +'+Math.round(c.gold*gk),cx,UH*.34+80,'#ffd860','center',13);
 const done=t>=tm.end;if(done)tx(TOUCH?'押して続ける':'クリックで続ける',cx,UH-14,`rgba(200,200,210,${.5+.4*Math.sin(T*4)})`,'center',10);
 btn(0,0,UW,UH,()=>{if(c.t<tm.end){c.t=tm.end;for(const it of c.items)it.lk=1}else chestClose()})}
function chestClose(){MODE='play';CHST=null;UPT=[];if(LVQ>0)openLv()}

/* ===== 持ち物の詳しい説明（左上の欄や一時停止の欄を押すと出る。出ている間は止まる） ===== */
let INF=null;function openInf(t,k){if(MODE!=='play')return;INF={t,k,t0:T};snd('cl')}
const PSV={might:n=>'ダメージ +'+n*10+'%',armor:n=>'受けるダメージ -'+n,mhp:n=>'最大HP +'+n*20+'%',regen:n=>'HP回復 +'+(n*.2).toFixed(1)+'/秒',cd:n=>'待ち時間 -'+n*8+'%',area:n=>'範囲 +'+n*10+'%',dur:n=>'持続 +'+n*10+'%',amt:n=>'数 +'+n,move:n=>'移動の速さ +'+n*10+'%',magnet:n=>'拾う範囲 +'+n*25+'%',luck:n=>'幸運 +'+n*10+'%',growth:n=>'経験 +'+n*8+'%',pspd:n=>'弾の速さ +'+n*10+'%'};
function drawInf(){const p=P,I=INF,q=cl((T-I.t0)/.15,0,1),w=Math.min(UW-24,300);let lines=[],ic,nm,lv,d,col,evo=null;
 if(I.t==='w'){const wp=p.ws.find(x=>x.k===I.k);if(!wp){INF=null;return}const D=W[I.k],s=ws(wp);ic=wp.evo?D.evo.ic:D.ic;nm=wp.evo?D.evo.n:D.n;lv=wp.evo?'進化済み':'Lv '+wp.lv+' / 8';d=D.d;col='255,200,80';
  lines=[['ダメージ',Math.round(s.dmg)],['待ち時間',s.cd.toFixed(2)+'秒'],['数',s.amt],['範囲',Math.round(s.area*100)+'%']];if(s.pierce<90)lines.push(['貫通',s.pierce]);if(I.k==='jelly'||I.k==='fire')lines.push(['持続',s.dur.toFixed(1)+'秒']);lines.push(['与えたダメージ',Math.round(wp.dm)]);
  if(!wp.evo&&wp.lv<8)lines.push(['次のLv',WINC(D.i[wp.lv-1])]);evo={n:D.evo.n,ic:D.evo.ic,need:PS[D.evo.p].n,has:!!p.pas[D.evo.p],lv8:wp.lv>=8,done:wp.evo}}
 else{const D=PS[I.k],n=p.pas[I.k]||0;ic=D.ic;nm=D.n;lv='Lv '+n+' / '+D.m;d='1段ごとに '+D.d;col='130,190,255';lines=[['今の効果',PSV[I.k](n)]];if(n<D.m)lines.push(['次のLv',PSV[I.k](n+1)]);const ew=Object.keys(W).find(k=>W[k].evo.p===I.k);if(ew)lines.push(['進化に使う',W[ew].n+' → '+W[ew].evo.n])}
 const h=96+lines.length*17+(evo?40:0);g.fillStyle=`rgba(0,0,0,${.45*q})`;g.fillRect(0,0,UW,UH);const x=(UW-w)/2|0,y=((UH-h)/2|0)+(1-q)*10;g.globalAlpha=q;box(x,y,w,h,'rgba(18,16,24,.96)');g.fillStyle=`rgba(${col},.8)`;g.fillRect(x,y,w,2);
 g.globalCompositeOperation='lighter';g.drawImage(glowC(col),x+4,y+4,60,60);g.globalCompositeOperation='source-over';icon(ic,x+14,y+14,40,I.t==='w'&&evo&&evo.done);tx(nm,x+64,y+30,'#fff2dc','left',15);tx(lv,x+64,y+48,`rgba(${col},1)`,'left',10);tx(I.t==='w'?'武器':'持ち物',x+w-12,y+22,'#8a8498','right',9);
 tx(d,x+14,y+74,'#c8cad8','left',10);lines.forEach(([a,b],i)=>{const yy=y+94+i*17;g.fillStyle='rgba(255,255,255,.04)';g.fillRect(x+10,yy-11,w-20,15);tx(a,x+16,yy,'#9a98ac','left',10);tx(String(b),x+w-16,yy,'#ece4d4','right',10)});
 if(evo){const yy=y+h-36;g.fillStyle='rgba(255,210,110,.08)';g.fillRect(x+10,yy-4,w-20,30);icon(evo.ic,x+16,yy,22,1);tx(evo.done?'進化した：'+evo.n:'進化：'+evo.n,x+44,yy+9,'#ffd880','left',10);tx(evo.done?'':`Lv8${evo.lv8?'（済）':''}　＋　${evo.need}${evo.has?'（済）':''}　→　宝箱`,x+44,yy+22,'#b8a890','left',9)}
 tx(TOUCH?'押して閉じる':'クリックで閉じる',UW/2,y+h+16,'#8a8498','center',9);g.globalAlpha=1;btn(0,0,UW,UH,()=>{INF=null})}

/* ===== 描画 ===== */
const mm=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(Math.floor(s%60)).padStart(2,'0');
let PMODE='';function draw(){if(MODE!==PMODE){if(MODE==='title')titleEnter();if(MODE==='char'){CSL.from=-1;CSL.t0=T-1;CSL.bx=0}PMODE=MODE}g.setTransform(K,0,0,K,0,0);g.imageSmoothingEnabled=false;BTN=[];const ui=()=>{g.setTransform(K*US,0,0,K*US,0,0);g.imageSmoothingEnabled=false};
 if(MODE==='title'){ui();return drawTitle()}if(MODE==='char'){ui();return drawChar()}if(MODE==='stage'){ui();return drawStage()}if(MODE==='shop'){ui();return drawShop()}
 drawWorld();ui();drawHUD();if(MODE==='lv')drawLv();else if(LOUT)drawLvOut();if(MODE==='chest')drawChest();if(PAUSE)drawPause();if(INF)drawInf();if(MODE==='result')drawResult()}
function drawWorld(){const p=P;CAMX=Math.round(p.x-LW/2+(R()-.5)*SHAKE);CAMY=Math.round(p.y-LH/2-10+(R()-.5)*SHAKE);
 const ts=TILE.width,sx=-((CAMX%ts)+ts)%ts,sy=-((CAMY%ts)+ts)%ts;for(let x=sx;x<LW;x+=ts)for(let y=sy;y<LH;y+=ts)g.drawImage(TILE,x,y);
 const X=x=>Math.round(x-CAMX),Y=y=>Math.round(y-CAMY);
 // 毒の霧・炎の溜まり（地面）
 for(const w of p.ws)if(w.k==='poison'&&w.rr){const r=w.rr;const gr=g.createRadialGradient(X(p.x),Y(p.y-6),r*.2,X(p.x),Y(p.y-6),r);gr.addColorStop(0,'rgba(90,170,80,0)');gr.addColorStop(.75,`rgba(90,170,80,${.16+Math.sin(T*4)*.04})`);gr.addColorStop(1,'rgba(90,170,80,0)');g.fillStyle=gr;g.beginPath();g.ellipse(X(p.x),Y(p.y-6),r,r*.8,0,0,TAU);g.fill()}
 for(const f of FX)if(f.ty==='pool'){const a=Math.min(1,f.t*2);for(let i=0;i<10;i++){const an=i/10*TAU+T*.8,rr=f.r*(.4+.5*((i*37)%10)/10);const fx=X(f.x+Math.cos(an)*rr),fy=Y(f.y+Math.sin(an)*rr*.6),h=6+Math.sin(T*12+i)*3;g.fillStyle=`rgba(255,${120+i*8},40,${.55*a})`;g.fillRect(fx-2,fy-h,4,h);g.fillStyle=`rgba(255,220,120,${.5*a})`;g.fillRect(fx-1,fy-h+1,2,2)}
  const gr=g.createRadialGradient(X(f.x),Y(f.y),0,X(f.x),Y(f.y),f.r);gr.addColorStop(0,`rgba(255,130,40,${.3*a})`);gr.addColorStop(1,'rgba(255,90,30,0)');g.fillStyle=gr;g.beginPath();g.ellipse(X(f.x),Y(f.y),f.r,f.r*.6,0,0,TAU);g.fill()}
 drawTG(X,Y);
 // 拾い物
 for(const k of PK){const x=X(k.x),y=Y(k.y);if(x<-20||y<-20||x>LW+20||y>LH+20)continue;const b=Math.sin(T*4+k.x)*1.5;
  if(k.ty==='xp')g.drawImage(GEM[k.c],x-3,y-4+b|0);else if(k.ty==='coin')g.drawImage(COIN,x-3,y-4+b|0);else if(k.ty==='food')icon('cheese',x-8,y-12+b,16);else if(k.ty==='mag'){g.globalCompositeOperation='lighter';g.globalAlpha=.6+.3*Math.sin(T*5);g.drawImage(glowC('140,200,255'),x-20,y-30+b,40,40);g.globalAlpha=1;g.globalCompositeOperation='source-over';g.drawImage(MAGN,x-9,y-19+b|0,18,18)}
  else if(k.ty==='chest'){const s=k.big?28:20;const gr=g.createRadialGradient(x,y-s/2,0,x,y-s/2,s*1.2);gr.addColorStop(0,'rgba(255,214,110,.4)');gr.addColorStop(1,'rgba(255,214,110,0)');g.fillStyle=gr;g.fillRect(x-s*1.2,y-s*1.7,s*2.4,s*2.4);
   g.fillStyle='#5a3a1c';g.fillRect(x-s/2,y-s*.7,s,s*.7);g.fillStyle='#7a5228';g.fillRect(x-s/2,y-s*.95,s,s*.35);g.fillStyle='#d8b050';g.fillRect(x-s/2,y-s*.62,s,2);g.fillRect(x-2,y-s*.7,4,5);g.fillStyle='#3a2410';g.fillRect(x-s/2,y-2,s,2)}}
 // 体（足元の y の順に）
 const list=EN.filter(e=>Math.abs(e.x-p.x)<LW/2+120&&Math.abs(e.y-p.y)<LH/2+160);list.push(p);list.sort((a,b)=>a.y-b.y);
 for(const e of list){const x=X(e.x),y=Y(e.y);g.fillStyle='rgba(0,0,0,.28)';g.beginPath();g.ellipse(x,y,(e===p?10:e.r||8),(e===p?4:(e.r||8)*.4),0,0,TAU);g.fill()}
 for(const e of list){const x=X(e.x),y=Y(e.y);
  if(e===p){const s=cSpr(CHS[CHI].k);if(!s.ok)continue;const bob=p.walk?Math.abs(Math.sin(p.walk*11))*2:0,fl=p.face<0;const c=p.hit>0?(fl?s.wf:s.wn):(fl?s.f:s.n);if(p.inv>0&&(T*20|0)%2)g.globalAlpha=.6;g.drawImage(c,x-s.w/2|0,y-s.h+2-bob|0);g.globalAlpha=1;continue}
  if(e.lamp){const fy=y-34+Math.sin(T*3+e.x);g.globalCompositeOperation='lighter';g.globalAlpha=.55+.15*Math.sin(T*9+e.x);g.drawImage(glowC('255,170,80'),x-26,fy-14,52,52);g.globalAlpha=1;g.globalCompositeOperation='source-over';icon('lamp',x-16,y-38+Math.sin(T*3+e.x)*1,32);continue}
  const s=e.sp;if(!s.ok)continue;const dying=e.dead;const fx=FX.find(f=>f.e===e);let a=1,sq=1;if(dying&&fx){a=fx.t/fx.t0;sq=a}
  const fl=p.x>e.x;const c=e.fl>0?(fl?s.wf:s.wn):(fl?s.f:s.n);const bob=Math.sin(e.ph)*(e.d&&e.d.cat==='fly'?3:1),st=1+Math.sin(e.ph)*.03;
  if(e.cast>0){const q=.5+.5*Math.sin(T*18),gs=Math.max(s.w,s.h)*.75;g.globalCompositeOperation='lighter';g.globalAlpha=.35+.25*q;g.drawImage(glowC(e.tier===2?'255,60,40':'255,140,60'),x-gs,y-s.h*.5-gs,gs*2,gs*2);g.globalAlpha=1;g.globalCompositeOperation='source-over'}
  g.globalAlpha=a;if(e.tier===3){g.globalAlpha=.85}const w=s.w*(2-st),h=s.h*st*sq;g.drawImage(c,x-w/2|0,y-h+2-(e.d&&e.d.cat==='fly'?8+bob:Math.max(0,bob))|0,w|0,h|0);g.globalAlpha=1;
  if(e.lbt>0&&e.lbs){e.lbt-=1/60;g.globalAlpha=Math.min(1,e.lbt*2);tx(e.lbs,x,y-h-8,e.tier===2?'#ff8a70':'#ffc890','center',11);g.globalAlpha=1}
  if(e.tier===1||e.tier===2){const bw=e.tier===2?60:40;g.fillStyle='rgba(0,0,0,.5)';g.fillRect(x-bw/2,y+6,bw,3);g.fillStyle='#c03040';g.fillRect(x-bw/2,y+6,bw*Math.max(0,e.hp/e.mhp),3)}}
 // 弾
 for(const b of BU){const x=X(b.x),y=Y(b.y);
  if(b.ty==='knife'){const a=Math.atan2(b.vy,b.vx);if(b.tr)b.tr.forEach((q,i)=>{if(i%2)return;g.save();g.translate(X(q.x),Y(q.y));g.rotate(a);g.fillStyle=`rgba(${b.w.evo?'150,230,170':'220,230,255'},${.25-i*.03})`;g.fillRect(-4,-1,10,2);g.restore()});g.save();g.translate(x,y);g.rotate(a);g.fillStyle='#e8ecf4';g.fillRect(-2,-1,10,3);g.fillStyle='#fff';g.fillRect(4,-1,4,1);g.fillStyle='#7a4a24';g.fillRect(-7,-1,5,3);g.fillStyle='#c8a050';g.fillRect(-2,-2,1,5);g.restore()}
  else if(b.ty==='moon'){const a=Math.atan2(b.vy,b.vx),r=b.r,al=Math.min(1,b.t*3),cres=(xx,yy,aa,sc)=>{g.save();g.translate(xx,yy);g.rotate(a);g.globalAlpha=al*aa;g.fillStyle=b.w.evo?'rgba(200,180,255,.85)':'rgba(170,215,255,.85)';g.beginPath();g.arc(0,0,r*sc,-1.3,1.3);g.arc(-r*.5*sc,0,r*.9*sc,1.1,-1.1,true);g.fill();if(aa>.9){g.fillStyle='rgba(255,255,255,.95)';g.beginPath();g.arc(0,0,r,-1,1);g.arc(-r*.2,0,r*.88,.9,-.9,true);g.fill()}g.restore()};
   if(b.tr)[5,3,1].forEach((i,j)=>{const q=b.tr[i];if(q)cres(X(q.x),Y(q.y),.18+j*.12,.92)});g.globalCompositeOperation='lighter';g.globalAlpha=al*.5;g.drawImage(glowC(b.w.evo?'190,160,255':'150,200,255'),x-r*1.6,y-r*1.6,r*3.2,r*3.2);g.globalAlpha=1;g.globalCompositeOperation='source-over';cres(x,y,1,1);g.globalAlpha=1}
  else if(b.ty==='bolt'){g.globalCompositeOperation='lighter';const c=b.w.evo?'255,170,90':'190,130,255';if(b.tr)b.tr.forEach((q,i)=>{const s2=9-i;g.globalAlpha=.5-i*.06;g.drawImage(glowC(c),X(q.x)-s2,Y(q.y)-s2,s2*2,s2*2)});g.globalAlpha=1;const pu=12+Math.sin(T*30)*2;g.drawImage(glowC(c),x-pu,y-pu,pu*2,pu*2);g.globalCompositeOperation='source-over';g.fillStyle='#fff';g.fillRect(x-1,y-1,3,3)}
  else if(b.ty==='dumb'){const dd=(rot,xx,yy,al2)=>{g.save();g.globalAlpha=al2;g.translate(xx,yy);g.rotate(rot);const s2=b.r/10;g.scale(s2,s2);g.fillStyle=b.w.evo?'#f0d070':'#8a9098';g.fillRect(-9,-1,18,3);g.fillStyle=b.w.evo?'#b88a20':'#30343c';g.fillRect(-13,-6,6,13);g.fillRect(7,-6,6,13);g.fillStyle='rgba(255,255,255,.4)';g.fillRect(-13,-6,6,2);g.fillRect(7,-6,6,2);g.restore()};if(b.tr){const q=b.tr[2],q2=b.tr[5];if(q2)dd(q2.r,X(q2.x),Y(q2.y),.15);if(q)dd(q.r,X(q.x),Y(q.y),.3)}dd(b.rot,x,y,1);g.globalAlpha=1}
  else if(b.ty==='bottle'){g.save();g.translate(x,y);g.rotate(T*12);g.fillStyle='#8a3a2a';g.fillRect(-3,-4,6,8);g.fillStyle='#c86040';g.fillRect(-3,-4,2,8);g.fillStyle='#e0a050';g.fillRect(-1,-7,3,3);g.restore();g.globalCompositeOperation='lighter';g.drawImage(glowC('255,160,70'),x-6,y-12,12,12);g.globalCompositeOperation='source-over'}}
 // 回るクラゲ
 for(const w of p.ws)if(w.k==='jelly'&&w.act){const s=ws(w),rr=58*s.area;for(let i=0;i<s.amt;i++)for(let j=1;j<4;j++){const a=w.ang-j*.18+i/s.amt*TAU,x=X(p.x+Math.cos(a)*rr),y=Y(p.y-10+Math.sin(a)*rr);g.globalCompositeOperation='lighter';g.globalAlpha=.3-j*.08;g.drawImage(glowC(w.evo?'190,170,255':'255,150,200'),x-8,y-8,16,16);g.globalAlpha=1;g.globalCompositeOperation='source-over'}for(let i=0;i<s.amt;i++){const a=w.ang+i/s.amt*TAU,x=X(p.x+Math.cos(a)*rr),y=Y(p.y-10+Math.sin(a)*rr),r=9*s.area;const gr=g.createRadialGradient(x,y,0,x,y,r*1.8);gr.addColorStop(0,w.evo?'rgba(190,170,255,.5)':'rgba(255,150,200,.45)');gr.addColorStop(1,'rgba(255,150,200,0)');g.fillStyle=gr;g.fillRect(x-r*2,y-r*2,r*4,r*4);
  g.fillStyle=w.evo?'rgba(200,190,255,.85)':'rgba(255,170,210,.85)';g.beginPath();g.arc(x,y-2,r*.7,Math.PI,0);g.fill();g.fillRect(x-r*.7,y-2,r*1.4,2);g.fillStyle='rgba(255,210,230,.7)';for(let j=-1;j<=1;j++)g.fillRect(x+j*r*.4-.5,y,1,4+Math.sin(T*8+j+i)*2)}}
 // 演出
 for(const f of FX){const x=X(f.x),y=Y(f.y),k=f.t/f.t0;
  if(f.ty==='slash'){const pr=1-k,w=f.w,h=f.h;g.save();g.translate(x,y);g.scale(f.s,1);
   const arc=(sc,col,al,th)=>{g.globalAlpha=al*Math.min(1,k*2.2);g.fillStyle=col;g.beginPath();g.ellipse(0,0,w/2*sc,h/2*sc,0,Math.PI*(1.05-pr*.2),Math.PI*(1.05-pr*.2)+Math.PI*(.4+pr*.75));g.ellipse(0,h*th,w/2*sc*.94,h/2*sc*(1-th*2.2),0,Math.PI*(1.05-pr*.2)+Math.PI*(.4+pr*.75),Math.PI*(1.05-pr*.2),true);g.fill()};
   g.globalCompositeOperation='lighter';arc(1.12,f.ev?'rgba(255,140,70,.5)':'rgba(255,220,160,.35)',.9,.12);g.globalCompositeOperation='source-over';arc(1,f.ev?'rgba(255,200,140,.85)':'rgba(255,244,220,.8)',1,.18);arc(.97,'#ffffff',1,.3);g.restore();g.globalAlpha=1}
  else if(f.ty==='spear'){const hit=f.t<=f.t0*.35,r=f.r,c=f.ev?'255,210,120':'235,240,255';if(!hit){const q=1-k;g.strokeStyle=`rgba(${c},${.3+.4*q})`;g.lineWidth=1;g.beginPath();g.ellipse(x,y,r,r*.55,0,0,TAU);g.stroke();for(let i=0;i<6;i++){const an=i/6*TAU+T*3;g.fillStyle=`rgba(${c},${.6*q})`;g.fillRect(x+Math.cos(an)*r|0,y+Math.sin(an)*r*.55|0,2,2)}
    const yy=y-LH*(1-Math.min(1,q/.65));g.globalCompositeOperation='lighter';g.globalAlpha=.7;g.drawImage(glowC(c),x-10,yy-90,20,90);g.globalAlpha=1;g.globalCompositeOperation='source-over';g.fillStyle=`rgba(${c},.95)`;g.fillRect(x-1,yy-70,3,70);g.fillStyle='#fff';g.fillRect(x,yy-70,1,70);g.beginPath();g.moveTo(x-5,yy-6);g.lineTo(x+5,yy-6);g.lineTo(x,yy+4);g.fill()}
   else{const a=f.t/(f.t0*.35);g.globalCompositeOperation='lighter';g.globalAlpha=a;g.drawImage(glowC(c),x-r*1.6,y-r*1.6-10,r*3.2,r*3.2);g.drawImage(glowC(c),x-8,y-110,16,110);g.globalAlpha=1;g.globalCompositeOperation='source-over';g.fillStyle=`rgba(255,255,255,${a})`;g.fillRect(x-1,y-90,3,90)}}
  else if(f.ty==='wave'){g.strokeStyle=`rgba(${f.c},${k*.8})`;g.lineWidth=2*k+.5;g.beginPath();g.ellipse(x,y,f.r*(1-k*.7),f.r*.55*(1-k*.7),0,0,TAU);g.stroke()}
  else if(f.ty==='lvup'){const q=1-k;g.strokeStyle=`rgba(255,220,140,${k})`;g.lineWidth=2;g.beginPath();g.ellipse(x,y-4,10+q*60,(10+q*60)*.55,0,0,TAU);g.stroke();g.globalCompositeOperation='lighter';g.globalAlpha=k;g.drawImage(glowC('255,220,140'),x-30,y-70,60,70);g.globalAlpha=1;g.globalCompositeOperation='source-over'}
  else if(f.ty==='die'){const r=(1-k)*16;g.fillStyle=`rgba(255,240,220,${k*.7})`;for(let i=0;i<6;i++){const an=i/6*TAU;g.fillRect(x+Math.cos(an)*r|0,y-10+Math.sin(an)*r*.6|0,2,2)}}
  else if(f.ty==='puff'){g.fillStyle=`rgba(255,200,120,${k*.6})`;g.beginPath();g.arc(x,y-10,(1-k)*14+4,0,TAU);g.fill()}}
 drawEB(X,Y);drawPT(X,Y);
 // ダメージの数字
 g.font='8px '+FP;g.textAlign='center';for(const d of DN){g.globalAlpha=Math.min(1,d.t*3);g.fillStyle='rgba(0,0,0,.6)';g.fillText(d.v,X(d.x)+1,Y(d.y)+1);g.fillStyle='#fff';g.fillText(d.v,X(d.x),Y(d.y))}g.globalAlpha=1;
 // 暗さ（場所の雰囲気）
 if(TM.dark){if(!VIG){VIG=MKC(LW,LH);const x=VIG.getContext('2d'),gr=x.createRadialGradient(LW/2,LH/2,LH*.25,LW/2,LH/2,hyp(LW,LH)*.55);gr.addColorStop(0,'rgba(0,0,10,0)');gr.addColorStop(1,`rgba(0,0,10,${TM.dark})`);x.fillStyle=gr;x.fillRect(0,0,LW,LH)}g.drawImage(VIG,0,0)}
 // 画面の外の宝箱：画面の端に矢印
 for(const k of PK){if(k.ty!=='chest')continue;const sx=X(k.x),sy=Y(k.y)-10;if(sx>-6&&sx<LW+6&&sy>-6&&sy<LH+6)continue;const cx=LW/2,cy=LH/2,dx=sx-cx,dy=sy-cy,m=30,f=Math.min((LW/2-m)/Math.abs(dx||1e-6),(LH/2-m)/Math.abs(dy||1e-6)),ax=cx+dx*f,ay=cy+dy*f,a=Math.atan2(dy,dx),pu=1+Math.sin(T*6)*.12,d=Math.round(hyp(k.x-p.x,k.y-p.y)/10);
  g.globalCompositeOperation='lighter';g.globalAlpha=.6;g.drawImage(glowC(k.big?'255,120,90':'255,200,100'),ax-22,ay-22,44,44);g.globalAlpha=1;g.globalCompositeOperation='source-over';g.save();g.translate(ax,ay);g.rotate(a);g.scale(pu,pu);g.fillStyle=k.big?'#ff8a60':'#ffd060';g.beginPath();g.moveTo(16,0);g.lineTo(4,-9);g.lineTo(4,9);g.fill();g.restore();
  const s2=1.4;g.save();g.translate(ax-Math.cos(a)*8,ay-Math.sin(a)*8+4);g.scale(s2,s2);g.fillStyle=k.big?'#7a2024':'#6a4420';g.fillRect(-5,-5,10,6);g.fillStyle=k.big?'#9a2c30':'#80542a';g.fillRect(-5,-8,10,3);g.fillStyle='#e8c060';g.fillRect(-5,-5,10,1);g.fillRect(-1,-5,2,2);g.restore();g.font='8px '+FP;g.textAlign='center';g.fillStyle='rgba(0,0,0,.6)';g.fillText(d+'m',ax-Math.cos(a)*8+1,ay-Math.sin(a)*8+17);g.fillStyle='#ffe0a0';g.fillText(d+'m',ax-Math.cos(a)*8,ay-Math.sin(a)*8+16)}
 // 自分のHP
 const px=X(p.x),py=Y(p.y);g.fillStyle='rgba(0,0,0,.6)';g.fillRect(px-14,py+5,28,3);g.fillStyle='#d83848';g.fillRect(px-14,py+5,28*p.hp/p.s.mhp,3)}
function drawHUD(){const p=P;
 // 経験
 g.fillStyle='#10131c';g.fillRect(0,0,UW,9);g.fillStyle='#3a6ad8';g.fillRect(0,0,UW*Math.min(1,p.xp/xpNeed(p.lv)),9);g.fillStyle='rgba(255,255,255,.15)';g.fillRect(0,0,UW*Math.min(1,p.xp/xpNeed(p.lv)),2);tx('Lv '+p.lv,UW-6,8,'#fff','right',8,FP);
 tx(mm(TIME),UW/2,30,'#fff','center',14,FP);
 // 武器・持ち物
 const SZ=TOUCH?30:28,GP=SZ+3;
 const slot=(x,y,ic,glow,lv,mx,col,f,sel)=>{box(x,y,SZ,SZ,sel?'rgba(70,56,30,.9)':'rgba(10,12,20,.72)');g.fillStyle=`rgba(${col},.45)`;g.fillRect(x,y,SZ,1);icon(ic,x+3,y+2,SZ-6,glow);const pw=(SZ-4)/mx;for(let j=0;j<mx;j++){g.fillStyle=j<lv?`rgba(${col},1)`:'rgba(255,255,255,.12)';g.fillRect(x+2+j*pw|0,y+SZ-3,Math.max(1,pw-1|0),2)}btn(x,y,SZ,SZ,f)};
 p.ws.forEach((w,i)=>slot(4+i*GP,13,w.evo?W[w.k].evo.ic:W[w.k].ic,w.evo,w.evo?8:w.lv,8,w.evo?'255,210,110':'255,200,80',()=>openInf('w',w.k),INF&&INF.k===w.k));
 Object.keys(p.pas).forEach((k,i)=>slot(4+i*GP,13+GP,PS[k].ic,0,p.pas[k],PS[k].m,'130,190,255',()=>openInf('p',k),INF&&INF.k===k));
 tx('撃破 '+KILLS,UW-8,26,'#e8e0d0','right',12);tx('G '+GOLD,UW-8,42,'#ffd860','right',12);
 // 一時停止
 box(UW-34,50,28,20,'rgba(10,12,20,.6)');tx('II',UW-20,64,'#c8d0e0','center',9,FP);btn(UW-42,46,42,30,()=>{if(MODE==='play'&&!INF)PAUSE=!PAUSE});
 if(BANNER){const a=Math.min(1,BANNER.t*2);g.globalAlpha=a;tx(BANNER.s,UW/2,UH*.3,'#f0e6c8','center',20);if(BANNER.sub)tx(BANNER.sub,UW/2,UH*.3+18,'#b8b0a8','center',11);g.globalAlpha=1}
 if(JOY.on&&MODE==='play'){g.strokeStyle='rgba(255,255,255,.25)';g.lineWidth=1.5;g.beginPath();g.arc(JOY.ox/US,JOY.oy/US,34/US,0,TAU);g.stroke();g.fillStyle='rgba(240,230,200,.4)';g.beginPath();g.arc(JOY.x/US,JOY.y/US,13/US,0,TAU);g.fill()}}
function panel(w,h){const x=(UW-w)/2|0,y=(UH-h)/2|0;g.fillStyle='rgba(0,0,0,.45)';g.fillRect(0,0,UW,UH);box(x,y,w,h,'rgba(16,18,28,.95)');g.fillStyle='rgba(216,184,96,.5)';g.fillRect(x,y,w,1);g.fillRect(x,y+h-1,w,1);return[x,y]}
function drawPause(){if(EVL)return drawEvl();const p=P,w=Math.min(UW-20,360),h=310;const[x,y]=panel(w,h);tx('一時停止',UW/2,y+24,'#f0e6c8','center',15);
 p.ws.forEach((wp,i)=>{const yy=y+40+i*20;icon(wp.evo?W[wp.k].evo.ic:W[wp.k].ic,x+12,yy,16,wp.evo);tx((wp.evo?W[wp.k].evo.n:W[wp.k].n)+'  Lv'+wp.lv,x+32,yy+12,'#e8e0d0','left',10);btn(x+8,yy-1,w/2-12,19,()=>openInf('w',wp.k))});
 Object.keys(p.pas).forEach((k,i)=>{const yy=y+40+i*20;icon(PS[k].ic,x+w/2+6,yy,16);tx(PS[k].n+'  Lv'+p.pas[k],x+w/2+26,yy+12,'#e8e0d0','left',10);btn(x+w/2+2,yy-1,w/2-10,19,()=>openInf('p',k))});
 const s=p.s;tx(`力 ${Math.round(s.might*100)}%　鎧 ${s.armor}　最大HP ${s.mhp}　回復 ${s.regen.toFixed(1)}　待ち時間 ${Math.round(s.cd*100)}%`,UW/2,y+180,'#a8b0c0','center',9);tx(`範囲 ${Math.round(s.area*100)}%　持続 ${Math.round(s.dur*100)}%　移動 ${Math.round(s.move*100)}%　磁力 ${Math.round(s.magnet*100)}%　幸運 ${Math.round(s.luck*100)}%`,UW/2,y+194,'#a8b0c0','center',9);
 const b=(lab,yy,f,c)=>{box(UW/2-70,yy,140,24,c||'rgba(50,56,80,.95)');tx(lab,UW/2,yy+16,'#fff','center',11);btn(UW/2-70,yy,140,24,f)};b('進化の一覧',y+208,()=>{EVL=1;snd('cl')},'rgba(80,64,30,.95)');b('再開',y+238,()=>{PAUSE=0});b('諦める',y+270,()=>{PAUSE=0;P.dead=1;endRun()},'rgba(90,40,40,.95)')}
// 進化の組み合わせ一覧（一時停止から）：武器 Lv8 ＋ 持ち物 → 宝箱で進化。持っている物は明るく、そろった物は金色
let EVL=0;function drawEvl(){const p=P,ks=Object.keys(W),rh=Math.min(32,(UH-90)/ks.length),w=Math.min(UW-20,460),h=58+ks.length*rh+34;const[x,y]=panel(w,h);tx('進化の組み合わせ',UW/2,y+24,'#ffd880','center',15);tx('武器を Lv8 にして、対の持ち物を持っていれば、宝箱から進化する',UW/2,y+42,'#9a98ac','center',9);
 ks.forEach((k,i)=>{const D=W[k],wp=p.ws.find(q=>q.k===k),hp=!!p.pas[D.evo.p],yy=y+54+i*rh,ok=wp&&(wp.lv>=8||wp.evo)&&hp,done=wp&&wp.evo;if(ok||done){g.fillStyle='rgba(255,210,110,.08)';g.fillRect(x+8,yy,w-16,rh-3)}
  const c1=x+14,c2=x+w*.4,c3=x+w*.64,is=Math.min(22,rh-6),ty=yy+rh/2+3;
  g.globalAlpha=wp?1:.4;icon(D.ic,c1,yy+(rh-3-is)/2,is);tx(D.n+(wp?(wp.evo?'':'  Lv'+wp.lv):''),c1+is+6,ty,wp&&wp.lv>=8?'#ffd880':'#e8e0d0','left',10);g.globalAlpha=1;
  tx('＋',c2-12,ty,'#8a8498','center',10);g.globalAlpha=hp?1:.4;icon(PS[D.evo.p].ic,c2,yy+(rh-3-is)/2,is);tx(PS[D.evo.p].n,c2+is+6,ty,hp?'#a8d0ff':'#c8c4d0','left',10);g.globalAlpha=1;
  tx('→',c3-10,ty,'#8a8498','center',10);g.globalAlpha=done||ok?1:.55;icon(D.evo.ic,c3,yy+(rh-3-is)/2,is,done||ok);tx(D.evo.n,c3+is+6,ty,done?'#ffd860':ok?'#ffe8a0':'#c8c4d0','left',10);if(done)tx('済',x+w-14,ty,'#ffd860','right',9);else if(ok)tx('宝箱を待つ',x+w-14,ty,'#e8c070','right',9);g.globalAlpha=1});
 box(UW/2-60,y+h-30,120,22,'rgba(50,56,80,.95)');tx('戻る',UW/2,y+h-15,'#fff','center',11);btn(0,0,UW,UH,()=>{EVL=0})}
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
addEventListener('pointerdown',e=>{audioOn();if(e.pointerType==='touch'&&!TOUCH){TOUCH=1;fit()}const x=lx(e.clientX),y=ly(e.clientY),pm=MODE;if(hitBtn(x/US,y/US)){if(pm!=='play'&&MODE==='play'&&!PAUSE&&!INF&&e.pointerType!=='mouse')Object.assign(JOY,{on:1,id:e.pointerId,ox:x,oy:y,x,y});return}if(MODE==='char')CSL.sx={x,y};
 if(MODE==='play'&&!PAUSE&&!INF){if(e.pointerType!=='mouse'){Object.assign(JOY,{on:1,id:e.pointerId,ox:x,oy:y,x,y})}else{MP.down=1;MP.x=x;MP.y=y}}});
addEventListener('pointermove',e=>{const x=lx(e.clientX),y=ly(e.clientY);if(MODE==='lv'&&e.pointerType==='mouse'&&LVA.pick<0)for(const r of LVR)if(x/US>=r.x&&x/US<=r.x+r.w&&y/US>=r.y&&y/US<=r.y+r.h)SEL=r.i;if(e.pointerId===JOY.id){JOY.x=x;JOY.y=y}MP.x=x;MP.y=y});
const up=e=>{if(MODE==='char'&&CSL.sx){const dx=lx(e.clientX)-CSL.sx.x;if(Math.abs(dx)>40)charGo(SEL+(dx<0?1:-1),dx<0?1:-1);CSL.sx=null}if(e.pointerId===JOY.id){JOY.on=0;JOY.id=-1}if(e.pointerType==='mouse')MP.down=0};addEventListener('pointerup',up);addEventListener('pointercancel',up);
addEventListener('keydown',e=>{audioOn();const k=e.key.toLowerCase();KEY[k]=1;
 if(MODE==='lv'){if(k==='arrowdown'||k==='s'||k==='arrowright'||k==='d')SEL=(SEL+1)%LVO.length;if(k==='arrowup'||k==='w'||k==='arrowleft'||k==='a')SEL=(SEL+LVO.length-1)%LVO.length;if(k==='enter'||k===' ')pickOpt(SEL);const n=+k;if(n>=1&&n<=LVO.length)pickOpt(n-1)}
 else if(MODE==='chest'&&(k==='enter'||k===' ')){const tm=chestTimes(CHST);if(CHST.t<tm.end){CHST.t=tm.end;for(const it of CHST.items)it.lk=1}else chestClose()}
 else if(INF&&(k==='escape'||k==='enter'||k===' '))INF=null;
 else if(EVL&&(k==='escape'||k==='enter'||k===' '))EVL=0;
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
window.GM={set PAUSE(v){PAUSE=v},set EVL(v){EVL=v},get P(){return P},get EN(){return EN},get MODE(){return MODE},set MODE(v){MODE=v},get TIME(){return TIME},set TIME(v){TIME=v},get LVO(){return LVO},newRun,update,pickOpt,openChest,addXp,set STG(v){STG=v},set CHI(v){CHI=v},get KILLS(){return KILLS},get PK(){return PK},endRun,stats,get CHST(){return CHST},set CHST(v){CHST=v}};
