import React, { useEffect, useMemo, useRef, useState } from "react";
import { useChampions } from "../lib/champions.jsx";
import ChampIcon from "./ChampIcon.jsx";
import Icon from "./Icon.jsx";

export default function ChampSelect({
  value,
  onPick,
  placeholder = "Select champion",
  exclude,
  allowClear = true,
}) {
  const { champions, byId } = useChampions();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    inputRef.current?.focus();
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return champions
      .filter((c) => !exclude || !exclude.has(c.id) || c.id === value)
      .filter((c) => !q || c.name.toLowerCase().includes(q))
      .slice(0, 60);
  }, [champions, query, exclude, value]);

  const selected = value ? byId[value] : null;

  return (
    <div className="champ-select" ref={wrapRef}>
      <button
        type="button"
        className="champ-select-trigger"
        onClick={() => setOpen((o) => !o)}
      >
        {selected ? (
          <>
            <ChampIcon id={selected.id} name={selected.name} size={22} />
            <span className="champ-select-label">{selected.name}</span>
          </>
        ) : (
          <span className="champ-select-placeholder">{placeholder}</span>
        )}
        <Icon name="chevron" size={15} className="champ-select-caret" />
      </button>

      {selected && allowClear && (
        <button
          type="button"
          className="champ-select-clear"
          aria-label="Clear selection"
          onClick={() => onPick(null)}
        >
          <Icon name="x" size={13} />
        </button>
      )}

      {open && (
        <div className="champ-select-panel">
          <div className="champ-select-search">
            <Icon name="search" size={15} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search champions"
            />
          </div>
          <div className="champ-select-list">
            {filtered.map((c) => (
              <button
                type="button"
                key={c.id}
                className={`champ-select-option${c.id === value ? " is-active" : ""}`}
                onClick={() => {
                  onPick(c.id);
                  setQuery("");
                  setOpen(false);
                }}
              >
                <ChampIcon id={c.id} name={c.name} size={24} />
                <span>{c.name}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="champ-select-empty">No champions match.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
