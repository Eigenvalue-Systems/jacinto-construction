import type { CSSProperties } from 'react'
import type { ImageUrls } from '@/lib/data/types'

interface Props {
  urls: ImageUrls
  alt: string
  width: number
  height: number
  sizes?: string
  priority?: boolean
  className?: string
  style?: CSSProperties
  draggable?: boolean
}

export function Picture({ urls, alt, width, height, sizes = '100vw', priority = false, className, style, draggable }: Props) {
  const isVector = urls.full.endsWith('.svg')
  const srcSet = isVector ? undefined : `${urls.thumb} 480w, ${urls.medium} 1200w, ${urls.full} 2400w`
  return (
    <img
      src={isVector ? urls.full : urls.medium}
      srcSet={srcSet}
      sizes={isVector ? undefined : sizes}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : undefined}
      className={className}
      style={style}
      draggable={draggable}
    />
  )
}
