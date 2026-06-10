import { useEffect, useMemo, useState } from 'react'
import { resolveCoachAvatarUrl } from '@/adapters/coachAdapter'

const AVATAR_COLORS = [
  { bg: 'var(--brand-wine-13)', text: '#7B1E2B' },
  { bg: 'rgba(194,107,122,0.18)', text: '#b05060' },
  { bg: 'rgba(154,123,107,0.18)', text: '#7A6560' },
  { bg: 'rgba(92,16,24,0.13)', text: '#5C1018' },
]

function getAvatarStyle(name) {
  const base = String(name ?? 'Coach').trim() || 'Coach'
  const idx = base.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

export default function CoachAvatar({
  name,
  avatarUrl,
  size = 36,
  className = '',
  style = {},
  objectPosition = 'center 15%',
}) {
  const resolvedAvatarUrl = useMemo(() => resolveCoachAvatarUrl(avatarUrl), [avatarUrl])
  const [hasError, setHasError] = useState(false)
  useEffect(() => {
    setHasError(false)
  }, [resolvedAvatarUrl])
  const initials = String(name ?? 'Coach')
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'C'
  const { bg, text } = getAvatarStyle(name)
  const showImage = Boolean(resolvedAvatarUrl && !hasError)

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        background: showImage ? 'transparent' : bg,
        color: text,
        fontWeight: 700,
        lineHeight: 1,
        ...style,
      }}
    >
      {showImage ? (
        <img
          src={resolvedAvatarUrl}
          alt={String(name ?? 'Coach')}
          onError={() => setHasError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition,
            display: 'block',
          }}
        />
      ) : (
        <span style={{ fontSize: Math.max(11, Math.round(size * 0.38)) }}>{initials}</span>
      )}
    </div>
  )
}
