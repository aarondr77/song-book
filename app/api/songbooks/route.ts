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
      // Get all songbooks
      const { data, error } = await supabase
        .from('songbooks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching songbooks:', error)
        return NextResponse.json(
          { error: 'Failed to fetch songbooks' },
          { status: 500 }
        )
      }

      return NextResponse.json(data)
    }
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

