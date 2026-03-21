import React from "react";
import SeoHead from "./SeoHead";
import { API_BASE } from "../lib/runtimeConfig";

type Circle = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  address: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  medicareNumber: string | null;
  medicareExpiry: string | null;
  gpName: string | null;
  gpPhone: string | null;
  hospitalPreference: string | null;
  allergies: string | null;
  medicalConditions: string | null;
  favouriteTv: string | null;
  foodLikes: string | null;
  foodDislikes: string | null;
  teaCoffeePreference: string | null;
  musicPreference: string | null;
  religion: string | null;
  carerNotes: string | null;
  spareKeyHolders: string | null;
  homeEntryNotes: string | null;
  billManagerName: string | null;
  billManagerPhone: string | null;
  healthInsurance: string | null;
  healthInsuranceNumber: string | null;
  poaName: string | null;
  poaPhone: string | null;
  poaRelationship: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  ambulanceCover: boolean;
  ambulanceMembership: string | null;
  hasPets: boolean;
  medications: Array<{ name: string; dose: string; time: string }>;
  advanceCareDirective: boolean;
  advanceCareDirectiveNotes: string | null;
  subscriptionStatus: string | null;
};

type Member = {
  id: string;
  name: string;
  email: string | null;
  mobile: string | null;
  role: string;
  relationship: string | null;
  isCircleManager: boolean;
  isPoa: boolean;
  avatarColour: string | null;
  responsibilities: string | null;
  inviteSentAt: string | null;
  inviteAcceptedAt: string | null;
  inviteToken: string | null;
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  taskType: string;
  scheduledDate: string;
  scheduledTime: string | null;
  assignedTo: string | null;
  assignedName: string | null;
  isOpenToCircle: boolean;
  status: string;
  icon: string | null;
  priority: string | null;
};

type Need = {
  id: string;
  title: string;
  description: string | null;
  frequency: string | null;
  icon: string | null;
  status: string;
  assignedTo: string | null;
  assignedName: string | null;
  coverageNotes: string | null;
  isChsp: boolean;
  chspServiceType: string | null;
  lastCompleted: string | null;
  nextDue: string | null;
};

type Bill = {
  id: string;
  name: string;
  provider: string | null;
  icon: string | null;
  amount: number | null;
  dueDate: string | null;
  frequency: string | null;
  isDirectDebit: boolean;
  handledBy: string | null;
  handledByName: string | null;
  notes: string | null;
  status: string;
};

type Update = {
  id: string;
  postedBy: string | null;
  postedByName: string | null;
  createdAt: string;
  message: string;
  updateType: string;
  isAlert: boolean;
};

type LaunchPayload = {
  circle: Circle;
  currentMember: Member | null;
  members: Member[];
  todayTasks: Task[];
  needs: Need[];
  bills: Bill[];
  updates: Update[];
};

type TabKey = "today" | "needs" | "about" | "circle" | "bills" | "updates";

const styles = `
  .ccPage{min-height:100vh;background:linear-gradient(180deg,#f7f2ea 0%,#fffdf9 45%,#f7f2ea 100%);padding:24px 16px 40px;box-sizing:border-box}
  .ccShell{max-width:430px;margin:0 auto;background:#fffdf9;border:1px solid #e8e0d0;border-radius:32px;overflow:hidden;box-shadow:0 24px 60px rgba(26,32,53,.18)}
  .ccTopbar{background:#1a2035;color:#fff;padding:16px 18px 14px;display:flex;justify-content:space-between;gap:12px;align-items:center}
  .ccTopbarLeft{display:flex;gap:12px;align-items:center;min-width:0}
  .ccAvatar{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#e8563a,#c48a12);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;flex:0 0 auto}
  .ccTopbarTitle{font-family:Georgia,"Times New Roman",serif;font-size:20px;font-weight:700;line-height:1.05}
  .ccTopbarSub{color:rgba(255,255,255,.65);font-size:12px;margin-top:4px}
  .ccEmergency{background:linear-gradient(90deg,#7b1a1a,#9c2626);color:#fecaca;font-size:12px;font-weight:800;padding:10px 18px;letter-spacing:.03em}
  .ccEmergencyButton{cursor:pointer}
  .ccTabs{display:grid;grid-template-columns:repeat(6,1fr);background:#fff;border-bottom:1px solid #e8e0d0}
  .ccTab{border:0;background:transparent;padding:10px 2px 9px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;color:#94a3b8;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;border-bottom:3px solid transparent}
  .ccTabActive{color:#e8563a;border-bottom-color:#e8563a}
  .ccPane{padding:16px 16px 26px}
  .ccDateHeader{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px}
  .ccDateMain{font-family:Georgia,"Times New Roman",serif;font-size:24px;font-weight:700;color:#1a2035}
  .ccDateSub{font-size:13px;color:#64748b;margin-top:4px}
  .ccGhostBtn,.ccActionBtn{border:0;border-radius:999px;padding:8px 14px;font-size:12px;font-weight:800;cursor:pointer}
  .ccGhostBtn{background:#fff2ef;color:#e8563a}
  .ccActionBtn{background:#e8563a;color:#fff}
  .ccDoneBtn{background:#3d7a5e;color:#fff;border:0;border-radius:999px;padding:8px 12px;font-size:11px;font-weight:800;cursor:pointer}
  .ccSummary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:18px}
  .ccSummaryCell,.ccCard,.ccTaskCard,.ccNeedCard,.ccBillCard,.ccUpdateCard,.ccMemberCard{background:#fff;border:1px solid #e8e0d0;border-radius:16px}
  .ccSummaryCell{text-align:center;padding:12px 8px}
  .ccSummaryNum{font-family:Georgia,"Times New Roman",serif;font-size:24px;font-weight:700;line-height:1;color:#1a2035}
  .ccSummaryLbl{margin-top:4px;font-size:10px;color:#64748b;line-height:1.2}
  .ccSectionLabel{margin:18px 0 10px;color:#94a3b8;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.12em}
  .ccTaskList,.ccNeedList,.ccBillList,.ccUpdateList,.ccMemberList{display:flex;flex-direction:column;gap:10px}
  .ccTaskCard{border-left:4px solid #c48a12;padding:14px;display:grid;grid-template-columns:44px 42px 1fr auto;gap:10px;align-items:start}
  .ccTaskUrgent{border-left-color:#e8563a}.ccTaskDone{border-left-color:#3d7a5e;opacity:.72}
  .ccTaskTime{color:#64748b;font-size:11px;font-weight:800;text-align:center;line-height:1.15;padding-top:3px}
  .ccIcon{width:40px;height:40px;border-radius:12px;background:#fff2ef;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#e8563a;flex:0 0 auto}
  .ccTaskTitle,.ccCardTitle,.ccMemberName{font-size:15px;font-weight:800;color:#1e1e2e;line-height:1.3}
  .ccTaskDesc,.ccText,.ccMemberMeta{margin-top:4px;font-size:12px;color:#64748b;line-height:1.6}
  .ccTaskWho,.ccMetaChip,.ccPill,.ccStatusPill{display:inline-flex;align-items:center;margin-top:6px;padding:4px 9px;border-radius:999px;font-size:11px;font-weight:800}
  .ccTaskWho,.ccMetaChip{background:#f7f2ea;color:#1e1e2e}
  .ccPill{background:#fff2ef;color:#e8563a}
  .ccStatusPill{text-transform:uppercase;letter-spacing:.06em;font-size:10px}
  .ccStatusPending{background:#fff2ef;color:#e8563a}.ccStatusClaimed{background:#f7f2ea;color:#8a5a00}.ccStatusCovered,.ccStatusDone,.ccStatusAuto{background:#ecfdf3;color:#166534}.ccStatusOverdue{background:#fef2f2;color:#991b1b}.ccStatusDueSoon{background:#fff7ed;color:#9a3412}
  .ccTaskActions,.ccNeedActions{display:flex;flex-direction:column;gap:8px;align-items:flex-end}
  .ccCard{padding:16px}
  .ccCircleCard{background:linear-gradient(135deg,#1a2035,#2d3555);color:#fff;border-radius:22px;padding:18px;margin-bottom:14px}
  .ccCircleName{font-family:Georgia,"Times New Roman",serif;font-size:24px;font-weight:700}
  .ccCircleMeta{margin-top:8px;font-size:13px;color:rgba(255,255,255,.72);line-height:1.55}
  .ccChipRow,.ccInlineRow{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
  .ccChip{border-radius:999px;padding:5px 10px;font-size:11px;font-weight:800;background:rgba(255,255,255,.11);border:1px solid rgba(255,255,255,.14)}
  .ccChipAlert{background:rgba(192,57,43,.35);color:#fecaca;border-color:rgba(192,57,43,.5)}
  .ccGrid{display:grid;gap:12px}.ccGridTwo{grid-template-columns:repeat(2,minmax(0,1fr))}
  .ccInfoLabel{font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px}
  .ccInfoValue{font-size:14px;font-weight:700;color:#1e1e2e;line-height:1.5}
  .ccMemberCard{display:flex;gap:12px;align-items:center;padding:14px}
  .ccMemberAvatar{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;flex:0 0 auto}
  .ccBillAmount{margin-top:4px;font-family:Georgia,"Times New Roman",serif;font-size:22px;font-weight:700;color:#1a2035}
  .ccUpdateTime{margin-top:6px;font-size:11px;color:#94a3b8;font-weight:700}
  .ccForm{display:grid;gap:10px}
  .ccField,.ccTextarea,.ccSelect{width:100%;border:1px solid #d7cebe;border-radius:12px;padding:10px 12px;font:inherit;color:#1e1e2e;background:#fff}
  .ccTextarea{min-height:88px;resize:vertical}
  .ccFieldRow{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  .ccModalBack{position:fixed;inset:0;background:rgba(26,32,53,.45);display:flex;align-items:flex-end;justify-content:center;padding:0 12px 12px;z-index:50}
  .ccModal{width:100%;max-width:430px;background:#fffdf9;border:1px solid #e8e0d0;border-radius:24px;padding:18px;box-shadow:0 24px 60px rgba(26,32,53,.25)}
  .ccModalHandle{width:42px;height:4px;border-radius:999px;background:#d8cfc0;margin:0 auto 16px}
  .ccEmpty{background:#fff;border:1px dashed #d8cfc0;border-radius:18px;padding:22px 18px;text-align:center;color:#64748b;font-size:14px;line-height:1.6}
  .ccError{max-width:430px;margin:20px auto 0;padding:14px 16px;border-radius:14px;background:#fef2f2;color:#991b1b;border:1px solid #fecaca;font-size:13px}
  @media (max-width:480px){.ccPage{padding:0}.ccShell{border-radius:0;border-left:0;border-right:0;min-height:100vh}.ccSummary{grid-template-columns:repeat(2,1fr)}.ccTaskCard{grid-template-columns:40px 40px 1fr}.ccTaskActions,.ccNeedActions{grid-column:3;align-items:flex-start;flex-direction:row;flex-wrap:wrap}.ccGridTwo,.ccFieldRow{grid-template-columns:1fr}}
`;

const avatarColorMap: Record<string, string> = {
  coral: "linear-gradient(135deg, #e8563a, #f07058)",
  sage: "linear-gradient(135deg, #3d7a5e, #4e9b78)",
  sky: "linear-gradient(135deg, #2b6cb8, #3b82f6)",
  gold: "linear-gradient(135deg, #c48a12, #d4a017)",
  plum: "linear-gradient(135deg, #6b3fa0, #8b5cf6)",
};

export default function CareCircleApp() {
  const inviteFromUrl = new URLSearchParams(window.location.search).get("invite")?.trim() || "";
  const [inviteToken, setInviteToken] = React.useState<string>(() => inviteFromUrl || sessionStorage.getItem("nhnm_carecircle_invite") || "");
  const [tab, setTab] = React.useState<TabKey>("today");
  const [data, setData] = React.useState<LaunchPayload | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [busyTaskId, setBusyTaskId] = React.useState<string | null>(null);
  const [busyNeedId, setBusyNeedId] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState<string | null>(null);
  const [showEmergency, setShowEmergency] = React.useState(false);
  const [activeMemberId, setActiveMemberId] = React.useState<string | null>(null);
  const [inviteResult, setInviteResult] = React.useState<{ inviteUrl: string; name: string } | null>(null);
  const [taskDraft, setTaskDraft] = React.useState({ title: "", description: "", scheduledTime: "", taskType: "other", priority: "normal" });
  const [needDraft, setNeedDraft] = React.useState({ title: "", description: "", frequency: "Weekly", coverageNotes: "" });
  const [billDraft, setBillDraft] = React.useState({ name: "", provider: "", amount: "", dueDate: "", frequency: "monthly", notes: "" });
  const [updateDraft, setUpdateDraft] = React.useState("");
  const [inviteDraft, setInviteDraft] = React.useState({ name: "", email: "", mobile: "", role: "family", relationship: "", responsibilities: "" });

  React.useEffect(() => {
    if (inviteFromUrl) {
      sessionStorage.setItem("nhnm_carecircle_invite", inviteFromUrl);
      setInviteToken(inviteFromUrl);
    }
  }, [inviteFromUrl]);

  const load = React.useCallback(async () => {
    if (!inviteToken) {
      setLoading(false);
      setError("A valid CareCircle invite link is required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/carecircle/launch`, {
        headers: { "X-CareCircle-Invite": inviteToken },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || "Failed to load CareCircle");
      setData(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load CareCircle");
    } finally {
      setLoading(false);
    }
  }, [inviteToken]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function taskAction(taskId: string, action: "claim" | "done") {
    if (!data?.circle?.id || !actingMember?.id) return;
    setBusyTaskId(taskId);
    try {
      const res = await fetch(`${API_BASE}/api/carecircle/circles/${data.circle.id}/tasks/${taskId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CareCircle-Invite": inviteToken },
        body: JSON.stringify({ memberId: actingMember.id }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || `Failed to ${action} task`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} task`);
    } finally {
      setBusyTaskId(null);
    }
  }

  async function claimNeed(needId: string) {
    if (!data?.circle?.id || !actingMember?.id) return;
    setBusyNeedId(needId);
    try {
      const res = await fetch(`${API_BASE}/api/carecircle/circles/${data.circle.id}/needs/${needId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CareCircle-Invite": inviteToken },
        body: JSON.stringify({ memberId: actingMember.id }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || "Failed to claim need");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to claim need");
    } finally {
      setBusyNeedId(null);
    }
  }

  async function createItem(
    kind: "task" | "need" | "bill" | "update",
    payload: Record<string, unknown>,
    reset: () => void
  ) {
    if (!data?.circle?.id) return;
    setSubmitting(kind);
    try {
      const res = await fetch(`${API_BASE}/api/carecircle/circles/${data.circle.id}/${kind === "update" ? "updates" : `${kind}s`}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CareCircle-Invite": inviteToken },
        body: JSON.stringify({
          memberId: actingMember?.id ?? null,
          postedByName: actingMember?.name ?? "Circle member",
          ...payload,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || `Failed to create ${kind}`);
      reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to create ${kind}`);
    } finally {
      setSubmitting(null);
    }
  }

  async function inviteMember() {
    if (!data?.circle?.id || !inviteDraft.name.trim()) return;
    setSubmitting("invite");
    try {
      const res = await fetch(`${API_BASE}/api/carecircle/circles/${data.circle.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CareCircle-Invite": inviteToken },
        body: JSON.stringify({
          invitedByMemberId: actingMember?.id ?? null,
          name: inviteDraft.name.trim(),
          email: inviteDraft.email.trim() || null,
          mobile: inviteDraft.mobile.trim() || null,
          role: inviteDraft.role,
          relationship: inviteDraft.relationship.trim() || null,
          responsibilities: inviteDraft.responsibilities.trim() || null,
          avatarColour: "coral",
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || "Failed to invite member");
      setInviteResult({ inviteUrl: body.inviteUrl, name: inviteDraft.name.trim() });
      setInviteDraft({ name: "", email: "", mobile: "", role: "family", relationship: "", responsibilities: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite member");
    } finally {
      setSubmitting(null);
    }
  }

  const todayTasks = data?.todayTasks ?? [];
  const needs = data?.needs ?? [];
  const bills = data?.bills ?? [];
  const updates = data?.updates ?? [];
  const members = data?.members ?? [];
  const actingMember = React.useMemo(() => {
    if (!data) return null;
    return members.find((member) => member.id === activeMemberId) || data.currentMember;
  }, [activeMemberId, data, members]);
  const urgentTasks = todayTasks.filter((task) => task.priority === "urgent").length;
  const unclaimedCount = todayTasks.filter((task) => !task.assignedTo && task.status === "pending").length;
  const doneCount = todayTasks.filter((task) => task.status === "done").length;
  const visitCount = todayTasks.filter((task) => ["family_visit", "personal_care", "gp_appointment"].includes(task.taskType)).length;

  return (
    <div className="ccPage">
      <SeoHead
        title="CareCircle | Daily care coordination for families"
        description="CareCircle helps families coordinate visits, care tasks, updates, and practical care support in one place."
        canonicalUrl="https://www.nursinghomesnearme.com.au/carecircle"
        ogType="website"
        imageUrl="https://www.nursinghomesnearme.com.au/social-preview.png"
      />
      <style>{styles}</style>
      {error ? <div className="ccError">{error}</div> : null}
      <div className="ccShell">
        <div className="ccTopbar">
          <div className="ccTopbarLeft">
            <div className="ccAvatar">CC</div>
            <div>
              <div className="ccTopbarTitle">{data ? `${data.circle.firstName}'s Circle` : "CareCircle"}</div>
              <div className="ccTopbarSub">
                {data?.circle.suburb && data?.circle.state
                  ? `Safe at home | ${data.circle.suburb}, ${data.circle.state}`
                  : "Daily care coordination for families"}
              </div>
            </div>
          </div>
          <button className="ccGhostBtn" onClick={load}>Refresh</button>
        </div>
        <div className="ccEmergency ccEmergencyButton" onClick={() => setShowEmergency(true)}>
          Emergency contacts | 000 | {data?.circle.gpName || "Family + GP"} | allergies visible on every screen
        </div>
        <div className="ccTabs">
          {(["today", "needs", "about", "circle", "bills", "updates"] as TabKey[]).map((key) => (
            <button key={key} className={`ccTab ${tab === key ? "ccTabActive" : ""}`} onClick={() => setTab(key)}>
              <span>{key === "about" ? "A" : key === "updates" ? "U" : key[0].toUpperCase()}</span>
              <span>{key === "about" ? `About ${data?.circle.firstName || "them"}` : capitalize(key)}</span>
            </button>
          ))}
        </div>
        <div className="ccPane">
          {loading && !data ? <div className="ccEmpty">Loading CareCircle...</div> : null}
          {!loading && data && tab === "today" ? (
            <>
              <div className="ccDateHeader">
                <div>
                  <div className="ccDateMain">{formatTodayHeader()}</div>
                  <div className="ccDateSub">{todayTasks.length} things happening today</div>
                </div>
                <button className="ccGhostBtn" type="button">Week view soon</button>
              </div>
              <div className="ccSummary">
                <div className="ccSummaryCell"><div className="ccSummaryNum">{visitCount}</div><div className="ccSummaryLbl">Visits today</div></div>
                <div className="ccSummaryCell"><div className="ccSummaryNum">{unclaimedCount}</div><div className="ccSummaryLbl">Unclaimed tasks</div></div>
                <div className="ccSummaryCell"><div className="ccSummaryNum">{doneCount}</div><div className="ccSummaryLbl">Done already</div></div>
                <div className="ccSummaryCell"><div className="ccSummaryNum">{urgentTasks}</div><div className="ccSummaryLbl">Urgent today</div></div>
              </div>
              <div className="ccCard" style={{ marginBottom: "16px" }}>
                <div className="ccInfoLabel">Acting as</div>
                <select
                  className="ccSelect"
                  value={actingMember?.id || ""}
                  onChange={(event) => setActiveMemberId(event.target.value || null)}
                >
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} - {capitalize(member.role)}
                    </option>
                  ))}
                </select>
                <div className="ccText">Use this demo switch until Clerk auth is wired. Claims and notes will post as this member.</div>
              </div>
              {(["morning", "afternoon", "evening"] as const).map((period) => {
                const tasks = todayTasks.filter((task) => getPeriod(task.scheduledTime) === period);
                if (!tasks.length) return null;
                return (
                  <div key={period}>
                    <div className="ccSectionLabel">{period}</div>
                    <div className="ccTaskList">
                      {tasks.map((task) => (
                        <div key={task.id} className={["ccTaskCard", task.priority === "urgent" ? "ccTaskUrgent" : "", task.status === "done" ? "ccTaskDone" : ""].join(" ")}>
                          <div className="ccTaskTime">{formatTime(task.scheduledTime)}</div>
                          <div className="ccIcon">{taskGlyph(task.taskType)}</div>
                          <div>
                            <div className="ccTaskTitle">{task.title}</div>
                            {task.description ? <div className="ccTaskDesc">{task.description}</div> : null}
                            <div className="ccTaskWho">{task.assignedName ? task.assignedName : "Unclaimed"}</div>
                          </div>
                          <div className="ccTaskActions">
                            {task.status === "done" ? (
                              <div className="ccDoneMark">Done</div>
                            ) : (
                              <>
                                {!task.assignedTo ? (
                                  <button className="ccActionBtn" disabled={busyTaskId === task.id} onClick={() => taskAction(task.id, "claim")}>
                                    {busyTaskId === task.id ? "Claiming..." : "Claim it"}
                                  </button>
                                ) : null}
                                <button className="ccDoneBtn" disabled={busyTaskId === task.id} onClick={() => taskAction(task.id, "done")}>
                                  {busyTaskId === task.id ? "Saving..." : "Done"}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              <div className="ccSectionLabel">Recent updates</div>
              <div className="ccUpdateList">
                {updates.slice(0, 3).map((update) => (
                  <div className="ccUpdateCard ccCard" key={update.id}>
                    <div className="ccCardTitle">{update.postedByName || "Circle update"}</div>
                    <div className="ccText">{update.message}</div>
                    <div className="ccUpdateTime">{formatDateTime(update.createdAt)}</div>
                  </div>
                ))}
              </div>
              <div className="ccSectionLabel">Add quick update</div>
              <div className="ccCard">
                <div className="ccForm">
                  <textarea
                    className="ccTextarea"
                    placeholder="Post a quick note for the family..."
                    value={updateDraft}
                    onChange={(event) => setUpdateDraft(event.target.value)}
                  />
                  <button
                    className="ccActionBtn"
                    disabled={!updateDraft.trim() || submitting === "update"}
                    onClick={() => createItem("update", { message: updateDraft.trim(), updateType: "note", isAlert: false }, () => setUpdateDraft(""))}
                  >
                    {submitting === "update" ? "Posting..." : "Post update"}
                  </button>
                </div>
              </div>
              <div className="ccSectionLabel">Add task</div>
              <div className="ccCard">
                <div className="ccForm">
                  <input className="ccField" placeholder="Task title" value={taskDraft.title} onChange={(event) => setTaskDraft((current) => ({ ...current, title: event.target.value }))} />
                  <textarea className="ccTextarea" placeholder="Task details" value={taskDraft.description} onChange={(event) => setTaskDraft((current) => ({ ...current, description: event.target.value }))} />
                  <div className="ccFieldRow">
                    <input className="ccField" type="time" value={taskDraft.scheduledTime} onChange={(event) => setTaskDraft((current) => ({ ...current, scheduledTime: event.target.value }))} />
                    <select className="ccSelect" value={taskDraft.taskType} onChange={(event) => setTaskDraft((current) => ({ ...current, taskType: event.target.value }))}>
                      <option value="other">Other</option>
                      <option value="meal">Meal</option>
                      <option value="medication">Medication</option>
                      <option value="personal_care">Personal care</option>
                      <option value="family_visit">Family visit</option>
                      <option value="gp_appointment">GP appointment</option>
                    </select>
                  </div>
                  <button
                    className="ccActionBtn"
                    disabled={!taskDraft.title.trim() || submitting === "task"}
                    onClick={() => createItem("task", {
                      title: taskDraft.title.trim(),
                      description: taskDraft.description.trim() || null,
                      taskType: taskDraft.taskType,
                      scheduledDate: new Date().toISOString().split("T")[0],
                      scheduledTime: taskDraft.scheduledTime || null,
                      icon: taskGlyph(taskDraft.taskType),
                      priority: taskDraft.priority,
                    }, () => setTaskDraft({ title: "", description: "", scheduledTime: "", taskType: "other", priority: "normal" }))}
                  >
                    {submitting === "task" ? "Saving..." : "Add task for today"}
                  </button>
                </div>
              </div>
            </>
          ) : null}

          {!loading && data && tab === "needs" ? (
            <>
              <div className="ccDateHeader">
                <div>
                  <div className="ccDateMain">Needs board</div>
                  <div className="ccDateSub">Recurring help the whole family can see and share</div>
                </div>
              </div>
              <div className="ccNeedList">
                {needs.map((need) => (
                  <div className="ccNeedCard ccCard" key={need.id}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                      <div className="ccIcon">{needGlyph(need)}</div>
                      <div style={{ flex: 1 }}>
                        <div className="ccCardTitle">{need.title}</div>
                        {need.description ? <div className="ccText">{need.description}</div> : null}
                        <div className="ccInlineRow">
                          {need.frequency ? <span className="ccMetaChip">{need.frequency}</span> : null}
                          {need.assignedName ? <span className="ccMetaChip">{need.assignedName}</span> : null}
                          {need.isChsp ? <span className="ccMetaChip">CHSP</span> : null}
                        </div>
                        {need.coverageNotes ? <div className="ccText">{need.coverageNotes}</div> : null}
                        <div className={`ccStatusPill ${needStatusClass(need.status)}`}>{humanizeStatus(need.status)}</div>
                        <div className="ccInlineRow">
                          {need.lastCompleted ? <span className="ccMetaChip">Last done {formatShortDate(need.lastCompleted)}</span> : null}
                          {need.nextDue ? <span className="ccMetaChip">Next due {formatShortDate(need.nextDue)}</span> : null}
                        </div>
                      </div>
                      <div className="ccNeedActions">
                        {!need.assignedTo && need.status !== "covered" ? (
                          <button className="ccActionBtn" disabled={busyNeedId === need.id} onClick={() => claimNeed(need.id)}>
                            {busyNeedId === need.id ? "Claiming..." : "Claim"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="ccSectionLabel">Add need</div>
              <div className="ccCard">
                <div className="ccForm">
                  <input className="ccField" placeholder="Need title" value={needDraft.title} onChange={(event) => setNeedDraft((current) => ({ ...current, title: event.target.value }))} />
                  <textarea className="ccTextarea" placeholder="What help is needed?" value={needDraft.description} onChange={(event) => setNeedDraft((current) => ({ ...current, description: event.target.value }))} />
                  <div className="ccFieldRow">
                    <select className="ccSelect" value={needDraft.frequency} onChange={(event) => setNeedDraft((current) => ({ ...current, frequency: event.target.value }))}>
                      <option>Daily</option>
                      <option>Weekly</option>
                      <option>Fortnightly</option>
                      <option>Monthly</option>
                    </select>
                    <input className="ccField" placeholder="Coverage notes" value={needDraft.coverageNotes} onChange={(event) => setNeedDraft((current) => ({ ...current, coverageNotes: event.target.value }))} />
                  </div>
                  <button
                    className="ccActionBtn"
                    disabled={!needDraft.title.trim() || submitting === "need"}
                    onClick={() => createItem("need", {
                      title: needDraft.title.trim(),
                      description: needDraft.description.trim() || null,
                      frequency: needDraft.frequency,
                      coverageNotes: needDraft.coverageNotes.trim() || null,
                      icon: "ND",
                      isChsp: false,
                      chspServiceType: null,
                      nextDue: null,
                    }, () => setNeedDraft({ title: "", description: "", frequency: "Weekly", coverageNotes: "" }))}
                  >
                    {submitting === "need" ? "Saving..." : "Add need"}
                  </button>
                </div>
              </div>
            </>
          ) : null}

          {!loading && data && tab === "about" ? (
            <>
              <div className="ccCircleCard">
                <div className="ccCircleName">{data.circle.firstName} {data.circle.lastName}</div>
                <div className="ccCircleMeta">
                  {joinBits([data.circle.address, data.circle.suburb, data.circle.state, data.circle.postcode])}
                  <br />
                  {joinBits([data.circle.gpName, data.circle.gpPhone])}
                </div>
                <div className="ccChipRow">
                  {data.circle.allergies ? <div className="ccChip ccChipAlert">{data.circle.allergies}</div> : null}
                  {splitTextList(data.circle.medicalConditions).map((item) => <div className="ccChip" key={item}>{item}</div>)}
                </div>
              </div>
              <div className="ccGrid ccGridTwo">
                <div className="ccCard">
                  <div className="ccInfoLabel">Medicare</div>
                  <div className="ccInfoValue">{joinBits([data.circle.medicareNumber, data.circle.medicareExpiry ? `Exp ${data.circle.medicareExpiry}` : null]) || "Not added yet"}</div>
                </div>
                <div className="ccCard">
                  <div className="ccInfoLabel">Hospital</div>
                  <div className="ccInfoValue">{data.circle.hospitalPreference || "Not added yet"}</div>
                </div>
                <div className="ccCard">
                  <div className="ccInfoLabel">Food + drink</div>
                  <div className="ccInfoValue">{joinBits([data.circle.foodLikes, data.circle.teaCoffeePreference]) || "Not added yet"}</div>
                  {data.circle.foodDislikes ? <div className="ccText">Avoid: {data.circle.foodDislikes}</div> : null}
                </div>
                <div className="ccCard">
                  <div className="ccInfoLabel">Comforts</div>
                  <div className="ccInfoValue">{joinBits([data.circle.favouriteTv, data.circle.musicPreference, data.circle.religion]) || "Not added yet"}</div>
                </div>
              </div>
              {data.circle.medications && data.circle.medications.length > 0 ? (
                <>
                  <div className="ccSectionLabel">Medications</div>
                  <div className="ccCard">
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {["morning", "evening", "night", ""].map((timeSlot) => {
                        const meds = data.circle.medications.filter((m) =>
                          timeSlot ? (m.time || "").toLowerCase() === timeSlot : !["morning", "evening", "night"].includes((m.time || "").toLowerCase())
                        );
                        if (!meds.length) return null;
                        return (
                          <div key={timeSlot || "other"}>
                            <div className="ccInfoLabel" style={{ marginBottom: 6 }}>{timeSlot ? capitalize(timeSlot) : "Other"}</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {meds.map((med, idx) => (
                                <span key={idx} className="ccMetaChip">{med.name} {med.dose}</span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {data.circle.allergies ? (
                      <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(192,57,43,0.08)", borderRadius: 10, border: "1px solid rgba(192,57,43,0.2)" }}>
                        <div className="ccInfoLabel" style={{ color: "#991b1b" }}>Allergy alert</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#991b1b" }}>{data.circle.allergies}</div>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : null}
              <div className="ccSectionLabel">Advance care directive</div>
              <div className="ccCard">
                <div className="ccInfoLabel">Directive in place</div>
                <div className="ccInfoValue">{data.circle.advanceCareDirective ? "Yes" : "Not recorded"}</div>
                {data.circle.advanceCareDirectiveNotes ? <div className="ccText" style={{ marginTop: 8 }}>{data.circle.advanceCareDirectiveNotes}</div> : null}
              </div>
              <div className="ccSectionLabel">Practical notes</div>
              <div className="ccCard">
                <div className="ccText">{data.circle.carerNotes || "Circle notes will appear here."}</div>
                <div className="ccInlineRow">
                  {data.circle.spareKeyHolders ? <span className="ccMetaChip">Keys: {data.circle.spareKeyHolders}</span> : null}
                  {data.circle.homeEntryNotes ? <span className="ccMetaChip">Entry: {data.circle.homeEntryNotes}</span> : null}
                  {data.circle.hasPets ? <span className="ccMetaChip">Pets at home</span> : null}
                </div>
              </div>
            </>
          ) : null}

          {!loading && data && tab === "circle" ? (
            <>
              <div className="ccDateHeader">
                <div>
                  <div className="ccDateMain">Circle members</div>
                  <div className="ccDateSub">Who is helping and who holds authority</div>
                </div>
              </div>
              <div className="ccMemberList">
                {members.map((member) => (
                  <div className="ccMemberCard" key={member.id}>
                    <div className="ccMemberAvatar" style={{ background: avatarColorMap[member.avatarColour || "coral"] || avatarColorMap.coral }}>
                      {initials(member.name)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="ccMemberName">{member.name}</div>
                      <div className="ccMemberMeta">
                        {joinBits([member.relationship, capitalize(member.role)])}
                        {member.responsibilities ? <><br />{member.responsibilities}</> : null}
                        {(member.email || member.mobile) ? <><br />{joinBits([member.email, member.mobile])}</> : null}
                      </div>
                      <div className="ccInlineRow">
                        {member.isCircleManager ? <span className="ccPill">Circle manager</span> : null}
                        {member.isPoa ? <span className="ccPill">POA</span> : null}
                        {member.inviteAcceptedAt ? <span className="ccPill">Invite accepted</span> : member.inviteSentAt ? <span className="ccPill">Invite sent</span> : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="ccSectionLabel">Invite someone new</div>
              <div className="ccCard">
                <div className="ccForm">
                  <input className="ccField" placeholder="Full name" value={inviteDraft.name} onChange={(event) => setInviteDraft((current) => ({ ...current, name: event.target.value }))} />
                  <div className="ccFieldRow">
                    <input className="ccField" placeholder="Mobile" value={inviteDraft.mobile} onChange={(event) => setInviteDraft((current) => ({ ...current, mobile: event.target.value }))} />
                    <input className="ccField" placeholder="Email" value={inviteDraft.email} onChange={(event) => setInviteDraft((current) => ({ ...current, email: event.target.value }))} />
                  </div>
                  <div className="ccFieldRow">
                    <select className="ccSelect" value={inviteDraft.role} onChange={(event) => setInviteDraft((current) => ({ ...current, role: event.target.value }))}>
                      <option value="family">Family</option>
                      <option value="carer">Carer</option>
                      <option value="neighbour">Neighbour</option>
                      <option value="medical">Medical</option>
                      <option value="admin">Admin</option>
                    </select>
                    <input className="ccField" placeholder="Relationship" value={inviteDraft.relationship} onChange={(event) => setInviteDraft((current) => ({ ...current, relationship: event.target.value }))} />
                  </div>
                  <textarea className="ccTextarea" placeholder="Responsibilities" value={inviteDraft.responsibilities} onChange={(event) => setInviteDraft((current) => ({ ...current, responsibilities: event.target.value }))} />
                  <button className="ccActionBtn" disabled={!inviteDraft.name.trim() || submitting === "invite"} onClick={inviteMember}>
                    {submitting === "invite" ? "Sending..." : "Send invite"}
                  </button>
                  {inviteResult ? (
                    <div className="ccText">
                      Invite ready for {inviteResult.name}: <br />
                      <a href={inviteResult.inviteUrl} target="_blank" rel="noreferrer">{inviteResult.inviteUrl}</a>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="ccSectionLabel">Legal + support</div>
              <div className="ccGrid ccGridTwo">
                <div className="ccCard">
                  <div className="ccInfoLabel">Power of attorney</div>
                  <div className="ccInfoValue">{joinBits([data.circle.poaName, data.circle.poaRelationship]) || "Not added yet"}</div>
                  {data.circle.poaPhone ? <div className="ccText">{data.circle.poaPhone}</div> : null}
                </div>
                <div className="ccCard">
                  <div className="ccInfoLabel">Guardian</div>
                  <div className="ccInfoValue">{data.circle.guardianName || "Not added yet"}</div>
                  {data.circle.guardianPhone ? <div className="ccText">{data.circle.guardianPhone}</div> : null}
                </div>
                <div className="ccCard">
                  <div className="ccInfoLabel">Ambulance cover</div>
                  <div className="ccInfoValue">{data.circle.ambulanceCover ? "Covered" : "Unknown"}</div>
                  {data.circle.ambulanceMembership ? <div className="ccText">{data.circle.ambulanceMembership}</div> : null}
                </div>
                <div className="ccCard">
                  <div className="ccInfoLabel">Health insurance</div>
                  <div className="ccInfoValue">{data.circle.healthInsurance || "Not added yet"}</div>
                  {data.circle.healthInsuranceNumber ? <div className="ccText">{data.circle.healthInsuranceNumber}</div> : null}
                </div>
              </div>
            </>
          ) : null}

          {!loading && data && tab === "bills" ? (
            <>
              <div className="ccDateHeader">
                <div>
                  <div className="ccDateMain">Bills and money</div>
                  <div className="ccDateSub">Keep due dates and account handling visible for the family</div>
                </div>
              </div>
              <div className="ccGrid ccGridTwo" style={{ marginBottom: "16px" }}>
                <div className="ccCard">
                  <div className="ccInfoLabel">Bill manager</div>
                  <div className="ccInfoValue">{data.circle.billManagerName || "Not added yet"}</div>
                  {data.circle.billManagerPhone ? <div className="ccText">{data.circle.billManagerPhone}</div> : null}
                </div>
                <div className="ccCard">
                  <div className="ccInfoLabel">Subscription</div>
                  <div className="ccInfoValue">{capitalize(data.circle.subscriptionStatus || "trial")}</div>
                </div>
              </div>
              <div className="ccBillList">
                {bills.map((bill) => (
                  <div className="ccBillCard ccCard" key={bill.id}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                      <div className="ccIcon">{billGlyph(bill.name)}</div>
                      <div style={{ flex: 1 }}>
                        <div className="ccCardTitle">{bill.name}</div>
                        <div className="ccText">{joinBits([bill.provider, bill.frequency ? capitalize(bill.frequency) : null])}</div>
                        <div className="ccBillAmount">{formatCurrency(bill.amount)}</div>
                        <div className={`ccStatusPill ${billStatusClass(bill.status)}`}>{humanizeStatus(bill.status)}</div>
                        <div className="ccInlineRow">
                          {bill.dueDate ? <span className="ccMetaChip">Due {formatShortDate(bill.dueDate)}</span> : null}
                          {bill.handledByName ? <span className="ccMetaChip">Handled by {bill.handledByName}</span> : null}
                          {bill.isDirectDebit ? <span className="ccMetaChip">Direct debit</span> : null}
                        </div>
                        {bill.notes ? <div className="ccText">{bill.notes}</div> : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="ccSectionLabel">Add bill</div>
              <div className="ccCard">
                <div className="ccForm">
                  <input className="ccField" placeholder="Bill name" value={billDraft.name} onChange={(event) => setBillDraft((current) => ({ ...current, name: event.target.value }))} />
                  <div className="ccFieldRow">
                    <input className="ccField" placeholder="Provider" value={billDraft.provider} onChange={(event) => setBillDraft((current) => ({ ...current, provider: event.target.value }))} />
                    <input className="ccField" placeholder="Amount" value={billDraft.amount} onChange={(event) => setBillDraft((current) => ({ ...current, amount: event.target.value }))} />
                  </div>
                  <div className="ccFieldRow">
                    <input className="ccField" type="date" value={billDraft.dueDate} onChange={(event) => setBillDraft((current) => ({ ...current, dueDate: event.target.value }))} />
                    <select className="ccSelect" value={billDraft.frequency} onChange={(event) => setBillDraft((current) => ({ ...current, frequency: event.target.value }))}>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annual">Annual</option>
                      <option value="one-off">One-off</option>
                    </select>
                  </div>
                  <textarea className="ccTextarea" placeholder="Notes" value={billDraft.notes} onChange={(event) => setBillDraft((current) => ({ ...current, notes: event.target.value }))} />
                  <button
                    className="ccActionBtn"
                    disabled={!billDraft.name.trim() || submitting === "bill"}
                    onClick={() => createItem("bill", {
                      name: billDraft.name.trim(),
                      provider: billDraft.provider.trim() || null,
                      icon: "BL",
                      amount: billDraft.amount ? Number(billDraft.amount) : null,
                      dueDate: billDraft.dueDate || null,
                      frequency: billDraft.frequency,
                      isDirectDebit: false,
                      notes: billDraft.notes.trim() || null,
                      status: "upcoming",
                    }, () => setBillDraft({ name: "", provider: "", amount: "", dueDate: "", frequency: "monthly", notes: "" }))}
                  >
                    {submitting === "bill" ? "Saving..." : "Add bill"}
                  </button>
                </div>
              </div>
            </>
          ) : null}
          {!loading && data && tab === "updates" ? (
            <>
              <div className="ccDateHeader">
                <div>
                  <div className="ccDateMain">Family updates</div>
                  <div className="ccDateSub">Notes and alerts visible to everyone in the circle</div>
                </div>
              </div>
              <div className="ccCard" style={{ marginBottom: 16 }}>
                <div className="ccForm">
                  <textarea
                    className="ccTextarea"
                    placeholder="Post a note for the family..."
                    value={updateDraft}
                    onChange={(event) => setUpdateDraft(event.target.value)}
                  />
                  <button
                    className="ccActionBtn"
                    disabled={!updateDraft.trim() || submitting === "update"}
                    onClick={() => createItem("update", { message: updateDraft.trim(), updateType: "note", isAlert: false }, () => setUpdateDraft(""))}
                  >
                    {submitting === "update" ? "Posting..." : "Post update"}
                  </button>
                </div>
              </div>
              {updates.length === 0 ? (
                <div className="ccEmpty">No updates yet. Post the first one above.</div>
              ) : (
                <div className="ccUpdateList">
                  {updates.map((update) => (
                    <div className="ccUpdateCard ccCard" key={update.id} style={update.isAlert ? { borderLeft: "4px solid #e8563a" } : {}}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div className="ccCardTitle">{update.postedByName || "Circle member"}</div>
                        {update.isAlert ? <span className="ccStatusPill ccStatusOverdue">Alert</span> : null}
                      </div>
                      <div className="ccText">{update.message}</div>
                      <div className="ccUpdateTime">{formatDateTime(update.createdAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
      {data && showEmergency ? (
        <div className="ccModalBack" onClick={() => setShowEmergency(false)}>
          <div className="ccModal" onClick={(event) => event.stopPropagation()}>
            <div className="ccModalHandle" />
            <div className="ccDateMain" style={{ fontSize: "20px", marginBottom: "10px" }}>Emergency contacts</div>
            <div className="ccMemberList">
              {data.circle.poaName || data.circle.poaPhone ? (
                <div className="ccMemberCard">
                  <div className="ccIcon">PO</div>
                  <div style={{ flex: 1 }}>
                    <div className="ccMemberName">{data.circle.poaName || "Power of attorney"}</div>
                    <div className="ccMemberMeta">{joinBits([data.circle.poaRelationship, data.circle.poaPhone])}</div>
                  </div>
                </div>
              ) : null}
              {data.circle.gpName || data.circle.gpPhone ? (
                <div className="ccMemberCard">
                  <div className="ccIcon">GP</div>
                  <div style={{ flex: 1 }}>
                    <div className="ccMemberName">{data.circle.gpName || "GP"}</div>
                    <div className="ccMemberMeta">{data.circle.gpPhone || "Phone not added yet"}</div>
                  </div>
                </div>
              ) : null}
              <div className="ccMemberCard">
                <div className="ccIcon">00</div>
                <div style={{ flex: 1 }}>
                  <div className="ccMemberName">Emergency</div>
                  <div className="ccMemberMeta">Call 000 for urgent medical emergencies</div>
                </div>
              </div>
            </div>
            <button className="ccGhostBtn" style={{ marginTop: "12px", width: "100%" }} onClick={() => setShowEmergency(false)}>Close</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function splitTextList(value: string | null | undefined) {
  return (value || "").split(/[,|]/).map((item) => item.trim()).filter(Boolean);
}

function joinBits(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(" | ");
}

function formatTodayHeader() {
  return new Intl.DateTimeFormat("en-AU", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
}

function formatTime(raw: string | null) {
  if (!raw) return "Any time";
  const [hourRaw, minuteRaw] = raw.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw || "0");
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return new Intl.DateTimeFormat("en-AU", { hour: "numeric", minute: "2-digit" }).format(date);
}

function formatShortDate(raw: string | null) {
  if (!raw) return "";
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short" }).format(new Date(raw));
}

function formatDateTime(raw: string) {
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(raw));
}

function formatCurrency(value: number | null) {
  if (value == null) return "Amount not set";
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 2 }).format(value);
}

function getPeriod(raw: string | null) {
  if (!raw) return "afternoon";
  const hour = Number(raw.split(":")[0]);
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("");
}

function taskGlyph(taskType: string) {
  switch (taskType) {
    case "meal": return "ME";
    case "medication": return "RX";
    case "personal_care": return "PC";
    case "family_visit": return "FV";
    case "gp_appointment": return "GP";
    default: return "TK";
  }
}

function needGlyph(need: Need) {
  if (need.isChsp) return "CH";
  if (need.title.toLowerCase().includes("dog")) return "DW";
  if (need.title.toLowerCase().includes("lunch")) return "LN";
  return "ND";
}

function billGlyph(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("electric")) return "EL";
  if (lower.includes("phone") || lower.includes("internet")) return "PH";
  if (lower.includes("rates")) return "RT";
  if (lower.includes("medibank") || lower.includes("health")) return "HI";
  return "BL";
}

function humanizeStatus(value: string) {
  return value.replace(/_/g, " ");
}

function needStatusClass(status: string) {
  switch (status) {
    case "covered": return "ccStatusCovered";
    case "claimed": return "ccStatusClaimed";
    default: return "ccStatusPending";
  }
}

function billStatusClass(status: string) {
  switch (status) {
    case "overdue": return "ccStatusOverdue";
    case "due_soon": return "ccStatusDueSoon";
    case "auto": return "ccStatusAuto";
    default: return "ccStatusClaimed";
  }
}
