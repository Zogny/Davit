import { useState } from 'react'
import { ArrowLeft, Play, Square, RotateCw, Trash2, Package } from 'lucide-react'
import ContainerStatusBadge, { type ContainerStatus } from '../components/ContainerStatusBadge'
import ContainerActions from '../components/ContainerActions'
import VolumeDetail from './VolumeDetail'
import NetworkDetail from './NetworkDetail'
import { useTranslation } from '../i18n'

interface StackContainer {
  id: string
  name: string
  image: string
  status: ContainerStatus
  ports: string
  cpu: string
  memory: string
  dependsOn: string[]
}

interface StackVolume {
  name: string
  driver: string
  size: string
  usedBy: string[]
}

interface StackNetwork {
  name: string
  driver: string
  subnet: string
  containers: string[]
}

interface StackData {
  createdAt: string
  containers: StackContainer[]
  volumes: StackVolume[]
  networks: StackNetwork[]
}

interface StackDetailProps {
  projectName: string
  onBack: () => void
  onOpenContainer: (container: StackContainer) => void
}

const MOCK_STACKS: Record<string, StackData> = {
  'app-stack': {
    createdAt: 'il y a 3 jours',
    containers: [
      { id: '5e6f7g8h', name: 'postgres-db', image: 'postgres:15',    status: 'running', ports: '5432:5432',      cpu: '8.2%',  memory: '234 MB', dependsOn: [] },
      { id: '9i0j1k2l', name: 'redis-cache', image: 'redis:7-alpine', status: 'running', ports: '6379:6379',      cpu: '1.1%',  memory: '12 MB',  dependsOn: [] },
      { id: '3m4n5o6p', name: 'app-backend', image: 'node:18-alpine', status: 'running', ports: '3000:3000',      cpu: '15.4%', memory: '156 MB', dependsOn: ['postgres-db', 'redis-cache'] },
      { id: '1a2b3c4d', name: 'nginx-proxy',  image: 'nginx:latest',   status: 'stopped', ports: '80:80, 443:443', cpu: '0%',    memory: '0 MB',   dependsOn: ['app-backend'] },
    ],
    volumes: [
      { name: 'postgres_data', driver: 'local', size: '2.3 GB', usedBy: ['postgres-db'] },
      { name: 'app_uploads',   driver: 'local', size: '1.2 GB', usedBy: ['app-backend'] },
      { name: 'nginx_logs',    driver: 'local', size: '45 MB',  usedBy: ['nginx-proxy'] },
    ],
    networks: [
      { name: 'app-stack_frontend-network', driver: 'bridge', subnet: '172.20.0.0/24', containers: ['nginx-proxy', 'app-backend'] },
      { name: 'app-stack_backend-network',  driver: 'bridge', subnet: '172.21.0.0/24', containers: ['app-backend', 'postgres-db', 'redis-cache'] },
    ],
  },
  'monitoring-stack': {
    createdAt: 'il y a 1 mois',
    containers: [
      { id: 'mon1abc', name: 'prometheus', image: 'prom/prometheus:latest', status: 'running', ports: '9090:9090', cpu: '3.2%', memory: '89 MB', dependsOn: [] },
      { id: 'mon2def', name: 'grafana',    image: 'grafana/grafana:latest', status: 'stopped', ports: '3001:3000', cpu: '0%',   memory: '0 MB',  dependsOn: ['prometheus'] },
    ],
    volumes: [
      { name: 'prometheus_data', driver: 'local', size: '620 MB', usedBy: ['prometheus'] },
      { name: 'grafana_data',    driver: 'local', size: '80 MB',  usedBy: ['grafana'] },
    ],
    networks: [
      { name: 'monitoring-stack_default', driver: 'bridge', subnet: '172.22.0.0/24', containers: ['prometheus', 'grafana'] },
    ],
  },
}

const EMPTY_STACK: StackData = { createdAt: 'Récemment', containers: [], volumes: [], networks: [] }

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

function computeDepths(containers: StackContainer[]): Map<string, number> {
  const byName = new Map(containers.map(c => [c.name, c]))
  const depths = new Map<string, number>()
  function depthOf(name: string, seen: Set<string>): number {
    if (depths.has(name)) return depths.get(name)!
    if (seen.has(name)) return 0
    const c = byName.get(name)
    if (!c || c.dependsOn.length === 0) { depths.set(name, 0); return 0 }
    const next = new Set(seen)
    next.add(name)
    const d = 1 + Math.max(...c.dependsOn.map(dep => depthOf(dep, next)))
    depths.set(name, d)
    return d
  }
  containers.forEach(c => depthOf(c.name, new Set()))
  return depths
}

function deriveGateway(subnet: string): string {
  const base = subnet.split('/')[0].split('.').slice(0, 3).join('.')
  return `${base}.1`
}

export default function StackDetail({ projectName, onBack, onOpenContainer }: StackDetailProps) {
  const { t } = useTranslation()
  const stack = MOCK_STACKS[projectName] ?? EMPTY_STACK

  const [selectedVolume, setSelectedVolume] = useState<StackVolume | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<StackNetwork | null>(null)
  const [deleteStackOpen, setDeleteStackOpen] = useState(false)
  const [deleteVolumesToo, setDeleteVolumesToo] = useState(false)
  const [deleteNetworksToo, setDeleteNetworksToo] = useState(true)

  if (selectedVolume !== null) {
    return (
      <VolumeDetail
        volume={{
          name: selectedVolume.name,
          driver: selectedVolume.driver,
          mountPoint: `/var/lib/docker/volumes/${selectedVolume.name}/_data`,
          size: selectedVolume.size,
          created: stack.createdAt,
          containers: selectedVolume.usedBy.length,
          containerNames: selectedVolume.usedBy,
        }}
        onBack={() => setSelectedVolume(null)}
      />
    )
  }

  if (selectedNetwork !== null) {
    return (
      <NetworkDetail
        network={{
          id: selectedNetwork.name.replace(/[^a-z0-9]/gi, '').slice(0, 12),
          name: selectedNetwork.name,
          driver: selectedNetwork.driver,
          scope: 'local',
          subnet: selectedNetwork.subnet,
          gateway: deriveGateway(selectedNetwork.subnet),
          containers: selectedNetwork.containers.length,
          containerNames: selectedNetwork.containers,
          custom: true,
        }}
        onBack={() => setSelectedNetwork(null)}
      />
    )
  }

  const totalCount = stack.containers.length
  const runningCount = stack.containers.filter(c => c.status === 'running').length
  const stoppedCount = stack.containers.filter(c => c.status === 'stopped').length
  const pausedCount = stack.containers.filter(c => c.status === 'paused').length

  const cpuTotal = stack.containers.reduce((sum, c) => sum + parseCpu(c.cpu), 0)
  const memTotal = stack.containers.reduce((sum, c) => sum + parseMemory(c.memory), 0)

  const depths = computeDepths(stack.containers)
  const orderedContainers = [...stack.containers].sort(
    (a, b) => (depths.get(a.name) ?? 0) - (depths.get(b.name) ?? 0)
  )

  const allRunning = totalCount > 0 && runningCount === totalCount
  const allStopped = totalCount > 0 && stoppedCount === totalCount

  return (
    <div className="p-6 space-y-5">

      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
      >
        <ArrowLeft size={15} />
        {t('common.backToContainers')}
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{projectName}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-base">
            {t('stackDetail.subtitle', { total: totalCount, running: runningCount, stopped: stoppedCount })}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            disabled={allRunning}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
              allRunning
                ? 'text-gray-300 dark:text-gray-600 bg-gray-50 dark:bg-gray-700/40 border-gray-100 dark:border-gray-700 cursor-not-allowed'
                : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40'
            }`}
          >
            <Play size={14} />
            {t('stackDetail.startAll')}
          </button>
          <button
            disabled={allStopped}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
              allStopped
                ? 'text-gray-300 dark:text-gray-600 bg-gray-50 dark:bg-gray-700/40 border-gray-100 dark:border-gray-700 cursor-not-allowed'
                : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40'
            }`}
          >
            <Square size={14} />
            {t('stackDetail.stopAll')}
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
            <RotateCw size={14} />
            {t('stackDetail.restartAll')}
          </button>
          <button
            onClick={() => setDeleteStackOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 size={14} />
            {t('stackDetail.deleteStack')}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('stackDetail.cardContainers')}</h2>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalCount}</p>
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">{t('stackDetail.running')}</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{runningCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">{t('stackDetail.stopped')}</span>
              <span className="font-semibold text-red-600 dark:text-red-400">{stoppedCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">{t('stackDetail.paused')}</span>
              <span className="font-semibold text-orange-600 dark:text-orange-400">{pausedCount}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('stackDetail.cardResources')}</h2>
          <div className="space-y-2.5">
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t('stackDetail.cpuTotal')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{cpuTotal.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t('stackDetail.memoryTotal')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{formatMemory(memTotal)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('stackDetail.cardComposition')}</h2>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">{t('stackDetail.volumesLabel')}</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{stack.volumes.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">{t('stackDetail.networksLabel')}</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{stack.networks.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">{t('stackDetail.createdLabel')}</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{stack.createdAt}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Containers */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('stackDetail.containersSection')}</h2>
          <span className="text-xs text-gray-400 dark:text-gray-500">{totalCount}</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700">
              <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider px-6 py-3">{t('containers.colContainer')}</th>
              <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider px-4 py-3">{t('containers.colImage')}</th>
              <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider px-4 py-3">{t('containers.colStatus')}</th>
              <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider px-4 py-3">{t('containers.colCpu')}</th>
              <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider px-4 py-3">{t('containers.colMemory')}</th>
              <th className="text-right text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider px-6 py-3">{t('containers.colActions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {orderedContainers.map(c => {
              const depth = depths.get(c.name) ?? 0
              return (
                <tr key={c.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors ${c.status === 'paused' ? 'opacity-70' : ''}`}>
                  <td className="py-4 px-6" style={{ paddingLeft: `${24 + depth * 20}px` }}>
                    <button
                      onClick={() => onOpenContainer(c)}
                      className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {c.name}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">{c.image}</td>
                  <td className="px-4 py-4"><ContainerStatusBadge status={c.status} /></td>
                  <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 tabular-nums">{c.cpu}</td>
                  <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 tabular-nums">{c.memory}</td>
                  <td className="px-6 py-4">
                    <ContainerActions containerId={c.id} status={c.status} inGroup />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Volumes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('stackDetail.volumesSection')}</h2>
          <span className="text-xs text-gray-400 dark:text-gray-500">{stack.volumes.length}</span>
        </div>
        {stack.volumes.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 px-6 py-5">{t('stackDetail.noVolumes')}</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider px-6 py-3">{t('stackDetail.colName')}</th>
                <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider px-4 py-3">{t('stackDetail.colDriver')}</th>
                <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider px-4 py-3">{t('stackDetail.colSize')}</th>
                <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider px-4 py-3">{t('stackDetail.colUsedBy')}</th>
                <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider px-6 py-3">{t('stackDetail.colStatus')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {stack.volumes.map(v => (
                <tr key={v.name}>
                  <td className="px-6 py-3">
                    <button onClick={() => setSelectedVolume(v)} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                      {v.name}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-100 dark:border-blue-800/60">
                      {v.driver}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{v.size}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{v.usedBy.join(', ') || '—'}</td>
                  <td className="px-6 py-3">
                    {v.usedBy.length > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-xs font-semibold border border-blue-100 dark:border-blue-800/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        {t('stackDetail.inUse')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 text-xs font-semibold border border-gray-200 dark:border-gray-700">
                        {t('stackDetail.unused')}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Networks */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('stackDetail.networksSection')}</h2>
          <span className="text-xs text-gray-400 dark:text-gray-500">{stack.networks.length}</span>
        </div>
        {stack.networks.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 px-6 py-5">{t('stackDetail.noNetworks')}</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider px-6 py-3">{t('stackDetail.colName')}</th>
                <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider px-4 py-3">{t('stackDetail.colDriver')}</th>
                <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider px-4 py-3">{t('stackDetail.colSubnet')}</th>
                <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider px-6 py-3">{t('stackDetail.colConnectedContainers')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {stack.networks.map(n => (
                <tr key={n.name}>
                  <td className="px-6 py-3">
                    <button onClick={() => setSelectedNetwork(n)} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                      {n.name}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-100 dark:border-blue-800/60">
                      {n.driver}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 font-mono">{n.subnet}</td>
                  <td className="px-6 py-3 text-sm text-gray-500 dark:text-gray-400">{n.containers.join(', ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete stack modal */}
      {deleteStackOpen && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => setDeleteStackOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">{t('stackDetail.deleteConfirmTitle', { name: projectName })}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('stackDetail.deleteConfirmDesc')}</p>

            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-2 mb-4">
              <Package size={14} className="text-gray-400 dark:text-gray-500" />
              {t('stackDetail.containerCount', { n: totalCount, s: totalCount > 1 ? 's' : '' })}
            </div>

            <div className="space-y-2.5 mb-5">
              <label className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteVolumesToo}
                  onChange={e => setDeleteVolumesToo(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 focus:ring-blue-500"
                />
                {t('stackDetail.deleteVolumesCheckbox', { n: stack.volumes.length })}
              </label>
              <label className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteNetworksToo}
                  onChange={e => setDeleteNetworksToo(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 focus:ring-blue-500"
                />
                {t('stackDetail.deleteNetworksCheckbox', { n: stack.networks.length })}
              </label>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteStackOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => { setDeleteStackOpen(false); onBack() }}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
