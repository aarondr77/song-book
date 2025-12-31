'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Songbook } from '@/lib/types'

export default function Home() {
  const [songbooks, setSongbooks] = useState<Songbook[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSongbooks()
  }, [])

  const loadSongbooks = async () => {
    try {
      const response = await fetch('/api/songbooks')
      if (response.ok) {
        const data = await response.json()
        setSongbooks(data)
      }
    } catch (err) {
      console.error('Failed to load songbooks:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Song Books</h1>
            <p className="text-xl text-gray-600">
              Create and share songbooks with lyrics and guitar chords
            </p>
          </div>
          <Link
            href="/songbook/new"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New Songbook
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : songbooks.length > 0 ? (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Your Songbooks</h2>
            <div className="grid gap-4">
              {songbooks.map((songbook) => (
                <Link
                  key={songbook.id}
                  href={`/songbook/${songbook.id}`}
                  className="block p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex gap-4">
                    {songbook.cover_image_url && (
                      <img
                        src={songbook.cover_image_url}
                        alt={`${songbook.title} cover`}
                        className="w-32 h-32 object-cover rounded-lg border border-gray-300 flex-shrink-0"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{songbook.title}</h3>
                      {songbook.description && (
                        <p className="text-gray-600 mb-2">{songbook.description}</p>
                      )}
                      <p className="text-sm text-gray-400">
                        Created {new Date(songbook.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-4">No songbooks yet. Create your first one!</p>
          </div>
        )}
      </div>
    </main>
  )
}

