import type { Song } from "../types";

export interface DiscoverSong {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl?: string;
  duration?: number;
  isNetease: true;
  neteaseId: string;
  reason?: string;
}

export interface DiscoverPreview {
  title: string;
  artist: string;
}

export interface DiscoverChart {
  id: string;
  title: string;
  subtitle: string;
  coverUrl?: string;
  desc: string;
  preview: DiscoverPreview[];
  plays: number;
}

export interface DiscoverPlaylist {
  id: string;
  title: string;
  coverUrl?: string;
  desc: string;
  tags: string[];
  creator: string;
  count: number;
  plays: number;
}

export interface DiscoverData {
  songs: DiscoverSong[];
  charts: DiscoverChart[];
  playlists: DiscoverPlaylist[];
  zhPlaylists: DiscoverPlaylist[];
  enPlaylists: DiscoverPlaylist[];
  jpPlaylists: DiscoverPlaylist[];
}

interface ArtistLike {
  name?: string;
}

interface AlbumLike {
  name?: string;
  picUrl?: string;
}

interface TopSongLike {
  id: number;
  name?: string;
  artists?: ArtistLike[];
  album?: AlbumLike;
  duration?: number;
}

interface TopSongPayload {
  data?: TopSongLike[];
}

interface ChartTrackLike {
  first?: string;
  second?: string;
}

interface ChartLike {
  id: number;
  name?: string;
  coverImgUrl?: string;
  updateFrequency?: string;
  description?: string;
  playCount?: number;
  tracks?: ChartTrackLike[];
}

interface ChartPayload {
  list?: ChartLike[];
}

interface PlaylistLike {
  id: number;
  name?: string;
  coverImgUrl?: string;
  description?: string;
  copywriter?: string;
  tag?: string;
  tags?: string[];
  playCount?: number;
  trackCount?: number;
  creator?: {
    nickname?: string;
  };
}

interface PlaylistPayload {
  playlists?: PlaylistLike[];
}

export const DEFAULT_CHARTS = ["飙升榜", "新歌榜", "热歌榜"];

const secure = (url?: string) => {
  return url?.replaceAll("http:", "https:");
};

const formatArtists = (list?: ArtistLike[]) => {
  return (
    list
      ?.map((item) => item.name?.trim())
      .filter(Boolean)
      .join("/") || ""
  );
};

const mapSong = (item: TopSongLike): DiscoverSong => {
  const album = item.album?.name?.trim() ?? "";

  return {
    id: item.id.toString(),
    title: item.name?.trim() ?? "",
    artist: formatArtists(item.artists),
    album,
    coverUrl: secure(item.album?.picUrl),
    duration: item.duration,
    isNetease: true,
    neteaseId: item.id.toString(),
    reason: album || "新歌速递",
  };
};

const mapPreview = (item: ChartTrackLike): DiscoverPreview | null => {
  const title = item.first?.trim() ?? "";
  const artist = item.second?.trim() ?? "";

  if (!title || !artist) return null;

  return {
    title,
    artist,
  };
};

const mapChart = (item: ChartLike): DiscoverChart | null => {
  const title = item.name?.trim() ?? "";
  if (!title) return null;

  return {
    id: item.id.toString(),
    title,
    subtitle: item.updateFrequency?.trim() ?? "持续更新",
    coverUrl: secure(item.coverImgUrl),
    desc:
      item.description?.trim() ||
      item.updateFrequency?.trim() ||
      "公开精选榜单",
    preview: (item.tracks ?? [])
      .slice(0, 3)
      .map(mapPreview)
      .filter((item): item is DiscoverPreview => Boolean(item)),
    plays: item.playCount ?? 0,
  };
};

const splitTags = (item: PlaylistLike) => {
  const list = Array.isArray(item.tags)
    ? item.tags
    : (item.tag ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  return list.slice(0, 3);
};

const mapList = (item: PlaylistLike): DiscoverPlaylist | null => {
  const title = item.name?.trim() ?? "";
  if (!title) return null;

  return {
    id: item.id.toString(),
    title,
    coverUrl: secure(item.coverImgUrl),
    desc:
      item.copywriter?.trim() ||
      item.description?.trim() ||
      "把喜欢的内容整单带走",
    tags: splitTags(item),
    creator: item.creator?.nickname?.trim() ?? "网易云精选",
    count: item.trackCount ?? 0,
    plays: item.playCount ?? 0,
  };
};

export const mapTopSongsData = (payload: TopSongPayload): DiscoverSong[] => {
  return (payload.data ?? [])
    .map(mapSong)
    .filter((item) => item.title && item.artist);
};

export const mapToplistsData = (payload: ChartPayload): DiscoverChart[] => {
  return (payload.list ?? [])
    .map(mapChart)
    .filter((item): item is DiscoverChart => Boolean(item));
};

export const pickToplists = (
  list: DiscoverChart[],
  picks: string[] = DEFAULT_CHARTS,
): DiscoverChart[] => {
  return picks
    .map((name) => list.find((item) => item.title === name))
    .filter((item): item is DiscoverChart => Boolean(item));
};

export const mapHighQualityPlaylistsData = (
  payload: PlaylistPayload,
): DiscoverPlaylist[] => {
  return (payload.playlists ?? [])
    .map(mapList)
    .filter((item): item is DiscoverPlaylist => Boolean(item));
};

type NeteaseLike = Pick<
  DiscoverSong,
  "id" | "title" | "artist" | "album" | "coverUrl" | "neteaseId"
>;

export const toNeteaseSong = (item: NeteaseLike): Song => {
  return {
    id: item.id,
    title: item.title,
    artist: item.artist,
    coverUrl: secure(item.coverUrl),
    fileUrl: `https://api.qijieya.cn/meting/?type=url&id=${item.id}`,
    isNetease: true,
    neteaseId: item.neteaseId,
    album: item.album,
    lyrics: [],
    needsLyricsMatch: true,
  };
};
