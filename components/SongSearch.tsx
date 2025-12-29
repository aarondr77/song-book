'use client'

import { useState } from 'react'
import { UltimateGuitarSearchResult } from '@/lib/types'

interface SongSearchProps {
  onSelectSong: (song: UltimateGuitarSearchResult) => void
}

export default function SongSearch({ onSelectSong }: SongSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UltimateGuitarSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/songs/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        throw new Error('Failed to search songs')
      }

      const data = await response.json()
      setResults(data.results || [])
    } catch (err) {
      setError('Failed to search songs. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a song..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {results.map((song) => (
            <div
              key={song.id}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => onSelectSong(song)}
            >
              <div className="font-semibold">{song.song_name}</div>
              <div className="text-sm text-gray-600">{song.artist_name}</div>
              <div className="text-xs text-gray-400 mt-1">{song.type}</div>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && !loading && query && (
        <div className="text-center text-gray-500 py-4">
          No results found
        </div>
      )}
    </div>
  )
}

