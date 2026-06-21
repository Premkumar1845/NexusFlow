"use client";

import { useEffect, useRef } from "react";

/**
 * Interactive 3D neural-network background for the hero.
 *
 * Renders an AI-style neural mesh: nodes arranged on a 3D sphere (Fibonacci
 * distribution) projected with perspective, linked to their nearest neighbours,
 * with glowing "signal" pulses that flow along the connections — evoking a
 * living neural network. The whole field auto-rotates in 3D and parallax-tilts
 * toward the pointer for live interaction. Nodes bloom by depth for volume.
 *
 * Pure Canvas2D (zero dependencies), DPR-aware, and respects reduced-motion.
 * Palette: deep-blue nodes, brand-blue links, bright-cyan signal pulses.
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

        type Node = { x: number; y: number; z: number; phase: number };
        type Pulse = { from: number; to: number; t: number; speed: number };

        let nodes: Node[] = [];
        let adjacency: number[][] = [];
        let edges: Array<[number, number]> = [];
        let pulses: Pulse[] = [];

        // Rotation state + pointer-driven targets.
        let angX = 0;
        let angY = 0;
        const pointer = { x: 0.5, y: 0.5, active: false };

        // Build an evenly distributed set of nodes on a unit sphere using the
        // Fibonacci spiral, then precompute nearest-neighbour adjacency + edges.
        function seed() {
            const area = width * height;
            const count = Math.max(60, Math.min(150, Math.round(area / 11000)));

            const golden = Math.PI * (3 - Math.sqrt(5));
            nodes = Array.from({ length: count }, (_, i) => {
                const y = 1 - (i / (count - 1)) * 2; // 1 → -1
                const radius = Math.sqrt(Math.max(0, 1 - y * y));
                const theta = golden * i;
                // Slight radial jitter gives the mesh organic volume.
                const r = 0.82 + Math.random() * 0.18;
                return {
                    x: Math.cos(theta) * radius * r,
                    y: y * r,
                    z: Math.sin(theta) * radius * r,
                    phase: Math.random() * Math.PI * 2,
                };
            });

            // K-nearest neighbours (computed once) → adjacency + dedup edge list.
            const K = 3;
            adjacency = nodes.map(() => []);
            const edgeSet = new Set<string>();
            edges = [];
            for (let i = 0; i < nodes.length; i++) {
                const a = nodes[i];
                const dists: Array<{ j: number; d: number }> = [];
                for (let j = 0; j < nodes.length; j++) {
                    if (i === j) continue;
                    const b = nodes[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const dz = a.z - b.z;
                    dists.push({ j, d: dx * dx + dy * dy + dz * dz });
                }
                dists.sort((p, q) => p.d - q.d);
                for (let k = 0; k < K && k < dists.length; k++) {
                    const j = dists[k].j;
                    adjacency[i].push(j);
                    const key = i < j ? `${i}-${j}` : `${j}-${i}`;
                    if (!edgeSet.has(key)) {
                        edgeSet.add(key);
                        edges.push([i, j]);
                    }
                }
            }

            // Signal pulses that travel node→node along the adjacency graph.
            const pulseCount = Math.min(46, Math.max(16, Math.round(count * 0.42)));
            pulses = Array.from({ length: pulseCount }, () => {
                const from = Math.floor(Math.random() * nodes.length);
                const neighbours = adjacency[from];
                const to = neighbours.length
                    ? neighbours[Math.floor(Math.random() * neighbours.length)]
                    : from;
                return {
                    from,
                    to,
                    t: Math.random(),
                    speed: 0.006 + Math.random() * 0.012,
                };
            });
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
        let tick = 0;
        const fov = 2.6;
        const spread = () => Math.min(width, height) * 0.46;

        // Per-frame rotation/projection cache.
        let cosY = 1, sinY = 0, cosX = 1, sinX = 0, cx = 0, cy = 0, s = 0;

        function project(x: number, y: number, z: number) {
            const x1 = x * cosY - z * sinY;
            const z1 = x * sinY + z * cosY;
            const y1 = y * cosX - z1 * sinX;
            const z2 = y * sinX + z1 * cosX;
            const scale = fov / (fov + z2);
            return {
                sx: cx + x1 * s * scale,
                sy: cy + y1 * s * scale,
                scale,
                depth: (z2 + 1) / 2, // 0 far → 1 near
            };
        }

        function frame() {
            tick++;
            ctx!.clearRect(0, 0, width, height);

            // Soft pointer-following ambient glow for a live, interactive feel.
            const gx = pointer.active ? pointer.x * width : width / 2;
            const gy = pointer.active ? pointer.y * height : height * 0.42;
            const glow = ctx!.createRadialGradient(
                gx, gy, 0, gx, gy, Math.min(width, height) * 0.6
            );
            glow.addColorStop(0, "rgba(37, 99, 235, 0.07)");
            glow.addColorStop(1, "rgba(37, 99, 235, 0)");
            ctx!.fillStyle = glow;
            ctx!.fillRect(0, 0, width, height);

            // Ease rotation toward pointer target + gentle constant auto-spin.
            const targetY = (pointer.x - 0.5) * 1.0;
            const targetX = (pointer.y - 0.5) * 0.7;
            if (!reduceMotion) angY += 0.0022;
            angX += (targetX - angX) * 0.045;
            angY += (targetY - angY) * 0.02;

            cx = width / 2;
            cy = height / 2;
            s = spread();
            cosY = Math.cos(angY);
            sinY = Math.sin(angY);
            cosX = Math.cos(angX);
            sinX = Math.sin(angX);

            // Project every node once.
            const proj = new Array(nodes.length);
            for (let i = 0; i < nodes.length; i++) {
                const n = nodes[i];
                proj[i] = project(n.x, n.y, n.z);
            }

            // Edges (depth-faded brand-blue links).
            ctx!.lineWidth = 1;
            for (let e = 0; e < edges.length; e++) {
                const a = proj[edges[e][0]];
                const b = proj[edges[e][1]];
                const depth = (a.depth + b.depth) / 2;
                ctx!.strokeStyle = `rgba(37, 99, 235, ${(0.05 + depth * 0.16).toFixed(3)})`;
                ctx!.lineWidth = Math.max(0.4, depth * 1.1);
                ctx!.beginPath();
                ctx!.moveTo(a.sx, a.sy);
                ctx!.lineTo(b.sx, b.sy);
                ctx!.stroke();
            }

            // Signal pulses flowing along edges (the "AI" data flow).
            for (let p = 0; p < pulses.length; p++) {
                const pulse = pulses[p];
                if (!reduceMotion) pulse.t += pulse.speed;
                if (pulse.t >= 1) {
                    // Hand off to a neighbour of the destination (avoid backtrack).
                    const neighbours = adjacency[pulse.to];
                    let next = pulse.to;
                    if (neighbours.length) {
                        const choices = neighbours.filter((n) => n !== pulse.from);
                        const pool = choices.length ? choices : neighbours;
                        next = pool[Math.floor(Math.random() * pool.length)];
                    }
                    pulse.from = pulse.to;
                    pulse.to = next;
                    pulse.t = 0;
                }
                const a = nodes[pulse.from];
                const b = nodes[pulse.to];
                const t = pulse.t;
                const px = a.x + (b.x - a.x) * t;
                const py = a.y + (b.y - a.y) * t;
                const pz = a.z + (b.z - a.z) * t;
                const pp = project(px, py, pz);
                const r = Math.max(1.1, pp.scale * 2.6 * (0.55 + pp.depth));
                const alpha = (0.45 + pp.depth * 0.5).toFixed(3);
                const bloom = ctx!.createRadialGradient(
                    pp.sx, pp.sy, 0, pp.sx, pp.sy, r * 4
                );
                bloom.addColorStop(0, `rgba(34, 211, 238, ${alpha})`);
                bloom.addColorStop(0.4, `rgba(56, 189, 248, ${(Number(alpha) * 0.5).toFixed(3)})`);
                bloom.addColorStop(1, "rgba(56, 189, 248, 0)");
                ctx!.fillStyle = bloom;
                ctx!.beginPath();
                ctx!.arc(pp.sx, pp.sy, r * 4, 0, Math.PI * 2);
                ctx!.fill();
                ctx!.beginPath();
                ctx!.arc(pp.sx, pp.sy, r, 0, Math.PI * 2);
                ctx!.fillStyle = `rgba(224, 250, 255, ${alpha})`;
                ctx!.fill();
            }

            // Nodes with depth bloom + subtle synaptic pulsing.
            for (let i = 0; i < proj.length; i++) {
                const a = proj[i];
                const pulse = reduceMotion
                    ? 1
                    : 0.78 + 0.22 * Math.sin(tick * 0.04 + nodes[i].phase);
                const r = Math.max(0.8, a.scale * 2.1 * (0.5 + a.depth)) * pulse;

                // Halo bloom for nearer nodes.
                if (a.depth > 0.5) {
                    const halo = ctx!.createRadialGradient(
                        a.sx, a.sy, 0, a.sx, a.sy, r * 5
                    );
                    halo.addColorStop(0, `rgba(59, 130, 246, ${(0.12 * a.depth).toFixed(3)})`);
                    halo.addColorStop(1, "rgba(59, 130, 246, 0)");
                    ctx!.fillStyle = halo;
                    ctx!.beginPath();
                    ctx!.arc(a.sx, a.sy, r * 5, 0, Math.PI * 2);
                    ctx!.fill();
                }

                ctx!.beginPath();
                ctx!.arc(a.sx, a.sy, r, 0, Math.PI * 2);
                ctx!.fillStyle = `rgba(30, 64, 175, ${(0.32 + a.depth * 0.5).toFixed(3)})`;
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
