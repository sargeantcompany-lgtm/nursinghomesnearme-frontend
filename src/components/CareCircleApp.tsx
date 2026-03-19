import React from "react";
import SeoHead from "./SeoHead";
import { API_BASE } from "../lib/runtimeConfig";

type Circle = {
  id: string;
  firstName: string;
  lastName: string;
  address: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  allergies: string | null;
  medicalConditions: string | null;
  gpName: string | null;
  gpPhone: string | null;
  carerNotes: string | null;
  subscriptionStatus: string | null;
};

type Member = {
  id: string;
  name: string;
  role: string;
  relationship: string | null;
  isCircleManager: boolean;
  avatarColour: string | null;
  responsibilities: string | null;
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

type LaunchPayload = {
  circle: Circle;
  currentMember: Member | null;
  members: Member[];
  todayTasks: Task[];
};

type TabKey = "today" | "needs" | "about" | "circle" | "bills";

const shellStyles = `
  .ccPage {
    min-height: 100vh;
    background: linear-gradient(180deg, #f7f2ea 0%, #fffdf9 45%, #f7f2ea 100%);
    padding: 24px 16px 40px;
    box-sizing: border-box;
  }
  .ccShell {
    max-width: 430px;
    margin: 0 auto;
    background: #fffdf9;
    border: 1px solid #e8e0d0;
    border-radius: 32px;
    overflow: hidden;
    box-shadow: 0 24px 60px rgba(26, 32, 53, 0.18);
  }
  .ccTopbar {
    background: #1a2035;
    color: white;
    padding: 16px 18px 14px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
  }
  .ccTopbarLeft {
    display: flex;
    gap: 12px;
    align-items: center;
    min-width: 0;
  }
  .ccAvatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: linear-gradient(135deg, #e8563a, #c48a12);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    flex: 0 0 auto;
  }
  .ccTopbarTitle {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 20px;
    font-weight: 700;
    line-height: 1.05;
  }
  .ccTopbarSub {
    color: rgba(255,255,255,0.65);
    font-size: 12px;
    margin-top: 4px;
  }
  .ccEmergency {
    background: linear-gradient(90deg, #7b1a1a, #9c2626);
    color: #fecaca;
    font-size: 12px;
    font-weight: 800;
    padding: 10px 18px;
    letter-spacing: 0.03em;
  }
  .ccTabs {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    background: white;
    border-bottom: 1px solid #e8e0d0;
  }
  .ccTab {
    border: 0;
    background: transparent;
    padding: 12px 4px 11px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    color: #94a3b8;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 3px solid transparent;
  }
  .ccTabActive {
    color: #e8563a;
    border-bottom-color: #e8563a;
  }
  .ccPane {
    padding: 16px 16px 26px;
  }
  .ccDateHeader {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 14px;
  }
  .ccDateMain {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 24px;
    font-weight: 700;
    color: #1a2035;
  }
  .ccDateSub {
    font-size: 13px;
    color: #64748b;
    margin-top: 4px;
  }
  .ccGhostBtn {
    border: 0;
    background: #fff2ef;
    color: #e8563a;
    border-radius: 999px;
    padding: 8px 14px;
    font-size: 12px;
    font-weight: 800;
  }
  .ccSummary {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 18px;
  }
  .ccSummaryCell {
    background: white;
    border: 1px solid #e8e0d0;
    border-radius: 14px;
    padding: 12px 8px;
    text-align: center;
  }
  .ccSummaryNum {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 24px;
    font-weight: 700;
    line-height: 1;
    color: #1a2035;
  }
  .ccSummaryUrgent {
    color: #e8563a;
  }
  .ccSummaryLbl {
    margin-top: 4px;
    font-size: 10px;
    color: #64748b;
    line-height: 1.2;
  }
  .ccSectionLabel {
    margin: 18px 0 10px;
    color: #94a3b8;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }
  .ccTaskList {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .ccTaskCard {
    position: relative;
    background: white;
    border: 1px solid #e8e0d0;
    border-left: 4px solid #c48a12;
    border-radius: 16px;
    padding: 14px 14px 14px 12px;
    display: grid;
    grid-template-columns: 44px 42px 1fr auto;
    gap: 10px;
    align-items: start;
  }
  .ccTaskUrgent { border-left-color: #e8563a; }
  .ccTaskDone { border-left-color: #3d7a5e; opacity: 0.72; }
  .ccTaskTime {
    color: #64748b;
    font-size: 11px;
    font-weight: 800;
    text-align: center;
    line-height: 1.15;
    padding-top: 3px;
  }
  .ccTaskIcon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: #fff2ef;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }
  .ccTaskTitle {
    font-size: 15px;
    font-weight: 800;
    color: #1e1e2e;
    line-height: 1.3;
  }
  .ccTaskDesc {
    margin-top: 4px;
    font-size: 12px;
    color: #64748b;
    line-height: 1.5;
  }
  .ccTaskWho {
    display: inline-flex;
    align-items: center;
    margin-top: 6px;
    padding: 4px 9px;
    border-radius: 999px;
    background: #f7f2ea;
    color: #1e1e2e;
    font-size: 11px;
    font-weight: 800;
  }
  .ccTaskActions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
  }
  .ccClaimBtn, .ccDoneBtn {
    border: 0;
    border-radius: 999px;
    padding: 8px 12px;
    color: white;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
    white-space: nowrap;
  }
  .ccClaimBtn { background: #e8563a; }
  .ccDoneBtn { background: #3d7a5e; }
  .ccDoneMark {
    color: #3d7a5e;
    font-size: 18px;
    font-weight: 900;
  }
  .ccCard {
    background: white;
    border: 1px solid #e8e0d0;
    border-radius: 18px;
    padding: 16px;
  }
  .ccCircleCard {
    background: linear-gradient(135deg, #1a2035, #2d3555);
    color: white;
    border-radius: 22px;
    padding: 18px;
    margin-bottom: 14px;
  }
  .ccCircleName {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 24px;
    font-weight: 700;
  }
  .ccCircleMeta {
    margin-top: 8px;
    font-size: 13px;
    color: rgba(255,255,255,0.72);
    line-height: 1.55;
  }
  .ccChipRow {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }
  .ccChip {
    border-radius: 999px;
    padding: 5px 10px;
    font-size: 11px;
    font-weight: 800;
    background: rgba(255,255,255,0.11);
    border: 1px solid rgba(255,255,255,0.14);
  }
  .ccChipAlert {
    background: rgba(192,57,43,0.35);
    color: #fecaca;
    border-color: rgba(192,57,43,0.5);
  }
  .ccMemberList {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .ccMemberCard {
    display: flex;
    gap: 12px;
    align-items: center;
    background: white;
    border: 1px solid #e8e0d0;
    border-radius: 16px;
    padding: 14px;
  }
  .ccMemberAvatar {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 800;
    flex: 0 0 auto;
  }
  .ccMemberName {
    font-size: 15px;
    font-weight: 800;
    color: #1e1e2e;
  }
  .ccMemberMeta {
    margin-top: 3px;
    font-size: 12px;
    color: #64748b;
    line-height: 1.45;
  }
  .ccPill {
    display: inline-flex;
    margin-top: 6px;
    padding: 3px 8px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 800;
    background: #fff2ef;
    color: #e8563a;
  }
  .ccEmpty {
    background: white;
    border: 1px dashed #d8cfc0;
    border-radius: 18px;
    padding: 22px 18px;
    text-align: center;
    color: #64748b;
    font-size: 14px;
    line-height: 1.6;
  }
  .ccError {
    max-width: 430px;
    margin: 20px auto 0;
    padding: 14px 16px;
    border-radius: 14px;
    background: #fef2f2;
    color: #991b1b;
    border: 1px solid #fecaca;
    font-size: 13px;
  }
  @media (max-width: 480px) {
    .ccPage { padding: 0; }
    .ccShell { border-radius: 0; border-left: 0; border-right: 0; min-height: 100vh; }
    .ccSummary { grid-template-columns: repeat(2, 1fr); }
    .ccTaskCard { grid-template-columns: 40px 40px 1fr; }
    .ccTaskActions { grid-column: 3; align-items: flex-start; flex-direction: row; flex-wrap: wrap; }
  }
`;

const tabIcons: Record<TabKey, string> = {
  today: "📅",
  needs: "✅",
  about: "💛",
  circle: "👥",
  bills: "💳",
};

const avatarColorMap: Record<string, string> = {
  coral: "linear-gradient(135deg, #e8563a, #f07058)",
  sage: "linear-gradient(135deg, #3d7a5e, #4e9b78)",
  sky: "linear-gradient(135deg, #2b6cb8, #3b82f6)",
  gold: "linear-gradient(135deg, #c48a12, #d4a017)",
  plum: "linear-gradient(135deg, #6b3fa0, #8b5cf6)",
};

export default function CareCircleApp() {
  const [tab, setTab] = React.useState<TabKey>("today");
  const [data, setData] = React.useState<LaunchPayload | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [busyTaskId, setBusyTaskId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/carecircle/launch`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || "Failed to load CareCircle");
      setData(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load CareCircle");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function taskAction(taskId: string, action: "claim" | "done") {
    if (!data?.circle?.id || !data?.currentMember?.id) return;
    setBusyTaskId(taskId);
    try {
      const res = await fetch(`${API_BASE}/api/carecircle/circles/${data.circle.id}/tasks/${taskId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: data.currentMember.id }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || `Failed to ${action} task`);
      setData((current) => {
        if (!current) return current;
        return {
          ...current,
          todayTasks: current.todayTasks.map((task) => (task.id === taskId ? body : task)),
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} task`);
    } finally {
      setBusyTaskId(null);
    }
  }

  const todayTasks = data?.todayTasks ?? [];
  const unclaimedCount = todayTasks.filter((task) => !task.assignedTo && task.status === "pending").length;
  const doneCount = todayTasks.filter((task) => task.status === "done").length;
  const visitCount = todayTasks.filter((task) => ["family_visit", "personal_care", "gp_appointment"].includes(task.taskType)).length;

  return (
    <div className="ccPage">
      <SeoHead
        title="CareCircle | Daily care coordination for families"
        description="CareCircle helps families coordinate visits, care tasks, and day-to-day support in one place."
        canonicalUrl="https://www.nursinghomesnearme.com.au/carecircle"
        ogType="website"
        imageUrl="https://www.nursinghomesnearme.com.au/social-preview.png"
      />
      <style>{shellStyles}</style>

      {error ? <div className="ccError">{error}</div> : null}

      <div className="ccShell">
        <div className="ccTopbar">
          <div className="ccTopbarLeft">
            <div className="ccAvatar">👵</div>
            <div>
              <div className="ccTopbarTitle">
                {data ? `${data.circle.firstName}'s Circle` : "CareCircle"}
              </div>
              <div className="ccTopbarSub">
                {data?.circle.suburb && data?.circle.state
                  ? `Safe at home · ${data.circle.suburb}, ${data.circle.state}`
                  : "Daily care coordination for families"}
              </div>
            </div>
          </div>
          <button className="ccGhostBtn" onClick={load}>Refresh</button>
        </div>

        <div className="ccEmergency">
          Emergency contacts · 000 · {data?.circle.gpName || "Family + GP"} · allergies visible on every screen
        </div>

        <div className="ccTabs">
          {(["today", "needs", "about", "circle", "bills"] as TabKey[]).map((key) => (
            <button
              key={key}
              className={`ccTab ${tab === key ? "ccTabActive" : ""}`}
              onClick={() => setTab(key)}
            >
              <span>{tabIcons[key]}</span>
              <span>
                {key === "about" ? "About Nan" : key.charAt(0).toUpperCase() + key.slice(1)}
              </span>
            </button>
          ))}
        </div>

        <div className="ccPane">
          {loading && !data ? (
            <div className="ccEmpty">Loading CareCircle...</div>
          ) : null}

          {!loading && data && tab === "today" ? (
            <>
              <div className="ccDateHeader">
                <div>
                  <div className="ccDateMain">{formatTodayHeader()}</div>
                  <div className="ccDateSub">{todayTasks.length} things happening today</div>
                </div>
                <button className="ccGhostBtn" type="button">Week →</button>
              </div>

              <div className="ccSummary">
                <div className="ccSummaryCell">
                  <div className="ccSummaryNum">{visitCount}</div>
                  <div className="ccSummaryLbl">Visits today</div>
                </div>
                <div className="ccSummaryCell">
                  <div className="ccSummaryNum ccSummaryUrgent">{unclaimedCount}</div>
                  <div className="ccSummaryLbl">Unclaimed tasks</div>
                </div>
                <div className="ccSummaryCell">
                  <div className="ccSummaryNum">{doneCount}</div>
                  <div className="ccSummaryLbl">Done already</div>
                </div>
                <div className="ccSummaryCell">
                  <div className="ccSummaryNum">{data.currentMember?.name?.split(" ")[0] || "You"}</div>
                  <div className="ccSummaryLbl">Current member</div>
                </div>
              </div>

              {(["morning", "afternoon", "evening"] as const).map((period) => {
                const tasks = todayTasks.filter((task) => getPeriod(task.scheduledTime) === period);
                if (!tasks.length) return null;
                return (
                  <div key={period}>
                    <div className="ccSectionLabel">{period}</div>
                    <div className="ccTaskList">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className={[
                            "ccTaskCard",
                            task.priority === "urgent" ? "ccTaskUrgent" : "",
                            task.status === "done" ? "ccTaskDone" : "",
                          ].join(" ")}
                        >
                          <div className="ccTaskTime">{formatTime(task.scheduledTime)}</div>
                          <div className="ccTaskIcon">{task.icon || iconForTask(task.taskType)}</div>
                          <div>
                            <div className="ccTaskTitle">{task.title}</div>
                            {task.description ? <div className="ccTaskDesc">{task.description}</div> : null}
                            <div className="ccTaskWho">
                              {task.assignedName ? task.assignedName : "Unclaimed"}
                            </div>
                          </div>
                          <div className="ccTaskActions">
                            {task.status === "done" ? (
                              <div className="ccDoneMark">✓</div>
                            ) : (
                              <>
                                {!task.assignedTo ? (
                                  <button
                                    className="ccClaimBtn"
                                    disabled={busyTaskId === task.id}
                                    onClick={() => taskAction(task.id, "claim")}
                                  >
                                    {busyTaskId === task.id ? "Claiming..." : "Claim it"}
                                  </button>
                                ) : null}
                                <button
                                  className="ccDoneBtn"
                                  disabled={busyTaskId === task.id}
                                  onClick={() => taskAction(task.id, "done")}
                                >
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
                  {splitCsv(data.circle.medicalConditions).map((item) => (
                    <div className="ccChip" key={item}>{item}</div>
                  ))}
                </div>
              </div>
              <div className="ccCard">
                <div className="ccSectionLabel" style={{ marginTop: 0 }}>Carer notes</div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: "#475569" }}>
                  {data.circle.carerNotes || "Circle notes will appear here."}
                </div>
              </div>
            </>
          ) : null}

          {!loading && data && tab === "circle" ? (
            <div className="ccMemberList">
              {data.members.map((member) => (
                <div className="ccMemberCard" key={member.id}>
                  <div
                    className="ccMemberAvatar"
                    style={{ background: avatarColorMap[member.avatarColour || "coral"] || avatarColorMap.coral }}
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="ccMemberName">{member.name}</div>
                    <div className="ccMemberMeta">
                      {joinBits([member.relationship, member.role])}
                      {member.responsibilities ? <><br />{member.responsibilities}</> : null}
                    </div>
                    {member.isCircleManager ? <div className="ccPill">Circle manager</div> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!loading && data && (tab === "needs" || tab === "bills") ? (
            <div className="ccEmpty">
              {tab === "needs"
                ? "Needs board is the next CareCircle build step. The Week 1 foundation is in place now through the live Today screen."
                : "Bills is queued for the next CareCircle step. Today, circle data, and member data are now running from the real database."}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function splitCsv(value: string | null | undefined) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinBits(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(" · ");
}

function formatTodayHeader() {
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
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

function getPeriod(raw: string | null) {
  if (!raw) return "afternoon";
  const hour = Number(raw.split(":")[0]);
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function iconForTask(taskType: string) {
  switch (taskType) {
    case "meal":
      return "🍽️";
    case "medication":
      return "💊";
    case "personal_care":
      return "🧼";
    case "family_visit":
      return "👨";
    case "gp_appointment":
      return "🩺";
    default:
      return "✅";
  }
}
