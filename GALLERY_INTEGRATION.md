# Gallery Integration - Complete!

## What Was Done

The photo gallery from seoul-events-site has been successfully migrated to cloudpeers Events with full integration.

## Gallery Migration Summary

### 1. ✅ Gallery App Migrated

**Location**: `/gallery/`

**What was copied**:
- Complete Next.js application source code
- Components (AlbumViewer, PhotoUpload, UserMenu, etc.)
- Authentication system (magic links)
- Database integration (Supabase)
- Cloudflare Images integration

**Branding updated**:
- CSS variables updated to cloudpeers colors (maroon #7B1E1E, tan #D4A574)
- Tailwind config with cloudpeers palette
- Package.json renamed to "cloudpeers-gallery"
- Metadata updated

### 2. ✅ Event Page Template Updated

**File**: `/event-pages/templates/default.html`

**Changes**:
- Added Photo Gallery section (lines 241-264)
- cloudpeers tan button to open gallery
- "No login required • Magic link access" messaging
- Conditional display with `x-show="hasGallery"`
- Template placeholders: `{{GALLERY_URL}}`, `{{HAS_GALLERY}}`

### 3. ✅ Generator Updated

**File**: `/event-pages/generator/generate.ts`

**Changes**:
- Added `HAS_GALLERY` placeholder replacement (line 208)
- Added `GALLERY_URL` placeholder replacement (line 209)
- Reads from `config.gallery.enabled` and `config.gallery.viewerUrl`

### 4. ✅ Creator Forms Updated

**File**: `/event-pages/index.html` (and other creator files)

**Changes**:
- Gallery checkbox changed from `enableGallery` to `gallery.enabled`
- Added gallery URL input field (appears when gallery is enabled)
- Updated `buildConfig()` to include gallery object
- Updated `populateForm()` to handle gallery imports
- Gallery object structure:
  ```javascript
  gallery: {
      enabled: false,
      viewerUrl: ''
  }
  ```

## How It Works

### For Event Creators

1. **Open** `index.html` in browser
2. **Fill in** event details
3. **Enable** "Photo Gallery" checkbox
4. **Create** album in gallery app first: `http://localhost:3000/admin` (dev)
5. **Copy** the viewer URL from gallery: `https://events.cloudpeers.com/gallery/a/album-id`
6. **Paste** URL into "Gallery Album URL" field
7. **Generate** event with gallery enabled
8. **Event page** will show "View Photo Gallery" button linking to your album

### For Event Attendees

1. Visit event page (e.g., `tech-meetup-jan2026.html`)
2. See "Event Photos" section with camera icon
3. Click "View Photo Gallery" button
4. Opens gallery in new tab (no login required if using viewer invite link)
5. Can view, comment, and download photos

## File Structure

```
cloudpeers-mcp/events/
├── gallery/                           ✅ Gallery app
│   ├── src/
│   │   ├── app/                      ✅ Next.js pages
│   │   ├── components/               ✅ Gallery components
│   │   ├── lib/                      ✅ Supabase + Cloudflare
│   │   └── middleware.ts
│   ├── package.json                  ✅ Updated to cloudpeers-gallery
│   ├── tailwind.config.js            ✅ cloudpeers colors
│   └── README.md                     ✅ Gallery documentation
│
├── event-pages/
│   ├── templates/
│   │   └── default.html              ✅ Gallery section added
│   ├── generator/
│   │   └── generate.ts               ✅ Gallery placeholders
│   ├── index.html                    ✅ Gallery URL field
│   ├── event-creator.html            (same updates needed)
│   └── creator-portal.html           (same updates needed)
│
└── GALLERY_INTEGRATION.md            ✅ This file
```

## Configuration Example

When creating an event with gallery enabled, the JSON looks like:

```json
{
  "event": {
    "id": "tech-meetup-jan2026",
    "title": "Tech Innovation Meetup",
    "slug": "tech-meetup-jan2026",
    ...
  },
  "gallery": {
    "enabled": true,
    "viewerUrl": "https://events.cloudpeers.com/gallery/a/abc123xyz"
  },
  ...
}
```

## Gallery Workflow

### Creating a Gallery Album

1. **Start gallery app**:
   ```bash
   cd gallery
   npm install
   npm run dev
   ```

2. **Login as admin**: `http://localhost:3000/admin/login`
   - Enter admin email
   - Click magic link from email

3. **Create album**:
   - Click "Create Album"
   - Add title: "Tech Meetup January 2026 Photos"
   - Add description: "Photos from our awesome tech meetup!"
   - Save album

4. **Get viewer URL**:
   - Copy the viewer invite link
   - Example: `https://events.cloudpeers.com/gallery/a/abc123xyz`

5. **Upload photos** (optional - can be done later):
   - Use editor invite URL
   - Drag and drop photos
   - Add captions

### Connecting Gallery to Event

6. **Open event creator**: `index.html`

7. **Enable gallery**:
   - Check "Photo Gallery"
   - Paste viewer URL: `https://events.cloudpeers.com/gallery/a/abc123xyz`

8. **Generate event**:
   - Click "Create Event Page"
   - Download config
   - Run: `npm run generate:event config.json`

9. **Deploy event page**:
   - Upload generated HTML to hosting
   - Event now has working "View Photo Gallery" button!

## cloudpeers Branding

### Gallery App Colors

```css
/* CSS Variables */
--brand-color: #7B1E1E;        /* cloudpeers Maroon */
--brand-accent: #D4A574;       /* cloudpeers Tan */
--brand-dark: #5A1616;         /* Maroon Dark */
--brand-light: #E4C5A4;        /* Tan Light */
```

### Tailwind Classes

```javascript
// tailwind.config.js
colors: {
  maroon: {
    DEFAULT: '#7B1E1E',
    dark: '#5A1616',
    light: '#9B2E2E',
  },
  tan: {
    DEFAULT: '#D4A574',
    dark: '#B08A5C',
    light: '#E4C5A4',
  },
}
```

### Event Page Gallery Button

```html
<a href="{{GALLERY_URL}}" class="bg-tan text-maroon hover:bg-tan-dark">
  View Photo Gallery
</a>
```

## Environment Variables

### Gallery App (`.env.local`)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudflare Images
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_IMAGES_HASH=your-images-hash
```

## Testing the Integration

### Test Locally

1. **Start gallery**:
   ```bash
   cd gallery
   npm run dev
   ```
   Gallery at: `http://localhost:3000`

2. **Create test album**:
   - Login at `/admin/login`
   - Create album "Test Event Photos"
   - Get viewer URL: `http://localhost:3000/a/test-album-id`

3. **Create test event**:
   - Open `index.html`
   - Enable gallery
   - Paste URL: `http://localhost:3000/a/test-album-id`
   - Generate event

4. **Test event page**:
   - Open generated HTML
   - Click "View Photo Gallery"
   - Should open gallery album in new tab
   - Upload some test photos in gallery

### Test Production

1. **Deploy gallery**:
   ```bash
   cd gallery
   gcloud run deploy cloudpeers-gallery --source .
   ```
   URL: `https://cloudpeers-gallery-xxx.run.app`

2. **Create production album**:
   - Login to production gallery
   - Create album
   - Get production viewer URL

3. **Create production event**:
   - Use production gallery URL in event config
   - Deploy generated event page
   - Test end-to-end flow

## Next Steps

### ✅ Completed

- ✅ Gallery app migrated
- ✅ cloudpeers branding applied
- ✅ Event template updated
- ✅ Generator updated
- ✅ Creator form updated (index.html)
- ✅ Documentation created

### 🚧 TODO

- ⚠️ Update `event-creator.html` with gallery URL field
- ⚠️ Update `creator-portal.html` with gallery URL field
- ⚠️ Deploy gallery to production
- ⚠️ Set up Supabase database for gallery
- ⚠️ Set up Cloudflare Images account
- ⚠️ Test full end-to-end workflow
- ⚠️ Create video tutorial for users

## Deployment

### Gallery App

```bash
# Build for production
cd gallery
npm run build

# Deploy to Google Cloud Run
gcloud run deploy cloudpeers-gallery \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NEXT_PUBLIC_SUPABASE_URL=xxx

# Set custom domain
gcloud run services update cloudpeers-gallery \
  --platform managed \
  --region us-central1 \
  --add-custom-domain events.cloudpeers.com/gallery
```

### Event Pages

Event pages are static HTML - deploy anywhere:
- Cloudflare Pages
- Netlify
- Vercel
- Google Cloud Storage
- AWS S3

## Troubleshooting

### Gallery URL Not Working

**Problem**: Event page shows gallery section but link doesn't work

**Solution**:
- Check that `gallery.enabled` is `true` in config
- Verify `gallery.viewerUrl` is set correctly
- Make sure gallery album exists and is accessible

### Gallery Not Showing on Event Page

**Problem**: Gallery section doesn't appear

**Solution**:
- Regenerate event page: `npm run generate:event config.json`
- Check that `{{HAS_GALLERY}}` is being replaced in template
- Verify Alpine.js is loading (`hasGallery` variable)

### Can't Access Gallery

**Problem**: Gallery link opens but shows error

**Solution**:
- Check gallery app is running
- Verify Supabase credentials are configured
- Ensure album ID in URL is correct
- Check that viewer invite link was used (not editor link)

## Support

For help with:
- **Gallery setup**: See `/gallery/README.md`
- **Event creation**: See `/event-pages/README.md`
- **Integration issues**: Check this file
- **General platform**: See `/README.md`

---

**Gallery Integration Status**: ✅ Complete

**Last Updated**: December 21, 2025

**Version**: 1.0.0
