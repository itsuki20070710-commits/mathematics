# 数学 言語化ノート

大学受験数学の「解法の言語化・思考トリガー」を蓄積し、検索→復習→類題→まとめ資料まで
一人で回すブラウザ完結型の個人用Webアプリ。サーバ・DB・ログインは持たず、データは
すべてブラウザ内（IndexedDB）に保存します。

## 技術スタック
Vite + React 18 + TypeScript / Tailwind CSS / Dexie(IndexedDB) / KaTeX

## 開発
```bash
npm install
npm run dev      # 開発サーバ
npm run build    # 本番ビルド（dist/）
npm run preview  # ビルド結果のプレビュー
```

## デプロイ（GitHub Pages）
`main` へ push すると GitHub Actions（`.github/workflows/deploy.yml`）が
自動でビルドして GitHub Pages に公開します。公開URLは
`https://<ユーザー名>.github.io/mathematics/` です。

初回のみ、リポジトリの **Settings → Pages → Build and deployment → Source** を
**「GitHub Actions」** に設定してください。

## 開発フェーズ
- **Phase 1（本リリース）**: 骨組み・Dexieデータ層・登録/ライブラリ/分析/設定・KaTeX・Pages自動デプロイ（AIなしで完結）
- Phase 2: AI基盤・OCR・自動分類
- Phase 3: AIヒント・類題生成・まとめ資料
- Phase 4: 復習キュー・PWA・UI磨き込み

詳細な仕様は [`SPEC.md`](./SPEC.md)、開発ルールは [`CLAUDE.md`](./CLAUDE.md) を参照。
