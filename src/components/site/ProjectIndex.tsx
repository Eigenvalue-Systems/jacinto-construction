'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Picture } from '@/components/site/Picture'
import type { ImageUrls } from '@/lib/data/types'
import styles from './ProjectIndex.module.css'

export interface IndexItem {
  id: string
  number: string
  name: string
  href: string
  location: string
  category: string
  isDemo: boolean
  image: { urls: ImageUrls; alt: string; width: number; height: number } | null
}

interface Props {
  items: IndexItem[]
  sampleLabel: string
  viewLabel: string
}

export function ProjectIndex({ items, sampleLabel, viewLabel }: Props) {
  const [active, setActive] = useState(0)
  const [layers, setLayers] = useState<Array<{ key: number; index: number }>>([{ key: 0, index: 0 }])
  const activeIndex = Math.min(active, Math.max(items.length - 1, 0))

  const activate = (index: number) => {
    if (index === activeIndex) return
    setActive(index)
    setLayers((prev) => {
      const last = prev[prev.length - 1]
      return [...prev.slice(-1), { key: (last?.key ?? 0) + 1, index }]
    })
  }

  useEffect(() => {
    for (const offset of [1, -1, 2]) {
      const neighbor = items[activeIndex + offset]
      if (neighbor?.image) {
        const img = new Image()
        img.src = neighbor.image.urls.medium
      }
    }
  }, [activeIndex, items])

  return (
    <div className={styles.index}>
      <ol className={styles.list}>
        {items.map((item, i) => (
          <li key={item.id} className={styles.item}>
            <Link
              href={item.href}
              className={`project-link ${styles.row}`}
              onMouseEnter={() => activate(i)}
              onFocus={() => activate(i)}
              data-active={activeIndex === i ? 'true' : undefined}
            >
              {item.image ? (
                <span className={`project-image ${styles.rowImage}`} style={{ aspectRatio: `${item.image.width} / ${item.image.height}` }}>
                  <Picture urls={item.image.urls} alt={item.image.alt} width={item.image.width} height={item.image.height} sizes="(min-width: 1024px) 1px, 100vw" />
                </span>
              ) : null}
              <span className={styles.rowBody}>
                <span className={`mono ${styles.num}`}>{item.number}</span>
                <span className={styles.name}>
                  {item.name}
                  {item.isDemo ? <span className={`mono ${styles.sample}`}>{sampleLabel}</span> : null}
                </span>
                <span className={`mono ${styles.location}`}>{item.location}</span>
                <span className={`mono ${styles.category}`}>{item.category}</span>
                <span className={`mono ${styles.view}`} aria-hidden="true">
                  {viewLabel} →
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <div className={styles.preview} aria-hidden="true">
        <div className={styles.previewFrame}>
          {layers.map((layer) => {
            const item = items[layer.index]
            if (!item?.image) return null
            return (
              <img
                key={layer.key}
                className={styles.previewImage}
                src={item.image.urls.medium}
                srcSet={item.image.urls.full.endsWith('.svg') ? undefined : `${item.image.urls.medium} 1200w, ${item.image.urls.full} 2400w`}
                sizes="40vw"
                alt=""
                width={item.image.width}
                height={item.image.height}
                decoding="async"
              />
            )
          })}
        </div>
        <p className={`mono ${styles.previewMeta}`}>
          {items[activeIndex]?.number} <span aria-hidden="true">/</span> {items[activeIndex]?.name}
        </p>
      </div>
    </div>
  )
}
