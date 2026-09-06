import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { PlayIcon, PauseIcon, PrevIcon, NextIcon, LikeIcon } from "./Icons";
import Cover from "./Cover";
import type { DiscoverSong } from "../services/discover";
import type { Song } from "../types";

const formatTime = (time: number) => {
  if (isNaN(time)) return "00:00";
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

interface DeckLayoutProps {
  songs: DiscoverSong[];
  currentSong: Song | null;
  isPlaying: boolean;
  onPlaySong: (song: DiscoverSong) => void;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  accentColor?: string;
  onOpenPlayer: () => void;
  currentTime?: number;
  duration?: number;
  onSeek?: (time: number, immediate?: boolean) => void;
}

interface CardPlacement {
  x: number; // percentage offset -80 to 80
  y: number; // percentage offset -60 to 60
  rotation: number; // degrees -18 to 18
  scale: number; // scale 0.75 to 0.95
}

// Generate organic scattered placements across a wide 3D space
const getPlacements = (count: number): CardPlacement[] => {
  const placements: CardPlacement[] = [];
  
  for (let i = 0; i < count; i++) {
    const angle = i * 2.39996 + 0.8; // golden angle spiral
    const radius = 42 * Math.sqrt(i + 1) / Math.sqrt(Math.max(12, count)) + 12;
    
    const x = Math.cos(angle) * radius * 1.45;
    const y = Math.sin(angle) * radius * 1.05;
    
    const rotation = (Math.sin(i * 4.2) * 14) + (x * 0.08);
    const scale = 0.84 + (Math.cos(i * 2.3) * 0.08);
    
    placements.push({ x, y, rotation, scale });
  }
  
  return placements;
};

const DeckCardProgressBar: React.FC<{
  currentTime?: number;
  duration?: number;
  onSeek?: (time: number, immediate?: boolean) => void;
  accentColor?: string;
}> = ({ currentTime = 0, duration = 0, onSeek, accentColor }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPercent, setDragPercent] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const effectiveDuration = duration > 0 ? duration : 0;
  const currentPercent =
    effectiveDuration > 0
      ? Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100))
      : 0;
  const displayPercent = dragPercent !== null ? dragPercent : currentPercent;

  const calculatePercent = (clientX: number) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.max(0, Math.min(1, x / rect.width));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (effectiveDuration <= 0 || !onSeek) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    const p = calculatePercent(e.clientX);
    setDragPercent(p * 100);
    onSeek(p * effectiveDuration, false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging && effectiveDuration > 0 && onSeek) {
      const p = calculatePercent(e.clientX);
      setDragPercent(p * 100);
      onSeek(p * effectiveDuration, false);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging && effectiveDuration > 0 && onSeek) {
      const p = calculatePercent(e.clientX);
      setDragPercent(null);
      setIsDragging(false);
      onSeek(p * effectiveDuration, true);
    } else {
      setIsDragging(false);
      setDragPercent(null);
    }
  };

  const displayTime =
    isDragging && dragPercent !== null
      ? (dragPercent / 100) * effectiveDuration
      : currentTime;

  return (
    <div className="px-1 mb-3.5 select-none">
      <div
        ref={trackRef}
        onPointerEnter={() => setIsHovering(true)}
        onPointerLeave={() => setIsHovering(false)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative w-full h-3 flex items-center cursor-pointer group/progress touch-none"
        title="拖动或点击调整进度"
      >
        {/* Track */}
        <div className="relative w-full h-[3px] group-hover/progress:h-[5px] bg-white/15 rounded-full transition-all duration-200 overflow-visible">
          {/* Active progress fill */}
          <div
            className="h-full rounded-full transition-[width] duration-75 ease-out shadow-[0_0_10px_rgba(52,211,153,0.4)]"
            style={{
              width: `${displayPercent}%`,
              backgroundColor: accentColor ? `rgb(${accentColor})` : "#34d399",
            }}
          />

          {/* Luminous Glowing Thumb */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.95),0_2px_4px_rgba(0,0,0,0.5)] pointer-events-none transition-all duration-150 ${
              isHovering || isDragging ? "opacity-100 scale-100" : "opacity-0 scale-75"
            }`}
            style={{ left: `calc(${displayPercent}% - 6px)` }}
          />
        </div>
      </div>

      <div className="flex justify-between text-[11px] text-white/50 -mt-1 font-mono">
        <span>{formatTime(displayTime)}</span>
        <span>{formatTime(effectiveDuration)}</span>
      </div>
    </div>
  );
};

const DeckLayout: React.FC<DeckLayoutProps> = ({
  songs,
  currentSong,
  isPlaying,
  onPlaySong,
  onPlayPause,
  onNext,
  onPrev,
  accentColor,
  onOpenPlayer,
  currentTime,
  duration,
  onSeek,
}) => {
  const [focusedIdx, setFocusedIdx] = useState<number>(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastPosRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);
  const animFrameRef = useRef<number | null>(null);

  // Local active index based on currently playing song
  const playingSongIdx = useMemo(() => {
    if (!currentSong) return -1;
    return songs.findIndex(
      s => s.neteaseId === currentSong.neteaseId || s.id === currentSong.id
    );
  }, [songs, currentSong]);

  // Set focused index to the playing song when it changes
  useEffect(() => {
    if (playingSongIdx !== -1) {
      setFocusedIdx(playingSongIdx);
    }
  }, [playingSongIdx]);

  // Handle key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (songs.length === 0) return;
      
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIdx(prev => (prev + 1) % songs.length);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIdx(prev => (prev - 1 + songs.length) % songs.length);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [songs.length]);

  const placements = useMemo(() => getPlacements(Math.max(16, songs.length)), [songs.length]);

  // Inertia animation loop on release
  const startInertia = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const step = () => {
      velocityRef.current.x *= 0.92;
      velocityRef.current.y *= 0.92;

      const speed = Math.hypot(velocityRef.current.x, velocityRef.current.y);
      if (speed < 0.1) {
        animFrameRef.current = null;
        return;
      }

      setPan(prev => ({
        x: prev.x + velocityRef.current.x,
        y: prev.y + velocityRef.current.y,
      }));

      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);
  }, []);

  // Mouse Drag Handlers
  const handlePointerDown = (clientX: number, clientY: number) => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsDragging(true);
    hasDraggedRef.current = false;
    dragStartRef.current = { x: clientX - pan.x, y: clientY - pan.y };
    lastPosRef.current = { x: clientX, y: clientY };
    velocityRef.current = { x: 0, y: 0 };
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const dx = clientX - lastPosRef.current.x;
    const dy = clientY - lastPosRef.current.y;
    if (Math.hypot(dx, dy) > 3) {
      hasDraggedRef.current = true;
    }

    velocityRef.current = { x: dx, y: dy };
    lastPosRef.current = { x: clientX, y: clientY };

    setPan({
      x: clientX - dragStartRef.current.x,
      y: clientY - dragStartRef.current.y,
    });
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    startInertia();
  };

  const resetPan = () => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setPan({ x: 0, y: 0 });
    velocityRef.current = { x: 0, y: 0 };
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[82vh] lg:h-[78vh] select-none overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing"
      style={{ perspective: "1200px" }}
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).closest("button, input")) return;
        handlePointerDown(e.clientX, e.clientY);
      }}
      onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        if (touch && !(e.target as HTMLElement).closest("button, input")) {
          handlePointerDown(touch.clientX, touch.clientY);
        }
      }}
      onTouchMove={(e) => {
        const touch = e.touches[0];
        if (touch) handlePointerMove(touch.clientX, touch.clientY);
      }}
      onTouchEnd={handlePointerUp}
    >
      {/* Decorative backdrop mesh */}
      <div className="absolute inset-0 bg-radial-gradient(ellipse at center, rgba(244,63,94,0.06) 0%, transparent 75%) pointer-events-none" />
      
      {/* Floating Space Drag Pan Container */}
      <div 
        className="relative w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0px)`,
        }}
      >
        {songs.map((song, index) => {
          const isFocused = index === focusedIdx;
          const isCurrent = playingSongIdx === index;
          const isThisPlaying = isCurrent && isPlaying;
          
          const placement = placements[index % placements.length] || { x: 0, y: 0, rotation: 0, scale: 0.9 };
          
          let translateX = placement.x;
          let translateY = placement.y;
          let translateZ = -120;
          let rotateZ = placement.rotation;
          let rotateY = placement.x * 0.12;
          let rotateX = -placement.y * 0.1;
          let scale = placement.scale;
          let opacity = 0.65;
          let blur = "blur(1px)";
          let zIndex = 10 + index;

          if (isFocused) {
            translateX = 0;
            // Lift focused card up by 4vh to clear bottom play bar completely
            translateY = -4; 
            translateZ = 160;
            rotateX = 3;
            rotateY = 0;
            rotateZ = 0;
            scale = 1.25;
            opacity = 1.0;
            blur = "blur(0px)";
            zIndex = 999;
          } else {
            const diffX = placement.x;
            const diffY = placement.y;
            const dist = Math.sqrt(diffX * diffX + diffY * diffY) || 1;
            
            translateX += (diffX / dist) * 16;
            translateY += (diffY / dist) * 14;
            zIndex = 500 - Math.round(dist * 5) + (isCurrent ? 50 : 0);
          }

          return (
            <div
              key={song.id}
              onClick={() => {
                if (hasDraggedRef.current) return;
                if (!isFocused) {
                  setFocusedIdx(index);
                }
              }}
              className="absolute w-[240px] transition-all duration-500 ease-out select-none active:scale-[0.98]"
              style={{
                transform: `translate3d(${translateX}vw, ${translateY}vh, ${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
                opacity,
                filter: blur,
                zIndex,
                animation: isFocused ? "none" : `float-card-${index} ${6 + (index % 3)}s ease-in-out infinite`,
                animationDelay: `${index * 0.35}s`,
              }}
            >
              <style dangerouslySetInnerHTML={{ __html: `
                @keyframes float-card-${index} {
                  0%, 100% { transform: translate3d(${translateX}vw, ${translateY}vh, ${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale}); }
                  50% { transform: translate3d(${translateX}vw, ${translateY - 2.2}vh, ${translateZ + 15}px) rotateX(${rotateX + 1}deg) rotateY(${rotateY - 1}deg) rotateZ(${rotateZ + 1}deg) scale(${scale}); }
                }
              `}} />

              <div 
                className={`relative p-4 rounded-[28px] bg-white/10 dark:bg-zinc-950/50 backdrop-blur-[45px] border border-white/20 dark:border-white/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),_0_25px_60px_rgba(0,0,0,0.45)] transition-all duration-300 ${
                  isCurrent 
                    ? "shadow-[inset_0_1px_2px_rgba(255,255,255,0.35),_0_0_40px_rgba(16,185,129,0.3)] border-emerald-500/50 bg-white/15 dark:bg-zinc-950/65" 
                    : "hover:border-white/30 hover:bg-white/14 dark:hover:bg-zinc-950/60"
                }`}
              >
                {/* Glass reflection overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.09] to-transparent rounded-[28px] pointer-events-none z-10" />

                {/* Circular Vinyl Record Cover */}
                <div 
                  className="relative w-full aspect-square mb-3.5 flex items-center justify-center cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (hasDraggedRef.current) return;
                    if (!isFocused) {
                      setFocusedIdx(index);
                    } else {
                      onOpenPlayer();
                    }
                  }}
                >
                  <Cover src={song.coverUrl} isPlaying={isThisPlaying} />

                  {/* Play action hover badge */}
                  {isFocused && (
                    <div 
                      className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-black/60 hover:bg-black/80 hover:scale-110 active:scale-90 transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] opacity-0 group-hover:opacity-100 flex items-center justify-center backdrop-blur-md z-30 shadow-[0_4px_24px_rgba(0,0,0,0.5)] border border-white/20 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrent) {
                          onPlayPause();
                        } else {
                          onPlaySong(song);
                        }
                      }}
                    >
                      <div className="relative w-8 h-8 flex items-center justify-center pointer-events-none">
                        <PauseIcon
                          className={`absolute inset-0 w-8 h-8 text-white transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                            isThisPlaying ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 -rotate-90"
                          }`}
                        />
                        <PlayIcon
                          className={`absolute inset-0 w-8 h-8 text-white ml-1 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                            !isThisPlaying ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 rotate-90"
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Song title & artist */}
                <div className="text-left mb-3 px-1 min-w-0">
                  <h4 
                    className={`text-[15px] font-black truncate mb-0.5 leading-tight cursor-pointer ${
                      isCurrent ? "text-emerald-400" : "text-white"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (hasDraggedRef.current) return;
                      if (isFocused) {
                        onOpenPlayer();
                      } else {
                        setFocusedIdx(index);
                      }
                    }}
                  >
                    {song.title}
                  </h4>
                  <p className="text-[12px] font-bold text-white/50 truncate">
                    {song.artist}
                  </p>
                </div>

                {/* Progress Bar for currently playing song */}
                {isCurrent && (
                  <DeckCardProgressBar
                    currentTime={currentTime}
                    duration={duration}
                    onSeek={onSeek}
                    accentColor={accentColor}
                  />
                )}

                {/* Playback Controls */}
                <div className="flex items-center justify-between px-1 text-white/80 z-20">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isCurrent) onPrev();
                    }}
                    className={`p-2 rounded-full hover:bg-white/15 active:scale-80 active:-translate-x-1 hover:text-white transition-all duration-200 ease-out group/prev ${
                      isCurrent ? "opacity-100 cursor-pointer" : "opacity-35 cursor-default"
                    }`}
                    title="上一首"
                  >
                    <PrevIcon className="w-4 h-4 transition-transform duration-200 group-hover/prev:scale-110 group-active/prev:scale-95" />
                  </button>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isCurrent) {
                        onPlayPause();
                      } else {
                        onPlaySong(song);
                        setFocusedIdx(index);
                      }
                    }}
                    className="relative p-3 rounded-full bg-white text-black hover:scale-110 active:scale-90 shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_0_24px_rgba(255,255,255,0.45)] flex items-center justify-center transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] group/playbtn"
                    title={isThisPlaying ? "暂停" : "播放"}
                  >
                    <div className="relative w-4 h-4 flex items-center justify-center pointer-events-none">
                      <PauseIcon
                        className={`absolute inset-0 w-4 h-4 text-black transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                          isThisPlaying ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 -rotate-90"
                        }`}
                      />
                      <PlayIcon
                        className={`absolute inset-0 w-4 h-4 text-black ml-0.5 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                          !isThisPlaying ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 rotate-90"
                        }`}
                      />
                    </div>
                  </button>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isCurrent) onNext();
                    }}
                    className={`p-2 rounded-full hover:bg-white/15 active:scale-80 active:translate-x-1 hover:text-white transition-all duration-200 ease-out group/next ${
                      isCurrent ? "opacity-100 cursor-pointer" : "opacity-35 cursor-default"
                    }`}
                    title="下一首"
                  >
                    <NextIcon className="w-4 h-4 transition-transform duration-200 group-hover/next:scale-110 group-active/next:scale-95" />
                  </button>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="p-2 rounded-full hover:bg-white/15 active:scale-85 hover:scale-110 transition-all duration-200 text-white/70 hover:text-white"
                    title="喜欢"
                  >
                    <LikeIcon className="w-4 h-4 text-rose-500/90 transition-transform active:scale-125" filled={isCurrent} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Pan Reset Button */}
      {(Math.abs(pan.x) > 20 || Math.abs(pan.y) > 20) && (
        <button
          onClick={resetPan}
          className="absolute bottom-6 right-6 z-40 bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white backdrop-blur-md border border-white/15 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-lg transition-all flex items-center gap-1.5"
          title="重置视角"
        >
          <span>🎯</span>
          <span>重置视角</span>
        </button>
      )}
    </div>
  );
};

export default DeckLayout;

