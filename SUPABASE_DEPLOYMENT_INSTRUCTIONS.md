# CRITICAL: Deploy These Tables to Supabase

The 404 errors mean the `listing_availability` and `listing_blackout_dates` tables don't exist in your Supabase database.

## Steps to Deploy

### 1. Go to Supabase Dashboard
- Open https://app.supabase.com
- Select your `yeahrent` project

### 2. Open SQL Editor
- Click "SQL Editor" in left sidebar
- Click "New Query"

### 3. Copy-Paste and Execute This SQL

```sql
-- =============================================
-- CREATE LISTING_AVAILABILITY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS listing_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(listing_id, day_of_week)
);

ALTER TABLE listing_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can view availability
CREATE POLICY "availability_select_all" ON listing_availability
  FOR SELECT USING (true);

-- RLS Policy: Only listing owner can insert
CREATE POLICY "availability_insert_owner" ON listing_availability
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = listing_availability.listing_id 
      AND listings.owner_id = auth.uid()
    )
  );

-- RLS Policy: Only listing owner can update
CREATE POLICY "availability_update_owner" ON listing_availability
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = listing_availability.listing_id 
      AND listings.owner_id = auth.uid()
    )
  );

-- RLS Policy: Only listing owner can delete
CREATE POLICY "availability_delete_owner" ON listing_availability
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = listing_availability.listing_id 
      AND listings.owner_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_availability_listing ON listing_availability(listing_id);
CREATE INDEX idx_availability_day ON listing_availability(day_of_week);
```

### 4. Execute (Press Ctrl+Enter or click "Run")

### 5. Copy-Paste and Execute This SQL

```sql
-- =============================================
-- CREATE LISTING_BLACKOUT_DATES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS listing_blackout_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CHECK (end_date >= start_date)
);

ALTER TABLE listing_blackout_dates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can view blackout dates
CREATE POLICY "blackout_select_all" ON listing_blackout_dates
  FOR SELECT USING (true);

-- RLS Policy: Only listing owner can insert
CREATE POLICY "blackout_insert_owner" ON listing_blackout_dates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = listing_blackout_dates.listing_id 
      AND listings.owner_id = auth.uid()
    )
  );

-- RLS Policy: Only listing owner can update
CREATE POLICY "blackout_update_owner" ON listing_blackout_dates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = listing_blackout_dates.listing_id 
      AND listings.owner_id = auth.uid()
    )
  );

-- RLS Policy: Only listing owner can delete
CREATE POLICY "blackout_delete_owner" ON listing_blackout_dates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = listing_blackout_dates.listing_id 
      AND listings.owner_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_blackout_listing ON listing_blackout_dates(listing_id);
CREATE INDEX idx_blackout_dates ON listing_blackout_dates(start_date, end_date);
```

### 6. Execute (Press Ctrl+Enter or click "Run")

### 7. Verify Tables Were Created
In Supabase dashboard:
- Click "Table Editor" in left sidebar
- Look for `listing_availability` table
- Look for `listing_blackout_dates` table
- Both should appear in the list

## Testing After Deployment

1. Refresh your browser (clear cache if needed)
2. Create a new test listing with limited availability (e.g., only Friday & Monday)
3. View the listing - dates should gray out correctly
4. Check browser console - should NOT see 404 errors anymore

## If You Still Get 404 Errors

Check:
1. Table name spelling is exactly: `listing_availability` (not `listing_availabilities`)
2. Table name spelling is exactly: `listing_blackout_dates`
3. The tables appear in Supabase Table Editor
4. RLS is enabled on both tables (should show "Security" icon)

## Need Help?

If deployment fails:
1. Try running just the CREATE TABLE statements (without the ALTER/POLICY parts)
2. Check if there are any SQL errors in the Supabase editor
3. Share the error message and I can help debug
