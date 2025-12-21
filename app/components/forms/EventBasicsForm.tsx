'use client';

import { UseFormReturn } from 'react-hook-form';
import { EventFormData, coverThemes } from '@/lib/eventSchema';

interface EventBasicsFormProps {
  form: UseFormReturn<EventFormData>;
}

export default function EventBasicsForm({ form }: EventBasicsFormProps) {
  const { register, watch, setValue, formState: { errors } } = form;
  const selectedCoverType = watch('eventBasics.coverImage.type');
  const selectedTheme = watch('eventBasics.coverImage.theme');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Event Basics</h2>
        <p className="text-slate-600">
          Let's start with the essential details about your event.
        </p>
      </div>

      {/* Event Title */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Event Title *
        </label>
        <input
          {...register('eventBasics.title')}
          type="text"
          placeholder="Sarah's 30th Birthday Bash"
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        {errors.eventBasics?.title && (
          <p className="mt-1 text-sm text-red-600">
            {errors.eventBasics.title.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Description
        </label>
        <textarea
          {...register('eventBasics.description')}
          rows={4}
          placeholder="Join us for an unforgettable celebration of Sarah turning 30! Expect great music, amazing food, and even better company."
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <p className="mt-1 text-sm text-slate-500">
          Tell guests what makes this event special.
        </p>
      </div>

      {/* Cover Image */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Cover Image
        </label>

        {/* Cover Type Selection */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setValue('eventBasics.coverImage.type', 'preset')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                selectedCoverType === 'preset'
                  ? 'border-purple-600 bg-purple-50 text-purple-700'
                  : 'border-slate-300 hover:border-slate-400'
              }`}
            >
              Choose Theme
            </button>
            <button
              type="button"
              onClick={() => setValue('eventBasics.coverImage.type', 'custom')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                selectedCoverType === 'custom'
                  ? 'border-purple-600 bg-purple-50 text-purple-700'
                  : 'border-slate-300 hover:border-slate-400'
              }`}
            >
              Upload Custom
            </button>
          </div>

          {/* Theme Selection */}
          {selectedCoverType === 'preset' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {coverThemes.map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() => setValue('eventBasics.coverImage.theme', theme)}
                  className={`px-4 py-3 rounded-lg border-2 capitalize transition-all ${
                    selectedTheme === theme
                      ? 'border-purple-600 bg-purple-50 text-purple-700 font-medium'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
          )}

          {/* Custom Image Upload */}
          {selectedCoverType === 'custom' && (
            <div>
              <input
                {...register('eventBasics.coverImage.customUrl')}
                type="url"
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <p className="mt-1 text-sm text-slate-500">
                Enter the URL of your custom cover image
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      {selectedTheme && selectedCoverType === 'preset' && (
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-sm font-medium text-slate-700 mb-2">
            Selected Theme: <span className="capitalize text-purple-600">{selectedTheme}</span>
          </p>
          <div className="aspect-video bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
            <p className="text-white text-lg font-semibold capitalize">
              {selectedTheme} Theme Preview
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
