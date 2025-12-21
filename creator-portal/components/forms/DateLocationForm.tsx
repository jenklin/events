'use client';

import { UseFormReturn } from 'react-hook-form';
import { EventFormData } from '@/lib/eventSchema';

interface DateLocationFormProps {
  form: UseFormReturn<EventFormData>;
}

export default function DateLocationForm({ form }: DateLocationFormProps) {
  const { register, watch, formState: { errors } } = form;
  const hideLocation = watch('dateLocation.hideLocationUntilRsvp');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">When & Where</h2>
        <p className="text-slate-600">
          Tell guests when and where your event will take place.
        </p>
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Date *
          </label>
          <input
            {...register('dateLocation.date')}
            type="date"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
          {errors.dateLocation?.date && (
            <p className="mt-1 text-sm text-red-600">
              {errors.dateLocation.date.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Start Time *
          </label>
          <input
            {...register('dateLocation.startTime')}
            type="time"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
          {errors.dateLocation?.startTime && (
            <p className="mt-1 text-sm text-red-600">
              {errors.dateLocation.startTime.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            End Time
          </label>
          <input
            {...register('dateLocation.endTime')}
            type="time"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
          <p className="mt-1 text-sm text-slate-500">Optional</p>
        </div>
      </div>

      {/* Timezone */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Timezone
        </label>
        <select
          {...register('dateLocation.timezone')}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        >
          <option value="America/New_York">Eastern Time (ET)</option>
          <option value="America/Chicago">Central Time (CT)</option>
          <option value="America/Denver">Mountain Time (MT)</option>
          <option value="America/Los_Angeles">Pacific Time (PT)</option>
          <option value="America/Anchorage">Alaska Time (AKT)</option>
          <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
          <option value="Europe/London">London (GMT/BST)</option>
          <option value="Europe/Paris">Paris (CET)</option>
          <option value="Asia/Tokyo">Tokyo (JST)</option>
          <option value="Australia/Sydney">Sydney (AEDT)</option>
        </select>
      </div>

      {/* Venue Name */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Venue Name *
        </label>
        <input
          {...register('dateLocation.venueName')}
          type="text"
          placeholder="The Rooftop Garden"
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        />
        {errors.dateLocation?.venueName && (
          <p className="mt-1 text-sm text-red-600">
            {errors.dateLocation.venueName.message}
          </p>
        )}
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Address *
        </label>
        <input
          {...register('dateLocation.address')}
          type="text"
          placeholder="123 Park Avenue, New York, NY 10016"
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        />
        {errors.dateLocation?.address && (
          <p className="mt-1 text-sm text-red-600">
            {errors.dateLocation.address.message}
          </p>
        )}
      </div>

      {/* Venue Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Venue Description
        </label>
        <textarea
          {...register('dateLocation.description')}
          rows={3}
          placeholder="Beautiful rooftop venue with panoramic city views..."
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Nearest Station */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Nearest Public Transit
        </label>
        <input
          {...register('dateLocation.nearestStation')}
          type="text"
          placeholder="Grand Central - 42nd Street (5 min walk)"
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        />
        <p className="mt-1 text-sm text-slate-500">
          Help guests find the venue easily
        </p>
      </div>

      {/* Hide Location Option */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            {...register('dateLocation.hideLocationUntilRsvp')}
            type="checkbox"
            className="mt-1 w-5 h-5 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
          />
          <div>
            <span className="block text-sm font-medium text-slate-900">
              Hide location until guests RSVP
            </span>
            <span className="block text-sm text-slate-600 mt-1">
              Great for surprise parties! The full address will only be revealed after guests confirm their attendance.
            </span>
          </div>
        </label>
      </div>

      {hideLocation && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ Location details will be hidden on the event page. Guests must RSVP to see the full address.
          </p>
        </div>
      )}
    </div>
  );
}
