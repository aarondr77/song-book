import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; songId: string } }
) {
  try {
    const { error } = await supabase
      .from('songbook_songs')
      .delete()
      .eq('songbook_id', params.id)
      .eq('song_id', params.songId)

    if (error) {
      console.error('Error removing song from songbook:', error)
      return NextResponse.json(
        { error: 'Failed to remove song from songbook' },
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

