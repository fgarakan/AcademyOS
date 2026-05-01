import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { NewFitnessTemplateForm } from './NewFitnessTemplateForm'

export default function NewFitnessTemplatePage() {
  return (
    <div className="p-6 animate-fade-in space-y-6 max-w-2xl">
      <div>
        <Link
          href="/director/fitness/templates"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Fitness Templates
        </Link>
        <p className="page-eyebrow">FITNESS OS</p>
        <h1 className="page-title">New Fitness Template</h1>
        <p className="page-subtitle">
          Create a structured fitness training protocol. Add blocks after the template is created.
        </p>
      </div>

      <Card>
        <CardContent className="py-5">
          <NewFitnessTemplateForm />
        </CardContent>
      </Card>
    </div>
  )
}
