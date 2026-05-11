"use client";

import { useEffect, useRef, useState } from "react";

const ASCII = "01{}[]()/\\$*#@%&?!~^|<>+=GoOnWaReabc23456789";
const CASCADE_DURATION_MS = 760;
const MUTATE_FRACTION_PER_FRAME = 0.045;

interface Props {
  path: string;
  viewSize: number;
  canvasInternal: number;
  cellPx: number;
  href: string;
  ariaLabel: string;
  external?: boolean;
  className?: string;
}

function pickChar() {
  return ASCII[Math.floor(Math.random() * ASCII.length)];
}

export default function AsciiIcon({
  path,
  viewSize,
  canvasInternal,
  cellPx,
  href,
  ariaLabel,
  external = true,
  className = "",
}: Props) {
  const [hovering, setHovering] = useState(false);
  const hoveringRef = useRef(false);
  const cascadeStartRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    hoveringRef.current = hovering;
    if (hovering) cascadeStartRef.current = performance.now();
  }, [hovering]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvasInternal;
    canvas.height = canvasInternal;

    const mask = document.createElement("canvas");
    mask.width = canvasInternal;
    mask.height = canvasInternal;
    const mctx = mask.getContext("2d")!;
    const scale = canvasInternal / viewSize;
    mctx.scale(scale, scale);
    mctx.fillStyle = "#fff";
    mctx.fill(new Path2D(path));
    const maskData = mctx.getImageData(0, 0, canvasInternal, canvasInternal);

    function inMask(x: number, y: number): boolean {
      const px = Math.floor(x);
      const py = Math.floor(y);
      if (px < 0 || py < 0 || px >= canvasInternal || py >= canvasInternal)
        return false;
      return maskData.data[(py * canvasInternal + px) * 4 + 3] > 100;
    }

    const cols = Math.floor(canvasInternal / cellPx);
    const rows = Math.floor(canvasInternal / cellPx);
    const colDelays = new Array(cols)
      .fill(0)
      .map(() => Math.random() * 0.32);
    const maxDelay = Math.max(...colDelays);

    type Cell = { x: number; y: number; threshold: number; char: string };
    const cells: Cell[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cellPx + cellPx / 2;
        const y = r * cellPx + cellPx / 2;
        if (!inMask(x, y)) continue;
        const rowFrac = r / Math.max(1, rows - 1);
        const threshold = (rowFrac + colDelays[c]) / (1 + maxDelay);
        cells.push({ x, y, threshold, char: pickChar() });
      }
    }

    ctx.font = `${cellPx + 1}px ui-monospace, "JetBrains Mono", monospace`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    let rafId = 0;
    function loop(now: number) {
      ctx!.clearRect(0, 0, canvasInternal, canvasInternal);
      const isHover = hoveringRef.current;
      const cascadeProgress = isHover
        ? Math.min(1, (now - cascadeStartRef.current) / CASCADE_DURATION_MS)
        : 1;

      if (cascadeProgress < 1) {
        const n = Math.max(
          1,
          Math.floor(cells.length * MUTATE_FRACTION_PER_FRAME),
        );
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
  }, [path, viewSize, canvasInternal, cellPx]);

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      aria-label={ariaLabel}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
      className={`relative inline-block group transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.05] ${className}`}
    >
      <svg
        viewBox={`0 0 ${viewSize} ${viewSize}`}
        className="absolute inset-0 w-full h-full fill-white pointer-events-none"
        style={{
          opacity: hovering ? 0 : 0.92,
          transition: "opacity 180ms ease-out",
        }}
        aria-hidden="true"
        preserveAspectRatio="xMidYMid meet"
      >
        <path d={path} />
      </svg>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          opacity: hovering ? 1 : 0,
          transition: "opacity 180ms ease-out",
        }}
        aria-hidden="true"
      />
    </a>
  );
}
