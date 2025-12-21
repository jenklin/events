'use client';

import EventCreatorWizard from '../components/EventCreatorWizard';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Create Your Event
            </h1>
            <p className="text-lg text-slate-600">
              Design a beautiful event page in minutes
            </p>
          </div>

          <EventCreatorWizard />
        </div>
      </div>
    </main>
  );
}
