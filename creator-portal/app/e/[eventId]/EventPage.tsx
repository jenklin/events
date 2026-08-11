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

interface PlusOneContact {
  name: string;
  phone: string;
  kakao: string;
}

// Map links for a location query. In Korea, Kakao/Naver are the maps guests
// actually navigate with; Google is the fallback for visitors.
const mapLinksFor = (query: string, queryKo?: string) => [
  { label: 'Kakao Map', href: `https://map.kakao.com/?q=${encodeURIComponent(queryKo || query)}` },
  { label: 'Naver Map', href: `https://map.naver.com/p/search/${encodeURIComponent(queryKo || query)}` },
  { label: 'Google Maps', href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` },
];

export default function EventPage({ event }: EventPageProps) {
  const [selectedStatus, setSelectedStatus] = useState<'going' | 'maybe' | 'not_going' | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState(event.verifiedEmail || '');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestKakao, setGuestKakao] = useState('');
  const [plusOnes, setPlusOnes] = useState(0);
  const [plusOneContacts, setPlusOneContacts] = useState<PlusOneContact[]>([]);
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
        setGuestPhone(data.rsvp.guestPhone || '');
        setGuestKakao(data.rsvp.customResponses?.kakaoId || '');
        const count = data.rsvp.plusOnes || 0;
        setPlusOnes(count);
        const savedContacts: PlusOneContact[] = data.rsvp.customResponses?.plusOneContacts
          || (data.rsvp.plusOneNames || []).map((name: string) => ({ name, phone: '', kakao: '' }));
        setPlusOneContacts(
          Array.from({ length: count }, (_, i) => savedContacts[i] || { name: '', phone: '', kakao: '' })
        );
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
          plusOneNames: plusOneContacts.map((c) => c.name).filter(Boolean),
          customResponses: {
            ...(guestKakao ? { kakaoId: guestKakao } : {}),
            ...(plusOnes > 0 ? { plusOneContacts } : {}),
          },
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
    const opts: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    // Date-only values ("2026-12-25") must not hit the Date UTC parser:
    // toLocaleDateString then shifts to the viewer's zone, so anyone west of
    // UTC sees the previous day. Parse them as a local calendar date instead.
    const d = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00`) : new Date(date);
    // Bilingual audiences (e.g. Seoul family events) show the date in a second
    // locale as well, each on its own line so neither date wraps mid-phrase.
    const lines = [d.toLocaleDateString(event.locale || 'en-US', opts)];
    if (event.secondaryLocale) {
      lines.push(d.toLocaleDateString(event.secondaryLocale, opts));
    }
    return lines.map((line) => (
      <span key={line} className="block">{line}</span>
    ));
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    // Only convert plain 24h "HH:MM" / "HH:MM:SS" values (Postgres time
    // columns include seconds); pass through anything already
    // human-formatted ("5:30 PM", "Midnight") untouched.
    if (!/^\d{1,2}:\d{2}(:\d{2})?$/.test(time)) return time;
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    // Non-breaking space so "11:59 PM" never wraps between number and meridiem
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // White-label branding (template-engine contract). Events may re-theme the
  // page via branding.colors and replace/hide platform branding entirely.
  const branding = event.branding || {};
  const hidePlatform = branding.hidePlatformBranding === true;
  const brandVars = branding.colors?.primary
    ? ({
        '--brand-primary': branding.colors.primary,
        '--brand-primary-light': `color-mix(in srgb, ${branding.colors.primary} 55%, white)`,
        ...(branding.colors.secondary
          ? {
              '--brand-secondary': branding.colors.secondary,
              '--brand-secondary-light': `color-mix(in srgb, ${branding.colors.secondary} 45%, white)`,
            }
          : {}),
      } as React.CSSProperties)
    : undefined;

  return (
    <div
      style={brandVars}
      lang={event.locale ? event.locale.split('-')[0] : undefined}
      className="min-h-screen supports-[height:100dvh]:min-h-[100dvh] bg-gradient-to-br from-paradigm-deep-black via-[#0b0a14] to-paradigm-deep-black text-paradigm-text"
    >
      {/* Header / Nav */}
      <header className="sticky top-0 z-50 bg-paradigm-panel/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt={branding.organizationName || event.title} className="h-8 w-auto" />
          ) : branding.organizationName ? (
            <span className="font-semibold text-white">{branding.organizationName}</span>
          ) : hidePlatform ? (
            <span aria-hidden className="h-8" />
          ) : (
            <a href="/" className="flex items-center hover:scale-105 transition-transform">
              <img src="/logo-purple.svg" alt="cloudpeers" className="h-8 w-auto" />
            </a>
          )}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-paradigm-muted">
            <a href="#details" onClick={scrollTo('details')} className="hover:text-paradigm-purple-light transition-colors">Details</a>
            {event.schedule?.length > 0 && (
              <a href="#schedule" onClick={scrollTo('schedule')} className="hover:text-paradigm-purple-light transition-colors">Schedule</a>
            )}
            <a href="#venue" onClick={scrollTo('venue')} className="hover:text-paradigm-purple-light transition-colors">Venue</a>
            {event.mapPoints?.length > 0 && (
              <a href="#map" onClick={scrollTo('map')} className="hover:text-paradigm-purple-light transition-colors">Map</a>
            )}
            {event.rsvp.enabled && (
              <a href="#rsvp" onClick={scrollTo('rsvp')} className="hover:text-paradigm-purple-light transition-colors">RSVP</a>
            )}
            <a href="#qr" onClick={scrollTo('qr')} className="hover:text-paradigm-purple-light transition-colors">QR</a>
            {event.galleryAlbumId && (
              <a href={`/gallery/a/${event.galleryAlbumId}`} className="hover:text-paradigm-purple-light transition-colors">Gallery</a>
            )}
          </nav>
        </div>
        {/* Mobile anchor nav — horizontally scrollable pill bar */}
        <nav className="md:hidden flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(
            [
              ['details', 'Details'],
              ...(event.schedule?.length > 0 ? [['schedule', 'Schedule']] : []),
              ['venue', 'Venue'],
              ...(event.mapPoints?.length > 0 ? [['map', 'Map']] : []),
              ...(event.rsvp.enabled ? [['rsvp', 'RSVP']] : []),
              ['qr', 'QR'],
              ...(event.galleryAlbumId ? [['gallery', 'Gallery']] : []),
            ] as Array<[string, string]>
          ).map(([id, label]) => (
            <a
              key={id}
              href={id === 'gallery' && event.galleryAlbumId ? `/gallery/a/${event.galleryAlbumId}` : `#${id}`}
              onClick={id === 'gallery' ? undefined : scrollTo(id)}
              className="shrink-0 whitespace-nowrap px-3 py-2 min-h-[40px] inline-flex items-center rounded-full bg-white/5 border border-white/10 text-sm text-paradigm-text"
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      {/* Cover Image */}
      {event.coverImage.url && (
        <div className="w-full h-64 md:h-96 bg-cover bg-center" style={{ backgroundImage: `url(${event.coverImage.url})` }} />
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 whitespace-pre-line [text-wrap:balance]">{event.title}</h1>
          {event.description && (
            <p className="text-lg text-paradigm-muted max-w-2xl mx-auto whitespace-pre-line">{event.description}</p>
          )}

          {/* Quick facts */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mt-6 text-paradigm-text">
            {event.date && (
              <span className="inline-flex items-start gap-2 text-left max-w-full">
                <svg className="w-5 h-5 shrink-0 mt-0.5 text-paradigm-purple-light" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                <span>{formatDate(event.date)}</span>
              </span>
            )}
            {event.startTime && (
              <span className="inline-flex items-start gap-2 text-left max-w-full">
                <svg className="w-5 h-5 shrink-0 mt-0.5 text-paradigm-purple-light" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                <span className="whitespace-nowrap">{formatTime(event.startTime)}{event.endTime && ` – ${formatTime(event.endTime)}`}</span>
              </span>
            )}
            {(event.location.name || event.location.address) && showLocationDetails && (
              <span className="inline-flex items-start gap-2 text-left max-w-full">
                <svg className="w-5 h-5 shrink-0 mt-0.5 text-paradigm-purple-light" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 21s-7-5.5-7-11a7 7 0 1114 0c0 5.5-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
                {event.location.name || event.location.address}
              </span>
            )}
          </div>

          {event.rsvp.enabled && (
            <div className="mt-8">
              <Button type="button" onClick={scrollTo('rsvp')} className="h-14 px-8 text-lg bg-paradigm-purple hover:opacity-90 text-white">RSVP Now</Button>
            </div>
          )}
        </div>

        {/* Event Details Card */}
        <Card id="details" className="p-6 mb-6 scroll-mt-24">
          <div className="space-y-4">
            {/* Date & Time */}
            <div>
              <h3 className="font-semibold text-white mb-2">When</h3>
              <p className="text-paradigm-text">
                {formatDate(event.date)}
                {formatTime(event.startTime)}
                {event.endTime && ` – ${formatTime(event.endTime)}`}
                <span className="text-sm text-paradigm-muted ml-2">({event.timezone})</span>
              </p>
            </div>

            {/* Location */}
            <div id="venue" className="scroll-mt-24">
              <h3 className="font-semibold text-white mb-2">Where</h3>
              {showLocationDetails ? (
                <div className="text-paradigm-text">
                  {event.location.name && <p className="font-medium">{event.location.name}</p>}
                  {event.location.address && <p>{event.location.address}</p>}
                  {event.location.description && <p className="text-sm mt-1">{event.location.description}</p>}
                  {event.location.nearestStation && (
                    <p className="text-sm text-paradigm-muted mt-1">
                      <span className="inline-flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-paradigm-teal" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="14" rx="2" /><path d="M9 21l-1.5-3M15 21l1.5-3M5 11h14" /></svg>
                        Transit &amp; parking: {event.location.nearestStation}
                      </span>
                    </p>
                  )}
                  {event.location.googleMapsLink && (
                    <a
                      href={event.location.googleMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-3 px-4 py-2.5 min-h-[44px] rounded-lg bg-paradigm-teal/15 text-paradigm-teal-light hover:bg-paradigm-teal/25 transition-colors text-sm font-semibold"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 3h7v7M10 14L21 3M21 14v5a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h5" /></svg>
                      View on Google Maps
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-paradigm-muted italic">Location details will be shared after you RSVP</p>
              )}
            </div>

            {/* Host */}
            <div>
              <h3 className="font-semibold text-white mb-2">Hosted by</h3>
              <p className="text-paradigm-text">{event.host.name}</p>
            </div>

            {/* Cost */}
            {event.cost.hasCost && (
              <div>
                <h3 className="font-semibold text-white mb-2">Cost</h3>
                <p className="text-paradigm-text">
                  {event.cost.amount} {event.cost.currency}
                  {event.cost.perPerson && ' per person'}
                  {event.cost.description && (
                    <span className="text-sm text-paradigm-muted block mt-1">{event.cost.description}</span>
                  )}
                </p>
              </div>
            )}

            {/* Capacity */}
            {event.capacity.enabled && event.visibility.showGuestCount && (
              <div>
                <h3 className="font-semibold text-white mb-2">Capacity</h3>
                <div className="flex items-center gap-2">
                  <Badge variant={event.capacity.isAtCapacity ? 'destructive' : 'default'}>
                    {event.capacity.currentGuests} / {event.capacity.maxGuests} guests
                  </Badge>
                  {event.capacity.isAtCapacity && event.capacity.enableWaitlist && (
                    <span className="text-sm text-paradigm-gold">Waitlist available</span>
                  )}
                </div>
              </div>
            )}

            {/* RSVP Stats */}
            {event.visibility.showGuestCount && (
              <div>
                <h3 className="font-semibold text-white mb-2">RSVPs</h3>
                <div className="flex gap-4">
                  <Badge variant="default">{event.stats.going} Going</Badge>
                  <Badge variant="secondary">{event.stats.maybe} Maybe</Badge>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* What to Expect */}
        {event.whatToExpect && (
          <Card className="p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">What to Expect</h2>
            {event.whatToExpect.intro && (
              <p className="text-paradigm-text mb-4">{event.whatToExpect.intro}</p>
            )}
            {event.whatToExpect.items.length > 0 && (
              <ul className="space-y-3">
                {event.whatToExpect.items.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-paradigm-text">
                    <svg className="w-5 h-5 text-paradigm-teal mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {/* Schedule / Agenda timeline */}
        {event.schedule?.length > 0 && (
          <Card id="schedule" className="p-6 mb-6 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-6">Schedule</h2>
            <div className="space-y-0">
              {event.schedule.map((item: { time?: string; title?: string; description?: string }, i: number) => (
                <div key={i} className="flex gap-4 pb-5 last:pb-0 border-b border-white/5 last:border-0 mb-5 last:mb-0">
                  <div className="shrink-0 w-20 text-paradigm-purple-light font-bold text-sm pt-0.5">
                    {item.time ? formatTime(item.time) : ''}
                  </div>
                  <div className="flex-1 relative pl-4 border-l-2 border-paradigm-purple/30">
                    {item.title && <div className="font-semibold text-white">{item.title}</div>}
                    {item.description && (
                      <div className="text-sm text-paradigm-muted mt-1 whitespace-pre-line">{item.description}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Getting Around — key locations with maps (data-driven via config.mapPoints) */}
        {event.mapPoints?.length > 0 && (
          <Card id="map" className="p-6 mb-6 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-2">Getting Around</h2>
            <p className="text-sm text-paradigm-muted mb-6">
              Tap a location to open it in your maps app.
            </p>
            <div className="space-y-8">
              {event.mapPoints.map(
                (
                  point: {
                    name?: string;
                    label?: string;
                    address?: string;
                    note?: string;
                    query?: string;
                    queryKo?: string;
                    embed?: boolean;
                  },
                  i: number
                ) => (
                  <div key={i}>
                    {point.label && (
                      <div className="text-sm text-paradigm-purple-light font-bold">{point.label}</div>
                    )}
                    {point.name && <div className="font-semibold text-white text-lg">{point.name}</div>}
                    {point.address && (
                      <div className="text-sm text-paradigm-muted mt-1 whitespace-pre-line">{point.address}</div>
                    )}
                    {point.note && (
                      <div className="text-sm text-paradigm-muted italic mt-1">{point.note}</div>
                    )}
                    {point.query && (
                      <>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {mapLinksFor(point.query, point.queryKo).map((link) => (
                            <a
                              key={link.label}
                              href={link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-lg bg-paradigm-teal/15 text-paradigm-teal-light hover:bg-paradigm-teal/25 transition-colors text-sm font-semibold"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 21s-7-5.5-7-11a7 7 0 1114 0c0 5.5-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
                              {link.label}
                            </a>
                          ))}
                        </div>
                        {point.embed !== false && (
                          <div className="mt-3 rounded-xl overflow-hidden border border-white/10">
                            <iframe
                              src={`https://maps.google.com/maps?q=${encodeURIComponent(point.query)}&output=embed&hl=${event.mapLang || 'ko'}`}
                              className="w-full h-56 md:h-72 border-0"
                              loading="lazy"
                              title={`Map: ${point.name || point.query}`}
                              referrerPolicy="no-referrer-when-downgrade"
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              )}
            </div>
          </Card>
        )}

        {/* RSVP Form */}
        {event.rsvp.enabled && (
          <Card id="rsvp" className="p-6 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-6">
              {hasRsvp ? 'Update Your RSVP' : 'RSVP'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-paradigm-text mb-3">Will you attend?</label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <Button
                    type="button"
                    variant={selectedStatus === 'going' ? 'default' : 'outline'}
                    onClick={() => setSelectedStatus('going')}
                    className={`h-12 px-1 sm:px-4 ${selectedStatus === 'going' ? 'bg-paradigm-purple hover:opacity-90 text-white' : ''}`}
                  >
                    Going
                  </Button>
                  <Button
                    type="button"
                    variant={selectedStatus === 'maybe' ? 'default' : 'outline'}
                    onClick={() => setSelectedStatus('maybe')}
                    className={`h-12 px-1 sm:px-4 ${selectedStatus === 'maybe' ? 'bg-paradigm-purple hover:opacity-90 text-white' : ''}`}
                  >
                    Maybe
                  </Button>
                  <Button
                    type="button"
                    variant={selectedStatus === 'not_going' ? 'default' : 'outline'}
                    onClick={() => setSelectedStatus('not_going')}
                    className={`h-12 px-1 sm:px-4 ${selectedStatus === 'not_going' ? 'bg-paradigm-purple hover:opacity-90 text-white' : ''}`}
                  >
                    Can't Go
                  </Button>
                </div>
              </div>

              {/* Guest Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-paradigm-text mb-2">Name *</label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                    autoComplete="name"
                    className="w-full px-3 py-2 bg-paradigm-deep-black/40 text-paradigm-text placeholder:text-paradigm-muted border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-paradigm-purple focus:border-paradigm-purple transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-paradigm-text mb-2">Email *</label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    onBlur={handleEmailBlur}
                    required
                    autoComplete="email"
                    inputMode="email"
                    className="w-full px-3 py-2 bg-paradigm-deep-black/40 text-paradigm-text placeholder:text-paradigm-muted border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-paradigm-purple focus:border-paradigm-purple transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-paradigm-text mb-2">Phone *</label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    required
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="+82 10-0000-0000"
                    className="w-full px-3 py-2 bg-paradigm-deep-black/40 text-paradigm-text placeholder:text-paradigm-muted border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-paradigm-purple focus:border-paradigm-purple transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-paradigm-text mb-2">KakaoTalk ID (optional)</label>
                  <input
                    type="text"
                    value={guestKakao}
                    onChange={(e) => setGuestKakao(e.target.value)}
                    className="w-full px-3 py-2 bg-paradigm-deep-black/40 text-paradigm-text placeholder:text-paradigm-muted border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-paradigm-purple focus:border-paradigm-purple transition-colors"
                  />
                </div>
              </div>

              {/* Plus Ones */}
              {event.rsvp.allowPlusOnes && selectedStatus === 'going' && (
                <div>
                  <label className="block text-sm font-medium text-paradigm-text mb-2">
                    Plus Ones (max {event.rsvp.maxPlusOnes})
                  </label>
                  <input
                    type="number"
                    value={plusOnes}
                    onChange={(e) => {
                      const next = Math.max(0, Math.min(event.rsvp.maxPlusOnes, parseInt(e.target.value) || 0));
                      setPlusOnes(next);
                      setPlusOneContacts((prev) =>
                        Array.from({ length: next }, (_, i) => prev[i] || { name: '', phone: '', kakao: '' })
                      );
                    }}
                    min="0"
                    max={event.rsvp.maxPlusOnes}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-full px-3 py-2 bg-paradigm-deep-black/40 text-paradigm-text placeholder:text-paradigm-muted border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-paradigm-purple focus:border-paradigm-purple transition-colors"
                  />

                  {/* One row per plus-one: name, phone, kakao */}
                  {plusOneContacts.map((contact, i) => (
                    <div key={i} className="mt-3 p-3 rounded-lg border border-white/10 bg-paradigm-deep-black/20">
                      <div className="text-xs font-semibold text-paradigm-muted mb-2">Guest {i + 2}</div>
                      <div className="grid sm:grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={contact.name}
                          onChange={(e) =>
                            setPlusOneContacts((prev) => prev.map((c, j) => (j === i ? { ...c, name: e.target.value } : c)))
                          }
                          placeholder="Name"
                          className="w-full px-3 py-2 bg-paradigm-deep-black/40 text-paradigm-text placeholder:text-paradigm-muted border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-paradigm-purple focus:border-paradigm-purple transition-colors"
                        />
                        <input
                          type="tel"
                          value={contact.phone}
                          onChange={(e) =>
                            setPlusOneContacts((prev) => prev.map((c, j) => (j === i ? { ...c, phone: e.target.value } : c)))
                          }
                          placeholder="Phone (optional)"
                          className="w-full px-3 py-2 bg-paradigm-deep-black/40 text-paradigm-text placeholder:text-paradigm-muted border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-paradigm-purple focus:border-paradigm-purple transition-colors"
                        />
                        <input
                          type="text"
                          value={contact.kakao}
                          onChange={(e) =>
                            setPlusOneContacts((prev) => prev.map((c, j) => (j === i ? { ...c, kakao: e.target.value } : c)))
                          }
                          placeholder="KakaoTalk ID (optional)"
                          className="w-full px-3 py-2 bg-paradigm-deep-black/40 text-paradigm-text placeholder:text-paradigm-muted border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-paradigm-purple focus:border-paradigm-purple transition-colors"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-paradigm-text mb-2">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-paradigm-deep-black/40 text-paradigm-text placeholder:text-paradigm-muted border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-paradigm-purple focus:border-paradigm-purple transition-colors"
                  placeholder="Any questions or dietary restrictions?"
                />
              </div>

              {/* Submit Message */}
              {submitMessage && (
                <div
                  className={`p-4 rounded-md ${
                    submitMessage.type === 'success'
                      ? 'bg-paradigm-teal/15 text-paradigm-teal-light border border-paradigm-teal/30'
                      : 'bg-destructive/15 text-paradigm-coral-light border border-destructive/30'
                  }`}
                >
                  {submitMessage.text}
                </div>
              )}

              {/* Submit Button */}
              <Button type="submit" disabled={!selectedStatus || isSubmitting} className="w-full h-12 bg-paradigm-purple hover:opacity-90 text-white">
                {isSubmitting ? 'Submitting...' : hasRsvp ? 'Update RSVP' : 'Submit RSVP'}
              </Button>

              {event.rsvp.requireApproval && (
                <p className="text-sm text-paradigm-muted text-center">
                  Note: Your RSVP will require host approval
                </p>
              )}
            </form>
          </Card>
        )}

        {/* QR Code + share link */}
        <Card id="qr" className="p-6 mt-6 scroll-mt-24 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Quick Access</h2>
          <p className="text-paradigm-muted mb-6">Scan to open this event on your phone, or share the link.</p>
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-xl inline-block">
              {/* Build-free QR: existing GET /api/events/[id]/qr returns a PNG of the event URL */}
              <img
                src={event.qrImageUrl}
                alt={`QR code linking to ${event.title}`}
                width={192}
                height={192}
                className="w-48 h-48"
              />
            </div>
          </div>
          <p className="text-sm text-paradigm-muted">
            Or share this link:
            <br />
            <code className="inline-block mt-2 bg-paradigm-deep-black/60 text-paradigm-text px-3 py-1 rounded-md break-all">
              {event.eventUrl}
            </code>
          </p>
        </Card>

        {/* Photo Gallery */}
        <Card id="gallery" className="p-6 mt-6 scroll-mt-24 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Event Photos</h2>
          {event.galleryAlbumId ? (
            <>
              <p className="text-paradigm-muted mb-6">View and download photos shared from this event.</p>
              <a
                href={`/gallery/a/${event.galleryAlbumId}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-paradigm-purple to-paradigm-teal text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-paradigm-purple/20 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="m21 17-5-5-9 8" /></svg>
                View Gallery
              </a>
            </>
          ) : (
            <p className="text-paradigm-muted">
              Photos will be available here after the event.
            </p>
          )}
        </Card>
      </div>

      {/* Footer — omitted for white-label events */}
      {!hidePlatform && (
        <footer className="mt-12 border-t border-white/10 bg-paradigm-panel/40">
          <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col items-center gap-4">
            <img src="/logo-purple.svg" alt="cloudpeers" className="h-8 w-auto opacity-80" />
            <p className="text-sm text-paradigm-muted">
              Hosted on{' '}
              <a href="https://events.cloudpeers.com" className="text-paradigm-purple-light hover:underline">
                cloudpeers Events
              </a>
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
