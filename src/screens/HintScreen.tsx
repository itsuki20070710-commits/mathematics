// ヒント画面。ローカルキーワード検索は将来（Phase 3 の AI ヒントとあわせて）実装予定。
export default function HintScreen() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-slate-900">ヒント</h1>
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
        <p className="mb-2 text-2xl">💡</p>
        <p>キーワードのローカル検索・AIヒント（3段階）は</p>
        <p className="font-medium text-slate-700">Phase 3 で実装予定</p>
        <p className="mt-3 text-xs text-slate-400">
          Phase 1 では「ライブラリ」の全文検索をご利用ください。
        </p>
      </div>
    </div>
  )
}
