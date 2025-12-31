'use client'

import { SongbookSong } from '@/lib/types'

interface PrintViewProps {
  songbook: {
    title: string
    description?: string
    songs?: SongbookSong[]
  }
}

export default function PrintView({ songbook }: PrintViewProps) {
  return (
    <div className="print-view">
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 20px;
          }
          .no-print {
            display: none;
          }
          .page-break {
            page-break-after: always;
          }
          .print-view {
            max-width: 100%;
          }
        }
        @page {
          margin: 1in;
        }
      `}</style>

      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">{songbook.title}</h1>
          {songbook.description && (
            <p className="text-lg text-gray-600">{songbook.description}</p>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Table of Contents</h2>
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
    </div>
  )
}

