"use client";

// Hub ride-share board (community + bot): commuters waiting at the same hub pool a rickshaw/CNG
// and the bot shows the exact per-person split. Join is idempotent (double-clicks never add a
// second seat), and leaving rolls the fare back to solo.

import React, { useState } from "react";
import { Bot, UserRound } from "lucide-react";
import { PoolBoardEntry, useDhakaPathStore } from "@/store/useDhakaPathStore";
import { useLang } from "@/lib/i18n";
import { computePoolSplit } from "@/features/feature-3-trust-cms/rideSharePool";
import { cn } from "@/lib/utils";
import { Btn, Card, Pill } from "../kit";
import { hubName } from "../labels";
import { ScenarioPreset } from "@/contracts/schema";

function PoolRow({ entry }: { entry: PoolBoardEntry }) {
  const { lang, t, n } = useLang();
  const { joinPool, leavePool, activePreset } = useDhakaPathStore();
  const [locked, setLocked] = useState(false);
  const surge = activePreset === ScenarioPreset.PEAK_CRISIS_SURGE ? 1.8 : 1.0;
  const nextSize = Math.min(4, entry.size + 1);
  const next = computePoolSplit(entry.edge.base_fare_bdt, surge, nextSize);

  const act = () => {
    if (locked) return; // idempotency lock against rapid double-clicks
    setLocked(true);
    if (entry.joined) leavePool(entry.edge.edge_id);
    else joinPool(entry.edge.edge_id);
    window.setTimeout(() => setLocked(false), 600);
  };

  return (
    <li className="rounded-2xl border border-line p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[15px] font-bold text-ink">{entry.edge.route_name}</div>
          <div className="mt-0.5 text-[13px] text-ink-soft">
            {hubName(entry.edge.origin_hub_id, lang)} · {entry.edge.boarding_landmark}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1" aria-label={`${entry.size}/4`}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={cn("grid h-7 w-7 place-items-center rounded-full border-2", i < entry.size ? "border-brand bg-brand-soft text-brand-dark" : "border-dashed border-line text-ink-faint")}>
              <UserRound className="h-3.5 w-3.5" />
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Pill tone="gray">{t("একা", "Solo")} {n(entry.soloBdt)} ৳</Pill>
        <Pill tone="green">
          {entry.joined ? t("আপনার ভাগ", "Your share") : t("যোগ দিলে", "If you join")} {n(entry.joined ? entry.perPersonBdt : next.perPersonFareBdt)} ৳
        </Pill>
        <Pill tone="green">−{n(entry.joined ? entry.savingsBdt : next.savingsBdt)} ৳ {t("সাশ্রয়", "saved")}</Pill>
      </div>

      <p className="mt-3 flex items-start gap-2 rounded-xl bg-brand-mint px-3 py-2 text-[13px] leading-snug text-ink-soft">
        <Bot className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        {t(
          `বট: ${n(nextSize)} জনে ভাগ করলে জন প্রতি ${n(next.perPersonFareBdt)} ৳ (${n(next.baseFareBdt)} × ${n(surge.toFixed(1))} ÷ ${n(nextSize)})`,
          `Bot: split by ${nextSize}, each pays ${next.perPersonFareBdt} BDT (${next.baseFareBdt} × ${surge.toFixed(1)} ÷ ${nextSize})`
        )}
      </p>

      <Btn size="sm" variant={entry.joined ? "outline" : "primary"} className="mt-3" disabled={locked} onClick={act}>
        {entry.joined
          ? `${t("পুল ছাড়ুন", "Leave pool")} (${t("একা", "solo")} ${n(entry.soloBdt)} ৳)`
          : `${t("পুলে যোগ দিন", "Join pool")} (${n(entry.size)}/৪ → ${n(nextSize)}/৪) · ${t("ভাগ লক", "lock split")}`}
      </Btn>
    </li>
  );
}

export function PoolBoard() {
  const { t } = useLang();
  const { poolBoard } = useDhakaPathStore();
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-[20px] font-extrabold text-ink">{t("রাইড-শেয়ার বোর্ড", "Ride-share board")}</h2>
      <p className="mt-1 text-[14px] text-ink-soft">{t("একই হাবের সহযাত্রীরা রিকশা/সিএনজি ভাগ করে ভাড়া কমান।", "Commuters at the same hub split a rickshaw/CNG and cut the fare.")}</p>
      <ul className="mt-4 space-y-3">
        {poolBoard.map((entry) => (
          <PoolRow key={entry.edge.edge_id} entry={entry} />
        ))}
      </ul>
    </Card>
  );
}
