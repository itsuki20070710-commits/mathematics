import { useState } from 'react'
import type { Note } from '../types'
import { deleteNote, updateNote } from '../db/db'
import MathText from './MathText'
import NoteForm, { type NoteFormValues, valuesFromNote } from './NoteForm'
import { DifficultyBadge, FieldBadge, ImageThumb, Stars } from './ui'

interface NoteDetailProps {
  note: Note
  onClose: () => void
}

function Section({ title, body }: { title: string; body?: string }) {
  if (!body) return null
  return (
    <div>
      <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </h4>
      <div className="whitespace-pre-wrap text-sm text-slate-700">
        <MathText>{body}</MathText>
      </div>
    </div>
  )
}

export default function NoteDetail({ note, onClose }: NoteDetailProps) {
  const [editing, setEditing] = useState(false)

  async function handleUpdate(v: NoteFormValues) {
    await updateNote(note.id, {
      university: v.university || undefined,
      year: v.year || undefined,
      problemNo: v.problemNo || undefined,
      title: v.title,
      problemText: v.problemText || undefined,
      imageIds: v.imageIds,
      verbalization: v.verbalization.trim(),
      trigger: v.trigger || undefined,
      essence: v.essence || undefined,
      solution: v.solution || undefined,
      field: v.field,
      tags: v.tags,
      difficulty: v.difficulty,
      importance: v.importance,
    })
    setEditing(false)
  }

  async function handleDelete() {
    if (!confirm('このノートを削除しますか？（元に戻せません）')) return
    await deleteNote(note.id)
    onClose()
  }

  const meta = [note.university, note.year, note.problemNo]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-slate-100">
      <header className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-slate-500"
        >
          ← 戻る
        </button>
        <span className="ml-auto flex gap-2">
          {!editing && (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-lg border border-slate-300 px-3 py-1 text-sm"
              >
                編集
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg border border-rose-300 px-3 py-1 text-sm text-rose-600"
              >
                削除
              </button>
            </>
          )}
        </span>
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-4 py-4">
        {editing ? (
          <NoteForm
            initial={valuesFromNote(note)}
            submitLabel="更新する"
            onSubmit={handleUpdate}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <FieldBadge field={note.field} />
              <DifficultyBadge difficulty={note.difficulty} />
              <Stars value={note.importance} />
              {meta && <span className="text-xs text-slate-500">{meta}</span>}
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              <MathText>{note.title}</MathText>
            </h2>

            {note.imageIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {note.imageIds.map((id) => (
                  <ImageThumb
                    key={id}
                    id={id}
                    className="max-h-64 rounded-lg border border-slate-200 object-contain"
                  />
                ))}
              </div>
            )}

            <Section title="問題文" body={note.problemText} />
            <Section title="言語化" body={note.verbalization} />
            <Section title="トリガー" body={note.trigger} />
            <Section title="本質・原理" body={note.essence} />
            <Section title="解答・思考経路" body={note.solution} />

            {note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {note.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            <p className="text-xs text-slate-400">
              作成 {note.createdAt.slice(0, 10)} / 更新{' '}
              {note.updatedAt.slice(0, 10)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
