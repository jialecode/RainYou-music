import React, { useRef, useEffect } from "react";
import SmartImage from "./SmartImage";

interface CoverProps {
  src?: string;
  isPlaying: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  size?: "sm" | "md" | "lg";
}

const Cover: React.FC<CoverProps> = ({
  src,
  isPlaying,
  className = "",
  onClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const angleRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (isPlaying) {
      el.style.transition = "";
      
      const animate = (timestamp: number) => {
        if (lastTimeRef.current === null) {
          lastTimeRef.current = timestamp;
        }
        const delta = timestamp - lastTimeRef.current;
        lastTimeRef.current = timestamp;

        // 360 degrees in 16 seconds => ~0.0225 deg per ms
        angleRef.current = (angleRef.current + delta * 0.0225) % 360;
        el.style.transform = `rotate(${angleRef.current}deg)`;
        animFrameRef.current = requestAnimationFrame(animate);
      };

      lastTimeRef.current = null;
      animFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      
      const startAngle = angleRef.current;
      el.style.transform = `rotate(${startAngle}deg)`;
      
      // Force a reflow
      el.offsetHeight; 

      el.style.transition = "transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)";
      el.style.transform = "rotate(0deg)";
      
      angleRef.current = 0;
    }

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <div
      className={`relative aspect-square w-full h-full rounded-full flex items-center justify-center select-none ${className}`}
      onClick={onClick}
    >
      {/* Rotating Vinyl Disc */}
      <div
        ref={containerRef}
        className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-zinc-950 shadow-[0_12px_35px_rgba(0,0,0,0.65),_inset_0_0_20px_rgba(255,255,255,0.08)] border border-white/10"
        style={{
          backgroundImage: `
            radial-gradient(circle at 35% 35%, rgba(255,255,255,0.12) 0%, transparent 20%),
            radial-gradient(circle at 65% 65%, rgba(255,255,255,0.08) 0%, transparent 25%),
            repeating-radial-gradient(circle at center, #18181b 0px, #09090b 2px, #18181b 4px, #27272a 6px)
          `,
        }}
      >
        {/* Subtle Vinyl Grooves Ring Overlays */}
        <div className="absolute inset-2 rounded-full border border-white/10 pointer-events-none opacity-40" />
        <div className="absolute inset-5 rounded-full border border-white/5 pointer-events-none opacity-30" />
        <div className="absolute inset-9 rounded-full border border-white/10 pointer-events-none opacity-40" />
        <div className="absolute inset-14 rounded-full border border-white/5 pointer-events-none opacity-20" />

        {/* Vinyl Sheen Reflection Highlight */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none mix-blend-overlay opacity-30"
          style={{
            background: "conic-gradient(from 45deg, transparent 0deg, rgba(255,255,255,0.4) 45deg, transparent 90deg, transparent 180deg, rgba(255,255,255,0.4) 225deg, transparent 270deg)"
          }}
        />

        {/* Center Album Cover Label */}
        <div className="relative w-[62%] h-[62%] rounded-full overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.8)] border-2 border-zinc-800/80 flex items-center justify-center bg-zinc-900">
          {src ? (
            <SmartImage
              src={src}
              containerClassName="w-full h-full"
              imgClassName="w-full h-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/30 bg-zinc-800">
              <span className="text-3xl font-light select-none">♪</span>
            </div>
          )}

          {/* Center Spindle Hole */}
          <div className="absolute inset-0 m-auto w-5 h-5 rounded-full bg-zinc-950 border-2 border-zinc-700/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)] z-20 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-black" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cover;

