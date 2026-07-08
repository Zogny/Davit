import { Archive, X } from 'lucide-react'

interface BackupModalProps {
  open: boolean
  onClose: () => void
  itemName: string
  backupPath: string
  onBackupPathChange: (path: string) => void
}

export default function BackupModal({
  open,
  onClose,
  itemName,
  backupPath,
  onBackupPathChange,
}: BackupModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-gray-900">Sauvegarder le volume</h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Choisissez l'emplacement et le nom du fichier de sauvegarde pour{' '}
          <span className="font-semibold text-gray-800">{itemName}</span>.
        </p>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Emplacement de la sauvegarde
          </label>
          <input
            type="text"
            value={backupPath}
            onChange={e => onBackupPathChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') onClose() }}
            autoFocus
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Le volume sera archivé en{' '}
            <code className="bg-gray-100 px-1 rounded font-mono">.tar.gz</code>{' '}
            à cet emplacement.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            disabled={!backupPath.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Archive size={14} />
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  )
}
