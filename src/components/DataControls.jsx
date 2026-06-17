import React, { useRef } from "react";
import { useStore } from "../lib/store.jsx";
import Icon from "./Icon.jsx";

export default function DataControls() {
  const { exportData, importData, resetAll } = useStore();
  const fileRef = useRef(null);

  const doExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `frogpad-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        importData(parsed);
      } catch {
        alert("That file isn't valid FrogPad data.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const doReset = () => {
    if (
      confirm(
        "Clear all tier lists, comps, matchups and the current draft? This can't be undone."
      )
    ) {
      resetAll();
    }
  };

  return (
    <div className="data-controls">
      <button type="button" className="icon-btn" title="Export data" onClick={doExport}>
        <Icon name="download" size={16} />
      </button>
      <button
        type="button"
        className="icon-btn"
        title="Import data"
        onClick={() => fileRef.current?.click()}
      >
        <Icon name="upload" size={16} />
      </button>
      <button type="button" className="icon-btn" title="Reset everything" onClick={doReset}>
        <Icon name="trash" size={16} />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        onChange={doImport}
        hidden
      />
    </div>
  );
}
