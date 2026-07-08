import { useState } from 'react'
import {
  Search,
  Tag,
  Download,
  OctagonMinus,
  Trash2,
  X,
  ArrowUp,
  ArrowDown,
  Gauge,
  Container,
  Layers
} from 'lucide-react'
import StatCard from '../components/StatCard'
import ConfirmModal from '../components/ConfirmModal'
import ImageDetail from './ImageDetail'


interface DockerImage {
  id: string
  repository: string
  tag: string
  shortId: string
  size: string
  created: string
  containers: number
  containerNames: string[]
}

type SortableCol = 'repository' | 'tag' | 'shortId' | 'size' | 'created' | 'containers'
type SortDir = 'asc' | 'desc'

const MOCK_IMAGES: DockerImage[] = [
  { id: '1', repository: 'nginx',    tag: 'latest',   shortId: 'abc123', size: '142 MB', created: 'Il y a 2 jours',    containers: 2, containerNames: ['nginx_proxy', 'nginx_static'] },
  { id: '2', repository: 'postgres', tag: '15',        shortId: 'def456', size: '379 MB', created: 'Il y a 5 jours',    containers: 1, containerNames: ['db_primary'] },
  { id: '3', repository: 'redis',    tag: '7-alpine',  shortId: 'gh1789', size: '28 MB',  created: 'Il y a 1 semaine',  containers: 1, containerNames: ['cache_server'] },
  { id: '4', repository: 'node',     tag: '18-alpine', shortId: 'jk1012', size: '167 MB', created: 'Il y a 3 heures',   containers: 3, containerNames: ['api_server', 'worker_1', 'worker_2'] },
  { id: '5', repository: 'mongo',    tag: '6',         shortId: 'mno345', size: '693 MB', created: 'Il y a 2 semaines', containers: 0, containerNames: [] },
  { id: '6', repository: 'mysql',    tag: '8.0',       shortId: 'pqr678', size: '521 MB', created: 'Il y a 1 mois',     containers: 0, containerNames: [] },
]

const TOTAL_SIZE = '1930 MB'

const COLUMNS: { key: SortableCol; label: string }[] = [
  { key: 'repository', label: 'REPOSITORY' },
  { key: 'tag',        label: 'TAG' },
  { key: 'shortId',    label: 'ID' },
  { key: 'size',       label: 'TAILLE' },
  { key: 'created',    label: 'CRÉÉE' },
  { key: 'containers', label: 'CONTENEURS' },
]

function parseSize(size: string): number {
  const match = size.match(/^([\d.]+)\s*(MB|GB)/)
  if (!match) return 0
  const val = parseFloat(match[1])
  return match[2] === 'GB' ? val * 1024 : val
}

// Returns hours elapsed — smaller = more recent
function parseRelativeTime(created: string): number {
  const match = created.match(/Il y a (\d+)\s+(heure|jour|semaine|mois)/)
  if (!match) return 0
  const n = parseInt(match[1], 10)
  const multipliers: Record<string, number> = {
    heure:   1,
    jour:    24,
    semaine: 24 * 7,
    mois:    24 * 30,
  }
  return n * (multipliers[match[2]] ?? 1)
}

function compareImages(a: DockerImage, b: DockerImage, col: SortableCol, dir: SortDir): number {
  let result: number

  if (col === 'size') {
    result = parseSize(a.size) - parseSize(b.size)
  } else if (col === 'created') {
    // asc = most recent first (smallest hours-ago value first)
    result = parseRelativeTime(a.created) - parseRelativeTime(b.created)
  } else if (col === 'containers') {
    result = a.containers - b.containers
  } else {
    result = (a[col] as string).localeCompare(b[col] as string)
  }

  return dir === 'asc' ? result : -result
}

export default function Images() {
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState<SortableCol | null>(null)
  const [sortDir, setSortDir] = useState<SortDir | null>(null)
  const [pullOpen, setPullOpen] = useState(false)
  const [pullInput, setPullInput] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<DockerImage | null>(null)
  const [selectedImage, setSelectedImage] = useState<DockerImage | null>(null)

  const inUseCount = MOCK_IMAGES.filter(i => i.containers > 0).length
  const unusedCount = MOCK_IMAGES.filter(i => i.containers === 0).length

  function handleSort(col: SortableCol) {
    if (col === sortCol) {
      if (sortDir === 'asc') {
        setSortDir('desc')
      } else {
        setSortCol(null)
        setSortDir(null)
      }
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  const effectiveCol = sortCol ?? 'repository'
  const effectiveDir = sortDir ?? 'asc'

  const filtered = MOCK_IMAGES
    .filter(img => {
      const q = search.toLowerCase()
      return img.repository.toLowerCase().includes(q) || img.tag.toLowerCase().includes(q)
    })
    .sort((a, b) => compareImages(a, b, effectiveCol, effectiveDir))

  function closePull() {
    setPullOpen(false)
    setPullInput('')
  }

  if (selectedImage !== null) {
    return <ImageDetail image={selectedImage} onBack={() => setSelectedImage(null)} />
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Images</h1>
          <p className="text-gray-500 mt-1 text-base">
            {MOCK_IMAGES.length} images • {TOTAL_SIZE} au total
          </p>
        </div>
        <button
          onClick={() => setPullOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shrink-0"
        >
          <Download size={16} />
          Pull une image
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={<Layers size={18} className="text-blue-600" />}
          iconBg="bg-blue-100"
          title="Total"
          value={MOCK_IMAGES.length}
          subtitle="images disponibles"
        />
        <StatCard
          icon={<Gauge size={18} className="text-emerald-600" />}
          iconBg="bg-emerald-100"
          title="En utilisation"
          value={inUseCount}
          subtitle="par des conteneurs"
        />
        <StatCard
          icon={<OctagonMinus size={18} className="text-orange-500" />}
          iconBg="bg-orange-100"
          title="Inutilisées"
          value={unusedCount}
          subtitle="peuvent être supprimées"
        />
      </div>

      {/* Search bar */}
      <div className="relative max-w-lg">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher une image..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="text-left px-4 py-3 first:px-6 select-none cursor-pointer group"
                >
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 tracking-wider group-hover:text-gray-600 transition-colors">
                    {col.label}
                    {sortCol === col.key ? (
                      sortDir === 'asc'
                        ? <ArrowUp size={12} className="text-blue-500" />
                        : <ArrowDown size={12} className="text-blue-500" />
                    ) : (
                      <ArrowUp size={12} className="opacity-0 group-hover:opacity-30 transition-opacity" />
                    )}
                  </span>
                </th>
              ))}
              <th className="text-right text-xs font-semibold text-gray-400 tracking-wider px-6 py-3">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(img => (
              <tr
                key={img.id}
                onClick={() => setSelectedImage(img)}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <td className="px-6 py-4 text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{img.repository}</td>
                <td className="px-4 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 text-xs font-medium border border-blue-100">
                    <Tag size={11} />
                    {img.tag}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-400 font-mono">{img.shortId}</td>
                <td className="px-4 py-4 text-sm font-semibold text-gray-700">{img.size}</td>
                <td className="px-4 py-4 text-sm text-gray-500">{img.created}</td>
                <td className="px-4 py-4">
                  {img.containers > 0 ? (
                    <div className="relative inline-flex group">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100 cursor-default">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        {img.containers}
                      </span>
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-20 pointer-events-none">
                        <div className="bg-gray-900 rounded-lg py-2 shadow-xl w-52">
                          {img.containerNames.slice(0, 8).map(name => (
                            <div key={name} className="flex items-center gap-2 px-3 py-1">
                              <Container size={11} className="text-gray-400 shrink-0" />
                              <span className="text-white text-xs truncate">{name}</span>
                            </div>
                          ))}
                          {img.containerNames.length > 8 && (
                            <div className="px-3 py-1 text-gray-400 text-xs">…</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 text-xs font-semibold border border-gray-200">
                      0
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="relative inline-flex group justify-end">
                    <button
                      onClick={e => { e.stopPropagation(); img.containers === 0 && setDeleteTarget(img) }}
                      disabled={img.containers > 0}
                      className={`p-1 rounded transition-colors ${
                        img.containers > 0
                          ? 'text-gray-200 cursor-not-allowed'
                          : 'text-gray-400 hover:text-red-500'
                      }`}
                    >
                      <Trash2 size={16} />
                    </button>
                    {img.containers > 0 && (
                      <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 hidden group-hover:block z-10 pointer-events-none">
                        <div className="relative bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                          Image utilisée par {img.containers} conteneur{img.containers > 1 ? 's' : ''} actif{img.containers > 1 ? 's' : ''}
                          <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900" />
                        </div>
                      </div>
                    )}
                  </div>
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
        title="Supprimer l'image"
        description={deleteTarget ? (
          <>
            Voulez-vous vraiment supprimer l'image{' '}
            <span className="font-semibold text-gray-800">
              {deleteTarget.repository}:{deleteTarget.tag}
            </span>{' '}
            ? Cette action est irréversible.
          </>
        ) : null}
        confirmLabel="Supprimer"
        danger
      />

      {/* Pull modal */}
      {pullOpen && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={closePull}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-semibold text-gray-900">Pull une image</h2>
              <button
                onClick={closePull}
                className="p-1 rounded text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Entrez le nom de l'image à télécharger (ex&nbsp;: nginx:latest)
            </p>
            <input
              type="text"
              value={pullInput}
              onChange={e => setPullInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') closePull() }}
              placeholder="nginx:latest"
              autoFocus
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={closePull}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                disabled={!pullInput.trim()}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Télécharger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
