import { useState } from 'react'
import {
  Play, Square, RotateCw, Terminal, Trash2, Zap, MoreVertical,
  Braces, FileText, Pencil, ClipboardCopy,
} from 'lucide-react'
import type { ContainerStatus } from './ContainerStatusBadge'

interface ContainerActionsProps {
  containerId: string
  status: ContainerStatus
  inGroup: boolean
}

export default function ContainerActions({ containerId, status, inGroup }: ContainerActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  function copyId() {
    navigator.clipboard?.writeText(containerId)
    setMenuOpen(false)
  }

  const menu = menuOpen && (
    <>
      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
      <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg border border-gray-100 shadow-xl py-1 z-20">
        <button onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
          <Braces size={14} className="text-gray-400" />
          Inspecter
        </button>
        <button onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
          <FileText size={14} className="text-gray-400" />
          Voir les logs
        </button>
        <button onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
          <Pencil size={14} className="text-gray-400" />
          Renommer
        </button>
        <button onClick={copyId} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
          <ClipboardCopy size={14} className="text-gray-400" />
          Copier l'ID
        </button>
      </div>
    </>
  )

  if (status === 'restarting') {
    return (
      <div className="relative inline-flex items-center justify-end gap-1 group">
        <button disabled className="p-1.5 rounded text-gray-200 cursor-not-allowed"><Square size={15} /></button>
        <button disabled className="p-1.5 rounded text-gray-200 cursor-not-allowed"><RotateCw size={15} /></button>
        <button disabled className="p-1.5 rounded text-gray-200 cursor-not-allowed"><Terminal size={15} /></button>
        <button disabled className="p-1.5 rounded text-gray-200 cursor-not-allowed"><MoreVertical size={15} /></button>
        <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-20 pointer-events-none">
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
            Redémarrage en cours...
          </div>
        </div>
      </div>
    )
  }

  if (status === 'stopped') {
    return (
      <div className="relative inline-flex items-center justify-end gap-1">
        <button className="p-1.5 rounded text-gray-400 hover:text-emerald-600 transition-colors" title="Démarrer">
          <Play size={15} />
        </button>
        <div className="relative inline-flex group">
          <button
            disabled={!inGroup}
            className={`p-1.5 rounded transition-colors ${inGroup ? 'text-gray-400 hover:text-emerald-600' : 'text-gray-200 cursor-not-allowed'}`}
          >
            <Zap size={15} />
          </button>
          <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-20 pointer-events-none">
            <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
              Démarre ce conteneur et ses dépendances dans le bon ordre
            </div>
          </div>
        </div>
        <button className="p-1.5 rounded text-gray-400 hover:text-red-500 transition-colors" title="Supprimer">
          <Trash2 size={15} />
        </button>
        <div className="relative inline-flex">
          <button onClick={() => setMenuOpen(o => !o)} className="p-1.5 rounded text-gray-400 hover:text-gray-700 transition-colors">
            <MoreVertical size={15} />
          </button>
          {menu}
        </div>
      </div>
    )
  }

  if (status === 'paused') {
    return (
      <div className="relative inline-flex items-center justify-end gap-1">
        <button className="p-1.5 rounded text-gray-400 hover:text-emerald-600 transition-colors" title="Reprendre">
          <Play size={15} />
        </button>
        <button className="p-1.5 rounded text-gray-400 hover:text-red-500 transition-colors" title="Arrêter">
          <Square size={15} />
        </button>
        <div className="relative inline-flex">
          <button onClick={() => setMenuOpen(o => !o)} className="p-1.5 rounded text-gray-400 hover:text-gray-700 transition-colors">
            <MoreVertical size={15} />
          </button>
          {menu}
        </div>
      </div>
    )
  }

  // running
  return (
    <div className="relative inline-flex items-center justify-end gap-1">
      <button className="p-1.5 rounded text-gray-400 hover:text-red-500 transition-colors" title="Arrêter">
        <Square size={15} />
      </button>
      <button className="p-1.5 rounded text-gray-400 hover:text-blue-500 transition-colors" title="Redémarrer">
        <RotateCw size={15} />
      </button>
      <button className="p-1.5 rounded text-gray-400 hover:text-blue-500 transition-colors" title="Console">
        <Terminal size={15} />
      </button>
      <div className="relative inline-flex">
        <button onClick={() => setMenuOpen(o => !o)} className="p-1.5 rounded text-gray-400 hover:text-gray-700 transition-colors">
          <MoreVertical size={15} />
        </button>
        {menu}
      </div>
    </div>
  )
}
