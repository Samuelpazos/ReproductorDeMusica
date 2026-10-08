import { SongData } from '../models/SongNode';
import { generateId } from '../utils/helpers';

type OnSongUpload = (song: SongData) => void;

function getAudioDuration(audioUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.src = audioUrl;

    const timeout = setTimeout(() => resolve('0:00'), 5000);
    audio.addEventListener('loadedmetadata', () => {
      clearTimeout(timeout);
      if (!Number.isFinite(audio.duration)) {
        resolve('0:00');
        return;
      }

      const minutes = Math.floor(audio.duration / 60);
      const seconds = Math.floor(audio.duration % 60).toString().padStart(2, '0');
      resolve(`${minutes}:${seconds}`);
    }, { once: true });
    audio.addEventListener('error', () => {
      clearTimeout(timeout);
      resolve('0:00');
    }, { once: true });
  });
}

function parseSongMetadata(filename: string): { title: string; artist: string } {
  const name = filename.replace(/\.(mp3|ogg|wav|flac|m4a|aac|opus|webm)$/i, '');
  const parts = name.split(' - ');

  if (parts.length >= 2) {
    return {
      artist: parts[0].trim(),
      title: parts.slice(1).join(' - ').trim(),
    };
  }

  return { title: name.trim(), artist: 'Desconocido' };
}

export class AudioUploader {
  private readonly fileInput: HTMLInputElement;
  private readonly dropZone: HTMLElement;
  private readonly onUpload: OnSongUpload;
  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(onUpload: OnSongUpload) {
    this.fileInput = document.getElementById('audioFileInput') as HTMLInputElement;
    this.dropZone = document.getElementById('audioDropZone') as HTMLElement;
    this.onUpload = onUpload;
    this.bindEvents();
  }

  private bindEvents(): void {
    this.dropZone.addEventListener('click', () => this.fileInput.click());
    this.dropZone.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.fileInput.click();
      }
    });

    this.fileInput.addEventListener('change', () => {
      const files = Array.from(this.fileInput.files ?? []);
      this.fileInput.value = '';
      void this.processFiles(files);
    });

    this.dropZone.addEventListener('dragover', (event) => {
      event.preventDefault();
      this.dropZone.classList.add('drag-over');
    });

    this.dropZone.addEventListener('dragleave', () => {
      this.dropZone.classList.remove('drag-over');
    });

    this.dropZone.addEventListener('drop', (event) => {
      event.preventDefault();
      this.dropZone.classList.remove('drag-over');
      const files = Array.from(event.dataTransfer?.files ?? [])
        .filter((file) => file.type.startsWith('audio/'));
      void this.processFiles(files);
    });
  }

  private async processFiles(files: File[]): Promise<void> {
    for (const file of [...files].reverse()) {
      const audioUrl = URL.createObjectURL(file);
      const duration = await getAudioDuration(audioUrl);
      const { title, artist } = parseSongMetadata(file.name);

      this.onUpload({
        id: generateId(),
        title,
        artist,
        album: '',
        duration,
        image: '',
        audioUrl,
      });
      this.updateDropZone(file.name, duration);
    }
  }

  private updateDropZone(filename: string, duration: string): void {
    const label = this.dropZone.querySelector('.drop-label') as HTMLElement | null;
    const subtitle = this.dropZone.querySelector('.drop-sub') as HTMLElement | null;
    const icon = this.dropZone.querySelector('.drop-icon') as HTMLElement | null;

    if (label) label.textContent = filename.length > 32 ? `${filename.slice(0, 29)}...` : filename;
    if (subtitle) subtitle.textContent = `Audio listo • ${duration}`;
    if (icon) icon.textContent = '🎵';
    this.dropZone.classList.add('has-file');

    if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
    this.feedbackTimer = setTimeout(() => {
      if (label) label.textContent = 'Sube tu canción';
      if (subtitle) subtitle.textContent = 'Arrastra un archivo o haz clic aquí • MP3, WAV, OGG, FLAC';
      if (icon) icon.textContent = '🎵';
      this.dropZone.classList.remove('has-file');
      this.feedbackTimer = null;
    }, 2000);
  }
}
