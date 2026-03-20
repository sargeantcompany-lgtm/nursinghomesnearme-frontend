
const A = {}; // answers
let signals = [];

function startQuiz() {
  document.getElementById('hero-section').style.display='none';
  goScreen(1);
}
function showHero() {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('hero-section').style.display='block';
  window.scrollTo({top:0,behavior:'smooth'});
}
function goScreen(n) {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const el = n==='results' ? document.getElementById('s-results') : document.getElementById('s'+n);
  if(el){ el.classList.add('active'); window.scrollTo({top:60,behavior:'smooth'}); }
  // dynamic Q7
  if(n===7) buildQ7();
}
function pick(q, val) {
  A['q'+q] = val;
  // highlight
  const s = document.getElementById('s'+q);
  if(s) s.querySelectorAll('.opt').forEach(o=>o.classList.remove('sel'));
  if(event && event.currentTarget) event.currentTarget.classList.add('sel');
  
  setTimeout(()=>{
    // Skip Q7 if not assessed
    if(q===6){ goScreen(7); return; }
    if(q===7){ goScreen(8); return; }
    if(q===8){ buildResults(); goScreen('results'); return; }
    goScreen(q+1);
  }, 220);
}

// Multi-select Q6
function toggleMulti(btn) {
  if(btn.dataset.key==='none'){
    document.querySelectorAll('.mopt').forEach(b=>b.classList.remove('sel'));
    btn.classList.toggle('sel');
  } else {
    document.querySelector('.mopt[data-key="none"]')?.classList.remove('sel');
    btn.classList.toggle('sel');
  }
}
function nextFromMulti() {
  signals = Array.from(document.querySelectorAll('.mopt.sel')).map(b=>b.dataset.key);
  A.signals = signals;
  goScreen(7);
}

// Dynamic Q7
function buildQ7() {
  const status = A.q3;
  const careType = A.q4;
  let title, sub, opts;
  
  if(status==='assessed_waiting' || status==='bad_result') {
    title = 'What level were you approved for?';
    sub = 'Under the new Support at Home system (from 1 Nov 2025), there are 8 classifications. Under the old HCP system there were 4 levels. What did your approval letter say?';
    opts = `
      <div class="insight insight-a" style="margin-bottom:10px;font-size:12px;line-height:1.5"><strong>⚠️ Name change:</strong> Home Care Packages (Levels 1–4) were replaced by Support at Home (Classifications 1–8) on 1 Nov 2025. If your letter says "Level" it is the old system. If it says "Classification" it is the new one. Pick whichever matches your letter — both are still valid.</div>
      <button class="opt" onclick="pick(7,'cl1')"><span class="opt-ico">1️⃣</span><div class="opt-body"><div class="opt-t">Classification 1 — or old HCP Level 1</div><div class="opt-d">New system: $10,731/year ($2,683/qtr) · Old Level 1: ~$10,271/year · Occasional cleaning, transport, meals</div></div></button>
      <button class="opt" onclick="pick(7,'cl2')"><span class="opt-ico">2️⃣</span><div class="opt-body"><div class="opt-t">Classification 2 — or old HCP Level 2</div><div class="opt-d">New system: $16,034/year ($4,009/qtr) · Old Level 2: ~$17,771/year · Regular personal care and domestic help</div></div></button>
      <button class="opt" onclick="pick(7,'cl3')"><span class="opt-ico">3️⃣</span><div class="opt-body"><div class="opt-t">Classification 3 — or old HCP Level 3</div><div class="opt-d">New system: $21,966/year ($5,491/qtr) · Old Level 3: ~$38,819/year · Multiple-times-weekly structured support</div></div></button>
      <button class="opt" onclick="pick(7,'cl4')"><span class="opt-ico">4️⃣</span><div class="opt-body"><div class="opt-t">Classification 4 — or old HCP Level 4</div><div class="opt-d">New system: $29,696/year ($7,424/qtr) · Old Level 4: ~$58,802/year · Near-daily personal and household tasks</div></div></button>
      <button class="opt" onclick="pick(7,'cl5plus')"><span class="opt-ico">⬆️</span><div class="opt-body"><div class="opt-t">Classification 5, 6, 7 or 8 (new system only — no old HCP equivalent)</div><div class="opt-d">$39,697–$78,106/year · Intensive daily or complex clinical care · Only available under new Support at Home system</div></div></button>
      <button class="opt" onclick="pick(7,'residential')"><span class="opt-ico">🏢</span><div class="opt-body"><div class="opt-t">Approved for residential care (nursing home)</div><div class="opt-d">ACAT / Single Assessment has approved permanent residential aged care placement</div></div></button>
      <button class="opt" onclick="pick(7,'not_sure')"><span class="opt-ico">❓</span><div class="opt-body"><div class="opt-t">Not sure — the letter is confusing</div><div class="opt-d">Call My Aged Care on 1800 200 422 and ask them to explain your Notice of Decision letter in plain language</div></div></button>`;
  } else if(status==='has_care_changing') {
    title = 'What type of care are you currently getting?';
    sub = 'This tells us whether you need an upgrade review, a new pathway, or a different provider.';
    opts = `
      <button class="opt" onclick="pick(7,'on_chsp')"><span class="opt-ico">🏡</span><div class="opt-body"><div class="opt-t">CHSP (Commonwealth Home Support)</div><div class="opt-d">Entry-level services — cleaning, meals, transport. Not a full package.</div></div></button>
      <button class="opt" onclick="pick(7,'on_low_class')"><span class="opt-ico">📦</span><div class="opt-body"><div class="opt-t">Home care package — lower level (old Level 1–2, or new Classification 1–3)</div><div class="opt-d">Have a package but needs have increased significantly since assessment</div></div></button>
      <button class="opt" onclick="pick(7,'on_high_class')"><span class="opt-ico">📦</span><div class="opt-body"><div class="opt-t">Home care package — higher level (old Level 3–4, or new Classification 4–8)</div><div class="opt-d">High-level home care but now considering whether a nursing home is needed</div></div></button>
      <button class="opt" onclick="pick(7,'provider_issue')"><span class="opt-ico">😞</span><div class="opt-body"><div class="opt-t">Have care — but the provider isn't delivering</div><div class="opt-d">Services are poor, unreliable, or the provider is blocking a move</div><div class="opt-tag tag-r">Legal right: you can change at any time · providers MUST support this</div></div></button>`;
  } else if(status==='hospital') {
    title = 'How close is the hospital discharge?';
    sub = 'The timing changes which options are still available. Some pathways close permanently once you\'re discharged.';
    opts = `
      <button class="opt danger" onclick="pick(7,'discharge_today')"><span class="opt-ico">🚨</span><div class="opt-body"><div class="opt-t">Today or tomorrow</div><div class="opt-d">Being discharged in the next 24–48 hours</div><div class="opt-tag tag-r">Urgent — TCP and priority pathways must be requested NOW</div></div></button>
      <button class="opt" onclick="pick(7,'discharge_week')"><span class="opt-ico">📅</span><div class="opt-body"><div class="opt-t">Within the next week</div><div class="opt-d">Medically stable, discharge planned for within 7 days</div></div></button>
      <button class="opt" onclick="pick(7,'discharge_unknown')"><span class="opt-ico">❓</span><div class="opt-body"><div class="opt-t">No discharge date set yet</div><div class="opt-d">Still being assessed or discharge date isn't confirmed</div></div></button>`;
  } else {
    title = 'Has a GP been involved yet?';
    sub = 'GP involvement changes how fast the assessment happens. A GP referral is processed faster than self-referral.';
    opts = `
      <button class="opt" onclick="pick(7,'gp_referred')"><span class="opt-ico">👩‍⚕️</span><div class="opt-body"><div class="opt-t">Yes — GP has already referred to My Aged Care</div><div class="opt-d">GP sent a referral or is involved in the process</div><div class="opt-tag tag-g">Faster than self-referral · GP letter carries weight at triage</div></div></button>
      <button class="opt" onclick="pick(7,'gp_not_yet')"><span class="opt-ico">📋</span><div class="opt-body"><div class="opt-t">GP knows about it but hasn't done a referral</div><div class="opt-d">GP is aware of the care need but referral hasn't been submitted</div></div></button>
      <button class="opt" onclick="pick(7,'self_referred')"><span class="opt-ico">📞</span><div class="opt-body"><div class="opt-t">Self-referred — called My Aged Care directly</div><div class="opt-d">Applied without a GP referral</div></div></button>
      <button class="opt" onclick="pick(7,'not_involved')"><span class="opt-ico">❌</span><div class="opt-body"><div class="opt-t">GP not involved at all yet</div><div class="opt-d">Haven't spoken to the GP about aged care yet</div></div></button>`;
  }
  
  document.getElementById('q7-title').textContent = title;
  document.getElementById('q7-sub').innerHTML = sub;
  document.getElementById('q7-opts').innerHTML = opts;
}

// ════ BUILD RESULTS ════
function buildResults() {
  const who = A.q1 || 'family';
  const state = A.q2 || 'NSW';
  const status = A.q3 || 'not_started';
  const care = A.q4 || 'stay_home';
  const urgency = A.q5 || 'medium';
  const sigs = A.signals || [];
  const classification = A.q7;
  const finance = A.q8 || 'not_sure';

  const isCrisis = status==='crisis' || urgency==='critical';
  const isHospital = status==='hospital';
  const isBadResult = status==='bad_result';
  const isWaitingFund = status==='assessed_waiting';
  const hasChangingNeeds = status==='has_care_changing';
  const isNH = care==='nursing_home';
  const isTCP = care==='tcp';

  // State wait data
  const W = {
    NSW:{assessment:'21–45 days',l4:'12–15 months',nh:'68–180 days',crisis:'3–5 days priority'},
    VIC:{assessment:'21–50 days',l4:'12–15 months',nh:'68–200 days',crisis:'3–5 days priority'},
    QLD:{assessment:'21–60 days',l4:'12–15 months',nh:'68–180 days',crisis:'3–5 days priority'},
    WA: {assessment:'17–35 days',l4:'10–14 months',nh:'55–140 days',crisis:'2–4 days priority'},
    SA: {assessment:'21–40 days',l4:'11–15 months',nh:'60–140 days',crisis:'3–5 days priority'},
    TAS:{assessment:'14–28 days',l4:'9–13 months', nh:'45–100 days',crisis:'2–4 days priority'},
    ACT:{assessment:'18–38 days',l4:'11–14 months',nh:'60–120 days',crisis:'2–4 days priority'},
    NT: {assessment:'25–70 days',l4:'12–18 months',nh:'90–220 days',crisis:'4–7 days priority'},
  };
  const w = W[state];

  // Signal score for priority
  const priorityTriggers = sigs.filter(s=>['fall','hosp','carer','dementia'].includes(s));
  const hasPriority = priorityTriggers.length >= 1 || urgency==='critical' || urgency==='high';

  // Classification data
  const CLASS_DATA = {
    cl1:{level:'Classification 1',annual:10731,quarterly:2683,desc:'Occasional help: cleaning, transport, meals'},
    cl2:{level:'Classification 2',annual:16034,quarterly:4009,desc:'Regular personal care and domestic help'},
    cl3:{level:'Classification 3',annual:21966,quarterly:5491,desc:'Multiple-times-weekly structured support'},
    cl4:{level:'Classification 4',annual:29696,quarterly:7424,desc:'Near-daily personal and household tasks'},
    cl5plus:{level:'Classification 5–8',annual:39697,quarterly:9924,desc:'Intensive daily or complex clinical care'},
  };
  const cl = CLASS_DATA[classification] || null;

  let html = '';

  // ── RESULT BANNER ──
  if(isCrisis) {
    html += `<div class="result-banner rb-urgent"><div class="rb-banner-ico">🚨</div><div class="r-pill">⚡ URGENT — Act today</div><div class="r-title">Crisis pathways are available. Most families don't know they exist.</div><div class="r-desc">When there's a safety risk or imminent discharge, the system has priority access — but only if you use the right language when you call. Here's exactly what to say and do.</div></div>`;
  } else if(isHospital) {
    html += `<div class="result-banner rb-hospital"><div class="rb-banner-ico">🏥</div><div class="r-pill">🏥 Hospital pathway</div><div class="r-title">Being in hospital right now is actually the fastest route to care</div><div class="r-desc">Hospital-initiated referrals get priority. The Transition Care Program — up to 12 weeks of full care — is only available right now, from this admission. Once discharged, that option closes permanently.</div></div>`;
  } else if(isBadResult) {
    html += `<div class="result-banner rb-bad"><div class="rb-banner-ico">⚖️</div><div class="r-pill">⚖️ Challenge the result</div><div class="r-title">You have 28 days to challenge — and the odds are better than you think</div><div class="r-desc">The IAT algorithm has a documented failure rate. 414+ formal reviews were lodged in 2025 alone. Advocacy calls surged 50%. Here's how to build a challenge that wins.</div></div>`;
  } else if(isWaitingFund && cl) {
    html += `<div class="result-banner rb-home"><div class="rb-banner-ico">⏳</div><div class="r-pill">📬 Approved — now waiting</div><div class="r-title">You're approved for ${cl.level} ($${cl.annual.toLocaleString()}/year). Here's how to get care faster.</div><div class="r-desc">Your approval date determines your queue position. There are 4 things you can do right now that most families don't know about — starting with accepting a lower level immediately to bridge the gap.</div></div>`;
  } else if(isNH) {
    html += `<div class="result-banner rb-nh"><div class="rb-banner-ico">🏢</div><div class="r-pill">🏢 Nursing home pathway</div><div class="r-title">Your route to residential care in ${state} — and what to do while you wait</div><div class="r-desc">Median wait from ACAT approval to entry in ${state}: ${w.nh}. But 10% of people wait over 253 days. There are specific strategies that significantly speed this up — most families skip all of them.</div></div>`;
  } else if(hasChangingNeeds) {
    html += `<div class="result-banner rb-home"><div class="rb-banner-ico">🔄</div><div class="r-pill">🔄 Needs have changed</div><div class="r-title">You don't have to start again — you just need a Support Plan Review</div><div class="r-desc">A Support Plan Review can upgrade your classification, unlock new funding pathways, or free you from a provider that's not delivering. You have legal rights here that most families don't know they have.</div></div>`;
  } else {
    html += `<div class="result-banner rb-plan"><div class="rb-banner-ico">🗺️</div><div class="r-pill">🗺️ Your action plan</div><div class="r-title">Your ACAT pathway in ${state} — every step, every shortcut, every number</div><div class="r-desc">Assessment wait in ${state}: ${w.assessment}. Here's the specific sequence to follow, what to say, and how to avoid the mistakes that add months to the process.</div></div>`;
  }

  // ── WAIT TIME SNAPSHOT ──
  // Home care wait label — dynamic by level selected
  const homeCareWaitLabel = cl ? `Approval → ${cl.level} funding` : 'Approval → home care (Class 4 benchmark)';
  const homeCareWaitNote = cl ? '' : `<div style="font-size:10px;color:var(--light);margin-top:3px">Class 4 shown as worst-case — lower levels available sooner</div>`;

  if(!isCrisis) {
    html += `<div class="summary-strip">
      <div class="s-box ${urgency==='critical'||urgency==='high'?'warn':''}">
        <div class="s-num">${hasPriority ? w.crisis : w.assessment}</div>
        <div class="s-lbl">Referral → Assessment<br>${hasPriority?'(priority triage)':'(standard)'} in ${state}</div>
      </div>
      ${care==='stay_home'||care==='not_sure'?`<div class="s-box hot">
        <div class="s-num">${cl?'Waiting now':w.l4}</div>
        <div class="s-lbl">${homeCareWaitLabel} in ${state}</div>
        ${homeCareWaitNote}
      </div>`:''}
      ${isNH||care==='not_sure'?`<div class="s-box warn">
        <div class="s-num">${w.nh}</div>
        <div class="s-lbl">ACAT Approval → Nursing home entry in ${state}</div>
      </div>`:''}
      ${cl?`<div class="s-box good">
        <div class="s-num">$${cl.quarterly.toLocaleString()}/qtr</div>
        <div class="s-lbl">Your approved quarterly budget<br>(90% usable after care management)</div>
      </div>`:''}
    </div>`;
  }

  // ── ALL STATE WAIT TIMES STRIP ──
  if(!isCrisis) {
    const allStates = [
      {code:'NSW',a:'21–45d',l4:'12–15mo',nh:'68–180d',sev:'hot'},
      {code:'VIC',a:'21–50d',l4:'12–15mo',nh:'68–200d',sev:'hot'},
      {code:'QLD',a:'21–60d',l4:'12–15mo',nh:'68–180d',sev:'hot'},
      {code:'WA', a:'17–35d',l4:'10–14mo',nh:'55–140d',sev:'warn'},
      {code:'SA', a:'21–40d',l4:'11–15mo',nh:'60–140d',sev:'warn'},
      {code:'TAS',a:'14–28d',l4:'9–13mo', nh:'45–100d',sev:''},
      {code:'ACT',a:'18–38d',l4:'11–14mo',nh:'60–120d',sev:'warn'},
      {code:'NT', a:'25–70d',l4:'12–18mo',nh:'90–220d',sev:'hot'},
    ];
    html += `<div class="sec"><div class="sec-h"><span class="sec-h-ico">📍</span><span class="sec-h-t">Wait times across all states — how ${state} compares</span></div>
    <div style="overflow-x:auto">
    <table class="fund-table" style="min-width:520px">
      <tr>
        <th>State</th>
        <th>Referral → Assessment</th>
        <th>Approval → Home Care (Class 4)</th>
        <th>Approval → Nursing Home</th>
      </tr>
      ${allStates.map(s=>`<tr ${s.code===state?'class="highlight"':''}>
        <td><strong>${s.code}</strong></td>
        <td ${s.sev==='hot'?'style="color:var(--red);font-weight:700"':s.sev==='warn'?'style="color:var(--amber);font-weight:700"':''}>${s.a}</td>
        <td style="color:var(--red);font-weight:600">${s.l4}</td>
        <td>${s.nh}</td>
      </tr>`).join('')}
    </table>
    </div>
    <p style="font-size:11px;color:var(--light);margin-top:8px"><strong>Highlighted = your state (${state}).</strong> Home care wait shown for Classification 4 as benchmark — lower classifications (1–3) typically become available sooner. National published data + community reports. State breakdowns are estimated — the government does not publish state-level wait times. <a href="#" style="color:var(--teal)">Submit your real wait time →</a></p>
    </div>`;
  }

  // ══ CRISIS PATHWAY ══
  if(isCrisis) {
    html += `<div class="sec"><div class="sec-h"><span class="sec-h-ico">🚨</span><span class="sec-h-t">Do these in order — today</span></div>
    <div class="steps">
      <div class="step critical">
        <div class="step-num sn-r">1</div>
        <div class="step-body">
          <div class="step-t">Call My Aged Care right now — use these exact words</div>
          <div class="step-d">1800 200 422 · Mon–Fri 8am–8pm · Sat 10am–2pm. The words "urgent" and "safety risk" trigger a different triage process. Without them, you're in the standard queue.</div>
          <div class="script"><div class="script-l">📞 Say exactly this</div><div class="script-t">"I need to register an <strong>urgent assessment request</strong>. [Name] is at immediate risk of harm — they have had [fall / are being discharged from hospital today / their carer can no longer provide any care]. I am requesting <strong>priority triage and an assessment within this week</strong>. I also want to note that if they cannot be assessed urgently, I will be contacting OPAN for support."</div></div>
          <div class="insight insight-r"><strong>Why mention OPAN?</strong> OPAN (Older Persons Advocacy Network) is the independent government-funded advocate. Mentioning them — not threateningly, just factually — signals you know your rights. It consistently results in faster responses.</div>
        </div>
      </div>
      <div class="step critical">
        <div class="step-num sn-r">2</div>
        <div class="step-body">
          <div class="step-t">If in hospital — get the social worker to request TCP immediately</div>
          <div class="step-d">The <strong>Transition Care Program (TCP)</strong> provides up to 12 weeks of full care — nursing, physio, personal care — at home or in a facility for about <strong>$65.55/day</strong> (government subsidised). This is the single best bridge pathway from hospital. <strong>It is only available while the person is still admitted.</strong> Once discharged, this option is gone permanently. Ask the hospital social worker for a "TCP referral" today.</div>
          <div class="insight insight-a"><strong>Fee hardship?</strong> TCP has a hardship waiver. If $65.55/day is unaffordable, the social worker can apply for a fee reduction. You don't have to pay full price.</div>
        </div>
      </div>
      ${sigs.includes('carer')?`<div class="step critical"><div class="step-num sn-r">3</div><div class="step-body"><div class="step-t">Carer breakdown is a specific legal trigger — use this language</div><div class="step-d">The aged care system has specific provisions when a carer states they can no longer provide care. This is not just a sob story — it is a legal mechanism. When you call My Aged Care, say: "The current carer <strong>is no longer able to provide care</strong> as of [today's date]. This constitutes a carer breakdown and I am requesting emergency CHSP access as a bridge."</div><div class="script"><div class="script-l">📞 Additional script for carer breakdown</div><div class="script-t">"I also want to note that the primary carer has advised they can <strong>no longer continue providing care</strong> and they are requesting support as a carer in their own right. This is a dual emergency — for the care recipient and the carer."</div></div></div></div>`:''}
      <div class="step warn">
        <div class="step-num sn-a">${sigs.includes('carer')?4:3}</div>
        <div class="step-body">
          <div class="step-t">Request emergency CHSP access for today or tomorrow</div>
          <div class="step-d">CHSP (Commonwealth Home Support Programme) has an emergency access pathway. <strong>No full assessment is required</strong> for urgent safety needs. Meals, personal care, safety checks and basic home support can be deployed within 24–48 hours. Call My Aged Care and ask specifically: "I am requesting emergency CHSP access — I do not have time for a full assessment."</div>
        </div>
      </div>
      <div class="step">
        <div class="step-num sn-t">${sigs.includes('carer')?5:4}</div>
        <div class="step-body">
          <div class="step-t">Private bridging care — if nothing else works tonight</div>
          <div class="step-d">Private home care can start <strong>the same day</strong>. This does NOT affect your queue position for government care. Typical costs: support workers $45–70/hr, nursing $100–200/hr, meal services $12–20/meal. Use it as a bridge — not a permanent solution. Government care catches up.</div>
          <div class="insight insight-t"><strong>Providers to call:</strong> Search "emergency home care [your suburb]" or call a national provider like Home Instead, Baptistcare, or Uniting Care. Most have same-day capacity. Tell them it's urgent.</div>
        </div>
      </div>
    </div></div>`;
  }

  // ══ HOSPITAL PATHWAY ══
  if(isHospital) {
    const isTodayDischarge = classification==='discharge_today';
    html += `<div class="sec"><div class="sec-h"><span class="sec-h-ico">🏥</span><span class="sec-h-t">Hospital discharge pathways — ranked by preference</span></div>
    ${isTodayDischarge?`<div class="insight insight-r" style="margin-bottom:16px"><strong>⚡ Discharge today or tomorrow:</strong> Go to Step 1 immediately. TCP closes the moment the patient is discharged. Do not wait.</div>`:''}
    <div class="steps">
      <div class="step critical">
        <div class="step-num sn-r">1</div>
        <div class="step-body">
          <div class="step-t">Transition Care Program (TCP) — the best option, and it expires when they leave</div>
          <div class="step-d">TCP provides up to <strong>12 weeks</strong> of intensive care — nursing, physiotherapy, occupational therapy, personal care — either at home or in a residential facility. Cost: approximately <strong>$65.55/day</strong> (fee waiver available for hardship). Home-based TCP starts within <strong>48 hours</strong> of discharge. Residential TCP starts within <strong>24 hours</strong>.</div>
          <div class="script"><div class="script-l">📞 What to say to the hospital social worker</div><div class="script-t">"I want to request a TCP referral for [Name] before they are discharged. I understand TCP is only available from this admission and that the referral must be made while they are still admitted. Can you action this today?"</div></div>
          <div class="insight insight-a"><strong>22,900 TCP admissions in 2024–25.</strong> This is a well-used, well-funded program — not a workaround. It gives families 12 weeks to sort out permanent care without the pressure of an unsafe discharge.</div>
        </div>
      </div>
      <div class="step">
        <div class="step-num sn-t">2</div>
        <div class="step-body">
          <div class="step-t">Get a hospital-based ACAT assessment now — not community</div>
          <div class="step-d">A hospital ACAT assessment can happen <strong>while still admitted</strong> — same week in most cases. Community ACAT waits are ${w.assessment} in ${state}. A hospital social worker initiates this on your behalf. It opens ALL pathways including permanent home care, residential care and respite. Ask specifically for an "inpatient ACAT assessment."</div>
          <div class="insight insight-t"><strong>This is the key difference:</strong> Hospital ACAT = typically same week. Community ACAT = ${w.assessment}. Being in hospital right now is a meaningful shortcut if you use it.</div>
        </div>
      </div>
      <div class="step">
        <div class="step-num sn-t">3</div>
        <div class="step-body">
          <div class="step-t">Short-Term Restorative Care (STRC) — if TCP isn't available</div>
          <div class="step-d">Up to 8 weeks of restorative care — allied health, physiotherapy, personal care. Does NOT require hospitalisation so it can be accessed after discharge too. Government-funded. 11,490 admissions nationally in 2024–25. Ask My Aged Care (1800 200 422) specifically for an "STRC referral."</div>
        </div>
      </div>
      <div class="step">
        <div class="step-num sn-t">4</div>
        <div class="step-body">
          <div class="step-t">Residential Respite — up to 63 days as a bridge</div>
          <div class="step-d">If the person can't safely go home, residential respite in a nursing facility (up to 63 days/year, government subsidised, ACAT required) buys time to sort permanent arrangements. It's also an opportunity to <strong>trial a facility before committing to permanent placement</strong>. Many people move from respite to permanent at the same facility.</div>
        </div>
      </div>
    </div></div>`;
  }

  // ══ BAD ASSESSMENT RESULT ══
  if(isBadResult) {
    html += `<div class="sec"><div class="sec-h"><span class="sec-h-ico">⚖️</span><span class="sec-h-t">How to challenge your IAT result — step by step</span></div>
    <div class="insight insight-r" style="margin-bottom:16px"><strong>⏰ You have exactly 28 days from the date on your letter.</strong> After 28 days the formal review window closes. If you've already passed 28 days, there is still an informal pathway — call OPAN (1800 700 600) immediately.</div>
    <div class="steps">
      <div class="step critical">
        <div class="step-num sn-r">1</div>
        <div class="step-body">
          <div class="step-t">Document the worst days — not average days — before you write a word</div>
          <div class="step-d">The most common reason challenges fail: people describe an average day. The IAT scores on specific functional tasks. You need to write down the <strong>hardest day in the last fortnight</strong> — every task the person cannot do or cannot do safely without help. Be brutally specific.</div>
          <div class="insight insight-a">
            <strong>High-scoring examples for the IAT:</strong><br>
            ✓ "Cannot lift arms above shoulder height to wash or dry hair"<br>
            ✓ "Cannot safely transfer from bed to standing without assistance — has fallen attempting this twice in the last month"<br>
            ✓ "Cannot manage 8 different daily medications — has taken wrong doses on at least 4 occasions in the last fortnight"<br>
            ✓ "Wakes 3 times per night requiring toileting assistance — carer has had 4 weeks of broken sleep"<br>
            ✗ "Struggles with personal care" — too vague, scores low
          </div>
        </div>
      </div>
      <div class="step critical">
        <div class="step-num sn-r">2</div>
        <div class="step-body">
          <div class="step-t">Write your formal review request today — address to the Secretary</div>
          <div class="step-d">Send to: The Secretary, Department of Health and Aged Care. Via My Aged Care (1800 200 422) or in writing. Include: date of assessment, outcome received, and a specific list of tasks they cannot do. This is a formal legal process.</div>
          <div class="script"><div class="script-l">📝 Use this template</div><div class="script-t">"I formally request a review of [Full Name]'s assessment conducted on [date]. The outcome of [classification/level] does not reflect their actual daily care needs.<br><br>They are unable to:<br>1. [Specific task — be concrete]<br>2. [Specific task]<br>3. [Specific task]<br><br>I am attaching a supporting letter from their GP, Dr [Name], dated [date], which confirms these limitations. I request this be treated as urgent given [safety risk/carer situation]."</div></div>
        </div>
      </div>
      <div class="step warn">
        <div class="step-num sn-a">3</div>
        <div class="step-body">
          <div class="step-t">Get a GP letter — with the right content</div>
          <div class="step-d">Most GP letters are too vague to help. Ask specifically: "Can you write a letter for my aged care assessment review that lists my specific functional limitations, diagnoses, and your clinical recommendation for care level?" The letter should include: <strong>specific diagnoses, specific tasks the patient cannot perform, frequency of GP visits, and a recommended care classification.</strong></div>
        </div>
      </div>
      <div class="step">
        <div class="step-num sn-t">4</div>
        <div class="step-body">
          <div class="step-t">Attach specialist and allied health reports if available</div>
          <div class="step-d">Geriatrician reports, occupational therapy assessments, physiotherapy reports, hospital discharge summaries — all help. Any document from a health professional that details functional limitations will strengthen the review.</div>
        </div>
      </div>
      <div class="step">
        <div class="step-num sn-t">5</div>
        <div class="step-body">
          <div class="step-t">If the review fails — Administrative Review Tribunal</div>
          <div class="step-d">If you disagree with the departmental review, you can escalate to the Administrative Review Tribunal. This is a more formal legal process. <strong>OPAN (1800 700 600) can support you through this at no cost</strong> — including representing you. Don't attempt the Tribunal without their support.</div>
        </div>
      </div>
    </div></div>`;
  }

  // ══ WAITING FOR FUNDING ══
  if(isWaitingFund && !isBadResult) {
    html += `<div class="sec"><div class="sec-h"><span class="sec-h-ico">📬</span><span class="sec-h-t">You're approved — now get care faster</span></div>
    <div class="steps">
      <div class="step critical">
        <div class="step-num sn-r">1</div>
        <div class="step-body">
          <div class="step-t">Accept a lower classification now — don't wait for the one you were approved for</div>
          <div class="step-d">This is the single most important thing most families don't do. If you were approved for ${cl?cl.level:'a higher level'} but a lower level is available sooner — <strong>take it immediately.</strong> Your approval date for the higher level stays exactly the same — it still determines your queue position. You receive support now and step up automatically when the higher level is assigned.</div>
          <div class="insight insight-r"><strong>Refusing a lower level means waiting with nothing.</strong> You're not giving up your higher level — you're bridging the gap while you wait for it.</div>
          <div class="script"><div class="script-l">📞 Call My Aged Care and say</div><div class="script-t">"I have been approved for [classification] and I am currently on the priority system waitlist. I would like to formally accept any available lower classification as an interim measure while I wait for my assigned level to become available. I understand this does not affect my queue position for ${cl?cl.level:'my approved level'}."</div></div>
        </div>
      </div>
      <div class="step warn">
        <div class="step-num sn-a">2</div>
        <div class="step-body">
          <div class="step-t">Ask about 60% interim funding — many families don't know this exists</div>
          <div class="step-d">When wait times are longer than expected, the government can release <strong>60% of your approved classification budget</strong> as interim funding. ${cl?`That would be <strong>$${Math.round(cl.quarterly*0.6).toLocaleString()}/quarter</strong> now (60% of your $${cl.quarterly.toLocaleString()} quarterly budget), allowing you to start some services immediately.`:''} Ask specifically about "interim AT-HM funding" and "interim Support at Home funding."</div>
          <div class="script"><div class="script-l">📞 Ask My Aged Care</div><div class="script-t">"I am on the Priority System waitlist for ${cl?cl.level:'Support at Home'} in ${state}. The wait is expected to exceed [X months]. Can I access interim funding at 60% of my classification budget in the meantime? I would like to find a provider and start some services while I wait."</div></div>
        </div>
      </div>
      <div class="step">
        <div class="step-num sn-t">3</div>
        <div class="step-body">
          <div class="step-t">Access CHSP for immediate bridging support</div>
          <div class="step-d">CHSP (Commonwealth Home Support) provides entry-level services — cleaning, transport, meals, social support — while you wait for your Support at Home classification. You can access both simultaneously. Apply via My Aged Care (1800 200 422).</div>
        </div>
      </div>
      <div class="step">
        <div class="step-num sn-t">4</div>
        <div class="step-body">
          <div class="step-t">If health has changed since assessment — call immediately for a Support Plan Review</div>
          <div class="step-d">Falls, hospitalisation, cognitive decline, carer breakdown — any significant change in health since your assessment can trigger a Support Plan Review. This can upgrade your priority category, shortening the wait. <strong>You don't have to wait for the annual review.</strong> Call My Aged Care and ask for an urgent Support Plan Review.</div>
          ${sigs.some(s=>['fall','hosp','carer'].includes(s))?`<div class="insight insight-r"><strong>Based on your answers, you already have grounds for a priority review right now.</strong> ${sigs.includes('fall')?'Recent fall — report this today.':''} ${sigs.includes('hosp')?'Recent hospitalisation — this is a major priority trigger.':''} ${sigs.includes('carer')?'Carer breakdown — specific legal language to use when calling.':''}</div>`:''}
        </div>
      </div>
    </div></div>`;
  }

  // ══ NURSING HOME PATHWAY ══
  if(isNH && !isCrisis && !isHospital) {
    html += `<div class="sec"><div class="sec-h"><span class="sec-h-ico">🏢</span><span class="sec-h-t">Nursing home pathway — the steps most families miss</span></div>
    <div class="steps">
      <div class="step critical">
        <div class="step-num sn-r">1</div>
        <div class="step-body">
          <div class="step-t">Apply to multiple nursing homes right now — not one at a time</div>
          <div class="step-d">The single biggest mistake families make: applying to one or two homes and waiting. There is <strong>no limit on applications.</strong> Apply to every facility within your preferred area simultaneously. Popular facilities have waitlists of 12–24 months. Your median wait from ACAT approval in ${state} is ${w.nh} — and 10% of people wait over 253 days.</div>
          <div class="insight insight-a"><strong>Strategy:</strong> Apply broadly to 8–12 homes across a wider area. When the first offer comes, visit. Accept if it's acceptable, even if it's not your first choice. A real bed beats the ideal bed that's 18 months away.</div>
        </div>
      </div>
      <div class="step warn">
        <div class="step-num sn-a">2</div>
        <div class="step-body">
          <div class="step-t">Do the Services Australia means test NOW — not when an offer comes</div>
          <div class="step-d">The income and assets assessment through Services Australia takes <strong>2–4 weeks</strong> and must be complete before you can accept a bed. If you wait until you get an offer, you'll miss it while you wait for the means test. Start it immediately in parallel. Call <strong>Services Australia 1800 227 475</strong> or apply via myGov.</div>
          <div class="insight insight-t"><strong>Fully supported residents:</strong> If the person receives a full Age Pension and has modest assets, they may be a "fully supported resident" — the government covers accommodation costs entirely. This needs to be confirmed via the means test.</div>
        </div>
      </div>
      <div class="step">
        <div class="step-num sn-t">3</div>
        <div class="step-body">
          <div class="step-t">Understand the accommodation costs before you visit — RAD vs DAP</div>
          <div class="step-d">Every nursing home has a <strong>Refundable Accommodation Deposit (RAD)</strong> — a lump sum fully refunded when you leave — or a <strong>Daily Accommodation Payment (DAP)</strong> — daily interest charged instead. You can mix both. The maximum accommodation price is published on the government's My Aged Care website for every facility.${finance==='pension'?' As a pensioner, you may be a fully supported resident — government covers accommodation. Confirm via the means test.':''} ${finance==='self_funded'?' As a self-funded retiree, you will pay accommodation costs. RADs in most metro areas range $250,000–$600,000+. DAP equivalent runs $30–$65/day.':''}</div>
        </div>
      </div>
      <div class="step">
        <div class="step-num sn-t">4</div>
        <div class="step-body">
          <div class="step-t">Use residential respite as a bridge — and a trial</div>
          <div class="step-d">While waiting for permanent placement, government-subsidised residential respite (up to 63 days/year) gets the person into a facility. It also lets you trial the facility before committing. Many people transition from respite directly to permanent residency at the same home — which often fast-tracks the permanent placement.</div>
        </div>
      </div>
    </div></div>`;
  }

  // ══ GENERAL / NOT STARTED ══
  if(!isCrisis && !isHospital && !isBadResult && !isWaitingFund && !hasChangingNeeds && !isNH) {
    html += `<div class="sec"><div class="sec-h"><span class="sec-h-ico">🚀</span><span class="sec-h-t">Getting started — the fastest route through the system</span></div>
    <div class="steps">
      <div class="step critical">
        <div class="step-num sn-r">1</div>
        <div class="step-body">
          <div class="step-t">Register today — your approval date determines your queue position</div>
          <div class="step-d">The national waitlist has over 130,000 people. Your queue position is determined by your <strong>ACAT approval date</strong> — not the day you start receiving services. Every day you delay is a day added to your total wait. Call My Aged Care on <strong>1800 200 422</strong> or apply at myagedcare.gov.au. It takes 15–20 minutes. You're not committing to anything.</div>
        </div>
      </div>
      <div class="step warn">
        <div class="step-num sn-a">2</div>
        <div class="step-body">
          <div class="step-t">${A.q7==='gp_not_yet'||A.q7==='not_involved'?'Get a GP referral before you apply — it\'s faster':'Your GP referral helps — make sure it has the right content'}</div>
          <div class="step-d">${A.q7==='not_involved'?'A GP referral is processed faster than self-referral and carries more weight at triage. Go to the GP first. Ask them to write a referral letter for My Aged Care listing specific functional limitations and urgency factors. The words "at risk of hospitalisation" or "carer at breaking point" are the triage triggers.':A.q7==='gp_not_yet'?'Ask the GP to write a formal referral letter to My Aged Care — not just verbal advice. The letter should list specific functional limitations, diagnoses, and urgency. The words "at risk of hospitalisation" are a triage trigger.':'Good — a GP referral is in place. Make sure the letter uses specific language about functional limitations and includes urgency indicators if applicable.'}</div>
          <div class="insight insight-t"><strong>What the GP letter should say:</strong> Specific diagnoses · Specific daily tasks the patient cannot do · Any recent falls, hospitalisation, or safety incidents · The GP's recommendation for care level · If applicable: "at risk of hospitalisation without urgent support"</div>
        </div>
      </div>
      <div class="step">
        <div class="step-num sn-t">3</div>
        <div class="step-body">
          <div class="step-t">At the assessment — show the worst day, not the best</div>
          <div class="step-d">The most common and most costly mistake. The IAT algorithm scores what the assessor enters. Many older Australians are proud and minimise their difficulties. Have a family member present who can add what the person is too proud to mention. Describe the hardest day — not the manageable one.</div>
          ${sigs.includes('incontinence')?`<div class="insight insight-a"><strong>Continence issues score very highly in the IAT.</strong> Make sure the assessor knows about nighttime toileting needs, frequency, and any incidents. Don't be embarrassed — this directly affects the care classification.</div>`:''}
          ${sigs.includes('medication')?`<div class="insight insight-a"><strong>Medication management scores highly.</strong> Bring a list of all medications and be specific about any missed or incorrect doses. Ask: "Can you note that the patient has difficulty managing their medication regime independently?"</div>`:''}
          ${sigs.includes('dementia')?`<div class="insight insight-r"><strong>For dementia:</strong> The IAT can underestimate dementia-related care needs. Bring a written account of recent behavioural incidents, safety issues, and overnight needs. Ask for a dementia specialist assessor if possible.</div>`:''}
        </div>
      </div>
    </div></div>`;
  }

  // ══ CHANGING NEEDS ══
  if(hasChangingNeeds) {
    const isProviderIssue = classification==='provider_issue';
    html += `<div class="sec"><div class="sec-h"><span class="sec-h-ico">🔄</span><span class="sec-h-t">How to upgrade or change your care</span></div>
    <div class="steps">
      ${isProviderIssue?`
      <div class="step critical">
        <div class="step-num sn-r">1</div>
        <div class="step-body">
          <div class="step-t">You have the legal right to change providers at any time — they cannot block it</div>
          <div class="step-d">Under the Aged Care Rules 2025, providers <strong>must support you to change providers.</strong> They cannot add you to a waitlist, charge exit fees, or make it difficult. Your funding follows you — it doesn't stay with the old provider.</div>
          <div class="script"><div class="script-l">📞 Say this to your current provider</div><div class="script-t">"I am giving notice that I wish to change to a new provider. Under the Aged Care Rules 2025, you are required to support this transition. I expect you to provide a transition plan and transfer my funding within [X weeks]. If you are unable to do this, I will be escalating to My Aged Care and ACQSC."</div></div>
          <div class="insight insight-r"><strong>If they stall or refuse:</strong> Call ACQSC (Aged Care Quality and Safety Commission) on 1800 951 822. File a complaint. This is a legal obligation, not a courtesy.</div>
        </div>
      </div>`:''}
      <div class="step ${isProviderIssue?'':'critical'}">
        <div class="step-num ${isProviderIssue?'sn-t':'sn-r'}">${isProviderIssue?2:1}</div>
        <div class="step-body">
          <div class="step-t">Request a Support Plan Review — you don't have to wait for the annual review</div>
          <div class="step-d">A Support Plan Review can be requested at any time when needs change. It can: upgrade your classification (and therefore your annual budget), unlock new pathways like the Restorative Care Pathway ($6,000 extra for physio/allied health) or the Assistive Technology scheme, or update your services without a full reassessment.</div>
          <div class="script"><div class="script-l">📞 Call My Aged Care (1800 200 422)</div><div class="script-t">"I am requesting an urgent Support Plan Review for [Name]. Their care needs have changed significantly since their last assessment. Specifically: [list what has changed — falls, hospitalisation, carer situation]. I believe they require a higher classification and possibly the Restorative Care Pathway."</div></div>
        </div>
      </div>
      <div class="step">
        <div class="step-num sn-t">${isProviderIssue?3:2}</div>
        <div class="step-body">
          <div class="step-t">The Restorative Care Pathway — most people don't know it exists</div>
          <div class="step-d">If needs have changed after an illness, fall, or major health event, the Restorative Care Pathway provides <strong>$6,000 extra</strong> (up to $12,000 if needed) for allied health — physiotherapy, occupational therapy, speech therapy — for up to 16 weeks. This is on top of your usual classification budget. It can be used twice per year. Request it specifically in your Support Plan Review.</div>
        </div>
      </div>
    </div></div>`;
  }

  // ══ FUNDING TABLE (if relevant) ══
  if(care==='stay_home' || care==='not_sure') {
    html += `<div class="sec"><div class="sec-h"><span class="sec-h-ico">💰</span><span class="sec-h-t">Home care funding — all levels explained</span></div>

    <div class="insight insight-a" style="margin-bottom:14px">
      <strong>Name change — 1 November 2025:</strong> Home Care Packages (HCP) were replaced by <strong>Support at Home</strong>. If someone says they have a "Level 3 package" — that is the old name. The new system has <strong>8 classifications</strong> instead of 4. People who were already on an HCP stay on a Transitioned HCP Level (1–4) until reassessed. Anyone assessed from 1 Nov 2025 onwards gets one of the 8 new classifications.
    </div>

    <p style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:8px">NEW — Support at Home (assessed from 1 November 2025)</p>
    <div class="fund-table-wrap" style="margin-bottom:16px">
    <table class="fund-table">
      <tr><th>Classification</th><th>Annual Budget</th><th>Quarterly</th><th>Usable/qtr*</th></tr>
      <tr><td>1 — Occasional help</td><td>$10,731</td><td>$2,683</td><td>$2,415</td></tr>
      <tr><td>2 — Regular help</td><td>$16,034</td><td>$4,009</td><td>$3,608</td></tr>
      <tr><td>3 — Multiple times weekly</td><td>$21,966</td><td>$5,491</td><td>$4,942</td></tr>
      <tr><td>4 — Near-daily support</td><td>$29,696</td><td>$7,424</td><td>$6,682</td></tr>
      <tr><td>5 — Daily intensive</td><td>$39,697</td><td>$9,924</td><td>$8,932</td></tr>
      <tr><td>6 — Complex daily care</td><td>$48,114</td><td>$12,029</td><td>$10,826</td></tr>
      <tr><td>7 — High / complex needs</td><td>$58,148</td><td>$14,537</td><td>$13,083</td></tr>
      <tr><td>8 — Complex / palliative</td><td>$78,106</td><td>$19,527</td><td>$17,574</td></tr>
    </table>
    </div>

    <p style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:8px">OLD — Transitioned Home Care Package levels (approved before 1 Nov 2025)</p>
    <div class="fund-table-wrap" style="margin-bottom:4px">
    <table class="fund-table">
      <tr><th>Old HCP Level</th><th>Annual Budget</th><th>Quarterly</th><th>Usable/qtr*</th></tr>
      <tr><td>Level 1 → "Transitioned HCP 1"</td><td>~$10,271</td><td>~$2,568</td><td>~$2,311</td></tr>
      <tr><td>Level 2 → "Transitioned HCP 2"</td><td>~$17,771</td><td>~$4,443</td><td>~$3,999</td></tr>
      <tr><td>Level 3 → "Transitioned HCP 3"</td><td>~$38,819</td><td>~$9,705</td><td>~$8,734</td></tr>
      <tr><td>Level 4 → "Transitioned HCP 4"</td><td>~$58,802</td><td>~$14,700</td><td>~$13,230</td></tr>
    </table>
    </div>
    <p style="font-size:11px;color:var(--light);margin-top:8px">*Usable = quarterly budget minus 10% care management deduction. New Support at Home amounts effective 1 November 2025, indexed July each year. Transitioned HCP amounts approximate — confirm exact figure on your approval letter or call My Aged Care. Clinical care (nursing, physio, OT) = 100% government-funded regardless of income or assets. Sources: Dept of Health &amp; Aged Care, Sensible Care, My Aged Care.</p>

    <div class="insight insight-t" style="margin-top:12px">
      <strong>Extra funding on top of your classification — most families never hear about these:</strong><br>
      🔧 <strong>Restorative Care Pathway:</strong> $6,000 extra (up to $12,000) for 16 weeks of physio/OT after illness or a fall — can be used twice per year<br>
      🏠 <strong>Assistive Tech and Home Modifications (AT-HM):</strong> Separate pool — low ~$500, medium ~$2,000, high $15,000+ — does NOT come out of your quarterly budget<br>
      💊 <strong>End-of-Life Pathway:</strong> Up to $25,000 for 12 weeks of intensive home care<br>
      ⏳ <strong>Lifetime cap (new entrants from Nov 2025):</strong> $135,318.69 on non-clinical contributions<br>
      ⏳ <strong>Lifetime cap (old HCP / grandfathered before Sep 2024):</strong> $84,572 — contributions already paid count toward this
    </div>
    </div>`;
  }

  // ══ KEY CONTACTS ══
  html += `<div class="sec"><div class="sec-h"><span class="sec-h-ico">📞</span><span class="sec-h-t">Key contacts</span></div>
  <div class="contacts">
    <div class="contact c-t"><div class="ci">📞</div><div class="cb"><div class="cb-t">My Aged Care</div><div class="cb-n">1800 200 422</div><div class="cb-s">Start here · Mon–Fri 8am–8pm · Sat 10am–2pm</div></div></div>
    <div class="contact c-a"><div class="ci">🤝</div><div class="cb"><div class="cb-t">OPAN — Free Independent Advocate</div><div class="cb-n">1800 700 600</div><div class="cb-s">Free · Confidential · Mon–Fri 8am–8pm · Sat 10am–4pm</div></div></div>
    <div class="contact c-r"><div class="ci">⚖️</div><div class="cb"><div class="cb-t">ACQSC — Complaints</div><div class="cb-n">1800 951 822</div><div class="cb-s">Report poor care · Anonymous option · 24/7</div></div></div>
    <div class="contact c-t"><div class="ci">💰</div><div class="cb"><div class="cb-t">Services Australia (Means Test)</div><div class="cb-n">1800 227 475</div><div class="cb-s">Income &amp; assets assessment · Must do before entering care</div></div></div>
  </div></div>`;

  // ══ CTA ══
  html += `<div class="cta-bar">
    <h3>Need help making sense of all this?</h3>
    <p>Our free placement service helps Australian families navigate ACAT, find the right home, and understand the costs — at no charge to you.</p>
    <div class="cta-btns">
      <a href="/" class="cta-w">Get free placement advice →</a>
      <button class="cta-o" onclick="startOver()">Start over</button>
    </div>
  </div>`;

  html += `<div class="sources"><strong>Sources &amp; data</strong>Dept of Health &amp; Aged Care: Support at Home Program Manual 2025, Funding Classifications Schedule (Nov 2025), CHSP Manual 2025–27, TCP Guidelines Jan 2026, Aged Care Rules 2025 · Productivity Commission Report on Government Services 2025 · My Aged Care myagedcare.gov.au (March 2026) · Services Australia · ABC News Feb 2026 · The Guardian Feb 2026 · OPAN 2025 · Australian Ageing Agenda. Wait times: national published data + community reports. State estimates based on reported variations. <em>This tool provides general information only. Individual circumstances vary.</em></div>`;

  document.getElementById('results-content').innerHTML = normText(html);
}

function startOver() {
  Object.keys(A).forEach(k=>delete A[k]);
  signals = [];
  document.querySelectorAll('.opt').forEach(o=>o.classList.remove('sel'));
  document.querySelectorAll('.mopt').forEach(o=>o.classList.remove('sel'));
  goScreen(1);
}

function normText(s) {
  return String(s)
    .replace(/Â·/g, '·')
    .replace(/Â/g, '')
    .replace(/â€”/g, '—')
    .replace(/â€“/g, '–')
    .replace(/â†’/g, '→')
    .replace(/â†/g, '←')
    .replace(/cafÃ©/g, 'café');
}
