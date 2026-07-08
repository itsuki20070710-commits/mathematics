// アプリのデータモデル（SPEC.md に対応）

export type Difficulty = '基礎' | '標準' | '難関'
export type Importance = 1 | 2 | 3
export type Grade = 'A' | 'B' | 'C'

export interface ReviewLog {
  date: string // ISO文字列
  grade: Grade
}

export interface Review {
  stage: number // 0-5
  nextAt: string | null // ISO文字列（出題予定日）
  log: ReviewLog[]
}

export interface SimilarProblem {
  createdAt: string
  problem: string
  solution: string
  points: string
}

export interface Note {
  id: string // crypto.randomUUID
  createdAt: string // ISO文字列
  updatedAt: string // ISO文字列
  university?: string
  year?: string
  problemNo?: string
  title: string // テーマ・概要
  problemText?: string // 問題文（LaTeX混在可）
  imageIds: string[] // Image テーブルへの参照
  verbalization: string // 解法の言語化（必須・本体）
  trigger?: string // 実戦ヒント＝解法のトリガー
  essence?: string // 数学的本質・原理
  solution?: string // 解答・思考経路
  field: string // 分野
  tags: string[]
  difficulty: Difficulty
  importance: Importance
  review: Review
  similar: SimilarProblem[]
}

export interface StoredImage {
  id: string
  blob: Blob
}
