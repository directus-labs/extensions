export type VideoService = "youtube" | "vimeo" | "directus";
export type VideoID = string;
export type Video = { service: VideoService; id: VideoID } | null | undefined;
