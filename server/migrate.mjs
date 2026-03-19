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

  // ── CareCircle tables ──────────────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS cc_circles (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      date_of_birth DATE,
      address TEXT,
      suburb TEXT,
      state TEXT,
      postcode TEXT,
      medicare_number TEXT,
      medicare_expiry TEXT,
      gp_name TEXT,
      gp_phone TEXT,
      hospital_preference TEXT,
      allergies TEXT,
      medical_conditions TEXT,
      medications JSONB DEFAULT '[]',
      advance_care_directive BOOLEAN DEFAULT FALSE,
      advance_care_directive_notes TEXT,
      poa_name TEXT,
      poa_phone TEXT,
      poa_relationship TEXT,
      guardian_name TEXT,
      guardian_phone TEXT,
      ambulance_cover BOOLEAN DEFAULT FALSE,
      ambulance_membership TEXT,
      health_insurance TEXT,
      health_insurance_number TEXT,
      favourite_tv TEXT,
      food_likes TEXT,
      food_dislikes TEXT,
      tea_coffee_preference TEXT,
      music_preference TEXT,
      religion TEXT,
      carer_notes TEXT,
      spare_key_holders TEXT,
      home_entry_notes TEXT,
      household_members JSONB DEFAULT '[]',
      has_pets BOOLEAN DEFAULT FALSE,
      pet_details JSONB DEFAULT '[]',
      bill_manager_name TEXT,
      bill_manager_phone TEXT,
      bank_name TEXT,
      bank_bsb TEXT,
      bank_account TEXT,
      subscription_status TEXT DEFAULT 'trial'
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS cc_members (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      circle_id TEXT NOT NULL REFERENCES cc_circles(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      name TEXT NOT NULL,
      email TEXT,
      mobile TEXT,
      avatar_colour TEXT DEFAULT 'coral',
      role TEXT NOT NULL DEFAULT 'family',
      relationship TEXT,
      is_circle_manager BOOLEAN DEFAULT FALSE,
      is_poa BOOLEAN DEFAULT FALSE,
      responsibilities TEXT,
      availability_notes TEXT,
      invite_token TEXT DEFAULT gen_random_uuid()::text,
      invite_sent_at TIMESTAMPTZ,
      invite_accepted_at TIMESTAMPTZ
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS cc_tasks (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      circle_id TEXT NOT NULL REFERENCES cc_circles(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      title TEXT NOT NULL,
      description TEXT,
      task_type TEXT NOT NULL DEFAULT 'other',
      scheduled_date DATE NOT NULL DEFAULT CURRENT_DATE,
      scheduled_time TIME,
      is_recurring BOOLEAN DEFAULT FALSE,
      recurrence_rule TEXT,
      assigned_to TEXT,
      assigned_name TEXT,
      is_open_to_circle BOOLEAN DEFAULT TRUE,
      status TEXT DEFAULT 'pending',
      completed_at TIMESTAMPTZ,
      completed_by TEXT,
      icon TEXT,
      priority TEXT DEFAULT 'normal'
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS cc_needs (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      circle_id TEXT NOT NULL REFERENCES cc_circles(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      title TEXT NOT NULL,
      description TEXT,
      frequency TEXT,
      icon TEXT,
      status TEXT DEFAULT 'unclaimed',
      assigned_to TEXT,
      assigned_name TEXT,
      coverage_notes TEXT,
      is_chsp BOOLEAN DEFAULT FALSE,
      chsp_service_type TEXT,
      last_completed DATE,
      next_due DATE
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS cc_bills (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      circle_id TEXT NOT NULL REFERENCES cc_circles(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      name TEXT NOT NULL,
      provider TEXT,
      icon TEXT,
      amount NUMERIC(10,2),
      due_date DATE,
      frequency TEXT DEFAULT 'monthly',
      is_direct_debit BOOLEAN DEFAULT FALSE,
      handled_by TEXT,
      handled_by_name TEXT,
      notes TEXT,
      status TEXT DEFAULT 'upcoming'
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS cc_updates (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      circle_id TEXT NOT NULL REFERENCES cc_circles(id) ON DELETE CASCADE,
      posted_by TEXT,
      posted_by_name TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      message TEXT NOT NULL,
      update_type TEXT DEFAULT 'note',
      is_alert BOOLEAN DEFAULT FALSE
    )
  `);

  // Seed demo circle (Margaret) if none exists
  const existing = await query(`SELECT id FROM cc_circles LIMIT 1`);
  if (existing.rows.length === 0) {
    await query(`
      INSERT INTO cc_circles (
        first_name, last_name, date_of_birth, address, suburb, state, postcode,
        gp_name, gp_phone, hospital_preference, allergies, medical_conditions,
        medications, advance_care_directive, advance_care_directive_notes,
        poa_name, poa_phone, poa_relationship,
        ambulance_cover, ambulance_membership, health_insurance, health_insurance_number,
        favourite_tv, food_likes, food_dislikes, tea_coffee_preference,
        music_preference, religion, carer_notes,
        spare_key_holders, home_entry_notes,
        household_members, has_pets, pet_details,
        bill_manager_name, bill_manager_phone
      ) VALUES (
        'Margaret','Thompson','1942-06-14','42 Wattle St','Parramatta','NSW','2150',
        'Dr Alice Chen','02 9635 0000','Westmead Hospital',
        'PENICILLIN — anaphylaxis risk · carry EpiPen',
        'Type 2 Diabetes, Hypertension',
        '[{"name":"Metformin","dose":"500mg","time":"morning"},{"name":"Perindopril","dose":"4mg","time":"morning"},{"name":"Atorvastatin","dose":"20mg","time":"morning"},{"name":"Metformin","dose":"500mg","time":"evening"},{"name":"Amlodipine","dose":"5mg","time":"evening"}]',
        TRUE,
        'No resuscitation if terminal · comfort care preference · copy with Dr Chen + James',
        'James Thompson','0412 000 000','Son',
        TRUE,'St John Ambulance 78xxxx','Medibank Silver','1234xxxx',
        'Wheel of Fortune (6pm Ch9 — do not disturb!) · ABC News · Antiques Roadshow Sunday nights',
        'Roast chicken, soup, Tim Tams, soft foods',
        'No onion, no spicy, no raw fish',
        'Tea · white · no sugar · strong',
        'ABC Classic FM · Frank Sinatra · Johnny Cash',
        'Catholic · Sunday mass (James drives)',
        'Margaret is very proud and independent. She may say she''s "fine" when she''s not. Always ask twice. She loves a chat but tires easily. Never turn off the TV before 9pm.',
        'James (son) · Bob next door (No. 40)',
        'Front door · key under mat (carers only)',
        '[{"name":"Harold Thompson","relationship":"Husband","notes":"Mild dementia · needs patience · goes to bed at 8pm"},{"name":"Biscuit","relationship":"Dog","notes":"Golden Retriever · friendly"}]',
        TRUE,
        '[{"name":"Biscuit","type":"Dog","breed":"Golden Retriever","age":4,"notes":"Very friendly · pulls on lead","vet":"Parramatta Animal Hospital · 02 9891 0000","food":"Royal Canin Senior · 1 cup AM + 1 cup PM · treats above sink"}]',
        'James Thompson','0412 000 000'
      ) RETURNING id
    `);

    const circleRow = await query(`SELECT id FROM cc_circles LIMIT 1`);
    const circleId = circleRow.rows[0].id;

    // Seed members
    await query(`
      INSERT INTO cc_members (circle_id, name, email, mobile, avatar_colour, role, relationship, is_circle_manager, is_poa, responsibilities)
      VALUES
        ($1,'James Thompson','james@example.com','0412 000 000','coral','family','Son',TRUE,TRUE,'Visits Fri afternoons · Sunday grocery shop · Drives to all GP appointments'),
        ($1,'Linda Thompson','linda@example.com','0415 000 000','gold','family','Daughter-in-law',FALSE,FALSE,'Bakes for Nan on weekends · Contact if James unavailable'),
        ($1,'Rebecca Walsh','rebecca@example.com','0423 000 000','plum','family','Daughter',FALSE,FALSE,'Lives in Melbourne · Visits monthly · Available by phone anytime'),
        ($1,'Sarah Nguyen','sarah@example.com','0418 000 000','sage','carer','Personal Carer',FALSE,FALSE,'Tue/Thu/Fri 2pm · Shower assist, hair, linen · CHSP funded · Picks up Webster pack'),
        ($1,'Dr Alice Chen','drchen@example.com','02 9635 0000','sky','medical','GP',FALSE,FALSE,'Parramatta Medical Centre · Monthly reviews · Has advance care directive on file'),
        ($1,'Bob Henderson',NULL,'0409 000 000','sage','neighbour','Neighbour',FALSE,FALSE,'Next door (No. 40) · Does lawn fortnightly · Has spare key')
    `, [circleId]);

    // Seed today's tasks
    await query(`
      INSERT INTO cc_tasks (circle_id, title, description, task_type, scheduled_date, scheduled_time, assigned_name, is_open_to_circle, status, icon, priority)
      VALUES
        ($1,'Morning medications','Metformin 500mg · Perindopril 4mg · Atorvastatin 20mg','medication',CURRENT_DATE,'08:00','Nan (self)',FALSE,'done','💊','normal'),
        ($1,'Breakfast delivered','Meals on Wheels — porridge, tea (white, no sugar)','meal',CURRENT_DATE,'09:30','Meals on Wheels',FALSE,'done','🍳','normal'),
        ($1,'Lunch — nobody assigned yet','Cook or order. Nan likes soup or a sandwich. No onion.','meal',CURRENT_DATE,'12:00',NULL,TRUE,'pending','🥗','urgent'),
        ($1,'Sarah — Personal Care Visit','Shower assist, hair, change bed linen. CHSP funded.','personal_care',CURRENT_DATE,'14:00','Sarah (Carer)',FALSE,'pending','👩‍⚕️','normal'),
        ($1,'Biscuit''s walk — nobody assigned','30 min around the block. Biscuit is friendly, pulls a bit on the lead.','other',CURRENT_DATE,'16:00',NULL,TRUE,'pending','🐕','normal'),
        ($1,'James visits — Friday arvo','Weekly visit. Brings the paper. Stay for dinner if possible.','family_visit',CURRENT_DATE,'16:30','James (son)',FALSE,'pending','🏡','normal'),
        ($1,'Wheel of Fortune — do not disturb','Channel 9 · Every weeknight 6pm · This is non-negotiable.','other',CURRENT_DATE,'18:00','Nan''s favourite',FALSE,'pending','📺','normal'),
        ($1,'Dinner — Nourish''d delivery','Chicken & veg ordered. No spicy food. Soft foods preferred.','meal',CURRENT_DATE,'18:30','Nourish''d',FALSE,'done','🍽️','normal'),
        ($1,'Evening medications','Metformin 500mg · Amlodipine 5mg · James to confirm done tonight','medication',CURRENT_DATE,'20:00',NULL,TRUE,'pending','💊','normal')
    `, [circleId]);

    // Seed needs
    await query(`
      INSERT INTO cc_needs (circle_id, title, description, frequency, icon, status, assigned_name, coverage_notes, is_chsp)
      VALUES
        ($1,'House clean — overdue','Vacuum, mop, bathroom. Usually takes 2hrs.','Weekly','🧹','unclaimed',NULL,'Last done 12 days ago',FALSE),
        ($1,'Lawn mowing — overdue','Front and back. Bob usually does this but he''s away.','Fortnightly','🌿','unclaimed',NULL,'Last done 18 days ago',FALSE),
        ($1,'Meals — Mon/Wed/Fri delivery','Meals on Wheels + Nourish''d. James cooks Sunday roast.','6 days/week','🍽️','covered','Multiple','Meals on Wheels + Nourish''d + James Sunday',FALSE),
        ($1,'Personal care — shower assist','Sarah (carer) — Tue/Thu/Fri 2pm. CHSP funded.','3x/week','🧼','covered','Sarah Nguyen','CHSP funded · Sarah Tue/Thu/Fri',TRUE),
        ($1,'Medications','Webster pack from chemist. Sarah picks up monthly.','Monthly pickup','💊','covered','Sarah Nguyen','Monthly · Sarah collects',FALSE),
        ($1,'Biscuit — dog care','Walk 4pm daily. Food twice daily. Vet: Parramatta Animal Hospital.','Daily','🐕','covered','Shared','Shared in circle',FALSE),
        ($1,'Grocery shopping','James does big shop Sundays. Woolworths delivery for top-ups.','Weekly','🛒','covered','James Thompson','James Sundays + Woolworths delivery',FALSE),
        ($1,'GP transport','James drives to all appointments. CareMate as backup.','Monthly','🚗','covered','James Thompson','James drives',FALSE)
    `, [circleId]);

    // Seed bills
    await query(`
      INSERT INTO cc_bills (circle_id, name, provider, icon, amount, due_date, frequency, is_direct_debit, handled_by_name, notes, status)
      VALUES
        ($1,'Ausgrid — Electricity','Ausgrid','💡',184,CURRENT_DATE - INTERVAL '5 days','quarterly',FALSE,'James Thompson','Account BSB 062-xxx','overdue'),
        ($1,'Optus — Home phone & internet','Optus','📡',89,CURRENT_DATE + INTERVAL '2 days','monthly',TRUE,'James Thompson','Direct debit from account','due_soon'),
        ($1,'Council rates',NULL,'🏠',450,CURRENT_DATE + INTERVAL '12 days','quarterly',FALSE,'James Thompson',NULL,'upcoming'),
        ($1,'Sydney Water',NULL,'💧',210,CURRENT_DATE + INTERVAL '26 days','quarterly',FALSE,'James Thompson',NULL,'upcoming'),
        ($1,'Medibank Private','Medibank','🏥',180,NULL,'monthly',TRUE,'James Thompson','Silver Hospital + Extras · Account 1234xxxx','auto'),
        ($1,'St John Ambulance cover','St John','🚑',110,NULL,'annual',FALSE,'James Thompson','Annual renewal June · Membership 78xxxx','upcoming')
    `, [circleId]);

    // Seed updates
    await query(`
      INSERT INTO cc_updates (circle_id, posted_by_name, message, update_type, is_alert)
      VALUES
        ($1,'James Thompson','Just confirmed Dr Chen appointment for Tuesday 24 March at 10:30am. I''ll drive.','note',FALSE),
        ($1,'Sarah Nguyen','Thursday personal care visit done. Margaret was in good spirits today.','task_done',FALSE),
        ($1,'James Thompson','Electricity bill overdue — paying today via online banking.','alert',TRUE)
    `, [circleId]);

    console.log('[cc] Demo circle seeded for Margaret Thompson');
  }
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
