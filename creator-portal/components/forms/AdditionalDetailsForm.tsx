'use client';

import { UseFormReturn } from 'react-hook-form';
import { EventFormData } from '@/lib/eventSchema';

export default function AdditionalDetailsForm({ form }: { form: UseFormReturn<EventFormData> }) {
  const { register, watch, formState: { errors } } = form;
  const hasCost = watch('additional.cost.hasCost');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Additional Details</h2>
        <p className="text-slate-600">Optional information to enhance your event.</p>
      </div>

      {/* Host Information */}
      <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Host Information *</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Host Name *</label>
            <input
              {...register('host.name')}
              type="text"
              placeholder="Mike Johnson"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            {errors.host?.name && (
              <p className="mt-1 text-sm text-red-600">
                {errors.host.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Host Email *</label>
            <input
              {...register('host.email')}
              type="email"
              placeholder="mike@example.com"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            {errors.host?.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.host.email.message}
              </p>
            )}
            <p className="mt-1 text-sm text-slate-500">For event management and notifications</p>
          </div>
        </div>
      </div>

      {/* Event Cost */}
      <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Event Cost</h3>

        <label className="flex items-center gap-3 mb-4">
          <input {...register('additional.cost.hasCost')} type="checkbox" className="w-5 h-5 text-purple-600 rounded" />
          <span className="text-sm font-medium">This event has a cost</span>
        </label>

        {hasCost && (
          <div className="ml-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Amount (per person)</label>
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium text-slate-700">$</span>
                <input
                  {...register('additional.cost.amount', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="25.00"
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Cost Description</label>
              <input
                {...register('additional.cost.description')}
                type="text"
                placeholder="Covers food, drinks, and venue"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Photo Gallery */}
      <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
        <label className="flex items-start gap-3">
          <input {...register('additional.enablePhotoGallery')} type="checkbox" className="mt-1 w-5 h-5 text-purple-600 rounded" />
          <div>
            <span className="block text-sm font-medium text-slate-900">Create private photo gallery</span>
            <span className="block text-sm text-slate-600 mt-1">
              Guests can view and download photos after the event
            </span>
          </div>
        </label>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> You can add a detailed schedule/agenda after creating the event in your dashboard.
        </p>
      </div>
    </div>
  );
}
