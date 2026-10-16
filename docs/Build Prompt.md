# BUILD.md — DhakaPath Master Parallel Execution Playbook

**Project:** DhakaPath — Multi-Objective Spatio-Temporal Transit Engine & Zero-Hallucination Route Verifier[cite: 1, 2, 3]  
**Competition Track:** IAIT National IT Fest (INIF) 2026 — Smart City Hackathon[cite: 1, 3]  
**Execution Window:** 5 Hours 40 Minutes (340 Minutes)[cite: 1, 2, 3]  
**Team Structure:** 4 Developers (Wave 0 Foundation -> Wave 1 Four 100% Isolated Parallel Tracks -> Wave 2 Sequential Integration)[cite: 1, 2, 3]

---

## 1. Context of the Entire Project

### 1.1 The Core Problem & Championship Thesis
For daily Dhaka commuters and university students, when sudden monsoon waterlogging, intersection blockades, or rush-hour surges disrupt normal transit corridors, the **DhakaPath** platform turns live crowd-verified street alerts, statutory fare rules, and Banglish trip queries into a mathematically verified, multi-leg detour and exact BDT fare split, unlike scattered Facebook traffic posts or private-car navigation maps[cite: 1].

Standard Western navigation apps fail in Dhaka due to four compounding regional asymmetries[cite: 1]:
1. **Severe Velocity Collapse & Non-Metered Surge Economics:** Average vehicular speed in Dhaka has collapsed from 21–25 km/h down to **4.8 km/h** during peak hours (8:00 AM–10:00 AM and 5:00 PM–8:00 PM), draining $1.68B to $11B annually (6%–10% of GDP) and 3.2M–5.0M working hours daily[cite: 1]. During monsoon waterlogging or blockades, non-metered connector rickshaws and CNGs impose **1.5x to 2.5x** weather and rush-hour surges[cite: 1].
2. **Asymmetric Piecewise Student Tariff Rules:** Bangladesh's statutory **50% student discount** applies strictly to local buses with a **10 BDT minimum fare floor**, while offering **zero discount** on the DMTCL MRT-6 Metro Rail (priced from 20 BDT to 100 BDT in 10 BDT increments at 5 BDT/km), legunas, or connector rickshaws[cite: 1, 2]. Naive shortest-path routers or LLM prompts fail when splitting a bus journey across two short bus segments triggers the 10 BDT minimum floor twice[cite: 1, 2].
3. **Linguistic Fragmentation & Poisoned Social Telemetry:** Commuters query routes in phonetic Banglish (e.g., *"bhai Mirpur 10 theke Motijheel jabo, student id ache, 55 takar moddhe. Farmgate e naki pani uthse?"*) and rely on Facebook traffic groups where posts become stale within 15–60 minutes or are spoofed by trolls[cite: 1, 2].
4. **3G Dropouts & Dead Batteries in Transit Corridors:** Heavy single-page apps crash when mobile data drops inside concrete MRT-6 stations or monsoon gridlock at <5% smartphone battery[cite: 1, 2, 3].

### 1.2 Zero Generic Bloat Policy & Winner Rules
- **Strictly Banned:** No `/login`, `/signup`, JWT middleware, OAuth redirects, password reset flows, user profile pages, multi-page admin CRUD tables, or unconstrained LLM chatbot wrappers that invent transit routes or calculate BDT fares in prose[cite: 2, 3].
- **Synchronized 4-Zone Single-Screen Command Center (`100vw x 100vh`):** Role A (Stranded Student/Commuter "Rafi"), Role B (Transit Admin & Crowd Verifier), and Role C (Lead Hackathon Judge) operate simultaneously on one unified viewport with zero tab switches[cite: 3]:
  - **Zone 0 (Top Global Bar — 64px fixed height):** Stage Time-Machine & Chaos Injector (`[1. Normal Baseline]`, `[2. Peak Crisis Surge]`, `[3. Adversarial / Corrupt Input]`), simulated clock scrub slider (`+0m`, `+15m`, `+45m`, `+90m`), global X-Ray Telemetry Pill, and persistent **`[SIMULATED DEMO TELEMETRY — BENCHMARK REPLAY]`** honesty badge[cite: 2, 3].
  - **Zone 1 (Left Column — 28% width):** Banglish NL/Voice Input bar, 1-tap judge query chips, Extracted Constraints Pill Row, ranked Pareto Multi-Leg Route Cards, **Hub Ride-Share Pool Bot**, and **Offline Canvas/Speech Exporter**[cite: 3].
  - **Zone 2 (Center Stage — 44% width):** Top 70% renders the **Dual-Layer Leaflet.js + OpenStreetMap & 15-Hub Metro-Style SVG Schematic Graph**; Bottom 30% renders the **Counterfactual Shadow Baseline vs. DhakaPath Optimal ROI Ledger** (`+64 mins saved`, `+28 BDT saved`, `-82.0% risk`, `8.5 min -> 1.4 sec` latency benchmark)[cite: 2, 3].
  - **Zone 3 (Right Column — 28% width):** X-Ray Security & Sanity Audit Log (`ANOMALOUS_FARE_REJECTED`, `GROUNDING_INTERCEPTED`), Bayesian Crowd Alert Feed with live **30-Minute Half-Life Decay Bars**, `+1 Confirm / -1 Resolve` buttons, and the **Bonus 1 Vision Signboard OCR Ingestor**[cite: 3].

---

## 2. Tech Stack & Zero-Hassle Deployment

| Need | Selected Technology | Hackathon Justification |
| :--- | :--- | :--- |
| **Frontend & API Framework** | **Next.js 14 (App Router, TypeScript)** | Single codebase for the 4-Zone UI and sandboxed API routes; zero-config Vercel deployment[cite: 4]. |
| **Database & Realtime** | **Supabase (`@supabase/supabase-js`)** | Stores `transit_edges`, `street_alerts`, `ride_share_pools`, and `interception_logs` with open anonymous RLS (no login wall!) and automatic in-memory fallback if venue Wi-Fi drops[cite: 2, 3, 4]. |
| **Styling & Components** | **Tailwind CSS + shadcn/ui + Lucide React** | Rapid composition of the Tactical Obsidian × Holographic Night City theme[cite: 3, 4]. |
| **Animations** | **Framer Motion (`framer-motion`)** | Smooth 0.6s fade-up stagger, number tickers, pulsing crimson blockade rings, and cyan route arcs[cite: 3, 4]. |
| **Map & Spatial Layer** | **Leaflet.js + `react-leaflet` + SVG Schematic Overlay** | 100% free OpenStreetMap dark tiles (`minZoom: 11, maxZoom: 16`) overlaid with an interactive 15-Hub SVG graph that works 100% offline[cite: 1, 2, 3, 4]. |
| **Sandboxed AI / Vision** | **Groq (Llama-3.3-70B) + Gemini 2.5 Flash Free Tier** | Strictly confined to JSON intent extraction and signboard OCR with an `800ms` timeout and instant `0.2ms` deterministic Banglish regex fallback[cite: 1, 2, 3]. |
| **Offline Survival** | **Browser-Native HTML5 `<canvas>` + Web Speech API** | Exports `<45 KB` PNG route summary cards (`toDataURL('image/png', 0.85)`) and zero-bandwidth `window.speechSynthesis` audio briefings[cite: 1, 2, 3]. |

### 2.1 Terminal Bootstrap Commands (Run Once in Wave 0)
```bash
npx create-next-app@14 dhakapath --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd dhakapath
npm install @supabase/supabase-js framer-motion lucide-react clsx tailwind-merge leaflet react-leaflet
npm install -D @types/leaflet
```

### 2.2 Environment Variables (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=[https://your-project-id.supabase.co](https://your-project-id.supabase.co)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_USE_MOCK=false
GEMINI_API_KEY=your-free-gemini-api-key
GROQ_API_KEY=your-free-groq-api-key
```

---

## 3. System Architecture, Connected Flow & Parallel File Tree

### 3.1 The 6-State Deterministic Finite State Machine (FSM)
- **State S_0 — Canonical Graph Initialization:** Loads the frozen 15-hub mode-expanded adjacency list (`CANONICAL_GRAPH_G0`), statutory DMTCL MRT-6 fare matrix (20–100 BDT), bus base-fare charts, and boarding landmark notes into memory[cite: 1, 2].
- **State S_1 — Multi-Channel Ingestion & Schema Extraction:** Accepts Scenario Injector toggles, Banglish chat queries, or signboard photos. Sandboxed LLM/VLM extracts JSON constraints with an `800ms` timeout falling back to a `0.2ms` deterministic Banglish phonetic lexer[cite: 1, 2, 3].
- **State S_2 — Rule-Based Sanity Filter & Bayesian Truth Update:** Rejects intra-city bus fares `< 10 BDT` or `> 2.5 * F_base` (`ANOMALOUS_FARE_REJECTED`), quarantines uncorroborated single-user resolutions against active blockades, and computes posterior truth confidence `R_e(t)` via recursive log-odds with a 30-minute exponential half-life decay kernel (`lambda = ln(2) / 30`)[cite: 1, 2, 3].
- **State S_3 — Dynamic Edge-Weight Re-Evaluation:** Pure functional projection `G(t) = f(G_0, S_k, delta_t_sim)` recomputes edge weights, applies rickshaw weather surges `gamma_e(t)`, enforces the 50% student bus pass with the 10 BDT floor, and severs blocked edges (`T_eff -> Infinity` when `R_e(t) >= 0.85`)[cite: 1, 2].
- **State S_4 — Pareto Label-Setting Multi-Objective Routing:** Executes Multi-Criteria Dijkstra over `G(t)` (`|V_exp| = 75`, `|E_exp| ~= 240`) with a 16-bit bitwise cycle guard (`visited_hub_mask`) in `< 0.8 ms`. Automatically activates the **Graceful Fallback Walk-Bridge Protocol** (`4.5 km/h`, `0 BDT`) if motorized paths partition[cite: 1, 2, 3].
- **State S_5 — Subgraph Verification Loop & Offline Briefing Output:** Cross-checks 100% of recommended legs against `G_0` (`V(P*) = 1`), computes Counterfactual Shadow Baseline savings (`P_shadow` vs `P*`), and compiles the `<45 KB` HTML5 Canvas PNG card and Web Speech briefing[cite: 1, 2, 3].

### 3.2 Connected User Journey (Mermaid.js)
```mermaid
graph TD
  Start(["0:00 Stage Open: 5-Second Main Screen<br/>15-Hub Dual-Layer Map + Velocity Alert (4.8 km/h)<br/>Badge: [SIMULATED DEMO TELEMETRY]"]) --> Step1

  subgraph Zone0_Scenario ["Feature 0: Stage Time-Machine & Chaos Injector (Top Bar)"]
    Step1["Presenter / Judge Triggers Scenario Preset<br/>[1. Normal] | [2. Peak Crisis Surge] | [3. Adversarial Input]"]
    Step1 -->|150ms Debounce Lock| PureProj["Pure Graph Projection: G(t) = f(G_0, S_k, delta_t_sim)<br/>Object.freeze(CANONICAL_GRAPH_G0)"]
  end

  PureProj --> BranchChoice{"Active Demo Action?"}

  subgraph Zone1_Commute ["Feature 1 & 2: Banglish Search & Pareto Dijkstra Engine"]
    BranchChoice -->|Commuter Query| BanglishInput["Input Banglish Query:<br/>'Mirpur 10 theke Motijheel, student id ache, 55 BDT, avoid Farmgate'"]
    BanglishInput --> LLMGate{"Groq / Gemini JSON Parser<br/>< 800ms Timeout?"}
    LLMGate -->|Online & Valid Schema| ValidIntent["Strict CommuterQuery JSON:<br/>H_MIRPUR10 -> H_MOTIJHEEL, is_student=true, max_budget_bdt=55"]
    LLMGate -->|Timeout / Malformed| RegexFallback["Deterministic Banglish Phonetic Lexer<br/>Extracts Exact Enums in 0.2ms (Zero Crash)"]
    RegexFallback --> ValidIntent
    ValidIntent --> ParetoEngine["Multi-Criteria Label-Setting Dijkstra (<0.8ms)<br/>16-Bit Cycle Guard + Piecewise Student/MRT-6 Fare Engine"]
    ParetoEngine --> PartitionCheck{"All Motorized Paths<br/>Severed (T_eff = INF)?"}
    PartitionCheck -->|No| GroundingGate["SAT-Style Subgraph Grounding Verifier<br/>V(P*) = 1 (100% Nodes & Fares Verified)"]
    PartitionCheck -->|Yes: Subgraph Partitioned| WalkBridge["Activate Graceful Walk-Bridge Protocol<br/>(4.5 km/h Footpath Bypass, 0 BDT)"]
    WalkBridge --> GroundingGate
  end

  subgraph Zone3_Trust ["Feature 3: Adversarial Shield, Bayesian Decay & Vision OCR"]
    BranchChoice -->|Adversarial / Crowd / OCR| TrustInput["Inject Spoofed 500 BDT Fare / Hallucinated Ferry<br/>OR Drop Bus Signboard Photo"]
    TrustInput --> SanityGate{"Tier 1: Rule-Based Sanity Filter<br/>10 <= Fare <= 2.5x Base?"}
    SanityGate -->|Violation (500 BDT > 62.5 BDT)| RejectLog["Block in <0.1ms: [ANOMALOUS_FARE_REJECTED]<br/>Graph State Untouched"]
    SanityGate -->|Valid Crowd Vote / OCR| BayesUpdate["Tier 2 & 3: Recursive Bayesian Log-Odds Update<br/>30-Min Half-Life Decay + Signboard Subgraph Check"]
    BayesUpdate --> ParetoEngine
  end

  GroundingGate --> Zone2_Render["Render Optimal Route P* (48 BDT, 48 min, 1 Transfer)<br/>+ X-Ray Trace Pill + Shadow ROI Ledger (+64m, +28 BDT Saved)"]

  Zone2_Render --> ActionLoop{"Step 3: Commuter Closes Loop<br/>(1-Click Executable Actions)"}
  ActionLoop -->|Action A: Bonus 3| PoolJoin["Click [Join Hub Ride-Share Pool (2/4 -> 3/4)]<br/>Surged 90 BDT Rickshaw -> 30 BDT/person (-60 BDT Saved)"]
  ActionLoop -->|Action B: Bonus 2| OfflineExport["Click [Export Offline Briefing]<br/>Downloads <45KB HTML5 Canvas PNG + Native Web Speech Readout"]
  ActionLoop -->|Action C: Part 4| CrowdVote["Click [+1 Confirm / -1 Resolve Alert]<br/>Updates Live Bayesian Confidence R_e(t)"]
```

### 3.3 Strict Parallel Directory Ownership (Zero Merge Conflicts)
```text
src/
├── contracts/                        # WAVE 0 (Locked Foundation — Read-Only in Wave 1)
│   ├── schema.ts                     # Shared Enums, Interfaces, & Serialization Laws
│   ├── canonicalGraph.ts             # Frozen 15-Hub Coordinates, MRT-6 & Bus Base Graph G_0
│   ├── mock_data.json                # Deterministic Stage Replay Scenarios & Sample Routes
│   └── adapter.ts                    # Unified Hybrid Service Boundary
├── lib/                              # WAVE 0 (Locked Utilities)
│   ├── supabase.ts                   # Safe Supabase Client with offline fallback
│   └── utils.ts                      # cn(), safeExtractJson(), clampFinite(), EPSILON
├── store/                            # WAVE 0 (Locked State Bridge)
│   └── useDhakaPathStore.tsx         # Global Reactive Context Store for Wave 2 Integration
├── components/ui/                    # WAVE 0 (5 Locked Atomic Primitives)
│   ├── MetricCard.tsx                # #1E293B surface, 1.5px #334155 border, top highlight
│   ├── DualCodedStatusPill.tsx       # Icon + High-contrast semantic pill + tabular-nums
│   ├── IdempotentActionButton.tsx    # Built-in IDLE -> PROCESSING -> RESOLVED lock ring
│   ├── TimeMachineDecaySlider.tsx    # Stepped scrub control (+0m, +15m, +45m, +90m)
│   └── BayesianHalfLifeBar.tsx       # Dual-color posterior R_e(t) & 30-min decay progress bar
│
├── engine/                           # WAVE 1 — TRACK 1 (Dev 1 Exclusively)
│   ├── fareEngine.ts                 # Piecewise Student/MRT-6/Rickshaw Surge/Pool Fare Math
│   ├── paretoRouter.ts               # Label-Setting Pareto Dijkstra + 16-bit Cycle Guard
│   ├── shadowBaseline.ts             # Counterfactual Shadow ROI Delta Synthesizer
│   └── scenarioStore.ts              # Pure functional projection G(t) = f(G_0, S_k, delta_t_sim)
├── app/track-1-engine/page.tsx       # Track 1 Standalone Verification Harness UI
├── app/api/track-1-engine/route.ts   # Track 1 Server Route Handler
│
├── features/feature-3-trust-cms/     # WAVE 1 — TRACK 2 (Dev 2 Exclusively)
│   ├── sanityFilter.ts               # Tier-1 Rule-Based Sanity Gate (10 BDT to 2.5x Base)
│   ├── bayesianTruth.ts              # Recursive Bayesian Log-Odds + 30-Min Exponential Decay
│   ├── rideSharePool.ts              # Bonus 3 Hub Ride-Share Pool Bot (K_e = 1..4)
│   ├── useTrustShieldCms.ts          # Isolated Hook for Zone 3
│   └── TrustShieldAndCmsPanel.tsx    # Zone 3 UI (Audit Log, Alert Feed, Signboard OCR Drawer)
├── app/track-2-trust-cms/page.tsx    # Track 2 Standalone Verification Page
├── app/api/track-2-trust-cms/route.ts# Track 2 Supabase + Sanity API Endpoint
│
├── features/feature-1-commute/       # WAVE 1 — TRACK 3 (Dev 3 Exclusively)
│   ├── banglishParser.ts             # Groq/Gemini JSON Parser + 0.2ms Phonetic Regex Lexer
│   ├── subgraphVerifier.ts           # SAT-Inspired Boolean Verifier V(P) = 1
│   ├── signboardVision.ts            # Bonus 1 Bus Signboard / Fare-Chart Vision Digitizer
│   ├── useCommuteCommand.ts          # Isolated Hook for Zone 1
│   └── CommuteCommandPanel.tsx       # Zone 1 UI (Banglish Input, Pareto Cards, Pool/Export CTA)
├── app/track-3-commute/page.tsx      # Track 3 Standalone Verification Page
├── app/api/track-3-commute/route.ts  # Track 3 Sandboxed LLM/Vision API Endpoint
│
├── shell/                            # WAVE 1 — TRACK 4 (Dev 4 Exclusively)
│   ├── ScenarioInjectorBar.tsx       # Zone 0 Top Time-Machine Bar + Hotkeys (Alt+1/2/3/R)
│   ├── TopologicalMap.tsx            # Zone 2 Dual-Layer Leaflet/OSM + 15-Hub SVG Schematic Map
│   ├── CounterfactualRoiLedger.tsx   # Zone 2 Bottom Split ROI Ledger (+64m, +28 BDT, -82% Risk)
│   ├── offlineBriefingExporter.ts    # Bonus 2 Offscreen HTML5 Canvas (<45KB PNG) + Web Speech
│   ├── XRayMathDrawer.tsx            # Expandable 3-Line Formula Audit Drawer (Ctrl+Shift+D)
│   ├── useScenarioInjector.ts        # Isolated Hook for Zone 0
│   └── useTopologicalRoi.ts          # Isolated Hook for Zone 2
├── app/track-4-map-shell/page.tsx    # Track 4 Standalone Verification Page
├── app/api/track-4-map-shell/route.ts# Track 4 Telemetry Snapshot Endpoint
│
└── app/page.tsx                      # WAVE 2 — INTEGRATION (Unified 4-Zone Command Center)
```

---

## 4. Master Design System Prompt ("Midnight Aurora" × "Holographic Night City" × "Tactical Obsidian")

All prompts in Wave 0, Wave 1, and Wave 2 are wired to this exact design system derived from **`Hackathon UI Playbook`** and **`03_uxflow.md`**[cite: 3, 4]:

```markdown
### MASTER UI/UX DESIGN SPECIFICATION (MANDATORY FOR ALL TRACKS)
1. **Atmospheric Background Stack ("Midnight Aurora" × "Holographic Night City"):**
   - **Base Canvas:** Deep Obsidian `#070B14` (never pure `#000000`)[cite: 3, 4].
   - **Aurora & Grid Layers:** 2 blurred aurora blobs (`#3B82F6` electric blue and `#06B6D4` cyan at 15% opacity, `blur-3xl`), a faint perspective/dot grid at 5% opacity fading at the edges, and a 3% SVG `feTurbulence` film-grain overlay[cite: 4].
   - **Elevated Panel Surface:** Midnight Slate `#0F172A` with `backdrop-blur-md`[cite: 3, 4].
   - **Interactive Card Surface:** Tactical Navy `#1E293B` with a projector-safe `1.5px solid #334155` border (`#475569` on hover, `2px solid #06B6D4` when active) and a brighter top inner highlight (`border-t border-white/15`)[cite: 3, 4].
   - **Radius & Glow Shadows:** `rounded-2xl` (16px) on cards, `rounded-full` pill on buttons and badges, and colored glow shadows (`shadow-[0_0_40px_rgba(6,182,212,0.2)]`)—never gray drop shadows on dark UI[cite: 4].

2. **Projector-Safe Semantic Color Tokens (> 7.5:1 Contrast vs `#0F172A`):**
   - **Primary Action & Pareto Optimal Path (P*):** Electric Cyan `#06B6D4` (Text `#083344` on solid fill)[cite: 3].
   - **Algorithmic / Grounding Confidence (Optimal State):** Signal Emerald `#10B981` (Pill BG `#064E3B`, Text `#6EE7B7`) for `[GRAPH_GROUNDED: 100% VERIFIED]`, Student 50% Half-Fare badges, and positive ROI deltas (`+64m`, `+28 BDT`)[cite: 3].
   - **Surge Warning & Pending Corroboration:** High-Vis Amber `#F59E0B` (Pill BG `#451A03`, Text `#FDE68A`) for `1.8x WEATHER SURGE`, `PENDING_CORROBORATION`, and `Walk-Bridge` detours[cite: 3, 4].
   - **Critical Blockade & Adversarial Rejection:** Crimson Pulse `#F43F5E` (Pill BG `#4C0519`, Text `#FDA4AF`) for severed graph edges (`R_e(t) >= 0.85 -> T_eff = INF`), `ANOMALOUS_FARE_REJECTED`, and `GROUNDING_INTERCEPTED`[cite: 3, 4].
   - **5 Transport Mode Visual Tokens (Stroke Geometry + Color):**
     - `METRO` (MRT-6): `#22C55E` (Solid Thick `5px`)[cite: 3]
     - `BUS`: `#3B82F6` (Solid `3.5px`)[cite: 3]
     - `LEGUNA`: `#A855F7` (Dash-Dot)[cite: 3]
     - `RICKSHAW`: `#F59E0B` (Short Dash)[cite: 3]
     - `WALK`: `#94A3B8` (Dotted)[cite: 3]

3. **Typography Scale & Strict Numeric Clamping:**
   - **Display & UI Font:** `Plus Jakarta Sans` (`font-sans`), secondary text `#E2E8F0` / `#A1A1AA`, Bangla/Banglish in `Hind Siliguri` / `Noto Sans Bengali`[cite: 3, 4].
   - **Telemetry & Math Trace Font:** `JetBrains Mono` (`font-mono tabular-nums`) so live decay timers, millisecond traces (`0.78 ms`), and BDT totals never jitter horizontally[cite: 3].
   - **Minimum Data Label Size:** Strictly `14px` (`text-sm font-medium text-[#E2E8F0]`)—zero sub-12px muddy gray captions[cite: 3].
   - **Hero KPI & Fare Metrics:** `28px to 36px` (`text-3xl font-extrabold text-white`)[cite: 3].

4. **Dual-Coded Status Indicators & High-Agency Micro-Copy:**
   - Every status indicator MUST combine **Distinct Vector Icon + High-Contrast Solid Border Pill + Uppercase Text Label**[cite: 3].
   - Replace generic labels ("Submit", "Join", "Approve", "Upload") with high-agency micro-copy:
     - **`[Compute Verified Pareto Detour]`** (+ 1-tap override pills: `[Force Student Pass: ON]`, `[Bypass Flooded Hubs]`, `[Unlock Walk-Bridge (4.5 km/h)]`)[cite: 3]
     - **`[Join Hub Pool (2/4 -> 3/4) • Lock 30 BDT Split]`** (+ rollback `[Leave Pool / Solo Rickshaw (90 BDT)]`)[cite: 3]
     - **`[Corroborate Blockade (+1 Vote)]`** / **`[Mark Corridor Cleared (-1)]`** (+ `[Override Decay & Quarantine Anomaly]`)[cite: 3]
     - **`[Scan Bus Signboard & Ground Edges]`** (+ `[Commit Verified Edges to Graph G_0]`)[cite: 3]
```

---

## 5. Wave Execution Prompts (Wave 0, Wave 1, Wave 2)

---

### WAVE 0: Foundation (1 Person — Minute 0 to Minute 30)

#### Prompt 0.1 — Wave 0 Foundation: Supabase Schema + RLS, Locked Contracts, Canonical 15-Hub Graph, Store & 5 Atomic UI Primitives
- **Prompt Name:** `W0-FOUNDATION-CORE`
- **Branch Name:** `wave-0/foundation` (Merge into `main` immediately so all 4 devs pull at Minute 30)
- **Commit Name:** `feat(wave-0): setup supabase schema, locked contracts, canonical 15-hub graph, store, and 5 atomic UI primitives`
- **Short Description:** Establishes the complete Wave 0 foundation: the Supabase SQL migration with open anonymous RLS policies, the locked `src/contracts/schema.ts` file enforcing the Zero-Drift Serialization Law, the frozen 15-hub Dhaka transit network `CANONICAL_GRAPH_G0`, the global reactive state store, and the 5 reusable Tactical Obsidian UI primitives[cite: 2, 3, 4].

##### Copy-Paste Prompt for Wave 0:
```text
You are the Principal Systems Architect for DhakaPath (INIF 2026 Smart City Hackathon).
Always give me full, complete, working code for every file—never use placeholders, `// TODO`, or truncated snippets.

Build the complete Wave 0 Foundation for our Next.js 14 (App Router, TypeScript, Tailwind CSS) + Supabase project so our 4 developers can work 100% in parallel in Wave 1 with zero file collisions.

Create the following files with full working code:

1. `supabase/migrations/0001_dhakapath_core.sql`
Create the PostgreSQL schema and seed data:
- Tables:
  - `transit_edges` (`edge_id` text primary key, `origin_hub_id` text not null, `dest_hub_id` text not null, `mode` text not null, `route_name` text not null, `distance_km` float8 not null, `base_fare_bdt` int4 not null, `base_duration_ms` int4 not null, `student_half_fare_eligible` boolean not null default false, `boarding_landmark` text not null, `created_at` timestamptz default now())
  - `street_alerts` (`alert_id` text primary key, `edge_id` text not null, `hub_id` text not null, `incident_type` text not null, `status` text not null, `validation_status` text not null, `severity_alpha` float8 not null, `confidence_pct` float8 not null, `half_life_remaining_ms` int4 not null, `created_timestamp_ms` int8 not null, `votes` jsonb not null default '[]'::jsonb)
  - `ride_share_pools` (`edge_id` text primary key, `hub_id` text not null, `pool_size_count` int4 not null default 2, `member_session_ids` jsonb not null default '["seed_commuter_1","seed_commuter_2"]'::jsonb, `updated_timestamp_ms` int8 not null)
  - `interception_logs` (`event_id` text primary key, `timestamp_ms` int8 not null, `status` text not null, `rejected_payload_summary` text not null, `execution_time_ms` float8 not null)
- Enable RLS on all 4 tables and create open anonymous access policies (`CREATE POLICY "Allow public read/write for hackathon demo" ON <table_name> FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);`) because `/login` is strictly banned.
- Seed initial rows for `street_alerts` (`H_FARMGATE` WATERLOGGING at 91.8% confidence and `H_MALIBAGH` SEVERE_GRIDLOCK at 89.2% confidence) and `ride_share_pools`.

2. `src/contracts/schema.ts` (LOCKED CONTRACT — DO NOT MODIFY IN WAVE 1)
Include these exact enums and interfaces:
- `HubId`: `H_UTTARA`, `H_MIRPUR10`, `H_AGARGAON`, `H_MOHAKHALI`, `H_BADDA`, `H_BANASREE`, `H_MALIBAGH`, `H_FARMGATE`, `H_MOHAMMADPUR`, `H_DHANMONDI`, `H_SCIENCELAB`, `H_SHAHBAGH`, `H_MOTIJHEEL`, `H_JATRABARI`, `H_GULISTAN` (15 canonical Dhaka hubs).
- `TransportMode`: `BUS`, `METRO`, `LEGUNA`, `RICKSHAW`, `WALK`.
- `ScenarioPreset`: `NORMAL_BASELINE`, `PEAK_CRISIS_SURGE`, `ADVERSARIAL_CORRUPT_INPUT`.
- `IncidentType`: `WATERLOGGING`, `INTERSECTION_BLOCKADE`, `SEVERE_GRIDLOCK`, `ROAD_CONSTRUCTION`.
- `AlertStatus`: `VERIFIED_ACTIVE`, `PENDING_CORROBORATION`, `EXPIRED`, `RESOLVED`.
- `ValidationStatus`: `GRAPH_GROUNDED`, `ANOMALOUS_FARE_REJECTED`, `CONTRADICTORY_REPORT_QUARANTINED`, `GROUNDING_INTERCEPTED`.
- `ActionLockState`: `IDLE`, `PROCESSING`, `RESOLVED`.
- Interfaces: `TransitEdge`, `CrowdVote`, `StreetAlert`, `CommuterQuery`, `RouteLeg`, `ParetoRouteOption`, `CounterfactualRoiMetrics`, `AuditInterceptionEvent`, `ScenarioInjectorViewState`, `CommuteCommandViewState`, `MapAndRoiViewState`, `TrustShieldCmsViewState`, and `HubMetadata` (`hub_id: HubId`, `index: number`, `name_en: string`, `name_bn: string`, `lat: number`, `lng: number`, `svg_x: number`, `svg_y: number`, `keywords: ReadonlyArray<string>`).

3. `src/contracts/canonicalGraph.ts`
Export `CANONICAL_HUBS: Readonly<Record<HubId, HubMetadata>>` and `CANONICAL_GRAPH_G0: ReadonlyArray<TransitEdge>` wrapped in `Object.freeze()`:
- Populate all 15 hubs with accurate Dhaka GPS coordinates (`lat`, `lng`), schematic SVG coordinates (`svg_x` in `60..740`, `svg_y` in `40..560`), and English/Banglish/Bangla keywords.
- Populate at least 36 directed `TransitEdge` objects across all 5 modes (`METRO`, `BUS`, `LEGUNA`, `RICKSHAW`, `WALK`), including:
  - `E_WALK_MIRPUR10_BRIDGE`: `H_MIRPUR10 -> H_MIRPUR10` or connector walk to Metro Footbridge (`0 BDT`, `180000 ms`, `"Mirpur-10 Golchottor Footbridge"`)
  - `E_MRT6_MIRPUR10_AGARGAON`: `H_MIRPUR10 -> H_AGARGAON`, `METRO`, `"DMTCL MRT-6 Metro Rail"`, `distance_km: 4.2`, `base_fare_bdt: 30`, `base_duration_ms: 420000` (7 min), `student_half_fare_eligible: false`, `"Mirpur-10 Metro Concourse Platform 2"`
  - `E_MRT6_MIRPUR10_MOTIJHEEL`: `H_MIRPUR10 -> H_MOTIJHEEL`, `METRO`, `"DMTCL MRT-6 Direct"`, `distance_km: 11.8`, `base_fare_bdt: 60`, `base_duration_ms: 1320000` (22 min), `student_half_fare_eligible: false`, `"Mirpur-10 Metro Concourse Platform 2"`
  - `E_BUS_BIHANGA_AGARGAON_MOTIJHEEL`: `H_AGARGAON -> H_MOTIJHEEL` (via Mohakhali–Malibagh Flyover Bypass), `BUS`, `"Bihanga Paribahan (Flyover Bypass)"`, `distance_km: 8.5`, `base_fare_bdt: 36` (Student 50% = 18 BDT), `base_duration_ms: 2280000` (38 min), `student_half_fare_eligible: true`, `"Agargaon South Footbridge Bus Bay"`
  - `E_BUS_SURFACE_MIRPUR10_FARMGATE`: `H_MIRPUR10 -> H_FARMGATE`, `BUS`, `"Mirpur Link Surface Bus"`, `distance_km: 6.2`, `base_fare_bdt: 25`, `base_duration_ms: 1800000` (30 min), `student_half_fare_eligible: true`, `"Mirpur-10 Sony Cinema Stand"`
  - `E_BUS_SURFACE_FARMGATE_SHAHBAGH`: `H_FARMGATE -> H_SHAHBAGH`, `BUS`, `"Trust Transport Surface"`, `distance_km: 2.8`, `base_fare_bdt: 16` (Student 50% = 10 BDT floor!), `base_duration_ms: 1200000` (20 min), `student_half_fare_eligible: true`, `"Farmgate Ananda Cinema Gate"`
  - `E_BUS_SURFACE_SHAHBAGH_MOTIJHEEL`: `H_SHAHBAGH -> H_MOTIJHEEL`, `BUS`, `"Victor Classic"`, `distance_km: 3.5`, `base_fare_bdt: 20` (Student 50% = 10 BDT), `base_duration_ms: 1320000` (22 min), `student_half_fare_eligible: true`, `"Shahbagh Aziz Super Market Stop"`
  - Plus complete bidirectional coverage for `H_UTTARA`, `H_MOHAKHALI`, `H_BADDA`, `H_BANASREE`, `H_MALIBAGH`, `H_MOHAMMADPUR`, `H_DHANMONDI`, `H_SCIENCELAB`, `H_GULISTAN`, `H_JATRABARI` across `BUS`, `METRO`, `LEGUNA`, `RICKSHAW` (e.g., `E_RICK_MOTIJHEEL_LASTMILE` with `base_fare_bdt: 50`, surging `1.8x` to `90 BDT` in Peak Crisis so a 3-person pool splits it to `30 BDT`), and `WALK` bridges.

4. `src/lib/supabase.ts` and `src/lib/utils.ts`
- `supabase.ts`: Safe client initialization that never throws if `.env.local` is empty.
- `utils.ts`: Export `EPSILON = 1e-6`, `cn()`, `safeExtractJson<T>(rawLlmText: string, fallback: T): T` (using first `{` to last `}` extraction), `formatDurationMin(ms: number): string`, and `clampFinite(val: number, min: number, max: number, fallback: number): number`.

5. `src/contracts/mock_data.json`, `src/contracts/adapter.ts`, and `src/store/useDhakaPathStore.tsx`
- Provide a complete reactive context store (`DhakaPathProvider` and `useDhakaPathStore()`) and `TransitAdapter` with deterministic default state so all 4 tracks have live reactive state and fallback mock data immediately.

6. `src/components/ui/` (5 Locked Atomic Primitives)
Implement with the exact Tactical Obsidian × Holographic Night City styling (`#070B14`, `#0F172A`, `#1E293B`, `1.5px solid #334155`, `#06B6D4`, `#10B981`, `#F59E0B`, `#F43F5E`, `JetBrains Mono tabular-nums`):
- `src/components/ui/MetricCard.tsx`
- `src/components/ui/DualCodedStatusPill.tsx`
- `src/components/ui/IdempotentActionButton.tsx`
- `src/components/ui/TimeMachineDecaySlider.tsx`
- `src/components/ui/BayesianHalfLifeBar.tsx`

7. `src/app/layout.tsx` and `src/app/globals.css`
Configure `Plus Jakarta Sans`, `JetBrains Mono`, and `Hind Siliguri` fonts, wrap `{children}` in `<DhakaPathProvider>`, and render the 4-layer Midnight Aurora background stack (`#070B14` base + cyan/blue aurora blobs + fading perspective grid + 3% SVG noise grain).
```

##### Wave 0 Verification Checklist:
- [ ] `supabase/migrations/0001_dhakapath_core.sql` executes cleanly in Supabase with RLS enabled and anonymous read/write policies active[cite: 2].
- [ ] `src/contracts/schema.ts` exports all uppercase enums (`HubId`, `TransportMode`, `ScenarioPreset`, `IncidentType`, `AlertStatus`, `ValidationStatus`, `ActionLockState`) and enforces `_ms`, `_bdt`, and `_pct` suffixes[cite: 2, 3].
- [ ] `Object.isFrozen(CANONICAL_GRAPH_G0)` is `true` and contains all 15 hubs and 5 transport modes[cite: 1, 2].
- [ ] All 5 atomic primitives in `src/components/ui/` compile and follow the Tactical Obsidian palette (`#070B14` / `#0F172A` / `#1E293B`)[cite: 3, 4].
- [ ] `npm run build` succeeds and `wave-0/foundation` is merged into `main`.

---

### WAVE 1: Four Parallel Vertical Tracks (4 Developers Simultaneously — Minute 30 to Minute 260)

> **ISOLATION LAW:** All 4 developers run `git checkout main && git pull origin main`, then create their assigned track branch. Do NOT touch any file outside your assigned track directories[cite: 2, 3].

---

#### Prompt 1.1 — Track 1 (Dev 1: Systems & Graph Architect): Pareto Dijkstra Engine, Piecewise Student/MRT-6 Fare Math & Shadow Baseline ROI
- **Prompt Name:** `W1-TRACK-1-PARETO-ENGINE`
- **Branch Name:** `wave-1/track-1-pareto-engine`
- **Commit Name:** `feat(track-1): implement mode-expanded pareto dijkstra, piecewise student tariff engine, and counterfactual shadow ROI`
- **Short Description:** Builds the deterministic mathematical routing and tariff engine in `src/engine/`, the server API route `/api/track-1-engine`, and a standalone Interactive Engine Verification Console at `/track-1-engine`[cite: 1, 2, 3].

##### Copy-Paste Prompt for Track 1 (Dev 1):
```text
You are Dev 1 (Systems & Graph Architect) for DhakaPath.
Always give me full, complete, working code for every file—never use placeholders or truncated snippets.

STRICT DIRECTORY OWNERSHIP: You may ONLY create or edit files in:
- `src/engine/fareEngine.ts`
- `src/engine/paretoRouter.ts`
- `src/engine/shadowBaseline.ts`
- `src/engine/scenarioStore.ts`
- `src/app/api/track-1-engine/route.ts`
- `src/app/track-1-engine/page.tsx`
Do NOT modify `src/contracts/schema.ts` or any file in `src/features/` or `src/shell/`.

### 1. `src/engine/fareEngine.ts` (Deterministic Piecewise Multi-Modal Tariff Engine)
Implement `computeLegCost(edge: TransitEdge, isStudent: boolean, surgeMultiplier: number, poolSizeCount: number)` with zero LLM arithmetic and `EPSILON = 1e-6`:
- If `edge.mode === TransportMode.BUS` and `isStudent === true` and `edge.student_half_fare_eligible`:
  `Math.max(10, Math.ceil(0.5 * edge.base_fare_bdt))` (Enforces statutory 50% student pass with 10 BDT minimum floor).
- If `edge.mode === TransportMode.BUS` and (`!isStudent` or `!edge.student_half_fare_eligible`):
  `edge.base_fare_bdt`.
- If `edge.mode === TransportMode.METRO`:
  `Math.min(100, Math.max(20, 10 * Math.ceil((5.0 * edge.distance_km) / 10.0)))` (Enforces DMTCL MRT-6 20–100 BDT step tariff at 5 BDT/km with ZERO student discount).
- If `edge.mode === TransportMode.LEGUNA`:
  `edge.base_fare_bdt` (Zero student discount).
- If `edge.mode === TransportMode.RICKSHAW`:
  `Math.ceil((edge.base_fare_bdt * safeSurge) / (safePoolSize + EPSILON))` where `safeSurge` is clamped in `[1.0, 3.0]` and `safePoolSize` is clamped in `[1, 4]`.
- If `edge.mode === TransportMode.WALK`:
  `0`.
- Also implement `computeEffectiveDurationMs(edge: TransitEdge, alert: StreetAlert | undefined, preset: ScenarioPreset): number`:
  - If `alert` has `confidence_pct >= 85` and (`alert.incident_type === IncidentType.WATERLOGGING` or `alert.incident_type === IncidentType.INTERSECTION_BLOCKADE`) and `edge.mode !== TransportMode.METRO` and `edge.mode !== TransportMode.WALK`:
    return `Number.POSITIVE_INFINITY` (severed surface edge).
  - Otherwise compute `T_eff = edge.base_duration_ms * (1 + alpha_e * (confidence_pct / 100))`, guarded by `Number.isFinite()`.

### 2. `src/engine/paretoRouter.ts` (Multi-Criteria Label-Setting Dijkstra + Walk-Bridge Fallback)
Implement `executeParetoSearch(query: CommuterQuery, preset: ScenarioPreset, activeAlerts?: ReadonlyArray<StreetAlert>, poolSizes?: Readonly<Record<string, number>>)`:
- Build a pre-indexed Adjacency List from `CANONICAL_GRAPH_G0` and a Binary Min-Heap Priority Queue keyed by Normalized Generalized Cost `J(P)`:
  `J(P) = 0.45 * (weightedDurationMs / (180 * 60000 + EPSILON)) + 0.40 * (totalEffectiveFareBdt / (300 + EPSILON)) + 0.15 * (transfersCount / (5 + EPSILON))`
- Enforce the O(1) 16-bit bitwise cycle guard:
  ```ts
  const nextHubBit = 1 << nextHubIndex;
  if ((currentLabel.visited_hub_mask & nextHubBit) !== 0) {
    continue; // Strictly elementary path: prevents cyclic loops
  }
  const nextFareBdt = currentLabel.total_fare_bdt + legFareBdt;
  if (query.max_budget_bdt > 0 && nextFareBdt > query.max_budget_bdt) {
    continue; // Prune trajectories violating commuter cash budget
  }
  ```
- Prune any edge whose `dest_hub_id` is in `query.avoid_hub_ids` (except origin/dest if explicitly queried) or where `!Number.isFinite(legDurationMs)`.
- Retain up to `4` non-dominated Pareto labels `(duration_ms, effective_fare_bdt, transfers_count)` per vertex.
- If severe blockades sever all motorized paths (`routes.length === 0`), automatically invoke the **Graceful Fallback Walk-Bridge Protocol** (`4.5 km/h` pedestrian footpath bypass edges unlocked around severed hubs) and flag `walk_bridge_active: true`.
- Memoize results by `route_cache_key = "${origin}_${dest}_${isStudent}_${budget}_${avoidHash}_${preset}_${alertsHash}_${poolHash}"`.
- Guarantee the exact Championship Golden Trace for `H_MIRPUR10 -> H_MOTIJHEEL` (`is_student: true, max_budget_bdt: 55`) under `PEAK_CRISIS_SURGE` (Farmgate waterlogged `R_e = 91.8% >= 85%`):
  - Direct MRT-6 (`60 BDT`) is pruned because `60 > 55 BDT`.
  - Optimal Route `P*` (#1):
    1. Leg 1: `WALK` (`0 BDT`, `3 min`, `"Mirpur-10 Golchottor Footbridge"`)
    2. Leg 2: `METRO` MRT-6 Mirpur-10 to Agargaon (`30 BDT`, `7 min`, `"Mirpur-10 Metro Concourse Platform 2"`)
    3. Leg 3: `BUS` Bihanga Paribahan from Agargaon to Motijheel via Mohakhali Flyover (`Regular 36 BDT -> Student 18 BDT`, `38 min`, `"Agargaon South Footbridge Bus Bay"`)
    - Total `P*`: **`48 BDT`, `48 min` (`2,880,000 ms`), `1 transfer`**, computed in `< 0.8 ms`.
  - Also include a secondary Pareto option with a last-mile connector rickshaw leg (`E_RICK_MOTIJHEEL_LASTMILE`) so the user can test splitting a surged `90 BDT` rickshaw down to `30 BDT` (3/4 pool) on any route card.

### 3. `src/engine/shadowBaseline.ts` (Counterfactual ROI Synthesizer)
Implement `computeSafeTimeDeltaMin(shadowMin: number, optimalMin: number): number` and `computeCounterfactualRoi(optimalRoute: ParetoRouteOption | null, query: CommuterQuery, preset: ScenarioPreset, alerts: ReadonlyArray<StreetAlert>): CounterfactualRoiMetrics`:
- Evaluate the naive geographic surface baseline `P_shadow` (without disruption avoidance, without student pass optimization `u_stu = 0`, and with solo rickshaw `K_e = 1`).
- Clamp any severed surface segment (`T_eff = Infinity`) on `P_shadow` to the empirical BUET ARI gridlock stall bound (`112 min = 6,720,000 ms`, `76 BDT` under `PEAK_CRISIS_SURGE`) so `Infinity` or `NaN` never appears in the UI.
- Under the Golden Trace (`P_shadow = 112 min, 76 BDT` vs `P* = 48 min, 48 BDT`), return exact verified deltas:
  - `time_saved_ms: 3840000` (`+64 mins saved`)
  - `cost_saved_bdt: 28` (`+28 BDT saved`)
  - `risk_reduction_pct: 82.0` (`-82.0% blockade risk`)
  - `benchmark_manual_latency_ms: 510000` (`8.5 min`)
  - `benchmark_engine_latency_ms: 1400` (`1.4 sec`)

### 4. `src/engine/scenarioStore.ts`
Implement pure functional scenario projections `projectScenario(preset: ScenarioPreset, simOffsetMs: number)` derived strictly from frozen `CANONICAL_GRAPH_G0` with a `150ms` idempotent lock (`action_id = "SCENARIO_" + preset + "_" + simOffsetMs`).

### 5. `src/app/api/track-1-engine/route.ts` and `src/app/track-1-engine/page.tsx`
Build the POST API handler and a Tactical Obsidian interactive benchmark page at `/track-1-engine` where judges or developers can test all 15 hubs, inspect the 16-bit bitmask cycle guard, run a "5x Rapid Click Idempotency Stress Test", and view the live `0.78 ms` execution trace.
```

##### Track 1 Verification Checklist:
- [ ] `http://localhost:3000/track-1-engine` loads cleanly and executes Pareto routing in `< 1 ms`[cite: 1, 2].
- [ ] Under `PEAK_CRISIS_SURGE`, `H_MIRPUR10 -> H_MOTIJHEEL` (`is_student: true, max_budget_bdt: 55`) prunes the 60 BDT direct Metro and returns **`48 BDT, 48 min, 1 transfer`** (`Walk 0 BDT + MRT-6 30 BDT + Bihanga Bus 18 BDT`)[cite: 1, 2, 3].
- [ ] Short bus legs with regular fare `16 BDT` clamp to the **`10 BDT` student minimum floor** (`max(10, ceil(0.5 * 16)) = 10 BDT`), while MRT-6 never receives a student discount[cite: 1, 2].
- [ ] Rapidly clicking `[2. Peak Crisis Surge]` 5 times in 1 second produces zero cumulative fare drift[cite: 2].

---

#### Prompt 1.2 — Track 2 (Dev 2: Trust, Validation & CMS Lead): Rule-Based Sanity Gate, Recursive Bayesian Decay, Ride-Share Pool Bot & Zone 3 UI
- **Prompt Name:** `W1-TRACK-2-TRUST-CMS`
- **Branch Name:** `wave-1/track-2-trust-cms`
- **Commit Name:** `feat(track-2): implement sanity filter, 30-min bayesian decay engine, ride-share pool bot, and zone 3 trust shield UI`
- **Short Description:** Builds the Part 1 Transit & Street-Status CMS, Part 4 Rule-Based Sanity Gate (`ANOMALOUS_FARE_REJECTED`), Recursive Bayesian Truth Discovery with 30-minute exponential half-life decay, Bonus 3 Hub Ride-Share Pool Bot (`K_e = 1..4`), Supabase integration, and the complete **Zone 3 Right Column UI** (`TrustShieldAndCmsPanel.tsx`)[cite: 1, 2, 3].

##### Copy-Paste Prompt for Track 2 (Dev 2):
```text
You are Dev 2 (Trust, Validation & CMS Lead) for DhakaPath.
Always give me full, complete, working code for every file—never use placeholders or truncated snippets.

STRICT DIRECTORY OWNERSHIP: You may ONLY create or edit files in:
- `src/features/feature-3-trust-cms/sanityFilter.ts`
- `src/features/feature-3-trust-cms/bayesianTruth.ts`
- `src/features/feature-3-trust-cms/rideSharePool.ts`
- `src/features/feature-3-trust-cms/useTrustShieldCms.ts`
- `src/features/feature-3-trust-cms/TrustShieldAndCmsPanel.tsx`
- `src/app/api/track-2-trust-cms/route.ts`
- `src/app/track-2-trust-cms/page.tsx`
Do NOT modify `src/contracts/schema.ts` or any file in `src/engine/`, `src/features/feature-1-commute/`, or `src/shell/`.

### 1. `src/features/feature-3-trust-cms/sanityFilter.ts` (Tier-1 Rule-Based Sanity Filter)
Implement `validateFareSubmission(edgeId: string, submittedFareBdt: number)` and `validateAlertResolution(alert: StreetAlert, voterReliabilityWeight: number)`:
- Look up the canonical edge in `CANONICAL_GRAPH_G0`.
- If `submittedFareBdt < 10` or `submittedFareBdt > 2.5 * edge.base_fare_bdt`:
  Immediately reject in `< 0.1 ms` with `ValidationStatus.ANOMALOUS_FARE_REJECTED` and return an `AuditInterceptionEvent` (e.g., `"Mirpur-10 -> Farmgate: 500 BDT (Max Allowed: 62.5 BDT)"`).
- If an alert currently has `confidence_pct >= 80.0` (corroborated by >= 3 independent votes) and a single user submits a `-1` resolution vote, quarantine the flip as `ValidationStatus.CONTRADICTORY_REPORT_QUARANTINED` and keep `AlertStatus.VERIFIED_ACTIVE` until the Bayesian posterior drops below `85%`.

### 2. `src/features/feature-3-trust-cms/bayesianTruth.ts` (Tier-2 Recursive Bayesian Decay Engine)
Implement the exact exponential spatio-temporal decay formula with a 30-minute half-life (`LAMBDA_PER_MIN = Math.LN2 / 30.0` and `EPSILON = 1e-6`):
```ts
const EPSILON = 1e-6;
const LAMBDA_PER_MIN = Math.LN2 / 30.0; // 30-minute half-life

export function computePosteriorConfidence(
  prior: number,
  votes: ReadonlyArray<{ direction: 1 | -1; reliability_weight: number; timestamp_ms: number }>,
  now_ms: number
): number {
  const safePrior = Math.min(1 - EPSILON, Math.max(EPSILON, prior));
  let logOdds = Math.log((safePrior + EPSILON) / (1 - safePrior + EPSILON));
  for (const v of votes) {
    const deltaMin = Math.max(0, (now_ms - v.timestamp_ms) / 60000);
    logOdds += v.direction * v.reliability_weight * Math.exp(-LAMBDA_PER_MIN * deltaMin);
  }
  const clampedLogOdds = Math.min(20, Math.max(-20, logOdds));
  return 1 / (1 + Math.exp(-clampedLogOdds));
}
```
- Verify that a single uncorroborated report (`prior = 0.15`, `w_1 = 0.30`, `deltaMin = 0`) yields `R_e(t) = 0.243` (`24.3%`), which stays in `AlertStatus.PENDING_CORROBORATION` (well below `85.0%` blockade severance).
- When `R_e(t) < 0.25` (such as when scrubbing the Time-Machine slider to `+90m`), set `status = AlertStatus.EXPIRED`.
- Compute `half_life_remaining_ms` so each alert card's `BayesianHalfLifeBar` smoothly depletes as `simOffsetMs` increases from `+0m` to `+90m`.

### 3. `src/features/feature-3-trust-cms/rideSharePool.ts` (Bonus 3 Automated Hub Ride-Share Bot)
Implement `computePoolSplit(baseFareBdt: number, surgeMultiplier: number, poolSizeCount: number)` and `mutateRideSharePool(actionId: string, edgeId: string, sessionUserId: string, direction: "JOIN" | "LEAVE")`:
- Formula:
  `perPersonBdt = Math.ceil((baseFareBdt * surgeMultiplier) / (clampedPoolSize + EPSILON))`
  `savingsBdt = Math.ceil(baseFareBdt * surgeMultiplier) - perPersonBdt`
- Maintain an idempotent `Set<string>` of `sessionUserId`s per hub pool and an `action_id` lock so double-clicking `[Join Hub Pool (2/4 -> 3/4)]` never increments `pool_size_count` beyond `4` or adds the same user twice.
- For a surged `90 BDT` connector rickshaw (`base 50 BDT * 1.8x surge`), joining from `2/4` (`45 BDT`) to `3/4` locks **`30 BDT/person` (`-60 BDT saved vs solo`)**.

### 4. `src/features/feature-3-trust-cms/useTrustShieldCms.ts` & `TrustShieldAndCmsPanel.tsx`
Build the complete **Zone 3 Right Column UI** following the Master Design System (`#0F172A` panel, `#1E293B` cards, `1.5px solid #334155` borders, `JetBrains Mono tabular-nums`):
- **Top Section — X-Ray Security & Sanity Audit Log:**
  - Displays live crimson interception badges: **`[ANOMALOUS_FARE_REJECTED: 500 BDT > 62.5 BDT (2.5x Base)]`** and **`[GROUNDING_INTERCEPTED: Edge H_BADDA -> H_DHANMONDI (FERRY) Not in G_0]`** with execution latency (`0.08 ms`).
  - Includes 1-click judge stress-test buttons: **`[Inject 400 BDT Spoofed Fare]`** and **`[Submit Single Uncorroborated Shahbagh Report]`** + **`[Override Decay & Quarantine Anomaly]`**.
- **Middle Section — Bayesian Crowd Alert Feed:**
  - Renders active street alerts (`H_FARMGATE` Waterlogging `91.8%`, `H_MALIBAGH` Gridlock `89.2%`, etc.) with `BayesianHalfLifeBar`, live decay countdown, and idempotent **`[Corroborate Blockade (+1 Vote)]`** and **`[Mark Corridor Cleared (-1)]`** buttons.
- **Bottom Section — Bonus 1 Signboard & Fare-Chart Vision Digitizer Drawer:**
  - Drag-and-drop file input + 2 one-click Dhaka signboard presets (*"Scan Bihanga Paribahan Signboard"* and *"Scan BRTA Statutory Bus Tariff Chart"*) with **`[Scan Bus Signboard & Ground Edges]`** and **`[Commit 4 Verified Edges to Graph G_0]`** vs. **`[Discard Unverified OCR Hub]`**.

### 5. `src/app/api/track-2-trust-cms/route.ts` and `src/app/track-2-trust-cms/page.tsx`
Wire API persistence to Supabase (`street_alerts`, `ride_share_pools`, `interception_logs`) with automatic local memory fallback, and build the standalone verification page at `/track-2-trust-cms`.
```

##### Track 2 Verification Checklist:
- [ ] `http://localhost:3000/track-2-trust-cms` renders `TrustShieldAndCmsPanel` with zero console errors.
- [ ] Injecting a `400 BDT` or `500 BDT` bus fare for `H_MIRPUR10 -> H_FARMGATE` is rejected in `< 0.1 ms` with `ANOMALOUS_FARE_REJECTED`[cite: 1, 2, 3].
- [ ] Submitting 1 uncorroborated blockade at `H_SHAHBAGH` outputs `R_e(t) = 24.3% < 85%` (`PENDING_CORROBORATION`) without severing the hub[cite: 1, 2].
- [ ] Scrubbing the time offset to `+90m` decays uncorroborated alerts below `25%` (`EXPIRED`)[cite: 1, 2, 3].
- [ ] Clicking `[Join Hub Pool (2/4 -> 3/4) • Lock 30 BDT Split]` reduces a 90 BDT surged rickshaw to `30 BDT` and is idempotent against rapid double-clicks[cite: 2, 3].

---

#### Prompt 1.3 — Track 3 (Dev 3: AI, NLP & Vision Engineer): Sandboxed Banglish Intent Parser, SAT Subgraph Verifier, Vision OCR & Zone 1 UI
- **Prompt Name:** `W1-TRACK-3-AI-COMMUTE`
- **Branch Name:** `wave-1/track-3-ai-commute`
- **Commit Name:** `feat(track-3): implement banglish NL parser with 0.2ms regex fallback, SAT subgraph verifier, vision OCR, and zone 1 UI`
- **Short Description:** Builds the sandboxed Groq/Gemini Banglish intent parser with `800ms` timeout and `0.2ms` deterministic phonetic regex fallback, the SAT-inspired Subgraph Grounding Verifier `V(P) = 1`, the Bonus 1 Signboard Vision OCR parser, and the complete **Zone 1 Left Column UI** (`CommuteCommandPanel.tsx`)[cite: 1, 2, 3].

##### Copy-Paste Prompt for Track 3 (Dev 3):
```text
You are Dev 3 (AI, NLP & Vision Engineer) for DhakaPath.
Always give me full, complete, working code for every file—never use placeholders or truncated snippets.

STRICT DIRECTORY OWNERSHIP: You may ONLY create or edit files in:
- `src/features/feature-1-commute/banglishParser.ts`
- `src/features/feature-1-commute/subgraphVerifier.ts`
- `src/features/feature-1-commute/signboardVision.ts`
- `src/features/feature-1-commute/useCommuteCommand.ts`
- `src/features/feature-1-commute/CommuteCommandPanel.tsx`
- `src/app/api/track-3-commute/route.ts`
- `src/app/track-3-commute/page.tsx`
Do NOT modify `src/contracts/schema.ts` or any file in `src/engine/`, `src/features/feature-3-trust-cms/`, or `src/shell/`.

### 1. `src/features/feature-1-commute/banglishParser.ts` (Sandboxed LLM + 0.2ms Phonetic Lexer)
Implement `parseBanglishQueryDeterministic(rawText: string)` and `parseCommuterIntent(rawText: string)`:
- **Deterministic Banglish & Bangla Phonetic Lexer (`0.2ms` execution):**
  - Maps all spelling variants ("Mirpur 10", "mirpur-10", "মিরপুর ১০" -> `HubId.H_MIRPUR10`; "Motijheel", "motijhil", "মতিঝিল" -> `HubId.H_MOTIJHEEL`; "Farmgate", "ফার্মগেট" -> `HubId.H_FARMGATE`; "Shahbagh", "shahbag", "শাহবাগ" -> `HubId.H_SHAHBAGH`; "Uttara", "উত্তরা" -> `HubId.H_UTTARA`; "Dhanmondi", "ধানমন্ডি" -> `HubId.H_DHANMONDI`; "Badda", "বাড্ডা" -> `HubId.H_BADDA`; "Malibagh", "মালিবাগ" -> `HubId.H_MALIBAGH`; "Mohakhali", "মহাখালী" -> `HubId.H_MOHAKHALI`; "Agargaon", "আগারগাঁও" -> `HubId.H_AGARGAON`; "Jatrabari", "যাত্রাবাড়ী" -> `HubId.H_JATRABARI`; "Mohammadpur", "মোহাম্মদপুর" -> `HubId.H_MOHAMMADPUR`; "Science Lab", "সায়েন্স ল্যাব" -> `HubId.H_SCIENCELAB`; "Banasree", "বনশ্রী" -> `HubId.H_BANASREE`; "Gulistan", "গুলিস্তান" -> `HubId.H_GULISTAN`).
  - Parses origin (`"theke"`, `"from"`, `"থেকে"`), destination (`"jabo"`, `"to"`), student pass (`"student"`, `"half pass"`, `"id ache"`, `"স্টুডেন্ট"`), budget in BDT (`"55 taka"`, `"55 takar moddhe"`, `"budget 45"`, `"45 bdt"`), and avoided/flooded hubs (`"avoid farmgate"`, `"farmgate e naki pani uthse"`, `"shahbagh avoid"` -> `avoid_hub_ids`).
  - Detects adversarial hallucination traps (`"underground ferry"`, `"launch from badda"`, `"submarine"`, `"helicopter"` -> returns `adversarialHallucinationDetected: true`, `hallucinatedSummary: "Edge H_BADDA -> H_DHANMONDI (UNDERGROUND_FERRY) Not in Canonical Graph G_0"`).
- **Online Sandboxed API Wrapper:** Calls `/api/track-3-commute` with an `800ms` `AbortController` timeout and `safeExtractJson()` brace extraction:
  ```ts
  export function safeExtractJson<T>(rawLlmText: string, fallback: T): T {
    const start = rawLlmText.indexOf("{");
    const end = rawLlmText.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return fallback;
    try {
      return JSON.parse(rawLlmText.slice(start, end + 1)) as T;
    } catch {
      return fallback;
    }
  }
  ```
  If the network times out (`> 800ms`) or API keys are missing, seamlessly return the deterministic lexer output with `parser_source: "DETERMINISTIC_REGEX_FALLBACK"`.

### 2. `src/features/feature-1-commute/subgraphVerifier.ts` (SAT-Style Boolean Grounding Verifier)
Implement `verifySubgraphTrajectory(route: ParetoRouteOption, isStudent: boolean)` evaluating:
`V(P_hat) = prod_{j=1..L} I(e_j in E) * I(T_eff(e_j, t) < Infinity) * I(|C_hat_j - C_fare(e_j, u_stu, t)| < 1e-6) === 1`
- Cross-checks every leg's `edge_id`, `origin_hub_id`, `dest_hub_id`, `mode`, and statutory fare against `CANONICAL_GRAPH_G0`.
- Strips any ungrounded route before UI rendering and returns an `AuditInterceptionEvent` with `ValidationStatus.GROUNDING_INTERCEPTED`.

### 3. `src/features/feature-1-commute/signboardVision.ts` (Bonus 1 Vision Signboard OCR)
Implement `digitizeSignboardImage(input: { base64Image?: string; presetId?: string })`:
- Includes fuzzy-to-canonical `HubId` matching (e.g., `"Uttora North"` -> `HubId.H_UTTARA`, `"Mirpur-10 Circle"` -> `HubId.H_MIRPUR10`) so blurry signboard OCR never crashes the CMS.
- Verifies all extracted `TransitEdge` candidates against `HubId` and `TransportMode` enums.

### 4. `src/features/feature-1-commute/useCommuteCommand.ts` & `CommuteCommandPanel.tsx`
Build the complete **Zone 1 Left Column UI** (`CommuteCommandPanel.tsx`) following the Master Design System:
- **Top 30% — Banglish Input, 1-Tap Judge Chips & X-Ray Intent Pills:**
  - Textarea/input supporting Banglish & Bangla Unicode + Web Speech mic button + **`[Compute Verified Pareto Detour]`** (`IdempotentActionButton`).
  - 1-tap human-in-the-loop override toggles: **`[Force Student Pass: ON]`**, **`[Bypass Flooded Hubs]`**, **`[Unlock Walk-Bridge (4.5 km/h)]`**.
  - 3 one-tap demo query pills:
    1. *"bhai Mirpur 10 theke Motijheel jabo, student id ache, 55 takar moddhe. Farmgate e naki pani uthse?"*
    2. *"Uttara theke Shahbagh fastest route, regular ticket, avoid Mohakhali"*
    3. *"Trick LLM: Underground Ferry from Badda to Dhanmondi for 5 BDT"*
  - **Extracted Constraints Pill Row:** Shows `Origin: H_MIRPUR10`, `Dest: H_MOTIJHEEL`, `Student: YES (10 BDT Floor)`, `Budget: <= 55 BDT`, `Avoid: H_FARMGATE`, plus parser badge (`LLM_SANDBOX` or `LOCAL PHONETIC LEXER: 0.2ms`).
- **Bottom 70% — Ranked Pareto Multi-Leg Route Cards & Action Loop:**
  - Renders the top 3 non-dominated Pareto route cards (`Optimal Balanced P*`, `Lowest BDT`, `Fastest Grade-Separated`).
  - Card #1 expands by default to display:
    - Hero Fare: **`48 BDT`** (`28px` bold emerald) vs. crossed-out `66 BDT Regular`, **`48 mins`**, **`1 Transfer`**, and **`[GRAPH_GROUNDED: V(P*)=1]`** shield.
    - Step-by-Step Leg Timeline:
      - Leg 1: `WALK` (`3m`, `0 BDT`, *"Mirpur-10 Golchottor Footbridge"*)
      - Leg 2: `METRO` MRT-6 (`7m`, **`30 BDT`**, *"Mirpur-10 Metro Concourse • No Student Pass on Metro"*)
      - Leg 3: `BUS` Bihanga Paribahan (`38m`, **`18 BDT Student / 36 BDT Reg`**, *"Board at Agargaon South Footbridge • 10 BDT Floor Verified"*)
    - **Embedded Action Loop Footer:**
      1. **`[Join Hub Pool (2/4 -> 3/4) • Lock 30 BDT Split]`** (with instant rollback toggle `[Leave Pool / Solo Rickshaw (90 BDT)]`).
      2. **`[Export Offline Card (<45 KB) + Audio]`** (shows exported PNG size badge `38.4 KB` and opens a high-contrast **Phonetic Audio Transcript Drawer** alongside Web Speech synthesis).

### 5. `src/app/api/track-3-commute/route.ts` and `src/app/track-3-commute/page.tsx`
Build the sandboxed Groq/Gemini API route handler and the standalone verification page at `/track-3-commute`.
```

##### Track 3 Verification Checklist:
- [ ] `http://localhost:3000/track-3-commute` renders `CommuteCommandPanel` with zero console errors.
- [ ] Submitting *"bhai Mirpur 10 theke Motijheel jabo, student id ache, 55 takar moddhe. Farmgate e naki pani uthse?"* extracts `{ origin_hub_id: "H_MIRPUR10", dest_hub_id: "H_MOTIJHEEL", is_student: true, max_budget_bdt: 55, avoid_hub_ids: ["H_FARMGATE"] }` in `< 0.8s` (or `0.2ms` offline via regex lexer)[cite: 1, 2, 3].
- [ ] Clicking the Trick LLM chip (*"Underground Ferry from Badda to Dhanmondi"*) is intercepted by `verifySubgraphTrajectory` (`V(P) = 0`) and logs `GROUNDING_INTERCEPTED`[cite: 1, 2, 3].
- [ ] Fuzzy OCR hub names like `"Uttora North"` resolve cleanly to `HubId.H_UTTARA` without throwing errors[cite: 2, 3].

---

#### Prompt 1.4 — Track 4 (Dev 4: Frontend, Map & Offline UX Lead): Scenario Injector Bar, Dual-Layer 15-Hub Topological Map, Shadow ROI Ledger & Offline Canvas/Speech Exporter
- **Prompt Name:** `W1-TRACK-4-MAP-SHELL`
- **Branch Name:** `wave-1/track-4-map-shell`
- **Commit Name:** `feat(track-4): build scenario injector bar, dual-layer leaflet+SVG 15-hub map, shadow ROI ledger, and <45kb canvas/speech exporter`
- **Short Description:** Builds **Zone 0** (`ScenarioInjectorBar.tsx` + stage hotkeys `Alt+1/2/3/R` and `Ctrl+Shift+D`), **Zone 2 Top** (`TopologicalMap.tsx` combining dark Leaflet/OSM with the interactive 15-Hub Metro-Style SVG Schematic Overlay), **Zone 2 Bottom** (`CounterfactualRoiLedger.tsx`), **Bonus 2** (`offlineBriefingExporter.ts` for `<45 KB` HTML5 Canvas PNG + Web Speech API voiceover), and `XRayMathDrawer.tsx`[cite: 1, 2, 3].

##### Copy-Paste Prompt for Track 4 (Dev 4):
```text
You are Dev 4 (Frontend, Map & Offline UX Lead) for DhakaPath.
Always give me full, complete, working code for every file—never use placeholders or truncated snippets.

STRICT DIRECTORY OWNERSHIP: You may ONLY create or edit files in:
- `src/shell/ScenarioInjectorBar.tsx`
- `src/shell/TopologicalMap.tsx`
- `src/shell/CounterfactualRoiLedger.tsx`
- `src/shell/offlineBriefingExporter.ts`
- `src/shell/XRayMathDrawer.tsx`
- `src/shell/useScenarioInjector.ts`
- `src/shell/useTopologicalRoi.ts`
- `src/app/api/track-4-map-shell/route.ts`
- `src/app/track-4-map-shell/page.tsx`
Do NOT modify `src/contracts/schema.ts` or any file in `src/engine/` or `src/features/`.

### 1. `src/shell/ScenarioInjectorBar.tsx` & `src/shell/useScenarioInjector.ts` (Zone 0 — Mandatory Feature 0)
Build the `64px` fixed Top Global Bar:
- **Left (25%):** Brand mark (`DhakaPath // INIF-26`), live surface velocity badge (`Peak Velocity: 4.8 km/h` in Crisis or `14.5 km/h` in Baseline), and the persistent honesty badge **`[SIMULATED DEMO TELEMETRY — BENCHMARK REPLAY]`**.
- **Center (50%):**
  - 3 segmented preset buttons with `150ms` debounce lock (`action_id = "SCENARIO_" + preset + "_" + simOffsetMin`):
    1. **`[1. Normal Baseline]`** (`Alt+1`)
    2. **`[2. Peak Crisis Surge]`** (`Alt+2`)
    3. **`[3. Adversarial / Corrupt Input]`** (`Alt+3`)
  - Stepped **Time-Machine Decay Scrub Slider** (`+0m`, `+15m`, `+45m`, `+90m`).
- **Right (25%):**
  - Clickable **Live X-Ray Execution Trace Pill**:
    `[⚡ ENGINE: 0.78ms | |V_exp|: 75, |E_exp|: 240 | J(P*): 0.241 | u_stu: 1 (10 BDT Floor) | R_Farmgate: 91.8% (T_eff -> INF) | V(P*)=1]`
  - Keyboard shortcut hints (`Alt+1..3`, `Ctrl+Shift+D` X-Ray Drawer, `Alt+R` Reset).

### 2. `src/shell/TopologicalMap.tsx` & `src/shell/useTopologicalRoi.ts` (Zone 2 Top — Dual-Layer 15-Hub Map)
Build an SSR-safe Dual-Layer Map component:
- **Layer 1 (Geographical Base):** Dark-filtered OpenStreetMap tile layer (`minZoom: 11, maxZoom: 16`) with an automatic/manual fallback toggle **`[Dual-Layer OSM + SVG]`** vs. **`[Pure Tactical Schematic Grid]`** so if venue Wi-Fi drops, the map renders over a crisp tactical grid with zero broken image icons.
- **Layer 2 (Interactive 15-Hub Metro-Style SVG Schematic Overlay):**
  - Draws all 15 hubs (`H_UTTARA` to `H_MOTIJHEEL` and `H_JATRABARI`) and modal edges with distinct stroke geometry and color coding:
    - `METRO` (MRT-6): `#22C55E` solid `5px`
    - `BUS`: `#3B82F6` solid `3.5px`
    - `LEGUNA`: `#A855F7` dash-dot
    - `RICKSHAW`: `#F59E0B` short dash
    - `WALK`: `#94A3B8` dotted
  - **Active Pareto Optimal Path (`P*`):** Animated `5px` Electric Cyan (`#06B6D4`) glow line (`Mirpur-10 -> Agargaon MRT-6 -> Mohakhali Flyover Bihanga Bus -> Motijheel`).
  - **Naive Shadow Baseline Path (`P_shadow`):** Muted dashed crimson/gray trace through flooded `H_FARMGATE` so judges visually see what was avoided.
  - **Severed Hubs (`H_FARMGATE`, `H_MALIBAGH`):** Pulsing crimson rings (`#F43F5E`), an explicit color-blind-safe **`[X] SEVERED (T_eff = INF)`** cross-hatch badge, and live Bayesian confidence callout (`R_e: 91.8%`).
  - When `walk_bridge_active` is true, animates a dotted amber **Walk-Bridge Bypass Arc** (`4.5 km/h`, `0 BDT`) with a **`[DETOUR_WALK_BRIDGE_REQUIRED]`** banner.
  - Clicking or hovering any hub or edge reveals a glass popover with boarding landmark notes (`"Agargaon South Footbridge"`), student vs. regular fare, and active surge multiplier.

### 3. `src/shell/CounterfactualRoiLedger.tsx` (Zone 2 Bottom — Feature 4)
Build the high-contrast side-by-side comparison ledger contrasting **Traditional Manual Baseline (Naive Surface + FB Group Check)** vs. **DhakaPath Optimal Engine (`P*`)**:
- 3 oversized hero delta cards (`28px–32px` bold `JetBrains Mono tabular-nums` with `Number.isFinite()` clamping):
  1. **`+64 Mins Saved`** (`112 min Flooded Surface Stall` vs. `48 min DhakaPath Detour`)
  2. **`+28 BDT Saved`** (`76 BDT Regular/Surge` vs. `48 BDT Student Multi-Leg`)
  3. **`-82.0% Blockade Risk`** (plus empirical latency badge: **`8.5 min (Manual FB Check) -> 1.4 sec (DhakaPath) [SIMULATED DEMO BENCHMARK]`**)

### 4. `src/shell/offlineBriefingExporter.ts` (Bonus 2 — `<45 KB` HTML5 Canvas Card + Web Speech Briefing)
Implement:
- `exportOfflineBriefingCard(route: ParetoRouteOption, query: CommuterQuery, roi: CounterfactualRoiMetrics)`:
  - Renders purely onto an isolated programmatic offscreen `800 x 1000 px` `<canvas>` (using vector typography, schematic node graphics, leg-by-leg BDT fares, boarding landmarks, and the emerald `GRAPH_GROUNDED` stamp—**zero external image URLs** so `canvas.toDataURL("image/png", 0.85)` never taints).
  - Downloads `dhakapath-briefing-${query.origin_hub_id}-${query.dest_hub_id}.png` (`< 45 KB`) and returns `{ dataUrl, fileSizeKb, filename }`.
- `playOfflineVoiceBriefing(route: ParetoRouteOption, query: CommuterQuery)`:
  - Guards `window.speechSynthesis?.cancel()` before speaking a concise English/Banglish audio briefing, and returns a high-contrast phonetic transcript string if OS TTS voices are unavailable.

### 5. `src/shell/XRayMathDrawer.tsx`, `src/app/api/track-4-map-shell/route.ts` & `src/app/track-4-map-shell/page.tsx`
- `XRayMathDrawer.tsx`: Expandable 3-line mathematical audit card showing:
  1. **Piecewise Fare Trace:** `Leg 1 (WALK): 0 BDT + Leg 2 (MRT-6, 4.2km): 30 BDT (No Stu Disc) + Leg 3 (BUS, Base 36 BDT): max(10, ceil(0.5 * 36)) = 18 BDT -> Total: 48 BDT <= Budget 55 BDT.`
  2. **Bayesian Decay Trace:** `Hub: H_FARMGATE | Prior S_0: 0.45 | Votes: +4 (w_k=0.75) | Decay exp(-0.0231 * 14m) | Log-Odds L_e: +2.41 -> Posterior R_e(t): 91.8% (BLOCKADE SEVERED).`
  3. **SAT Subgraph Grounding Check:** `LLM Candidate Edges Checked: 3/3 in G_0 | Fare Deviation: 0.0 BDT < 1e-6 | Status: GRAPH_GROUNDED.`
- `page.tsx`: Standalone verification page at `/track-4-map-shell`.
```

##### Track 4 Verification Checklist:
- [ ] `http://localhost:3000/track-4-map-shell` renders the Top Time-Machine Bar, Dual-Layer 15-Hub Map, and Counterfactual ROI Ledger with zero console errors.
- [ ] Pressing `Alt+2` (`Peak Crisis Surge`) flashes crimson blockade rings on `H_FARMGATE` and `H_MALIBAGH` with `[X] SEVERED` cross-hatch markers and animates the cyan MRT-6 + Mohakhali Flyover detour[cite: 3].
- [ ] Clicking `[Export Offline Card (<45 KB) + Audio]` downloads a non-tainted PNG `< 45 KB` and speaks the route briefing via `window.speechSynthesis`[cite: 1, 2, 3].
- [ ] Pressing `Ctrl+Shift+D` toggles the 3-line `XRayMathDrawer`[cite: 3].

---

### WAVE 2: Sequential Integration & Polish (1 Person — Minute 260 to Minute 315)

#### Prompt 2.1 — Wave 2 Integration: Merge All 4 Tracks, Wire Live Adapter & Build Unified 4-Zone Command Center + Pitch Overlay
- **Prompt Name:** `W2-INTEGRATION-COMMAND-CENTER`
- **Branch Name:** `wave-2/integration` (Merge into `main` once verified)
- **Commit Name:** `feat(wave-2): merge tracks 1-4, wire live deterministic engine adapter, and assemble 4-zone command center`
- **Short Description:** Merges all 4 parallel branches (`track-1` through `track-4`), replaces all mock stubs in `src/contracts/adapter.ts` and `src/store/useDhakaPathStore.tsx` with the live Track 1–4 modules, and builds the unified `100vw x 100vh` **Synchronized 4-Zone Command Center** in `src/app/page.tsx` plus a toggleable **"Midnight Aurora × Holographic Night City" Pitch Intro Overlay**[cite: 2, 3, 4].

##### Terminal Merge Sequence (Run Before Prompt 2.1):
```bash
git checkout main
git pull origin main
git checkout -b wave-2/integration
git merge wave-1/track-1-pareto-engine --no-edit
git merge wave-1/track-2-trust-cms --no-edit
git merge wave-1/track-3-ai-commute --no-edit
git merge wave-1/track-4-map-shell --no-edit
```

##### Copy-Paste Prompt for Wave 2 (Integrator):
```text
You are the Principal Systems Integrator for DhakaPath (Wave 2).
Always give me full, complete, working code for every file—never use placeholders or truncated snippets.

All 4 Wave 1 tracks (`src/engine/*`, `src/features/feature-3-trust-cms/*`, `src/features/feature-1-commute/*`, and `src/shell/*`) are now merged into our repository.

### 1. Wire `src/contracts/adapter.ts` and `src/store/useDhakaPathStore.tsx` to the Live Track 1–4 Modules
Connect the global reactive state so that every user or judge interaction flows across all 4 zones in `< 1 ms`:
1. **Scenario Preset / Time-Machine Slider (`Zone 0` -> All Zones):**
   - Invokes `projectScenario()` (`src/engine/scenarioStore.ts`) and recomputes `computePosteriorConfidence()` (`src/features/feature-3-trust-cms/bayesianTruth.ts`) for all alerts at `now_ms + simOffsetMs`.
   - When `ScenarioPreset.ADVERSARIAL_CORRUPT_INPUT` is triggered (`Alt+3`), automatically runs the `500 BDT` spoofed Mirpur->Farmgate bus fare through `validateFareSubmission()` (`sanityFilter.ts`), runs the hallucinated `"Underground Ferry Badda -> Dhanmondi"` through `verifySubgraphTrajectory()` (`subgraphVerifier.ts`), and ages the stale alert by `90 min` so its confidence drops below `25%` (`EXPIRED`)—logging all audit events in Zone 3.
   - Re-runs `executeParetoSearch()` (`paretoRouter.ts`) and `computeCounterfactualRoi()` (`shadowBaseline.ts`) and updates Zone 1, Zone 2, and Zone 3 simultaneously.
2. **Banglish Query / Chip Selection (`Zone 1` -> `Zone 2` & `Zone 3`):**
   - Runs `parseCommuterIntent()` (`banglishParser.ts`) -> `executeParetoSearch()` (`paretoRouter.ts`) -> `verifySubgraphTrajectory()` (`subgraphVerifier.ts`) -> `computeCounterfactualRoi()` (`shadowBaseline.ts`).
3. **Hub Ride-Share Pool Split & Offline Briefing Export (`Zone 1` -> `Zone 2`):**
   - Clicking **`[Join Hub Pool (2/4 -> 3/4) • Lock 30 BDT Split]`** calls `mutateRideSharePool()` (`rideSharePool.ts`), updates the active route leg's `effective_fare_bdt` and `pool_size_count`, and updates the ROI ledger.
   - Clicking **`[Export Offline Card (<45 KB) + Audio]`** calls `exportOfflineBriefingCard()` and `playOfflineVoiceBriefing()` (`offlineBriefingExporter.ts`) from Track 4.
4. **Crowd Corroboration Vote & Signboard OCR Commit (`Zone 3` -> `Zone 1` & `Zone 2`):**
   - Voting `+1` or `-1` on an alert updates Bayesian confidence `R_e(t)` and immediately triggers `executeParetoSearch()` if an edge crosses `85%` or drops below `25%`.
   - Clicking **`[Commit Verified Edges to Graph G_0]`** in the Signboard Vision Drawer adds the verified edges and refreshes the route calculation.

### 2. Assemble the Unified 4-Zone Command Center in `src/app/page.tsx`
Build `src/app/page.tsx` with:
- **Synchronized 4-Zone Split-Screen Command Center (`100vw x 100vh`, `lg:overflow-hidden` on desktop, responsive mobile tabs on `<1024px`):**
  - **Top Global Bar (Zone 0 — `64px` height):** `<ScenarioInjectorBar/>` + `<XRayMathDrawer/>`.
  - **Left Column (Zone 1 — `28%` width on desktop):** `<CommuteCommandPanel/>` (Role A: Stranded Student/Commuter "Rafi").
  - **Center Stage (Zone 2 — `44%` width on desktop):** Top 68% `<TopologicalMap/>` + Bottom 32% `<CounterfactualRoiLedger/>`.
  - **Right Column (Zone 3 — `28%` width on desktop):** `<TrustShieldAndCmsPanel/>` (Role B: Transit Admin & Crowd Verifier).
- **Toggleable "Holographic Night City" Pitch Intro Overlay (`[✦ Pitch Story Overlay]` button in Top Bar):**
  - Implements the 7-layer `Hackathon UI Playbook` showcase modal for the first 25 seconds of the stage pitch (glowing badge `"✦ Deterministic Spatio-Temporal Engine for Bangladesh"`, `64px` tight-tracked headline with gradient word, 3D-tilted glass telemetry preview frame with cyan/blue aurora glow, 3 animated proof counters: `"4.8 km/h Peak Gridlock Bypassed"`, `"0.78 ms Pareto Graph Search"`, `"8.5m -> 1.4s Route & Fare Verification"`, and a primary **`[Enter Live 15-Hub Command Center ->]`** button that closes the overlay into the live 4-Zone Command Center).
```

##### Wave 2 Verification Checklist:
- [ ] `http://localhost:3000` loads the unified **4-Zone Command Center** with all 4 zones wired and reactive in `< 1 second`[cite: 3].
- [ ] **15-Second Pitch Climax Check:** Pressing `Alt+2` (`[2. Peak Crisis Surge]`) causes the judge's eyes to sweep across the screen with zero reloads:
  - Zone 3 logs `R_Farmgate = 91.8% (SEVERED)` and `R_Malibagh = 89.2% (SEVERED)`[cite: 3].
  - Zone 2 flashes crimson rings on Farmgate & Malibagh, marks the surface route `[X] SEVERED`, lights up the Electric Cyan MRT-6 + Mohakhali Flyover detour, and flips the Shadow ROI Ledger to **`+64 Mins Saved`**, **`+28 BDT Saved`**, and **`-82.0% Blockade Risk`**[cite: 1, 2, 3].
  - Zone 1 updates Rafi's student-pass card to **`48 BDT, 48 mins, 1 Transfer`** with `[GRAPH_GROUNDED: 100%]`[cite: 1, 3].
- [ ] Pressing `Alt+3` (`[3. Adversarial / Corrupt Input]`) immediately intercepts the `500 BDT` spoofed bus fare (`ANOMALOUS_FARE_REJECTED`) and the `"Underground Ferry"` hallucination (`GROUNDING_INTERCEPTED`) in `< 1 ms`[cite: 1, 2, 3].
- [ ] Clicking `[Join Hub Pool (2/4 -> 3/4) • Lock 30 BDT Split]` and `[Export Offline Card (<45 KB) + Audio]` both execute cleanly from the main screen[cite: 2, 3].

---

## 6. Master All-Hands Final QA & Deployment Checklist (All 4 Members — Minute 315 to 340)

Every team member must verify their items below before the 5:30 code freeze[cite: 4]:

- [ ] **Wave 0 & Architecture Integrity (All Devs):**
  - [ ] Zero `/login`, `/signup`, or multi-page CRUD tables exist anywhere in the app[cite: 2, 3].
  - [ ] Persistent **`[SIMULATED DEMO TELEMETRY — BENCHMARK REPLAY]`** badge is visible in the global top bar at all times[cite: 1, 2, 3].
  - [ ] All enums (`HubId`, `TransportMode`, `ScenarioPreset`, `ValidationStatus`) are imported from `src/contracts/schema.ts` with zero raw magic strings[cite: 2, 3].
- [ ] **Track 1 — Math & Algorithmic Guardrails (Dev 1):**
  - [ ] MRT-6 Metro Rail never receives the 50% student discount (`Mirpur-10 -> Agargaon = 30 BDT`, `Mirpur-10 -> Motijheel = 60 BDT`)[cite: 1, 2].
  - [ ] Local buses enforce the 50% student pass with a strict **`10 BDT` minimum floor**[cite: 1, 2].
  - [ ] Clicking any Scenario Preset 5 times rapidly never causes cumulative fare multiplication (`Object.freeze(CANONICAL_GRAPH_G0)` verified)[cite: 2, 3].
  - [ ] Severed baseline edges (`T_eff = Infinity`) are clamped to `112 min` so `NaN` or `Infinity` never renders in the ROI ledger[cite: 2, 3].
- [ ] **Track 2 — Bayesian Decay, Sanity Check & Pool Split (Dev 2):**
  - [ ] Bus fares `< 10 BDT` or `> 2.5x Base` (`400 BDT` / `500 BDT`) are blocked in `< 0.1 ms` with `ANOMALOUS_FARE_REJECTED`[cite: 1, 2, 3].
  - [ ] Single uncorroborated blockade vote shifts `R_e(t)` from `15% -> 24.3%` (`PENDING_CORROBORATION`) and requires `>= 3` corroborations to cross `85%`[cite: 1, 2].
  - [ ] Scrubbing Time-Machine slider from `+0m` to `+90m` depletes the 30-minute half-life bars and expires unconfirmed alerts below `25%`[cite: 1, 2, 3].
  - [ ] Hub Ride-Share Pool Bot splits a surged `90 BDT` rickshaw from `45 BDT` (`2/4`) down to `30 BDT` (`3/4`) with double-click idempotency lock[cite: 1, 2, 3].
- [ ] **Track 3 — Banglish NL Parser, Grounding Verifier & Signboard OCR (Dev 3):**
  - [ ] Banglish query (*"bhai Mirpur 10 theke Motijheel jabo, student id ache, 55 takar moddhe. Farmgate e naki pani uthse?"*) works both online (Groq/Gemini) and 100% offline (`0.2ms` deterministic phonetic lexer fallback)[cite: 1, 2, 3].
  - [ ] SAT-inspired Subgraph Verifier `V(P*) = 1` blocks ungrounded edges (`"Underground Ferry Badda -> Dhanmondi"`)[cite: 1, 2, 3].
  - [ ] Bonus 1 Signboard OCR digitizes bus signboard presets into verified `TransitEdge` entries[cite: 1, 2, 3].
- [ ] **Track 4 — Dual-Layer Map, Hotkeys & Offline Briefing Exporter (Dev 4):**
  - [ ] Global hotkeys `Alt+1`, `Alt+2`, `Alt+3`, `Alt+R`, and `Ctrl+Shift+D` work reliably[cite: 3].
  - [ ] 15-Hub SVG Schematic Map stays 100% interactive even if OpenStreetMap tiles are toggled off[cite: 3].
  - [ ] Bonus 2 Offline Exporter downloads a `< 45 KB` PNG route card (`canvas.toDataURL('image/png', 0.85)`) with zero CORS errors and speaks the route via `window.speechSynthesis`[cite: 1, 2, 3].
- [ ] **Build, Deploy & Stage Safety (All Devs):**
  - [ ] `npm run build` completes with 0 errors.
  - [ ] Deployed live on Vercel with environment variables configured[cite: 4].
  - [ ] 90-second backup screen recording saved locally on presentation laptop in case venue Wi-Fi fails[cite: 4].

---

## 7. Documentation & 4-Minute Live Stage Pitch Prompt

#### Prompt 3.1 — Championship README, Mathematical Appendix & Stage Script
- **Prompt Name:** `W3-DOCS-AND-PITCH`
- **Branch Name:** `main`
- **Commit Name:** `docs(readme): add thesis documentation, mathematical proofs, architecture diagrams, and 4-min stage script`
- **Short Description:** Generates the complete `README.md` containing the 118-word plain-English story, the 6-state FSM & Mermaid diagrams, the 4 deterministic mathematical formulations, installation instructions, the 4-minute live stage choreography, and quantitative rebuttals for the 3 brutal judge questions[cite: 1, 3, 4].

##### Copy-Paste Prompt for Documentation:
```text
You are the Lead Technical Writer & Pitch Strategist for DhakaPath (INIF 2026 Smart City Hackathon).
Always give me full, complete markdown—never truncate.

Generate our complete `README.md` containing:

1. **Executive Summary & The 30-Second Plain-English Pitch (118 Words):**
   "Every morning in Dhaka, millions of students and office workers play a guessing game just to cross the city. Google Maps does not know which local bus accepts a ten-taka student half-pass, how much a rickshaw surges when Malibagh floods, or when a sudden blockade shuts down Shahbagh. Commuters scroll through outdated Facebook posts and end up stranded or overpaying. DhakaPath fixes this. A commuter simply asks in Banglish how to reach Motijheel under fifty taka. The platform checks crowd-verified street alerts, filters out fake reports, and calculates the exact multi-leg route across buses, the Metro Rail, and shared rickshaws—even exporting an offline route card when phone battery or internet dies."

2. **Macro-Economic & Regional Asymmetric Reality:**
   - Dhaka peak velocity collapse (`21–25 km/h -> 4.8 km/h`), wasting 3.2M–5.0M working hours daily and $1.68B–$11B annually (6%–10% of GDP).
   - Statutory 50% student bus pass with a strict 10 BDT minimum floor vs. DMTCL MRT-6 Metro Rail (20–100 BDT at 5 BDT/km, zero student discount) vs. 1.8x–2.5x monsoon rickshaw surges.

3. **System Architecture & 6-State Deterministic FSM:**
   - Include the Mermaid.js `graph TD` Connected User Journey diagram and the 6-State FSM table (`S_0` Canonical Graph Initialization through `S_5` SAT Subgraph Verification & Offline Briefing).

4. **Deterministic Mathematical Formulations (Zero LLM Arithmetic):**
   - **Piecewise Multi-Modal Fare & Surge Function:** `C_fare(e, u_stu, t)` across `BUS` (student 50% with 10 BDT floor), `METRO` (`min(100, max(20, 10 * ceil(5 * d_e / 10)))`), `LEGUNA`, `RICKSHAW` (`ceil((F_base * gamma_e) / (K_e + 1e-6))`), and `WALK` (`0 BDT`).
   - **Recursive Bayesian Truth Discovery with 30-Minute Exponential Decay:** Log-odds `L_e(t)` and posterior confidence `R_e(t)` with half-life decay constant `lambda = ln(2) / 30 ~= 0.0231 min^-1`, expiration threshold `tau_expire = 0.25`, and blockade severance threshold `tau_blockade = 0.85`.
   - **Normalized Multi-Objective Generalized Cost `J(P)` & 16-Bit Bitwise Cycle Guard:** Label-setting Pareto Dijkstra over `|V_exp| = 75` vertices and `|E_exp| ~= 240` edges executing in `< 0.8 ms`.
   - **SAT-Inspired Subgraph Grounding Indicator `V(P*) = 1` & Counterfactual Shadow Baseline ROI (`Delta_Time`, `Delta_Cost`, `Delta_Risk`).**

5. **4-Minute Live Stage Choreography & Top 3 Brutal Judge Q&A Rebuttals:**
   - `0:00 – 0:35`: 5-Second Main Screen Evidence Check (`4.8 km/h` velocity alert, 15-hub topological map, `[SIMULATED DEMO TELEMETRY]` honesty badge).
   - `0:35 – 1:25`: Banglish NL Trip Search (*"Mirpur 10 theke Motijheel, student pass ache, budget 55 taka, Farmgate avoid"*).
   - `1:25 – 2:15`: The 15-Second Hero Climax — Triggering `[2. Peak Crisis Surge]` (`Alt+2`), watching Farmgate & Malibagh sever (`R_e = 91.8%`), and seeing the `0.78 ms` cyan detour (`MRT-6 to Agargaon 30 BDT + Bihanga Bus via Mohakhali Flyover 18 BDT = 48 BDT, +64 mins saved, +28 BDT saved`).
   - `2:15 – 3:05`: Adversarial Stress Test (`Alt+3`) — Blocking the `500 BDT` spoofed bus fare in `< 0.1 ms` (`ANOMALOUS_FARE_REJECTED`), intercepting the `"Underground Ferry"` hallucination (`GROUNDING_INTERCEPTED`), and scrubbing the 30-minute Bayesian decay slider to `+90m`.
   - `3:05 – 3:55`: Triple Crown Bonus Finale — Scanning a Dhaka bus signboard via Vision OCR (Bonus 1), clicking `[Join Hub Ride-Share (2/4 -> 3/4)]` to split a surged `90 BDT` rickshaw down to `30 BDT` (Bonus 3), and exporting the `<45 KB` HTML5 Canvas PNG route card + Web Speech audio briefing (Bonus 2).
   - Include the 3 quantitative rebuttals: (1) Why custom Pareto Dijkstra (`0.78 ms`, 0% hallucination) beats LLM-only routing (`1,200–2,500 ms`, 31% Banglish transfer/fare hallucination), (2) How the 3-tier Bayesian + Sanity defense stops rival operator spam (`w_k = 0.30` moves prior `0.15 -> 0.243 < 0.85`), and (3) How `<38 KB` local graph caching + `<45 KB` Canvas/Speech export survives 3% battery and 3G dropouts.

6. **Quickstart, Environment Setup & Stage Keyboard Shortcuts (`Alt+1`, `Alt+2`, `Alt+3`, `Alt+R`, `Ctrl+Shift+D`).**
```