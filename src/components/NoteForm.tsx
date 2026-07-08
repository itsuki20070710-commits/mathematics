import { useState } from 'react'
import type { Difficulty, Importance, Note } from '../types'
import { DIFFICULTIES, FIELDS } from '../constants'
import { compressAndSaveImage, getImageBlob } from '../lib/image'
import { classifyVerbalization, hasApiKey, ocrImage } from '../lib/ai'
import { ImageThumb } from './ui'

// 登録・編集の両方で使う入力値
export interface NoteFormValues {
  university: string
  year: string
  problemNo: string
  title: string
  problemText: string
  verbalization: string
  trigger: string
  essence: string
  solution: string
  field: string
  tags: string[]
  difficulty: Difficulty
  importance: Importance
  imageIds: string[]
}

export function emptyValues(): NoteFormValues {
  return {
    university: '',
    year: '',
    problemNo: '',
    title: '',
    problemText: '',
    verbalization: '',
    trigger: '',
    essence: '',
    solution: '',
    field: FIELDS[0],
    tags: [],
    difficulty: '標準',
    importance: 2,
    imageIds: [],
  }
}

export function valuesFromNote(note: Note): NoteFormValues {
  return {
    university: note.university ?? '',
    year: note.year ?? '',
    problemNo: note.problemNo ?? '',
    title: note.title,
    problemText: note.problemText ?? '',
    verbalization: note.verbalization,
    trigger: note.trigger ?? '',
    essence: note.essence ?? '',
    solution: note.solution ?? '',
    field: note.field,
    tags: note.tags ?? [],
    difficulty: note.difficulty,
    importance: note.importance,
    imageIds: note.imageIds ?? [],
  }
}

interface NoteFormProps {
  initial?: NoteFormValues
  submitLabel: string
  onSubmit: (values: NoteFormValues) => Promise<void> | void
  onCancel?: () => void
}

const labelCls = 'block text-sm font-medium text-slate-700 mb-1'
const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'

export default function NoteForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: NoteFormProps) {
  const [v, setV] = useState<NoteFormValues>(initial ?? emptyValues())
  const [tagInput, setTagInput] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [ocrBusy, setOcrBusy] = useState(false)
  const [classifyBusy, setClassifyBusy] = useState(false)
  const [aiMsg, setAiMsg] = useState('')
  const aiReady = hasApiKey()

  function set<K extends keyof NoteFormValues>(key: K, value: NoteFormValues[K]) {
    setV((prev) => ({ ...prev, [key]: value }))
  }

  function addTag() {
    const t = tagInput.trim()
    if (t && !v.tags.includes(t)) set('tags', [...v.tags, t])
    setTagInput('')
  }

  function removeTag(tag: string) {
    set(
      'tags',
      v.tags.filter((t) => t !== tag),
    )
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const ids: string[] = []
      for (const file of Array.from(files)) {
        ids.push(await compressAndSaveImage(file))
      }
      set('imageIds', [...v.imageIds, ...ids])
    } catch (e) {
      setError(e instanceof Error ? e.message : '画像の追加に失敗しました')
    } finally {
      setUploading(false)
    }
  }

  function removeImage(id: string) {
    set(
      'imageIds',
      v.imageIds.filter((x) => x !== id),
    )
  }

  // OCR: 先頭の添付画像から問題文を読み取り problemText に反映（手修正可）
  async function handleOcr() {
    setError('')
    setAiMsg('')
    const first = v.imageIds[0]
    if (!first) return
    setOcrBusy(true)
    try {
      const blob = await getImageBlob(first)
      if (!blob) throw new Error('画像を取得できませんでした')
      const text = await ocrImage(blob)
      set('problemText', text)
      setAiMsg('問題文を読み取りました（内容を確認・修正してください）')
    } catch (e) {
      setError(e instanceof Error ? e.message : '読み取りに失敗しました')
    } finally {
      setOcrBusy(false)
    }
  }

  // 自動分類: 言語化から 分野/タグ/トリガー/本質/難易度 候補をフォームへ反映
  async function handleClassify() {
    setError('')
    setAiMsg('')
    if (!v.verbalization.trim()) {
      setError('言語化を入力してから実行してください')
      return
    }
    setClassifyBusy(true)
    try {
      const c = await classifyVerbalization(v.verbalization)
      setV((prev) => {
        const mergedTags = c.tags
          ? Array.from(new Set([...prev.tags, ...c.tags]))
          : prev.tags
        return {
          ...prev,
          field: c.field ?? prev.field,
          difficulty: c.difficulty ?? prev.difficulty,
          tags: mergedTags,
          // テキスト系は既存を上書きしない（空のときだけ反映）
          trigger: prev.trigger.trim() ? prev.trigger : c.trigger ?? prev.trigger,
          essence: prev.essence.trim() ? prev.essence : c.essence ?? prev.essence,
        }
      })
      setAiMsg('AIの候補を反映しました（内容を確認・修正してください）')
    } catch (e) {
      setError(e instanceof Error ? e.message : '自動分類に失敗しました')
    } finally {
      setClassifyBusy(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!v.verbalization.trim()) {
      setError('言語化は必須です')
      return
    }
    setSaving(true)
    try {
      await onSubmit({ ...v, title: v.title.trim() || '（無題）' })
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className={labelCls}>大学</label>
          <input
            className={inputCls}
            value={v.university}
            onChange={(e) => set('university', e.target.value)}
            placeholder="東大"
          />
        </div>
        <div>
          <label className={labelCls}>年度</label>
          <input
            className={inputCls}
            value={v.year}
            onChange={(e) => set('year', e.target.value)}
            placeholder="2023"
          />
        </div>
        <div>
          <label className={labelCls}>大問</label>
          <input
            className={inputCls}
            value={v.problemNo}
            onChange={(e) => set('problemNo', e.target.value)}
            placeholder="第3問"
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>テーマ・概要（タイトル）</label>
        <input
          className={inputCls}
          value={v.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="例: 通過領域は逆像法で"
        />
      </div>

      <div>
        <label className={labelCls}>問題文（LaTeX混在可）</label>
        <textarea
          className={inputCls}
          rows={3}
          value={v.problemText}
          onChange={(e) => set('problemText', e.target.value)}
          placeholder="$a$ を実数とする。…"
        />
      </div>

      <div>
        <label className={labelCls}>写真添付</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="text-sm"
        />
        {uploading && (
          <p className="mt-1 text-xs text-slate-500">画像を圧縮中…</p>
        )}
        {v.imageIds.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {v.imageIds.map((id) => (
              <div key={id} className="relative">
                <ImageThumb
                  id={id}
                  className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(id)}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-xs text-white shadow"
                  aria-label="画像を外す"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {v.imageIds.length > 0 && (
          <div className="mt-2">
            <button
              type="button"
              onClick={handleOcr}
              disabled={!aiReady || ocrBusy}
              className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 disabled:opacity-50"
            >
              {ocrBusy ? '読み取り中…' : '🖼 画像から問題文を読み取る'}
            </button>
            <span className="ml-2 text-xs text-slate-400">
              {aiReady
                ? '先頭の画像を使用します'
                : '設定でAPIキーを保存すると使えます'}
            </span>
          </div>
        )}
      </div>

      <div>
        <label className={labelCls}>
          言語化（解法の言語化）<span className="text-rose-500">*必須</span>
        </label>
        <textarea
          className={inputCls}
          rows={5}
          value={v.verbalization}
          onChange={(e) => set('verbalization', e.target.value)}
          placeholder="この問題で何をどう考えたか、言葉で。"
        />
        <div className="mt-2">
          <button
            type="button"
            onClick={handleClassify}
            disabled={!aiReady || classifyBusy || !v.verbalization.trim()}
            className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 disabled:opacity-50"
          >
            {classifyBusy ? '分類中…' : '🤖 AI自動分類を実行'}
          </button>
          <span className="ml-2 text-xs text-slate-400">
            {aiReady
              ? '分野・タグ・トリガー・本質・難易度の候補を反映'
              : '設定でAPIキーを保存すると使えます'}
          </span>
        </div>
      </div>

      {aiMsg && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {aiMsg}
        </p>
      )}

      <div>
        <label className={labelCls}>トリガー（実戦ヒント）</label>
        <textarea
          className={inputCls}
          rows={2}
          value={v.trigger}
          onChange={(e) => set('trigger', e.target.value)}
          placeholder="「〜を見たら〜」の形で"
        />
      </div>

      <div>
        <label className={labelCls}>数学的本質・原理</label>
        <textarea
          className={inputCls}
          rows={2}
          value={v.essence}
          onChange={(e) => set('essence', e.target.value)}
        />
      </div>

      <div>
        <label className={labelCls}>解答・思考経路</label>
        <textarea
          className={inputCls}
          rows={3}
          value={v.solution}
          onChange={(e) => set('solution', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>分野</label>
          <select
            className={inputCls}
            value={v.field}
            onChange={(e) => set('field', e.target.value)}
          >
            {FIELDS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>難易度</label>
          <select
            className={inputCls}
            value={v.difficulty}
            onChange={(e) => set('difficulty', e.target.value as Difficulty)}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>重要度</label>
        <div className="flex gap-1">
          {([1, 2, 3] as Importance[]).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => set('importance', n)}
              className={`text-2xl ${
                n <= v.importance ? 'text-amber-500' : 'text-slate-300'
              }`}
              aria-label={`重要度 ${n}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls}>タグ</label>
        <div className="flex gap-2">
          <input
            className={inputCls}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTag()
              }
            }}
            placeholder="タグを入力して Enter"
          />
          <button
            type="button"
            onClick={addTag}
            className="shrink-0 rounded-lg border border-slate-300 px-3 text-sm"
          >
            追加
          </button>
        </div>
        {v.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {v.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700"
              >
                {t}
                <button
                  type="button"
                  onClick={() => removeTag(t)}
                  className="text-slate-500"
                  aria-label={`${t} を外す`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={saving || uploading}
          className="flex-1 rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? '保存中…' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 text-sm"
          >
            キャンセル
          </button>
        )}
      </div>
    </form>
  )
}
