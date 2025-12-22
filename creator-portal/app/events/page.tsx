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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-red-900 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-stone-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-900 to-amber-700 flex items-center justify-center hover:scale-105 transition-transform">
                <span className="text-white font-bold text-lg">CP</span>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-stone-900">My Events</h1>
                <p className="text-sm text-stone-600">Manage and monitor your events</p>
              </div>
            </div>
            <Link
              href="/create"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-900 to-amber-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
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
            <div className="w-24 h-24 bg-gradient-to-br from-red-900/10 to-amber-700/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-12 h-12 text-red-900" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mb-2">No Events Yet</h2>
            <p className="text-stone-600 mb-8 max-w-md mx-auto">
              Create your first event to get started with CloudPeers Events
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-900 to-amber-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Create Your First Event
            </Link>
          </div>
        ) : (
          // Events Grid
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-700">
                {events.length} {events.length === 1 ? 'Event' : 'Events'}
              </h2>
              <div className="flex gap-2">
                <button className="px-4 py-2 text-sm font-semibold text-red-900 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                  Upcoming
                </button>
                <button className="px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100 rounded-lg transition-colors">
                  Past
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/e/${event.id}`}
                  className="group bg-white rounded-xl p-6 border border-stone-200 shadow-sm hover:shadow-lg hover:border-red-900/30 transition-all"
                >
                  {/* Event Title */}
                  <h3 className="text-lg font-bold text-stone-900 mb-3 group-hover:text-red-900 transition-colors">
                    {event.title}
                  </h3>

                  {/* Event Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-stone-600">
                      <Calendar className="w-4 h-4 text-red-900" />
                      <span>{new Date(event.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-stone-600">
                      <MapPin className="w-4 h-4 text-red-900" />
                      <span>{event.location.venueName}</span>
                    </div>

                    {event.capacity && (
                      <div className="flex items-center gap-2 text-sm text-stone-600">
                        <Users className="w-4 h-4 text-red-900" />
                        <span>
                          {event.guestCount || 0} / {event.capacity} guests
                        </span>
                      </div>
                    )}
                  </div>

                  {/* View Button */}
                  <div className="flex items-center gap-2 text-sm font-semibold text-red-900 group-hover:underline">
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
