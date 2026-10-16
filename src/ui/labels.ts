// Localised names and mode styling shared by every screen.

import { AlertStatus, HubId, IncidentType, TransportMode, ValidationStatus } from "@/contracts/schema";
import type { Lang } from "@/lib/i18n";

const HUB_EN: Record<HubId, string> = {
  [HubId.H_UTTARA]: "Uttara",
  [HubId.H_MIRPUR10]: "Mirpur 10",
  [HubId.H_AGARGAON]: "Agargaon",
  [HubId.H_MOHAKHALI]: "Mohakhali",
  [HubId.H_BADDA]: "Badda",
  [HubId.H_BANASREE]: "Banasree",
  [HubId.H_MALIBAGH]: "Malibagh",
  [HubId.H_FARMGATE]: "Farmgate",
  [HubId.H_MOHAMMADPUR]: "Mohammadpur",
  [HubId.H_DHANMONDI]: "Dhanmondi",
  [HubId.H_SCIENCELAB]: "Science Lab",
  [HubId.H_SHAHBAGH]: "Shahbagh",
  [HubId.H_MOTIJHEEL]: "Motijheel",
  [HubId.H_JATRABARI]: "Jatrabari",
  [HubId.H_GULISTAN]: "Gulistan",
};

const HUB_BN: Record<HubId, string> = {
  [HubId.H_UTTARA]: "উত্তরা",
  [HubId.H_MIRPUR10]: "মিরপুর ১০",
  [HubId.H_AGARGAON]: "আগারগাঁও",
  [HubId.H_MOHAKHALI]: "মহাখালী",
  [HubId.H_BADDA]: "বাড্ডা",
  [HubId.H_BANASREE]: "বনশ্রী",
  [HubId.H_MALIBAGH]: "মালিবাগ",
  [HubId.H_FARMGATE]: "ফার্মগেট",
  [HubId.H_MOHAMMADPUR]: "মোহাম্মদপুর",
  [HubId.H_DHANMONDI]: "ধানমন্ডি",
  [HubId.H_SCIENCELAB]: "সায়েন্স ল্যাব",
  [HubId.H_SHAHBAGH]: "শাহবাগ",
  [HubId.H_MOTIJHEEL]: "মতিঝিল",
  [HubId.H_JATRABARI]: "যাত্রাবাড়ী",
  [HubId.H_GULISTAN]: "গুলিস্তান",
};

export function hubName(id: HubId, lang: Lang): string {
  return lang === "bn" ? HUB_BN[id] ?? id : HUB_EN[id] ?? id;
}

export const HUB_IDS = Object.values(HubId) as HubId[];

interface ModeStyle {
  readonly bn: string;
  readonly en: string;
  readonly color: string;
  readonly icon: string | null;
}

export const MODE_STYLE: Record<TransportMode, ModeStyle> = {
  [TransportMode.METRO]: { bn: "মেট্রো রেল", en: "Metro rail", color: "#16A34A", icon: "/icons/mode-metro.svg" },
  [TransportMode.BUS]: { bn: "বাস", en: "Bus", color: "#2563EB", icon: "/icons/mode-bus.svg" },
  [TransportMode.LEGUNA]: { bn: "লেগুনা", en: "Leguna", color: "#9333EA", icon: "/icons/mode-leguna.svg" },
  [TransportMode.RICKSHAW]: { bn: "রিকশা / সিএনজি", en: "Rickshaw / CNG", color: "#D97706", icon: "/icons/mode-rickshaw.svg" },
  [TransportMode.WALK]: { bn: "হাঁটা", en: "Walk", color: "#64748B", icon: null },
};

export function modeName(mode: TransportMode, lang: Lang): string {
  const s = MODE_STYLE[mode];
  return s ? (lang === "bn" ? s.bn : s.en) : String(mode);
}

export const INCIDENTS: ReadonlyArray<{ value: IncidentType; bn: string; en: string }> = [
  { value: IncidentType.WATERLOGGING, bn: "জলাবদ্ধতা", en: "Waterlogging" },
  { value: IncidentType.INTERSECTION_BLOCKADE, bn: "মোড় অবরোধ", en: "Intersection blockade" },
  { value: IncidentType.SEVERE_GRIDLOCK, bn: "তীব্র যানজট", en: "Severe gridlock" },
  { value: IncidentType.ROAD_CONSTRUCTION, bn: "সড়ক নির্মাণ", en: "Road works" },
];

export function incidentName(type: IncidentType, lang: Lang): string {
  const found = INCIDENTS.find((i) => i.value === type);
  return found ? (lang === "bn" ? found.bn : found.en) : String(type);
}

export function alertStatusName(status: AlertStatus, lang: Lang): string {
  const map: Record<AlertStatus, [string, string]> = {
    [AlertStatus.VERIFIED_ACTIVE]: ["নিশ্চিত — বন্ধ", "Confirmed — blocked"],
    [AlertStatus.PENDING_CORROBORATION]: ["নিশ্চিতকরণ বাকি", "Needs confirmation"],
    [AlertStatus.EXPIRED]: ["মেয়াদ শেষ", "Expired"],
    [AlertStatus.RESOLVED]: ["পরিষ্কার", "Cleared"],
  };
  const [bn, en] = map[status] ?? [status, status];
  return lang === "bn" ? bn : en;
}

export function validationName(status: ValidationStatus, lang: Lang): string {
  const map: Record<ValidationStatus, [string, string]> = {
    [ValidationStatus.GRAPH_GROUNDED]: ["যাচাইকৃত", "Verified"],
    [ValidationStatus.ANOMALOUS_FARE_REJECTED]: ["ভুয়া ভাড়া আটকানো", "Fake fare blocked"],
    [ValidationStatus.CONTRADICTORY_REPORT_QUARANTINED]: ["বিতর্কিত রিপোর্ট আটকে রাখা", "Disputed report held"],
    [ValidationStatus.GROUNDING_INTERCEPTED]: ["কাল্পনিক রুট আটকানো", "Fake route blocked"],
  };
  const [bn, en] = map[status] ?? [status, status];
  return lang === "bn" ? bn : en;
}
