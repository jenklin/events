'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-stone-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-950/95 backdrop-blur-lg border-b border-stone-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold">
                <span className="text-stone-400">c</span>
                <span className="text-red-900">p</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-stone-100">CloudPeers Event Creator</h1>
                <p className="text-sm text-stone-400">Multi-Tenant Events Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/30 text-emerald-300 border border-emerald-700/50">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span className="text-sm font-semibold">Ready to Create</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-7xl">

        {/* Hero Section */}
        <section className="text-center mb-16">
          <h2 className="text-5xl font-bold text-stone-100 mb-4">
            Create Beautiful Events in Minutes
          </h2>
          <p className="text-xl text-stone-300 max-w-2xl mx-auto">
            Design stunning event pages, manage registrations, and share photo galleries with our powerful white-label platform.
          </p>
        </section>

        {/* Quick Actions */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold text-stone-100 mb-6">Quick Actions</h3>
          <div className="grid md:grid-cols-3 gap-6">

            {/* Create New Event */}
            <Link href="/create">
              <div className="group p-8 bg-gradient-to-br from-red-950/40 to-red-900/30 backdrop-blur rounded-2xl border border-red-900/50 hover:border-red-700 transition-all cursor-pointer hover:scale-105 hover:shadow-2xl">
                <div className="mb-4">
                  <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-stone-100 mb-2 group-hover:text-red-300 transition-colors">
                  Create New Event
                </h3>
                <p className="text-stone-300">
                  Launch a new event with our step-by-step wizard
                </p>
              </div>
            </Link>

            {/* View Events */}
            <Link href="/events">
              <div className="group p-8 bg-gradient-to-br from-stone-800/40 to-stone-700/30 backdrop-blur rounded-2xl border border-stone-700/50 hover:border-stone-500 transition-all cursor-pointer hover:scale-105 hover:shadow-2xl">
                <div className="mb-4">
                  <svg className="w-12 h-12 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-stone-100 mb-2 group-hover:text-stone-300 transition-colors">
                  View Events
                </h3>
                <p className="text-stone-300">
                  Manage and monitor your existing events
                </p>
              </div>
            </Link>

            {/* Event Templates */}
            <div className="group p-8 bg-gradient-to-br from-amber-950/40 to-amber-900/30 backdrop-blur rounded-2xl border border-amber-900/50 hover:border-amber-700 transition-all cursor-pointer hover:scale-105 hover:shadow-2xl">
              <div className="mb-4">
                <svg className="w-12 h-12 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-stone-100 mb-2 group-hover:text-amber-300 transition-colors">
                Event Templates
              </h3>
              <p className="text-stone-300">
                Browse pre-designed templates for common events
              </p>
            </div>

          </div>
        </section>

        {/* Features Grid */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold text-stone-100 mb-6">Platform Features</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Registration Management */}
            <div className="p-6 bg-gray-800/50 backdrop-blur rounded-xl border border-stone-700 hover:border-red-800 transition-all">
              <div className="mb-3">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="font-bold text-stone-100 mb-1">Guest Management</h4>
              <p className="text-sm text-stone-400">Track RSVPs and manage guest lists</p>
            </div>

            {/* Photo Galleries */}
            <div className="p-6 bg-gray-800/50 backdrop-blur rounded-xl border border-stone-700 hover:border-amber-700 transition-all">
              <div className="mb-3">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="font-bold text-stone-100 mb-1">Photo Galleries</h4>
              <p className="text-sm text-stone-400">Share memories with magic link access</p>
            </div>

            {/* QR Codes */}
            <div className="p-6 bg-gray-800/50 backdrop-blur rounded-xl border border-stone-700 hover:border-stone-500 transition-all">
              <div className="mb-3">
                <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <h4 className="font-bold text-stone-100 mb-1">QR Codes</h4>
              <p className="text-sm text-stone-400">Generate scannable event codes</p>
            </div>

            {/* Analytics */}
            <div className="p-6 bg-gray-800/50 backdrop-blur rounded-xl border border-stone-700 hover:border-red-800 transition-all">
              <div className="mb-3">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="font-bold text-stone-100 mb-1">Analytics</h4>
              <p className="text-sm text-stone-400">Track engagement and attendance</p>
            </div>

          </div>
        </section>

        {/* Getting Started */}
        <section className="bg-gradient-to-r from-red-950/40 to-amber-950/40 backdrop-blur rounded-2xl p-8 border border-red-900/50">
          <h3 className="text-2xl font-bold text-stone-100 mb-4">Getting Started</h3>
          <div className="grid md:grid-cols-3 gap-6 text-stone-200">
            <div>
              <div className="text-4xl font-bold text-red-400 mb-2">1</div>
              <h4 className="font-bold text-stone-100 mb-2">Create Your Event</h4>
              <p className="text-sm text-stone-300">Fill out the event wizard with your event details, date, and location.</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-amber-600 mb-2">2</div>
              <h4 className="font-bold text-stone-100 mb-2">Customize & Preview</h4>
              <p className="text-sm text-stone-300">Add branding, optional features like potluck or music requests.</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-stone-400 mb-2">3</div>
              <h4 className="font-bold text-stone-100 mb-2">Share & Manage</h4>
              <p className="text-sm text-stone-300">Share your event URL or QR code and track registrations in real-time.</p>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-950 border-t border-stone-700 mt-12">
        <div className="container mx-auto max-w-7xl text-center">
          <p className="text-sm text-stone-400">
            CloudPeers Events Platform •
            <a href="/docs" className="text-red-400 hover:underline ml-1">Documentation</a> •
            <a href="https://cloudpeers.com" className="text-red-400 hover:underline ml-1">CloudPeers</a>
          </p>
          <p className="text-xs text-stone-500 mt-2">
            Multi-Tenant Event Management Service
          </p>
        </div>
      </footer>
    </div>
  );
}
