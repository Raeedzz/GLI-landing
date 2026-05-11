"use client";

import { useEffect, useRef } from "react";

const ACCENTS = "{}[]()/\\$*#@%&?!~^|<>+=:;.,-_0123456789";
const WORD = "Goonware";
const MIN_SPEED = 4;
const MAX_SPEED = 13;
const MIN_TAIL = 9;
const MAX_TAIL = 34;
const SPAWN_CHANCE_PER_FRAME = 0.04;
const MAX_STREAMS_PER_COL = 4;
const INITIAL_MIN_PER_COL = 2;
const INITIAL_MAX_PER_COL = 4;
const HEAD_FLICKER_CHANCE = 0.18;
const TAIL_FLICKER_RATE = 0.006;
const INITIAL_SWAP_PROBABILITY = 0.22;
const HEAD_COLOR = "rgba(255,255,255,";
const TAIL_BRIGHT = 210;
const TAIL_DIM = 110;

function pickResponsive(width: number) {
  if (width < 480) {
    return { fontSize: 11, lineHeight: 15, repelR: 60, maxPush: 18 };
  }
  if (width < 760) {
    return { fontSize: 12, lineHeight: 16, repelR: 80, maxPush: 25 };
  }
  return { fontSize: 14, lineHeight: 18, repelR: 110, maxPush: 36 };
}

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
    let fontSize = 14;
    let lineHeight = 18;
    let repelR = 110;
    let maxPush = 36;
    let fontSpec = `${fontSize}px ${fontFamily}`;

    let cssWidth = 0;
    let cssHeight = 0;
    let dpr = 1;
    let cols = 0;
    let rows = 0;
    let charWidth = fontSize * 0.6;
    let boxX = 0;
    let boxY = 0;
    let streamsByCol: Stream[][] = [];
    const mouse = { x: -9999, y: -9999 };

    function resize() {
      const rect = container!.getBoundingClientRect();
      cssWidth = rect.width;
      cssHeight = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      const r = pickResponsive(cssWidth);
      fontSize = r.fontSize;
      lineHeight = r.lineHeight;
      repelR = r.repelR;
      maxPush = r.maxPush;
      fontSpec = `${fontSize}px ${fontFamily}`;

      canvas!.width = Math.floor(cssWidth * dpr);
      canvas!.height = Math.floor(cssHeight * dpr);
      canvas!.style.width = `${cssWidth}px`;
      canvas!.style.height = `${cssHeight}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.font = fontSpec;
      ctx!.textBaseline = "middle";
      ctx!.textAlign = "center";
      charWidth = ctx!.measureText("M").width || fontSize * 0.6;

      const aspect = cssWidth / cssHeight;
      const boxW = Math.min(1100, cssWidth * 0.92);
      const boxH =
        aspect > 1.4
          ? (boxW * 9) / 16
          : Math.min(cssHeight * 0.7, boxW * 1.05);
      cols = Math.max(1, Math.floor(boxW / charWidth));
      rows = Math.max(1, Math.floor(boxH / lineHeight));
      boxX = (cssWidth - cols * charWidth) / 2;
      boxY = (cssHeight - rows * lineHeight) / 2;

      streamsByCol = new Array(cols).fill(null).map(() => []);
      for (let c = 0; c < cols; c++) {
        const span = INITIAL_MAX_PER_COL - INITIAL_MIN_PER_COL + 1;
        const n =
          INITIAL_MIN_PER_COL + Math.floor(Math.random() * span);
        for (let k = 0; k < n; k++) {
          const s = spawnStream(rows, false);
          s.headRow = ((k + Math.random()) / n) * (rows + s.chars.length) -
            s.chars.length * 0.3;
          streamsByCol[c].push(s);
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

          const cellY = boxY + row * lineHeight + lineHeight / 2;

          const tailT =
            s.chars.length <= 1 ? 0 : i / (s.chars.length - 1);
          const alpha = Math.pow(1 - tailT, 1.5);

          const dx = baseX - mx;
          const dy = cellY - my;
          const d = Math.sqrt(dx * dx + dy * dy);

          let drawX = baseX;
          let drawY = cellY;
          if (d < repelR) {
            const k = 1 - d / repelR;
            const push = k * k * maxPush;
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
    canvas.addEventListener("pointerup", onPointerLeave);
    canvas.addEventListener("pointercancel", onPointerLeave);

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
      canvas.removeEventListener("pointerup", onPointerLeave);
      canvas.removeEventListener("pointercancel", onPointerLeave);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 font-mono">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
