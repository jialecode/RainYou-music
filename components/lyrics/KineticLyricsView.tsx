import React, { useMemo, useRef, useEffect, useState } from "react";
import { LyricLine, LyricWord } from "../../types";

interface KineticLyricsViewProps {
  lyrics: LyricLine[];
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  currentTime: number;
  onSeekRequest?: (time: number, immediate?: boolean) => void;
  isHomepageMode?: boolean;
}

// Generate pseudo character-level timings for standard LRC lines
const getCharacterTimings = (line: LyricLine, nextLineTime?: number): { char: string; start: number; end: number; wordIndex: number }[] => {
  const text = line.text || "";
  const chars = Array.from(text);
  
  if (line.words && line.words.length > 0) {
    // We have word level timings! Map each character to its word timing
    const timings: { char: string; start: number; end: number; wordIndex: number }[] = [];
    let wordPointer = 0;
    
    line.words.forEach((word, wIdx) => {
      const wordText = word.text;
      const wordChars = Array.from(wordText);
      const wordDuration = Math.max(0.05, word.endTime - word.startTime);
      const charDur = wordDuration / Math.max(1, wordChars.length);
      
      wordChars.forEach((char, cIdx) => {
        timings.push({
          char,
          start: word.startTime + cIdx * charDur,
          end: word.startTime + (cIdx + 1) * charDur,
          wordIndex: wIdx,
        });
      });
    });
    
    return timings;
  } else {
    // Synthesize timings evenly based on line duration
    const lineStart = line.time;
    const lineEnd = line.endTime || nextLineTime || (lineStart + 4);
    const duration = Math.max(1, lineEnd - lineStart);
    const charDur = duration / Math.max(1, chars.length);
    
    return chars.map((char, index) => ({
      char,
      start: lineStart + index * charDur,
      end: lineStart + (index + 1) * charDur,
      wordIndex: 0,
    }));
  }
};

const KineticLyricsView: React.FC<KineticLyricsViewProps> = ({
  lyrics,
  audioRef,
  isPlaying,
  currentTime,
  onSeekRequest,
  isHomepageMode = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Smooth visual time interpolation
  const [visualTime, setVisualTime] = useState(currentTime);
  const lastTimeRef = useRef(currentTime);
  const frameRef = useRef<number | null>(null);
  const lastStampRef = useRef<number | null>(null);

  useEffect(() => {
    // Sync immediately if difference is large (e.g. seeking)
    if (Math.abs(currentTime - visualTime) > 1.2) {
      setVisualTime(currentTime);
      lastTimeRef.current = currentTime;
    }
  }, [currentTime]);

  useEffect(() => {
    if (!isPlaying) {
      setVisualTime(currentTime);
      lastTimeRef.current = currentTime;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      return;
    }

    const tick = (now: number) => {
      if (!lastStampRef.current) {
        lastStampRef.current = now;
        frameRef.current = requestAnimationFrame(tick);
        return;
      }
      
      const dt = (now - lastStampRef.current) / 1000;
      lastStampRef.current = now;

      // Predict next visual time using audio playback rate
      const playbackRate = audioRef.current?.playbackRate || 1;
      let nextVisualTime = lastTimeRef.current + dt * playbackRate;
      
      // Correct visual time towards standard audio playhead to stay perfectly in sync
      const drift = currentTime - nextVisualTime;
      const tau = Math.abs(drift) < 0.05 ? 0.35 : 0.15; // smooth sync vs fast catchup
      const correction = drift * (1 - Math.exp(-dt / tau));
      nextVisualTime += correction;

      setVisualTime(nextVisualTime);
      lastTimeRef.current = nextVisualTime;
      
      frameRef.current = requestAnimationFrame(tick);
    };

    lastStampRef.current = null;
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [isPlaying, currentTime, audioRef]);

  // Find active line index
  const activeLineIdx = useMemo(() => {
    if (lyrics.length === 0) return -1;
    
    // Find the latest line that has started
    let activeIdx = 0;
    for (let i = 0; i < lyrics.length; i++) {
      if (visualTime >= lyrics[i].time) {
        activeIdx = i;
      } else {
        break;
      }
    }
    return activeIdx;
  }, [lyrics, visualTime]);

  const activeLine = lyrics[activeLineIdx] || null;
  const prevLine = activeLineIdx > 0 ? lyrics[activeLineIdx - 1] : null;
  const nextLine = activeLineIdx < lyrics.length - 1 ? lyrics[activeLineIdx + 1] : null;
  const upcomingLine = activeLineIdx < lyrics.length - 2 ? lyrics[activeLineIdx + 2] : null;

  // Active line character timings
  const charTimings = useMemo(() => {
    if (!activeLine) return [];
    const nextLineTime = nextLine ? nextLine.time : undefined;
    return getCharacterTimings(activeLine, nextLineTime);
  }, [activeLine, nextLine]);

  // Handle clicking a line to seek
  const handleLineClick = (time: number) => {
    if (onSeekRequest) {
      onSeekRequest(time, true);
    }
  };

  // Cosmic decoration lines & icons for Image 2 vibes
  const renderBackgroundGraphics = () => {
    if (isHomepageMode) return null; // keep homepage lightweight
    
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Subtle grid of pulsing dots */}
        <div 
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1.5px, transparent 1.5px)",
            backgroundSize: "40px 40px"
          }}
        />

        {/* Orbit line 1 */}
        <svg className="absolute w-[80%] h-[80%] left-[-10%] top-[-10%] opacity-[0.06] text-white animate-spin-slow" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.2" fill="none" strokeDasharray="3 3" />
        </svg>

        {/* Orbit line 2 */}
        <svg className="absolute w-[60%] h-[60%] right-[-5%] bottom-[-5%] opacity-[0.08] text-white animate-spin-slow" style={{ animationDirection: "reverse", animationDuration: "45s" }} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="0.15" fill="none" />
          <path d="M 50,2 A 48,48 0 0,1 98,50" stroke="currentColor" strokeWidth="0.6" fill="none" />
        </svg>

        {/* Floating Icons from Figure 2 */}
        <div className="absolute left-[15%] top-[25%] opacity-20 text-white/50 text-2xl animate-bounce" style={{ animationDuration: "8s" }}>
          <span className="font-extralight">+</span>
        </div>
        <div className="absolute right-[20%] top-[15%] opacity-20 text-white/50 animate-float" style={{ animationDuration: "5s" }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </div>
        <div className="absolute left-[25%] bottom-[20%] opacity-25 text-white/50 animate-float" style={{ animationDuration: "7s" }}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
        </div>
        <div className="absolute right-[12%] bottom-[30%] opacity-15 text-white/50 animate-pulse" style={{ animationDuration: "4s" }}>
          <span className="text-xl">+</span>
        </div>
        
        {/* Soft center glows */}
        <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 w-[350px] h-[350px] bg-pink-500/10 rounded-full blur-[90px] pointer-events-none" />
      </div>
    );
  };

  if (lyrics.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-white/40 select-none">
        <div className="text-4xl mb-4 opacity-50">♪</div>
        <div>No lyrics loaded</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden ${
        isHomepageMode ? "" : "bg-[#030712] py-16"
      }`}
    >
      {renderBackgroundGraphics()}

      {/* Main Lyric Stack */}
      <div className="relative z-10 w-full max-w-[850px] px-6 flex flex-col items-center justify-center text-center gap-6 sm:gap-9">
        
        {/* 1. Previous Line (Ambient/Fading) */}
        {!isHomepageMode && prevLine && (
          <p
            onClick={() => handleLineClick(prevLine.time)}
            className="text-[15px] sm:text-[22px] font-bold text-white/15 hover:text-white/40 transition-all duration-500 cursor-pointer max-w-[90%] transform -translate-y-2 select-none"
            style={{
              fontFamily: '"SF Pro Display", "PingFang SC", "Inter", sans-serif',
              textShadow: "0 0 20px rgba(255,255,255,0.02)"
            }}
          >
            {prevLine.text}
          </p>
        )}

        {/* 2. Active Line (The Star of the show, character-by-character kinetic karaoke) */}
        {activeLine && (
          <div className={`relative flex flex-col items-center justify-center w-full ${isHomepageMode ? "py-0.5" : "py-4"}`}>
            {/* Background vocal or translation showing above */}
            {activeLine.isBackground && (
              <span className="text-[12px] sm:text-[14px] uppercase tracking-wider text-cyan-400/80 mb-2 font-bold px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/20 backdrop-blur-md">
                和声
              </span>
            )}
            
            <div 
              className={`flex flex-wrap items-center justify-center font-black tracking-wide text-white leading-normal transition-all duration-300 ${
                isHomepageMode ? "text-[16px] sm:text-[20px]" : "text-[28px] sm:text-[48px] md:text-[54px]"
              }`}
              style={{
                fontFamily: '"SF Pro Display", "PingFang SC", "Inter", sans-serif',
              }}
            >
              {charTimings.map((t, idx) => {
                const char = t.char;
                const start = t.start;
                const end = t.end;
                
                // Determine active status of this character
                const isCharPast = visualTime >= end;
                const isCharFuture = visualTime < start;
                const isCharActive = visualTime >= start && visualTime < end;

                // Glowing cursor box from Image 2 for the active character
                const showGlowingBox = isCharActive && !isHomepageMode;

                // Character progress for swipe coloring
                const charDuration = end - start;
                const charElapsed = visualTime - start;
                const charProgress = Math.max(0, Math.min(100, (charElapsed / charDuration) * 100));

                return (
                  <span
                    key={idx}
                    className="relative inline-block transition-all duration-300"
                    style={{
                      // Kinetic bounce when character becomes active
                      transform: isCharActive 
                        ? "scale(1.12) translateY(-4px)" 
                        : isCharPast 
                        ? "scale(1) translateY(0px)" 
                        : "scale(0.95) translateY(2px)",
                      padding: isHomepageMode ? "0 1px" : "0 3px",
                      margin: isHomepageMode ? "1px 0" : "2px 0",
                    }}
                  >
                    {/* Character bounding glow box (Frosted glass light block) */}
                    {showGlowingBox && (
                      <span 
                        className="absolute inset-0 -m-1 sm:-m-2 rounded-[6px] sm:rounded-[10px] bg-cyan-400/25 border border-cyan-300/40 shadow-[0_0_20px_rgba(34,211,238,0.7)] animate-pulse z-0 pointer-events-none"
                      />
                    )}

                    {/* Text element */}
                    <span
                      className="relative z-10 block select-none whitespace-pre"
                      style={{
                        // Swipe Coloring Gradient Effect
                        backgroundImage: `linear-gradient(90deg, #22d3ee ${charProgress}%, rgba(255,255,255,${isHomepageMode ? 0.4 : 0.28}) ${charProgress}%)`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        // Make active characters pop visually
                        filter: isCharPast || isCharActive
                          ? "drop-shadow(0 2px 10px rgba(34,211,238,0.2))"
                          : "none",
                        transition: isCharFuture ? "all 0.5s ease" : "none",
                      }}
                    >
                      {char}
                    </span>
                  </span>
                );
              })}
            </div>

            {/* Translation Line */}
            {activeLine.translation && !isHomepageMode && (
              <p 
                className="mt-4 sm:mt-6 text-[15px] sm:text-[20px] font-medium text-white/50 drop-shadow-sm select-none"
                style={{
                  fontFamily: '"SF Pro Text", "PingFang SC", "Inter", sans-serif',
                }}
              >
                {activeLine.translation}
              </p>
            )}
          </div>
        )}

        {/* 3. Next Line (Pre-active/revealing) */}
        {!isHomepageMode && nextLine && (
          <p
            onClick={() => handleLineClick(nextLine.time)}
            className={`font-extrabold hover:text-white/60 transition-all duration-500 cursor-pointer max-w-[90%] select-none ${
              isHomepageMode ? "text-[14px] text-white/35" : "text-[18px] sm:text-[26px] text-white/25"
            }`}
            style={{
              fontFamily: '"SF Pro Display", "PingFang SC", "Inter", sans-serif',
            }}
          >
            {nextLine.text}
          </p>
        )}

        {/* 4. Upcoming Line (Faint/distant) */}
        {!isHomepageMode && upcomingLine && (
          <p
            onClick={() => handleLineClick(upcomingLine.time)}
            className="text-[13px] sm:text-[18px] font-bold text-white/10 hover:text-white/40 transition-all duration-500 cursor-pointer max-w-[85%] transform translate-y-2 select-none"
            style={{
              fontFamily: '"SF Pro Display", "PingFang SC", "Inter", sans-serif',
            }}
          >
            {upcomingLine.text}
          </p>
        )}
      </div>
    </div>
  );
};

export default KineticLyricsView;
