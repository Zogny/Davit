import { useState } from 'react'
import { ArrowLeft, Trash2, Play, Container } from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'

interface ImageInfo {
  id: string
  repository: string
  tag: string
  shortId: string
  size: string
  created: string
  containers: number
}

interface ImageDetailProps {
  image: ImageInfo
  onBack: () => void
}

interface ContainerRef {
  name: string
  status: 'running' | 'stopped'
}

interface Layer {
  command: string
  size: number
}

const MOCK_CONTAINERS: ContainerRef[] = [
  { name: 'nginx_proxy',  status: 'running' },
  { name: 'nginx_static', status: 'stopped' },
]

const MOCK_LAYERS: Layer[] = [
  { command: '/bin/sh -c apt-get update && apt-get install -y --no-install-recommends ca-certificates curl', size: 47_185_920 },
  { command: '/bin/sh -c apt-get install -y nginx && apt-get clean && rm -rf /var/lib/apt/lists/*',          size: 128_974_848 },
  { command: 'COPY nginx.conf /etc/nginx/nginx.conf',                                                         size: 2_048 },
  { command: 'COPY ./html /usr/share/nginx/html',                                                             size: 8_192 },
  { command: 'EXPOSE 80',                                                                                      size: 0 },
  { command: 'EXPOSE 443',                                                                                     size: 0 },
  { command: 'CMD ["nginx", "-g", "daemon off;"]',                                                            size: 0 },
]

const MOCK_DIGEST       = 'sha256:a6d0a8a5c77b8f5e83e5bfa7e9e2b4c6d8f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4'
const MOCK_ARCHITECTURE = 'amd64'
const MOCK_OS           = 'linux'
const MOCK_PORTS        = ['80/tcp', '443/tcp']
const MOCK_DECLARED_VOLUMES: string[] = []
const MOCK_CMD          = 'nginx -g "daemon off;"'

function formatLayerSize(bytes: number): string {
  if (bytes === 0)              return '0 B'
  if (bytes >= 1_048_576)       return `${(bytes / 1_048_576).toFixed(1)} MB`
  if (bytes >= 1_024)           return `${Math.round(bytes / 1_024)} KB`
  return `${bytes} B`
}

export default function ImageDetail({ image, onBack }: ImageDetailProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const canDelete = image.containers === 0
  const maxLayerSize = Math.max(...MOCK_LAYERS.map(l => l.size))

  return (
    <div className="p-6 space-y-5">

      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={15} />
        Retour aux images
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{image.repository}:{image.tag}</h1>
          <p className="text-gray-400 mt-0.5 text-sm font-mono">{image.shortId}</p>
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
            <span>{MOCK_ARCHITECTURE}</span>
            <span className="text-gray-300">•</span>
            <span>{MOCK_OS}</span>
            <span className="text-gray-300">•</span>
            <span className="font-semibold text-gray-700">{image.size}</span>
            <span className="text-gray-300">•</span>
            <span>Créée {image.created.toLowerCase()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Play size={14} />
            Créer un conteneur
          </button>
          <button
            disabled={!canDelete}
            onClick={() => canDelete && setDeleteConfirmOpen(true)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              canDelete
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
            }`}
          >
            <Trash2 size={15} />
            Supprimer
          </button>
        </div>
      </div>

      {/* 3 summary cards */}
      <div className="grid grid-cols-3 gap-4">

        {/* Identity */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">Identité</h2>
          <div className="space-y-2.5">
            <div className="flex items-start gap-3">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-24 shrink-0 mt-0.5">Repository</span>
              <span className="text-sm text-gray-800 break-all">{image.repository}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-24 shrink-0 mt-0.5">Tag</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs font-medium border border-blue-100">
                {image.tag}
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-24 shrink-0 mt-0.5">Digest</span>
              <div className="relative group min-w-0">
                <span className="text-xs text-gray-600 font-mono cursor-default">
                  {MOCK_DIGEST.slice(0, 19)}…
                </span>
                <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-10 pointer-events-none">
                  <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 font-mono whitespace-nowrap">
                    {MOCK_DIGEST}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-24 shrink-0 mt-0.5">Arch / OS</span>
              <span className="text-sm text-gray-700 font-mono">{MOCK_ARCHITECTURE} / {MOCK_OS}</span>
            </div>
          </div>
        </div>

        {/* Size */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">Taille</h2>
          <div className="space-y-2.5">
            <div className="flex items-start gap-3">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-24 shrink-0 mt-0.5">Total</span>
              <span className="text-sm font-semibold text-gray-800">{image.size}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-24 shrink-0 mt-0.5">Layers</span>
              <span className="text-sm text-gray-700">{MOCK_LAYERS.length} layers</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-24 shrink-0 mt-0.5">Créée</span>
              <span className="text-sm text-gray-700">{image.created}</span>
            </div>
          </div>
        </div>

        {/* Config */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">Configuration</h2>
          <div className="space-y-2.5">
            <div className="flex items-start gap-3">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-24 shrink-0 mt-0.5">Ports</span>
              <div className="flex flex-wrap gap-1">
                {MOCK_PORTS.length > 0 ? MOCK_PORTS.map(p => (
                  <span key={p} className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-mono border border-gray-200">
                    {p}
                  </span>
                )) : <span className="text-xs text-gray-400">—</span>}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-24 shrink-0 mt-0.5">Volumes</span>
              <div className="flex flex-col gap-1">
                {MOCK_DECLARED_VOLUMES.length > 0 ? MOCK_DECLARED_VOLUMES.map(v => (
                  <span key={v} className="text-xs text-gray-700 font-mono">{v}</span>
                )) : <span className="text-xs text-gray-400">—</span>}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-24 shrink-0 mt-0.5">CMD</span>
              <span className="text-xs text-gray-700 font-mono break-all">{MOCK_CMD}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Used by */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold text-gray-800">Utilisée par</h2>
          {image.containers > 0 ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
              {MOCK_CONTAINERS.length}
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-medium border border-gray-200">
              Inutilisée
            </span>
          )}
        </div>
        {image.containers === 0 ? (
          <p className="text-sm text-gray-400">
            Cette image n'est utilisée par aucun conteneur. Elle peut être supprimée.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {MOCK_CONTAINERS.map(c => (
              <div key={c.name} className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-gray-50 border border-gray-100">
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
        )}
      </div>

      {/* Layers */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Layers</h2>
          <span className="text-xs text-gray-400">{MOCK_LAYERS.length} layers</span>
        </div>
        <div className="flex items-center px-4 py-2 border-b border-gray-100 bg-gray-50/70">
          <span className="text-xs font-semibold text-gray-400 tracking-wider w-10 shrink-0">#</span>
          <span className="text-xs font-semibold text-gray-400 tracking-wider flex-1">COMMANDE</span>
          <span className="text-xs font-semibold text-gray-400 tracking-wider w-24 text-right pr-4">TAILLE</span>
          <span className="text-xs font-semibold text-gray-400 tracking-wider w-40">POIDS RELATIF</span>
        </div>
        <div className="divide-y divide-gray-50">
          {MOCK_LAYERS.map((layer, i) => {
            const barPct = maxLayerSize > 0 ? (layer.size / maxLayerSize) * 100 : 0
            const truncated = layer.command.length > 80
            return (
              <div key={i} className="flex items-center gap-2 px-4 py-3 group/layer">
                <span className="text-xs font-mono text-gray-400 w-10 shrink-0">#{i + 1}</span>
                <div className="flex-1 min-w-0 relative">
                  <span className="text-xs font-mono text-gray-700 truncate block cursor-default">
                    {truncated ? layer.command.slice(0, 80) + '…' : layer.command}
                  </span>
                  {truncated && (
                    <div className="absolute left-0 bottom-full mb-1 hidden group-hover/layer:block z-10 pointer-events-none">
                      <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 font-mono max-w-lg break-all whitespace-pre-wrap">
                        {layer.command}
                      </div>
                    </div>
                  )}
                </div>
                <span className={`text-xs w-24 text-right pr-4 shrink-0 tabular-nums ${
                  layer.size >= 1_048_576 ? 'font-semibold text-gray-700' : 'text-gray-400'
                }`}>
                  {formatLayerSize(layer.size)}
                </span>
                <div className="w-40 shrink-0">
                  {layer.size > 0 && (
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400 rounded-full"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => { setDeleteConfirmOpen(false); onBack() }}
        title="Supprimer l'image"
        description={
          <>
            Voulez-vous vraiment supprimer l'image{' '}
            <span className="font-semibold text-gray-800">{image.repository}:{image.tag}</span>{' '}
            ? Cette action est irréversible.
          </>
        }
        confirmLabel="Supprimer"
        danger
      />

    </div>
  )
}
