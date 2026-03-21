import { query } from "./db.mjs";
import crypto from "crypto";

// ── helpers ──────────────────────────────────────────────────────────────────

function rowToCircle(r) {
  return {
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    dateOfBirth: r.date_of_birth ? r.date_of_birth.toISOString().split("T")[0] : null,
    address: r.address,
    suburb: r.suburb,
    state: r.state,
    postcode: r.postcode,
    medicareNumber: r.medicare_number,
    medicareExpiry: r.medicare_expiry,
    gpName: r.gp_name,
    gpPhone: r.gp_phone,
    hospitalPreference: r.hospital_preference,
    allergies: r.allergies,
    medicalConditions: r.medical_conditions,
    medications: r.medications ?? [],
    advanceCareDirective: r.advance_care_directive,
    advanceCareDirectiveNotes: r.advance_care_directive_notes,
    poaName: r.poa_name,
    poaPhone: r.poa_phone,
    poaRelationship: r.poa_relationship,
    guardianName: r.guardian_name,
    guardianPhone: r.guardian_phone,
    ambulanceCover: r.ambulance_cover,
    ambulanceMembership: r.ambulance_membership,
    healthInsurance: r.health_insurance,
    healthInsuranceNumber: r.health_insurance_number,
    favouriteTv: r.favourite_tv,
    foodLikes: r.food_likes,
    foodDislikes: r.food_dislikes,
    teaCoffeePreference: r.tea_coffee_preference,
    musicPreference: r.music_preference,
    religion: r.religion,
    carerNotes: r.carer_notes,
    spareKeyHolders: r.spare_key_holders,
    homeEntryNotes: r.home_entry_notes,
    householdMembers: r.household_members ?? [],
    hasPets: r.has_pets,
    petDetails: r.pet_details ?? [],
    billManagerName: r.bill_manager_name,
    billManagerPhone: r.bill_manager_phone,
    subscriptionStatus: r.subscription_status,
  };
}

function rowToMember(r) {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    mobile: r.mobile,
    role: r.role,
    relationship: r.relationship,
    isCircleManager: r.is_circle_manager,
    isPoa: r.is_poa,
    avatarColour: r.avatar_colour,
    responsibilities: r.responsibilities,
    inviteSentAt: r.invite_sent_at ? r.invite_sent_at.toISOString() : null,
    inviteAcceptedAt: r.invite_accepted_at ? r.invite_accepted_at.toISOString() : null,
    inviteToken: r.invite_token,
  };
}

function rowToTask(r) {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    taskType: r.task_type,
    scheduledDate: r.scheduled_date ? r.scheduled_date.toISOString().split("T")[0] : null,
    scheduledTime: r.scheduled_time,
    assignedTo: r.assigned_to,
    assignedName: r.assigned_name,
    isOpenToCircle: r.is_open_to_circle,
    status: r.status,
    icon: r.icon,
    priority: r.priority,
  };
}

function rowToNeed(r) {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    frequency: r.frequency,
    icon: r.icon,
    status: r.status,
    assignedTo: r.assigned_to,
    assignedName: r.assigned_name,
    coverageNotes: r.coverage_notes,
    isChsp: r.is_chsp,
    chspServiceType: r.chsp_service_type,
    lastCompleted: r.last_completed ? r.last_completed.toISOString().split("T")[0] : null,
    nextDue: r.next_due ? r.next_due.toISOString().split("T")[0] : null,
  };
}

function rowToBill(r) {
  return {
    id: r.id,
    name: r.name,
    provider: r.provider,
    icon: r.icon,
    amount: r.amount != null ? parseFloat(r.amount) : null,
    dueDate: r.due_date ? r.due_date.toISOString().split("T")[0] : null,
    frequency: r.frequency,
    isDirectDebit: r.is_direct_debit,
    handledBy: r.handled_by,
    handledByName: r.handled_by_name,
    notes: r.notes,
    status: r.status,
  };
}

function rowToUpdate(r) {
  return {
    id: r.id,
    postedBy: r.posted_by,
    postedByName: r.posted_by_name,
    createdAt: r.created_at ? r.created_at.toISOString() : null,
    message: r.message,
    updateType: r.update_type,
    isAlert: r.is_alert,
  };
}

// ── routes ───────────────────────────────────────────────────────────────────

export function registerCareCircleRoutes(app) {
  async function getCareCircleAuth(req, expectedCircleId = null) {
    const token =
      String(req.header("X-CareCircle-Invite") || req.query.invite || "").trim();
    if (!token) return null;

    const result = await query(
      `SELECT * FROM cc_members
       WHERE invite_token = $1
       LIMIT 1`,
      [token],
    );
    const member = result.rows[0];
    if (!member) return null;
    if (expectedCircleId && String(member.circle_id) !== String(expectedCircleId)) return null;

    if (!member.invite_accepted_at) {
      await query(
        `UPDATE cc_members
         SET invite_accepted_at = NOW()
         WHERE id = $1 AND invite_accepted_at IS NULL`,
        [member.id],
      );
      member.invite_accepted_at = new Date();
    }

    return member;
  }

  // GET /api/carecircle/launch
  // Returns the demo circle with all data needed for the app shell
  app.get("/api/carecircle/launch", async (req, res) => {
    try {
      const authMember = await getCareCircleAuth(req);
      if (!authMember) {
        return res.status(401).json({ message: "CareCircle invite token is required." });
      }

      const circleRes = await query(`SELECT * FROM cc_circles WHERE id = $1 LIMIT 1`, [authMember.circle_id]);
      if (circleRes.rows.length === 0) {
        return res.status(404).json({ message: "No circle found. Please set up a circle first." });
      }
      const circle = rowToCircle(circleRes.rows[0]);
      const cid = circle.id;

      const [membersRes, tasksRes, needsRes, billsRes, updatesRes] = await Promise.all([
        query(`SELECT * FROM cc_members WHERE circle_id = $1 ORDER BY is_circle_manager DESC, created_at`, [cid]),
        query(`SELECT * FROM cc_tasks WHERE circle_id = $1 AND scheduled_date = CURRENT_DATE ORDER BY scheduled_time ASC NULLS LAST, created_at`, [cid]),
        query(`SELECT * FROM cc_needs WHERE circle_id = $1 ORDER BY status ASC, created_at`, [cid]),
        query(`SELECT * FROM cc_bills WHERE circle_id = $1 ORDER BY CASE status WHEN 'overdue' THEN 0 WHEN 'due_soon' THEN 1 ELSE 2 END, due_date ASC NULLS LAST`, [cid]),
        query(`SELECT * FROM cc_updates WHERE circle_id = $1 ORDER BY created_at DESC LIMIT 30`, [cid]),
      ]);

      const members = membersRes.rows.map(rowToMember);
      const currentMember = members.find((m) => String(m.id) === String(authMember.id)) ?? null;

      return res.json({
        circle,
        currentMember,
        members,
        todayTasks: tasksRes.rows.map(rowToTask),
        needs: needsRes.rows.map(rowToNeed),
        bills: billsRes.rows.map(rowToBill),
        updates: updatesRes.rows.map(rowToUpdate),
      });
    } catch (err) {
      console.error("[cc] launch error", err);
      return res.status(500).json({ message: "Server error loading CareCircle" });
    }
  });

  // POST /api/carecircle/circles/:id/tasks/:taskId/claim
  app.post("/api/carecircle/circles/:id/tasks/:taskId/claim", async (req, res) => {
    const { id, taskId } = req.params;
    try {
      const authMember = await getCareCircleAuth(req, id);
      if (!authMember) return res.status(401).json({ message: "CareCircle authentication required." });
      let assignedName = "A circle member";
      assignedName = authMember.name;
      const r = await query(
        `UPDATE cc_tasks SET status = 'claimed', assigned_to = $1, assigned_name = $2, updated_at = NOW()
         WHERE id = $3 AND circle_id = $4 AND status = 'pending' RETURNING *`,
        [authMember.id, assignedName, taskId, id]
      );
      if (!r.rows.length) return res.status(404).json({ message: "Task not found or already claimed" });
      return res.json(rowToTask(r.rows[0]));
    } catch (err) {
      console.error("[cc] claim task error", err);
      return res.status(500).json({ message: "Failed to claim task" });
    }
  });

  // POST /api/carecircle/circles/:id/tasks/:taskId/done
  app.post("/api/carecircle/circles/:id/tasks/:taskId/done", async (req, res) => {
    const { id, taskId } = req.params;
    try {
      const authMember = await getCareCircleAuth(req, id);
      if (!authMember) return res.status(401).json({ message: "CareCircle authentication required." });
      const r = await query(
        `UPDATE cc_tasks SET status = 'done', completed_by = $1, completed_at = NOW(), updated_at = NOW()
         WHERE id = $2 AND circle_id = $3 RETURNING *`,
        [authMember.id, taskId, id]
      );
      if (!r.rows.length) return res.status(404).json({ message: "Task not found" });
      return res.json(rowToTask(r.rows[0]));
    } catch (err) {
      console.error("[cc] done task error", err);
      return res.status(500).json({ message: "Failed to mark task done" });
    }
  });

  // POST /api/carecircle/circles/:id/tasks
  app.post("/api/carecircle/circles/:id/tasks", async (req, res) => {
    const { id } = req.params;
    const { title, description, taskType, scheduledTime, priority, memberId } = req.body ?? {};
    if (!title?.trim()) return res.status(400).json({ message: "Title is required" });
    try {
      const authMember = await getCareCircleAuth(req, id);
      if (!authMember) return res.status(401).json({ message: "CareCircle authentication required." });
      let assignedName = null;
      if (memberId) {
        const mr = await query(`SELECT name FROM cc_members WHERE id = $1 AND circle_id = $2`, [memberId, id]);
        if (mr.rows.length) assignedName = mr.rows[0].name;
      }
      const r = await query(
        `INSERT INTO cc_tasks (circle_id, title, description, task_type, scheduled_date, scheduled_time, assigned_to, assigned_name, priority, is_open_to_circle)
         VALUES ($1,$2,$3,$4,CURRENT_DATE,$5,$6,$7,$8,TRUE) RETURNING *`,
        [id, title.trim(), description || null, taskType || "other", scheduledTime || null, memberId || null, assignedName, priority || "normal"]
      );
      return res.status(201).json(rowToTask(r.rows[0]));
    } catch (err) {
      console.error("[cc] create task error", err);
      return res.status(500).json({ message: "Failed to create task" });
    }
  });

  // POST /api/carecircle/circles/:id/needs/:needId/claim
  app.post("/api/carecircle/circles/:id/needs/:needId/claim", async (req, res) => {
    const { id, needId } = req.params;
    try {
      const authMember = await getCareCircleAuth(req, id);
      if (!authMember) return res.status(401).json({ message: "CareCircle authentication required." });
      let assignedName = "A circle member";
      assignedName = authMember.name;
      const r = await query(
        `UPDATE cc_needs SET status = 'claimed', assigned_to = $1, assigned_name = $2
         WHERE id = $3 AND circle_id = $4 RETURNING *`,
        [authMember.id, assignedName, needId, id]
      );
      if (!r.rows.length) return res.status(404).json({ message: "Need not found" });
      return res.json(rowToNeed(r.rows[0]));
    } catch (err) {
      console.error("[cc] claim need error", err);
      return res.status(500).json({ message: "Failed to claim need" });
    }
  });

  // POST /api/carecircle/circles/:id/needs
  app.post("/api/carecircle/circles/:id/needs", async (req, res) => {
    const { id } = req.params;
    const { title, description, frequency, coverageNotes } = req.body ?? {};
    if (!title?.trim()) return res.status(400).json({ message: "Title is required" });
    try {
      const authMember = await getCareCircleAuth(req, id);
      if (!authMember) return res.status(401).json({ message: "CareCircle authentication required." });
      const r = await query(
        `INSERT INTO cc_needs (circle_id, title, description, frequency, coverage_notes)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [id, title.trim(), description || null, frequency || null, coverageNotes || null]
      );
      return res.status(201).json(rowToNeed(r.rows[0]));
    } catch (err) {
      console.error("[cc] create need error", err);
      return res.status(500).json({ message: "Failed to create need" });
    }
  });

  // POST /api/carecircle/circles/:id/bills
  app.post("/api/carecircle/circles/:id/bills", async (req, res) => {
    const { id } = req.params;
    const { name, provider, amount, dueDate, frequency, notes } = req.body ?? {};
    if (!name?.trim()) return res.status(400).json({ message: "Name is required" });
    try {
      const authMember = await getCareCircleAuth(req, id);
      if (!authMember) return res.status(401).json({ message: "CareCircle authentication required." });
      const r = await query(
        `INSERT INTO cc_bills (circle_id, name, provider, amount, due_date, frequency, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [id, name.trim(), provider || null, amount ? parseFloat(amount) : null, dueDate || null, frequency || "monthly", notes || null]
      );
      return res.status(201).json(rowToBill(r.rows[0]));
    } catch (err) {
      console.error("[cc] create bill error", err);
      return res.status(500).json({ message: "Failed to create bill" });
    }
  });

  // POST /api/carecircle/circles/:id/updates
  app.post("/api/carecircle/circles/:id/updates", async (req, res) => {
    const { id } = req.params;
    const { message, memberId, postedByName } = req.body ?? {};
    if (!message?.trim()) return res.status(400).json({ message: "Message is required" });
    try {
      const authMember = await getCareCircleAuth(req, id);
      if (!authMember) return res.status(401).json({ message: "CareCircle authentication required." });
      const r = await query(
        `INSERT INTO cc_updates (circle_id, posted_by, posted_by_name, message)
         VALUES ($1,$2,$3,$4) RETURNING *`,
        [id, authMember.id, postedByName || authMember.name || "Circle member", message.trim()]
      );
      return res.status(201).json(rowToUpdate(r.rows[0]));
    } catch (err) {
      console.error("[cc] create update error", err);
      return res.status(500).json({ message: "Failed to post update" });
    }
  });

  // POST /api/carecircle/circles/:id/members  (invite)
  app.post("/api/carecircle/circles/:id/members", async (req, res) => {
    const { id } = req.params;
    const { name, email, mobile, role, relationship, responsibilities, avatarColour } = req.body ?? {};
    if (!name?.trim()) return res.status(400).json({ message: "Name is required" });
    try {
      const authMember = await getCareCircleAuth(req, id);
      if (!authMember) return res.status(401).json({ message: "CareCircle authentication required." });
      const inviteToken = crypto.randomBytes(18).toString("base64url");
      const r = await query(
        `INSERT INTO cc_members (circle_id, name, email, mobile, role, relationship, responsibilities, avatar_colour, invite_token, invite_sent_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW()) RETURNING *`,
        [id, name.trim(), email || null, mobile || null, role || "family", relationship || null, responsibilities || null, avatarColour || "coral", inviteToken]
      );
      const member = rowToMember(r.rows[0]);
      const inviteUrl = `${process.env.APP_PUBLIC_BASE_URL || "https://www.nursinghomesnearme.com.au"}/carecircle?invite=${inviteToken}`;
      return res.status(201).json({ ...member, inviteUrl });
    } catch (err) {
      console.error("[cc] invite member error", err);
      return res.status(500).json({ message: "Failed to invite member" });
    }
  });
}
