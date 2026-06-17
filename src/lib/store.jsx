import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { ROLE_KEYS, TIER_KEYS } from "../data/constants.js";
import {
  loadLocal,
  saveLocal,
  firebaseEnabled,
  initFirebaseSync,
} from "./persistence.js";

const StoreContext = createContext(null);

export const genId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function emptyTiersForRole() {
  return TIER_KEYS.reduce((acc, t) => ({ ...acc, [t]: [] }), {});
}

function makeEmptyState() {
  return {
    tiers: ROLE_KEYS.reduce(
      (acc, role) => ({ ...acc, [role]: emptyTiersForRole() }),
      {}
    ),
    comps: [],
    matchups: [],
    draft: {
      ally: ROLE_KEYS.reduce((a, r) => ({ ...a, [r]: null }), {}),
      enemy: ROLE_KEYS.reduce((a, r) => ({ ...a, [r]: null }), {}),
      bans: [],
      preferredComp: null,
      target: { side: "ally", role: "top" },
    },
  };
}

// Merge persisted data over the empty shape so new fields never come back undefined.
function hydrate(persisted) {
  const base = makeEmptyState();
  if (!persisted || typeof persisted !== "object") return base;
  return {
    tiers: ROLE_KEYS.reduce((acc, role) => {
      acc[role] = { ...base.tiers[role], ...(persisted.tiers?.[role] || {}) };
      TIER_KEYS.forEach((t) => {
        if (!Array.isArray(acc[role][t])) acc[role][t] = [];
      });
      return acc;
    }, {}),
    comps: Array.isArray(persisted.comps) ? persisted.comps : [],
    matchups: Array.isArray(persisted.matchups) ? persisted.matchups : [],
    draft: {
      ...base.draft,
      ...(persisted.draft || {}),
      ally: { ...base.draft.ally, ...(persisted.draft?.ally || {}) },
      enemy: { ...base.draft.enemy, ...(persisted.draft?.enemy || {}) },
      bans: Array.isArray(persisted.draft?.bans) ? persisted.draft.bans : [],
      target: base.draft.target,
    },
  };
}

// Strip the transient UI cursor before persisting / syncing.
function serializable(state) {
  const { draft, ...rest } = state;
  const { target, ...draftRest } = draft;
  return { ...rest, draft: draftRest };
}

function reducer(state, action) {
  switch (action.type) {
    case "HYDRATE":
      return hydrate(action.data);

    case "RESET_ALL":
      return makeEmptyState();

    case "TIER_SET": {
      const { role, tier, champId, index } = action;
      const roleTiers = { ...state.tiers[role] };
      // remove from every tier in this role first
      TIER_KEYS.forEach((t) => {
        roleTiers[t] = roleTiers[t].filter((c) => c !== champId);
      });
      const target = [...roleTiers[tier]];
      const at = index == null ? target.length : Math.max(0, Math.min(index, target.length));
      target.splice(at, 0, champId);
      roleTiers[tier] = target;
      return { ...state, tiers: { ...state.tiers, [role]: roleTiers } };
    }

    case "TIER_REMOVE": {
      const { role, champId } = action;
      const roleTiers = { ...state.tiers[role] };
      TIER_KEYS.forEach((t) => {
        roleTiers[t] = roleTiers[t].filter((c) => c !== champId);
      });
      return { ...state, tiers: { ...state.tiers, [role]: roleTiers } };
    }

    case "COMP_SAVE": {
      const comp = action.comp;
      const exists = state.comps.some((c) => c.id === comp.id);
      const comps = exists
        ? state.comps.map((c) => (c.id === comp.id ? comp : c))
        : [...state.comps, comp];
      return { ...state, comps };
    }

    case "COMP_DELETE":
      return { ...state, comps: state.comps.filter((c) => c.id !== action.id) };

    case "MATCHUP_SAVE": {
      const m = action.matchup;
      const exists = state.matchups.some((x) => x.id === m.id);
      const matchups = exists
        ? state.matchups.map((x) => (x.id === m.id ? m : x))
        : [m, ...state.matchups];
      return { ...state, matchups };
    }

    case "MATCHUP_DELETE":
      return {
        ...state,
        matchups: state.matchups.filter((m) => m.id !== action.id),
      };

    case "DRAFT_ASSIGN": {
      const { side, role, champId } = action;
      return {
        ...state,
        draft: {
          ...state.draft,
          [side]: { ...state.draft[side], [role]: champId },
        },
      };
    }

    case "DRAFT_CLEAR_SLOT": {
      const { side, role } = action;
      return {
        ...state,
        draft: {
          ...state.draft,
          [side]: { ...state.draft[side], [role]: null },
        },
      };
    }

    case "DRAFT_TOGGLE_BAN": {
      const bans = state.draft.bans.includes(action.champId)
        ? state.draft.bans.filter((c) => c !== action.champId)
        : [...state.draft.bans, action.champId];
      return { ...state, draft: { ...state.draft, bans } };
    }

    case "DRAFT_SET_PREFERRED":
      return {
        ...state,
        draft: { ...state.draft, preferredComp: action.compId },
      };

    case "DRAFT_SET_TARGET":
      return {
        ...state,
        draft: {
          ...state.draft,
          target: { side: action.side, role: action.role },
        },
      };

    case "DRAFT_RESET": {
      const empty = makeEmptyState().draft;
      return {
        ...state,
        draft: { ...empty, preferredComp: state.draft.preferredComp },
      };
    }

    default:
      return state;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () =>
    hydrate(loadLocal())
  );
  const [sync, setSync] = useState({
    enabled: firebaseEnabled(),
    connected: false,
  });

  const saveRemoteRef = useRef(null);
  const applyingRemote = useRef(false);
  const lastPushed = useRef("");
  const pushTimer = useRef(null);

  // Connect Firebase once, if configured.
  useEffect(() => {
    let alive = true;
    if (!firebaseEnabled()) return;
    initFirebaseSync((remote) => {
      if (!alive) return;
      applyingRemote.current = true;
      lastPushed.current = JSON.stringify(remote);
      dispatch({ type: "HYDRATE", data: remote });
    }).then((handle) => {
      if (!alive || !handle) return;
      saveRemoteRef.current = handle.saveRemote;
      setSync({ enabled: true, connected: true });
    });
    return () => {
      alive = false;
    };
  }, []);

  // Persist locally + push to Firebase (debounced) on every change.
  useEffect(() => {
    const payload = serializable(state);
    saveLocal(payload);

    if (applyingRemote.current) {
      applyingRemote.current = false;
      return; // change came from a remote snapshot; don't echo it back
    }
    if (!saveRemoteRef.current) return;
    const serialized = JSON.stringify(payload);
    if (serialized === lastPushed.current) return;
    clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      lastPushed.current = serialized;
      saveRemoteRef.current?.(payload);
    }, 600);
  }, [state]);

  const api = useMemo(
    () => ({
      state,
      sync,
      // tier list
      setTier: (role, tier, champId, index) =>
        dispatch({ type: "TIER_SET", role, tier, champId, index }),
      removeFromTiers: (role, champId) =>
        dispatch({ type: "TIER_REMOVE", role, champId }),
      // comps
      saveComp: (comp) => dispatch({ type: "COMP_SAVE", comp }),
      deleteComp: (id) => dispatch({ type: "COMP_DELETE", id }),
      // matchups
      saveMatchup: (matchup) => dispatch({ type: "MATCHUP_SAVE", matchup }),
      deleteMatchup: (id) => dispatch({ type: "MATCHUP_DELETE", id }),
      // draft
      assignDraft: (side, role, champId) =>
        dispatch({ type: "DRAFT_ASSIGN", side, role, champId }),
      clearDraftSlot: (side, role) =>
        dispatch({ type: "DRAFT_CLEAR_SLOT", side, role }),
      toggleBan: (champId) => dispatch({ type: "DRAFT_TOGGLE_BAN", champId }),
      setPreferredComp: (compId) =>
        dispatch({ type: "DRAFT_SET_PREFERRED", compId }),
      setDraftTarget: (side, role) =>
        dispatch({ type: "DRAFT_SET_TARGET", side, role }),
      resetDraft: () => dispatch({ type: "DRAFT_RESET" }),
      // data management
      importData: (data) => dispatch({ type: "HYDRATE", data }),
      resetAll: () => dispatch({ type: "RESET_ALL" }),
      exportData: () => serializable(state),
    }),
    [state, sync]
  );

  return (
    <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
