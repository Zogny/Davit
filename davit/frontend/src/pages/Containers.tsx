import { Fragment, useState } from 'react'
import {
  Search,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronRight,
  Package,
} from 'lucide-react'
import ContainerDetail from './ContainerDetail'
import StackDetail from './StackDetail'
import ContainerStatusBadge, { type ContainerStatus } from '../components/ContainerStatusBadge'
import ContainerActions from '../components/ContainerActions'
import { useTranslation } from '../i18n'

interface ContainerItem {
  id: string
  name: string
  image: string
  status: ContainerStatus
  ports: string
  cpu: string
  memory: string
  dependsOn: string[]
}

interface ComposeGroup {
  composeProject: string
  containers: ContainerItem[]
}

type SortableCol = 'name' | 'image' | 'status' | 'cpu' | 'memory'
type SortDir = 'asc' | 'desc'

const MOCK_GROUPS: ComposeGroup[] = [
  {
    composeProject: 'app-stack',
    containers: [
      { id: '1a2b3c4d', name: 'nginx-proxy',  image: 'nginx:latest',        status: 'running',    ports: '80:80, 443:443', cpu: '2.5%',  memory: '45 MB',  dependsOn: ['app-backend'] },
      { id: '3m4n5o6p', name: 'app-backend',  image: 'node:18-alpine',      status: 'running',    ports: '3000:3000',      cpu: '15.4%', memory: '156 MB', dependsOn: ['postgres-db', 'redis-cache'] },
      { id: '5e6f7g8h', name: 'postgres-db',  image: 'postgres:15',         status: 'paused',     ports: '5432:5432',      cpu: '0%',    memory: '234 MB', dependsOn: [] },
      { id: '9i0j1k2l', name: 'redis-cache',  image: 'redis:7-alpine',      status: 'restarting', ports: '6379:6379',      cpu: '1.1%',  memory: '12 MB',  dependsOn: [] },
    ],
  },
  {
    composeProject: 'monitoring-stack',
    containers: [
      { id: 'mon1abc', name: 'prometheus', image: 'prom/prometheus:latest',   status: 'running', ports: '9090:9090',  cpu: '3.2%', memory: '89 MB', dependsOn: [] },
      { id: 'mon2def', name: 'grafana',    image: 'grafana/grafana:latest',   status: 'stopped', ports: '3001:3000',  cpu: '0%',   memory: '0 MB',  dependsOn: ['prometheus'] },
    ],
  },
]

const MOCK_STANDALONE: ContainerItem[] = [
  { id: '7q8r9s0t', name: 'whoami', image: 'traefik/whoami:latest', status: 'stopped', ports: '8082:80', cpu: '0%', memory: '0 MB', dependsOn: [] },
]

const COLUMNS: { key: string; labelKey: string; sortKey?: SortableCol; width: string }[] = [
  { key: 'name',    labelKey: 'containers.colContainer', sortKey: 'name',   width: '18%' },
  { key: 'image',   labelKey: 'containers.colImage',     sortKey: 'image',  width: '18%' },
  { key: 'status',  labelKey: 'containers.colStatus',    sortKey: 'status', width: '12%' },
  { key: 'ports',   labelKey: 'containers.colPorts',                        width: '18%' },
  { key: 'cpu',     labelKey: 'containers.colCpu',       sortKey: 'cpu',    width: '8%' },
  { key: 'memory',  labelKey: 'containers.colMemory',    sortKey: 'memory', width: '10%' },
  { key: 'actions', labelKey: 'containers.colActions',                      width: '10%' },
]

const STATUS_ORDER: Record<ContainerStatus, number> = { running: 0, restarting: 1, paused: 2, stopped: 3 }

function parseCpu(v: string): number {
  return parseFloat(v) || 0
}

function parseMemory(v: string): number {
  const match = v.match(/^([\d.]+)\s*(MB|GB)/)
  if (!match) return 0
  const val = parseFloat(match[1])
  return match[2] === 'GB' ? val * 1024 : val
}

function formatMemory(mb: number): string {
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.round(mb)} MB`
}

function compareContainers(a: ContainerItem, b: ContainerItem, col: SortableCol, dir: SortDir): number {
  let result: number
  if (col === 'cpu') {
    result = parseCpu(a.cpu) - parseCpu(b.cpu)
  } else if (col === 'memory') {
    result = parseMemory(a.memory) - parseMemory(b.memory)
  } else if (col === 'status') {
    result = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
  } else if (col === 'image') {
    result = a.image.localeCompare(b.image)
  } else {
    result = a.name.localeCompare(b.name)
  }
  return dir === 'asc' ? result : -result
}

function ContainerRow({ container, grouped, onSelect }: { container: ContainerItem; grouped: boolean; onSelect: () => void }) {
  return (
    <tr
      onClick={onSelect}
      className={`hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors cursor-pointer group/row ${container.status === 'paused' ? 'opacity-70' : ''}`}
    >
      <td className={`py-4 min-w-0 ${grouped ? 'pl-12 pr-4' : 'px-6'}`}>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover/row:text-blue-600 dark:group-hover/row:text-blue-400 transition-colors truncate">{container.name}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5 truncate">{container.id}</p>
      </td>
      <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 truncate">{container.image}</td>
      <td className="px-4 py-4"><ContainerStatusBadge status={container.status} /></td>
      <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400 truncate">{container.ports || '—'}</td>
      <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 tabular-nums">{container.cpu}</td>
      <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 tabular-nums">{container.memory}</td>
      <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
        <ContainerActions containerId={container.id} status={container.status} inGroup={grouped} />
      </td>
    </tr>
  )
}

export default function Containers() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState<SortableCol | null>(null)
  const [sortDir, setSortDir] = useState<SortDir | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [selectedContainer, setSelectedContainer] = useState<ContainerItem | null>(null)
  const [selectedStack, setSelectedStack] = useState<string | null>(null)

  function handleSort(col: SortableCol) {
    if (col === sortCol) {
      if (sortDir === 'asc') setSortDir('desc')
      else { setSortCol(null); setSortDir(null) }
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  function toggleGroup(project: string) {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(project)) next.delete(project)
      else next.add(project)
      return next
    })
  }

  const effectiveCol = sortCol ?? 'name'
  const effectiveDir = sortDir ?? 'asc'

  const query = search.toLowerCase()
  const matches = (c: ContainerItem) =>
    c.name.toLowerCase().includes(query) || c.image.toLowerCase().includes(query)

  const visibleGroups = MOCK_GROUPS
    .map(g => ({
      ...g,
      containers: g.containers.filter(matches).sort((a, b) => compareContainers(a, b, effectiveCol, effectiveDir)),
    }))
    .filter(g => g.containers.length > 0)

  const visibleStandalone = MOCK_STANDALONE
    .filter(matches)
    .sort((a, b) => compareContainers(a, b, effectiveCol, effectiveDir))

  const allContainers = [...MOCK_GROUPS.flatMap(g => g.containers), ...MOCK_STANDALONE]
  const totalCount = allContainers.length
  const activeCount = allContainers.filter(c => c.status === 'running').length

  if (selectedContainer !== null) {
    return <ContainerDetail container={selectedContainer} onBack={() => setSelectedContainer(null)} />
  }

  if (selectedStack !== null) {
    return (
      <StackDetail
        projectName={selectedStack}
        onBack={() => setSelectedStack(null)}
        onOpenContainer={c => { setSelectedStack(null); setSelectedContainer(c) }}
      />
    )
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('containers.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-base">
          {t('containers.subtitle', { active: activeCount, total: totalCount })}
        </p>
      </div>

      {/* Search bar */}
      <div className="relative max-w-lg">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('containers.searchPlaceholder')}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <table className="w-full table-fixed">
          <colgroup>
            {COLUMNS.map(col => (
              <col key={col.key} style={{ width: col.width }} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700">
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  onClick={() => col.sortKey && handleSort(col.sortKey)}
                  className={`text-left px-4 py-3 first:px-6 select-none ${col.sortKey ? 'cursor-pointer group' : ''} ${col.key === 'actions' ? 'text-right' : ''}`}
                >
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider transition-colors ${col.sortKey ? 'group-hover:text-gray-600 dark:group-hover:text-gray-400' : ''}`}>
                    {t(col.labelKey)}
                    {col.sortKey && (
                      sortCol === col.sortKey ? (
                        sortDir === 'asc'
                          ? <ArrowUp size={12} className="text-blue-500 dark:text-blue-400" />
                          : <ArrowDown size={12} className="text-blue-500 dark:text-blue-400" />
                      ) : (
                        <ArrowUp size={12} className="opacity-0 group-hover:opacity-30 transition-opacity" />
                      )
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {visibleGroups.map(group => {
              const isCollapsed = collapsedGroups.has(group.composeProject)
              const cpuTotal = group.containers.reduce((sum, c) => sum + parseCpu(c.cpu), 0)
              const memTotal = group.containers.reduce((sum, c) => sum + parseMemory(c.memory), 0)
              return (
                <Fragment key={group.composeProject}>
                  <tr
                    onClick={() => setSelectedStack(group.composeProject)}
                    className="group bg-blue-50/40 dark:bg-blue-950/40 hover:bg-blue-50/70 dark:hover:bg-blue-950/60 cursor-pointer transition-colors"
                  >
                    <td colSpan={4} className="px-6 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          onClick={e => { e.stopPropagation(); toggleGroup(group.composeProject) }}
                          className="p-0.5 -m-0.5 rounded text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors shrink-0"
                        >
                          {isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                        </button>
                        <Package size={15} className="text-blue-500 dark:text-blue-400 shrink-0" />
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:underline transition-colors truncate">{group.composeProject}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">({group.containers.length})</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 tabular-nums">{cpuTotal.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 tabular-nums">{formatMemory(memTotal)}</td>
                    <td className="px-6 py-3 text-right">
                      <div
                        className="flex items-center justify-end gap-2"
                        onClick={e => e.stopPropagation()}
                      >
                        <button className="px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-white dark:bg-gray-800 border border-emerald-200 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors">
                          {t('containers.startAll')}
                        </button>
                        <button className="px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800/60 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors">
                          {t('containers.stopAll')}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {!isCollapsed && group.containers.map(c => (
                    <ContainerRow key={c.id} container={c} grouped onSelect={() => setSelectedContainer(c)} />
                  ))}
                </Fragment>
              )
            })}

            {visibleStandalone.length > 0 && (
              <Fragment>
                <tr>
                  <td colSpan={COLUMNS.length} className="px-6 py-2 bg-gray-50/60 dark:bg-gray-700/40">
                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wide uppercase">{t('containers.standaloneSeparator')}</span>
                  </td>
                </tr>
                {visibleStandalone.map(c => (
                  <ContainerRow key={c.id} container={c} grouped={false} onSelect={() => setSelectedContainer(c)} />
                ))}
              </Fragment>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
