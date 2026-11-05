-- Allow public to manage events, guests, rsvps, and wishes without authentication
-- This enables brides/grooms to edit their wedding invitations without login

-- Events: Allow public to update and read all events
DROP POLICY IF EXISTS "Admins can manage events" ON events;
DROP POLICY IF EXISTS "Public can read published events" ON events;

CREATE POLICY "Public can update events" ON events
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can read all events" ON events
  FOR SELECT TO anon
  USING (true);

-- Keep admin policy for authenticated users
CREATE POLICY "Admins can manage events" ON events
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid())
  );

-- Guests: Allow public to manage
DROP POLICY IF EXISTS "Admins can manage guests" ON event_guests;

CREATE POLICY "Public can manage guests" ON event_guests
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

-- RSVP: Allow public to manage
DROP POLICY IF EXISTS "Admins can manage rsvps" ON event_rsvps;
DROP POLICY IF EXISTS "Public can insert rsvps" ON event_rsvps;

CREATE POLICY "Public can manage rsvps" ON event_rsvps
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

-- Wishes: Allow public to manage
DROP POLICY IF EXISTS "Admins can manage wishes" ON event_wishes;
DROP POLICY IF EXISTS "Public can insert wishes" ON event_wishes;
DROP POLICY IF EXISTS "Public can read approved wishes" ON event_wishes;

CREATE POLICY "Public can manage wishes" ON event_wishes
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);
