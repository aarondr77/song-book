'use client'

import { useParams } from 'next/navigation'
import SongbookEditor from '@/components/SongbookEditor'

export default function EditSongbookPage() {
  const params = useParams()
  const id = params.id as string

  return <SongbookEditor songbookId={id} />
}

