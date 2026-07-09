import { useState } from 'react'
import {
  Search,
  Gauge,
  Trash2,
  Archive,
  X,
  ArrowUp,
  ArrowDown,
  Plus,
  Container,
  WeightTilde,
  Database
} from 'lucide-react'
import StatCard from '../components/StatCard'
import VolumeDetail from './VolumeDetail'
import ConfirmModal from '../components/ConfirmModal'
import BackupModal from '../components/BackupModal'
import { useTranslation } from '../i18n'

interface DockerVolume {
  id: string
  name: string
  driver: string
  mountPoint: string
  size: string
  created: string
  containers: number
  containerNames: string[]
}

type SortableCol = 'name' | 'driver' | 'mountPoint' | 'size' | 'created' | 'containers'
type SortDir = 'asc' | 'desc'

const MOCK_VOLUMES: DockerVolume[] = [
  { id: '1', name: 'postgres_data',      driver: 'local', mountPoint: '/var/lib/docker/volumes/postgres_data/_data',      size: '2.3 GB', created: 'Il y a 5 jours',    containers: 2, containerNames: ['postgres_primary', 'postgres_replica'] },
  { id: '2', name: 'redis_data',         driver: 'local', mountPoint: '/var/lib/docker/volumes/redis_data/_data',         size: '124 MB', created: 'Il y a 1 semaine',  containers: 1, containerNames: ['redis_cache'] },
  { id: '3', name: 'nginx_logs',         driver: 'local', mountPoint: '/var/lib/docker/volumes/nginx_logs/_data',         size: '45 MB',  created: 'Il y a 2 jours',    containers: 3, containerNames: ['nginx_proxy', 'nginx_static', 'nginx_api'] },
  { id: '4', name: 'mongodb_data',       driver: 'local', mountPoint: '/var/lib/docker/volumes/mongodb_data/_data',       size: '8.7 GB', created: 'Il y a 2 semaines', containers: 0, containerNames: [] },
  { id: '5', name: 'app_uploads',        driver: 'local', mountPoint: '/var/lib/docker/volumes/app_uploads/_data',        size: '1.2 GB', created: 'Il y a 3 jours',    containers: 1, containerNames: ['web_app'] },
  { id: '6', name: 'backup_2024',        driver: 'local', mountPoint: '/var/lib/docker/volumes/backup_2024/_data',        size: '4.5 GB', created: 'Il y a 1 mois',     containers: 0, containerNames: [] },
  { id: '7', name: 'elasticsearch_data', driver: 'local', mountPoint: '/var/lib/docker/volumes/elasticsearch_data/_data', size: '3.8 GB', created: 'Il y a 1 semaine',  containers: 2, containerNames: ['elastic_node1', 'elastic_node2'] },
]

const COLUMNS: { key: SortableCol; labelKey: string }[] = [
  { key: 'name',       labelKey: 'volumes.colName' },
  { key: 'driver',     labelKey: 'volumes.colDriver' },
  { key: 'mountPoint', labelKey: 'volumes.colMountPoint' },
  { key: 'size',       labelKey: 'volumes.colSize' },
  { key: 'created',    labelKey: 'volumes.colCreated' },
  { key: 'containers', labelKey: 'volumes.colContainers' },
]

function parseSize(size: string): number {
  const match = size.match(/^([\d.]+)\s*(MB|GB)/)
  if (!match) return 0
  const val = parseFloat(match[1])
  return match[2] === 'GB' ? val * 1024 : val
}

function parseRelativeTime(created: string): number {
  const match = created.match(/Il y a (\d+)\s+(heure|jour|semaine|mois)/)
  if (!match) return 0
  const n = parseInt(match[1], 10)
  const multipliers: Record<string, number> = { heure: 1, jour: 24, semaine: 168, mois: 720 }
  return n * (multipliers[match[2]] ?? 1)
}

function compareVolumes(a: DockerVolume, b: DockerVolume, col: SortableCol, dir: SortDir): number {
  let result: number
  if (col === 'size') {
    result = parseSize(a.size) - parseSize(b.size)
  } else if (col === 'created') {
    result = parseRelativeTime(a.created) - parseRelativeTime(b.created)
  } else if (col === 'containers') {
    result = a.containers - b.containers
  } else {
    result = a[col].localeCompare(b[col])
  }
  return dir === 'asc' ? result : -result
}

export default function Volumes() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState<SortableCol | null>(null)
  const [sortDir, setSortDir] = useState<SortDir | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDriver, setCreateDriver] = useState<'local' | 'cifs'>('local')
  const [localPath, setLocalPath] = useState('')
  const [cifsHost, setCifsHost] = useState('')
  const [cifsShare, setCifsShare] = useState('')
  const [cifsUsername, setCifsUsername] = useState('')
  const [cifsPassword, setCifsPassword] = useState('')
  const [cifsDomain, setCifsDomain] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<DockerVolume | null>(null)
  const [selectedVolume, setSelectedVolume] = useState<DockerVolume | null>(null)
  const [backupTarget, setBackupTarget] = useState<DockerVolume | null>(null)
  const [backupPath, setBackupPath] = useState('')

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')

  const inUseCount = MOCK_VOLUMES.filter(v => v.containers > 0).length
  const totalSizeMB = MOCK_VOLUMES.reduce((acc, v) => acc + parseSize(v.size), 0)
  const totalSizeDisplay = `${(totalSizeMB / 1024).toFixed(1)} GB`

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

  const filtered = MOCK_VOLUMES
    .filter(v => v.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => compareVolumes(a, b, effectiveCol, effectiveDir))

  const isCreateValid =
    createName.trim() !== '' &&
    (createDriver === 'local' ||
      (cifsHost.trim() !== '' && cifsShare.trim() !== '' && cifsUsername.trim() !== '' && cifsPassword.trim() !== ''))

  function closeCreate() {
    setCreateOpen(false)
    setCreateName('')
    setCreateDriver('local')
    setLocalPath('')
    setCifsHost('')
    setCifsShare('')
    setCifsUsername('')
    setCifsPassword('')
    setCifsDomain('')
  }

  if (selectedVolume !== null) {
    return <VolumeDetail volume={selectedVolume} onBack={() => setSelectedVolume(null)} />
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('volumes.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-base">
            {t('volumes.subtitle', { n: MOCK_VOLUMES.length, size: totalSizeDisplay })}
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shrink-0"
        >
          <Plus size={16} />
          {t('volumes.create')}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={<Database size={18} className="text-blue-600 dark:text-blue-400" />}
          iconBg="bg-blue-100 dark:bg-blue-900/40"
          title={t('volumes.total')}
          value={MOCK_VOLUMES.length}
          subtitle={t('volumes.totalSubtitle')}
        />
        <StatCard
          icon={<Gauge size={18} className="text-emerald-600 dark:text-emerald-400" />}
          iconBg="bg-emerald-100 dark:bg-emerald-900/40"
          title={t('volumes.inUse')}
          value={inUseCount}
          subtitle={t('volumes.inUseSubtitle')}
        />
        <StatCard
          icon={<WeightTilde size={18} className="text-orange-500 dark:text-orange-400" />}
          iconBg="bg-orange-100 dark:bg-orange-900/40"
          title={t('volumes.space')}
          value={totalSizeDisplay}
          subtitle={t('volumes.spaceSubtitle')}
        />
      </div>

      {/* Search bar */}
      <div className="relative max-w-lg">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('volumes.searchPlaceholder')}
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
                {t('volumes.colActions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {filtered.map(vol => (
              <tr
                key={vol.id}
                onClick={() => setSelectedVolume(vol)}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors cursor-pointer group/row"
              >
                <td className="px-6 py-4">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover/row:text-blue-600 dark:group-hover/row:text-blue-400 transition-colors">{vol.name}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-100 dark:border-blue-800/60">
                    {vol.driver}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-400 dark:text-gray-500 font-mono text-xs">{vol.mountPoint}</td>
                <td className="px-4 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">{vol.size}</td>
                <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{vol.created}</td>
                <td className="px-4 py-4">
                  {vol.containers > 0 ? (
                    <div className="relative inline-flex group">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-xs font-semibold border border-blue-100 dark:border-blue-800/60 cursor-default">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        {vol.containers}
                      </span>
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-20 pointer-events-none">
                        <div className="bg-gray-900 rounded-lg py-2 shadow-xl w-52">
                          {vol.containerNames.slice(0, 8).map(name => (
                            <div key={name} className="flex items-center gap-2 px-3 py-1">
                              <Container size={11} className="text-gray-400 dark:text-gray-500 shrink-0" />
                              <span className="text-white text-xs truncate">{name}</span>
                            </div>
                          ))}
                          {vol.containerNames.length > 8 && (
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
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={e => { e.stopPropagation(); setBackupTarget(vol); setBackupPath(`/backups/${vol.name}_${today}.tar.gz`) }}
                      className="p-1 rounded text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                    >
                      <Archive size={16} />
                    </button>
                  <div className="relative inline-flex group justify-end">
                    <button
                      onClick={e => { e.stopPropagation(); vol.containers === 0 && setDeleteTarget(vol) }}
                      disabled={vol.containers > 0}
                      className={`p-1 rounded transition-colors ${
                        vol.containers > 0
                          ? 'text-gray-200 dark:text-gray-700 cursor-not-allowed'
                          : 'text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400'
                      }`}
                    >
                      <Trash2 size={16} />
                    </button>
                    {vol.containers > 0 && (
                      <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 hidden group-hover:block z-10 pointer-events-none">
                        <div className="relative bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                          {t('volumes.mountedOnTooltip', { n: vol.containers, s: vol.containers > 1 ? 's' : '' })}
                          <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900" />
                        </div>
                      </div>
                    )}
                  </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <BackupModal
        open={backupTarget !== null}
        onClose={() => setBackupTarget(null)}
        itemName={backupTarget?.name ?? ''}
        backupPath={backupPath}
        onBackupPathChange={setBackupPath}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => setDeleteTarget(null)}
        title={t('volumes.deleteConfirmTitle')}
        description={deleteTarget ? (
          <>
            {t('volumes.deleteConfirmDescBefore')}{' '}
            <span className="font-semibold text-gray-800 dark:text-gray-200">{deleteTarget.name}</span>{' '}
            {t('volumes.deleteConfirmDescAfter')}
          </>
        ) : null}
        confirmLabel={t('common.delete')}
        danger
      />

      {/* Create volume modal */}
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
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('volumes.createModalTitle')}</h2>
              <button
                onClick={closeCreate}
                className="p-1 rounded text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Volume name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('volumes.nameLabel')} <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Escape') closeCreate() }}
                  placeholder={t('volumes.namePlaceholder')}
                  autoFocus
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Driver selector */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('volumes.driverLabel')}</label>
                <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
                  <button
                    type="button"
                    onClick={() => setCreateDriver('local')}
                    className={`flex-1 py-2 px-4 font-medium transition-colors ${
                      createDriver === 'local'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/40'
                    }`}
                  >
                    Local
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateDriver('cifs')}
                    className={`flex-1 py-2 px-4 font-medium transition-colors border-l border-gray-200 dark:border-gray-700 ${
                      createDriver === 'cifs'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/40'
                    }`}
                  >
                    {t('volumes.cifsRemote')}
                  </button>
                </div>
              </div>

              {/* Local options */}
              {createDriver === 'local' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('volumes.localPathLabel')} <span className="text-gray-400 dark:text-gray-500">{t('common.optional')}</span>
                  </label>
                  <input
                    type="text"
                    value={localPath}
                    onChange={e => setLocalPath(e.target.value)}
                    placeholder={`/var/lib/docker/volumes/${createName || 'mon_volume'}/_data`}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  />
                </div>
              )}

              {/* CIFS options */}
              {createDriver === 'cifs' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {t('volumes.hostLabel')} <span className="text-red-500 dark:text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={cifsHost}
                        onChange={e => setCifsHost(e.target.value)}
                        placeholder="192.168.1.100"
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {t('volumes.sharedDirLabel')} <span className="text-red-500 dark:text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={cifsShare}
                        onChange={e => setCifsShare(e.target.value)}
                        placeholder={t('volumes.sharePlaceholder')}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {t('volumes.userLabel')} <span className="text-red-500 dark:text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={cifsUsername}
                        onChange={e => setCifsUsername(e.target.value)}
                        placeholder={t('volumes.userPlaceholder')}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {t('volumes.passwordLabel')} <span className="text-red-500 dark:text-red-400">*</span>
                      </label>
                      <input
                        type="password"
                        value={cifsPassword}
                        onChange={e => setCifsPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t('volumes.domainLabel')} <span className="text-gray-400 dark:text-gray-500">{t('common.optional')}</span>
                    </label>
                    <input
                      type="text"
                      value={cifsDomain}
                      onChange={e => setCifsDomain(e.target.value)}
                      placeholder="WORKGROUP"
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
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
                {t('volumes.createButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
