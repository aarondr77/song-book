'use client'

import { useState } from 'react'
import { SongbookSong } from '@/lib/types'

interface SongListProps {
  songs: SongbookSong[]
  onRemove: (songId: string) => void
  onReorder: (songs: { song_id: string; position: number }[]) => void
}

export default function SongList({ songs, onRemove, onReorder }: SongListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null) return

    if (draggedIndex !== index) {
      const newSongs = [...songs]
      const draggedSong = newSongs[draggedIndex]
      newSongs.splice(draggedIndex, 1)
      newSongs.splice(index, 0, draggedSong)
      
      const reordered = newSongs.map((song, idx) => ({
        song_id: song.song_id,
        position: idx,
      }))
      
      onReorder(reordered)
      setDraggedIndex(index)
    }
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
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
      {songs.map((songbookSong, index) => (
        <div
          key={songbookSong.song_id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          className={`p-4 border border-gray-200 rounded-lg flex items-center justify-between ${
            draggedIndex === index ? 'opacity-50' : 'hover:bg-gray-50'
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
          <button
            onClick={() => onRemove(songbookSong.song_id)}
            className="ml-4 px-3 py-1 text-red-600 hover:bg-red-50 rounded"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  )
}

