"use client";

import { useEffect, useRef } from "react";

const ACCENTS = "{}[]()/\\$*#@%&?!~^|<>+=:;.,-_0123456789";
const WORD = "Goonware";
const FONT_SIZE = 14;
const LINE_HEIGHT = 18;
const MIN_SPEED = 9;
const MAX_SPEED = 26;
const MIN_TAIL = 9;
const MAX_TAIL = 34;
const SPAWN_CHANCE_PER_FRAME = 0.085;
const MAX_STREAMS_PER_COL = 4;
const INITIAL_STREAMS_PER_COL_AVG = 2.4;
const HEAD_FLICKER_CHANCE = 0.18;
const TAIL_FLICKER_RATE = 0.006;
const INITIAL_SWAP_PROBABILITY = 0.22;
const REPEL_R = 80;
const MAX_PUSH = 24;
const HEAD_COLOR = "rgba(255,255,255,";
const TAIL_BRIGHT = 210;
const TAIL_DIM = 110;

type Stream = {
  headRow: number;
  speed: number;
  chars: string[];
  bases: string[];
};

function randomAccent() {
  return ACCENTS[Math.floor(Math.random() * ACCENTS.length)];
}

function mutateAt(s: Stream, idx: number) {
  if (Math.random() < 0.55) {
    s.chars[idx] = randomAccent();
  } else {
    s.chars[idx] = s.bases[idx];
  }
}

function spawnStream(rows: number, fromTop: boolean): Stream {
  const tail = MIN_TAIL + Math.floor(Math.random() * (MAX_TAIL - MIN_TAIL + 1));
  const offset = Math.floor(Math.random() * WORD.length);
  const chars = new Array<string>(tail);
  const bases = new Array<string>(tail);
  for (let i = 0; i < tail; i++) {
    const baseChar = WORD[(offset + (tail - 1 - i)) % WORD.length];
    bases[i] = baseChar;
    chars[i] =
      Math.random() < INITIAL_SWAP_PROBABILITY ? randomAccent() : baseChar;
  }
  return {
    headRow: fromTop
      ? -1 - Math.random() * 4
      : Math.random() * (rows + tail) - tail,
    speed: MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED),
    chars,
    bases,
  };
}

export default function GoonwareWaterfall() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fontFamily = getComputedStyle(container).fontFamily || "monospace";
    const fontSpec = `${FONT_SIZE}px ${fontFamily}`;

    let cssWidth = 0;
    let cssHeight = 0;
    let dpr = 1;
    let cols = 0;
    let rows = 0;
    let charWidth = FONT_SIZE * 0.6;
    let boxX = 0;
    let boxY = 0;
    let streamsByCol: Stream[][] = [];
    const mouse = { x: -9999, y: -9999 };

    function resize() {
      const rect = container!.getBoundingClientRect();
      cssWidth = rect.width;
      cssHeight = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.floor(cssWidth * dpr);
      canvas!.height = Math.floor(cssHeight * dpr);
      canvas!.style.width = `${cssWidth}px`;
      canvas!.style.height = `${cssHeight}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.font = fontSpec;
      ctx!.textBaseline = "middle";
      ctx!.textAlign = "center";
      charWidth = ctx!.measureText("M").width || FONT_SIZE * 0.6;
      const boxW = Math.min(1100, cssWidth * 0.92);
      const boxH = (boxW * 9) / 16;
      cols = Math.max(1, Math.floor(boxW / charWidth));
      rows = Math.max(1, Math.floor(boxH / LINE_HEIGHT));
      boxX = (cssWidth - cols * charWidth) / 2;
      boxY = (cssHeight - rows * LINE_HEIGHT) / 2;

      streamsByCol = new Array(cols).fill(null).map(() => []);
      for (let c = 0; c < cols; c++) {
        const n = Math.min(
          MAX_STREAMS_PER_COL,
          Math.floor(Math.random() * (INITIAL_STREAMS_PER_COL_AVG * 2)),
        );
        for (let k = 0; k < n; k++) {
          streamsByCol[c].push(spawnStream(rows, false));
        }
      }
    }

    function step(dt: number) {
      for (let c = 0; c < cols; c++) {
        const colStreams = streamsByCol[c];

        if (
          colStreams.length < MAX_STREAMS_PER_COL &&
          Math.random() < SPAWN_CHANCE_PER_FRAME
        ) {
          colStreams.push(spawnStream(rows, true));
        }

        for (let i = colStreams.length - 1; i >= 0; i--) {
          const s = colStreams[i];
          s.headRow += s.speed * dt;

          if (Math.random() < HEAD_FLICKER_CHANCE) {
            mutateAt(s, 0);
          }
          const tailMutations = Math.floor(
            s.chars.length * TAIL_FLICKER_RATE * 60 * dt,
          );
          for (let m = 0; m < tailMutations; m++) {
            const idx = 1 + Math.floor(Math.random() * (s.chars.length - 1));
            if (idx < s.chars.length) mutateAt(s, idx);
          }

          if (s.headRow - s.chars.length > rows) {
            colStreams.splice(i, 1);
          }
        }
      }
    }

    function draw() {
      ctx!.clearRect(0, 0, cssWidth, cssHeight);
      const mx = mouse.x;
      const my = mouse.y;

      for (let c = 0; c < cols; c++) {
        const colStreams = streamsByCol[c];
        if (colStreams.length === 0) continue;

        const baseX = boxX + c * charWidth + charWidth / 2;

        for (let si = 0; si < colStreams.length; si++) {
          const s = colStreams[si];

          for (let i = 0; i < s.chars.length; i++) {
          const row = s.headRow - i;
          if (row < -0.5 || row > rows + 0.5) continue;

          const cellY = boxY + row * LINE_HEIGHT + LINE_HEIGHT / 2;

          const tailT =
            s.chars.length <= 1 ? 0 : i / (s.chars.length - 1);
          const alpha = Math.pow(1 - tailT, 1.5);

          const dx = baseX - mx;
          const dy = cellY - my;
          const d = Math.sqrt(dx * dx + dy * dy);

          let drawX = baseX;
          let drawY = cellY;
          if (d < REPEL_R) {
            const k = 1 - d / REPEL_R;
            const push = k * k * MAX_PUSH;
            const inv = 1 / (d || 1);
            drawX += dx * inv * push;
            drawY += dy * inv * push;
          }

          if (i === 0) {
            ctx!.fillStyle = `${HEAD_COLOR}${alpha})`;
          } else {
            const shade = Math.floor(
              TAIL_BRIGHT - tailT * (TAIL_BRIGHT - TAIL_DIM),
            );
            ctx!.fillStyle = `rgba(${shade},${shade},${shade},${alpha})`;
          }
          ctx!.fillText(s.chars[i], drawX, drawY);
          }
        }
      }
    }

    let last = performance.now();
    let rafId = 0;
    function loop(now: number) {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      step(dt);
      draw();
      rafId = requestAnimationFrame(loop);
    }

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas!.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onPointerLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);

    const ro = new ResizeObserver(() => resize());
    ro.observe(container);

    document.fonts.ready.then(() => resize());
    resize();
    last = performance.now();
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 font-mono">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
