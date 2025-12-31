import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, cover_image_url } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('songbooks')
      .insert([{ 
        title, 
        description: description || null,
        cover_image_url: cover_image_url || null
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating songbook:', error)
      return NextResponse.json(
        { error: 'Failed to create songbook' },
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      // Get single songbook with songs
      const { data: songbook, error: songbookError } = await supabase
        .from('songbooks')
        .select('*')
        .eq('id', id)
        .single()

      if (songbookError) {
        return NextResponse.json(
          { error: 'Songbook not found' },
          { status: 404 }
        )
      }

      // Get songs for this songbook
      const { data: songbookSongs, error: songsError } = await supabase
        .from('songbook_songs')
        .select(`
          position,
          song:songs (*)
        `)
        .eq('songbook_id', id)
        .order('position', { ascending: true })

      if (songsError) {
        console.error('Error fetching songs:', songsError)
      }

      return NextResponse.json({
        ...songbook,
        songs: songbookSongs || [],
      })
    } else {
      // Get all songbooks with song counts
      const { data: songbooks, error: songbooksError } = await supabase
        .from('songbooks')
        .select('*')
        .order('created_at', { ascending: false })

      if (songbooksError) {
        console.error('Error fetching songbooks:', songbooksError)
        return NextResponse.json(
          { error: 'Failed to fetch songbooks' },
          { status: 500 }
        )
      }

      // Get song counts for each songbook
      const songbooksWithCounts = await Promise.all(
        (songbooks || []).map(async (songbook) => {
          const { count, error: countError } = await supabase
            .from('songbook_songs')
            .select('*', { count: 'exact', head: true })
            .eq('songbook_id', songbook.id)

          return {
            ...songbook,
            song_count: countError ? 0 : (count || 0),
          }
        })
      )

      return NextResponse.json(songbooksWithCounts)
    }
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

