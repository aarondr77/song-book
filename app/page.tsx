'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Songbook } from '@/lib/types'
import LoadingScreen from '@/components/LoadingScreen'

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
      <div className="max-w-7xl mx-auto">
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
          <LoadingScreen />
        ) : songbooks.length > 0 ? (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-6">Your Songbooks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {songbooks.map((songbook) => (
                <Link
                  key={songbook.id}
                  href={`/songbook/${songbook.id}`}
                  className="group relative aspect-[3/4] rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  {/* Cover Image or Gradient Background */}
                  {songbook.cover_image_url ? (
                    <img
                      src={songbook.cover_image_url}
                      alt={`${songbook.title} cover`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" />
                  )}
                  
                  {/* Song Count Badge */}
                  {songbook.song_count !== undefined && songbook.song_count > 0 && (
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-gray-800 shadow-lg">
                      {songbook.song_count} {songbook.song_count === 1 ? 'song' : 'songs'}
                    </div>
                  )}
                  
                  {/* Bottom Blur Overlay with Text */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent backdrop-blur-sm p-6">
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-200 transition-colors">
                      {songbook.title}
                    </h3>
                    <p className="text-sm text-gray-300">
                      Created {new Date(songbook.created_at).toLocaleDateString()}
                    </p>
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

