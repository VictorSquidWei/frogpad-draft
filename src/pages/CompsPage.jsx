import React, { useState } from "react";
import { ROLES, ROLE_KEYS, COMP_TYPES } from "../data/constants.js";
import { useStore, genId } from "../lib/store.jsx";
import { useChampions } from "../lib/champions.jsx";
import ChampSelect from "../components/ChampSelect.jsx";
import ChampIcon from "../components/ChampIcon.jsx";
import Icon from "../components/Icon.jsx";

function blankComp() {
  return {
    id: genId(),
    name: "",
    type: COMP_TYPES[0],
    picks: ROLE_KEYS.reduce((a, r) => ({ ...a, [r]: null }), {}),
    notes: "",
  };
}

export default function CompsPage() {
  const { state, saveComp, deleteComp } = useStore();
  const { byId } = useChampions();
  const [draft, setDraft] = useState(null);

  const startNew = () => setDraft(blankComp());
  const edit = (comp) => setDraft({ ...comp, picks: { ...comp.picks } });

  const save = () => {
    saveComp({ ...draft, name: draft.name.trim() || "Untitled comp" });
    setDraft(null);
  };

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">
          Team <span className="page-title-dim">comps</span>
        </h1>
        <p className="page-sub">
          Preset compositions the draft recommender builds toward.
        </p>
        {!draft && (
          <button type="button" className="btn primary" onClick={startNew}>
            <Icon name="plus" size={16} /> New comp
          </button>
        )}
      </div>

      {draft && (
        <div className="card comp-editor">
          <div className="comp-editor-top">
            <input
              className="comp-name"
              placeholder="Comp name (e.g. Poke siege)"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
            <select
              value={draft.type}
              onChange={(e) => setDraft({ ...draft, type: e.target.value })}
            >
              {COMP_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="comp-slots">
            {ROLES.map((r) => (
              <div key={r.key} className="comp-slot">
                <span className="comp-slot-role">{r.label}</span>
                <ChampSelect
                  value={draft.picks[r.key]}
                  onPick={(id) =>
                    setDraft({
                      ...draft,
                      picks: { ...draft.picks, [r.key]: id },
                    })
                  }
                />
              </div>
            ))}
          </div>

          <textarea
            className="comp-notes"
            placeholder="Notes — win condition, power spikes, how to play it…"
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          />

          <div className="comp-editor-actions">
            <button type="button" className="btn" onClick={() => setDraft(null)}>
              Cancel
            </button>
            <button type="button" className="btn primary" onClick={save}>
              Save comp
            </button>
          </div>
        </div>
      )}

      {state.comps.length === 0 && !draft && (
        <div className="empty-state">
          <p>No comps yet.</p>
          <p className="empty-sub">
            Build a few and the draft tab will suggest picks that complete them.
          </p>
        </div>
      )}

      <div className="comp-grid">
        {state.comps.map((comp) => (
          <div key={comp.id} className="card comp-card">
            <div className="comp-card-head">
              <div>
                <h3 className="comp-card-name">{comp.name}</h3>
                <span className="comp-tag">{comp.type}</span>
              </div>
              <div className="comp-card-actions">
                <button
                  type="button"
                  className="icon-btn"
                  title="Edit"
                  onClick={() => edit(comp)}
                >
                  <Icon name="edit" size={15} />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  title="Delete"
                  onClick={() => deleteComp(comp.id)}
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            </div>
            <div className="comp-card-roles">
              {ROLES.map((r) => {
                const id = comp.picks[r.key];
                const champ = id ? byId[id] || { id, name: id } : null;
                return (
                  <div key={r.key} className="comp-card-role" title={r.label}>
                    {champ ? (
                      <ChampIcon id={champ.id} name={champ.name} size={40} />
                    ) : (
                      <span className="comp-card-empty" />
                    )}
                    <span className="comp-card-role-label">{r.short}</span>
                  </div>
                );
              })}
            </div>
            {comp.notes && <p className="comp-card-notes">{comp.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
