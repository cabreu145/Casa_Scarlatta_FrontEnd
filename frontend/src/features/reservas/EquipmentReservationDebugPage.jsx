import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import EquipmentReservationPanel from './EquipmentReservationPanel'

function toNumber(value, fallback = null) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export default function EquipmentReservationDebugPage() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [searchParams] = useSearchParams()

  const occurrenceId = useMemo(() => toNumber(searchParams.get('occurrenceId')), [searchParams])
  const classId = useMemo(() => toNumber(searchParams.get('classId')), [searchParams])
  const userId = useMemo(
    () => toNumber(searchParams.get('userId'), usuario?.id ?? null) ?? usuario?.id ?? null,
    [searchParams, usuario?.id],
  )

  if (!occurrenceId || !classId || !userId) {
    return (
      <main style={{ padding: 24, fontFamily: 'var(--font-body)' }}>
        Faltan query params para QA: occurrenceId, classId, userId.
      </main>
    )
  }

  return (
    <EquipmentReservationPanel
      occurrenceId={occurrenceId}
      classId={classId}
      userId={userId}
      onClose={() => navigate(-1)}
    />
  )
}
