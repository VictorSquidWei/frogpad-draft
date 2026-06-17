import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { loadChampions } from "./ddragon.js";

const ChampionsContext = createContext(null);

export function ChampionsProvider({ children }) {
  const [champions, setChampions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    loadChampions().then((list) => {
      if (!alive) return;
      setChampions(list);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo(() => {
    const byId = Object.fromEntries(champions.map((c) => [c.id, c]));
    return {
      champions,
      loading,
      byId,
      nameOf: (id) => byId[id]?.name ?? id,
    };
  }, [champions, loading]);

  return (
    <ChampionsContext.Provider value={value}>
      {children}
    </ChampionsContext.Provider>
  );
}

export function useChampions() {
  const ctx = useContext(ChampionsContext);
  if (!ctx) throw new Error("useChampions must be used within ChampionsProvider");
  return ctx;
}
