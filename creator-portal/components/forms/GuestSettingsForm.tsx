'use client';

import { UseFormReturn } from 'react-hook-form';
import { EventFormData } from '@/lib/eventSchema';

interface GuestSettingsFormProps {
  form: UseFormReturn<EventFormData>;
}

export default function GuestSettingsForm({ form }: GuestSettingsFormProps) {
  const { register, watch, setValue, formState: { errors } } = form;

  const capacityEnabled = watch('guestSettings.capacity.enabled');
  const plusOnesAllowed = watch('guestSettings.plusOnes.allowed');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Guest Settings</h2>
        <p className="text-paradigm-muted">
          Configure how guests can RSVP and manage attendance.
        </p>
      </div>

      {/* Capacity */}
      <div className="p-6 bg-paradigm-deep-black rounded-lg border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Capacity</h3>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              {...register('guestSettings.capacity.enabled')}
              type="checkbox"
              className="w-5 h-5 text-paradigm-purple-light border-white/10 rounded focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-white">
              Limit number of guests
            </span>
          </label>

          {capacityEnabled && (
            <div className="ml-8 space-y-4">
              <div>
                <label className="block text-sm font-medium text-paradigm-text mb-2">
                  Maximum guests
                </label>
                <input
                  {...register('guestSettings.capacity.maxGuests', { valueAsNumber: true })}
                  type="number"
                  min="1"
                  placeholder="75"
                  className="w-full px-4 py-3 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  {...register('guestSettings.capacity.enableWaitlist')}
                  type="checkbox"
                  className="w-5 h-5 text-paradigm-purple-light border-white/10 rounded focus:ring-purple-500"
                />
                <div>
                  <span className="block text-sm font-medium text-white">
                    Enable waitlist when full
                  </span>
                  <span className="block text-sm text-paradigm-muted">
                    Guests can join a waitlist if capacity is reached
                  </span>
                </div>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Plus Ones */}
      <div className="p-6 bg-paradigm-deep-black rounded-lg border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Plus Ones</h3>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              {...register('guestSettings.plusOnes.allowed')}
              type="checkbox"
              className="w-5 h-5 text-paradigm-purple-light border-white/10 rounded focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-white">
              Allow guests to bring plus ones
            </span>
          </label>

          {plusOnesAllowed && (
            <div className="ml-8">
              <label className="block text-sm font-medium text-paradigm-text mb-2">
                Max plus ones per guest
              </label>
              <select
                {...register('guestSettings.plusOnes.maxPerGuest', { valueAsNumber: true })}
                className="w-full px-4 py-3 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'person' : 'people'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Approval & Settings */}
      <div className="p-6 bg-paradigm-deep-black rounded-lg border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Approval & Sharing</h3>

        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              {...register('guestSettings.approval.requireApproval')}
              type="checkbox"
              className="mt-1 w-5 h-5 text-paradigm-purple-light border-white/10 rounded focus:ring-purple-500"
            />
            <div>
              <span className="block text-sm font-medium text-white">
                Require host approval for RSVPs
              </span>
              <span className="block text-sm text-paradigm-muted mt-1">
                You'll need to approve each RSVP before guests are confirmed
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              {...register('guestSettings.approval.allowMutualInvites')}
              type="checkbox"
              className="mt-1 w-5 h-5 text-paradigm-purple-light border-white/10 rounded focus:ring-purple-500"
            />
            <div>
              <span className="block text-sm font-medium text-white">
                Allow guests to invite their friends
              </span>
              <span className="block text-sm text-paradigm-muted mt-1">
                Guests can share the event and invite their contacts
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              {...register('guestSettings.approval.allowGuestPhotos')}
              type="checkbox"
              className="mt-1 w-5 h-5 text-paradigm-purple-light border-white/10 rounded focus:ring-purple-500"
            />
            <div>
              <span className="block text-sm font-medium text-white">
                Allow guests to upload photos
              </span>
              <span className="block text-sm text-paradigm-muted mt-1">
                Guests can upload profile photos when they RSVP
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 bg-purple-50 border border-white/10 rounded-lg">
        <p className="text-sm text-purple-800">
          <strong>Summary:</strong>{' '}
          {capacityEnabled
            ? `Limited to ${watch('guestSettings.capacity.maxGuests') || '—'} guests`
            : 'Unlimited capacity'}
          {plusOnesAllowed && ` • Plus ones allowed (max ${watch('guestSettings.plusOnes.maxPerGuest')})`}
          {watch('guestSettings.approval.requireApproval') && ' • Requires approval'}
        </p>
      </div>
    </div>
  );
}
