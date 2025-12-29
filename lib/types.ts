export interface Song {
  id: string
  title: string
  artist: string
  ultimate_guitar_id: number
  chords_data: any
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

export interface UltimateGuitarSearchResult {
  id: number
  song_name: string
  artist_name: string
  type: string
}

export interface UltimateGuitarTab {
  id: number
  song_name: string
  artist_name: string
  content: string
  type: string
}

