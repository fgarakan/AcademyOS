import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { NewClassTemplateForm } from './NewClassTemplateForm'

export default function NewClassTemplatePage() {
  return (
    <div className="p-6 animate-fade-in space-y-6 max-w-2xl">
      <div>
        <Link
          href="/director/class-templates"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Class Templates
        </Link>
        <p className="page-eyebrow">Curriculum</p>
        <h1 className="page-title">New Class Template</h1>
        <p className="page-subtitle">
          Start high level. Give this template a name and describe who it's for. You can add blocks, timing, and curriculum links after creation.
        </p>
      </div>

      <Card>
        <CardContent className="py-5">
          <NewClassTemplateForm />
        </CardContent>
      </Card>
    </div>
  )
}
