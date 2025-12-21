import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Get attendees for an event
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const eventName = searchParams.get('eventName')

  if (!eventName) {
    return NextResponse.json({ error: 'eventName required' }, { status: 400 })
  }

  try {
    // Query all attendees from events_registrations
    const { data: attendees, error } = await supabaseAdmin
      .from('events_registrations')
      .select('full_name, email, created_at')
      .eq('event_name', eventName)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Attendees query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Return count and list (with privacy consideration - only first names)
    const attendeeList = attendees?.map(a => ({
      // Show first name only for privacy
      displayName: a.full_name ? a.full_name.split(' ')[0] : 'Guest',
      registeredAt: a.created_at
    })) || []

    return NextResponse.json({
      count: attendees?.length || 0,
      attendees: attendeeList,
      eventName
    })

  } catch (error) {
    console.error('Attendees fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch attendees' }, { status: 500 })
  }
}
