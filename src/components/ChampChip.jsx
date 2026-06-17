import React from "react";
import ChampIcon from "./ChampIcon.jsx";
import Icon from "./Icon.jsx";

export default function ChampChip({
  champ,
  draggable = false,
  onRemove,
  onClick,
  size = 22,
  title,
}) {
  if (!champ) return null;
  return (
    <span
      className={`champ-chip${onClick ? " is-clickable" : ""}`}
      draggable={draggable}
      onDragStart={(e) => {
        if (!draggable) return;
        e.dataTransfer.setData("text/plain", champ.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={onClick}
      title={title || champ.name}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick(e);
        }
      }}
    >
      <ChampIcon id={champ.id} name={champ.name} size={size} />
      <span className="champ-chip-name">{champ.name}</span>
      {onRemove && (
        <button
          type="button"
          className="champ-chip-remove"
          aria-label={`Remove ${champ.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <Icon name="x" size={13} />
        </button>
      )}
    </span>
  );
}
