
import { SongNode } from '../models/SongNode';

export type RepeatMode = 'none' | 'one' | 'all';

export interface PlayerState {
  isPlaying: boolean;
  muted: boolean;
  volume: number;
  progress: number;        
  currentTime: number;    
  totalDuration: number;   
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
  hasAudio: boolean;     
}

type OnSongEndCallback = () => void;
type OnProgressCallback = (state: PlayerState) => void;

export class PlayerService {
  private audio: HTMLAudioElement;
  private state: PlayerState;
  private onSongEnd: OnSongEndCallback | null = null;
  private onProgress: OnProgressCallback | null = null;
  private progressInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'metadata';

    this.state = {
      isPlaying: false,
      muted: false,
      volume: 80,
      progress: 0,
      currentTime: 0,
      totalDuration: 0,
      shuffleEnabled: false,
      repeatMode: 'none',
      hasAudio: false,
    };

    this.audio.volume = this.state.volume / 100;
    this.bindAudioEvents();
  }

  setOnSongEnd(callback: OnSongEndCallback): void {
    this.onSongEnd = callback;
  }

  setOnProgress(callback: OnProgressCallback): void {
    this.onProgress = callback;
  }

  loadSong(node: SongNode): void {
    this.stop();

    if (node.audioUrl) {
      
      this.audio.src = node.audioUrl;
      this.audio.load();
      this.state.hasAudio = true;
      
    } else {
      
      this.audio.src = '';
      this.state.hasAudio = false;
      this.state.totalDuration = this.parseDuration(node.duration);
    }

    this.state.currentTime = 0;
    this.state.progress = 0;
    this.state.isPlaying = false;
  }

  play(): void {
    if (this.state.hasAudio && this.audio.src) {
      this.audio.play().catch(err => {
        console.warn('[PlayerService] Playback failed:', err);
      });
    } else if (!this.state.hasAudio) {
      
      if (this.state.totalDuration === 0) return;
      this.state.isPlaying = true;
      this.startSimulation();
    }
  }

  pause(): void {
    if (this.state.hasAudio) {
      this.audio.pause();
    } else {
      this.state.isPlaying = false;
      this.stopSimulation();
      this.onProgress?.(this.getState());
    }
  }

  stop(): void {
    if (this.state.hasAudio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.stopSimulation();
    this.state.isPlaying = false;
    this.state.currentTime = 0;
    this.state.progress = 0;
  }

  togglePlay(): boolean {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
    return this.state.isPlaying;
  }

  toggleMute(): boolean {
    this.state.muted = !this.state.muted;
    this.audio.muted = this.state.muted;
    return this.state.muted;
  }

  setVolume(value: number): void {
    this.state.volume = Math.min(100, Math.max(0, value));
    this.audio.volume = this.state.volume / 100;
    if (this.state.volume > 0) {
      this.state.muted = false;
      this.audio.muted = false;
    }
  }

  toggleShuffle(): boolean {
    this.state.shuffleEnabled = !this.state.shuffleEnabled;
    return this.state.shuffleEnabled;
  }

  cycleRepeatMode(): RepeatMode {
    const modes: RepeatMode[] = ['none', 'one', 'all'];
    const index = modes.indexOf(this.state.repeatMode);
    this.state.repeatMode = modes[(index + 1) % modes.length];
    return this.state.repeatMode;
  }

  seek(percentage: number): void {
    const percent = Math.min(100, Math.max(0, percentage));

    if (this.state.hasAudio && this.audio.duration && isFinite(this.audio.duration)) {
      this.audio.currentTime = (percent / 100) * this.audio.duration;
    } else {
      this.state.progress = percent;
      this.state.currentTime = Math.floor((percent / 100) * this.state.totalDuration);
      this.onProgress?.(this.getState());
    }
  }

  getState(): PlayerState {
    if (this.state.hasAudio && this.audio.src) {
      const duration = this.audio.duration || 0;
      const currentTime = this.audio.currentTime || 0;
      return {
        ...this.state,
        isPlaying: !this.audio.paused,  
        currentTime: Math.floor(currentTime),
        totalDuration: Math.floor(isFinite(duration) ? duration : 0),
        progress: duration > 0 ? (currentTime / duration) * 100 : 0,
      };
    }
    return { ...this.state };
  }

  isPlaying(): boolean {
    if (this.state.hasAudio && this.audio.src) {
      return !this.audio.paused;
    }
    return this.state.isPlaying;
  }

  private bindAudioEvents(): void {
    
    this.audio.addEventListener('loadedmetadata', () => {
      if (isFinite(this.audio.duration)) {
        this.state.totalDuration = Math.floor(this.audio.duration);
      }
      this.onProgress?.(this.getState());
    });

    this.audio.addEventListener('play', () => {
      this.state.isPlaying = true;
      this.startProgressInterval();
    });

    this.audio.addEventListener('pause', () => {
      this.state.isPlaying = false;
      this.stopProgressInterval();
      this.onProgress?.(this.getState());
    });

    this.audio.addEventListener('ended', () => {
      this.state.isPlaying = false;
      this.stopProgressInterval();
      this.onSongEnd?.();
    });

    this.audio.addEventListener('error', () => {
      console.warn('[PlayerService] Audio loading failed:', this.audio.error);
      this.state.isPlaying = false;
    });

    this.audio.addEventListener('timeupdate', () => {
      this.onProgress?.(this.getState());
    });
  }

  private startProgressInterval(): void {
    this.stopProgressInterval();
    
    this.progressInterval = setInterval(() => {
      if (this.state.hasAudio) {
        this.onProgress?.(this.getState());
      }
    }, 500);
  }

  private stopProgressInterval(): void {
    if (this.progressInterval !== null) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  private simulInterval: ReturnType<typeof setInterval> | null = null;

  private startSimulation(): void {
    this.stopSimulation();
    this.simulInterval = setInterval(() => {
      if (!this.state.isPlaying) return;

      this.state.currentTime++;
      if (this.state.totalDuration > 0) {
        this.state.progress = Math.min(
          100,
          (this.state.currentTime / this.state.totalDuration) * 100
        );
      }
      this.onProgress?.(this.getState());

      if (this.state.currentTime >= this.state.totalDuration) {
        this.state.isPlaying = false;
        this.state.currentTime = 0;
        this.state.progress = 0;
        this.stopSimulation();
        this.onSongEnd?.();
      }
    }, 1000);
  }

  private stopSimulation(): void {
    if (this.simulInterval !== null) {
      clearInterval(this.simulInterval);
      this.simulInterval = null;
    }
  }

  private parseDuration(duration: string): number {
    const parts = duration.split(':');
    if (parts.length !== 2) return 180;
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseInt(parts[1], 10) || 0;
    return mins * 60 + secs;
  }
}
