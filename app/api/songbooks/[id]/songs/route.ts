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
    const songbookSongs = songs.map((s: any) => ({
      songbook_id: params.id,
      song_id: s.song_id,
      position: s.position,
    }))

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
