'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SongbookSong } from '@/lib/types'
import PrintView from '@/components/PrintView'

export default function SongbookViewPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [songbook, setSongbook] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPrintView, setShowPrintView] = useState(false)

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

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (error || !songbook) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error || 'Songbook not found'}</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
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
    <div className="max-w-4xl mx-auto p-6">
      {songbook.cover_image_url && (
        <div className="mb-6">
          <img
            src={songbook.cover_image_url}
            alt={`${songbook.title} cover`}
            className="w-full max-h-96 object-cover rounded-lg border border-gray-300"
          />
        </div>
      )}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">{songbook.title}</h1>
          {songbook.description && (
            <p className="text-gray-600">{songbook.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Home
          </button>
          <button
            onClick={handleShare}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Share Link
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Print
          </button>
          <button
            onClick={() => router.push(`/songbook/${id}/edit`)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Edit
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Table of Contents</h2>
        <ol className="list-decimal list-inside space-y-2">
          {songbook.songs?.map((songbookSong: SongbookSong, index: number) => (
            <li key={songbookSong.song_id} className="text-lg">
              {songbookSong.song?.title || `Song ${index + 1}`} -{' '}
              {songbookSong.song?.artist || 'Unknown Artist'}
            </li>
          ))}
        </ol>
      </div>

      <div className="space-y-12">
        {songbook.songs?.map((songbookSong: SongbookSong, index: number) => (
          <div key={songbookSong.song_id} className="page-break">
            <div className="mb-4">
              <h2 className="text-2xl font-bold">
                {songbookSong.song?.title || `Song ${index + 1}`}
              </h2>
              <p className="text-lg text-gray-600">
                {songbookSong.song?.artist || 'Unknown Artist'}
              </p>
            </div>
            {songbookSong.song?.ultimate_guitar_url ? (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-2">View on Ultimate Guitar:</p>
                <a
                  href={songbookSong.song.ultimate_guitar_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline break-all"
                >
                  {songbookSong.song.ultimate_guitar_url}
                </a>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg text-gray-500">
                No URL available
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

