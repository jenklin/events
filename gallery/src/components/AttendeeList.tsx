'use client'
import { useEffect, useState } from 'react'

interface AttendeeListProps {
  eventName: string
}

interface Attendee {
  displayName: string
  registeredAt: string
}

export function AttendeeList({ eventName }: AttendeeListProps) {
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    const fetchAttendees = async () => {
      const basePath = typeof window !== 'undefined' ? window.location.pathname.split('/a/')[0] : ''

      try {
        const res = await fetch(`${basePath}/api/events/attendees?eventName=${encodeURIComponent(eventName)}`)
        if (res.ok) {
          const data = await res.json()
          setAttendees(data.attendees || [])
          setCount(data.count || 0)
        }
      } catch (err) {
        console.error('Failed to fetch attendees:', err)
      } finally {
        setLoading(false)
      }
    }

    if (eventName) {
      fetchAttendees()
    }
  }, [eventName])

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-paradigm-purple/30 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-paradigm-purple/15 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (count === 0) {
    return null
  }

  const displayedAttendees = showAll ? attendees : attendees.slice(0, 12)

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-6 border border-white/10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-paradigm-purple flex items-center justify-center text-white font-bold">
          {count}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">
            Who Was There That Night
          </h3>
          <p className="text-sm text-paradigm-muted">
            {count} {count === 1 ? 'person' : 'people'} joined this gathering
          </p>
        </div>
      </div>

      {/* Attendee Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
        {displayedAttendees.map((attendee, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 bg-paradigm-panel rounded-lg px-3 py-2 shadow-sm border border-white/10"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-paradigm-purple to-paradigm-teal flex items-center justify-center text-white text-sm font-semibold">
              {attendee.displayName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-paradigm-text truncate">
              {attendee.displayName}
            </span>
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {attendees.length > 12 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-paradigm-purple-light hover:text-paradigm-purple font-medium"
        >
          {showAll ? 'Show less' : `Show all ${count} attendees`}
        </button>
      )}

      {/* Community Message */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-sm text-paradigm-muted italic">
          "We're all part of this shared experience - each person brings their unique perspective to our collective story."
        </p>
      </div>
    </div>
  )
}
