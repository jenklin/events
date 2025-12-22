'use client';

/**
 * Event Page Client Component
 * Handles RSVP form and interactions
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EventPageProps {
  event: any; // Event data from server component
}

export default function EventPage({ event }: EventPageProps) {
  const [selectedStatus, setSelectedStatus] = useState<'going' | 'maybe' | 'not_going' | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [plusOnes, setPlusOnes] = useState(0);
  const [plusOneNames, setPlusOneNames] = useState<string[]>([]);
  const [bringingFood, setBringingFood] = useState(false);
  const [foodItems, setFoodItems] = useState<any[]>([]);
  const [songRequests, setSongRequests] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasRsvp, setHasRsvp] = useState(false);
  const [showLocationDetails, setShowLocationDetails] = useState(!event.location.hideUntilRsvp);

  // Check for existing RSVP
  const checkExistingRsvp = async (email: string) => {
    try {
      const response = await fetch(`/api/events/${event.id}/rsvp?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (data.hasRsvp) {
        setHasRsvp(true);
        setSelectedStatus(data.rsvp.status);
        setGuestName(data.rsvp.guestName);
        setPlusOnes(data.rsvp.plusOnes || 0);
        setPlusOneNames(data.rsvp.plusOneNames || []);
        setBringingFood(data.rsvp.bringingFood || false);
        setFoodItems(data.rsvp.foodItems || []);
        setSongRequests(data.rsvp.musicContribution?.songRequests || []);

        if (data.rsvp.status === 'going' || data.rsvp.approvalStatus === 'approved') {
          setShowLocationDetails(true);
        }
      }
    } catch (error) {
      console.error('Error checking RSVP:', error);
    }
  };

  const handleEmailBlur = () => {
    if (guestEmail && guestEmail.includes('@')) {
      checkExistingRsvp(guestEmail);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch(`/api/events/${event.id}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName,
          guestEmail,
          guestPhone,
          status: selectedStatus,
          plusOnes,
          plusOneNames,
          bringingFood,
          foodItems,
          musicContribution: {
            type: 'song_request',
            songRequests,
          },
          notes,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitMessage({
          type: 'success',
          text: data.message || 'RSVP submitted successfully!',
        });

        if (data.requiresApproval) {
          setSubmitMessage({
            type: 'success',
            text: data.approvalMessage,
          });
        } else if (selectedStatus === 'going') {
          setShowLocationDetails(true);
        }
      } else {
        setSubmitMessage({
          type: 'error',
          text: data.error || 'Failed to submit RSVP',
        });
      }
    } catch (error) {
      setSubmitMessage({
        type: 'error',
        text: 'An error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Cover Image */}
      {event.coverImage.url && (
        <div className="w-full h-64 md:h-96 bg-cover bg-center" style={{ backgroundImage: `url(${event.coverImage.url})` }} />
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Event Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">{event.title}</h1>
          {event.description && (
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">{event.description}</p>
          )}
        </div>

        {/* Event Details Card */}
        <Card className="p-6 mb-6">
          <div className="space-y-4">
            {/* Date & Time */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">When</h3>
              <p className="text-slate-700">
                {formatDate(event.date)}
                <br />
                {formatTime(event.startTime)}
                {event.endTime && ` - ${formatTime(event.endTime)}`}
                <span className="text-sm text-slate-500 ml-2">({event.timezone})</span>
              </p>
            </div>

            {/* Location */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Where</h3>
              {showLocationDetails ? (
                <div className="text-slate-700">
                  {event.location.name && <p className="font-medium">{event.location.name}</p>}
                  {event.location.address && <p>{event.location.address}</p>}
                  {event.location.description && <p className="text-sm mt-1">{event.location.description}</p>}
                  {event.location.nearestStation && (
                    <p className="text-sm text-slate-500 mt-1">Nearest station: {event.location.nearestStation}</p>
                  )}
                  {event.location.googleMapsLink && (
                    <a
                      href={event.location.googleMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm mt-1 inline-block"
                    >
                      View on Google Maps →
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-slate-500 italic">Location details will be shared after you RSVP</p>
              )}
            </div>

            {/* Host */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Hosted by</h3>
              <p className="text-slate-700">{event.host.name}</p>
            </div>

            {/* Cost */}
            {event.cost.hasCost && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Cost</h3>
                <p className="text-slate-700">
                  {event.cost.amount} {event.cost.currency}
                  {event.cost.perPerson && ' per person'}
                  {event.cost.description && (
                    <span className="text-sm text-slate-500 block mt-1">{event.cost.description}</span>
                  )}
                </p>
              </div>
            )}

            {/* Capacity */}
            {event.capacity.enabled && event.visibility.showGuestCount && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Capacity</h3>
                <div className="flex items-center gap-2">
                  <Badge variant={event.capacity.isAtCapacity ? 'destructive' : 'default'}>
                    {event.capacity.currentGuests} / {event.capacity.maxGuests} guests
                  </Badge>
                  {event.capacity.isAtCapacity && event.capacity.enableWaitlist && (
                    <span className="text-sm text-amber-600">Waitlist available</span>
                  )}
                </div>
              </div>
            )}

            {/* RSVP Stats */}
            {event.visibility.showGuestCount && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">RSVPs</h3>
                <div className="flex gap-4">
                  <Badge variant="default">{event.stats.going} Going</Badge>
                  <Badge variant="secondary">{event.stats.maybe} Maybe</Badge>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* RSVP Form */}
        {event.rsvp.enabled && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              {hasRsvp ? 'Update Your RSVP' : 'RSVP'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Will you attend?</label>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={selectedStatus === 'going' ? 'default' : 'outline'}
                    onClick={() => setSelectedStatus('going')}
                    className="flex-1"
                  >
                    ✅ Going
                  </Button>
                  <Button
                    type="button"
                    variant={selectedStatus === 'maybe' ? 'default' : 'outline'}
                    onClick={() => setSelectedStatus('maybe')}
                    className="flex-1"
                  >
                    🤔 Maybe
                  </Button>
                  <Button
                    type="button"
                    variant={selectedStatus === 'not_going' ? 'default' : 'outline'}
                    onClick={() => setSelectedStatus('not_going')}
                    className="flex-1"
                  >
                    ❌ Can't Go
                  </Button>
                </div>
              </div>

              {/* Guest Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    onBlur={handleEmailBlur}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Plus Ones */}
              {event.rsvp.allowPlusOnes && selectedStatus === 'going' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Plus Ones (max {event.rsvp.maxPlusOnes})
                  </label>
                  <input
                    type="number"
                    value={plusOnes}
                    onChange={(e) => setPlusOnes(Math.max(0, Math.min(event.rsvp.maxPlusOnes, parseInt(e.target.value) || 0)))}
                    min="0"
                    max={event.rsvp.maxPlusOnes}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any questions or dietary restrictions?"
                />
              </div>

              {/* Submit Message */}
              {submitMessage && (
                <div
                  className={`p-4 rounded-md ${
                    submitMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}
                >
                  {submitMessage.text}
                </div>
              )}

              {/* Submit Button */}
              <Button type="submit" disabled={!selectedStatus || isSubmitting} className="w-full">
                {isSubmitting ? 'Submitting...' : hasRsvp ? 'Update RSVP' : 'Submit RSVP'}
              </Button>

              {event.rsvp.requireApproval && (
                <p className="text-sm text-slate-500 text-center">
                  Note: Your RSVP will require host approval
                </p>
              )}
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
