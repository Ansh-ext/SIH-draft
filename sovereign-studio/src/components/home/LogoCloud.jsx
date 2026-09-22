import React from 'react';

export default function LogoCloud() {
  const logos = [
    { name: 'Parker', text: 'Parker' },
    { name: 'Qualcomm', text: 'Q' },
    { name: 'TDK', text: 'TDK' },
    { name: 'SCHAEFFLER', text: 'SCHAEFFLER' },
    { name: 'Seagate', text: 'Seagate' },
    { name: 'SIEMENS Energy', text: 'SIEMENS Energy' },
    { name: 'ThermoFisher', text: 'ThermoFisher SCIENTIFIC' },
    { name: 'UNIPHORE', text: 'UNIPHORE' },
    { name: 'GREENLITE', text: 'GREENLITE' },
  ];

  return (
    <section className="py-12 bg-slate-950 border-y border-slate-900 overflow-hidden font-mono select-none">
      <div className="max-w-7xl mx-auto px-6 mb-6 text-center">
        <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
          Trusted for Enterprise Document Processing & On-Device Security
        </p>
      </div>

      {/* Infinite Horizontal Logo Marquee Container */}
      <div className="relative w-full flex overflow-x-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
        <div className="flex items-center gap-12 sm:gap-16 whitespace-nowrap animate-marquee py-2">
          {/* First loop */}
          {logos.map((logo, index) => (
            <div
              key={`logo-1-${index}`}
              className="text-slate-400 hover:text-amber-400 transition-colors font-bold text-lg sm:text-xl tracking-tighter uppercase grayscale hover:grayscale-0 opacity-70 hover:opacity-100 cursor-pointer flex items-center gap-2"
            >
              <span className="font-sans tracking-wide">{logo.text}</span>
            </div>
          ))}

          {/* Duplicate loop for seamless infinite scroll animation */}
          {logos.map((logo, index) => (
            <div
              key={`logo-2-${index}`}
              className="text-slate-400 hover:text-amber-400 transition-colors font-bold text-lg sm:text-xl tracking-tighter uppercase grayscale hover:grayscale-0 opacity-70 hover:opacity-100 cursor-pointer flex items-center gap-2"
            >
              <span className="font-sans tracking-wide">{logo.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}