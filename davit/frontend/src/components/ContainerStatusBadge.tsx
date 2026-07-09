import { useTranslation } from '../i18n'

export type ContainerStatus = 'running' | 'stopped' | 'paused' | 'restarting'

export const CONTAINER_STATUS_META: Record<ContainerStatus, { labelKey: string; badge: string; dot: string }> = {
  running:    { labelKey: 'containerStatus.running',    badge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50', dot: 'bg-emerald-500' },
  stopped:    { labelKey: 'containerStatus.stopped',    badge: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800/50',              dot: 'bg-red-500' },
  paused:     { labelKey: 'containerStatus.paused',     badge: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-100 dark:border-orange-800/50',     dot: 'bg-orange-500' },
  restarting: { labelKey: 'containerStatus.restarting', badge: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800/60',            dot: 'bg-blue-500' },
}

export default function ContainerStatusBadge({ status }: { status: ContainerStatus }) {
  const { t } = useTranslation()
  const meta = CONTAINER_STATUS_META[status]
  const dotClass = status === 'restarting'
    ? 'w-1.5 h-1.5 rounded-full shrink-0 border border-blue-300 border-t-blue-600 animate-spin'
    : `w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${meta.badge}`}>
      <span className={dotClass} />
      {t(meta.labelKey)}
    </span>
  )
}
