import { query } from "./db.mjs";

export async function runMigrations() {
  await query(`
    CREATE TABLE IF NOT EXISTS client_cases (
      id BIGSERIAL PRIMARY KEY,
      public_token TEXT NOT NULL UNIQUE,
      enquiry_id BIGINT,
      client_email TEXT NOT NULL,
      client_name TEXT,
      client_suburb TEXT,
      contact_name TEXT,
      contact_phone TEXT,
      preferred_suburb_area TEXT,
      timing TEXT,
      current_location TEXT,
      discharge_date DATE,
      placement_need TEXT,
      patient_name TEXT,
      relationship_to_patient TEXT,
      placement_for_name TEXT,
      placement_for_dob DATE,
      placement_for_relation TEXT,
      gender TEXT,
      marital_status TEXT,
      pension_status TEXT,
      living_situation TEXT,
      own_home TEXT,
      someone_living_in_home TEXT,
      who_living_in_home TEXT,
      have_had_acat TEXT,
      acat_approved_for TEXT,
      mobility TEXT,
      cognition TEXT,
      behaviours TEXT,
      continence TEXT,
      other_concerns TEXT,
      notes TEXT,
      rad_range TEXT,
      payment_preference TEXT,
      govt_help_accommodation TEXT,
      means_tested TEXT,
      funding_notes TEXT,
      consent_to_share TEXT,
      care_types JSONB NOT NULL DEFAULT '[]'::jsonb,
      preferred_locations JSONB NOT NULL DEFAULT '[]'::jsonb,
      residential_intake JSONB NOT NULL DEFAULT '{}'::jsonb,
      internal_case_notes TEXT,
      full_list JSONB NOT NULL DEFAULT '[]'::jsonb,
      short_list JSONB NOT NULL DEFAULT '[]'::jsonb,
      approval_status TEXT NOT NULL DEFAULT 'pending',
      last_workflow_stage TEXT NOT NULL DEFAULT 'intake_received',
      home_care_referral_pending BOOLEAN NOT NULL DEFAULT FALSE,
      property_support_pending BOOLEAN NOT NULL DEFAULT FALSE,
      password_hash TEXT,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    ALTER TABLE client_cases
    ADD COLUMN IF NOT EXISTS my_aged_care_referral_code TEXT;
  `);

  await query(`
    ALTER TABLE client_cases
    ADD COLUMN IF NOT EXISTS funding_plan TEXT;
  `);

  await query(`
    ALTER TABLE client_cases
    ADD COLUMN IF NOT EXISTS budget_range TEXT;
  `);

  await query(`
    ALTER TABLE client_cases
    ADD COLUMN IF NOT EXISTS waiting_list_preference TEXT;
  `);

  await query(`
    ALTER TABLE client_cases
    ADD COLUMN IF NOT EXISTS support_at_home_status TEXT;
  `);

  await query(`
    ALTER TABLE client_cases
    ADD COLUMN IF NOT EXISTS acat_number TEXT;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS workflow_login_requests (
      id BIGSERIAL PRIMARY KEY,
      client_case_id BIGINT NOT NULL REFERENCES client_cases(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      link_url TEXT NOT NULL,
      delivery_status TEXT NOT NULL DEFAULT 'logged',
      provider_message_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS outbound_messages (
      id BIGSERIAL PRIMARY KEY,
      client_case_id BIGINT REFERENCES client_cases(id) ON DELETE SET NULL,
      message_type TEXT NOT NULL,
      recipient_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      delivery_status TEXT NOT NULL DEFAULT 'logged',
      provider_message_id TEXT,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS nursing_homes (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      one_line_description TEXT,
      description TEXT,
      address_line1 TEXT,
      suburb TEXT NOT NULL,
      state TEXT NOT NULL,
      postcode TEXT NOT NULL,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      phone TEXT,
      website TEXT,
      email TEXT,
      internal_notes TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      active_vacancies INTEGER,
      verified_at TEXT,
      primary_image_url TEXT,
      gallery_image_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
      feature_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      other_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      languages JSONB NOT NULL DEFAULT '[]'::jsonb,
      room_options JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS suburb_location_centers (
      id BIGSERIAL PRIMARY KEY,
      suburb TEXT NOT NULL,
      state TEXT NOT NULL,
      postcode TEXT NOT NULL,
      latitude DOUBLE PRECISION NOT NULL,
      longitude DOUBLE PRECISION NOT NULL
    );
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_client_cases_client_email
    ON client_cases (LOWER(client_email));
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_client_cases_public_token
    ON client_cases (public_token);
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_nursing_homes_suburb
    ON nursing_homes (LOWER(suburb), LOWER(state));
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_suburb_location_centers_unique
    ON suburb_location_centers (LOWER(suburb), LOWER(state), postcode);
  `);

  await query(`
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await query(`
    DROP TRIGGER IF EXISTS trg_client_cases_updated_at ON client_cases;
  `);

  await query(`
    CREATE TRIGGER trg_client_cases_updated_at
    BEFORE UPDATE ON client_cases
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  `);
}

if (process.argv[1]?.endsWith("migrate.mjs")) {
  runMigrations()
    .then(() => {
      console.log("[db] migrations complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("[db] migration failed", error);
      process.exit(1);
    });
}
