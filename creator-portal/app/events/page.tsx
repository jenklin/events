'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users, Eye, Plus } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  date: string;
  location: {
    venueName: string;
    city: string;
    state: string;
  };
  guestCount?: number;
  capacity?: number;
  status: 'upcoming' | 'past';
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch events from API when backend is ready
    // For now, show a placeholder
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-paradigm-deep-black via-[#0b0a14] to-paradigm-deep-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-paradigm-purple border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-paradigm-muted">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-paradigm-deep-black via-[#0b0a14] to-paradigm-deep-black">
      {/* Header */}
      <header className="bg-paradigm-panel/80 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center hover:scale-105 transition-transform">
                <img src="/logo-purple.svg" alt="cloudpeers" className="h-10 w-auto" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">My Events</h1>
                <p className="text-sm text-paradigm-muted">Manage and monitor your events</p>
              </div>
            </div>
            <Link
              href="/creator"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-paradigm-purple to-paradigm-teal text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-paradigm-purple/20 transition-all"
            >
              <Plus className="w-5 h-5" />
              Create Event
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {events.length === 0 ? (
          // Empty State
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-paradigm-purple/15 to-paradigm-teal/15 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-12 h-12 text-paradigm-purple" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No Events Yet</h2>
            <p className="text-paradigm-muted mb-8 max-w-md mx-auto">
              Create your first event to get started with cloudpeers Events
            </p>
            <Link
              href="/creator"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-paradigm-purple to-paradigm-teal text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-paradigm-purple/20 transition-all"
            >
              <Plus className="w-5 h-5" />
              Create Your First Event
            </Link>
          </div>
        ) : (
          // Events Grid
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-paradigm-text">
                {events.length} {events.length === 1 ? 'Event' : 'Events'}
              </h2>
              <div className="flex gap-2">
                <button className="px-4 py-2 text-sm font-semibold text-paradigm-purple-light bg-paradigm-purple/15 rounded-lg hover:bg-paradigm-purple/25 transition-colors">
                  Upcoming
                </button>
                <button className="px-4 py-2 text-sm font-semibold text-paradigm-muted hover:bg-paradigm-panel rounded-lg transition-colors">
                  Past
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/e/${event.id}`}
                  className="group bg-paradigm-panel rounded-xl p-6 border border-white/10 shadow-sm hover:shadow-lg hover:border-paradigm-purple/30 transition-all"
                >
                  {/* Event Title */}
                  <h3 className="text-lg font-bold text-white mb-3 group-hover:text-paradigm-purple-light transition-colors">
                    {event.title}
                  </h3>

                  {/* Event Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-paradigm-muted">
                      <Calendar className="w-4 h-4 text-paradigm-purple" />
                      <span>{new Date(event.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-paradigm-muted">
                      <MapPin className="w-4 h-4 text-paradigm-purple" />
                      <span>{event.location.venueName}</span>
                    </div>

                    {event.capacity && (
                      <div className="flex items-center gap-2 text-sm text-paradigm-muted">
                        <Users className="w-4 h-4 text-paradigm-purple" />
                        <span>
                          {event.guestCount || 0} / {event.capacity} guests
                        </span>
                      </div>
                    )}
                  </div>

                  {/* View Button */}
                  <div className="flex items-center gap-2 text-sm font-semibold text-paradigm-purple-light group-hover:underline">
                    <Eye className="w-4 h-4" />
                    View Event
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
