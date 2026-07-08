import { useState } from 'react'
import TabBar, { type TabKey } from './components/TabBar'
import RegisterScreen from './screens/RegisterScreen'
import LibraryScreen from './screens/LibraryScreen'
import HintScreen from './screens/HintScreen'
import ReviewScreen from './screens/ReviewScreen'
import AnalysisScreen from './screens/AnalysisScreen'
import SettingsScreen from './screens/SettingsScreen'

export default function App() {
  const [tab, setTab] = useState<TabKey>('register')
  // 分析画面から分野を指定してライブラリへ遷移するための受け渡し
  const [pendingField, setPendingField] = useState<string | null>(null)

  function goLibraryWithField(field: string) {
    setPendingField(field)
    setTab('library')
  }

  return (
    <div className="min-h-full">
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-4">
        {tab === 'register' && <RegisterScreen />}
        {tab === 'library' && (
          <LibraryScreen
            fieldFilter={pendingField}
            onConsumeFieldFilter={() => setPendingField(null)}
          />
        )}
        {tab === 'hint' && <HintScreen />}
        {tab === 'review' && <ReviewScreen />}
        {tab === 'analysis' && (
          <AnalysisScreen onSelectField={goLibraryWithField} />
        )}
        {tab === 'settings' && <SettingsScreen />}
      </main>
      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}
