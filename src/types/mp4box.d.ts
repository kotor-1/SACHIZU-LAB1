declare module 'mp4box' {
  export interface MP4MediaTrack {
    id: number;
    created: Date;
    modified: Date;
    volume: number;
    track_width: number;
    track_height: number;
    timescale: number;
    duration: number;
    bitrate: number;
    codec: string;
    language: string;
    nb_samples: number;
    /** tkhd duration in movie timescale units */
    movie_duration?: number;
    /** mvhd timescale */
    movie_timescale?: number;
    /** mp4box 0.5.2 public representation of edts/elst entries */
    edits?: Array<{
      segment_duration: number;
      media_time: number;
      media_rate_integer: number;
      media_rate_fraction: number;
    }>;
  }

  export interface MP4Info {
    duration: number;
    timescale: number;
    isFragmented: boolean;
    isProgressive: boolean;
    hasIOD: boolean;
    brands: string[];
    created: Date;
    modified: Date;
    tracks: MP4MediaTrack[];
    videoTracks: MP4MediaTrack[];
    audioTracks: MP4MediaTrack[];
  }

  export interface MP4Sample {
    track_id: number;
    number: number;
    cts: number;
    dts: number;
    duration: number;
    is_sync: boolean;
    offset: number;
    size: number;
    data?: ArrayBuffer;
    description?: unknown;
  }

  export class MP4File {
    onReady?: (info: MP4Info) => void;
    onError?: (e: string | Error) => void;
    onSamples?: (id: number, user: unknown, samples: MP4Sample[]) => void;
    appendBuffer(data: ArrayBuffer & { fileStart: number }): number;
    flush(): void;
    start(): void;
    stop(): void;
    setExtractionOptions(id: number, user?: unknown, options?: { nbSamples?: number; rapAlignment?: number }): void;
  }

  export function createFile(): MP4File;
}
