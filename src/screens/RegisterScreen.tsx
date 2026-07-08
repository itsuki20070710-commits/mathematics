import { useState } from 'react'
import NoteForm, { type NoteFormValues } from '../components/NoteForm'
import { createNote } from '../db/db'

export default function RegisterScreen() {
  // 保存後にフォームを初期化するための key
  const [formKey, setFormKey] = useState(0)
  const [flash, setFlash] = useState('')

  async function handleSubmit(v: NoteFormValues) {
    await createNote({
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
    setFlash('ノートに刻みました ✓')
    setFormKey((k) => k + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setTimeout(() => setFlash(''), 2500)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-slate-900">ストック登録</h1>
      {flash && (
        <div className="rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-800">
          {flash}
        </div>
      )}
      <NoteForm key={formKey} submitLabel="ノートに刻む" onSubmit={handleSubmit} />
    </div>
  )
}
