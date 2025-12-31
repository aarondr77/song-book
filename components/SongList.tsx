'use client'

import { useState } from 'react'
import { SongbookSong } from '@/lib/types'

interface SongListProps {
  songs: SongbookSong[]
  onRemove: (songId: string) => void
  onReorder: (songs: { song_id: string; position: number }[]) => void
  onUpdateSong?: (songId: string, text: string, videoUrl: string) => void
}

export default function SongList({ songs, onRemove, onReorder, onUpdateSong }: SongListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [expandedSongs, setExpandedSongs] = useState<Set<string>>(new Set())
  const [editingText, setEditingText] = useState<Record<string, string>>({})
  const [uploadingVideo, setUploadingVideo] = useState<Record<string, boolean>>({})

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null) return

    if (draggedIndex === null) return

    if (draggedIndex !== index) {
      const newSongs = [...songs]
      const draggedSong = newSongs[draggedIndex]
      newSongs.splice(draggedIndex, 1)
      newSongs.splice(index, 0, draggedSong)
      
      // Filter out any songs without a valid song_id and create reordered array
      const reordered = newSongs
        .filter((song) => song.song_id != null && song.song_id !== '')
        .map((song, idx) => ({
          song_id: song.song_id,
          position: idx,
        }))
      
      // Only call onReorder if we have valid songs
      if (reordered.length > 0) {
        onReorder(reordered)
      }
      setDraggedIndex(index)
    }
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const toggleExpand = (songId: string) => {
    const newExpanded = new Set(expandedSongs)
    if (newExpanded.has(songId)) {
      newExpanded.delete(songId)
    } else {
      newExpanded.add(songId)
      // Initialize editing text with current value
      const song = songs.find(s => s.song_id === songId)
      if (song && !editingText[songId]) {
        setEditingText(prev => ({
          ...prev,
          [songId]: song.song?.text || ''
        }))
      }
    }
    setExpandedSongs(newExpanded)
  }

  const handleTextChange = (songId: string, text: string) => {
    setEditingText(prev => ({
      ...prev,
      [songId]: text
    }))
  }

  const handleSaveText = async (songId: string) => {
    if (!onUpdateSong) return
    
    const text = editingText[songId] || ''
    const song = songs.find(s => s.song_id === songId)
    const currentVideoUrl = song?.song?.video_url || ''
    
    await onUpdateSong(songId, text, currentVideoUrl)
  }

  const handleVideoUpload = async (songId: string, file: File) => {
    if (!onUpdateSong) return

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
      const text = editingText[songId] || songs.find(s => s.song_id === songId)?.song?.text || ''
      
      await onUpdateSong(songId, text, data.url)
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

  if (songs.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No songs added yet. Search and add songs to get started.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {songs.map((songbookSong, index) => {
        const isExpanded = expandedSongs.has(songbookSong.song_id)
        const songText = editingText[songbookSong.song_id] ?? songbookSong.song?.text ?? ''
        const isUploading = uploadingVideo[songbookSong.song_id] || false

        return (
          <div
            key={songbookSong.song_id}
            className={`border border-gray-200 rounded-lg ${
              draggedIndex === index ? 'opacity-50' : ''
            }`}
          >
            <div
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`p-4 flex items-center justify-between ${
                draggedIndex === index ? '' : 'hover:bg-gray-50'
              } cursor-move`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="text-gray-400 text-sm">⋮⋮</div>
                <div className="flex-1">
                  <div className="font-semibold">
                    {songbookSong.song?.title || 'Loading...'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {songbookSong.song?.artist || ''}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleExpand(songbookSong.song_id)}
                  className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-sm"
                >
                  {isExpanded ? 'Collapse' : 'Edit'}
                </button>
                <button
                  onClick={() => onRemove(songbookSong.song_id)}
                  className="px-3 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                >
                  Remove
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-4">
                {/* Text Editor */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Story / Notes (Markdown supported)
                  </label>
                  <textarea
                    value={songText}
                    onChange={(e) => handleTextChange(songbookSong.song_id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Write about your experiences playing this song together..."
                    rows={6}
                  />
                  <button
                    onClick={() => handleSaveText(songbookSong.song_id)}
                    className="mt-2 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 text-sm"
                  >
                    Save Text
                  </button>
                </div>

                {/* Video Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Video
                  </label>
                  {songbookSong.song?.video_url ? (
                    <div className="mb-2">
                      <video
                        src={songbookSong.song.video_url}
                        controls
                        className="w-full max-w-md rounded-lg"
                        style={{ maxHeight: '300px' }}
                      >
                        Your browser does not support the video tag.
                      </video>
                      <div className="mt-2 flex gap-2">
                        <label className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 cursor-pointer text-sm">
                          {isUploading ? 'Uploading...' : 'Replace Video'}
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => handleVideoChange(songbookSong.song_id, e)}
                            className="hidden"
                            disabled={isUploading}
                          />
                        </label>
                        <button
                          onClick={async () => {
                            if (onUpdateSong) {
                              const text = editingText[songbookSong.song_id] || songbookSong.song?.text || ''
                              await onUpdateSong(songbookSong.song_id, text, '')
                            }
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 text-sm"
                        >
                          Remove Video
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 cursor-pointer inline-block text-sm">
                        {isUploading ? 'Uploading...' : 'Upload Video'}
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => handleVideoChange(songbookSong.song_id, e)}
                          className="hidden"
                          disabled={isUploading}
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        Upload a video of you playing this song (max 2GB)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

