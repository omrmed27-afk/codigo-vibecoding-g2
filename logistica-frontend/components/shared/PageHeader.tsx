interface Props {
  title: string
  action?: React.ReactNode
}

export default function PageHeader({ title, action }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">{title}</h1>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
