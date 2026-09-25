import { type Phone } from "@/types";

/**
 * Common misspellings and brand/model synonyms.
 */
const KEYWORD_ALIASES: Record<string, string> = {
  // Samsung
  samsugn: "samsung",
  samung: "samsung",
  samsng: "samsung",
  sumsung: "samsung",
  samsun: "samsung",
  smsung: "samsung",
  samusng: "samsung",
  galxy: "galaxy",
  galxay: "galaxy",
  glaxy: "galaxy",
  galax: "galaxy",

  // Apple & iPhone
  aple: "apple",
  appple: "apple",
  appl: "apple",
  iphne: "iphone",
  iphoen: "iphone",
  iphon: "iphone",
  ifone: "iphone",
  ihpone: "iphone",
  ipone: "iphone",

  // Xiaomi & Redmi & Poco
  xiomi: "xiaomi",
  xomi: "xiaomi",
  xaomi: "xiaomi",
  xiaomy: "xiaomi",
  xiami: "xiaomi",
  redm: "redmi",
  redmy: "redmi",
  poko: "poco",

  // Tecno
  techno: "tecno",
  tekno: "tecno",
  tecnoo: "tecno",
  cmon: "camon",
  cammon: "camon",
  spar: "spark",
  sparc: "spark",

  // Infinix
  infnix: "infinix",
  infinx: "infinix",
  infinex: "infinix",
  infnx: "infinix",
  infi: "infinix",

  // Huawei & Honor
  huwaei: "huawei",
  huawai: "huawei",
  huawe: "huawei",
  hawei: "huawei",
  huwei: "huawei",
  honer: "honor",

  // Realme
  relame: "realme",
  realmi: "realme",
  ralme: "realme",

  // Vivo
  vvo: "vivo",
  viivo: "vivo",

  // Motorola
  motrola: "motorola",
  motrolla: "motorola",
  moto: "motorola",

  // OnePlus
  oneplus: "oneplus",
  "1plus": "oneplus",

  // Modifiers
  ultr: "ultra",
  ultaa: "ultra",
  pr: "pro",
  mx: "max",
  pls: "plus",
};

/**
 * Normalizes text: lowercase, strip punctuation into spaces, collapse extra whitespace.
 */
export function normalizeText(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[-_.,/\\+()&]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generates smart query variants (e.g. "s 24" -> "s24", "s24ultra" -> "s24 ultra", "iphone15" -> "iphone 15")
 */
function getQueryVariants(qClean: string): string[] {
  const variants = new Set<string>();
  variants.add(qClean);

  // 1. Fold single letter or short word + number: "s 24" -> "s24", "a 55" -> "a55"
  const folded = qClean.replace(/\b([a-z]{1,2})\s+(\d+)\b/gi, "$1$2");
  if (folded !== qClean) variants.add(folded);

  // 2. Unfold letters + numbers: "s24" -> "s 24", "iphone15" -> "iphone 15"
  const unfolded = qClean.replace(/([a-z]{3,})(\d+)/gi, "$1 $2");
  if (unfolded !== qClean) variants.add(unfolded);

  return Array.from(variants);
}

/**
 * Compacts text by stripping all non-alphanumeric characters.
 * E.g. "Galaxy S24 Ultra" -> "galaxys24ultra"
 */
export function compactText(str: string): string {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Calculates Damerau-Levenshtein distance between two strings,
 * including adjacent character transpositions (e.g. "samsugn" -> "samsung" = distance 1).
 */
export function damerauLevenshtein(a: string, b: string): number {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  const d: number[][] = [];
  for (let i = 0; i <= al + 1; i++) {
    d[i] = [];
    for (let j = 0; j <= bl + 1; j++) {
      d[i][j] = 0;
    }
  }

  const maxdist = al + bl;
  d[0][0] = maxdist;
  for (let i = 0; i <= al; i++) {
    d[i + 1][0] = maxdist;
    d[i + 1][1] = i;
  }
  for (let j = 0; j <= bl; j++) {
    d[0][j + 1] = maxdist;
    d[1][j + 1] = j;
  }

  const da: Record<string, number> = {};

  for (let i = 1; i <= al; i++) {
    let db = 0;
    for (let j = 1; j <= bl; j++) {
      const k = da[b[j - 1]] || 0;
      const l = db;
      let cost = 0;
      if (a[i - 1] === b[j - 1]) {
        db = j;
      } else {
        cost = 1;
      }

      d[i + 1][j + 1] = Math.min(
        d[i][j + 1] + 1, // deletion
        d[i + 1][j] + 1, // insertion
        d[i][j] + cost,  // substitution
        d[k][l] + (i - k - 1) + 1 + (j - l - 1) // transposition
      );
    }
    da[a[i - 1]] = i;
  }

  return d[al + 1][bl + 1];
}

/**
 * Checks if a single search token fuzzy matches any word in the target tokens or target text.
 */
function tokenMatchesTarget(
  queryToken: string,
  targetWords: string[],
  targetNormalized: string,
  targetCompact: string
): { matched: boolean; score: number } {
  if (!queryToken) return { matched: true, score: 0 };

  // 1. Direct alias resolution (e.g. samsugn -> samsung)
  const resolvedToken = KEYWORD_ALIASES[queryToken] || queryToken;

  // 2. Exact word match (highest confidence)
  for (const word of targetWords) {
    if (word === resolvedToken) {
      return { matched: true, score: 100 };
    }
  }

  // 3. Exact substring match in normalized text (e.g. "s24" in "galaxy s24 ultra")
  if (targetNormalized.includes(resolvedToken)) {
    return { matched: true, score: 95 };
  }

  // 4. Compact match (handles "s24" matching "samsunggalaxys24ultra" or "note40" matching "note 40")
  const compactQuery = compactText(resolvedToken);
  if (compactQuery.length >= 2 && targetCompact.includes(compactQuery)) {
    return { matched: true, score: 90 };
  }

  // 5. Prefix match for tokens >= 3 chars (e.g. "sams" -> "samsung", "infin" -> "infinix")
  for (const word of targetWords) {
    if (resolvedToken.length >= 3 && word.startsWith(resolvedToken)) {
      return { matched: true, score: 85 };
    }
    if (word.length >= 4 && resolvedToken.startsWith(word)) {
      return { matched: true, score: 80 };
    }
  }

  // 6. Short tokens (<= 3 chars, e.g. "s24", "f6", "15", "a55"):
  // Do NOT do edit-distance fuzzy matching on short tokens to avoid false positives (e.g. a15 vs a55).
  if (resolvedToken.length <= 3) {
    return { matched: false, score: 0 };
  }

  // 7. Fuzzy distance matching against individual target words
  let bestFuzzyScore = 0;
  const maxAllowedDistance = resolvedToken.length <= 4 ? 1 : resolvedToken.length <= 7 ? 2 : 3;

  for (const word of targetWords) {
    if (Math.abs(word.length - resolvedToken.length) > maxAllowedDistance) continue;

    const dist = damerauLevenshtein(resolvedToken, word);
    if (dist <= maxAllowedDistance) {
      const maxLen = Math.max(resolvedToken.length, word.length);
      const similarity = 1 - dist / maxLen;
      if (similarity >= 0.70) {
        const score = Math.round(similarity * 75);
        if (score > bestFuzzyScore) {
          bestFuzzyScore = score;
        }
      }
    }
  }

  if (bestFuzzyScore > 0) {
    return { matched: true, score: bestFuzzyScore };
  }

  return { matched: false, score: 0 };
}

/**
 * Smart phone search evaluation.
 * Evaluates raw query and its smart variants.
 * Returns { matches: boolean, score: number }.
 */
export function matchPhoneSearch(phone: Phone, rawQuery: string): { matches: boolean; score: number } {
  const qClean = normalizeText(rawQuery);
  if (!qClean) return { matches: true, score: 0 };

  const brandNormalized = normalizeText(phone.brand);
  const modelNormalized = normalizeText(phone.model);
  const fullTarget = `${brandNormalized} ${modelNormalized}`;
  const targetWords = fullTarget.split(" ").filter(Boolean);
  const targetCompact = compactText(fullTarget);

  const queryVariants = getQueryVariants(qClean);
  let bestMatch = { matches: false, score: 0 };

  for (const variant of queryVariants) {
    const tokens = variant.split(" ").filter(Boolean);
    if (tokens.length === 0) continue;

    let variantScore = 0;
    let allTokensMatched = true;

    for (const token of tokens) {
      const res = tokenMatchesTarget(token, targetWords, fullTarget, targetCompact);
      if (!res.matched) {
        allTokensMatched = false;
        break;
      }
      variantScore += res.score;
    }

    if (allTokensMatched) {
      // Space-insensitive compact boost
      const queryCompact = compactText(variant);
      if (queryCompact.length >= 3 && targetCompact.includes(queryCompact)) {
        variantScore += 30;
      }

      if (variantScore > bestMatch.score) {
        bestMatch = { matches: true, score: variantScore };
      }
    }
  }

  return bestMatch;
}
