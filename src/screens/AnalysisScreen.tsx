import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'

interface AnalysisScreenProps {
  onSelectField: (field: string) => void
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
      <div className="text-3xl font-bold text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  )
}

export default function AnalysisScreen({ onSelectField }: AnalysisScreenProps) {
  const notes = useLiveQuery(() => db.notes.toArray(), [])

  const stats = useMemo(() => {
    const list = notes ?? []
    const byField = new Map<string, number>()
    let star3 = 0
    let hard = 0
    for (const n of list) {
      byField.set(n.field, (byField.get(n.field) ?? 0) + 1)
      if (n.importance === 3) star3++
      if (n.difficulty === '難関') hard++
    }
    const fields = Array.from(byField.entries()).sort((a, b) => b[1] - a[1])
    return { total: list.length, star3, hard, fields }
  }, [notes])

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-slate-900">分析</h1>

      <div className="grid grid-cols-3 gap-2">
        <StatCard label="総ノート数" value={stats.total} />
        <StatCard label="★3（最重要）" value={stats.star3} />
        <StatCard label="難関" value={stats.hard} />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-700">分野別件数</h2>
        {stats.fields.length === 0 ? (
          <p className="text-sm text-slate-400">まだデータがありません。</p>
        ) : (
          <ul className="space-y-1">
            {stats.fields.map(([field, count]) => (
              <li key={field}>
                <button
                  type="button"
                  onClick={() => onSelectField(field)}
                  className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm shadow-sm"
                >
                  <span className="w-28 shrink-0 truncate">{field}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <span
                      className="block h-full rounded-full bg-indigo-500"
                      style={{
                        width: `${
                          stats.total ? (count / stats.total) * 100 : 0
                        }%`,
                      }}
                    />
                  </span>
                  <span className="w-8 shrink-0 text-right font-medium text-slate-700">
                    {count}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-slate-400">
          分野をタップするとライブラリで絞り込み表示します。
        </p>
      </div>
    </div>
  )
}
