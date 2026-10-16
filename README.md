# DhakaPath — live urban transit & route intelligence for Dhaka

IAIT National IT Fest (INIF) 2026 · Smart City hackathon · 100% free stack (Next.js, Leaflet + OpenStreetMap, Supabase free tier, Groq/Gemini free tiers, browser Web Speech + Canvas).

## The 30-second story

Every morning in Dhaka, millions of students and office workers play a guessing game just to cross the city. Google Maps does not know which local bus accepts a ten-taka student half-pass, how much a rickshaw surges when Malibagh floods, or when a sudden blockade shuts down Shahbagh. Commuters scroll through outdated Facebook posts and end up stranded or overpaying. DhakaPath fixes this. A commuter simply asks in Banglish how to reach Motijheel under fifty taka. The platform checks crowd-verified street alerts, filters out fake reports, and calculates the exact multi-leg route across buses, the Metro Rail, and shared rickshaws, and can export an offline route card when phone battery or internet dies.

## What is built (mapped to the problem statement)

| Problem-statement part | Where it lives in the app |
| --- | --- |
| **1. Transit & street-status CMS** | **Network** tab: 15 hubs with live status, every link with mode, fare (student vs regular), duration and boarding landmark; admin form to add a link; signboard scanner. **Live alerts** tab: browse, report, confirm and clear street incidents. |
| **2. Multi-constraint trip search** | **Plan trip** tab: Banglish / Bangla / English request (typed or spoken), budget, student pass and avoid-hub constraints, multi-leg results ranked by cost, time and transfers, with boarding landmarks for each leg. |
| **3. Dynamic fares & disruption rerouting** | Statutory fare engine (bus 50% student with a 10 BDT floor, metro with no discount, rickshaw/CNG baseline-to-surge range). Scenario simulator: normal day, peak crisis, fake-input test, plus a time-machine clock. Broken segments are detected and a detour with updated time and cost is returned. |
| **4. Validation & grounding** | Route grounding verifier (every leg checked against the graph and recomputed against the fare engine), Bayesian crowd corroboration with a 30-minute half-life, rule-based fare and contradiction checks. All blocked items appear in the **Safety log**. |
| **Bonus 1** | Signboard / fare-chart scanner: photo upload or drag-drop (Gemini vision), preset fixtures, or typed text. Candidate edges are verified, then committed to the live graph or discarded. |
| **Bonus 2** | Offline route card (a PNG under 45 KB, drawn on an offscreen canvas) plus a spoken briefing with an on-screen transcript. |
| **Bonus 3** | Ride-share board: commuters at a hub pool a rickshaw, the bot shows the per-person split, joining is idempotent. |

Part 5 (the conversational chat assistant) is intentionally **not** included in this build.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000   (landing)   and   /app   (the product)
npm run build && npm start
```

Create `.env.local` (every key is optional; the app degrades gracefully without them):

```env
NEXT_PUBLIC_SUPABASE_URL=...           # alerts, logs and pools are written through to Supabase when set
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GROQ_API_KEY=...                       # online Banglish parsing (800 ms timeout, then local lexer)
GEMINI_API_KEY=...                     # signboard photo transcription
```

The SQL for the four tables with open anonymous RLS is in `supabase/migrations/0001_dhakapath_core.sql`.

**Keyboard shortcuts:** `Alt+1/2/3` switch scenario, `Alt+R` reset, `Ctrl+Shift+D` show the math. Bangla / English can be switched from the header on every screen.

## Architecture

```
src/
├── app/
│   ├── page.tsx              landing page (Pathao-style, light + green)
│   ├── app/page.tsx          the product: three tabs sharing one simulator and one store
│   └── api/                  route handlers (track-1..4): engine, Supabase write-through, LLM/vision sandbox
├── ui/                       presentation only: plan/, alerts/, network/, map/, shared kit
├── store/useDhakaPathStore   the single source of truth (state in, everything else derived)
├── engine/                   fareEngine, paretoRouter, shadowBaseline, scenarioStore, graphExtensions
├── features/
│   ├── feature-1-commute/    banglishParser, subgraphVerifier, signboardVision
│   └── feature-3-trust-cms/  sanityFilter, bayesianTruth, rideSharePool
├── contracts/                locked schema + the frozen 15-hub graph G_0
└── lib/                      i18n (BN/EN), offline card + voice, Supabase client, utils
```

Design rule: **the UI never calculates anything.** The store holds crowd alerts, the simulated clock, the scenario, the query, pools and graph extensions; alerts, routes, ROI and severed hubs are *derived* from them through the engine, so a vote, a slider scrub or a scenario change updates the map, the cards and the safety log together.

```mermaid
graph TD
  Q[Banglish query / chip / voice] --> P{Groq within 800 ms?}
  P -- yes --> J[strict JSON intent]
  P -- timeout or no key --> L[local phonetic lexer ~0.2 ms]
  L --> J
  J --> R[Pareto label-setting search over G(t)]
  A[crowd votes + sim clock] --> B[Bayesian decay -> alerts] --> R
  R --> V[grounding verifier V = 1]
  V -- fail --> X[blocked and logged]
  V -- pass --> C[route cards + map + ROI vs shadow baseline]
  C --> O[offline card + voice briefing]
```

### The six-state flow

| State | What happens |
| --- | --- |
| S0 Graph load | The frozen 15-hub graph, MRT-6 fare table, bus rate and landmarks are loaded. Extensions (admin / signboard) are layered on top, never mutating G_0. |
| S1 Ingestion | Scenario toggles, Banglish text, voice or a signboard photo. The model only extracts JSON or text. |
| S2 Sanity + truth | Fares under 10 or over 2.5x base are rejected; single-user resolutions against a confirmed alert are quarantined; confidence is updated with log-odds and decay. |
| S3 Re-evaluation | `G(t) = f(G_0, alerts, delta_t)`: surge applied, student fares applied, edges severed at confidence >= 85% for waterlogging and blockades. |
| S4 Search | Multi-criteria label-setting Dijkstra with a 16-bit visited mask; automatic walk-bridge fallback when every vehicle route is cut. |
| S5 Verify + brief | Every leg is re-checked, savings versus the naive route are computed, and the offline card is produced. |

## The math (no LLM arithmetic anywhere)

- **Fare.** Bus: `ceil(0.5 x official)` for eligible students, where official = `max(10, round(2.70 x km))`. Metro: official station-pair table, never discounted; consecutive metro legs pay the incremental fare from the boarding station. Rickshaw / CNG: `ceil(base x surge / pool)` with surge in [1, 3] and pool in [1, 4]. Walk: 0.
- **Crowd truth.** `L_e(t) = ln(p/(1-p)) + sum(v_k w_k e^(-lambda (t - t_k)))`, `lambda = ln 2 / 30 min`, `R_e = 1/(1 + e^(-L_e))`. At 85% a blockade severs surface edges; below 25%, or with no positive vote for an hour, the alert expires. The prior is 0.45 in a peak crisis and 0.15 otherwise.
- **Generalised cost.** `J(P) = 0.45 d/(180 min) + 0.40 c/(300 BDT) + 0.15 k/5`, with up to four non-dominated labels kept per state.
- **Grounding.** `V(P) = prod I(e_j in E) I(T_eff < inf) I(|C_j - C_fare(e_j)| < 1e-6)`. The fare is recomputed independently from the fare engine; a route that fails is stripped before it can be shown.
- **ROI.** The naive surface route (no avoidance, no student pass, solo rickshaw, severed segments clamped to a 112-minute stall) is compared with the verified route for time, fare and blockade risk.

## AI components and how they are fenced in

- **Banglish parser:** Groq (free tier) extracts JSON under an 800 ms abort; the deterministic phonetic lexer always runs as the baseline and as the fallback. Hallucination traps ("underground ferry", "submarine") are detected before routing.
- **Vision OCR:** Gemini 2.5 Flash (free tier) only transcribes a photo into `Origin -> Destination : fare` lines. The deterministic digitizer then parses those lines, resolves hub names fuzzily, and the grounding check decides what may enter the graph.
- The model never computes a fare, ranks a route, or touches the graph directly.

## Offline survival

Maps fall back automatically to a 15-hub schematic when tiles cannot load. The route card is drawn from vector text only (no external images, so the canvas never taints) and is snapped to a flat palette so it stays under 45 KB; the briefing uses the browser's speech synthesis and always prints its transcript.

## 4-minute stage script

1. **0:00 - 0:35** Landing, then the app: the speed chip, the map, the honesty badge.
2. **0:35 - 1:25** Tap the Mirpur 10 to Motijheel example: student pass, 55 BDT, avoid Farmgate.
3. **1:25 - 2:15** `Alt+2` peak crisis: Farmgate and Malibagh close, the detour lights up, the ROI flips.
4. **2:15 - 3:05** `Alt+3` fake-input test: the 500 BDT fare and the underground ferry are blocked in the Safety log; scrub the time machine to +90 min and watch alerts expire.
5. **3:05 - 3:55** Network tab: scan a signboard and commit it; Plan tab: join the ride-share pool (3/4, 30 BDT each) and export the offline card with audio.

**Likely judge questions.** *Why not just an LLM?* Search runs in about 1 ms with zero invented legs, and the model is only a parser. *What stops spam alerts?* A single low-weight report moves the posterior from 0.15 to about 24%, far below the 85% blockade line, and it needs three corroborations. *What if the network dies?* The map, the router, the card and the voice all run locally.

## Honest limits

All telemetry in the demo is simulated and labelled as such on every screen. Supabase is written to but not read back, so the demo stays deterministic. Photo transcription needs a Gemini key and a connection; presets and typed text work offline.


## Update — conversational assistant, admin console, PWA

- **Ask DhakaPath (Part 5):** a floating multi-turn assistant on every screen (bottom-right, or Ctrl+/). It understands Banglish/Bangla/English, plans routes, submits street reports through conversation, answers fare and reliability follow-ups, and keeps context. Replies are grounded by the same engine; LaTeX/markdown is rendered as clean text.
- **Admin console (`/admin`):** passcode-gated (`NEXT_PUBLIC_ADMIN_PASSCODE`, default `dhakapath2026`). Admins manage the transit network (add/remove links, signboard digitiser) and moderate alerts (confirm/clear/override), fare sanity, and the safety log. The public `/app` stays anonymous.
- **PWA / offline:** installable (`manifest.webmanifest`) with a service worker that precaches the shell and serves it offline; the map falls back to the 15-hub schematic when tiles can't load.
- **Current location:** "My location" uses the browser geolocation API to pick the nearest hub as the origin.
- **LLM fallback chain:** Groq → OpenRouter (`OPENROUTER_API_KEY`, free model) → deterministic lexer, so parsing degrades gracefully.
- **Fares:** the statutory 10 BDT student bus floor is enforced (`max(10, ceil(0.5 × fare))`); duplicate routes are collapsed by leg/metric signature.
