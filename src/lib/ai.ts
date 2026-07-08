// AI 呼び出しを集約する唯一のモジュール。
// 現状は Gemini の generateContent REST をブラウザから fetch で直接呼ぶ。
// 将来 Claude API 等へ差し替える場合もこのファイルの実装だけを変えればよい。
//
// APIキー・モデル名は localStorage にのみ保存する（コード/リポジトリには含めない）。

import { DEFAULT_MODEL, DIFFICULTIES, FIELDS, LS_KEYS } from '../constants'
import type { Difficulty } from '../types'

const API_ROOT = 'https://generativelanguage.googleapis.com/v1beta/models'

// ユーザーに提示するための、日本語メッセージ付きエラー
export class AiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AiError'
  }
}

export function getApiKey(): string {
  return (localStorage.getItem(LS_KEYS.apiKey) ?? '').trim()
}

export function getModel(): string {
  const m = (localStorage.getItem(LS_KEYS.modelName) ?? '').trim()
  return m || DEFAULT_MODEL
}

export function hasApiKey(): boolean {
  return getApiKey().length > 0
}

// --- 低レベル呼び出し ---

interface Part {
  text?: string
  inline_data?: { mime_type: string; data: string }
}

function requireKey(): string {
  const key = getApiKey()
  if (!key) {
    throw new AiError('APIキーが未設定です。設定画面で保存してください。')
  }
  return key
}

// HTTP ステータスをユーザー向けメッセージへ整形する
function httpErrorMessage(status: number, detail?: string): string {
  const base = (() => {
    switch (status) {
      case 400:
        return 'リクエストが不正です。入力内容を確認してください。'
      case 401:
      case 403:
        return 'APIキーが無効か、権限がありません。設定でキーを確認してください。'
      case 404:
        return 'モデルが見つかりません。設定でモデル名を確認してください。'
      case 429:
        return 'レート制限に達しました。しばらく待って再試行してください。'
      default:
        return status >= 500
          ? 'サーバー側でエラーが発生しました。時間をおいて再試行してください。'
          : `エラーが発生しました（HTTP ${status}）。`
    }
  })()
  return detail ? `${base}（${detail}）` : base
}

async function callGemini(
  parts: Part[],
  opts: { json?: boolean; temperature?: number } = {},
): Promise<string> {
  const key = requireKey()
  const model = getModel()

  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: opts.temperature ?? 0.2,
      ...(opts.json ? { responseMimeType: 'application/json' } : {}),
    },
  }

  let res: Response
  try {
    res = await fetch(`${API_ROOT}/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key,
      },
      body: JSON.stringify(body),
    })
  } catch {
    throw new AiError('ネットワークエラーです。接続を確認してください。')
  }

  if (!res.ok) {
    let detail: string | undefined
    try {
      const err = await res.json()
      detail = err?.error?.message
    } catch {
      // 本文が読めない場合はステータスのみで通知
    }
    throw new AiError(httpErrorMessage(res.status, detail))
  }

  const data = await res.json()
  const parts0 = data?.candidates?.[0]?.content?.parts
  const text: string = Array.isArray(parts0)
    ? parts0.map((p: Part) => p.text ?? '').join('')
    : ''
  if (!text.trim()) {
    // 安全機構でブロックされた場合など
    const reason = data?.promptFeedback?.blockReason
    throw new AiError(
      reason
        ? `応答が得られませんでした（${reason}）。`
        : '応答が空でした。もう一度お試しください。',
    )
  }
  return text
}

async function blobToBase64(blob: Blob): Promise<string> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
  // "data:image/jpeg;base64,XXXX" の後半のみを返す
  const comma = dataUrl.indexOf(',')
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl
}

// コードフェンス除去 → 最初の { 〜 最後の } を抽出 → JSON.parse
function parseJsonLoose<T>(text: string): T {
  let s = text.trim()
  // ```json ... ``` / ``` ... ``` のフェンスを剥がす
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  if (fence) s = fence[1].trim()
  // 最初のオブジェクト範囲を抽出
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  if (start >= 0 && end > start) s = s.slice(start, end + 1)
  try {
    return JSON.parse(s) as T
  } catch {
    throw new AiError('AIの応答を解析できませんでした。もう一度お試しください。')
  }
}

// --- 公開 API ---

// 軽い1回の呼び出しで疎通確認する
export async function testConnection(): Promise<{ ok: true; model: string }> {
  const out = await callGemini([{ text: 'pong とだけ返答してください。' }], {
    temperature: 0,
  })
  if (!out.trim()) throw new AiError('応答が空でした。')
  return { ok: true, model: getModel() }
}

// 画像（問題写真）→ 問題文テキスト（LaTeX混在）
export async function ocrImage(blob: Blob): Promise<string> {
  const data = await blobToBase64(blob)
  const mime = blob.type || 'image/jpeg'
  const prompt =
    'この画像は大学受験数学の問題です。問題文を正確に文字起こししてください。' +
    '数式は LaTeX で表記し、インラインは $...$、独立した式は $$...$$ を使ってください。' +
    '問題文の本文のみを出力し、前置き・解説・「以下が問題文です」等は書かないでください。'
  const text = await callGemini(
    [{ text: prompt }, { inline_data: { mime_type: mime, data } }],
    { temperature: 0 },
  )
  return text.trim()
}

export interface Classification {
  field?: string
  tags?: string[]
  trigger?: string
  essence?: string
  difficulty?: Difficulty
}

// 言語化テキスト → 分野/タグ/トリガー/本質/難易度 の候補
export async function classifyVerbalization(
  text: string,
): Promise<Classification> {
  const prompt =
    'あなたは大学受験数学の指導者です。次の「解法の言語化」テキストを分析し、' +
    'JSON オブジェクトだけを返してください（前後に説明やコードフェンスは不要）。\n' +
    'キーと制約:\n' +
    `- field: 次のいずれか1つ（厳密一致）: ${FIELDS.join(' / ')}\n` +
    '- tags: 短い日本語キーワードの配列（最大5個）\n' +
    '- trigger: 「〜を見たら〜」形式の実戦的な思考トリガー（1〜2文）\n' +
    '- essence: この解法の数学的な本質・原理（1〜2文）\n' +
    `- difficulty: 次のいずれか1つ: ${DIFFICULTIES.join(' / ')}\n\n` +
    `対象テキスト:\n${text}`

  const raw = await callGemini([{ text: prompt }], {
    json: true,
    temperature: 0.2,
  })
  const parsed = parseJsonLoose<Classification>(raw)

  // 想定外の値は落とす（フォーム側の検証と二重化）
  const result: Classification = {}
  if (typeof parsed.field === 'string' && FIELDS.includes(parsed.field)) {
    result.field = parsed.field
  }
  if (Array.isArray(parsed.tags)) {
    result.tags = parsed.tags
      .filter((t): t is string => typeof t === 'string')
      .map((t) => t.trim())
      .filter(Boolean)
  }
  if (typeof parsed.trigger === 'string') result.trigger = parsed.trigger.trim()
  if (typeof parsed.essence === 'string') result.essence = parsed.essence.trim()
  if (
    typeof parsed.difficulty === 'string' &&
    (DIFFICULTIES as string[]).includes(parsed.difficulty)
  ) {
    result.difficulty = parsed.difficulty as Difficulty
  }
  return result
}
