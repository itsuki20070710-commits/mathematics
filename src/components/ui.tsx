import { useEffect, useState } from 'react'
import type { Difficulty, Importance } from '../types'
import { getImageURL } from '../lib/image'

// 分野バッジ
export function FieldBadge({ field }: { field: string }) {
  return (
    <span className="inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
      {field}
    </span>
  )
}

const DIFF_STYLE: Record<Difficulty, string> = {
  基礎: 'bg-emerald-100 text-emerald-700',
  標準: 'bg-amber-100 text-amber-700',
  難関: 'bg-rose-100 text-rose-700',
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${DIFF_STYLE[difficulty]}`}
    >
      {difficulty}
    </span>
  )
}

export function Stars({ value }: { value: Importance }) {
  return (
    <span className="text-amber-500" aria-label={`重要度 ${value}`}>
      {'★'.repeat(value)}
      <span className="text-slate-300">{'★'.repeat(3 - value)}</span>
    </span>
  )
}

// IndexedDB の画像IDを表示するサムネイル（Object URL を自動解放）
export function ImageThumb({
  id,
  className,
}: {
  id: string
  className?: string
}) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    let current: string | null = null
    getImageURL(id).then((u) => {
      if (active) {
        current = u
        setUrl(u)
      } else if (u) {
        URL.revokeObjectURL(u)
      }
    })
    return () => {
      active = false
      if (current) URL.revokeObjectURL(current)
    }
  }, [id])

  if (!url) return null
  return <img src={url} alt="" className={className} />
}
