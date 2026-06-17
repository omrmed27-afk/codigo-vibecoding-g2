import { Package } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gray-50 px-4 py-10">
      {/* Brand mark */}
      <div className="flex items-center gap-2.5 mb-7">
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
          <Package className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
        <span className="text-xl font-bold text-gray-900 tracking-tight">Logística</span>
      </div>

      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
