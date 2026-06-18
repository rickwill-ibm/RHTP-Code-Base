'use client';

// ─── Talk Track PDF Generator ─────────────────────────────────────────────────
// Generates a downloadable PDF of the full demo talk track — all 19 screens
// with phase headers, timing, narrative, and requirements alignment notes.
// Uses the browser's built-in print-to-PDF via a hidden iframe + window.print().
// No external PDF library required.
// Author: Richard Hennessy · 11005 Deep Brook Dr, Austin TX 78726

export interface TalkTrackScreen {
  number: string;
  id: string;
  title: string;
  phase: string;
  phaseColor: string;
  timing: string;
  narrative: string[];
  requirements: string;
}

export const TALK_TRACK_PHASES = [
  { id: 'foundation', label: 'FOUNDATION PHASE', subtitle: '"The Problem Is Bigger Than You Think"', screens: '1–6', timing: '~7 minutes', color: '#78a9ff' },
  { id: 'intelligence', label: 'INTELLIGENCE PHASE', subtitle: '"The System That Sees Everything"', screens: '7–11', timing: '~6 minutes', color: '#42be65' },
  { id: 'resolution', label: 'RESOLUTION PHASE', subtitle: '"What the System Achieved"', screens: '12–15', timing: '~4 minutes', color: '#f59e0b' },
  { id: 'impact', label: 'IMPACT PHASE', subtitle: '"What It Achieved and What It Means"', screens: '16–19', timing: '~4 minutes', color: '#c084fc' },
  { id: 'appendix', label: 'APPENDIX', subtitle: 'Deep-Dive Reference Screens — Available on Request', screens: 'A1–A3', timing: 'as needed', color: '#94a3b8' },
];

export const TALK_TRACK_SCREENS: TalkTrackScreen[] = [
  // ── FOUNDATION PHASE ──────────────────────────────────────────────────────
  {
    number: '01',
    id: 'burning-platform',
    title: 'Burning Platform',
    phase: 'FOUNDATION',
    phaseColor: '#78a9ff',
    timing: '~90 seconds',
    narrative: [
      '"SD Medicaid RHTP measures on a trajectory from 4.0 to 3.5. TCOC at 87.2% — above that ceiling you\'re writing rebate checks. SD Medicaid prior auth reform: January 2026, 72-hour mandate, not optional. And when care coordination fails for a complex member — not sometimes, on average — $47,000 in additional episode cost."',
      '"But here is the structural reality: UnitedHealth Group already owns the clinical delivery network, the pharmacy benefit, the care management platform, and the data infrastructure. Bennett County Health. Martin Pharmacy. Bennett County Insight. The assets exist. The question is whether they operate as a vertically integrated system — or as four separate organizations that happen to share a parent company."',
      '"The plans gaining ground have stopped treating coordination as an operational problem and started treating it as a strategic capability. What you\'re about to see is what your organization becomes when every signal is heard, every constraint is honored, and every member is finally known — across every Bennett County and SD Medicaid entity simultaneously."',
    ],
    requirements: 'Establishes why orchestration and engagement intelligence matter at enterprise scale. Anchors all four capability statements to measurable business outcomes. Vertical integration framing positions UHG/Bennett County asset ownership as the strategic differentiator — the system activates what already exists.',
  },
  {
    number: '02',
    id: 'opening',
    title: 'Enterprise Scale',
    phase: 'FOUNDATION',
    phaseColor: '#78a9ff',
    timing: '~75 seconds',
    narrative: [
      '"124,847 members. 8,293 providers. 47,291 active care episodes. 23,104 open authorizations — yellow because every one is a decision waiting, a member waiting, a cost accumulating. 4,847 employer groups."',
      '"Every one of these numbers represents a person. Right now, your systems cannot agree on who they are."',
      '"One of those 124,847 members is Maria Redhawk. Age 58. High-risk score 7.8. She is the proof of what this system can do."',
    ],
    requirements: 'Establishes enterprise scale — members, providers, employer groups — before introducing the identity problem. Addresses Statement 1 (identity across touchpoints at scale).',
  },
  {
    number: '03',
    id: 'fragmentation',
    title: 'Fragmentation — 4-Layer Reveal',
    phase: 'FOUNDATION',
    phaseColor: '#78a9ff',
    timing: '~135 seconds',
    narrative: [
      'LAYER 1 — Press ↓ — INTERNAL UHG/OPTUM FRAGMENTATION: "Before we look at Maria — let\'s look at us. UHG and Bennett County operate across four major entities that touch every member: SD Medicaid (payer), Bennett County Health (clinical delivery), Martin Pharmacy (pharmacy benefit), and Bennett County Insight (data and analytics). These four entities each hold a piece of every member\'s story. And right now — they cannot agree on who that member is. The same person appears in four systems with four different identifiers, four different consent records, and four different care plans. The fragmentation problem is not just external. It starts here."',
      'LAYER 2 — Press ↓ — MEMBER-FACING FRAGMENTATION: "This is what Maria looks like to your organization today. Six systems. Six versions of Maria. Zero coordination." Point to each: Claims sees cost trajectory. EHR sees clinical record. Auth sees a pending request. Care Management has a 45-day-old care plan. H1ab has Sarah Johnson working from stale context. And the employer — SD Medicaid — has a wellness program about to send Maria an outreach that conflicts with everything the clinical team is already doing. None of them know what the others are doing.',
      'LAYER 3 — Press ↓ — PERSONA FRAGMENTATION: "But the fragmentation runs deeper than data. No system understands her roles, her Personas, her relationships, or how those roles change across contexts." Maria is simultaneously a patient — cardiac episode, diabetes management, auth expiring. A caregiver — managing Elena\'s six medications, proxy consent in play. A parent — Sophia has no pediatrician, five care gaps open. Each role exists in a different system. None aware of the others.',
      'LAYER 4 — Press ↓ — WHAT IS MISSING: "What is missing across all six systems — about one person." Walk the checklist: Identity unresolved. Consent unknown in three of six systems. Relationships — Sophia and Elena — invisible. Preferences unknown outside CRM. Caregiver proxy — no system aware. Journey context — no system knows she is on Day 34 of a cardiac episode. Roles — patient, caregiver, parent — never held simultaneously.',
      'CLOSING BEAT — Press ↓: "There is no enterprise identity graph. Only disconnected records of a person no system fully knows. And the irony: UHG already owns the clinical network, the pharmacy benefit, and the data infrastructure to solve this. The assets exist. The integration does not. Before any agent can act intelligently — the system must first know who it\'s acting for."',
    ],
    requirements: 'Four-layer reveal: (1) internal UHG/Bennett County entity fragmentation first — SD Medicaid, Bennett County Health, Martin Pharmacy, Bennett County Insight; (2) member-facing six-system fragmentation; (3) persona fragmentation; (4) what is missing checklist. Directly addresses Statement 1 (identity across touchpoints) and Statement 2 (trusted profiles with relationships, consent, permissions). Employer touchpoint visible. All four persona dimensions surfaced. Vertical integration framing: UHG owns the assets — the gap is integration.',
  },
  {
    number: '04',
    id: 'cdp-assembly',
    title: 'CDP Assembly',
    phase: 'FOUNDATION',
    phaseColor: '#78a9ff',
    timing: '~75 seconds',
    narrative: [
      '"Before any agent acts — the platform assembles a single truth. Watch what that looks like across the four Bennett County entities."',
      'Watch the resolution log. Note normalization first — SD Medicaid claims schema, Bennett County Health clinical schema, Martin Pharmacy pharmacy schema, and Bennett County Insight behavioral schema — four source schemas collapsed into canonical CDP format. Then anonymous-to-known resolution — a portal session arrives unidentified, behavioral pattern matched to Maria, identity promoted to known. Then identity confirmed at 97% confidence across all four entity namespaces. Consent resolved. Authorization attached. Care gaps linked. Episodes assembled. Bennett County Health connected via Bennett County Health clinical record. And then — Sophia. Elena. Proxy consent scope loaded.',
      '"This is not a data warehouse. Not a nightly batch. A live, persistent identity that every downstream agent — whether it operates in SD Medicaid, Bennett County Health, Martin Pharmacy, or Bennett County Insight — can trust. One member. One truth. Four entities aligned."',
      'PRACTITIONER DEPTH — SOURCE INSTRUMENTATION TAB: "Every architecture diagram makes this look clean. Let me show you what we actually deal with." Open the Source Instrumentation tab — the Tier 1/2/3 model lands immediately because every person in the room knows the 300+ application reality. They have lived it. Seeing it named — Tier 3 dark data, 30% of the estate, NLP extraction, 24–48hr latency — signals that EY + IBM have been in the building before.',
      'PIVOT LINE: "We are not asking you to rearchitect 300 applications. We are asking you to identify the 14 data products that matter for Maria — and build from there." This is the message that changes the conversation from "this is too big" to "this is how you start."',
      'LATENCY TAB: Switch to Event Latency Requirements. Point to DUPLICATE_THERAPY: <15min — patient safety threshold. "Every signal has a different latency requirement — and the requirement is driven by the clinical consequence of missing the window, not by what the system can conveniently deliver. That discipline is what separates a data platform from a care coordination engine."',
      'DATA PRODUCT TAB: "We do not build pipelines. We build data products — with owners, SLAs, consumers, and lineage. That is what makes this maintainable at enterprise scale two years after go-live."',
    ],
    requirements: 'Statement 3 — normalize and activate CDP events. Shows unknown-to-known resolution, normalization step, multi-touchpoint assembly including digital identity. Bennett County entity naming explicit: SD Medicaid, Bennett County Health, Martin Pharmacy, Bennett County Insight — four source schemas collapsed into one canonical CDP record. Bennett County Health connected via Bennett County Health clinical record. Practitioner depth messaging: Setup Line (300+ application landscape, Tier 1/2/3 instrumentation reality), Pivot Line (14 data products not 300 applications), Latency Tab (DUPLICATE_THERAPY <15min patient safety threshold, clinical consequence drives latency requirement), Data Product Tab (owners, SLAs, consumers, lineage — enterprise maintainability).',
  },
  {
    number: '05',
    id: 'maria-subgraph',
    title: 'Maria Subgraph Context',
    phase: 'FOUNDATION',
    phaseColor: '#78a9ff',
    timing: '~90 seconds',
    narrative: [
      '"This is what known looks like." Point to Maria at center. Walk the four threads:',
      '• Clinical thread: Postpartum episode, Bennett County Health, CAREGAP_HBA1C expiring T-4, HbA1c gap 45 days',
      '• Sophia thread: Dependent, age 2, no PCP, five gaps',
      '• Elena thread: Caregiver, Lisinopril high-risk — DUPLICATE THERAPY FLAGGED (Lisinopril + Metformin, two prescribers unaware), A1C elevated 38 days, proxy consent scoped',
      '• SDOH thread: Transport barrier — RED, BLOCKS HbA1c standard intervention. Financial strain elevated. Caregiver burden high.',
      '"Every edge is a relationship the system is actively monitoring. Every node is a dependency. This is the working memory of the orchestration layer."',
      'Click Transport Barrier node — show Cypher query. The system didn\'t just store the barrier. It evaluated it against Maria\'s active care gaps and determined the standard intervention would fail.',
      '"The graph is not a visualization. It is a reasoning engine. Notice the SDOH PROFILE DISCOVERED label — this wasn\'t entered manually. The system ran a graph traversal query across social determinant nodes and surfaced the barrier pattern automatically."',
    ],
    requirements: 'Statement 1 — household, caregiver, proxy, delegate relationships. Statement 2 — lifecycle context, consent, relationships all visible. SDOH as graph-discovered whole-person context. Duplicate therapy edge visible in Elena thread.',
  },
  {
    number: '06',
    id: 'consumer-360',
    title: 'Consumer 360 + Journey Map',
    phase: 'FOUNDATION',
    phaseColor: '#78a9ff',
    timing: '~90 seconds',
    narrative: [
      '"Consumer 360 is not a profile page. It is an operational intelligence layer."',
      'Point to journey timeline — Day 0 to 90, currently at Day 34. Expected vs unexpected signals at this stage. HbA1c gap should have closed by Day 21 — it hasn\'t. The system knows.',
      'Point to the Channel History Timeline panel — scroll through the 7 events: "IVR Day 1 — first touch, no answer. Phone Day 8 — outreach attempt, unanswered. Phone Day 11 — second attempt, unanswered. Portal Day 14 — Maria self-initiated, self-service session. Portal Day 21 — second self-service session. Portal Day 28 — third session. Portal Day 34 — active session today." The system didn\'t just log these. It derived a behavioral pattern: Maria does not respond to phone outreach. She self-initiates on the portal. That preference is now a governed constraint — it will suppress phone attempts and route all outreach to portal.',
      'Point to communication permissions — email opted out, frequency cap 3 per 7 days, 2 used this week. This is a governed profile attribute, not a preference note.',
      'Point to Active Signals panel — the ⚠ Med review_ALERT — DUPLICATE_THERAPY block is live. Lisinopril (CVS · Bennett County Health) and Metformin (Walgreens · Bennett County Health) — same mechanism, two prescribers unaware of each other. This is a critical safety signal, not a care gap.',
      'Point to care manager — Sarah Johnson, H1ab, 47-day-old context. The person responsible for Maria\'s coordination is working blind. That changes in 47 minutes.',
      'Expand lifecycle context — enrolled three years, prior cardiac hospitalization 2022, Sophia registered June 2024, Elena caregiver status November 2024. The system holds her arc, not just her current state.',
    ],
    requirements: 'Statement 2 — lifecycle context, communication permissions, consent, engagement attributes. Statement 4 — handoff coordination with care manager visible. Channel History Timeline shows behavioral channel preference derivation. Duplicate therapy safety alert surfaced in Active Signals.',
  },

  // ── INTELLIGENCE PHASE ────────────────────────────────────────────────────
  {
    number: '07',
    id: 'knowledge-graph',
    title: 'Enterprise Population',
    phase: 'INTELLIGENCE',
    phaseColor: '#42be65',
    timing: '~75 seconds',
    narrative: [
      '"This is your population as a live knowledge graph. Every node a relationship. Every edge a dependency."',
      'Point to risk distribution — 80% low risk, 15% medium, 5% high. The 5% is where cost concentrates. Show signal stream — note the variety of signal types. IVR touches, call center closures, clinical events, behavioral signals — all normalized into one stream from SD Medicaid, Bennett County, and RHTP Care Management.',
      'Point to the CHANNEL_HISTORY node type in the graph legend — this is a first-class entity. Every member\'s channel interaction sequence is a structured node, not a log entry. The system can traverse it, reason over it, and use it to constrain outreach decisions.',
      'Point to disposition events — SUPPRESSED, DELAYED, DEPRIORITIZED.',
      '"The system is not acting on everything. It is deciding what deserves a response, in what order, and what should never surface at all. That judgment — at this scale — is the difference between intelligence and noise."',
      'Press M — pause stream, inject Maria\'s three signals, show "3 signals injected — press ↓ to proceed."',
    ],
    requirements: 'Statement 3 — capture and activate events across products, channels, partner platforms. Cross-product signals (SD Medicaid/Bennett County/RHTP) visible. CHANNEL_HISTORY as first-class graph node type introduced.',
  },
  {
    number: '08',
    id: 'signal-disposition-engine',
    title: 'Signal Disposition Engine',
    phase: 'INTELLIGENCE',
    phaseColor: '#42be65',
    timing: '~90 seconds',
    narrative: [
      '"Before I show you what the system does — let me show you how it decides."',
      'Point to the screen title — Signal Disposition Engine. This is the evaluation layer between raw signals and agent action.',
      'Walk the five signal evaluations — note the Channel column on each row:',
      '• AUTH_EXPIRY — ACT NOW, Channel: Portal (last-touch Day 34). Sequence after eligibility check. Rationale: auth renewal cannot finalize if eligibility lapses first.',
      '• CARE_GAP HbA1c — ACT NOW but SDOH-modified, Channel: Portal. Standard clinic appointment BLOCKED by transport barrier. Home lab kit dispatched instead. This is next-best action, not standard protocol.',
      '• Med review_ALERT DUPLICATE_THERAPY — CRITICAL, Channel: Martin Pharmacy (pharmacy domain). Lisinopril + Metformin, two prescribers unaware. Prescriber alert dispatched. Martin Pharmacy Med review outreach SUPPRESSED — consent boundary: Martin Pharmacy domain requires separate consent scope.',
      '• BEHAVIORAL — PRIORITIZE, Channel: Portal (self-initiated pattern). Member receptivity window detected. Act within it.',
      '• SDOH multi-barrier — context loaded, Channel: IVR→Phone→Portal sequence analyzed, modifies all upstream decisions.',
      'Point to enterprise outreach coordination: "The clinical team, service team, growth team, and employer wellness program all want Maria\'s attention this week. The system approves one, suppresses two, delays one. Maria receives a single coordinated touchpoint. That is enterprise engagement intelligence."',
      '"The channel column is not cosmetic. It is the last-touch evidence the system uses to route every action. Phone attempts are suppressed because the channel history shows two unanswered calls. Portal is the only channel with a behavioral signal."',
    ],
    requirements: 'Statement 4 — coordinate handoffs, avoid conflicting outreach, next-best experience. Statement 3 — event activation across products. Employer touchpoint visible in suppression. Channel column per signal row. Med review duplicate therapy CRITICAL signal with Martin Pharmacy consent boundary.',
  },
  {
    number: '09',
    id: 'maria-counterfactual',
    title: 'Maria Counterfactual',
    phase: 'INTELLIGENCE',
    phaseColor: '#42be65',
    timing: '~90 seconds',
    narrative: [
      '"Before I show you the resolution — I want to show you what happens without it."',
      'Press ↓ for each failure:',
      '• Day 4: Auth lapses. No automatic notification. Coordinator finds it Monday morning.',
      '• Day 12: Bennett County Health\'s eligibility expires. Episode continuity broken. No one knows.',
      '• Day 45: HbA1c gap now 47 days. System scheduled a clinic appointment. Transport barrier unknown. Maria couldn\'t get there. System scheduled again. Same result.',
      '• Day 52: Lisinopril + Metformin duplicate therapy goes undetected. No Med review intercept. No prescriber alert. A1C unmonitored. Bleeding risk accumulates silently.',
      '• Day 67: Care manager calls — standard script. No awareness of caregiver burden. Maria overwhelmed. Disengages.',
      '• Day 72: Appeal deadline passes. SD Medicaid penalty exposure. Window gone.',
      '"$47,000. Not a worst-case scenario. The median outcome when coordination is manual and the system doesn\'t know who it\'s acting for. Not because Maria didn\'t care. Because the system didn\'t."',
      'Final beat: "Now let me show you what happens when the system is watching."',
    ],
    requirements: 'Anchors the business case for Statements 1–4. SDOH silent failure dimension visible. Duplicate therapy undetected failure case added — shows the cost of missing the Med review intercept.',
  },
  {
    number: '10',
    id: 'controller',
    title: 'Controller — Agentic Orchestration',
    phase: 'INTELLIGENCE',
    phaseColor: '#42be65',
    timing: '~150 seconds',
    narrative: [
      '"Same member. Same scenario. The orchestration layer is active."',
      'Watch the Controller cycle through five functions:',
      '• Sense & Understand — graph context assembled, journey position confirmed, SDOH profile loaded via graph traversal query (SDOH PROFILE DISCOVERED), channel history analyzed: IVR Day 1 · 2 phone attempts unanswered · Portal self-initiated Day 14 · Portal 2×/week Day 14–34. Person state: high engagement low fatigue.',
      '• Plan & Decompose — four primary conditions, constraint hierarchy established, caregiver and dependent threads in scope, duplicate therapy intercept queued',
      '• Decide & Orchestrate — querying Agent Marketplace, 9 agents matched, standard 4-agent response upgraded to 9-agent coalition. The two additions: SDOH-enriched navigation agent (transport barrier resolution) and Med review pharmacy safety agent (Lisinopril + Metformin intercept). 22 agents stood down — not relevant to this scenario.',
      '• Monitor & Adapt — watching open loops',
      '• Learn & Improve — pending resolution',
      '"The system queried a registry of 31 agents and selected exactly the 9 that match this context. That selectivity is what makes it intelligent."',
      'Walk the four operational agent panels — Care, Provider Enablement, Appeals, Financial Intelligence. Point to the governance intercept.',
      '"The system hit a governance boundary. Clinical necessity determination — above automated authority threshold. The agent held and routed to Dr. K. Patel with full context. It didn\'t guess. It didn\'t proceed. It escalated with everything the reviewer needs."',
      'Point to the Med review Intercept Modal — CONSENT.DOMAIN.BOUNDARY.002. Lisinopril (Bennett County Health · CVS) + Metformin (Bennett County Health · Walgreens). Risk grid: duplicate BP med, bleeding risk elevated. Resolution: prescriber alert dispatched to both. Martin Pharmacy Med review outreach BLOCKED — outside proxy consent scope.',
      'PROVIDER VALUE PROPOSITION — Click the Bennett County Health EHR endpoint: "Now watch what happens on the provider side. The system doesn\'t wait for Bennett County Health to pull a chart. It pushes a CDS Hook directly into his Epic workflow — appointment-booked trigger, FHIR R4 delivery, under 200 milliseconds. No manual assembly. No phone call. The brief is already in his chart before he opens the door."',
      'Walk the CDS Hook panel: "Duplicate therapy surfaced — Lisinopril and Metformin, same molecule, two active fills, A1C elevated 38 days. HbA1c care gap with 47 days remaining in the SD Medicaid quality window. Prior auth pre-approved — cardiac rehab ready to order. SDOH transport barrier — home lab kit already dispatched. Med review status — partial — consent expansion pending."',
      'Click SIMULATE DR. CHEN\'S RESPONSE: "Bennett County Health acknowledges in 8 minutes. Metformin discontinued in Epic. HbA1c lab ordered — home kit confirmed. Postpartum rehab referral placed with pre-auth attached. A1C monitoring scheduled — 7 days."',
      'When GRAPH UPDATED appears — the knowledge graph overlay fires automatically: "Watch the graph. The Bennett County Health node gains an ACKNOWLEDGED badge. The Metformin node gets a DISCONTINUED edge. HbA1c gets a LAB_ORDERED edge. Postpartum Rehab appears as a new node — referral placed, auth attached. The reasoning substrate updates in real time. The graph is not a visualization. It is a live record of what the system knows." Press ↓ to dismiss the overlay.',
      'Point to Active Outcome Tracking: "These are not closed threads. They are actively monitored open loops. If a condition fires, the agent re-activates. If a deadline approaches, it escalates. It doesn\'t need a human to notice. It will notice itself."',
    ],
    requirements: 'Statement 4 — orchestration intelligence, handoff coordination. Governance as in-loop not post-hoc. Human-in-the-loop by design. 9-agent coalition (not 8) — SDOH navigation agent + Med review pharmacy safety agent explicitly named. Channel behavioral evidence chain surfaced in Sense & Understand. Med review intercept modal with consent boundary detail. Provider value proposition: Bennett County Health Epic CDS Hook panel — CDS Hook fired status, duplicate therapy brief, context delivered checklist, SIMULATE DR. CHEN\'S RESPONSE walkthrough, graph overlay showing real-time node updates (stays until ↓ pressed). Bidirectional intelligence loop made tangible.',
  },
  {
    number: '11',
    id: 'signal-classification-beat',
    title: 'Signal Classification Beat',
    phase: 'INTELLIGENCE',
    phaseColor: '#42be65',
    timing: '~60 seconds',
    narrative: [
      '"Every signal the system receives is classified before any agent sees it."',
      'Walk the classification taxonomy — clinical signals, behavioral signals, SDOH signals, channel signals, governance signals.',
      'Point to the SDOH signal class: "Transport barrier is not a clinical signal. It is a social determinant signal. The system classifies it separately because it modifies clinical decisions — it doesn\'t trigger them. The home lab kit dispatch was not a clinical protocol. It was a SDOH-aware next-best action."',
      'Point to the channel signal class: "IVR Day 1, phone Day 8, phone Day 11, portal Day 14 — these are channel signals. The system classified the sequence as a behavioral preference pattern and promoted it to a governed constraint. Phone outreach is now suppressed for Maria — not because a human set a flag, but because the system derived the preference from the signal sequence."',
      '"Classification is not tagging. It is the first act of reasoning."',
    ],
    requirements: 'Statement 3 — signal capture and activation. SDOH signal class as modifier not trigger. Channel signal class as behavioral preference derivation. Bridges Intelligence phase to Resolution phase.',
  },

  // ── RESOLUTION PHASE ──────────────────────────────────────────────────────
  {
    number: '12',
    id: 'financial-intelligence',
    title: 'Financial Intelligence',
    phase: 'RESOLUTION',
    phaseColor: '#f59e0b',
    timing: '~75 seconds',
    narrative: [
      '"While the agents were coordinating the clinical picture — Maria had a question she hadn\'t asked yet."',
      'Point to benefits position, OOP progress, estimated cost $340–$480 for HbA1c lab order.',
      '"The system assembled her financial context before she called. Dr. Sarah Kim at Banner Heart Institute — in-network, accepting, 2.3 miles, next available in 3 days. Referral initiated. The answer is in her portal before the question is asked."',
      'Point to the Med review safety flag in the referral context: "Active safety flag — Med review duplicate therapy. Lisinopril + Metformin dual-prescriber conflict. Readmission risk modifier: +18%. Med review enrollment recommended before procedure scheduling." The financial picture is incomplete without the clinical safety picture. The system holds both simultaneously.',
    ],
    requirements: 'Statement 2 — engagement attributes, next-best experience. Statement 4 — product and service team coordination. Med review duplicate therapy active safety flag with +18% readmission risk modifier surfaced in financial context — all 7 screens now reflect the alert.',
  },
  {
    number: '13',
    id: 'family-sofia',
    title: 'Family · Sophia',
    phase: 'RESOLUTION',
    phaseColor: '#f59e0b',
    timing: '~60 seconds',
    narrative: [
      '"Maria has a 2-year-old daughter. The system already found her."',
      'Walk Sophia\'s six care gaps. Walk the orchestration response — Bennett County Health recommended, screening bundle created, combined outreach with Maria\'s cardiac update — one message.',
      '"The system doesn\'t just understand Maria. It understands everyone who depends on her."',
    ],
    requirements: 'Statement 1 — households, dependents. Statement 2 — relationship profiles.',
  },
  {
    number: '14',
    id: 'caregiver-elena',
    title: 'Caregiver · Elena',
    phase: 'RESOLUTION',
    phaseColor: '#f59e0b',
    timing: '~75 seconds',
    narrative: [
      '"Maria\'s mother Elena. Six medications. Lisinopril — high risk, A1C elevated 38 days. And now — a duplicate therapy alert."',
      'Point to the PRESCRIBER ALERTS panel: "Lisinopril (Bennett County Health · CVS) and Metformin (Bennett County Health · Walgreens) — same BP med mechanism, two prescribers unaware of each other. Alert dispatched to Bennett County Health. Alert dispatched to Bennett County Health. Both pending acknowledgment."',
      'Walk the three consent states. Land on the intercept:',
      '"The system didn\'t just verify Maria has proxy consent. It verified that this specific action — sharing Elena\'s medication list with a third party via Martin Pharmacy Med review outreach — falls outside the scope of that proxy consent. Martin Pharmacy domain requires separate consent. The Med review outreach is BLOCKED. The prescriber alerts are permitted — they are clinical safety communications, not third-party data sharing."',
      '"That distinction is the difference between compliance theater and compliance architecture."',
      'Point to PCP appointment in 7 days — medication review bundled into existing visit. No additional appointment needed.',
    ],
    requirements: 'Statement 1 — caregivers, proxies, delegates. Statement 2 — consent, privacy requirements. Governance at action level. Duplicate therapy alert fully detailed — Lisinopril + Metformin, prescriber alert dispatch status, Martin Pharmacy consent boundary distinction between clinical alerts (permitted) and Med review outreach (blocked).',
  },
  {
    number: '15',
    id: 'whole-person-care',
    title: 'Whole Person Care',
    phase: 'RESOLUTION',
    phaseColor: '#f59e0b',
    timing: '~75 seconds',
    narrative: [
      '"Every other screen showed what the system coordinates. This screen shows why the coordination will succeed."',
      'Walk SDOH five domains. Point to the SDOH PROFILE DISCOVERED label — this was not manually entered. The system executed a graph traversal query across social determinant nodes, identified the transport barrier pattern, and surfaced it as a care plan modifier.',
      'Point to the NEXT-BEST ACTION panel — standard clinic appointment blocked, home lab kit dispatched, copay assistance flagged, SNAP referral included.',
      '"A care plan that ignores Maria\'s transport barrier and financial pressure will fail regardless of how well it is orchestrated. The system doesn\'t just coordinate care. It coordinates care that will actually work."',
    ],
    requirements: 'Whole person care. SDOH as graph-discovered engagement intelligence — SDOH PROFILE DISCOVERED framing explicit. Next-best experience explicitly named.',
  },

  // ── IMPACT PHASE ──────────────────────────────────────────────────────────
  {
    number: '16',
    id: 'agent-impact',
    title: 'Agent Impact Dashboard',
    phase: 'IMPACT',
    phaseColor: '#c084fc',
    timing: '~90 seconds',
    narrative: [
      'BEAT 1 — Intervention timeline: "47 minutes. T+zero to resolution. Nine agents. Nine threads. 71 decisions logged. Nine of nine governance boundaries honored. One human review — Bennett County Health, clinical necessity, 68 hours remaining."',
      'Walk the intervention timeline — Signal Disposition at T+3, Financial Intelligence at T+15, Caregiver at T+19, Eligibility resolved at T+22, Med review Duplicate Therapy Flagged at T+44 (red — critical milestone), Appeal held at T+31, full scenario resolved T+47.',
      'Point to channel attribution badges on each thread: "Every thread shows which channel it was delivered through. Auth renewal — Portal (last-touch Day 34). HbA1c home kit — Portal. Caregiver Lisinopril alert — Prescriber direct (clinical safety channel, not member-facing). Med review intercept — Martin Pharmacy BLOCKED / Prescriber alert dispatched. Sophia outreach — Portal, bundled with Maria\'s update. Each thread carries its channel attribution. This is not a log. It is an audit trail."',
      'PRESS ↓ — BEAT 2 — KPIs and simulation: "Auth cycle time: 8.2 days to 0.3 days. 96% reduction. Readmission risk: protocol active, +18% modifier from duplicate therapy now under management. Care gap: tracked. Appeal: compliant."',
      'Click VIEW AGENT ORCHESTRATION FLOW — walk the modal briefly for technical stakeholders. Point to the H1ab push. Click SIMULATE SARAH\'S RESPONSE — Sarah opens her system at 9:55am, transport blocker flagged, duplicate therapy alert surfaced, confirms home kit approach, 10am outreach fires with barrier-aware script.',
      '"Sarah didn\'t receive an email. She opened her system and the brief was already there — including the duplicate therapy flag she had no visibility into before. She spent 90 seconds — not 45 minutes assembling context."',
      'Advance simulation to This Month — 23 readmissions prevented, $2.1M TCOC impact.',
    ],
    requirements: 'Statement 4 — handoff coordination, H1ab integration, augmentation not replacement. Full financial proof. Channel attribution badges per thread — each thread shows delivery channel. Med review Duplicate Therapy Flagged milestone at T+44. 9-agent coalition reflected in thread count and governance boundary count.',
  },
  {
    number: '17',
    id: 'portfolio-scale',
    title: 'Portfolio Scale',
    phase: 'IMPACT',
    phaseColor: '#c084fc',
    timing: '~90 seconds',
    narrative: [
      '"14,847 members like Maria in your population right now."',
      'Walk the exposure breakdown — $697 million in unmanaged cost at $47,000 per failed episode.',
      'MULTI-ENTITY ENTERPRISE VALUE — Point to the entity breakdown panel: "But the value is not just in the member population. It is in the asset base you already own. SD Medicaid: 124,847 members, $697M exposure. Bennett County Health: 8,293 providers in network — each one a Bennett County Health waiting for a CDS Hook that never arrived. Martin Pharmacy: 23,104 active pharmacy fills — the Lisinopril + Metformin duplicate therapy pattern is not unique to Maria. It is present in 847 member records in this population today. Bennett County Insight: the data infrastructure to see all of it — already built, already running, not yet connected."',
      'Let the three questions land:',
      '"How many Marias are in your population right now that your coordinators haven\'t found yet?"',
      '"What does a missed 72-hour SD Medicaid appeal window cost you — per member, per quarter?"',
      '"What happens to your Star Rating trajectory if you close 71% more care gaps — and your providers receive CDS Hooks instead of fax referrals?"',
      'Pause. Let them answer internally.',
      '"This system is running for all of them. Simultaneously. One orchestration layer watching every signal, acting within its authority, escalating when it shouldn\'t. Across SD Medicaid, Bennett County Health, Martin Pharmacy, and Bennett County Insight — as one system."',
    ],
    requirements: 'Enterprise scale proof. All four statements operating at population level. Multi-entity enterprise value panel: SD Medicaid member population, Bennett County Health provider network (CDS Hook delivery), Martin Pharmacy duplicate therapy prevalence (847 member records), Bennett County Insight data infrastructure. Positions the four Bennett County entities as a unified asset base — the system activates what already exists. Provider value proposition echoed at scale: Bennett County Health CDS Hook pattern × 8,293 providers.',
  },
  {
    number: '18',
    id: 'strategic-roadmap',
    title: 'Strategic Roadmap',
    phase: 'IMPACT',
    phaseColor: '#c084fc',
    timing: '~90 seconds',
    narrative: [
      'Walk three columns — Manual Coordination → Orchestration Foundation → Autonomous Health Plan.',
      '"The question isn\'t whether this is the direction. The question is whether you\'re on the path — or watching competitors get there first. While your teams are coordinating manually, a plan with this system has already resolved 847 scenarios like Maria\'s today."',
      'Point to Agent Marketplace — extensibility argument:',
      '"This is not a fixed system. It is a platform. New domain specialists can be registered and the Controller discovers them dynamically. The 9-agent coalition you saw today — SDOH navigation, Med review pharmacy safety, and seven others — was assembled in real time from a registry of 31. You are not buying a solution. You are acquiring a capability that grows with your organization."',
    ],
    requirements: 'Platform architecture argument. Positions across all four capability statements as a progressive maturity model. 9-agent coalition referenced as extensibility proof point.',
  },
  {
    number: '19',
    id: 'leave-behind',
    title: 'Leave Behind',
    phase: 'IMPACT',
    phaseColor: '#c084fc',
    timing: '~75 seconds',
    narrative: [
      '"Everything you\'ve seen is in this brief. Built for your next internal conversation."',
      'Point to QR code. Walk what\'s inside — burning platform data sourced to SD Medicaid and AHIP, three-phase roadmap, KPI projections tied to your 124,847-member population, $697M portfolio exposure, 90-day implementation path.',
      '"When your CFO asks about the numbers — they\'re in there, sourced. When your CTO asks about the architecture — it\'s in there. When your board asks about the competitive position — it\'s in there."',
      'LEAVE BEHIND IDEA 1 — CLOSING BEAT: "One more thing before you go. You\'ve seen what this system does for Maria. But I want to leave you with the provider side of that story. Bennett County Health spent 8 minutes acknowledging a CDS Hook that the system assembled and delivered in under 200 milliseconds. He discontinued a duplicate therapy, ordered a lab, and placed a referral — all from inside Epic, without a phone call, without a fax, without a care coordinator chasing him down. That is what vertical integration looks like when it actually works. UHG already owns the clinical network. The question is whether the network is connected — or just adjacent."',
      'Hold final beat: "Maria Redhawk is finally known. Bennett County Health finally has the context he needs. The question is how many Marias are waiting — and how many Bennett County Healths are still working blind."',
      'PAUSE. DO NOT FILL THE SILENCE. THE NEXT WORDS SHOULD BE THEIRS.',
    ],
    requirements: 'Closes all four capability statements. Leave Behind Idea 1 closing beat: provider-side CDS Hook story — Bennett County Health 8-minute acknowledgement, duplicate therapy discontinued, lab ordered, referral placed — all from Epic in under 200ms. Vertical integration framing: UHG owns the clinical network, the question is whether it is connected. Leaves the audience with both the human dimension (Maria) and the provider dimension (Bennett County Health) — not just the technology.',
  },

  // ── APPENDIX ──────────────────────────────────────────────────────────────
  {
    number: 'A1',
    id: 'agent-marketplace-query',
    title: 'Agent Marketplace Query',
    phase: 'APPENDIX',
    phaseColor: '#94a3b8',
    timing: 'as needed',
    narrative: [
      'USE WHEN ASKED: "How does the system know which agent to use?" or "How does the Controller select agents?"',
      '"The Controller doesn\'t hardcode agent assignments. It queries a live registry — the Agent Marketplace — every time a new scenario is assembled. Watch the query execute."',
      'Walk the query parameters: member context (Maria Redhawk, high-risk 7.8), active conditions (cardiac episode, HbA1c gap, CAREGAP_HBA1C expiring, caregiver proxy, SDOH transport barrier, duplicate therapy alert), governance constraints (Martin Pharmacy consent boundary, proxy consent scope), channel preference (portal self-initiated).',
      '"31 agents in the registry. The query returns 9 matches. 22 agents are stood down — not because they\'re inactive, but because they\'re not relevant to this specific context. That selectivity is what makes the coalition intelligent rather than exhaustive."',
      'Point to the two additions beyond the standard 7: "SDOH Navigation Agent — added because the graph traversal surfaced a transport barrier that blocks the standard HbA1c intervention. Med review Pharmacy Safety Agent — added because the duplicate therapy signal (Lisinopril + Metformin) requires a pharmacy domain specialist with Martin Pharmacy consent awareness."',
      '"The marketplace is extensible. New agents can be registered with their capability signatures, domain constraints, and governance rules. The Controller discovers them dynamically — no hardcoded routing tables, no manual configuration."',
      'Point to agent capability signatures — each agent declares what signals it responds to, what authority it operates within, and what escalation path it follows when it hits a governance boundary.',
    ],
    requirements: 'Addresses extensibility argument from Screen 18 (Strategic Roadmap). Shows 9-agent coalition assembly in detail. Demonstrates SDOH navigation agent and Med review pharmacy safety agent selection rationale. Supports platform architecture positioning.',
  },
  {
    number: 'A2',
    id: 'agent-library',
    title: 'Agent Library',
    phase: 'APPENDIX',
    phaseColor: '#94a3b8',
    timing: 'as needed',
    narrative: [
      'USE WHEN ASKED: "Can we add our own agents?" or "What agents are available today?" or "How do you govern what agents can do?"',
      '"This is the full 31-agent registry. Every agent the Controller can select from. Walk the domain columns — Care Management, Provider Enablement, Financial, Appeals & Compliance, SDOH, Pharmacy Safety, Behavioral, Caregiver, Employer."',
      'Point to SDOH Navigation Agent: "Added to the registry when the platform identified that transport barriers were silently failing standard care gap interventions. It carries three capability signatures: SDOH barrier detection, next-best action substitution (home lab kit for clinic appointment), and copay assistance routing. It cannot initiate clinical decisions — it can only modify the delivery method of an existing clinical decision."',
      'Point to Med review Pharmacy Safety Agent: "Registered with Martin Pharmacy domain awareness and consent boundary enforcement built in. It knows that Med review outreach requires a separate consent scope from proxy consent. It will dispatch prescriber alerts (clinical safety communications — permitted) and block Martin Pharmacy member outreach (third-party data sharing — requires separate consent) automatically."',
      '"Every agent in this library has three governance attributes: authority ceiling (what it can decide autonomously), escalation trigger (what causes it to hold and route to a human), and consent scope (what data it can access and share). The governance is not a policy document. It is executable code."',
      'Point to the extensibility row at the bottom: "Your organization can register domain-specific agents — employer wellness agents, specialty pharmacy agents, behavioral health agents — and the Controller will discover and select them using the same query mechanism. You are not locked into the 31 agents you see here."',
    ],
    requirements: 'Supports Statement 4 (orchestration intelligence) and platform extensibility argument. Governance-by-design architecture visible at agent level. SDOH and Med review agents detailed with authority ceilings and consent scope. Addresses "can we customize" objection.',
  },
  {
    number: 'A3',
    id: 'reporting-dashboard',
    title: 'Reporting Dashboard',
    phase: 'APPENDIX',
    phaseColor: '#94a3b8',
    timing: 'as needed',
    narrative: [
      'USE WHEN ASKED: "How do we measure this?" or "What does the audit trail look like?" or "How do we report on agent activity to compliance?"',
      '"The Reporting Dashboard is the enterprise visibility layer. Everything the orchestration system does is logged, attributed, and reportable. Walk the four panels."',
      'Point to Population Outcomes panel: "23 readmissions prevented this month. $2.1M TCOC impact. 847 scenarios resolved. 71% care gap closure rate — up from 34% baseline. These are not projections. They are outcomes from the current deployment period."',
      'Point to Agent Performance panel: "Each agent in the 31-agent registry has a performance record — activation count, resolution rate, escalation rate, average time to resolution. The Med review Pharmacy Safety Agent: 47 activations this month, 44 resolved autonomously, 3 escalated to clinical review. 0 consent boundary violations."',
      'Point to Channel Attribution Reporting: "Every outreach action is attributed to the channel it was delivered through and the behavioral signal that justified that channel selection. Maria\'s portal outreach — attributed to the channel history sequence (IVR Day 1, phone Day 8 and 11 unanswered, portal self-initiated Day 14). This is the audit trail that justifies the channel suppression decision."',
      'Point to Governance Audit Trail: "Every governance boundary hit is logged with the agent that hit it, the rule that triggered it, the human reviewer assigned, and the resolution. CONSENT.DOMAIN.BOUNDARY.002 — Med review outreach blocked, Martin Pharmacy consent scope, prescriber alerts permitted. Dr. K. Patel clinical necessity review — 68 hours remaining, full context packet attached. This is not a compliance report. It is a real-time governance ledger."',
      '"When your compliance team asks how you can prove the system honored consent boundaries — this is the answer. When your CFO asks how you can attribute the $2.1M TCOC impact to specific agent actions — this is the answer."',
    ],
    requirements: 'Addresses analytics, compliance reporting, and audit capability objections. Channel attribution reporting ties back to Screen 16 (Agent Impact Dashboard). Governance audit trail ties back to Screen 10 (Controller) consent boundary intercepts. Population outcomes tie back to Screen 17 (Portfolio Scale) projections.',
  },
];

// ─── HTML Template ─────────────────────────────────────────────────────────────

function buildHTMLDocument(): string {
  const phaseColors: Record<string, string> = {
    FOUNDATION: '#78a9ff',
    INTELLIGENCE: '#42be65',
    RESOLUTION: '#f59e0b',
    IMPACT: '#c084fc',
    APPENDIX: '#94a3b8',
  };

  const phaseSubtitles: Record<string, string> = {
    FOUNDATION: '"The Problem Is Bigger Than You Think" · Screens 1–6 · ~7 minutes',
    INTELLIGENCE: '"The System That Sees Everything" · Screens 7–11 · ~6 minutes',
    RESOLUTION: '"What the System Achieved" · Screens 12–15 · ~4 minutes',
    IMPACT: '"What It Achieved and What It Means" · Screens 16–19 · ~4 minutes',
  };

  let currentPhase = '';

  const screensHTML = TALK_TRACK_SCREENS.map((screen) => {
    let phaseHeader = '';
    if (screen.phase !== currentPhase) {
      currentPhase = screen.phase;
      const color = phaseColors[screen.phase] || '#94a3b8';

      // Special appendix phase header with page break
      if (screen.phase === 'APPENDIX') {
        phaseHeader = `
          <div style="page-break-before: always; padding-top: 8px;"></div>
          <div class="phase-header" style="border-left: 4px solid ${color}; background: ${color}12;">
            <div class="phase-label" style="color: ${color};">APPENDIX — DEEP-DIVE REFERENCE SCREENS</div>
            <div class="phase-subtitle">Not part of the main demo flow · Access via A key during presentation · Press ESC to return</div>
          </div>
        `;
      } else {
        phaseHeader = `
          <div class="phase-header" style="border-left: 4px solid ${color}; background: ${color}12;">
            <div class="phase-label" style="color: ${color};">${screen.phase} PHASE</div>
            <div class="phase-subtitle">${phaseSubtitles[screen.phase]}</div>
          </div>
        `;
      }
    }

    const narrativeHTML = screen.narrative
      .map((line) => `<p class="narrative-line">${line.replace(/"/g, '&ldquo;').replace(/"/g, '&rdquo;')}</p>`)
      .join('');

    const color = phaseColors[screen.phase] || '#94a3b8';

    return `
      ${phaseHeader}
      <div class="screen-block">
        <div class="screen-header">
          <div class="screen-number" style="background: ${color}20; color: ${color}; border: 1px solid ${color}40;">
            ${screen.number}
          </div>
          <div class="screen-title-group">
            <div class="screen-title">${screen.title}</div>
            <div class="screen-meta">
              <span class="phase-tag" style="color: ${color};">${screen.phase}</span>
              <span class="timing-tag">⏱ ${screen.timing}</span>
            </div>
          </div>
        </div>
        <div class="narrative-section">
          <div class="section-label">TALK TRACK</div>
          ${narrativeHTML}
        </div>
        <div class="requirements-section" style="border-left: 3px solid ${color}60; background: ${color}08;">
          <div class="section-label" style="color: ${color};">REQUIREMENTS ALIGNMENT</div>
          <p class="requirements-text">${screen.requirements}</p>
        </div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>UHG Orchestrate — Demo Talk Track</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      background: #ffffff;
      color: #1a1a1a;
      font-size: 11pt;
      line-height: 1.6;
    }

    /* Cover page */
    .cover {
      page-break-after: always;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      padding: 80px 72px;
      background: #0f1117;
      color: white;
    }

    .cover-eyebrow {
      font-family: 'Courier New', monospace;
      font-size: 9pt;
      letter-spacing: 0.22em;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 24px;
    }

    .cover-title {
      font-size: 42pt;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.02em;
      line-height: 1.1;
      margin-bottom: 16px;
    }

    .cover-subtitle {
      font-size: 18pt;
      color: #78a9ff;
      font-weight: 400;
      margin-bottom: 48px;
    }

    .cover-divider {
      width: 64px;
      height: 3px;
      background: #002677;
      margin-bottom: 40px;
    }

    .cover-meta {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .cover-meta-row {
      display: flex;
      gap: 32px;
    }

    .cover-meta-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .cover-meta-label {
      font-family: 'Courier New', monospace;
      font-size: 8pt;
      letter-spacing: 0.14em;
      color: #6b7280;
      text-transform: uppercase;
    }

    .cover-meta-value {
      font-size: 11pt;
      color: #d1d5db;
    }

    .cover-footer {
      position: absolute;
      bottom: 48px;
      left: 72px;
      right: 72px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .cover-footer-brand {
      font-family: 'Courier New', monospace;
      font-size: 9pt;
      color: #374151;
      letter-spacing: 0.12em;
    }

    .cover-footer-conf {
      font-family: 'Courier New', monospace;
      font-size: 8pt;
      color: #374151;
      letter-spacing: 0.1em;
    }

    /* TOC page */
    .toc-page {
      page-break-after: always;
      padding: 56px 72px;
    }

    .toc-title {
      font-size: 22pt;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 8px;
    }

    .toc-subtitle {
      font-size: 11pt;
      color: #6b7280;
      margin-bottom: 40px;
    }

    .toc-phase {
      margin-bottom: 28px;
    }

    .toc-phase-header {
      font-family: 'Courier New', monospace;
      font-size: 8pt;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      padding: 8px 12px;
      margin-bottom: 8px;
      border-radius: 4px;
    }

    .toc-row {
      display: flex;
      align-items: baseline;
      gap: 12px;
      padding: 6px 12px;
      border-bottom: 1px solid #f3f4f6;
    }

    .toc-num {
      font-family: 'Courier New', monospace;
      font-size: 9pt;
      color: #9ca3af;
      min-width: 28px;
    }

    .toc-screen-title {
      font-size: 11pt;
      color: #1a1a1a;
      flex: 1;
    }

    .toc-timing {
      font-family: 'Courier New', monospace;
      font-size: 9pt;
      color: #9ca3af;
    }

    /* Main content */
    .content {
      padding: 48px 72px;
    }

    .phase-header {
      padding: 16px 20px;
      margin: 40px 0 24px 0;
      border-radius: 6px;
    }

    .phase-label {
      font-family: 'Courier New', monospace;
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .phase-subtitle {
      font-size: 11pt;
      color: #4b5563;
      font-style: italic;
    }

    .screen-block {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }

    .screen-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 16px;
    }

    .screen-number {
      font-family: 'Courier New', monospace;
      font-size: 13pt;
      font-weight: 700;
      padding: 6px 12px;
      border-radius: 6px;
      min-width: 52px;
      text-align: center;
      flex-shrink: 0;
    }

    .screen-title-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-top: 4px;
    }

    .screen-title {
      font-size: 16pt;
      font-weight: 700;
      color: #111827;
      letter-spacing: -0.01em;
    }

    .screen-meta {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .phase-tag {
      font-family: 'Courier New', monospace;
      font-size: 8pt;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .timing-tag {
      font-family: 'Courier New', monospace;
      font-size: 9pt;
      color: #6b7280;
    }

    .narrative-section {
      margin-bottom: 14px;
    }

    .section-label {
      font-family: 'Courier New', monospace;
      font-size: 7.5pt;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #9ca3af;
      margin-bottom: 10px;
    }

    .narrative-line {
      font-size: 10.5pt;
      color: #374151;
      line-height: 1.7;
      margin-bottom: 8px;
      padding-left: 12px;
      border-left: 2px solid #e5e7eb;
    }

    .requirements-section {
      padding: 12px 16px;
      border-radius: 4px;
      margin-top: 12px;
    }

    .requirements-text {
      font-size: 10pt;
      color: #4b5563;
      line-height: 1.6;
      font-style: italic;
    }

    /* Appendix note */
    .appendix-note {
      margin-top: 48px;
      padding: 20px 24px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }

    .appendix-note-title {
      font-size: 13pt;
      font-weight: 700;
      color: #111827;
      margin-bottom: 8px;
    }

    .appendix-note-desc {
      font-size: 10pt;
      color: #6b7280;
      line-height: 1.6;
      margin-bottom: 16px;
    }

    .appendix-item {
      display: flex;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid #f3f4f6;
    }

    .appendix-item-label {
      font-family: 'Courier New', monospace;
      font-size: 9pt;
      font-weight: 700;
      min-width: 80px;
      color: #374151;
    }

    .appendix-item-desc {
      font-size: 10pt;
      color: #6b7280;
    }

    /* Timing summary */
    .timing-summary {
      margin-top: 48px;
      page-break-before: always;
      padding: 48px 72px;
    }

    .timing-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }

    .timing-table th {
      font-family: 'Courier New', monospace;
      font-size: 8pt;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #9ca3af;
      text-align: left;
      padding: 8px 12px;
      border-bottom: 2px solid #e5e7eb;
    }

    .timing-table td {
      font-size: 10pt;
      color: #374151;
      padding: 10px 12px;
      border-bottom: 1px solid #f3f4f6;
    }

    .timing-table tr:last-child td {
      border-bottom: none;
      font-weight: 700;
      color: #111827;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .cover { min-height: 100vh; }
      .screen-block { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

  <!-- Cover Page -->
  <div class="cover" style="position: relative;">
    <div class="cover-eyebrow">UnitedHealth Group · Confidential</div>
    <div class="cover-title">Demo Talk Track</div>
    <div class="cover-subtitle">UHG Orchestrate — Full Presenter Guide</div>
    <div class="cover-divider"></div>
    <div class="cover-meta">
      <div class="cover-meta-row">
        <div class="cover-meta-item">
          <div class="cover-meta-label">Total Screens</div>
          <div class="cover-meta-value">19 main screens + 3 appendix (A1–A3)</div>
        </div>
        <div class="cover-meta-item">
          <div class="cover-meta-label">Target Duration</div>
          <div class="cover-meta-value">~21 minutes</div>
        </div>
        <div class="cover-meta-item">
          <div class="cover-meta-label">Phases</div>
          <div class="cover-meta-value">Foundation · Intelligence · Resolution · Impact</div>
        </div>
      </div>
      <div class="cover-meta-row" style="margin-top: 16px;">
        <div class="cover-meta-item">
          <div class="cover-meta-label">Primary Member</div>
          <div class="cover-meta-value">Maria Redhawk — Age 58 · High-Risk Score 7.8</div>
        </div>
        <div class="cover-meta-item">
          <div class="cover-meta-label">Agent Coalition</div>
          <div class="cover-meta-value">9-Agent Coalition · 31-Agent Registry · SDOH + Med review Pharmacy Safety</div>
        </div>
      </div>
      <div class="cover-meta-row" style="margin-top: 16px;">
        <div class="cover-meta-item">
          <div class="cover-meta-label">Key Features</div>
          <div class="cover-meta-value">Channel History Timeline · SDOH Graph Discovery · Duplicate Therapy Alert (7 screens) · Channel Attribution per Thread</div>
        </div>
        <div class="cover-meta-item">
          <div class="cover-meta-label">Requirements Coverage</div>
          <div class="cover-meta-value">Statements 1–4 · All four capability areas</div>
        </div>
      </div>
    </div>
    <div class="cover-footer">
      <div class="cover-footer-brand">UNITEDHEALTH GROUP · ORCHESTRATE</div>
      <div class="cover-footer-conf">CONFIDENTIAL — INTERNAL USE ONLY</div>
    </div>
  </div>

  <!-- Table of Contents -->
  <div class="toc-page">
    <div class="toc-title">Table of Contents</div>
    <div class="toc-subtitle">19 screens · 4 phases · ~21 minutes</div>

    <div class="toc-phase">
      <div class="toc-phase-header" style="background: #78a9ff12; color: #78a9ff;">
        FOUNDATION PHASE — "The Problem Is Bigger Than You Think" · Screens 1–6 · ~7 min
      </div>
      ${[
        ['01', 'Burning Platform', '~90s'],
        ['02', 'Enterprise Scale', '~75s'],
        ['03', 'Fragmentation — 4-Layer Reveal', '~135s'],
        ['04', 'CDP Assembly', '~75s'],
        ['05', 'Maria Subgraph Context', '~90s'],
        ['06', 'Consumer 360 + Journey Map', '~90s'],
      ].map(([n, t, d]) => `
        <div class="toc-row">
          <span class="toc-num">${n}</span>
          <span class="toc-screen-title">${t}</span>
          <span class="toc-timing">${d}</span>
        </div>
      `).join('')}
    </div>

    <div class="toc-phase">
      <div class="toc-phase-header" style="background: #42be6512; color: #42be65;">
        INTELLIGENCE PHASE — "The System That Sees Everything" · Screens 7–11 · ~6 min
      </div>
      ${[
        ['07', 'Enterprise Population', '~75s'],
        ['08', 'Signal Disposition Engine', '~90s'],
        ['09', 'Maria Counterfactual', '~90s'],
        ['10', 'Controller — Agentic Orchestration', '~150s'],
        ['11', 'Signal Classification Beat', '~60s'],
      ].map(([n, t, d]) => `
        <div class="toc-row">
          <span class="toc-num">${n}</span>
          <span class="toc-screen-title">${t}</span>
          <span class="toc-timing">${d}</span>
        </div>
      `).join('')}
    </div>

    <div class="toc-phase">
      <div class="toc-phase-header" style="background: #f59e0b12; color: #f59e0b;">
        RESOLUTION PHASE — "What the System Achieved" · Screens 12–15 · ~4 min
      </div>
      ${[
        ['12', 'Financial Intelligence', '~75s'],
        ['13', 'Family · Sophia', '~60s'],
        ['14', 'Caregiver · Elena', '~75s'],
        ['15', 'Whole Person Care', '~75s'],
      ].map(([n, t, d]) => `
        <div class="toc-row">
          <span class="toc-num">${n}</span>
          <span class="toc-screen-title">${t}</span>
          <span class="toc-timing">${d}</span>
        </div>
      `).join('')}
    </div>

    <div class="toc-phase">
      <div class="toc-phase-header" style="background: #c084fc12; color: #c084fc;">
        IMPACT PHASE — "What It Achieved and What It Means" · Screens 16–19 · ~4 min
      </div>
      ${[
        ['16', 'Agent Impact Dashboard', '~90s'],
        ['17', 'Portfolio Scale', '~90s'],
        ['18', 'Strategic Roadmap', '~90s'],
        ['19', 'Leave Behind', '~75s'],
      ].map(([n, t, d]) => `
        <div class="toc-row">
          <span class="toc-num">${n}</span>
          <span class="toc-screen-title">${t}</span>
          <span class="toc-timing">${d}</span>
        </div>
      `).join('')}
    </div>

    <div class="toc-phase" style="margin-top: 32px;">
      <div class="toc-phase-header" style="background: #94a3b812; color: #94a3b8;">
        APPENDIX — Deep-Dive Reference Screens · Available on Request · Press A key during demo
      </div>
      ${[
        ['A1', 'Agent Marketplace Query', 'as needed'],
        ['A2', 'Agent Library', 'as needed'],
        ['A3', 'Reporting Dashboard', 'as needed'],
      ].map(([n, t, d]) => `
        <div class="toc-row">
          <span class="toc-num" style="color: #94a3b8;">${n}</span>
          <span class="toc-screen-title">${t}</span>
          <span class="toc-timing">${d}</span>
        </div>
      `).join('')}
    </div>

    <div style="margin-top: 20px; padding: 16px 20px; background: #42be6508; border-radius: 6px; border: 1px solid #42be6530;">
      <div style="font-family: 'Courier New', monospace; font-size: 8pt; letter-spacing: 0.14em; color: #42be65; text-transform: uppercase; margin-bottom: 8px;">KEY DEMO ADDITIONS — v3 SYNC</div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div style="font-size: 9.5pt; color: #374151;">✦ <strong>Provider Value Proposition</strong> — Bennett County Health Epic CDS Hook panel + graph overlay: CDS Hook fired, duplicate therapy brief, 5-item context checklist, SIMULATE DR. CHEN'S RESPONSE, graph overlay stays until ↓ pressed (Screen 10)</div>
        <div style="font-size: 9.5pt; color: #374151;">✦ <strong>Leave Behind Idea 1 Closing Beat</strong> — provider-side CDS Hook story: Bennett County Health 8-min acknowledgement, vertical integration framing, dual human dimension (Maria + Bennett County Health) (Screen 19)</div>
        <div style="font-size: 9.5pt; color: #374151;">✦ <strong>CDP Assembly Bennett County Entity Naming</strong> — four source schemas explicit: SD Medicaid claims, Bennett County Health clinical, Martin Pharmacy pharmacy, Bennett County Insight behavioral → canonical CDP (Screen 04)</div>
        <div style="font-size: 9.5pt; color: #374151;">✦ <strong>Fragmentation 4-Layer Reframe</strong> — internal UHG/Bennett County fragmentation first (Layer 1: SD Medicaid/Bennett County Health/Martin Pharmacy/Bennett County Insight), then member-facing, persona, missing checklist (Screen 03)</div>
        <div style="font-size: 9.5pt; color: #374151;">✦ <strong>Burning Platform Vertical Integration</strong> — UHG asset ownership framing: Bennett County Health, Martin Pharmacy, Bennett County Insight, SD Medicaid — assets exist, integration does not (Screen 01)</div>
        <div style="font-size: 9.5pt; color: #374151;">✦ <strong>Portfolio Scale Multi-Entity Enterprise Value</strong> — SD Medicaid member exposure + Bennett County Health provider CDS Hook gap + Martin Pharmacy 847 duplicate therapy records + Bennett County Insight data infrastructure (Screen 17)</div>
        <div style="font-size: 9.5pt; color: #374151;">✦ <strong>9-Agent Coalition</strong> — SDOH navigation agent + Med review pharmacy safety agent added to standard 7 (Screens 10, 16, 18)</div>
        <div style="font-size: 9.5pt; color: #374151;">✦ <strong>Channel History Timeline</strong> — IVR→Phone→Portal behavioral sequence, 7 events, scrollable (Screen 06)</div>
        <div style="font-size: 9.5pt; color: #374151;">✦ <strong>SDOH PROFILE DISCOVERED</strong> — graph traversal query framing, not manual entry (Screens 05, 10, 15)</div>
        <div style="font-size: 9.5pt; color: #374151;">✦ <strong>Duplicate Therapy Alert</strong> — Lisinopril + Metformin across all 7 screens: Consumer 360, Signal Disposition, Controller, Agent Impact, Caregiver Elena, OrchestrationFlowModal, Financial Intelligence</div>
        <div style="font-size: 9.5pt; color: #374151;">✦ <strong>Channel Attribution per Thread</strong> — each Agent Impact thread carries last-touch channel badge (Screen 16)</div>
        <div style="font-size: 9.5pt; color: #374151;">✦ <strong>Channel Column in Signal Disposition</strong> — last-touch channel per signal row (Screen 08)</div>
        <div style="font-size: 9.5pt; color: #374151;">✦ <strong>CHANNEL_HISTORY node</strong> — first-class graph entity in Enterprise Population (Screen 07)</div>
        <div style="font-size: 9.5pt; color: #374151;">✦ <strong>Signal Classification Beat</strong> — new Screen 11 bridging Intelligence → Resolution phases</div>
      </div>
    </div>
  </div>

  <!-- Main Talk Track Content -->
  <div class="content">
    ${screensHTML}
  </div>

  <!-- Timing Summary -->
  <div class="timing-summary">
    <div style="font-size: 18pt; font-weight: 700; color: #111827; margin-bottom: 8px;">Timing Summary</div>
    <div style="font-size: 11pt; color: #6b7280; margin-bottom: 4px;">Target: 21 minutes · Leave Behind is presenter-driven, not timed</div>
    <table class="timing-table">
      <thead>
        <tr>
          <th>Phase</th>
          <th>Screens</th>
          <th>Target Time</th>
          <th>Avg per Screen</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="color: #78a9ff; font-weight: 600;">Foundation</td>
          <td>1–6</td>
          <td>~7 minutes</td>
          <td>~70 seconds</td>
        </tr>
        <tr>
          <td style="color: #42be65; font-weight: 600;">Intelligence</td>
          <td>7–11</td>
          <td>~6 minutes</td>
          <td>~72 seconds</td>
        </tr>
        <tr>
          <td style="color: #f59e0b; font-weight: 600;">Resolution</td>
          <td>12–15</td>
          <td>~4 minutes</td>
          <td>~68 seconds</td>
        </tr>
        <tr>
          <td style="color: #c084fc; font-weight: 600;">Impact</td>
          <td>16–19</td>
          <td>~4 minutes</td>
          <td>~75 seconds</td>
        </tr>
        <tr>
          <td><strong>Total</strong></td>
          <td><strong>19 screens</strong></td>
          <td><strong>~21 minutes</strong></td>
          <td><strong>~66 seconds avg</strong></td>
        </tr>
      </tbody>
    </table>

    <div style="margin-top: 40px; padding: 20px 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
      <div style="font-size: 12pt; font-weight: 700; color: #111827; margin-bottom: 8px;">Requirements Coverage Summary</div>
      <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 12px;">
        <div style="display: flex; gap: 12px; align-items: flex-start;">
          <div style="font-family: 'Courier New', monospace; font-size: 8pt; color: #6b7280; min-width: 100px; padding-top: 2px;">STATEMENT 1</div>
          <div style="font-size: 10pt; color: #374151;">Identity resolution across members, patients, consumers, households, caregivers, delegates, proxies — employer, payer, pharmacy, care delivery touchpoints. Covered in Screens 3, 4, 5, 13, 14.</div>
        </div>
        <div style="display: flex; gap: 12px; align-items: flex-start;">
          <div style="font-family: 'Courier New', monospace; font-size: 8pt; color: #6b7280; min-width: 100px; padding-top: 2px;">STATEMENT 2</div>
          <div style="font-size: 10pt; color: #374151;">Trusted profiles with relationships, lifecycle context, preferences, consent, communication permissions, engagement attributes. Covered in Screens 5, 6, 14. Channel History Timeline (Screen 06) as behavioral preference derivation.</div>
        </div>
        <div style="display: flex; gap: 12px; align-items: flex-start;">
          <div style="font-family: 'Courier New', monospace; font-size: 8pt; color: #6b7280; min-width: 100px; padding-top: 2px;">STATEMENT 3</div>
          <div style="font-size: 10pt; color: #374151;">Capture, normalize, and activate CDP events from products, channels, service interactions, care journeys, clinical touchpoints, partner platforms. Covered in Screens 4, 7, 8, 11. CHANNEL_HISTORY as first-class graph node (Screen 07).</div>
        </div>
        <div style="display: flex; gap: 12px; align-items: flex-start;">
          <div style="font-family: 'Courier New', monospace; font-size: 8pt; color: #6b7280; min-width: 100px; padding-top: 2px;">STATEMENT 4</div>
          <div style="font-size: 10pt; color: #374151;">Orchestration and engagement intelligence — coordinate handoffs, avoid conflicting outreach, deliver next-best experiences. Covered in Screens 8, 10, 15, 16. 9-agent coalition with channel attribution per thread (Screen 16).</div>
        </div>
      </div>
    </div>
  </div>

</body>
</html>`;
}

// ─── Download Function ─────────────────────────────────────────────────────────

export function downloadTalkTrackPDF(): void {
  const html = buildHTMLDocument();
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  // Open in new window and trigger print dialog (browser saves as PDF)
  const printWindow = window.open(url, '_blank', 'width=900,height=700');
  if (!printWindow) {
    // Fallback: direct download as HTML if popup blocked
    const a = document.createElement('a');
    a.href = url;
    a.download = 'UHG-Orchestrate-Demo-Talk-Track.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      // Clean up blob URL after print dialog closes
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }, 500);
  };
}
