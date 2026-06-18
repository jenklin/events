# cloudpeers Event Creator Portal Guide

## Overview

The **creator-portal.html** is a comprehensive, standalone HTML event management interface that combines:

- **Design patterns** from gui-norae-creator.html (tabbed interface, preview, deployment)
- **cloudpeers branding** (maroon #7B1E1E, tan #D4A574, grey slate tones)
- **Advanced features** (potluck coordination, music/playlist requests, guest management)
- **Simple tech stack** (HTML + Tailwind CSS CDN + Alpine.js + Lucide Icons)

## Features

### 7 Main Tabs

1. **Overview** - Event summary with quick stats
   - Event name, date, venue, URL
   - Schedule items count, speakers count
   - Potluck and music status indicators
   - Feature highlight cards

2. **Preview** - Live event page preview
   - iframe showing generated event page
   - "Open in New Tab" button
   - Real-time preview of event landing page

3. **Configuration** - JSON config viewer
   - Full configuration display
   - Download JSON button
   - Instructions for editing configuration

4. **Potluck** - Potluck coordination settings
   - Enabled/disabled status
   - Food categories display
   - Show what others are bringing setting
   - Guest instructions

5. **Music/Playlist** - Music request settings
   - Request type (song_request, custom_song, both)
   - AI service (Suno, Udio)
   - Max songs per guest
   - Show playlist setting
   - Guest instructions

6. **Guest Settings** - RSVP and capacity management
   - Guest capacity (max guests, waitlist)
   - Plus-ones settings
   - Approval requirements
   - Photo upload permissions
   - RSVP information collection

7. **Deploy** - Deployment instructions
   - Pre-deployment checklist
   - 4-step deployment guide
   - Cloudflare Pages deployment
   - Custom domain setup
   - Testing checklist

## Technology Stack

- **HTML5** - Semantic markup
- **Tailwind CSS 4** - Via CDN, no build step
- **Alpine.js 3** - Reactive data binding
- **Lucide Icons** - Icon library
- **No build process** - Open directly in browser

## File Structure

```
event-pages/
├── creator-portal.html          ← The creator portal (this file)
├── example-config.json          ← Sample event configuration
├── output/
│   └── tech-meetup-jan2026.html ← Generated event page
├── templates/
│   └── default.html             ← Event page template
└── generator/
    └── generate.ts              ← TypeScript event generator
```

## How to Use

### 1. Open the Portal

Simply open `creator-portal.html` in your web browser:

```bash
# From command line
open event-pages/creator-portal.html

# Or double-click the file in Finder/Explorer
```

### 2. View Event Details

The portal automatically loads `example-config.json` and displays:
- Event overview and stats
- Schedule and speakers
- Potluck settings (if enabled)
- Music/playlist settings (if enabled)
- Guest settings and capacity

### 3. Preview Generated Event

Click the **Preview** tab to see the live event page in an iframe. You can:
- View the full event landing page
- Click "Open in New Tab" to test in full screen
- Test registration form
- Test potluck sign-ups (if enabled)
- Test music requests (if enabled)

### 4. Download Configuration

Click the **Configuration** tab and use the "Download JSON" button to:
- Get the current event configuration
- Edit it in your text editor
- Use it to generate a new event page

### 5. Review Settings

Explore the **Potluck**, **Music**, and **Guest Settings** tabs to see all configured options.

### 6. Deploy Your Event

Follow the **Deploy** tab instructions:

1. **Generate event page**
   ```bash
   npm run generate:event path/to/your-config.json
   ```

2. **Deploy to Cloudflare Pages**
   ```bash
   wrangler pages publish event-pages/output --project-name=your-event-name
   ```

3. **Configure custom domain** in Cloudflare Dashboard

4. **Test live site** - Verify all features work

## cloudpeers Branding

### Color Scheme

- **Primary (Maroon)**: `#7B1E1E`
- **Maroon Dark**: `#5A1616`
- **Maroon Light**: `#9B2E2E`
- **Secondary (Tan)**: `#D4A574`
- **Tan Dark**: `#B08A5C`
- **Tan Light**: `#E4C5A4`
- **Neutral**: Slate tones (50-900)
- **Background**: White with subtle gradients

### Visual Elements

- Gradient headers (maroon to tan)
- Status badges (green for enabled, grey for disabled)
- Soft gradient backgrounds
- cloudpeers "CP" logo badge

## Customization

### Using Your Own Config

1. Create a new JSON config file (use `example-config.json` as template)
2. Generate the event page:
   ```bash
   npm run generate:event my-event-config.json
   ```
3. The creator portal will automatically display the new event data

### Changing Branding

To customize colors, edit the CSS section (lines 11-101):

```css
/* cloudpeers Brand Colors */
.text-maroon { color: #7B1E1E; }      /* Change to your primary color */
.text-tan { color: #D4A574; }          /* Change to your secondary color */
```

Update Tailwind config (lines 83-100):
```javascript
tailwind.config = {
    theme: {
        extend: {
            colors: {
                maroon: {
                    DEFAULT: '#7B1E1E',  /* Your primary color */
                    dark: '#5A1616',
                    light: '#9B2E2E',
                },
                tan: {
                    DEFAULT: '#D4A574',  /* Your secondary color */
                    dark: '#B08A5C',
                    light: '#E4C5A4',
                }
            }
        }
    }
}
```

## Key Features

### Alpine.js Reactivity

The portal uses Alpine.js for:
- Tab switching (`x-show`, `@click`)
- Config loading (`x-init`, `async loadConfig()`)
- Dynamic content binding (`x-text`)
- Conditional rendering (`x-show`)

### Config Loading

The portal loads `example-config.json` on page load:

```javascript
async loadConfig() {
    try {
        const response = await fetch('example-config.json');
        this.config = await response.json();
    } catch (error) {
        // Fallback to default config
        this.config = { event: { title: 'Sample Event' } };
    }
}
```

### Download Functionality

The "Download JSON" button creates a downloadable JSON file:

```javascript
downloadConfig() {
    const dataStr = "data:text/json;charset=utf-8," +
                    encodeURIComponent(JSON.stringify(this.config, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${this.config.event?.slug}-config.json`);
    downloadAnchorNode.click();
}
```

## Troubleshooting

### Portal Shows Default Data

**Issue**: Portal shows "Sample Event" instead of your event data

**Solution**: Ensure `example-config.json` is in the same directory as `creator-portal.html`

### Preview Shows Blank

**Issue**: Preview tab shows empty iframe

**Solution**:
1. Verify `output/tech-meetup-jan2026.html` exists
2. Run `npm run generate:example` to create the example event
3. Check browser console for CORS errors

### Icons Not Showing

**Issue**: Lucide icons not appearing

**Solution**:
1. Check internet connection (CDN-based)
2. Open browser console and look for errors
3. Ensure `lucide.createIcons()` is being called

### Tabs Not Switching

**Issue**: Clicking tabs doesn't change content

**Solution**:
1. Check browser console for Alpine.js errors
2. Ensure Alpine.js CDN loaded correctly
3. Try refreshing the page

## Comparison to GUI Norae Creator

| Feature | GUI Norae Creator | cloudpeers Creator Portal |
|---------|-------------------|---------------------------|
| Branding | Red Helicopter | cloudpeers (Maroon/Tan) |
| Tabs | 3 (Preview, Config, Deploy) | 7 (Overview, Preview, Config, Potluck, Music, Guests, Deploy) |
| Potluck | ✅ Basic | ✅ Advanced with categories |
| Music | ✅ Basic | ✅ Advanced with AI services |
| Guest Settings | ❌ Not shown | ✅ Full management |
| Stats Dashboard | ❌ Not shown | ✅ Quick stats on overview |
| Pre-deployment Checklist | ❌ Not shown | ✅ Interactive checklist |
| Tech Stack | HTML + Alpine.js | HTML + Tailwind 4 + Alpine.js |

## Benefits of This Approach

### No Build Step Required

- Open directly in browser
- No npm install, no compilation
- Instant changes, instant preview

### Simple Deployment

- Single HTML file
- Can be hosted anywhere
- No server-side rendering needed

### Easy Customization

- All code in one file
- CSS in `<style>` tags
- JavaScript in `<script>` tags
- Edit with any text editor

### Full Feature Parity

All cloudpeers Events features:
- ✅ Event registration
- ✅ QR code generation
- ✅ Potluck coordination
- ✅ Music/playlist requests
- ✅ Speaker profiles
- ✅ Schedule builder
- ✅ Guest management
- ✅ Photo gallery integration

## Next Steps

1. **Customize for your brand** - Update colors, logo, footer
2. **Create your event** - Edit `example-config.json` or create new config
3. **Generate event page** - Run `npm run generate:event`
4. **Test thoroughly** - Use the Preview tab and checklist
5. **Deploy** - Follow the Deploy tab instructions
6. **Share** - Send your event URL to guests!

## Support

For help with:
- **Technical issues**: Check `README.md` and `MIGRATION_COMPLETE.md`
- **Configuration**: See `example-config.json` for all options
- **Type definitions**: See `shared/types/event.ts` for TypeScript types
- **cloudpeers team**: Contact for feature requests

---

**Built with cloudpeers Events Platform**
- Simple, powerful, beautiful event management
- No build process, no complexity
- Just HTML, CSS, and JavaScript

Created: December 21, 2025
Version: 2.0.0
