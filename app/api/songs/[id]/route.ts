import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { text, video_url } = body

    const updateData: any = {}
    if (text !== undefined) updateData.text = text
    if (video_url !== undefined) updateData.video_url = video_url

    // Check if song exists
    const { data: existingSong, error: fetchError } = await supabase
      .from('songs')
      .select('id')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingSong) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      )
    }

    const { data, error } = await supabase
      .from('songs')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating song:', error)
      return NextResponse.json(
        { error: 'Failed to update song' },
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: song, error } = await supabase
      .from('songs')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !song) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(song)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

