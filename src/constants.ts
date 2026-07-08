import type { Difficulty, Importance } from './types'

// 分野リスト（定数・編集可）。SPEC.md の順に合わせる。
export const FIELDS: string[] = [
  '微分・積分',
  '極限',
  '数列',
  'ベクトル',
  '確率・場合の数',
  '整数問題',
  '図形と方程式',
  '三角関数',
  '指数・対数',
  '複素数平面',
  '二次曲線',
  '式と証明・方程式',
  '二次関数',
  '幾何',
  'その他',
]

export const DIFFICULTIES: Difficulty[] = ['基礎', '標準', '難関']
export const IMPORTANCES: Importance[] = [1, 2, 3]

// 復習の間隔（日）。stage 1..5 で使用（Phase 4 で本格運用）。
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30]

// localStorage キー（設定のみを保存。ノートデータは保存しない）
export const LS_KEYS = {
  apiKey: 'mvn.apiKey',
  modelName: 'mvn.modelName',
  display: 'mvn.display',
  lastExportAt: 'mvn.lastExportAt',
} as const

// 既定のモデル名（設定で変更可）
export const DEFAULT_MODEL = 'gemini-3.5-flash'

// 最終エクスポートからこの日数を超えると注意バッジを表示
export const EXPORT_WARN_DAYS = 30
