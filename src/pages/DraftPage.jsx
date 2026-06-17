import React, { useMemo } from "react";
import { ROLES, ROLE_KEYS } from "../data/constants.js";
import { useStore } from "../lib/store.jsx";
import { useChampions } from "../lib/champions.jsx";
import { recommend } from "../lib/recommend.js";
import ChampIcon from "../components/ChampIcon.jsx";
import ChampSelect from "../components/ChampSelect.jsx";
import Icon from "../components/Icon.jsx";

const roleShort = (key) => ROLES.find((r) => r.key === key)?.short ?? key;
const roleLabelFull = (key) => ROLES.find((r) => r.key === key)?.label ?? key;

export default function DraftPage() {
  const {
    state,
    assignDraft,
    clearDraftSlot,
    toggleBan,
    setPreferredComp,
    setDraftTarget,
    resetDraft,
  } = useStore();
  const { byId, nameOf } = useChampions();

  const { ally, enemy, bans, preferredComp, target } = state.draft;

  const taken = useMemo(() => {
    const s = new Set(bans);
    ROLE_KEYS.forEach((r) => {
      if (ally[r]) s.add(ally[r]);
      if (enemy[r]) s.add(enemy[r]);
    });
    return s;
  }, [ally, enemy, bans]);

  const recs = useMemo(
    () => recommend(state, target.role, nameOf).slice(0, 6),
    [state, target.role, nameOf]
  );

  const champ = (id) => (id ? byId[id] || { id, name: id } : null);

  const nextTargetAfter = (side, role) => {
    const a = { ...ally, ...(side === "ally" ? { [role]: "x" } : {}) };
    const e = { ...enemy, ...(side === "enemy" ? { [role]: "x" } : {}) };
    const emptyAlly = ROLE_KEYS.find((r) => !a[r]);
    if (emptyAlly) return { side: "ally", role: emptyAlly };
    const emptyEnemy = ROLE_KEYS.find((r) => !e[r]);
    if (emptyEnemy) return { side: "enemy", role: emptyEnemy };
    return { side, role };
  };

  const assign = (side, role, champId) => {
    if (!champId) return;
    assignDraft(side, role, champId);
    const next = nextTargetAfter(side, role);
    setDraftTarget(next.side, next.role);
  };

  const Slot = ({ side, role }) => {
    const c = champ(state.draft[side][role]);
    const isTarget = target.side === side && target.role === role;
    return (
      <button
        type="button"
        className={`draft-slot ${side} ${c ? "filled" : "empty"}${
          isTarget ? " is-target" : ""
        }`}
        onClick={() => setDraftTarget(side, role)}
      >
        {c ? (
          <>
            <ChampIcon id={c.id} name={c.name} size={34} />
            <span className="draft-slot-name">{c.name}</span>
            <span
              className="draft-slot-x"
              role="button"
              aria-label={`Clear ${c.name}`}
              onClick={(ev) => {
                ev.stopPropagation();
                clearDraftSlot(side, role);
              }}
            >
              <Icon name="x" size={13} />
            </span>
          </>
        ) : (
          <span className="draft-slot-add">
            <Icon name="plus" size={16} />
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="page draft-page">
      <div className="page-head draft-head">
        <div>
          <h1 className="page-title">
            Draft <span className="page-title-dim">mode</span>
          </h1>
          <p className="page-sub">
            Enter picks as the draft unfolds — recommendations update live.
          </p>
        </div>
        <div className="draft-controls">
          <label className="preferred">
            <span>Preferred comp</span>
            <select
              value={preferredComp || ""}
              onChange={(e) => setPreferredComp(e.target.value || null)}
            >
              <option value="">None</option>
              {state.comps.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn" onClick={resetDraft}>
            <Icon name="refresh" size={15} /> Reset
          </button>
        </div>
      </div>

      <div className="bans">
        <span className="bans-label">Bans</span>
        <div className="bans-list">
          {bans.map((id) => {
            const c = champ(id);
            return (
              <span key={id} className="ban-chip" title={c?.name}>
                <ChampIcon id={c.id} name={c.name} size={24} />
                <button
                  type="button"
                  aria-label={`Unban ${c?.name}`}
                  onClick={() => toggleBan(id)}
                >
                  <Icon name="x" size={12} />
                </button>
              </span>
            );
          })}
          <div className="ban-add">
            <ChampSelect
              value={null}
              onPick={(id) => id && toggleBan(id)}
              placeholder="Add ban"
              exclude={taken}
              allowClear={false}
            />
          </div>
        </div>
      </div>

      <div className="draft-layout">
        <div className="card draft-board">
          <div className="draft-board-head">
            <span className="side-tag ally">Your team</span>
            <span className="side-tag enemy">Enemy</span>
          </div>
          {ROLES.map((r) => (
            <div key={r.key} className="draft-row">
              <Slot side="ally" role={r.key} />
              <span className="draft-role">{r.short}</span>
              <Slot side="enemy" role={r.key} />
            </div>
          ))}
        </div>

        <div className="card draft-panel">
          <div className="panel-target">
            <span className={`target-pill ${target.side}`}>
              {target.side === "ally" ? "Your" : "Enemy"} {roleShort(target.role)}
            </span>
            <ChampSelect
              value={null}
              onPick={(id) => assign(target.side, target.role, id)}
              placeholder={`Set ${target.side === "ally" ? "your" : "enemy"} ${roleLabelFull(
                target.role
              )}`}
              exclude={taken}
              allowClear={false}
            />
          </div>

          <div className="panel-recs-head">
            <h3>Recommended {roleShort(target.role)}</h3>
            <span className="panel-recs-sub">for your team</span>
          </div>

          {recs.length === 0 ? (
            <div className="recs-empty">
              <p>No recommendations yet.</p>
              <p className="empty-sub">
                Add tier ratings, matchups or comps for {roleLabelFull(target.role)} —
                or enter an enemy pick to counter.
              </p>
            </div>
          ) : (
            <ul className="recs">
              {recs.map((rec, i) => {
                const c = champ(rec.champId);
                return (
                  <li key={rec.champId}>
                    <button
                      type="button"
                      className="rec"
                      onClick={() => assign("ally", target.role, rec.champId)}
                      title={`Pick ${c.name} for your ${roleLabelFull(target.role)}`}
                    >
                      <span className="rec-rank">{i + 1}</span>
                      <ChampIcon id={c.id} name={c.name} size={34} />
                      <span className="rec-body">
                        <span className="rec-name">{c.name}</span>
                        <span className="rec-reasons">
                          {rec.reasons.map((r, idx) => (
                            <span key={idx} className={`reason ${r.tone}`}>
                              {r.label}
                            </span>
                          ))}
                        </span>
                      </span>
                      <span className="rec-score">{rec.score}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
