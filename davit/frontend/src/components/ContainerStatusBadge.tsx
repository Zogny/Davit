export type ContainerStatus = 'running' | 'stopped' | 'paused' | 'restarting'

export const CONTAINER_STATUS_META: Record<ContainerStatus, { label: string; badge: string; dot: string }> = {
  running:    { label: 'En cours',    badge: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' },
  stopped:    { label: 'Arrêté',      badge: 'bg-red-50 text-red-700 border-red-100',              dot: 'bg-red-500' },
  paused:     { label: 'En pause',    badge: 'bg-orange-50 text-orange-700 border-orange-100',     dot: 'bg-orange-500' },
  restarting: { label: 'Redémarrage', badge: 'bg-blue-50 text-blue-700 border-blue-100',            dot: 'bg-blue-500' },
}

export default function ContainerStatusBadge({ status }: { status: ContainerStatus }) {
  const meta = CONTAINER_STATUS_META[status]
  const dotClass = status === 'restarting'
    ? 'w-1.5 h-1.5 rounded-full shrink-0 border border-blue-300 border-t-blue-600 animate-spin'
    : `w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${meta.badge}`}>
      <span className={dotClass} />
      {meta.label}
    </span>
  )
}
