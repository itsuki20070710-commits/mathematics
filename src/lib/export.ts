import { db } from '../db/db'
import { LS_KEYS } from '../constants'
import type { Note, StoredImage } from '../types'

const EXPORT_VERSION = 1

interface ExportImage {
  id: string
  dataUrl: string // data:image/...;base64,...
}

interface ExportPayload {
  app: 'math-verbalization-notes'
  version: number
  exportedAt: string
  notes: Note[]
  images?: ExportImage[]
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

async function dataURLToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl)
  return res.blob()
}

function triggerDownload(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// 全ノート（＋任意で参照画像）を JSON でエクスポートしダウンロードする
export async function exportData(withImages: boolean): Promise<void> {
  const notes = await db.notes.toArray()

  const payload: ExportPayload = {
    app: 'math-verbalization-notes',
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    notes,
  }

  if (withImages) {
    const ids = Array.from(new Set(notes.flatMap((n) => n.imageIds ?? [])))
    const images: ExportImage[] = []
    for (const id of ids) {
      const rec = await db.images.get(id)
      if (rec) images.push({ id, dataUrl: await blobToDataURL(rec.blob) })
    }
    payload.images = images
  }

  const stamp = new Date().toISOString().slice(0, 10)
  triggerDownload(
    `math-notes_${stamp}${withImages ? '_with-images' : ''}.json`,
    JSON.stringify(payload, null, 2),
  )

  localStorage.setItem(LS_KEYS.lastExportAt, new Date().toISOString())
}

export interface ImportResult {
  notesAdded: number
  notesUpdated: number
  notesSkipped: number
  imagesImported: number
}

// JSON をインポート。id一致でマージし、updatedAt が新しい方を採用する。
export async function importData(jsonText: string): Promise<ImportResult> {
  const parsed = JSON.parse(jsonText) as Partial<ExportPayload>
  if (!parsed || !Array.isArray(parsed.notes)) {
    throw new Error('不正なファイルです（notes が見つかりません）')
  }

  const result: ImportResult = {
    notesAdded: 0,
    notesUpdated: 0,
    notesSkipped: 0,
    imagesImported: 0,
  }

  await db.transaction('rw', db.notes, db.images, async () => {
    // 画像: id 未存在なら取り込む（画像はイミュータブル扱い）
    if (Array.isArray(parsed.images)) {
      for (const img of parsed.images) {
        const existing = await db.images.get(img.id)
        if (!existing) {
          const blob = await dataURLToBlob(img.dataUrl)
          const rec: StoredImage = { id: img.id, blob }
          await db.images.add(rec)
          result.imagesImported++
        }
      }
    }

    // ノート: updatedAt が新しい方を採用
    for (const incoming of parsed.notes as Note[]) {
      if (!incoming?.id) continue
      const existing = await db.notes.get(incoming.id)
      if (!existing) {
        await db.notes.add(incoming)
        result.notesAdded++
      } else if (
        new Date(incoming.updatedAt).getTime() >
        new Date(existing.updatedAt).getTime()
      ) {
        await db.notes.put(incoming)
        result.notesUpdated++
      } else {
        result.notesSkipped++
      }
    }
  })

  return result
}
