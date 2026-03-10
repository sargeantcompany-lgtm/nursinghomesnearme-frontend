export type BlogPost = {
  day: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  image: string;
};

const rawBlogPosts: Omit<BlogPost, "excerpt" | "image">[] = [
  {
    day: 1,
    title: `How Nursing Home Placement Works in Australia`,
    slug: `day-1-how-nursing-home-placement-works-in-australia`,
    content: `Families usually start with one question: where do we begin? In Australia, nursing home placement generally follows this path: check eligibility, complete an aged care assessment, shortlist homes, compare costs, and then apply. The key is to start early, before a crisis. If you wait until hospital discharge pressure starts, choices can become limited. Build a shortlist based on location, care level, and how well staff communicate with families. Ask each home about current vacancies, waitlist timelines, and support for your loved one’s specific needs. Good placement is not just about the next available bed. It is about fit, safety, and continuity of care. Planning ahead gives your family more control and less stress.`,
  },
  {
    day: 2,
    title: `The First Checklist Before You Apply`,
    slug: `day-2-the-first-checklist-before-you-apply`,
    content: `Before contacting homes, prepare a simple placement folder. Include medication list, recent health notes, current care needs, GP details, and emergency contacts. Add financial notes too, including whether you are exploring RAD, DAP, or both. Write down your non-negotiables: distance from family, dementia support, cultural preferences, and clinical capability. This checklist saves time and avoids repeating details in every call. It also helps you compare homes objectively instead of making rushed emotional decisions. Families who prepare first usually move faster once a suitable vacancy appears. A placement checklist is one of the easiest ways to reduce overwhelm and avoid missed steps.`,
  },
  {
    day: 3,
    title: `What Makes a Good Nursing Home Shortlist`,
    slug: `day-3-what-makes-a-good-nursing-home-shortlist`,
    content: `A strong shortlist usually has 5 to 10 homes, not just one or two. Start with location, then filter by care fit. For example, if your loved one has dementia, ask specifically about secure areas, behaviour support, and trained staff coverage. Then compare practical factors: visiting hours, allied health access, and communication systems for families. Finally, compare cost structure and what is included in daily services. Keep notes in a spreadsheet so each home is scored consistently. The goal is to avoid “panic placement” into the first bed offered. A shortlist gives you options and improves your chance of finding the right long-term fit.`,
  },
  {
    day: 4,
    title: `Questions to Ask on Your First Call`,
    slug: `day-4-questions-to-ask-on-your-first-call`,
    content: `Your first phone call should be direct and structured. Ask: Do you currently have vacancies? What care profiles do you accept? What is your waitlist process? How quickly can someone be admitted if needed? Then ask about staffing, GP access, and overnight support. Confirm what is included in basic daily fees and what services are extra. If your family needs regular updates, ask how the home communicates changes in health status. End the call by requesting an information pack and tour availability. These first-call questions help you filter quickly, save time, and avoid spending days on homes that are not a suitable match.`,
  },
  {
    day: 5,
    title: `Nursing Home Costs in Plain English`,
    slug: `day-5-nursing-home-costs-in-plain-english`,
    content: `Most families get stuck at fees. Keep it simple: there are daily living costs, care-related costs, and accommodation payment options. The main accommodation choice is often RAD (lump sum), DAP (daily payment), or a combination. Different homes and circumstances can produce very different outcomes. Instead of chasing the lowest headline number, compare total cost over 12–24 months and check what services are included. Always ask for a written fee schedule before deciding. Good decisions come from understanding both affordability and care quality together. Clear fee comparisons reduce surprises later and help families feel confident during placement discussions.`,
  },
  {
    day: 6,
    title: `RAD vs DAP: Which Option Suits Your Family?`,
    slug: `day-6-rad-vs-dap-which-option-suits-your-family`,
    content: `RAD is typically an upfront lump sum, while DAP is an ongoing daily accommodation payment. Many families use a mix of both. The right choice depends on cash flow, assets, and how long the person may need care. Do not decide based on one phone conversation. Ask homes for side-by-side estimates and discuss implications with a qualified adviser if needed. Also review whether partial RAD plus manageable DAP creates better flexibility. Placement decisions are stressful enough without financial confusion. Breaking RAD and DAP into clear scenarios helps families choose a payment approach they can sustain over time.`,
  },
  {
    day: 7,
    title: `How to Compare Homes Beyond Marketing`,
    slug: `day-7-how-to-compare-homes-beyond-marketing`,
    content: `Brochures highlight lifestyle features, but placement decisions need deeper checks. Ask about clinical escalation, wound management, falls prevention, and palliative pathways. Ask families currently visiting the home what communication and responsiveness are really like. Observe mealtime, hygiene standards, and staff interactions during your tour. A well-run home feels organised, calm, and respectful. Build your own comparison scorecard and use the same criteria at every site visit. This gives you evidence, not just impressions. A placement that looks good online is not always the best practical fit for your loved one’s daily care needs.`,
  },
  {
    day: 8,
    title: `Signs a Home May Not Be the Right Fit`,
    slug: `day-8-signs-a-home-may-not-be-the-right-fit`,
    content: `Red flags can appear early. Watch for vague answers about staffing, long delays returning calls, poor tour transparency, or unclear fee explanations. If a home avoids direct questions about incidents and escalation procedures, pause and reassess. During visits, note cleanliness, resident engagement, and whether staff seem rushed. Also watch how management handles your concerns. A quality provider should answer clearly, in writing when needed. Trusting your observations is important. Placement is a long-term decision, so it is better to move on from a questionable option than rush into a setting that creates ongoing stress for the resident and family.`,
  },
  {
    day: 9,
    title: `Timing Placement Around Hospital Discharge`,
    slug: `day-9-timing-placement-around-hospital-discharge`,
    content: `Hospital discharge can compress timelines. Families often have days, not weeks, to secure care. Preparation is the best defence. Keep your shortlist current, visit likely homes early, and keep documents ready. During discharge planning, ask for clear clinical handover details and medication summaries for each home you contact. Confirm the home can manage current conditions safely from day one. If your first-choice home has no bed, have backup options ready. Discharge pressure is real, but rushed decisions can lead to transfers later. A proactive plan allows faster placement without sacrificing care quality.`,
  },
  {
    day: 10,
    title: `The Role of Family in a Smooth Transition`,
    slug: `day-10-the-role-of-family-in-a-smooth-transition`,
    content: `Placement is easier when family roles are clear. Nominate one primary contact to handle calls, paperwork, and updates. Assign others to tasks like tours, transport planning, and emotional support. Share one central document so everyone sees the same information. During transition week, prepare personal items that make the new room familiar: photos, blanket, favourite music, and comfort objects. Emotional reassurance matters as much as logistics. Families who coordinate roles early usually experience fewer miscommunications. A supported transition helps residents settle faster and builds trust with staff from the first day.`,
  },
  {
    day: 11,
    title: `How Dementia Changes Placement Decisions`,
    slug: `day-11-how-dementia-changes-placement-decisions`,
    content: `If dementia is involved, placement criteria must be more specific. Ask about secure environment design, wandering management, behaviour support capability, and staff dementia training frequency. Check whether routines can be personalised and how agitation episodes are handled. Families should ask for practical examples, not generic promises. During tours, observe noise levels and whether residents appear settled. Dementia care quality often depends on consistency and communication, not just facility appearance. A home experienced in dementia care can significantly improve quality of life for both residents and carers.`,
  },
  {
    day: 12,
    title: `What to Ask About Clinical Care`,
    slug: `day-12-what-to-ask-about-clinical-care`,
    content: `Clinical capability is one of the most important placement factors. Ask what registered nurse coverage is available and how after-hours medical concerns are escalated. Confirm medication review processes and allied health access. If your loved one has complex needs, ask for examples of similar residents the home supports. Written care planning and regular family updates should be standard. Families should also ask how the home tracks changes in mobility, nutrition, and cognition over time. Strong clinical systems are often the difference between reactive care and proactive care.`,
  },
  {
    day: 13,
    title: `Touring a Nursing Home: What to Observe`,
    slug: `day-13-touring-a-nursing-home-what-to-observe`,
    content: `A tour is not just a walkthrough. Look at resident engagement, odour control, hygiene, dining setup, and staff responsiveness. Notice whether residents are addressed respectfully and whether staff appear familiar with individual preferences. Ask to see common areas at different times if possible. Observe call-bell response times and how visitors are welcomed. Take notes immediately after each visit while details are fresh. The best tours leave families with clear answers, not polished impressions. Structured observation helps you choose based on care reality, not presentation quality.`,
  },
  {
    day: 14,
    title: `Understanding Waitlists and Vacancy Strategy`,
    slug: `day-14-understanding-waitlists-and-vacancy-strategy`,
    content: `Waitlists vary by provider and location. Some homes call families quickly; others keep long waiting pools with uncertain timing. Ask exactly how waitlist priority works and what documents are needed to activate fast placement when a bed opens. Stay in touch regularly so your interest remains current. Keep at least one interim option available in case preferred homes are full. Smart vacancy strategy means balancing ideal choice with realistic timing. Families who maintain multiple active options usually avoid emergency decisions when health status changes suddenly.`,
  },
  {
    day: 15,
    title: `Private Room, Shared Room, and Practical Trade-offs`,
    slug: `day-15-private-room-shared-room-and-practical-trade-offs`,
    content: `Room type affects comfort, privacy, and budget. Private rooms can support dignity and quieter routines, but may cost more. Shared arrangements may reduce costs but may not suit residents who are easily distressed or need calm routines. During tours, check room layout, accessibility, natural light, and proximity to nursing stations. Ask what personalisation is allowed. Room choice should align with clinical needs and personality, not only price. Thoughtful room selection can improve settling outcomes and family satisfaction long after admission day.`,
  },
  {
    day: 16,
    title: `Nutrition and Mealtimes: Why It Matters`,
    slug: `day-16-nutrition-and-mealtimes-why-it-matters`,
    content: `Food quality and mealtime support directly affect health and wellbeing. Ask how menus are planned, how special diets are managed, and how staff support residents with swallowing or appetite issues. Observe whether residents look engaged during meals and whether assistance is provided respectfully. Ask what happens if weight loss is detected and how families are informed. Homes with strong nutrition routines tend to have better overall care coordination. Placement decisions should include mealtime quality, not just accommodation and fees.`,
  },
  {
    day: 17,
    title: `Medication Management Questions Families Should Ask`,
    slug: `day-17-medication-management-questions-families-should-ask`,
    content: `Medication errors are a major concern for families. Ask about medication administration processes, pharmacist reviews, and incident response protocols. Confirm how medication changes from hospital or GP are reconciled. Ask whether family is informed about major medication adjustments and side effects. Good homes explain these systems clearly and can show how they reduce risk. You do not need to be clinical to ask strong medication questions. A clear, transparent process is a core sign of safe care.`,
  },
  {
    day: 18,
    title: `How to Read a Home’s Communication Style`,
    slug: `day-18-how-to-read-a-home-s-communication-style`,
    content: `Communication quality is a predictor of long-term family satisfaction. Ask how updates are shared, who your primary contact is, and expected response times. Check whether care conferences are scheduled routinely and whether families can raise concerns without friction. During initial interactions, note if staff are consistent and clear. Poor communication early usually becomes worse under pressure. Placement should prioritise homes that communicate proactively, not only when something goes wrong.`,
  },
  {
    day: 19,
    title: `Handling Family Disagreement During Placement`,
    slug: `day-19-handling-family-disagreement-during-placement`,
    content: `Different family members often prioritise different things: cost, distance, clinical support, or room type. Use a simple decision matrix with weighted criteria. Agree upfront on non-negotiables and final decision authority. Keep discussions focused on resident needs, not individual convenience. If disagreement persists, bring in a neutral professional such as a social worker or aged care adviser. A structured process reduces conflict and keeps placement moving. The goal is a stable decision everyone can support.`,
  },
  {
    day: 20,
    title: `What to Pack for Admission Day`,
    slug: `day-20-what-to-pack-for-admission-day`,
    content: `Packing for admission is easier with a checklist. Bring daily clothing, labelled essentials, personal care items, hearing/vision aids, medication summary, and meaningful personal items. Add contact numbers and preferred routines in writing for staff. Keep valuables minimal and documented. On arrival, confirm who to speak with for first-week updates. A practical, organised admission pack helps staff deliver personalised care from day one and reduces first-week confusion for families.`,
  },
  {
    day: 21,
    title: `First 14 Days After Placement: What to Monitor`,
    slug: `day-21-first-14-days-after-placement-what-to-monitor`,
    content: `The first two weeks are the adjustment period. Monitor appetite, sleep, mood, orientation, and social engagement. Ask staff for early care plan review if your loved one appears unsettled. Track concerns in writing and escalate politely if issues persist. Families should also watch communication consistency and response speed. Early intervention improves settling outcomes and can prevent avoidable decline. The first 14 days often set the long-term tone of care.`,
  },
  {
    day: 22,
    title: `How to Escalate Concerns Effectively`,
    slug: `day-22-how-to-escalate-concerns-effectively`,
    content: `When concerns arise, use a calm escalation path: document issue, request meeting with care lead, agree actions, and set review date. Keep notes factual and specific. If outcomes are unclear, escalate through provider channels. Effective escalation is not confrontation; it is clear communication with accountability. Families who escalate early and professionally often get faster resolution. A transparent response culture is a strong sign of service quality.`,
  },
  {
    day: 23,
    title: `Visiting Routines That Support Better Outcomes`,
    slug: `day-23-visiting-routines-that-support-better-outcomes`,
    content: `Frequent, predictable family contact can improve adjustment. Create a simple visiting routine and share it with staff. Use visits to reinforce familiarity and gather practical feedback from frontline carers. Bring meaningful activities: photos, music, short walks, or familiar conversation topics. Consistent family presence helps detect early changes in wellbeing. Good visiting routines are not just emotional support; they are part of quality monitoring.`,
  },
  {
    day: 24,
    title: `End-of-Life Planning in Residential Care`,
    slug: `day-24-end-of-life-planning-in-residential-care`,
    content: `End-of-life planning is difficult but important. Ask how the home approaches palliative care discussions, symptom management, and family communication during decline. Confirm who is contacted first and what support is available for relatives. Discuss preferences early so decisions are guided by resident values, not crisis pressure. Compassionate planning gives families clarity and dignity during a hard period. Homes with strong palliative communication frameworks usually provide more reassuring care.`,
  },
  {
    day: 25,
    title: `Choosing by Location vs Choosing by Care Quality`,
    slug: `day-25-choosing-by-location-vs-choosing-by-care-quality`,
    content: `Families often prioritise distance, but care quality can matter even more over time. If the nearest home is not a good fit, consider slightly farther options with stronger clinical and communication performance. Balance travel burden with resident outcomes. In many cases, a better-quality home 20–30 minutes farther can be the better long-term choice. Use objective criteria and revisit priorities as needs evolve.`,
  },
  {
    day: 26,
    title: `Common Mistakes Families Make in Placement`,
    slug: `day-26-common-mistakes-families-make-in-placement`,
    content: `Common mistakes include waiting too long, relying on one provider, ignoring fee details, and not documenting conversations. Another mistake is choosing based only on appearances during one tour. Better outcomes come from early planning, structured comparisons, and clear communication records. Placement is both emotional and operational. Families who treat it like a project usually avoid costly or stressful corrections later.`,
  },
  {
    day: 27,
    title: `How to Build a Nursing Home Comparison Spreadsheet`,
    slug: `day-27-how-to-build-a-nursing-home-comparison-spreadsheet`,
    content: `A simple spreadsheet can transform decision quality. Add columns for vacancy status, room type, fee structure, care capability, staffing answers, communication rating, and tour notes. Score each home consistently from 1 to 5. Include a final “fit” score based on your non-negotiables. Update weekly while you are searching. This system makes discussions easier and reduces confusion among family members. It also helps you act quickly when a suitable vacancy appears.`,
  },
  {
    day: 28,
    title: `What a Good Care Plan Discussion Looks Like`,
    slug: `day-28-what-a-good-care-plan-discussion-looks-like`,
    content: `A strong care plan discussion is detailed, resident-specific, and collaborative. Staff should ask about routines, mobility, nutrition, communication preferences, and emotional triggers. Families should ask how progress is tracked and when formal reviews happen. Care plans should not be static documents; they should adapt as conditions change. Clear care planning is a core indicator of quality and should influence your placement decision.`,
  },
  {
    day: 29,
    title: `Supporting a Loved One Emotionally During Transition`,
    slug: `day-29-supporting-a-loved-one-emotionally-during-transition`,
    content: `Moving into residential care can feel like a major loss of control. Families can help by keeping language reassuring, maintaining routines where possible, and introducing familiar objects and people. Small consistency cues matter: same visiting times, favourite music, and regular phone calls. Emotional support does not remove all anxiety, but it significantly improves adjustment. Placement success includes emotional wellbeing, not only clinical metrics.`,
  },
  {
    day: 30,
    title: `Your Family’s 90-Day Placement Success Plan`,
    slug: `day-30-your-family-s-90-day-placement-success-plan`,
    content: `The first 90 days should be intentional. Set monthly review points for health, communication, and quality-of-life outcomes. Track key indicators: weight stability, falls, mood, medication changes, and engagement. Keep one lead family contact for consistency with staff. If concerns emerge, escalate early and document responses. A 90-day plan helps families move from reactive stress to proactive care partnership. Placement is not the end of the journey; it is the start of ongoing quality management.`,
  },
  {
    day: 31,
    title: `How to Prepare for a Care Plan Review Meeting`,
    slug: `day-31-how-to-prepare-for-a-care-plan-review-meeting`,
    content: `Care plan reviews are where families can influence day-to-day outcomes. Before the meeting, write a short list of concerns and goals: mobility, mood, pain, sleep, social engagement, and communication frequency. Ask for recent observations and practical examples from staff, not general summaries. During the review, agree on actions, who is responsible, and when progress will be checked. If something is unclear, request it in writing. A structured review discussion improves accountability and reduces misunderstandings. Families who prepare well usually get clearer care changes and faster follow-through.`,
  },
  {
    day: 32,
    title: `What to Do if a Preferred Home Has No Vacancy`,
    slug: `day-32-what-to-do-if-a-preferred-home-has-no-vacancy`,
    content: `No vacancy in your first-choice home does not mean your search has failed. Keep your preferred home active while moving on parallel options. Confirm exactly how their waitlist works, what documents they require, and whether short-notice placement is possible. At the same time, shortlist other homes with similar care capability and location practicality. Ask each one how quickly they can assess and admit. A dual-track approach keeps quality high while reducing placement delay risk. It also protects families from panic decisions when timelines tighten.`,
  },
  {
    day: 33,
    title: `How to Speak with Hospitals During Discharge Pressure`,
    slug: `day-33-how-to-speak-with-hospitals-during-discharge-pressure`,
    content: `Discharge conversations can feel rushed, so use a clear script. Ask for current clinical status, immediate risks, medication updates, and what level of support is essential on day one. Request a complete handover package for homes you contact. Be direct about your shortlist and expected timelines, and ask what interim support exists if placement takes longer. Keep all communication in writing where possible. Hospitals and families work best as partners when expectations are clear. Calm, documented conversations reduce confusion and improve transfer quality.`,
  },
  {
    day: 34,
    title: `How to Compare Facility Culture Before Admission`,
    slug: `day-34-how-to-compare-facility-culture-before-admission`,
    content: `Culture is one of the hardest factors to measure but one of the most important long term. During visits, observe how staff greet residents, how concerns are handled, and whether communication feels respectful. Ask staff how they support new residents in the first two weeks and what happens when someone is distressed. Look for consistency between what management promises and what frontline staff describe. A strong culture usually shows up in small daily behaviours, not marketing language. Choosing a home with a healthy culture can reduce later conflict and improve quality of life.`,
  },
  {
    day: 35,
    title: `When to Involve an Aged Care Financial Adviser`,
    slug: `day-35-when-to-involve-an-aged-care-financial-adviser`,
    content: `Some families delay financial advice and make decisions under pressure. If RAD, DAP, asset sales, or complex family arrangements are involved, early advice can prevent expensive mistakes. Bring clear figures to the conversation: likely stay duration, cash flow limits, and non-negotiable care goals. Ask for scenario comparisons rather than one recommendation. Good advice should improve clarity, not add confusion. Financial decisions and care decisions are linked, so they should be reviewed together. Timely advice can protect both affordability and placement quality.`,
  },
  {
    day: 36,
    title: `Questions to Ask About Allied Health Services`,
    slug: `day-36-questions-to-ask-about-allied-health-services`,
    content: `Allied health can significantly affect function and wellbeing. Ask what physiotherapy, occupational therapy, speech pathology, and podiatry support is available, how often residents are reviewed, and how referrals are prioritised. Confirm whether services are proactive or mainly reactive after decline. Ask how progress is measured and shared with families. Homes with strong allied health coordination often support better mobility and independence outcomes. This area is frequently overlooked during selection, but it matters for long-term quality of care.`,
  },
  {
    day: 37,
    title: `How to Evaluate Night Shift Support in Aged Care`,
    slug: `day-37-how-to-evaluate-night-shift-support-in-aged-care`,
    content: `Night-time support is critical, especially for residents at risk of falls, confusion, or clinical deterioration. Ask how many staff are on overnight, what escalation process is used, and how urgent medical decisions are handled after hours. Confirm response expectations for call bells and how incidents are documented. Families should also ask how overnight updates are communicated the next day. Strong overnight systems usually indicate stronger overall governance. A home that performs well at night is often safer across the full 24-hour cycle.`,
  },
  {
    day: 38,
    title: `How Families Can Build Better Relationships with Staff`,
    slug: `day-38-how-families-can-build-better-relationships-with-staff`,
    content: `Positive staff relationships improve communication and outcomes. Start by nominating one family contact to keep messages consistent. Share practical resident preferences in writing and thank staff when good care is observed. Raise concerns early and respectfully, with clear examples rather than assumptions. Ask for regular check-ins instead of waiting for problems to escalate. Most teams respond better when communication is collaborative and structured. Strong family-staff partnerships create a more stable care environment for everyone.`,
  },
  {
    day: 39,
    title: `How to Review a Home After the First 30 Days`,
    slug: `day-39-how-to-review-a-home-after-the-first-30-days`,
    content: `The 30-day mark is a good checkpoint for placement quality. Review core areas: settling, health stability, communication consistency, medication updates, and social engagement. Compare what was promised before admission with what has actually happened. If gaps appear, request a meeting with a short action list and follow-up date. Keep notes concise and factual so progress can be tracked. Early course correction is easier than waiting months. A practical 30-day review helps families stay proactive and supports better long-term outcomes.`,
  },
  {
    day: 40,
    title: `A Practical Family Checklist for Ongoing Placement Success`,
    slug: `day-40-a-practical-family-checklist-for-ongoing-placement-success`,
    content: `Placement success depends on steady follow-through, not one decision. Keep a monthly checklist covering health changes, communication quality, fees, care plan updates, and resident wellbeing. Confirm who in the family handles each task to avoid duplication or missed steps. Schedule regular check-ins with the home and document agreed actions. Review your checklist every month and adjust as needs change. Families who use a simple process usually feel more confident and less reactive. Ongoing structure turns placement from crisis management into quality management.`,
  },
];

const blogImages = [
  "/AND_1024-909x465.jpg",
  "/AND_1031-909x465.jpg",
  "/AND_1038-909x465.jpg",
  "/DJI_0161-909x465.jpg",
  "/Duhig_Resdient-room_1-909x465.jpg",
  "/Duhig_Resident-room_3-909x465.jpg",
  "/Merrimac-couplesdeluxesuite4_EDI9234.jpg",
  "/2020-07-05.webp",
  "/Duhig Village.webp",
  "/EDI_4333 copy.webp",
];

export const blogPosts: BlogPost[] = rawBlogPosts.map((post, idx) => {
  const excerpt = post.content.replace(/\s+/g, " ").trim().slice(0, 170) + "...";
  return {
    ...post,
    excerpt,
    image: blogImages[idx % blogImages.length],
  };
});


