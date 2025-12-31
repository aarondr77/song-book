import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

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
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
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
      .from('songbook-covers')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error('Error uploading file:', error)
      // Check if bucket doesn't exist
      if (error.message?.includes('Bucket not found') || error.message?.includes('not found')) {
        return NextResponse.json(
          { error: 'Storage bucket not configured. Please create a "songbook-covers" bucket in Supabase Storage with public access.' },
          { status: 500 }
        )
      }
      // Check for RLS policy error
      if (error.message?.includes('row-level security') || error.statusCode === '403') {
        return NextResponse.json(
          { error: 'Storage access denied. Please set SUPABASE_SERVICE_ROLE_KEY in your environment variables, or configure storage bucket policies.' },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { error: error.message || 'Failed to upload image' },
        { status: 500 }
      )
    }

    // Get public URL (can use regular client for this)
    const { data: urlData } = supabaseServer.storage
      .from('songbook-covers')
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

