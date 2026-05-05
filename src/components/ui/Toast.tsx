'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[100] space-y-2 w-80 max-w-[calc(100vw-2rem)] pointer-events-none">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <ToastCard item={t} onDismiss={() => dismiss(t.id)} />
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const icon = item.type === 'success'
    ? <CheckCircle className="w-4 h-4 text-status-green shrink-0 mt-0.5" />
    : item.type === 'error'
    ? <AlertCircle className="w-4 h-4 text-status-red shrink-0 mt-0.5" />
    : <Info className="w-4 h-4 text-status-blue shrink-0 mt-0.5" />

  const borderClass = item.type === 'success'
    ? 'border-status-green/30'
    : item.type === 'error'
    ? 'border-status-red/30'
    : 'border-status-blue/30'

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl bg-surface border ${borderClass} shadow-lg`}>
      {icon}
      <p className="text-sm text-text-primary flex-1 leading-relaxed">{item.message}</p>
      <button
        onClick={onDismiss}
        className="shrink-0 text-text-muted hover:text-text-secondary transition-colors ml-1"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function useToast(): (type: ToastType, message: string) => void {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx.toast
}
