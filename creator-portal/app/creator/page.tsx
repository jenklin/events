'use client';

/**
 * Canonical cloudpeers Event Creator — events.cloudpeers.com/creator
 *
 * A single client component implementing a 2-phase flow:
 *   Phase 1 — Build:   the event-creation form (fields/validation/handlers
 *                      reused from app/create/page.tsx). On "Review" it does
 *                      NOT submit; it advances to Phase 2 with the collected
 *                      formData.
 *   Phase 2 — Review:  a gui-norae-style review dashboard (Overview / Preview /
 *                      Launch tabs). The Launch tab performs the existing
 *                      POST /api/events/create (same apiPayload transform as
 *                      app/create/page.tsx) and then shows a deploy/success
 *                      panel with the live attendee URL, a QR code, copy-link,
 *                      "View event" and "Create another" actions.
 *
 * Brand: cloudpeers paradigm-* dark palette (no red-helicopter colors).
 *
 * QR codes: the create API already returns `qrCodeDataUrl` (a base64 PNG data
 * URL generated server-side with the `qrcode` lib). We render it via <img>,
 * which is the most robust approach and avoids adding a client QR dependency.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Music,
  Utensils,
  Image as ImageIcon,
  Rocket,
  Upload,
  X,
  Eye,
  Settings,
  CheckCircle,
  ArrowLeft,
  Copy,
  ExternalLink,
  Link2,
  PartyPopper,
} from 'lucide-react';

interface EventFormData {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: {
    venueName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    /** Venue coordinate as a Plus Code (creator-entered; decoded offline — never a geocoding API). */
    plusCode: string;
    /** Publish the venue projection to cloudpeers services (title · date · times · venue name · coordinate · URLs; never address/password/guests). */
    publishToServices: boolean;
    hideLocationUntilRsvp: boolean;
  };
  description: string;
  capacity: number | null;
  hostName: string;
  hostEmail: string;
  potluckEnabled: boolean;
  musicEnabled: boolean;
  galleryEnabled: boolean;
  requireApproval: boolean;
  coverImageUrl: string;
  coverImageType: 'preset' | 'custom';
}

type Phase = 'build' | 'review' | 'launched';
type ReviewTab = 'overview' | 'preview' | 'launch';

interface CreateResult {
  eventSlug: string;
  eventUrl: string;
  qrCodeDataUrl?: string;
  galleryUrl?: string | null;
}

// Build the absolute, canonical attendee URL from the slug. The API returns an
// absolute eventUrl already; this is a fallback that mirrors lib/eventSchema
// getEventUrl so the success panel always has a usable link.
function absoluteEventUrl(slug: string, apiUrl?: string): string {
  if (apiUrl && /^https?:\/\//.test(apiUrl)) return apiUrl;
  return `https://events.cloudpeers.com/e/${slug}`;
}

export default function CanonicalCreatorPage() {
  const router = useRouter();

  // ---- flow state ----
  const [phase, setPhase] = useState<Phase>('build');
  const [reviewTab, setReviewTab] = useState<ReviewTab>('overview');

  // ---- request state ----
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [result, setResult] = useState<CreateResult | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    location: {
      venueName: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      plusCode: '',
      publishToServices: false,
      hideLocationUntilRsvp: false,
    },
    description: '',
    capacity: null,
    hostName: '',
    hostEmail: '',
    potluckEnabled: false,
    musicEnabled: false,
    galleryEnabled: false,
    requireApproval: false,
    coverImageUrl: '',
    coverImageType: 'preset',
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateLocation = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      location: { ...prev.location, [field]: value },
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        setFormData((prev) => ({
          ...prev,
          coverImageUrl: base64,
          coverImageType: 'custom',
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview('');
    setFormData((prev) => ({
      ...prev,
      coverImageUrl: '',
      coverImageType: 'preset',
    }));
  };

  // ---- Phase 1 → Phase 2 (no submit, just advance) ----
  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setReviewTab('overview');
    setPhase('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ---- Build the API payload (identical transform to app/create/page.tsx) ----
  const buildApiPayload = () => {
    const slug = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return {
      eventBasics: {
        title: formData.title,
        description: formData.description,
        coverImage:
          formData.coverImageType === 'custom' && formData.coverImageUrl
            ? {
                type: 'custom',
                customUrl: formData.coverImageUrl,
              }
            : {
                type: 'preset',
                theme: 'elegant',
              },
      },
      dateLocation: {
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime || undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        venueName: formData.location.venueName,
        address: `${formData.location.address}, ${formData.location.city}, ${formData.location.state} ${formData.location.zipCode}`,
        description: '',
        hideLocationUntilRsvp: formData.location.hideLocationUntilRsvp,
        // Publish-to-services (creator opt-in) + Plus Code — the fields the published projection and
        // the Events Connector invitation (A2UI moment 7) are built from. Previously only reachable in the
        // retired wizard; restored on the canonical creator 2026-08-29.
        plusCode: formData.location.plusCode.trim() || undefined,
        publishToServices: formData.location.publishToServices,
      },
      host: {
        name: formData.hostName,
        email: formData.hostEmail,
      },
      guestSettings: {
        capacity: {
          enabled: formData.capacity !== null,
          maxGuests: formData.capacity || 100,
          enableWaitlist: false,
        },
        plusOnes: {
          allowed: false,
          maxPerGuest: 0,
        },
        approval: {
          requireApproval: formData.requireApproval,
          allowMutualInvites: false,
          allowGuestPhotos: true,
        },
      },
      rsvpOptions: {
        collectName: true,
        collectEmail: true,
        collectPhone: false,
        customQuestions: [],
      },
      potluck: formData.potluckEnabled
        ? {
            enabled: true,
            categories: ['Appetizer', 'Main Dish', 'Side Dish', 'Dessert', 'Drinks'],
          }
        : undefined,
      music: formData.musicEnabled
        ? {
            enabled: true,
            type: 'both',
            service: 'suno',
            maxSongsPerGuest: 3,
          }
        : undefined,
      visibility: {
        isPublic: true,
        guestList: {
          showGuestNames: true,
          showGuestCount: true,
          showGuestPhotos: false,
          showActivityTimestamps: false,
        },
      },
      urlBranding: {
        customSlug: slug,
        customSubdomain: undefined,
        branding: {
          primaryColor: '#8b5cf6',
          secondaryColor: '#14b8a6',
        },
      },
      additional: {
        enablePhotoGallery: formData.galleryEnabled,
        cost: {
          hasCost: false,
          amount: 0,
        },
      },
    };
  };

  // ---- Launch: perform the existing POST /api/events/create ----
  const handleLaunch = async () => {
    setLoading(true);
    setError('');

    try {
      const apiPayload = buildApiPayload();

      const response = await fetch('/api/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event');
      }

      const data = await response.json();

      if (!data.eventSlug) {
        throw new Error('Event was created but no slug was returned');
      }

      setResult({
        eventSlug: data.eventSlug,
        eventUrl: absoluteEventUrl(data.eventSlug, data.eventUrl),
        qrCodeDataUrl: data.qrCodeDataUrl,
        galleryUrl: data.galleryUrl,
      });
      setPhase('launched');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.eventUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be unavailable; ignore silently */
    }
  };

  const resetAll = () => {
    setPhase('build');
    setReviewTab('overview');
    setResult(null);
    setError('');
    setCopied(false);
    setImagePreview('');
    setFormData({
      title: '',
      date: '',
      startTime: '',
      endTime: '',
      location: { venueName: '', address: '', city: '', state: '', zipCode: '', plusCode: '', publishToServices: false, hideLocationUntilRsvp: false },
      description: '',
      capacity: null,
      hostName: '',
      hostEmail: '',
      potluckEnabled: false,
      musicEnabled: false,
      galleryEnabled: false,
      requireApproval: false,
      coverImageUrl: '',
      coverImageType: 'preset',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ---- formatting helpers (mirror the attendee EventPage) ----
  const formatDate = (date: string) => {
    if (!date) return 'Date not set';
    // Treat the date as a local calendar date.
    const [y, m, d] = date.split('-').map((n) => parseInt(n, 10));
    const dt = new Date(y, (m || 1) - 1, d || 1);
    return dt.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const enabledFeatures = [
    formData.potluckEnabled && 'Potluck Tracking',
    formData.musicEnabled && 'Music Requests',
    formData.galleryEnabled && 'Photo Gallery',
    formData.requireApproval && 'RSVP Approval',
  ].filter(Boolean) as string[];

  const fullAddress = [
    formData.location.address,
    formData.location.city,
    [formData.location.state, formData.location.zipCode].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(', ');

  const inputClass =
    'w-full px-4 py-3 bg-paradigm-deep-black/60 text-paradigm-text placeholder:text-paradigm-muted/60 border-2 border-white/10 rounded-xl focus:ring-2 focus:ring-paradigm-purple/30 focus:border-paradigm-purple transition-all';

  // -------------------------------------------------------------------------
  // Shared chrome
  // -------------------------------------------------------------------------
  const Stepper = () => {
    const steps: { key: Phase; label: string }[] = [
      { key: 'build', label: 'Build' },
      { key: 'review', label: 'Review' },
      { key: 'launched', label: 'Launched' },
    ];
    const order: Phase[] = ['build', 'review', 'launched'];
    const currentIdx = order.indexOf(phase);

    return (
      <div className="flex items-center gap-2 sm:gap-3">
        {steps.map((s, i) => {
          const idx = order.indexOf(s.key);
          const done = idx < currentIdx;
          const active = idx === currentIdx;
          return (
            <div key={s.key} className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={[
                    'flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border transition-colors',
                    active
                      ? 'bg-paradigm-purple text-white border-paradigm-purple'
                      : done
                      ? 'bg-paradigm-teal/20 text-paradigm-teal-light border-paradigm-teal/40'
                      : 'bg-paradigm-panel text-paradigm-muted border-white/10',
                  ].join(' ')}
                >
                  {done ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </span>
                <span
                  className={[
                    'text-sm font-semibold hidden sm:inline',
                    active ? 'text-white' : done ? 'text-paradigm-teal-light' : 'text-paradigm-muted',
                  ].join(' ')}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && <span className="w-6 sm:w-10 h-px bg-white/10" />}
            </div>
          );
        })}
      </div>
    );
  };

  const Header = ({ children }: { children?: React.ReactNode }) => (
    <header className="bg-paradigm-panel/80 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-3 group"
            aria-label="cloudpeers home"
          >
            <img src="/logo-multi-color.svg" alt="cloudpeers logo" className="w-10 h-10 sm:w-12 sm:h-12" />
            <div className="text-left">
              <h1 className="text-lg font-semibold text-white leading-tight">Event Creator</h1>
              <p className="text-xs text-paradigm-muted">cloudpeers Events</p>
            </div>
          </button>
          {children}
        </div>
      </div>
    </header>
  );

  // -------------------------------------------------------------------------
  // PHASE 1 — BUILD
  // -------------------------------------------------------------------------
  if (phase === 'build') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-paradigm-deep-black via-[#0b0a14] to-paradigm-deep-black">
        <Header>
          <Stepper />
        </Header>

        <main className="max-w-4xl mx-auto px-6 py-8">
          <form onSubmit={handleReview} className="space-y-8">
            {/* Event Basics */}
            <section className="bg-paradigm-panel rounded-xl p-6 border border-white/10 shadow-sm">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Rocket className="w-6 h-6 text-paradigm-purple" />
                Event Basics
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-paradigm-text mb-2">Event Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    className={inputClass}
                    placeholder="e.g., Summer BBQ 2025"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-paradigm-text mb-2">Description</label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    className={`${inputClass} resize-none`}
                    placeholder="Tell your guests what to expect..."
                  />
                </div>

                {/* Cover Image Upload */}
                <div>
                  <label className="text-sm font-semibold text-paradigm-text mb-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-paradigm-purple" />
                    Cover Image (optional)
                  </label>

                  {!imagePreview ? (
                    <label className="block w-full cursor-pointer">
                      <div className="border-2 border-dashed border-white/10 rounded-xl p-8 hover:border-paradigm-purple hover:bg-paradigm-purple/5 transition-all">
                        <div className="flex flex-col items-center gap-3 text-center">
                          <div className="w-12 h-12 rounded-full bg-paradigm-deep-black/60 flex items-center justify-center">
                            <Upload className="w-6 h-6 text-paradigm-muted" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">Click to upload cover image</p>
                            <p className="text-sm text-paradigm-muted mt-1">PNG, JPG, or GIF up to 10MB</p>
                          </div>
                        </div>
                      </div>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  ) : (
                    <div className="relative w-full aspect-[2/1] rounded-xl overflow-hidden border-2 border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreview} alt="Cover preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-3 right-3 w-8 h-8 bg-paradigm-coral text-white rounded-full flex items-center justify-center hover:bg-paradigm-coral/80 transition-all shadow-lg"
                        aria-label="Remove cover image"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-paradigm-text mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-paradigm-purple" />
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => updateField('date', e.target.value)}
                      className={`${inputClass} [color-scheme:dark]`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-paradigm-text mb-2">
                      Guest Capacity (optional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.capacity || ''}
                      onChange={(e) => updateField('capacity', e.target.value ? parseInt(e.target.value) : null)}
                      className={inputClass}
                      placeholder="No limit"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-paradigm-text mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-paradigm-purple" />
                      Start Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.startTime}
                      onChange={(e) => updateField('startTime', e.target.value)}
                      className={`${inputClass} [color-scheme:dark]`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-paradigm-text mb-2">End Time (optional)</label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => updateField('endTime', e.target.value)}
                      className={`${inputClass} [color-scheme:dark]`}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Location */}
            <section className="bg-paradigm-panel rounded-xl p-6 border border-white/10 shadow-sm">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-paradigm-teal" />
                Location
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-paradigm-text mb-2">Venue Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.location.venueName}
                    onChange={(e) => updateLocation('venueName', e.target.value)}
                    className={inputClass}
                    placeholder="e.g., The Rooftop Garden"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-paradigm-text mb-2">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={formData.location.address}
                    onChange={(e) => updateLocation('address', e.target.value)}
                    className={inputClass}
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-semibold text-paradigm-text mb-2">City *</label>
                    <input
                      type="text"
                      required
                      value={formData.location.city}
                      onChange={(e) => updateLocation('city', e.target.value)}
                      className={inputClass}
                      placeholder="San Francisco"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-paradigm-text mb-2">State *</label>
                    <input
                      type="text"
                      required
                      value={formData.location.state}
                      onChange={(e) => updateLocation('state', e.target.value)}
                      className={inputClass}
                      placeholder="CA"
                      maxLength={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-paradigm-text mb-2">ZIP Code *</label>
                    <input
                      type="text"
                      required
                      value={formData.location.zipCode}
                      onChange={(e) => updateLocation('zipCode', e.target.value)}
                      className={inputClass}
                      placeholder="94102"
                    />
                  </div>
                </div>

                {/* Venue coordinate + publish-to-services (creator opt-in). Address, password and guests never publish. */}
                <div className="pt-2">
                  <label className="block text-sm font-semibold text-paradigm-text mb-2">Venue Plus Code (optional)</label>
                  <input
                    type="text"
                    value={formData.location.plusCode}
                    onChange={(e) => updateLocation('plusCode', e.target.value.toUpperCase())}
                    className={inputClass}
                    placeholder="8Q98HXCR+2X  (Google Maps → share → Plus code)"
                    pattern="[23456789CFGHJMPQRVWX]{8}\+[23456789CFGHJMPQRVWX]{2,7}"
                    title="A full Plus Code, e.g. 8Q98HXCR+2X"
                  />
                  <p className="mt-1 text-xs text-paradigm-muted">Lets cloudpeers labs anchor scenes at your venue. Decoded on our side — no geocoding service is called.</p>
                </div>
                <label className="flex items-start gap-3 cursor-pointer pt-3">
                  <input
                    type="checkbox"
                    checked={formData.location.publishToServices}
                    onChange={(e) => updateLocation('publishToServices', e.target.checked)}
                    className="mt-1 h-4 w-4"
                  />
                  <span className="text-sm text-paradigm-text">
                    <span className="font-semibold">Publish this event to cloudpeers services</span>
                    <span className="block text-xs text-paradigm-muted mt-0.5">Read-only: title · date &amp; times · venue name · coordinate · event link · gallery link. Your address, password and guest list never leave this portal. Labs can then offer &ldquo;Compose at {formData.title || 'your event'}&rdquo;.</span>
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={formData.location.hideLocationUntilRsvp}
                    onChange={(e) => updateLocation('hideLocationUntilRsvp', e.target.checked)}
                    className="mt-1 h-4 w-4"
                  />
                  <span className="text-sm text-paradigm-text">
                    <span className="font-semibold">Hide location until guests RSVP</span>
                    <span className="block text-xs text-paradigm-muted mt-0.5">Also hides the venue and coordinate from cloudpeers services — only title, date and links publish.</span>
                  </span>
                </label>
              </div>
            </section>

            {/* Host Information */}
            <section className="bg-paradigm-panel rounded-xl p-6 border border-white/10 shadow-sm">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Users className="w-6 h-6 text-paradigm-accent" />
                Host Information
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-paradigm-text mb-2">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.hostName}
                    onChange={(e) => updateField('hostName', e.target.value)}
                    className={inputClass}
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-paradigm-text mb-2">Your Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.hostEmail}
                    onChange={(e) => updateField('hostEmail', e.target.value)}
                    className={inputClass}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
            </section>

            {/* Optional Features */}
            <section className="bg-paradigm-panel rounded-xl p-6 border border-white/10 shadow-sm">
              <h2 className="text-2xl font-bold text-white mb-6">Optional Features</h2>

              <div className="space-y-4">
                <label className="flex items-start gap-3 p-4 border-2 border-white/10 rounded-xl hover:border-paradigm-gold/50 hover:bg-paradigm-gold/5 transition-all cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.potluckEnabled}
                    onChange={(e) => updateField('potluckEnabled', e.target.checked)}
                    className="mt-1 w-5 h-5 accent-paradigm-gold rounded focus:ring-2 focus:ring-paradigm-gold/30"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Utensils className="w-5 h-5 text-paradigm-gold" />
                      <span className="font-semibold text-white">Potluck Tracking</span>
                    </div>
                    <p className="text-sm text-paradigm-muted mt-1">
                      Let guests sign up to bring food items organized by category
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 border-2 border-white/10 rounded-xl hover:border-paradigm-teal/50 hover:bg-paradigm-teal/5 transition-all cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.musicEnabled}
                    onChange={(e) => updateField('musicEnabled', e.target.checked)}
                    className="mt-1 w-5 h-5 accent-paradigm-teal rounded focus:ring-2 focus:ring-paradigm-teal/30"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Music className="w-5 h-5 text-paradigm-teal" />
                      <span className="font-semibold text-white">Music Requests</span>
                    </div>
                    <p className="text-sm text-paradigm-muted mt-1">
                      Allow guests to request songs or generate AI-powered custom songs
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 border-2 border-white/10 rounded-xl hover:border-paradigm-purple/60 hover:bg-paradigm-purple/5 transition-all cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.galleryEnabled}
                    onChange={(e) => updateField('galleryEnabled', e.target.checked)}
                    className="mt-1 w-5 h-5 accent-paradigm-purple rounded focus:ring-2 focus:ring-paradigm-purple/30"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-paradigm-purple" />
                      <span className="font-semibold text-white">Photo Gallery</span>
                    </div>
                    <p className="text-sm text-paradigm-muted mt-1">
                      Create a private photo gallery for guests to share memories
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 border-2 border-white/10 rounded-xl hover:border-paradigm-accent/60 hover:bg-paradigm-accent/5 transition-all cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requireApproval}
                    onChange={(e) => updateField('requireApproval', e.target.checked)}
                    className="mt-1 w-5 h-5 accent-paradigm-accent rounded focus:ring-2 focus:ring-paradigm-accent/30"
                  />
                  <div className="flex-1">
                    <span className="font-semibold text-white">Require RSVP Approval</span>
                    <p className="text-sm text-paradigm-muted mt-1">
                      Review and approve RSVPs before guests are confirmed
                    </p>
                  </div>
                </label>
              </div>
            </section>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="flex-1 px-6 py-4 border-2 border-white/10 text-paradigm-text rounded-xl font-semibold hover:bg-paradigm-deep-black transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-4 bg-gradient-to-r from-paradigm-purple to-paradigm-teal text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-paradigm-purple/20 transition-all flex items-center justify-center gap-2"
              >
                Review event
                <Eye className="w-5 h-5" />
              </button>
            </div>
          </form>
        </main>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // PHASE 3 — LAUNCHED (success / deploy panel)
  // -------------------------------------------------------------------------
  if (phase === 'launched' && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-paradigm-deep-black via-[#0b0a14] to-paradigm-deep-black">
        <Header>
          <Stepper />
        </Header>

        <main className="max-w-3xl mx-auto px-6 py-10">
          {/* Success hero */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-paradigm-teal/15 border border-paradigm-teal/30 flex items-center justify-center">
              <PartyPopper className="w-8 h-8 text-paradigm-teal-light" />
            </div>
            <h2 className="font-serif text-3xl font-semibold text-white mb-2">Your event is live!</h2>
            <p className="text-paradigm-muted">
              <span className="text-white font-semibold">{formData.title}</span> has been created and is ready
              to share.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Live URL + actions */}
            <div className="bg-paradigm-panel rounded-xl p-6 border border-white/10">
              <h3 className="text-sm font-semibold text-paradigm-muted uppercase tracking-wide mb-3">
                Live attendee page
              </h3>
              <div className="flex items-center gap-2 px-3 py-3 rounded-lg bg-paradigm-deep-black/60 border border-white/10 mb-4">
                <Link2 className="w-4 h-4 text-paradigm-purple shrink-0" />
                <span className="text-sm text-paradigm-text font-mono truncate">{result.eventUrl}</span>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-white/10 text-paradigm-text font-semibold hover:border-paradigm-purple hover:bg-paradigm-purple/5 transition-all"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy link'}
                </button>
                <a
                  href={result.eventUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-paradigm-purple to-paradigm-teal text-white font-semibold hover:shadow-lg hover:shadow-paradigm-purple/20 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  View event
                </a>
                <button
                  onClick={resetAll}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-paradigm-muted font-semibold hover:text-white transition-all"
                >
                  <Rocket className="w-4 h-4" />
                  Create another
                </button>
              </div>
            </div>

            {/* QR code */}
            <div className="bg-paradigm-panel rounded-xl p-6 border border-white/10 flex flex-col items-center justify-center text-center">
              <h3 className="text-sm font-semibold text-paradigm-muted uppercase tracking-wide mb-4 self-start">
                Scan to RSVP
              </h3>
              {result.qrCodeDataUrl ? (
                <>
                  <div className="bg-white p-3 rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={result.qrCodeDataUrl} alt={`QR code for ${formData.title}`} className="w-44 h-44" />
                  </div>
                  <p className="text-xs text-paradigm-muted mt-3">Point a phone camera at this code</p>
                </>
              ) : (
                <p className="text-sm text-paradigm-muted">QR code unavailable</p>
              )}
            </div>
          </div>

          {/* Deploy checklist */}
          <div className="mt-6 bg-paradigm-panel rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-paradigm-teal-light" />
              Next steps
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3 text-paradigm-text">
                <CheckCircle className="w-4 h-4 text-paradigm-teal-light mt-0.5 shrink-0" />
                Share the link above with your guests via email, chat, or socials.
              </li>
              <li className="flex items-start gap-3 text-paradigm-text">
                <CheckCircle className="w-4 h-4 text-paradigm-teal-light mt-0.5 shrink-0" />
                Print or display the QR code at your venue or on invitations.
              </li>
              <li className="flex items-start gap-3 text-paradigm-text">
                <CheckCircle className="w-4 h-4 text-paradigm-teal-light mt-0.5 shrink-0" />
                {formData.galleryEnabled
                  ? 'Photo gallery is enabled — guests can share memories after the event.'
                  : 'Photo gallery is off. Re-create with it enabled if you want shared photos.'}
              </li>
            </ul>
          </div>
        </main>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // PHASE 2 — REVIEW & LAUNCH (gui-norae style dashboard)
  // -------------------------------------------------------------------------
  const tabs: { key: ReviewTab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <Settings className="w-4 h-4" /> },
    { key: 'preview', label: 'Preview', icon: <Eye className="w-4 h-4" /> },
    { key: 'launch', label: 'Launch', icon: <Rocket className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-paradigm-deep-black via-[#0b0a14] to-paradigm-deep-black">
      <Header>
        <Stepper />
      </Header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Back to edit */}
        <button
          onClick={() => setPhase('build')}
          className="flex items-center gap-2 text-sm font-semibold text-paradigm-muted hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to edit
        </button>

        {/* Quick-action tab cards (gui-norae IA) */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {tabs.map((t) => {
            const active = reviewTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setReviewTab(t.key)}
                className={[
                  'p-5 rounded-xl border text-left transition-all',
                  active
                    ? 'bg-paradigm-purple/10 border-paradigm-purple'
                    : 'bg-paradigm-panel/70 border-white/10 hover:border-paradigm-purple/50',
                ].join(' ')}
              >
                <div
                  className={[
                    'w-9 h-9 rounded-lg flex items-center justify-center mb-3',
                    active ? 'bg-paradigm-purple text-white' : 'bg-paradigm-deep-black/60 text-paradigm-purple',
                  ].join(' ')}
                >
                  {t.icon}
                </div>
                <h3 className="text-base font-semibold text-white">
                  {t.key === 'overview' && 'Review details'}
                  {t.key === 'preview' && 'Preview page'}
                  {t.key === 'launch' && 'Launch event'}
                </h3>
                <p className="text-sm text-paradigm-muted mt-1">
                  {t.key === 'overview' && 'Confirm everything looks right'}
                  {t.key === 'preview' && 'See what attendees will see'}
                  {t.key === 'launch' && 'Publish and get your link'}
                </p>
              </button>
            );
          })}
        </div>

        {/* OVERVIEW */}
        {reviewTab === 'overview' && (
          <section className="bg-paradigm-panel rounded-xl p-8 border border-white/10">
            <h2 className="font-serif text-2xl font-semibold text-paradigm-purple-light mb-6">Event Overview</h2>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <span className="text-sm text-paradigm-muted mb-1 block">Event Name</span>
                <p className="text-lg font-semibold text-white">{formData.title || '—'}</p>
              </div>
              <div>
                <span className="text-sm text-paradigm-muted mb-1 block">Date &amp; Time</span>
                <p className="text-lg font-semibold text-white">
                  {formatDate(formData.date)}
                  {formData.startTime && ` at ${formatTime(formData.startTime)}`}
                  {formData.endTime && ` – ${formatTime(formData.endTime)}`}
                </p>
              </div>
              <div>
                <span className="text-sm text-paradigm-muted mb-1 block">Venue</span>
                <p className="text-lg font-semibold text-white">{formData.location.venueName || '—'}</p>
                {fullAddress && <p className="text-sm text-paradigm-muted mt-1">{fullAddress}</p>}
              </div>
              <div>
                <span className="text-sm text-paradigm-muted mb-1 block">Host</span>
                <p className="text-lg font-semibold text-white">{formData.hostName || '—'}</p>
                {formData.hostEmail && <p className="text-sm text-paradigm-muted mt-1">{formData.hostEmail}</p>}
              </div>
            </div>

            {formData.description && (
              <div className="mb-6">
                <span className="text-sm text-paradigm-muted mb-1 block">Description</span>
                <p className="text-paradigm-text">{formData.description}</p>
              </div>
            )}

            <div className="bg-paradigm-deep-black/50 rounded-lg p-4 border border-white/10">
              <h4 className="font-semibold mb-3 text-paradigm-purple-light">Quick Stats</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">
                    {formData.capacity ?? '∞'}
                  </div>
                  <div className="text-xs text-paradigm-muted">Capacity</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{enabledFeatures.length}</div>
                  <div className="text-xs text-paradigm-muted">Features</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{formData.requireApproval ? 'Yes' : 'No'}</div>
                  <div className="text-xs text-paradigm-muted">Approval</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{formData.galleryEnabled ? '✓' : '—'}</div>
                  <div className="text-xs text-paradigm-muted">Gallery</div>
                </div>
              </div>
            </div>

            {enabledFeatures.length > 0 && (
              <div className="mt-6">
                <span className="text-sm text-paradigm-muted mb-2 block">Enabled features</span>
                <div className="flex flex-wrap gap-2">
                  {enabledFeatures.map((f) => (
                    <span
                      key={f}
                      className="px-3 py-1 rounded-full text-sm font-semibold bg-paradigm-purple/15 text-paradigm-purple-light border border-paradigm-purple/30"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setReviewTab('preview')}
                className="flex-1 px-6 py-3 rounded-xl border-2 border-white/10 text-paradigm-text font-semibold hover:border-paradigm-purple hover:bg-paradigm-purple/5 transition-all flex items-center justify-center gap-2"
              >
                <Eye className="w-5 h-5" />
                Preview attendee page
              </button>
              <button
                onClick={() => setReviewTab('launch')}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-paradigm-purple to-paradigm-teal text-white font-semibold hover:shadow-lg hover:shadow-paradigm-purple/20 transition-all flex items-center justify-center gap-2"
              >
                <Rocket className="w-5 h-5" />
                Go to launch
              </button>
            </div>
          </section>
        )}

        {/* PREVIEW — mirrors the /e/[eventId] attendee layout */}
        {reviewTab === 'preview' && (
          <section className="bg-paradigm-panel rounded-xl p-6 sm:p-8 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl font-semibold text-paradigm-purple-light">Attendee Preview</h2>
              <span className="text-xs text-paradigm-muted px-3 py-1 rounded-full border border-white/10">
                Not yet published
              </span>
            </div>

            {/* Faux attendee page */}
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-paradigm-deep-black to-[#0b0a14]">
              {(imagePreview || formData.coverImageType === 'preset') && (
                <div
                  className="w-full h-40 sm:h-56 bg-cover bg-center"
                  style={{
                    backgroundImage: imagePreview
                      ? `url(${imagePreview})`
                      : 'linear-gradient(135deg, rgba(139,92,246,0.45), rgba(20,184,166,0.35))',
                  }}
                />
              )}
              <div className="max-w-2xl mx-auto px-6 py-8">
                <div className="text-center mb-8">
                  <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                    {formData.title || 'Your Event Title'}
                  </h1>
                  {formData.description && (
                    <p className="text-paradigm-muted max-w-xl mx-auto">{formData.description}</p>
                  )}
                </div>

                <div className="bg-paradigm-panel rounded-xl p-6 border border-white/10 space-y-4">
                  <div>
                    <h3 className="font-semibold text-white mb-1">When</h3>
                    <p className="text-paradigm-text">
                      {formatDate(formData.date)}
                      <br />
                      {formatTime(formData.startTime) || 'Start time'}
                      {formData.endTime && ` – ${formatTime(formData.endTime)}`}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Where</h3>
                    <div className="text-paradigm-text">
                      {formData.location.venueName && <p className="font-medium">{formData.location.venueName}</p>}
                      {fullAddress && <p className="text-sm text-paradigm-muted">{fullAddress}</p>}
                      {!formData.location.venueName && !fullAddress && (
                        <p className="text-sm text-paradigm-muted italic">Location details</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Hosted by</h3>
                    <p className="text-paradigm-text">{formData.hostName || 'Host name'}</p>
                  </div>
                  {formData.capacity !== null && (
                    <div>
                      <h3 className="font-semibold text-white mb-1">Capacity</h3>
                      <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-paradigm-purple/15 text-paradigm-purple-light border border-paradigm-purple/30">
                        0 / {formData.capacity} guests
                      </span>
                    </div>
                  )}
                </div>

                {/* RSVP affordance (visual only in preview) */}
                <div className="bg-paradigm-panel rounded-xl p-6 border border-white/10 mt-6">
                  <h2 className="text-xl font-bold text-white mb-4">RSVP</h2>
                  <div className="flex gap-3">
                    {['Going', 'Maybe', "Can't Go"].map((label) => (
                      <span
                        key={label}
                        className="flex-1 text-center px-3 py-2 rounded-lg border border-white/10 text-paradigm-muted text-sm font-semibold"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                  {formData.requireApproval && (
                    <p className="text-sm text-paradigm-muted text-center mt-4">
                      Note: RSVPs will require host approval
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-paradigm-deep-black/50 rounded-lg border border-white/10">
              <p className="text-sm text-paradigm-muted">
                <Eye className="w-4 h-4 inline mr-2 text-paradigm-purple" />
                This is a styled preview of what attendees will see at{' '}
                <span className="text-paradigm-text font-mono">/e/&lt;your-event&gt;</span>. The live page adds a
                working RSVP form, gallery, potluck and music sections based on the features you enabled.
              </p>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setReviewTab('launch')}
                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-paradigm-purple to-paradigm-teal text-white font-semibold hover:shadow-lg hover:shadow-paradigm-purple/20 transition-all flex items-center justify-center gap-2"
              >
                <Rocket className="w-5 h-5" />
                Looks good — go to launch
              </button>
            </div>
          </section>
        )}

        {/* LAUNCH */}
        {reviewTab === 'launch' && (
          <section className="bg-paradigm-panel rounded-xl p-8 border border-white/10">
            <h2 className="font-serif text-2xl font-semibold text-paradigm-purple-light mb-6">Launch Event</h2>

            {/* Pre-launch checklist (gui-norae Deploy tab) */}
            <div className="space-y-3 mb-8">
              {[
                {
                  title: 'Details reviewed',
                  desc: 'Title, date, time, venue and host all look correct',
                  ok: !!(formData.title && formData.date && formData.startTime && formData.location.venueName && formData.hostName),
                },
                {
                  title: 'Preview checked',
                  desc: 'You viewed the attendee preview',
                  ok: true,
                },
                {
                  title: 'Features confirmed',
                  desc:
                    enabledFeatures.length > 0
                      ? `Enabled: ${enabledFeatures.join(', ')}`
                      : 'No optional features enabled',
                  ok: true,
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 p-4 bg-paradigm-deep-black/50 rounded-lg border border-white/10"
                >
                  <CheckCircle
                    className={`w-5 h-5 mt-0.5 shrink-0 ${item.ok ? 'text-paradigm-teal-light' : 'text-paradigm-muted'}`}
                  />
                  <div>
                    <div className="font-semibold text-white">{item.title}</div>
                    <div className="text-sm text-paradigm-muted">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="bg-paradigm-coral/10 border-2 border-paradigm-coral/40 rounded-xl p-4 mb-6">
                <p className="text-paradigm-coral-light font-semibold">{error}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setPhase('build')}
                className="px-6 py-4 rounded-xl border-2 border-white/10 text-paradigm-text font-semibold hover:bg-paradigm-deep-black transition-all"
              >
                Back to edit
              </button>
              <button
                onClick={handleLaunch}
                disabled={loading}
                className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-paradigm-purple to-paradigm-teal text-white font-semibold hover:shadow-lg hover:shadow-paradigm-purple/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Rocket className="w-5 h-5" />
                {loading ? 'Launching…' : 'Launch event'}
              </button>
            </div>

            <p className="text-xs text-paradigm-muted text-center mt-4">
              Launching publishes your event and generates a shareable link and QR code.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
