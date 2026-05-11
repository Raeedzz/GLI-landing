"use client";

import { useEffect, useRef, useState } from "react";

const OCTOCAT_PATH =
  "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z";

const VIEW_SIZE = 16;
const DISPLAY_SIZE_PX = 28;
const CANVAS_INTERNAL = 88;
const CELL_PX = 5;
const ASCII =
  "01{}[]()/\\$*#@%&?!~^|<>+=GoOnWaReabc23456789";
const CASCADE_DURATION_MS = 720;
const MUTATE_FRACTION_PER_FRAME = 0.045;

type Cell = {
  x: number;
  y: number;
  row: number;
  col: number;
  char: string;
  threshold: number;
};

function pickChar() {
  return ASCII[Math.floor(Math.random() * ASCII.length)];
}

export default function GitHubLink() {
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);
  const hoveringRef = useRef(false);
  const cascadeStartRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    hoveringRef.current = hovering;
    if (hovering) cascadeStartRef.current = performance.now();
  }, [hovering]);

  useEffect(() => {
    const target = document.getElementById("download");
    const root = document.querySelector("main");
    if (!target || !root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) setVisible(e.isIntersecting);
      },
      { root, threshold: 0.35 },
    );
    obs.observe(target);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = CANVAS_INTERNAL;
    canvas.height = CANVAS_INTERNAL;

    const mask = document.createElement("canvas");
    mask.width = CANVAS_INTERNAL;
    mask.height = CANVAS_INTERNAL;
    const mctx = mask.getContext("2d")!;
    const scale = CANVAS_INTERNAL / VIEW_SIZE;
    mctx.scale(scale, scale);
    mctx.fillStyle = "#fff";
    mctx.fill(new Path2D(OCTOCAT_PATH));
    const maskData = mctx.getImageData(0, 0, CANVAS_INTERNAL, CANVAS_INTERNAL);

    function inMask(x: number, y: number): boolean {
      const px = Math.floor(x);
      const py = Math.floor(y);
      if (px < 0 || py < 0 || px >= CANVAS_INTERNAL || py >= CANVAS_INTERNAL)
        return false;
      return maskData.data[(py * CANVAS_INTERNAL + px) * 4 + 3] > 100;
    }

    const cols = Math.floor(CANVAS_INTERNAL / CELL_PX);
    const rows = Math.floor(CANVAS_INTERNAL / CELL_PX);
    const colDelays = new Array(cols)
      .fill(0)
      .map(() => Math.random() * 0.32);
    const maxDelay = Math.max(...colDelays);

    const cells: Cell[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * CELL_PX + CELL_PX / 2;
        const y = r * CELL_PX + CELL_PX / 2;
        if (!inMask(x, y)) continue;
        const rowFrac = r / Math.max(1, rows - 1);
        const threshold = (rowFrac + colDelays[c]) / (1 + maxDelay);
        cells.push({
          x,
          y,
          row: r,
          col: c,
          char: pickChar(),
          threshold,
        });
      }
    }

    ctx.font = `${CELL_PX + 1}px ui-monospace, "JetBrains Mono", monospace`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    let rafId = 0;

    function loop(now: number) {
      ctx!.clearRect(0, 0, CANVAS_INTERNAL, CANVAS_INTERNAL);

      const isHover = hoveringRef.current;
      const cascadeProgress = isHover
        ? Math.min(1, (now - cascadeStartRef.current) / CASCADE_DURATION_MS)
        : 1;

      if (cascadeProgress < 1) {
        const n = Math.max(1, Math.floor(cells.length * MUTATE_FRACTION_PER_FRAME));
        for (let i = 0; i < n; i++) {
          cells[Math.floor(Math.random() * cells.length)].char = pickChar();
        }
      }

      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        if (cascadeProgress < cell.threshold) continue;
        const justArrived =
          cascadeProgress < cell.threshold + 0.08 && cascadeProgress < 1;
        ctx!.fillStyle = justArrived
          ? "rgba(255,255,255,1)"
          : "rgba(255,255,255,0.92)";
        ctx!.fillText(cell.char, cell.x, cell.y);
      }

      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <a
      href="https://github.com/Raeedzz/GLI"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="View Goonware on GitHub"
      aria-hidden={!visible}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translate3d(0, 0, 0) scale(1)"
          : "translate3d(12px, -6px, 0) scale(0.94)",
        filter: visible ? "blur(0)" : "blur(2px)",
        transitionProperty: "opacity, transform, filter",
        transitionDuration: visible ? "950ms" : "450ms",
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        pointerEvents: visible ? "auto" : "none",
        willChange: "opacity, transform, filter",
      }}
      className="fixed top-5 right-5 sm:top-7 sm:right-8 z-50 inline-flex items-center justify-center p-2 -m-2"
    >
      <div
        className="relative"
        style={{ width: DISPLAY_SIZE_PX, height: DISPLAY_SIZE_PX }}
      >
        <svg
          viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
          width={DISPLAY_SIZE_PX}
          height={DISPLAY_SIZE_PX}
          className="absolute inset-0 fill-white pointer-events-none"
          style={{
            opacity: hovering ? 0 : 0.92,
            transition: "opacity 180ms ease-out",
          }}
          aria-hidden="true"
        >
          <path d={OCTOCAT_PATH} />
        </svg>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{
            width: DISPLAY_SIZE_PX,
            height: DISPLAY_SIZE_PX,
            opacity: hovering ? 1 : 0,
            transition: "opacity 180ms ease-out",
          }}
          aria-hidden="true"
        />
      </div>
    </a>
  );
}
