/**
 * Single source of truth for resolving which coach displays for a class session.
 * Rule: occurrence-level coach wins (substitution), falls back to class template coach.
 */

export function resolveCoachNombre(occurrence = {}, classTemplate = {}) {
  return (
    occurrence?.coachNombre ??
    occurrence?.coach_name ??
    classTemplate?.coachNombre ??
    classTemplate?.coach_name ??
    null
  )
}

export function resolveCoachId(occurrence = {}, classTemplate = {}) {
  return (
    occurrence?.coachId ??
    occurrence?.coach_id ??
    classTemplate?.coachId ??
    classTemplate?.coach_id ??
    null
  )
}
