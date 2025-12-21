# CloudPeers Gallery

Private photo gallery for CloudPeers events with magic link authentication.

## Overview

The CloudPeers Gallery allows event organizers to share photos with attendees using secure, invite-only access. No accounts required - just magic links!

## Features

### For Event Organizers
- 📸 Upload high-quality photos (.jpg) and videos (.mp4)
- 🔐 Private albums with magic link access control
- 🎨 CloudPeers branding (maroon #7B1E1E, tan #D4A574)
- 📊 View engagement analytics
- 💬 Moderate comments

### For Event Attendees
- 🖼️ View high-resolution photos and videos
- 💬 Add comments with @mentions
- 📝 Add captions to photos
- ⬇️ Download media (if enabled by organizer)
- 🔔 Real-time comment updates

### For Photographers
- 📤 Upload photos and videos directly
- ✏️ Bulk caption editing
- 🏷️ Tag and organize media
- ⬇️ Download all originals

## Quick Start

### 1. Install Dependencies

```bash
cd gallery
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

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

### 3. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000/admin/login` to access the admin interface.

## Usage

### Creating an Album

1. Login at `/admin/login` with your admin email
2. Click magic link from email
3. Click "Create Album"
4. Add title and description
5. Copy the **Editor Invite URL**

### Uploading Photos

1. Open the Editor Invite URL
2. Drag and drop photos
3. Photos automatically upload to Cloudflare Images
4. Add captions and tags

### Sharing with Attendees

1. Generate **Viewer Invite Link** from admin dashboard
2. Share link with event attendees
3. Attendees can view and download photos (no login required!)

### Integration with Events

When creating an event with `index.html`:

1. Enable "Photo Gallery" checkbox
2. Generate your event config
3. Create a gallery album
4. Add the gallery URL to your event config:

```json
{
  "event": { ... },
  "gallery": {
    "enabled": true,
    "albumId": "your-album-id",
    "viewerUrl": "https://events.cloudpeers.com/gallery/a/your-album-id"
  }
}
```

5. Regenerate the event page - it will now include a gallery link!

## CloudPeers Branding

The gallery uses CloudPeers brand colors:

### Color Palette

```css
/* Primary - Maroon */
--brand-color: #7B1E1E;
--brand-dark: #5A1616;

/* Secondary - Tan */
--brand-accent: #D4A574;
--brand-light: #E4C5A4;
```

### Tailwind Classes

```jsx
className="bg-maroon text-white"      // Maroon button
className="bg-tan text-maroon-dark"   // Tan accent
className="border-maroon"              // Maroon border
```

## Architecture

```
gallery/
├── src/
│   ├── app/
│   │   ├── admin/           # Admin dashboard
│   │   ├── a/[albumId]/    # Album viewer
│   │   └── login/          # Magic link login
│   ├── components/
│   │   ├── AlbumViewer.tsx
│   │   ├── PhotoUpload.tsx
│   │   └── UserMenu.tsx
│   └── lib/
│       ├── supabase/       # Database client
│       └── cloudflare.ts   # Image upload
├── package.json
├── tailwind.config.js      # CloudPeers colors
└── .env.local             # Credentials (not committed)
```

## Database Schema

The gallery uses Supabase with these tables:

- **albums** - Photo albums for events
- **photos** - Individual photos and videos
- **comments** - User comments on photos
- **invites** - Magic link access tokens

## Scripts

```bash
# Development
npm run dev              # Start dev server on port 3000
npm run build            # Build for production
npm run start            # Start production server

# Type checking
npm run typecheck        # Check TypeScript types

# Database
npm run setup:db         # Create database tables
```

## Deployment

### Google Cloud Run

```bash
# Build and deploy
gcloud run deploy cloudpeers-gallery \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

### Environment Variables

Set in Cloud Run or your hosting platform:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_IMAGES_HASH`

## Magic Link Authentication

The gallery uses magic links for authentication:

1. User enters email
2. System sends magic link email
3. User clicks link → Logged in!
4. No passwords, no OAuth complexity

### Roles

- **Admin**: Can create albums, upload photos, moderate
- **Editor**: Can upload photos to specific albums
- **Viewer**: Can view and comment on photos

## Integration with CloudPeers Events

### In Event Pages

When gallery is enabled, event pages display:

```html
<section id="gallery">
  <h2>Event Photos</h2>
  <a href="/gallery/a/album-id">View Photo Gallery →</a>
  <p>Share your photos from the event!</p>
</section>
```

### In Creator Forms

`index.html` includes a gallery checkbox:

```html
<input type="checkbox" x-model="enableGallery">
<label>Enable Photo Gallery</label>
```

When checked, the generated config includes gallery settings.

## Customization

### Changing Colors

Edit `tailwind.config.js`:

```javascript
colors: {
  maroon: {
    DEFAULT: '#YourColor',
    dark: '#YourDarkColor',
    light: '#YourLightColor',
  },
}
```

### Adding Features

The gallery is built with Next.js 14 App Router:

- Add new routes in `src/app/`
- Add new components in `src/components/`
- Add new API routes in `src/app/api/`

## Troubleshooting

### Photos Not Uploading

- Check Cloudflare credentials in `.env.local`
- Verify Cloudflare Images is enabled in your account
- Check browser console for errors

### Magic Links Not Working

- Verify Supabase email settings
- Check spam folder
- Ensure `NEXT_PUBLIC_SUPABASE_URL` is correct

### Gallery Not Showing in Event

- Make sure gallery is enabled in event config
- Verify `gallery.viewerUrl` is set correctly
- Regenerate event page after updating config

## Support

For help:
- Check `../README.md` for platform overview
- See Supabase docs for database issues
- See Cloudflare Images docs for upload issues

---

**CloudPeers Gallery**

Share beautiful event memories with magic link simplicity.

Version: 1.0.0
Last Updated: December 21, 2025
