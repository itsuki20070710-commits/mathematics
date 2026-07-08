import Dexie, { type Table } from 'dexie'
import type { Note, StoredImage } from '../types'
import { REVIEW_INTERVALS } from '../constants'

// IndexedDB（Dexie）。ノート本体・画像Blobをここに保存する。
export class MvnDatabase extends Dexie {
  notes!: Table<Note, string>
  images!: Table<StoredImage, string>

  constructor() {
    super('math-verbalization-notes')
    this.version(1).stores({
      // *tags: マルチエントリ索引（タグ絞り込み用）
      // review.nextAt: 復習キュー（Phase 4）用に今から索引を張る
      notes: 'id, field, updatedAt, importance, difficulty, review.nextAt, *tags',
      images: 'id',
    })
  }
}

export const db = new MvnDatabase()

// --- ヘルパ ---

function isoNow(): string {
  return new Date().toISOString()
}

// 翌日（ローカル日付の翌日 0:00）の ISO 文字列
export function tomorrowISO(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 1)
  return d.toISOString()
}

// 指定 stage の次回出題日。stage>=1 で REVIEW_INTERVALS[stage-1] 日後。
export function nextAtForStage(stage: number): string {
  const idx = Math.min(Math.max(stage, 1), REVIEW_INTERVALS.length) - 1
  const days = REVIEW_INTERVALS[idx]
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

// 新規ノート作成に必要なフィールドの入力型（メタは自動付与）
export type NewNoteInput = Omit<
  Note,
  'id' | 'createdAt' | 'updatedAt' | 'review' | 'similar'
> & {
  review?: Note['review']
  similar?: Note['similar']
}

export async function createNote(input: NewNoteInput): Promise<string> {
  const now = isoNow()
  const note: Note = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    review: input.review ?? { stage: 0, nextAt: tomorrowISO(), log: [] },
    similar: input.similar ?? [],
  }
  await db.notes.add(note)
  return note.id
}

export async function updateNote(
  id: string,
  patch: Partial<Omit<Note, 'id' | 'createdAt'>>,
): Promise<void> {
  await db.notes.update(id, { ...patch, updatedAt: isoNow() })
}

export async function deleteNote(id: string): Promise<void> {
  const note = await db.notes.get(id)
  await db.transaction('rw', db.notes, db.images, async () => {
    if (note?.imageIds?.length) {
      await db.images.bulkDelete(note.imageIds)
    }
    await db.notes.delete(id)
  })
}

export async function getNote(id: string): Promise<Note | undefined> {
  return db.notes.get(id)
}
