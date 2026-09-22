import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import MetaSEO from '../components/layout/MetaSEO';

// Import Linear-style Components
import LinearFigures from '../components/home/LinearFigures';
import LinearProductMockup from '../components/home/LinearProductMockup';
import LinearQuotes from '../components/home/LinearQuotes';
import LogoCloud from '../components/home/LogoCloud';

// Subdued Linear Sprinkle Particles (Emerald + Subtle Grey Accent)
function LinearSprinkleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const mouse = { x: -1000, y: -1000, radius: 120 };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const particleCount = Math.floor((width * height) / 10000);
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.5,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        alpha: Math.random() * 0.4 + 0.1,
        color: Math.random() > 0.8 ? '#35E6A4' : '#6E737D', // Brand Emerald & Grey
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
          const force = (mouse.radius - distance) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          p.x -= Math.cos(angle) * force * 3;
          p.y -= Math.sin(angle) * force * 3;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 opacity-50"
    />
  );
}

export default function Home() {
  return (
    <>
      <MetaSEO 
        title="Sovereign AI | The Complete Secure Foundation" 
        description="Air-gapped local AI workbench for enterprise document intelligence, OCR, layout parsing, and secure vector execution."
      />

      {/* Embedded Color System Variables */}
      <style>{`
        :root {
          --bg-base: #0B0C0E;
          --bg-surface: #121417;
          --bg-card: #181B20;
          --text-primary: #F7F8F8;
          --text-secondary: #8A8F98;
          --text-muted: #6E737D;
          --border: #22262F;
          --accent-emerald: #35E6A4;
        }

        @keyframes fadeInDown {
          0% { opacity: 0; transform: translateY(-12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeInDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Main Container - Linear Monochromatic Style */}
      <div className="relative flex-1 flex flex-col justify-center bg-[#0B0C0E] text-[#F7F8F8] overflow-hidden selection:bg-[#35E6A4] selection:text-[#0B0C0E]">
        
        {/* Subtle Ambient Radial Glow (Linear Aesthetic) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#35E6A4]/10 via-[#35E6A4]/5 to-transparent blur-[140px] pointer-events-none rounded-full z-0" />

        {/* Canvas Particle Background */}
        <LinearSprinkleBackground />

        {/* Hero Section */}
        <section className="relative z-10 px-6 pt-24 pb-16 max-w-5xl mx-auto text-center">
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-[#121417] border border-[#22262F] text-[#8A8F98] text-xs font-mono mb-8 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#35E6A4] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#35E6A4]"></span>
            </span>
            <span className="text-[#F7F8F8] font-medium">SOVEREIGN AI</span>
            <span className="text-[#6E737D]">|</span>
            <span>The Complete Secure Foundation</span>
          </div>

          <h1 className="animate-fade-in text-4xl md:text-6xl font-bold tracking-tight text-[#F7F8F8] mb-6 leading-[1.1]">
            Build, process, and query <br />
            <span className="text-[#8A8F98]">confidential documents offline.</span>
          </h1>

          <p className="text-[#8A8F98] text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            An air-gapped document intelligence platform. Turn complex PDFs, tables, and handwritten data into structured JSON with 100% data sovereignty.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Primary CTA - Linear Style Clean Button */}
            <Link
              to="/workbench"
              className="w-full sm:w-auto px-6 py-3 text-sm font-medium rounded-lg bg-[#F7F8F8] hover:bg-[#E1E4E6] text-[#0B0C0E] transition-all shadow-sm active:scale-95"
            >
              Open Studio &rarr;
            </Link>

            {/* Secondary CTA - Dark Border Button */}
            <a
              href="#figures"
              className="w-full sm:w-auto px-6 py-3 text-sm font-medium rounded-lg bg-[#121417] hover:bg-[#181B20] text-[#F7F8F8] border border-[#22262F] transition-all active:scale-95"
            >
              System Architecture
            </a>
          </div>
        </section>

        {/* Brand Logo Ticker */}
        <div className="relative z-10 my-4 opacity-75">
          <LogoCloud />
        </div>

        {/* Linear Component 1: Wireframe Diagrams (FIG 0.1, 0.2, 0.3) */}
        <div id="figures" className="relative z-10">
          <LinearFigures />
        </div>

        {/* Linear Component 2: Product Mockup Overlay */}
        <div className="relative z-10">
          <LinearProductMockup />
        </div>

        {/* Linear Component 3: Minimal Testimonial Cards */}
        <div className="relative z-10">
          <LinearQuotes />
        </div>

      </div>
    </>
  );
}