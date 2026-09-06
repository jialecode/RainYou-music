import React, { useEffect, useRef, useState } from "react";
import {
  AuraLogo,
  CloudDownloadIcon,
  FullscreenIcon,
  InfoIcon,
  SearchIcon,
} from "./Icons";
import AboutDialog from "./AboutDialog";

interface TopBarProps {
  view: "home" | "player";
  onHomeClick: () => void;
  onPlayerClick: () => void;
  onImportClick: () => void;
  onSearchClick: () => void;
  disabled?: boolean;
  playerDisabled?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({
  view,
  onHomeClick,
  onPlayerClick,
  onImportClick,
  onSearchClick,
  disabled,
  playerDisabled,
}) => {
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState(false);
  const [active, setActive] = useState(false);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          setFull(true);
        })
        .catch((err) => {
          console.error(
            `Error attempting to enable fullscreen: ${err.message} (${err.name})`,
          );
        });
      return;
    }

    document.exitFullscreen?.().then(() => {
      setFull(false);
    });
  };

  const wake = () => {
    if (hideRef.current) {
      clearTimeout(hideRef.current);
    }

    setActive(true);
    hideRef.current = setTimeout(() => {
      setActive(false);
      hideRef.current = null;
    }, 2500);
  };

  const handlePointerDownCapture = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (event.pointerType !== "touch") {
      return;
    }

    if (!active) {
      event.preventDefault();
      event.stopPropagation();
    }

    wake();
  };

  useEffect(() => {
    const sync = () => {
      setFull(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (hideRef.current) {
        clearTimeout(hideRef.current);
      }
    };
  }, []);

  const base = "transition-all duration-500 ease-out";
  const touch = active
    ? "opacity-100 translate-y-0 pointer-events-auto"
    : "opacity-0 -translate-y-2 pointer-events-none";
  const hover =
    "group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto";
  const navBtn = (on: boolean) =>
    `relative rounded-full px-3 py-2 text-sm font-medium transition ${
      on
        ? "bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.18)]"
        : "text-white/62 hover:text-white"
    }`;

  return (
    <div
      className="group fixed left-0 top-0 z-[60] h-16 w-full"
      onPointerDownCapture={handlePointerDownCapture}
    >
      <div
        className={`absolute inset-0 border-b border-white/10 bg-white/5 backdrop-blur-2xl transition-all duration-500 ${
          active ? "opacity-100" : "opacity-0"
        } group-hover:opacity-100`}
      />

      <div className="relative z-10 flex h-full items-center justify-between gap-3 px-4 sm:px-6">
        <div
          className={`flex min-w-0 items-center gap-3 ${base} ${touch} ${hover}`}
        >
          <button
            type="button"
            onClick={onHomeClick}
            className="overflow-hidden rounded-[12px] shadow-lg shadow-rose-500/20"
            title="Home"
          >
            <AuraLogo className="h-10 w-10" />
          </button>
          <div className="hidden min-w-0 sm:block">
            <h1 className="truncate text-sm font-bold uppercase tracking-[0.28em] text-white/85">
              Aura Music
            </h1>
            <p className="truncate text-xs text-white/40">
              Discover and player in one view
            </p>
          </div>
        </div>

        <div className={`${base} ${touch} ${hover}`}>
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/20 p-1 backdrop-blur-2xl">
            <button
              type="button"
              onClick={onHomeClick}
              className={navBtn(view === "home")}
            >
              首页
            </button>
            <button
              type="button"
              onClick={onPlayerClick}
              disabled={playerDisabled}
              className={`${navBtn(view === "player")} disabled:cursor-not-allowed disabled:text-white/25`}
            >
              播放器
            </button>
          </div>
        </div>

        <div
          className={`flex items-center gap-2 ${base} delay-75 ${touch} ${hover}`}
        >
          <button
            type="button"
            onClick={onSearchClick}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/80 shadow-sm transition-all hover:bg-white/20 hover:text-white"
            title="Search (Cmd+K)"
          >
            <SearchIcon className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={onImportClick}
            disabled={disabled}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/80 shadow-sm transition-all hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            title="Import Local Files"
          >
            <CloudDownloadIcon className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/80 shadow-sm transition-all hover:bg-white/20 hover:text-white"
            title="About Aura Music"
          >
            <InfoIcon className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/80 shadow-sm transition-all hover:bg-white/20 hover:text-white"
            title={full ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            <FullscreenIcon className="h-5 w-5" isFullscreen={full} />
          </button>
        </div>
      </div>

      <AboutDialog isOpen={open} onClose={() => setOpen(false)} />
    </div>
  );
};

export default TopBar;
