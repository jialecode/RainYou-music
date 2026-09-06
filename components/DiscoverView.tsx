import React, { useState, useEffect, useRef } from "react";
import {
  AuraLogo,
  CloudDownloadIcon,
  PlayIcon,
  PauseIcon,
  PrevIcon,
  NextIcon,
  PlusIcon,
  SearchIcon,
  InfoIcon,
  SettingsIcon,
} from "./Icons";
import SmartImage from "./SmartImage";
import DeckLayout from "./DeckLayout";
import KineticLyricsView from "./lyrics/KineticLyricsView";
import Cover from "./Cover";
import { formatTime } from "../services/utils";
import type {
  DiscoverChart,
  DiscoverData,
  DiscoverPlaylist,
  DiscoverSong,
} from "../services/discover";
import type { Song } from "../types";

interface DiscoverErr {
  songs?: string;
  charts?: string;
  playlists?: string;
  zhPlaylists?: string;
  enPlaylists?: string;
  jpPlaylists?: string;
}

interface DiscoverViewProps {
  data: DiscoverData;
  loading: boolean;
  err: DiscoverErr;
  queue: Song[];
  currentSong: Song | null;
  loadingId?: string | null;
  onSearchClick: () => void;
  onImportClick: () => void;
  onPlaySong: (song: DiscoverSong) => void;
  onAddSong: (song: DiscoverSong) => void;
  onImportPlaylist: (id: string) => void | Promise<void>;
  // Playback bindings for Homepage mini-player & deck
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  currentTime?: number;
  onSeek?: (time: number, immediate?: boolean) => void;
  audioRef?: React.RefObject<HTMLAudioElement | null>;
  accentColor?: string;
  onOpenPlayer?: () => void;
  duration?: number;
}

const formatPlays = (count: number) => {
  if (count >= 100000000) {
    return `${(count / 100000000).toFixed(1)}亿播放`;
  }
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万播放`;
  }
  return `${count}播放`;
};

// A horizontal scroll container
const HorizontalScroll: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  loading?: boolean;
}> = ({ title, subtitle, children, loading }) => {
  return (
    <section className="mb-14">
      <div className="mb-4 px-4 sm:px-10">
        <h2 className="text-[28px] font-extrabold tracking-tight text-white mb-1">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm font-medium text-white/50">{subtitle}</p>
        )}
      </div>
      <div 
        className="flex overflow-x-auto snap-x snap-mandatory gap-5 px-4 sm:px-10 pb-6 pt-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          ::-webkit-scrollbar { display: none; }
        `}} />
        {loading ? (
          <div className="flex gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-shrink-0 w-44 sm:w-56 h-56 animate-pulse rounded-[20px] bg-white/5" />
            ))}
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
};

const ChartCard: React.FC<{
  item: DiscoverChart;
  busy: boolean;
  onImport: (id: string) => void;
}> = ({ item, busy, onImport }) => {
  return (
    <article 
      className="group relative flex-shrink-0 w-[300px] sm:w-[380px] snap-start bg-white/5 backdrop-blur-2xl border border-white/5 rounded-[28px] p-5 cursor-pointer transition-all hover:bg-white/10 active:scale-[0.98] flex flex-col overflow-hidden" 
      onClick={() => onImport(item.id)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <h4 className="relative text-[11px] font-bold text-white/50 uppercase tracking-widest mb-1">{item.subtitle}</h4>
      <h3 className="relative text-2xl font-bold text-white mb-4 drop-shadow-sm">{item.title}</h3>
      <div className="relative w-full aspect-video sm:aspect-[4/3] overflow-hidden rounded-[20px] bg-white/5 mb-4 shadow-[0_12px_30px_rgba(0,0,0,0.3)]">
        {item.coverUrl ? (
          <SmartImage src={item.coverUrl} containerClassName="w-full h-full" imgClassName="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/25">
             <AuraLogo className="w-12 h-12" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <CloudDownloadIcon className="w-10 h-10 text-white drop-shadow-lg" />
        </div>
      </div>
      <p className="relative text-sm text-white/60 line-clamp-2 mt-auto font-medium">{item.desc}</p>
    </article>
  );
};

const PlaylistCard: React.FC<{
  item: DiscoverPlaylist;
  busy: boolean;
  onImport: (id: string) => void;
}> = ({ item, busy, onImport }) => {
  return (
    <article 
      className="group relative flex-shrink-0 w-40 sm:w-52 snap-start flex flex-col items-start cursor-pointer transition-all active:scale-95" 
      onClick={() => onImport(item.id)}
    >
      <div className="w-full aspect-square overflow-hidden rounded-[20px] bg-white/5 shadow-[0_10px_24px_rgba(0,0,0,0.25)] mb-3 relative">
         {item.coverUrl ? (
           <SmartImage src={item.coverUrl} containerClassName="w-full h-full" imgClassName="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 group-hover:rotate-1" />
         ) : (
           <div className="flex h-full w-full items-center justify-center text-white/20">
             <AuraLogo className="w-10 h-10" />
           </div>
         )}
         <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
            <CloudDownloadIcon className="w-8 h-8 text-white drop-shadow-md pb-1" />
         </div>
         {busy && (
           <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
             <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
           </div>
         )}
      </div>
      <h3 className="w-full text-[15px] font-semibold leading-tight text-white line-clamp-2 truncate whitespace-normal">{item.title}</h3>
      <p className="w-full text-[13px] font-medium text-white/45 truncate mt-1">{item.desc || item.creator}</p>
    </article>
  );
};

const SongRow: React.FC<{
  item: DiscoverSong;
  active: boolean;
  inQueue: boolean;
  onPlay: (song: DiscoverSong) => void;
  onAdd: (song: DiscoverSong) => void;
  onOpenPlayer: () => void;
}> = ({ item, active, inQueue, onPlay, onAdd, onOpenPlayer }) => {
  return (
    <div className="relative flex items-center gap-4 rounded-2xl p-2 hover:bg-white/[0.08] transition-colors group">
      <div 
        className="relative w-[60px] h-[60px] sm:w-[64px] sm:h-[64px] rounded-[14px] overflow-hidden bg-white/5 flex-shrink-0 cursor-pointer shadow-md" 
        onClick={() => onOpenPlayer()}
      >
        {item.coverUrl ? (
          <SmartImage src={item.coverUrl} containerClassName="w-full h-full" imgClassName="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <AuraLogo className="w-6 h-6 m-auto mt-4 text-white/20" />
        )}
        <div 
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm"
          onClick={(e) => { e.stopPropagation(); onPlay(item); }}
        >
          <PlayIcon className="w-6 h-6 text-white ml-1 drop-shadow-md" />
        </div>
      </div>
      
      <div className="min-w-0 flex-1 flex flex-col justify-center cursor-pointer" onClick={() => onPlay(item)}>
        <h4 className={`text-[16px] font-bold truncate leading-tight mb-1 ${active ? "text-emerald-400" : "text-white"}`}>
          {item.title}
        </h4>
        <p className="text-[13px] font-medium text-white/50 truncate">
          {item.artist}
        </p>
      </div>

      <div className="flex items-center pr-2">
        <button 
          className="p-2 sm:p-2.5 rounded-full hover:bg-white/10 opacity-0 sm:opacity-0 group-hover:opacity-100 transition-all active:scale-95 bg-white/5 sm:bg-transparent" 
          onClick={(e) => { e.stopPropagation(); onAdd(item); }} 
          title="加入队列"
        >
          <PlusIcon className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
};

const PlaybarProgressBar: React.FC<{
  currentTime?: number;
  duration?: number;
  onSeek?: (time: number, immediate?: boolean) => void;
  accentColor?: string;
}> = ({ currentTime = 0, duration = 0, onSeek, accentColor }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [hoverPercent, setHoverPercent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPercent, setDragPercent] = useState<number | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const effectiveDuration = duration > 0 ? duration : 0;
  const currentPercent =
    effectiveDuration > 0
      ? Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100))
      : 0;

  const displayPercent = dragPercent !== null ? dragPercent : currentPercent;

  const calculatePercent = (clientX: number) => {
    if (!barRef.current) return 0;
    const rect = barRef.current.getBoundingClientRect();
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
    const p = calculatePercent(e.clientX);
    setHoverPercent(p);
    if (isDragging && effectiveDuration > 0 && onSeek) {
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

  const hoverTime = hoverPercent * effectiveDuration;

  return (
    <div
      ref={barRef}
      onPointerEnter={() => setIsHovering(true)}
      onPointerLeave={() => setIsHovering(false)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="absolute -top-1.5 left-0 right-0 h-4.5 flex items-center cursor-pointer group/prog z-30 select-none touch-none px-3"
      title="拖动或点击调整播放进度"
    >
      {/* Track Background */}
      <div className="relative w-full h-[3.5px] group-hover/prog:h-[6px] bg-white/20 dark:bg-white/15 rounded-full transition-all duration-200 overflow-visible">
        {/* Fill Progress Bar */}
        <div
          className="absolute left-0 top-0 bottom-0 rounded-full transition-[width] duration-75 ease-out shadow-[0_0_8px_rgba(255,255,255,0.4)]"
          style={{
            width: `${displayPercent}%`,
            backgroundColor: accentColor ? `rgb(${accentColor})` : "#34d399",
          }}
        />

        {/* Apple luminous glowing thumb handle */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9),0_2px_5px_rgba(0,0,0,0.5)] transition-all duration-150 pointer-events-none ${
            isHovering || isDragging ? "opacity-100 scale-100" : "opacity-0 scale-75"
          }`}
          style={{ left: `calc(${displayPercent}% - 7px)` }}
        />
      </div>

      {/* Floating Scrub Time Tooltip */}
      {(isHovering || isDragging) && effectiveDuration > 0 && (
        <div
          className="absolute -top-7 -translate-x-1/2 bg-black/85 backdrop-blur-xl border border-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xl pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-90 duration-150"
          style={{ left: `${hoverPercent * 100}%` }}
        >
          {formatTime(hoverTime)} / {formatTime(effectiveDuration)}
        </div>
      )}
    </div>
  );
};

const DiscoverView: React.FC<DiscoverViewProps> = ({
  data,
  loading,
  err,
  queue,
  currentSong,
  loadingId,
  onSearchClick,
  onImportClick,
  onPlaySong,
  onAddSong,
  onImportPlaylist,
  isPlaying = false,
  onPlayPause = () => {},
  onNext = () => {},
  onPrev = () => {},
  currentTime = 0,
  onSeek = () => {},
  audioRef = { current: null },
  accentColor,
  onOpenPlayer = () => {},
  duration = 0,
}) => {
  // Layout mode state: "feed" (standard lists) vs "deck" (3D scattered cards)
  const [layoutMode, setLayoutMode] = useState<"feed" | "deck">(() => {
    const saved = localStorage.getItem("homepageLayoutMode");
    return (saved === "feed" || saved === "deck") ? saved : "feed";
  });

  // Floating lyrics state: "none" | "collapsed" (slim single line) | "expanded" (full panel)
  const [lyricState, setLyricState] = useState<"none" | "collapsed" | "expanded">("none");

  const toggleLayoutMode = () => {
    const next = layoutMode === "feed" ? "deck" : "feed";
    setLayoutMode(next);
    localStorage.setItem("homepageLayoutMode", next);
  };

  const isQueued = (item: DiscoverSong) => {
    return queue.some((song) => {
      if (song.isNetease) return song.neteaseId === item.neteaseId;
      return song.id === item.id;
    });
  };

  const isActive = (item: DiscoverSong) => {
    if (!currentSong || !currentSong.isNetease) return false;
    return currentSong.neteaseId === item.neteaseId;
  };

  // Chunk songs into groups of 4 for vertical stacking in horizontal scroll
  const chunkedSongs: DiscoverSong[][] = [];
  for (let i = 0; i < data.songs.length; i += 4) {
    chunkedSongs.push(data.songs.slice(i, i + 4));
  }

  return (
    <div className={`w-full selection:bg-white/30 relative ${layoutMode === "deck" ? "h-full flex flex-col overflow-hidden" : "h-full overflow-y-auto"}`}>
      <div className={`mx-auto flex w-full max-w-[1700px] flex-col ${layoutMode === "deck" ? "h-full pb-10 pt-28 overflow-hidden" : "min-h-full pb-36 pt-20 sm:pt-28"}`}>
        
        {/* Hero Section */}
        {layoutMode === "deck" ? (
          /* Compact Single-line Header for Deck Mode */
          <div className="px-4 sm:px-10 mb-4 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500 z-30">
            <div className="flex items-center gap-4">
              <h1 className="text-[28px] font-black tracking-tight text-white select-none">
                浏览
              </h1>
              <span className="text-[11px] font-bold text-white/40 bg-white/5 border border-white/10 px-3 py-1 rounded-full uppercase tracking-wider hidden sm:inline-block">
                3D 悬浮 Deck 空间
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Compact Search & Import Buttons */}
              <button 
                onClick={onSearchClick} 
                className="flex items-center gap-1.5 bg-white text-black font-bold px-4 py-2 rounded-xl hover:scale-105 transition-transform active:scale-95 text-xs shadow-md"
              >
                <SearchIcon className="w-3.5 h-3.5" /> 搜索全站
              </button>
              <button 
                onClick={onImportClick} 
                className="flex items-center gap-1.5 bg-white/10 backdrop-blur-2xl border border-white/5 text-white font-semibold px-4 py-2 rounded-xl hover:bg-white/20 transition-colors active:scale-95 text-xs shadow-md"
              >
                <CloudDownloadIcon className="w-3.5 h-3.5" /> 导入本地
              </button>

              {/* Layout switcher button (Compact style) */}
              <button
                onClick={toggleLayoutMode}
                className="group relative flex items-center gap-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 hover:border-indigo-500/50 text-indigo-200 font-bold px-4 py-2 rounded-xl hover:scale-105 active:scale-95 transition-all text-xs"
              >
                <svg className="w-3.5 h-3.5 text-indigo-400 group-hover:animate-pulse" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                </svg>
                <span>恢复常规布局</span>
              </button>
            </div>
          </div>
        ) : (
          /* Large Standard Hero Section */
          <div className="px-4 sm:px-10 mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div>
              <h1 className="text-[40px] sm:text-[64px] font-extrabold tracking-tight text-white mb-3">
                浏览
              </h1>
              <p className="text-lg sm:text-2xl text-white/55 font-medium max-w-2xl leading-snug">
                不用先搜索，先听见值得点开的歌。
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <button 
                  onClick={onSearchClick} 
                  className="flex items-center gap-2 bg-white text-black font-bold px-7 py-3.5 rounded-full hover:scale-105 transition-transform active:scale-95 shadow-[0_8px_20px_rgba(255,255,255,0.2)]"
                >
                  <SearchIcon className="w-5 h-5" /> 搜索全站
                </button>
                <button 
                  onClick={onImportClick} 
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-2xl border border-white/5 text-white font-semibold px-7 py-3.5 rounded-full hover:bg-white/20 transition-colors active:scale-95 shadow-lg"
                >
                  <CloudDownloadIcon className="w-5 h-5" /> 导入本地
                </button>
              </div>
            </div>

            {/* 3D Glassmorphic Layout Switcher Button */}
            <div className="flex-shrink-0 flex items-center">
              <button
                onClick={toggleLayoutMode}
                className="group relative flex items-center gap-3 bg-white/10 dark:bg-black/20 backdrop-blur-[30px] border border-white/15 hover:border-white/30 text-white font-bold px-6 py-3.5 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.15)] overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent pointer-events-none" />
                {/* Modern layout indicators */}
                <div className="relative w-5 h-5 flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-400 group-hover:animate-pulse" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                  </svg>
                </div>
                <span className="text-[14px] sm:text-[15px] tracking-wide select-none">
                  切换 3D 悬浮 deck
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Layout Conditional Rendering */}
        {layoutMode === "deck" && data.songs.length > 0 ? (
          <div className="animate-in fade-in zoom-in-95 duration-500 flex-1 min-h-0 flex items-center justify-center">
            <DeckLayout
              songs={data.songs}
              currentSong={currentSong}
              isPlaying={isPlaying}
              onPlaySong={onPlaySong}
              onPlayPause={onPlayPause}
              onNext={onNext}
              onPrev={onPrev}
              accentColor={accentColor}
              onOpenPlayer={onOpenPlayer}
              currentTime={currentTime}
              duration={duration}
              onSeek={onSeek}
            />
          </div>
        ) : (
          /* Standard scrolling rows layout */
          <>
            {/* Top Charts */}
            <div className="animate-in fade-in slide-in-from-bottom-10 duration-700 delay-150 fill-mode-both">
              <HorizontalScroll title="排行榜" subtitle="热门精选，实时更新。" loading={loading && data.charts.length === 0}>
                {data.charts.map(item => (
                  <ChartCard key={item.id} item={item} busy={loadingId === item.id} onImport={onImportPlaylist} />
                ))}
              </HorizontalScroll>
            </div>

            {/* New Songs */}
            <div className="animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300 fill-mode-both">
              <HorizontalScroll title="新歌速递" subtitle="最新鲜的声音，点开即播。" loading={loading && data.songs.length === 0}>
                {chunkedSongs.map((col, i) => (
                  <div key={i} className="flex-shrink-0 w-[310px] sm:w-[380px] lg:w-[420px] snap-start flex flex-col gap-1.5">
                    {col.map(song => (
                      <SongRow 
                        key={song.id} 
                        item={song} 
                        active={isActive(song)} 
                        inQueue={isQueued(song)} 
                        onPlay={onPlaySong} 
                        onAdd={onAddSong} 
                        onOpenPlayer={onOpenPlayer}
                      />
                    ))}
                  </div>
                ))}
              </HorizontalScroll>
            </div>

            {/* Premium Playlists */}
            <div className="animate-in fade-in slide-in-from-bottom-10 duration-700 delay-500 fill-mode-both">
              <HorizontalScroll title="精品歌单" subtitle="全网精选，一键整单导入。" loading={loading && data.playlists.length === 0}>
                {data.playlists.map(item => (
                  <PlaylistCard key={item.id} item={item} busy={loadingId === item.id} onImport={onImportPlaylist} />
                ))}
              </HorizontalScroll>
            </div>

            {/* Chinese Playlists */}
            <div className="animate-in fade-in slide-in-from-bottom-10 duration-700 delay-700 fill-mode-both">
              <HorizontalScroll title="华语流行" subtitle="最熟悉的旋律。" loading={loading && (!data.zhPlaylists || data.zhPlaylists.length === 0)}>
                {data.zhPlaylists?.map(item => (
                  <PlaylistCard key={item.id} item={item} busy={loadingId === item.id} onImport={onImportPlaylist} />
                ))}
              </HorizontalScroll>
            </div>

            {/* English Playlists */}
            <div className="animate-in fade-in slide-in-from-bottom-10 duration-700 delay-700 fill-mode-both">
              <HorizontalScroll title="欧美精选" subtitle="全球流行，经典之作。" loading={loading && (!data.enPlaylists || data.enPlaylists.length === 0)}>
                {data.enPlaylists?.map(item => (
                  <PlaylistCard key={item.id} item={item} busy={loadingId === item.id} onImport={onImportPlaylist} />
                ))}
              </HorizontalScroll>
            </div>

            {/* Japanese Playlists */}
            <div className="animate-in fade-in slide-in-from-bottom-10 duration-700 delay-700 fill-mode-both">
              <HorizontalScroll title="日语推荐" subtitle="J-Pop与动漫原声。" loading={loading && (!data.jpPlaylists || data.jpPlaylists.length === 0)}>
                {data.jpPlaylists?.map(item => (
                  <PlaylistCard key={item.id} item={item} busy={loadingId === item.id} onImport={onImportPlaylist} />
                ))}
              </HorizontalScroll>
            </div>
          </>
        )}

      </div>

      {currentSong && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-[500px] flex flex-col items-center pointer-events-none">
          {/* Floating Collapsible Kinetic Lyrics Panel */}
          {lyricState !== "none" && (
            <div 
              className={`w-full max-w-[500px] mb-4 pointer-events-auto bg-white/8 dark:bg-zinc-900/40 backdrop-blur-[45px] border border-white/20 dark:border-white/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),_0_20px_50px_-10px_rgba(0,0,0,0.5)] rounded-2xl transition-all duration-300 overflow-hidden relative flex flex-col items-center justify-center ${
                lyricState === "expanded" ? "h-[190px] p-5" : "h-[70px] p-2"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none" />
              
              {/* Expand/Collapse Trigger */}
              <button 
                onClick={() => setLyricState(prev => prev === "collapsed" ? "expanded" : "collapsed")}
                className="absolute top-1.5 right-3 p-1 text-white/40 hover:text-white/80 active:scale-95 transition-colors z-20"
                title={lyricState === "expanded" ? "极简单行" : "完整显示"}
              >
                {lyricState === "expanded" ? (
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                ) : (
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                  </svg>
                )}
              </button>

              {/* Close floating lyrics */}
              <button 
                onClick={() => setLyricState("none")}
                className="absolute top-1.5 left-3 p-1 text-white/30 hover:text-white/70 active:scale-95 transition-colors z-20"
                title="关闭歌词"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Embedded Kinetic lyrics viewer (Single line in collapsed, multiline stack in expanded) */}
              <div className="w-full h-full pointer-events-none flex items-center justify-center">
                <KineticLyricsView
                  lyrics={currentSong.lyrics || []}
                  audioRef={audioRef}
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  onSeekRequest={onSeek}
                  isHomepageMode={lyricState === "collapsed"}
                />
              </div>
            </div>
          )}

          {/* Homepage Bottom Playbar Dock */}
          <div 
            className="w-full max-w-[500px] pointer-events-auto bg-white/8 dark:bg-zinc-900/40 backdrop-blur-[45px] border border-white/20 dark:border-white/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),_0_20px_50px_-10px_rgba(0,0,0,0.5)] rounded-2xl flex items-center justify-between px-3.5 py-2.5 gap-3 hover:bg-white/12 dark:hover:bg-zinc-900/50 hover:border-white/30 transition-all duration-300 relative group"
            style={{
              boxShadow: accentColor ? `0 15px 40px rgba(${accentColor}, 0.15)` : undefined,
              borderColor: accentColor ? `rgba(${accentColor}, 0.2)` : undefined
            }}
          >
            {/* Apple-style Interactive Mini Progress Bar */}
            <PlaybarProgressBar
              currentTime={currentTime}
              duration={duration}
              onSeek={onSeek}
              accentColor={accentColor}
            />

            {/* Soft inner glow overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.03] to-transparent rounded-2xl pointer-events-none" />

            {/* Song Cover & Metadata (clickable to open full player screen) */}
            <div 
              onClick={onOpenPlayer}
              className="flex items-center gap-3 min-w-0 cursor-pointer flex-1 group/meta"
            >
              <div className="relative w-12 h-12 rounded-[10px] overflow-hidden bg-white/5 flex-shrink-0 shadow-md transition-transform duration-300 group-hover/meta:scale-105">
                <Cover src={currentSong.coverUrl} isPlaying={isPlaying} />
              </div>
              
              <div className="min-w-0 flex-1 flex flex-col justify-center">
                <h4 className="text-[14px] font-black text-white truncate leading-snug tracking-wide group-hover/meta:text-emerald-400 transition-colors">
                  {currentSong.title}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                  <p className="text-[11px] font-bold text-white/50 truncate">
                    {currentSong.artist}
                  </p>
                  {duration > 0 && (
                    <span className="text-[10px] text-white/35 font-mono tracking-wider flex-shrink-0">
                      • {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Playback Actions bar */}
            <div className="flex items-center gap-1 flex-shrink-0 text-white/95">
              
              {/* Lyrics Toggle Button with micro-animation */}
              <button 
                onClick={() => {
                  setLyricState(prev => prev === "none" ? "collapsed" : "none");
                }}
                className={`p-2 rounded-xl transition-all duration-200 active:scale-85 hover:scale-105 ${
                  lyricState !== "none" 
                    ? "text-cyan-300 bg-cyan-500/20 border border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.35)]" 
                    : "hover:bg-white/12 text-white/70 hover:text-white"
                }`}
                title="实时歌词"
              >
                <span className={`text-[13px] font-black tracking-widest block w-4.5 h-4.5 leading-4.5 text-center select-none transition-transform duration-200 ${lyricState !== "none" ? "scale-110" : ""}`}>词</span>
              </button>

              {/* Prev Button with directional micro-bounce */}
              <button 
                onClick={onPrev}
                className="p-2 rounded-xl hover:bg-white/12 hover:text-white active:scale-80 active:-translate-x-1 transition-all duration-200 ease-out text-white/80 group/prev"
                title="上一首"
              >
                <PrevIcon className="w-4 h-4 transition-transform duration-200 group-hover/prev:scale-110 group-active/prev:scale-95" />
              </button>

              {/* Play/Pause Button with Apple spring morph and shadow */}
              <button 
                onClick={onPlayPause}
                className="relative p-3 rounded-full bg-white text-black hover:scale-110 active:scale-90 shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_0_24px_rgba(255,255,255,0.45)] flex items-center justify-center transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] group/playbtn"
                title={isPlaying ? "暂停" : "播放"}
              >
                <div className="relative w-4 h-4 flex items-center justify-center pointer-events-none">
                  <PauseIcon
                    className={`absolute inset-0 w-4 h-4 text-black transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                      isPlaying ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 -rotate-90"
                    }`}
                  />
                  <PlayIcon
                    className={`absolute inset-0 w-4 h-4 text-black ml-0.5 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                      !isPlaying ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 rotate-90"
                    }`}
                  />
                </div>
              </button>

              {/* Next Button with directional micro-bounce */}
              <button 
                onClick={onNext}
                className="p-2 rounded-xl hover:bg-white/12 hover:text-white active:scale-80 active:translate-x-1 transition-all duration-200 ease-out text-white/80 group/next"
                title="下一首"
              >
                <NextIcon className="w-4 h-4 transition-transform duration-200 group-hover/next:scale-110 group-active/next:scale-95" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscoverView;
