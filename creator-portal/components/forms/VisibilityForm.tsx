'use client';

import { UseFormReturn } from 'react-hook-form';
import { EventFormData } from '@/lib/eventSchema';

export default function VisibilityForm({ form }: { form: UseFormReturn<EventFormData> }) {
  const { register, watch } = form;
  const isPublic = watch('visibility.isPublic');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Visibility & Privacy</h2>
        <p className="text-paradigm-muted">Control who can see your event and guest information.</p>
      </div>

      {/* Public/Private */}
      <div className="p-6 bg-paradigm-deep-black rounded-lg border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Event Visibility</h3>

        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer p-4 border-2 rounded-lg hover:bg-paradigm-panel transition-colors"
                 style={{ borderColor: !isPublic ? '#9333ea' : '#e2e8f0' }}>
            <input {...register('visibility.isPublic')} type="radio" value="false" className="mt-1 w-5 h-5 text-paradigm-purple-light" />
            <div>
              <span className="block font-medium text-white">Private (Invite Only)</span>
              <span className="block text-sm text-paradigm-muted">Only people with the link can view and RSVP</span>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer p-4 border-2 rounded-lg hover:bg-paradigm-panel transition-colors"
                 style={{ borderColor: isPublic ? '#9333ea' : '#e2e8f0' }}>
            <input {...register('visibility.isPublic')} type="radio" value="true" className="mt-1 w-5 h-5 text-paradigm-purple-light" />
            <div>
              <span className="block font-medium text-white">Public</span>
              <span className="block text-sm text-paradigm-muted">Anyone can discover, view, and RSVP to this event</span>
            </div>
          </label>
        </div>
      </div>

      {/* Guest List Display */}
      <div className="p-6 bg-paradigm-deep-black rounded-lg border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Guest List Display</h3>

        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input {...register('visibility.guestList.showGuestNames')} type="checkbox" className="w-5 h-5 text-paradigm-purple-light rounded" />
            <span className="text-sm font-medium">Show guest names</span>
          </label>

          <label className="flex items-center gap-3">
            <input {...register('visibility.guestList.showGuestCount')} type="checkbox" className="w-5 h-5 text-paradigm-purple-light rounded" />
            <span className="text-sm font-medium">Show guest count</span>
          </label>

          <label className="flex items-center gap-3">
            <input {...register('visibility.guestList.showGuestPhotos')} type="checkbox" className="w-5 h-5 text-paradigm-purple-light rounded" />
            <span className="text-sm font-medium">Show guest photos</span>
          </label>

          <label className="flex items-center gap-3">
            <input {...register('visibility.guestList.showActivityTimestamps')} type="checkbox" className="w-5 h-5 text-paradigm-purple-light rounded" />
            <span className="text-sm font-medium">Show when people RSVP'd</span>
          </label>
        </div>
      </div>

      {/* Password Protection */}
      <div className="p-6 bg-paradigm-gold/10 rounded-lg border border-paradigm-gold/30">
        <h3 className="text-lg font-semibold text-white mb-2">Password Protection (Optional)</h3>
        <p className="text-sm text-paradigm-muted mb-4">Require a password to view the event page</p>

        <input
          {...register('visibility.password')}
          type="text"
          placeholder="Enter password (optional)"
          className="w-full px-4 py-2 border border-paradigm-gold/40 rounded-lg focus:ring-2 focus:ring-paradigm-gold"
        />
      </div>
    </div>
  );
}
