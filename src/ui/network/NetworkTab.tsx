"use client";

// Transit network screen: every hub with its live status, every link with student vs regular
// fares, and the admin tools that extend the graph (signboard scanner, add-a-link form).
// Anything added here goes through the same grounding checks and feeds the router at once.

import React, { useMemo, useRef, useState } from "react";
import { Camera, CheckCircle2, CircleX, FileImage, Plus, Trash2 } from "lucide-react";
import { useDhakaPathStore } from "@/store/useDhakaPathStore";
import { useLang } from "@/lib/i18n";
import { AlertStatus, HubId, TransitEdge, TransportMode } from "@/contracts/schema";
import { CANONICAL_GRAPH_G0, CANONICAL_HUBS } from "@/contracts/canonicalGraph";
import { computeLegCost } from "@/engine/fareEngine";
import { SIGNBOARD_PRESET_OPTIONS } from "@/features/feature-1-commute/signboardVision";
import { cn } from "@/lib/utils";
import { Btn, Card, Field, Pill, SectionTitle, Toggle, inputCls } from "../kit";
import { HUB_IDS, MODE_STYLE, hubName, modeName, incidentName } from "../labels";
import { ModeChip } from "../plan/RouteCard";

function fareOf(edge: TransitEdge, student: boolean): number {
  try {
    return computeLegCost(edge, student, 1, 1);
  } catch {
    return edge.base_fare_bdt;
  }
}

// ---------------------------------------------------------------------------
function HubGrid({ selected, onSelect }: { selected: HubId | null; onSelect: (h: HubId | null) => void }) {
  const { lang, t, n } = useLang();
  const { alerts, disruptedHubIds, extraEdges } = useDhakaPathStore();
  const links = (h: HubId) => [...CANONICAL_GRAPH_G0, ...extraEdges].filter((e) => e.origin_hub_id === h || e.dest_hub_id === h).length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {HUB_IDS.map((h) => {
        const alert = alerts.find((a) => a.hub_id === h && (a.status === AlertStatus.VERIFIED_ACTIVE || a.status === AlertStatus.PENDING_CORROBORATION));
        const blocked = disruptedHubIds.includes(h);
        const active = selected === h;
        return (
          <button
            key={h}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(active ? null : h)}
            className={cn("rounded-2xl border bg-white p-3.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lift", active ? "border-brand ring-2 ring-brand/20" : "border-line")}
          >
            <div className="text-[15px] font-extrabold text-ink">{hubName(h, lang)}</div>
            <div className="text-[12px] text-ink-faint">{lang === "bn" ? CANONICAL_HUBS[h].name_en.split(" ")[0] : CANONICAL_HUBS[h].name_bn}</div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {blocked ? (
                <Pill tone="red" icon={<CircleX className="h-3 w-3" />}>{t("বন্ধ", "Blocked")}</Pill>
              ) : alert ? (
                <Pill tone="amber">{n(alert.confidence_pct.toFixed(0))}%</Pill>
              ) : (
                <Pill tone="green" icon={<CheckCircle2 className="h-3 w-3" />}>{t("স্বাভাবিক", "Clear")}</Pill>
              )}
              <span className="text-[11.5px] font-semibold text-ink-faint">{n(links(h))} {t("লিংক", "links")}</span>
            </div>
            {alert && <div className="mt-1.5 text-[11.5px] text-ink-soft">{incidentName(alert.incident_type, lang)}</div>}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
function LinkList({ hub }: { hub: HubId | null }) {
  const { lang, t, n } = useLang();
  const { extraEdges, removeLink } = useDhakaPathStore();
  const [mode, setMode] = useState<TransportMode | "ALL">("ALL");
  const [showAll, setShowAll] = useState(false);

  const rows = useMemo(() => {
    // Committed (admin / signboard) links first, so a fresh commit is visible without scrolling.
    const all = [...extraEdges, ...CANONICAL_GRAPH_G0].filter((e) => e.origin_hub_id !== e.dest_hub_id);
    return all.filter((e) => (mode === "ALL" || e.mode === mode) && (!hub || e.origin_hub_id === hub || e.dest_hub_id === hub));
  }, [extraEdges, mode, hub]);

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle title={t("সব লিংক ও ভাড়া", "All links and fares")} sub={hub ? `${t("ফিল্টার", "Filter")}: ${hubName(hub, lang)}` : t("হাব বেছে নিলে ফিল্টার হবে।", "Pick a hub above to filter.")} />
        <div className="flex flex-wrap gap-1.5">
          {(["ALL", ...Object.values(TransportMode)] as const).map((m) => (
            <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} className={cn("rounded-full border px-3 py-1.5 text-[12.5px] font-bold transition-colors", mode === m ? "border-brand bg-brand text-white" : "border-line bg-white text-ink-soft hover:border-brand")}>
              {m === "ALL" ? t("সব", "All") : modeName(m, lang)}
            </button>
          ))}
        </div>
      </div>

      <ul className="mt-4 divide-y divide-line">
        {(showAll ? rows : rows.slice(0, 12)).map((e) => {
          const isNew = extraEdges.some((x) => x.edge_id === e.edge_id);
          const reg = fareOf(e, false);
          const stu = fareOf(e, true);
          return (
            <li key={e.edge_id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0">
              <ModeChip mode={e.mode} size={40} />
              <div className="min-w-[180px] flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[14.5px] font-bold text-ink">{e.route_name}</span>
                  {isNew && <Pill tone="green">{t("নতুন", "New")}</Pill>}
                </div>
                <div className="text-[12.5px] text-ink-soft">{hubName(e.origin_hub_id, lang)} → {hubName(e.dest_hub_id, lang)} · {e.boarding_landmark}</div>
              </div>
              <div className="text-right text-[13px] tabular-nums">
                {e.mode === TransportMode.RICKSHAW ? (
                  <div className="font-extrabold text-ink">{n(e.base_fare_bdt)}–{n(Math.ceil(e.base_fare_bdt * 2.5))} ৳</div>
                ) : (
                  <div className="font-extrabold text-ink">{n(reg)} ৳</div>
                )}
                {e.student_half_fare_eligible && stu !== reg ? <div className="text-[12px] font-bold text-brand-dark">{t("স্টুডেন্ট", "Student")} {n(stu)} ৳</div> : <div className="text-[12px] text-ink-faint">{e.mode === TransportMode.METRO ? t("ছাড় নেই", "no discount") : ""}</div>}
              </div>
              <div className="w-16 text-right text-[12.5px] font-semibold tabular-nums text-ink-soft">{n(Math.round(e.base_duration_ms / 60000))} {t("মি.", "min")}</div>
              {isNew && (
                <button type="button" onClick={() => removeLink(e.edge_id)} aria-label={t("মুছুন", "Remove")} className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink-faint hover:border-danger-line hover:text-danger">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          );
        })}
        {rows.length === 0 && <li className="py-6 text-center text-[14px] text-ink-faint">{t("কোনো লিংক পাওয়া যায়নি", "No links found")}</li>}
      </ul>
      {rows.length > 12 && (
        <Btn variant="outline" size="sm" className="mt-4" onClick={() => setShowAll((v) => !v)}>
          {showAll ? t("কম দেখান", "Show fewer") : `${t("সব লিংক দেখান", "Show all links")} (${n(rows.length)})`}
        </Btn>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
function SignboardScanner() {
  const { lang, t, n } = useLang();
  const { ocrResult, ocrBusy, scanSignboard, commitOcrEdges, discardOcrEdges } = useDhakaPathStore();
  const [typed, setTyped] = useState("");
  const [drag, setDrag] = useState(false);
  const [committed, setCommitted] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const scanFile = (f: File | undefined) => {
    if (f && f.type.startsWith("image/")) {
      setCommitted(null);
      setPreview(URL.createObjectURL(f));
      void scanSignboard({ file: f });
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <SectionTitle title={t("সাইনবোর্ড / ভাড়ার তালিকা স্ক্যান", "Scan a signboard or fare chart")} sub={t("ছবি দিলে রুট ও ভাড়া পড়ে গ্রাফে যোগ করার জন্য যাচাই হবে।", "A photo is read into routes and fares, then verified before it can join the graph.")} />

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); scanFile(e.dataTransfer.files?.[0]); }}
        className={cn("mt-4 grid place-items-center rounded-2xl border-2 border-dashed p-6 text-center transition-colors", drag ? "border-brand bg-brand-soft" : "border-[#BFDCC9] bg-brand-mint")}
      >
        <FileImage className="h-8 w-8 text-brand" />
        <p className="mt-2 text-[14px] font-bold text-ink">{t("ছবি এখানে ছেড়ে দিন", "Drop a photo here")}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {preview && <img src={preview} alt={t("তোলা ছবি", "Captured photo")} className="mt-3 h-24 w-full rounded-xl border border-line object-cover" />}
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Btn size="sm" variant="outline" busy={ocrBusy} icon={<Camera className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>
            {t("ছবি বাছুন", "Choose photo")}
          </Btn>
          <Btn size="sm" variant="outline" busy={ocrBusy} icon={<Camera className="h-4 w-4" />} onClick={() => camRef.current?.click()}>
            {t("ক্যামেরা", "Camera")}
          </Btn>
        </div>
        <input ref={camRef} type="file" accept="image/*" capture="environment" className="sr-only" aria-label={t("ক্যামেরা", "Camera")} onChange={(e) => { scanFile(e.target.files?.[0]); e.target.value = ""; }} />
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" aria-label={t("সাইনবোর্ডের ছবি", "Signboard photo")} onChange={(e) => { scanFile(e.target.files?.[0]); e.target.value = ""; }} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {SIGNBOARD_PRESET_OPTIONS.map((p) => (
          <Btn key={p.id} size="sm" variant="soft" disabled={ocrBusy} onClick={() => { setCommitted(null); void scanSignboard({ presetId: p.id }); }}>
            {t("স্ক্যান", "Scan")}: {p.title}
          </Btn>
        ))}
      </div>

      <div className="mt-4">
        <Field label={t("অথবা লেখাটি টাইপ করুন", "Or type the text")} hint={t("প্রতি লাইনে: মিরপুর ১০ -> ফার্মগেট : ২৫ টাকা", "One per line: Mirpur 10 -> Farmgate : 25 taka")}>
          <textarea rows={3} value={typed} onChange={(e) => setTyped(e.target.value)} className={`${inputCls} resize-none font-mono text-[13px]`} />
        </Field>
        <Btn size="sm" className="mt-2" disabled={!typed.trim() || ocrBusy} onClick={() => { setCommitted(null); void scanSignboard({ rawText: typed }); }}>
          {t("লেখা থেকে পড়ুন", "Read text")}
        </Btn>
      </div>

      {ocrResult && (
        <div className="mt-5 space-y-3 border-t border-line pt-4" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={ocrResult.extractedEdges.length > 0 ? "green" : "amber"}>{n(ocrResult.confidencePct.toFixed(1))}% {t("নিশ্চিত", "confidence")}</Pill>
            <Pill tone="gray">{ocrResult.source === "PRESET_BENCHMARK" ? t("প্রিসেট", "Preset") : t("লেখা/ছবি", "Text / photo")}</Pill>
          </div>
          {ocrResult.rawText === "" && ocrResult.extractedEdges.length === 0 && (
            <p className="rounded-xl bg-warn-bg px-3 py-2 text-[13px] font-semibold text-warn">{t("ছবিটি পড়া যায়নি (অফলাইন বা ভিশন কী নেই)। প্রিসেট বা টাইপ করা লেখা ব্যবহার করুন।", "The photo could not be read (offline or no vision key). Use a preset or type the text.")}</p>
          )}
          <ul className="space-y-2">
            {ocrResult.extractedEdges.map((e) => (
              <li key={e.edge_id} className="flex items-start gap-2 rounded-xl border border-[#CDEBD7] bg-brand-mint px-3 py-2 text-[13px]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <span className="text-ink">
                  <strong>{e.route_name}</strong> · {hubName(e.origin_hub_id, lang)} → {hubName(e.dest_hub_id, lang)} · <span className="tabular-nums" style={{ color: MODE_STYLE[e.mode].color }}>{n(e.base_fare_bdt)} ৳</span>
                </span>
              </li>
            ))}
            {ocrResult.rejectedEdges.map((r, i) => (
              <li key={i} className="flex items-start gap-2 rounded-xl border border-danger-line bg-danger-bg px-3 py-2 text-[13px]">
                <CircleX className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                <span className="text-danger">{r.reason}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Btn size="sm" disabled={ocrResult.extractedEdges.length === 0} icon={<Plus className="h-4 w-4" />} onClick={() => { const r = commitOcrEdges(); setCommitted(r.ok ? t("গ্রাফে যোগ হয়েছে — এখন রুট হিসাবে ধরা হবে।", "Added to the graph — routing now uses it.") : r.message); }}>
              {t("গ্রাফে কমিট করুন", "Commit to graph")} ({n(ocrResult.extractedEdges.length)})
            </Btn>
            <Btn size="sm" variant="outline" onClick={discardOcrEdges}>{t("অযাচাইকৃত বাতিল", "Discard unverified")}</Btn>
          </div>
        </div>
      )}
      {committed && <p role="status" className="mt-3 rounded-xl bg-brand-mint px-3 py-2 text-[13px] font-semibold text-brand-dark">{committed}</p>}
    </Card>
  );
}

// ---------------------------------------------------------------------------
function AddLinkForm() {
  const { lang, t } = useLang();
  const { addLink } = useDhakaPathStore();
  const [origin, setOrigin] = useState<HubId>(HubId.H_MOHAKHALI);
  const [dest, setDest] = useState<HubId>(HubId.H_SCIENCELAB);
  const [mode, setMode] = useState<TransportMode>(TransportMode.BUS);
  const [name, setName] = useState("");
  const [fare, setFare] = useState("30");
  const [minutes, setMinutes] = useState("25");
  const [landmark, setLandmark] = useState("");
  const [student, setStudent] = useState(true);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const typedFare = mode === TransportMode.LEGUNA || mode === TransportMode.RICKSHAW;

  const submit = () => {
    const r = addLink({
      origin_hub_id: origin,
      dest_hub_id: dest,
      mode,
      route_name: name,
      base_fare_bdt: Number(fare) || 0,
      duration_min: Number(minutes) || 0,
      boarding_landmark: landmark,
      student_half_fare_eligible: student,
    });
    setMsg({ ok: r.ok, text: r.ok ? t("লিংক যোগ হয়েছে — রুটিং এখন এটি ব্যবহার করবে।", "Link added — routing now uses it.") : r.message });
  };

  return (
    <Card className="p-5 sm:p-6">
      <SectionTitle title={t("নতুন লিংক যোগ (অ্যাডমিন)", "Add a link (admin)")} sub={t("বাস/মেট্রোর ভাড়া সরকারি হারে নিজে নির্ধারিত হয়।", "Bus and metro fares are set automatically at the statutory rate.")} />
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t("শুরু", "From")}>
          <select value={origin} onChange={(e) => setOrigin(e.target.value as HubId)} className={inputCls}>{HUB_IDS.map((h) => <option key={h} value={h}>{hubName(h, lang)}</option>)}</select>
        </Field>
        <Field label={t("গন্তব্য", "To")}>
          <select value={dest} onChange={(e) => setDest(e.target.value as HubId)} className={inputCls}>{HUB_IDS.map((h) => <option key={h} value={h}>{hubName(h, lang)}</option>)}</select>
        </Field>
        <Field label={t("মাধ্যম", "Mode")}>
          <select value={mode} onChange={(e) => setMode(e.target.value as TransportMode)} className={inputCls}>{Object.values(TransportMode).map((m) => <option key={m} value={m}>{modeName(m, lang)}</option>)}</select>
        </Field>
        <Field label={t("সময় (মিনিট)", "Duration (min)")}>
          <input type="number" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} className={inputCls} />
        </Field>
        <Field label={t("রুটের নাম", "Route name")}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("যেমন: তুরাগ পরিবহন", "e.g. Turag Paribahan")} className={inputCls} />
        </Field>
        {typedFare ? (
          <Field label={t("ভাড়া (৳)", "Fare (BDT)")} hint={t("১০–৩০০ ৳", "10–300 BDT")}>
            <input type="number" inputMode="numeric" value={fare} onChange={(e) => setFare(e.target.value)} className={inputCls} />
          </Field>
        ) : (
          <Field label={t("ভাড়া", "Fare")}><div className="rounded-2xl border-[1.5px] border-line bg-brand-mint px-4 py-3 text-[14px] font-semibold text-ink-soft">{mode === TransportMode.WALK ? t("বিনামূল্যে", "Free") : t("সরকারি হার (স্বয়ংক্রিয়)", "Statutory (automatic)")}</div></Field>
        )}
        <div className="sm:col-span-2">
          <Field label={t("কোথায় উঠবেন", "Boarding landmark")}>
            <input value={landmark} onChange={(e) => setLandmark(e.target.value)} className={inputCls} />
          </Field>
        </div>
        {mode === TransportMode.BUS && (
          <div className="sm:col-span-2">
            <Toggle checked={student} onChange={setStudent} label={t("স্টুডেন্ট হাফ-পাস প্রযোজ্য", "Student half-pass applies")} />
          </div>
        )}
      </div>
      <Btn className="mt-4" icon={<Plus className="h-4 w-4" />} onClick={submit}>{t("লিংক যোগ করুন", "Add link")}</Btn>
      {msg && <p role="status" className={cn("mt-3 rounded-xl px-3 py-2 text-[13px] font-semibold", msg.ok ? "bg-brand-mint text-brand-dark" : "bg-danger-bg text-danger")}>{msg.text}</p>}
    </Card>
  );
}

// ---------------------------------------------------------------------------
export function NetworkTab({ admin = false }: { admin?: boolean }) {
  const { t, n } = useLang();
  const { extraEdges } = useDhakaPathStore();
  const [hub, setHub] = useState<HubId | null>(null);

  return (
    <div id="network" className="space-y-6">
      <SectionTitle
        title={t("ট্রানজিট নেটওয়ার্ক", "Transit network")}
        sub={`${n(HUB_IDS.length)} ${t("হাব", "hubs")} · ${n(CANONICAL_GRAPH_G0.length + extraEdges.length)} ${t("লিংক — বাস, মেট্রো, লেগুনা, রিকশা ও হাঁটা-সেতু", "links — bus, metro, leguna, rickshaw and walk-bridges")}`}
      />
      <HubGrid selected={hub} onSelect={setHub} />
      <LinkList hub={hub} />
      {admin && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SignboardScanner />
          <AddLinkForm />
        </div>
      )}
    </div>
  );
}
