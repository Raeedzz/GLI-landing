"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const FEATURES = [
  {
    title: "No harness just a lighting fast terminal",
    image: "/features/01.png",
  },
  {
    title: "Worktrees spun up for each of your agents",
    image: "/features/02.png",
  },
  {
    title: "Built in browser that is faster than any in chrome MCP",
    image: "/features/03.png",
  },
  {
    title: "Full Gitree management",
    image: "/features/04.png",
  },
  {
    title: "Summaries of what your agents are doing",
    image: "/features/05.png",
  },
] as const;

const AUTO_ADVANCE_MS = 3600;
const INITIAL_DELAY_MS = 1100;
const SCRAMBLE_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789{}[]()/\\$*#@%&?!~^|<>+=";
const STAGGER_END_MS = 600;
const SCRAMBLE_HOLD_MS = 220;

function randomChar() {
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
}

export default function Features() {
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const isFirstRender = useRef(true);
  const dragRef = useRef({ startX: 0, dragging: false });

  const startTimer = useCallback((initialDelayMs: number = AUTO_ADVANCE_MS) => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    const firstTick = window.setTimeout(() => {
      setActive((a) => (a + 1) % FEATURES.length);
      timerRef.current = window.setInterval(() => {
        setActive((a) => (a + 1) % FEATURES.length);
      }, AUTO_ADVANCE_MS);
    }, initialDelayMs);
    timerRef.current = firstTick;
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      (entries) => {
        setInView(entries[0].isIntersecting);
      },
      { threshold: 0.4 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (inView) {
      startTimer(INITIAL_DELAY_MS);
    } else {
      stopTimer();
    }
    return () => {
      stopTimer();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [inView, startTimer, stopTimer]);

  useEffect(() => {
    const target = FEATURES[active].title;
    const node = textRef.current;
    if (!node) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    if (isFirstRender.current) {
      node.textContent = target;
      isFirstRender.current = false;
      return;
    }

    const t0 = performance.now();
    const totalMs = STAGGER_END_MS + SCRAMBLE_HOLD_MS;

    function tick(now: number) {
      const elapsed = now - t0;
      const out = new Array<string>(target.length);
      for (let i = 0; i < target.length; i++) {
        const c = target[i];
        if (c === " ") {
          out[i] = " ";
          continue;
        }
        const arrival = (i / Math.max(1, target.length - 1)) * STAGGER_END_MS;
        out[i] = elapsed >= arrival + SCRAMBLE_HOLD_MS ? c : randomChar();
      }
      if (textRef.current) textRef.current.textContent = out.join("");
      if (elapsed < totalMs) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = 0;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [active]);

  const goTo = useCallback(
    (i: number) => {
      const next = ((i % FEATURES.length) + FEATURES.length) % FEATURES.length;
      setActive(next);
      if (inView) startTimer();
    },
    [startTimer, inView],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setActive((a) => (a + 1) % FEATURES.length);
        startTimer();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setActive((a) => (a - 1 + FEATURES.length) % FEATURES.length);
        startTimer();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [startTimer]);

  function onPointerDown(e: React.PointerEvent) {
    dragRef.current = { startX: e.clientX, dragging: true };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  }
  function onPointerUp(e: React.PointerEvent) {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    dragRef.current.dragging = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    if (Math.abs(dx) > 40) {
      goTo(active + (dx < 0 ? 1 : -1));
    }
  }

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative h-[100svh] w-full bg-black flex items-center px-6 sm:px-10 md:px-14 lg:px-20"
      aria-label="Features"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.9fr] gap-12 lg:gap-16 max-w-[1600px] mx-auto w-full items-center">
        <div className="flex flex-col gap-6 lg:gap-8 order-2 lg:order-1">
          <div className="font-mono text-[0.65rem] sm:text-xs text-white/40 tracking-[0.3em] uppercase">
            {String(active + 1).padStart(2, "0")}
            <span className="text-white/15 mx-2">/</span>
            {String(FEATURES.length).padStart(2, "0")}
          </div>

          <div
            ref={textRef}
            className="font-mono text-[1.4rem] sm:text-[1.75rem] md:text-[2.1rem] lg:text-[2.4rem] xl:text-[2.7rem] text-white/95 leading-[1.15] tracking-[-0.01em]"
            style={{ minHeight: "4.6em" }}
          >
            {FEATURES[active].title}
          </div>

          <div className="flex gap-2 pt-3 -my-3">
            {FEATURES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show feature ${i + 1}`}
                className="group flex items-center cursor-pointer focus:outline-none border-0 bg-transparent py-3 px-0"
                style={{
                  transition:
                    "width 650ms cubic-bezier(0.16, 1, 0.3, 1)",
                  width: i === active ? 56 : 24,
                }}
              >
                <span
                  className="block w-full h-[2px] group-hover:bg-white/60"
                  style={{
                    background:
                      i === active
                        ? "rgba(255,255,255,1)"
                        : "rgba(255,255,255,0.2)",
                    transition: "background 300ms ease-out",
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        <div
          className="relative w-full aspect-[16/10] order-1 lg:order-2 select-none cursor-grab active:cursor-grabbing"
          style={{ touchAction: "pan-y" }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          {FEATURES.map((f, i) => {
            const offset = (i - active + FEATURES.length) % FEATURES.length;
            const isActive = offset === 0;
            let tx = 0;
            let ty = 0;
            let scale = 1;
            let opacity = 1;
            if (offset === 1) {
              tx = 26;
              ty = 22;
              scale = 0.95;
              opacity = 0.7;
            } else if (offset === 2) {
              tx = 52;
              ty = 44;
              scale = 0.9;
              opacity = 0.4;
            } else if (offset === 3) {
              tx = 76;
              ty = 64;
              scale = 0.86;
              opacity = 0.18;
            } else if (offset >= 4) {
              tx = 96;
              ty = 80;
              scale = 0.83;
              opacity = 0;
            }
            const z = FEATURES.length - offset;
            return (
              <div
                key={i}
                className="absolute inset-0 border border-white/20 bg-[#0a0a0a] overflow-hidden"
                style={{
                  transform: `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`,
                  transformOrigin: "center center",
                  opacity,
                  zIndex: z,
                  transition:
                    "transform 750ms cubic-bezier(0.16, 1, 0.3, 1), opacity 400ms ease-out",
                  willChange: "transform, opacity",
                  boxShadow: isActive
                    ? "0 30px 80px -20px rgba(0,0,0,0.7)"
                    : "0 12px 40px -10px rgba(0,0,0,0.5)",
                  pointerEvents: isActive ? "auto" : "none",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.image}
                  alt={f.title}
                  className="w-full h-full object-cover pointer-events-none"
                  draggable={false}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
