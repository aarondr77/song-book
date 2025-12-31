'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SongUrlInput from './SongUrlInput'
import SongList from './SongList'
import { SongbookSong, Song } from '@/lib/types'

interface SongbookEditorProps {
  songbookId?: string
}

export default function SongbookEditor({ songbookId }: SongbookEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [songs, setSongs] = useState<SongbookSong[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (songbookId) {
      loadSongbook()
    }
  }, [songbookId])

  const loadSongbook = async () => {
    if (!songbookId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/songbooks/${songbookId}`)
      if (!response.ok) throw new Error('Failed to load songbook')

      const data = await response.json()
      setTitle(data.title)
      setDescription(data.description || '')
      setCoverImageUrl(data.cover_image_url || null)
      setCoverImagePreview(data.cover_image_url || null)
      setSongs(data.songs || [])
    } catch (err) {
      setError('Failed to load songbook')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSong = async (url: string) => {
    setLoading(true)
    setError(null)

    try {
      // Fetch the full song data
      const fetchResponse = await fetch('/api/songs/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ultimate_guitar_url: url,
          songbook_id: songbookId,
        }),
      })

      if (!fetchResponse.ok) {
        const errorData = await fetchResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to add song')
      }

      const song: Song = await fetchResponse.json()

      // If we have a songbook ID, the song was already added
      // Otherwise, add it locally
      if (!songbookId) {
        const newSongbookSong: SongbookSong = {
          songbook_id: '',
          song_id: song.id,
          position: songs.length,
          created_at: new Date().toISOString(),
          song,
        }
        setSongs([...songs, newSongbookSong])
      } else {
        // Reload to get the updated list
        await loadSongbook()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add song. Please try again.'
      setError(errorMessage)
      throw err // Re-throw so SongUrlInput can handle it
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveSong = async (songId: string) => {
    if (!songbookId) {
      // Just remove locally
      setSongs(songs.filter((s) => s.song_id !== songId))
      return
    }

    try {
      const response = await fetch(
        `/api/songbooks/${songbookId}/songs/${songId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) throw new Error('Failed to remove song')

      await loadSongbook()
    } catch (err) {
      setError('Failed to remove song')
      console.error(err)
    }
  }

  const handleReorder = async (
    reordered: { song_id: string; position: number }[]
  ) => {
    if (!songbookId) {
      // Update local state
      const updatedSongs = reordered.map((r) => {
        const song = songs.find((s) => s.song_id === r.song_id)
        return { ...song!, position: r.position }
      })
      setSongs(updatedSongs)
      return
    }

    try {
      const response = await fetch(`/api/songbooks/${songbookId}/songs`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ songs: reordered }),
      })

      if (!response.ok) throw new Error('Failed to reorder songs')

      await loadSongbook()
    } catch (err) {
      setError('Failed to reorder songs')
      console.error(err)
    }
  }

  const autoSave = async () => {
    if (!songbookId || !title.trim()) return

    try {
      await fetch(`/api/songbooks/${songbookId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description, cover_image_url: coverImageUrl }),
      })
    } catch (err) {
      console.error('Auto-save failed:', err)
    }
  }

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to upload image')
      }

      const data = await response.json()
      setCoverImageUrl(data.url)
      setCoverImagePreview(data.url)
      
      // Auto-save if in edit mode
      if (songbookId) {
        await autoSave()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image'
      setError(errorMessage)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB')
        return
      }

      // Show preview immediately
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload the file
      handleImageUpload(file)
    }
  }

  const handleRemoveImage = async () => {
    setCoverImageUrl(null)
    setCoverImagePreview(null)
    
    // Auto-save if in edit mode
    if (songbookId) {
      await autoSave()
    }
  }

  const handleUpdateSong = async (songId: string, text: string, videoUrl: string) => {
    try {
      const response = await fetch(`/api/songs/${songId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, video_url: videoUrl }),
      })

      if (!response.ok) {
        throw new Error('Failed to update song')
      }

      // Reload songbook to get updated data
      if (songbookId) {
        await loadSongbook()
      } else {
        // Update local state for new songbooks
        setSongs(prevSongs =>
          prevSongs.map(songbookSong => {
            if (songbookSong.song_id === songId) {
              return {
                ...songbookSong,
                song: {
                  ...songbookSong.song!,
                  text,
                  video_url: videoUrl,
                },
              }
            }
            return songbookSong
          })
        )
      }
    } catch (err) {
      console.error('Error updating song:', err)
      setError('Failed to update song')
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      let songbookIdToUse = songbookId

      // Create or update songbook
      if (songbookId) {
        const response = await fetch(`/api/songbooks/${songbookId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title, description, cover_image_url: coverImageUrl }),
        })

        if (!response.ok) throw new Error('Failed to update songbook')
      } else {
        const response = await fetch('/api/songbooks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title, description, cover_image_url: coverImageUrl }),
        })

        if (!response.ok) throw new Error('Failed to create songbook')

        const data = await response.json()
        songbookIdToUse = data.id

        // Add all songs to the new songbook
        for (const songbookSong of songs) {
          await fetch(`/api/songbooks/${songbookIdToUse}/songs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ song_id: songbookSong.song_id }),
          })
        }

        router.push(`/songbook/${songbookIdToUse}`)
        return
      }

      // Reload to show updated data
      if (songbookId) {
        await loadSongbook()
      }
    } catch (err) {
      setError('Failed to save songbook')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading && !songs.length) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        {songbookId ? 'Edit Songbook' : 'Create New Songbook'}
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Title *</label>
          <input
            type="text"
            value={title}
            onChange={async (e) => {
              setTitle(e.target.value)
              // Auto-save if in edit mode (debounced)
              if (songbookId) {
                clearTimeout((window as any).titleSaveTimeout)
                ;(window as any).titleSaveTimeout = setTimeout(() => {
                  autoSave()
                }, 1000)
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter songbook title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={description}
            onChange={async (e) => {
              setDescription(e.target.value)
              // Auto-save if in edit mode (debounced)
              if (songbookId) {
                clearTimeout((window as any).descriptionSaveTimeout)
                ;(window as any).descriptionSaveTimeout = setTimeout(() => {
                  autoSave()
                }, 1000)
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter songbook description (optional)"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Cover Image</label>
          {coverImagePreview ? (
            <div className="mb-4">
              <img
                src={coverImagePreview}
                alt="Cover preview"
                className="max-w-xs max-h-48 object-cover rounded-lg border border-gray-300 mb-2"
              />
              <div className="flex gap-2">
                <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                  {uploadingImage ? 'Uploading...' : 'Change Image'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Remove Image
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer inline-block">
                {uploadingImage ? 'Uploading...' : 'Upload Cover Image'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={uploadingImage}
                />
              </label>
              <p className="text-sm text-gray-500 mt-2">
                Upload an image to use as the cover for this songbook (max 5MB)
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Add Songs</h2>
        <SongUrlInput onAddSong={handleAddSong} />
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Songs ({songs.length})
        </h2>
        <SongList
          songs={songs}
          onRemove={handleRemoveSong}
          onReorder={handleReorder}
          onUpdateSong={handleUpdateSong}
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : songbookId ? 'Update Songbook' : 'Save Songbook'}
        </button>

        {songbookId && (
          <button
            onClick={() => router.push(`/songbook/${songbookId}`)}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            View Songbook
          </button>
        )}
      </div>
    </div>
  )
}

