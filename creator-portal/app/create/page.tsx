'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, Users, Music, Utensils, Image, Rocket, Upload, X } from 'lucide-react';

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

export default function CreateEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');

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
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateLocation = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      location: { ...prev.location, [field]: value }
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        setFormData(prev => ({
          ...prev,
          coverImageUrl: base64,
          coverImageType: 'custom'
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview('');
    setFormData(prev => ({
      ...prev,
      coverImageUrl: '',
      coverImageType: 'preset'
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Transform simple form data into the API's expected format
      const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

      const apiPayload = {
        eventBasics: {
          title: formData.title,
          description: formData.description,
          coverImage: formData.coverImageType === 'custom' && formData.coverImageUrl
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
          hideLocationUntilRsvp: false,
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
        potluck: formData.potluckEnabled ? {
          enabled: true,
          categories: ['Appetizer', 'Main Dish', 'Side Dish', 'Dessert', 'Drinks'],
        } : undefined,
        music: formData.musicEnabled ? {
          enabled: true,
          type: 'both',
          service: 'suno',
          maxSongsPerGuest: 3,
        } : undefined,
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

      // Redirect to the created event page
      if (data.eventSlug) {
        router.push(`/e/${data.eventSlug}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-paradigm-deep-black via-[#0b0a14] to-paradigm-deep-black">
      {/* Header */}
      <header className="bg-paradigm-panel/80 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-900 to-paradigm-gold/40 flex items-center justify-center">
                <span className="text-white font-bold text-lg">CP</span>
              </div>
              <h1 className="text-xl font-bold text-white">Create Event</h1>
            </div>
            <button
              onClick={() => router.push('/')}
              className="text-sm font-semibold text-paradigm-muted hover:text-red-900 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </header>

      {/* Main Form */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Event Basics */}
          <section className="bg-paradigm-panel rounded-xl p-6 border border-white/10 shadow-sm">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Rocket className="w-6 h-6 text-red-900" />
              Event Basics
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-paradigm-text mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-white/10 rounded-xl focus:ring-2 focus:ring-red-900/20 focus:border-red-900 transition-all"
                  placeholder="e.g., Summer BBQ 2025"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-paradigm-text mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-white/10 rounded-xl focus:ring-2 focus:ring-red-900/20 focus:border-red-900 transition-all resize-none"
                  placeholder="Tell your guests what to expect..."
                />
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-paradigm-text mb-2 flex items-center gap-2">
                  <Image className="w-4 h-4 text-red-900" />
                  Cover Image (optional)
                </label>

                {!imagePreview ? (
                  <label className="block w-full cursor-pointer">
                    <div className="border-2 border-dashed border-white/10 rounded-xl p-8 hover:border-red-900 hover:bg-red-50/50 transition-all">
                      <div className="flex flex-col items-center gap-3 text-center">
                        <div className="w-12 h-12 rounded-full bg-paradigm-panel flex items-center justify-center">
                          <Upload className="w-6 h-6 text-paradigm-muted" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">Click to upload cover image</p>
                          <p className="text-sm text-paradigm-muted mt-1">PNG, JPG, or GIF up to 10MB</p>
                        </div>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative w-full aspect-[2/1] rounded-xl overflow-hidden border-2 border-white/10">
                    <img
                      src={imagePreview}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-3 right-3 w-8 h-8 bg-red-900 text-white rounded-full flex items-center justify-center hover:bg-red-800 transition-all shadow-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-paradigm-text mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-red-900" />
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => updateField('date', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-white/10 rounded-xl focus:ring-2 focus:ring-red-900/20 focus:border-red-900 transition-all"
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
                    className="w-full px-4 py-3 border-2 border-white/10 rounded-xl focus:ring-2 focus:ring-red-900/20 focus:border-red-900 transition-all"
                    placeholder="No limit"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-paradigm-text mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-red-900" />
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => updateField('startTime', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-white/10 rounded-xl focus:ring-2 focus:ring-red-900/20 focus:border-red-900 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-paradigm-text mb-2">
                    End Time (optional)
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => updateField('endTime', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-white/10 rounded-xl focus:ring-2 focus:ring-red-900/20 focus:border-red-900 transition-all"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Location */}
          <section className="bg-paradigm-panel rounded-xl p-6 border border-white/10 shadow-sm">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-red-900" />
              Location
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-paradigm-text mb-2">
                  Venue Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location.venueName}
                  onChange={(e) => updateLocation('venueName', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-white/10 rounded-xl focus:ring-2 focus:ring-red-900/20 focus:border-red-900 transition-all"
                  placeholder="e.g., The Rooftop Garden"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-paradigm-text mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location.address}
                  onChange={(e) => updateLocation('address', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-white/10 rounded-xl focus:ring-2 focus:ring-red-900/20 focus:border-red-900 transition-all"
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-sm font-semibold text-paradigm-text mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location.city}
                    onChange={(e) => updateLocation('city', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-white/10 rounded-xl focus:ring-2 focus:ring-red-900/20 focus:border-red-900 transition-all"
                    placeholder="San Francisco"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-paradigm-text mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location.state}
                    onChange={(e) => updateLocation('state', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-white/10 rounded-xl focus:ring-2 focus:ring-red-900/20 focus:border-red-900 transition-all"
                    placeholder="CA"
                    maxLength={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-paradigm-text mb-2">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location.zipCode}
                    onChange={(e) => updateLocation('zipCode', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-white/10 rounded-xl focus:ring-2 focus:ring-red-900/20 focus:border-red-900 transition-all"
                    placeholder="94102"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Host Information */}
          <section className="bg-paradigm-panel rounded-xl p-6 border border-white/10 shadow-sm">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Users className="w-6 h-6 text-red-900" />
              Host Information
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-paradigm-text mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.hostName}
                  onChange={(e) => updateField('hostName', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-white/10 rounded-xl focus:ring-2 focus:ring-red-900/20 focus:border-red-900 transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-paradigm-text mb-2">
                  Your Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.hostEmail}
                  onChange={(e) => updateField('hostEmail', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-white/10 rounded-xl focus:ring-2 focus:ring-red-900/20 focus:border-red-900 transition-all"
                  placeholder="john@example.com"
                />
              </div>
            </div>
          </section>

          {/* Optional Features */}
          <section className="bg-paradigm-panel rounded-xl p-6 border border-white/10 shadow-sm">
            <h2 className="text-2xl font-bold text-white mb-6">Optional Features</h2>

            <div className="space-y-4">
              <label className="flex items-start gap-3 p-4 border-2 border-white/10 rounded-xl hover:border-paradigm-gold/50 hover:bg-paradigm-gold/10/50 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.potluckEnabled}
                  onChange={(e) => updateField('potluckEnabled', e.target.checked)}
                  className="mt-1 w-5 h-5 text-paradigm-gold rounded focus:ring-2 focus:ring-paradigm-gold/20"
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

              <label className="flex items-start gap-3 p-4 border-2 border-white/10 rounded-xl hover:border-red-900 hover:bg-red-50/50 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.musicEnabled}
                  onChange={(e) => updateField('musicEnabled', e.target.checked)}
                  className="mt-1 w-5 h-5 text-red-900 rounded focus:ring-2 focus:ring-red-900/20"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Music className="w-5 h-5 text-red-900" />
                    <span className="font-semibold text-white">Music Requests</span>
                  </div>
                  <p className="text-sm text-paradigm-muted mt-1">
                    Allow guests to request songs or generate AI-powered custom songs
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border-2 border-white/10 rounded-xl hover:border-paradigm-purple/60 hover:bg-paradigm-deep-black/50 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.galleryEnabled}
                  onChange={(e) => updateField('galleryEnabled', e.target.checked)}
                  className="mt-1 w-5 h-5 text-paradigm-text rounded focus:ring-2 focus:ring-paradigm-purple/40"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Image className="w-5 h-5 text-paradigm-text" />
                    <span className="font-semibold text-white">Photo Gallery</span>
                  </div>
                  <p className="text-sm text-paradigm-muted mt-1">
                    Create a private photo gallery for guests to share memories
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border-2 border-white/10 rounded-xl hover:border-paradigm-purple/60 hover:bg-paradigm-deep-black/50 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requireApproval}
                  onChange={(e) => updateField('requireApproval', e.target.checked)}
                  className="mt-1 w-5 h-5 text-paradigm-text rounded focus:ring-2 focus:ring-paradigm-purple/40"
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

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <p className="text-red-900 font-semibold">{error}</p>
            </div>
          )}

          {/* Submit Button */}
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
              disabled={loading}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-red-900 to-paradigm-gold/40 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Event...' : 'Create Event'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
