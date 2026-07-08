export type TabKey =
  | 'register'
  | 'library'
  | 'hint'
  | 'review'
  | 'analysis'
  | 'settings'

interface TabDef {
  key: TabKey
  label: string
  icon: string // 絵文字アイコン（依存を増やさない）
}

const TABS: TabDef[] = [
  { key: 'register', label: '登録', icon: '✏️' },
  { key: 'library', label: 'ライブラリ', icon: '📚' },
  { key: 'hint', label: 'ヒント', icon: '💡' },
  { key: 'review', label: '復習', icon: '🔁' },
  { key: 'analysis', label: '分析', icon: '📊' },
  { key: 'settings', label: '設定', icon: '⚙️' },
]

interface TabBarProps {
  active: TabKey
  onChange: (key: TabKey) => void
}

export default function TabBar({ active, onChange }: TabBarProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-2xl">
        {TABS.map((t) => {
          const isActive = t.key === active
          return (
            <li key={t.key} className="flex-1">
              <button
                type="button"
                onClick={() => onChange(t.key)}
                className={`flex w-full flex-col items-center gap-0.5 py-2 text-[11px] transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-slate-500'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="text-lg leading-none">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
