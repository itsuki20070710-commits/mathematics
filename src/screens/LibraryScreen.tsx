import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Note } from '../types'
import NoteCard from '../components/NoteCard'
import NoteDetail from '../components/NoteDetail'

interface LibraryScreenProps {
  // 分析画面などから渡される初期の分野フィルタ
  fieldFilter?: string | null
  onConsumeFieldFilter?: () => void
}

function matchesQuery(note: Note, q: string): boolean {
  if (!q) return true
  const hay = [
    note.title,
    note.problemText,
    note.verbalization,
    note.trigger,
    note.essence,
    note.solution,
    ...note.tags,
    note.university,
    note.year,
  ]
    .filter(Boolean)
    .join('\n')
    .toLowerCase()
  return hay.includes(q.toLowerCase())
}

export default function LibraryScreen({
  fieldFilter,
  onConsumeFieldFilter,
}: LibraryScreenProps) {
  const [query, setQuery] = useState('')
  const [field, setField] = useState<string>(fieldFilter ?? '')
  const [tag, setTag] = useState<string>('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // 外部から渡された分野フィルタを反映（分析画面のタップ等）
  useEffect(() => {
    if (fieldFilter) {
      setField(fieldFilter)
      onConsumeFieldFilter?.()
    }
    // fieldFilter が変わったときだけ実行
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldFilter])

  const notes = useLiveQuery(
    () => db.notes.orderBy('updatedAt').reverse().toArray(),
    [],
  )

  const allTags = useMemo(() => {
    const s = new Set<string>()
    notes?.forEach((n) => n.tags.forEach((t) => s.add(t)))
    return Array.from(s).sort()
  }, [notes])

  const allFields = useMemo(() => {
    const s = new Set<string>()
    notes?.forEach((n) => s.add(n.field))
    return Array.from(s).sort()
  }, [notes])

  const filtered = useMemo(() => {
    if (!notes) return []
    return notes.filter(
      (n) =>
        (!field || n.field === field) &&
        (!tag || n.tags.includes(tag)) &&
        matchesQuery(n, query),
    )
  }, [notes, field, tag, query])

  const selected = notes?.find((n) => n.id === selectedId) ?? null

  const inputCls =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none'

  return (
    <div className="space-y-3">
      <h1 className="text-lg font-bold text-slate-900">ライブラリ</h1>

      <input
        className={inputCls}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="全文検索（タイトル・言語化・トリガー・タグ…）"
      />

      <div className="flex gap-2">
        <select
          className={inputCls}
          value={field}
          onChange={(e) => setField(e.target.value)}
        >
          <option value="">分野: すべて</option>
          {allFields.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <select
          className={inputCls}
          value={tag}
          onChange={(e) => setTag(e.target.value)}
        >
          <option value="">タグ: すべて</option>
          {allTags.map((t) => (
            <option key={t} value={t}>
              #{t}
            </option>
          ))}
        </select>
      </div>

      {(field || tag || query) && (
        <button
          type="button"
          onClick={() => {
            setField('')
            setTag('')
            setQuery('')
          }}
          className="text-xs text-indigo-600"
        >
          フィルタをクリア
        </button>
      )}

      {notes === undefined ? (
        <p className="text-sm text-slate-400">読み込み中…</p>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">
          ノートがありません。「登録」から刻みましょう。
        </p>
      ) : (
        <>
          <p className="text-xs text-slate-500">{filtered.length} 件</p>
          <div className="space-y-3">
            {filtered.map((n) => (
              <NoteCard
                key={n.id}
                note={n}
                onClick={() => setSelectedId(n.id)}
              />
            ))}
          </div>
        </>
      )}

      {selected && (
        <NoteDetail note={selected} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}
