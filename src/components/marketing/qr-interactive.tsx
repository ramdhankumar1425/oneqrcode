"use client";

import { useEffect, useRef } from "react";

/**
 * Interactive QR mark. The lit modules behave like magnetic tiles: as the
 * cursor moves across the code, nearby tiles are drawn toward it and cluster
 * around the pointer; when the cursor leaves they spring back to their home
 * positions with eased motion. Purely decorative — respects reduced motion.
 */

const N = 23;

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildMatrix(): boolean[][] {
  const rand = mulberry32(20260717);
  const m: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false));

  const finder = (cx: number, cy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const border = x === 0 || x === 6 || y === 0 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        m[cy + y][cx + x] = border || core;
      }
    }
  };
  finder(0, 0);
  finder(N - 7, 0);
  finder(0, N - 7);

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const inFinder =
        (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8);
      if (inFinder) continue;
      m[y][x] = rand() < 0.46;
    }
  }
  return m;
}

type Tile = { hx: number; hy: number; x: number; y: number };

export function QrInteractive({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const matrix = buildMatrix();
    const tiles: Tile[] = [];
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (matrix[y][x]) {
          tiles.push({ hx: x + 0.5, hy: y + 0.5, x: x + 0.5, y: y + 0.5 });
        }
      }
    }

    // tiles paint in the element's current text color
    const color = getComputedStyle(canvas).color || "#0c1f15";

    let size = 0;
    let cell = 0;
    const fit = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = parent.clientWidth;
      cell = size / N;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();

    const drawStatic = () => {
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = color;
      const s = cell * 0.82;
      const r = s * 0.22;
      for (const tile of tiles) {
        ctx.beginPath();
        ctx.roundRect(tile.x * cell - s / 2, tile.y * cell - s / 2, s, s, r);
        ctx.fill();
      }
    };

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const observer = new ResizeObserver(() => {
      fit();
      if (reduceMotion) drawStatic();
    });
    observer.observe(canvas.parentElement!);

    if (reduceMotion) {
      drawStatic();
      return () => observer.disconnect();
    }

    // pointer tracked in module coordinates
    const pointer = { x: 0, y: 0, active: false };
    const toModule = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * N;
      pointer.y = ((clientY - rect.top) / rect.height) * N;
    };
    const onMove = (e: PointerEvent) => {
      toModule(e.clientX, e.clientY);
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointercancel", onLeave);

    const R = N * 0.42; // influence radius, in modules
    let raf = 0;
    const frame = () => {
      const s = cell * 0.82;
      const r = s * 0.22;
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = color;

      for (const tile of tiles) {
        let tx = tile.hx;
        let ty = tile.hy;
        if (pointer.active) {
          const dx = pointer.x - tile.hx;
          const dy = pointer.y - tile.hy;
          const d = Math.hypot(dx, dy);
          if (d < R) {
            // closer tiles are pulled harder → they collapse into a cluster
            const pull = Math.pow(1 - d / R, 1.6) * 0.82;
            tx = tile.hx + dx * pull;
            ty = tile.hy + dy * pull;
          }
        }
        // spring toward target (home, or cursor-attracted)
        tile.x += (tx - tile.x) * 0.16;
        tile.y += (ty - tile.y) * 0.16;

        ctx.beginPath();
        ctx.roundRect(tile.x * cell - s / 2, tile.y * cell - s / 2, s, s, r);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointercancel", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label="Interactive QR code whose tiles follow your cursor"
    />
  );
}
