import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import heroFashion from "@/assets/hero-fashion.jpg";

const BackgroundFX = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = (canvas.width = window.innerWidth * devicePixelRatio);
    let h = (canvas.height = window.innerHeight * devicePixelRatio);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";

    const count = Math.min(120, Math.floor((window.innerWidth * window.innerHeight) / 16000));
    const particles = Array.from({ length: count }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: (Math.random() * 1.4 + 0.4) * devicePixelRatio,
    }));

    const onResize = () => {
      w = canvas.width = window.innerWidth * devicePixelRatio;
      h = canvas.height = window.innerHeight * devicePixelRatio;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    };
    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX * devicePixelRatio;
      mouse.current.y = e.clientY * devicePixelRatio;
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMove);

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      // particles
      for (const p of particles) {
        const dx = p.x - mouse.current.x;
        const dy = p.y - mouse.current.y;
        const d2 = dx * dx + dy * dy;
        const radius = 160 * devicePixelRatio;
        if (d2 < radius * radius) {
          const f = (1 - Math.sqrt(d2) / radius) * 0.6;
          p.vx += (dx / Math.sqrt(d2 + 0.01)) * f * 0.4;
          p.vy += (dy / Math.sqrt(d2 + 0.01)) * f * 0.4;
        }
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w; else if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; else if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      // links
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const max = 120 * devicePixelRatio;
          if (dist < max) {
            const alpha = (1 - dist / max) * 0.25;
            ctx.strokeStyle = `hsla(22, 100%, 60%, ${alpha})`;
            ctx.lineWidth = 0.6 * devicePixelRatio;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      {/* Original hero photo as deep background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url(${heroFashion})` }}
      />
      <div className="absolute inset-0 bg-background/70" />
      {/* Mesh gradient layers */}
      <div className="absolute inset-0 bg-gradient-page" />
      <motion.div
        className="absolute -top-1/4 -left-1/4 h-[80vh] w-[80vh] rounded-full blur-[120px] opacity-60"
        style={{ background: "radial-gradient(circle, hsl(22 100% 50% / 0.55), transparent 60%)" }}
        animate={{ x: [0, 80, -40, 0], y: [0, 60, 100, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/4 -right-1/4 h-[85vh] w-[85vh] rounded-full blur-[120px] opacity-55"
        style={{ background: "radial-gradient(circle, hsl(275 60% 47% / 0.6), transparent 60%)" }}
        animate={{ x: [0, -100, 40, 0], y: [0, 80, -60, 0], scale: [1, 1.05, 1.1, 1] }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 h-[60vh] w-[60vh] rounded-full blur-[120px] opacity-45"
        style={{ background: "radial-gradient(circle, hsl(240 33% 14% / 0.7), transparent 60%)" }}
        animate={{ x: [0, 60, -80, 0], y: [0, -60, 40, 0] }}
        transition={{ duration: 36, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* subtle grid */}
      <div className="absolute inset-0 grid-lines opacity-30" style={{ maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)" }} />

      {/* particles canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* grain */}
      <div
        className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.7'/></svg>\")",
        }}
      />

      {/* vignette */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 50%, hsl(240 10% 2% / 0.7) 100%)" }} />
    </div>
  );
};

export default BackgroundFX;
