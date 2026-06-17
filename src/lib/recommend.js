import {
  ROLE_KEYS,
  TIER_KEYS,
  tierWeight,
  strengthWeight,
} from "../data/constants.js";

// Which tier (if any) a champion sits in for a given role.
function tierOf(tiers, role, champId) {
  const roleTiers = tiers[role] || {};
  for (const t of TIER_KEYS) {
    if ((roleTiers[t] || []).includes(champId)) return t;
  }
  return null;
}

// All champions the user has given the tool *any* information about for this role.
// The recommender can only suggest from what's been fed in — by design.
function candidateSet(state, role) {
  const set = new Set();
  const roleTiers = state.tiers[role] || {};
  TIER_KEYS.forEach((t) => (roleTiers[t] || []).forEach((c) => set.add(c)));
  state.matchups.forEach((m) => {
    if (m.role === role && m.pick) set.add(m.pick);
  });
  state.comps.forEach((c) => {
    const pick = c.picks?.[role];
    if (pick) set.add(pick);
  });
  return set;
}

// Returns a ranked list: [{ champId, score, reasons: [{ label, tone }] }]
// `nameOf` maps a champion id to its display name.
export function recommend(state, role, nameOf = (id) => id) {
  if (!ROLE_KEYS.includes(role)) return [];
  const { ally, enemy, bans } = state.draft;

  const taken = new Set(bans);
  ROLE_KEYS.forEach((r) => {
    if (ally[r]) taken.add(ally[r]);
    if (enemy[r]) taken.add(enemy[r]);
  });

  const laneEnemy = enemy[role];
  const otherEnemies = ROLE_KEYS.filter((r) => r !== role)
    .map((r) => enemy[r])
    .filter(Boolean);

  const preferred = state.comps.find((c) => c.id === state.draft.preferredComp);

  const candidates = [...candidateSet(state, role)].filter(
    (id) => !taken.has(id)
  );

  const scored = candidates.map((champId) => {
    let score = 0;
    const reasons = [];

    // 1. Lane counter against the direct opponent.
    if (laneEnemy) {
      const m = state.matchups.find(
        (x) => x.pick === champId && x.vs === laneEnemy
      );
      if (m) {
        const w = strengthWeight(m.strength);
        score += w;
        if (w > 0)
          reasons.push({
            label: `${m.strength === "hard" ? "Hard counters" : "Counters"} ${nameOf(laneEnemy)}`,
            tone: "good",
          });
        else if (w < 0)
          reasons.push({ label: `Loses to ${nameOf(laneEnemy)}`, tone: "bad" });
      }
    }

    // 2. Beats enemies in other lanes (reduced weight, only the strongest shown).
    let bestCross = null;
    otherEnemies.forEach((enemyChamp) => {
      const m = state.matchups.find(
        (x) => x.pick === champId && x.vs === enemyChamp
      );
      if (m) {
        const w = strengthWeight(m.strength) * 0.5;
        if (w > 0) {
          score += w;
          if (!bestCross || w > bestCross.w)
            bestCross = { w, name: nameOf(enemyChamp) };
        }
      }
    });
    if (bestCross)
      reasons.push({ label: `Beats ${bestCross.name}`, tone: "good" });

    // 3. Tier rating.
    const tier = tierOf(state.tiers, role, champId);
    if (tier) {
      score += tierWeight(tier);
      if (tierWeight(tier) > 0)
        reasons.push({ label: `${tier}-tier`, tone: "tier" });
    }

    // 4. Composition fit. Preferred comp counts heavily; others lightly.
    let bestComp = null;
    state.comps.forEach((comp) => {
      if (comp.picks?.[role] !== champId) return;
      const synergy = ROLE_KEYS.filter(
        (r) => r !== role && ally[r] && ally[r] === comp.picks?.[r]
      ).length;
      const isPreferred = preferred && comp.id === preferred.id;
      const base = isPreferred ? 35 : 12;
      const value = base + synergy * 6;
      if (!bestComp || value > bestComp.value) {
        bestComp = {
          value,
          label: isPreferred ? `Completes ${comp.name}` : `Fits ${comp.name}`,
        };
      }
    });
    if (bestComp) {
      score += bestComp.value;
      reasons.push({ label: bestComp.label, tone: "info" });
    }

    return { champId, score: Math.round(score), reasons: reasons.slice(0, 3) };
  });

  return scored
    .filter((c) => c.reasons.length > 0)
    .sort((a, b) => b.score - a.score);
}
