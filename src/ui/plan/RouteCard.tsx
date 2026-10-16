"use client";

// A ranked route: headline fare (student vs regular), time and transfers, a step-by-step leg
// timeline with boarding landmarks, rickshaw surge ranges, and the action footer
// (join a ride-share pool, export the offline card + voice briefing).

import React from "react";
import Image from "next/image";
import { BadgeCheck, Download, Footprints, GraduationCap, MapPin, ShieldCheck, Volume2 } from "lucide-react";
import { RankedRoute, RouteTag, useDhakaPathStore } from "@/store/useDhakaPathStore";
import { CANONICAL_GRAPH_G0 } from "@/contracts/canonicalGraph";
import { RouteLeg, TransportMode } from "@/contracts/schema";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Btn, Card, Pill } from "../kit";
import { MODE_STYLE, hubName, modeName } from "../labels";

const TAG: Record<RouteTag, { bn: string; en: string }> = {
  OPTIMAL: { bn: "সেরা ভারসাম্য (P*)", en: "Best balance (P*)" },
  LOWEST_FARE: { bn: "সবচেয়ে কম খরচ", en: "Lowest fare" },
  FASTEST: { bn: "দ্রুততম", en: "Fastest" },
};

export function ModeChip({ mode, size = 44 }: { mode: TransportMode; size?: number }) {
  const s = MODE_STYLE[mode];
  return (
    <span className="grid shrink-0 place-items-center overflow-hidden rounded-2xl bg-brand-mint" style={{ width: size, height: size, boxShadow: `inset 0 0 0 1.5px ${s.color}33` }}>
      {s.icon ? (
        <Image src={s.icon} alt="" width={size} height={size} unoptimized className="h-[82%] w-[82%] object-contain" />
      ) : (
        <Footprints className="h-5 w-5" style={{ color: s.color }} />
      )}
    </span>
  );
}

function LegRow({ leg, isStudent, last }: { leg: RouteLeg; isStudent: boolean; last: boolean }) {
  const { lang, t, n } = useLang();
  const s = MODE_STYLE[leg.mode];
  const edge = CANONICAL_GRAPH_G0.find((e) => e.edge_id === leg.edge_id);
  const minutes = Math.max(1, Math.round(leg.effective_duration_ms / 60000));
  const discounted = leg.mode === TransportMode.BUS && leg.effective_fare_bdt < leg.regular_fare_bdt;
  const isHub = leg.origin_hub_id === leg.dest_hub_id;

  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      {!last && <span aria-hidden="true" className="absolute left-[21px] top-12 h-[calc(100%-2.75rem)] w-0.5" style={{ background: `${s.color}55` }} />}
      <ModeChip mode={leg.mode} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[12px] font-extrabold uppercase tracking-wide" style={{ color: s.color }}>
              {modeName(leg.mode, lang)}
            </div>
            <div className="truncate text-[15px] font-bold text-ink">{leg.route_name}</div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[17px] font-extrabold tabular-nums text-ink">{n(leg.effective_fare_bdt)} ৳</div>
            {discounted && <div className="text-[12px] tabular-nums text-ink-faint line-through">{n(leg.regular_fare_bdt)} ৳</div>}
          </div>
        </div>
        <div className="mt-1 flex items-start gap-1.5 text-[13px] text-ink-soft">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
          <span>
            {isHub ? "" : `${hubName(leg.origin_hub_id, lang)} → ${hubName(leg.dest_hub_id, lang)} · `}
            {t("উঠুন", "Board")}: {leg.boarding_landmark}
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Pill tone="gray">{n(minutes)} {t("মিনিট", "min")}</Pill>
          {edge && !isHub && <Pill tone="gray">{n(edge.distance_km.toFixed(1))} {t("কিমি", "km")}</Pill>}
          {discounted && <Pill tone="green" icon={<GraduationCap className="h-3 w-3" />}>{t("স্টুডেন্ট ৫০%", "Student 50%")}</Pill>}
          {leg.mode === TransportMode.METRO && isStudent && <Pill tone="gray">{t("মেট্রোতে স্টুডেন্ট ছাড় নেই", "No student discount on metro")}</Pill>}
          {leg.mode === TransportMode.RICKSHAW && leg.surge_multiplier > 1 && <Pill tone="amber">{t("সার্জ", "Surge")} ×{n(leg.surge_multiplier.toFixed(1))}</Pill>}
          {leg.mode === TransportMode.RICKSHAW && leg.pool_size_count > 1 && <Pill tone="green">{t("পুল", "Pool")} {n(leg.pool_size_count)}/৪</Pill>}
        </div>
        {leg.mode === TransportMode.RICKSHAW && edge && (
          <div className="mt-1.5 text-[12.5px] text-ink-soft">
            {t("অমিটারযুক্ত ভাড়ার পরিসর", "Non-metered fare range")}:{" "}
            <strong className="tabular-nums text-ink">
              {n(edge.base_fare_bdt)}–{n(Math.ceil(edge.base_fare_bdt * 2.5))} ৳
            </strong>{" "}
            ({t("স্বাভাবিক", "baseline")} {n(edge.base_fare_bdt)} ৳ · {t("বৃষ্টি/জ্যামে সার্জ ×১.৮–২.৫", "rain/rush surge ×1.8–2.5")})
          </div>
        )}
      </div>
    </li>
  );
}

export function RouteCard({
  ranked,
  index,
  onExport,
  exporting,
}: {
  ranked: RankedRoute;
  index: number;
  onExport: (route: RankedRoute["route"]) => void;
  exporting: boolean;
}) {
  const { lang, t, n } = useLang();
  const { selectedRouteId, selectRoute, activeQuery, poolBoard, joinPool, leavePool } = useDhakaPathStore();
  const r = ranked.route;
  const selected = r.route_id === selectedRouteId;
  const minutes = Math.round(r.total_duration_ms / 60000);
  const saving = r.total_regular_fare_bdt - r.total_effective_fare_bdt;
  const totalKm = r.legs.reduce((s, l) => {
    const e = CANONICAL_GRAPH_G0.find((x) => x.edge_id === l.edge_id);
    return s + (e && l.origin_hub_id !== l.dest_hub_id ? e.distance_km : 0);
  }, 0);
  const myPools = poolBoard.filter((p) => r.legs.some((l) => l.edge_id === p.edge.edge_id));

  return (
    <Card className={cn("overflow-hidden transition-all", selected ? "border-brand shadow-lift ring-2 ring-brand/15" : "hover:border-[#BFDCC9]")}>
      <button type="button" onClick={() => selectRoute(r.route_id)} aria-expanded={selected} aria-label={`${t("রুট", "Route")} ${index + 1}`} className="block w-full p-5 text-left">
        <div className="flex flex-wrap items-center gap-1.5">
          {ranked.tags.map((tag) => (
            <Pill key={tag} tone={tag === "OPTIMAL" ? "green" : "blue"}>{lang === "bn" ? TAG[tag].bn : TAG[tag].en}</Pill>
          ))}
          <Pill tone="green" icon={<ShieldCheck className="h-3.5 w-3.5" />}>
            {t("যাচাইকৃত রুট", "Verified route")} <span className="font-mono text-[10px] opacity-70">V(P*)=1</span>
          </Pill>
        </div>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-[40px] font-extrabold leading-none tracking-tight tabular-nums text-brand">{n(r.total_effective_fare_bdt)} ৳</span>
              {saving > 0 && <span className="text-[15px] tabular-nums text-ink-faint line-through">{n(r.total_regular_fare_bdt)} ৳</span>}
            </div>
            {saving > 0 && (
              <div className="mt-1 inline-flex items-center gap-1 text-[13px] font-bold text-brand-dark">
                <BadgeCheck className="h-4 w-4" />
                {t("স্টুডেন্ট পাসে", "Student pass saves")} {n(saving)} ৳ {t("সাশ্রয়", "")}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-[24px] font-extrabold tabular-nums text-ink">{n(minutes)} {t("মিনিট", "min")}</div>
            <div className="text-[13px] font-semibold text-ink-soft">
              {n(totalKm.toFixed(1))} {t("কিমি", "km")} · {n(r.transfers_count)} {r.transfers_count === 1 ? t("ট্রান্সফার", "transfer") : t("ট্রান্সফার", "transfers")}
            </div>
          </div>
        </div>
      </button>

      {selected && (
        <div className="border-t border-line px-5 pb-5 pt-4">
          <ol>
            {r.legs.map((leg, i) => (
              <LegRow key={`${leg.edge_id}-${i}`} leg={leg} isStudent={activeQuery.is_student} last={i === r.legs.length - 1} />
            ))}
          </ol>

          {myPools.map((p) => (
            <div key={p.edge.edge_id} className="mt-4 rounded-2xl border border-[#CDEBD7] bg-brand-mint p-3.5">
              <div className="text-[14px] font-extrabold text-ink">{t("এই রিকশা ভাগ করুন", "Share this rickshaw")}</div>
              <p className="mt-0.5 text-[13px] text-ink-soft">
                {p.joined
                  ? `${t("আপনি পুলে আছেন", "You are in the pool")} (${n(p.size)}/৪) — ${n(p.perPersonBdt)} ৳ ${t("জন প্রতি", "each")}`
                  : `${n(p.size)}/৪ ${t("জন অপেক্ষায়", "waiting")} — ${t("যোগ দিলে জন প্রতি", "join for")} ${n(p.perPersonBdt)} ৳`}
              </p>
              <Btn
                size="sm"
                variant={p.joined ? "outline" : "primary"}
                className="mt-2.5"
                onClick={() => (p.joined ? leavePool(p.edge.edge_id) : joinPool(p.edge.edge_id))}
              >
                {p.joined ? `${t("পুল ছাড়ুন", "Leave pool")} (${t("একা", "solo")} ${n(p.soloBdt)} ৳)` : `${t("পুলে যোগ দিন", "Join pool")} (${n(p.size)}/৪ → ${n(Math.min(4, p.size + 1))}/৪)`}
              </Btn>
            </div>
          ))}

          <div className="mt-4 flex flex-wrap gap-2">
            <Btn variant="soft" busy={exporting} icon={<Download className="h-4 w-4" />} onClick={() => onExport(r)}>
              {t("অফলাইন কার্ড (<৪৫ KB) + অডিও", "Offline card (<45 KB) + audio")}
            </Btn>
            <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-faint">
              <Volume2 className="h-4 w-4" />
              {t("ইন্টারনেট ছাড়াই চলে", "works with no internet")}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
