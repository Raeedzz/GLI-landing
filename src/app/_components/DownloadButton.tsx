"use client";

import { useEffect, useRef, useState } from "react";
import AppleIcon from "./AppleIcon";

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
  const textRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef(0);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function startCascade() {
    setHovering(true);
    const text = textRef.current;
    if (!text) return;
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
      text!.textContent = out.join("");
      if (elapsed < totalMs) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = 0;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  function resetText() {
    setHovering(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    if (textRef.current) textRef.current.textContent = TARGET;
  }

  return (
    <a
      ref={aRef}
      id="hero-download-button"
      href="https://github.com/sckryteam/GLI/releases/latest/download/Goonware.dmg"
      download
      onMouseEnter={startCascade}
      onMouseLeave={resetText}
      onFocus={startCascade}
      onBlur={resetText}
      className="fixed left-1/2 top-[62%] z-30 inline-flex items-center justify-center gap-3 font-mono text-[0.7rem] sm:text-xs md:text-sm uppercase tracking-[0.2em] sm:tracking-[0.25em] border border-white/30 px-8 py-3.5 sm:px-10 sm:py-4 text-white/90 active:bg-white active:text-black hover:bg-white hover:text-black transition-colors duration-200 select-none will-change-transform"
      style={{
        transform: "translate(-50%, calc(-50% + var(--exit-ty, 0px)))",
      }}
    >
      <span className="block w-[1.4em] h-[1.4em] shrink-0">
        <AppleIcon hovering={hovering} />
      </span>
      <span ref={textRef}>{TARGET}</span>
    </a>
  );
}
