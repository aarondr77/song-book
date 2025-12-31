'use client'

import { useState } from 'react'

interface SongUrlInputProps {
  onAddSong: (url: string) => void
}

export default function SongUrlInput({ onAddSong }: SongUrlInputProps) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateUrl = (urlString: string): boolean => {
    try {
      const urlObj = new URL(urlString)
      return urlObj.hostname.includes('ultimate-guitar.com')
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setError(null)

    // Validate URL format
    if (!validateUrl(url)) {
      setError('Please enter a valid Ultimate Guitar URL (e.g., https://tabs.ultimate-guitar.com/tab/oasis/wonderwall-chords-12345)')
      return
    }

    setLoading(true)
    try {
      await onAddSong(url.trim())
      setUrl('') // Clear input on success
    } catch (err) {
      setError('Failed to add song. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste Ultimate Guitar URL (e.g., https://tabs.ultimate-guitar.com/tab/oasis/wonderwall-chords-12345)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding...' : 'Add Song'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}
    </div>
  )
}

