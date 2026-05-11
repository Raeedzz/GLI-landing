"use client";

import { useEffect, useRef } from "react";

const APPLE_PATH =
  "M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701";

const VIEW_SIZE = 24;
const CANVAS_INTERNAL = 88;
const CELL_PX = 4;
const ASCII = "01{}[]()/\\$*#@%&?!~^|<>+=GoOnWaReabc23456789";
const CASCADE_DURATION_MS = 720;
const MUTATE_FRACTION_PER_FRAME = 0.045;

type Cell = {
  x: number;
  y: number;
  threshold: number;
  char: string;
};

function pickChar() {
  return ASCII[Math.floor(Math.random() * ASCII.length)];
}

interface Props {
  hovering: boolean;
}

export default function AppleIcon({ hovering }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoveringRef = useRef(false);
  const cascadeStartRef = useRef(0);

  useEffect(() => {
    hoveringRef.current = hovering;
    if (hovering) cascadeStartRef.current = performance.now();
  }, [hovering]);

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
    mctx.fill(new Path2D(APPLE_PATH));
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
        cells.push({ x, y, threshold, char: pickChar() });
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
          ? "rgba(0,0,0,1)"
          : "rgba(0,0,0,0.92)";
        ctx!.fillText(cell.char, cell.x, cell.y);
      }
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <span className="relative block w-full h-full">
      <svg
        viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
        className="absolute inset-0 w-full h-full fill-white pointer-events-none"
        style={{
          opacity: hovering ? 0 : 1,
          transition: "opacity 180ms ease-out",
        }}
        aria-hidden="true"
        preserveAspectRatio="xMidYMid meet"
      >
        <path d={APPLE_PATH} />
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
    </span>
  );
}
