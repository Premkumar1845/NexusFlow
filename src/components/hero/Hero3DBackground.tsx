"use client";

import { useEffect, useRef } from "react";

/**
 * Interactive 3D particle-network background for the hero.
 *
 * Renders a cloud of points in 3D space, projected to 2D with perspective.
 * The cloud auto-rotates and parallax-tilts toward the pointer, and nearby
 * points are linked with depth-faded lines — giving a premium, dynamic feel.
 * Pure Canvas2D (no dependencies), DPR-aware, and respects reduced-motion.
 *
 * Palette stays neutral: slate points with faint brand-blue (#1A56DB) links.
 */
export default function Hero3DBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        let width = 0;
        let height = 0;
        let dpr = Math.min(window.devicePixelRatio || 1, 2);

        type P = { x: number; y: number; z: number; vx: number; vy: number; vz: number };
        let points: P[] = [];

        // Rotation state + pointer-driven targets.
        let angX = 0;
        let angY = 0;
        let targetX = 0;
        let targetY = 0;
        const pointer = { x: 0.5, y: 0.5, active: false };

        function seed() {
            const area = width * height;
            // Scale particle count with screen size, clamped for performance.
            const count = Math.max(36, Math.min(110, Math.round(area / 16000)));
            points = Array.from({ length: count }, () => ({
                x: Math.random() * 2 - 1,
                y: Math.random() * 2 - 1,
                z: Math.random() * 2 - 1,
                vx: (Math.random() - 0.5) * 0.0016,
                vy: (Math.random() - 0.5) * 0.0016,
                vz: (Math.random() - 0.5) * 0.0016,
            }));
        }

        function resize() {
            const rect = canvas!.getBoundingClientRect();
            width = rect.width;
            height = rect.height;
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas!.width = Math.floor(width * dpr);
            canvas!.height = Math.floor(height * dpr);
            ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
            seed();
        }

        function onPointerMove(e: PointerEvent) {
            pointer.x = e.clientX / window.innerWidth;
            pointer.y = e.clientY / window.innerHeight;
            pointer.active = true;
        }
        function onPointerLeave() {
            pointer.active = false;
        }

        const ro = new ResizeObserver(resize);
        ro.observe(canvas);
        resize();
        window.addEventListener("pointermove", onPointerMove, { passive: true });
        window.addEventListener("pointerleave", onPointerLeave);

        let raf = 0;
        const spread = () => Math.min(width, height) * 0.42;
        const fov = 2.4;

        function frame() {
            ctx!.clearRect(0, 0, width, height);

            // Soft pointer-following glow (neutral brand tint) for interactivity.
            const gx = pointer.active ? pointer.x * width : width / 2;
            const gy = pointer.active ? pointer.y * height : height * 0.4;
            const glow = ctx!.createRadialGradient(gx, gy, 0, gx, gy, Math.min(width, height) * 0.55);
            glow.addColorStop(0, "rgba(26, 86, 219, 0.06)");
            glow.addColorStop(1, "rgba(26, 86, 219, 0)");
            ctx!.fillStyle = glow;
            ctx!.fillRect(0, 0, width, height);

            // Ease rotation toward pointer-driven target + gentle auto-spin.
            targetY = (pointer.x - 0.5) * 0.9;
            targetX = (pointer.y - 0.5) * 0.6;
            if (!reduceMotion) angY += 0.0016;
            angX += (targetX - angX) * 0.04;
            angY += (targetY - angY) * 0.02;

            const cx = width / 2;
            const cy = height / 2;
            const s = spread();

            const cosY = Math.cos(angY);
            const sinY = Math.sin(angY);
            const cosX = Math.cos(angX);
            const sinX = Math.sin(angX);

            type Proj = { sx: number; sy: number; scale: number; depth: number };
            const proj: Proj[] = new Array(points.length);

            for (let i = 0; i < points.length; i++) {
                const p = points[i];
                if (!reduceMotion) {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.z += p.vz;
                    // wrap inside the unit cube
                    if (p.x > 1) p.x = -1; else if (p.x < -1) p.x = 1;
                    if (p.y > 1) p.y = -1; else if (p.y < -1) p.y = 1;
                    if (p.z > 1) p.z = -1; else if (p.z < -1) p.z = 1;
                }

                // rotate around Y then X
                const x1 = p.x * cosY - p.z * sinY;
                const z1 = p.x * sinY + p.z * cosY;
                const y1 = p.y * cosX - z1 * sinX;
                const z2 = p.y * sinX + z1 * cosX;

                const scale = fov / (fov + z2);
                proj[i] = {
                    sx: cx + x1 * s * scale,
                    sy: cy + y1 * s * scale,
                    scale,
                    depth: (z2 + 1) / 2, // 0 far → 1 near
                };
            }

            // links
            const maxDist = Math.min(width, height) * 0.22;
            for (let i = 0; i < proj.length; i++) {
                const a = proj[i];
                for (let j = i + 1; j < proj.length; j++) {
                    const b = proj[j];
                    const dx = a.sx - b.sx;
                    const dy = a.sy - b.sy;
                    const d = Math.hypot(dx, dy);
                    if (d < maxDist) {
                        const t = 1 - d / maxDist;
                        const depth = (a.depth + b.depth) / 2;
                        ctx!.strokeStyle = `rgba(26, 86, 219, ${(t * 0.22 * depth).toFixed(3)})`;
                        ctx!.lineWidth = Math.max(0.4, t * 1.2 * depth);
                        ctx!.beginPath();
                        ctx!.moveTo(a.sx, a.sy);
                        ctx!.lineTo(b.sx, b.sy);
                        ctx!.stroke();
                    }
                }
            }

            // points
            for (let i = 0; i < proj.length; i++) {
                const a = proj[i];
                const r = Math.max(0.7, a.scale * 2.3 * (0.5 + a.depth));
                ctx!.beginPath();
                ctx!.arc(a.sx, a.sy, r, 0, Math.PI * 2);
                ctx!.fillStyle = `rgba(51, 65, 85, ${(0.34 + a.depth * 0.45).toFixed(3)})`;
                ctx!.fill();
            }

            raf = requestAnimationFrame(frame);
        }

        raf = requestAnimationFrame(frame);

        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerleave", onPointerLeave);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full"
        />
    );
}
