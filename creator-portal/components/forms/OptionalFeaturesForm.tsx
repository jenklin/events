'use client';

import { UseFormReturn } from 'react-hook-form';
import { EventFormData, foodCategories } from '@/lib/eventSchema';

export default function OptionalFeaturesForm({ form }: { form: UseFormReturn<EventFormData> }) {
  const { register, watch } = form;

  const potluckEnabled = watch('potluck.enabled');
  const musicEnabled = watch('music.enabled');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Optional Features</h2>
        <p className="text-slate-600">Add special features to make your event unique!</p>
      </div>

      {/* Potluck */}
      <div className="p-6 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border-2 border-orange-200">
        <div className="flex items-start gap-3 mb-4">
          <input
            {...register('potluck.enabled')}
            type="checkbox"
            className="mt-1 w-6 h-6 text-orange-600 rounded focus:ring-orange-500"
          />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900">🍕 Potluck Food Tracking</h3>
            <p className="text-sm text-slate-600 mt-1">
              Coordinate who brings what food - perfect for community gatherings!
            </p>
          </div>
        </div>

        {potluckEnabled && (
          <div className="mt-4 ml-9 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Food Categories
              </label>
              <div className="grid grid-cols-2 gap-2">
                {foodCategories.map((category) => (
                  <label key={category} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-orange-600 rounded" />
                    {category}
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2">
              <input {...register('potluck.showWhatOthersBring')} type="checkbox" className="w-4 h-4 text-orange-600 rounded" />
              <span className="text-sm">Show what others are bringing (avoids duplicates)</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Instructions for Guests</label>
              <input
                {...register('potluck.instructions')}
                type="text"
                placeholder="Please bring a dish to serve 8-10 people!"
                className="w-full px-4 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Music Contributions */}
      <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
        <div className="flex items-start gap-3 mb-4">
          <input
            {...register('music.enabled')}
            type="checkbox"
            className="mt-1 w-6 h-6 text-purple-600 rounded focus:ring-purple-500"
          />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900">🎵 Music Contributions</h3>
            <p className="text-sm text-slate-600 mt-1">
              Let guests request songs OR create custom AI-generated songs!
            </p>
          </div>
        </div>

        {musicEnabled && (
          <div className="mt-4 ml-9 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Contribution Type</label>
              <select {...register('music.type')} className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                <option value="both">Song requests OR AI-generated (let guests choose)</option>
                <option value="song_request">Song requests only</option>
                <option value="custom_song">AI-generated songs only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">AI Music Service</label>
              <select {...register('music.service')} className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                <option value="suno">Suno AI</option>
                <option value="udio">Udio</option>
                <option value="custom">Custom API</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Max songs per guest</label>
              <input {...register('music.maxSongsPerGuest', { valueAsNumber: true })} type="number" min="1" max="5" defaultValue={1} className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Instructions for Guests</label>
              <input
                {...register('music.instructions')}
                type="text"
                placeholder="Request a song OR write a prompt for a custom AI song!"
                className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        )}
      </div>

      {(potluckEnabled || musicEnabled) && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            ✨ <strong>Amazing!</strong> You've enabled {potluckEnabled && musicEnabled ? 'both potluck and music features' : potluckEnabled ? 'potluck tracking' : 'music contributions'}. Your event will be extra special!
          </p>
        </div>
      )}
    </div>
  );
}
