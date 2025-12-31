'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SongbookSong } from '@/lib/types'
import PrintView from '@/components/PrintView'
import LoadingScreen from '@/components/LoadingScreen'
import ReactMarkdown from 'react-markdown'

export default function SongbookViewPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [songbook, setSongbook] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPrintView, setShowPrintView] = useState(false)
  const [editingSongId, setEditingSongId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [uploadingVideo, setUploadingVideo] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadSongbook()
  }, [id])

  const loadSongbook = async () => {
    try {
      const response = await fetch(`/api/songbooks/${id}`)
      if (!response.ok) throw new Error('Failed to load songbook')

      const data = await response.json()
      setSongbook(data)
    } catch (err) {
      setError('Failed to load songbook')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    setShowPrintView(true)
    setTimeout(() => {
      window.print()
      setShowPrintView(false)
    }, 100)
  }

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copied to clipboard!')
    })
  }

  const handleStartEdit = (songId: string, currentText: string) => {
    setEditingSongId(songId)
    setEditingText(prev => ({
      ...prev,
      [songId]: currentText || ''
    }))
  }

  const handleCancelEdit = (songId: string) => {
    setEditingSongId(null)
    setEditingText(prev => {
      const newState = { ...prev }
      delete newState[songId]
      return newState
    })
  }

  const handleSaveText = async (songId: string) => {
    // Find the song by matching the songId (which is song.id)
    const songbookSong = songbook.songs?.find((s: SongbookSong) => 
      s.song?.id === songId || s.song_id === songId
    )

    if (!songbookSong?.song?.id) {
      alert('Cannot save: Song ID not found')
      return
    }

    setSaving(prev => ({ ...prev, [songId]: true }))
    
    try {
      const text = editingText[songId] || ''
      const currentVideoUrl = songbookSong.song?.video_url || ''

      const response = await fetch(`/api/songs/${songbookSong.song.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, video_url: currentVideoUrl }),
      })

      if (!response.ok) {
        throw new Error('Failed to update song')
      }

      // Clear editing state before reload
      setEditingSongId(null)
      setEditingText(prev => {
        const newState = { ...prev }
        delete newState[songId]
        return newState
      })

      // Reload songbook to get updated data
      await loadSongbook()
    } catch (err) {
      console.error('Error updating song:', err)
      alert('Failed to save changes. Please try again.')
    } finally {
      setSaving(prev => ({ ...prev, [songId]: false }))
    }
  }

  const handleVideoUpload = async (songId: string, file: File) => {
    // Find the song to get the actual song ID
    const songbookSong = songbook.songs?.find((s: SongbookSong) => 
      s.song?.id === songId || s.song_id === songId
    )

    // Get the actual song ID for the API call
    const actualSongId = songbookSong?.song?.id || songbookSong?.song_id

    if (!songbookSong || !actualSongId) {
      alert('Cannot upload video: Song ID not found')
      return
    }

    setUploadingVideo(prev => ({ ...prev, [songId]: true }))

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/video', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to upload video')
      }

      const data = await response.json()
      const text = editingText[songId] || songbookSong.song?.text || ''
      
      // Update the song with the new video URL using the actual song ID
      const updateResponse = await fetch(`/api/songs/${actualSongId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, video_url: data.url }),
      })

      if (!updateResponse.ok) {
        throw new Error('Failed to update song with video URL')
      }

      // Reload songbook to get updated data
      await loadSongbook()
    } catch (err) {
      console.error('Error uploading video:', err)
      alert(err instanceof Error ? err.message : 'Failed to upload video')
    } finally {
      setUploadingVideo(prev => ({ ...prev, [songId]: false }))
    }
  }

  const handleVideoChange = (songId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validVideoTypes = ['video/mp4', 'video/mov', 'video/quicktime', 'video/webm', 'video/x-msvideo']
      if (!validVideoTypes.includes(file.type)) {
        alert('Please select a video file (mp4, mov, webm, avi)')
        return
      }

      // Validate file size (1GB)
      if (file.size > 1024 * 1024 * 1024) {
        alert('Video size must be less than 1GB')
        return
      }

      handleVideoUpload(songId, file)
    }
  }

  const handleRemoveVideo = async (songId: string) => {
    const songbookSong = songbook.songs?.find((s: SongbookSong) => 
      s.song?.id === songId || s.song_id === songId
    )

    // Get the actual song ID for the API call
    const actualSongId = songbookSong?.song?.id || songbookSong?.song_id

    if (!songbookSong || !actualSongId) {
      alert('Cannot remove video: Song ID not found')
      return
    }

    try {
      const text = editingText[songId] || songbookSong.song?.text || ''
      
      const response = await fetch(`/api/songs/${actualSongId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, video_url: '' }),
      })

      if (!response.ok) {
        throw new Error('Failed to remove video')
      }

      await loadSongbook()
    } catch (err) {
      console.error('Error removing video:', err)
      alert('Failed to remove video. Please try again.')
    }
  }

  if (loading) {
    return <LoadingScreen />
  }

  if (error || !songbook) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error || 'Songbook not found'}</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
        >
          Go Home
        </button>
      </div>
    )
  }

  if (showPrintView) {
    return <PrintView songbook={songbook} />
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="flex flex-col lg:flex-row">
        {/* Left Sidebar with Cover */}
        <aside className="lg:w-64 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto bg-gray-50 border-r border-gray-200 flex-shrink-0">
          <div className="p-6">
            {/* Home Button */}
            <button
              onClick={() => router.push('/')}
              className="mb-6 w-full px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm"
            >
              ← Home
            </button>

            {/* Cover Image */}
            {songbook.cover_image_url ? (
              <div className="mb-6">
                <img
                  src={songbook.cover_image_url}
                  alt={`${songbook.title} cover`}
                  className="w-full rounded-lg shadow-lg border border-gray-300"
                />
              </div>
            ) : (
              <div className="mb-6 w-full aspect-square rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-lg" />
            )}

            {/* Songbook Info */}
            <div className="mb-6">
              <h1 className="text-xl font-bold mb-2">{songbook.title}</h1>
              {songbook.description && (
                <p className="text-sm text-gray-600 mb-4">{songbook.description}</p>
              )}
              <p className="text-xs text-gray-500">
                Created {new Date(songbook.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* Action Buttons - Minimal Styling */}
            <div className="space-y-2">
              <button
                onClick={handleShare}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm"
              >
                Share Link
              </button>
              <button
                onClick={handlePrint}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm"
              >
                Print
              </button>
              <button
                onClick={() => router.push(`/songbook/${id}/edit`)}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm"
              >
                Edit
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content - Blog Style */}
        <main className="flex-1 max-w-3xl mx-auto px-6 py-12 lg:px-16">
          {/* Blog Post Style Content */}
          <div className="space-y-16">
            {songbook.songs?.map((songbookSong: SongbookSong, index: number) => {
              // Use song.id as the primary identifier (it's the actual song UUID)
              const songId = songbookSong.song?.id || songbookSong.song_id
              if (!songId) return null // Skip if no valid ID
              
              const isEditing = editingSongId === songId
              const isLastSong = index === (songbook.songs?.length || 0) - 1
              
              return (
                <article key={songId} className="prose prose-lg max-w-none">
                {/* Song Title as Header */}
                <header className="mb-6">
                  <div className="flex items-baseline gap-4 mb-2">
                    <h1 className="text-4xl font-bold text-gray-900 m-0">
                      {songbookSong.song?.title || 'Untitled Song'}
                    </h1>
                    {songbookSong.song?.ultimate_guitar_url && (
                      <a
                        href={songbookSong.song.ultimate_guitar_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-500 hover:text-gray-700 underline whitespace-nowrap"
                      >
                        View on Ultimate Guitar →
                      </a>
                    )}
                  </div>
                  <p className="text-xl text-gray-600 m-0">
                    {songbookSong.song?.artist || 'Unknown Artist'}
                  </p>
                </header>

                {/* Markdown Text Content */}
                <div className="mb-8">
                  {isEditing ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <textarea
                        key={`textarea-${songId}`}
                        value={editingText[songId] ?? ''}
                        onChange={(e) => {
                          const newValue = e.target.value
                          setEditingText(prev => ({
                            ...prev,
                            [songId]: newValue
                          }))
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 font-mono text-sm"
                        placeholder="Write your story about this song in Markdown..."
                        rows={12}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveText(songId)}
                          disabled={saving[songId]}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
                        >
                          {saving[songId] ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => handleCancelEdit(songId)}
                          disabled={saving[songId]}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="relative group">
                      {songbookSong.song?.text ? (
                        <div className="text-gray-700 leading-relaxed prose prose-lg max-w-none">
                          <ReactMarkdown>
                            {songbookSong.song.text}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="text-gray-400 italic py-4">
                          No story written yet. Click Edit to add one.
                        </div>
                      )}
                      <button
                        onClick={() => handleStartEdit(songId, songbookSong.song?.text || '')}
                        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-50 bg-white"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>

                {/* Video Player */}
                <div className="mb-8">
                  {songbookSong.song?.video_url ? (
                    <div>
                      <video
                        src={songbookSong.song.video_url}
                        controls
                        className="w-full rounded-lg shadow-sm"
                        style={{ maxHeight: '600px' }}
                      >
                        Your browser does not support the video tag.
                      </video>
                      <div className="mt-2 flex gap-2">
                        <label className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 cursor-pointer text-sm">
                          {uploadingVideo[songId] ? 'Uploading...' : 'Replace Video'}
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => handleVideoChange(songId, e)}
                            className="hidden"
                            disabled={uploadingVideo[songId]}
                          />
                        </label>
                        <button
                          onClick={() => handleRemoveVideo(songId)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm"
                        >
                          Remove Video
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 cursor-pointer inline-block text-sm">
                        {uploadingVideo[songId] ? 'Uploading...' : 'Upload Video'}
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => handleVideoChange(songId, e)}
                          className="hidden"
                          disabled={uploadingVideo[songId]}
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        Upload a video of you playing this song (max 2GB)
                      </p>
                    </div>
                  )}
                </div>

                {/* Divider between songs */}
                {!isLastSong && (
                  <hr className="border-gray-200 my-16" />
                )}
                </article>
              )
            })}
          </div>
        </main>
      </div>
    </div>
  )
}

