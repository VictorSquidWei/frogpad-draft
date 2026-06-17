// Roles, in draft order. `key` is the stable storage key, `label` the display name.
export const ROLES = [
  { key: "top", label: "Top", short: "Top" },
  { key: "jungle", label: "Jungle", short: "JG" },
  { key: "mid", label: "Mid", short: "Mid" },
  { key: "adc", label: "ADC", short: "ADC" },
  { key: "support", label: "Support", short: "Sup" },
];

export const ROLE_KEYS = ROLES.map((r) => r.key);

export const roleLabel = (key) =>
  ROLES.find((r) => r.key === key)?.label ?? key;

// Tier letters, best to worst. Score = weight fed into the draft recommender.
export const TIERS = [
  { key: "S", weight: 30, color: "var(--tier-s)" },
  { key: "A", weight: 22, color: "var(--tier-a)" },
  { key: "B", weight: 14, color: "var(--tier-b)" },
  { key: "C", weight: 6, color: "var(--tier-c)" },
  { key: "D", weight: 0, color: "var(--tier-d)" },
];

export const TIER_KEYS = TIERS.map((t) => t.key);

export const tierWeight = (key) =>
  TIERS.find((t) => t.key === key)?.weight ?? 0;

// Preset team-composition archetypes.
export const COMP_TYPES = [
  "Poke",
  "Engage",
  "Pick / Dive",
  "Split push",
  "Protect the carry",
  "Scaling",
];

// Counter-matchup strength scale. `weight` feeds the recommender (positive = the
// pick beats the enemy; negative = the pick loses).
export const STRENGTHS = [
  { key: "hard", label: "Hard counter", weight: 40, tone: "good" },
  { key: "counter", label: "Counter", weight: 25, tone: "good" },
  { key: "even", label: "Even", weight: 0, tone: "neutral" },
  { key: "weak", label: "Weak into", weight: -18, tone: "bad" },
  { key: "hardloss", label: "Hard loses", weight: -32, tone: "bad" },
];

export const strengthWeight = (key) =>
  STRENGTHS.find((s) => s.key === key)?.weight ?? 0;

export const strengthLabel = (key) =>
  STRENGTHS.find((s) => s.key === key)?.label ?? key;
