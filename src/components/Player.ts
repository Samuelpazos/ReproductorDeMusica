
import { SongNode } from '../models/SongNode';
import { PlayerState } from '../services/PlayerService';
import { formatTime, getCoverGradient, escapeHtml } from '../utils/helpers';

export class Player {
  private elements = {
    albumArt: document.getElementById('albumArt') as HTMLElement,
    albumVinyl: document.getElementById('albumVinyl') as HTMLElement,
    trackTitle: document.getElementById('trackTitle') as HTMLElement,
    trackArtist: document.getElementById('trackArtist') as HTMLElement,
    trackAlbum: document.getElementById('trackAlbum') as HTMLElement,
    trackPosition: document.getElementById('trackPositionText') as HTMLElement,
    playingIndicator: document.getElementById('playingIndicator') as HTMLElement,
    progressBar: document.getElementById('progressBar') as HTMLElement,
    progressThumb: document.getElementById('progressThumb') as HTMLElement,
    progressContainer: document.getElementById('progressBarContainer') as HTMLElement,
    timeCurrent: document.getElementById('timeCurrentDisplay') as HTMLElement,
    timeTotal: document.getElementById('timeTotalDisplay') as HTMLElement,
    playPauseBtn: document.getElementById('playPauseBtn') as HTMLButtonElement,
    iconPlay: document.querySelector('.icon-play') as SVGElement,
    iconPause: document.querySelector('.icon-pause') as SVGElement,
    shuffleBtn: document.getElementById('shuffleBtn') as HTMLButtonElement,
    repeatBtn: document.getElementById('repeatBtn') as HTMLButtonElement,
    repeatBadge: document.getElementById('repeatBadge') as HTMLElement,
    muteBtn: document.getElementById('muteBtn') as HTMLButtonElement,
    volumeSlider: document.getElementById('volumeSlider') as HTMLInputElement,
    volumeValue: document.getElementById('volValue') as HTMLElement,
    volumeIcon: document.getElementById('volIcon') as HTMLElement,
  };

  private currentSong: SongNode | null = null;

  updateSong(node: SongNode | null, position: number, total: number): void {
    this.currentSong = node;

    if (node === null) {
      this.showEmptyState();
      return;
    }

    this.updateCover(node);

    this.elements.trackTitle.textContent = node.title;
    this.elements.trackArtist.textContent = node.artist;
    this.elements.trackAlbum.textContent = node.album || '—';
    this.elements.trackPosition.textContent = `${position} / ${total}`;
    this.elements.timeTotal.textContent = node.duration;
    this.elements.timeCurrent.textContent = '0:00';
    this.elements.progressBar.style.width = '0%';
    this.elements.progressThumb.style.left = '0%';

    document.title = `${node.title} — ${node.artist} | DOUBLEPLAY`;
  }

  private updateCover(node: SongNode): void {
    if (node.image && node.image.startsWith('http')) {
      this.elements.albumArt.innerHTML = `
        <img src="${escapeHtml(node.image)}" 
             alt="Portada de ${escapeHtml(node.title)}" 
             class="album-img"
             onerror="this.parentElement.innerHTML='${this.getDefaultAlbumSVG(node.title)}'" />
      `;
    } else {
      const gradient = getCoverGradient(node.title);
      this.elements.albumArt.innerHTML = `
        <div class="album-placeholder" style="background: ${gradient}" aria-hidden="true">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="24" fill="rgba(255,255,255,0.1)"/>
            <circle cx="50" cy="50" r="8" fill="rgba(255,255,255,0.3)"/>
            <path d="M35 35 L65 50 L35 65 Z" fill="rgba(255,255,255,0.6)"/>
          </svg>
        </div>
      `;
    }
  }

  private getDefaultAlbumSVG(title: string): string {
    const gradient = getCoverGradient(title);
    return `<div class="album-placeholder" style="background: ${gradient}"></div>`;
  }

  private showEmptyState(): void {
    this.elements.trackTitle.textContent = 'DOUBLEPLAY';
    this.elements.trackArtist.textContent = 'Selecciona una canción para reproducir';
    this.elements.trackAlbum.textContent = '—';
    this.elements.trackPosition.textContent = 'Sin canción';
    this.elements.timeCurrent.textContent = '0:00';
    this.elements.timeTotal.textContent = '0:00';
    this.elements.progressBar.style.width = '0%';
    this.elements.albumArt.innerHTML = this.getDefaultEmptySVG();
    document.title = 'DOUBLEPLAY — Reproductor con Lista Doble';
  }

  private getDefaultEmptySVG(): string {
    return `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="50" cy="50" r="50" fill="url(#albumDefaultGrad2)"/>
        <path d="M38 35v30l26-15-26-15z" fill="white" opacity="0.4"/>
        <defs>
          <linearGradient id="albumDefaultGrad2" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stop-color="#4f3580"/>
            <stop offset="1" stop-color="#1a1040"/>
          </linearGradient>
        </defs>
      </svg>`;
  }

  updateProgress(state: PlayerState): void {
    this.elements.progressBar.style.width = `${state.progress}%`;
    this.elements.progressThumb.style.left = `${state.progress}%`;
    this.elements.timeCurrent.textContent = formatTime(state.currentTime);

    const container = this.elements.progressContainer;
    container.setAttribute('aria-valuenow', state.progress.toString());
  }

  updatePlayButton(isPlaying: boolean): void {
    const btn = this.elements.playPauseBtn;

    if (isPlaying) {
      this.elements.iconPlay.style.display = 'none';
      this.elements.iconPause.style.display = 'block';
      btn.setAttribute('aria-label', 'Pausar');
      btn.classList.add('playing');
      this.elements.albumVinyl.classList.add('spinning');
      this.elements.playingIndicator.classList.add('active');
    } else {
      this.elements.iconPlay.style.display = 'block';
      this.elements.iconPause.style.display = 'none';
      btn.setAttribute('aria-label', 'Reproducir');
      btn.classList.remove('playing');
      this.elements.albumVinyl.classList.remove('spinning');
      this.elements.playingIndicator.classList.remove('active');
    }
  }

  updateShuffleButton(enabled: boolean): void {
    const btn = this.elements.shuffleBtn;
    btn.setAttribute('aria-pressed', enabled.toString());
    btn.classList.toggle('active', enabled);
  }

  updateRepeatButton(mode: 'none' | 'one' | 'all'): void {
    const btn = this.elements.repeatBtn;
    const badge = this.elements.repeatBadge;

    btn.setAttribute('aria-pressed', (mode !== 'none').toString());
    btn.classList.remove('active', 'repeat-one', 'repeat-all');
    badge.style.display = 'none';

    if (mode === 'one') {
      btn.classList.add('active', 'repeat-one');
      badge.style.display = 'flex';
      badge.textContent = '1';
      btn.setAttribute('aria-label', 'Repetir canción actual');
    } else if (mode === 'all') {
      btn.classList.add('active', 'repeat-all');
      btn.setAttribute('aria-label', 'Repetir toda la playlist');
    } else {
      btn.setAttribute('aria-label', 'Sin repetir');
    }
  }

  updateVolume(volume: number, muted: boolean): void {
    this.elements.volumeSlider.value = volume.toString();
    this.elements.volumeValue.textContent = muted ? '🔇' : `${volume}%`;
    this.elements.muteBtn.classList.toggle('muted', muted);

    if (muted || volume === 0) {
      this.elements.muteBtn.setAttribute('aria-label', 'Activar sonido');
    } else {
      this.elements.muteBtn.setAttribute('aria-label', 'Silenciar');
    }
  }

  get currentSongNode(): SongNode | null {
    return this.currentSong;
  }
}
