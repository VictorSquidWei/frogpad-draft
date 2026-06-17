import React, { useMemo, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { ROLE_KEYS, TIERS, TIER_KEYS, roleLabel } from "../data/constants.js";
import { useStore } from "../lib/store.jsx";
import { useChampions } from "../lib/champions.jsx";
import ChampPool from "../components/ChampPool.jsx";
import ChampChip from "../components/ChampChip.jsx";

export default function TierListPage() {
  const { role } = useParams();
  const { state, setTier, removeFromTiers } = useStore();
  const { byId } = useChampions();
  const [selectedId, setSelectedId] = useState(null);
  const [overTier, setOverTier] = useState(null);

  const roleTiers = state.tiers[role];

  const placedIds = useMemo(() => {
    const s = new Set();
    if (roleTiers) TIER_KEYS.forEach((t) => (roleTiers[t] || []).forEach((c) => s.add(c)));
    return s;
  }, [roleTiers]);

  if (!ROLE_KEYS.includes(role) || !roleTiers)
    return <Navigate to="/tier/top" replace />;

  const champ = (id) => byId[id] || { id, name: id };

  const placeInTier = (tier, champId) => {
    if (!champId) return;
    setTier(role, tier, champId);
    setSelectedId(null);
  };

  const onDrop = (tier) => (e) => {
    e.preventDefault();
    setOverTier(null);
    const champId = e.dataTransfer.getData("text/plain");
    placeInTier(tier, champId);
  };

  const onTierClick = (tier) => {
    if (selectedId) placeInTier(tier, selectedId);
  };

  return (
    <div className="page tier-page">
      <div className="page-head">
        <h1 className="page-title">
          {roleLabel(role)} <span className="page-title-dim">tier list</span>
        </h1>
        <p className="page-sub">
          {placedIds.size} ranked · drag from the pool or tap to place
        </p>
      </div>

      <div className="tier-layout">
        <ChampPool
          placedIds={placedIds}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        <div className="tiers">
          {TIERS.map((t) => {
            const ids = roleTiers[t.key] || [];
            return (
              <div
                key={t.key}
                className={`tier-row${overTier === t.key ? " is-over" : ""}${
                  selectedId ? " is-placing" : ""
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverTier(t.key);
                }}
                onDragLeave={() => setOverTier(null)}
                onDrop={onDrop(t.key)}
                onClick={() => onTierClick(t.key)}
              >
                <div
                  className="tier-label"
                  style={{ "--tier-color": t.color }}
                >
                  {t.key}
                </div>
                <div className="tier-slot">
                  {ids.length === 0 && (
                    <span className="tier-empty">
                      {selectedId ? "Tap to place here" : "Drop champions here"}
                    </span>
                  )}
                  {ids.map((id) => (
                    <ChampChip
                      key={id}
                      champ={champ(id)}
                      draggable
                      size={28}
                      onRemove={() => removeFromTiers(role, id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
