# Event Template Engine - Implementation Guide

## Overview

The template engine generates branded event landing pages from JSON configuration files. It supports **complete white-label customization** - logos, colors, fonts, and content are all configurable per event or organization.

## Template System Architecture

### Template Variables Structure

```typescript
interface EventTemplate {
  // Branding (fully customizable)
  branding: {
    organizationName: string;
    logo: {
      url: string;                    // URL to logo image
      alt: string;                    // Alt text
      height: number;                 // Logo height in pixels
      animationClass?: string;        // Optional CSS animation
    };
    colors: {
      primary: string;                // Main brand color (hex)
      secondary: string;              // Secondary color (hex)
      accent: string;                 // Accent color (hex)
      background: string;             // Background gradient
      text: string;                   // Text color (hex)
    };
    fonts?: {
      heading: string;                // Font family for headings
      body: string;                   // Font family for body text
    };
  };

  // Event details
  event: {
    title: string;
    date: string;
    time: string;
    location: string;
    description: string;
    whatToExpect: {
      intro: string;
      items: string[];
    };
  };

  // Venue information
  venue: {
    name: string;
    description: string;
    address: string;
    nearestStation: string;
    capacity: string;
    googleMapsLink: string;
    audioFeatures?: Array<{
      title: string;
      description: string;
    }>;
  };

  // Registration settings
  registration: {
    supabaseUrl: string;
    supabaseAnonKey: string;
    eventName: string;
    eventDate: string;              // ISO format: YYYY-MM-DD
    siteUrl: string;
    source?: string;
    formFields?: {                  // Customizable form fields
      nameLabel?: string;
      emailLabel?: string;
      phoneLabel?: string;
      organizationLabel?: string;
      customFields?: Array<{
        name: string;
        label: string;
        type: 'text' | 'email' | 'tel' | 'select';
        required: boolean;
        options?: string[];         // For select fields
      }>;
    };
  };

  // Agenda/Schedule
  agenda: Array<{
    time: string;
    activity: string;
    title?: string;
    description?: string;
  }>;

  // Links
  links: {
    journey?: string;
    community?: string;
    gallery?: string;
    customLinks?: Array<{
      label: string;
      url: string;
      icon?: string;
    }>;
  };

  // Calendar integration
  calendar?: {
    gcalStartDate: string;          // Format: YYYYMMDDTHHmmSS
    gcalEndDate: string;
    icsStartTime: string;           // Format: HH:mm
    icsDuration: number;            // Hours
  };
}
```

## Template Generation Process

### 1. Configuration File

**Example**: `custom-org-event-config.json`

```json
{
  "branding": {
    "organizationName": "Community Innovation Hub",
    "logo": {
      "url": "https://cdn.example.com/logo.png",
      "alt": "Community Innovation Hub",
      "height": 64,
      "animationClass": "animate-pulse"
    },
    "colors": {
      "primary": "#2563EB",
      "secondary": "#1E293B",
      "accent": "#7C3AED",
      "background": "linear-gradient(135deg, #1E293B 0%, #334155 50%, #475569 100%)",
      "text": "#F1F5F9"
    },
    "fonts": {
      "heading": "Inter, system-ui, sans-serif",
      "body": "Inter, system-ui, sans-serif"
    }
  },
  "event": {
    "title": "Innovation Summit 2025",
    "date": "March 15, 2025",
    "time": "2:00 PM - 5:00 PM PST",
    "location": "San Francisco, CA",
    "description": "Join us for an afternoon of innovation and collaboration",
    "whatToExpect": {
      "intro": "Experience cutting-edge ideas and connect with fellow innovators",
      "items": [
        "Keynote presentations from industry leaders",
        "Interactive workshop sessions",
        "Networking opportunities",
        "Complimentary refreshments"
      ]
    }
  },
  "venue": {
    "name": "Innovation Center",
    "description": "A modern space designed for collaboration and creativity",
    "address": "123 Innovation Way, San Francisco, CA 94103",
    "nearestStation": "BART: Civic Center Station",
    "capacity": "200 attendees",
    "googleMapsLink": "https://maps.google.com/maps?q=123+Innovation+Way,+San+Francisco,+CA"
  },
  "registration": {
    "supabaseUrl": "https://your-project.supabase.co",
    "supabaseAnonKey": "your-anon-key",
    "eventName": "Innovation Summit 2025",
    "eventDate": "2025-03-15",
    "siteUrl": "https://summit.example.com",
    "source": "event-site",
    "formFields": {
      "nameLabel": "Full Name",
      "emailLabel": "Email Address",
      "phoneLabel": "Phone Number",
      "organizationLabel": "Company/Organization",
      "customFields": [
        {
          "name": "role",
          "label": "Your Role",
          "type": "select",
          "required": true,
          "options": ["Founder", "Developer", "Designer", "Product Manager", "Other"]
        },
        {
          "name": "interests",
          "label": "Areas of Interest",
          "type": "text",
          "required": false
        }
      ]
    }
  },
  "agenda": [
    {
      "time": "14:00",
      "title": "Registration & Welcome",
      "description": "Check-in and networking"
    },
    {
      "time": "14:30",
      "title": "Opening Keynote",
      "description": "The Future of Innovation"
    },
    {
      "time": "15:30",
      "title": "Workshop Sessions",
      "description": "Choose from 4 interactive tracks"
    },
    {
      "time": "16:30",
      "title": "Panel Discussion",
      "description": "Q&A with industry experts"
    },
    {
      "time": "17:00",
      "title": "Closing Remarks & Networking"
    }
  ],
  "links": {
    "community": "https://community.example.com",
    "customLinks": [
      {
        "label": "Speaker Bios",
        "url": "https://summit.example.com/speakers",
        "icon": "users"
      },
      {
        "label": "Past Events",
        "url": "https://summit.example.com/archive",
        "icon": "calendar"
      }
    ]
  },
  "calendar": {
    "gcalStartDate": "20250315T140000",
    "gcalEndDate": "20250315T170000",
    "icsStartTime": "14:00",
    "icsDuration": 3
  }
}
```

### 2. Template HTML (White-Label)

**File**: `templates/base-template.html`

Key features:
- All branding placeholders: `{{LOGO_URL}}`, `{{PRIMARY_COLOR}}`, etc.
- CSS custom properties for dynamic theming
- Conditional sections based on config
- Modular component structure

**Template Placeholders**:

```html
<!-- Branding -->
{{ORGANIZATION_NAME}}
{{LOGO_URL}}
{{LOGO_ALT}}
{{LOGO_HEIGHT}}
{{PRIMARY_COLOR}}
{{SECONDARY_COLOR}}
{{ACCENT_COLOR}}
{{BACKGROUND_GRADIENT}}
{{TEXT_COLOR}}
{{HEADING_FONT}}
{{BODY_FONT}}

<!-- Event Details -->
{{EVENT_TITLE}}
{{EVENT_DATE}}
{{EVENT_TIME}}
{{EVENT_LOCATION}}
{{EVENT_DESCRIPTION}}
{{META_DESCRIPTION}}

<!-- Venue -->
{{VENUE_NAME}}
{{VENUE_DESCRIPTION}}
{{VENUE_ADDRESS}}
{{NEAREST_STATION}}
{{VENUE_CAPACITY}}
{{GOOGLE_MAPS_LINK}}

<!-- Registration -->
{{REGISTRATION_URL}}
{{REGISTRATION_SOURCE}}
{{SUPABASE_URL}}
{{SUPABASE_ANON_KEY}}

<!-- Calendar -->
{{GCAL_START_DATE}}
{{GCAL_END_DATE}}
{{ICS_START_TIME}}
{{ICS_DURATION}}

<!-- Links -->
{{JOURNEY_LINK}}
{{COMMUNITY_LINK}}
{{GALLERY_URL}}
```

### 3. CSS Theming System

**Inject custom properties**:

```html
<style>
  :root {
    --color-primary: {{PRIMARY_COLOR}};
    --color-secondary: {{SECONDARY_COLOR}};
    --color-accent: {{ACCENT_COLOR}};
    --color-text: {{TEXT_COLOR}};
    --font-heading: {{HEADING_FONT}};
    --font-body: {{BODY_FONT}};
  }

  body {
    background: {{BACKGROUND_GRADIENT}};
    color: var(--color-text);
    font-family: var(--font-body);
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-heading);
  }

  .btn-primary {
    background-color: var(--color-primary);
  }

  .btn-primary:hover {
    background-color: color-mix(in srgb, var(--color-primary) 80%, black);
  }

  .text-primary { color: var(--color-primary); }
  .bg-primary { background-color: var(--color-primary); }
  .border-primary { border-color: var(--color-primary); }
</style>
```

## Generator Script

**File**: `generate-event.js`

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load configuration
const configFile = process.argv[2];
if (!configFile) {
  console.error('Usage: node generate-event.js <config-file.json>');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));

// Load template
let template = fs.readFileSync('templates/base-template.html', 'utf8');

// Build replacement map
const replacements = {
  // Branding
  '{{ORGANIZATION_NAME}}': config.branding.organizationName,
  '{{LOGO_URL}}': config.branding.logo.url,
  '{{LOGO_ALT}}': config.branding.logo.alt,
  '{{LOGO_HEIGHT}}': config.branding.logo.height,
  '{{PRIMARY_COLOR}}': config.branding.colors.primary,
  '{{SECONDARY_COLOR}}': config.branding.colors.secondary,
  '{{ACCENT_COLOR}}': config.branding.colors.accent,
  '{{BACKGROUND_GRADIENT}}': config.branding.colors.background,
  '{{TEXT_COLOR}}': config.branding.colors.text,
  '{{HEADING_FONT}}': config.branding.fonts?.heading || 'system-ui, sans-serif',
  '{{BODY_FONT}}': config.branding.fonts?.body || 'system-ui, sans-serif',

  // Event details
  '{{EVENT_TITLE}}': config.event.title,
  '{{EVENT_DATE}}': config.event.date,
  '{{EVENT_TIME}}': config.event.time,
  '{{EVENT_LOCATION}}': config.event.location,
  '{{EVENT_DESCRIPTION}}': config.event.description,
  '{{META_DESCRIPTION}}': config.event.whatToExpect.intro,

  // Venue
  '{{VENUE_NAME}}': config.venue.name,
  '{{VENUE_DESCRIPTION}}': config.venue.description,
  '{{VENUE_ADDRESS}}': config.venue.address,
  '{{NEAREST_STATION}}': config.venue.nearestStation,
  '{{VENUE_CAPACITY}}': config.venue.capacity,
  '{{GOOGLE_MAPS_LINK}}': config.venue.googleMapsLink,

  // Registration
  '{{REGISTRATION_URL}}': config.registration.siteUrl,
  '{{REGISTRATION_SOURCE}}': config.registration.source || 'event-site',

  // Links
  '{{JOURNEY_LINK}}': config.links.journey || '#',
  '{{COMMUNITY_LINK}}': config.links.community || '#',
  '{{GALLERY_URL}}': config.links.gallery || '#',

  // Calendar
  '{{GCAL_START_DATE}}': config.calendar?.gcalStartDate || '',
  '{{GCAL_END_DATE}}': config.calendar?.gcalEndDate || '',
  '{{ICS_START_TIME}}': config.calendar?.icsStartTime || '00:00',
  '{{ICS_DURATION}}': config.calendar?.icsDuration || 2,
};

// Replace all placeholders
for (const [placeholder, value] of Object.entries(replacements)) {
  const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  template = template.replace(regex, value);
}

// Inject config as JSON for Alpine.js
const configScript = `
<script>
  // Event configuration
  window.eventConfig = ${JSON.stringify(config, null, 2)};
</script>
`;
template = template.replace('</body>', `${configScript}</body>`);

// Output filename
const baseName = path.basename(configFile, '-config.json');
const outputPath = `output/${baseName}.html`;

// Ensure output directory exists
if (!fs.existsSync('output')) {
  fs.mkdirSync('output');
}

// Write generated file
fs.writeFileSync(outputPath, template);

console.log(`✅ Event page generated: ${outputPath}`);
console.log(`📅 Event: ${config.event.title}`);
console.log(`📍 Venue: ${config.venue.name}`);
console.log(`🎨 Brand: ${config.branding.organizationName}`);
```

## API Endpoint Implementation

```typescript
// /api/events/generate
export async function POST(req: Request) {
  const { eventConfig, templateId = 'base' } = await req.json();

  // Validate config schema
  const validation = validateEventConfig(eventConfig);
  if (!validation.valid) {
    return Response.json({ error: validation.errors }, { status: 400 });
  }

  // Load template
  const template = await loadTemplate(templateId);

  // Generate HTML
  const html = renderTemplate(template, eventConfig);

  // Deploy to hosting
  const eventId = generateEventId();
  const eventUrl = await deployEventPage(eventId, html, eventConfig);

  // Create gallery album
  const albumId = await createGalleryAlbum(eventId, eventConfig);

  // Record metrics
  await recordMetric('events_created', 1, {
    eventId,
    eventName: eventConfig.event.title,
    organizationName: eventConfig.branding.organizationName
  });

  return Response.json({
    eventId,
    eventUrl,
    albumId,
    qrCodeUrl: `${eventUrl}/qr.png`
  });
}
```

## Branding Presets (Optional)

Create reusable branding presets for common organizations:

```json
{
  "presets": {
    "red-helicopter": {
      "organizationName": "Red Helicopter",
      "logo": {
        "url": "https://cdn.redheli.com/red-helicopter-logo.png",
        "alt": "Red Helicopter",
        "height": 64
      },
      "colors": {
        "primary": "#E5243B",
        "secondary": "#130134",
        "accent": "#42345D",
        "background": "linear-gradient(135deg, #130134 0%, #42345D 50%, #4D36D0 100%)",
        "text": "#FCF0DF"
      }
    },
    "community-hub": {
      "organizationName": "Community Innovation Hub",
      "logo": {
        "url": "https://cdn.example.com/hub-logo.png",
        "alt": "Community Hub",
        "height": 48
      },
      "colors": {
        "primary": "#2563EB",
        "secondary": "#1E293B",
        "accent": "#7C3AED",
        "background": "linear-gradient(135deg, #1E293B 0%, #334155 50%, #475569 100%)",
        "text": "#F1F5F9"
      }
    }
  }
}
```

**Usage**:

```bash
node generate-event.js --preset red-helicopter --config event-config.json
```

## Testing

```bash
# Test event generation
npm run test:generate

# Test with different branding
npm run test:generate -- --preset community-hub

# Validate config schema
npm run validate-config custom-org-event-config.json

# Preview locally
npm run preview output/custom-org-event.html
```

## Next Steps

1. Create base template with all placeholder support
2. Implement config validation schema (Zod/Yup)
3. Build template rendering engine
4. Add multi-template support (different layouts)
5. Create branding preset library

Continue to:
- **04_GALLERY_SYSTEM.md** - Photo gallery with branding customization
- **05_DATABASE_SCHEMA.md** - Support for multi-tenant branding
