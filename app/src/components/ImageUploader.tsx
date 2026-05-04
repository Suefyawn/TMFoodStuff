'use client'
import { useState, useRef, useCallback } from 'react'
import { Upload, X, ImageIcon, Loader2, Star } from 'lucide-react'

interface ImageUploaderProps {
  images: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
}

export default function ImageUploader({ images, onChange, maxImages = 6 }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/dashboard/upload', {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Upload failed')
      return null
    }
    return data.url as string
  }, [])

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setError('')

    const remaining = maxImages - images.length
    if (remaining <= 0) {
      setError(`Maximum ${maxImages} images allowed`)
      return
    }

    const toUpload = Array.from(files).slice(0, remaining)
    setUploading(true)

    const results = await Promise.all(toUpload.map(uploadFile))
    const newUrls = results.filter((u): u is string => u !== null)

    onChange([...images, ...newUrls])
    setUploading(false)
  }, [images, maxImages, onChange, uploadFile])

  const removeImage = useCallback(async (idx: number) => {
    const url = images[idx]
    const updated = images.filter((_, i) => i !== idx)
    onChange(updated)

    // Best-effort delete from storage
    if (url.includes('/product-images/')) {
      fetch('/api/dashboard/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      }).catch(() => {})
    }
  }, [images, onChange])

  const makePrimary = useCallback((idx: number) => {
    if (idx === 0) return
    const updated = [...images]
    const [item] = updated.splice(idx, 1)
    updated.unshift(item)
    onChange(updated)
  }, [images, onChange])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  return (
    <div className="space-y-3">
      {/* Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, idx) => (
            <div key={url + idx} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-800 border border-gray-700">
              <img
                src={url}
                alt={`Product image ${idx + 1}`}
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).src = '' }}
              />
              {idx === 0 && (
                <div className="absolute top-1.5 left-1.5 bg-green-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Star size={8} fill="currentColor" /> Primary
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                {idx !== 0 && (
                  <button
                    type="button"
                    onClick={() => makePrimary(idx)}
                    className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg hover:bg-green-500"
                    title="Set as primary"
                  >
                    Set Primary
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  title="Remove image"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}

          {/* Add more slot */}
          {images.length < maxImages && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-600 hover:border-green-500 flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-green-400 transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
              <span className="text-[10px] font-semibold">{uploading ? 'Uploading...' : 'Add more'}</span>
            </button>
          )}
        </div>
      )}

      {/* Drop zone (shown when no images or as add prompt) */}
      {images.length === 0 && (
        <div
          onDrop={onDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer transition-all ${
            dragOver
              ? 'border-green-500 bg-green-500/10'
              : 'border-gray-600 hover:border-green-500 hover:bg-green-500/5'
          }`}
        >
          {uploading ? (
            <Loader2 size={32} className="text-green-400 animate-spin" />
          ) : (
            <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center">
              <ImageIcon size={22} className="text-gray-400" />
            </div>
          )}
          <div className="text-center">
            <p className="text-sm font-bold text-gray-300">
              {uploading ? 'Uploading...' : 'Drop images here or click to browse'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              JPEG, PNG, WebP · Max 5 MB · Up to {maxImages} images
            </p>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
        // Reset so same file can be re-selected
        onClick={e => { (e.target as HTMLInputElement).value = '' }}
      />

      {error && (
        <p className="text-red-400 text-xs flex items-center gap-1.5">
          <X size={12} /> {error}
        </p>
      )}

      <p className="text-xs text-gray-600">
        First image is shown as the primary in the shop. Hover an image to set it as primary or remove it.
      </p>
    </div>
  )
}
