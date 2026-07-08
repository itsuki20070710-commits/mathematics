# 数学 言語化ノート — 全体仕様（SPEC）

大学受験数学の「解法の言語化・思考トリガー」を蓄積し、検索→復習→類題演習→まとめ資料生成まで
一人で回すブラウザ完結型アプリ。個人利用専用。サーバ・DB・ログインは持たず、データは全て
ブラウザ内（IndexedDB）に保存する。

## 技術スタック（厳守）
- Vite + React 18 + TypeScript
- Tailwind CSS
- データ保存: IndexedDB（Dexieを使用）。画像本体もここに保存
- 設定保存: localStorage（APIキー・モデル名・表示設定のみ）
- 数式表示: KaTeX（$...$ と $$...$$ をレンダリング）
- PWA対応: vite-plugin-pwa（後のPhaseで有効化）
- デプロイ: GitHub Actions で GitHub Pages に自動デプロイ（vite.config の base をリポジトリ名に合わせる）
- モバイルファースト。下部固定タブで画面切替する単一ページSPA

## データモデル（IndexedDB / Dexie）

```
Note {
  id: string (crypto.randomUUID)
  createdAt, updatedAt: ISO文字列
  university?, year?, problemNo?: string
  title: string                     // テーマ・概要
  problemText?: string              // 問題文（LaTeX混在可）
  imageIds: string[]                // 画像テーブルへの参照
  verbalization: string             // 解法の言語化（必須・本体）
  trigger?: string                  // 実戦ヒント＝解法のトリガー
  essence?: string                  // 数学的本質・原理
  solution?: string                 // 解答・思考経路
  field: string                     // 分野
  tags: string[]
  difficulty: '基礎'|'標準'|'難関'
  importance: 1|2|3
  review: { stage:number(0-5), nextAt:string|null, log:{date,grade:'A'|'B'|'C'}[] }
  similar: { createdAt, problem, solution, points }[]
}
Image { id:string, blob:Blob }   // 別テーブル。保存前に長辺1600px・JPEG圧縮
```

分野リスト（定数・編集可）:
微分・積分 / 極限 / 数列 / ベクトル / 確率・場合の数 / 整数問題 / 図形と方程式 / 三角関数 / 指数・対数 / 複素数平面 / 二次曲線 / 式と証明・方程式 / 二次関数 / 幾何 / その他

## 画面（下部タブ: 登録 / ライブラリ / ヒント / 復習 / 分析 / 設定）
- 設定: Gemini APIキー入力（目隠し・保存/消去・接続テスト）、使用モデル名の変更、JSONエクスポート（画像込み/なし選択可）、JSONインポート（id一致でマージ、updatedAtが新しい方を採用）、最終エクスポート日表示と30日超で注意バッジ
- 登録（ストック登録）: 大学/年度・大問/テーマ/問題文/写真添付/言語化(必須)/分野/タグ/難易度/重要度。保存ボタン名は「ノートに刻む」。※AI機能はPhase 2以降
- ライブラリ: カード一覧（分野バッジ・大学年度・難易度・★・タイトル・言語化・トリガー・タグ・日付）、全文検索、分野/タグフィルタ、編集・削除、KaTeX描画
- ヒント: キーワードのローカル検索（title/tags/trigger/verbalization対象）、頻出タグをチップ表示。※AIヒントはPhase 3
- 復習: nextAtが今日以前のノートを出題→自力想起→開示→A/B/C評価。A=次stage（間隔1/3/7/14/30日）、B=同stage反復、C=stage1(翌日)へ。新規はstage0・翌日開始。※Phase 4
- 分析: 総数・★3数・難関数、分野別件数（タップでフィルタ）

## AI（Phase 2以降・Gemini APIをブラウザからfetchで直接呼び出し）
- キーはlocalStorageのみ。既定モデル名は "gemini-3.5-flash"（設定で変更可）
- AI呼び出しは src/lib/ai.ts の1モジュールに集約し、後でClaude API等に差し替え可能にする
- OCR: 問題写真→問題文テキスト＋LaTeX数式（登録画面の「画像から問題文を読み取る」）
- 自動分類: 言語化テキスト→分野/タグ/トリガー/本質/難易度候補をJSONで返しフォームへ反映
- AIヒント: 全ノートの要約＋質問（＋任意で問題写真）→関連ノート＋3段階ヒント（方針→道具→最初の一手）。答えは絶対に出さない
- 類題生成: ノート詳細から難易度指定（同等/易しめ/難しめ）→問題のみ表示→「解答を見る」で開示→similarに保存可
- まとめ資料: 分野orタグ選択→該当ノート群から「トリガー一覧表＋本質整理＋代表例」のMarkdown生成。KaTeXプレビュー・.mdダウンロード・A4印刷用CSS

## 開発フェーズ
- Phase1: 骨組み＋Dexieデータ層＋登録/ライブラリ/分析/設定(エクスポート・インポート)＋KaTeX＋Pages自動デプロイ（AIなしで完結）
- Phase2: AI基盤(ai.ts)＋OCR＋自動分類
- Phase3: AIヒント＋類題生成＋まとめ資料
- Phase4: 復習キュー＋PWA＋UI磨き込み

## Phase 1 の完了条件
- npm run dev / build が通る
- ノートのCRUDがIndexedDBで動く（リロードしても消えない）
- 登録・ライブラリ・分析・設定の4画面が動作
- JSONエクスポート/インポートが往復で成立
- KaTeXで数式が表示される
- GitHub Actionsでmainへのpush時にPagesへ自動デプロイされる
- スマホ幅で崩れない
