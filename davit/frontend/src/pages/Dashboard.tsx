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
  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1 text-base">Vue d'ensemble de votre système Docker</p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-4 gap-4 min-w-0">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex justify-between items-start gap-2 min-w-0">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium">Conteneurs actifs</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">12</p>
            <p className="text-xs text-gray-400 mt-1">sur 15 total</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-emerald-500 font-medium flex-wrap">
              <TrendingUp size={12} />
              <span>+2 vs. dernière heure</span>
            </div>
          </div>
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 shrink-0">
            <Container size={20} className="text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex justify-between items-start gap-2 min-w-0">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium">CPU</p>
            <p className="text-3xl font-bold text-purple-600 mt-1">68%</p>
            <p className="text-xs text-gray-400 mt-1">8 cores</p>
          </div>
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 shrink-0">
            <Cpu size={20} className="text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex justify-between items-start gap-2 min-w-0">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium">Mémoire</p>
            <p className="text-3xl font-bold text-green-600 mt-1">6.1 GB</p>
            <p className="text-xs text-gray-400 mt-1">sur 16 GB</p>
          </div>
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 shrink-0">
            <MemoryStick size={20} className="text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex justify-between items-start gap-2 min-w-0">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium">Disque</p>
            <p className="text-3xl font-bold text-orange-500 mt-1">124 GB</p>
            <p className="text-xs text-gray-400 mt-1">sur 500 GB</p>
          </div>
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-100 shrink-0">
            <HardDrive size={20} className="text-orange-500" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">Utilisation CPU</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">68%</p>
            </div>
            <Activity size={16} className="text-gray-300 mt-1 shrink-0" />
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
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 80]}
                  ticks={[0, 20, 40, 60, 80]}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  formatter={(v) => [`${v}%`, 'CPU']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
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

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">Utilisation Mémoire</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">6.1 GB</p>
            </div>
            <Activity size={16} className="text-gray-300 mt-1 shrink-0" />
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
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 8]}
                  ticks={[0, 2, 4, 6, 8]}
                  tickFormatter={(v: number) => `${v} GB`}
                />
                <Tooltip
                  formatter={(v) => [`${v} GB`, 'Mémoire']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
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
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 shrink-0">
              <Layers size={18} className="text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">Images</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">28</p>
          <p className="text-xs text-gray-400 mt-1">45.2 GB au total</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 shrink-0">
              <Database size={18} className="text-purple-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">Volumes</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">7</p>
          <p className="text-xs text-gray-400 mt-1">18.5 GB au total</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 shrink-0">
              <Network size={18} className="text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">Réseaux</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">5</p>
          <p className="text-xs text-gray-400 mt-1">4 personnalisés</p>
        </div>
      </div>
    </div>
  )
}
