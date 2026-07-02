/**
 * Single source of truth for resolving which coach displays for a class session.
 * Rule: occurrence-level coach wins (substitution), falls back to class template coach.
 */

function resolveNestedCoachName(value) {
  if (!value || typeof value !== 'object') return null
  return value.name ?? value.nombre ?? value.coachName ?? value.coachNombre ?? null
}

function resolveCoachLabel(value) {
  if (typeof value === 'string') return value
  return resolveNestedCoachName(value)
}

export function resolveCoachNombre(occurrence = {}, classTemplate = {}) {
  return (
    resolveNestedCoachName(occurrence?.effectiveCoach) ??
    resolveNestedCoachName(occurrence?.effective_coach) ??
    occurrence?.effectiveCoachName ??
    occurrence?.effective_coach_name ??
    occurrence?.coachNombre ??
    occurrence?.coach_name ??
    classTemplate?.coachNombre ??
    classTemplate?.coach_name ??
    resolveCoachLabel(classTemplate?.coach) ??
    resolveNestedCoachName(classTemplate?.effectiveCoach) ??
    resolveNestedCoachName(classTemplate?.effective_coach) ??
    classTemplate?.coachName ??
    classTemplate?.effectiveCoachName ??
    classTemplate?.effective_coach_name ??
    classTemplate?.coachNombre ??
    classTemplate?.coach_name ??
    null
  )
}

export function resolveCoachId(occurrence = {}, classTemplate = {}) {
  return (
    occurrence?.effectiveCoachId ??
    occurrence?.effective_coach_id ??
    occurrence?.effectiveCoach?.id ??
    occurrence?.effectiveCoach?.coachId ??
    occurrence?.effectiveCoach?.coach_id ??
    occurrence?.effective_coach?.id ??
    occurrence?.effective_coach?.coachId ??
    occurrence?.effective_coach?.coach_id ??
    occurrence?.coachId ??
    occurrence?.coach_id ??
    occurrence?.coach?.id ??
    occurrence?.coach?.coachId ??
    occurrence?.coach?.coach_id ??
    classTemplate?.effectiveCoachId ??
    classTemplate?.effective_coach_id ??
    classTemplate?.effectiveCoach?.id ??
    classTemplate?.effectiveCoach?.coachId ??
    classTemplate?.effectiveCoach?.coach_id ??
    classTemplate?.effective_coach?.id ??
    classTemplate?.effective_coach?.coachId ??
    classTemplate?.effective_coach?.coach_id ??
    classTemplate?.coachId ??
    classTemplate?.coach_id ??
    classTemplate?.coach?.id ??
    classTemplate?.coach?.coachId ??
    classTemplate?.coach?.coach_id ??
    null
  )
}
