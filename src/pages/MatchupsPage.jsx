import React, { useMemo, useState } from "react";
import {
  ROLES,
  STRENGTHS,
  strengthLabel,
  roleLabel,
} from "../data/constants.js";
import { useStore, genId } from "../lib/store.jsx";
import { useChampions } from "../lib/champions.jsx";
import ChampSelect from "../components/ChampSelect.jsx";
import ChampIcon from "../components/ChampIcon.jsx";
import Icon from "../components/Icon.jsx";

const toneClass = (key) => {
  const s = STRENGTHS.find((x) => x.key === key);
  return s ? `strength ${s.tone}` : "strength";
};

export default function MatchupsPage() {
  const { state, saveMatchup, deleteMatchup } = useStore();
  const { byId, nameOf } = useChampions();

  const [pick, setPick] = useState(null);
  const [vs, setVs] = useState(null);
  const [role, setRole] = useState(ROLES[0].key);
  const [strength, setStrength] = useState("counter");
  const [notes, setNotes] = useState("");

  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState(null);
  const [strengthFilter, setStrengthFilter] = useState(null);

  const canAdd = pick && vs && pick !== vs;

  const add = () => {
    if (!canAdd) return;
    saveMatchup({ id: genId(), pick, vs, role, strength, notes: notes.trim() });
    setPick(null);
    setVs(null);
    setNotes("");
  };

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return state.matchups.filter((m) => {
      if (roleFilter && m.role !== roleFilter) return false;
      if (strengthFilter && m.strength !== strengthFilter) return false;
      if (!query) return true;
      return (
        nameOf(m.pick).toLowerCase().includes(query) ||
        nameOf(m.vs).toLowerCase().includes(query)
      );
    });
  }, [state.matchups, q, roleFilter, strengthFilter, nameOf]);

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">
          Counter <span className="page-title-dim">matchups</span>
        </h1>
        <p className="page-sub">
          Tell the recommender who beats whom. It reads these during draft.
        </p>
      </div>

      <div className="card matchup-form">
        <div className="matchup-form-row">
          <div className="field">
            <label>Your pick</label>
            <ChampSelect value={pick} onPick={setPick} placeholder="Champion" />
          </div>
          <div className="field strength-field">
            <label>Result</label>
            <select value={strength} onChange={(e) => setStrength(e.target.value)}>
              {STRENGTHS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Versus</label>
            <ChampSelect value={vs} onPick={setVs} placeholder="Enemy" />
          </div>
          <div className="field role-field">
            <label>Lane</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="matchup-form-row">
          <input
            className="matchup-notes"
            placeholder="Notes — why, key items, how to play it (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button
            type="button"
            className="btn primary"
            disabled={!canAdd}
            onClick={add}
          >
            <Icon name="plus" size={16} /> Add
          </button>
        </div>
      </div>

      <div className="matchup-filters">
        <div className="pool-search inline">
          <Icon name="search" size={15} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by champion"
          />
        </div>
        <div className="role-pills">
          <button
            type="button"
            className={`tag-pill${!roleFilter ? " is-active" : ""}`}
            onClick={() => setRoleFilter(null)}
          >
            All
          </button>
          {ROLES.map((r) => (
            <button
              key={r.key}
              type="button"
              className={`tag-pill${roleFilter === r.key ? " is-active" : ""}`}
              onClick={() => setRoleFilter(roleFilter === r.key ? null : r.key)}
            >
              {r.short}
            </button>
          ))}
        </div>
      </div>

      <div className="matchup-filters result-filters">
        <span className="result-filter-label">Result</span>
        <div className="role-pills">
          <button
            type="button"
            className={`tag-pill${!strengthFilter ? " is-active" : ""}`}
            onClick={() => setStrengthFilter(null)}
          >
            All
          </button>
          {STRENGTHS.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`tag-pill${strengthFilter === s.key ? " is-active" : ""}`}
              onClick={() =>
                setStrengthFilter(strengthFilter === s.key ? null : s.key)
              }
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="empty-state">
          <p>No matchups{state.matchups.length ? " match your filter" : " yet"}.</p>
        </div>
      ) : (
        <ul className="matchup-list">
          {list.map((m) => {
            const p = byId[m.pick] || { id: m.pick, name: m.pick };
            const e = byId[m.vs] || { id: m.vs, name: m.vs };
            return (
              <li key={m.id} className="matchup-row">
                <span className="matchup-side">
                  <ChampIcon id={p.id} name={p.name} size={32} />
                  <span className="matchup-name">{p.name}</span>
                </span>
                <span className={toneClass(m.strength)}>
                  {strengthLabel(m.strength)}
                </span>
                <span className="matchup-side">
                  <ChampIcon id={e.id} name={e.name} size={32} />
                  <span className="matchup-name">{e.name}</span>
                </span>
                <span className="matchup-role">{roleLabel(m.role)}</span>
                <span className="matchup-note">{m.notes}</span>
                <button
                  type="button"
                  className="icon-btn"
                  title="Delete"
                  onClick={() => deleteMatchup(m.id)}
                >
                  <Icon name="trash" size={15} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
