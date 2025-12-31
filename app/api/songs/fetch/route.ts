import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Helper function to parse Ultimate Guitar URL and extract metadata
function parseUltimateGuitarUrl(url: string): { artist: string; songName: string; type: string } | null {
  try {
    const urlObj = new URL(url)
    
    // Check if it's an Ultimate Guitar URL
    if (!urlObj.hostname.includes('ultimate-guitar.com')) {
      return null
    }

    // Parse path like: /tab/oasis/wonderwall-chords-12345
    const pathMatch = urlObj.pathname.match(/\/tab\/([^/]+)\/([^/]+)/)
    if (!pathMatch) {
      return null
    }

    const artistSlug = pathMatch[1]
    const songSlug = pathMatch[2]

    // Extract artist name (convert slug to title case)
    const artist = artistSlug
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')

    // Extract song name and type from slug
    // Format: songname-type-12345 or songname-12345
    const songParts = songSlug.split('-')
    
    // Remove the ID (last part if it's numeric)
    let songNameParts = songParts
    if (songParts.length > 0 && /^\d+$/.test(songParts[songParts.length - 1])) {
      songNameParts = songParts.slice(0, -1)
    }

    // Determine type from slug
    const typeKeywords = ['chords', 'tab', 'tabs', 'ukulele', 'bass', 'power', 'guitar-pro', 'pro', 'video', 'official', 'drums']
    let type = 'Chords' // default
    let songNameWithoutType = songNameParts

    // Check if last part before ID is a type keyword
    if (songNameParts.length > 1) {
      const lastPart = songNameParts[songNameParts.length - 1].toLowerCase()
      if (typeKeywords.includes(lastPart)) {
        type = lastPart.charAt(0).toUpperCase() + lastPart.slice(1)
        if (type === 'Tabs') type = 'Tab'
        if (type === 'Guitar-pro') type = 'Pro'
        songNameWithoutType = songNameParts.slice(0, -1)
      }
    }

    // Build song name from remaining parts
    const songName = songNameWithoutType
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ')

    return { artist, songName, type }
  } catch (error) {
    console.error('Error parsing URL:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ultimate_guitar_url, songbook_id } = body

    if (!ultimate_guitar_url) {
      return NextResponse.json(
        { error: 'Ultimate Guitar URL is required' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      const urlObj = new URL(ultimate_guitar_url)
      if (!urlObj.hostname.includes('ultimate-guitar.com')) {
        return NextResponse.json(
          { error: 'Invalid Ultimate Guitar URL' },
          { status: 400 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Check if song already exists by URL
    const { data: existingSong } = await supabase
      .from('songs')
      .select('*')
      .eq('ultimate_guitar_url', ultimate_guitar_url)
      .single()

    let song
    if (existingSong) {
      song = existingSong
    } else {
      // Parse URL to extract metadata
      const parsed = parseUltimateGuitarUrl(ultimate_guitar_url)
      
      if (!parsed) {
        return NextResponse.json(
          { error: 'Could not parse song information from URL' },
          { status: 400 }
        )
      }

      // Store song in database
      const { data: newSong, error: insertError } = await supabase
        .from('songs')
        .insert([
          {
            title: parsed.songName,
            artist: parsed.artist,
            ultimate_guitar_url: ultimate_guitar_url,
            ultimate_guitar_id: null,
            chords_data: null,
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
        // Don't fail the request, song was still saved
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
