# 戦場（仮題）

見下ろし視点（LoL 風）の3D戦闘ローグライク。Card Trail（リポジトリ `kittyo8823/card-trail` の `dev/index.html`）のキャラ・敵・曲・レリックの絵を流用している。
直下の `index.html` が遊べる完成品（1ファイル、約4.3MB）。`src/` を直したら `node tools/build.js` で作り直す。

## 決まり（ユーザー指定）
- 返事は短く、日本語で。途中経過は送らない。
- 小さく動くものから作り、見せてから広げる。
- 絵・UI は Card Trail の書き方のルールに合わせる（輪郭は付けないか薄く、安っぽい星形の光を使わない、落ち着いた文体）。

## 作り
- 準備：`card-trail` を隣にクローン（`../card-trail/dev/index.html`）し、`npm i`。テストは Playwright（環境に入っているもの、`NODE_PATH=$(npm root -g)`）。
- `tools/extract.js`：Card Trail を headless で開き、`SPR`（キャラ・敵の絵）・`rIcon`（レリックの絵）・`E`（敵データ）・層ごとの敵の組み合わせ（`FI`/`FIS`/`FI2`/`FI2J`/`FI3`/`FI3H`、エリート・ボス）を `src/assets.json` に書き出す。
- `tools/build.js`：Card Trail の「音」の区切り（`/* ===== 音 ===== */`〜`描画ヘルパー`。`bgm(k)`・`sfx(k)`・譜面・`E2B64`/`HXB64`）をそのまま切り出し、three.js と `src/game.js` を esbuild でまとめて `index.html`（と公開用の `dist/artifact.html`）を作る。
- `src/game.js` の主な部分：`TH` 場所ごとの見た目、`LAYERS` 3層の場所の組、`buildStage()` 戦場（56×40、外周の壁、道は地面の絵に描く）、`spawnE()`/`eAct()`/`doMove()` 敵（分類 `CATS`、元の行動 `mv` を順に使う、地面の赤い予告 `addTG`）、`CHR` キャラと技（今はユウキングだけ：Q 斬り払い・W 鉄壁・E 踏み込み・R 大回転）、`WB`/`WFX`/`mkWeapon` 武器、`EQ` 装備（レリック）、`drawHUD()`（パソコン）/`drawHUDT()`（指：左半分をなぞって移動 `JOY`、右下に攻撃・技のボタン）、`drawMini()` 小地図。
- 流れ：敵を全滅 → 主（ボス、場所の曲 `bx`）→ 倒すと光 `PORTAL` → 次の層。3層目の主で踏破。死んだら最初から。

## 確認
- `node tests/play.js 出力先`（自動で戦う・ボスまで）、`node tests/touch.js 出力.png`（スマホ横向きで指の操作）、`node tests/shot.js 出力.png jungle`（見せる用の1枚）。
- 公開中のアーティファクト：https://claude.ai/artifact/DqQUwqacidFZLnW5Up5S93 （`dist/artifact.html` を同じURLへ公開し直す）。

## 次の候補
キャラ選択と残り6人（坂井・坪内丸・名無し・ホーリー大輔・ネブラ・セレス）の技、ショップ・宝箱、ボスごとの専用の技。ゲームの名前は未定。
