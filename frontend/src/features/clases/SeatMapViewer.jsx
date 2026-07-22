import { useState, useEffect, useMemo } from 'react'
import SeatSelector, { SLOW_MATS, buildStrydeLayout } from './SeatSelector'
import { getOccurrenceRosterApi } from '@/services/reservasApiService'
import { normalizeDiscipline } from '@/utils/discipline'
import { usePublicCoachesQuery } from '@/hooks/useApiQueries'

export default function SeatMapViewer({ cls, occurrenceId, onClose, fecha }) {
  const [occupantMap, setOccupantMap] = useState({})

  // The occurrence may override the template coach. Always resolve its current
  // public profile by effective coach ID instead of retaining a stale template avatar.
  const needsCoachEnrichment = Boolean(cls.coachId)
  const coachesQuery = usePublicCoachesQuery({ enabled: needsCoachEnrichment })

  // Enrich cls with coach photo/name from the public coaches API when missing
  const enrichedCls = useMemo(() => {
    if (!needsCoachEnrichment) return cls
    const coaches = coachesQuery.data ?? []
    if (!coaches.length) return cls
    const coach = coaches.find(
      (c) => c.id === cls.coachId || c.coachId === cls.coachId
    )
    if (!coach) return cls
    return {
      ...cls,
      coachAvatarUrl: coach.avatarUrl ?? coach.foto ?? cls.coachAvatarUrl ?? null,
      coachNombre: cls.coachNombre ?? coach.name ?? coach.nombre ?? null,
    }
  }, [cls, needsCoachEnrichment, coachesQuery.data])

  const isSlow = useMemo(() => {
    const disc = enrichedCls.discipline ?? enrichedCls.classDiscipline ?? enrichedCls.tipo ?? ''
    return normalizeDiscipline(disc) === 'slow'
  }, [enrichedCls])

  const strydeLayout = useMemo(() => buildStrydeLayout(), [])

  useEffect(() => {
    if (!occurrenceId) return
    let cancelled = false
    getOccurrenceRosterApi(occurrenceId, { includeCanceled: false })
      .then(data => {
        if (cancelled) return
        const students = data?.students ?? []
        const map = {}
        for (const s of students) {
          const num = String(s.spotLabel ?? '').padStart(2, '0')
          if (!num || num === '00') continue

          if (isSlow) {
            const mat = SLOW_MATS.find(m => m.num === num)
            if (mat) map[mat.id] = s.name
          } else {
            const type = s.equipmentType === 'mat' ? 'bench'
              : s.equipmentType === 'bench' ? 'bench'
              : 'treadmill'
            for (const row of strydeLayout) {
              for (const eq of row.equipment) {
                if (eq.type === type && eq.num === num) {
                  map[eq.id] = s.name
                }
              }
            }
          }
        }
        setOccupantMap(map)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [occurrenceId, isSlow, strydeLayout])

  return (
    <SeatSelector
      cls={enrichedCls}
      onClose={onClose}
      fecha={fecha}
      viewOnly={true}
      occurrenceId={occurrenceId}
      externalOccupantMap={occupantMap}
    />
  )
}
