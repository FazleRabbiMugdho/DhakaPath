// ==============================================================================
// src/features/feature-1-commute/hubMatching.ts
// Shared, boundary-aware hub/alias matching for the parser, chat engine and OCR.
// Latin aliases are matched as whole words (so "du" does not match "during");
// Bengali aliases are matched with Bengali-letter boundaries (so "বাদ" inside
// "সায়েদাবাদ" is not treated as a separate word).
// ==============================================================================

import { HubId } from "../../contracts/schema";
import { CANONICAL_HUBS } from "../../contracts/canonicalGraph";

export interface HubMention {
  readonly hub_id: HubId;
  readonly start: number;
  readonly end: number;
  readonly matched: string;
  readonly alias: string;
}

const EXTRA_ALIASES: Record<HubId, string[]> = {
  [HubId.H_UTTARA]: ["uttara", "uttora", "উত্তরা", "house building", "housebuilding", "azampur", "diabari", "হাউজবিল্ডিং", "উত্তরা উত্তর"],
  [HubId.H_MIRPUR10]: ["mirpur 10", "mirpur-10", "mirpur10", "mirpur", "মিরপুর ১০", "মিরপুর 10", "মিরপুর", "golchottor", "গোলচত্বর"],
  [HubId.H_AGARGAON]: ["agargaon", "agar gaon", "আগারগাঁও", "passport office", "agargao"],
  [HubId.H_MOHAKHALI]: ["mohakhali", "maakhali", "মহাখালী", "wireless"],
  [HubId.H_BADDA]: ["badda", "বাড্ডা", "badda link road", "badda link", "middle badda", "link road"],
  [HubId.H_BANASREE]: ["banasree", "bonosree", "বনশ্রী", "rampura bridge", "rampura"],
  [HubId.H_MALIBAGH]: ["malibagh", "malibag", "মালিবাগ", "mouchak", "মৌচাক", "railgate"],
  [HubId.H_FARMGATE]: ["farmgate", "farm gate", "ফার্মগেট", "ফার্ম গেট", "ananda", "ananda cinema"],
  [HubId.H_MOHAMMADPUR]: ["mohammadpur", "mohammodpur", "মোহাম্মদপুর", "town hall", "asad gate", "shiya mosjid"],
  [HubId.H_DHANMONDI]: ["dhanmondi", "dhanmandi", "ধানমন্ডি", "ধানমন্ডী", "dhanmondi 27", "dhanmondi 32"],
  [HubId.H_SCIENCELAB]: ["science lab", "sciencelab", "সায়েন্স ল্যাব", "সায়েন্স ল্যাব", "city college"],
  [HubId.H_SHAHBAGH]: ["shahbagh", "shahbag", "শাহবাগ", "tsc", "du", "pg hospital", "dhaka university"],
  [HubId.H_GULISTAN]: ["gulistan", "গুলিস্তান", "zero point", "fulbaria"],
  [HubId.H_MOTIJHEEL]: ["motijheel", "motijhil", "matijheel", "মতিঝিল", "shapla chottor", "শাপলা চত্বর", "dilkusha"],
  [HubId.H_JATRABARI]: ["jatrabari", "jattrabari", "jattrobari", "যাত্রাবাড়ী", "যাত্রাবাড়ি", "যাত্রাবাড়ী", "sayedabad", "সায়েদাবাদ", "সায়েদাবাদ"],
};

const ALL_ALIASES: Record<HubId, ReadonlyArray<string>> = Object.fromEntries(
  Object.values(HubId).map((hubId) => {
    const aliases = new Set<string>();
    for (const alias of [...EXTRA_ALIASES[hubId], ...CANONICAL_HUBS[hubId].keywords]) {
      const cleaned = alias.trim();
      if (cleaned) aliases.add(cleaned);
    }
    return [hubId, Array.from(aliases)];
  })
) as unknown as Record<HubId, ReadonlyArray<string>>;

const BENGALI_LETTER = /[\u0980-\u09FF]/;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function aliasPattern(alias: string): RegExp {
  const parts = alias.split(/\s+/).filter(Boolean).map(escapeRegex);
  const body = parts.join("[\\s_-]*");
  const first = alias[0] ?? "";
  const last = alias[alias.length - 1] ?? "";
  const prefix = BENGALI_LETTER.test(first) ? "(?<![\\u0980-\\u09FF])" : "(?<![A-Za-z0-9])";
  const suffix = BENGALI_LETTER.test(last) ? "(?![\\u0980-\\u09FF])" : "(?![A-Za-z0-9])";
  return new RegExp(`${prefix}${body}${suffix}`, "giu");
}

// Longest aliases first, so "mirpur 10" wins over "mirpur" at the same offset.
const COMPILED_ALIASES: ReadonlyArray<{ hub_id: HubId; alias: string; regex: RegExp }> =
  Object.entries(ALL_ALIASES)
    .flatMap(([hub_id, aliases]) => aliases.map((alias) => ({ hub_id: hub_id as HubId, alias, regex: aliasPattern(alias) })))
    .sort((a, b) => b.alias.length - a.alias.length);

export function findHubMentions(text: string): HubMention[] {
  if (!text || typeof text !== "string") return [];
  const found: HubMention[] = [];

  for (const item of COMPILED_ALIASES) {
    item.regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = item.regex.exec(text)) !== null) {
      if (match[0].length === 0) {
        item.regex.lastIndex += 1;
        continue;
      }
      found.push({
        hub_id: item.hub_id,
        start: match.index,
        end: match.index + match[0].length,
        matched: match[0],
        alias: item.alias,
      });
    }
  }

  found.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const accepted: HubMention[] = [];
  for (const mention of found) {
    if (accepted.some((existing) => mention.start < existing.end && mention.end > existing.start)) continue;
    accepted.push(mention);
  }
  return accepted;
}

export function extractHubFromText(text: string): HubId | null {
  return findHubMentions(text)[0]?.hub_id ?? null;
}

export interface ClauseBounds {
  readonly start: number;
  readonly end: number;
}

const CLAUSE_BREAKS = /[,;.!?।\n]/;

export function clauseBounds(text: string, index: number): ClauseBounds {
  let start = 0;
  let end = text.length;
  for (let i = index - 1; i >= 0; i--) {
    if (CLAUSE_BREAKS.test(text[i])) {
      start = i + 1;
      break;
    }
  }
  for (let i = index; i < text.length; i++) {
    if (CLAUSE_BREAKS.test(text[i])) {
      end = i;
      break;
    }
  }
  return { start, end };
}

export function clauseContains(text: string, index: number, pattern: RegExp): boolean {
  const { start, end } = clauseBounds(text, index);
  const clause = text.slice(start, end);
  pattern.lastIndex = 0;
  return pattern.test(clause);
}

const INCIDENT_WORD_RE = /\b(?:pani|flood|flooded|waterlog|waterlogging|water|dube|blockade|blocked|block|jam|gridlock|traffic|construction|khondol|bhanga)\b|পানি|জলজট|বন্যা|ডুবে|উঠেছে|উঠছে|রাস্তা\s*বন্ধ|ব্লকেড|জ্যাম|যানজট|সংস্কার|ভাঙা/giu;

export function findIncidentHub(text: string, mentions: ReadonlyArray<HubMention>): HubId | null {
  if (mentions.length === 0) return null;
  const keywordIndexes: number[] = [];
  INCIDENT_WORD_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = INCIDENT_WORD_RE.exec(text)) !== null) {
    keywordIndexes.push(match.index);
    if (match[0].length === 0) INCIDENT_WORD_RE.lastIndex += 1;
  }
  if (keywordIndexes.length === 0) return mentions[0].hub_id;

  // Prefer a hub that shares a clause with an incident keyword.
  for (const mention of mentions) {
    const { start, end } = clauseBounds(text, mention.start);
    if (keywordIndexes.some((idx) => idx >= start && idx < end)) return mention.hub_id;
  }

  // Otherwise choose the mention closest to any incident keyword.
  let best = mentions[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const mention of mentions) {
    for (const idx of keywordIndexes) {
      const distance = idx < mention.start ? mention.start - idx : idx - mention.end;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = mention;
      }
    }
  }
  return best.hub_id;
}

export function hasIncidentKeyword(text: string): boolean {
  INCIDENT_WORD_RE.lastIndex = 0;
  return INCIDENT_WORD_RE.test(text);
}

export function normalizeDigitsToAscii(text: string): string {
  const bengali = "০১২৩৪৫৬৭৮৯";
  return text.replace(/[০-৯]/g, (digit) => String(bengali.indexOf(digit)));
}
