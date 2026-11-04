-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Admin profiles
CREATE TABLE admin_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event templates
CREATE TABLE event_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT CHECK (category IN ('heritage', 'premium')) NOT NULL,
  preview_image TEXT,
  description TEXT,
  demo_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  template_id UUID REFERENCES event_templates(id),
  status TEXT CHECK (status IN ('draft', 'published', 'archived', 'completed')) DEFAULT 'draft',
  bride_name TEXT,
  groom_name TEXT,
  bride_nick TEXT,
  groom_nick TEXT,
  bride_photo TEXT,
  groom_photo TEXT,
  bride_father TEXT,
  bride_mother TEXT,
  groom_father TEXT,
  groom_mother TEXT,
  bride_ig TEXT,
  groom_ig TEXT,
  akad_date DATE,
  akad_time TIME,
  akad_location TEXT,
  reception_date DATE,
  reception_time TIME,
  reception_location TEXT,
  address TEXT,
  maps_url TEXT,
  dress_code TEXT,
  notes TEXT,
  love_story TEXT,
  prewedding_photos JSONB DEFAULT '[]',
  gallery JSONB DEFAULT '[]',
  video_url TEXT,
  music_url TEXT,
  quote TEXT,
  gift_bank_name TEXT,
  gift_account_number TEXT,
  gift_account_holder TEXT,
  gift_address TEXT,
  gift_recipient TEXT,
  gift_wa TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guests
CREATE TABLE event_guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  category TEXT CHECK (category IN ('family', 'friend', 'colleague', 'other')) DEFAULT 'other',
  group_name TEXT,
  invitation_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RSVP
CREATE TABLE event_rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  guest_id UUID REFERENCES event_guests(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  attendance TEXT CHECK (attendance IN ('yes', 'no', 'maybe')) NOT NULL,
  guest_count INTEGER DEFAULT 1,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wishes
CREATE TABLE event_wishes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  guest_id UUID REFERENCES event_guests(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check-ins
CREATE TABLE event_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  guest_id UUID REFERENCES event_guests(id) ON DELETE CASCADE NOT NULL,
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, guest_id)
);

-- Indexes
-- slug sudah terindeks unik oleh constraint events_slug_key (TEXT UNIQUE), jadi tidak perlu index duplikat.
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_event_guests_event_id ON event_guests(event_id);
CREATE INDEX idx_event_rsvps_event_id ON event_rsvps(event_id);
CREATE INDEX idx_event_wishes_event_id ON event_wishes(event_id);
CREATE INDEX idx_event_checkins_event_id ON event_checkins(event_id);

-- RLS Policies
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_checkins ENABLE ROW LEVEL SECURITY;

-- Admin profiles: only admin can read their own
CREATE POLICY "Admins can read own profile" ON admin_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Templates: admins can manage, public can read active
CREATE POLICY "Admins can manage templates" ON event_templates
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = (SELECT auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = (SELECT auth.uid()))
  );

CREATE POLICY "Public can read active templates" ON event_templates
  FOR SELECT USING (active = true);

-- Events: admins can manage all, public can read published
CREATE POLICY "Admins can manage events" ON events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Public can read published events" ON events
  FOR SELECT USING (status = 'published');

-- Guests: admins can manage
CREATE POLICY "Admins can manage guests" ON event_guests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid())
  );

-- RSVP: admins can manage all, public can insert
CREATE POLICY "Admins can manage rsvps" ON event_rsvps
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = (SELECT auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = (SELECT auth.uid()))
  );

CREATE POLICY "Public can insert rsvps" ON event_rsvps
  FOR INSERT WITH CHECK (true);

-- Wishes: admins can manage all, public can insert and read approved
CREATE POLICY "Admins can manage wishes" ON event_wishes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Public can insert wishes" ON event_wishes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read approved wishes" ON event_wishes
  FOR SELECT USING (approved = true);

-- Checkins: admins can manage
CREATE POLICY "Admins can manage checkins" ON event_checkins
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid())
  );
