import { useState } from 'react'
import {
  ArrowLeft, Archive, Trash2, HardDrive, ExternalLink,
  Container, Folder, FolderOpen, File, ChevronRight,
} from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'
import BackupModal from '../components/BackupModal'
import { useTranslation } from '../i18n'

interface VolumeInfo {
  name: string
  driver: string
  mountPoint: string
  size: string
  created: string
  containers: number
  containerNames: string[]
}

interface VolumeDetailProps {
  volume: VolumeInfo
  onBack: () => void
}

interface FileNode {
  name: string
  type: 'file' | 'dir'
  size?: string
  modified?: string
  children?: FileNode[]
}

const MOCK_CONTAINER_DETAILS: Record<string, { image: string; status: 'running' | 'stopped' }> = {
  postgres_primary:  { image: 'postgres:15',         status: 'running' },
  postgres_replica:  { image: 'postgres:15',         status: 'running' },
  redis_cache:       { image: 'redis:7-alpine',      status: 'running' },
  nginx_proxy:       { image: 'nginx:latest',        status: 'running' },
  nginx_static:      { image: 'nginx:latest',        status: 'stopped' },
  nginx_api:         { image: 'nginx:latest',        status: 'running' },
  web_app:           { image: 'node:18-alpine',      status: 'running' },
  elastic_node1:     { image: 'elasticsearch:8.12',  status: 'running' },
  elastic_node2:     { image: 'elasticsearch:8.12',  status: 'stopped' },
}

const MOCK_FILE_TREE: FileNode[] = [
  {
    name: 'base', type: 'dir', size: '1.8 GB', modified: 'Il y a 2 jours',
    children: [
      {
        name: '1', type: 'dir', size: '8.1 MB', modified: 'Il y a 5 jours',
        children: [
          { name: 'pg_filenode.map',  type: 'file', size: '512 B',  modified: 'Il y a 5 jours' },
          { name: 'pg_internal.init', type: 'file', size: '114 kB', modified: 'Il y a 5 jours' },
        ],
      },
      {
        name: '16384', type: 'dir', size: '1.8 GB', modified: 'Il y a 2 jours',
        children: [
          { name: 'pg_filenode.map',  type: 'file', size: '512 B',  modified: 'Il y a 2 jours' },
          { name: 'pg_internal.init', type: 'file', size: '256 kB', modified: 'Il y a 2 jours' },
          { name: '1259',             type: 'file', size: '48 kB',  modified: 'Il y a 2 jours' },
          { name: '1260',             type: 'file', size: '8.0 kB', modified: 'Il y a 2 jours' },
          { name: '2396',             type: 'file', size: '32 kB',  modified: 'Il y a 2 jours' },
        ],
      },
    ],
  },
  {
    name: 'global', type: 'dir', size: '784 kB', modified: 'Il y a 5 jours',
    children: [
      { name: 'pg_control',       type: 'file', size: '8.0 kB', modified: 'Il y a 2 jours' },
      { name: 'pg_filenode.map',  type: 'file', size: '512 B',  modified: 'Il y a 5 jours' },
      { name: 'pg_internal.init', type: 'file', size: '66 kB',  modified: 'Il y a 5 jours' },
    ],
  },
  {
    name: 'pg_logical', type: 'dir', size: '32 kB', modified: 'Il y a 5 jours',
    children: [
      { name: 'mappings',  type: 'dir', size: '—', modified: 'Il y a 5 jours', children: [] },
      { name: 'snapshots', type: 'dir', size: '—', modified: 'Il y a 5 jours', children: [] },
    ],
  },
  {
    name: 'pg_wal', type: 'dir', size: '384 MB', modified: 'Il y a 1 heure',
    children: [
      { name: '000000010000000000000001', type: 'file', size: '16 MB', modified: 'Il y a 1 heure' },
      { name: '000000010000000000000002', type: 'file', size: '16 MB', modified: 'Il y a 2 heures' },
      { name: 'archive_status', type: 'dir', size: '—', modified: 'Il y a 5 jours', children: [] },
    ],
  },
  { name: 'pg_commit_ts', type: 'dir', size: '—',      modified: 'Il y a 5 jours', children: [] },
  { name: 'pg_dynshmem',  type: 'dir', size: '—',      modified: 'Il y a 5 jours', children: [] },
  { name: 'PG_VERSION',         type: 'file', size: '3 B',    modified: 'Il y a 5 jours' },
  { name: 'pg_hba.conf',        type: 'file', size: '4.7 kB', modified: 'Il y a 5 jours' },
  { name: 'pg_ident.conf',      type: 'file', size: '1.6 kB', modified: 'Il y a 5 jours' },
  { name: 'postgresql.conf',    type: 'file', size: '27 kB',  modified: 'Il y a 5 jours' },
  { name: 'postmaster.opts',    type: 'file', size: '88 B',   modified: 'Il y a 2 jours' },
  { name: 'postmaster.pid',     type: 'file', size: '78 B',   modified: 'Il y a 1 heure' },
]

function TreeNode({ node, depth = 0 }: { node: FileNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth === 0)
  const pl = `${12 + depth * 16}px`

  if (node.type === 'file') {
    return (
      <div className="flex items-center gap-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors" style={{ paddingLeft: pl }}>
        <span className="w-3.5 shrink-0" />
        <File size={13} className="text-gray-400 dark:text-gray-500 shrink-0" />
        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 min-w-0 truncate">{node.name}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500 w-20 text-right shrink-0 pr-4">{node.size ?? '—'}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500 w-36 text-right shrink-0 pr-4">{node.modified ?? '—'}</span>
      </div>
    )
  }

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors cursor-pointer"
        style={{ paddingLeft: pl }}
        onClick={() => setExpanded(e => !e)}
      >
        <ChevronRight
          size={13}
          className={`text-gray-400 dark:text-gray-500 shrink-0 transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
        />
        {expanded
          ? <FolderOpen size={13} className="text-amber-400 shrink-0" />
          : <Folder size={13} className="text-amber-400 shrink-0" />
        }
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1 min-w-0 truncate">{node.name}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500 w-20 text-right shrink-0 pr-4">{node.size ?? '—'}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500 w-36 text-right shrink-0 pr-4">{node.modified ?? '—'}</span>
      </div>
      {expanded && (node.children ?? []).map((child, i) => (
        <TreeNode key={i} node={child} depth={depth + 1} />
      ))}
    </div>
  )
}

export default function VolumeDetail({ volume, onBack }: VolumeDetailProps) {
  const { t } = useTranslation()
  const windowsPath = `\\\\wsl.localhost\\docker-desktop-data\\data\\docker\\volumes\\${volume.name}\\_data`
  const canDelete = volume.containers === 0

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const defaultBackupPath = `/backups/${volume.name}_${today}.tar.gz`

  const [backupOpen, setBackupOpen] = useState(false)
  const [backupPath, setBackupPath] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  return (
    <div className="p-6 space-y-5">

      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
      >
        <ArrowLeft size={15} />
        {t('volumeDetail.backToVolumes')}
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{volume.name}</h1>
          <p className="text-gray-400 dark:text-gray-500 mt-0.5 text-sm font-mono">{volume.mountPoint}</p>
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-gray-700 dark:text-gray-300">{volume.size}</span>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <span>{t('volumeDetail.createdPrefix')} {volume.created.toLowerCase()}</span>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <span>{volume.driver}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => { setBackupPath(defaultBackupPath); setBackupOpen(true) }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
          >
            <Archive size={15} />
            {t('volumeDetail.backup')}
          </button>
          <button
            disabled={!canDelete}
            onClick={() => canDelete && setDeleteConfirmOpen(true)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              canDelete
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-200 dark:border-gray-700'
            }`}
          >
            <Trash2 size={15} />
            {t('common.delete')}
          </button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-4">

        {/* Left: volume info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('volumeDetail.infoCard')}</h2>
          <div className="space-y-3">
            {[
              { label: 'Driver', value: volume.driver, mono: false },
              { label: 'Scope',  value: 'local',       mono: false },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-4">
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide w-32 shrink-0">{row.label}</span>
                <span className={`text-sm text-gray-800 dark:text-gray-200 ${row.mono ? 'font-mono' : ''}`}>{row.value}</span>
              </div>
            ))}
            <div className="flex items-start gap-4">
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide w-32 shrink-0 mt-0.5">{t('volumeDetail.wslPath')}</span>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all leading-relaxed">{volume.mountPoint}</span>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide w-32 shrink-0 mt-0.5">{t('volumeDetail.windowsPath')}</span>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all leading-relaxed">{windowsPath}</span>
            </div>
          </div>
          <button className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors mt-auto">
            <ExternalLink size={14} />
            {t('volumeDetail.openInExplorer')}
          </button>
        </div>

        {/* Right: containers */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('volumeDetail.containersCard')}</h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-xs font-semibold border border-blue-100 dark:border-blue-800/60">
              {volume.containers}
            </span>
          </div>
          {volume.containers === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">{t('volumeDetail.noContainers')}</p>
          ) : (
            <div className="space-y-2">
              {volume.containerNames.map(name => {
                const detail = MOCK_CONTAINER_DETAILS[name] ?? { image: 'unknown', status: 'running' as const }
                return (
                  <div key={name} className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700">
                    <Container size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{detail.image}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                      detail.status === 'running'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50'
                        : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800/50'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        detail.status === 'running' ? 'bg-emerald-500' : 'bg-red-400'
                      }`} />
                      {detail.status === 'running' ? t('containerStatus.running') : t('containerStatus.stopped')}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* File tree */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <HardDrive size={15} className="text-gray-400 dark:text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('volumeDetail.fileTree')}</h2>
        </div>
        <div className="flex items-center px-3 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-700/40">
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider flex-1 pl-8">{t('volumeDetail.colName')}</span>
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider w-20 text-right pr-4">{t('volumeDetail.colSize')}</span>
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider w-36 text-right pr-4">{t('volumeDetail.colModified')}</span>
        </div>
        <div className="px-3 py-2">
          {MOCK_FILE_TREE.map((node, i) => (
            <TreeNode key={i} node={node} />
          ))}
        </div>
      </div>

      <BackupModal
        open={backupOpen}
        onClose={() => setBackupOpen(false)}
        itemName={volume.name}
        backupPath={backupPath}
        onBackupPathChange={setBackupPath}
      />

      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => { setDeleteConfirmOpen(false); onBack() }}
        title={t('volumeDetail.deleteConfirmTitle')}
        description={
          <>
            {t('volumeDetail.deleteConfirmDescBefore')}{' '}
            <span className="font-semibold text-gray-800 dark:text-gray-200">{volume.name}</span>{' '}
            {t('volumeDetail.deleteConfirmDescAfter')}
          </>
        }
        confirmLabel={t('common.delete')}
        danger
      />

    </div>
  )
}
