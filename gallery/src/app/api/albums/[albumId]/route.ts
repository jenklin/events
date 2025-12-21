import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyInviteCookie } from '@/lib/cf'

export async function GET(_: Request, { params }: { params: { albumId: string } }) {
  const { data, error } = await supabaseAdmin.from('albums').select('*').eq('id', params.albumId).single()
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Check user role from invite cookie
  let userRole = 'viewer'
  try {
    const cookieStore = await cookies()
    const inviteCookie = cookieStore.get('album_invite')
    if (inviteCookie) {
      const payload = verifyInviteCookie(inviteCookie.value)
      if (payload && payload.albumId === params.albumId) {
        userRole = payload.role || 'viewer'
      }
    }
  } catch (err) {
    // Cookie verification failed, default to viewer
  }

  return NextResponse.json({ ...data, userRole })
}
