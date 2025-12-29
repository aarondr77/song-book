import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ultimate_guitar_id, songbook_id } = body

    if (!ultimate_guitar_id) {
      return NextResponse.json(
        { error: 'Ultimate Guitar ID is required' },
        { status: 400 }
      )
    }

    // Check if song already exists
    const { data: existingSong } = await supabase
      .from('songs')
      .select('*')
      .eq('ultimate_guitar_id', ultimate_guitar_id)
      .single()

    let song
    if (existingSong) {
      song = existingSong
    } else {
      // Fetch from Go service
      const goServiceUrl = process.env.GO_SERVICE_URL || 'http://localhost:8080'
      const tabUrl = `${goServiceUrl}/tab/${ultimate_guitar_id}`

      const response = await fetch(tabUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Go service error:', errorText)
        return NextResponse.json(
          { error: 'Failed to fetch tab from Ultimate Guitar' },
          { status: response.status }
        )
      }

      const tabData = await response.json()

      // Store song in database
      const { data: newSong, error: insertError } = await supabase
        .from('songs')
        .insert([
          {
            title: tabData.song_name,
            artist: tabData.artist_name,
            ultimate_guitar_id: tabData.id,
            chords_data: {
              content: tabData.content,
              type: tabData.type,
            },
          },
        ])
        .select()
        .single()

      if (insertError) {
        console.error('Error inserting song:', insertError)
        return NextResponse.json(
          { error: 'Failed to save song' },
          { status: 500 }
        )
      }

      song = newSong
    }

    // If songbook_id is provided, add song to songbook
    if (songbook_id) {
      // Get current max position
      const { data: existingSongs } = await supabase
        .from('songbook_songs')
        .select('position')
        .eq('songbook_id', songbook_id)
        .order('position', { ascending: false })
        .limit(1)

      const nextPosition = existingSongs && existingSongs.length > 0
        ? existingSongs[0].position + 1
        : 0

      const { error: linkError } = await supabase
        .from('songbook_songs')
        .insert([
          {
            songbook_id,
            song_id: song.id,
            position: nextPosition,
          },
        ])

      if (linkError) {
        console.error('Error linking song to songbook:', linkError)
        // Don't fail the request, song was still fetched
      }
    }

    return NextResponse.json(song)
  } catch (error) {
    console.error('Error fetching song:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

