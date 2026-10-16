"use client";

// Live alerts screen: Bayesian alert feed with decay, one-tap crowd confirmation / clearing,
// a free-form incident report, a fare sanity checker and the safety log of everything the
// validators blocked.

import React, { useState } from "react";
import { Ban, CheckCircle2, Clock, Gauge, Hammer, OctagonAlert, ShieldCheck, Waves } from "lucide-react";
import { useDhakaPathStore } from "@/store/useDhakaPathStore";
import { useLang } from "@/lib/i18n";
import { AlertStatus, HubId, IncidentType, TransportMode, ValidationStatus } from "@/contracts/schema";
import type { StreetAlert } from "@/contracts/schema";
import { CANONICAL_GRAPH_G0 } from "@/contracts/canonicalGraph";
import type { FareValidationResult } from "@/features/feature-3-trust-cms/sanityFilter";
import { Btn, Card, Field, Meter, Pill, Segmented, SectionTitle, inputCls } from "../kit";
import { HUB_IDS, INCIDENTS, alertStatusName, hubName, incidentName, validationName } from "../labels";

const INCIDENT_ICON: Record<IncidentType, React.ReactNode> = {
  [IncidentType.WATERLOGGING]: <Waves className="h-5 w-5" />,
  [IncidentType.INTERSECTION_BLOCKADE]: <OctagonAlert className="h-5 w-5" />,
  [IncidentType.SEVERE_GRIDLOCK]: <Gauge className="h-5 w-5" />,
  [IncidentType.ROAD_CONSTRUCTION]: <Hammer className="h-5 w-5" />,
};

function StatusPill({ status }: { status: AlertStatus }) {
  const { lang } = useLang();
  const tone = { VERIFIED_ACTIVE: "red", PENDING_CORROBORATION: "amber", EXPIRED: "gray", RESOLVED: "green" }[status] as "red" | "amber" | "gray" | "green";
  const icon = { VERIFIED_ACTIVE: <OctagonAlert className="h-3.5 w-3.5" />, PENDING_CORROBORATION: <Clock className="h-3.5 w-3.5" />, EXPIRED: <Clock className="h-3.5 w-3.5" />, RESOLVED: <CheckCircle2 className="h-3.5 w-3.5" /> }[status];
  return <Pill tone={tone} icon={icon}>{alertStatusName(status, lang)}</Pill>;
}

function AlertCard({ alert }: { alert: StreetAlert }) {
  const { lang, t, n } = useLang();
  const { voteAlert, overrideAlert } = useDhakaPathStore();
  const [locked, setLocked] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const live = alert.status === AlertStatus.VERIFIED_ACTIVE || alert.status === AlertStatus.PENDING_CORROBORATION;
  const up = alert.votes.filter((v) => v.direction === 1).length;
  const down = alert.votes.length - up;
  const tone = alert.status === AlertStatus.VERIFIED_ACTIVE ? "red" : alert.status === AlertStatus.PENDING_CORROBORATION ? "amber" : "gray";
  const decayPct = (alert.half_life_remaining_ms / (30 * 60000)) * 100;
  const decayMin = Math.round(alert.half_life_remaining_ms / 60000);

  const vote = (dir: 1 | -1) => {
    if (locked) return; // idempotent: one tap = one vote
    setLocked(true);
    const r = voteAlert(alert.alert_id, dir);
    setNote(r.ok ? null : t("একজনের ভোটে নিশ্চিত অ্যালার্ট বদলায় না — আটকে রাখা হয়েছে", "One vote cannot flip a confirmed alert — held for review"));
    window.setTimeout(() => setLocked(false), 600);
  };

  return (
    <Card className={live ? "p-5" : "p-5 opacity-70"}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${alert.status === AlertStatus.VERIFIED_ACTIVE ? "bg-danger-bg text-danger" : "bg-brand-soft text-brand-dark"}`}>{INCIDENT_ICON[alert.incident_type]}</span>
          <div className="min-w-0">
            <div className="truncate text-[17px] font-extrabold text-ink">{hubName(alert.hub_id, lang)}</div>
            <div className="text-[13px] text-ink-soft">{incidentName(alert.incident_type, lang)}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[28px] font-extrabold leading-none tabular-nums text-ink">{n(alert.confidence_pct.toFixed(1))}%</div>
          <div className="mt-1 text-[12px] font-bold text-ink-faint">R<sub>e</sub>(t)</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusPill status={alert.status} />
        <Pill tone="gray">+{n(up)} / −{n(down)} {t("ভোট", "votes")}</Pill>
      </div>

      <div className="mt-4 space-y-2.5">
        <div>
          <div className="mb-1 flex justify-between text-[12px] font-semibold text-ink-soft">
            <span>{t("বিশ্বাসযোগ্যতা", "Confidence")}</span>
            <span>{alert.confidence_pct >= 85 ? t("≥৮৫% = রাস্তা বন্ধ", "≥85% = road closed") : t("৮৫%-এ পৌঁছালে বন্ধ ধরা হবে", "closes the road at 85%")}</span>
          </div>
          <Meter pct={alert.confidence_pct} tone={tone} label={t("বিশ্বাসযোগ্যতা", "Confidence")} />
        </div>
        <div>
          <div className="mb-1 flex justify-between text-[12px] font-semibold text-ink-soft">
            <span>{t("৩০ মিনিটের হাফ-লাইফ", "30-minute half-life")}</span>
            <span className="tabular-nums">{n(decayMin)} {t("মি. বাকি", "min left")}</span>
          </div>
          <Meter pct={decayPct} tone="gray" label={t("ক্ষয়", "Decay")} />
        </div>
      </div>

      {live && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Btn size="sm" variant="outline" disabled={locked} icon={<ShieldCheck className="h-4 w-4" />} onClick={() => vote(1)}>
            {t("নিশ্চিত করুন (+১)", "Confirm (+1)")}
          </Btn>
          <Btn size="sm" variant="outline" disabled={locked} icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => vote(-1)}>
            {t("রাস্তা পরিষ্কার (−১)", "Mark cleared (−1)")}
          </Btn>
          <button type="button" onClick={() => overrideAlert(alert.alert_id)} className="ml-auto text-[12.5px] font-bold text-ink-faint underline-offset-2 hover:text-danger hover:underline">
            {t("অ্যাডমিন: ওভাররাইড ও ক্লিয়ার", "Admin: override & clear")}
          </button>
        </div>
      )}
      {note && <p role="status" className="mt-3 rounded-xl bg-warn-bg px-3 py-2 text-[12.5px] font-semibold text-warn">{note}</p>}
    </Card>
  );
}

function ReportForm() {
  const { lang, t } = useLang();
  const { reportIncident } = useDhakaPathStore();
  const [hub, setHub] = useState<HubId>(HubId.H_SHAHBAGH);
  const [incident, setIncident] = useState<IncidentType>(IncidentType.INTERSECTION_BLOCKADE);
  const [severity, setSeverity] = useState<1 | 2 | 3>(2);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = (h = hub, i = incident, s = severity) => {
    const r = reportIncident(h, i, s);
    setMsg(r.message === "corroborated"
      ? t("এই হাবে একই রিপোর্ট আগেই ছিল — আপনার ভোট যোগ হলো।", "This was already reported — your vote was added.")
      : t("রিপোর্ট জমা হয়েছে। অন্তত ৩ জন নিশ্চিত করলে তবেই রাস্তা বন্ধ ধরা হবে।", "Report received. It only closes the road once at least 3 people confirm."));
  };

  return (
    <Card className="p-5">
      <SectionTitle title={t("রাস্তার সমস্যা জানান", "Report a street problem")} sub={t("একজনের রিপোর্টে রুট বদলায় না — নিশ্চিতকরণ লাগে।", "One report never reroutes anyone — it needs confirmation.")} />
      <div className="mt-4 space-y-3">
        <Field label={t("কোন হাব?", "Which hub?")}>
          <select value={hub} onChange={(e) => setHub(e.target.value as HubId)} className={inputCls}>
            {HUB_IDS.map((h) => <option key={h} value={h}>{hubName(h, lang)}</option>)}
          </select>
        </Field>
        <Field label={t("কী ঘটেছে?", "What happened?")}>
          <select value={incident} onChange={(e) => setIncident(e.target.value as IncidentType)} className={inputCls}>
            {INCIDENTS.map((i) => <option key={i.value} value={i.value}>{lang === "bn" ? i.bn : i.en}</option>)}
          </select>
        </Field>
        <Field label={t("কতটা গুরুতর?", "How severe?")}>
          <Segmented<number> ariaLabel={t("গুরুত্ব", "Severity")} value={severity} onChange={(v) => setSeverity(v as 1 | 2 | 3)} options={[{ value: 1, label: t("সামান্য", "Minor") }, { value: 2, label: t("মাঝারি", "Moderate") }, { value: 3, label: t("তীব্র", "Severe") }]} />
        </Field>
        <Btn className="w-full" onClick={() => submit()}>{t("রিপোর্ট জমা দিন", "Submit report")}</Btn>
        <button type="button" onClick={() => { setHub(HubId.H_SHAHBAGH); setIncident(IncidentType.INTERSECTION_BLOCKADE); setSeverity(2); submit(HubId.H_SHAHBAGH, IncidentType.INTERSECTION_BLOCKADE, 2); }} className="w-full text-center text-[12.5px] font-bold text-brand-dark underline-offset-2 hover:underline">
          {t("পরীক্ষা: শাহবাগে একক অনিশ্চিত রিপোর্ট", "Test: one uncorroborated Shahbagh report")}
        </button>
        {msg && <p role="status" className="rounded-xl bg-brand-mint px-3 py-2 text-[13px] font-semibold text-brand-dark">{msg}</p>}
      </div>
    </Card>
  );
}

const CHECKABLE = CANONICAL_GRAPH_G0.filter((e) => e.mode === TransportMode.BUS || e.mode === TransportMode.LEGUNA || e.mode === TransportMode.RICKSHAW);

function FareChecker() {
  const { lang, t, n } = useLang();
  const { checkFare } = useDhakaPathStore();
  const [edgeId, setEdgeId] = useState("E_BUS_SURFACE_MIRPUR10_FARMGATE");
  const [fare, setFare] = useState("500");
  const [res, setRes] = useState<FareValidationResult | null>(null);

  const run = (id = edgeId, f = Number(fare)) => {
    if (!Number.isFinite(f)) return;
    setRes(checkFare(id, f));
  };

  return (
    <Card className="p-5">
      <SectionTitle title={t("ভাড়া যাচাই", "Fare sanity check")} sub={t("১০৳-এর নিচে বা ২.৫× বেস ভাড়ার ওপরে হলে আটকে যায়।", "Anything under 10 BDT or over 2.5× the base fare is blocked.")} />
      <div className="mt-4 space-y-3">
        <Field label={t("কোন রুট?", "Which link?")}>
          <select value={edgeId} onChange={(e) => setEdgeId(e.target.value)} className={inputCls}>
            {CHECKABLE.map((e) => (
              <option key={e.edge_id} value={e.edge_id}>{hubName(e.origin_hub_id, lang)} → {hubName(e.dest_hub_id, lang)} · {e.route_name}</option>
            ))}
          </select>
        </Field>
        <Field label={t("জমা দেওয়া ভাড়া (৳)", "Submitted fare (BDT)")}>
          <input type="number" inputMode="numeric" value={fare} onChange={(e) => setFare(e.target.value)} className={inputCls} />
        </Field>
        <Btn className="w-full" onClick={() => run()}>{t("যাচাই করুন", "Check fare")}</Btn>
        <div className="flex gap-2">
          <Btn size="sm" variant="danger" className="flex-1" onClick={() => { setEdgeId("E_BUS_SURFACE_MIRPUR10_FARMGATE"); setFare("400"); run("E_BUS_SURFACE_MIRPUR10_FARMGATE", 400); }}>{t("৪০০৳ ভুয়া ভাড়া", "Inject 400 BDT")}</Btn>
          <Btn size="sm" variant="danger" className="flex-1" onClick={() => { setEdgeId("E_BUS_SURFACE_MIRPUR10_FARMGATE"); setFare("500"); run("E_BUS_SURFACE_MIRPUR10_FARMGATE", 500); }}>{t("৫০০৳ ভুয়া ভাড়া", "Inject 500 BDT")}</Btn>
        </div>
        {res && (
          <div role="status" className={`rounded-2xl border p-3.5 ${res.isValid ? "border-[#CDEBD7] bg-brand-mint" : "border-danger-line bg-danger-bg"}`}>
            <div className={`flex items-center gap-2 text-[14px] font-extrabold ${res.isValid ? "text-brand-dark" : "text-danger"}`}>
              {res.isValid ? <CheckCircle2 className="h-5 w-5" /> : <Ban className="h-5 w-5" />}
              {res.isValid ? t("ভাড়া গ্রহণযোগ্য", "Fare accepted") : t("ভুয়া ভাড়া আটকানো হয়েছে", "Fake fare blocked")}
              <span className="ml-auto text-[12px] font-semibold tabular-nums text-ink-soft">{n(res.executionTimeMs.toFixed(2))} ms</span>
            </div>
            <p className="mt-1.5 break-words text-[12.5px] leading-snug text-ink-soft">
              {n(res.submittedFareBdt)} ৳ · {t("অনুমোদিত", "allowed")} {n(res.minAllowedBdt)}–{n(res.maxAllowedBdt)} ৳
            </p>
            {!res.isValid && <p className="mt-1 break-words font-mono text-[11px] text-danger">{res.status}</p>}
          </div>
        )}
      </div>
    </Card>
  );
}

function logIcon(status: ValidationStatus) {
  if (status === ValidationStatus.GRAPH_GROUNDED) return { tone: "green" as const, icon: <ShieldCheck className="h-3.5 w-3.5" /> };
  if (status === ValidationStatus.CONTRADICTORY_REPORT_QUARANTINED) return { tone: "amber" as const, icon: <Clock className="h-3.5 w-3.5" /> };
  if (status === ValidationStatus.ANOMALOUS_FARE_REJECTED) return { tone: "red" as const, icon: <Ban className="h-3.5 w-3.5" /> };
  return { tone: "red" as const, icon: <OctagonAlert className="h-3.5 w-3.5" /> };
}

function SafetyLog() {
  const { lang, t, n } = useLang();
  const { interceptionLogs } = useDhakaPathStore();
  return (
    <Card className="p-5 sm:p-6">
      <SectionTitle title={t("নিরাপত্তা লগ", "Safety log")} sub={t("ভুয়া ভাড়া, কাল্পনিক রুট ও বিতর্কিত রিপোর্ট যা আমরা আটকেছি।", "Fake fares, invented routes and disputed reports we stopped.")} />
      <ul className="mt-4 divide-y divide-line">
        {interceptionLogs.slice(0, 12).map((e) => {
          const s = logIcon(e.status);
          return (
            <li key={e.event_id} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={s.tone} icon={s.icon}>{validationName(e.status, lang)}</Pill>
                <span className="font-mono text-[10.5px] text-ink-faint">{e.status}</span>
                <span className="ml-auto text-[12px] font-semibold tabular-nums text-ink-faint">{n(e.execution_time_ms.toFixed(2))} ms</span>
              </div>
              <p className="break-words text-[13px] leading-snug text-ink-soft">{e.rejected_payload_summary}</p>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function AlertsTab() {
  const { t, n } = useLang();
  const { alerts, disruptedHubIds } = useDhakaPathStore();
  const order: Record<AlertStatus, number> = { VERIFIED_ACTIVE: 0, PENDING_CORROBORATION: 1, EXPIRED: 2, RESOLVED: 3 };
  const sorted = [...alerts].sort((a, b) => order[a.status] - order[b.status] || b.confidence_pct - a.confidence_pct);

  return (
    <div id="alerts" className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionTitle title={t("লাইভ অ্যালার্ট", "Live alerts")} sub={t("ভোট ও সময়ের সাথে বিশ্বাসযোগ্যতা হিসাব হয়; পুরনো রিপোর্ট নিজে থেকে মেয়াদ হারায়।", "Confidence updates with votes and time; stale reports expire on their own.")} />
          <Pill tone={disruptedHubIds.length > 0 ? "red" : "green"} icon={disruptedHubIds.length > 0 ? <OctagonAlert className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}>
            {disruptedHubIds.length > 0 ? `${n(disruptedHubIds.length)} ${t("হাব বন্ধ", "hubs blocked")}` : t("সব স্বাভাবিক", "All clear")}
          </Pill>
        </div>
        {sorted.length === 0 ? (
          <Card className="p-8 text-center text-[15px] font-semibold text-ink-soft">{t("কোনো সক্রিয় অ্যালার্ট নেই", "No active alerts")}</Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">{sorted.map((a) => <AlertCard key={a.alert_id} alert={a} />)}</div>
        )}
        <SafetyLog />
      </div>
      <div className="space-y-5 lg:sticky lg:top-[7.25rem] lg:self-start">
        <ReportForm />
        <FareChecker />
      </div>
    </div>
  );
}
