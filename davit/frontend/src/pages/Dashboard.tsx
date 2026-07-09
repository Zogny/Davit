import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import {
  Container,
  Cpu,
  MemoryStick,
  HardDrive,
  Layers,
  Database,
  Activity,
  TrendingUp,
  Network,
} from 'lucide-react'
import { useTheme } from '../theme'
import { useTranslation } from '../i18n'

const CPU_HISTORY = [
  { time: '00:00', value: 42 },
  { time: '00:05', value: 48 },
  { time: '00:10', value: 45 },
  { time: '00:15', value: 55 },
  { time: '00:20', value: 60 },
  { time: '00:25', value: 64 },
  { time: '00:30', value: 68 },
]

const MEM_HISTORY = [
  { time: '00:00', value: 4.0 },
  { time: '00:05', value: 4.1 },
  { time: '00:10', value: 4.3 },
  { time: '00:15', value: 4.6 },
  { time: '00:20', value: 5.0 },
  { time: '00:25', value: 5.5 },
  { time: '00:30', value: 6.1 },
]

export default function Dashboard() {
  const { resolvedTheme } = useTheme()
  const { t } = useTranslation()
  const isDark = resolvedTheme === 'dark'

  const gridStroke = isDark ? '#374151' : '#f0f0f0'
  const axisTick = { fontSize: 11, fill: '#9ca3af' }
  const tooltipContentStyle = {
    borderRadius: '8px',
    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
    fontSize: '12px',
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    color: isDark ? '#f3f4f6' : '#111827',
  }
  const tooltipLabelStyle = { color: isDark ? '#d1d5db' : '#6b7280' }
  const tooltipItemStyle = { color: isDark ? '#f3f4f6' : '#111827' }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('dashboard.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-base">{t('dashboard.subtitle')}</p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-4 gap-4 min-w-0">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex justify-between items-start gap-2 min-w-0">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('dashboard.activeContainers')}</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">12</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('dashboard.ofTotal', { n: 15 })}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-emerald-500 font-medium flex-wrap">
              <TrendingUp size={12} />
              <span>{t('dashboard.trend')}</span>
            </div>
          </div>
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 shrink-0">
            <Container size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex justify-between items-start gap-2 min-w-0">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('dashboard.cpu')}</p>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">68%</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('dashboard.cores', { n: 8 })}</p>
          </div>
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/40 shrink-0">
            <Cpu size={20} className="text-purple-600 dark:text-purple-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex justify-between items-start gap-2 min-w-0">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('dashboard.memory')}</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">6.1 GB</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('dashboard.ofGB', { n: 16 })}</p>
          </div>
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 shrink-0">
            <MemoryStick size={20} className="text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex justify-between items-start gap-2 min-w-0">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('dashboard.disk')}</p>
            <p className="text-3xl font-bold text-orange-500 dark:text-orange-400 mt-1">124 GB</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('dashboard.ofGB', { n: 500 })}</p>
          </div>
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/40 shrink-0">
            <HardDrive size={20} className="text-orange-500 dark:text-orange-400" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('dashboard.cpuUsage')}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">68%</p>
            </div>
            <Activity size={16} className="text-gray-300 dark:text-gray-600 mt-1 shrink-0" />
          </div>
          <div className="h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CPU_HISTORY} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 80]}
                  ticks={[0, 20, 40, 60, 80]}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  formatter={(v) => [`${v}%`, t('dashboard.cpu')]}
                  contentStyle={tooltipContentStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#cpuGradient)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('dashboard.memoryUsage')}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">6.1 GB</p>
            </div>
            <Activity size={16} className="text-gray-300 dark:text-gray-600 mt-1 shrink-0" />
          </div>
          <div className="h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MEM_HISTORY} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 8]}
                  ticks={[0, 2, 4, 6, 8]}
                  tickFormatter={(v: number) => `${v} GB`}
                />
                <Tooltip
                  formatter={(v) => [`${v} GB`, t('dashboard.memory')]}
                  contentStyle={tooltipContentStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#memGradient)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 shrink-0">
              <Layers size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('dashboard.images')}</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">28</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('dashboard.totalSize', { size: '45.2 GB' })}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/40 shrink-0">
              <Database size={18} className="text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('dashboard.volumes')}</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">7</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('dashboard.totalSize', { size: '18.5 GB' })}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 shrink-0">
              <Network size={18} className="text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('dashboard.networks')}</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">5</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('dashboard.customized', { n: 4 })}</p>
        </div>
      </div>
    </div>
  )
}
