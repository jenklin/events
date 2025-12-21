-- =====================================================
-- Enhanced Events Database Schema
-- =====================================================
-- Feature parity with modern event management platforms
-- Includes: RSVP management, guest tracking, waitlists,
-- approvals, activity logs, and more
-- =====================================================

-- =====================================================
-- EVENTS TABLE (Enhanced)
-- =====================================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  event_id TEXT NOT NULL UNIQUE,          -- Custom slug/ID (e.g., "sarahs-30th")
  title TEXT NOT NULL,
  description TEXT,

  -- Custom Subdomain (OPTIONAL)
  custom_subdomain TEXT UNIQUE,           -- e.g., "myevent" for myevent.redheli.com
  subdomain_provider TEXT CHECK (subdomain_provider IN ('redheli.com', 'cloudpeers.com')),
  /* Examples:
     - custom_subdomain: "sarahs30th", subdomain_provider: "redheli.com" → sarahs30th.redheli.com
     - custom_subdomain: "techsummit", subdomain_provider: "cloudpeers.com" → techsummit.cloudpeers.com
     - custom_subdomain: NULL → uses path-based URL: events.cloudpeers.com/e/event-id
  */

  -- Cover Image & Theme (Modern event platform feature)
  cover_image_type TEXT CHECK (cover_image_type IN ('preset', 'custom')),
  cover_image_theme TEXT CHECK (cover_image_theme IN ('classic', 'eclectic', 'fancy', 'literary', 'digital', 'elegant', 'simple')),
  cover_image_url TEXT,

  -- Host Information
  host_name TEXT NOT NULL,
  host_email TEXT NOT NULL,
  host_photo_url TEXT,

  -- Date & Time
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',

  -- Location (with privacy)
  location_name TEXT,
  location_address TEXT,
  location_description TEXT,
  nearest_station TEXT,
  google_maps_link TEXT,
  hide_location_until_rsvp BOOLEAN DEFAULT FALSE,  -- Modern event platform feature
  show_location_only_approved BOOLEAN DEFAULT FALSE,

  -- Capacity & Waitlist (Modern event platform features)
  capacity_enabled BOOLEAN DEFAULT FALSE,
  max_guests INTEGER,                     -- NULL means unlimited
  enable_waitlist BOOLEAN DEFAULT FALSE,
  current_guest_count INTEGER DEFAULT 0,
  waitlist_count INTEGER DEFAULT 0,

  -- Cost
  has_cost BOOLEAN DEFAULT FALSE,
  cost_amount DECIMAL(10, 2),
  cost_currency TEXT DEFAULT 'USD',
  cost_per_person BOOLEAN DEFAULT TRUE,
  cost_description TEXT,

  -- Visibility (Modern event platform features)
  is_public BOOLEAN DEFAULT FALSE,
  password_hash TEXT,                      -- Password protection
  show_guest_names BOOLEAN DEFAULT TRUE,
  show_guest_count BOOLEAN DEFAULT TRUE,
  show_guest_photos BOOLEAN DEFAULT TRUE,
  show_activity_timestamps BOOLEAN DEFAULT TRUE,

  -- RSVP Settings
  rsvp_enabled BOOLEAN DEFAULT TRUE,
  require_approval BOOLEAN DEFAULT FALSE,  -- Modern event platforms: host approval required
  allow_plus_ones BOOLEAN DEFAULT FALSE,
  max_plus_ones INTEGER DEFAULT 0,
  allow_mutual_invites BOOLEAN DEFAULT FALSE, -- Modern event platforms: guests invite contacts
  collect_guest_photos BOOLEAN DEFAULT FALSE,

  -- Potluck Settings (OPTIONAL)
  is_potluck BOOLEAN DEFAULT FALSE,         -- Enable potluck food tracking
  potluck_categories TEXT[],                -- Suggested categories: ["Appetizer", "Main Dish", "Side Dish", "Dessert", "Drinks"]
  potluck_needs JSONB DEFAULT '[]'::jsonb, -- What the host needs people to bring
  /* Example potluck_needs:
  [
    {"category": "Main Dish", "needed": 3, "claimed": 1},
    {"category": "Dessert", "needed": 2, "claimed": 0},
    {"category": "Drinks", "needed": "unlimited", "claimed": 5}
  ]
  */

  -- Music Contribution Settings (OPTIONAL)
  enable_music_contributions BOOLEAN DEFAULT FALSE,
  music_contribution_type TEXT CHECK (music_contribution_type IN ('song_request', 'custom_song', 'both')),
  custom_song_service TEXT,                -- e.g., "suno", "udio", "custom_api"
  music_instructions TEXT,                  -- Instructions for guests
  max_song_requests INTEGER,                -- Limit songs per guest (optional)

  -- Communications
  send_confirmation_email BOOLEAN DEFAULT TRUE,
  send_reminder_emails BOOLEAN DEFAULT TRUE,

  -- Host Tools
  enable_check_ins BOOLEAN DEFAULT FALSE,
  enable_guest_export BOOLEAN DEFAULT TRUE,

  -- Branding (JSONB for flexibility)
  branding JSONB DEFAULT '{}'::jsonb,

  -- Full event configuration (stores complete template)
  config JSONB DEFAULT '{}'::jsonb,

  -- Metadata
  organization_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  -- Stats
  total_views INTEGER DEFAULT 0,
  total_rsvps INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,

  -- Indexes
  CONSTRAINT valid_capacity CHECK (
    (capacity_enabled = FALSE) OR
    (capacity_enabled = TRUE AND max_guests IS NOT NULL AND max_guests > 0)
  )
);

-- Indexes for events
CREATE INDEX idx_events_event_id ON events(event_id);
CREATE INDEX idx_events_host_email ON events(host_email);
CREATE INDEX idx_events_date ON events(event_date DESC);
CREATE INDEX idx_events_org ON events(organization_id);
CREATE INDEX idx_events_public ON events(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_events_not_deleted ON events(event_date) WHERE deleted_at IS NULL;

-- =====================================================
-- RSVP RESPONSES TABLE (Modern)
-- =====================================================

CREATE TABLE rsvp_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,

  -- Guest Information
  guest_email TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  guest_phone TEXT,
  guest_photo_url TEXT,                    -- Modern event platforms: guest can upload photo

  -- RSVP Status (Modern event platforms: Going/Maybe/Can't Go)
  status TEXT NOT NULL CHECK (status IN ('going', 'maybe', 'cant_go', 'pending', 'approved', 'declined', 'waitlisted')),
  previous_status TEXT,                    -- Track status changes

  -- Plus Ones
  plus_ones INTEGER DEFAULT 0,
  plus_one_names TEXT[],                   -- Array of plus one names

  -- Custom Fields (collected during RSVP)
  custom_responses JSONB DEFAULT '{}'::jsonb,
  /* Example:
  {
    "dietaryRestrictions": "Vegan",
    "songRequest": "Dancing Queen by ABBA",
    "shirtSize": "M"
  }
  */

  -- Potluck Contribution (OPTIONAL - for potluck-style events)
  bringing_food BOOLEAN DEFAULT FALSE,
  food_items JSONB DEFAULT '[]'::jsonb,
  /* Example:
  [
    {
      "name": "Pasta Salad",
      "category": "Main Dish",
      "servings": 8,
      "dietaryInfo": ["Vegetarian", "Gluten-free"],
      "notes": "Will need serving bowl"
    },
    {
      "name": "Chocolate Brownies",
      "category": "Dessert",
      "servings": 12,
      "dietaryInfo": [],
      "notes": "Homemade with love!"
    }
  ]
  */

  -- Music Contribution (OPTIONAL - for events with playlist/custom songs)
  music_contribution JSONB DEFAULT '{}'::jsonb,
  /* Example:
  {
    "type": "song_request",  // or "custom_song"
    "songRequest": "Dancing Queen - ABBA",
    "customSongPrompt": null,
    "artistName": "ABBA",
    "songUrl": "https://open.spotify.com/track/...",
    "notes": "This was our college anthem!"
  }
  OR
  {
    "type": "custom_song",
    "songRequest": null,
    "customSongPrompt": "A funky celebration of Sarah's love for coffee and adventure",
    "generatedSongUrl": null,  // Filled in after AI generation
    "played": false
  }
  */

  -- Approval Workflow (Modern event platform feature)
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by TEXT,                        -- Host email who approved
  approved_at TIMESTAMP WITH TIME ZONE,
  decline_reason TEXT,

  -- Sharing & Invites
  invited_by TEXT,                         -- Email of person who invited them
  invite_type TEXT CHECK (invite_type IN ('host', 'mutual', 'guest_share')),

  -- Check-in (for day-of event)
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  rsvp_source TEXT,                        -- 'web', 'email', 'qr_code', etc.
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT fk_event FOREIGN KEY (event_id)
    REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT unique_guest_per_event UNIQUE (event_id, guest_email)
);

-- Indexes for RSVP responses
CREATE INDEX idx_rsvp_event ON rsvp_responses(event_id);
CREATE INDEX idx_rsvp_email ON rsvp_responses(guest_email);
CREATE INDEX idx_rsvp_status ON rsvp_responses(event_id, status);
CREATE INDEX idx_rsvp_pending_approval ON rsvp_responses(event_id, status)
  WHERE status = 'pending';
CREATE INDEX idx_rsvp_created ON rsvp_responses(created_at DESC);

-- =====================================================
-- GUEST ACTIVITY LOG (Modern event platforms: activity timestamps)
-- =====================================================

CREATE TABLE guest_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  rsvp_id UUID,

  -- Activity Details
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'page_view',
    'rsvp_submitted',
    'rsvp_updated',
    'rsvp_cancelled',
    'guest_invited',
    'photo_uploaded',
    'comment_posted',
    'event_shared',
    'waitlist_joined',
    'approval_granted',
    'approval_denied',
    'checked_in'
  )),

  guest_email TEXT,
  guest_name TEXT,

  -- Activity Data (flexible JSONB)
  activity_data JSONB DEFAULT '{}'::jsonb,
  /* Examples:
  {
    "statusChange": {"from": "maybe", "to": "going"},
    "invitedGuests": ["friend@example.com"],
    "photoUrl": "https://...",
    "shareMethod": "twitter"
  }
  */

  -- Metadata
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT fk_event_activity FOREIGN KEY (event_id)
    REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_rsvp_activity FOREIGN KEY (rsvp_id)
    REFERENCES rsvp_responses(id) ON DELETE SET NULL
);

-- Indexes for activity log
CREATE INDEX idx_activity_event ON guest_activity_log(event_id);
CREATE INDEX idx_activity_type ON guest_activity_log(event_id, activity_type);
CREATE INDEX idx_activity_guest ON guest_activity_log(guest_email);
CREATE INDEX idx_activity_time ON guest_activity_log(created_at DESC);

-- =====================================================
-- WAITLIST TABLE (Modern event platform feature)
-- =====================================================

CREATE TABLE event_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,

  -- Guest Information
  guest_email TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  guest_phone TEXT,

  -- Waitlist Position
  position INTEGER NOT NULL,               -- Position in queue

  -- Notification Preferences
  notify_on_availability BOOLEAN DEFAULT TRUE,
  notified_at TIMESTAMP WITH TIME ZONE,

  -- Status
  status TEXT CHECK (status IN ('waiting', 'offered', 'accepted', 'declined', 'expired')),

  -- Offer Tracking
  offer_sent_at TIMESTAMP WITH TIME ZONE,
  offer_expires_at TIMESTAMP WITH TIME ZONE,

  -- Custom Data
  custom_responses JSONB DEFAULT '{}'::jsonb,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT fk_event_waitlist FOREIGN KEY (event_id)
    REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT unique_waitlist_per_event UNIQUE (event_id, guest_email)
);

-- Indexes for waitlist
CREATE INDEX idx_waitlist_event ON event_waitlist(event_id);
CREATE INDEX idx_waitlist_position ON event_waitlist(event_id, position);
CREATE INDEX idx_waitlist_status ON event_waitlist(event_id, status);

-- =====================================================
-- GUEST COMMENTS/MESSAGES (Optional Modern event platform feature)
-- =====================================================

CREATE TABLE guest_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  rsvp_id UUID,

  -- Comment Details
  guest_email TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  comment_text TEXT NOT NULL,

  -- Parent Comment (for threading)
  parent_comment_id UUID,

  -- Moderation
  is_visible BOOLEAN DEFAULT TRUE,
  moderated_by TEXT,
  moderated_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT fk_event_comment FOREIGN KEY (event_id)
    REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_rsvp_comment FOREIGN KEY (rsvp_id)
    REFERENCES rsvp_responses(id) ON DELETE SET NULL,
  CONSTRAINT fk_parent_comment FOREIGN KEY (parent_comment_id)
    REFERENCES guest_comments(id) ON DELETE CASCADE
);

-- Indexes for comments
CREATE INDEX idx_comments_event ON guest_comments(event_id);
CREATE INDEX idx_comments_visible ON guest_comments(event_id)
  WHERE is_visible = TRUE;
CREATE INDEX idx_comments_time ON guest_comments(created_at DESC);

-- =====================================================
-- REMINDER QUEUE (Automated communications)
-- =====================================================

CREATE TABLE reminder_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,

  -- Reminder Details
  reminder_type TEXT CHECK (reminder_type IN ('confirmation', 'reminder', 'follow_up', 'thank_you')),

  -- Recipients
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,

  -- Timing
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,

  -- Status
  status TEXT CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),

  -- Message Content
  subject TEXT,
  message_body TEXT,
  template_id TEXT,
  template_data JSONB DEFAULT '{}'::jsonb,

  -- Delivery Tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT fk_event_reminder FOREIGN KEY (event_id)
    REFERENCES events(id) ON DELETE CASCADE
);

-- Indexes for reminder queue
CREATE INDEX idx_reminders_event ON reminder_queue(event_id);
CREATE INDEX idx_reminders_pending ON reminder_queue(scheduled_for)
  WHERE status = 'pending';
CREATE INDEX idx_reminders_status ON reminder_queue(event_id, status);

-- =====================================================
-- ANALYTICS & METRICS
-- =====================================================

CREATE TABLE event_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,

  -- Date for daily aggregation
  metric_date DATE NOT NULL,

  -- View Metrics
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,

  -- RSVP Metrics
  rsvps_going INTEGER DEFAULT 0,
  rsvps_maybe INTEGER DEFAULT 0,
  rsvps_cant_go INTEGER DEFAULT 0,
  rsvps_pending INTEGER DEFAULT 0,
  rsvps_approved INTEGER DEFAULT 0,
  rsvps_waitlisted INTEGER DEFAULT 0,

  -- Engagement Metrics
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  photos_uploaded INTEGER DEFAULT 0,

  -- Conversion Funnel
  views_to_rsvp_rate DECIMAL(5, 2),        -- Percentage
  approval_rate DECIMAL(5, 2),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT fk_event_metrics FOREIGN KEY (event_id)
    REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT unique_metric_per_day UNIQUE (event_id, metric_date)
);

-- Indexes for metrics
CREATE INDEX idx_metrics_event ON event_metrics(event_id);
CREATE INDEX idx_metrics_date ON event_metrics(metric_date DESC);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function: Generate event URL (subdomain or path-based)
CREATE OR REPLACE FUNCTION get_event_url(event_row events)
RETURNS TEXT AS $$
BEGIN
  IF event_row.custom_subdomain IS NOT NULL AND event_row.subdomain_provider IS NOT NULL THEN
    -- Use custom subdomain: myevent.redheli.com or myevent.cloudpeers.com
    RETURN 'https://' || event_row.custom_subdomain || '.' || event_row.subdomain_provider;
  ELSE
    -- Use path-based URL: events.cloudpeers.com/e/event-id
    RETURN 'https://events.cloudpeers.com/e/' || event_row.event_id;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Generate QR code URL
CREATE OR REPLACE FUNCTION get_qr_code_url(event_row events)
RETURNS TEXT AS $$
BEGIN
  RETURN get_event_url(event_row) || '/qr.png';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Generate gallery URL
CREATE OR REPLACE FUNCTION get_gallery_url(event_row events)
RETURNS TEXT AS $$
BEGIN
  IF event_row.custom_subdomain IS NOT NULL AND event_row.subdomain_provider IS NOT NULL THEN
    -- Use subdomain: myevent.redheli.com/gallery
    RETURN 'https://' || event_row.custom_subdomain || '.' || event_row.subdomain_provider || '/gallery';
  ELSE
    -- Use path-based: events.cloudpeers.com/gallery/event-id
    RETURN 'https://events.cloudpeers.com/gallery/' || event_row.event_id;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Update event guest counts
CREATE OR REPLACE FUNCTION update_event_guest_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE events
    SET
      current_guest_count = (
        SELECT COUNT(*) + COALESCE(SUM(plus_ones), 0)
        FROM rsvp_responses
        WHERE event_id = NEW.event_id
          AND status IN ('going', 'approved')
      ),
      waitlist_count = (
        SELECT COUNT(*)
        FROM event_waitlist
        WHERE event_id = NEW.event_id
          AND status = 'waiting'
      ),
      total_rsvps = (
        SELECT COUNT(*)
        FROM rsvp_responses
        WHERE event_id = NEW.event_id
      ),
      updated_at = NOW()
    WHERE id = NEW.event_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update counts on RSVP changes
CREATE TRIGGER trigger_update_guest_counts
AFTER INSERT OR UPDATE ON rsvp_responses
FOR EACH ROW
EXECUTE FUNCTION update_event_guest_counts();

-- Function: Auto-assign waitlist positions
CREATE OR REPLACE FUNCTION assign_waitlist_position()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.position IS NULL THEN
    NEW.position := COALESCE(
      (SELECT MAX(position) + 1
       FROM event_waitlist
       WHERE event_id = NEW.event_id),
      1
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-position on waitlist
CREATE TRIGGER trigger_assign_waitlist_position
BEFORE INSERT ON event_waitlist
FOR EACH ROW
EXECUTE FUNCTION assign_waitlist_position();

-- Function: Log guest activity
CREATE OR REPLACE FUNCTION log_rsvp_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO guest_activity_log (event_id, rsvp_id, activity_type, guest_email, guest_name, activity_data)
    VALUES (
      NEW.event_id,
      NEW.id,
      'rsvp_submitted',
      NEW.guest_email,
      NEW.guest_name,
      jsonb_build_object('status', NEW.status, 'plusOnes', NEW.plus_ones)
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO guest_activity_log (event_id, rsvp_id, activity_type, guest_email, guest_name, activity_data)
    VALUES (
      NEW.event_id,
      NEW.id,
      'rsvp_updated',
      NEW.guest_email,
      NEW.guest_name,
      jsonb_build_object('statusChange', jsonb_build_object('from', OLD.status, 'to', NEW.status))
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Log all RSVP activity
CREATE TRIGGER trigger_log_rsvp_activity
AFTER INSERT OR UPDATE ON rsvp_responses
FOR EACH ROW
EXECUTE FUNCTION log_rsvp_activity();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Public events are viewable by anyone
CREATE POLICY "Public events are viewable"
  ON events FOR SELECT
  USING (is_public = TRUE AND deleted_at IS NULL);

-- Policy: Hosts can manage their events
CREATE POLICY "Hosts can manage their events"
  ON events FOR ALL
  USING (auth.jwt() ->> 'email' = host_email);

-- Policy: Guests can view their own RSVPs
CREATE POLICY "Guests can view their RSVPs"
  ON rsvp_responses FOR SELECT
  USING (guest_email = auth.jwt() ->> 'email');

-- Policy: Guests can create/update their own RSVPs
CREATE POLICY "Guests can manage their RSVPs"
  ON rsvp_responses FOR INSERT
  WITH CHECK (guest_email = auth.jwt() ->> 'email');

-- Policy: Guests can view activity for events they're attending
CREATE POLICY "Guests can view event activity"
  ON guest_activity_log FOR SELECT
  USING (
    event_id IN (
      SELECT event_id FROM rsvp_responses
      WHERE guest_email = auth.jwt() ->> 'email'
    )
  );

-- =====================================================
-- SAMPLE DATA (for testing)
-- =====================================================

-- Insert sample event
-- INSERT INTO events (
--   event_id, title, description, host_name, host_email,
--   event_date, start_time, timezone, location_name,
--   max_guests, enable_waitlist, is_public
-- ) VALUES (
--   'sample-party',
--   'Sample Birthday Party',
--   'A test event to demonstrate the system',
--   'Test Host',
--   'host@example.com',
--   '2025-06-15',
--   '19:00',
--   'America/New_York',
--   'Sample Venue',
--   50,
--   true,
--   true
-- );

-- =====================================================
-- VIEWS (for common queries)
-- =====================================================

-- View: Event Summary with RSVP Counts
CREATE OR REPLACE VIEW event_summary AS
SELECT
  e.id,
  e.event_id,
  e.title,
  e.event_date,
  e.start_time,
  e.host_name,
  e.custom_subdomain,
  e.subdomain_provider,
  get_event_url(e) AS event_url,
  get_qr_code_url(e) AS qr_code_url,
  get_gallery_url(e) AS gallery_url,
  e.max_guests,
  e.current_guest_count,
  e.waitlist_count,
  COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'going') AS going_count,
  COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'maybe') AS maybe_count,
  COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'cant_go') AS cant_go_count,
  COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'pending') AS pending_count,
  e.total_views,
  e.created_at
FROM events e
LEFT JOIN rsvp_responses r ON e.id = r.event_id
WHERE e.deleted_at IS NULL
GROUP BY e.id;

-- View: Guest List with Details
CREATE OR REPLACE VIEW guest_list AS
SELECT
  e.event_id,
  e.title AS event_title,
  r.guest_name,
  r.guest_email,
  r.guest_phone,
  r.status,
  r.plus_ones,
  r.checked_in,
  r.created_at AS rsvp_date,
  r.updated_at AS last_updated
FROM events e
JOIN rsvp_responses r ON e.id = r.event_id
WHERE e.deleted_at IS NULL
ORDER BY r.created_at DESC;

-- View: Potluck Food Tracker
CREATE OR REPLACE VIEW potluck_contributions AS
SELECT
  e.event_id,
  e.title AS event_title,
  e.event_date,
  r.guest_name,
  r.guest_email,
  r.bringing_food,
  jsonb_array_length(r.food_items) AS item_count,
  r.food_items,
  -- Expand food items into separate rows for easier querying
  food_item->>'name' AS food_name,
  food_item->>'category' AS food_category,
  (food_item->>'servings')::INTEGER AS servings,
  food_item->'dietaryInfo' AS dietary_info,
  food_item->>'notes' AS notes
FROM events e
JOIN rsvp_responses r ON e.id = r.event_id
LEFT JOIN LATERAL jsonb_array_elements(r.food_items) AS food_item ON true
WHERE e.is_potluck = TRUE
  AND e.deleted_at IS NULL
  AND r.status IN ('going', 'approved')
ORDER BY e.event_date, food_item->>'category', r.guest_name;

-- View: Potluck Summary by Category
CREATE OR REPLACE VIEW potluck_summary AS
SELECT
  e.event_id,
  e.title AS event_title,
  food_item->>'category' AS category,
  COUNT(*) AS item_count,
  SUM((food_item->>'servings')::INTEGER) AS total_servings,
  jsonb_agg(
    jsonb_build_object(
      'guest', r.guest_name,
      'food', food_item->>'name',
      'servings', food_item->>'servings'
    )
  ) AS items
FROM events e
JOIN rsvp_responses r ON e.id = r.event_id
LEFT JOIN LATERAL jsonb_array_elements(r.food_items) AS food_item ON true
WHERE e.is_potluck = TRUE
  AND e.deleted_at IS NULL
  AND r.status IN ('going', 'approved')
  AND r.bringing_food = TRUE
GROUP BY e.event_id, e.title, food_item->>'category'
ORDER BY e.event_id, food_item->>'category';

-- View: Music Playlist (song requests and custom songs)
CREATE OR REPLACE VIEW event_playlist AS
SELECT
  e.event_id,
  e.title AS event_title,
  e.event_date,
  r.guest_name,
  r.guest_email,
  r.music_contribution->>'type' AS contribution_type,
  r.music_contribution->>'songRequest' AS song_request,
  r.music_contribution->>'artistName' AS artist,
  r.music_contribution->>'customSongPrompt' AS custom_prompt,
  r.music_contribution->>'generatedSongUrl' AS generated_url,
  (r.music_contribution->>'played')::BOOLEAN AS played,
  r.music_contribution->>'notes' AS notes,
  r.created_at AS submitted_at
FROM events e
JOIN rsvp_responses r ON e.id = r.event_id
WHERE e.enable_music_contributions = TRUE
  AND e.deleted_at IS NULL
  AND r.status IN ('going', 'approved')
  AND r.music_contribution IS NOT NULL
  AND r.music_contribution != '{}'::jsonb
ORDER BY e.event_date, r.created_at;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Composite indexes for common queries
CREATE INDEX idx_events_date_status ON events(event_date, is_public) WHERE deleted_at IS NULL;
CREATE INDEX idx_rsvp_event_status_created ON rsvp_responses(event_id, status, created_at DESC);
CREATE INDEX idx_activity_event_type_time ON guest_activity_log(event_id, activity_type, created_at DESC);

COMMENT ON TABLE events IS 'Enhanced events with RSVP management, capacity limits, and waitlists';
COMMENT ON TABLE rsvp_responses IS 'Guest RSVPs with Going/Maybe/Cannot Go statuses, approvals, and plus-ones';
COMMENT ON TABLE guest_activity_log IS 'Activity timeline showing when guests RSVP, share, comment, etc.';
COMMENT ON TABLE event_waitlist IS 'Waitlist for events at capacity with position tracking';
COMMENT ON TABLE reminder_queue IS 'Automated email reminders and confirmations';
