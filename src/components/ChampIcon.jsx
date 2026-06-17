import React, { useEffect, useState } from "react";
import { iconUrl } from "../lib/ddragon.js";

export default function ChampIcon({ id, name, size = 40 }) {
  const [err, setErr] = useState(false);
  useEffect(() => setErr(false), [id]);

  const url = iconUrl(id);
  const initials = (name || id || "?")
    .replace(/[^A-Za-z]/g, "")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      className="champ-icon"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.32) }}
      aria-hidden="true"
    >
      {!err && url ? (
        <img
          src={url}
          alt=""
          draggable={false}
          onError={() => setErr(true)}
        />
      ) : (
        initials || "?"
      )}
    </span>
  );
}
