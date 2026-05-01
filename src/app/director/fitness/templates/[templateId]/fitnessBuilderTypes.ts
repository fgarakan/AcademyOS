import type { FitnessBlockType } from '@/lib/fitness/fitnessBlockTypes'

export interface FitnessExercise {
  id: string            // template_block_exercises.id
  exercise_id: string
  name: string
  category: string
  subcategory: string | null
  duration_min: number | null
  notes: string | null
}

export interface FitnessBlock {
  id: string
  name: string
  type: string          // DB block_type value
  fitnessBlockType: FitnessBlockType | null  // inferred from name
  duration_min: number
  order_index: number
  notes: string | null
  exercises: FitnessExercise[]
}

export interface ExerciseLibraryItem {
  id: string
  name: string
  category: string
  subcategory: string | null
  duration_min: number | null
  tags: string[] | null
}
