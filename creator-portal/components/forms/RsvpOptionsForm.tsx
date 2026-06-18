'use client';

import { UseFormReturn } from 'react-hook-form';
import { EventFormData } from '@/lib/eventSchema';

export default function RsvpOptionsForm({ form }: { form: UseFormReturn<EventFormData> }) {
  const { register } = form;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">RSVP Options</h2>
        <p className="text-paradigm-muted">Choose what information to collect from guests.</p>
      </div>

      <div className="p-6 bg-paradigm-deep-black rounded-lg space-y-4">
        <h3 className="text-lg font-semibold text-white">Guest Information</h3>

        <label className="flex items-center gap-3">
          <input {...register('rsvpOptions.collectName')} type="checkbox" className="w-5 h-5 text-paradigm-purple-light rounded" />
          <span className="text-sm font-medium">Name (required)</span>
        </label>

        <label className="flex items-center gap-3">
          <input {...register('rsvpOptions.collectEmail')} type="checkbox" className="w-5 h-5 text-paradigm-purple-light rounded" />
          <span className="text-sm font-medium">Email (required)</span>
        </label>

        <label className="flex items-center gap-3">
          <input {...register('rsvpOptions.collectPhone')} type="checkbox" className="w-5 h-5 text-paradigm-purple-light rounded" />
          <span className="text-sm font-medium">Phone number (optional)</span>
        </label>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          ℹ Additional custom questions can be added after event creation in the dashboard.
        </p>
      </div>
    </div>
  );
}
