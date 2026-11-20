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
  [HubId.H_UTTARA]: [
    "uttara",
    "uttora",
    "উত্তরা",
    "house building",
    "housebuilding",
    "azampur",
    "diabari",
    "uttara north",
    "uttara south",
    "uttara center",
    "sector 3",
    "sector 7",
    "sector 10",
    "হাউজবিল্ডিং",
    "উত্তরা উত্তর",
  ],
  [HubId.H_MIRPUR10]: [
    "mirpur 10",
    "mirpur-10",
    "mirpur10",
    "mirpur",
    "mirpur 1",
    "mirpur 2",
    "mirpur 11",
    "mirpur 12",
    "mirpur 14",
    "মিরপুর ১০",
    "মিরপুর 10",
    "মিরপুর",
    "golchottor",
    "গোলচত্বর",
  ],
  [HubId.H_AGARGAON]: [
    "agargaon",
    "agar gaon",
    "agargoan",
    "agargaun",
    "agargao",
    "passport office",
    "agargaon metro",
    "আগারগাঁও",
  ],
  [HubId.H_MOHAKHALI]: [
    "mohakhali",
    "moakhali",
    "maakhali",
    "mohakhali wireless",
    "wireless gate",
    "wireless",
    "mohakhali bus terminal",
    "মহাখালী",
    "ওয়্যারলেস",
  ],
  [HubId.H_BADDA]: [
    "badda",
    "middle badda",
    "north badda",
    "south badda",
    "বাড্ডা",
    "badda link road",
    "badda link",
    "link road",
    "লিঙ্ক রোড",
  ],
  [HubId.H_BANASREE]: [
    "banasree",
    "bonosree",
    "bonoshree",
    "banashree",
    "বনশ্রী",
    "rampura bridge",
    "rampura",
    "রামপুরা",
  ],
  [HubId.H_MALIBAGH]: [
    "malibagh",
    "malibag",
    "মালিবাগ",
    "mouchak",
    "moucak",
    "railgate",
    "malibag mor",
    "মৌচাক",
  ],
  [HubId.H_FARMGATE]: [
    "farmgate",
    "farm gate",
    "framgate",
    "farmget",
    "farmgat",
    "farm gte",
    "ফার্মগেট",
    "ফার্ম গেট",
    "ananda",
    "ananda cinema",
    "khamarbari",
  ],
  [HubId.H_MOHAMMADPUR]: [
    "mohammadpur",
    "mohammodpur",
    "mohmadpur",
    "mohamadpur",
    "mahammadpur",
    "mohammad pur",
    "mohammod pur",
    "mdpur",
    "মোহাম্মদপুর",
    "town hall",
    "townhall",
    "asad gate",
    "asadgate",
    "shiya mosjid",
    "shia masjid",
    "ring road",
    "tajmahal road",
  ],
  [HubId.H_DHANMONDI]: [
    "dhanmondi",
    "dhanmandi",
    "danmondi",
    "ধানমন্ডি",
    "ধানমন্ডী",
    "dhanmondi 27",
    "dhanmondi 32",
    "kalabagan",
    "sobhanbag",
    "shukrabad",
  ],
  [HubId.H_SCIENCELAB]: [
    "science lab",
    "sciencelab",
    "science laboratory",
    "সায়েন্স ল্যাব",
    "সায়েন্স ল্যাব",
    "city college",
    "new market",
    "nilkhet",
  ],
  [HubId.H_SHAHBAGH]: [
    "shahbagh",
    "shahbag",
    "shahbaag",
    "shahbag mor",
    "শাহবাগ",
    "tsc",
    "du",
    "pg hospital",
    "bsmmu",
    "dhaka university",
  ],
  [HubId.H_GULISTAN]: [
    "gulistan",
    "golistan",
    "gulestan",
    "গুলিস্তান",
    "zero point",
    "fulbaria",
    "paltan",
    "stadium",
  ],
  [HubId.H_MOTIJHEEL]: [
    "motijheel",
    "motijhil",
    "matijheel",
    "motijel",
    "matijhil",
    "মতিঝিল",
    "shapla chottor",
    "shapla",
    "শাপলা চত্বর",
    "dilkusha",
    "bangladesh bank",
  ],
  [HubId.H_JATRABARI]: [
    "jatrabari",
    "jattrabari",
    "jattrobari",
    "যাত্রাবাড়ী",
    "যাত্রাবাড়ি",
    "যাত্রাবাড়ী",
    "sayedabad",
    "saydabad",
    "sayedabaad",
    "dholairpar",
    "সায়েদাবাদ",
    "সায়েদাবাদ",
  ],
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

// Bengali is agglutinative: place names take case and definite suffixes
// (ফার্মগেট -> ফার্মগেটে, মিরপুর -> মিরপুরের, শাহবাগ -> শাহবাগের). A strict
// "no Bengali letter may follow" boundary rejects every inflected form, so a
// short, closed list of suffixes is allowed before the boundary check.
const BENGALI_CASE_SUFFIX =
  "(?:য়ের|টিতে|টায়|টার|ের|তে|কে|টা|টি|য়ে|ে|য়)?";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function aliasPattern(alias: string): RegExp {
  const parts = alias.split(/\s+/).filter(Boolean).map(escapeRegex);
  const body = parts.join("[\\s_-]*");
  const first = alias[0] ?? "";
  const last = alias[alias.length - 1] ?? "";
  const prefix = BENGALI_LETTER.test(first) ? "(?<![\\u0980-\\u09FF])" : "(?<![A-Za-z0-9])";
  const suffix = BENGALI_LETTER.test(last)
    ? `${BENGALI_CASE_SUFFIX}(?![\\u0980-\\u09FF])`
    : "(?![A-Za-z0-9])";
  return new RegExp(`${prefix}${body}${suffix}`, "giu");
}

// Longest aliases first, so "mirpur 10" wins over "mirpur" at the same offset.
const COMPILED_ALIASES: ReadonlyArray<{ hub_id: HubId; alias: string; regex: RegExp }> =
  Object.entries(ALL_ALIASES)
    .flatMap(([hub_id, aliases]) => aliases.map((alias) => ({ hub_id: hub_id as HubId, alias, regex: aliasPattern(alias) })))
    .sort((a, b) => b.alias.length - a.alias.length);

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;
  const m = a.length;
  const n = b.length;
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev;
      } else {
        dp[j] = Math.min(prev + 1, dp[j] + 1, dp[j - 1] + 1);
      }
      prev = temp;
    }
  }
  return dp[n];
}

const FUZZY_PRIMARY_HUBS: ReadonlyArray<{ hub_id: HubId; name: string }> = [
  { hub_id: HubId.H_UTTARA, name: "uttara" },
  { hub_id: HubId.H_MIRPUR10, name: "mirpur" },
  { hub_id: HubId.H_AGARGAON, name: "agargaon" },
  { hub_id: HubId.H_MOHAKHALI, name: "mohakhali" },
  { hub_id: HubId.H_BADDA, name: "badda" },
  { hub_id: HubId.H_BANASREE, name: "banasree" },
  { hub_id: HubId.H_MALIBAGH, name: "malibagh" },
  { hub_id: HubId.H_FARMGATE, name: "farmgate" },
  { hub_id: HubId.H_MOHAMMADPUR, name: "mohammadpur" },
  { hub_id: HubId.H_DHANMONDI, name: "dhanmondi" },
  { hub_id: HubId.H_SCIENCELAB, name: "sciencelab" },
  { hub_id: HubId.H_SHAHBAGH, name: "shahbagh" },
  { hub_id: HubId.H_GULISTAN, name: "gulistan" },
  { hub_id: HubId.H_MOTIJHEEL, name: "motijheel" },
  { hub_id: HubId.H_JATRABARI, name: "jatrabari" },
];

const NON_HUB_STOPWORDS = new Set([
  "about", "after", "again", "alert", "allow", "another", "around", "baddass",
  "before", "better", "block", "bridge", "budget", "buses", "cannot", "cheapest",
  "commute", "current", "detour", "during", "faster", "fastest", "first",
  "flooded", "going", "minute", "minutes", "normal", "please", "report", "routes",
  "school", "second", "street", "student", "ticket", "traffic", "transit", "travel",
  "verified", "walkbridge", "without"
]);

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

  // Fuzzy token check for misspelled place names (e.g. "mohmadpur", "framgate", "dhanmandi")
  const wordRe = /\b[A-Za-z]{5,}\b/g;
  let wordMatch: RegExpExecArray | null;
  while ((wordMatch = wordRe.exec(text)) !== null) {
    const rawWord = wordMatch[0];
    const lowerWord = rawWord.toLowerCase();
    const start = wordMatch.index;
    const end = start + rawWord.length;

    // Skip if span already covered by an exact alias match
    if (accepted.some((existing) => start < existing.end && end > existing.start)) continue;
    if (NON_HUB_STOPWORDS.has(lowerWord)) continue;

    for (const cand of FUZZY_PRIMARY_HUBS) {
      const maxDist = cand.name.length >= 7 ? 2 : 1;
      const dist = levenshteinDistance(lowerWord, cand.name);
      if (dist <= maxDist && Math.abs(lowerWord.length - cand.name.length) <= 2) {
        accepted.push({
          hub_id: cand.hub_id,
          start,
          end,
          matched: rawWord,
          alias: cand.name,
        });
        break;
      }
    }
  }

  accepted.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
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
