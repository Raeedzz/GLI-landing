"use client";

import { useEffect, useRef } from "react";

const ACCENTS = "{}[]()/\\$*#@%&?!~^|<>+=:;.,-_0123456789";
const WORD = "Goonware";
const HEADING_LINES = [
  "A GPU accelerated",
  "terminal",
  "for multi agent orchastration",
];
const BUTTON_TEXT = "DOWNLOAD FOR MAC";
const BUTTON_ID = "hero-download-button";

const MIN_SPEED = 4;
const MAX_SPEED = 13;
const MIN_TAIL = 9;
const MAX_TAIL = 34;
const SPAWN_CHANCE_PER_FRAME = 0.035;
const MAX_STREAMS_PER_COL = 4;
const HEAD_FLICKER_CHANCE = 0.09;
const TAIL_FLICKER_RATE = 0.004;
const STREAM_FADE_IN_SEC = 0.55;
const INITIAL_SWAP_PROBABILITY = 0.22;
const HEAD_COLOR_PREFIX = "rgba(255,255,255,";
const TAIL_BRIGHT = 210;
const TAIL_DIM = 110;

const HERO_END = 1.6;
const STREAMS_START = 0.05;
const PUSH_UP_START = 0.6;
const DIR_CHANGE_THRESHOLD = 0.004;

const BUTTON_DOM_FADE_START = 0.04;
const BUTTON_DOM_FADE_END = 0.1;

const HEADING_RELEASE_MIN = 0.05;
const HEADING_RELEASE_RANGE = 0.35;
const BUTTON_RELEASE_MIN = 0.1;
const BUTTON_RELEASE_RANGE = 0.35;

const FONT_SHRINK_END = 0.35;

function pickHeadingResponsive(w: number) {
  if (w < 480) return { fontSize: 18, lineHeight: 24 };
  if (w < 760) return { fontSize: 24, lineHeight: 30 };
  if (w < 1024) return { fontSize: 32, lineHeight: 40 };
  if (w < 1440) return { fontSize: 42, lineHeight: 52 };
  return { fontSize: 50, lineHeight: 62 };
}

function pickButtonResponsive(w: number) {
  if (w < 640) return { fontSize: 11, letterSpacingEm: 0.2, padY: 14 };
  if (w < 768) return { fontSize: 12, letterSpacingEm: 0.25, padY: 14 };
  return { fontSize: 14, letterSpacingEm: 0.25, padY: 16 };
}

function pickWaterfallResponsive(w: number) {
  if (w < 480)
    return { fontSize: 11, lineHeight: 15, repelR: 60, maxPush: 18 };
  if (w < 760)
    return { fontSize: 12, lineHeight: 16, repelR: 80, maxPush: 25 };
  return { fontSize: 14, lineHeight: 18, repelR: 110, maxPush: 36 };
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function smoothstep(e0: number, e1: number, x: number) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

type TextChar = {
  ch: string;
  baseX: number;
  baseY: number;
  fontSize: number;
  releaseThreshold: number;
  drift: number;
  isButton: boolean;
};

type Stream = {
  headRow: number;
  speed: number;
  chars: string[];
  bases: string[];
  age: number;
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

function spawnStream(): Stream {
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
    headRow: -1 - Math.random() * 4,
    speed: MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED),
    chars,
    bases,
    age: 0,
  };
}

export default function HeroCanvas() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const main = document.querySelector("main");
    if (!main) return;

    let cssWidth = 0;
    let cssHeight = 0;
    let dpr = 1;

    const headingCharCount = HEADING_LINES.reduce((s, l) => s + l.length, 0);
    const totalTextChars = headingCharCount + BUTTON_TEXT.length;

    const releaseThresholds = new Array(totalTextChars)
      .fill(0)
      .map((_, idx) => {
        const isButton = idx >= headingCharCount;
        return isButton
          ? BUTTON_RELEASE_MIN + Math.random() * BUTTON_RELEASE_RANGE
          : HEADING_RELEASE_MIN + Math.random() * HEADING_RELEASE_RANGE;
      });
    const drifts = new Array(totalTextChars)
      .fill(0)
      .map(() => (Math.random() - 0.5) * 2);

    let textChars: TextChar[] = [];

    let cols = 0;
    let rows = 0;
    let charWidth = 0;
    let boxX = 0;
    let boxY = 0;
    let lineHeight = 18;
    let wfFontSize = 14;
    let repelR = 110;
    let maxPush = 36;
    let streamsByCol: Stream[][] = [];

    let progress = 0;
    let lastSeenProgress = 0;
    let scrollDir: 1 | -1 = 1;
    const mouse = { x: -9999, y: -9999 };
    const button = document.getElementById(BUTTON_ID);

    function getFontFamily() {
      return getComputedStyle(canvas!).fontFamily || "monospace";
    }

    function layout() {
      const rect = wrapper!.getBoundingClientRect();
      cssWidth = rect.width;
      cssHeight = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas!.width = Math.floor(cssWidth * dpr);
      canvas!.height = Math.floor(cssHeight * dpr);
      canvas!.style.width = `${cssWidth}px`;
      canvas!.style.height = `${cssHeight}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.textBaseline = "middle";
      ctx!.textAlign = "center";

      const fontFamily = getFontFamily();
      textChars = [];
      let charIdx = 0;

      const hR = pickHeadingResponsive(cssWidth);
      const bR = pickButtonResponsive(cssWidth);
      const headingBlockH = HEADING_LINES.length * hR.lineHeight;
      const buttonH = bR.fontSize + bR.padY * 2;
      const gap = Math.max(36, cssHeight * 0.06);
      const clusterH = headingBlockH + gap + buttonH;
      const clusterTop = (cssHeight - clusterH) / 2;
      const startY = clusterTop + hR.lineHeight / 2;
      const buttonCenterY =
        clusterTop + headingBlockH + gap + buttonH / 2;

      ctx!.font = `${hR.fontSize}px ${fontFamily}`;
      for (let li = 0; li < HEADING_LINES.length; li++) {
        const line = HEADING_LINES[li];
        const lineW = ctx!.measureText(line).width;
        let x = (cssWidth - lineW) / 2;
        for (let ci = 0; ci < line.length; ci++) {
          const ch = line[ci];
          const cw = ctx!.measureText(ch).width;
          textChars.push({
            ch,
            baseX: x + cw / 2,
            baseY: startY + li * hR.lineHeight,
            fontSize: hR.fontSize,
            releaseThreshold: releaseThresholds[charIdx],
            drift: drifts[charIdx],
            isButton: false,
          });
          x += cw;
          charIdx++;
        }
      }

      const letterSpacingPx = bR.fontSize * bR.letterSpacingEm;
      ctx!.font = `${bR.fontSize}px ${fontFamily}`;
      const buttonCharWidths: number[] = [];
      let buttonTotalW = 0;
      for (let i = 0; i < BUTTON_TEXT.length; i++) {
        const cw = ctx!.measureText(BUTTON_TEXT[i]).width;
        buttonCharWidths.push(cw);
        buttonTotalW += cw;
      }
      buttonTotalW += letterSpacingPx * (BUTTON_TEXT.length - 1);
      const appleWidthPx = 1.4 * bR.fontSize;
      const buttonGapPx = 12;
      const buttonTextOffsetX = (appleWidthPx + buttonGapPx) / 2;
      let bx = (cssWidth - buttonTotalW) / 2 + buttonTextOffsetX;
      for (let i = 0; i < BUTTON_TEXT.length; i++) {
        const ch = BUTTON_TEXT[i];
        const cw = buttonCharWidths[i];
        textChars.push({
          ch,
          baseX: bx + cw / 2,
          baseY: buttonCenterY,
          fontSize: bR.fontSize,
          releaseThreshold: releaseThresholds[charIdx],
          drift: drifts[charIdx],
          isButton: true,
        });
        bx += cw + letterSpacingPx;
        charIdx++;
      }

      if (button) {
        button.style.top = `${buttonCenterY}px`;
      }

      const wR = pickWaterfallResponsive(cssWidth);
      wfFontSize = wR.fontSize;
      lineHeight = wR.lineHeight;
      repelR = wR.repelR;
      maxPush = wR.maxPush;
      ctx!.font = `${wfFontSize}px ${fontFamily}`;
      charWidth = ctx!.measureText("M").width || wfFontSize * 0.6;

      const aspect = cssWidth / cssHeight;
      const boxW = Math.min(1100, cssWidth * 0.92);
      const boxH =
        aspect > 1.4
          ? Math.min(cssHeight * 0.92, boxW * 0.95)
          : Math.min(cssHeight * 0.94, boxW * 1.4);
      cols = Math.max(1, Math.floor(boxW / charWidth));
      rows = Math.max(1, Math.floor(boxH / lineHeight));
      boxX = (cssWidth - cols * charWidth) / 2;
      boxY = (cssHeight - rows * lineHeight) / 2;

      streamsByCol = new Array(cols).fill(null).map(() => []);
    }

    function stepWaterfall(dt: number) {
      for (let c = 0; c < cols; c++) {
        const colStreams = streamsByCol[c];
        if (
          progress >= STREAMS_START &&
          scrollDir === 1 &&
          colStreams.length < MAX_STREAMS_PER_COL &&
          Math.random() < SPAWN_CHANCE_PER_FRAME
        ) {
          colStreams.push(spawnStream());
        }
        for (let i = colStreams.length - 1; i >= 0; i--) {
          const s = colStreams[i];
          s.age += dt;
          s.headRow += s.speed * dt * scrollDir;
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
          const exitedDown = s.headRow - s.chars.length > rows;
          const exitedUp =
            scrollDir === -1 && s.age > 0.8 && s.headRow < -1;
          if (exitedDown || exitedUp) {
            colStreams.splice(i, 1);
          }
        }
      }
    }

    function applyRepel(x: number, y: number): [number, number] {
      const boxRight = boxX + cols * charWidth;
      const boxBottom = boxY + rows * lineHeight;
      if (
        mouse.x < boxX ||
        mouse.x > boxRight ||
        mouse.y < boxY ||
        mouse.y > boxBottom
      ) {
        return [x, y];
      }
      const dx = x - mouse.x;
      const dy = y - mouse.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < repelR) {
        const k = 1 - d / repelR;
        const push = k * k * maxPush;
        const inv = 1 / (d || 1);
        return [x + dx * inv * push, y + dy * inv * push];
      }
      return [x, y];
    }

    function draw() {
      ctx!.clearRect(0, 0, cssWidth, cssHeight);
      const buttonCanvasVisibility = smoothstep(
        BUTTON_DOM_FADE_START,
        BUTTON_DOM_FADE_END,
        progress,
      );
      const fontFamily = getFontFamily();

      for (let i = 0; i < textChars.length; i++) {
        const c = textChars[i];
        let x = c.baseX;
        let y = c.baseY;
        let alpha = 0.92;
        let fontSize = c.fontSize;

        if (progress >= c.releaseThreshold) {
          const span = 1 - c.releaseThreshold;
          const p = span > 0 ? (progress - c.releaseThreshold) / span : 1;
          const fallY = p * 2.5 * cssHeight;
          const driftX = Math.sin(p * Math.PI) * c.drift * 6;
          const sizeT = smoothstep(0, FONT_SHRINK_END, p);
          fontSize = lerp(c.fontSize, wfFontSize, sizeT);
          y = c.baseY + fallY;
          x = c.baseX + driftX;
          alpha = clamp(1 - p * 1.15, 0, 1) * 0.92;
        }

        if (c.isButton) alpha *= buttonCanvasVisibility;

        if (alpha > 0.01) {
          if (!c.isButton) {
            [x, y] = applyRepel(x, y);
          }
          ctx!.font = `${fontSize}px ${fontFamily}`;
          ctx!.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx!.fillText(c.ch, x, y);
        }
      }

      ctx!.font = `${wfFontSize}px ${fontFamily}`;
      for (let c = 0; c < cols; c++) {
        const colStreams = streamsByCol[c];
        if (colStreams.length === 0) continue;
        const baseX = boxX + c * charWidth + charWidth / 2;
        for (let si = 0; si < colStreams.length; si++) {
          const s = colStreams[si];
          const ageFade = smoothstep(0, STREAM_FADE_IN_SEC, s.age);
          if (ageFade <= 0.005) continue;
          for (let i = 0; i < s.chars.length; i++) {
            const row = s.headRow - i;
            if (row < -0.5 || row > rows + 0.5) continue;
            const cellY = boxY + row * lineHeight + lineHeight / 2;
            const tailT = s.chars.length <= 1 ? 0 : i / (s.chars.length - 1);
            const edgeFade =
              scrollDir === 1
                ? clamp(rows + 0.5 - row, 0, 1.2) / 1.2
                : clamp(row + 0.5, 0, 1.2) / 1.2;
            const alpha = Math.pow(1 - tailT, 1.5) * ageFade * edgeFade;
            const [drawX, drawY] = applyRepel(baseX, cellY);
            if (i === 0) {
              ctx!.fillStyle = `${HEAD_COLOR_PREFIX}${alpha})`;
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
      stepWaterfall(dt);
      draw();
      rafId = requestAnimationFrame(loop);
    }

    let scrollRaf = 0;
    function applyScrollState() {
      scrollRaf = 0;
      const sh = main!.clientHeight;
      if (sh === 0) return;
      const scrollTop = main!.scrollTop;
      const heroEnd = HERO_END * sh;

      progress = clamp(scrollTop / heroEnd, 0, 1);
      const dp = progress - lastSeenProgress;

      let newDir: 1 | -1 = scrollDir;
      if (dp < -DIR_CHANGE_THRESHOLD) newDir = -1;
      else if (dp > DIR_CHANGE_THRESHOLD) newDir = 1;

      if (newDir !== scrollDir) {
        if (newDir === 1 && scrollDir === -1) {
          for (let c = 0; c < cols; c++) streamsByCol[c] = [];
        }
        scrollDir = newDir;
      }

      lastSeenProgress = progress;

      let exitTy = 0;
      if (progress > PUSH_UP_START) {
        const exitP = (progress - PUSH_UP_START) / (1 - PUSH_UP_START);
        exitTy = -exitP * sh;
      }
      wrapper!.style.opacity = "1";
      wrapper!.style.transform = `translate3d(0, ${exitTy}px, 0)`;

      if (button) {
        const domOpacity =
          1 - smoothstep(BUTTON_DOM_FADE_START, BUTTON_DOM_FADE_END, progress);
        button.style.opacity = String(domOpacity);
        button.style.pointerEvents = domOpacity > 0.5 ? "auto" : "none";
        button.style.setProperty("--exit-ty", `${exitTy}px`);
      }
    }

    function onScroll() {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(applyScrollState);
    }

    const onPointerMove = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (target && target.closest("a")) {
        mouse.x = -9999;
        mouse.y = -9999;
        return;
      }
      const rect = canvas!.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        mouse.x = -9999;
        mouse.y = -9999;
        return;
      }
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onPointerLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    document.addEventListener("pointermove", onPointerMove);
    document.documentElement.addEventListener("mouseleave", onPointerLeave);
    window.addEventListener("blur", onPointerLeave);

    main.addEventListener("scroll", onScroll, { passive: true });

    const onResize = () => {
      layout();
      applyScrollState();
    };
    window.addEventListener("resize", onResize);

    document.fonts.ready.then(() => {
      layout();
      applyScrollState();
    });
    layout();
    applyScrollState();
    last = performance.now();
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      main.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener(
        "mouseleave",
        onPointerLeave,
      );
      window.removeEventListener("blur", onPointerLeave);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="fixed inset-0 z-10 pointer-events-none will-change-transform font-mono"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full pointer-events-none font-mono"
      />
    </div>
  );
}
