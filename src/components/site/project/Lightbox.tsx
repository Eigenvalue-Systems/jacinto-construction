'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { fmt } from '@/lib/i18n'
import type { GalleryImage } from './Gallery'
import styles from './Lightbox.module.css'

export interface LightboxStrings {
  close: string
  previous: string
  next: string
  counter: string
  label: string
  open: string
}

interface Props {
  images: GalleryImage[]
  index: number
  strings: LightboxStrings
  onClose: () => void
  onNavigate: (index: number) => void
}

const SWIPE_THRESHOLD = 48

export function Lightbox({ images, index, strings, onClose, onNavigate }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const startX = useRef<number | null>(null)
  const startY = useRef<number | null>(null)
  const [loaded, setLoaded] = useState(false)
  const count = images.length
  const current = images[index]
  const hasPrev = index > 0
  const hasNext = index < count - 1

  const go = useCallback(
    (delta: number) => {
      const target = index + delta
      if (target < 0 || target >= count) return
      setLoaded(false)
      onNavigate(target)
    },
    [index, count, onNavigate],
  )

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    document.documentElement.classList.add('lightbox-open')
    closeRef.current?.focus()
    return () => {
      document.documentElement.classList.remove('lightbox-open')
      if (dialog.open) dialog.close()
    }
  }, [])

  useEffect(() => {
    for (const offset of [1, -1]) {
      const neighbor = images[index + offset]
      if (neighbor) {
        const img = new Image()
        img.src = neighbor.urls.full
      }
    }
  }, [index, images])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go])

  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX
    startY.current = e.clientY
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (startX.current === null || startY.current === null) return
    const dx = e.clientX - startX.current
    const dy = e.clientY - startY.current
    startX.current = null
    startY.current = null
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1)
  }

  if (!current) return null

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label={strings.label}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose()
      }}
    >
      <div className={styles.frame}>
        <div className={styles.bar}>
          <p className={`mono ${styles.counter}`} aria-live="polite">
            {fmt(strings.counter, { i: index + 1, n: count })}
          </p>
          <button ref={closeRef} type="button" className={styles.close} onClick={onClose}>
            {strings.close}
            <span aria-hidden="true" className={styles.closeX}>
              ×
            </span>
          </button>
        </div>

        <div className={styles.stage} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => (startX.current = null)}>
          <img
            key={current.id}
            className={`${styles.image} ${loaded ? styles.loaded : ''}`}
            src={current.urls.full}
            alt={current.alt}
            width={current.width}
            height={current.height}
            draggable={false}
            onLoad={() => setLoaded(true)}
          />
        </div>

        <div className={styles.foot}>
          <p className={`eyebrow ${styles.caption}`}>{current.caption}</p>
          <div className={styles.navButtons}>
            <button type="button" className={styles.navBtn} onClick={() => go(-1)} disabled={!hasPrev} aria-label={strings.previous}>
              ←
            </button>
            <button type="button" className={styles.navBtn} onClick={() => go(1)} disabled={!hasNext} aria-label={strings.next}>
              →
            </button>
          </div>
        </div>
      </div>
    </dialog>
  )
}
