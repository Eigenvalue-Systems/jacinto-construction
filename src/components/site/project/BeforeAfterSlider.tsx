'use client'

import { useId, useState } from 'react'
import type { ImageUrls } from '@/lib/data/types'
import styles from './BeforeAfterSlider.module.css'

interface SliderImage {
  urls: ImageUrls
  alt: string
  width: number
  height: number
}

interface Props {
  before: SliderImage
  after: SliderImage
  beforeLabel: string
  afterLabel: string
  hint: string
  projectName: string
}

export function BeforeAfterSlider({ before, after, beforeLabel, afterLabel, hint, projectName }: Props) {
  const [position, setPosition] = useState(50)
  const id = useId()

  return (
    <figure className={styles.figure}>
      <div className={styles.stage} style={{ aspectRatio: `${after.width} / ${after.height}` }}>
        <img
          className={styles.image}
          src={before.urls.medium}
          srcSet={before.urls.full.endsWith('.svg') ? undefined : `${before.urls.medium} 1200w, ${before.urls.full} 2400w`}
          sizes="(min-width: 1280px) 1180px, 100vw"
          alt={`${beforeLabel}: ${before.alt || projectName}`}
          width={before.width}
          height={before.height}
          loading="lazy"
          decoding="async"
        />
        <div className={styles.afterClip} style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
          <img
            className={styles.image}
            src={after.urls.medium}
            srcSet={after.urls.full.endsWith('.svg') ? undefined : `${after.urls.medium} 1200w, ${after.urls.full} 2400w`}
            sizes="(min-width: 1280px) 1180px, 100vw"
            alt={`${afterLabel}: ${after.alt || projectName}`}
            width={after.width}
            height={after.height}
            loading="lazy"
            decoding="async"
          />
        </div>

        <span className={`${styles.badge} ${styles.badgeBefore}`}>{beforeLabel}</span>
        <span className={`${styles.badge} ${styles.badgeAfter}`}>{afterLabel}</span>

        <div className={styles.divider} style={{ left: `${position}%` }} aria-hidden="true">
          <span className={styles.handle}>↔</span>
        </div>

        <label className={styles.srOnly} htmlFor={id}>
          {beforeLabel} / {afterLabel}: {projectName}
        </label>
        <input
          id={id}
          className={styles.range}
          type="range"
          min="0"
          max="100"
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          aria-valuetext={`${position}% ${afterLabel}`}
        />
      </div>
      <figcaption className={styles.caption}>
        <span>{beforeLabel}</span>
        <span className={styles.hint}>{hint}</span>
        <span>{afterLabel}</span>
      </figcaption>
    </figure>
  )
}
