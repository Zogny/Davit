import { useState } from 'react'
import {
  Search,
  Trash2,
  X,
  ArrowUp,
  ArrowDown,
  Plus,
  Container,
  Network,
  Globe,
  Link as LinkIcon,
} from 'lucide-react'
import StatCard from '../components/StatCard'
import ConfirmModal from '../components/ConfirmModal'
import NetworkDetail from './NetworkDetail'
import { useTranslation } from '../i18n'

interface DockerNetwork {
  id: string
  name: string
  driver: string
  scope: string
  subnet: string
  gateway: string
  containers: number
  containerNames: string[]
  custom: boolean
}

type SortableCol = 'name' | 'id' | 'driver' | 'scope' | 'subnet' | 'gateway' | 'containers'
type SortDir = 'asc' | 'desc'

const MOCK_NETWORKS: DockerNetwork[] = [
  { id: 'net123abc', name: 'bridge',      driver: 'bridge', scope: 'local', subnet: '172.17.0.0/16', gateway: '172.17.0.1', containers: 4, containerNames: ['web_app', 'nginx_proxy', 'redis_cache', 'postgres_primary'], custom: false },
  { id: 'net456def', name: 'host',        driver: 'host',   scope: 'local', subnet: 'N/A',           gateway: 'N/A',        containers: 0, containerNames: [], custom: false },
  { id: 'net789ghi', name: 'none',        driver: 'null',   scope: 'local', subnet: 'N/A',           gateway: 'N/A',        containers: 0, containerNames: [], custom: false },
  { id: 'netabc123', name: 'app-network', driver: 'bridge', scope: 'local', subnet: '172.18.0.0/16', gateway: '172.18.0.1', containers: 8, containerNames: ['web_app', 'api_server', 'worker_1', 'worker_2', 'worker_3', 'nginx_proxy', 'redis_cache', 'postgres_primary'], custom: true },
  { id: 'netdef456', name: 'db-network',  driver: 'bridge', scope: 'local', subnet: '172.19.0.0/16', gateway: '172.19.0.1', containers: 3, containerNames: ['postgres_primary', 'postgres_replica', 'pgadmin'], custom: true },
]

const COLUMNS: { key: SortableCol; labelKey: string }[] = [
  { key: 'name',       labelKey: 'networks.colName' },
  { key: 'id',         labelKey: 'networks.colId' },
  { key: 'driver',     labelKey: 'networks.colDriver' },
  { key: 'scope',      labelKey: 'networks.colScope' },
  { key: 'subnet',     labelKey: 'networks.colSubnet' },
  { key: 'gateway',    labelKey: 'networks.colGateway' },
  { key: 'containers', labelKey: 'networks.colContainers' },
]

const DRIVER_STYLES: Record<string, string> = {
  bridge: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/60',
  host: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800/50',
  null: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700',
  overlay: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50',
  macvlan: 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800/50',
}

function compareNetworks(a: DockerNetwork, b: DockerNetwork, col: SortableCol, dir: SortDir): number {
  let result: number
  if (col === 'containers') {
    result = a.containers - b.containers
  } else {
    result = a[col].localeCompare(b[col])
  }
  return dir === 'asc' ? result : -result
}

export default function Networks() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState<SortableCol | null>(null)
  const [sortDir, setSortDir] = useState<SortDir | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDriver, setCreateDriver] = useState<'bridge' | 'overlay'>('bridge')
  const [createSubnet, setCreateSubnet] = useState('')
  const [createGateway, setCreateGateway] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<DockerNetwork | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<DockerNetwork | null>(null)

  const customCount = MOCK_NETWORKS.filter(n => n.custom).length
  const totalContainers = MOCK_NETWORKS.reduce((acc, n) => acc + n.containers, 0)

  function handleSort(col: SortableCol) {
    if (col === sortCol) {
      if (sortDir === 'asc') setSortDir('desc')
      else { setSortCol(null); setSortDir(null) }
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  const effectiveCol = sortCol ?? 'name'
  const effectiveDir = sortDir ?? 'asc'

  const filtered = MOCK_NETWORKS
    .filter(n => n.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => compareNetworks(a, b, effectiveCol, effectiveDir))

  const isCreateValid = createName.trim() !== ''

  function closeCreate() {
    setCreateOpen(false)
    setCreateName('')
    setCreateDriver('bridge')
    setCreateSubnet('')
    setCreateGateway('')
  }

  if (selectedNetwork !== null) {
    return <NetworkDetail network={selectedNetwork} onBack={() => setSelectedNetwork(null)} />
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('networks.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-base">
            {t('networks.subtitle', { n: MOCK_NETWORKS.length, custom: customCount })}
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shrink-0"
        >
          <Plus size={16} />
          {t('networks.create')}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={<Network size={18} className="text-blue-600 dark:text-blue-400" />}
          iconBg="bg-blue-100 dark:bg-blue-900/40"
          title={t('networks.total')}
          value={MOCK_NETWORKS.length}
          subtitle={t('networks.totalSubtitle')}
        />
        <StatCard
          icon={<Globe size={18} className="text-purple-600 dark:text-purple-400" />}
          iconBg="bg-purple-100 dark:bg-purple-900/40"
          title={t('networks.custom')}
          value={customCount}
          subtitle={t('networks.customSubtitle')}
        />
        <StatCard
          icon={<LinkIcon size={18} className="text-emerald-600 dark:text-emerald-400" />}
          iconBg="bg-emerald-100 dark:bg-emerald-900/40"
          title={t('networks.containers')}
          value={totalContainers}
          subtitle={t('networks.containersSubtitle')}
        />
      </div>

      {/* Search bar */}
      <div className="relative max-w-lg">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('networks.searchPlaceholder')}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700">
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="text-left px-4 py-3 first:px-6 select-none cursor-pointer group"
                >
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">
                    {t(col.labelKey)}
                    {sortCol === col.key ? (
                      sortDir === 'asc'
                        ? <ArrowUp size={12} className="text-blue-500 dark:text-blue-400" />
                        : <ArrowDown size={12} className="text-blue-500 dark:text-blue-400" />
                    ) : (
                      <ArrowUp size={12} className="opacity-0 group-hover:opacity-30 transition-opacity" />
                    )}
                  </span>
                </th>
              ))}
              <th className="text-right text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider px-6 py-3">
                {t('networks.colActions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {filtered.map(net => (
              <tr
                key={net.id}
                onClick={() => setSelectedNetwork(net)}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors cursor-pointer group/row"
              >
                <td className="px-6 py-4">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover/row:text-blue-600 dark:group-hover/row:text-blue-400 transition-colors">{net.name}</span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-400 dark:text-gray-500 font-mono text-xs">{net.id}</td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${DRIVER_STYLES[net.driver] ?? DRIVER_STYLES.null}`}>
                    {net.driver}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{net.scope}</td>
                <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">{net.subnet}</td>
                <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">{net.gateway}</td>
                <td className="px-4 py-4">
                  {net.containers > 0 ? (
                    <div className="relative inline-flex group">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-xs font-semibold border border-blue-100 dark:border-blue-800/60 cursor-default">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        {net.containers}
                      </span>
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-20 pointer-events-none">
                        <div className="bg-gray-900 rounded-lg py-2 shadow-xl w-52">
                          {net.containerNames.slice(0, 8).map(name => (
                            <div key={name} className="flex items-center gap-2 px-3 py-1">
                              <Container size={11} className="text-gray-400 dark:text-gray-500 shrink-0" />
                              <span className="text-white text-xs truncate">{name}</span>
                            </div>
                          ))}
                          {net.containerNames.length > 8 && (
                            <div className="px-3 py-1 text-gray-400 dark:text-gray-500 text-xs">…</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 text-xs font-semibold border border-gray-200 dark:border-gray-700">
                      0
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {net.custom && (
                    <div className="relative inline-flex group justify-end">
                      <button
                        onClick={e => { e.stopPropagation(); net.containers === 0 && setDeleteTarget(net) }}
                        disabled={net.containers > 0}
                        className={`p-1 rounded transition-colors ${
                          net.containers > 0
                            ? 'text-gray-200 dark:text-gray-700 cursor-not-allowed'
                            : 'text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400'
                        }`}
                      >
                        <Trash2 size={16} />
                      </button>
                      {net.containers > 0 && (
                        <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 hidden group-hover:block z-10 pointer-events-none">
                          <div className="relative bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                            {t('networks.inUseTooltip', { n: net.containers, s: net.containers > 1 ? 's' : '' })}
                            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => setDeleteTarget(null)}
        title={t('networks.deleteConfirmTitle')}
        description={deleteTarget ? (
          <>
            {t('networks.deleteConfirmDescBefore')}{' '}
            <span className="font-semibold text-gray-800 dark:text-gray-200">{deleteTarget.name}</span>{' '}
            {t('networks.deleteConfirmDescAfter')}
          </>
        ) : null}
        confirmLabel={t('common.delete')}
        danger
      />

      {/* Create network modal */}
      {createOpen && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={closeCreate}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('networks.createModalTitle')}</h2>
              <button
                onClick={closeCreate}
                className="p-1 rounded text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Network name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('networks.nameLabel')} <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Escape') closeCreate() }}
                  placeholder={t('networks.namePlaceholder')}
                  autoFocus
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Driver selector */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('networks.driverLabel')}</label>
                <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
                  {(['bridge', 'overlay'] as const).map(driver => (
                    <button
                      key={driver}
                      type="button"
                      onClick={() => setCreateDriver(driver)}
                      className={`flex-1 py-2 px-4 font-medium capitalize transition-colors border-l border-gray-200 dark:border-gray-700 first:border-l-0 ${
                        createDriver === driver
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/40'
                      }`}
                    >
                      {driver}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subnet / Gateway */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('networks.subnetLabel')} <span className="text-gray-400 dark:text-gray-500">{t('common.optional')}</span>
                  </label>
                  <input
                    type="text"
                    value={createSubnet}
                    onChange={e => setCreateSubnet(e.target.value)}
                    placeholder="172.20.0.0/16"
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('networks.gatewayLabel')} <span className="text-gray-400 dark:text-gray-500">{t('common.optional')}</span>
                  </label>
                  <input
                    type="text"
                    value={createGateway}
                    onChange={e => setCreateGateway(e.target.value)}
                    placeholder="172.20.0.1"
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={closeCreate}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                disabled={!isCreateValid}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('networks.createButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
