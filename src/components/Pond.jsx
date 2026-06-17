import React, { useEffect, useRef, useState } from "react";

const PADS = [
  { top: "12%", left: "8%", size: 120, dur: 26, delay: 0 },
  { top: "68%", left: "14%", size: 86, dur: 32, delay: 4 },
  { top: "30%", left: "82%", size: 150, dur: 30, delay: 2 },
  { top: "78%", left: "72%", size: 100, dur: 28, delay: 6 },
  { top: "48%", left: "46%", size: 70, dur: 34, delay: 3 },
  { top: "6%", left: "60%", size: 64, dur: 24, delay: 5 },
];

const BUBBLES = Array.from({ length: 9 }, (_, i) => ({
  left: `${(i * 11 + 6) % 100}%`,
  size: 6 + ((i * 7) % 14),
  dur: 9 + ((i * 5) % 8),
  delay: (i * 1.7) % 9,
}));

function LilyPad({ size }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="lily-svg"
      aria-hidden="true"
    >
      <path
        d="M50 6a44 44 0 1 1-6 87.6L50 50z"
        className="lily-fill"
        transform="rotate(20 50 50)"
      />
      <path d="M50 50 53 12" className="lily-vein" />
      <path d="M50 50 78 30" className="lily-vein" />
      <path d="M50 50 84 62" className="lily-vein" />
    </svg>
  );
}

function Frog() {
  return (
    <div className="frog" aria-hidden="true">
      <svg width="92" height="78" viewBox="0 0 92 78">
        <ellipse cx="46" cy="70" rx="34" ry="7" className="frog-shadow" />
        <path
          d="M14 58c-2-12 6-26 32-26s34 14 32 26c-1 7-10 10-32 10S15 65 14 58z"
          className="frog-body"
        />
        <circle cx="28" cy="26" r="13" className="frog-body" />
        <circle cx="64" cy="26" r="13" className="frog-body" />
        <circle cx="28" cy="26" r="6" className="frog-eye" />
        <circle cx="64" cy="26" r="6" className="frog-eye" />
        <circle cx="29" cy="27" r="2.6" className="frog-pupil" />
        <circle cx="65" cy="27" r="2.6" className="frog-pupil" />
        <path d="M34 54q12 8 24 0" className="frog-mouth" />
        <path d="M16 64l-9 5M76 64l9 5" className="frog-leg" />
      </svg>
    </div>
  );
}

export default function Pond() {
  const [ripples, setRipples] = useState([]);
  const idRef = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    )?.matches;
    if (reduce) return;
    const onClick = (e) => {
      const id = idRef.current++;
      setRipples((r) => [...r, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(
        () => setRipples((r) => r.filter((rp) => rp.id !== id)),
        900
      );
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  return (
    <div className="pond" aria-hidden="true">
      <div className="pond-water" />
      <div className="pond-caustics" />
      {PADS.map((p, i) => (
        <div
          key={i}
          className="lilypad"
          style={{
            top: p.top,
            left: p.left,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          <LilyPad size={p.size} />
        </div>
      ))}
      <div className="lilypad frog-pad" style={{ top: "60%", left: "40%" }}>
        <LilyPad size={150} />
        <Frog />
      </div>
      {BUBBLES.map((b, i) => (
        <span
          key={i}
          className="bubble"
          style={{
            left: b.left,
            width: b.size,
            height: b.size,
            animationDuration: `${b.dur}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="ripple"
          style={{ left: r.x, top: r.y }}
        />
      ))}
    </div>
  );
}
