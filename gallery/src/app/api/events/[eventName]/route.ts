import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Get event content by event name
export async function GET(_: Request, { params }: { params: { eventName: string } }) {
  const eventName = decodeURIComponent(params.eventName)

  try {
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('event_name', eventName)
      .single()

    if (error) {
      console.error('Event query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json({ event: data })

  } catch (error) {
    console.error('Event fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
  }
}
