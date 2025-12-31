'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SongbookSong } from '@/lib/types'
import LoadingScreen from '@/components/LoadingScreen'

export default function SongbookViewPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [songbook, setSongbook] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredVideoId, setHoveredVideoId] = useState<string | null>(null)

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

  const scrollToSong = (songId: string) => {
    const element = document.getElementById(`song-${songId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const getVideoBackground = (index: number): string => {
    const backgrounds = [
      'alpine-valley.png',
      'autum-path.png',
      'coastal-dunes.png',
      'fall-harvest.png',
      'misty-morning.png',
      'rainy-spring-garden.png',
      'twilight-birch-grove.png',
      'winter-path.png',
    ]
    return `/video-backgrounds/${backgrounds[index % backgrounds.length]}`
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

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content - Blog Style */}
      <main className="max-w-5xl mx-auto px-6 py-12 lg:px-16">
        {/* Header with Breadcrumb and Title */}
        <header className="mb-12">
          <button
            onClick={() => router.push('/')}
            className="mb-4 text-gray-600 hover:text-gray-900 text-sm"
          >
            ← Home
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{songbook.title}</h1>
          {songbook.description && (
            <p className="text-lg text-gray-600 mb-2">{songbook.description}</p>
          )}
          <p className="text-sm text-gray-500">
            Created {new Date(songbook.created_at).toLocaleDateString()}
          </p>
        </header>
          {/* Table of Contents */}
          {songbook.songs && songbook.songs.length > 0 && (
            <div className="mb-12 pb-8 border-b border-gray-200">
              <div className="space-y-2">
                {songbook.songs.map((songbookSong: SongbookSong) => {
                  const songId = songbookSong.song?.id || songbookSong.song_id
                  if (!songId) return null
                  return (
                    <div key={songId}>
                      <button
                        onClick={() => scrollToSong(songId)}
                        className="text-gray-700 underline hover:text-gray-900 text-left"
                      >
                        {songbookSong.song?.title || 'Untitled Song'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Blog Post Style Content */}
          <div className="space-y-16">
            {songbook.songs?.map((songbookSong: SongbookSong, index: number) => {
              // Use song.id as the primary identifier (it's the actual song UUID)
              const songId = songbookSong.song?.id || songbookSong.song_id
              if (!songId) return null // Skip if no valid ID
              const isHovered = hoveredVideoId === songId
              
              return (
                <article key={songId} id={`song-${songId}`} className="prose prose-lg max-w-none">
                {/* Song Title as Header */}
                <header className="mb-6">
                  <div className="flex items-baseline gap-4 mb-2">
                    {songbookSong.song?.ultimate_guitar_url ? (
                      <h1 
                        className="text-3xl font-bold text-gray-900 m-0 cursor-pointer hover:text-gray-700"
                        onClick={() => {
                          const url = songbookSong.song?.ultimate_guitar_url
                          if (url) {
                            window.open(url, '_blank', 'noopener,noreferrer')
                          }
                        }}
                      >
                        {songbookSong.song?.title || 'Untitled Song'}
                      </h1>
                    ) : (
                      <h1 className="text-3xl font-bold text-gray-900 m-0">
                        {songbookSong.song?.title || 'Untitled Song'}
                      </h1>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xl text-gray-600 m-0">
                      {songbookSong.song?.artist || 'Unknown Artist'}
                    </p>
                    {songbookSong.song?.ultimate_guitar_url && (
                      <a
                        href={songbookSong.song.ultimate_guitar_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        View Chords
                      </a>
                    )}
                  </div>
                </header>

                {/* Markdown Text Content */}
                <div className="mb-8">
                  {songbookSong.song?.text ? (
                    <div className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">
                      {songbookSong.song.text}
                    </div>
                  ) : null}
                </div>

                {/* Video Player */}
                {songbookSong.song?.video_url && (
                  <div className="mb-8">
                    <div 
                      className="w-[150%] -ml-[25%] rounded-xl shadow-sm relative overflow-hidden"
                      style={{
                        backgroundImage: `url(${getVideoBackground(index)})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        padding: '30px',
                      }}
                      onMouseEnter={() => setHoveredVideoId(songId)}
                      onMouseLeave={() => setHoveredVideoId(null)}
                    >
                      <div 
                        className="relative z-10 rounded-xl overflow-hidden"
                        style={{
                          aspectRatio: '16 / 9',
                          maxHeight: '600px',
                          width: '100%',
                        }}
                      >
                        <video
                          src={songbookSong.song.video_url}
                          controls={isHovered}
                          className="w-full block"
                          style={{ 
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    </div>
                  </div>
                )}

                </article>
              )
            })}
          </div>
        </main>
    </div>
  )
}

