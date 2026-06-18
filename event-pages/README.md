# cloudpeers Event Pages

Create beautiful event landing pages with cloudpeers branding.

## Quick Start for Users

### Create Your Event (Simple Way)

1. **Open the Event Creator**: Open `index.html` in your browser
2. **Fill in your event details**:
   - Event name, date, time, location
   - Add a description
   - Choose features (potluck, music, gallery)
3. **Click "Create Event Page"**
4. **Download your configuration**
5. **Generate your event page**: `npm run generate:event your-config.json`
6. **Find your page**: Look in `output/` folder
7. **Deploy**: Upload to Cloudflare Pages, Netlify, or any static host

### Three Ways to Create Events

#### 1. Simple Creator (`index.html`) - **Recommended for most users**
- Partiful-style simple form
- No technical knowledge required
- Linear, easy-to-follow flow
- Import/Export JSON configs
- Perfect for: Quick event creation

#### 2. Advanced Portal (`creator-portal.html`)
- Full dashboard with 7 tabs
- View all settings at once
- Live preview
- Config editor
- Perfect for: Power users, reviewing existing events

#### 3. Direct Generator (`event-creator.html`)
- Form-based with split view
- Live preview sidebar
- All options visible
- Perfect for: Users who want to see everything

## Features

### Event Page Features
- ✅ Beautiful cloudpeers branding (maroon #7B1E1E, tan #D4A574)
- ✅ Event registration with Supabase
- ✅ QR code generation
- ✅ Speaker profiles with social links
- ✅ Dynamic schedule rendering
- ✅ Mobile-first responsive design

### Optional Features
- 🍴 **Potluck Coordination**: Let guests sign up to bring dishes
- 🎵 **Music Requests**: Song requests or AI-generated custom songs (Suno/Udio)
- 📸 **Photo Gallery**: Magic link photo sharing
- 👥 **Guest Management**: Capacity limits, approvals, plus-ones

## File Structure

```
event-pages/
├── index.html                    ← START HERE - Simple creator
├── creator-portal.html           ← Advanced dashboard
├── event-creator.html            ← Form with preview
├── example-config.json           ← Example event configuration
├── templates/
│   └── default.html              ← Event page template
├── generator/
│   └── generate.ts               ← TypeScript generator
└── output/
    └── your-event.html           ← Generated event pages
```

## For Users: Creating Your Event

### Step 1: Open the Creator

```bash
# Just open in your browser
open index.html
```

Or double-click `index.html` in your file explorer.

### Step 2: Fill in Your Event

**Required fields:**
- Event name
- Date
- Time
- Location

**Optional:**
- Description
- URL slug (auto-generated if blank)
- Category
- Capacity
- Potluck features
- Music features
- Guest settings

### Step 3: Enable Features

Toggle on any features you want:

**Potluck** - Let guests sign up to bring:
- Appetizers
- Main dishes
- Desserts
- Beverages
- (Custom categories)

**Music Requests** - Choose:
- Song requests (existing songs)
- AI-generated custom songs
- Both

**Photo Gallery** - Share event photos with guests

### Step 4: Create & Download

1. Click **"Create Event Page"**
2. Click **"Download Config"**
3. Save the JSON file

### Step 5: Generate Event Page

```bash
npm run generate:event your-event-config.json
```

Your event page will be created in `output/your-event-slug.html`

### Step 6: Test It

Open the generated HTML file in your browser:

```bash
open output/your-event-slug.html
```

Check:
- ✅ All information is correct
- ✅ Registration form works
- ✅ Potluck sign-ups work (if enabled)
- ✅ Music requests work (if enabled)
- ✅ Mobile responsive

### Step 7: Deploy

Deploy to any static hosting:

**Cloudflare Pages:**
```bash
wrangler pages publish output --project-name=your-event
```

**Netlify:**
```bash
netlify deploy --dir=output --prod
```

**Or simply:**
- Upload to Google Cloud Storage
- Upload to AWS S3
- Upload to GitHub Pages
- Upload to Vercel

## For Developers: Technical Details

### Generator

The event generator (`generator/generate.ts`) is a TypeScript script that:

1. Reads a JSON configuration file
2. Loads the event page template
3. Replaces placeholders with your event data
4. Generates schedule HTML
5. Generates speaker cards
6. Generates registration fields
7. Outputs a complete HTML file

### Running the Generator

```bash
# Generate from config file
npm run generate:event path/to/config.json

# Generate example event
npm run generate:example
```

### Configuration Format

See `example-config.json` for the complete structure. Key sections:

```json
{
  "event": {
    "id": "unique-event-id",
    "title": "Event Name",
    "slug": "url-slug",
    "date": "January 15, 2026",
    "time": "6:00 PM - 9:00 PM",
    "location": "Venue Name, City",
    "description": "Event description..."
  },
  "potluck": {
    "enabled": true,
    "categories": ["Appetizers", "Main Dishes"],
    "showWhatOthersBring": true
  },
  "music": {
    "enabled": true,
    "type": "both",
    "service": "suno",
    "maxSongsPerGuest": 3
  },
  "registration": {
    "enabled": true,
    "collectPhone": true,
    "requireApproval": false
  }
}
```

### Template System

The template (`templates/default.html`) uses placeholders:

- `{{EVENT_TITLE}}` - Event name
- `{{EVENT_DATE}}` - Event date
- `{{EVENT_TIME}}` - Event time
- `{{EVENT_LOCATION}}` - Venue
- `{{EVENT_DESCRIPTION}}` - Description
- `{{SCHEDULE_HTML}}` - Generated schedule
- `{{SPEAKERS_HTML}}` - Generated speaker cards
- `{{REGISTRATION_FIELDS}}` - Generated form fields

## Branding

All event pages use cloudpeers brand colors:

### Color Palette

```css
/* Primary - Maroon */
--maroon: #7B1E1E;
--maroon-dark: #5A1616;
--maroon-light: #9B2E2E;

/* Secondary - Tan */
--tan: #D4A574;
--tan-dark: #B08A5C;
--tan-light: #E4C5A4;

/* Neutral - Slate */
--slate-50 to --slate-900
```

### Visual Elements

- Gradient headers (maroon to tan)
- cloudpeers "CP" logo
- Rounded corners (8px-16px)
- Soft shadows
- Mobile-first responsive design

## Support & Documentation

- **Quick Start**: This file (README.md)
- **Complete Guide**: `CREATOR_PORTAL_GUIDE.md`
- **Migration Details**: `../MIGRATION_COMPLETE.md`
- **Platform Overview**: `../README.md`
- **Type Definitions**: `../shared/types/event.ts`

## Examples

### Basic Event

Minimal configuration for a simple event with registration:

```json
{
  "event": {
    "id": "team-lunch-2026",
    "title": "Team Lunch",
    "slug": "team-lunch",
    "date": "March 1, 2026",
    "time": "12:00 PM - 2:00 PM",
    "location": "Office Cafeteria",
    "description": "Monthly team lunch and catch-up"
  },
  "registration": {
    "enabled": true
  }
}
```

### Potluck Event

Event with potluck coordination:

```json
{
  "event": { ... },
  "potluck": {
    "enabled": true,
    "categories": ["Appetizers", "Main Dishes", "Desserts", "Beverages"],
    "showWhatOthersBring": true,
    "instructions": "Please bring enough for 8-10 people"
  }
}
```

### Music Event

Event with AI-powered custom songs:

```json
{
  "event": { ... },
  "music": {
    "enabled": true,
    "type": "custom_song",
    "service": "suno",
    "maxSongsPerGuest": 2,
    "instructions": "Create a custom song about why you love our team!"
  }
}
```

## Tips & Best Practices

### Event Names
- Keep it short and catchy
- Include the purpose: "Tech Innovation Meetup"
- Avoid dates in the name (use the date field)

### URL Slugs
- Use lowercase
- Use hyphens instead of spaces
- Keep it short: `tech-meetup-jan26`
- Auto-generated if you leave it blank

### Descriptions
- First sentence is most important
- Use bullet points for clarity
- Include what makes your event special
- Mention any requirements (age, skill level, etc.)

### Capacity
- Leave blank for unlimited
- Set capacity to enable waitlist features
- Consider venue fire codes

### Potluck Categories
- Use 4-6 categories max
- Be specific: "Hot Main Dishes" vs "Main Dishes"
- Include dietary options: "Vegetarian", "Gluten-Free"

### Music Settings
- "Song Request" = guests suggest existing songs
- "Custom Song" = guests create new AI songs
- "Both" = maximum flexibility
- Set reasonable limits: 2-3 songs per guest

## Troubleshooting

### Config Not Loading
**Problem**: "Could not load example"

**Solution**:
- Make sure `example-config.json` is in the same directory
- Check that you're opening from `event-pages/` directory

### Generator Fails
**Problem**: `npm run generate:event` fails

**Solution**:
- Verify JSON syntax is valid
- Check all required fields are present
- Run from the project root directory

### Preview Shows Blank
**Problem**: Preview tab is empty

**Solution**:
- Generate the event first: `npm run generate:event`
- Refresh the page
- Check browser console for errors

### Icons Not Showing
**Problem**: Lucide icons don't appear

**Solution**:
- Check internet connection (CDN-based)
- Clear browser cache
- Try a different browser

## Getting Help

- **Documentation Issues**: Check other .md files in this directory
- **Configuration Help**: See `example-config.json`
- **Type Definitions**: See `../shared/types/event.ts`
- **Technical Support**: Contact cloudpeers team

---

**Built with cloudpeers Events Platform**

Simple, powerful, beautiful event management.

Created: December 21, 2025
Version: 2.0.0
