import styles from './Logo.module.css'

export const MARK_PATH = 'M6 0h16v40H0V25h7v8h8V7H6z M27 0h21v7H34v26h14v7H27z'

export function LogoMark({ size = 28, className = '', title }: { size?: number; className?: string; title?: string }) {
  const height = Math.round((size * 40) / 48)
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 48 40"
      className={`${styles.mark} ${className}`}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <path fill="currentColor" d={MARK_PATH} />
    </svg>
  )
}

export function Wordmark({ stacked = false, className = '' }: { stacked?: boolean; className?: string }) {
  return (
    <span className={`${styles.wordmark} ${stacked ? styles.stacked : ''} ${className}`}>
      <span>Jacinto</span>
      {stacked ? <br /> : ' '}
      <span>Construction</span>
    </span>
  )
}

export function Lockup({ size = 26, stacked = true, className = '', label }: { size?: number; stacked?: boolean; className?: string; label?: string }) {
  return (
    <span className={`${styles.lockup} ${className}`}>
      <LogoMark size={size} title={label} />
      <Wordmark stacked={stacked} />
    </span>
  )
}
