import type { Note } from '../types'
import MathText from './MathText'
import { DifficultyBadge, FieldBadge, Stars } from './ui'

function formatDate(iso: string): string {
  return iso.slice(0, 10)
}

interface NoteCardProps {
  note: Note
  onClick?: () => void
}

export default function NoteCard({ note, onClick }: NoteCardProps) {
  const meta = [note.university, note.year, note.problemNo]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:shadow-md"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <FieldBadge field={note.field} />
        <DifficultyBadge difficulty={note.difficulty} />
        <Stars value={note.importance} />
        {meta && <span className="text-xs text-slate-500">{meta}</span>}
        <span className="ml-auto text-xs text-slate-400">
          {formatDate(note.updatedAt)}
        </span>
      </div>

      <h3 className="mb-1 font-semibold text-slate-900">
        <MathText>{note.title}</MathText>
      </h3>

      <p className="line-clamp-3 text-sm text-slate-600">
        <MathText>{note.verbalization}</MathText>
      </p>

      {note.trigger && (
        <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-800">
          💡 <MathText>{note.trigger}</MathText>
        </p>
      )}

      {note.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {note.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
            >
              #{t}
            </span>
          ))}
        </div>
      )}
    </button>
  )
}
