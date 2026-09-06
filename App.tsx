import React, { useEffect, useRef, useState } from "react";
import { useToast } from "./hooks/useToast";
import { PlayState, Song } from "./types";
import FluidBackground from "./components/FluidBackground";
import Controls from "./components/Controls";
import LyricsView from "./components/LyricsView";
import KineticLyricsView from "./components/lyrics/KineticLyricsView";
import PlaylistPanel from "./components/PlaylistPanel";
import KeyboardShortcuts from "./components/KeyboardShortcuts";
import TopBar from "./components/TopBar";
import SearchModal from "./components/SearchModal";
import DiscoverView from "./components/DiscoverView";
import { usePlaylist } from "./hooks/usePlaylist";
import { usePlayer } from "./hooks/usePlayer";
import { useDiscover } from "./hooks/useDiscover";
import { useSettings } from "./hooks/useSettings";
import Visualizer from "./components/visualizer/Visualizer";
import { keyboardRegistry } from "./services/keyboardRegistry";
import MediaSessionController from "./components/MediaSessionController";
import { toNeteaseSong } from "./services/discover";
import type { DiscoverSong } from "./services/discover";

const HOME_COLORS = [
  "rgb(201, 69, 88)",
  "rgb(111, 44, 145)",
  "rgb(38, 94, 176)",
  "rgb(246, 162, 78)",
];

const App: React.FC = () => {
  const { toast } = useToast();
  const playlist = usePlaylist();
  const discover = useDiscover();
  const { visualizerStyle } = useSettings();
  const player = usePlayer({
    queue: playlist.queue,
    originalQueue: playlist.originalQueue,
    updateSongInQueue: playlist.updateSongInQueue,
    setQueue: playlist.setQueue,
    setOriginalQueue: playlist.setOriginalQueue,
  });

  const {
    audioRef,
    currentSong,
    playState,
    currentTime,
    duration,
    playMode,
    matchStatus,
    accentColor,
    togglePlay,
    toggleMode,
    handleSeek,
    playNext,
    playPrev,
    handleTimeUpdate,
    handleLoadedMetadata,
    handlePlaylistAddition,
    playIndex,
    addSongAndPlay,
    handleAudioEnded,
    play,
    pause,
    resolvedAudioSrc,
    isBuffering,
  } = player;

  const [view, setView] = useState<"home" | "player">("home");
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showVolumePopup, setShowVolumePopup] = useState(false);
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const [volume, setVolume] = useState(1);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [lyricDisplayMode, setLyricDisplayMode] = useState<"standard" | "kinetic">(
    () => {
      if (typeof window === "undefined") return "standard";
      const saved = localStorage.getItem("lyricDisplayMode");
      return saved === "standard" || saved === "kinetic" ? saved : "standard";
    },
  );

  const toggleLyricDisplayMode = () => {
    const next = lyricDisplayMode === "standard" ? "kinetic" : "standard";
    setLyricDisplayMode(next);
    localStorage.setItem("lyricDisplayMode", next);
  };

  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [activePanel, setActivePanel] = useState<"controls" | "lyrics">(
    "controls",
  );
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const mobileViewportRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [paneWidth, setPaneWidth] = useState(() => {
    if (typeof window === "undefined") return 0;
    return window.innerWidth;
  });

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, audioRef]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = window.matchMedia("(max-width: 1024px)");
    const sync = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobileLayout(event.matches);
    };
    sync(query);
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!isMobileLayout) {
      setActivePanel("controls");
      setTouchStartX(null);
      setDragOffsetX(0);
    }
  }, [isMobileLayout]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => {
      setPaneWidth(window.innerWidth);
    };

    sync();
    window.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("resize", sync);
    };
  }, [isMobileLayout]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => keyboardRegistry.handle(event);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setShowSearch((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (playlist.queue.length === 0) {
      setView("home");
    }
  }, [playlist.queue.length]);

  const openImport = () => {
    fileRef.current?.click();
  };

  const finishImport = (songs: Song[], wasEmpty: boolean, note?: string) => {
    if (songs.length === 0) return false;

    setTimeout(() => {
      handlePlaylistAddition(songs, wasEmpty);
    }, 0);

    setView("player");

    if (note) {
      toast.success(note);
    }

    return true;
  };

  const handleFileChange = async (files: FileList) => {
    const wasEmpty = playlist.queue.length === 0;
    const songs = await playlist.addLocalFiles(files);
    finishImport(songs, wasEmpty);
  };

  const handlePickedFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      void handleFileChange(files);
    }
    event.target.value = "";
  };

  const handleImportUrl = async (input: string): Promise<boolean> => {
    const text = input.trim();
    if (!text) return false;

    const wasEmpty = playlist.queue.length === 0;
    const result = await playlist.importFromUrl(text);
    if (!result.success) {
      toast.error(result.message ?? "Failed to load songs from URL");
      return false;
    }

    return finishImport(
      result.songs,
      wasEmpty,
      `Successfully imported ${result.songs.length} songs`,
    );
  };

  const handleImportPlaylist = async (id: string) => {
    setLoadingId(id);

    try {
      const wasEmpty = playlist.queue.length === 0;
      const result = await playlist.importNeteasePlaylist(id);

      if (!result.success) {
        toast.error(result.message ?? "Failed to load playlist");
        return;
      }

      finishImport(
        result.songs,
        wasEmpty,
        `Successfully imported ${result.songs.length} songs`,
      );
    } catch (err) {
      console.error("Playlist import failed", err);
      toast.error("Failed to load playlist");
    } finally {
      setLoadingId(null);
    }
  };

  const handlePlayQueueIndex = (idx: number) => {
    playIndex(idx);
    setView("player");
  };

  const handleImportAndPlay = (song: Song) => {
    const idx = playlist.queue.findIndex((item) => {
      if (song.isNetease && item.isNetease) {
        return song.neteaseId === item.neteaseId;
      }
      return song.id === item.id;
    });

    if (idx !== -1) {
      playIndex(idx);
    } else {
      addSongAndPlay(song);
    }

    setView("player");
  };

  const handleAddToQueue = (song: Song) => {
    playlist.setQueue((prev) => [...prev, song]);
    playlist.setOriginalQueue((prev) => [...prev, song]);
  };

  const handleImportAndPlaySilent = (song: Song) => {
    const idx = playlist.queue.findIndex((item) => {
      if (song.isNetease && item.isNetease) {
        return song.neteaseId === item.neteaseId;
      }
      return song.id === item.id;
    });

    if (idx !== -1) {
      playIndex(idx);
    } else {
      addSongAndPlay(song);
    }
  };

  const handleDiscoverPlaySilent = (item: DiscoverSong) => {
    handleImportAndPlaySilent(toNeteaseSong(item));
  };

  const handleDiscoverAdd = (item: DiscoverSong) => {
    handleAddToQueue(toNeteaseSong(item));
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobileLayout) return;
    setTouchStartX(event.touches[0]?.clientX ?? null);
    setDragOffsetX(0);
    setIsDragging(true);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobileLayout || touchStartX === null) return;
    const currentX = event.touches[0]?.clientX;
    if (currentX === undefined) return;
    const delta = currentX - touchStartX;
    const width = event.currentTarget.getBoundingClientRect().width;
    const limited = Math.max(Math.min(delta, width), -width);
    setDragOffsetX(limited);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobileLayout || touchStartX === null) return;
    const endX = event.changedTouches[0]?.clientX;
    if (endX === undefined) {
      setTouchStartX(null);
      setDragOffsetX(0);
      setIsDragging(false);
      return;
    }

    const delta = endX - touchStartX;
    const limit = 60;
    if (delta > limit) {
      setActivePanel("controls");
    } else if (delta < -limit) {
      setActivePanel("lyrics");
    }

    setTouchStartX(null);
    setDragOffsetX(0);
    setIsDragging(false);
  };

  const handleTouchCancel = () => {
    if (isMobileLayout) {
      setTouchStartX(null);
      setDragOffsetX(0);
      setIsDragging(false);
    }
  };

  const toggleIndicator = () => {
    setActivePanel((prev) => (prev === "controls" ? "lyrics" : "controls"));
    setDragOffsetX(0);
    setIsDragging(false);
  };

  const controlsSection = (
    <div className="relative z-30 flex h-full w-full flex-col items-center justify-center p-4">
      <div className="relative flex w-full max-w-[720px] flex-col items-center gap-8">
        <Controls
          isPlaying={playState === PlayState.PLAYING}
          onPlayPause={togglePlay}
          currentTime={currentTime}
          duration={duration}
          trackId={currentSong?.id || "no-song"}
          onSeek={handleSeek}
          title={currentSong?.title || "Aura Music"}
          artist={currentSong?.artist || "从首页挑一首歌开始"}
          audioRef={audioRef}
          onNext={playNext}
          onPrev={playPrev}
          playMode={playMode}
          onToggleMode={toggleMode}
          onTogglePlaylist={() => setShowPlaylist(true)}
          accentColor={accentColor}
          volume={volume}
          onVolumeChange={setVolume}
          speed={player.speed}
          preservesPitch={player.preservesPitch}
          onSpeedChange={player.setSpeed}
          onTogglePreservesPitch={player.togglePreservesPitch}
          coverUrl={currentSong?.coverUrl}
          isBuffering={isBuffering}
          showVolumePopup={showVolumePopup}
          setShowVolumePopup={setShowVolumePopup}
          showSettingsPopup={showSettingsPopup}
          setShowSettingsPopup={setShowSettingsPopup}
          playlistPanel={
            <PlaylistPanel
              isOpen={showPlaylist}
              onClose={() => setShowPlaylist(false)}
              queue={playlist.queue}
              currentSongId={currentSong?.id}
              onPlay={handlePlayQueueIndex}
              onImport={handleImportUrl}
              onRemove={playlist.removeSongs}
              accentColor={accentColor}
            />
          }
        />
      </div>
    </div>
  );

  const lyricsVersion = currentSong?.lyrics ? currentSong.lyrics.length : 0;
  const lyricsKey = currentSong
    ? `${currentSong.id}-${lyricsVersion}`
    : "no-song";

  const lyricsSection = (
    <div className="relative z-20 flex h-full w-full flex-col justify-center px-4 lg:pl-6 lg:pr-8 xl:pl-10 xl:pr-12">
      {/* Lyric Mode Switcher Button */}
      <div className="absolute top-20 right-6 z-30 flex items-center">
        <button
          onClick={toggleLyricDisplayMode}
          className="group flex items-center gap-2 bg-white/5 dark:bg-black/35 backdrop-blur-[30px] border border-white/10 hover:border-white/20 text-white font-bold px-4 py-2 rounded-xl transition-all active:scale-95 shadow-md"
          title="切换歌词模式"
        >
          <span className="relative w-4 h-4 flex items-center justify-center">
            {lyricDisplayMode === "standard" ? (
              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
              </svg>
            )}
          </span>
          <span className="text-[13px] tracking-wide select-none">
            {lyricDisplayMode === "standard" ? "宇宙动效歌词" : "常规滚动歌词"}
          </span>
        </button>
      </div>

      {lyricDisplayMode === "kinetic" ? (
        <KineticLyricsView
          lyrics={currentSong?.lyrics || []}
          audioRef={audioRef}
          isPlaying={playState === PlayState.PLAYING}
          currentTime={currentTime}
          onSeekRequest={handleSeek}
        />
      ) : (
        <LyricsView
          key={lyricsKey}
          lyrics={currentSong?.lyrics || []}
          audioRef={audioRef}
          isPlaying={playState === PlayState.PLAYING}
          currentTime={currentTime}
          onSeekRequest={handleSeek}
          matchStatus={matchStatus}
        />
      )}
    </div>
  );

  const fallbackWidth = typeof window !== "undefined" ? window.innerWidth : 0;
  const effectivePaneWidth = paneWidth || fallbackWidth;
  const baseOffset = activePanel === "lyrics" ? -effectivePaneWidth : 0;
  const mobileTranslate = baseOffset + dragOffsetX;
  const bgCover =
    currentSong?.coverUrl ||
    discover.data.charts[0]?.coverUrl ||
    discover.data.playlists[0]?.coverUrl;
  const bgColors =
    currentSong?.colors && currentSong.colors.length > 0
      ? currentSong.colors
      : view === "home"
        ? HOME_COLORS
        : [];

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <FluidBackground
        key={isMobileLayout ? "mobile" : "desktop"}
        colors={bgColors}
        coverUrl={bgCover}
        isPlaying={playState === PlayState.PLAYING || view === "home"}
        isMobileLayout={isMobileLayout}
      />

      <input
        type="file"
        ref={fileRef}
        onChange={handlePickedFile}
        accept="audio/*,.lrc,.txt"
        multiple
        className="hidden"
      />

      <audio
        ref={audioRef}
        src={resolvedAudioSrc ?? currentSong?.fileUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
        crossOrigin="anonymous"
      />

      <KeyboardShortcuts
        isPlaying={playState === PlayState.PLAYING}
        onPlayPause={togglePlay}
        onNext={playNext}
        onPrev={playPrev}
        onSeek={handleSeek}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        onVolumeChange={setVolume}
        onToggleMode={toggleMode}
        onTogglePlaylist={() => setShowPlaylist((prev) => !prev)}
        speed={player.speed}
        onSpeedChange={player.setSpeed}
        onToggleVolumeDialog={() => setShowVolumePopup((prev) => !prev)}
        onToggleSpeedDialog={() => setShowSettingsPopup((prev) => !prev)}
      />

      <MediaSessionController
        currentSong={currentSong ?? null}
        playState={playState}
        currentTime={currentTime}
        duration={duration}
        playbackRate={player.speed}
        onPlay={play}
        onPause={pause}
        onNext={playNext}
        onPrev={playPrev}
        onSeek={handleSeek}
      />

      <TopBar
        view={view}
        onHomeClick={() => setView("home")}
        onPlayerClick={() => {
          if (playlist.queue.length > 0 || currentSong) {
            setView("player");
          }
        }}
        onImportClick={openImport}
        onSearchClick={() => setShowSearch(true)}
        playerDisabled={playlist.queue.length === 0 && !currentSong}
      />

      <SearchModal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        queue={playlist.queue}
        onPlayQueueIndex={handlePlayQueueIndex}
        onImportAndPlay={handleImportAndPlay}
        onAddToQueue={handleAddToQueue}
        currentSong={currentSong}
        isPlaying={playState === PlayState.PLAYING}
        accentColor={accentColor}
      />

      {view === "home" ? (
        <div className="relative z-10 min-h-0 flex-1">
          <DiscoverView
            data={discover.data}
            loading={discover.loading}
            err={discover.err}
            queue={playlist.queue}
            currentSong={currentSong}
            loadingId={loadingId}
            onSearchClick={() => setShowSearch(true)}
            onImportClick={openImport}
            onPlaySong={handleDiscoverPlaySilent}
            onAddSong={handleDiscoverAdd}
            onImportPlaylist={handleImportPlaylist}
            isPlaying={playState === PlayState.PLAYING}
            onPlayPause={togglePlay}
            onNext={playNext}
            onPrev={playPrev}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            audioRef={audioRef}
            accentColor={accentColor}
            onOpenPlayer={() => setView("player")}
          />
        </div>
      ) : isMobileLayout ? (
        <div className="relative h-full w-full flex-1">
          <div
            ref={mobileViewportRef}
            className="h-full w-full overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
          >
            <div
              className={`flex h-full ${
                isDragging
                  ? "transition-none"
                  : "transition-transform duration-300"
              }`}
              style={{
                width: `${effectivePaneWidth * 2}px`,
                transform: `translateX(${mobileTranslate}px)`,
              }}
            >
              <div
                className="h-full flex-none"
                style={{ width: effectivePaneWidth }}
              >
                {controlsSection}
              </div>
              <div
                className="h-full flex-none"
                style={{ width: effectivePaneWidth }}
              >
                {lyricsSection}
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <button
              type="button"
              onClick={toggleIndicator}
              className="relative flex h-4 w-28 items-center justify-center rounded-full border border-white/15 bg-white/10 backdrop-blur-2xl transition-transform duration-200 active:scale-105"
              style={{
                transform: `translateX(${isDragging ? dragOffsetX * 0.04 : 0}px)`,
              }}
            >
              <span
                className={`absolute inset-0 rounded-full bg-white/25 backdrop-blur-[30px] transition-opacity duration-200 ${
                  activePanel === "controls" ? "opacity-90" : "opacity-60"
                }`}
              />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative grid h-full w-full flex-1 lg:grid-cols-[minmax(360px,38%)_1fr] xl:grid-cols-[minmax(400px,35%)_1fr] overflow-hidden">
          {/* Centered Circular Visualizer Overlay */}
          {visualizerStyle === "circular" && (
            <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center mix-blend-screen opacity-75">
              <div className="w-[85vw] h-[85vw] max-w-[850px] max-h-[850px] flex items-center justify-center">
                <Visualizer audioRef={audioRef} isPlaying={playState === PlayState.PLAYING} />
              </div>
            </div>
          )}
          {controlsSection}
          {lyricsSection}
        </div>
      )}
    </div>
  );
};

export default App;
