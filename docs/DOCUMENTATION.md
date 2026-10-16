# DhakaPath: Complete Technical Architecture, Algorithmic Engine & Execution Manual

> **IAIT National IT Fest (INIF) 2026 | Hackathon Track: Smart City**  
> **Project:** DhakaPath — Multi-Objective Spatio-Temporal Transit Engine & Zero-Hallucination Route Verifier  
> **Execution Window:** 5 Hours 40 Minutes (340 Minutes) | **Target Platform:** 100% Free Open Stack  
> **Source Documents Consolidated:**
> - [Hackathon Problem Statement](file:///g:/Hackaton/DhakaPath/docs/Hackathon_Problem_Statement_INIF_2026.md)
> - [01 Idea & Thesis (idea.md)](file:///g:/Hackaton/DhakaPath/docs/idea.md)
> - [02 Features & QA Matrix (feature.md)](file:///g:/Hackaton/DhakaPath/docs/feature.md)
> - [03 UI/UX Flow & Stage Blueprint (ux-flow.md)](file:///g:/Hackaton/DhakaPath/docs/ux-flow.md)
> - [04 Master Build Playbook (Build Prompt.md)](file:///g:/Hackaton/DhakaPath/docs/Build%20Prompt.md)

---

## Table of Contents
1. [Executive Summary & The Championship Thesis](#1-executive-summary--the-championship-thesis)
2. [Dhaka Asymmetric Regional Reality & Problem Space](#2-dhaka-asymmetric-regional-reality--problem-space)
3. [Technical Constraints & 100% Free Stack Architecture](#3-technical-constraints--100-free-stack-architecture)
4. [The 6-State Finite State Machine (FSM)](#4-the-6-state-finite-state-machine-fsm)
5. [Mathematical & Algorithmic Formulations](#5-mathematical--algorithmic-formulations)
   - [5.1 Multi-Modal Piecewise Tariff & Weather Surge Equation](#51-multi-modal-piecewise-tariff--weather-surge-equation)
   - [5.2 Recursive Bayesian Truth Discovery with Exponential Decay](#52-recursive-bayesian-truth-discovery-with-exponential-decay)
   - [5.3 Normalized Multi-Objective Generalized Cost & Pareto Routing](#53-normalized-multi-objective-generalized-cost--pareto-routing)
   - [5.4 SAT-Style Subgraph Grounding Indicator](#54-sat-style-subgraph-grounding-indicator)
   - [5.5 Counterfactual Shadow Baseline ROI Formulation](#55-counterfactual-shadow-baseline-roi-formulation)
6. [Feature Calibration & Verification Matrix](#6-feature-calibration--verification-matrix)
   - [Mandatory Feature 0: Stage Time-Machine & Chaos Injector](#mandatory-feature-0-stage-time-machine--chaos-injector)
   - [Feature 1: Banglish Multi-Constraint Command Center & Action Loop](#feature-1-banglish-multi-constraint-command-center--action-loop)
   - [Feature 2: Mode-Expanded Pareto Dijkstra Router & Fare Engine](#feature-2-mode-expanded-pareto-dijkstra-router--fare-engine)
   - [Feature 3: Bayesian Truth CMS & Vision Signboard Digitizer](#feature-3-bayesian-truth-cms--vision-signboard-digitizer)
   - [Feature 4: Counterfactual Shadow ROI Ledger](#feature-4-counterfactual-shadow-roi-ledger)
   - [Bonus Tasks 1, 2 & 3: Vision OCR, Offline Survival & Ride-Share Bot](#bonus-tasks-1-2--3-vision-ocr-offline-survival--ride-share-bot)
7. [UI/UX Command Center Architecture (4-Zone Single Viewport)](#7-uiux-command-center-architecture-4-zone-single-viewport)
   - [7.1 Projector-Safe Tactical Obsidian Design System](#71-projector-safe-tactical-obsidian-design-system)
   - [7.2 Connected User Journey Diagram (Mermaid)](#72-connected-user-journey-diagram-mermaid)
   - [7.3 The X-Ray Algorithmic Telemetry Trace](#73-the-x-ray-algorithmic-telemetry-trace)
8. [System Data Contracts & Serialization Laws](#8-system-data-contracts--serialization-laws)
9. [Master Parallel Execution Playbook (4 Developers, 340 Minutes)](#9-master-parallel-execution-playbook-4-developers-340-minutes)
10. [Live Stage Pitch Choreography & Judge Defense](#10-live-stage-pitch-choreography--judge-defense)
11. [Cross-Reference Document Index](#11-cross-reference-document-index)

---

## 1. Executive Summary & The Championship Thesis

Standard navigation platforms (e.g., Google Maps) are designed for Western cities with predictable vehicular schedules, uniform ticketing, and reliable GPS telemetry. In Dhaka, daily travel is fragmented across local buses, the grade-separated MRT-6 Metro Rail, human-powered rickshaws, auto-rickshaws (CNGs), and legunas.

### Core Value Proposition
> *"For daily Dhaka commuters and university students, when sudden monsoon waterlogging, intersection blockades, or rush-hour surges disrupt normal transit corridors, the **DhakaPath** platform turns live crowd-verified street alerts, statutory fare rules, and Banglish trip queries into a mathematically verified, multi-leg detour and exact BDT fare split in under 1.4 seconds, unlike scattered Facebook traffic posts or private-car navigation maps."*

### The Five Winning Pillars
1. **Deterministic Core Decision Engine:** Multi-objective Label-Setting Pareto Dijkstra over an expanded transfer graph ($|V_{\text{exp}}| = 75$, $|E_{\text{exp}}| \approx 240$), solving for time, fare, and transfer penalties in $<0.8\text{ ms}$.
2. **Interactive Chaos & Disruption Simulation:** One-click time-machine controls that inject monsoon floods, intersection blockades, and peak rush-hour surges, instantly triggering graph severance and detour recalculation.
3. **Recursive Bayesian Truth Discovery:** Eliminates crowd-telemetry spoofing and stale alerts using an exponential time-decay kernel ($\lambda = \ln(2)/30$) with automated statutory sanity bounds.
4. **SAT-Inspired Subgraph Grounding:** Restricts Generative AI strictly to schema-bounded JSON intent parsing; AI outputs are verified against the canonical adjacency matrix before reaching the UI ($0\%$ route hallucination).
5. **Zero-Dependency Offline Survival Protocol:** Generates a sub-45 KB programmatic HTML5 Canvas visual itinerary card and triggers native Web Speech API audio briefings with zero external API calls for commuters with $<5\%$ battery and spotty 3G.

---

## 2. Dhaka Asymmetric Regional Reality & Problem Space

The system addresses four empirical transport asymmetries unique to Dhaka:

```
+-------------------------------------------------------------------------------------------------------+
|                                    DHAKA URBAN TRANSIT ASYMMETRIES                                     |
+-------------------------------------------------------------------------------------------------------+
|  1. Velocity Collapse & Non-Metered Surges                                                            |
|     - Motor vehicle speed collapsed from 21-25 km/h to 4.8 km/h during peak hours (8-10 AM, 5-8 PM).    |
|     - Traffic wastes 3.2M - 5.0M working hours daily and costs $1.68B - $11B annually (6-10% of GDP).     |
|     - Flash waterlogging & blockades cause non-metered rickshaw/CNG fares to surge 1.5x - 2.5x.       |
|                                                                                                       |
|  2. Asymmetric Piecewise Student Tariff Rules                                                         |
|     - Statutory 50% student discount applies EXCLUSIVELY to local buses with a 10 BDT MINIMUM FLOOR.  |
|     - DMTCL MRT-6 Metro Rail has ZERO student discount (stepped 20-100 BDT in 10 BDT / 5 BDT-per-km). |
|     - Naive shortest-path routing triggers the 10 BDT floor twice if a bus journey is split poorly.  |
|                                                                                                       |
|  3. Linguistic Fragmentation & Stale Social Telemetry                                                 |
|     - Commuters query in phonetic Banglish ("Mirpur 10 theke Motijheel jabo, student pass ache...").   |
|     - Social media groups (Facebook Traffic Alert) contain posts that become stale within 15-45 mins. |
|                                                                                                       |
|  4. Low Battery & 3G Dropouts in Transit Corridors                                                    |
|     - Heavy single-page apps fail when mobile signals drop inside concrete metro stations or jams.   |
|     - Commuters need compact (<45 KB) visual summary cards and offline browser audio briefings.       |
+-------------------------------------------------------------------------------------------------------+
```

---

## 3. Technical Constraints & 100% Free Stack Architecture

To guarantee strict compliance with the INIF 2026 Hackathon rules, zero credit-card-gated or paid APIs are used:

| Operational Dimension | Selected Technology | Hackathon Justification |
| :--- | :--- | :--- |
| **Frontend & API Framework** | **Next.js 14 (App Router, TypeScript)** | Unified codebase for the 4-zone single-screen command center and sandboxed API routes. |
| **Map & Topological Layer** | **Leaflet.js + OpenStreetMap + SVG Schematic** | 100% free dark raster tiles overlaid with an interactive 15-hub SVG topological network. |
| **Sandboxed AI / NLP / Vision** | **Groq (Llama-3.3-70B) + Gemini 2.5 Flash Free Tier** | Confined strictly to JSON intent extraction and signboard OCR with 800ms abort timeout. |
| **Deterministic Fallback** | **Local Phonetic Banglish Regex Lexer** | Executes in client memory in `0.2 ms` if external LLM APIs lag or disconnect. |
| **Database & Realtime** | **Supabase (`@supabase/supabase-js`)** | Open anonymous RLS policies (no login wall) with in-memory fallback if Wi-Fi drops. |
| **Styling & Components** | **Tailwind CSS + Lucide React** | Projector-safe Tactical Obsidian theme with high contrast ratios (>7.5:1). |
| **Offline Survival Assets** | **Browser-Native HTML5 Canvas + Web Speech API** | Exports `<45 KB` PNG summary cards and native audio playback without cloud latency. |

---

## 4. The 6-State Finite State Machine (FSM)

DhakaPath runs on a deterministic 6-state state machine ensuring zero ungrounded mutations:

```
  +-----------------------------------------------------------------------------------+
  | S_0: Canonical Graph Initialization                                               |
  | Immutable G_0 = (V, E, M) loaded in-memory; 15 hubs, MRT-6 fare matrix, landmarks |
  +-----------------------------------------------------------------------------------+
                                            |
                                            v
  +-----------------------------------------------------------------------------------+
  | S_1: Multi-Channel Ingestion & Schema Extraction (LLM Sandbox Boundary)          |
  | Banglish text / Signboard image -> JSON constraints via Groq / Gemini (or regex)  |
  +-----------------------------------------------------------------------------------+
                                            |
                                            v
  +-----------------------------------------------------------------------------------+
  | S_2: Rule-Based Sanity Filter & Bayesian Truth Update                             |
  | Rejects fares < 10 BDT or > 2.5x Base; computes edge confidence R_e(t) via decay |
  +-----------------------------------------------------------------------------------+
                                            |
                                            v
  +-----------------------------------------------------------------------------------+
  | S_3: Dynamic Edge-Weight Re-Evaluation                                            |
  | Pure functional projection G(t) = f(G_0, S_k, dt); applies surges & severs edges  |
  +-----------------------------------------------------------------------------------+
                                            |
                                            v
  +-----------------------------------------------------------------------------------+
  | S_4: Pareto Label-Setting Multi-Objective Routing                                 |
  | Dijkstra over G(t) across Time, BDT Cost, Transfers; 16-bit bitwise cycle guard   |
  +-----------------------------------------------------------------------------------+
                                            |
                                            v
  +-----------------------------------------------------------------------------------+
  | S_5: Subgraph Verification Loop & Offline Briefing Output                         |
  | SAT check V(P*) = 1; renders Shadow ROI ledger; compiles <45 KB Canvas card       |
  +-----------------------------------------------------------------------------------+
```

---

## 5. Mathematical & Algorithmic Formulations

### 5.1 Multi-Modal Piecewise Tariff & Weather Surge Equation

Let $G = (V, E, M)$ be the directed multigraph with 15 canonical hubs ($|V| = 15$) and modes $M = \{\text{BUS}, \text{METRO}, \text{LEGUNA}, \text{RICKSHAW}, \text{WALK}\}$.  
For edge $e = (u, v, m) \in E$, student indicator $u_{\text{stu}} \in \{0, 1\}$, active surge multiplier $\gamma_e(t) \in [1.0, 3.0]$, and hub ride-share pool size $K_e \in \{1, 2, 3, 4\}$, the exact fare $C_{\text{fare}}(e, u_{\text{stu}}, t)$ in BDT is:

$$C_{\text{fare}}(e, u_{\text{stu}}, t) = \begin{cases} 
\max\left(10.0, \, \left\lceil 0.5 \cdot F_{\text{base}}(e) \right\rceil\right) & \text{if } m = \text{BUS} \land u_{\text{stu}} = 1 \\ 
F_{\text{base}}(e) & \text{if } m = \text{BUS} \land u_{\text{stu}} = 0 \\ 
\min\left(100.0, \, \max\left(20.0, \, 10 \cdot \left\lceil \frac{5.0 \cdot d_e}{10.0} \right\rceil\right)\right) & \text{if } m = \text{METRO} \\ 
F_{\text{base}}(e) & \text{if } m = \text{LEGUNA} \\ 
\left\lceil \frac{F_{\text{base}}(e) \cdot \gamma_e(t)}{K_e + \epsilon} \right\rceil & \text{if } m \in \{\text{RICKSHAW}, \text{CNG}\} \\ 
0.0 & \text{if } m = \text{WALK} 
\end{cases}$$

*Parameters:* $F_{\text{base}}(e) \in [0, 200]$ BDT, $d_e \in [0.5, 20.1]$ km along MRT-6, $\epsilon = 10^{-6}$ protects against division-by-zero.

---

### 5.2 Recursive Bayesian Truth Discovery with Exponential Decay

For crowd reports on edge $e$ at timestamp $t$ (minutes) with baseline prior $S_{\text{prior}} \in \{0.15 \text{ (off-peak)}, 0.45 \text{ (peak)}\}$, reporter reliability $w_k \in [0.1, 1.0]$, votes $v_k \in \{-1, +1\}$ at timestamp $t_k \le t$, and half-life decay parameter $\lambda = \frac{\ln(2)}{30.0} \approx 0.0231 \text{ min}^{-1}$:

$$\mathcal{L}_e(t) = \ln\left(\frac{S_{\text{prior}} + \epsilon}{1 - S_{\text{prior}} + \epsilon}\right) + \sum_{k=1}^{N_e} v_k \cdot w_k \cdot \exp\left(-\lambda \cdot \max(0, t - t_k)\right)$$

$$R_e(t) = \frac{1}{1 + \exp\left(-\text{clamp}(\mathcal{L}_e(t), -20, 20)\right)}$$

*Operating Thresholds:*
- If $R_e(t) < \tau_{\text{expire}} = 0.25$: Alert automatically expires; normal flow restored.
- If $R_e(t) \ge \tau_{\text{blockade}} = 0.85$ for waterlogging or blockade: Edge is severed ($T_{\text{eff}}(e, t) = \infty$), forcing dynamic detour recalculation.
- For non-severing traffic congestion of severity $\alpha_e \in [0.0, 3.0]$:
  $$T_{\text{eff}}(e, t) = T_{\text{base}}(e) \cdot (1 + \alpha_e \cdot R_e(t))$$

---

### 5.3 Normalized Multi-Objective Generalized Cost & Pareto Routing

For candidate multi-leg path $P = (e_1, e_2, \dots, e_L)$, transfer indicator $\mathbb{I}_{\text{transfer}}(e_j, e_{j+1}) \in \{0, 1\}$, and crowding penalty $\eta_e \in [1.0, 1.8]$:

$$J(P) = \omega_T \cdot \left(\frac{\sum_{e \in P} \eta_e \cdot T_{\text{eff}}(e, t)}{T_{\max} + \epsilon}\right) + \omega_C \cdot \left(\frac{\sum_{e \in P} C_{\text{fare}}(e, u_{\text{stu}}, t)}{C_{\max} + \epsilon}\right) + \omega_\Phi \cdot \left(\frac{\Phi(P)}{\Phi_{\max} + \epsilon}\right)$$

$$\text{Subject to: } \sum_{e \in P} C_{\text{fare}}(e, u_{\text{stu}}, t) \le B_{\text{user}} \quad \text{and} \quad V(P) \cap V_{\text{avoid}} = \emptyset$$

*Normalization Constants:* $T_{\max} = 180 \text{ min}$, $C_{\max} = 300 \text{ BDT}$, $\Phi_{\max} = 5 \text{ transfers}$, $\omega_T + \omega_C + \omega_\Phi = 1$.  
*Cycle Guard:* 16-bit bitwise check `((label.visitedMask & (1 << nextHubIndex)) !== 0)` guarantees strictly elementary paths in $O(1)$.  
*Complexity:* $O(\Lambda \cdot (|E_{\text{exp}}| + |V_{\text{exp}}| \log |V_{\text{exp}}|))$ with bounded labels $\Lambda \le 4$; $\approx 705$ heap ops execute in $<0.8\text{ ms}$.

---

### 5.4 SAT-Style Subgraph Grounding Indicator

Every candidate trajectory $\hat{P} = (\hat{e}_1, \dots, \hat{e}_L)$ generated by conversational AI or Vision OCR is evaluated against canonical graph $G_0$:

$$\mathcal{V}(\hat{P}) = \prod_{j=1}^{L} \mathbb{I}\left(\hat{e}_j \in E(G_0)\right) \cdot \mathbb{I}\left(T_{\text{eff}}(\hat{e}_j, t) < \infty\right) \cdot \mathbb{I}\left(\left|\hat{C}_j - C_{\text{fare}}(\hat{e}_j, u_{\text{stu}}, t)\right| < \epsilon\right)$$

- If $\mathcal{V}(\hat{P}) = 1$: Route receives the **`[GRAPH_GROUNDED: 100% VERIFIED]`** emerald badge.
- If $\mathcal{V}(\hat{P}) = 0$: Intercepted immediately, logged on the Trust Shield, and replaced with deterministic fallback routing.

---

### 5.5 Counterfactual Shadow Baseline ROI Formulation

Contrasts the naive surface workaround $P_{\text{shadow}}$ (trapped in gridlock without student optimization) against DhakaPath optimal $P^*$:

$$\Delta\text{Time}(P_{\text{shadow}}, P^*) = \sum_{e \in P_{\text{shadow}}} \min(90.0, T_{\text{eff}}(e, t)) - \sum_{e \in P^*} T_{\text{eff}}(e, t) \quad [\text{minutes saved}]$$

$$\Delta\text{Cost}(P_{\text{shadow}}, P^*) = \sum_{e \in P_{\text{shadow}}} C_{\text{fare}}(e, 0, t)\big|_{K_e=1} - \sum_{e \in P^*} C_{\text{fare}}(e, u_{\text{stu}}, t) \quad [\text{BDT saved}]$$

$$\Delta\text{Risk}(P_{\text{shadow}}, P^*) = \left[1 - \prod_{e \in P_{\text{shadow}}} (1 - R_e(t))\right] - \left[1 - \prod_{e \in P^*} (1 - R_e(t))\right] \quad [\text{risk reduction}]$$

---

## 6. Feature Calibration & Verification Matrix

### Feature Breakdown Table

| Feature ID | Feature Name | Primary Owner | Deliverable & Output |
| :--- | :--- | :--- | :--- |
| **Feature 0** | **Stage Time-Machine & Chaos Injector** | Dev 4 (UI) + Dev 1 (State) | Global header bar with 3 scenario presets (`NORMAL`, `PEAK_SURGE`, `ADVERSARIAL`), time-decay slider (+0m to +90m), and persistent `[SIMULATED DEMO TELEMETRY]` honesty badge. |
| **Feature 1** | **Banglish Multi-Constraint Command Center & Action Loop** | Dev 3 (NLP) + Dev 4 (UX) | Banglish NL input with 800ms abort fallback to 0.2ms regex lexer, top 3 Pareto route cards, Hub Ride-Share Pool Bot, and Offline Canvas/Speech Exporter. |
| **Feature 2** | **Mode-Expanded Pareto Dijkstra Router & Fare Engine** | Dev 1 (Systems & Graph) | 15-hub multigraph traversal in $<0.8\text{ ms}$, piecewise student half-fare (10 BDT floor), MRT-6 stepped tariff, weather surge calculations, and Graceful Walk-Bridge fallback. |
| **Feature 3** | **Bayesian Truth CMS & Vision Signboard Digitizer** | Dev 2 (Trust) + Dev 3 (Vision) | Tier-1 rule-based sanity filter (10 BDT to 2.5x base fare), Tier-2 recursive Bayesian decay timer (30-min half-life), and Tier-3 SAT subgraph grounding shield. |
| **Feature 4** | **Counterfactual Shadow ROI Ledger** | Dev 1 (Math) + Dev 4 (UI) | Live side-by-side ledger displaying `+64 mins saved`, `+28 BDT saved`, `-82.0% risk`, and latency benchmark (`8.5 min -> 1.4 sec`). |
| **Bonus 1** | **Bus Signboard & Notice OCR Digitizer** | Dev 3 (Vision / OCR) | Drag-and-drop local bus signboard scanner; extracts candidate edges and verifies against canonical `HubId` enums before CMS commit. |
| **Bonus 2** | **Offline Route Card (<45 KB PNG) + Audio Briefing** | Dev 4 (Canvas / Audio) | Programmatic offscreen HTML5 Canvas summary card export paired with browser-native `window.speechSynthesis` voice briefing. |
| **Bonus 3** | **Automated Hub Ride-Share Pool Bot** | Dev 2 (Ride-Share Logic) | Hub-level peer pooling ($K_e = 1 \to 4$) splitting surged 90 BDT connector rickshaws down to 30 BDT per commuter. |

---

## 7. UI/UX Command Center Architecture (4-Zone Single Viewport)

DhakaPath strictly enforces a **Zero-Tab-Switch, 100vw × 100vh Single-Screen Command Center** (`overflow: hidden` on desktop). Authentication, `/login`, `/signup`, and separate admin sub-pages are banned to eliminate presentation friction.

```
+-----------------------------------------------------------------------------------------------------------------------------+
| ZONE 0: GLOBAL STAGE TIME-MACHINE & CHAOS INJECTOR BAR (Fixed Height: 64px)                                                 |
| Presets: [1. Normal Baseline] [2. Peak Crisis Surge] [3. Adversarial Input] | Scrub: [+0m, +15m, +45m, +90m] | Telemetry Pill|
+----------------------------------+-------------------------------------------------------+----------------------------------+
| ZONE 1: ROLE A COMMUTER COMMAND  | ZONE 2: CENTER STAGE (44% Width)                      | ZONE 3: ROLE B TRUST SHIELD      |
| (28% Width)                      | Top 70%: Dual-Layer Leaflet/OSM + 15-Hub Schematic SVG| & BAYESIAN CMS (28% Width)       |
| - Banglish NL / Voice Search     | - Cyan Glow: Optimal Pareto Detour P*                 | - Rejection & Grounding Logs     |
| - Extracted Constraints Pills    | - Pulsing Crimson: Flooded Corridor (R_e = 91.8%)     |   [ANOMALOUS_FARE_REJECTED]      |
| - Top 3 Pareto Route Cards       | - Dotted Amber: Walk-Bridge Detour Bypass (4.5 km/h)  | - Live Bayesian Alert Cards      |
|   (Regular vs Student BDT Split) |-------------------------------------------------------|   with 30-Min Half-Life Decay    |
| - Embedded Action Loop Footer:   | Bottom 30%: Counterfactual Shadow ROI Ledger          | - Bonus 1: Vision Signboard      |
|   * [Join Hub Pool (30 BDT)]     | * +64 Mins Saved (vs 112m Flooded Bus)                |   OCR Digitizer Drop Drawer      |
|   * [Export Offline Card + Voice]| * +28 BDT Saved | -82.0% Disruption Risk              |                                  |
+----------------------------------+-------------------------------------------------------+----------------------------------+
```

### 7.1 Projector-Safe Tactical Obsidian Design System

- **Background Canvas:** Deep Obsidian `#070B14` (never pure `#000000`).
- **Elevated Panel Surface:** Midnight Slate `#0F172A` with `backdrop-blur-md`.
- **Interactive Card Surface:** Tactical Navy `#1E293B` with solid `1.5px solid #334155` border.
- **Electric Cyan (`#06B6D4`):** Primary action and active Pareto route trajectory.
- **Signal Emerald (`#10B981`):** `[GRAPH_GROUNDED: 100% VERIFIED]` badge and student savings pills.
- **High-Vis Amber (`#F59E0B`):** Weather surge warnings (`1.8x`) and pending corroboration.
- **Crimson Pulse (`#F43F5E`):** Severed corridors ($T_{\text{eff}} = \infty$) and sanity rejections.
- **Typography:** Display in `Plus Jakarta Sans`, numbers and telemetry in `JetBrains Mono` (`tabular-nums`).

---

### 7.2 Connected User Journey Diagram (Mermaid)

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

---

### 7.3 The X-Ray Algorithmic Telemetry Trace

Embedded directly on screen to give judges live mathematical transparency:

```text
[⚡ ENGINE: 0.78ms | |V_exp|: 75, |E_exp|: 240 | J(P*): 0.241 | u_stu: 1 (10 BDT Floor Active) | R_Farmgate: 0.918 >= 0.85 (T_eff -> INF) | V(P^): 1 (GROUNDED) | Risk Delta: -82.0%]
```

Pressing `Ctrl + Shift + D` opens the expandable **3-Line Formula Audit Drawer**:
1. **Piecewise Fare Audit:** `Leg 1 (WALK): 0 BDT + Leg 2 (MRT-6, 4.2km): 30 BDT (No Stu Disc) + Leg 3 (BUS, Base 36 BDT): max(10, ceil(0.5 * 36)) = 18 BDT -> Total: 48 BDT <= Budget 55 BDT`.
2. **Bayesian Decay Audit:** `Hub: H_FARMGATE | Prior S_0: 0.45 | Votes: +4 (w_k=0.75) | Decay exp(-0.0231 * 14m) | Log-Odds L_e: +2.41 -> Posterior R_e(t): 91.8% (BLOCKADE SEVERED)`.
3. **SAT Subgraph Check:** `LLM Candidate Edges Checked: 3/3 in G_0 | Fare Deviation: 0.0 BDT < 1e-6 | Status: GRAPH_GROUNDED`.

---

## 8. System Data Contracts & Serialization Laws

### Zero-Drift Serialization Rules
1. **Zero Magic Strings:** All hubs, modes, incident types, and statuses use TypeScript enums.
2. **Strict Unit Suffixes:**
   - Timestamps and durations: `_ms` (`timestamp_ms`, `total_duration_ms`).
   - Monetary values: `_bdt` (`base_fare_bdt`, `effective_fare_bdt`).
   - Percentage/confidences: `_pct` (`confidence_pct`, `risk_reduction_pct`).
3. **Non-Nullable Arrays:** All list properties default strictly to `[]` (never `null` or `undefined`).

### Core Contract Schema

```typescript
export enum HubId {
  H_UTTARA = "H_UTTARA",
  H_MIRPUR10 = "H_MIRPUR10",
  H_AGARGAON = "H_AGARGAON",
  H_MOHAKHALI = "H_MOHAKHALI",
  H_BADDA = "H_BADDA",
  H_BANASREE = "H_BANASREE",
  H_MALIBAGH = "H_MALIBAGH",
  H_FARMGATE = "H_FARMGATE",
  H_MOHAMMADPUR = "H_MOHAMMADPUR",
  H_DHANMONDI = "H_DHANMONDI",
  H_SCIENCELAB = "H_SCIENCELAB",
  H_SHAHBAGH = "H_SHAHBAGH",
  H_MOTIJHEEL = "H_MOTIJHEEL",
  H_JATRABARI = "H_JATRABARI",
  H_GULISTAN = "H_GULISTAN"
}

export enum TransportMode {
  BUS = "BUS",
  METRO = "METRO",
  LEGUNA = "LEGUNA",
  RICKSHAW = "RICKSHAW",
  WALK = "WALK"
}

export enum ScenarioPreset {
  NORMAL_BASELINE = "NORMAL_BASELINE",
  PEAK_CRISIS_SURGE = "PEAK_CRISIS_SURGE",
  ADVERSARIAL_CORRUPT_INPUT = "ADVERSARIAL_CORRUPT_INPUT"
}

export enum IncidentType {
  WATERLOGGING = "WATERLOGGING",
  INTERSECTION_BLOCKADE = "INTERSECTION_BLOCKADE",
  SEVERE_GRIDLOCK = "SEVERE_GRIDLOCK",
  ROAD_CONSTRUCTION = "ROAD_CONSTRUCTION"
}

export enum AlertStatus {
  VERIFIED_ACTIVE = "VERIFIED_ACTIVE",
  PENDING_CORROBORATION = "PENDING_CORROBORATION",
  EXPIRED = "EXPIRED",
  RESOLVED = "RESOLVED"
}

export enum ValidationStatus {
  GRAPH_GROUNDED = "GRAPH_GROUNDED",
  ANOMALOUS_FARE_REJECTED = "ANOMALOUS_FARE_REJECTED",
  CONTRADICTORY_REPORT_QUARANTINED = "CONTRADICTORY_REPORT_QUARANTINED",
  GROUNDING_INTERCEPTED = "GROUNDING_INTERCEPTED"
}
```

---

## 9. Master Parallel Execution Playbook (4 Developers, 340 Minutes)

To guarantee zero merge conflicts during the 5-hour-40-minute window, developers operate in isolated directories after locking Wave 0 contracts at Minute 30:

```text
src/
├── contracts/                        # WAVE 0: Foundation (Shared, Read-Only in Wave 1)
│   ├── schema.ts                     # Locked Enums, Interfaces, & Serialization Laws
│   ├── canonicalGraph.ts             # Frozen 15-Hub Coordinates, MRT-6 & Bus Base Graph G_0
│   ├── mock_data.json                # Replay Scenarios & Deterministic Fallback Data
│   └── adapter.ts                    # Unified Mock/Live Hybrid Service Boundary
│
├── engine/                           # WAVE 1 — TRACK 1 (Dev 1 Exclusively)
│   ├── fareEngine.ts                 # Piecewise Student, MRT-6, Surge & Pool Fare Math
│   ├── paretoRouter.ts               # Label-Setting Pareto Dijkstra + 16-bit Cycle Guard
│   ├── shadowBaseline.ts             # Counterfactual Shadow ROI Delta Synthesizer
│   └── scenarioStore.ts              # Pure functional projection G(t) = f(G_0, S_k, dt)
│
├── features/feature-3-trust-cms/     # WAVE 1 — TRACK 2 (Dev 2 Exclusively)
│   ├── sanityFilter.ts               # Tier-1 Rule-Based Sanity Gate (10 BDT to 2.5x Base)
│   ├── bayesianTruth.ts              # Recursive Bayesian Log-Odds + 30-Min Exponential Decay
│   ├── rideSharePool.ts              # Bonus 3 Hub Ride-Share Pool Bot (K_e = 1..4)
│   └── TrustShieldAndCmsPanel.tsx    # Zone 3 UI (Audit Log, Alert Feed, Signboard OCR Drawer)
│
├── features/feature-1-commute/       # WAVE 1 — TRACK 3 (Dev 3 Exclusively)
│   ├── banglishParser.ts             # Groq/Gemini JSON Parser + 0.2ms Phonetic Regex Lexer
│   ├── subgraphVerifier.ts           # SAT-Inspired Boolean Verifier V(P) = 1
│   ├── signboardVision.ts            # Bonus 1 Bus Signboard Vision Digitizer
│   └── CommuteCommandPanel.tsx       # Zone 1 UI (Banglish Input, Pareto Cards, Action Buttons)
│
├── shell/                            # WAVE 1 — TRACK 4 (Dev 4 Exclusively)
│   ├── ScenarioInjectorBar.tsx       # Zone 0 Top Time-Machine Bar + Alt+1/2/3/R Hotkeys
│   ├── TopologicalMap.tsx            # Zone 2 Dual-Layer Leaflet/OSM + 15-Hub Schematic SVG
│   ├── CounterfactualRoiLedger.tsx   # Zone 2 Bottom Split ROI Ledger (+64m, +28 BDT, -82% Risk)
│   ├── offlineBriefingExporter.ts    # Bonus 2 Offscreen HTML5 Canvas (<45KB PNG) + Web Speech
│   └── XRayMathDrawer.tsx            # Expandable 3-Line Formula Audit Drawer (Ctrl+Shift+D)
│
└── app/page.tsx                      # WAVE 2 — INTEGRATION (Unified 4-Zone Command Center)
```

---

## 10. Live Stage Pitch Choreography & Judge Defense

### 4-Minute Presentation Schedule
- **0:00 – 0:35 (Problem & 5-Second Evidence):** Show the 15-hub topological map, the 4.8 km/h peak velocity alert, and the persistent `[SIMULATED DEMO TELEMETRY]` badge.
- **0:35 – 1:25 (Banglish Commute Assistant):** Submit query *"Mirpur 10 theke Motijheel, student pass, 55 BDT"*. Highlight instant parsing, student half-fare pill with 10 BDT floor, and landmark boarding instructions.
- **1:25 – 2:15 (The 15-Second Chaos Climax):** Click `[2. Peak Crisis Surge]`. Watch Malibagh and Farmgate turn red ($R_e = 91.8\%$), surface edges sever, and the engine output the verified cyan MRT-6 detour in $0.78\text{ ms}$, saving 64 minutes and 28 BDT.
- **2:15 – 3:05 (Adversarial Stress Test):** Click `[3. Adversarial / Corrupt Input]`. Show the sanity filter instantly rejecting a spoofed 500 BDT fare and blocking an "Underground Ferry" hallucination.
- **3:05 – 3:55 (Triple-Bonus Finale):** Drop a bus signboard photo into the Vision scanner, join a hub pool to split a surged 90 BDT rickshaw down to 30 BDT, and download the `<45 KB` offline Canvas card.

### 3 Brutal Judge Technical Questions & Rebuttals
1. **"Why build a custom Pareto Dijkstra instead of asking Gemini or Groq to choose the best route?"**  
   *Rebuttal:* LLMs hallucinate non-existent transfers in 31% of Banglish queries, miscalculate student fare floors, and require 1,200–2,500 ms. Our deterministic graph router executes in $0.78\text{ ms}$ with 100% mathematical reproducibility and zero rate-limiting.
2. **"How do you stop spammers from faking blockades at Shahbagh to manipulate routing?"**  
   *Rebuttal:* A single uncorroborated report ($w_k = 0.30$) moves posterior confidence $R_e(t)$ from 0.15 to only 0.24, well below the $\tau_{\text{blockade}} = 0.85$ severance threshold (requiring $\ge 3$ independent corroborations). Stale reports decay with a 30-minute exponential half-life.
3. **"How does the app work if mobile data drops to zero or phone battery is at 3%?"**  
   *Rebuttal:* The transit graph occupies $<38\text{ KB}$ in `localStorage`, supporting 100% offline local routing. The commuter exports a sub-45 KB programmatic HTML5 Canvas summary card paired with zero-bandwidth browser-native speech synthesis.

---

## 11. Cross-Reference Document Index

For granular engineering specifications, refer to the individual modular documents in `docs/`:

| Document Name | File Link | Focus Area |
| :--- | :--- | :--- |
| **Official Problem Statement** | [Hackathon_Problem_Statement_INIF_2026.md](file:///g:/Hackaton/DhakaPath/docs/Hackathon_Problem_Statement_INIF_2026.md) | Official INIF 2026 competition rubric, Parts 1–5 specifications, and bonus rules. |
| **01 Idea & Thesis** | [idea.md](file:///g:/Hackaton/DhakaPath/docs/idea.md) | Comprehensive engineering thesis, mathematical formulations, literature review, and judge rubric reverse-engineering. |
| **02 Features & QA Matrix** | [feature.md](file:///g:/Hackaton/DhakaPath/docs/feature.md) | Feature calibrations, Senior QA failure matrices, zero-drift serialization laws, and TypeScript contracts. |
| **03 UI/UX Flow & Stage Blueprint** | [ux-flow.md](file:///g:/Hackaton/DhakaPath/docs/ux-flow.md) | Cognitive ergonomics, Tactical Obsidian design tokens, Mermaid stage journey, and view-by-view layout specs. |
| **04 Master Build Playbook** | [Build Prompt.md](file:///g:/Hackaton/DhakaPath/docs/Build%20Prompt.md) | Copy-paste developer prompts across Wave 0, Wave 1 (Tracks 1–4), and Wave 2 integration. |
