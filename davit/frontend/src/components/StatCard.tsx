interface StatCardProps {
  icon: React.ReactNode
  iconBg: string
  title: string
  value: string | number
  subtitle: string
}

export default function StatCard({ icon, iconBg, title, value, subtitle }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${iconBg}`}>
          {icon}
        </div>
        <p className="text-base font-medium text-gray-700 dark:text-gray-300">{title}</p>
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>
    </div>
  )
}
