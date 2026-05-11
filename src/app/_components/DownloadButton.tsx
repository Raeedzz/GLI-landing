"use client";

import { useEffect, useRef } from "react";

const TARGET = "DOWNLOAD FOR MAC";
const SCRAMBLE_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789{}[]()/\\$*#@%&?!~^|<>+=";
const STAGGER_END_MS = 520;
const SCRAMBLE_HOLD_MS = 220;

function randomChar() {
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
}

export default function DownloadButton() {
  const aRef = useRef<HTMLAnchorElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function startCascade() {
    const a = aRef.current;
    if (!a) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const t0 = performance.now();
    const totalMs = STAGGER_END_MS + SCRAMBLE_HOLD_MS;

    function tick(now: number) {
      const elapsed = now - t0;
      const out = new Array<string>(TARGET.length);
      for (let i = 0; i < TARGET.length; i++) {
        const c = TARGET[i];
        if (c === " ") {
          out[i] = " ";
          continue;
        }
        const arrival =
          (i / Math.max(1, TARGET.length - 1)) * STAGGER_END_MS;
        out[i] = elapsed >= arrival + SCRAMBLE_HOLD_MS ? c : randomChar();
      }
      a!.textContent = out.join("");
      if (elapsed < totalMs) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = 0;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  function resetText() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    if (aRef.current) aRef.current.textContent = TARGET;
  }

  return (
    <a
      ref={aRef}
      href="https://github.com/sckryteam/GLI/releases/latest/download/Goonware.dmg"
      download
      onMouseEnter={startCascade}
      onMouseLeave={resetText}
      onFocus={startCascade}
      onBlur={resetText}
      className="font-mono text-[0.7rem] sm:text-xs md:text-sm uppercase tracking-[0.2em] sm:tracking-[0.25em] border border-white/30 px-7 py-3.5 sm:px-10 sm:py-4 text-white/90 active:bg-white active:text-black hover:bg-white hover:text-black transition-colors duration-200 select-none"
    >
      {TARGET}
    </a>
  );
}
