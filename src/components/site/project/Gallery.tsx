'use client'

import { useRef, useState } from 'react'
import { Picture } from '@/components/site/Picture'
import { Reveal } from '@/components/site/Reveal'
import { Lightbox, type LightboxStrings } from '@/components/site/project/Lightbox'
import type { ImageUrls } from '@/lib/data/types'
import styles from './Gallery.module.css'

export interface GalleryImage {
  id: string
  urls: ImageUrls
  alt: string
  caption: string
  width: number
  height: number
}

type Row =
  | { kind: 'full'; items: [number] }
  | { kind: 'wide'; items: [number]; side: 'left' | 'right' }
  | { kind: 'pair'; items: [number, number] }
  | { kind: 'portrait'; items: [number]; side: 'left' | 'right' }

export function layoutRows(images: Array<{ width: number; height: number }>): Row[] {
  const rows: Row[] = []
  let side: 'left' | 'right' = 'right'
  let landscapeCount = 0
  let i = 0
  while (i < images.length) {
    const img = images[i]
    const portrait = img.height > img.width * 1.05
    if (portrait) {
      const nextImg = images[i + 1]
      if (nextImg && nextImg.height > nextImg.width * 1.05) {
        rows.push({ kind: 'pair', items: [i, i + 1] })
        i += 2
      } else {
        rows.push({ kind: 'portrait', items: [i], side })
        side = side === 'right' ? 'left' : 'right'
        i += 1
      }
    } else {
      if (landscapeCount % 2 === 0) rows.push({ kind: 'full', items: [i] })
      else {
        rows.push({ kind: 'wide', items: [i], side })
        side = side === 'right' ? 'left' : 'right'
      }
      landscapeCount += 1
      i += 1
    }
  }
  return rows
}

interface Props {
  images: GalleryImage[]
  strings: LightboxStrings
}

export function Gallery({ images, strings }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rows = layoutRows(images)

  const close = () => {
    const index = openIndex
    setOpenIndex(null)
    if (index === null) return
    requestAnimationFrame(() => {
      const link = containerRef.current?.querySelector<HTMLAnchorElement>(`a[data-index="${index}"]`)
      link?.focus()
    })
  }

  const figure = (index: number, sizes: string, extra = '') => {
    const img = images[index]
    return (
      <figure key={img.id} className={`${styles.figure} ${extra}`}>
        <a
          href={img.urls.full}
          className={`project-link ${styles.link}`}
          onClick={(e) => {
            e.preventDefault()
            setOpenIndex(index)
          }}
          aria-label={`${strings.open}: ${img.alt}`}
          data-index={index}
        >
          <span className={`project-image ${styles.image}`} style={{ aspectRatio: `${img.width} / ${img.height}` }}>
            <Picture urls={img.urls} alt={img.alt} width={img.width} height={img.height} sizes={sizes} />
          </span>
        </a>
        {img.caption ? <figcaption className={`eyebrow ${styles.caption}`}>{img.caption}</figcaption> : null}
      </figure>
    )
  }

  return (
    <>
      <div className={styles.gallery} ref={containerRef}>
        {rows.map((row, r) => {
          if (row.kind === 'full') {
            return (
              <Reveal key={r} className={`${styles.row} ${styles.full}`}>
                {figure(row.items[0], '(min-width: 1360px) 1240px, 100vw')}
              </Reveal>
            )
          }
          if (row.kind === 'wide') {
            return (
              <Reveal key={r} className={`${styles.row} ${styles.wide} ${row.side === 'left' ? styles.left : styles.right}`}>
                {figure(row.items[0], '(min-width: 1360px) 820px, (min-width: 860px) 66vw, 100vw')}
              </Reveal>
            )
          }
          if (row.kind === 'pair') {
            return (
              <Reveal key={r} className={`${styles.row} ${styles.pair}`}>
                {figure(row.items[0], '(min-width: 860px) 50vw, 100vw')}
                {figure(row.items[1], '(min-width: 860px) 50vw, 100vw', styles.pairSecond)}
              </Reveal>
            )
          }
          return (
            <Reveal key={r} className={`${styles.row} ${styles.portrait} ${row.side === 'left' ? styles.left : styles.right}`}>
              {figure(row.items[0], '(min-width: 1360px) 600px, (min-width: 860px) 45vw, 100vw')}
            </Reveal>
          )
        })}
      </div>
      {openIndex !== null ? <Lightbox images={images} index={openIndex} strings={strings} onClose={close} onNavigate={setOpenIndex} /> : null}
    </>
  )
}
