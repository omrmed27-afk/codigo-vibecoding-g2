const STATUS_CONFIG = {
  'pending':     { label: 'Pendiente',   dot: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700' },
  'in-progress': { label: 'En progreso', dot: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700' },
  'done':        { label: 'Completada',  dot: 'bg-success-500', badge: 'bg-success-100 text-success-500' },
};

export default function Badge({ status }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG['pending'];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
