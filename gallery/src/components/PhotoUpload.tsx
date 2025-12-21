'use client'
import { useState } from 'react'

interface PhotoUploadProps {
  albumId: string
  onUploadComplete: () => void
  onClose: () => void
}

export function PhotoUpload({ albumId, onUploadComplete, onClose }: PhotoUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    const selectedFiles = Array.from(e.target.files)

    // Filter for image files only
    const imageFiles = selectedFiles.filter(f =>
      f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024 // 10MB limit
    )

    if (imageFiles.length < selectedFiles.length) {
      setError('Some files were skipped (only images under 10MB are supported)')
    }

    // Limit to 10 photos
    const limitedFiles = imageFiles.slice(0, 10)
    setFiles(limitedFiles)
    setError('')
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    setError('')

    const basePath = typeof window !== 'undefined' ? window.location.pathname.split('/a/')[0] : ''

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadProgress(prev => ({ ...prev, [file.name]: 'Preparing...' }))

        // 1. Request upload URL
        const urlRes = await fetch(`${basePath}/api/albums/${albumId}/user-upload-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'image',
            filename: file.name
          })
        })

        if (!urlRes.ok) {
          const errorData = await urlRes.json()
          throw new Error(errorData.error || 'Failed to get upload URL')
        }

        const urlData = await urlRes.json()

        setUploadProgress(prev => ({ ...prev, [file.name]: 'Uploading...' }))

        // 2. Upload to Cloudflare
        await fetch(urlData.upload_url, {
          method: 'POST',
          body: file
        })

        setUploadProgress(prev => ({ ...prev, [file.name]: 'Saving...' }))

        // 3. Confirm upload
        const confirmRes = await fetch(`${basePath}/api/assets/user-confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            album_id: albumId,
            provider_id: urlData.provider_id,
            type: 'image',
            original_filename: file.name
          })
        })

        if (!confirmRes.ok) {
          throw new Error('Failed to confirm upload')
        }

        setUploadProgress(prev => ({ ...prev, [file.name]: '✓ Done!' }))
      }

      // Success!
      setTimeout(() => {
        onUploadComplete()
        onClose()
      }, 1000)

    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Upload failed. Please try again.')
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-gray-900">Add Your Photos</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
              ×
            </button>
          </div>
          <p className="text-gray-600">
            Share your view of the evening - your perspective matters!
          </p>
        </div>

        {/* Upload Area */}
        <div className="mb-6">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            id="photo-upload-input"
            className="hidden"
            disabled={uploading}
          />
          <label
            htmlFor="photo-upload-input"
            className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition
              ${uploading ? 'border-gray-300 bg-gray-50 cursor-not-allowed' : 'border-purple-300 hover:border-purple-500 hover:bg-purple-50'}
            `}
          >
            {files.length === 0 ? (
              <>
                <div className="text-4xl mb-4">📸</div>
                <p className="text-gray-700 font-medium mb-2">Choose photos from your device</p>
                <p className="text-sm text-gray-500">Up to 10 photos · JPG, PNG · Max 10MB each</p>
              </>
            ) : (
              <div className="text-left">
                <p className="font-medium text-gray-900 mb-3">{files.length} photo{files.length > 1 ? 's' : ''} selected</p>
                <div className="space-y-2">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm bg-gray-100 rounded px-3 py-2">
                      <span className="truncate flex-1">{file.name}</span>
                      <span className="ml-2 text-gray-500">{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                      {uploadProgress[file.name] && (
                        <span className="ml-2 text-purple-600 font-medium">{uploadProgress[file.name]}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Privacy Note */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
          <p className="flex items-start gap-2">
            <span>ℹ️</span>
            <span>Photos are visible to all event attendees. Please respect others' privacy and only share appropriate images.</span>
          </p>
        </div>

        {/* Actions */}
        {files.length > 0 && (
          <div className="flex gap-3">
            <button
              onClick={() => { setFiles([]); setUploadProgress({}); setError('') }}
              disabled={uploading}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : `Upload ${files.length} Photo${files.length > 1 ? 's' : ''}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
