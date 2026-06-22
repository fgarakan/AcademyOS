// The guardian registry — the framework's single plug-in point.
//
// Add Guardian N by importing it and appending it here. Nothing else in the
// framework needs to change. Order is presentation-only.

import type { Guardian } from './types'
import { executiveWorkspaceGuardian } from '../executiveWorkspace/executiveWorkspaceGuardian'

export const GUARDIANS: readonly Guardian[] = [
  executiveWorkspaceGuardian,
  // Planned (each = one rule file + one line here):
  //   cognitiveLoadGuardian        — CognitiveLoadGuardian
  //   donnaGuidanceGuardian        — DonnaGuidanceGuardian
  //   pageOwnershipGuardian        — PageOwnershipGuardian
  //   informationHierarchyGuardian — InformationHierarchyGuardian
  //   designSystemGuardian         — DesignSystemGuardian
]
