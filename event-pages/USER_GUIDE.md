# CloudPeers Events - User Guide

## How to Create Your Event (No Technical Skills Required!)

### Step 1: Open the Event Creator

1. Go to `events.cloudpeers.com` (or open `index.html` locally)
2. You'll see a clean, simple form

### Step 2: Fill In Your Event Details

#### Required Information (marked with *)
- **Event name**: "New Year's Eve Party", "Tech Meetup", etc.
- **Date**: Select from calendar
- **Time**: "6:00 PM - 9:00 PM"
- **Location**: "123 Main St, San Francisco, CA"

#### Optional Information
- **Description**: Tell guests what the event is about
- **Show more** for advanced options:
  - Event URL slug (auto-generated if blank)
  - Category (Social, Networking, etc.)
  - Capacity (leave blank for unlimited)

### Step 3: Enable Features You Want

#### 🍴 Potluck
Check this box to let guests sign up to bring food and drinks.

**When enabled, you can:**
- Add food categories (Appetizers, Main Dishes, Desserts, Beverages)
- Let guests see what others are bringing

**Example use case:**
> "Company potluck - everyone brings a dish to share!"

#### 🎵 Music Requests
Check this box to let guests contribute to the event playlist.

**Choose request type:**
- **Song Requests**: Guests suggest existing songs
- **AI-Generated Songs**: Guests create custom songs with AI (Suno or Udio)
- **Both**: Maximum flexibility!

**Example use case:**
> "Birthday party - guests can request their favorite songs or create a custom birthday song with AI!"

#### 📸 Photo Gallery
Check this box to enable photo sharing with magic link access.

**Example use case:**
> "Wedding reception - share photos with all guests via secure link"

### Step 4: Guest Settings

Choose what information to collect:
- ☐ Collect phone numbers
- ☐ Collect company/organization
- ☐ Require approval for RSVPs

### Step 5: Create Your Event

1. Click the big **"Create Event Page"** button at the bottom
2. A success modal will appear
3. Click **"Download Config"** to save your event configuration

### Step 6: Generate Event Page

Open your terminal and run:

```bash
npm run generate:event your-event-config.json
```

**What this does:**
- Takes your JSON configuration
- Creates a beautiful event landing page
- Saves it in the `output/` folder

### Step 7: Test Your Event Page

Open the generated HTML file in your browser:

```bash
open output/your-event-slug.html
```

**Check everything:**
- ✅ Event name, date, time, location are correct
- ✅ Description looks good
- ✅ Features work (potluck, music)
- ✅ Registration form works
- ✅ Page looks good on mobile (resize browser)

### Step 8: Deploy & Share

Upload your event page to:

**Easiest Options:**
- **Netlify**: Drag and drop the HTML file
- **Cloudflare Pages**: `wrangler pages publish output`
- **Vercel**: Deploy via GitHub

**Your event URL will be:**
```
events.cloudpeers.com/your-event-slug
```

**Share with guests:**
- Email the link
- Post on social media
- Add to calendar invites
- Print QR code for posters

---

## Quick Reference

### What Users See vs What You Create

| What You Fill In | What Users See |
|------------------|----------------|
| Event name | Big title at top of page |
| Date & Time | Calendar icon with details |
| Location | Map pin with address |
| Description | Full text with formatting |
| Potluck enabled | Sign-up form for dishes |
| Music enabled | Song request form |
| Photo gallery | Link to photo album |

### File Format: JSON Configuration

When you download your config, it's a JSON file that looks like:

```json
{
  "event": {
    "id": "nye-party-2026",
    "title": "New Year's Eve Party",
    "slug": "nye-party-2026",
    "date": "December 31, 2025",
    "time": "9:00 PM - 1:00 AM",
    "location": "The Grand Ballroom, Downtown",
    "description": "Ring in 2026 with friends!"
  },
  "potluck": {
    "enabled": true,
    "categories": ["Appetizers", "Main Dishes", "Desserts"]
  },
  "music": {
    "enabled": true,
    "type": "both"
  }
}
```

**You don't need to understand this** - the form creates it for you!

---

## Common Questions

### Q: Do I need to know how to code?
**A:** No! Just fill in the form like you would on Google Forms or Eventbrite.

### Q: Can I edit my event after creating it?
**A:** Yes! Import your JSON file using the "Import JSON" button, make changes, and regenerate.

### Q: What if I make a mistake?
**A:** Just click "Import JSON", upload your config, fix the mistake, and download again.

### Q: Can I create multiple events?
**A:** Yes! Each event gets its own JSON config file. Keep them organized with clear names.

### Q: How do guests RSVP?
**A:** They visit your event page and fill in the registration form. Responses go to your Supabase database.

### Q: Can I customize the look?
**A:** The current version uses CloudPeers branding. Custom branding is coming soon!

### Q: What about recurring events?
**A:** Create a separate event for each occurrence, or duplicate your JSON and change the dates.

---

## Tips for Great Events

### Event Names
✅ **Good**: "Tech Innovation Meetup - January 2026"
❌ **Bad**: "Meeting #47"

### Descriptions
✅ **Good**:
> Join us for an evening of innovation and networking! We'll have:
> - Keynote from Dr. Sarah Chen
> - Panel discussion on AI
> - Networking reception with refreshments

❌ **Bad**: "Event about tech stuff"

### Potluck Categories
✅ **Good**: "Appetizers", "Hot Main Dishes", "Vegetarian Options", "Desserts", "Drinks"
❌ **Bad**: "Food", "Stuff to eat"

### Music Settings
- For parties: Enable "Song Requests" or "Both"
- For creative events: Enable "AI-Generated Songs"
- For formal events: Leave disabled or use "Song Requests" only

---

## Workflow Summary

```
1. Open index.html
   ↓
2. Fill in form (5 minutes)
   ↓
3. Click "Create Event Page"
   ↓
4. Download JSON config
   ↓
5. Run: npm run generate:event config.json
   ↓
6. Test: open output/event.html
   ↓
7. Deploy to hosting service
   ↓
8. Share URL with guests!
```

**Total time:** ~10-15 minutes from start to published event!

---

## Getting Help

### Something Not Working?

**Form issues:**
- Refresh the page
- Try a different browser (Chrome, Firefox, Safari)
- Make sure JavaScript is enabled

**Generator issues:**
- Check that Node.js is installed: `node --version`
- Make sure you're in the right directory
- Verify JSON file was downloaded correctly

**Deployment issues:**
- Check hosting service documentation
- Verify HTML file is complete (open in browser first)
- Make sure Supabase credentials are configured

---

**You're ready to create amazing events! 🎉**

Start at: `events.cloudpeers.com` or `index.html`
