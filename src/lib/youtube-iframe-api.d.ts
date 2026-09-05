declare namespace YT {
  enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }

  interface PlayerEvent {
    target: Player;
  }

  interface OnStateChangeEvent extends PlayerEvent {
    data: PlayerState;
  }

  interface OnErrorEvent extends PlayerEvent {
    data: number;
  }

  interface PlayerOptions {
    videoId?: string;
    width?: string | number;
    height?: string | number;
    playerVars?: {
      autoplay?: 0 | 1;
      rel?: 0 | 1;
      modestbranding?: 0 | 1;
      playsinline?: 0 | 1;
      [key: string]: unknown;
    };
    events?: {
      onReady?: (event: PlayerEvent) => void;
      onStateChange?: (event: OnStateChangeEvent) => void;
      onError?: (event: OnErrorEvent) => void;
    };
  }

  class Player {
    constructor(elementId: string | HTMLElement, options: PlayerOptions);
    loadVideoById(videoId: string | { videoId: string; startSeconds?: number }): void;
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
    mute(): void;
    unMute(): void;
    destroy(): void;
    getCurrentTime(): number;
    getDuration(): number;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
  }
}

interface Window {
  YT?: typeof YT;
  onYouTubeIframeAPIReady?: () => void;
}
