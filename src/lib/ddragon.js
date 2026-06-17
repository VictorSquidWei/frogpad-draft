import FALLBACK_CHAMPIONS from "../data/championsFallback.js";

// Riot's Data Dragon is a free, public, CORS-enabled CDN used by community tools.
// We fetch the current patch version and the champion list at runtime (in the
// user's browser), cache the result, and fall back to a bundled roster offline.
const DDRAGON = "https://ddragon.leagueoflegends.com";
const CACHE_KEY = "frogpad:ddragon:v1";
const CACHE_TTL = 1000 * 60 * 60 * 24; // 1 day

let cachedVersion = "14.1.1"; // sensible default until the live version loads

export function iconUrl(championId) {
  if (!championId) return null;
  return `${DDRAGON}/cdn/${cachedVersion}/img/champion/${championId}.png`;
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.fetchedAt || Date.now() - parsed.fetchedAt > CACHE_TTL) {
      return parsed; // stale but still usable while we refresh in the background
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(version, champions) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ version, champions, fetchedAt: Date.now() })
    );
  } catch {
    // storage full or unavailable — non-fatal
  }
}

async function fetchFromRiot() {
  const versions = await fetch(`${DDRAGON}/api/versions.json`).then((r) => {
    if (!r.ok) throw new Error("versions");
    return r.json();
  });
  const version = versions[0];
  const data = await fetch(
    `${DDRAGON}/cdn/${version}/data/en_US/champion.json`
  ).then((r) => {
    if (!r.ok) throw new Error("champions");
    return r.json();
  });
  const champions = Object.values(data.data)
    .map((c) => ({ id: c.id, name: c.name, tags: c.tags || [] }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return { version, champions };
}

// Loads the roster, preferring fresh cache, then a network fetch, then the
// bundled fallback. Always resolves to a usable list.
export async function loadChampions() {
  const cache = readCache();
  if (cache?.version) cachedVersion = cache.version;

  const fresh =
    cache && Date.now() - cache.fetchedAt < CACHE_TTL ? cache : null;
  if (fresh) return fresh.champions;

  try {
    const { version, champions } = await fetchFromRiot();
    cachedVersion = version;
    writeCache(version, champions);
    return champions;
  } catch {
    if (cache?.champions?.length) return cache.champions;
    return FALLBACK_CHAMPIONS.map((c) => ({ ...c, tags: [] }));
  }
}
