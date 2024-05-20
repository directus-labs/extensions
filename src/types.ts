import type { PrimaryKey } from "@directus/types";

type YouTubeID = string;
type VimeoID = string;

export type VideoService = "youtube" | "vimeo" | "directus";
export type VideoID = YouTubeID | VimeoID | PrimaryKey;
export type Video = { service: VideoService; id: VideoID } | null | undefined;
