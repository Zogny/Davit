import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft, Play, Square, RotateCw, Trash2, Zap, Copy, Check,
  Eye, EyeOff, Search, Pause, Radio, Download, ClipboardCopy, X,
} from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'
import ContainerStatusBadge, { type ContainerStatus } from '../components/ContainerStatusBadge'
import { useTranslation } from '../i18n'

type Tab = 'resume' | 'logs' | 'console'

interface ContainerSummary {
  id: string
  name: string
  image: string
  status: ContainerStatus
  ports: string
  cpu: string
  memory: string
  dependsOn: string[]
}

interface ContainerDetailProps {
  container: ContainerSummary
  onBack: () => void
}

interface PortMapping { host: string; container: string; protocol: string }
interface EnvVar { key: string; value: string; sensitive?: boolean }
interface VolumeMount { source: string; destination: string; mode: 'ro' | 'rw' }
interface NetworkConnection { name: string; ip: string; driver: string }

interface ContainerMeta {
  fullId: string
  createdAt: string
  restartPolicy: string
  command: string
  hostname: string
  ip: string
  memoryLimit: string
  pids: number
  ports: PortMapping[]
  env: EnvVar[]
  volumes: VolumeMount[]
  networks: NetworkConnection[]
  composeProject?: string
}

const SENSITIVE_PATTERN = /PASSWORD|SECRET|KEY|TOKEN/i

const MOCK_CONTAINER_META: Record<string, ContainerMeta> = {
  '1a2b3c4d': {
    fullId: '1a2b3c4d5e6f7g8h9i0j1k2l',
    createdAt: 'il y a 2 jours',
    restartPolicy: 'always',
    command: 'nginx -g "daemon off;"',
    hostname: '1a2b3c4d',
    ip: '172.20.0.2',
    memoryLimit: '256 MB',
    pids: 3,
    ports: [{ host: '80', container: '80', protocol: 'tcp' }, { host: '443', container: '443', protocol: 'tcp' }],
    env: [
      { key: 'NGINX_HOST', value: 'localhost' },
      { key: 'NGINX_PORT', value: '80' },
    ],
    volumes: [
      { source: '/home/user/nginx/conf.d', destination: '/etc/nginx/conf.d', mode: 'ro' },
    ],
    networks: [
      { name: 'app-stack_frontend-network', ip: '172.20.0.2', driver: 'bridge' },
    ],
    composeProject: 'app-stack',
  },
  '3m4n5o6p': {
    fullId: '3m4n5o6p7q8r9s0t',
    createdAt: 'il y a 2 jours',
    restartPolicy: 'unless-stopped',
    command: 'node server.js',
    hostname: '3m4n5o6p',
    ip: '172.20.0.3',
    memoryLimit: '512 MB',
    pids: 4,
    ports: [{ host: '3000', container: '3000', protocol: 'tcp' }],
    env: [
      { key: 'NODE_ENV', value: 'production' },
      { key: 'PORT', value: '3000' },
      { key: 'DB_PASSWORD', value: 'supersecret', sensitive: true },
      { key: 'REDIS_URL', value: 'redis://redis-cache:6379' },
      { key: 'JWT_SECRET', value: 'myjwtsecret', sensitive: true },
    ],
    volumes: [
      { source: '/var/lib/docker/volumes/app_uploads/_data', destination: '/app/uploads', mode: 'rw' },
      { source: '/home/user/app/config', destination: '/app/config', mode: 'ro' },
    ],
    networks: [
      { name: 'app-stack_backend-network', ip: '172.21.0.3', driver: 'bridge' },
      { name: 'app-stack_frontend-network', ip: '172.20.0.3', driver: 'bridge' },
    ],
    composeProject: 'app-stack',
  },
  '5e6f7g8h': {
    fullId: '5e6f7g8h9i0j1k2l3m4n5o6p',
    createdAt: 'il y a 5 jours',
    restartPolicy: 'unless-stopped',
    command: 'postgres',
    hostname: '5e6f7g8h',
    ip: '172.21.0.2',
    memoryLimit: '1 GB',
    pids: 8,
    ports: [{ host: '5432', container: '5432', protocol: 'tcp' }],
    env: [
      { key: 'POSTGRES_USER', value: 'admin' },
      { key: 'POSTGRES_PASSWORD', value: 'dbsecret', sensitive: true },
      { key: 'POSTGRES_DB', value: 'appdb' },
    ],
    volumes: [
      { source: '/var/lib/docker/volumes/postgres_data/_data', destination: '/var/lib/postgresql/data', mode: 'rw' },
    ],
    networks: [
      { name: 'app-stack_backend-network', ip: '172.21.0.2', driver: 'bridge' },
    ],
    composeProject: 'app-stack',
  },
  '9i0j1k2l': {
    fullId: '9i0j1k2l3m4n5o6p7q8r9s0t',
    createdAt: 'il y a 5 jours',
    restartPolicy: 'always',
    command: 'redis-server',
    hostname: '9i0j1k2l',
    ip: '172.21.0.4',
    memoryLimit: '128 MB',
    pids: 1,
    ports: [{ host: '6379', container: '6379', protocol: 'tcp' }],
    env: [
      { key: 'REDIS_PASSWORD', value: 'redispass', sensitive: true },
    ],
    volumes: [],
    networks: [
      { name: 'app-stack_backend-network', ip: '172.21.0.4', driver: 'bridge' },
    ],
    composeProject: 'app-stack',
  },
  mon1abc: {
    fullId: 'mon1abc2def3ghi4jkl5mno6',
    createdAt: 'il y a 1 mois',
    restartPolicy: 'unless-stopped',
    command: '/bin/prometheus --config.file=/etc/prometheus/prometheus.yml',
    hostname: 'mon1abc',
    ip: '172.22.0.2',
    memoryLimit: '256 MB',
    pids: 5,
    ports: [{ host: '9090', container: '9090', protocol: 'tcp' }],
    env: [],
    volumes: [
      { source: '/home/user/monitoring/prometheus.yml', destination: '/etc/prometheus/prometheus.yml', mode: 'ro' },
    ],
    networks: [
      { name: 'monitoring-stack_default', ip: '172.22.0.2', driver: 'bridge' },
    ],
    composeProject: 'monitoring-stack',
  },
  mon2def: {
    fullId: 'mon2def3ghi4jkl5mno6pqr7',
    createdAt: 'il y a 1 mois',
    restartPolicy: 'unless-stopped',
    command: '/run.sh',
    hostname: 'mon2def',
    ip: '172.22.0.3',
    memoryLimit: '256 MB',
    pids: 0,
    ports: [{ host: '3001', container: '3000', protocol: 'tcp' }],
    env: [
      { key: 'GF_SECURITY_ADMIN_PASSWORD', value: 'admin', sensitive: true },
    ],
    volumes: [
      { source: '/var/lib/docker/volumes/grafana_data/_data', destination: '/var/lib/grafana', mode: 'rw' },
    ],
    networks: [
      { name: 'monitoring-stack_default', ip: '172.22.0.3', driver: 'bridge' },
    ],
    composeProject: 'monitoring-stack',
  },
  '7q8r9s0t': {
    fullId: '7q8r9s0t1u2v3w4x5y6z7a8b',
    createdAt: 'il y a 1 semaine',
    restartPolicy: 'no',
    command: '/whoami',
    hostname: '7q8r9s0t',
    ip: '172.17.0.5',
    memoryLimit: '64 MB',
    pids: 0,
    ports: [{ host: '8082', container: '80', protocol: 'tcp' }],
    env: [],
    volumes: [],
    networks: [
      { name: 'bridge', ip: '172.17.0.5', driver: 'bridge' },
    ],
  },
}

function fallbackMeta(c: ContainerSummary): ContainerMeta {
  return {
    fullId: c.id.repeat(2),
    createdAt: 'Récemment',
    restartPolicy: 'unless-stopped',
    command: '—',
    hostname: c.id,
    ip: 'N/A',
    memoryLimit: '—',
    pids: 0,
    ports: [],
    env: [],
    volumes: [],
    networks: [],
  }
}

interface LogLine {
  id: number
  timestamp: string
  level: 'INFO' | 'WARN' | 'ERROR'
  message: string
  stream: 'stdout' | 'stderr'
}

function streamFor(level: LogLine['level']): LogLine['stream'] {
  return level === 'INFO' ? 'stdout' : 'stderr'
}

const INITIAL_LOG_TEMPLATE: { time: string; level: LogLine['level']; message: string }[] = [
  { time: '10:23:41', level: 'INFO',  message: 'Server started on port 3000' },
  { time: '10:23:42', level: 'INFO',  message: 'Connected to postgres at postgres-db:5432' },
  { time: '10:23:45', level: 'WARN',  message: 'Redis connection retry 1/3' },
  { time: '10:23:46', level: 'ERROR', message: 'Failed to reach redis-cache:6379' },
  { time: '10:23:47', level: 'INFO',  message: 'Redis connection established' },
  { time: '10:23:50', level: 'INFO',  message: 'GET /api/health 200 3ms' },
  { time: '10:24:02', level: 'INFO',  message: 'GET /api/users 200 18ms' },
  { time: '10:24:15', level: 'INFO',  message: 'POST /api/users 201 42ms' },
  { time: '10:24:20', level: 'WARN',  message: 'Slow query detected (312ms) on users table' },
  { time: '10:24:33', level: 'INFO',  message: 'GET /api/users/42 200 9ms' },
  { time: '10:24:47', level: 'ERROR', message: 'Unhandled promise rejection: connection timeout' },
  { time: '10:24:48', level: 'INFO',  message: 'Reconnecting to database...' },
  { time: '10:24:49', level: 'INFO',  message: 'Database reconnected' },
  { time: '10:25:01', level: 'INFO',  message: 'GET /api/orders 200 27ms' },
  { time: '10:25:14', level: 'INFO',  message: 'Cache hit for key user:42' },
  { time: '10:25:30', level: 'WARN',  message: 'Memory usage above 80%' },
  { time: '10:25:45', level: 'INFO',  message: 'GET /api/products 200 15ms' },
  { time: '10:26:00', level: 'INFO',  message: 'Scheduled job "cleanup-sessions" completed' },
  { time: '10:26:12', level: 'INFO',  message: 'GET /api/health 200 2ms' },
  { time: '10:26:30', level: 'INFO',  message: 'POST /api/login 200 55ms' },
]

const LIVE_LOG_POOL = [
  'GET /api/health 200 1ms',
  'GET /api/users 200 14ms',
  'Slow response time detected',
  'Database query failed: timeout',
  'Cache refreshed',
]

function buildInitialLogs(): LogLine[] {
  return INITIAL_LOG_TEMPLATE.map((l, i) => ({
    id: i,
    timestamp: `2024-01-15 ${l.time}`,
    level: l.level,
    message: l.message,
    stream: streamFor(l.level),
  }))
}

function formatNow(): string {
  const d = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function LogsPanel({ container }: { container: ContainerSummary }) {
  const { t } = useTranslation()
  const [lines, setLines] = useState<LogLine[]>(buildInitialLogs)
  const [liveFollow, setLiveFollow] = useState(true)
  const [paused, setPaused] = useState(false)
  const [frozenLines, setFrozenLines] = useState<LogLine[] | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [showStdout, setShowStdout] = useState(true)
  const [showStderr, setShowStderr] = useState(true)
  const [logSearch, setLogSearch] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(1000)

  useEffect(() => {
    if (container.status !== 'running') return
    const interval = setInterval(() => {
      const template = LIVE_LOG_POOL[Math.floor(Math.random() * LIVE_LOG_POOL.length)]
      const level: LogLine['level'] = template.includes('failed') || template.includes('timeout') ? 'ERROR'
        : template.includes('Slow') ? 'WARN' : 'INFO'
      const line: LogLine = {
        id: nextId.current++,
        timestamp: formatNow(),
        level,
        message: template,
        stream: streamFor(level),
      }
      setLines(prev => [...prev, line])
      if (paused) setPendingCount(c => c + 1)
    }, 4000)
    return () => clearInterval(interval)
  }, [container.status, paused])

  const displayLines = paused && frozenLines ? frozenLines : lines

  useEffect(() => {
    if (liveFollow && !paused) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines, liveFollow, paused])

  function togglePause() {
    if (!paused) {
      setFrozenLines(lines)
      setPendingCount(0)
      setPaused(true)
    } else {
      resume()
    }
  }

  function resume() {
    setFrozenLines(null)
    setPendingCount(0)
    setPaused(false)
  }

  const filtered = displayLines.filter(l =>
    (l.stream === 'stdout' ? showStdout : showStderr) &&
    l.message.toLowerCase().includes(logSearch.toLowerCase())
  )

  function rawText(): string {
    return lines.map(l => `${l.timestamp}  [${l.level}]  ${l.message}`).join('\n')
  }

  function handleCopyAll() {
    navigator.clipboard?.writeText(rawText())
  }

  function handleExport() {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const blob = new Blob([rawText()], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${container.name}-${today}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleClear() {
    setLines([])
    setFrozenLines(null)
    setPendingCount(0)
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-3">
        <button
          onClick={() => setLiveFollow(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            liveFollow ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40'
          }`}
        >
          <Radio size={12} />
          {t('logsPanel.liveFollow')}
        </button>
        <button
          onClick={togglePause}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            paused ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/60' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40'
          }`}
        >
          <Pause size={12} />
          {t('logsPanel.pause')}
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1" />

        <button
          onClick={() => setShowStdout(v => !v)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            showStdout ? 'bg-gray-800 text-white border-gray-800' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40'
          }`}
        >
          stdout
        </button>
        <button
          onClick={() => setShowStderr(v => !v)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            showStderr ? 'bg-red-600 text-white border-red-600' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40'
          }`}
        >
          stderr
        </button>

        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={logSearch}
            onChange={e => setLogSearch(e.target.value)}
            placeholder={t('logsPanel.searchPlaceholder')}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button onClick={handleCopyAll} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
            <ClipboardCopy size={12} />
            {t('logsPanel.copyAll')}
          </button>
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
            <Download size={12} />
            {t('logsPanel.export')}
          </button>
          <button onClick={handleClear} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
            <X size={12} />
            {t('logsPanel.clear')}
          </button>
        </div>
      </div>

      {/* Log area */}
      <div className="relative bg-[#1a1a2e] rounded-xl overflow-hidden">
        {paused && (
          <div className="flex items-center justify-between px-4 py-2 bg-orange-500/10 border-b border-orange-500/20">
            <span className="text-xs text-orange-300 dark:text-orange-500">
              {t('logsPanel.pausedBanner', { n: pendingCount, s: pendingCount > 1 ? 's' : '' })}
            </span>
            <button
              onClick={resume}
              className="text-xs font-medium text-orange-300 dark:text-orange-500 hover:text-orange-200 underline underline-offset-2"
            >
              {t('logsPanel.resume')}
            </button>
          </div>
        )}
        <div className="p-4 h-96 overflow-y-auto font-mono text-xs leading-relaxed">
          {filtered.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">{t('logsPanel.noLines')}</p>
          ) : (
            filtered.map(l => (
              <div key={l.id} className="flex gap-3">
                <span className="text-gray-500 dark:text-gray-400 shrink-0">{l.timestamp}</span>
                <span className={l.stream === 'stderr' ? 'text-red-400' : 'text-gray-100'}>
                  [{l.level}] {l.message}
                </span>
              </div>
            ))
          )}
          <div ref={endRef} />
        </div>
      </div>
    </div>
  )
}

function ConsolePanel({ status, onStart }: { status: ContainerStatus; onStart: () => void }) {
  const { t } = useTranslation()

  if (status === 'stopped') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-10 flex flex-col items-center gap-4 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('containerDetail.stoppedConsoleMsg')}</p>
        <button
          onClick={onStart}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Play size={14} />
          {t('containerActions.start')}
        </button>
      </div>
    )
  }

  if (status === 'paused') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-10 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('containerDetail.pausedConsoleMsg')}</p>
      </div>
    )
  }

  if (status === 'restarting') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-10 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('containerDetail.restartingConsoleMsg')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="bg-black rounded-xl p-4 h-96 overflow-y-auto font-mono text-sm text-emerald-400">
        <p>/ # <span className="animate-pulse">_</span></p>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500">{t('containerDetail.terminalNote')}</p>
    </div>
  )
}

export default function ContainerDetail({ container, onBack }: ContainerDetailProps) {
  const { t } = useTranslation()
  const meta = MOCK_CONTAINER_META[container.id] ?? fallbackMeta(container)
  const [status, setStatus] = useState<ContainerStatus>(container.status)
  const [activeTab, setActiveTab] = useState<Tab>('resume')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState(false)

  function toggleReveal(key: string) {
    setRevealedKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function handleCopyId() {
    navigator.clipboard?.writeText(meta.fullId)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 1500)
  }

  function handleRestart() {
    setStatus('restarting')
    setTimeout(() => setStatus('running'), 2000)
  }

  return (
    <div className="p-6 space-y-5">

      {/* Breadcrumb / back */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft size={15} />
          {t('common.backToContainers')}
        </button>
        {meta.composeProject && (
          <>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span className="text-gray-500 dark:text-gray-400">{meta.composeProject}</span>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span className="text-gray-800 dark:text-gray-200 font-medium">{container.name}</span>
          </>
        )}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{container.name}</h1>
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-mono text-gray-700 dark:text-gray-300">{container.image}</span>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <ContainerStatusBadge status={status} />
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <span>{t('containerDetail.createdPrefix')} {meta.createdAt.toLowerCase()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {status === 'restarting' && (
            <div className="relative group">
              <button disabled className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg cursor-not-allowed">
                <RotateCw size={14} />
                {t('containerDetail.restarting')}
              </button>
              <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-20 pointer-events-none">
                <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                  {t('containerActions.restartingTooltip')}
                </div>
              </div>
            </div>
          )}

          {status === 'running' && (
            <>
              <button
                onClick={() => setStatus('stopped')}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
              >
                <Square size={14} />
                {t('containerActions.stop')}
              </button>
              <button
                onClick={handleRestart}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
              >
                <RotateCw size={14} />
                {t('containerActions.restart')}
              </button>
              <button
                onClick={() => setDeleteConfirmOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 size={14} />
                {t('common.delete')}
              </button>
            </>
          )}

          {status === 'stopped' && (
            <>
              <button
                onClick={() => setStatus('running')}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Play size={14} />
                {t('containerActions.start')}
              </button>
              <div className="relative group">
                <button
                  disabled={!meta.composeProject}
                  onClick={() => meta.composeProject && setStatus('running')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                    meta.composeProject
                      ? 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40'
                      : 'text-gray-300 dark:text-gray-600 bg-gray-50 dark:bg-gray-700/40 border-gray-100 dark:border-gray-700 cursor-not-allowed'
                  }`}
                >
                  <Zap size={14} />
                  {t('containerDetail.startWithDepsButton')}
                </button>
                <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-20 pointer-events-none">
                  <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                    {t('containerActions.startWithDeps')}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDeleteConfirmOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 size={14} />
                {t('common.delete')}
              </button>
            </>
          )}

          {status === 'paused' && (
            <>
              <button
                onClick={() => setStatus('running')}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Play size={14} />
                {t('containerActions.resume')}
              </button>
              <button
                onClick={() => setStatus('stopped')}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
              >
                <Square size={14} />
                {t('containerActions.stop')}
              </button>
              <button
                onClick={() => setDeleteConfirmOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 size={14} />
                {t('common.delete')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 flex items-center gap-6">
        {([
          { key: 'resume', label: t('containerDetail.tabResume') },
          { key: 'logs', label: t('containerDetail.tabLogs') },
          { key: 'console', label: t('containerDetail.tabConsole') },
        ] as { key: Tab; label: string }[]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'resume' && (
        <div className="space-y-5">
          {/* 3 summary cards */}
          <div className="grid grid-cols-3 gap-4">
            {/* Identity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('containerDetail.identityCard')}</h2>
              <div className="space-y-2.5">
                <div className="flex items-start gap-3">
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide w-24 shrink-0 mt-0.5">ID</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-mono truncate">{meta.fullId.slice(0, 16)}…</span>
                    <button onClick={handleCopyId} className="p-0.5 rounded text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shrink-0">
                      {copiedId ? <Check size={12} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide w-24 shrink-0 mt-0.5">{t('containerDetail.image')}</span>
                  <span className="text-sm text-gray-800 dark:text-gray-200 font-mono break-all">{container.image}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide w-24 shrink-0 mt-0.5">{t('containerDetail.restart')}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-mono border border-gray-200 dark:border-gray-700">
                    {meta.restartPolicy}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide w-24 shrink-0 mt-0.5">{t('containerDetail.command')}</span>
                  <span className="text-xs text-gray-700 dark:text-gray-300 font-mono break-all">{meta.command}</span>
                </div>
              </div>
            </div>

            {/* Resources */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('containerDetail.resourcesCard')}</h2>
              <div className="space-y-2.5">
                <div className="flex items-start gap-3">
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide w-24 shrink-0 mt-0.5">{t('containerDetail.cpu')}</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{container.cpu}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide w-24 shrink-0 mt-0.5">{t('containerDetail.memory')}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{container.memory} / {meta.memoryLimit}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide w-24 shrink-0 mt-0.5">{t('containerDetail.pids')}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{meta.pids}</span>
                </div>
              </div>
            </div>

            {/* Network */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('containerDetail.networkCard')}</h2>
              <div className="space-y-2.5">
                <div className="flex items-start gap-3">
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide w-24 shrink-0 mt-0.5">{t('containerDetail.ip')}</span>
                  <span className="text-sm text-gray-800 dark:text-gray-200 font-mono">{meta.ip}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide w-24 shrink-0 mt-0.5">{t('containerDetail.hostname')}</span>
                  <span className="text-sm text-gray-800 dark:text-gray-200 font-mono">{meta.hostname}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide w-24 shrink-0 mt-0.5">{t('containerDetail.ports')}</span>
                  <div className="flex flex-wrap gap-1">
                    {meta.ports.length > 0 ? meta.ports.map(p => (
                      <span key={`${p.host}-${p.container}`} className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-mono border border-gray-200 dark:border-gray-700">
                        {p.host}:{p.container}/{p.protocol}
                      </span>
                    )) : <span className="text-xs text-gray-400 dark:text-gray-500">—</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Environment variables */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('containerDetail.envTitle')}</h2>
              <span className="text-xs text-gray-400 dark:text-gray-500">{meta.env.length}</span>
            </div>
            {meta.env.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 px-6 py-5">{t('containerDetail.envEmpty')}</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider px-6 py-3">{t('containerDetail.colKey')}</th>
                    <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider px-4 py-3">{t('containerDetail.colValue')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {meta.env.map(e => {
                    const isSensitive = e.sensitive ?? SENSITIVE_PATTERN.test(e.key)
                    const revealed = revealedKeys.has(e.key)
                    return (
                      <tr key={e.key}>
                        <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300 font-mono">{e.key}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-800 dark:text-gray-200 font-mono">
                              {isSensitive && !revealed ? '••••••••' : e.value}
                            </span>
                            {isSensitive && (
                              <button
                                onClick={() => toggleReveal(e.key)}
                                className="p-1 rounded text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                              >
                                {revealed ? <EyeOff size={13} /> : <Eye size={13} />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Volumes */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('containerDetail.volumesTitle')}</h2>
              <span className="text-xs text-gray-400 dark:text-gray-500">{meta.volumes.length}</span>
            </div>
            {meta.volumes.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 px-6 py-5">{t('containerDetail.volumesEmpty')}</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider px-6 py-3">{t('containerDetail.colSource')}</th>
                    <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider px-4 py-3">{t('containerDetail.colDestination')}</th>
                    <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider px-4 py-3">{t('containerDetail.colMode')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {meta.volumes.map(v => (
                    <tr key={v.destination}>
                      <td className="px-6 py-3 text-xs text-gray-600 dark:text-gray-400 font-mono break-all">{v.source}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 font-mono break-all">{v.destination}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${
                          v.mode === 'rw'
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/60'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                        }`}>
                          {v.mode}
                        </span>
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
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('containerDetail.networksTitle')}</h2>
              <span className="text-xs text-gray-400 dark:text-gray-500">{meta.networks.length}</span>
            </div>
            {meta.networks.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 px-6 py-5">{t('containerDetail.networksEmpty')}</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider px-6 py-3">{t('containerDetail.colNetworkName')}</th>
                    <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider px-4 py-3">{t('containerDetail.colIpInNetwork')}</th>
                    <th className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider px-4 py-3">{t('containerDetail.colDriver')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {meta.networks.map(n => (
                    <tr key={n.name}>
                      <td className="px-6 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">{n.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 font-mono">{n.ip}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-100 dark:border-blue-800/60">
                          {n.driver}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'logs' && <LogsPanel container={{ ...container, status }} />}

      {activeTab === 'console' && (
        <ConsolePanel status={status} onStart={() => setStatus('running')} />
      )}

      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => { setDeleteConfirmOpen(false); onBack() }}
        title={t('containerDetail.deleteConfirmTitle')}
        description={
          <>
            {t('containerDetail.deleteConfirmDescBefore')}{' '}
            <span className="font-semibold text-gray-800 dark:text-gray-200">{container.name}</span>{' '}
            {t('containerDetail.deleteConfirmDescAfter')}
          </>
        }
        confirmLabel={t('common.delete')}
        danger
      />
    </div>
  )
}
