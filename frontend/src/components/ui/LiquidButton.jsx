import styles from './LiquidButton.module.css'

export default function LiquidButton({ children, onClick }) {
  return (
    <button className={styles.liquidBtn} onClick={onClick}>
      <div className={styles.glassLayer} />
      <div
        className={styles.backdropLayer}
        style={{ backdropFilter: 'url("#liquid-glass-filter")' }}
      />
      <span className={styles.content}>{children}</span>
      <GlassFilter />
    </button>
  )
}

function GlassFilter() {
  return (
    <svg className={styles.hiddenSvg}>
      <defs>
        <filter
          id="liquid-glass-filter"
          x="0%" y="0%" width="100%" height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves="1" seed="1" result="turbulence" />
          <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
          <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="70" xChannelSelector="R" yChannelSelector="B" result="displaced" />
          <feGaussianBlur in="displaced" stdDeviation="4" result="finalBlur" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  )
}
