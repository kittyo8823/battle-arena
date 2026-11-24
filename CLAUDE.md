# Battle Arena（仮題）

生き残り型のアクション（ヴァンパイアサバイバー風）。基本の仕組みはヴァンサバと同じで、キャラ・敵・場所・曲・アイコンは Card Trail（リポジトリ `kittyo8823/card-trail` の `dev/index.html`）のものを使い回す。
直下の `index.html` が遊べる完成品（1ファイル、約3.8MB）。`src/` を直したら `node tools/build.js` で作り直す。
前の版（LoL 風の3D戦闘ローグライク）は `old/` に残してある（ユーザー指定で一旦やめた）。

## 決まり（ユーザー指定）
- 返事は短く、日本語で。途中経過は送らない。
- 小さく動くものから作り、見せてから広げる。
- 絵・UI は Card Trail の書き方のルールに合わせる（輪郭は付けないか薄く、安っぽい星形の光を使わない、落ち着いた文体）。
- 画面は2Dの真上視点（ユーザーが選んだ）。

## 作り
- 準備：`card-trail` を隣にクローン（`../card-trail/dev/index.html`）し、`npm i`（esbuild）。テストは Playwright（環境に入っているもの、`NODE_PATH=$(npm root -g)`）。
- `tools/extract.js`：Card Trail を headless で開き、`SPR`（キャラ・敵の絵）・`rIcon`（レリックの絵）・`E`（敵データ）・層ごとの敵の組み合わせ（`FI`/`FIS`/`FI2`/`FI2J`/`FI3`/`FI3H`、エリート・ボス）を `src/assets.json` に書き出す。
- `tools/build.js`：Card Trail の「音」の区切り（`bgm(k)`・`sfx(k)`・譜面・`E2B64`/`HXB64`）をそのまま切り出し、`src/game.js` と合わせて `index.html`（と公開用の `dist/artifact.html`）を作る。
- 画面：世界は論理 LW×LH（高さ600、スマホ560）を整数倍 K で描く。絵は Card Trail の SPR を半分（1マス1点）、エリート・ボスは等倍。UI は US 倍した UW×UH（高さ480、スマホ400）の座標で描く（`ui()` で切り替え）。ボタンは毎フレーム `btn()` で登録。
- `src/game.js` の主な部分：`TH`/`STAGES` 場所（6か所）と地面の絵 `mkTile`、`CHS` キャラ（初めの武器と特長）、`W` 武器（9種・Lv8・`i` が Lv ごとの増分・`evo` 進化＝Lv8＋対の持ち物で宝箱から）、`PS` 持ち物（13種）、`MU` 強化（金貨で買う、localStorage `battlearena_meta`）、`stats()`/`ws()` 能力の計算、`spawner()` 時間で増える敵・1分半ごとのエリート（宝箱）・群れ `swarm`・包囲 `ring`・10/20/25分の主・30分の死神、`fire()` 武器、`lvChoices()` レベルアップの候補、`openChest()` 宝箱、`bankGems()` 遠くの結晶を赤い結晶にまとめる、`later()` 遅らせる処理（setTimeout は使わない）。
- タイトル `drawTitle()`（月夜の丘に `TS.hero` が立ち、影絵の群れ `TS.horde`、火の粉、1文字ずつ出る題字、メニューは左）、キャラ選択 `drawChar()`（光の台座に等倍×1.5で立たせ、`charGo()` で滑って切り替え、右に説明・能力の棒・初めの武器と進化、下に顔の並び。キャラの色 `col`/`lt`・二つ名 `ep`・紹介 `lore` は `CHS`）。キャラごとの記録 `META.bc`。
- 操作：WASD／矢印、マウスは押している間その方へ、指は画面のどこでもなぞる（`JOY`）。Esc で一時停止、M で音。

## 確認
- `node tests/play.js 出力先 [場所] [キャラ番号]`（30分を早送りで自動プレイ。レベル・撃破・進化を出す）、`node tests/shot.js 出力.png [場所] [キャラ] [分]`、`node tests/screens.js 出力先 [スマホ=1]`（各画面）。
- 公開中のアーティファクト：https://claude.ai/artifact/DqQUwqacidFZLnW5Up5S93 （`dist/artifact.html` を同じURLへ公開し直す）。
