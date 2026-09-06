import { useEffect, useState } from "react";
import type { DiscoverData } from "../services/discover";
import {
  fetchHighQualityPlaylists,
  fetchTopSongs,
  fetchToplists,
} from "../services/lyricsService";

interface DiscoverErr {
  songs?: string;
  charts?: string;
  playlists?: string;
}

const EMPTY: DiscoverData = {
  songs: [],
  charts: [],
  playlists: [],
  zhPlaylists: [],
  enPlaylists: [],
  jpPlaylists: [],
};

export const useDiscover = () => {
  const [data, setData] = useState<DiscoverData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<DiscoverErr>({});

  useEffect(() => {
    let dead = false;

    const load = async () => {
      setLoading(true);

      const [songs, charts, playlists, zhPlaylists, enPlaylists, jpPlaylists] = await Promise.allSettled([
        fetchTopSongs(),
        fetchToplists(),
        fetchHighQualityPlaylists(6, "全部"),
        fetchHighQualityPlaylists(6, "华语"),
        fetchHighQualityPlaylists(6, "欧美"),
        fetchHighQualityPlaylists(6, "日语"),
      ]);

      if (dead) return;

      setData({
        songs: songs.status === "fulfilled" ? songs.value : [],
        charts: charts.status === "fulfilled" ? charts.value : [],
        playlists: playlists.status === "fulfilled" ? playlists.value : [],
        zhPlaylists: zhPlaylists.status === "fulfilled" ? zhPlaylists.value : [],
        enPlaylists: enPlaylists.status === "fulfilled" ? enPlaylists.value : [],
        jpPlaylists: jpPlaylists.status === "fulfilled" ? jpPlaylists.value : [],
      });

      setErr({
        songs: songs.status === "rejected" ? "新歌暂时加载失败" : undefined,
        charts: charts.status === "rejected" ? "榜单暂时加载失败" : undefined,
        playlists: playlists.status === "rejected" ? "歌单暂时加载失败" : undefined,
      });

      setLoading(false);
    };

    load();

    return () => {
      dead = true;
    };
  }, []);

  return {
    data,
    loading,
    err,
  };
};
