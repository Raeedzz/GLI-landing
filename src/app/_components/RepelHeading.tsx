"use client";

import { useEffect, useMemo, useRef } from "react";

const REPEL_RADIUS = 110;
const MAX_PUSH = 36;

interface Props {
  text: string;
  className?: string;
}

export default function RepelHeading({ text, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const words = useMemo(() => text.split(" "), [text]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    type Pos = { el: HTMLSpanElement; cx: number; cy: number };
    let positions: Pos[] = [];
    let mouseX = -99999;
    let mouseY = -99999;
    let rafId = 0;

    function measure() {
      const cRect = container!.getBoundingClientRect();
      const chars = container!.querySelectorAll<HTMLSpanElement>("[data-char]");
      positions = Array.from(chars).map((el) => {
        const prev = el.style.transform;
        el.style.transform = "";
        const r = el.getBoundingClientRect();
        el.style.transform = prev;
        return {
          el,
          cx: r.left + r.width / 2 - cRect.left,
          cy: r.top + r.height / 2 - cRect.top,
        };
      });
    }

    function tick() {
      const cRect = container!.getBoundingClientRect();
      const mx = mouseX === -99999 ? -99999 : mouseX - cRect.left;
      const my = mouseY === -99999 ? -99999 : mouseY - cRect.top;
      for (const p of positions) {
        const dx = mx - p.cx;
        const dy = my - p.cy;
        const d = Math.sqrt(dx * dx + dy * dy);
        let pushX = 0;
        let pushY = 0;
        if (d < REPEL_RADIUS && d > 0.5) {
          const k = 1 - d / REPEL_RADIUS;
          const push = k * k * MAX_PUSH;
          pushX = (-dx / d) * push;
          pushY = (-dy / d) * push;
        }
        p.el.style.transform = `translate(${pushX}px, ${pushY}px)`;
      }
      rafId = requestAnimationFrame(tick);
    }

    function onPointerMove(e: PointerEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }
    function clearRepel() {
      mouseX = -99999;
      mouseY = -99999;
    }

    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    document.addEventListener("pointermove", onPointerMove);
    document.documentElement.addEventListener("mouseleave", clearRepel);
    window.addEventListener("blur", clearRepel);
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("mouseleave", clearRepel);
      window.removeEventListener("blur", clearRepel);
    };
  }, [text]);

  return (
    <div ref={containerRef} className={className}>
      {words.map((word, wi) => (
        <span key={wi}>
          <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>
            {word.split("").map((ch, ci) => (
              <span
                key={ci}
                data-char
                style={{
                  display: "inline-block",
                  willChange: "transform",
                }}
              >
                {ch}
              </span>
            ))}
          </span>
          {wi < words.length - 1 ? " " : ""}
        </span>
      ))}
    </div>
  );
}
