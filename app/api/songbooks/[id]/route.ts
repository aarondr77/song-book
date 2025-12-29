import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: songbook, error: songbookError } = await supabase
      .from('songbooks')
      .select('*')
      .eq('id', params.id)
      .single()

    if (songbookError || !songbook) {
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
      .eq('songbook_id', params.id)
      .order('position', { ascending: true })

    if (songsError) {
      console.error('Error fetching songs:', songsError)
    }

    return NextResponse.json({
      ...songbook,
      songs: songbookSongs || [],
    })
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
    const { title, description } = body

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description

    const { data, error } = await supabase
      .from('songbooks')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating songbook:', error)
      return NextResponse.json(
        { error: 'Failed to update songbook' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('songbooks')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting songbook:', error)
      return NextResponse.json(
        { error: 'Failed to delete songbook' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

