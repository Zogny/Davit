import { useState } from 'react'
import { ThemeProvider } from './theme'
import { LanguageProvider } from './i18n'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Containers from './pages/Containers'
import Images from './pages/Images'
import Networks from './pages/Networks'
import Volumes from './pages/Volumes'
import Settings from './pages/Settings'
import type { Page } from './types'

const PAGES: Record<Page, React.ComponentType> = {
  dashboard: Dashboard,
  containers: Containers,
  images: Images,
  networks: Networks,
  volumes: Volumes,
  settings: Settings,
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const PageComponent = PAGES[currentPage]

  return (
    <ThemeProvider>
      <LanguageProvider>
        <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
          <PageComponent />
        </Layout>
      </LanguageProvider>
    </ThemeProvider>
  )
}
