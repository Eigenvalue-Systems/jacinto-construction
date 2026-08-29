'use client'

import { useRef, useState, type DragEvent } from 'react'
import { useRouter } from 'next/navigation'
import { deleteImage, reorderImages, setCoverImage, updateImageDetails } from '@/app/admin/actions'
import type { ImageGroup, ImageUrls, ProjectImage } from '@/lib/data/types'
import { fmt } from '@/lib/i18n'
import { prepareImage } from '@/lib/images/client'

export type ManagedImage = ProjectImage & { urls: ImageUrls }

interface PhotoStrings {
  add: string
  dropHint: string
  uploading: string
  preparing: string
  converting: string
  done: string
  failed: string
  unreadable: string
  tooLarge: string
  setCover: string
  cover: string
  moveUp: string
  moveDown: string
  remove: string
  removeConfirm: string
  optional: string
  alt: string
  altHint: string
  caption: string
  captionHint: string
  group: string
  groups: { gallery: string; before: string; after: string }
  empty: string
  detailsSaved: string
  dragHint: string
}

interface Props {
  projectId: string
  projectName: string
  initialImages: ManagedImage[]
  initialCoverId: string | null
  strings: PhotoStrings
}

interface Progress {
  total: number
  done: number
  note: string
}

export function PhotoManager({ projectId, projectName, initialImages, initialCoverId, strings }: Props) {
  const [images, setImages] = useState(initialImages)
  const [coverId, setCoverId] = useState(initialCoverId)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [finished, setFinished] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const addFiles = async (list: FileList | File[]) => {
    const files = Array.from(list).filter((f) => f.type.startsWith('image/') || /\.(heic|heif|jpe?g|png|webp)$/i.test(f.name))
    if (files.length === 0) return
    setErrors([])
    setFinished(false)
    setProgress({ total: files.length, done: 0, note: strings.preparing })
    let done = 0
    let count = images.length
    for (const file of files) {
      setProgress({ total: files.length, done, note: strings.preparing })
      try {
        const prepared = await prepareImage(file, () => setProgress({ total: files.length, done, note: strings.converting }))
        const body = new FormData()
        body.set('kind', 'project')
        body.set('projectId', projectId)
        body.set('group', 'gallery')
        body.set('width', String(prepared.width))
        body.set('height', String(prepared.height))
        body.set('altText', `${projectName}, project photo ${count + 1}`)
        body.set('full', prepared.full, 'full.jpg')
        body.set('medium', prepared.medium, 'medium.jpg')
        body.set('thumb', prepared.thumb, 'thumb.jpg')
        const res = await fetch('/api/admin/upload', { method: 'POST', body })
        if (!res.ok) throw new Error('upload')
        const data = (await res.json()) as { image: ManagedImage; coverImageId: string | null }
        count += 1
        setImages((prev) => [...prev, data.image])
        if (data.coverImageId) setCoverId(data.coverImageId)
      } catch (err) {
        const code = err instanceof Error ? err.message : 'upload'
        const template = code === 'unreadable' ? strings.unreadable : code === 'too-large' ? strings.tooLarge : strings.failed
        setErrors((prev) => [...prev, fmt(template, { name: file.name })])
      }
      done += 1
      setProgress({ total: files.length, done, note: file.name })
    }
    setProgress(null)
    setFinished(true)
    router.refresh()
  }

  const persistOrder = async (next: ManagedImage[]) => {
    setImages(next)
    await reorderImages({ projectId, ids: next.map((i) => i.id) })
  }

  const move = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= images.length) return
    const next = [...images]
    ;[next[index], next[target]] = [next[target], next[index]]
    void persistOrder(next)
  }

  const onDropItem = (targetId: string) => {
    if (!dragId || dragId === targetId) return
    const from = images.findIndex((i) => i.id === dragId)
    const to = images.findIndex((i) => i.id === targetId)
    if (from === -1 || to === -1) return
    const next = [...images]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setDragId(null)
    setOverId(null)
    void persistOrder(next)
  }

  const saveDetails = async (image: ManagedImage, patch: Partial<Pick<ManagedImage, 'altText' | 'caption' | 'group'>>) => {
    const merged = { ...image, ...patch }
    setImages((prev) => prev.map((i) => (i.id === image.id ? merged : i)))
    await updateImageDetails({ id: image.id, altText: merged.altText, caption: merged.caption, group: merged.group })
    setSavedId(image.id)
    window.setTimeout(() => setSavedId((current) => (current === image.id ? null : current)), 1800)
  }

  const remove = async (image: ManagedImage) => {
    if (!window.confirm(strings.removeConfirm)) return
    setImages((prev) => prev.filter((i) => i.id !== image.id))
    await deleteImage({ id: image.id })
    router.refresh()
  }

  const makeCover = async (image: ManagedImage) => {
    setCoverId(image.id)
    await setCoverImage({ projectId, imageId: image.id })
    router.refresh()
  }

  const onDropZone = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length) void addFiles(e.dataTransfer.files)
  }

  return (
    <div className="admin-grid">
      <div
        className="photo-drop"
        data-over={dragOver ? 'true' : 'false'}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDropZone}
        role="button"
        tabIndex={0}
        aria-label={strings.add}
      >
        <span className="photo-drop-title">{strings.add}</span>
        <span className="photo-drop-hint">{strings.dropHint}</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) void addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {progress ? (
        <div className="photo-progress" role="status" aria-live="polite">
          <span style={{ fontSize: 14 }}>
            {fmt(strings.uploading, { done: Math.min(progress.done + 1, progress.total), total: progress.total })}
            <span className="muted"> · {progress.note}</span>
          </span>
          <div className="photo-progress-bar">
            <div className="photo-progress-fill" style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }} />
          </div>
        </div>
      ) : null}

      {finished && errors.length === 0 ? (
        <p className="admin-notice admin-notice-ok" role="status">
          {strings.done}
        </p>
      ) : null}
      {errors.map((message, i) => (
        <p key={i} className="admin-notice admin-notice-error" role="alert">
          {message}
        </p>
      ))}

      {images.length === 0 ? (
        <p className="field-hint">{strings.empty}</p>
      ) : (
        <ol className="photo-list">
          {images.map((image, index) => (
            <li
              key={image.id}
              className="photo-item"
              data-dragging={dragId === image.id ? 'true' : undefined}
              data-over={overId === image.id ? 'true' : undefined}
              draggable
              onDragStart={(e) => {
                setDragId(image.id)
                e.dataTransfer.effectAllowed = 'move'
              }}
              onDragOver={(e) => {
                e.preventDefault()
                if (overId !== image.id) setOverId(image.id)
              }}
              onDragLeave={() => setOverId((current) => (current === image.id ? null : current))}
              onDrop={(e) => {
                e.preventDefault()
                onDropItem(image.id)
              }}
              onDragEnd={() => {
                setDragId(null)
                setOverId(null)
              }}
            >
              <div className="photo-item-media">
                <img className="photo-item-img" src={image.urls.thumb} alt="" width={120} height={120} loading="lazy" />
                {coverId === image.id ? <span className="photo-cover-tag">{strings.cover}</span> : null}
              </div>
              <div className="photo-item-body">
                <div className="photo-item-actions">
                  <span className="photo-item-num" title={strings.dragHint}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <button type="button" className="icon-btn" onClick={() => move(index, -1)} disabled={index === 0} aria-label={strings.moveUp}>
                    ↑
                  </button>
                  <button type="button" className="icon-btn" onClick={() => move(index, 1)} disabled={index === images.length - 1} aria-label={strings.moveDown}>
                    ↓
                  </button>
                  {coverId !== image.id && image.group === 'gallery' ? (
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => void makeCover(image)}>
                      {strings.setCover}
                    </button>
                  ) : null}
                  <button type="button" className="btn btn-outline btn-danger btn-sm" onClick={() => void remove(image)}>
                    {strings.remove}
                  </button>
                  {savedId === image.id ? <span className="photo-saved">{strings.detailsSaved}</span> : null}
                </div>
                <details className="photo-details">
                  <summary className="photo-details-summary">{strings.optional}</summary>
                  <div className="admin-grid" style={{ marginTop: 12, gap: 10 }}>
                    <div className="field">
                      <label htmlFor={`alt-${image.id}`}>{strings.alt}</label>
                      <input
                        id={`alt-${image.id}`}
                        type="text"
                        defaultValue={image.altText}
                        maxLength={300}
                        onBlur={(e) => {
                          if (e.target.value !== image.altText) void saveDetails(image, { altText: e.target.value })
                        }}
                      />
                      <p className="field-hint">{strings.altHint}</p>
                    </div>
                    <div className="field">
                      <label htmlFor={`caption-${image.id}`}>{strings.caption}</label>
                      <input
                        id={`caption-${image.id}`}
                        type="text"
                        defaultValue={image.caption}
                        maxLength={300}
                        onBlur={(e) => {
                          if (e.target.value !== image.caption) void saveDetails(image, { caption: e.target.value })
                        }}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor={`group-${image.id}`}>{strings.group}</label>
                      <select id={`group-${image.id}`} value={image.group} onChange={(e) => void saveDetails(image, { group: e.target.value as ImageGroup })}>
                        <option value="gallery">{strings.groups.gallery}</option>
                        <option value="before">{strings.groups.before}</option>
                        <option value="after">{strings.groups.after}</option>
                      </select>
                    </div>
                  </div>
                </details>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
