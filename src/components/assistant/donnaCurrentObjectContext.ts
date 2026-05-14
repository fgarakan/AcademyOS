// Donna Current Object Context — Sprint 269
// Extracts the Academy OS object context from the current pathname.
// Pure, synchronous, no DB, no API. Used to pre-populate task drafts
// when the director is already viewing a specific object.

import type { DonnaResolvableObjectType } from './donnaObjectResolutionTypes'

export interface DonnaCurrentPageObject {
  objectType: DonnaResolvableObjectType
  objectId: string
  /** Human-readable label used in the draft field when auto-populated */
  fieldLabel: string
}

/**
 * Returns the object context for the current pathname, if one can be inferred.
 * Only identifies route-level UUIDs — does NOT fetch names or sensitive data.
 *
 * Supported patterns:
 * - /director/players/[uuid]          → player
 * - /director/sessions/[uuid]         → session
 * - /director/class-templates/[uuid]  → class_template
 * - /director/fitness/templates/[uuid] → fitness_template
 */
export function getCurrentPageObject(pathname: string): DonnaCurrentPageObject | null {
  // Most specific patterns first

  // Fitness template: /director/fitness/templates/[uuid]
  const fitnessMatch = pathname.match(
    /\/director\/fitness\/templates\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
  )
  if (fitnessMatch) {
    return {
      objectType: 'fitness_template',
      objectId: fitnessMatch[1],
      fieldLabel: 'Current fitness template (this page)',
    }
  }

  // Class template: /director/class-templates/[uuid]
  const classTemplateMatch = pathname.match(
    /\/director\/class-templates\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
  )
  if (classTemplateMatch) {
    return {
      objectType: 'class_template',
      objectId: classTemplateMatch[1],
      fieldLabel: 'Current class template (this page)',
    }
  }

  // Session: /director/sessions/[uuid]
  const sessionMatch = pathname.match(
    /\/director\/sessions\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
  )
  if (sessionMatch) {
    return {
      objectType: 'session',
      objectId: sessionMatch[1],
      fieldLabel: 'Current session (this page)',
    }
  }

  // Player: /director/players/[uuid]
  const playerMatch = pathname.match(
    /\/director\/players\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
  )
  if (playerMatch) {
    return {
      objectType: 'player',
      objectId: playerMatch[1],
      fieldLabel: 'Current player (this profile)',
    }
  }

  return null
}

/**
 * Given a task's field resolution map entry and the current page object,
 * returns whether the page object can pre-populate this field.
 */
export function canAutoPopulateField(
  fieldObjectType: import('./donnaObjectResolutionTypes').DonnaResolvableObjectType,
  pageObject: DonnaCurrentPageObject | null,
): boolean {
  if (!pageObject) return false
  return pageObject.objectType === fieldObjectType
}


