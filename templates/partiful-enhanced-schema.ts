/**
 * Partiful-Enhanced Event Template Schema
 *
 * Feature parity with https://partiful.com/create including:
 * - Multi-response RSVP (Going/Maybe/Can't Go)
 * - Guest management (approval, waitlist, mutual invites)
 * - Cover image themes
 * - Hidden location until RSVP
 * - Guest photo uploads
 * - Activity tracking
 * - Public/private visibility controls
 */

export interface PartifulEnhancedTemplate {
  // ========================================
  // BRANDING (White-label customization)
  // ========================================
  branding: {
    organizationName: string;
    logo: {
      url: string;
      alt: string;
      height: number;
      animationClass?: string;
    };
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
    };
    fonts?: {
      heading: string;
      body: string;
    };
  };

  // ========================================
  // EVENT DETAILS
  // ========================================
  event: {
    title: string;                          // Required
    description: string;

    // Cover Image & Theme (Partiful feature)
    coverImage: {
      type: 'preset' | 'custom';
      theme?: 'classic' | 'eclectic' | 'fancy' | 'literary' | 'digital' | 'elegant' | 'simple';
      customUrl?: string;
      customAlt?: string;
    };

    // Host Information
    host: {
      name: string;                         // Host nickname (optional in Partiful)
      email: string;
      photo?: string;
    };

    // Date & Time with Timezone
    dateTime: {
      date: string;                         // ISO format: YYYY-MM-DD
      startTime: string;                    // HH:mm format
      endTime?: string;
      timezone: string;                     // e.g., "America/New_York", "Europe/London"
      displayTimezone?: boolean;
    };

    // Location (with privacy controls)
    location: {
      name: string;
      address: string;
      description?: string;
      nearestStation?: string;
      googleMapsLink: string;
      hideUntilRsvp: boolean;              // Partiful feature: hide location before RSVP
      showOnlyApproved?: boolean;          // Only show to approved guests
    };

    // Capacity & Pricing
    capacity: {
      enabled: boolean;
      maxGuests: number | 'unlimited';
      enableWaitlist: boolean;             // Partiful feature
      currentCount?: number;
      waitlistCount?: number;
    };

    cost: {
      hasCost: boolean;
      amount?: number;
      currency?: string;
      perPerson?: boolean;
      description?: string;
    };

    // What to Expect
    whatToExpect?: {
      intro: string;
      items: string[];
    };
  };

  // ========================================
  // RSVP CONFIGURATION (Partiful features)
  // ========================================
  rsvp: {
    enabled: boolean;

    // Response Options (emoji-based like Partiful)
    responseTypes: Array<{
      value: 'going' | 'maybe' | 'cant_go';
      label: string;
      emoji: string;                        // e.g., "👍", "🤔", "👎"
      color: string;                        // Hex color for UI
      requiresApproval?: boolean;
    }>;

    // Guest Management
    guestManagement: {
      requireApproval: boolean;            // Host must approve RSVPs
      allowPlusOnes: boolean;
      maxPlusOnes?: number;
      allowMutualInvites: boolean;         // Partiful: guests invite mutual contacts
      collectPhotos: boolean;              // Allow guest photo uploads
    };

    // Guest Information Collection
    collectInfo: {
      fields: Array<{
        name: string;
        label: string;
        type: 'text' | 'email' | 'tel' | 'select' | 'textarea';
        required: boolean;
        options?: string[];                // For select fields
        placeholder?: string;
      }>;
    };

    // Potluck Settings (OPTIONAL - for potluck events)
    potluck?: {
      enabled: boolean;
      categories: string[];                // e.g., ["Appetizer", "Main Dish", "Side Dish", "Dessert", "Drinks"]
      allowGuestsToAddItems: boolean;
      showWhatOthersBring: boolean;       // Show full list to all guests
      needs?: Array<{                     // What host needs people to bring
        category: string;
        needed: number | 'unlimited';
        claimed: number;
        description?: string;
      }>;
      instructions?: string;               // Host instructions (e.g., "Please bring a dish to serve 8-10 people")
    };

    // Music Contributions (OPTIONAL - for playlist or AI-generated songs)
    musicContributions?: {
      enabled: boolean;
      type: 'song_request' | 'custom_song' | 'both';  // Request existing song OR AI-generate custom song
      customSongService?: 'suno' | 'udio' | 'custom_api';  // AI music generation service
      instructions?: string;               // e.g., "Request a song OR write a one-sentence prompt for a custom AI song!"
      maxSongsPerGuest?: number;          // Limit requests per guest
      showPlaylist?: boolean;             // Show all song requests to guests
      playlistUrl?: string;               // Link to Spotify/Apple Music playlist
    };

    // Automated Communications
    communications: {
      sendConfirmation: boolean;
      sendReminders: boolean;
      reminderTimings?: Array<{
        timeBeforeEvent: number;           // Hours before event
        message: string;
      }>;
      customConfirmationMessage?: string;
    };
  };

  // ========================================
  // VISIBILITY & SHARING (Partiful features)
  // ========================================
  visibility: {
    isPublic: boolean;                     // Public vs private event

    // Guest List Display
    guestList: {
      showGuestNames: boolean;
      showGuestCount: boolean;
      showGuestPhotos: boolean;
      showActivityTimestamps: boolean;     // When people RSVP'd
      groupByStatus: boolean;              // Group by Going/Maybe/Can't Go
    };

    // Sharing Options
    sharing: {
      allowGuestSharing: boolean;
      generateQRCode: boolean;
      customSlug?: string;                 // e.g., events.cloudpeers.com/e/custom-slug

      // Custom Subdomain (OPTIONAL)
      customSubdomain?: {
        enabled: boolean;
        subdomain: string;                 // e.g., "myevent"
        provider: 'redheli.com' | 'cloudpeers.com';  // Full URL: myevent.redheli.com
      };
      /* Examples:
         - Without subdomain: events.cloudpeers.com/e/sarahs-30th
         - With subdomain: sarahs30th.redheli.com or sarahs30th.cloudpeers.com
      */

      password?: string;                   // Password protect event page
    };
  };

  // ========================================
  // VENUE INFORMATION
  // ========================================
  venue: {
    name: string;
    description: string;
    address: string;
    nearestStation?: string;
    capacity?: string;
    googleMapsLink: string;

    // Audio/Visual Features (from current template)
    audioFeatures?: Array<{
      title: string;
      description: string;
    }>;

    // Accessibility Information
    accessibility?: {
      wheelchairAccessible: boolean;
      parkingAvailable: boolean;
      publicTransportNearby: boolean;
      notes?: string;
    };
  };

  // ========================================
  // REGISTRATION SYSTEM
  // ========================================
  registration: {
    supabaseUrl: string;
    supabaseAnonKey: string;
    eventId: string;                       // Unique event identifier
    eventName: string;
    eventDate: string;                     // ISO format
    siteUrl: string;
    source?: string;

    // Integration endpoints
    webhookUrl?: string;                   // CloudPeers webhook
    confirmationRedirect?: string;         // Where to redirect after RSVP
  };

  // ========================================
  // AGENDA / SCHEDULE
  // ========================================
  agenda: Array<{
    time: string;                          // HH:mm format
    activity: string;
    title?: string;
    description?: string;
    speaker?: string;
    location?: string;                     // If different from main venue
  }>;

  // ========================================
  // LINKS & INTEGRATIONS
  // ========================================
  links: {
    journey?: string;
    community?: string;
    gallery?: string;

    // Social Media
    socialMedia?: {
      facebook?: string;
      twitter?: string;
      instagram?: string;
      linkedin?: string;
    };

    // Custom Links
    customLinks?: Array<{
      label: string;
      url: string;
      icon?: string;
    }>;
  };

  // ========================================
  // CALENDAR INTEGRATION
  // ========================================
  calendar: {
    gcalStartDate: string;                 // Format: YYYYMMDDTHHmmSS
    gcalEndDate: string;
    icsStartTime: string;                  // Format: HH:mm
    icsDuration: number;                   // Hours

    // Calendar description customization
    includeAgenda?: boolean;
    includeLocation?: boolean;
    customDescription?: string;
  };

  // ========================================
  // HOST TOOLS (Partiful features)
  // ========================================
  hostTools?: {
    // Quick Actions
    enableQuickReminders: boolean;
    enableBulkApproval: boolean;
    enableExport: boolean;                 // Export guest list

    // Tracking & Analytics
    tracking: {
      trackViews: boolean;
      trackRSVPs: boolean;
      trackShares: boolean;
      trackCheckIns?: boolean;             // Check-in at event
    };

    // Notifications to Host
    notifications: {
      emailOnRSVP: boolean;
      emailOnComment?: boolean;
      emailOnShare?: boolean;
      dailyDigest: boolean;
    };
  };

  // ========================================
  // METADATA
  // ========================================
  metadata?: {
    createdAt: string;
    updatedAt: string;
    version: string;
    tags?: string[];
    category?: string;
  };
}

/**
 * Example: Partiful-style Birthday Party
 */
export const examplePartifulEvent: PartifulEnhancedTemplate = {
  branding: {
    organizationName: "CloudPeers Events",
    logo: {
      url: "https://cdn.cloudpeers.com/logo.png",
      alt: "CloudPeers",
      height: 48
    },
    colors: {
      primary: "#FF6B6B",
      secondary: "#4ECDC4",
      accent: "#FFE66D",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      text: "#2C3E50"
    }
  },

  event: {
    title: "Sarah's 30th Birthday Bash 🎉",
    description: "Join us for an unforgettable celebration of Sarah turning 30! Expect great music, amazing food, and even better company.",

    coverImage: {
      type: "preset",
      theme: "fancy"
    },

    host: {
      name: "Mike & Friends",
      email: "mike@example.com",
      photo: "https://cdn.cloudpeers.com/hosts/mike.jpg"
    },

    dateTime: {
      date: "2025-03-15",
      startTime: "19:00",
      endTime: "23:00",
      timezone: "America/New_York",
      displayTimezone: true
    },

    location: {
      name: "The Rooftop Garden",
      address: "123 Park Avenue, New York, NY 10016",
      description: "Beautiful rooftop venue with city views",
      nearestStation: "Grand Central - 42nd Street",
      googleMapsLink: "https://maps.google.com/?q=123+Park+Avenue,+New+York,+NY",
      hideUntilRsvp: true,
      showOnlyApproved: false
    },

    capacity: {
      enabled: true,
      maxGuests: 75,
      enableWaitlist: true,
      currentCount: 0,
      waitlistCount: 0
    },

    cost: {
      hasCost: true,
      amount: 25,
      currency: "USD",
      perPerson: true,
      description: "Covers food, drinks, and venue"
    },

    whatToExpect: {
      intro: "An evening of celebration with great vibes!",
      items: [
        "🎵 DJ and dance floor",
        "🍕 Catered dinner and appetizers",
        "🍹 Open bar (beer, wine, cocktails)",
        "📸 Photo booth with props",
        "🎁 Surprise performances"
      ]
    }
  },

  rsvp: {
    enabled: true,

    responseTypes: [
      {
        value: "going",
        label: "I'm going!",
        emoji: "✅",
        color: "#10B981",
        requiresApproval: false
      },
      {
        value: "maybe",
        label: "Maybe",
        emoji: "🤔",
        color: "#F59E0B",
        requiresApproval: false
      },
      {
        value: "cant_go",
        label: "Can't make it",
        emoji: "❌",
        color: "#EF4444",
        requiresApproval: false
      }
    ],

    guestManagement: {
      requireApproval: false,
      allowPlusOnes: true,
      maxPlusOnes: 1,
      allowMutualInvites: true,
      collectPhotos: true
    },

    collectInfo: {
      fields: [
        {
          name: "fullName",
          label: "Full Name",
          type: "text",
          required: true,
          placeholder: "John Doe"
        },
        {
          name: "email",
          label: "Email",
          type: "email",
          required: true,
          placeholder: "john@example.com"
        },
        {
          name: "phone",
          label: "Phone Number",
          type: "tel",
          required: false,
          placeholder: "(555) 123-4567"
        },
        {
          name: "dietaryRestrictions",
          label: "Dietary Restrictions",
          type: "select",
          required: false,
          options: ["None", "Vegetarian", "Vegan", "Gluten-free", "Halal", "Kosher", "Other"]
        },
        {
          name: "songRequest",
          label: "Song Request",
          type: "text",
          required: false,
          placeholder: "What song should the DJ play?"
        }
      ]
    },

    // Potluck Configuration (OPTIONAL)
    potluck: {
      enabled: false,  // Set to true for potluck events
      categories: ["Appetizer", "Main Dish", "Side Dish", "Dessert", "Drinks"],
      allowGuestsToAddItems: true,
      showWhatOthersBring: true,
      instructions: "Please bring a dish to serve 8-10 people. We want to make sure we have a good variety!"
    },

    // Music Contributions (OPTIONAL)
    musicContributions: {
      enabled: true,
      type: "both",
      customSongService: "suno",
      instructions: "🎵 Request a song for the playlist OR write a one-sentence prompt for a custom AI-generated song about Sarah!",
      maxSongsPerGuest: 1,
      showPlaylist: true,
      playlistUrl: "https://open.spotify.com/playlist/sarah30th"
    },

    communications: {
      sendConfirmation: true,
      sendReminders: true,
      reminderTimings: [
        {
          timeBeforeEvent: 24,
          message: "Tomorrow's the big day! See you at The Rooftop Garden at 7 PM."
        },
        {
          timeBeforeEvent: 2,
          message: "Party starts in 2 hours! Don't forget to bring your dancing shoes 💃"
        }
      ]
    }
  },

  visibility: {
    isPublic: false,

    guestList: {
      showGuestNames: true,
      showGuestCount: true,
      showGuestPhotos: true,
      showActivityTimestamps: true,
      groupByStatus: true
    },

    sharing: {
      allowGuestSharing: true,
      generateQRCode: true,
      customSlug: "sarahs-30th",

      // Option 1: Path-based URL (default)
      // URL: events.cloudpeers.com/e/sarahs-30th

      // Option 2: Custom subdomain (uncomment to enable)
      customSubdomain: {
        enabled: true,
        subdomain: "sarahs30th",
        provider: "redheli.com"
      }
      // URL: sarahs30th.redheli.com
    }
  },

  venue: {
    name: "The Rooftop Garden",
    description: "Elegant rooftop venue with panoramic city views, indoor-outdoor space, and modern amenities.",
    address: "123 Park Avenue, New York, NY 10016",
    nearestStation: "Grand Central - 42nd Street (5 min walk)",
    capacity: "Up to 100 guests",
    googleMapsLink: "https://maps.google.com/?q=123+Park+Avenue,+New+York,+NY",

    accessibility: {
      wheelchairAccessible: true,
      parkingAvailable: true,
      publicTransportNearby: true,
      notes: "Elevator access to rooftop. Street parking and garage nearby."
    }
  },

  registration: {
    supabaseUrl: "https://your-project.supabase.co",
    supabaseAnonKey: "your-anon-key",
    eventId: "sarahs-30th-2025",
    eventName: "Sarah's 30th Birthday Bash",
    eventDate: "2025-03-15",
    siteUrl: "https://events.cloudpeers.com/e/sarahs-30th",
    source: "cloudpeers-events"
  },

  agenda: [
    {
      time: "19:00",
      activity: "Doors Open",
      title: "Arrival & Welcome Drinks",
      description: "Check in and grab a cocktail!"
    },
    {
      time: "19:30",
      activity: "Appetizers",
      title: "Cocktail Hour",
      description: "Mingle and enjoy passed hors d'oeuvres"
    },
    {
      time: "20:00",
      activity: "Dinner",
      title: "Seated Dinner Service",
      description: "Three-course meal with wine pairing"
    },
    {
      time: "21:00",
      activity: "Toasts",
      title: "Birthday Toasts & Cake",
      description: "Share your favorite Sarah stories!"
    },
    {
      time: "21:30",
      activity: "Dancing",
      title: "Dance Party Begins",
      description: "DJ takes over - let's dance!"
    },
    {
      time: "23:00",
      activity: "Last Call",
      title: "Party Winds Down",
      description: "Thanks for celebrating with us!"
    }
  ],

  links: {
    gallery: "https://events.cloudpeers.com/gallery/sarahs-30th",
    socialMedia: {
      instagram: "@sarahs30th"
    }
  },

  calendar: {
    gcalStartDate: "20250315T190000",
    gcalEndDate: "20250315T230000",
    icsStartTime: "19:00",
    icsDuration: 4,
    includeAgenda: true,
    includeLocation: true
  },

  hostTools: {
    enableQuickReminders: true,
    enableBulkApproval: true,
    enableExport: true,

    tracking: {
      trackViews: true,
      trackRSVPs: true,
      trackShares: true,
      trackCheckIns: true
    },

    notifications: {
      emailOnRSVP: true,
      dailyDigest: true
    }
  },

  metadata: {
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-01-20T14:30:00Z",
    version: "1.0",
    tags: ["birthday", "party", "adult", "celebration"],
    category: "social"
  }
};
