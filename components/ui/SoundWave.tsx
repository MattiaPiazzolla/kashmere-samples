'use client'

import { useState, useRef, useEffect } from 'react'

export default function SoundWave() {
  const [mounted, setMounted] = useState(false)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  // Use useEffect to ensure hydration matches SSR, then we can apply client-only interactive styles
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="flex flex-col items-center gap-2 mt-8 mb-4 w-full">
      {/* Decorative music labels */}
      <div className="flex items-center justify-between w-full max-w-md px-2 text-[10px] font-mono text-neutral-500 tracking-widest uppercase">
        <span className="flex items-center gap-2">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="hover:text-amber-400 transition-colors cursor-pointer"
          >
            {isPlaying ? '■ STOP' : '▶ PLAY'}
          </button>
        </span>
        <span>STEREO OUT // 44.1kHz</span>
      </div>

      {/* Waveform */}
      <div 
        ref={containerRef}
        className="relative flex items-end justify-center gap-[3px] h-20 w-full max-w-md p-3 bg-neutral-900/50 border border-neutral-800/60 rounded-xl cursor-crosshair group overflow-hidden"
        onMouseMove={(e) => {
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect()
          // Adjust for internal padding
          const x = e.clientX - rect.left - 12 
          const usableWidth = rect.width - 24
          const percentage = Math.max(0, Math.min(1, x / usableWidth));
          const idx = Math.floor(percentage * 48);
          setHoverIdx(Math.min(47, idx));
        }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <style>{`
          @keyframes eqPlay {
            0%, 100% { transform: scaleY(0.4); opacity: 0.5; }
            50% { transform: scaleY(1); opacity: 1; }
          }
        `}</style>
        
        {Array.from({ length: 48 }).map((_, i) => {
          // Deterministic pattern for SSR hydration (No Math.random!)
          const x = i / 47;
          const sine1 = Math.sin(x * Math.PI * 6);
          const sine2 = Math.sin(x * Math.PI * 4 + 1.5);
          const envelope = Math.sin(x * Math.PI); // Taper edges
          // Pseudo-random factor based on index to keep it deterministic
          const pseudoRandom = ((i * 137) % 100) / 100 * 0.4 + 0.6; 
          
          let baseHeight = Math.abs((sine1 * 0.5 + sine2 * 0.5) * envelope * pseudoRandom);
          
          // If stopped, flatten the wave gracefully
          if (mounted && !isPlaying) {
             baseHeight = 0.05;
          }

          // FIX HYDRATION precision error by fixing to 2 decimals
          let height = Math.max(0.1, baseHeight) * 56; 
          height = Number(height.toFixed(2));
          
          const delay = Number(((i * 0.04) % 2).toFixed(2));

          // Interactive Hover calculations
          let scaleMulti = 1;
          let isHovered = false;
          if (mounted && hoverIdx !== null) {
            const dist = Math.abs(hoverIdx - i);
            if (dist === 0) { scaleMulti = 1.3; isHovered = true; }
            else if (dist === 1) scaleMulti = 1.15;
            else if (dist === 2) scaleMulti = 1.05;
          }

          // compute final height to 2 decimals
          const finalHeight = mounted ? Number((height * scaleMulti).toFixed(2)) : height;
          
          return (
            <span
              key={i}
              className={`w-1.5 md:w-2 rounded-full transition-all duration-150 ease-out origin-bottom ${
                isHovered ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]' : 'bg-neutral-500'
              }`}
              style={{
                height: `${finalHeight}px`,
                animationName: (mounted && isPlaying && hoverIdx === null) ? 'eqPlay' : 'none',
                animationDuration: '1.5s',
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
        
        {/* Animated playhead line across the wave */}
        {mounted && isPlaying && hoverIdx === null && (
          <div className="absolute inset-y-0 left-0 w-full pointer-events-none overflow-hidden rounded-xl">
            <div 
              className="absolute top-0 bottom-0 w-[2px] bg-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.8)]"
              style={{
                animation: 'playhead 4s linear infinite',
              }}
            />
            <style>{`
              @keyframes playhead {
                0% { transform: translateX(0); opacity: 0; }
                5% { opacity: 1; }
                95% { opacity: 1; }
                100% { transform: translateX(440px); opacity: 0; }
              }
            `}</style>
          </div>
        )}
      </div>
      
      {/* Decorative timeline */}
      <div className="flex items-center justify-between w-full max-w-md px-2 text-[9px] font-mono text-neutral-600">
        <span>0:00</span>
        <div className="flex-1 border-t border-neutral-800 mx-3 border-dashed"></div>
        <span>2:45</span>
      </div>
    </div>
  )
}
