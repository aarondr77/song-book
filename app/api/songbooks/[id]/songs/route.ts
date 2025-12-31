import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { song_id } = body

    if (!song_id) {
      return NextResponse.json(
        { error: 'Song ID is required' },
        { status: 400 }
      )
    }

    // Get current max position
    const { data: existingSongs } = await supabase
      .from('songbook_songs')
      .select('position')
      .eq('songbook_id', params.id)
      .order('position', { ascending: false })
      .limit(1)

    const nextPosition = existingSongs && existingSongs.length > 0
      ? existingSongs[0].position + 1
      : 0

    const { data, error } = await supabase
      .from('songbook_songs')
      .insert([
        {
          songbook_id: params.id,
          song_id,
          position: nextPosition,
        },
      ])
      .select(`
        *,
        song:songs (*)
      `)
      .single()

    if (error) {
      console.error('Error adding song to songbook:', error)
      return NextResponse.json(
        { error: 'Failed to add song to songbook' },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { songs } = body // Array of { song_id, position }

    if (!Array.isArray(songs)) {
      return NextResponse.json(
        { error: 'Songs must be an array' },
        { status: 400 }
      )
    }

    // Validate that all songs have song_id
    const invalidSongs = songs.filter((s: any) => !s.song_id || s.song_id === '')
    if (invalidSongs.length > 0) {
      console.error('Invalid songs in reorder request:', invalidSongs)
      console.error('Full songs array:', songs)
    }

    // Delete existing songbook_songs entries
    const { error: deleteError } = await supabase
      .from('songbook_songs')
      .delete()
      .eq('songbook_id', params.id)

    if (deleteError) {
      console.error('Error deleting existing songs:', deleteError)
      return NextResponse.json(
        { error: 'Failed to update song order' },
        { status: 500 }
      )
    }

    // Insert new songbook_songs entries
    // Filter out any entries with null/undefined song_id
    const songbookSongs = songs
      .filter((s: any) => s.song_id != null && s.song_id !== '')
      .map((s: any) => ({
        songbook_id: params.id,
        song_id: s.song_id,
        position: s.position,
      }))

    if (songbookSongs.length === 0) {
      return NextResponse.json(
        { error: 'No valid songs to update' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('songbook_songs')
      .insert(songbookSongs)
      .select()

    if (error) {
      console.error('Error updating song order:', error)
      return NextResponse.json(
        { error: 'Failed to update song order' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
