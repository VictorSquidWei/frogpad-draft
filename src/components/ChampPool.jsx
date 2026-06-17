import React, { useMemo, useState } from "react";
import { useChampions } from "../lib/champions.jsx";
import ChampChip from "./ChampChip.jsx";
import Icon from "./Icon.jsx";

const TAGS = ["Fighter", "Tank", "Mage", "Assassin", "Marksman", "Support"];

export default function ChampPool({ placedIds, selectedId, onSelect }) {
  const { champions, loading } = useChampions();
  const [q, setQ] = useState("");
  const [tag, setTag] = useState(null);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return champions
      .filter((c) => !placedIds.has(c.id))
      .filter((c) => !query || c.name.toLowerCase().includes(query))
      .filter((c) => !tag || (c.tags || []).includes(tag));
  }, [champions, placedIds, q, tag]);

  return (
    <aside className="pool">
      <div className="pool-head">
        <span className="pool-title">Champion pool</span>
        <span className="pool-count">{list.length}</span>
      </div>

      <div className="pool-search">
        <Icon name="search" size={15} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
        />
      </div>

      <div className="pool-tags">
        {TAGS.map((t) => (
          <button
            key={t}
            type="button"
            className={`tag-pill${tag === t ? " is-active" : ""}`}
            onClick={() => setTag(tag === t ? null : t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="pool-list">
        {loading && <div className="pool-empty">Loading roster…</div>}
        {!loading && list.length === 0 && (
          <div className="pool-empty">Every champion is ranked. Nice.</div>
        )}
        {list.map((c) => (
          <div
            key={c.id}
            className={`pool-row${selectedId === c.id ? " is-selected" : ""}`}
          >
            <ChampChip
              champ={c}
              draggable
              onClick={() => onSelect(selectedId === c.id ? null : c.id)}
              size={26}
            />
          </div>
        ))}
      </div>

      <p className="pool-hint">
        Drag a champion into a tier, or tap one then tap a tier.
      </p>
    </aside>
  );
}
