import { useRef, useState } from 'react'
import { DEFAULT_MODEL, EXPORT_WARN_DAYS, LS_KEYS } from '../constants'
import { exportData, importData, type ImportResult } from '../lib/export'
import { testConnection } from '../lib/ai'

function daysSince(iso: string | null): number | null {
  if (!iso) return null
  const ms = Date.now() - new Date(iso).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

const cardCls = 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3'
const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none'
const btnCls = 'rounded-lg px-3 py-2 text-sm font-medium'

export default function SettingsScreen() {
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem(LS_KEYS.apiKey) ?? '',
  )
  const [showKey, setShowKey] = useState(false)
  const [model, setModel] = useState(
    () => localStorage.getItem(LS_KEYS.modelName) ?? DEFAULT_MODEL,
  )
  const [keyMsg, setKeyMsg] = useState('')
  const [testBusy, setTestBusy] = useState(false)

  const [withImages, setWithImages] = useState(true)
  const [importMsg, setImportMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [lastExport, setLastExport] = useState<string | null>(() =>
    localStorage.getItem(LS_KEYS.lastExportAt),
  )
  const sinceExport = daysSince(lastExport)
  const exportStale = sinceExport === null || sinceExport > EXPORT_WARN_DAYS

  function saveKey() {
    localStorage.setItem(LS_KEYS.apiKey, apiKey.trim())
    localStorage.setItem(LS_KEYS.modelName, model.trim() || DEFAULT_MODEL)
    setKeyMsg('保存しました')
    setTimeout(() => setKeyMsg(''), 2000)
  }

  function clearKey() {
    localStorage.removeItem(LS_KEYS.apiKey)
    setApiKey('')
    setKeyMsg('APIキーを消去しました')
    setTimeout(() => setKeyMsg(''), 2000)
  }

  // 接続テスト: 入力中の値を保存してから軽い1回の呼び出しで疎通確認
  async function handleTest() {
    setKeyMsg('')
    if (!apiKey.trim()) {
      setKeyMsg('APIキーを入力してください')
      return
    }
    saveKey()
    setTestBusy(true)
    try {
      const r = await testConnection()
      setKeyMsg(`接続OK（モデル: ${r.model}）`)
    } catch (e) {
      setKeyMsg(e instanceof Error ? e.message : '接続テストに失敗しました')
    } finally {
      setTestBusy(false)
    }
  }

  async function handleExport() {
    setBusy(true)
    try {
      await exportData(withImages)
      setLastExport(localStorage.getItem(LS_KEYS.lastExportAt))
    } finally {
      setBusy(false)
    }
  }

  async function handleImportFile(file: File) {
    setBusy(true)
    setImportMsg('')
    try {
      const text = await file.text()
      const r: ImportResult = await importData(text)
      setImportMsg(
        `取込完了: 追加 ${r.notesAdded} / 更新 ${r.notesUpdated} / スキップ ${r.notesSkipped} / 画像 ${r.imagesImported}`,
      )
    } catch (e) {
      setImportMsg(
        `失敗: ${e instanceof Error ? e.message : 'インポートに失敗しました'}`,
      )
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-slate-900">設定</h1>

      {/* AI 設定 */}
      <section className={cardCls}>
        <h2 className="font-semibold text-slate-800">AI 設定（Gemini）</h2>
        <div>
          <label className="mb-1 block text-sm text-slate-600">
            Gemini APIキー
          </label>
          <div className="flex gap-2">
            <input
              className={inputCls}
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza..."
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowKey((s) => !s)}
              className={`${btnCls} border border-slate-300`}
            >
              {showKey ? '隠す' : '表示'}
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            キーはこの端末の localStorage にのみ保存され、外部やリポジトリには送られません。
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-600">
            使用モデル名
          </label>
          <input
            className={inputCls}
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={DEFAULT_MODEL}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={saveKey}
            className={`${btnCls} bg-indigo-600 text-white`}
          >
            保存
          </button>
          <button
            type="button"
            onClick={clearKey}
            className={`${btnCls} border border-rose-300 text-rose-600`}
          >
            消去
          </button>
          <button
            type="button"
            onClick={handleTest}
            disabled={testBusy}
            className={`${btnCls} border border-indigo-300 text-indigo-700 disabled:opacity-50`}
          >
            {testBusy ? 'テスト中…' : '接続テスト'}
          </button>
          {keyMsg && (
            <span
              className={`text-sm ${
                /OK|保存|消去/.test(keyMsg)
                  ? 'text-emerald-600'
                  : 'text-rose-600'
              }`}
            >
              {keyMsg}
            </span>
          )}
        </div>
      </section>

      {/* バックアップ */}
      <section className={cardCls}>
        <h2 className="font-semibold text-slate-800">
          バックアップ（エクスポート / インポート）
        </h2>

        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            exportStale
              ? 'bg-amber-50 text-amber-800'
              : 'bg-slate-50 text-slate-600'
          }`}
        >
          {lastExport
            ? `最終エクスポート: ${lastExport.slice(0, 10)}（${sinceExport}日前）`
            : 'まだエクスポートしていません'}
          {exportStale && ' ⚠️ バックアップを推奨します'}
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={withImages}
            onChange={(e) => setWithImages(e.target.checked)}
          />
          画像も含める
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={busy}
            className={`${btnCls} bg-indigo-600 text-white disabled:opacity-50`}
          >
            JSONエクスポート
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className={`${btnCls} border border-slate-300 disabled:opacity-50`}
          >
            JSONインポート
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleImportFile(f)
            }}
          />
        </div>
        {importMsg && (
          <p className="text-sm text-slate-600">{importMsg}</p>
        )}
        <p className="text-xs text-slate-400">
          インポートは id 一致でマージし、updatedAt が新しい方を採用します。
        </p>
      </section>
    </div>
  )
}
