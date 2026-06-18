'use client';

import { UseFormReturn } from 'react-hook-form';
import { EventFormData, getEventUrl } from '../lib/eventSchema';

export default function EventPreview({ form }: { form: UseFormReturn<EventFormData> }) {
  const data = form.watch();

  const eventUrl = getEventUrl(
    data.urlBranding.customSlug,
    data.urlBranding.customSubdomain
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Preview Your Event</h2>
        <p className="text-paradigm-muted">
          Review your event details before publishing.
        </p>
      </div>

      {/* Event Preview Card */}
      <div className="border-2 border-white/10 rounded-lg overflow-hidden">
        {/* Cover Image */}
        <div className="aspect-video bg-gradient-to-br from-paradigm-purple to-paradigm-teal flex items-center justify-center">
          <div className="text-center text-white p-8">
            <h1 className="text-4xl font-bold mb-2">{data.eventBasics.title || 'Your Event Title'}</h1>
            {data.eventBasics.coverImage.theme && (
              <p className="text-lg capitalize">Theme: {data.eventBasics.coverImage.theme}</p>
            )}
          </div>
        </div>

        {/* Event Details */}
        <div className="p-8 bg-paradigm-panel">
          <div className="space-y-6">
            {/* Date & Time */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">When</h3>
              <p className="text-paradigm-text">
                {data.dateLocation.date ? new Date(data.dateLocation.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Date not set'}
              </p>
              <p className="text-paradigm-text">
                {data.dateLocation.startTime || 'Time not set'}
                {data.dateLocation.endTime && ` - ${data.dateLocation.endTime}`}
                {' '}{data.dateLocation.timezone && `(${data.dateLocation.timezone})`}
              </p>
            </div>

            {/* Location */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Where</h3>
              {data.dateLocation.hideLocationUntilRsvp ? (
                <p className="text-paradigm-muted italic">Location will be revealed after RSVP</p>
              ) : (
                <>
                  <p className="text-paradigm-text font-medium">{data.dateLocation.venueName || 'Venue not set'}</p>
                  <p className="text-paradigm-text">{data.dateLocation.address || 'Address not set'}</p>
                </>
              )}
            </div>

            {/* Description */}
            {data.eventBasics.description && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">About</h3>
                <p className="text-paradigm-text">{data.eventBasics.description}</p>
              </div>
            )}

            {/* Cost */}
            {data.additional.cost.hasCost && (
              <div className="p-4 bg-paradigm-gold/10 rounded-lg border border-paradigm-gold/30">
                <p className="font-medium text-paradigm-gold">
                  ${data.additional.cost.amount || '0'} per person
                </p>
                {data.additional.cost.description && (
                  <p className="text-sm text-paradigm-gold mt-1">{data.additional.cost.description}</p>
                )}
              </div>
            )}

            {/* Capacity */}
            {data.guestSettings.capacity.enabled && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  Limited to {data.guestSettings.capacity.maxGuests} guests
                  {data.guestSettings.capacity.enableWaitlist && ' (waitlist available)'}
                </p>
              </div>
            )}

            {/* Special Features */}
            <div className="flex flex-wrap gap-2">
              {data.potluck?.enabled && (
                <span className="px-3 py-1 bg-paradigm-coral/15 text-paradigm-coral text-sm rounded-full">
                  Potluck
                </span>
              )}
              {data.music?.enabled && (
                <span className="px-3 py-1 bg-paradigm-purple/15 text-purple-800 text-sm rounded-full">
                  Music Contributions
                </span>
              )}
              {data.additional.enablePhotoGallery && (
                <span className="px-3 py-1 bg-paradigm-coral/15 text-paradigm-coral text-sm rounded-full">
                  Photo Gallery
                </span>
              )}
              {data.guestSettings.plusOnes.allowed && (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  +{data.guestSettings.plusOnes.maxPerGuest} Plus Ones
                </span>
              )}
            </div>

            {/* RSVP Button (Preview) */}
            <button className="w-full py-4 bg-gradient-to-r from-paradigm-purple to-paradigm-coral text-white font-bold text-lg rounded-lg">
              RSVP Now
            </button>
          </div>
        </div>
      </div>

      {/* Event URL */}
      <div className="p-6 bg-paradigm-deep-black rounded-lg border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-2">Your Event URL</h3>
        <p className="text-paradigm-purple-light font-mono break-all text-lg">{eventUrl}</p>
        <p className="text-sm text-paradigm-muted mt-2">
          Share this link with your guests!
        </p>
      </div>

      {/* Summary */}
      <div className="p-6 bg-green-50 rounded-lg border border-green-200">
        <h3 className="text-lg font-semibold text-green-900 mb-2">Ready to Publish!</h3>
        <p className="text-sm text-green-800">
          Your event is configured and ready. Click "Publish Event" below to make it live!
        </p>
        <ul className="mt-3 space-y-1 text-sm text-green-800">
          <li>Event page will be created</li>
          <li>QR code will be generated</li>
          {data.additional.enablePhotoGallery && <li>Photo gallery will be set up</li>}
          <li>You'll get a dashboard to manage RSVPs</li>
        </ul>
      </div>
    </div>
  );
}
