/**
 * Event Creation Form Schema
 * Zod validation schema for the event creator form
 */

import { z } from 'zod';

// Theme options
export const coverThemes = [
  'classic',
  'eclectic',
  'fancy',
  'literary',
  'digital',
  'elegant',
  'simple',
] as const;

// Food categories
export const foodCategories = [
  'Appetizer',
  'Main Dish',
  'Side Dish',
  'Dessert',
  'Drinks',
] as const;

// RSVP response types
export const rsvpResponseTypes = ['going', 'maybe', 'cant_go'] as const;

// Form validation schema
export const eventFormSchema = z.object({
  // Section 1: Event Basics
  eventBasics: z.object({
    title: z.string().min(3, 'Event title must be at least 3 characters').max(100),
    description: z.string().optional(),
    coverImage: z.object({
      type: z.enum(['preset', 'custom']),
      theme: z.enum(coverThemes).optional(),
      customUrl: z.string().refine(
        (val) => !val || val.startsWith('data:image/') || val.startsWith('http://') || val.startsWith('https://'),
        { message: 'Must be a valid URL or data URL' }
      ).optional(),
    }),
  }),

  // Section 2: Date & Location
  dateLocation: z.object({
    date: z.string().min(1, 'Date is required'),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().optional(),
    timezone: z.string().default('America/New_York'),
    venueName: z.string().min(1, 'Venue name is required'),
    address: z.string().min(1, 'Address is required'),
    description: z.string().optional(),
    nearestStation: z.string().optional(),
    hideLocationUntilRsvp: z.boolean().default(false),
  }),

  // Section 3: Guest Settings
  guestSettings: z.object({
    capacity: z.object({
      enabled: z.boolean().default(false),
      maxGuests: z.number().min(1).optional(),
      enableWaitlist: z.boolean().default(false),
    }),
    plusOnes: z.object({
      allowed: z.boolean().default(false),
      maxPerGuest: z.number().min(0).max(10).default(1),
    }),
    approval: z.object({
      requireApproval: z.boolean().default(false),
      allowMutualInvites: z.boolean().default(true),
      allowGuestPhotos: z.boolean().default(true),
    }),
  }),

  // Section 4: RSVP Options
  rsvpOptions: z.object({
    collectName: z.boolean().default(true),
    collectEmail: z.boolean().default(true),
    collectPhone: z.boolean().default(false),
    customQuestions: z.array(
      z.object({
        name: z.string(),
        label: z.string(),
        type: z.enum(['text', 'email', 'tel', 'select', 'textarea']),
        required: z.boolean(),
        options: z.array(z.string()).optional(),
      })
    ).default([]),
  }),

  // Section 5a: Potluck (Optional)
  potluck: z.object({
    enabled: z.boolean().default(false),
    categories: z.array(z.enum(foodCategories)).default([
      'Appetizer',
      'Main Dish',
      'Side Dish',
      'Dessert',
      'Drinks',
    ]),
    showWhatOthersBring: z.boolean().default(true),
    instructions: z.string().optional(),
  }).optional(),

  // Section 5b: Music (Optional)
  music: z.object({
    enabled: z.boolean().default(false),
    type: z.enum(['song_request', 'custom_song', 'both']).default('both'),
    service: z.enum(['suno', 'udio', 'custom']).default('suno').optional(),
    instructions: z.string().optional(),
    maxSongsPerGuest: z.number().min(1).max(5).default(1),
    showPlaylist: z.boolean().default(true),
  }).optional(),

  // Section 6: Event URL & Branding
  urlBranding: z.object({
    customSlug: z
      .string()
      .min(3, 'URL slug must be at least 3 characters')
      .max(50)
      .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens allowed'),
    customSubdomain: z.object({
      enabled: z.boolean().default(false),
      subdomain: z
        .string()
        .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens allowed')
        .optional(),
      provider: z.enum(['redheli.com', 'cloudpeers.com']).default('redheli.com'),
    }).optional(),
    branding: z.object({
      organizationName: z.string().optional(),
      logoUrl: z.string().url().optional(),
      colors: z.object({
        primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#FF6B6B'),
        secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#4ECDC4'),
        accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#FFE66D'),
      }).optional(),
    }).optional(),
  }),

  // Section 7: Visibility & Privacy
  visibility: z.object({
    isPublic: z.boolean().default(false),
    guestList: z.object({
      showGuestNames: z.boolean().default(true),
      showGuestCount: z.boolean().default(true),
      showGuestPhotos: z.boolean().default(true),
      showActivityTimestamps: z.boolean().default(true),
    }),
    password: z.string().optional(),
  }),

  // Section 8: Additional Details
  additional: z.object({
    cost: z.object({
      hasCost: z.boolean().default(false),
      amount: z.number().min(0).optional(),
      description: z.string().optional(),
    }),
    schedule: z.array(
      z.object({
        time: z.string(),
        title: z.string(),
        description: z.string().optional(),
      })
    ).default([]),
    enablePhotoGallery: z.boolean().default(true),
  }),

  // Host information
  host: z.object({
    name: z.string().min(1, 'Host name is required'),
    email: z.string().email('Valid email required'),
  }),
});

export type EventFormData = z.infer<typeof eventFormSchema>;

// Helper to generate URL slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
}

// Resolve the public URL for an event DB row. Full custom domains (e.g.
// sunnymax.live) live at config.customDomain — subdomain_provider has a check
// constraint limiting it to legacy providers, so arbitrary domains go through
// config until the custom_domain column migration is applied. Falls back to
// legacy <subdomain>.<provider>, then the canonical /e/<slug> URL.
export function getPublicEventUrl(event: {
  event_id: string;
  custom_subdomain?: string | null;
  subdomain_provider?: string | null;
  config?: any;
}): string {
  const customDomain = event.config?.customDomain;
  if (typeof customDomain === 'string' && customDomain.length > 0) {
    return `https://${customDomain}`;
  }
  if (event.custom_subdomain && event.subdomain_provider) {
    return `https://${event.custom_subdomain}.${event.subdomain_provider}`;
  }
  return `https://events.cloudpeers.com/e/${event.event_id}`;
}

// Helper to get event URL
export function getEventUrl(
  slug: string,
  subdomain?: { enabled: boolean; subdomain?: string; provider: string }
): string {
  if (subdomain?.enabled && subdomain.subdomain) {
    return `https://${subdomain.subdomain}.${subdomain.provider}`;
  }
  return `https://events.cloudpeers.com/e/${slug}`;
}
