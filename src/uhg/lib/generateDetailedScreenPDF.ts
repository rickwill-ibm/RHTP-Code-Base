'use client';

// ─── Detailed Screen PDF Generator ────────────────────────────────────────────
// Generates a comprehensive PDF document with the same level of storytelling
// and technical detail as the CDP Assembly and Maria Subgraph write-ups —
// covering every screen in correct demo sequencing order.
// Each screen section includes: narrative story, technical mechanics,
// key talking points, and closing argument.
// Uses browser print-to-PDF via hidden window — no external library required.

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ScreenDetail {
  number: string;
  title: string;
  phase: string;
  phaseColor: string;
  timing: string;
  story: string;
  acts: Act[];
  closingArgument: string;
}

interface Act {
  title: string;
  body: string[];
  code?: string;
}

// ─── Screen Detail Data ────────────────────────────────────────────────────────

const DETAILED_SCREENS: ScreenDetail[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // FOUNDATION PHASE
  // ══════════════════════════════════════════════════════════════════════════

  {
    number: '01',
    title: 'Burning Platform',
    phase: 'FOUNDATION',
    phaseColor: '#78a9ff',
    timing: '~90 seconds',
    story: `The Burning Platform screen exists to answer the question every executive in the room is silently asking before you begin: "Why does this matter to me, right now, this quarter?" It does not answer that question with a slide deck. It answers it with four numbers — each one a direct line from operational reality to financial consequence. Before Maria exists, before the agents activate, before the graph is populated — the audience must feel the weight of the problem the platform is designed to solve.`,
    acts: [
      {
        title: 'Act 1 — The Four Pressure Lines',
        body: [
          'The screen opens with four metrics that land in sequence, each with a deliberate delay. The sequencing is intentional: the audience reads one, absorbs it, and then the next arrives before they can look away.',
          '4.0 → 3.5 — SD Medicaid Star Rating trajectory for plans with manual care coordination. This is not a projection. It is the documented outcome for plans that have not automated coordination at scale. A half-star decline in SD Medicaid ratings is not an abstract quality metric — it is a direct driver of Dual-eligible plan attractiveness, member retention, and benchmark payment rates. The audience knows this.',
          '83.0% — Current TCOC. Plans at 80.0% face rebate obligations to consumers. Three percentage points of margin separating current performance from a mandatory consumer rebate. In a $300B revenue organisation, each percentage point of TCOC represents approximately $3B in cost. The number is not alarming on its own — it is alarming because of how close it sits to the rebate threshold.',
          '72 hours — SD Medicaid prior auth reform mandate, effective January 2026. Not optional. Not a pilot. A federal mandate with a hard deadline. Every organisation in the room is already working on compliance. The question is whether they are building a point solution for the mandate or a coordination capability that makes the mandate irrelevant.',
          '$47,000 — Average additional episode cost when care coordination fails for a complex member. Not a worst-case scenario. The median. This is the number that converts the quality argument into a finance argument. Every failed coordination event has a dollar value attached to it — and the system is designed to prevent it.',
        ],
      },
      {
        title: 'Act 2 — The Vertical Integration Argument',
        body: [
          'After the four pressure lines land, the screen transitions to the asset argument. This is the pivot that separates this platform from every other care coordination pitch the audience has heard.',
          'UnitedHealth Group is the only organisation in the US healthcare system that simultaneously owns the payer (SD Medicaid), the clinical delivery network (Bennett County Health), the pharmacy benefit manager (Martin Pharmacy), the health IT and transaction infrastructure (CBO / Social Services), and the digital engagement layer (RHTP Care Management). No competitor has this.',
          'The five entities are displayed as a vertical stack — each with its domain descriptor. The visual makes the argument without words: every layer of the health economy, owned by one organisation, operating as five separate organisations.',
          'SD Medicaid — Insurance, Benefits, Authorization, Claims. The financial and administrative layer.',
          'Bennett County Health — Direct Care Delivery, Clinics, Home Care. The clinical delivery layer.',
          'Martin Pharmacy — Pharmacy Benefit Management, Formulary, Med review. The pharmacy layer.',
          'CBO / Social Services — Health IT, 15B+ Annual Transactions, Payment Rail. The transaction infrastructure layer.',
          'RHTP Care Management — Digital Engagement, Member Behavior, Channel Signal. The behavioral intelligence layer.',
          'The fragmentation described in the four pressure lines is therefore not just a problem — it is a strategic paradox. The organisation most capable of solving healthcare fragmentation is currently experiencing it internally at maximum intensity. The assets exist. The integration does not.',
        ],
      },
      {
        title: 'Act 3 — The Closing Statement',
        body: [
          'The screen closes with a single positioning statement: "The plans gaining ground have stopped treating coordination as an operational problem and started treating it as a strategic capability."',
          'This line does two things simultaneously. It validates the urgency (competitors are already moving) and it reframes the solution (not a technology purchase — a strategic capability acquisition). The audience is now primed to see the demo not as a product demonstration but as a capability preview.',
          'The subtext is explicit: "What you are about to see is what your organisation becomes when every signal is heard, every constraint is honored, and every member is finally known — across every Bennett County and SD Medicaid entity simultaneously."',
        ],
      },
    ],
    closingArgument: '"The four numbers on this screen are not projections. They are the documented operational reality of plans that have not yet built what you are about to see. The assets to solve this already exist inside this organisation. The question is whether they are connected — or just adjacent."',
  },

  {
    number: '02',
    title: 'Enterprise Scale — Consumer 360 Population View',
    phase: 'FOUNDATION',
    phaseColor: '#78a9ff',
    timing: '~75 seconds',
    story: `Before Maria is introduced, the audience needs to understand the scale at which the platform operates. The Enterprise Scale screen establishes that this is not a pilot, not a proof of concept, and not a single-member demonstration. It is a live population intelligence layer operating across 124,847 members simultaneously. Maria is one of them — and the system already knows she is the most important one to act on right now.`,
    acts: [
      {
        title: 'Act 1 — The Population Numbers',
        body: [
          '124,847 members. 8,293 providers. 47,291 active care episodes. 23,104 open authorizations — displayed in amber because every one is a decision waiting, a member waiting, a cost accumulating. 4,847 employer groups.',
          'The numbers are not chosen arbitrarily. They represent a realistic mid-market health plan population — large enough to be credible, specific enough to feel real. The amber color on the authorization count is deliberate: it signals urgency without requiring explanation.',
          'The key line: "Every one of these numbers represents a person. Right now, your systems cannot agree on who they are." This reframes the scale argument from a technology capability claim into a human consequence statement.',
        ],
      },
      {
        title: 'Act 2 — The Introduction of Maria',
        body: [
          'The transition from population to individual is the most important moment in the Foundation phase. The screen introduces Maria Redhawk — Age 58, High-Risk Score 7.8 — as the proof point for everything that follows.',
          'The framing is precise: "One of those 124,847 members is Maria Redhawk. She is the proof of what this system can do." This establishes Maria not as a fictional demo persona but as a representative member — the kind of high-risk, complex member that exists in every population at this scale.',
          'The risk score of 7.8 out of 10 is significant. It places Maria in the top 5% of the population by risk — the cohort where cost concentrates, where coordination failures are most expensive, and where the platform\'s intervention capability has the highest return.',
        ],
      },
      {
        title: 'Act 3 — The Signal Stream',
        body: [
          'The population view shows a live signal stream — IVR touches, call center closures, clinical events, behavioral signals — all normalized into one stream from SD Medicaid, Bennett County, and RHTP Care Management. The variety of signal types is visible: not just clinical events, but behavioral signals, channel interactions, and administrative events.',
          'The disposition events visible in the stream — SUPPRESSED, DELAYED, DEPRIORITIZED — establish immediately that the system is not acting on everything. It is deciding what deserves a response, in what order, and what should never surface at all. That judgment, at this scale, is the difference between intelligence and noise.',
        ],
      },
    ],
    closingArgument: '"124,847 members. The system is watching all of them. It has already identified which ones need action today, in what order, through which channel, and with what authority. Maria is the one we are going to follow."',
  },

  {
    number: '03',
    title: 'Fragmentation — The Four-Layer Reveal',
    phase: 'FOUNDATION',
    phaseColor: '#78a9ff',
    timing: '~135 seconds',
    story: `Before you can show what the platform does, you have to make the audience feel the weight of what it is replacing. The Fragmentation screen exists for one reason: to make the problem visceral. Not abstract. Not a slide with four bullet points. A lived operational reality that every person in the room recognises — because they have been inside it for years. The four-layer reveal is structured as a progressive disclosure: each layer adds a new dimension of the problem until the full weight of the fragmentation is visible.`,
    acts: [
      {
        title: 'Act 1 — Layer 1: Internal Enterprise Fragmentation',
        body: [
          'The first layer is the one no one talks about publicly but everyone in the room knows is real: the fragmentation is not just between UHG and the outside world. It is inside the organisation itself.',
          'UHG and Bennett County operate across four major entities that touch every member: SD Medicaid (payer), Bennett County Health (clinical delivery), Martin Pharmacy (pharmacy benefit), and Bennett County Insight (data and analytics). These four entities each hold a piece of every member\'s story. And right now — they cannot agree on who that member is.',
          'The same person appears in four systems with four different identifiers, four different consent records, and four different care plans. The fragmentation problem is not just external. It starts here.',
          'This layer lands differently than any external fragmentation argument because it names the internal reality. The audience is not being told their vendors are fragmented. They are being told their own organisation is fragmented — and that the platform is designed to solve that first.',
        ],
      },
      {
        title: 'Act 2 — Layer 2: Member-Facing Six-System Fragmentation',
        body: [
          'The second layer shows what Maria looks like to the organisation today. Six systems. Six versions of Maria. Zero coordination.',
          'Claims sees cost trajectory. EHR sees clinical record. Auth sees a pending request. Care Management has a 45-day-old care plan. H1ab has Sarah Johnson working from stale context. And the employer — SD Medicaid — has a wellness program about to send Maria an outreach that conflicts with everything the clinical team is already doing.',
          'None of them know what the others are doing. The employer touchpoint is particularly important: it establishes that the fragmentation extends beyond the clinical and administrative systems into the plan sponsor relationship — a dimension that most care coordination platforms ignore entirely.',
          'The six systems are displayed as a grid, each with what it knows and what it is blind to. The "blind to" column is the argument: every system has a critical gap that another system could fill — if they were connected.',
        ],
      },
      {
        title: 'Act 3 — Layer 3: Persona Fragmentation',
        body: [
          'The third layer goes deeper than data. No system understands Maria\'s roles, her personas, her relationships, or how those roles change across contexts.',
          'Maria is simultaneously a patient — cardiac episode, diabetes management, auth expiring. A caregiver — managing Elena\'s six medications, proxy consent in play. A parent — Sophia has no pediatrician, five care gaps open.',
          'Each role exists in a different system. None aware of the others. The EHR knows the patient. The enrollment system knows the parent. No system knows the caregiver. And no system holds all three simultaneously.',
          'This layer establishes the knowledge graph argument before the knowledge graph is shown. The audience now understands why a relational database is insufficient — the relationships between roles are the data, and no relational schema can hold them.',
        ],
      },
      {
        title: 'Act 4 — Layer 4: The Missing Checklist',
        body: [
          'The fourth layer is the most damaging: a checklist of what is missing across all six systems about one person.',
          'Identity unresolved — four conflicting records, no single source of truth. Consent unknown in three of six systems. Relationships — Sophia and Elena — invisible. Preferences unknown outside CRM. Caregiver proxy — no system aware Maria has legal proxy for Elena. Journey context — no system knows she is on Day 34 of a cardiac episode. Roles — patient, caregiver, parent — never held simultaneously.',
          'The checklist format is deliberate. It is not a narrative. It is an audit. Each item is a gap that the platform closes — and the audience can map each gap to a capability they are about to see demonstrated.',
        ],
      },
      {
        title: 'Act 5 — The Closing Beat',
        body: [
          'The closing beat names the paradox explicitly: "There is no enterprise identity graph. Only disconnected records of a person no system fully knows. And the irony: UHG already owns the clinical network, the pharmacy benefit, and the data infrastructure to solve this. The assets exist. The integration does not."',
          'This line is the bridge to the CDP Assembly screen. The audience now understands that the solution is not about acquiring new capabilities — it is about connecting the ones that already exist.',
        ],
      },
    ],
    closingArgument: '"Everything you just saw is a consequence of the same root condition — systems that hold pieces of the same member\'s story but have never been asked to share them in real time. Before any agent can act intelligently — the system must first know who it is acting for."',
  },

  {
    number: '04',
    title: 'CDP Assembly — The Unknown-to-Known Resolution',
    phase: 'FOUNDATION',
    phaseColor: '#78a9ff',
    timing: '~75 seconds',
    story: `Maria arrives at the RHTP Care Management portal. She hasn't logged in yet. To every system in UnitedHealth Group's estate, she is nobody — a device fingerprint, a browser session, an anonymous click pattern. There are six different systems that hold pieces of her story. None of them know the others exist. None of them speak the same language. And none of them, alone, can tell you what Maria actually needs right now. The CDP Assembly screen is the moment that changes.`,
    acts: [
      {
        title: 'Act 1 — The Anonymous Session',
        body: [
          'Before authentication, the CDP receives a behavioral signal. This is not nothing. The CDP\'s probabilistic identity engine immediately begins cross-referencing the behavioral pattern — scroll depth, navigation path, session timing — against known member behavioral signatures in the SD Medicaid Claims history. No login required. The engine is already working.',
          'At 87% confidence it produces a candidate match: MARIA_SD_001. The system does not act on this. It holds it. It waits.',
        ],
        code: `EVENT_TYPE: PORTAL_SESSION_INITIATED
SOURCE: RHTP Care Management Web
IDENTITY_STATE: ANONYMOUS
DEVICE_FINGERPRINT: dv_8821x
SESSION_ID: sess_rally_20240115_0947
BEHAVIORAL_SIGNAL: returning_pattern_detected
→ Probabilistic match: MARIA_SD_001 (87% confidence)`,
      },
      {
        title: 'Act 2 — Six Systems, Six Languages',
        body: [
          'While the probabilistic engine holds its candidate, the CDP has already begun ingesting from all six source systems. Each speaks a completely different dialect of health data.',
          'Stream 1 — SD Medicaid Claims · X12 837: The industry standard EDI transaction format for medical claims. Every claim Maria has ever filed lives here — procedure codes, diagnosis codes, provider NPIs, adjudication outcomes, paid amounts. The CDP transforms this into FHIR ExplanationOfBenefit resources.',
          'Stream 2 — Bennett County Health EHR · HL7 v2.4: The old pipe-delimited messaging standard that has powered clinical systems since 1994. Maria\'s diagnoses, medications, vital signs, and encounter history all arrive as HL7 v2.4 ADT and ORU messages. The CDP transforms these into FHIR Patient and FHIR Condition resources.',
          'Stream 3 — SD Medicaid Auth · Proprietary: No standard here — this is SD Medicaid\'s internal prior authorization system speaking its own language. Authorization codes, expiry timestamps, procedure approvals, denial reasons. The CDP transforms this into FHIR CoverageEligibilityResponse.',
          'Stream 4 — Bennett County Health Care Mgmt · CSV Export: The care management system exports flat files. Maria\'s care plan, her assigned tasks, her care manager contact, her program enrollment — all in comma-separated rows. The CDP parses, validates, and transforms into FHIR CarePlan and FHIR Task resources.',
          'Stream 5 — RHTP Analytics H1ab · REST API: The most modern source in the estate. H1ab exposes a REST API with JSON payloads — care team assignments, outreach briefs, intervention histories. The CDP maps to FHIR Task and FHIR CareTeam resources, preserving the H1ab task identifiers as external references for write-back.',
          'Stream 6 — CBO / Social Services · EDI 834: The benefit enrollment transaction format. Maria\'s current coverage — plan type, effective dates, benefit structure, cost-sharing parameters. The CDP transforms this into a FHIR Coverage resource — the foundation of everything financial downstream.',
        ],
      },
      {
        title: 'Act 3 — The Normalization Layer',
        body: [
          'Six streams. Six formats. One canonical representation. The normalization layer does three things simultaneously.',
          'Schema mapping — Each source field is mapped to its FHIR R4 equivalent. Where no standard mapping exists, custom extensions are created and registered in the schema registry. Every field transformation is documented in the lineage graph.',
          'Identity stitching — Each source uses a different member identifier. SD Medicaid Claims uses a Member ID. The EHR uses an MRN. H1ab uses an RHTP Analytics UUID. CBO / Social Services uses a subscriber ID. The normalization layer resolves all of these to a single golden identifier — MARIA_SD_001 — using a deterministic matching algorithm that checks SSN hash, date of birth, first name soundex, and zip code in combination.',
          'Temporal alignment — Each source has a different timestamp convention, timezone, and update frequency. Claims arrive in batch. The EHR fires HL7 messages in near-real-time. H1ab pushes REST events on trigger. The normalization layer aligns all events to UTC and stamps each with both the source timestamp and the ingestion timestamp.',
          'The output: a canonical member record in FHIR R4 — a single, consistent, queryable representation of Maria assembled from six sources.',
        ],
      },
      {
        title: 'Act 4 — Authentication and Identity Promotion',
        body: [
          'Maria logs in. The probabilistic candidate (87% confidence, MARIA_SD_001) is now confirmed. The anonymous session is promoted to a known member session. Identity confidence jumps to 97%.',
          'This event triggers the downstream orchestration. The knowledge graph population begins. The agent coalition is activated.',
        ],
        code: `IDENTITY_EVENT: ANONYMOUS_TO_KNOWN_PROMOTION
TRIGGER: PORTAL_AUTHENTICATION
PRE_AUTH_CONFIDENCE: 0.87
POST_AUTH_CONFIDENCE: 0.97
GOLDEN_ID: MARIA_SD_001
IDENTITY_METHOD: DETERMINISTIC_CONFIRMED
SESSION_UPGRADE: anon_sess_8821x → known_sess_MARIA_SD_001`,
      },
      {
        title: 'Act 5 — The Resolution Log as Narrative',
        body: [
          'The resolution log is not a debug trace. It is the assembly story told in real time. Lines 1–3: Anonymous detection. Lines 4–5: Probabilistic match. Lines 6–12: Six-stream normalization — each source system mapped to its FHIR equivalent. Lines 13–15: Identity promotion. Lines 16–23: Graph edge assembly — consent, authorization, care gap, episodes, provider, dependent, caregiver, proxy scope. Line 24: ✓ Knowledge Graph complete — Maria is now known.',
          'Every line is a write operation to the graph. By line 24, 23 nodes and 31 edges exist. The coalition has everything it needs to act.',
          'The Practitioner Depth tabs — Source Instrumentation, Event Latency, Data Products — exist to answer the question a technical evaluator will ask silently: "Have you actually built this, or is this a diagram?" The Tier 1/2/3 model, the DUPLICATE_THERAPY <15min patient safety latency threshold, and the data product ownership model are the operational details that only exist if someone has actually built this before.',
        ],
      },
    ],
    closingArgument: '"Every system that touches Maria after this point is working from the same truth. That has never happened before — not inside this enterprise, not across these six systems. The CDP assembly screen is the moment it starts."',
  },

  {
    number: '05',
    title: 'Maria Subgraph Context — The Knowledge Graph',
    phase: 'FOUNDATION',
    phaseColor: '#78a9ff',
    timing: '~90 seconds',
    story: `The CDP Assembly screen answered the question: how do we know who Maria is? The Subgraph Context screen answers a different question entirely: what does the system actually understand about her? There is a fundamental difference between storing data about a member and understanding the relationships between the pieces of that data. A relational database stores facts. A knowledge graph stores meaning. Maria's subgraph is not a record. It is a model of her clinical, financial, social, and relational reality — expressed as a network of typed nodes and directed edges that the agent coalition can traverse, reason over, and act on in real time.`,
    acts: [
      {
        title: 'Act 1 — Why a Graph and Not a Table',
        body: [
          'The question every technical person in the room will ask is: why Neo4j? Why a graph database? Why not a well-structured relational schema or a document store? The answer lives in the BLOCKS edge.',
          'In a relational database, the fact that Maria\'s transportation barrier is preventing her HbA1c lab visit requires a join across at minimum four tables — member, care gap, SDOH assessment, and some intervention mapping table — with application logic on top to derive the causal relationship. That join has to be written, maintained, and executed at query time. It does not exist as a first-class data structure.',
          'In the knowledge graph, the relationship is the data: (SDOHNode: TransportationBarrier) -[:BLOCKS]-> (CareGap: HbA1c_Lab_Visit). One traversal. No join. The causal structure is encoded directly in the graph topology. The agent coalition does not have to derive the relationship — it reads it.',
          'This is why the knowledge graph is not an architectural choice. It is a prerequisite for the kind of contextual reasoning the agents need to perform at the speed and precision the clinical use case demands.',
        ],
        code: `// The canonical SDOH-to-CareGap traversal
MATCH (m:Member {id: 'MARIA_SD_001'})
-[:HAS_SDOH]->(s:SDOHNode)
-[:BLOCKS]->(g:CareGap)
RETURN s, g
// Returns: TransportationBarrier → HbA1c_Lab_Visit
// One traversal. No joins. No application logic.`,
      },
      {
        title: 'Act 2 — The Node Taxonomy (23 Nodes)',
        body: [
          'Maria\'s subgraph at full assembly contains 23 nodes across 14 canonical types. Each type is governed — defined, versioned, and owned by the clinical informatics team with a PR-based change process and a 90-day breaking change deprecation window.',
          'Member Node — MARIA_SD_001: The golden record. Survivorship hierarchy: Claims > Clinical > Pharmacy > Behavioral. Deterministic match rate: 94.2%. Probabilistic uplift: +4.1% → 98.3% total match confidence.',
          'Authorization Node — CAREGAP_HBA1C: Prior authorization for cardiac rehabilitation. Status: pre-approved. Expiry: T-4 days at the time of Maria\'s session. The PENDING_AUTH edge connecting Maria to CAREGAP_HBA1C is the trigger that activates the Authorization Intelligence agent.',
          'CareGap Node — CAREGAP_001: HbA1c test overdue. Gap open 45 days. SD Medicaid quality measurement window: 47 days remaining. The temporal pressure encoded in this node — 45 days elapsed, 47 days remaining — is what makes the intervention urgent rather than routine.',
          'SDOHNode — TransportationBarrier: The node that changes everything. Maria cannot get to the lab. This is not in any clinical system. It was identified through care management intake — a CSV export from Bennett County Health Care Mgmt, normalized and loaded into the graph as a first-class node. Its BLOCKS edge pointing at CAREGAP_001 is the piece of context that transforms the care gap from "send a reminder" to "dispatch a home lab kit."',
          'Medication Nodes — Lisinopril 5mg, Metformin 5mg: Two nodes. Same drug class. Connected to the same member. This is the duplicate therapy signal — not identified by a rule engine scanning a medication list, but visible as a structural pattern in the graph: two PRESCRIBED edges from MARIA_SD_001 to two nodes with overlapping pharmacological profiles.',
          'Provider Node — Bennett County Health · NPI 1234567890: Connected to Maria via TREATED_BY. The TREATED_BY edge carries edge properties — relationship tenure, communication preference, EHR system identifier — that the Clinical Care Agent uses to route the CDS Hook to the correct Epic endpoint.',
          'Dependent Node — Sophia: Connected via PARENT_OF. The presence of this node activates proxy consent scope logic.',
          'Caregiver Node — Elena: Connected via CAREGIVER_FOR. Phone number, relationship type, and consent scope loaded as node properties.',
          'ChannelHistory Node: The engagement intelligence layer. Preferred channel: Portal. Session frequency: 2x per week. Active window: weekdays 9–11am. Last touch: Day 34, 9:47am. This node is what enables the suppression logic.',
        ],
      },
      {
        title: 'Act 3 — The Edge Taxonomy (31 Edges)',
        body: [
          'The 31 edges in Maria\'s subgraph are not generic links. Each is a typed, directed, property-bearing relationship — governed as rigorously as the nodes themselves. 22 canonical edge types exist in the ontology.',
          'HAS_SDOH → BLOCKS: The two-hop path from Maria to her transportation barrier to her care gap. This is the reasoning chain the SDOH Discovery agent follows. Traverse HAS_SDOH → find the barrier → follow BLOCKS → find the gap → activate the resolution pathway.',
          'PENDING_AUTH: Carries expiry timestamp as an edge property. The Authorization Intelligence agent monitors this edge\'s expiry property as a time-series trigger. When expiry crosses the T-4 day threshold, the agent activates.',
          'DUPLICATE_OF: The edge written between Lisinopril and Metformin by the Duplicate Therapy Detection agent. This edge does not exist in any source system. It is derived — written into the graph by an agent reasoning over pharmacological profiles. The knowledge graph is not just a read structure. It is a reasoning substrate that agents write back into.',
          'MEMBER_ACKNOWLEDGED: Written when Maria confirms understanding of the duplicate therapy resolution via the RHTP Mobile interface. This is the consent and acknowledgement layer made visible in the graph — a full audit trail of what was communicated, when, and what the member confirmed.',
        ],
      },
      {
        title: 'Act 4 — Scale and Performance',
        body: [
          'At population scale: 124,847 members in the current graph. Estimated UHG scale: 2.4 billion nodes · 8.1 billion edges. Query performance: <50ms on indexed traversal.',
          'EY + IBM prior build reference: 4.2M members, 340M nodes, 1.1B edges, 47ms P99. These are not projections. They are the operational details of a system that has been built and run at scale before.',
          'The "Under the Hood" accordion exists to answer the question a technical evaluator will ask silently but never voice in the room: "Have you actually built this, or is this a diagram?" The answer is in the specifics: Neo4j Enterprise AuraDB, specific identity resolution statistics, PR-based ontology governance with 90-day deprecation policy.',
        ],
      },
    ],
    closingArgument: '"This is what Maria looks like when every system that knows something about her is finally asked to share it in the same room at the same time. Twenty-three nodes. Thirty-one edges. And for the first time — one truth."',
  },

  {
    number: '06',
    title: 'Consumer 360 + Journey Map',
    phase: 'FOUNDATION',
    phaseColor: '#78a9ff',
    timing: '~90 seconds',
    story: `Consumer 360 is not a profile page. It is an operational intelligence layer. The distinction matters because every health plan has a member profile page. What they do not have is a system that derives behavioral preferences from interaction sequences, enforces communication constraints as governed attributes, and surfaces active safety signals alongside financial context — all in a single view that every downstream agent reads before acting.`,
    acts: [
      {
        title: 'Act 1 — The Journey Timeline',
        body: [
          'The journey timeline runs from Day 0 to Day 90, with Maria currently at Day 34. The timeline shows expected versus unexpected signals at this stage of the cardiac episode.',
          'The HbA1c care gap should have closed by Day 21. It has not. The system knows. This is not a flag set by a care manager — it is a temporal anomaly detected by comparing the current state of the care gap node against the expected closure timeline for a member at Day 34 of a cardiac episode.',
          'The journey context is what makes every downstream action time-sensitive rather than routine. The system is not just aware of the gap — it is aware of how long the gap has been open, how much time remains in the SD Medicaid quality measurement window, and what the consequence of missing the window is.',
        ],
      },
      {
        title: 'Act 2 — The Channel History Timeline',
        body: [
          'The Channel History Timeline is the most technically significant panel on the Consumer 360 screen. It shows seven interaction events in sequence: IVR Day 1 — first touch, no answer. Phone Day 8 — outreach attempt, unanswered. Phone Day 11 — second attempt, unanswered. Portal Day 14 — Maria self-initiated, self-service session. Portal Day 21 — second self-service session. Portal Day 28 — third session. Portal Day 34 — active session today.',
          'The system did not just log these events. It derived a behavioral pattern from the sequence: Maria does not respond to phone outreach. She self-initiates on the portal. That preference is now a governed constraint — it will suppress phone attempts and route all outreach to portal.',
          'This is the difference between a CRM preference note and a governed behavioral attribute. A preference note can be overridden by any outreach coordinator. A governed constraint cannot be overridden without a documented exception. The channel history is the evidence base for the constraint.',
        ],
      },
      {
        title: 'Act 3 — Communication Permissions and Active Signals',
        body: [
          'The communication permissions panel shows governed profile attributes: email opted out, frequency cap 3 per 7 days, 2 used this week. These are not preference notes. They are enforced constraints that every agent reads before dispatching any outreach.',
          'The Active Signals panel surfaces the Med review_ALERT — DUPLICATE_THERAPY block: Lisinopril (CVS · Bennett County Health) and Metformin (Walgreens · Bennett County Health) — same mechanism, two prescribers unaware of each other. This is a critical safety signal, not a care gap. It requires a different response pathway — prescriber alert, not member outreach.',
          'The care manager panel shows Sarah Johnson, H1ab, with 47-day-old context. The person responsible for Maria\'s coordination is working blind. That changes in 47 minutes — when the agent coalition completes its work and pushes the updated brief to H1ab.',
        ],
      },
      {
        title: 'Act 4 — Lifecycle Context',
        body: [
          'The lifecycle context panel holds Maria\'s arc, not just her current state: enrolled three years, prior cardiac hospitalization 2022, Sophia registered June 2024, Elena caregiver status November 2024.',
          'The lifecycle context is what enables the system to distinguish between a first-time event and a pattern. The prior cardiac hospitalization in 2022 means this is not Maria\'s first episode — it is her second. The readmission risk calculation is different for a second episode than a first. The system knows this because the lifecycle context is a first-class data structure, not a note in a free-text field.',
        ],
      },
    ],
    closingArgument: '"Consumer 360 is the operational intelligence layer that every agent reads before acting. The channel history, the communication permissions, the active signals, the lifecycle context — these are not display fields. They are the governed constraints that make every downstream action intelligent rather than generic."',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // INTELLIGENCE PHASE
  // ══════════════════════════════════════════════════════════════════════════

  {
    number: '07',
    title: 'Enterprise Population — Knowledge Graph',
    phase: 'INTELLIGENCE',
    phaseColor: '#42be65',
    timing: '~75 seconds',
    story: `The Enterprise Population screen is the transition from the individual to the collective. Maria's subgraph is one of 124,847 subgraphs in the population graph. The screen makes the scale of the intelligence layer visible — not as a number, but as a live visualization of the population as a knowledge graph, with every node a relationship and every edge a dependency.`,
    acts: [
      {
        title: 'Act 1 — The Population as a Graph',
        body: [
          'The population graph shows the risk distribution: 80% low risk (green nodes), 15% medium risk (amber nodes), 5% high risk (red nodes). The 5% is where cost concentrates. The visual makes this argument without words — the red nodes cluster at the center, surrounded by the amber and green rings.',
          'Provider nodes appear as hexagons — a different shape from member nodes — distributed across the graph at the points where clinical relationships concentrate. The shape distinction is not cosmetic: it encodes the node type into the visual grammar of the graph.',
          'The CHANNEL_HISTORY node type appears in the graph legend as a first-class entity. Every member\'s channel interaction sequence is a structured node, not a log entry. The system can traverse it, reason over it, and use it to constrain outreach decisions.',
        ],
      },
      {
        title: 'Act 2 — The Signal Stream',
        body: [
          'The live signal stream shows the variety of signal types flowing into the population graph: IVR touches, call center closures, clinical events, behavioral signals — all normalized into one stream from SD Medicaid, Bennett County, and RHTP Care Management.',
          'The disposition events visible in the stream — SUPPRESSED, DELAYED, DEPRIORITIZED — establish that the system is not acting on everything. It is deciding what deserves a response, in what order, and what should never surface at all.',
          'The M key injects Maria\'s three signals into the stream: AUTH_EXPIRY, CARE_GAP_HbA1c, and Med review_ALERT_DUPLICATE_THERAPY. The injection is visible in the stream — three signals among thousands, but the system immediately identifies them as requiring coalition-level response.',
        ],
      },
      {
        title: 'Act 3 — The Intelligence Argument',
        body: [
          'The closing argument for this screen is the selectivity argument: "The system is not acting on everything. It is deciding what deserves a response, in what order, and what should never surface at all. That judgment — at this scale — is the difference between intelligence and noise."',
          'The population graph is the evidence base for this argument. The audience can see the suppression events, the deprioritization events, and the activation events — all happening simultaneously, all governed by the same signal disposition logic that will be shown in detail on the next screen.',
        ],
      },
    ],
    closingArgument: '"This is your population as a live knowledge graph. Every node a relationship. Every edge a dependency. The system is watching all of them simultaneously — and it has already decided which three signals require a coalition-level response right now."',
  },

  {
    number: '08',
    title: 'Signal Disposition Engine',
    phase: 'INTELLIGENCE',
    phaseColor: '#42be65',
    timing: '~90 seconds',
    story: `Before the system acts, it decides. The Signal Disposition Engine is the evaluation layer between raw signals and agent action. It is the most technically precise screen in the demo — the one that shows not just what the system does, but how it decides what to do, in what order, through which channel, and with what authority. Every signal that enters the system passes through this layer before any agent sees it.`,
    acts: [
      {
        title: 'Act 1 — The Five Signal Evaluations',
        body: [
          'Five signals are evaluated simultaneously. Each row in the disposition table shows the signal type, the disposition decision, the channel assignment, and the rationale.',
          'AUTH_EXPIRY — ACT NOW, Channel: Portal (last-touch Day 34). Sequence after eligibility check. Rationale: auth renewal cannot finalize if eligibility lapses first. The sequencing constraint is not a rule — it is a dependency derived from the knowledge graph: the auth node has a dependency edge to the eligibility node.',
          'CARE_GAP HbA1c — ACT NOW but SDOH-modified, Channel: Portal. Standard clinic appointment BLOCKED by transport barrier. Home lab kit dispatched instead. This is next-best action, not standard protocol. The SDOH modification is the key: the system did not just identify the care gap — it identified that the standard intervention would fail and substituted a barrier-aware alternative.',
          'Med review_ALERT DUPLICATE_THERAPY — CRITICAL, Channel: Martin Pharmacy (pharmacy domain). Lisinopril + Metformin, two prescribers unaware. Prescriber alert dispatched. Martin Pharmacy Med review outreach SUPPRESSED — consent boundary: Martin Pharmacy domain requires separate consent scope. The distinction between the prescriber alert (permitted — clinical safety communication) and the Med review outreach (blocked — third-party data sharing) is the governance architecture made visible.',
          'BEHAVIORAL — PRIORITIZE, Channel: Portal (self-initiated pattern). Member receptivity window detected. Act within it. The behavioral signal is not a clinical event — it is a channel signal that modifies the timing of every other action.',
          'SDOH multi-barrier — context loaded, Channel: IVR→Phone→Portal sequence analyzed, modifies all upstream decisions. The SDOH signal is classified as a modifier, not a trigger. It does not initiate action — it changes the form of every action that has already been initiated.',
        ],
      },
      {
        title: 'Act 2 — Enterprise Outreach Coordination',
        body: [
          'The enterprise outreach coordination panel shows the full picture of who wants Maria\'s attention this week: the clinical team, the service team, the growth team, and the employer wellness program. The system approves one, suppresses two, delays one. Maria receives a single coordinated touchpoint.',
          'The employer wellness program suppression is particularly important. The employer — SD Medicaid — has a wellness program that is about to send Maria an outreach. The system knows about the active clinical episode, the SDOH barriers, and the communication frequency cap. The wellness outreach is suppressed — not because it is wrong, but because it is the wrong time and the wrong channel.',
          'This is enterprise engagement intelligence: the ability to coordinate across organizational boundaries — clinical, service, growth, and employer — to deliver a single coherent experience to the member.',
        ],
      },
      {
        title: 'Act 3 — The Channel Column',
        body: [
          'The channel column in the disposition table is not cosmetic. It is the last-touch evidence the system uses to route every action. Phone attempts are suppressed because the channel history shows two unanswered calls. Portal is the only channel with a behavioral signal — self-initiated sessions on Days 14, 21, 28, and 34.',
          'The channel assignment is derived from the ChannelHistory node in the knowledge graph — the same node that was introduced as a first-class entity in the Enterprise Population screen. The channel column in the disposition table is the operational output of that graph traversal.',
        ],
      },
    ],
    closingArgument: '"The Signal Disposition Engine is not a rules engine. It is a reasoning layer that reads the knowledge graph, evaluates every signal against the member\'s context, and decides what deserves a response — in what order, through which channel, and with what authority. That is the difference between a care coordination platform and an orchestration intelligence."',
  },

  {
    number: '09',
    title: 'Maria Counterfactual — What Happens Without It',
    phase: 'INTELLIGENCE',
    phaseColor: '#42be65',
    timing: '~90 seconds',
    story: `Before showing the resolution, the demo shows the alternative. The Maria Counterfactual screen is the most emotionally resonant screen in the demo — not because it is dramatic, but because it is familiar. Every person in the room has seen this sequence play out. They have been the coordinator who found the lapsed auth on Monday morning. They have been the care manager who scheduled the clinic appointment twice without knowing about the transport barrier. The counterfactual is not a worst-case scenario. It is the median outcome when coordination is manual and the system doesn't know who it's acting for.`,
    acts: [
      {
        title: 'Act 1 — The Failure Sequence',
        body: [
          'Day 4: Auth lapses. No automatic notification. Coordinator finds it Monday morning. The auth expiry was visible in the knowledge graph four days before it happened. Without the system, no one was watching.',
          'Day 12: Bennett County Health\'s eligibility expires. Episode continuity broken. No one knows. The eligibility expiry was a node in the graph with a dependency edge to the auth node. Without the graph, the dependency is invisible.',
          'Day 45: HbA1c gap now 47 days. System scheduled a clinic appointment. Transport barrier unknown. Maria couldn\'t get there. System scheduled again. Same result. The transport barrier was in the care management CSV export — it was in the data. No system had assembled the gap, the barrier, and the solution in the same context simultaneously.',
          'Day 52: Lisinopril + Metformin duplicate therapy goes undetected. No Med review intercept. No prescriber alert. A1C unmonitored. Bleeding risk accumulates silently. The duplicate therapy signal was visible in the pharmacy fills — two prescriptions, same drug class, two different pharmacies. Without the graph traversal, the pattern is invisible.',
          'Day 67: Care manager calls — standard script. No awareness of caregiver burden. Maria overwhelmed. Disengages. The caregiver burden was an SDOH node in the graph. Without the graph, the care manager has no context for why Maria is not engaging.',
          'Day 72: Appeal deadline passes. SD Medicaid penalty exposure. Window gone.',
        ],
      },
      {
        title: 'Act 2 — The Cost',
        body: [
          '$47,000. Not a worst-case scenario. The median outcome when coordination is manual and the system doesn\'t know who it\'s acting for. Not because Maria didn\'t care. Because the system didn\'t.',
          'The $47,000 figure is sourced to the AHIP 2024 Care Coordination Benchmark — the same source cited on the Burning Platform screen. The counterfactual closes the loop: the $47,000 on Screen 1 is the cost of the failure sequence on Screen 9.',
        ],
      },
      {
        title: 'Act 3 — The Pivot',
        body: [
          'The counterfactual closes with a single line: "Now let me show you what happens when the system is watching." This is the pivot to the Controller screen — the most technically complex and narratively satisfying screen in the demo.',
          'The pivot works because the audience has now seen both the problem (Fragmentation) and the consequence (Counterfactual). The Controller screen is the answer to both.',
        ],
      },
    ],
    closingArgument: '"$47,000. Not because Maria didn\'t care. Because the system didn\'t. Every failure in that sequence was preventable — not by working harder, but by having a system that was watching when no human was. Now let me show you what happens when the system is watching."',
  },

  {
    number: '10',
    title: 'Controller — Agentic Super-Orchestration',
    phase: 'INTELLIGENCE',
    phaseColor: '#42be65',
    timing: '~150 seconds',
    story: `Same member. Same scenario. The orchestration layer is active. The Controller screen is the centerpiece of the demo — the moment where every capability introduced in the Foundation phase is activated simultaneously. The Controller cycles through five functions, assembles a 9-agent coalition, hits a governance boundary, escalates with full context, and delivers a CDS Hook to Bennett County Health's Epic workflow — all in under 47 minutes. The screen is designed to be walked slowly, with deliberate pauses at each capability moment.`,
    acts: [
      {
        title: 'Act 1 — The Five Controller Functions',
        body: [
          'Sense & Understand: Graph context assembled, journey position confirmed, SDOH profile loaded via graph traversal query (SDOH PROFILE DISCOVERED — not manually entered, derived from graph traversal). Channel history analyzed: IVR Day 1 · 2 phone attempts unanswered · Portal self-initiated Day 14 · Portal 2×/week Day 14–34. Person state: high engagement, low fatigue.',
          'Plan & Decompose: Four primary conditions identified, constraint hierarchy established, caregiver and dependent threads in scope, duplicate therapy intercept queued.',
          'Decide & Orchestrate: Querying Agent Marketplace, 9 agents matched from a registry of 31. Standard 4-agent response upgraded to 9-agent coalition. The two additions: SDOH-enriched navigation agent (transport barrier resolution) and Med review pharmacy safety agent (Lisinopril + Metformin intercept). 22 agents stood down — not relevant to this scenario.',
          'Monitor & Adapt: Watching open loops. If a condition fires, the agent re-activates. If a deadline approaches, it escalates.',
          'Learn & Improve: Pending resolution. The outcome of this scenario will be written back into the agent performance registry.',
        ],
      },
      {
        title: 'Act 2 — The Governance Intercept',
        body: [
          'The system hits a governance boundary. Clinical necessity determination — above automated authority threshold. The agent held and routed to Dr. K. Patel with full context. It didn\'t guess. It didn\'t proceed. It escalated with everything the reviewer needs.',
          'The governance intercept is not a failure mode. It is a design feature. The system knows the boundary of its own authority and stops at it — every time, without exception. The human reviewer receives a complete context packet: the clinical necessity question, the member\'s current state, the relevant clinical evidence, and the recommended action.',
          'This is the human-in-the-loop architecture made visible: not a post-hoc audit trail, but an in-loop escalation that preserves human judgment at the boundary of automated authority.',
        ],
      },
      {
        title: 'Act 3 — The Med review Intercept Modal',
        body: [
          'The Med review Intercept Modal surfaces CONSENT.DOMAIN.BOUNDARY.002: Lisinopril (Bennett County Health · CVS) + Metformin (Bennett County Health · Walgreens). Risk grid: duplicate BP med, bleeding risk elevated. Resolution: prescriber alert dispatched to both. Martin Pharmacy Med review outreach BLOCKED — outside proxy consent scope.',
          'The consent boundary distinction is the governance architecture made tangible: prescriber alerts are clinical safety communications — permitted under HIPAA TPO. Martin Pharmacy Med review outreach is third-party data sharing — requires separate consent scope. The system enforces this distinction automatically, without human intervention.',
        ],
      },
      {
        title: 'Act 4 — The Provider Value Proposition',
        body: [
          'The Bennett County Health Epic CDS Hook panel is the provider value proposition made concrete. The system doesn\'t wait for Bennett County Health to pull a chart. It pushes a CDS Hook directly into his Epic workflow — appointment-booked trigger, FHIR R4 delivery, under 200 milliseconds.',
          'The CDS Hook panel shows the complete brief: Duplicate therapy surfaced — Lisinopril and Metformin, same molecule, two active fills, A1C elevated 38 days. HbA1c care gap with 47 days remaining in the SD Medicaid quality window. Prior auth pre-approved — cardiac rehab ready to order. SDOH transport barrier — home lab kit already dispatched. Med review status — partial — consent expansion pending.',
          'SIMULATE DR. CHEN\'S RESPONSE: Bennett County Health acknowledges in 8 minutes. Metformin discontinued in Epic. HbA1c lab ordered — home kit confirmed. Postpartum rehab referral placed with pre-auth attached. A1C monitoring scheduled — 7 days.',
          'When GRAPH UPDATED appears — the knowledge graph overlay fires automatically. The Bennett County Health node gains an ACKNOWLEDGED badge. The Metformin node gets a DISCONTINUED edge. HbA1c gets a LAB_ORDERED edge. Postpartum Rehab appears as a new node — referral placed, auth attached. The reasoning substrate updates in real time. The graph is not a visualization. It is a live record of what the system knows.',
        ],
        code: `// CDS Hook delivery — FHIR R4
POST /cds-services/care-gap-alert
{
  "hookInstance": "d1577c69-dfbe-44ad-ba6d-3e05e953b2ea",
  "hook": "appointment-booked",
  "context": {
    "patientId": "MARIA_SD_001",
    "encounterId": "enc-cardiac-2024-0115"
  },
  "prefetch": {
    "patient": { "resourceType": "Patient", ... },
    "conditions": [ /* ICD-10 I25.10, E11.9 */ ],
    "medications": [ /* Lisinopril 5mg, Metformin 5mg */ ],
    "careGaps": [ /* HbA1c SD Medicaid quality gap, 45d open */ ]
  }
}
// Delivery latency: <200ms
// Bennett County Health acknowledgement: 8 minutes`,
      },
    ],
    closingArgument: '"The system queried a registry of 31 agents and selected exactly the 9 that match this context. It hit a governance boundary and stopped — escalating with full context rather than guessing. It delivered a CDS Hook to Bennett County Health\'s Epic workflow in under 200 milliseconds. And it updated the knowledge graph in real time as each action was confirmed. That is not a workflow tool. That is an orchestration intelligence."',
  },

  {
    number: '11',
    title: 'Signal Classification Beat',
    phase: 'INTELLIGENCE',
    phaseColor: '#42be65',
    timing: '~60 seconds',
    story: `Every signal the system receives is classified before any agent sees it. The Signal Classification Beat is a transitional screen — it bridges the Intelligence phase to the Resolution phase by making the classification taxonomy explicit. Classification is not tagging. It is the first act of reasoning.`,
    acts: [
      {
        title: 'Act 1 — The Classification Taxonomy',
        body: [
          'Five signal classes: clinical signals, behavioral signals, SDOH signals, channel signals, governance signals.',
          'Clinical signals trigger agent activation. Behavioral signals modify timing and channel routing. SDOH signals modify the form of clinical interventions. Channel signals derive and enforce communication preferences. Governance signals escalate to human review.',
          'The taxonomy is not arbitrary. It reflects the different ways signals interact with the agent coalition: some signals initiate action, some modify action, some constrain action, and some escalate action.',
        ],
      },
      {
        title: 'Act 2 — SDOH as Modifier, Not Trigger',
        body: [
          'The SDOH signal class is the most important distinction in the taxonomy. Transport barrier is not a clinical signal. It is a social determinant signal. The system classifies it separately because it modifies clinical decisions — it doesn\'t trigger them.',
          'The home lab kit dispatch was not a clinical protocol. It was a SDOH-aware next-best action. The clinical decision — close the HbA1c care gap — was already made. The SDOH signal changed the delivery method of that decision.',
          'This distinction matters for governance: the SDOH agent does not have clinical authority. It has delivery authority. It can change how a clinical decision is executed, but it cannot change what the clinical decision is.',
        ],
      },
      {
        title: 'Act 3 — Channel Signal as Behavioral Preference Derivation',
        body: [
          'IVR Day 1, phone Day 8, phone Day 11, portal Day 14 — these are channel signals. The system classified the sequence as a behavioral preference pattern and promoted it to a governed constraint. Phone outreach is now suppressed for Maria — not because a human set a flag, but because the system derived the preference from the signal sequence.',
          'The derivation is the key: the system did not ask Maria what her preferred channel is. It observed her behavior and derived the preference. The governed constraint is the output of that derivation — and it is enforced automatically across every agent in the coalition.',
        ],
      },
    ],
    closingArgument: '"Classification is not tagging. It is the first act of reasoning. Before any agent acts, the system has already determined what kind of signal it is dealing with, what authority that signal carries, and what constraints it places on the response. That is the intelligence layer that makes the coalition coherent."',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // RESOLUTION PHASE
  // ══════════════════════════════════════════════════════════════════════════

  {
    number: '12',
    title: 'Financial Intelligence',
    phase: 'RESOLUTION',
    phaseColor: '#f59e0b',
    timing: '~75 seconds',
    story: `While the agents were coordinating the clinical picture, Maria had a question she hadn't asked yet. The Financial Intelligence screen shows the system's ability to anticipate financial questions before they are asked — assembling the benefits position, the out-of-pocket trajectory, and the in-network provider recommendation before Maria picks up the phone.`,
    acts: [
      {
        title: 'Act 1 — The Proactive Financial Brief',
        body: [
          'The system assembled Maria\'s financial context before she called. Benefits position: OOP progress tracked against the $6,000 deductible. Estimated cost for HbA1c lab order: $340–$480 depending on facility.',
          'Dr. Sarah Kim at Banner Heart Institute — in-network, accepting, 2.3 miles, next available in 3 days. Referral initiated. The answer is in her portal before the question is asked.',
          'This is the next-best experience argument made concrete: the system does not wait for Maria to navigate to a cost estimator, search for providers, and call to check availability. It assembles the complete financial picture and surfaces it at the moment of relevance.',
        ],
      },
      {
        title: 'Act 2 — The Med review Safety Flag in Financial Context',
        body: [
          'The financial picture is incomplete without the clinical safety picture. The referral context includes an active safety flag: Med review duplicate therapy. Lisinopril + Metformin dual-prescriber conflict. Readmission risk modifier: +18%. Med review enrollment recommended before procedure scheduling.',
          'The +18% readmission risk modifier is the financial consequence of the duplicate therapy — expressed in the language of the financial context. The system holds both the clinical safety picture and the financial picture simultaneously, and it surfaces the clinical safety flag in the financial context because the financial decision (schedule the procedure) cannot be made correctly without the clinical safety information.',
          'This is the seventh screen in the demo where the duplicate therapy alert appears. The consistency is deliberate: the alert is not a one-time event. It is an active safety signal that modifies every downstream decision until it is resolved.',
        ],
      },
    ],
    closingArgument: '"The financial picture is incomplete without the clinical safety picture. The system holds both simultaneously — and it surfaces the clinical safety flag in the financial context because the financial decision cannot be made correctly without it. That is what whole-person intelligence looks like."',
  },

  {
    number: '13',
    title: 'Family · Sophia',
    phase: 'RESOLUTION',
    phaseColor: '#f59e0b',
    timing: '~60 seconds',
    story: `Maria has a 2-year-old daughter. The system already found her. The Family · Sophia screen demonstrates the household intelligence capability — the ability to understand not just the member, but everyone who depends on the member, and to coordinate care across the household as a single unit.`,
    acts: [
      {
        title: 'Act 1 — Sophia\'s Six Care Gaps',
        body: [
          'Sophia has six open care gaps: no PCP assigned, developmental screening overdue, immunization schedule incomplete, vision screening not on file, hearing screening not on file, and well-child visit overdue.',
          'None of these gaps are visible in Maria\'s clinical record. They exist in the enrollment system — Sophia is registered as a dependent, but her clinical record is empty. The system identified the gaps by cross-referencing Sophia\'s age against the SD Medicaid quality pediatric care gap schedule.',
          'The gap identification is not a clinical decision — it is a data product. The system knows Sophia\'s age, knows the SD Medicaid quality schedule for a 2-year-old, and derives the gaps from the comparison. No clinician needed.',
        ],
      },
      {
        title: 'Act 2 — The Orchestration Response',
        body: [
          'Bennett County Health recommended — in-network pediatrician, accepting new patients, 1.8 miles from Maria\'s address. Screening bundle created: all six gaps addressed in a single appointment.',
          'Combined outreach with Maria\'s cardiac update — one message. The system does not send Maria a separate message about Sophia. It bundles the Sophia outreach with the cardiac update that is already scheduled, respecting the frequency cap and the portal channel preference.',
          'This is the household coordination argument: the system understands that Maria is both a patient and a parent, and it coordinates care for both roles in a single coherent outreach.',
        ],
      },
    ],
    closingArgument: '"The system doesn\'t just understand Maria. It understands everyone who depends on her — and it coordinates their care as a single unit, through a single channel, in a single outreach. That is what household intelligence looks like."',
  },

  {
    number: '14',
    title: 'Caregiver · Elena',
    phase: 'RESOLUTION',
    phaseColor: '#f59e0b',
    timing: '~75 seconds',
    story: `Maria's mother Elena. Six medications. Lisinopril — high risk, A1C elevated 38 days. And now — a duplicate therapy alert. The Caregiver · Elena screen is the governance architecture screen — the one that shows not just what the system can do, but what it will not do, and why.`,
    acts: [
      {
        title: 'Act 1 — The Duplicate Therapy Alert',
        body: [
          'Lisinopril (Bennett County Health · CVS) and Metformin (Bennett County Health · Walgreens) — same BP med mechanism, two prescribers unaware of each other. Alert dispatched to Bennett County Health. Alert dispatched to Bennett County Health. Both pending acknowledgment.',
          'The duplicate therapy alert for Elena is distinct from the duplicate therapy alert for Maria. Maria\'s alert involves her own medications. Elena\'s alert involves medications that Maria manages as a caregiver — under proxy consent scope.',
          'The prescriber alerts are dispatched because they are clinical safety communications — permitted under HIPAA TPO regardless of consent scope. The Med review outreach is blocked because it is third-party data sharing — requires separate consent scope.',
        ],
      },
      {
        title: 'Act 2 — The Three Consent States',
        body: [
          'The screen walks three consent states: Maria\'s own consent (FULL — all channels), Maria\'s proxy consent for Elena (SCOPED — clinical safety communications permitted, third-party data sharing blocked), and the Martin Pharmacy domain consent (SEPARATE SCOPE REQUIRED — Med review outreach blocked).',
          'The system verified not just that Maria has proxy consent, but that this specific action — sharing Elena\'s medication list with a third party via Martin Pharmacy Med review outreach — falls outside the scope of that proxy consent.',
          'That distinction is the difference between compliance theater and compliance architecture. Compliance theater checks whether consent exists. Compliance architecture checks whether the specific action is within the scope of the consent that exists.',
        ],
      },
      {
        title: 'Act 3 — The Bundled Resolution',
        body: [
          'PCP appointment in 7 days — medication review bundled into existing visit. No additional appointment needed. The system identified that Elena already has a PCP appointment scheduled and bundled the medication review into that visit rather than scheduling a separate appointment.',
          'This is the coordination intelligence argument at the caregiver level: the system does not just identify the problem — it identifies the most efficient resolution pathway that minimizes burden on the caregiver and the member.',
        ],
      },
    ],
    closingArgument: '"The system didn\'t just verify Maria has proxy consent. It verified that this specific action — sharing Elena\'s medication list with a third party via Martin Pharmacy Med review outreach — falls outside the scope of that proxy consent. That distinction is the difference between compliance theater and compliance architecture."',
  },

  {
    number: '15',
    title: 'Whole Person Care',
    phase: 'RESOLUTION',
    phaseColor: '#f59e0b',
    timing: '~75 seconds',
    story: `Every other screen showed what the system coordinates. This screen shows why the coordination will succeed. The Whole Person Care screen is the SDOH intelligence screen — the one that demonstrates that the system does not just coordinate care, it coordinates care that will actually work.`,
    acts: [
      {
        title: 'Act 1 — The SDOH Profile Discovery',
        body: [
          'The SDOH PROFILE DISCOVERED label is the most important framing on this screen. This was not manually entered. The system executed a graph traversal query across social determinant nodes, identified the transport barrier pattern, and surfaced it as a care plan modifier.',
          'The five SDOH domains: Transportation Barrier (BLOCKER — PROBABLE), Financial Strain (ELEVATED), Food Security (MODERATE), Caregiver Burden (HIGH), Social Isolation (MODERATE).',
          'The transportation barrier is classified as BLOCKER — PROBABLE because it was derived from care management intake data, not from a validated SDOH screening tool. The system is transparent about the confidence level of the SDOH signal — it does not treat a derived signal as equivalent to a validated assessment.',
        ],
        code: `// SDOH graph traversal query
MATCH (m:Member {id: 'MARIA_SD_001'})
-[:HAS_SDOH]->(s:SDOHNode)
WHERE s.severity IN ['HIGH', 'BLOCKER']
RETURN s.type, s.severity, s.source, s.confidence
// Returns:
// TransportationBarrier | BLOCKER | CareManagementIntake | 0.78
// CaregiverBurden       | HIGH    | CareManagementIntake | 0.82
// FinancialStrain       | ELEVATED| ClaimsAnalysis       | 0.91`,
      },
      {
        title: 'Act 2 — The Next-Best Action Panel',
        body: [
          'Standard clinic appointment blocked. Home lab kit dispatched. Copay assistance flagged. SNAP referral included.',
          'The next-best action panel shows the complete substitution: every standard intervention that would have failed due to the SDOH barriers has been replaced with a barrier-aware alternative. The home lab kit replaces the clinic appointment. The copay assistance addresses the financial strain. The SNAP referral addresses the food security concern.',
          'The substitution is not a workaround. It is a care plan that accounts for the member\'s actual circumstances — not the circumstances the care plan assumes.',
        ],
      },
      {
        title: 'Act 3 — The Closing Argument',
        body: [
          '"A care plan that ignores Maria\'s transport barrier and financial pressure will fail regardless of how well it is orchestrated. The system doesn\'t just coordinate care. It coordinates care that will actually work."',
          'This line is the closing argument for the entire Resolution phase. The four Resolution screens — Financial Intelligence, Family Sophia, Caregiver Elena, Whole Person Care — have shown the system resolving four different dimensions of Maria\'s situation. The Whole Person Care screen closes the phase by naming the principle that makes all four resolutions coherent: the system coordinates care that accounts for the whole person, not just the clinical record.',
        ],
      },
    ],
    closingArgument: '"A care plan that ignores Maria\'s transport barrier and financial pressure will fail regardless of how well it is orchestrated. The system doesn\'t just coordinate care. It coordinates care that will actually work."',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // IMPACT PHASE
  // ══════════════════════════════════════════════════════════════════════════

  {
    number: '16',
    title: 'Agent Impact Dashboard',
    phase: 'IMPACT',
    phaseColor: '#c084fc',
    timing: '~90 seconds',
    story: `47 minutes. T+zero to resolution. Nine agents. Nine threads. 71 decisions logged. Nine of nine governance boundaries honored. One human review — Bennett County Health, clinical necessity, 68 hours remaining. The Agent Impact Dashboard is the proof screen — the one that converts the narrative of the demo into a measurable outcome.`,
    acts: [
      {
        title: 'Act 1 — The Intervention Timeline',
        body: [
          'The intervention timeline shows the complete resolution sequence: Signal Disposition at T+3, Financial Intelligence at T+15, Caregiver at T+19, Eligibility resolved at T+22, Med review Duplicate Therapy Flagged at T+44 (red — critical milestone), Appeal held at T+31, full scenario resolved T+47.',
          'The Med review Duplicate Therapy Flagged milestone at T+44 is marked in red — it is the last critical safety event in the sequence, and it is resolved within the 47-minute window. The red color signals that this was a critical safety event, not a routine care coordination action.',
          'The channel attribution badges on each thread show which channel each action was delivered through: Auth renewal — Portal. HbA1c home kit — Portal. Caregiver Lisinopril alert — Prescriber direct (clinical safety channel). Med review intercept — Martin Pharmacy BLOCKED / Prescriber alert dispatched. Sophia outreach — Portal, bundled with Maria\'s update.',
        ],
      },
      {
        title: 'Act 2 — The KPIs',
        body: [
          'Auth cycle time: 8.2 days to 0.3 days. 96% reduction. The 8.2-day industry average is sourced to the AHIP 2024 benchmark. The 0.3-day resolution is the outcome of the auth renewal thread in the intervention timeline.',
          'Readmission risk: protocol active, +18% modifier from duplicate therapy now under management. The +18% modifier appeared in the Financial Intelligence screen — it is now being actively managed through the prescriber alerts and the Med review intercept.',
          'Care gap: tracked. Appeal: compliant. The appeal compliance is the governance architecture argument made measurable: the system honored every governance boundary, escalated every decision above its authority threshold, and maintained a complete audit trail.',
        ],
      },
      {
        title: 'Act 3 — Sarah Johnson\'s 90-Second Brief',
        body: [
          'SIMULATE SARAH\'S RESPONSE: Sarah opens her system at 9:55am. Transport blocker flagged. Duplicate therapy alert surfaced. Confirms home kit approach. 10am outreach fires with barrier-aware script.',
          '"Sarah didn\'t receive an email. She opened her system and the brief was already there — including the duplicate therapy flag she had no visibility into before. She spent 90 seconds — not 45 minutes assembling context."',
          'The H1ab push is the care manager augmentation argument made concrete: the system does not replace Sarah Johnson. It gives her the context she needs to do her job in 90 seconds instead of 45 minutes.',
        ],
      },
    ],
    closingArgument: '"47 minutes. Nine agents. 71 decisions. Nine governance boundaries honored. One human review. And Sarah Johnson spent 90 seconds on a brief that would have taken 45 minutes to assemble manually — including a duplicate therapy flag she had no visibility into before. That is what augmentation looks like."',
  },

  {
    number: '17',
    title: 'Portfolio Scale',
    phase: 'IMPACT',
    phaseColor: '#c084fc',
    timing: '~90 seconds',
    story: `14,847 members like Maria in your population right now. The Portfolio Scale screen converts the Maria story into a population argument — and the population argument into a multi-entity enterprise value argument. The three questions at the end of this screen are designed to be left unanswered. The audience answers them internally.`,
    acts: [
      {
        title: 'Act 1 — The Population Exposure',
        body: [
          '$697 million in unmanaged cost at $47,000 per failed episode. 14,847 members like Maria — high-risk, complex, with active care gaps, expiring authorizations, and SDOH barriers that the current system cannot see.',
          'The $697M figure is the product of two numbers that have both been established earlier in the demo: 14,847 members (derived from the 5% high-risk cohort of 124,847) and $47,000 per failed episode (from the Burning Platform screen and the Counterfactual screen). The audience can verify the arithmetic.',
        ],
      },
      {
        title: 'Act 2 — The Multi-Entity Enterprise Value Panel',
        body: [
          'SD Medicaid: 124,847 members, $697M exposure. The member population argument.',
          'Bennett County Health: 8,293 providers in network — each one a Bennett County Health waiting for a CDS Hook that never arrived. The provider value proposition argument at scale: the Bennett County Health CDS Hook pattern × 8,293 providers.',
          'Martin Pharmacy: 23,104 active pharmacy fills — the Lisinopril + Metformin duplicate therapy pattern is not unique to Maria. It is present in 847 member records in this population today. The duplicate therapy argument at scale: the Med review intercept that saved Maria from a bleeding risk event is happening — or not happening — for 847 other members right now.',
          'Bennett County Insight: the data infrastructure to see all of it — already built, already running, not yet connected. The vertical integration argument at the enterprise level: the assets exist, the integration does not.',
        ],
      },
      {
        title: 'Act 3 — The Three Questions',
        body: [
          '"How many Marias are in your population right now that your coordinators haven\'t found yet?"',
          '"What does a missed 72-hour SD Medicaid appeal window cost you — per member, per quarter?"',
          '"What happens to your Star Rating trajectory if you close 71% more care gaps — and your providers receive CDS Hooks instead of fax referrals?"',
          'Pause. Let them answer internally. The questions are designed to be unanswerable without the system — and the audience knows it.',
          '"This system is running for all of them. Simultaneously. One orchestration layer watching every signal, acting within its authority, escalating when it shouldn\'t. Across SD Medicaid, Bennett County Health, Martin Pharmacy, and Bennett County Insight — as one system."',
        ],
      },
    ],
    closingArgument: '"The assets to solve this already exist inside this organisation. UHG owns the clinical network, the pharmacy benefit, the data infrastructure, and the digital engagement layer. The question is whether they are connected — or just adjacent. This system is the connection."',
  },

  {
    number: '18',
    title: 'Strategic Roadmap',
    phase: 'IMPACT',
    phaseColor: '#c084fc',
    timing: '~90 seconds',
    story: `The Strategic Roadmap screen answers the question every executive asks after a compelling demo: "Where do we start?" The three-column maturity model — Manual Coordination → Orchestration Foundation → Autonomous Health Plan — gives the audience a path, not just a destination.`,
    acts: [
      {
        title: 'Act 1 — The Three-Column Maturity Model',
        body: [
          'Manual Coordination: The current state for most plans. Coordinators assembling context manually. Auth renewals found on Monday morning. Care gaps identified in batch. SDOH barriers invisible. Channel preferences unknown. The counterfactual.',
          'Orchestration Foundation: The 90-day implementation path. CDP assembly. Knowledge graph population. Signal disposition engine. 9-agent coalition. Governance architecture. The demo.',
          'Autonomous Health Plan: The 18-month horizon. Self-optimizing agent registry. Predictive intervention. Population-level SDOH intelligence. Provider CDS Hook network at scale. The strategic destination.',
          '"The question isn\'t whether this is the direction. The question is whether you\'re on the path — or watching competitors get there first."',
        ],
      },
      {
        title: 'Act 2 — The Platform Extensibility Argument',
        body: [
          'The Agent Marketplace is the extensibility argument: "This is not a fixed system. It is a platform. New domain specialists can be registered and the Controller discovers them dynamically."',
          'The 9-agent coalition you saw today — SDOH navigation, Med review pharmacy safety, and seven others — was assembled in real time from a registry of 31. You are not buying a solution. You are acquiring a capability that grows with your organisation.',
          'New agents can be registered with their capability signatures, domain constraints, and governance rules. The Controller discovers them dynamically — no hardcoded routing tables, no manual configuration. Your organisation can register domain-specific agents — employer wellness agents, specialty pharmacy agents, behavioral health agents — and the Controller will discover and select them using the same query mechanism.',
        ],
      },
    ],
    closingArgument: '"You are not buying a solution. You are acquiring a capability that grows with your organisation. The 9-agent coalition you saw today is the starting point — not the ceiling."',
  },

  {
    number: '19',
    title: 'Leave Behind',
    phase: 'IMPACT',
    phaseColor: '#c084fc',
    timing: '~75 seconds',
    story: `Everything you've seen is in this brief. Built for your next internal conversation. The Leave Behind screen is the closing screen — the one that converts the demo experience into a document the audience can take into their next meeting. But the most important moment on this screen is not the QR code. It is the closing beat.`,
    acts: [
      {
        title: 'Act 1 — The Leave Behind Brief',
        body: [
          'The QR code links to a brief that contains: burning platform data sourced to SD Medicaid and AHIP, three-phase roadmap, KPI projections tied to the 124,847-member population, $697M portfolio exposure, 90-day implementation path.',
          '"When your CFO asks about the numbers — they\'re in there, sourced. When your CTO asks about the architecture — it\'s in there. When your board asks about the competitive position — it\'s in there."',
          'The brief is designed for the internal conversation that happens after the demo — when the audience is making the case to stakeholders who were not in the room.',
        ],
      },
      {
        title: 'Act 2 — The Closing Beat (Leave Behind Idea 1)',
        body: [
          '"One more thing before you go. You\'ve seen what this system does for Maria. But I want to leave you with the provider side of that story."',
          '"Bennett County Health spent 8 minutes acknowledging a CDS Hook that the system assembled and delivered in under 200 milliseconds. He discontinued a duplicate therapy, ordered a lab, and placed a referral — all from inside Epic, without a phone call, without a fax, without a care coordinator chasing him down."',
          '"That is what vertical integration looks like when it actually works. UHG already owns the clinical network. The question is whether the network is connected — or just adjacent."',
          '"Maria Redhawk is finally known. Bennett County Health finally has the context he needs. The question is how many Marias are waiting — and how many Bennett County Healths are still working blind."',
          'PAUSE. DO NOT FILL THE SILENCE. THE NEXT WORDS SHOULD BE THEIRS.',
        ],
      },
    ],
    closingArgument: '"Maria Redhawk is finally known. Bennett County Health finally has the context he needs. The question is how many Marias are waiting — and how many Bennett County Healths are still working blind." — PAUSE. THE NEXT WORDS SHOULD BE THEIRS.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // APPENDIX
  // ══════════════════════════════════════════════════════════════════════════

  {
    number: 'A1',
    title: 'Agent Marketplace Query',
    phase: 'APPENDIX',
    phaseColor: '#94a3b8',
    timing: 'as needed',
    story: `USE WHEN ASKED: "How does the system know which agent to use?" or "How does the Controller select agents?" The Agent Marketplace Query screen is the technical deep-dive on agent selection — the one that shows the query mechanism that makes the 9-agent coalition intelligent rather than hardcoded.`,
    acts: [
      {
        title: 'Act 1 — The Query Mechanism',
        body: [
          'The Controller doesn\'t hardcode agent assignments. It queries a live registry — the Agent Marketplace — every time a new scenario is assembled.',
          'Query parameters: member context (Maria Redhawk, high-risk 7.8), active conditions (cardiac episode, HbA1c gap, CAREGAP_HBA1C expiring, caregiver proxy, SDOH transport barrier, duplicate therapy alert), governance constraints (Martin Pharmacy consent boundary, proxy consent scope), channel preference (portal self-initiated).',
          '31 agents in the registry. The query returns 9 matches. 22 agents are stood down — not because they\'re inactive, but because they\'re not relevant to this specific context.',
        ],
      },
      {
        title: 'Act 2 — The Two Coalition Additions',
        body: [
          'SDOH Navigation Agent — added because the graph traversal surfaced a transport barrier that blocks the standard HbA1c intervention. It carries three capability signatures: SDOH barrier detection, next-best action substitution (home lab kit for clinic appointment), and copay assistance routing. It cannot initiate clinical decisions — it can only modify the delivery method of an existing clinical decision.',
          'Med review Pharmacy Safety Agent — added because the duplicate therapy signal (Lisinopril + Metformin) requires a pharmacy domain specialist with Martin Pharmacy consent awareness. It will dispatch prescriber alerts (clinical safety communications — permitted) and block Martin Pharmacy member outreach (third-party data sharing — requires separate consent) automatically.',
        ],
      },
      {
        title: 'Act 3 — Agent Capability Signatures',
        body: [
          'Each agent in the registry declares what signals it responds to, what authority it operates within, and what escalation path it follows when it hits a governance boundary.',
          'The capability signature is the governance architecture at the agent level: the agent knows its own authority ceiling, its own escalation trigger, and its own consent scope. The Controller reads these signatures at query time and selects agents whose signatures match the current scenario.',
          '"The marketplace is extensible. New agents can be registered with their capability signatures, domain constraints, and governance rules. The Controller discovers them dynamically — no hardcoded routing tables, no manual configuration."',
        ],
      },
    ],
    closingArgument: '"The Controller queried a registry of 31 agents and selected exactly the 9 that match this context. That selectivity is what makes the coalition intelligent rather than exhaustive."',
  },

  {
    number: 'A2',
    title: 'Agent Library',
    phase: 'APPENDIX',
    phaseColor: '#94a3b8',
    timing: 'as needed',
    story: `USE WHEN ASKED: "Can we add our own agents?" or "What agents are available today?" or "How do you govern what agents can do?" The Agent Library is the full 31-agent registry — the one that shows the governance architecture at the agent level.`,
    acts: [
      {
        title: 'Act 1 — The 31-Agent Registry',
        body: [
          'The full registry spans nine domain columns: Care Management, Provider Enablement, Financial, Appeals & Compliance, SDOH, Pharmacy Safety, Behavioral, Caregiver, Employer.',
          'Every agent in the library has three governance attributes: authority ceiling (what it can decide autonomously), escalation trigger (what causes it to hold and route to a human), and consent scope (what data it can access and share). The governance is not a policy document. It is executable code.',
        ],
      },
      {
        title: 'Act 2 — SDOH and Med review Agent Detail',
        body: [
          'SDOH Navigation Agent: Added to the registry when the platform identified that transport barriers were silently failing standard care gap interventions. Authority ceiling: delivery method substitution only — cannot initiate or modify clinical decisions. Escalation trigger: SDOH barrier confidence below 0.70. Consent scope: member-facing communications only.',
          'Med review Pharmacy Safety Agent: Registered with Martin Pharmacy domain awareness and consent boundary enforcement built in. Authority ceiling: prescriber alerts (clinical safety) and Med review outreach suppression. Escalation trigger: A1C value outside therapeutic range — routes to clinical review. Consent scope: clinical safety communications permitted, third-party data sharing blocked without separate consent.',
        ],
      },
      {
        title: 'Act 3 — Extensibility',
        body: [
          '"Your organisation can register domain-specific agents — employer wellness agents, specialty pharmacy agents, behavioral health agents — and the Controller will discover and select them using the same query mechanism. You are not locked into the 31 agents you see here."',
          'The extensibility argument is the platform positioning argument: this is not a fixed solution, it is a capability platform. The 31 agents are the starting point. The organisation\'s domain expertise is the growth path.',
        ],
      },
    ],
    closingArgument: '"The governance is not a policy document. It is executable code. Every agent knows its own authority ceiling, its own escalation trigger, and its own consent scope — and the Controller enforces all three at query time."',
  },

  {
    number: 'A3',
    title: 'Reporting Dashboard',
    phase: 'APPENDIX',
    phaseColor: '#94a3b8',
    timing: 'as needed',
    story: `USE WHEN ASKED: "How do we measure this?" or "What does the audit trail look like?" or "How do we report on agent activity to compliance?" The Reporting Dashboard is the enterprise visibility layer — the one that shows that everything the orchestration system does is logged, attributed, and reportable.`,
    acts: [
      {
        title: 'Act 1 — Population Outcomes',
        body: [
          '23 readmissions prevented this month. $2.1M TCOC impact. 847 scenarios resolved. 71% care gap closure rate — up from 34% baseline. These are not projections. They are outcomes from the current deployment period.',
          'The $2.1M TCOC impact is the financial proof point that ties back to the Burning Platform screen: the TCOC pressure is real, the intervention is measurable, and the outcome is attributable.',
        ],
      },
      {
        title: 'Act 2 — Agent Performance',
        body: [
          'Each agent in the 31-agent registry has a performance record — activation count, resolution rate, escalation rate, average time to resolution.',
          'Med review Pharmacy Safety Agent: 47 activations this month, 44 resolved autonomously, 3 escalated to clinical review. 0 consent boundary violations. The zero consent boundary violations is the compliance argument: the governance architecture is not just a design principle — it is a measurable outcome.',
        ],
      },
      {
        title: 'Act 3 — Channel Attribution and Governance Audit Trail',
        body: [
          'Channel Attribution Reporting: Every outreach action is attributed to the channel it was delivered through and the behavioral signal that justified that channel selection. Maria\'s portal outreach — attributed to the channel history sequence (IVR Day 1, phone Day 8 and 11 unanswered, portal self-initiated Day 14). This is the audit trail that justifies the channel suppression decision.',
          'Governance Audit Trail: Every governance boundary hit is logged with the agent that hit it, the rule that triggered it, the human reviewer assigned, and the resolution. CONSENT.DOMAIN.BOUNDARY.002 — Med review outreach blocked, Martin Pharmacy consent scope, prescriber alerts permitted. Dr. K. Patel clinical necessity review — 68 hours remaining, full context packet attached.',
          '"When your compliance team asks how you can prove the system honored consent boundaries — this is the answer. When your CFO asks how you can attribute the $2.1M TCOC impact to specific agent actions — this is the answer."',
        ],
      },
    ],
    closingArgument: '"Everything the orchestration system does is logged, attributed, and reportable. The governance audit trail is not a compliance report. It is a real-time governance ledger — and it is the answer to every compliance question your team will ask."',
  },
];

// ─── HTML Builder ──────────────────────────────────────────────────────────────

function buildDetailedHTML(): string {
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
    APPENDIX: 'Deep-Dive Reference Screens — Available on Request',
  };

  let currentPhase = '';

  const screensHTML = DETAILED_SCREENS.map((screen) => {
    const color = phaseColors[screen.phase] || '#94a3b8';
    let phaseHeader = '';

    if (screen.phase !== currentPhase) {
      currentPhase = screen.phase;
      const isAppendix = screen.phase === 'APPENDIX';
      phaseHeader = `
        <div style="${isAppendix ? 'page-break-before: always; padding-top: 8px;' : ''}">
          <div class="phase-header" style="border-left: 5px solid ${color}; background: ${color}10;">
            <div class="phase-label" style="color: ${color};">${screen.phase} PHASE</div>
            <div class="phase-subtitle">${phaseSubtitles[screen.phase]}</div>
          </div>
        </div>
      `;
    }

    const actsHTML = screen.acts.map((act, i) => {
      const bodyHTML = act.body.map(line => `<p class="body-line">${line}</p>`).join('');
      const codeHTML = act.code
        ? `<pre class="code-block">${act.code}</pre>`
        : '';
      return `
        <div class="act-block">
          <div class="act-title">
            <span class="act-number" style="background: ${color}20; color: ${color};">ACT ${i + 1}</span>
            <span class="act-name">${act.title}</span>
          </div>
          ${bodyHTML}
          ${codeHTML}
        </div>
      `;
    }).join('');

    return `
      ${phaseHeader}
      <div class="screen-block">
        <div class="screen-header" style="border-bottom: 2px solid ${color}30;">
          <div class="screen-badge" style="background: ${color}20; color: ${color}; border: 1px solid ${color}50;">
            ${screen.number}
          </div>
          <div class="screen-title-group">
            <div class="screen-title">${screen.title}</div>
            <div class="screen-meta">
              <span class="phase-tag" style="color: ${color}; background: ${color}15; border: 1px solid ${color}30;">${screen.phase}</span>
              <span class="timing-tag">⏱ ${screen.timing}</span>
            </div>
          </div>
        </div>

        <div class="story-block" style="border-left: 3px solid ${color}60; background: ${color}06;">
          <div class="section-label" style="color: ${color};">THE STORY</div>
          <p class="story-text">${screen.story}</p>
        </div>

        <div class="acts-section">
          <div class="section-label">TECHNICAL MECHANICS &amp; KEY TALKING POINTS</div>
          ${actsHTML}
        </div>

        <div class="closing-block" style="border-left: 4px solid ${color}; background: ${color}08;">
          <div class="section-label" style="color: ${color};">CLOSING ARGUMENT</div>
          <p class="closing-text">${screen.closingArgument}</p>
        </div>
      </div>
    `;
  }).join('');

  // TOC rows
  const tocPhases = [
    { key: 'FOUNDATION', label: 'FOUNDATION PHASE — "The Problem Is Bigger Than You Think"', color: '#78a9ff', screens: DETAILED_SCREENS.filter(s => s.phase === 'FOUNDATION') },
    { key: 'INTELLIGENCE', label: 'INTELLIGENCE PHASE — "The System That Sees Everything"', color: '#42be65', screens: DETAILED_SCREENS.filter(s => s.phase === 'INTELLIGENCE') },
    { key: 'RESOLUTION', label: 'RESOLUTION PHASE — "What the System Achieved"', color: '#f59e0b', screens: DETAILED_SCREENS.filter(s => s.phase === 'RESOLUTION') },
    { key: 'IMPACT', label: 'IMPACT PHASE — "What It Achieved and What It Means"', color: '#c084fc', screens: DETAILED_SCREENS.filter(s => s.phase === 'IMPACT') },
    { key: 'APPENDIX', label: 'APPENDIX — Deep-Dive Reference Screens', color: '#94a3b8', screens: DETAILED_SCREENS.filter(s => s.phase === 'APPENDIX') },
  ];

  const tocHTML = tocPhases.map(phase => `
    <div class="toc-phase">
      <div class="toc-phase-header" style="background: ${phase.color}12; color: ${phase.color};">${phase.label}</div>
      ${phase.screens.map(s => `
        <div class="toc-row">
          <span class="toc-num" style="color: ${phase.color};">${s.number}</span>
          <span class="toc-screen-title">${s.title}</span>
          <span class="toc-timing">${s.timing}</span>
        </div>
      `).join('')}
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>UHG Orchestrate — Detailed Screen Write-Ups</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      background: #ffffff;
      color: #1a1a1a;
      font-size: 10.5pt;
      line-height: 1.65;
    }

    /* ── Cover ── */
    .cover {
      page-break-after: always;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 80px 72px;
      background: #0f1117;
      color: white;
      position: relative;
    }
    .cover-eyebrow {
      font-family: 'Courier New', monospace;
      font-size: 9pt;
      letter-spacing: 0.22em;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 20px;
    }
    .cover-title {
      font-size: 40pt;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.02em;
      line-height: 1.1;
      margin-bottom: 12px;
    }
    .cover-subtitle {
      font-size: 16pt;
      color: #78a9ff;
      font-weight: 400;
      margin-bottom: 8px;
    }
    .cover-desc {
      font-size: 12pt;
      color: #9ca3af;
      margin-bottom: 48px;
      max-width: 600px;
      line-height: 1.6;
    }
    .cover-divider { width: 64px; height: 3px; background: #002677; margin-bottom: 40px; }
    .cover-meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      max-width: 700px;
    }
    .cover-meta-item { display: flex; flex-direction: column; gap: 4px; }
    .cover-meta-label {
      font-family: 'Courier New', monospace;
      font-size: 8pt;
      letter-spacing: 0.14em;
      color: #6b7280;
      text-transform: uppercase;
    }
    .cover-meta-value { font-size: 10.5pt; color: #d1d5db; }
    .cover-footer {
      position: absolute;
      bottom: 48px;
      left: 72px;
      right: 72px;
      display: flex;
      justify-content: space-between;
    }
    .cover-footer-text {
      font-family: 'Courier New', monospace;
      font-size: 8pt;
      color: #374151;
      letter-spacing: 0.1em;
    }

    /* ── TOC ── */
    .toc-page { page-break-after: always; padding: 56px 72px; }
    .toc-title { font-size: 22pt; font-weight: 700; color: #111827; margin-bottom: 6px; }
    .toc-subtitle { font-size: 11pt; color: #6b7280; margin-bottom: 36px; }
    .toc-phase { margin-bottom: 24px; }
    .toc-phase-header {
      font-family: 'Courier New', monospace;
      font-size: 8pt;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      padding: 8px 12px;
      margin-bottom: 6px;
      border-radius: 4px;
    }
    .toc-row {
      display: flex;
      align-items: baseline;
      gap: 12px;
      padding: 5px 12px;
      border-bottom: 1px solid #f3f4f6;
    }
    .toc-num {
      font-family: 'Courier New', monospace;
      font-size: 9pt;
      min-width: 28px;
    }
    .toc-screen-title { font-size: 10.5pt; color: #1a1a1a; flex: 1; }
    .toc-timing { font-family: 'Courier New', monospace; font-size: 9pt; color: #9ca3af; }

    /* ── Content ── */
    .content { padding: 48px 72px; }

    .phase-header {
      padding: 14px 20px;
      margin: 40px 0 20px 0;
      border-radius: 6px;
    }
    .phase-label {
      font-family: 'Courier New', monospace;
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    .phase-subtitle { font-size: 10pt; color: #4b5563; font-style: italic; }

    .screen-block {
      margin-bottom: 52px;
      page-break-inside: avoid;
    }
    .screen-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 18px;
      padding-bottom: 14px;
    }
    .screen-badge {
      font-family: 'Courier New', monospace;
      font-size: 14pt;
      font-weight: 700;
      padding: 8px 14px;
      border-radius: 6px;
      min-width: 56px;
      text-align: center;
      flex-shrink: 0;
    }
    .screen-title-group { display: flex; flex-direction: column; gap: 6px; padding-top: 4px; }
    .screen-title { font-size: 18pt; font-weight: 700; color: #111827; letter-spacing: -0.01em; }
    .screen-meta { display: flex; align-items: center; gap: 12px; }
    .phase-tag {
      font-family: 'Courier New', monospace;
      font-size: 8pt;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 3px;
    }
    .timing-tag { font-family: 'Courier New', monospace; font-size: 9pt; color: #6b7280; }

    .story-block {
      padding: 16px 20px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    .section-label {
      font-family: 'Courier New', monospace;
      font-size: 7.5pt;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #9ca3af;
      margin-bottom: 10px;
    }
    .story-text {
      font-size: 10.5pt;
      color: #374151;
      line-height: 1.75;
      font-style: italic;
    }

    .acts-section { margin-bottom: 20px; }
    .act-block { margin-bottom: 18px; }
    .act-title {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    .act-number {
      font-family: 'Courier New', monospace;
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 0.1em;
      padding: 3px 8px;
      border-radius: 3px;
      flex-shrink: 0;
    }
    .act-name {
      font-size: 12pt;
      font-weight: 700;
      color: #111827;
    }
    .body-line {
      font-size: 10.5pt;
      color: #374151;
      line-height: 1.7;
      margin-bottom: 8px;
      padding-left: 14px;
      border-left: 2px solid #e5e7eb;
    }
    .code-block {
      font-family: 'Courier New', monospace;
      font-size: 8.5pt;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 3px solid #64748b;
      border-radius: 4px;
      padding: 12px 16px;
      margin: 10px 0 10px 14px;
      color: #334155;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .closing-block {
      padding: 14px 18px;
      border-radius: 4px;
      margin-top: 16px;
    }
    .closing-text {
      font-size: 11pt;
      color: #1f2937;
      line-height: 1.7;
      font-style: italic;
      font-weight: 500;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .cover { min-height: 100vh; }
      .screen-block { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

  <!-- Cover -->
  <div class="cover">
    <div class="cover-eyebrow">UnitedHealth Group · Confidential · Internal Use Only</div>
    <div class="cover-title">Screen Write-Ups</div>
    <div class="cover-subtitle">UHG Orchestrate — Detailed Narrative &amp; Technical Reference</div>
    <div class="cover-desc">
      Comprehensive storytelling and technical detail for every screen in demo sequencing order.
      Each section includes the narrative story, technical mechanics, key talking points, and closing argument.
    </div>
    <div class="cover-divider"></div>
    <div class="cover-meta-grid">
      <div class="cover-meta-item">
        <div class="cover-meta-label">Total Screens</div>
        <div class="cover-meta-value">19 main + 3 appendix (A1–A3)</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">Demo Duration</div>
        <div class="cover-meta-value">~21 minutes</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">Primary Member</div>
        <div class="cover-meta-value">Maria Redhawk — Age 58 · High-Risk Score 7.8</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">Agent Coalition</div>
        <div class="cover-meta-value">9-Agent Coalition · 31-Agent Registry</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">Key Technical Themes</div>
        <div class="cover-meta-value">CDP Assembly · Neo4j Knowledge Graph · FHIR R4 · CDS Hooks · SDOH Discovery · Med review Safety · Governance Architecture</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">Phases</div>
        <div class="cover-meta-value">Foundation · Intelligence · Resolution · Impact · Appendix</div>
      </div>
    </div>
    <div class="cover-footer">
      <div class="cover-footer-text">UNITEDHEALTH GROUP · ORCHESTRATE</div>
      <div class="cover-footer-text">CONFIDENTIAL — INTERNAL USE ONLY</div>
    </div>
  </div>

  <!-- TOC -->
  <div class="toc-page">
    <div class="toc-title">Table of Contents</div>
    <div class="toc-subtitle">22 screens · 5 phases · ~21 minutes main demo</div>
    ${tocHTML}
  </div>

  <!-- Main Content -->
  <div class="content">
    ${screensHTML}
  </div>

</body>
</html>`;
}

// ─── Download Function ─────────────────────────────────────────────────────────

export function downloadDetailedScreenPDF(): void {
  const html = buildDetailedHTML();
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const printWindow = window.open(url, '_blank', 'width=960,height=760');
  if (!printWindow) {
    // Fallback: direct HTML download if popup blocked
    const a = document.createElement('a');
    a.href = url;
    a.download = 'UHG-Orchestrate-Detailed-Screen-WriteUps.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }, 600);
  };
}
