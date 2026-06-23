import { useState, useEffect, useMemo } from 'react'
import SeatSelector, { SLOW_MATS, buildStrydeLayout } from './SeatSelector'
import { getOccurrenceRosterApi } from '@/services/reservasApiService'
import { normalizeDiscipline } from '@/utils/discipline'

export default function SeatMapViewer({ cls, occurrenceId, onClose, fecha }) {
  const [occupantMap, setOccupantMap] = useState({})

  const isSlow = useMemo(() => {
    const disc = cls.discipline ?? cls.classDiscipline ?? cls.tipo ?? ''
    return normalizeDiscipline(disc) === 'slow'
  }, [cls])

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
          // spotLabel from API is just the number e.g. '07', '02'
          // equipmentType is 'mat', 'bench', 'treadmill'
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
      cls={cls}
      onClose={onClose}
      fecha={fecha}
      viewOnly={true}
      occurrenceId={occurrenceId}
      externalOccupantMap={occupantMap}
    />
  )
}
