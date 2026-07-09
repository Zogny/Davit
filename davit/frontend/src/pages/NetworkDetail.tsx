import { useState } from 'react'
import { ArrowLeft, Trash2, Plus, Unlink, Container } from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'

interface NetworkInfo {
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

interface NetworkDetailProps {
  network: NetworkInfo
  onBack: () => void
}

interface NetworkMeta {
  createdAt: string
  ipv6: boolean
  internal: boolean
  composeProject?: string
}

interface ContainerConnection {
  id: string
  name: string
  status: 'running' | 'stopped'
  ip: string
  mac: string
}

const MOCK_NETWORK_META: Record<string, NetworkMeta> = {
  net123abc: { createdAt: 'il y a 6 mois',    ipv6: false, internal: false },
  net456def: { createdAt: 'il y a 6 mois',    ipv6: false, internal: false },
  net789ghi: { createdAt: 'il y a 6 mois',    ipv6: false, internal: false },
  netabc123: { createdAt: 'il y a 3 jours',   ipv6: false, internal: false, composeProject: 'davit-test' },
  netdef456: { createdAt: 'il y a 1 semaine', ipv6: false, internal: true },
}

const ALL_CONTAINER_POOL = [
  'davit-test-postgres', 'davit-test-redis', 'web_app', 'api_server',
  'worker_1', 'worker_2', 'worker_3', 'nginx_proxy', 'nginx_static', 'nginx_api',
  'redis_cache', 'postgres_primary', 'postgres_replica', 'pgadmin',
  'elastic_node1', 'elastic_node2',
]

function subnetBase(subnet: string): string | null {
  if (subnet === 'N/A') return null
  return subnet.split('/')[0].split('.').slice(0, 3).join('.')
}

function deriveConnections(network: NetworkInfo): ContainerConnection[] {
  const base = subnetBase(network.subnet)
  return network.containerNames.map((name, i) => ({
    id: `${network.id}-${name}`,
    name,
    status: i % 3 === 2 ? 'stopped' : 'running',
    ip: base ? `${base}.${i + 2}` : 'N/A',
    mac: `02:42:ac:14:00:${(i + 2).toString(16).padStart(2, '0')}`,
  }))
}

export default function NetworkDetail({ network, onBack }: NetworkDetailProps) {
  const meta = MOCK_NETWORK_META[network.id] ?? { createdAt: 'Récemment', ipv6: false, internal: false }
  const [connections, setConnections] = useState<ContainerConnection[]>(() => deriveConnections(network))
  const canDelete = connections.length === 0

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteWorkflowOpen, setDeleteWorkflowOpen] = useState(false)
  const [disconnectTarget, setDisconnectTarget] = useState<ContainerConnection | null>(null)
  const [connectOpen, setConnectOpen] = useState(false)
  const [connectName, setConnectName] = useState('')
  const [connectIp, setConnectIp] = useState('')

  const availableContainers = ALL_CONTAINER_POOL.filter(
    name => !connections.some(c => c.name === name)
  )

  function openConnect() {
    setConnectName(availableContainers[0] ?? '')
    setConnectIp('')
    setConnectOpen(true)
  }

  function closeConnect() {
    setConnectOpen(false)
    setConnectName('')
    setConnectIp('')
  }

  function handleConnect() {
    if (!connectName) return
    const base = subnetBase(network.subnet)
    const nextIndex = connections.length + 2
    setConnections(prev => [
      ...prev,
      {
        id: `${network.id}-${connectName}`,
        name: connectName,
        status: 'running',
        ip: connectIp.trim() || (base ? `${base}.${nextIndex}` : 'N/A'),
        mac: `02:42:ac:14:00:${nextIndex.toString(16).padStart(2, '0')}`,
      },
    ])
    closeConnect()
  }

  function handleDisconnect() {
    if (!disconnectTarget) return
    setConnections(prev => prev.filter(c => c.id !== disconnectTarget.id))
    setDisconnectTarget(null)
  }

  function handleDisconnectAllAndDelete() {
    setConnections([])
    setDeleteWorkflowOpen(false)
    onBack()
  }

  return (
    <div className="p-6 space-y-5">

      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={15} />
        Retour aux réseaux
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{network.name}</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {network.driver} • {network.scope}
          </p>
        </div>
        <button
          disabled={!canDelete}
          onClick={() => (canDelete ? setDeleteConfirmOpen(true) : setDeleteWorkflowOpen(true))}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors shrink-0 ${
            canDelete
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          }`}
        >
          <Trash2 size={15} />
          Supprimer
        </button>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-4">

        {/* Left: network configuration */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-gray-800">Configuration réseau</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-28 shrink-0">Driver</span>
              <span className="text-sm text-gray-800">{network.driver}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-28 shrink-0">Scope</span>
              <span className="text-sm text-gray-800">{network.scope}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-28 shrink-0">Subnet</span>
              <span className="text-sm text-gray-800 font-mono">{network.subnet}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-28 shrink-0">Gateway</span>
              <span className="text-sm text-gray-800 font-mono">{network.gateway}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-28 shrink-0">ID</span>
              <div className="relative group min-w-0">
                <span className="text-xs text-gray-600 font-mono cursor-default">
                  {network.id.slice(0, 12)}…
                </span>
                <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-10 pointer-events-none">
                  <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 font-mono whitespace-nowrap">
                    {network.id}
                  </div>
                </div>
              </div>
            </div>
            {meta.composeProject && (
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-28 shrink-0">Compose</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 text-xs font-medium border border-blue-100">
                  Compose
                  <span className="text-blue-400">•</span>
                  {meta.composeProject}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: statistics */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-gray-800">Statistiques</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-40 shrink-0">Conteneurs connectés</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                {connections.length}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-40 shrink-0">Créé</span>
              <span className="text-sm text-gray-700">{meta.createdAt}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-40 shrink-0">IPv6 activé</span>
              <span className="text-sm text-gray-700">{meta.ipv6 ? 'Oui' : 'Non'}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-40 shrink-0">Réseau interne (isolé)</span>
              <span className="text-sm text-gray-700">{meta.internal ? 'Oui' : 'Non'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Connected containers */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-800">Conteneurs connectés</h2>
            {connections.length > 0 ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                {connections.length}
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-medium border border-gray-200">
                Inutilisé
              </span>
            )}
          </div>
          <button
            onClick={openConnect}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Plus size={14} />
            Connecter un conteneur
          </button>
        </div>

        {connections.length === 0 ? (
          <p className="text-sm text-gray-400 px-6 py-6">
            Aucun conteneur connecté à ce réseau.
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 tracking-wider px-6 py-3">NOM</th>
                <th className="text-left text-xs font-semibold text-gray-400 tracking-wider px-4 py-3">IP</th>
                <th className="text-left text-xs font-semibold text-gray-400 tracking-wider px-4 py-3">ADRESSE MAC</th>
                <th className="text-right text-xs font-semibold text-gray-400 tracking-wider px-6 py-3">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {connections.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2.5">
                      <Container size={14} className="text-gray-400 shrink-0" />
                      <span className="text-sm font-medium text-gray-800">{c.name}</span>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                        c.status === 'running'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-red-50 text-red-600 border border-red-100'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'running' ? 'bg-emerald-500' : 'bg-red-400'}`} />
                        {c.status === 'running' ? 'En cours' : 'Arrêté'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 font-mono">{c.ip}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 font-mono">{c.mac}</td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => setDisconnectTarget(c)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Unlink size={12} />
                      Déconnecter
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Simple delete (no containers connected) */}
      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => { setDeleteConfirmOpen(false); onBack() }}
        title="Supprimer le réseau"
        description={
          <>
            Voulez-vous vraiment supprimer le réseau{' '}
            <span className="font-semibold text-gray-800">{network.name}</span>{' '}
            ? Cette action est irréversible.
          </>
        }
        confirmLabel="Supprimer"
        danger
      />

      {/* Simple disconnect confirmation */}
      <ConfirmModal
        open={disconnectTarget !== null}
        onClose={() => setDisconnectTarget(null)}
        onConfirm={handleDisconnect}
        title="Déconnecter le conteneur"
        description={disconnectTarget ? (
          <>
            Déconnecter{' '}
            <span className="font-semibold text-gray-800">{disconnectTarget.name}</span>{' '}
            de <span className="font-semibold text-gray-800">{network.name}</span> ?
          </>
        ) : null}
        confirmLabel="Déconnecter"
      />

      {/* Delete workflow (containers connected) */}
      {deleteWorkflowOpen && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => setDeleteWorkflowOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-gray-900 mb-1">Supprimer le réseau</h2>
            <p className="text-sm text-gray-500 mb-4">
              Ce réseau est utilisé par {connections.length} conteneur{connections.length > 1 ? 's' : ''}. Vous devez d'abord les déconnecter avant de pouvoir le supprimer.
            </p>
            <div className="space-y-2 mb-5 max-h-48 overflow-y-auto">
              {connections.map(c => (
                <div key={c.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-50 border border-gray-100">
                  <Container size={14} className="text-gray-400 shrink-0" />
                  <span className="text-sm font-medium text-gray-800 flex-1 truncate">{c.name}</span>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                    c.status === 'running'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'bg-red-50 text-red-600 border border-red-100'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'running' ? 'bg-emerald-500' : 'bg-red-400'}`} />
                    {c.status === 'running' ? 'En cours' : 'Arrêté'}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteWorkflowOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDisconnectAllAndDelete}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Déconnecter tout et supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connect a container */}
      {connectOpen && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={closeConnect}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-gray-900 mb-4">Connecter un conteneur</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Conteneur</label>
                {availableContainers.length > 0 ? (
                  <select
                    value={connectName}
                    onChange={e => setConnectName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {availableContainers.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-gray-400">Tous les conteneurs disponibles sont déjà connectés.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  IP spécifique <span className="text-gray-400">(optionnel)</span>
                </label>
                <input
                  type="text"
                  value={connectIp}
                  onChange={e => setConnectIp(e.target.value)}
                  placeholder="Automatique"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={closeConnect}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                disabled={!connectName}
                onClick={handleConnect}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Connecter
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
