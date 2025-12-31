import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'
import { VIDEO_FILE_SIZE_LIMIT, VIDEO_FILE_SIZE_LIMIT_GB } from '@/lib/storage-constants'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const validVideoTypes = ['video/mp4', 'video/mov', 'video/quicktime', 'video/webm', 'video/x-msvideo']
    if (!validVideoTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File must be a video (mp4, mov, webm, avi)' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > VIDEO_FILE_SIZE_LIMIT) {
      return NextResponse.json(
        { error: `File size must be less than ${VIDEO_FILE_SIZE_LIMIT_GB}GB` },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = fileName

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Use server-side Supabase client with service role key (bypasses RLS)
    const supabaseServer = getSupabaseServer()

    // Upload to Supabase Storage
    const { data, error } = await supabaseServer.storage
      .from('song-videos')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error('Error uploading file:', error)
      // Check if bucket doesn't exist
      if (error.message?.includes('Bucket not found') || error.message?.includes('not found')) {
        return NextResponse.json(
          { error: 'Storage bucket not configured. Please create a "song-videos" bucket in Supabase Storage with public access.' },
          { status: 500 }
        )
      }
      // Check for file size limit error (413 Payload Too Large)
      const errorAny = error as any
      if (error.message?.includes('exceeded the maximum allowed size') || errorAny.statusCode === '413' || errorAny.status === 413) {
        const maxSizeGB = VIDEO_FILE_SIZE_LIMIT_GB ?? Math.round(VIDEO_FILE_SIZE_LIMIT / (1024 * 1024 * 1024))
        return NextResponse.json(
          { error: `File size exceeds the maximum allowed size. Please ensure the Supabase storage bucket is configured to allow files up to ${maxSizeGB}GB.` },
          { status: 413 }
        )
      }
      // Check for RLS policy error
      if (error.message?.includes('row-level security') || errorAny.statusCode === '403') {
        return NextResponse.json(
          { error: 'Storage access denied. Please set SUPABASE_SERVICE_ROLE_KEY in your environment variables, or configure storage bucket policies.' },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { error: error.message || 'Failed to upload video' },
        { status: 500 }
      )
    }

    // Get public URL (can use regular client for this)
    const { data: urlData } = supabaseServer.storage
      .from('song-videos')
      .getPublicUrl(filePath)

    return NextResponse.json({
      url: urlData.publicUrl,
      path: filePath,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

