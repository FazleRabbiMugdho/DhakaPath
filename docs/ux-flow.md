# **03\_uxflow.md — DhakaPath Principal UI/UX Architecture, Cognitive Ergonomics & Live Stage Blueprint**

**Project:** DhakaPath — Multi-Objective Spatio-Temporal Transit Engine & Zero-Hallucination Route Verifier **Competition Track:** IAIT National IT Fest (INIF) 2026 — Smart City Hackathon **Execution Window:** 5 Hours 40 Minutes (340 Minutes) | **Team Size:** 4 Developers (100% Parallel Execution) **Presentation Format:** 4–5 Minutes Live Stage Demo \+ 2 Minutes Technical Q\&A

## **1\. The "Anti-Average" UX Strategy**

### **Critique of What Average Teams Will Build (And Why It Fails Under Pressure)**

In a 340-minute hackathon, average student teams default to three fatal UI anti-patterns that collapse under both real-world Dhaka street stress and rapid judge inspection:

> * **Unstyled Pin-Drop Maps & Cluttered CRUD Tables:** Average teams drop raw markers onto a default Leaflet map and build multi-page database tables for Part 1 (Transit & Street-Status CMS). When a judge looks at the projector for 5 seconds, they cannot distinguish an elevated MRT-6 Metro line from a flooded leguna route or see which intersection is severed.  
> * **Multi-Field Forms & Passive Chat Wrappers:** Forcing a commuter trapped in **4.8 km/h** peak gridlock or a monsoon downpour to tap through six dropdowns (Origin, Destination, Mode, Student Pass, Budget, Avoid Hub) or read three paragraphs of unconstrained LLM markdown prose fails cognitive ergonomics. Worse, raw LLM chat wrappers hallucinate 50% student discounts on the MRT-6 Metro Rail and violate the statutory **10 BDT** minimum bus fare floor in 31% of Banglish queries.  
> * **Silent State Mutations:** Average teams build static weather dropdowns that change a text badge from "Normal" to "Rainy" without visibly severing graph edges, spiking connector rickshaw surges, or proving counterfactual savings against a baseline route.

### **Our Elevated UX Thesis: The "Zero-Input / 1-Click Decision" Command Center**

DhakaPath replaces passive forms and prose wrappers with a **Deterministic Single-Screen Spatial Command Center** governed by a **Zero-Input / 1-Click Decision** paradigm:

> 1. **Proactive Context & 1-Click Crisis Choreography:** Before a user types a single character, the viewport displays the live 15-hub Dhaka topological state, active Bayesian disruption confidence scores, and statutory fare rules. A presenter or judge can trigger city-wide monsoon waterlogging, rush-hour surges, or adversarial fare attacks in a single click via the top **Scenario Time-Machine Bar**.  
> 2. **Messy Banglish In, Verified Actionable Cards Out:** A single phonetic Banglish sentence (or 1-tap preset chip) is parsed in sandboxed isolation and solved in **\<0.8 ms** by our Label-Setting Pareto Dijkstra engine. Instead of chatbot paragraphs, the UI renders structured **Multi-Leg Pareto Cards** showing exact regular vs. student BDT splits, boarding landmarks, and a cryptographic-style **\[GRAPH\_GROUNDED: 100% VERIFIED\]** badge.  
> 3. **Closed-Loop Last-Mile Execution:** Every route calculation culminates in three 1-click survival actions on the same card: **splitting a surged rickshaw fare** via the automated Hub Ride-Share Pool Bot, **exporting a sub-45 KB offline PNG route card \+ native audio briefing** for \<5% battery survival, or **corroborating/quarantining a live street alert**.

## **2\. User Ecosystem, Emotional Context & Zero-Tab-Switch Choreography**

### **Actor Matrix & Cognitive Ergonomics**

| Actor Persona | Physical & Technical Environment | Emotional & Cognitive State | UX Architectural Response |
| :---- | :---- | :---- | :---- |
| **Role A: Stranded Student / Commuter ("Rafi")** | Standing under a crowded Mirpur-10 footbridge during a monsoon downpour; budget-capped (**55 BDT** cash); intermittent 3G signal and **\<5% smartphone battery**. | High temporal and financial anxiety; frustrated by outdated Facebook Traffic Alert posts and 2.0x rickshaw fare surges. | High-contrast cards with oversized BDT totals, 1-tap Banglish query chips, 1-click Ride-Share pool split (**90 BDT \-\> 30 BDT**), and instant **\<45 KB** offline Canvas/Speech export. |
| **Role B: Transit Admin & Crowd Verifier** | Monitoring Dhaka's 15 canonical hubs; uploading printed bus fare charts/signboards; defending against troll fare spikes (**500 BDT**). | Vigilant but pressed for time; needs immediate signal-vs-noise separation without digging through SQL tables. | Automated Tier-1 Sanity Gate (ANOMALOUS\_FARE\_REJECTED), live 30-minute half-life decay progress bars, and drag-and-drop Vision Signboard OCR. |
| **Role C: Lead Hackathon Judge** | Seated 15–25 feet from a washed-out venue projector after watching 20 consecutive pitches; has **4–5 minutes** to grade 5 core parts and 3 bonuses. | Skeptical of AI wrappers and fake mockups; looking for deterministic mathematical proof, resilience under failure, and instant visual clarity. | Persistent **\[SIMULATED DEMO TELEMETRY\]** honesty badge, live **X-Ray Algorithmic Trace Pills**, Counterfactual Shadow ROI Ledger, and a 3-step self-explanatory flow. |

### **Zero-Tab-Switch Multi-Role View Architecture**

To eliminate authentication bloat and prevent disorienting browser tab switches during the 4-minute stage demo, /login, /signup, and separate admin portals are strictly banned. DhakaPath implements a **Synchronized 4-Zone Split-Screen Command Center** at 100vw x 100vh (overflow: hidden on desktop) where Role A (Commuter Trigger), Role B (CMS & Bayesian Trust Shield), and Role C (Judge Chaos Injector & X-Ray Telemetry) co-exist on a single unified viewport:

> * **Top Global Bar (Zone 0 — Judge & Time-Machine Control, 64px fixed height):** Houses the 3 deterministic Scenario Presets (\[1. Normal Baseline\], \[2. Peak Crisis Surge\], \[3. Adversarial / Corrupt Input\]), the simulated clock scrub slider (+0m to \+90m), the global X-Ray Engine Telemetry Pill, and the mandatory **\[SIMULATED DEMO TELEMETRY — BENCHMARK REPLAY\]** badge.  
> * **Left Column (Zone 1 — Role A Commuter Command & Action Loop, 28% width):** Houses the Banglish NL/Voice Input bar, 1-tap demo query pills, ranked Pareto Multi-Leg Route Cards, the **Hub Ride-Share Pool Bot** (\[Join Pool (2-\>3) • 30 BDT\]), and the **Offline Canvas/Speech Exporter**.  
> * **Center Stage (Zone 2 — Dual-Layer Topological Map & Shadow ROI Ledger, 44% width):** Top 70% renders the interactive **Leaflet.js \+ OpenStreetMap geographical base** overlaid with a high-contrast **15-Hub Metro-Style SVG Schematic Graph**. Bottom 30% renders the **Counterfactual Shadow Baseline vs. DhakaPath Optimal ROI Ledger** (+64 mins saved, \+28 BDT saved, \-82.0% risk).  
> * **Right Column (Zone 3 — Role B Trust Shield, Bayesian CMS & Vision Digitizer, 28% width):** Houses the live Street Alert Feed with 30-minute exponential decay countdown bars, 1-click \+1 Confirm / \-1 Resolve corroboration controls, the **Rule-Based Sanity & Subgraph Grounding Audit Log**, and the slide-down **Bonus 1 Vision Signboard OCR Ingestor**.

**Live Stage Choreography Benefit:** When the presenter submits an adversarial **500 BDT** fare or triggers **Peak Crisis Surge** in Zone 0, the judge's eyes travel left-to-right in a single sweep: watching Zone 3 intercept the spoofed fare in **\<0.1 ms**, Zone 2 flash crimson on the flooded Farmgate corridor while lighting up the cyan Agargaon MRT-6 detour, and Zone 1 update Rafi's student-pass route card to **48 BDT**—with zero page reloads.

## **3\. First-Principles UX Psychology & System Reasoning ("Why & How")**

| Dhaka Commuter / Judge Pain Point | UX Law Violated by Standard Interfaces | How DhakaPath's Backend Pre-Computes Complexity | Elevated UI/UX Manifestation |
| :---- | :---- | :---- | :---- |
| **1\. Multi-Modal & Piecewise Student Tariff Confusion** (Bus 50% discount with **10 BDT** floor vs. MRT-6 **20–100 BDT** step matrix vs. surged rickshaws). | **Hick's Law & Cognitive Load Theory:** Decision time grows logarithmically with choices; forcing users to mentally calculate transfer combinations across 5 modes causes decision paralysis. | FareEngine.computeLegCost() evaluates the piecewise tariff equation C\_{\\text{fare}}(e, u\_{\\text{stu}}, t) across all \\lvert E\_{\\text{exp}}\\rvert \\approx 240 directed edges and prunes dominance via Label-Setting Pareto Dijkstra in **\<0.8 ms**. | Commuter sees strictly the **Top 3 Non-Dominated Pareto Route Cards** (Optimal Balanced, Lowest BDT, Fastest Grade-Separated) with a crossed-out regular fare and highlighted green **\[STUDENT PASS: 18 BDT (10 BDT Floor Verified)\]** pill. |
| **2\. Fragmented & Stale Social Media Alerts** (Scrolling 50+ Facebook posts to check if Malibagh is still waterlogged or Shahbagh is blocked). | **Miller's Law & Signal-to-Noise Degradation:** Working memory cannot hold more than 7 \\pm 2 unverified social rumors while mapping them spatially to transit corridors. | bayesianTruth.ts computes recursive log-odds \\mathcal{L}\_e(t) with a 30-minute exponential decay kernel (\\lambda \= \\ln(2)/30) and automatically severs edges (T\_{\\text{eff}} \= \\infty) when posterior confidence R\_e(t) \\ge 0.85. | Broken corridors pulse crimson directly on the 15-hub schematic map; each alert card displays a visual **30-Min Half-Life Decay Bar** and auto-archives when R\_e(t) \< 0.25. |
| **3\. Generative AI Topology & Fare Hallucinations** (Chatbots inventing "Underground Ferry from Badda to Dhanmondi" or halving MRT-6 fares). | **Jakob's Law & Trust Calibration:** Users transfer chat expectations from consumer LLMs, assuming fluent text equals factual accuracy until they get stranded at a station. | subgraphVerifier.ts evaluates the Boolean SAT-style indicator \\mathcal{V}(\\hat{P}) \= \\prod\_{j=1}^L \\mathbb{I}(\\hat{e}\_j \\in E) \\cdot \\mathbb{I}(T\_{\\text{eff}} \< \\infty) \\cdot \\mathbb{I}(\\lvert \\hat{C}\_j \- C\_{\\text{fare}}\\rvert \< \\epsilon) \= 1 against CANONICAL\_GRAPH\_G0. | Unverified LLM prose is never rendered directly; verified routes display an emerald **\[GRAPH\_GROUNDED: V(P)=1\]** shield, while intercepted hallucinations trigger a high-contrast **\[GROUNDING\_INTERCEPTED\]** telemetry trace. |
| **4\. 3G Connectivity Dropouts & Dying Batteries in Gridlock** (Heavy web apps failing inside concrete MRT-6 stations or monsoon jams). | **Fitts's Law & Peak-End Rule:** If an app fails at the final boarding step due to network loss, the entire user experience is judged as a failure. | offlineBriefingExporter.ts renders the verified itinerary onto an isolated offscreen 800x1000px HTML5 Canvas (\<45 KB PNG) and invokes browser-native window.speechSynthesis with zero network calls. | Large thumb-zone **\[Export Offline Card (\<45 KB) \+ Audio\]** button positioned at the bottom of the active route card for instant 1-tap survival caching. |

## **4\. Visual Design Language & Projector-Safe Atmospheric UI**

### **Venue Projector & Bright-Room Readability Standards**

Cheap hackathon venue projectors crush low-contrast dark grays (\#1E1E1E on \#121212) into an unreadable smear and wash out thin pastel lines. DhakaPath enforces a **High-Contrast Tactical Obsidian Palette** engineered specifically for 25-foot auditorium legibility:

> * **Surface Hierarchy & Crisp Borders:**  
  * **Canvas Background:** Deep Obsidian \#070B14  
  * **Elevated Panel Surface:** Midnight Slate \#0F172A  
  * **Interactive Card Surface:** Tactical Navy \#1E293B  
  * **Projector-Safe Borders:** Every panel and route card enforces a 1.5px solid \#334155 structural border (\#475569 on hover, 2.0px solid semantic accent on active selection).  
> * **Typography Scale & Strict Numeric Clamping:**  
  * **Primary Font:** Plus Jakarta Sans or Inter (UI & Bangla/Banglish Unicode fallback: Noto Sans Bengali).  
  * **Telemetry & Math Trace Font:** JetBrains Mono (font-variant-numeric: tabular-nums so live decay timers and millisecond traces never jitter horizontally).  
  * **Minimum Data Label Size:** Strictly **14px** (0.875rem, font-weight: 500, color \#E2E8F0 — zero muddy gray sub-12px captions).  
  * **Hero KPI & Fare Metrics:** **28px to 36px** (font-weight: 800, color \#FFFFFF) for total BDT fare, minutes saved, and Bayesian confidence percentages.  
> * **Dual-Coded Status Indicators:** Every transit mode and alert status pairs **Distinct Vector Icon \+ High-Contrast Solid Border Pill \+ Uppercase Text Label** so color-blind judges or washed-out projectors never rely on hue alone.

### **Color Psychology & Semantic Tokens**

| Semantic Token Role | Hex Code / CSS Token | Contrast Ratio (vs \#0F172A) | Functional Application in DhakaPath |
| :---- | :---- | :---- | :---- |
| **Primary Action & Pareto Optimal Path** | **Electric Cyan** (\#06B6D4 / Text \#083344 on fill) | **9.4 : 1** | Active Pareto route line P^\* on the 15-hub schematic map, primary CTA buttons, and active Scenario Preset focus ring. |
| **Algorithmic / Grounding Confidence (Optimal State)** | **Signal Emerald** (\#10B981 / Pill BG \#064E3B) | **8.7 : 1** | **\[GRAPH\_GROUNDED: 100% VERIFIED\]** shield, Student 50% Half-Fare applied badge, and positive Counterfactual ROI savings (+64m, \+28 BDT). |
| **Surge Warning & Pending Corroboration** | **High-Vis Amber** (\#F59E0B / Pill BG \#451A03) | **10.2 : 1** | Weather/rush-hour rickshaw surge multiplier (\\gamma\_e \\in \[1.8, 2.2\]), PENDING\_CORROBORATION alerts (0.25 \\le R\_e(t) \< 0.85), and Walk-Bridge detour notices. |
| **Critical Blockade & Adversarial Rejection** | **Crimson Pulse** (\#F43F5E / Pill BG \#4C0519) | **7.8 : 1** | Severed graph edges (R\_e(t) \\ge 0.85 \\implies T\_{\\text{eff}} \= \\infty), ANOMALOUS\_FARE\_REJECTED (\>2.5x base fare), and GROUNDING\_INTERCEPTED logs. |
| **Transport Mode Coding (5 Modes)** | **MRT-6:** \#22C55E (Solid Thick 5px) | **Bus:** \#3B82F6 (Solid 3.5px) | **Leguna:** \#A855F7 (Dash-Dot) | **Rickshaw:** \#F59E0B (Short Dash) | **Walk-Bridge:** \#94A3B8 (Dotted) | **\> 7.5 : 1** | Distinct stroke geometry \+ color coding across the 15-hub SVG overlay so multi-leg transfers are readable at a glance. |

### **Contextual Accessibility & Stage Ergonomics**

> * **Outdoor Glare & Low-End Smartphone Adaptation:** On viewports \< 768px, the 4-zone command center collapses cleanly into a thumb-zone bottom sheet with 48px minimum tap targets and zero heavy WebGL shaders, keeping total browser heap usage **\< 28 MB**.  
> * **Color-Blind Safe Topological Geometry:** Severed corridors do not merely turn red; they render an explicit **\[X\] SEVERED** SVG cross-hatch marker at the hub midpoint and animate a dashed cyan bypass arc around the blocked vertex.  
> * **Deterministic Stage Hotkeys:** To prevent mouse-hunting during the live pitch, global keyboard listeners bind:  
  * Alt \+ 1 / Alt \+ 2 / Alt \+ 3: Trigger Scenario Presets 1, 2, and 3 (NORMAL\_BASELINE, PEAK\_CRISIS\_SURGE, ADVERSARIAL\_CORRUPT\_INPUT).  
  * Ctrl \+ Shift \+ D: Toggle the expanded **X-Ray Algorithmic Math Trace Drawer** across all panels.  
  * Alt \+ R: Instant reset to canonical graph G\_0 baseline.

## **5\. Visualizing the Invisible ("X-Ray Algorithmic Trace") & Human Trust**

### **The X-Ray Engine Trace Component**

Judges cannot inspect TypeScript files during a 4-minute demo; if a route updates in **0.78 ms**, an untrained eye might assume it is a hardcoded if/else mockup. DhakaPath embeds a persistent **Live X-Ray Execution Trace Pill** at the top of the Route Command Panel and inside the Trust Shield that streams the exact deterministic intermediate variables on every state transition:  
\[⚡ ENGINE: 0.78ms | |V\_exp|: 75, |E\_exp|: 240 | J(P\*): 0.241 | u\_stu: 1 (10 BDT Floor Active) | R\_Farmgate: 0.918 \>= 0.85 (T\_eff \-\> INF) | V(P^): 1 (GROUNDED) | Risk Delta: \-82.0%\]

Clicking or hovering over the X-Ray Pill expands a compact **3-Line Formula Audit Card** showing:

> 1. **Piecewise Fare Trace:** Leg 1 (WALK): 0 BDT \+ Leg 2 (MRT-6, 4.2km): 30 BDT (No Stu Disc) \+ Leg 3 (BUS, Base 36 BDT): max(10, ceil(0.5 \* 36)) \= 18 BDT \-\> Total: 48 BDT \<= Budget 55 BDT.  
> 2. **Bayesian Decay Trace:** Hub: H\_FARMGATE | Prior S\_0: 0.45 | Votes: \+4 (w\_k=0.75) | Decay exp(-0.0231 \* 14m) | Log-Odds L\_e: \+2.41 \-\> Posterior R\_e(t): 91.8% (BLOCKADE SEVERED).  
> 3. **SAT Subgraph Grounding Check:** LLM Candidate Edges Checked: 3/3 in G\_0 | Fare Deviation: 0.0 BDT \< 1e-6 | Status: GRAPH\_GROUNDED.

### **Human-in-the-Loop Override & High-Agency Micro-Copy**

Every automated algorithmic decision pairs with an immediate **1-Click Human Override** and replaces generic CRUD labels ("Submit", "Process", "OK") with domain-precise operational micro-copy:

| Generic Label (Banned) | DhakaPath High-Agency Micro-Copy | Human-in-the-Loop Override Control |
| :---- | :---- | :---- |
| "Submit Search" | **\[Compute Verified Pareto Detour\]** | 1-tap toggle pills to override constraints live: **\[Force Student Pass: ON\]**, **\[Bypass Flooded Hubs\]**, or **\[Unlock Walk-Bridge (4.5 km/h)\]**. |
| "Join Group" | **\[Join Hub Pool (2/4 \-\> 3/4) • Lock 30 BDT Split\]** | **\[Leave Pool / Solo Rickshaw (90 BDT)\]** instant rollback toggle. |
| "Approve / Reject Report" | **\[Corroborate Blockade (+1 Vote)\]** / **\[Mark Corridor Cleared (-1)\]** | Admin 1-click **\[Override Decay & Quarantine Anomaly\]** button to immediately purge a suspected spoofed alert. |
| "Upload Image" | **\[Scan Bus Signboard & Ground Edges\]** | Interactive confirmation pill: **\[Commit 4 Verified Edges to Graph G\_0\]** vs. **\[Discard Unverified OCR Hub\]**. |

## **6\. The Connected User Journey (Mermaid.js)**

The following graph TD diagram maps the complete 3-minute live stage "Golden Path," including the Feature 0 Scenario Injector triggers, the 800ms LLM timeout fallback, the Tier 1–3 validation gates, and the 3 closing commuter actions:  
graph TD  
  Start(\["0:00 Stage Open: 5-Second Main Screen\<br/\>15-Hub Dual-Layer Map \+ Velocity Alert (4.8 km/h)\<br/\>Badge: \[SIMULATED DEMO TELEMETRY\]"\]) \--\> Step1

  subgraph Zone0\_Scenario \["Feature 0: Stage Time-Machine & Chaos Injector (Top Bar)"\]  
    Step1\["Presenter / Judge Triggers Scenario Preset\<br/\>\[1. Normal\] | \[2. Peak Crisis Surge\] | \[3. Adversarial Input\]"\]  
    Step1 \--\>|150ms Debounce Lock| PureProj\["Pure Graph Projection: G(t) \= f(G\_0, S\_k, Δt\_sim)\<br/\>Object.freeze(CANONICAL\_GRAPH\_G0)"\]  
  end

  PureProj \--\> BranchChoice{"Active Demo Action?"}

  subgraph Zone1\_Commute \["Feature 1 & 2: Banglish Search & Pareto Dijkstra Engine"\]  
    BranchChoice \--\>|Commuter Query| BanglishInput\["Input Banglish Query:\<br/\>'Mirpur 10 theke Motijheel, student id ache, 55 BDT, avoid Farmgate'"\]  
    BanglishInput \--\> LLMGate{"Groq / Gemini JSON Parser\<br/\>\< 800ms Timeout?"}  
    LLMGate \--\>|Online & Valid Schema| ValidIntent\["Strict CommuterQuery JSON:\<br/\>H\_MIRPUR10 \-\> H\_MOTIJHEEL, is\_student=true, max\_budget\_bdt=55"\]  
    LLMGate \--\>|Timeout / Malformed| RegexFallback\["Deterministic Banglish Phonetic Lexer\<br/\>Extracts Exact Enums in 0.2ms (Zero Crash)"\]  
    RegexFallback \--\> ValidIntent  
    ValidIntent \--\> ParetoEngine\["Multi-Criteria Label-Setting Dijkstra (\<0.8ms)\<br/\>16-Bit Cycle Guard \+ Piecewise Student/MRT-6 Fare Engine"\]  
    ParetoEngine \--\> PartitionCheck{"All Motorized Paths\<br/\>Severed (T\_eff \= ∞)?"}  
    PartitionCheck \--\>|No| GroundingGate\["SAT-Style Subgraph Grounding Verifier\<br/\>V(P\*) \= 1 (100% Nodes & Fares Verified)"\]  
    PartitionCheck \--\>|Yes: Subgraph Partitioned| WalkBridge\["Activate Graceful Walk-Bridge Protocol\<br/\>(4.5 km/h Footpath Bypass, 0 BDT)"\]  
    WalkBridge \--\> GroundingGate  
  end

  subgraph Zone3\_Trust \["Feature 3: Adversarial Shield, Bayesian Decay & Vision OCR"\]  
    BranchChoice \--\>|Adversarial / Crowd / OCR| TrustInput\["Inject Spoofed 500 BDT Fare / Hallucinated Ferry\<br/\>OR Drop Bus Signboard Photo"\]  
    TrustInput \--\> SanityGate{"Tier 1: Rule-Based Sanity Filter\<br/\>10 \<= Fare \<= 2.5x Base?"}  
    SanityGate \--\>|Violation (500 BDT \> 62.5 BDT)| RejectLog\["Block in \<0.1ms: \[ANOMALOUS\_FARE\_REJECTED\]\<br/\>Graph State Untouched"\]  
    SanityGate \--\>|Valid Crowd Vote / OCR| BayesUpdate\["Tier 2 & 3: Recursive Bayesian Log-Odds Update\<br/\>30-Min Half-Life Decay \+ Signboard Subgraph Check"\]  
    BayesUpdate \--\> ParetoEngine  
  end

  GroundingGate \--\> Zone2\_Render\["Render Optimal Route P\* (48 BDT, 48 min, 1 Transfer)\<br/\>+ X-Ray Trace Pill \+ Shadow ROI Ledger (+64m, \+28 BDT Saved)"\]

  Zone2\_Render \--\> ActionLoop{"Step 3: Commuter Closes Loop\<br/\>(1-Click Executable Actions)"}  
  ActionLoop \--\>|Action A: Bonus 3| PoolJoin\["Click \[Join Hub Ride-Share Pool (2/4 \-\> 3/4)\]\<br/\>Surged 90 BDT Rickshaw \-\> 30 BDT/person (-60 BDT Saved)"\]  
  ActionLoop \--\>|Action B: Bonus 2| OfflineExport\["Click \[Export Offline Briefing\]\<br/\>Downloads \<45KB HTML5 Canvas PNG \+ Native Web Speech Readout"\]  
  ActionLoop \--\>|Action C: Part 4| CrowdVote\["Click \[+1 Confirm / \-1 Resolve Alert\]\<br/\>Updates Live Bayesian Confidence R\_e(t)"\]

## **7\. Screen-by-Screen UI/UX & Parallel Component Blueprint**

To guarantee **zero Git merge conflicts** across our 4 developers during the 340-minute sprint, the single-screen application is partitioned into **4 strictly isolated feature directories and custom hooks** that communicate solely through src/contracts/schema.ts and src/contracts/adapter.ts.

### **View 1: Global Stage Time-Machine & Scenario Injector Bar (Feature 0\)**

> * **Experience Goal & Pain Point Resolved:** Eliminates slow manual form entry during the live pitch so judges can witness three days of Dhaka monsoon crises, rush-hour surges, and adversarial troll attacks in 3 seconds.  
> * **Isolated File Path & Hook Ownership:**  
  * **Component:** src/shell/ScenarioInjectorBar.tsx (Owned by **Dev 4**, wired to state store by **Dev 1**).  
  * **Isolated Hook:** src/shell/useScenarioInjector.ts (Consumes src/engine/scenarioStore.ts — zero shared mutable UI files).  
> * **Spatial Layout & Visual Hierarchy (100% Width x 64px Top Header):**  
  * **Left (25%):** Brand identity (DhakaPath // INIF-26), live macro velocity badge (Peak Surface Velocity: 4.8 km/h), and persistent honest telemetry pill **\[SIMULATED DEMO TELEMETRY — BENCHMARK REPLAY\]**.  
  * **Center (50% — Primary Interactive Canvas):** Three high-contrast segmented preset buttons (\[1. Normal Baseline\], \[2. Peak Crisis Surge\], \[3. Adversarial / Corrupt Input\]) paired with a 4-stop **Time-Machine Decay Scrub Slider** (+0m, \+15m, \+45m, \+90m).  
  * **Right (25% — X-Ray Telemetry Context):** Global execution latency pill (Engine: 0.78ms | Cache: HIT) and Alt+1..3 shortcut hint badge.  
> * **Micro-Interactions & Optimistic UI:**  
  * Clicking \[2. Peak Crisis Surge\] immediately engages an optimistic 150ms ActionLockState.PROCESSING border pulse (\#06B6D4), disables duplicate clicks via deterministic action\_id \= "SCENARIO\_PEAK\_CRISIS\_SURGE\_0", and snaps the active preset badge to **RESOLVED** while emitting a synchronized wave animation across the central map.  
> * **Resilience States:**  
  * **Zero-Data / Startup State:** Boots instantaneously at t \= 0 from frozen CANONICAL\_GRAPH\_G0 constants (v\_surface \= 14.5 km/h, gamma\_e \= 1.0) with zero network dependency.  
  * **Rapid Click / Race Fallback:** If a nervous presenter clicks a preset 5 times in 1 second, the 150ms debounce \+ pure functional projection G(t) \= f(G\_0, S\_k, \\Delta t\_{\\text{sim}}) guarantees zero cumulative floating-point fare drift.  
> * **Strict TypeScript / JSON Data Contract:**

// Consumed strictly by src/shell/ScenarioInjectorBar.tsx  
import { ScenarioPreset, ActionLockState } from "../contracts/schema";

export interface ScenarioInjectorViewState {  
  readonly active\_preset: ScenarioPreset; // Defaults to ScenarioPreset.NORMAL\_BASELINE  
  readonly sim\_offset\_ms: number; // Bounds: \[0, 7200000\] (0 to 120 mins), integer \_ms  
  readonly lock\_state: ActionLockState; // IDLE | PROCESSING | RESOLVED  
  readonly last\_action\_id: string; // e.g., "SCENARIO\_PEAK\_CRISIS\_SURGE\_0"  
  readonly surface\_velocity\_kmh: number; // Clamped \[4.0, 25.0\], formatted via .toFixed(1) \-\> "4.8 km/h"  
  readonly active\_surge\_multiplier: number; // Clamped \[1.0, 3.0\], formatted via .toFixed(1) \-\> "1.8x"  
  readonly engine\_recompute\_latency\_ms: number; // Clamped \[0.01, 5000.0\], formatted via .toFixed(2) \-\> "0.78 ms"  
  readonly is\_demo\_telemetry: true; // Always true: enforces Winner Rule Honest Label  
}

### **View 2: Banglish Multi-Constraint Command Center & Last-Mile Action Loop (Feature 1 & Feature 2 Output)**

> * **Experience Goal & Pain Point Resolved:** Lets a stressed commuter type or speak a messy Banglish sentence to get a mathematically verified student-budget route, split a surged rickshaw fare with peers at the same hub, and download an offline survival card in one tap.  
> * **Isolated File Path & Hook Ownership:**  
  * **Components:** src/features/feature-1-commute/CommuteCommandPanel.tsx and src/features/feature-1-commute/CommuteAssistant.tsx (Owned by **Dev 3**; Canvas/Audio helper invoked via adapter from **Dev 4**).  
  * **Isolated Hook:** src/features/feature-1-commute/useCommuteCommand.ts.  
> * **Spatial Layout & Visual Hierarchy (Left Column — 28% Viewport Width):**  
  * **Top 30% (Input & X-Ray Intent Trace):** Natural language Banglish input box with microphone trigger, 3 one-tap judge query chips (e.g., *"Mirpur 10 \-\> Motijheel, Student Pass, \<= 55 BDT"*), and a live **Extracted Constraints Pill Row** (Origin: H\_MIRPUR10 | Dest: H\_MOTIJHEEL | Student: YES (10 BDT Floor) | Budget: \<= 55 BDT | Avoid: H\_FARMGATE).  
  * **Bottom 70% (Primary Interactive Canvas — Pareto Route Cards & Action Loop):** Vertical stack of the top 3 Pareto-optimal route cards. Card \#1 (Optimal P^\*) expands by default to show:  
    * **Header:** Oversized **48 BDT** (28px bold emerald) vs. crossed-out 66 BDT Regular, **48 mins**, **1 Transfer**, and **\[GRAPH\_GROUNDED: 100%\]** badge.  
    * **Step-by-Step Leg Timeline:** Leg 1 (WALK 3m, 0 BDT, *"Mirpur-10 Footbridge"*) \-\> Leg 2 (METRO MRT-6, 7m, **30 BDT**, *"No Student Pass on Metro"*) \-\> Leg 3 (BUS Bihanga Paribahan, 38m, **18 BDT Student / 36 BDT Reg**, *"Board at Agargaon South Footbridge"*).  
    * **Embedded Action Loop Footer:** Two high-contrast action buttons: **\[Join Hub Pool (2/4 \-\> 3/4) • 30 BDT\]** (for surged rickshaw legs) and **\[Export Offline Card (\<45 KB) \+ Voice\]**.  
> * **Micro-Interactions & Optimistic UI:**  
  * Submitting a query immediately locks the button (ActionLockState.PROCESSING) and runs a 3-step inline progress trace (1. Parsing Banglish Intent \-\> 2\. Evaluating 240 Mode-Expanded Edges \-\> 3\. Verifying Subgraph V(P)=1) with zero blocking screen spinners.  
  * Clicking **\[Join Hub Pool\]** animates the pool counter from 2/4 to 3/4 and ticks the per-person rickshaw fare down from 45 BDT to 30 BDT (Math.ceil(90 / 3)) with an emerald savings flash.  
> * **Resilience States:**  
  * **LLM Timeout / Rate-Limit Fallback (\> 800ms):** If Groq/Gemini free-tier APIs lag or emit markdown fences, AbortController cancels the network request at 800ms and switches seamlessly to our local deterministic Banglish phonetic regex lexer (0.2ms), displaying a subtle amber **\[LOCAL PHONETIC LEXER FALLBACK: 0.2ms\]** badge.  
  * **Web Speech API Unavailable Fallback:** If the presenter's OS lacks TTS voices, clicking Audio Briefing automatically reveals a high-contrast **Phonetic Audio Transcript Drawer** instead of failing silently.  
> * **Strict TypeScript / JSON Data Contract:**

// Consumed strictly by src/features/feature-1-commute/CommuteCommandPanel.tsx  
import { CommuterQuery, ParetoRouteOption, ActionLockState, ValidationStatus } from "../../contracts/schema";

export interface CommuteCommandViewState {  
  readonly active\_query: CommuterQuery;  
  readonly parser\_source: "LLM\_SANDBOX" | "DETERMINISTIC\_REGEX\_FALLBACK";  
  readonly parse\_latency\_ms: number; // Clamped \[0.1, 800.0\], formatted via .toFixed(1)  
  readonly pareto\_routes: ReadonlyArray\<ParetoRouteOption\>; // Non-nullable, defaults to \[\]  
  readonly selected\_route\_id: string;  
  readonly pool\_lock\_state: ActionLockState;  
  readonly export\_lock\_state: ActionLockState;  
  readonly last\_exported\_png\_kb: number; // Clamped \[1.0, 45.0\], formatted via .toFixed(1) \-\> "38.4 KB"  
  readonly grounding\_audit\_status: ValidationStatus; // Must equal ValidationStatus.GRAPH\_GROUNDED to render route  
}

### **View 3: Dual-Layer 15-Hub Topological Map & Counterfactual Shadow ROI Ledger (Feature 2 Visual & Feature 4\)**

> * **Experience Goal & Pain Point Resolved:** Gives judges immediate 5-second visual proof of both the physical Dhaka topology and the exact time, cost, and risk saved compared to a commuter's naive baseline path.  
> * **Isolated File Path & Hook Ownership:**  
  * **Components:** src/shell/TopologicalMap.tsx and src/shell/CounterfactualRoiLedger.tsx (Owned by **Dev 4**, consuming pure math selectors from **Dev 1**'s src/engine/shadowBaseline.ts).  
  * **Isolated Hook:** src/shell/useTopologicalRoi.ts.  
> * **Spatial Layout & Visual Hierarchy (Center Column — 44% Viewport Width):**  
  * **Top 70% (Primary Interactive Canvas — Dual-Layer Map):** Renders a dark-themed Leaflet.js \+ OpenStreetMap geographical canvas (bounded minZoom: 11, maxZoom: 16\) overlaid with a crisp SVG **15-Hub Metro-Style Schematic Node-Graph** (H\_UTTARA to H\_MOTIJHEEL and H\_JATRABARI).  
    * Active optimal trajectory P^\* glows in 5px Electric Cyan (\#06B6D4).  
    * Naive Shadow Baseline P\_{\\text{shadow}} renders as a muted dashed gray/red trace through flooded Farmgate so judges visually see *what was avoided*.  
    * Severed hubs (H\_FARMGATE, H\_MALIBAGH) display pulsing crimson rings with live Bayesian confidence callouts (R\_e: 91.8% • BLOCKED).  
  * **Bottom 30% (X-Ray Telemetry & Counterfactual ROI Ledger):** Side-by-side comparison table contrasting **Traditional Manual Baseline (Naive Surface \+ FB Check)** vs. **DhakaPath Optimal Engine (P^\*)** with three oversized hero delta badges:  
    * **\+64 Mins Saved** (112 min Shadow Stall vs. 48 min Optimal).  
    * **\+28 BDT Saved** (76 BDT Regular/Surge vs. 48 BDT Student Multi-Leg).  
    * **\-82.0% Blockade Risk** (plus empirical discovery latency badge: **8.5 min Manual FB Check \-\> 1.4 sec DhakaPath**).  
> * **Micro-Interactions & Optimistic UI:**  
  * Hovering over any leg in the Left Column highlights that exact directed edge on the SVG map and pops up a landmark tooltip (*"Agargaon South Footbridge: Transfer MRT-6 \-\> Bihanga Bus"*).  
  * When all motorized surface paths partition under simultaneous blockades, the map animates a dotted amber **Walk-Bridge Bypass Arc** (4.5 km/h, 0 BDT) with a **\[DETOUR\_WALK\_BRIDGE\_REQUIRED\]** banner.  
> * **Resilience States:**  
  * **Offline OSM Tile Fallback:** If venue Wi-Fi drops and OpenStreetMap raster tiles fail to load, the SVG 15-Hub Topological Schematic Layer remains 100% interactive over a high-contrast tactical grid background—zero blank map screen.  
  * **Infinity / NaN Clamping Guard:** Severed edges (T\_{\\text{eff}} \= \\infty) on the shadow route are strictly clamped via computeSafeTimeDeltaMin() to the empirical BUET ARI gridlock stall bound (112 mins) so the UI never prints Infinity mins saved or NaN%.  
> * **Strict TypeScript / JSON Data Contract:**

// Consumed strictly by src/shell/TopologicalMap.tsx & src/shell/CounterfactualRoiLedger.tsx  
import { HubId, CounterfactualRoiMetrics, ParetoRouteOption, StreetAlert } from "../contracts/schema";

export interface MapAndRoiViewState {  
  readonly active\_optimal\_route: ParetoRouteOption | null;  
  readonly shadow\_baseline\_hubs: ReadonlyArray\<HubId\>; // Defaults to \[\]  
  readonly active\_alerts: ReadonlyArray\<StreetAlert\>; // Defaults to \[\]  
  readonly walk\_bridge\_active: boolean; // True when motorized subgraph partitions  
  readonly osm\_tiles\_online: boolean; // False triggers pure SVG schematic grid mode  
  readonly roi\_metrics: CounterfactualRoiMetrics; // All durations \_ms, costs \_bdt, risks \_pct clamped \[0, 100\]  
}

### **View 4: Bayesian Truth CMS, Vision Signboard Digitizer & Subgraph Grounding Shield (Feature 3\)**

> * **Experience Goal & Pain Point Resolved:** Visually proves to judges that DhakaPath is immune to both internet trolls (500 BDT fake bus fares) and AI hallucinations ("Underground Ferry"), while digitizing real Dhaka bus signboards into structured graph edges.  
> * **Isolated File Path & Hook Ownership:**  
  * **Component:** src/features/feature-3-trust-cms/TrustShieldAndCmsPanel.tsx (Owned by **Dev 2**, integrating Vision OCR & Subgraph Verifier modules from **Dev 3**).  
  * **Isolated Hook:** src/features/feature-3-trust-cms/useTrustShieldCms.ts.  
> * **Spatial Layout & Visual Hierarchy (Right Column — 28% Viewport Width):**  
  * **Top 35% (X-Ray Security & Sanity Audit Log):** Live telemetry feed of intercepted anomalies and grounding checks:  
    * Displays crimson rejection pills when triggered: **\[ANOMALOUS\_FARE\_REJECTED: 500 BDT \> 62.5 BDT (2.5x Base)\]** and **\[GROUNDING\_INTERCEPTED: Edge H\_BADDA \-\> H\_DHANMONDI (FERRY) Not in G\_0\]**.  
  * **Middle 40% (Primary Interactive Canvas — Bayesian Crowd Alert Feed):** Scrollable cards for active street disruptions (H\_FARMGATE Waterlogging, H\_MALIBAGH Gridlock). Each card displays:  
    * Posterior truth probability **R\_e(t): 91.8%** (JetBrains Mono), status pill **\[VERIFIED\_ACTIVE\]**, and a live depleting **30-Minute Half-Life Decay Bar** (half\_life\_remaining\_ms).  
    * 1-click idempotent crowd vote buttons: **\[+1 Confirm (4)\]** and **\[-1 Resolved (0)\]**.  
  * **Bottom 25% (Bonus 1 Vision Signboard & Fare-Chart Digitizer Drawer):** Drag-and-drop zone (with 2 pre-loaded sample Dhaka bus signboard / BRTA fare chart thumbnails for 1-click stage demo) that extracts structured JSON edges and validates them against HubId enums before committing to the Part 1 CMS.  
> * **Micro-Interactions & Optimistic UI:**  
  * Scrubbing the Top Bar Time-Machine slider from \+0m to \+90m smoothly animates the Bayesian Decay Bars downward across all alert cards (91.8% \-\> 52.4% \-\> 18.2%), flipping cards below \\tau\_{\\text{expire}} \= 25.0\\% to **\[EXPIRED — CORRIDOR RESTORED\]** in real time.  
> * **Resilience States:**  
  * **Duplicate Vote / Spam Lock:** Voting \+1 Confirm locks that session's vote button via action\_id \= "CMS\_VOTE\_" \+ alert\_id \+ "\_" \+ session\_id so double-clicking never inflates R\_e(t).  
  * **Blurry OCR / Unknown Hub Fallback:** If Vision OCR reads "Uttora North" from a signboard photo, deterministic fuzzy-to-canonical enum resolution maps it to HubId.H\_UTTARA or flags it for 1-click admin review without crashing the CMS store.  
> * **Strict TypeScript / JSON Data Contract:**

// Consumed strictly by src/features/feature-3-trust-cms/TrustShieldAndCmsPanel.tsx  
import { StreetAlert, TransitEdge, ValidationStatus, ActionLockState } from "../../contracts/schema";

export interface AuditInterceptionEvent {  
  readonly event\_id: string;  
  readonly timestamp\_ms: number;  
  readonly status: ValidationStatus; // ANOMALOUS\_FARE\_REJECTED | GROUNDING\_INTERCEPTED | CONTRADICTORY\_REPORT\_QUARANTINED  
  readonly rejected\_payload\_summary: string; // e.g., "Mirpur-10 \-\> Farmgate: 500 BDT (Max Allowed: 62 BDT)"  
  readonly execution\_time\_ms: number; // Clamped \[0.01, 100.0\], formatted via .toFixed(2)  
}

export interface TrustShieldCmsViewState {  
  readonly active\_alerts: ReadonlyArray\<StreetAlert\>; // Defaults to \[\], confidence\_pct formatted via .toFixed(1)  
  readonly interception\_log: ReadonlyArray\<AuditInterceptionEvent\>; // Defaults to \[\]  
  readonly ocr\_extracted\_edges: ReadonlyArray\<TransitEdge\>; // Defaults to \[\]  
  readonly vote\_lock\_state: ActionLockState;  
  readonly ocr\_lock\_state: ActionLockState;  
}

## **8\. The Signature "Delight & Impact" Pitch Climax**

### **The 15-Second Hero Stage Interaction (Timestamp 1:25 – 1:40)**

During the live pitch, after showing Rafi's baseline student query (*"Mirpur 10 theke Motijheel, student pass, budget 55 taka"*), the presenter steps back from the keyboard and delivers the **15-Second Deterministic Chaos Climax**:

> 1. **The Trigger (Second 0–2):** The presenter clicks **\[2. Peak Crisis Surge\]** in the top Scenario Injector Bar (or presses Alt \+ 2\) while narrating: *"Now watch what happens when monsoon waterlogging hits Malibagh and an intersection blockade severs Farmgate at 5:30 PM."*  
> 2. **The Visual Wave & Graph Severance (Second 2–6):**  
   * On the central 15-Hub Topological Map, H\_FARMGATE and H\_MALIBAGH erupt with pulsing crimson rings as their Bayesian confidence scores jump to **R\_e \= 91.8% (SEVERED)**.  
   * The naive surface bus corridor through Farmgate turns into a red-hatched **\[X\] T\_eff \= ∞** line, while connector rickshaw badges flip to amber **\[1.8x WEATHER SURGE\]**.  
> 3. **The Sub-Millisecond Pareto Reroute & X-Ray Trace (Second 6–11):**  
   * In **0.78 ms**, a glowing Electric Cyan trajectory animates across the grade-separated **MRT-6 Viaduct** from H\_MIRPUR10 to H\_AGARGAON (**30 BDT**, 7 mins), transfers at the *Agargaon South Footbridge* landmark, and bypasses the flood via the Mohakhali Flyover on Bihanga Bus using Rafi's 50% student half-pass (**18 BDT**, 38 mins).  
   * The X-Ray Telemetry Pill flashes: **\[⚡ ENGINE: 0.78ms | MRT-6 (60 BDT) Pruned \> 55 BDT Budget | P\* Optimal: 48 BDT, 48 Mins | V(P\*)=1 GROUNDED\]**.  
> 4. **The Counterfactual Impact Climax (Second 11–15):**  
   * At the bottom of the map, the **Counterfactual Shadow ROI Ledger** flips with high-contrast emerald badges: **\+64 MINS SAVED (vs. 112m Flooded Bus)**, **\+28 BDT SAVED (vs. 76 BDT Regular/Surge)**, and **\-82.0% BLOCKADE RISK**—followed immediately by 1-clicking **\[Join Hub Ride-Share (3/4)\]** to slash a surged **90 BDT** last-mile rickshaw down to **30 BDT**.

## **9\. Atomic UI Primitives & Hackathon Cut-Line**

### **5 Reusable shadcn/ui Primitives (Scaffold Once in src/components/ui/, Reuse Everywhere)**

To move at maximum velocity within 340 minutes, all 4 views are composed strictly from 5 pre-styled atomic primitives:

> 1. **Card (MetricCard & ParetoRouteCard wrapper):** Enforces \#1E293B surface, 1.5px solid \#334155 projector-safe border, and compact 12px internal padding.  
> 2. **Badge (DualCodedStatusPill):** Enforces icon \+ high-contrast semantic fill \+ 14px tabular monospace text for GRAPH\_GROUNDED, VERIFIED\_ACTIVE, ANOMALOUS\_FARE\_REJECTED, and SIMULATED DEMO TELEMETRY.  
> 3. **Button (IdempotentActionButton):** Built-in ActionLockState (IDLE \-\> PROCESSING \-\> RESOLVED) visual ring that prevents double-click race conditions on Scenario Presets, Pool Joins, and Crowd Votes.  
> 4. **Slider (TimeMachineDecaySlider):** Stepped scrub control (+0m, \+15m, \+45m, \+90m) wired to the Bayesian exponential decay evaluator.  
> 5. **Progress (BayesianHalfLifeBar):** Dual-color horizontal bar rendering both posterior confidence R\_e(t) \\in \[0, 100\]\\% and the 30-minute exponential decay countdown.

### **Strict 340-Minute Hackathon Cut-Line: Build Live (P0) vs. Simulate via Deterministic State (P1)**

| Capability / Module | Classification | Implementation Strategy in 340 Minutes |
| :---- | :---- | :---- |
| **15-Hub Mode-Expanded Graph, Pareto Dijkstra & Piecewise Student/MRT-6 Fare Math** | **BUILD LIVE (P0)** | 100% live TypeScript execution in src/engine/paretoRouter.ts and fareEngine.ts (\<0.8 ms). |
| **Rule-Based Sanity Filter, Recursive Bayesian Decay & Subgraph Verifier \\mathcal{V}(\\hat{P})** | **BUILD LIVE (P0)** | 100% live mathematical evaluation in sanityFilter.ts, bayesianTruth.ts, and subgraphVerifier.ts. |
| **Banglish NL Intent Extraction (Groq/Gemini \+ Deterministic Regex Fallback)** | **BUILD LIVE (P0)** | Live API call with 800ms timeout falling back automatically to local phonetic keyword lexer. |
| **Hub Ride-Share Pool Split Math & Offscreen HTML5 Canvas (\<45 KB PNG) \+ Web Speech** | **BUILD LIVE (P0)** | Live state mutation in rideSharePool.ts and programmatic \<canvas\> \+ speechSynthesis in offlineBriefingExporter.ts. |
| **City-Wide Monsoon / Rush-Hour Telemetry & Peer Pool Arrivals** | **SIMULATE VIA DETERMINISTIC STATE (P1)** | Driven by Feature 0's ScenarioInjectorBar.tsx and mock\_data.json benchmark replay, explicitly labeled with **\[SIMULATED DEMO TELEMETRY\]**. |
| **Authentication, User Profiles, Multi-Page Admin Portals & Paid Map APIs** | **STRICTLY CUT (BANNED)** | Zero /login, zero JWT middleware, zero Google Maps billing—saves 90+ minutes of wasted boilerplate. |

## **10\. Winner Demo Rules (Verified from 100 Real Winners)**

> * **5-Second Main Screen:** Within 5 seconds of opening DhakaPath, the judge sees: (1) **The Problem:** Peak Surface Velocity: 4.8 km/h \+ pulsing red waterlogging/blockade rings at Farmgate & Malibagh; (2) **The State:** 15-hub topological network with live Bayesian confidence scores (R\_e \= 91.8\\%); (3) **The Result:** Verified **48 BDT / 48 min** student multi-leg detour; and (4) **Why It Matters:** Counterfactual ROI Ledger showing **\+64 mins saved** and **\+28 BDT saved**.  
> * **Judge Path of 3 Steps or Fewer:**  
  * **Step 1 (Input):** Click a Scenario Preset (\[2. Peak Crisis Surge\]) or Banglish query chip (*"Mirpur 10 \-\> Motijheel, student pass, 55 BDT"*).  
  * **Step 2 (Verified Result):** Inspect the highlighted cyan MRT-6 \+ Bus detour on the 15-hub map alongside the Shadow ROI savings in **\<1.4 seconds**.  
  * **Step 3 (Executable Action):** Click **\[Join Hub Ride-Share Pool (3/4)\]** to cut a surged 90 BDT rickshaw to 30 BDT and click **\[Export Offline Briefing\]** to download the \<45 KB PNG route card \+ voiceover.  
> * **Trust on Screen:** Every route card renders the **\[GRAPH\_GROUNDED: 100% VERIFIED\]** subgraph audit badge, while the Right Panel displays live **30-Minute Half-Life Bayesian Decay Timers**, \+1 / \-1 human corroboration buttons, and real-time ANOMALOUS\_FARE\_REJECTED interception logs.  
> * **One Normal Case \+ One Failure/Adversarial Case \+ Offline State:** Feature 0 covers \[1. Normal Baseline\], \[2. Peak Crisis Surge\] (subgraph partitioning \+ Walk-Bridge fallback), and \[3. Adversarial / Corrupt Input\] (500 BDT spoofed fare rejection \+ hallucinated ferry interception), while the 800ms local regex fallback and \<45 KB HTML5 Canvas exporter cover slow/zero-network states.  
> * **Authentic Local Touch:** Natively supports conversational **Banglish & Bangla Unicode** queries (*"bhai Mirpur 10 theke Motijheel jabo, student id ache, 55 takar moddhe"*), real Dhaka transport modes (MRT-6, Bihanga Bus, Leguna, Rickshaw), statutory **10 BDT student bus floors**, and exact boarding landmarks (*"Agargaon South Footbridge"*).  
> * **Honest Labels:** The global header persistently renders **\[SIMULATED DEMO TELEMETRY — BENCHMARK REPLAY\]** so synthetic disruption presets and the 30-query benchmark (8.5 min \-\> 1.4 sec) are presented with 100% engineering integrity.

## **Mandatory Self-Verification Checklist**

> * \[x\] **Zero Bloat Mapping:** Every screen/panel maps 1:1 to locked features (Feature 0 Scenario Injector, Feature 1 Banglish Command \+ Pool/Offline Loop, Feature 2 Pareto Dijkstra & Piecewise Fare Engine, Feature 3 Bayesian Trust CMS \+ Vision OCR \+ Subgraph Verifier, Feature 4 Counterfactual Shadow ROI Ledger) from 02\_features\_and\_qa.md.  
> * \[x\] **X-Ray Algorithmic Trace Included:** Live telemetry pill exposes execution time (0.78 ms), generalized cost J(P^\*), Bayesian confidence R\_e(t), piecewise student floor math, and boolean grounding \\mathcal{V}(\\hat{P}) \= 1 directly on screen.  
> * \[x\] **Zero-Tab-Switch Multi-Role Layout:** Role A (Commuter), Role B (Admin/Verifier), and Role C (Judge Simulator) operate simultaneously across a 4-zone single-screen command center with zero /login or tab switches.  
> * \[x\] **Strict Data Contracts & Float Clamping:** All TypeScript interfaces enforce shared enums from src/contracts/schema.ts, integer Unix \_ms timestamps, \_bdt and \_pct suffixes, non-nullable \[\] array defaults, and explicit .toFixed(1) / .toFixed(2) formatting guards against NaN and Infinity.  
> * \[x\] **100% Isolated Parallel File Ownership:** src/shell/\* (Dev 4), src/engine/\* (Dev 1), src/features/feature-1-commute/\* (Dev 3), and src/features/feature-3-trust-cms/\* (Dev 2\) use isolated hooks and communicate strictly through src/contracts/adapter.ts.  
> * \[x\] **5-Second Main Screen & \<= 3-Step Judge Path:** Verified and mapped in the Mermaid journey and View blueprints.  
> * \[x\] **Visible Trust & Honest Demo Labels:** GRAPH\_GROUNDED shield, Bayesian Decay Timers, Sanity Rejection Logs, and SIMULATED DEMO TELEMETRY badge are persistently visible on the main viewport.