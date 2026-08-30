'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-paradigm-deep-black bg-gradient-to-br from-paradigm-deep-black via-[#0b0a14] to-paradigm-deep-black">
      {/* Header */}
      <header className="glass-panel border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo-multi-color.svg" alt="cloudpeers logo" className="w-10 h-10 sm:w-12 sm:h-12" />
              <div>
                <h1 className="text-xl font-semibold text-white">cloudpeers Event Creator</h1>
                <p className="text-sm text-paradigm-muted">Multi-Tenant Events Platform</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-paradigm-teal/15 text-paradigm-teal-light border border-paradigm-teal/30">
              <span className="text-sm font-semibold">Ready to Create</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-7xl">

        {/* Hero Section */}
        <section className="text-center mb-12 sm:mb-16">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-white mb-4">
            Create Beautiful Events in Minutes
          </h2>
          <p className="text-lg sm:text-xl text-paradigm-muted max-w-2xl mx-auto">
            Design stunning event pages, manage registrations, and share photo galleries with our powerful white-label platform.
          </p>
        </section>

        {/* Quick Actions */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold text-white mb-6">Quick Actions</h3>
          <div className="grid md:grid-cols-3 gap-6">

            {/* Create New Event */}
            <Link href="/creator">
              <div className="group p-8 bg-paradigm-panel/70 backdrop-blur rounded-2xl border border-paradigm-purple/30 hover:border-paradigm-purple transition-all cursor-pointer hover:scale-105 hover:shadow-2xl hover:shadow-paradigm-purple/10">
                <h3 className="text-2xl font-semibold text-white mb-2 group-hover:text-paradigm-purple-light transition-colors">
                  Create New Event
                </h3>
                <p className="text-paradigm-muted">
                  Launch a new event with our step-by-step wizard
                </p>
              </div>
            </Link>

            {/* View Events */}
            <Link href="/events">
              <div className="group p-8 bg-paradigm-panel/70 backdrop-blur rounded-2xl border border-white/10 hover:border-paradigm-accent transition-all cursor-pointer hover:scale-105 hover:shadow-2xl hover:shadow-paradigm-accent/10">
                <h3 className="text-2xl font-semibold text-white mb-2 group-hover:text-paradigm-accent-light transition-colors">
                  View Events
                </h3>
                <p className="text-paradigm-muted">
                  Manage and monitor your existing events
                </p>
              </div>
            </Link>

            {/* Event Templates */}
            <div className="group p-8 bg-paradigm-panel/70 backdrop-blur rounded-2xl border border-paradigm-coral/30 hover:border-paradigm-coral transition-all cursor-pointer hover:scale-105 hover:shadow-2xl hover:shadow-paradigm-coral/10">
              <h3 className="text-2xl font-semibold text-white mb-2 group-hover:text-paradigm-coral-light transition-colors">
                Event Templates
              </h3>
              <p className="text-paradigm-muted">
                Browse pre-designed templates for common events
              </p>
            </div>

          </div>
        </section>

        {/* Features Grid */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold text-white mb-6">Platform Features</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="p-6 bg-paradigm-panel/50 backdrop-blur rounded-xl border border-white/10 hover:border-paradigm-purple/60 transition-all">
              <h4 className="font-semibold text-white mb-1">Guest Management</h4>
              <p className="text-sm text-paradigm-muted">Track RSVPs and manage guest lists</p>
            </div>

            <div className="p-6 bg-paradigm-panel/50 backdrop-blur rounded-xl border border-white/10 hover:border-paradigm-teal/60 transition-all">
              <h4 className="font-semibold text-white mb-1">Photo Galleries</h4>
              <p className="text-sm text-paradigm-muted">Share memories with magic link access</p>
            </div>

            <div className="p-6 bg-paradigm-panel/50 backdrop-blur rounded-xl border border-white/10 hover:border-paradigm-accent/60 transition-all">
              <h4 className="font-semibold text-white mb-1">QR Codes</h4>
              <p className="text-sm text-paradigm-muted">Generate scannable event codes</p>
            </div>

            <div className="p-6 bg-paradigm-panel/50 backdrop-blur rounded-xl border border-white/10 hover:border-paradigm-coral/60 transition-all">
              <h4 className="font-semibold text-white mb-1">Analytics</h4>
              <p className="text-sm text-paradigm-muted">Track engagement and attendance</p>
            </div>

          </div>
        </section>

        {/* Getting Started */}
        <section className="glass-panel bg-gradient-to-r from-paradigm-purple/10 to-paradigm-teal/10 rounded-2xl p-8 border border-white/10">
          <h3 className="text-2xl font-semibold text-white mb-4">Getting Started</h3>
          <div className="grid md:grid-cols-3 gap-6 text-paradigm-text">
            <div>
              <div className="text-4xl font-bold text-paradigm-purple mb-2">1</div>
              <h4 className="font-semibold text-white mb-2">Create Your Event</h4>
              <p className="text-sm text-paradigm-muted">Fill out the event wizard with your event details, date, and location.</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-paradigm-teal mb-2">2</div>
              <h4 className="font-semibold text-white mb-2">Customize &amp; Preview</h4>
              <p className="text-sm text-paradigm-muted">Add branding, optional features like potluck or music requests.</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-paradigm-coral mb-2">3</div>
              <h4 className="font-semibold text-white mb-2">Share &amp; Manage</h4>
              <p className="text-sm text-paradigm-muted">Share your event URL or QR code and track registrations in real-time.</p>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="py-8 px-4 bg-paradigm-dark border-t border-white/10 mt-12">
        <div className="container mx-auto max-w-7xl text-center">
          <p className="text-sm text-paradigm-muted">
            cloudpeers Events Platform •
            <a href="/docs" className="text-paradigm-purple-light hover:underline ml-1">Documentation</a> •
            <a href="https://cloudpeers.com" className="text-paradigm-purple-light hover:underline ml-1">cloudpeers</a>
          </p>
          <p className="text-xs text-paradigm-muted/70 mt-2">
            Multi-Tenant Event Management Service
          </p>
        </div>
      </footer>
    </div>
  );
}
