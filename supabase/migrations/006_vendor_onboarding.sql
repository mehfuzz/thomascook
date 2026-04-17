-- Vendor Onboarding: vendors table + RLS

CREATE TABLE IF NOT EXISTS vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- GST Identity
  gstin TEXT UNIQUE NOT NULL,
  legal_name TEXT NOT NULL,
  trade_name TEXT,
  pan_number TEXT,

  -- GST Registration Details (fetched from GST API)
  gst_registration_date DATE,
  gst_status TEXT DEFAULT 'Unknown',          -- Active / Suspended / Cancelled
  taxpayer_type TEXT,                          -- Regular / Composition / etc.
  nature_of_business TEXT[],                   -- array of business activities

  -- Principal Place of Business Address (from GST)
  address_building TEXT,
  address_street TEXT,
  address_locality TEXT,
  address_city TEXT,
  address_district TEXT,
  address_state TEXT,
  address_pincode TEXT,
  address_full TEXT,                           -- denormalised for fast duplicate matching

  -- Owner / Authorised Signatory (from GST) — used for duplicate detection
  proprietor_name TEXT,

  -- Vendor onboarding status
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Under Review', 'Approved', 'Rejected', 'Blacklisted')),
  is_blacklisted BOOLEAN DEFAULT FALSE,
  blacklist_reason TEXT,

  -- Bank / Financial Details
  bank_account_number TEXT,
  bank_ifsc TEXT,
  bank_name TEXT,
  bank_branch TEXT,

  -- Category
  vendor_category TEXT,                        -- e.g. IT Services, Travel, Logistics
  service_description TEXT,

  -- Duplicate detection result (stored so auditors can review)
  duplicate_flag BOOLEAN DEFAULT FALSE,
  duplicate_matches JSONB DEFAULT '[]'::jsonb, -- [{id, vendor_name, gstin, match_reason}]

  -- Audit
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for duplicate detection queries
CREATE INDEX IF NOT EXISTS idx_vendors_address_full   ON vendors (address_full);
CREATE INDEX IF NOT EXISTS idx_vendors_proprietor     ON vendors (proprietor_name);
CREATE INDEX IF NOT EXISTS idx_vendors_pan            ON vendors (pan_number);
CREATE INDEX IF NOT EXISTS idx_vendors_status         ON vendors (status);
CREATE INDEX IF NOT EXISTS idx_vendors_created_by     ON vendors (created_by);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_vendors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_vendors_updated_at();

-- Row Level Security
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read vendors (shared registry)
CREATE POLICY "Authenticated users can read vendors"
  ON vendors FOR SELECT
  TO authenticated
  USING (true);

-- Any authenticated user can create a vendor
CREATE POLICY "Authenticated users can insert vendors"
  ON vendors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only the creator or admins can update
CREATE POLICY "Creator can update their own vendor submissions"
  ON vendors FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());
