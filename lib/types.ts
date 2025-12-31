export interface Song {
  id: string
  title: string
  artist: string
  ultimate_guitar_id?: number | null
  ultimate_guitar_url?: string | null
  chords_data?: any | null
  created_at: string
}

export interface Songbook {
  id: string
  title: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface SongbookSong {
  songbook_id: string
  song_id: string
  position: number
  created_at: string
  song?: Song
}

