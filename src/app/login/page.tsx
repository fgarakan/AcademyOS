import { Suspense } from 'react'
import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Brand */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-lime mb-4">
            <span className="text-base font-bold text-[20px]">A</span>
          </div>
          <h1 className="text-2xl font-bold">Academy OS</h1>
          <p className="text-text-secondary text-sm mt-1">Sign in to your academy</p>
        </div>
        {/* LoginForm uses useSearchParams() — Suspense boundary required by Next.js 14 */}
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
