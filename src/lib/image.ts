import { db } from '../db/db'
import type { StoredImage } from '../types'

const MAX_EDGE = 1600
const JPEG_QUALITY = 0.85

// 画像ファイルを長辺1600px・JPEG圧縮した Blob に変換する
export async function compressImage(file: File | Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const { width, height } = bitmap
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height))
  const w = Math.round(width * scale)
  const h = Math.round(height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('canvas 2d context を取得できませんでした')
  }
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
  )
  if (!blob) throw new Error('画像の圧縮に失敗しました')
  return blob
}

// 圧縮済み Blob を IndexedDB に保存し、画像IDを返す
export async function saveImage(blob: Blob): Promise<string> {
  const record: StoredImage = { id: crypto.randomUUID(), blob }
  await db.images.add(record)
  return record.id
}

// ファイルを圧縮して保存し、画像IDを返す（登録フォーム用のショートカット）
export async function compressAndSaveImage(file: File): Promise<string> {
  const blob = await compressImage(file)
  return saveImage(blob)
}

// 画像IDから表示用の Object URL を得る。呼び出し側で revokeObjectURL すること。
export async function getImageURL(id: string): Promise<string | null> {
  const rec = await db.images.get(id)
  if (!rec) return null
  return URL.createObjectURL(rec.blob)
}

export async function deleteImage(id: string): Promise<void> {
  await db.images.delete(id)
}
