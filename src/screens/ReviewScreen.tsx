// 復習画面。出題→自力想起→開示→A/B/C評価の間隔反復は Phase 4 で実装予定。
export default function ReviewScreen() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-slate-900">復習</h1>
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
        <p className="mb-2 text-2xl">🔁</p>
        <p>間隔反復（1/3/7/14/30日）による復習キューは</p>
        <p className="font-medium text-slate-700">Phase 4 で実装予定</p>
        <p className="mt-3 text-xs text-slate-400">
          登録済みノートには出題予定日（翌日開始）が既に記録されています。
        </p>
      </div>
    </div>
  )
}
