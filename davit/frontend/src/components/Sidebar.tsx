import { LayoutDashboard, Container, Layers, Network, Database, Settings, ChevronLeft, type LucideIcon } from 'lucide-react'
import type { Page } from '../types'

interface NavItem {
  id: Page
  label: string
  icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'containers', label: 'Conteneurs', icon: Container },
  { id: 'images', label: 'Images', icon: Layers },
  { id: 'networks', label: 'Réseaux', icon: Network },
  { id: 'volumes', label: 'Volumes', icon: Database },
]

interface SidebarProps {
  currentPage: Page
  onNavigate: (page: Page) => void
  collapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ currentPage, onNavigate, collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={[
        'flex flex-col shrink-0 bg-[#111827] h-full transition-all duration-200 overflow-hidden',
        collapsed ? 'w-16' : 'w-72',
      ].join(' ')}
    >
      {/* Header */}
      <div className={['flex items-center py-6', collapsed ? 'justify-center px-3' : 'justify-between px-5'].join(' ')}>
        {collapsed ? (
          <button
            onClick={onToggle}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors"
            aria-label="Expand sidebar"
          >
            <Container size={20} className="text-white" />
          </button>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600">
                <Container size={20} className="text-white" />
              </div>
              <span className="text-white font-semibold text-base leading-tight">Davit</span>
            </div>
            <button
              onClick={onToggle}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={18} />
            </button>
          </>
        )}
      </div>

      {/* Main nav */}
      <nav className={['flex flex-col gap-1 mt-2 flex-1', collapsed ? 'px-2' : 'px-4'].join(' ')}>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = currentPage === id
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              title={collapsed ? label : undefined}
              className={[
                'flex items-center w-full rounded-lg font-medium transition-colors',
                collapsed ? 'justify-center py-3' : 'gap-3 px-4 py-3 text-base text-left',
                active ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5',
              ].join(' ')}
            >
              <Icon size={20} />
              {!collapsed && label}
            </button>
          )
        })}
      </nav>

      {/* Bottom: Settings */}
      <div className={collapsed ? 'px-2 pb-6' : 'px-4 pb-6'}>
        <button
          onClick={() => onNavigate('settings')}
          title={collapsed ? 'Paramètres' : undefined}
          className={[
            'flex items-center w-full rounded-lg font-medium transition-colors',
            collapsed ? 'justify-center py-3' : 'gap-3 px-4 py-3 text-base text-left',
            currentPage === 'settings' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5',
          ].join(' ')}
        >
          <Settings size={20} />
          {!collapsed && 'Paramètres'}
        </button>
      </div>
    </aside>
  )
}
