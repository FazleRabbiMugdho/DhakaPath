# DhakaPath — 5:00 Demo Video Script & Shot List

> Goal: a judge who has never seen Dhaka should understand, in 5 minutes:
> 1. the Dhaka-specific problem, 2. the working multi-constraint search,
> 3. the trust layer (statutory fares, crowd truth, grounding), 4. the offline/bonus features,
> and 5. that the telemetry is simulated and the math is deterministic.
>
> Golden rule: **show, don't tell.** One action every 5–8 seconds. Pause 2 seconds after every
> state change so the viewer's eye catches up. Say one idea per sentence. Never read the UI.
>
> **If you only read one page:** §2 is the 5:00 shot list. **If a judge asks "can you show X?"**
> use §12 (every feature → exact click path) and §13 (micro-demo scripts for the controls that do
> not fit in the main take). §14 is a 6:30 extended feature tour you can record separately.

---

## 1. Before you record (30-minute checklist)

### 1.1 Clean build (important)

The repo may have an old `.next` cache from months ago. A stale cache can show old fares
(for example a 55 BDT route instead of the current 32 BDT route), which will make your
narration wrong. Do a clean build:

```powershell
# stop any old dev servers first (close their terminals)
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm start          # http://localhost:3000
```

If port 3000 is busy, Next prints another port — use the URL it prints. Do not record the
URL bar; nobody needs to see `localhost`.

`.env.local` is optional. Without keys the deterministic local lexer runs (`Local lexer · 0.0 ms`)
and the signboard presets still work. That is a feature, not a failure: say "the offline
fallback is the baseline, the LLM is only an accelerator."

### 1.2 Browser setup

- Chrome or Edge, **English UI**: open `/app`, click the **English** button in the top-right
  header (it says `English` while the app is in Bangla). The choice is saved in localStorage
  and applies to the landing page, `/app` and `/admin`.
- Press **F11** (full screen), hide the bookmarks bar (`Ctrl+Shift+B`), close all other tabs.
- Browser zoom **110%** (`Ctrl` + `+` once). 125% also works but crowds the header.
- Close Slack/Discord/WhatsApp, enable Focus Assist / Do Not Disturb, disable the screensaver.
- Pre-open these tabs in this order:
  1. `http://localhost:3000/` (landing)
  2. `http://localhost:3000/app` (product)
  3. `http://localhost:3000/admin` (optional insert; enter the passcode `dhakapath2026` once
     and leave the tab unlocked)
- Load `/app` once and let the OpenStreetMap tiles finish before you start. Tiles are cached,
  so the recorded load will be quick.

### 1.3 Recording setup (OBS Studio)

- Canvas and output: **1920×1080, 30 fps**.
- Source: **Display Capture** (or Window Capture of the browser).
- Encoder: x264, **CRF 18–20** (or CBR 6000–8000 kbps). Record to **MKV**, remux to MP4 later.
- Audio: microphone at 48 kHz, AAC 160 kbps. Test 20 seconds and listen on headphones.
- Show the mouse cursor. Move it slowly and deliberately; do not circle or waggle it.
- Optional: a click highlight tool. If not, a small pause after each click is enough.

### 1.4 Rehearse the numbers

The current build (English, normal scenario) shows:

| Thing | Value |
|---|---|
| Graph | 15 hubs · 37 links |
| Main route | **32 BDT** student (43 BDT regular), **48 min**, 1 transfer, 3 legs |
| Metro leg | 20 BDT, no student discount |
| Bus leg | 12 BDT student (50% off, 10 BDT floor) |
| Peak crisis | 4.8 km/h, surge ×1.8, Farmgate + Malibagh severed |
| ROI in peak crisis | about **+64 min**, +5 BDT, −100% blockade risk |
| Alert confidence | Farmgate ~70.6%, Malibagh ~64.0% — "needs confirmation" |
| Single Shahbagh report | ~19.2%, far below the 85% severance line |
| Fake fare | 500 BDT rejected; allowed 10–62.5 BDT; 0.04 ms |
| Offline card | ~37.3 KB PNG + voice transcript |

**If your screen shows a different number, say the number on your screen.** Do not recite a
number you have not verified in the current build.

---

## 2. The 5:00 timeline (the one-page shot list)

| Clock | You do (exact) | On screen | Say (cue) |
|---|---|---|---|
| 0:00–0:15 | Do nothing. Move the cursor slowly from the headline to the phone mock. | Landing hero: "Dhaka's routes, one app, one answer." | The Dhaka problem + student fare + surge + blockade |
| 0:15–0:20 | Click **See the Live Command Center**. | Landing → `/app`, map loads | "One tap, no login." |
| 0:20–0:32 | Hover the scenario bar, then the three tabs, then the top strip. | 14.5 km/h · Surge ×1.0 · 0.20 ms; Simulated Demo Telemetry | "One graph, three tabs, and an honest label." |
| 0:32–0:44 | Click **Uttara → Shahbagh · fastest** (optional proof it is live), then **Mirpur10 → Motijheel · student · 55 BDT**. | Map redraws, fare changes, then returns | "This is live, not a mock." |
| 0:44–0:50 | Click **Find verified routes**. Pause. | Button runs; "What I understood" pills update | "Banglish in, constraints out." |
| 0:50–1:20 | Click the route card once if the legs are not visible. Move down the 3 legs. | From/To/Student/Budget/Avoid; 32 BDT; 48 min; walk → metro 20 → bus 12; boarding landmarks; V(P*)=1 | Student math + every leg verified |
| 1:20–1:25 | Press **Alt+2**. | Scenario flips to Peak crisis | "Now the city breaks." |
| 1:25–1:45 | Pause. Point at the red pill, the two red circles, then the new route. | "Farmgate & Malibagh blocked — showing the detour"; 4.8 km/h, surge ×1.8 | The detour is automatic |
| 1:45–2:00 | Move to the ROI strip. | +64 min · +5 BDT · −100% risk; "112 min stuck → 48 min DhakaPath" | Quantify the save |
| 2:00–2:05 | Press **Alt+3**. | Scenario flips to Fake-input test | "Now attack it." |
| 2:05–2:20 | Click **Trap: underground ferry**. Wait. Scroll one notch if needed. | Red banner: "That route does not exist — blocked"; `GROUNDING_INTERCEPTED` | The invented leg is refused |
| 2:20–2:35 | Click **Live alerts**. Scroll to the **Safety log**. | 500 BDT → `ANOMALOUS_FARE_REJECTED` (allowed 10–62.5, 0.04 ms); `UNDERGROUND_FERRY` blocked (0.00 ms) | Both attacks stopped, with timings |
| 2:35–2:50 | Point at Farmgate 70.6% and Malibagh 64.0%; then click **Test: one uncorroborated Shahbagh report**. | New Shahbagh card ~19.2%; log "graph untouched" | One report cannot reroute the city |
| 2:50–3:05 | Press **Ctrl+Shift+D**. Point at the 3 lines. Press **Esc**. | Piecewise fare · Bayesian decay · grounding check | "Here is the math." |
| 3:05–3:20 | Click **Network**. Point at the subtitle and two rows (one bus, one metro). | 15 hubs · 37 links; bus regular/student; metro "no discount" | CMS + statutory fares |
| 3:20–3:30 | Click **Plan trip**. Click the route card to expand it. | Route legs + ride-share board | "Back to the trip." |
| 3:30–3:40 | In the ride-share board click **Join pool (2/4 → 3/4) · lock split**. Pause. | Pool fills; per-person fare drops; bot line "split by 4, each pays 13 BDT" | Pooling cuts the last-mile fare |
| 3:40–3:55 | Click **Offline card (<45 KB) + audio**. Wait for the modal. | 37.3 KB; PNG card; audio transcript | The survival kit |
| 3:55–4:05 | Click **Play again** (let 2 seconds of speech play). Point at the transcript. | Voice + printed transcript | Works with no internet |
| 4:05–4:15 | Close the modal (X). | Back to Plan | — |
| 4:15–4:30 | Hold on the app. Mention the **Ask** button (don't open it) and the admin console. | The grounded product | Part 5 is the same engine |
| 4:30–4:45 | Closing lines. Optional end card. | Logo / GitHub | "Thank you." |
| 4:45–5:00 | Hold. Stop recording. | — | — |

> If you are running long, cut in this order: the Network tour (3:05–3:20), the Uttara/Shahbagh
> proof (0:32–0:44), then the pool (keep the offline card). Never cut the core query, the peak
> crisis, the grounding block, or the offline card.

**Micro-actions that fit without changing the clock (add only if smooth):**

- At **0:50**, after expanding the top card, click the **Lowest fare** card once if it is visible,
  say "Pareto trade-off", then click the first card again. Costs ~4 s.
- At **3:05**, click the **Farmgate** hub card in Network to filter the list, then click it again.
  Costs ~3 s. (§13.9)
- At **3:20**, after joining the pool, click **Leave pool** if you want to show the rollback, then
  rejoin. Costs ~4 s. Do not do this if the clock is tight.
- The **time machine** decay proof (§13.2) does not fit the main take; use it in Q&A or the
  extended tour (§14).

---

## 3. Full narration script (copy this to a teleprompter)

Spoken text only. Aim for ~140 words per minute. The stage directions are in `[brackets]`.

**[0:00 — landing page. Cursor on the headline.]**

"Every morning, millions of people in Dhaka make the same guess: which bus, which fare, and
which road is flooded right now. Google Maps doesn't know a student half-pass, a rickshaw
surge, or a blockade at Shahbagh. DhakaPath does."

**[0:15 — click "See the Live Command Center".]**

"This is the live command center: no login, no install. One deterministic graph — fifteen Dhaka
hubs, thirty-seven links — bus, MRT-6, leguna, rickshaw and walk-bridge. Notice the top bar:
this is simulated demo telemetry, not real-time data. We never pretend otherwise."

**[0:32 — optional: click Uttara → Shahbagh, then Mirpur → Motijheel.]**

"Watch the map change: Uttara to Shahbagh — different route, different fare. Now back to my
request, in Banglish: Mirpur 10 to Motijheel, student ID, fifty-five taka, and a question about
water at Farmgate."

**[0:44 — click "Find verified routes".]**

"'What I understood' shows the parser caught every constraint — origin, destination, student
status, budget, and the hub to avoid — locally, in under a millisecond. No cloud call."

**[0:50 — expand the route card; trace the legs.]**

"The engine returns a verified multi-leg route. Walk to the metro. MRT-6 to Agargaon — twenty
taka, no student discount on metro. Then a Bihanga bus for twelve taka: the fifty-percent
student fare with the ten-taka floor. Total: thirty-two taka, forty-eight minutes, one transfer.
And every leg carries the exact boarding landmark. That is the difference between a route and
directions you can actually follow."

**[1:20 — press Alt+2.]**

"Now Alt+2: peak crisis. Surface speed collapses to four-point-eight kilometres per hour, and
rickshaw surge goes to one-point-eight."

**[1:25 — point at the red closures and the detour.]**

"Farmgate and Malibagh cross the eighty-five percent confidence line, so the router severs
those edges. The map flags the closures in red and draws the detour. The route is recomputed
instantly — same search, new graph."

**[1:45 — point at the ROI strip.]**

"And it quantifies the alternative: about sixty-four minutes saved against the naive surface
route, and the blockade risk drops to zero. This is the counterfactual a commuter actually
cares about."

**[2:00 — press Alt+3.]**

"Alt+3 is the adversarial test. A spoofed five-hundred-taka bus fare and a fictional
underground ferry are injected."

**[2:05 — click "Trap: underground ferry"; then Live alerts → Safety log.]**

"The fare sanity gate rejects the fare — allowed range, ten to sixty-two-fifty. The grounding
verifier rejects the ferry because that edge is not in G-zero. Both appear in the Safety log
in hundredths of a millisecond. The app says it plainly: that route does not exist — blocked.
It will never show an invented leg as a route."

**[2:35 — point at alert cards; click the single-report test.]**

"Live alerts are crowd truth, not social media. Farmgate sits near seventy-one percent, Malibagh
near sixty-four — both need confirmation, and both decay on a thirty-minute half-life. A single
Shahbagh report lands around nineteen percent, far below the eighty-five percent severance
threshold, and the log says the graph is untouched. One person cannot reroute the city."

**[2:50 — press Ctrl+Shift+D.]**

"Ctrl+Shift+D shows the math: the piecewise fare — twenty plus twelve equals thirty-two, within
budget; the Bayesian posterior with a thirty-minute half-life; and the grounding check — every
edge exists, the fare deviation is under one-millionth of a taka. No black box."

**[3:05 — click Network.]**

"The Network tab is the CMS: fifteen hubs, thirty-seven links, with mode, time, boarding
landmark, and both fares. Metro shows no discount; bus shows the half fare. The router and the
verifier read the same graph. Admins can add links or scan a signboard, and nothing enters
without the sanity and grounding checks."

**[3:20 — back to Plan; expand the route.]**

"Back on Plan, the ride-share board pools a surged rickshaw. Join the pool: the bot splits the
fare, and the per-person price drops — here, to about thirteen taka instead of fifty."

**[3:40 — export the offline card.]**

"And this exports the survival kit: a canvas route card — thirty-seven kilobytes — plus a spoken
briefing with a printed transcript. No tiles, no network needed; the map falls back to the
offline schematic. That is bonus two and bonus three in one tap."

**[4:15 — close the modal; hold on the app.]**

"Every route is grounded. Every fare is statutory. Every alert earns its confidence. The same
engine also powers the Ask DhakaPath assistant and the passcode-gated admin console."

**[4:30 — closing.]**

"DhakaPath — the route you can verify, on the streets you actually travel. Thank you."

---

## 4. Action-only drill (practice this 3 times, no narration)

1. Open `/` in English, full screen, 110%.
2. Click **See the Live Command Center**.
3. Point: scenario bar → tabs → simulated strip.
4. Click **Mirpur10 → Motijheel · student · 55 BDT**.
5. Click **Find verified routes**.
6. Click the first route card (if collapsed); trace walk → metro 20 → bus 12. If a **Lowest
   fare** or **Fastest** card is visible below it, click it once and return to the first.
7. Press **Alt+2**; point at red pill + detour + ROI.
8. Press **Alt+3**; click **Trap: underground ferry**; point at the red banner.
9. Click **Live alerts**; scroll to Safety log; point at both blocked rows.
10. Click **Test: one uncorroborated Shahbagh report**; point at ~19.2%.
11. Press **Ctrl+Shift+D**; point at 3 lines; press **Esc**.
12. Click **Network**; point at 15 hubs · 37 links and two fare rows.
13. Click **Plan trip**; expand the route.
14. Click **Join pool (… → …) · lock split**; point at the split.
15. Click **Offline card (<45 KB) + audio**; point at 37.3 KB + transcript.
16. Click **Play again**; let 2 seconds play; close the modal.
17. Hold; close.

**Optional add-ons for Q&A / a second take** (practice separately): `§13.2` time machine +45m,
`§13.3` Pareto alternatives, `§13.5` map schematic, `§13.6` crowd voting guard, `§13.7` fare
checker, `§13.11` admin add-link, `§13.12` assistant multi-turn.

Reset between takes with **Alt+R** (top-right circular arrow). Reload the page for a truly clean
state (the store is in memory).

---

## 5. Optional 15-second inserts (record separately, splice in editing)

### 5.1 Admin signboard scanner (Bonus 1)

Pre-unlock `/admin` before recording (passcode `dhakapath2026`), then:

1. Switch to the admin tab. The console is already unlocked.
2. Scroll to **Scan a signboard or fare chart**. (Pre-scroll before recording; the section is
   ~3900 px down the page.)
3. Click **Scan: Bihanga Bus — Simulated Signboard Fixture**.
4. Wait; point at the extracted edges and the confidence percentage.
5. Click **Commit to graph**.
6. Say: "The vision model only transcribes; the deterministic digitizer resolves the hubs, and
   the grounding check decides what enters. Four routes verified, then committed."

Use this insert only if you have 15 seconds to spare; otherwise mention it in the close.
The photo-upload path needs a Gemini key, so use the preset on stage — the preset is explicitly
labelled as a fixture.

### 5.2 Ask DhakaPath assistant (Part 5)

1. On `/app`, click the green **Ask** button (bottom-right).
2. Type or click a suggested chip: `Mirpur 10 → Motijheel (55 BDT, student)`.
3. Let the grounded answer render (2–3 seconds).
4. Say: "Same engine, same grounding — the chat is just another interface."

Skip this in the main take if the LLM key is not configured; the local engine still answers,
but the point is stronger in Q&A.

### 5.3 Architecture card (5 seconds)

A simple title card with three boxes — `Banglish/voice → deterministic graph engine → verifier
→ route card` — helps judges who need the mental model. Put it at 0:00 or 4:20, not both.

---

## 6. If something breaks (say it, don't hide it)

| Symptom | Fix | What to say |
|---|---|---|
| Map is blank for >7 s | It falls back to the schematic automatically; or click **Schematic** | "This is the offline fallback — same graph, no tiles." |
| Route doesn't change after a scenario | Press **Alt+R**, then re-click the example; check the scenario chip | "Let me reset the demo state." |
| Speech does not play | Click **Play again**; point at the transcript | "The transcript is the proof; audio is browser-native." |
| Offline card download blocked | Allow downloads; the preview still renders | "The preview is the exported canvas." |
| No Groq/Gemini key | Use the local lexer and the signboard preset | "The deterministic fallback is the baseline." |
| Port 3000 busy | Use the URL Next printed; do not show the URL bar | — |
| Numbers differ from this doc | Read the screen; do not recite stale values | — |
| UI looks old / wrong fares | `Remove-Item -Recurse -Force .next` → `npm run build` → `npm start` | — |

**Never** say "real-time data", "100% accurate", or "zero hallucinations guaranteed". Say
"simulated demo telemetry", "every displayed leg is checked against the graph", and "invented
legs are blocked".

---

## 7. Edit & export

- Cut dead air and mistakes; keep 1 second of silence after each state change.
- Do **not** speed up the UI; the pauses are what make it readable.
- Add a 3-second title card (`DhakaPath — verified transit for Dhaka`) and a 4-second end card
  (GitHub URL / QR code).
- Optional lower-third at 1:45 with three numbers: `+64 min · +5 BDT · −100% risk`.
- Music: very low, or none. The voice must dominate. No whooshes on every click.
- Captions: optional; if you add them, keep them off the UI labels.
- Export: MP4, H.264, 1080p, 30 fps, AAC 160 kbps. Aim 4:45–4:55, never over 5:00.
- Watch the export once on a phone and once on a laptop. If the numbers are unreadable on the
  phone, re-record at 125% zoom or larger window.

---

## 8. Judge Q&A cheat sheet (2 minutes)

**"Why not just ask ChatGPT/Gemini for the route?"**
LLMs invent transfers, cannot guarantee the 10 BDT student floor or the MRT station-pair table,
and add 1.5–3 s latency. We use the model only as a parser; the deterministic graph engine does
the routing, the fare arithmetic and the verification. The displayed route is checked leg by
leg (`V(P*) = 1`).

**"How do you stop fake blockades?"**
Rule gate for impossible fares (under 10 or over 2.5× base), Bayesian log-odds with a 30-minute
half-life, and an 85% severance threshold. One report is far below the line; independent
corroboration is required; stale reports expire. A single low-weight report cannot flip a
confirmed alert.

**"What happens with no internet or 5% battery?"**
The graph and router run client-side; the map falls back to the 15-hub schematic; the route card
is a sub-45 KB canvas PNG; the briefing uses browser speech synthesis and always prints its
transcript. The app is installable as a PWA.

**"Is the data real?"**
No — it is simulated demo telemetry, labelled on every screen. The architecture is ready for
real feeds, but we do not claim live operator data.

**"How is the fare calculated?"**
Bus: `max(10, ceil(0.5 × max(10, round(2.70 × km))))` for eligible students; metro: official
station-pair table, never discounted; rickshaw/CNG: `ceil(base × surge / pool)`; walk: 0.
No LLM arithmetic anywhere.

**"What is the routing algorithm?"**
Multi-objective label-setting Pareto Dijkstra with a 16-bit visited mask, up to four
non-dominated labels per state, and a walk-bridge fallback when every vehicle route is cut.
It runs in under a millisecond on the demo graph.

**"How does the crowd truth math work?"**
`L_e(t) = ln(p/(1−p)) + Σ v_k w_k e^(−λ(t−t_k))`, `λ = ln2/30 min`, `R_e = 1/(1+e^(−L_e))`.
At 85% a surface edge is severed; below 25% (or after an hour with no positive vote) the alert
expires. The prior is 0.45 in a peak crisis and 0.15 otherwise.

**"What is the biggest limitation?"**
The demo graph is 15 hubs / 37 links and the telemetry is simulated; photo OCR needs a Gemini
key, and the offline map is schematic. We chose a deterministic, auditable demo over a
production data pipeline we could not verify in the time.

**"What is genuinely novel?"**
The combination of statutory fare arithmetic, Bayesian crowd truth, and route grounding in one
pipeline — and the fact that the UI never calculates anything; every screen is derived from the
same state and the same engine.

**"Can it scale?"**
The engine is graph-based and deterministic; adding hubs/links is data, not code. The demo
intentionally freezes the graph so results are reproducible. Real deployment would ingest
operator/GTFS feeds and real reports behind the same validation gates.

---

## 9. Do not say (known inconsistencies in the repo)

- **Do not quote "24.3%"** for a single report. The live engine shows **19.2%** for that input.
  The repo's own QA notes flag the mismatch. Say "around nineteen percent, far below 85%."
- **Do not read the landing phone mock's "+28 BDT" or "48 BDT"** as current. Those are marketing
  mockups; the live route is 32 BDT (43 BDT regular). Say "about thirty-two taka" only after you
  see it on screen.
- **Do not say "0.78 ms" as a measured result.** The landing/PitchOverlay quote 0.78 ms; the live
  telemetry shows ~0.20 ms. Say "sub-millisecond" or read the live number.
- **Do not say "real-time"** or "live bus GPS". Say "simulated demo telemetry".
- **Do not claim "100% accurate" or "zero hallucination guaranteed".** Say "every displayed leg
  is checked; invented legs are blocked."
- **Do not claim production scale.** Say "15 hubs, 37 links on the demo graph".

---

## 10. 60-second emergency pitch (if the recording fails)

"Dhaka commuters can't use a normal map: student half-fares, rickshaw surge, and flash blockades
are invisible. DhakaPath takes a Banglish request — origin, destination, student status, budget,
and a hub to avoid — and returns a verified multi-leg route with statutory fares and boarding
landmarks. The router is a Pareto Dijkstra on a 15-hub graph; the fare engine enforces the 10 BDT
student floor and the MRT-6 table; a Bayesian crowd layer decays stale alerts and requires
corroboration before it severs a road; and a grounding verifier blocks invented legs. It exports
a sub-45 KB offline card with a voice briefing. Simulated telemetry, deterministic math, no
login. That's DhakaPath."

---

## 11. Final take checklist

- [ ] Clean build; no stale `.next`
- [ ] English UI on landing, `/app`, `/admin`
- [ ] 110% zoom; F11; bookmarks hidden; notifications off
- [ ] Map tiles preloaded; `Alt+R` reset before the take
- [ ] Mic tested; OBS levels good; 1080p30
- [ ] Dry run completed; actual numbers noted
- [ ] Main take 4:45–4:55
- [ ] Export watched on phone + laptop
- [ ] Backup: 90-second offline clip (map schematic + offline card) saved

---

## 12. Complete feature coverage map (every control → exact click path)

Legend: **✅ main take** = already in the 5:00 script · **🟡 optional** = exact steps in §13,
use it only if you have time or a judge asks · **⛔ skip on camera** = real, but not worth stage
time (mention in Q&A).

The app has roughly fifty interactive surfaces. A five-minute video can show about twenty.
This table is the audit so nothing is a surprise in Q&A.

### 12.1 Landing page (`/`)

| Feature | Exact action | 5:00? | Note |
|---|---|---|---|
| Hero headline + CTA | Cursor moves from headline to phone mock; click **See the Live Command Center** | ✅ 0:00–0:20 | Do not read the mock's +28৳ / 48৳ |
| Stat bar (4.8 km/h · 0.78 ms · 15 hubs · 8.5m→1.4s) | Scroll 200 px, hold 3 s, scroll back | 🟡 | 0.78 ms is marketing; say "sub-millisecond" |
| Services / trust / pool / download sections | Not shown | ⛔ | Marketing copy, not product |
| Pool split card (2/4, 3/4, 4/4) | Click **3/4 pool**, watch 45৳ → 30৳ | ⛔ | The live board is stronger |
| Language toggle | Click **English** / **বাংলা** in header | 🟡 2 s | Only if a judge asks in Bangla |

### 12.2 App chrome (`/app`)

| Feature | Exact action | 5:00? | Note |
|---|---|---|---|
| Three tabs | Click **Plan trip**, **Live alerts**, **Network** | ✅ | The spine of the demo |
| Scenario status pills | Point at km/h, Surge ×, engine ms | ✅ 0:20 | Read the screen, not the doc |
| Scenario dropdown | Click the **Scenario: …** pill; choose Normal / Peak / Fake-input | 🟡 0:20 | Hotkeys are faster on stage |
| Time machine (+15 / +45 / +90 m) | Same dropdown → **Time machine** → **+45m** | 🟡 §13.2 | Best proof that stale alerts expire |
| Demo story overlay | Header → **Demo story** | 🟡 §13.1 | Strong 10-second opener; skip the 0.78 ms |
| Math button | Header **Math** (same as Ctrl+Shift+D) | ✅ 2:50 | Shortcut is cleaner |
| Admin lock link | Header lock icon → `/admin` | ⛔ | Mention only; passcode flow is slow |
| Language toggle | Header **English** / **বাংলা** | 🟡 | Persists in localStorage |
| Reset | Header circular arrow, or **Alt+R** | ✅ between takes | Reload for a truly clean store |
| Honesty strip | Point at **SIMULATED DEMO TELEMETRY** | ✅ 0:20 | Never hide it |
| Assistant FAB | **Ask** bottom-right (or **Ctrl+/**) | 🟡 §13.12 | Part 5 |
| Deep links | `/app#alerts`, `/app#network` | ⛔ | Use them for re-takes |
| PWA install | Browser install icon in `npm start` | ⛔ | Say "installable PWA" in Q&A |

### 12.3 Plan tab

| Feature | Exact action | 5:00? | Note |
|---|---|---|---|
| Free-text Banglish input | Click textarea, type; **Enter** runs the search | ✅ | Already populated on load |
| Mic input | Click mic icon, speak | ⛔ | Chrome-only, needs permission + bn-BD |
| Find verified routes | Click the big green button | ✅ 0:44 | Pause 2 s |
| From/To dropdowns | **Start & destination** card → change A and B | 🟡 §13.4 | Fallback if parsing fails |
| Swap | **Swap** button between A and B | 🟡 §13.4 | Instantly reverses the trip |
| My location | **My location** → allow browser permission | ⛔ | Venue GPS may be wrong; never risk it |
| One-tap examples | Click **Mirpur 10 → Motijheel · student · 55 BDT** | ✅ | Also Uttara and the Trap |
| Student pass toggle | Toggle off/on; fare 32 ↔ 43 | 🟡 §13.4 | Restore it before continuing |
| Avoid flooded toggle | Toggle; Peak crisis shows why it matters | 🟡 §13.4 | Hard constraint, not a post-filter |
| Allow walk-bridge toggle | Off → a walk-bridge-only route is withheld; on → free detour | 🟡 §13.14 | Verify the state before recording |
| "What I understood" pills | Point at From / To / Student / Budget / Avoid / lexer | ✅ 0:44 | Proves parsing |
| Interception banner | Click **Trap: underground ferry** | ✅ 2:05 | Red `GROUNDING_INTERCEPTED` |
| Ranked alternatives (up to 3) | Scroll to "N verified routes"; click cards with **Best balance (P\*)** / **Lowest fare** / **Fastest** | 🟡 §13.3 | **The most important missing feature** — the Pareto set |
| Leg timeline | Expand the top card; walk → metro → bus | ✅ 0:50 | Every leg has a boarding landmark |
| Route-card pool box | Inside the expanded card, join/leave the rickshaw | ⛔ | Duplicate of the board below |
| Offline export | **Offline card (<45 KB) + audio** | ✅ 3:40 | Opens the sheet |
| Map OSM ↔ Schematic | Segmented control top-right of Map | 🟡 §13.5 | Bonus 3; works with no tiles |
| Map A/B overlay + swap | Top-left of map → change From/To | 🟡 §13.5 | Same store as the planner |
| Map hub popup | Click a hub circle → incident/confidence + **Set From (A)** / **Set To (B)** | 🟡 §13.5 | Works on red disrupted hubs too |
| Map layers (MRT-6 / Bikolpo / Uttara) | Bottom-right buttons in OSM view | 🟡 §13.5 | Purely visual |
| ROI strip | Point at +min / +৳ / −risk | ✅ 1:45 | Read the live numbers |
| Ride-share board | **Join pool (2/4 → 3/4) · lock split** | ✅ 3:30 | Bot line shows the arithmetic |
| Leave pool | Click **Leave pool (solo …)** | 🟡 §13.18 | Folds fare back to solo |
| Offline sheet | Size, PNG, transcript, **Play again**, **Download again**, X | ✅ 3:40–4:15 | Esc also closes |
| No-route state | Search with 5৳ budget | 🟡 §13.14 | Explicit failure message |
| Walk-bridge unlock | Card **Unlock walk-bridge** | 🟡 §13.14 | Only when all vehicle routes are cut |

### 12.4 Live alerts tab

| Feature | Exact action | 5:00? | Note |
|---|---|---|---|
| Alert cards | Point at Farmgate / Malibagh confidence + decay meters | ✅ 2:35 | Peak: 91.8 / 89.2; Normal: ~70.6 / ~64.0 |
| Confirm (+1) / Mark cleared (−1) | Click either button; confidence moves | 🟡 §13.6 | Use Peak to show the guard |
| One-vote guard | On a confirmed alert click **Mark cleared (−1)** | 🟡 §13.6 | Amber "held for review"; quarantine log |
| Admin override & clear | Click the small **Admin: override & clear** link | 🟡 §13.10 | Mutates state; reset after |
| Report form | Hub / incident / severity → **Submit report** | 🟡 §13.8 | Shows "needs 3 confirmations" |
| Single-report test | **Test: one uncorroborated Shahbagh report** | ✅ 2:35 | ~19.2%, graph untouched |
| Fare sanity checker | From/To/Mode/fare → **Check fare**; **Inject 400/500** | 🟡 §13.7 | Input side of the Safety log |
| Safety log | Scroll below the cards | ✅ 2:20 | Both attacks + timings |

### 12.5 Network tab and admin

| Feature | Exact action | 5:00? | Note |
|---|---|---|---|
| Graph counts | Point at "15 hubs · 37 links" subtitle | ✅ 3:05 | Read them live |
| Hub filter | Click a hub card → link list filters | 🟡 §13.9 | Click again to clear |
| Mode filters / Show all | Click **Metro**, **Bus**, **All**; **Show all links (N)** | 🟡 §13.9 | Metro shows "no discount" |
| New / Remove link | Trash icon on an admin-added link | 🟡 §13.11 | Only after adding one |
| Signboard scanner | **Scan: Bihanga Bus — Simulated Signboard Fixture** → **Commit to graph (4)** | 🟡 §5.1 | Bonus 1; photo path needs Gemini |
| Typed OCR fallback | Paste `Mirpur 10 -> Farmgate : 25 taka` → **Read text** | 🟡 §5.1 | Works with no key |
| Add a link (admin) | Fill form → **Add link** | 🟡 §13.11 | Bus/metro fare is statutory |
| Admin passcode | `/admin` → `dhakapath2026` → **Sign in** | 🟡 §5.1 | Session persists per tab |
| Admin stats row | Point at Hubs / Links / Active alerts / Blocked hubs / Audit events | 🟡 §13.10 | Five cards |
| Admin logout | **Log out** | ⛔ | Not interesting |

### 12.6 Assistant and under the hood

| Feature | Exact action | 5:00? | Note |
|---|---|---|---|
| Multi-turn chat | **Ask** → suggestion chips → follow-up | 🟡 §13.12 | Same engine, context memory |
| Chat route sync | Ask a route question; Plan tab updates behind it | 🟡 §13.12 | Close the panel to reveal |
| Chat report | Type `Shahbagh e pani uthse` | 🟡 §13.12 | Creates a pending alert |
| Clear memory | Circular arrow in the chat header | ⛔ | Reset control |
| Four track APIs | `/api/track-1-engine` … `track-4-map-shell` | ⛔ | Q&A only |
| Service worker / PWA | `npm start` → install | ⛔ | Mention "offline shell" |

---

## 13. Micro-demo scripts for every extra control

Each block is self-contained. Record these **separately** and splice them in, or use them live in
Q&A. Reset with **Alt+R** between blocks unless the block says otherwise.

### 13.1 Demo story overlay — 10 s

1. On `/app`, click **Demo story** in the header (top-right).
2. Wait 1.5 s for the three counters to animate.
3. Point at **4.8 km/h** and **1.4 sec**.
4. **Do not read 0.78 ms** — it is a marketing figure, not the measured engine time.
5. Click **Enter the live app** (or X / Esc).

Say: *"This is the twenty-five-second story view — the same engine, three proof numbers."*

### 13.2 Time machine: stale alerts expire — 15 s

Setup: `/app` → **Live alerts** → press **Alt+2** (Peak crisis). Farmgate is 91.8%, Malibagh 89.2%.

1. Click the **Scenario: Peak crisis** pill to open the dropdown.
2. Under **Time machine**, click **+45m**.
3. Wait 2 s: both confidence meters fall below 85%, statuses flip to **Pending corroboration**,
   the red map banner disappears and the route reopens.
4. Click **+90m**: the last positive vote is now over an hour old → both alerts show **Expired**;
   the header pill says **All clear**.
5. Click **Now** to reset the clock, then **Alt+1** (Normal day).

Say: *"Confidence decays on a thirty-minute half-life. An unconfirmed report expires after an
hour, so stale news cannot block a road forever."*

Why it matters: this is the cleanest proof of the Bayesian decay, better than reading a formula.

### 13.3 Ranked alternatives (the Pareto set) — 10 s

Setup: default search results on Plan.

1. Scroll to the heading **"N verified routes"** under the planner card.
2. Point at the pills: **Best balance (P\*)** (first card), **Lowest fare**, **Fastest**.
3. Click the second card once to expand it; point at its fare and time; click the first card again.

Say: *"The router returns a Pareto set, not one answer: best balance, cheapest, fastest. The first
one is tagged P-star; the others are the trade-offs."*

If only one card appears, say: *"On this corridor the Pareto set collapses to one non-dominated
route."* Do not claim three if you see one.

### 13.4 Constraints: toggles and direct A/B — 15 s

1. Under **Try one tap**, click **Mirpur 10 → Motijheel · student · 55 BDT**.
2. Point at the **What I understood** pills (From, To, Student, Budget, Avoid).
3. Toggle **Student pass** off: the headline fare changes (32 → 43). Toggle it back on.
4. Point at **Avoid flooded / blocked hubs** (on). It adds hubs with pending alerts to the avoid
   set, and a confirmed alert severs its edges regardless of this toggle. Only flip it if you have
   verified on your build that the visible route changes; otherwise just read the hint.
5. **Leave Student pass ON** before you continue.

Say: *"Every toggle is a hard constraint in the same search — the engine cannot return a route
that violates it."*

Direct A/B: under **Start & destination**, change **From (Origin)** and **To (Destination)**; use
**Swap** to reverse. This is the fallback if the Banglish parser ever misses a place name.

### 13.5 Map: schematic, layers, A/B overlay — 12 s

1. Top-right of the Map card, click **Schematic**.
2. Point at the 15-hub graph and the legend; this is the no-tile fallback.
3. Click **OpenStreetMap** to return.
4. Bottom-right layer buttons: click **MRT-6** (metro line appears), click again to hide.
5. Top-left A/B bar: set **From** to **Uttara**, **To** to **Shahbagh**; route redraws. Click the
   swap arrows to reverse; set it back to Mirpur 10 / Motijheel before moving on.
6. Click the red **Farmgate** hub circle: the popup shows the incident, status and Rₑ, plus
   **Set From (A)** / **Set To (B)**. Click the map background to close without changing the trip.

Say: *"If tiles fail, the same graph renders schematically. The map and the planner read the same
store — change either and both update."*

### 13.6 Crowd voting and the one-vote guard — 12 s

Setup: **Peak crisis** → **Live alerts**.

1. On **Farmgate**, click **Confirm (+1)**; the confidence meter rises.
2. On the same confirmed card, click **Mark cleared (−1)**.
3. Point at the amber message: *"One vote cannot flip a confirmed alert — held for review."*
4. Scroll to **Safety log**: a quarantine row appears.

Say: *"A confirmed blockade cannot be cleared by one anonymous tap. Contradictory resolutions are
quarantined, not applied."*

Note: in **Normal day** Farmgate is only pending, so clearing is allowed — use Peak for the guard.

### 13.7 Fare sanity checker — 12 s

Setup: **Live alerts**, right column.

1. **Fare sanity check**: From **Mirpur 10**, To **Farmgate**, Mode **Bus**, fare **500**.
2. Click **Check fare**.
3. Point at the red **Fake fare blocked**, "500 ৳ · allowed 10–62.5 ৳", `ANOMALOUS_FARE_REJECTED`,
   and the millisecond time.
4. Click **Inject 400 BDT** to repeat; then set **30** and click **Check fare** → **Fare accepted**.

Say: *"Anything under ten taka or above two-point-five times the base is impossible. Valid fares
pass in microseconds, and every rejection is logged."*

### 13.8 Report form — 10 s

Setup: press **Alt+R** first so no Shahbagh report exists.

1. **Live alerts** → **Report a street problem**.
2. Hub **Shahbagh**, incident **Intersection blockade**, severity **Moderate**.
3. Click **Submit report**.
4. Point at: *"Report received. It only closes the road once at least 3 people confirm."*
5. Scroll to **Safety log**: "R_e … < 85% → PENDING, graph untouched".

Say: *"One report never reroutes anyone; it needs corroboration."*

The one-tap **Test: one uncorroborated Shahbagh report** does the same thing faster; use whichever
fits the clock.

### 13.9 Network filters — 8 s

1. Click **Network**.
2. Click the **Farmgate** hub card; the list filters and the subtitle says **Filter: Farmgate**.
3. Click **Farmgate** again to clear; click the **Metro** mode chip; point at the "no discount" rows.
4. Click **All**, then **Show all links (N)**.

Say: *"The CMS is the same graph the router reads: filter by hub or mode, and every fare is the
statutory one."*

### 13.10 Admin stats and override — 10 s

Setup: `/admin` unlocked.

1. Point at the five stat cards: **Hubs**, **Links**, **Active alerts**, **Blocked hubs**,
   **Audit events**.
2. Scroll to **Live alerts**; on a live card click **Admin: override & clear**.
3. Point at the confidence dropping to ≤12%, status **Resolved**, and the Safety log entry
   "Admin override".

Say: *"Moderators can clear a corridor, but the override is audited — it is not a silent delete."*

Do this **last** or reset; it mutates the shared state.

### 13.11 Add a link (admin CMS) — 20 s

Setup: `/admin` → **Network** → scroll to **Add a link (admin)**.

1. From **Mohakhali**, To **Science Lab**, Mode **Bus**, Duration **25**.
2. Route name: `Turag Paribahan`. Boarding landmark: `Mohakhali bus stand`.
3. Point at **Fare: Statutory (automatic)** — bus and metro fares cannot be typed in.
4. Click **Add link**; point at the green *"Link added — routing now uses it."*
5. Scroll up: the link appears with a **New** pill; click the trash icon to remove it.

Say: *"Admins cannot invent a bus fare. The statutory engine sets it, the grounding check accepts
the edge, and the router uses it immediately."*

This is a stronger CMS demo than the signboard preset; use it if you have twenty seconds.

### 13.12 Ask DhakaPath: multi-turn — 25 s

1. Click **Ask** (bottom-right) or **Ctrl+/**.
2. Click the chip **Mirpur 10 → Motijheel (55 BDT, student)**; wait for the answer.
3. Click **Why that fare?** — point at the audit badges.
4. Click **What if Farmgate floods? avoid Farmgate** — close the panel briefly to show the Plan
   route changed, then reopen.
5. Optionally type `Shahbagh e pani uthse` (files a report), then **Can I trust that report?**.
6. Press **Esc** to close.

Say: *"Same engine, same grounding, multi-turn context — the chat is another interface, not a
separate brain."*

With no LLM key the local engine still answers; the replies are more template-like. Do not
apologize — say the deterministic path is the baseline.

### 13.13 PWA and deep links — mention only

- With `npm start`, the browser shows an install icon; installing opens a standalone window and
  the service worker caches the shell.
- `/app#alerts` and `/app#network` open those tabs directly. Use these for re-takes; do not show
  the URL bar on camera.

Say in Q&A: *"It is an installable PWA; the graph and router are client-side, so the core works
offline."*

### 13.14 No-route and walk-bridge states — verify first

1. In the planner, type `Mirpur 10 theke Motijheel, 5 takar moddhe` and press **Enter**.
2. Point at **"No route within your budget and rules"** — the app names the constraint instead of
   inventing a route.
3. In a state where every vehicle path is cut, the card says **"Every vehicle route is cut"** and
   offers **Unlock walk-bridge**. Click it: a free 4.5 km/h foot detour appears, and the map shows
   `DETOUR_WALK_BRIDGE_REQUIRED`.
4. Press **Alt+R** to reset.

Say: *"Failure is explicit. It tells you which constraint to relax; the walk-bridge is the last
resort, and it costs zero taka."*

**Verify this state on your machine before recording**; do not improvise it live.

### 13.15 Language switch — 2 s

Click **English** / **বাংলা** in the header. Every label and numeral switches, and the choice
persists in `localStorage`. Use only if a judge asks in Bangla.

### 13.16 Reset — 2 s

**Alt+R** or the circular arrow restores: Normal day, default query, default toggles, no pools,
no extra links, no overrides, only the boot log. A page reload gives a truly clean store.

### 13.17 35-second coverage combo (if you must add more to the main take)

Cut the Uttara proof (0:32–0:44) and the Network tour (3:05–3:20), then splice in:

1. Peak crisis → open Scenario dropdown → **+45m** (3 s) — alerts decay, road reopens.
2. **Now** → **Alt+1** (2 s).
3. Scroll to route cards → click the **Lowest fare** card (2 s) — Pareto alternatives.
4. Map → **Schematic** (2 s) → **OpenStreetMap** (1 s).
5. Live alerts → **Confirm (+1)** on Farmgate (2 s).
6. **Fare sanity check** → **Inject 500 BDT** (2 s) — red block.
7. **Network** → click **Farmgate** hub (2 s) — list filters.

That is ~15 seconds of new material plus the transitions; rehearse it before committing.

### 13.18 Leave pool (rollback) — 4 s

Precondition: you already joined a pool in §2 (3:30).

1. On the same row, click **Leave pool (solo …)**.
2. Point at the per-person fare jumping back to the solo fare and the seat count dropping by one.
3. Click **Join pool** again if you want the discounted state for the next shot.

Say: *"Leaving is not sticky: the split rolls back to solo immediately."*

---

## 14. Extended feature tour (6:30) — record separately

Do **not** submit this as the demo; the brief says 4–5 minutes. Record it as an unlisted link for
Q&A ("here is the full feature tour") and for the GitHub README.

| Clock | Segment | Source |
|---|---|---|
| 0:00 | Landing hero + CTA | §2 |
| 0:20 | Demo story overlay | §13.1 |
| 0:35 | Query → verified route → alternatives | §2 + §13.3 |
| 1:10 | Constraint toggles | §13.4 |
| 1:30 | Map + schematic + layers | §13.5 |
| 1:50 | Peak crisis + time machine decay | §2 + §13.2 |
| 2:20 | Crowd voting + one-vote guard | §13.6 |
| 2:40 | Fare sanity checker | §13.7 |
| 3:00 | Report form | §13.8 |
| 3:15 | Math drawer | §2 |
| 3:30 | Network filters | §13.9 |
| 3:50 | Admin add-link | §13.11 |
| 4:20 | Signboard scanner | §5.1 |
| 4:40 | Ask DhakaPath multi-turn | §13.12 |
| 5:15 | Offline card + PWA mention | §2 + §13.13 |
| 5:40 | Limitations + honesty | §6 + §8 |
| 6:00 | Closing | §2 |

This covers **every** feature in §12 except the ones marked ⛔, in six and a half minutes.
