
import { DoublyLinkedList } from './models/DoublyLinkedList';
import { StorageService } from './services/StorageService';
import { PlayerService } from './services/PlayerService';
import { Player } from './components/Player';
import { Playlist } from './components/Playlist';
import { AudioUploader } from './components/AudioUploader';
import { DataStructureView } from './components/DataStructureView';

const list = new DoublyLinkedList();

const playerService = new PlayerService();

const player = new Player();
const structureView = new DataStructureView();
let playlist: Playlist;

let toastTimer: ReturnType<typeof setTimeout> | null = null;

function showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
  const toast = document.getElementById('toast') as HTMLElement;
  if (toastTimer) clearTimeout(toastTimer);

  toast.textContent = message;
  toast.className = `toast toast-${type} show`;

  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

function updateUI(scroll = true): void {
  
  playlist.render(list);

  structureView.render(list);

  const devPanel = document.getElementById('devPanel') as HTMLElement;
  if (devPanel.style.display !== 'none') {
    const devContent = document.getElementById('devContent') as HTMLElement;
    structureView.renderDebug(list, devContent);
  }

  const current = list.getCurrent();
  const currentPosition = list.getCurrentPosition();
  player.updateSong(current, currentPosition, list.size);

  if (scroll && current) {
    const activeEl = document.querySelector(`.playlist-item[data-id="${current.id}"]`);
    activeEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  StorageService.save(list);
}

function playCurrentSong(): void {
  const current = list.getCurrent();
  if (!current) return;

  playerService.loadSong(current);

  setTimeout(() => {
    playerService.play();
    player.updatePlayButton(true);
  }, 50);
}

function selectAndPlay(id: string): void {
  if (!list.setCurrentById(id)) return;

  playerService.stop();
  updateUI();
  playCurrentSong();
}

function bindPlayerControls(): void {

  document.getElementById('playPauseBtn')?.addEventListener('click', () => {
    const current = list.getCurrent();
    if (!current) {
      showToast('⚠️ Selecciona una canción primero', 'error');
      return;
    }

    if (playerService.isPlaying()) {
      
      playerService.pause();
      player.updatePlayButton(false);
    } else {

      const state = playerService.getState();
      if (!state.hasAudio && state.totalDuration === 0) {
        
        playerService.loadSong(current);
      }
      playerService.play();
      player.updatePlayButton(true); 
    }
  });

  document.getElementById('nextBtn')?.addEventListener('click', () => {
    playNextSong();
  });

  document.getElementById('prevBtn')?.addEventListener('click', () => {
    playPreviousSong();
  });

  document.getElementById('shuffleBtn')?.addEventListener('click', () => {
    const enabled = playerService.toggleShuffle();
    player.updateShuffleButton(enabled);
    showToast(enabled ? '🔀 Modo aleatorio activado' : '🔀 Modo aleatorio desactivado', 'info');
  });

  document.getElementById('repeatBtn')?.addEventListener('click', () => {
    const mode = playerService.cycleRepeatMode();
    player.updateRepeatButton(mode);
    const msgs: Record<string, string> = {
      none: '🔁 Sin repetir',
      one: '🔂 Repitiendo canción actual',
      all: '🔁 Repitiendo toda la playlist',
    };
    showToast(msgs[mode], 'info');
  });

  document.getElementById('muteBtn')?.addEventListener('click', () => {
    const muted = playerService.toggleMute();
    const volume = playerService.getState().volume;
    player.updateVolume(volume, muted);
    StorageService.saveVolume(volume);
  });

  document.getElementById('volumeSlider')?.addEventListener('input', (e) => {
    const value = parseInt((e.target as HTMLInputElement).value, 10);
    playerService.setVolume(value);
    const state = playerService.getState();
    player.updateVolume(value, state.muted);
    StorageService.saveVolume(value);
  });

  const progressContainer = document.getElementById('progressBarContainer');
  progressContainer?.addEventListener('click', (e) => {
    const rect = progressContainer.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    playerService.seek(pct);
  });

  document.addEventListener('keydown', (e) => {
    const tag = (e.target as HTMLElement).tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        document.getElementById('playPauseBtn')?.click();
        break;
      case 'ArrowRight':
        e.preventDefault();
        playNextSong();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        playPreviousSong();
        break;
    }
  });
}

function playNextSong(): void {
  const state = playerService.getState();
  playerService.stop();

  if (state.shuffleEnabled && list.size > 1) {
    
    const randomNode = list.getRandomNode();
    if (randomNode && randomNode.id !== list.current?.id) {
      list.setCurrentById(randomNode.id);
      updateUI();
      playCurrentSong();
      return;
    }
  }

  const next = list.nextSong();

  if (next === null) {
    const mode = playerService.getState().repeatMode;
    if (mode === 'all') {
      
      list.current = list.head;
      updateUI();
      playCurrentSong();
      showToast('🔁 Volviendo al inicio de la playlist', 'info');
    } else {
      showToast('⏭ Ya estás en la última canción', 'info');
      player.updatePlayButton(false);
    }
    return;
  }

  updateUI();
  playCurrentSong();
}

function playPreviousSong(): void {
  playerService.stop();

  if (playerService.getState().currentTime > 3) {
    playerService.stop();
    playCurrentSong();
    return;
  }

  const previous = list.previousSong();

  if (previous === null) {
    showToast('⏮ Ya estás en la primera canción', 'info');
    playCurrentSong();
    return;
  }

  updateUI();
  playCurrentSong();
}

function bindListOperations(): void {
  
  document.getElementById('removeFirstBtn')?.addEventListener('click', () => {
    if (list.size === 0) {
      showToast('⚠️ La playlist está vacía', 'error');
      return;
    }
    const removedSong = list.removeFirst();
    if (removedSong) {
      playerService.stop();
      player.updatePlayButton(false);
      updateUI();
      showToast(`🗑️ "${removedSong.title}" eliminada del inicio`, 'success');
    }
  });

  document.getElementById('removeLastBtn')?.addEventListener('click', () => {
    if (list.size === 0) {
      showToast('⚠️ La playlist está vacía', 'error');
      return;
    }
    const removedSong = list.removeLast();
    if (removedSong) {
      playerService.stop();
      player.updatePlayButton(false);
      updateUI();
      showToast(`🗑️ "${removedSong.title}" eliminada del final`, 'success');
    }
  });

  document.getElementById('removeAtPositionBtn')?.addEventListener('click', () => {
    const input = document.getElementById('removePositionInput') as HTMLInputElement;
    const positionIndex = parseInt(input.value, 10);

    if (isNaN(positionIndex) || positionIndex < 1) {
      showToast('⚠️ Ingresa una posición válida (mayor a 0)', 'error');
      return;
    }

    if (positionIndex > list.size) {
      showToast(`⚠️ La posición ${positionIndex} está fuera de rango. Solo hay ${list.size} canciones`, 'error');
      return;
    }

    const removedSong = list.removeAt(positionIndex);
    if (removedSong) {
      playerService.stop();
      player.updatePlayButton(false);
      updateUI();
      input.value = '';
      showToast(`🗑️ "${removedSong.title}" eliminada de la posición ${positionIndex}`, 'success');
    }
  });

  document.getElementById('clearPlaylistBtn')?.addEventListener('click', () => {
    if (list.size === 0) {
      showToast('⚠️ La playlist ya está vacía', 'info');
      return;
    }

    if (confirm('¿Vaciar toda la playlist?')) {
      list.clear();
      playerService.stop();
      player.updatePlayButton(false);
      playlist.resetEmptyMessage();
      updateUI();
      StorageService.clearStorage();
      showToast('🗑️ Playlist vaciada', 'success');
    }
  });
}

function initAudioUploader(): void {
  new AudioUploader((song) => {
    const node = list.addFirst(song);
    updateUI();
    showToast(`🎵 "${song.title}" agregada al inicio`, 'success');

    if (list.size === 1) {
      playerService.loadSong(node);
      player.updateSong(node, 1, 1);
    }
  });
}

function bindSearch(): void {
  const searchInput = document.getElementById('searchInput') as HTMLInputElement;
  const clearBtn = document.getElementById('clearSearch') as HTMLButtonElement;
  let searchTimer: ReturnType<typeof setTimeout> | null = null;

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    clearBtn.style.display = query ? 'flex' : 'none';

    if (searchTimer) clearTimeout(searchTimer);

    searchTimer = setTimeout(() => {
      if (!query) {
        
        playlist.resetEmptyMessage();
        playlist.render(list);
        return;
      }

      const results = list.searchSongs(query);
      playlist.renderSearchResults(results, list.current?.id);

      if (results.length > 0) {
        showToast(`🔍 ${results.length} resultado${results.length > 1 ? 's' : ''} encontrado${results.length > 1 ? 's' : ''}`, 'info');
      }
    }, 300);
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    playlist.resetEmptyMessage();
    playlist.render(list);
    searchInput.focus();
  });
}

function bindDeveloperMode(): void {
  const devPanel = document.getElementById('devPanel') as HTMLElement;
  const devContent = document.getElementById('devContent') as HTMLElement;

  document.getElementById('devModeBtn')?.addEventListener('click', () => {
    const visible = devPanel.style.display !== 'none';
    devPanel.style.display = visible ? 'none' : 'block';

    if (!visible) {
      structureView.renderDebug(list, devContent);
    }
  });

  document.getElementById('closeDevPanel')?.addEventListener('click', () => {
    devPanel.style.display = 'none';
  });
}

function bindInfoModal(): void {
  const modal = document.getElementById('infoModal') as HTMLElement;
  const backdrop = document.getElementById('modalBackdrop') as HTMLElement;

  document.getElementById('infoBtn')?.addEventListener('click', () => {
    modal.style.display = 'flex';
    backdrop.style.display = 'block';
  });

  const close = () => {
    modal.style.display = 'none';
    backdrop.style.display = 'none';
  };

  document.getElementById('closeInfoModal')?.addEventListener('click', close);
  backdrop.addEventListener('click', close);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display !== 'none') close();
  });
}

function bindPlayerCallbacks(): void {

  playerService.setOnProgress((state) => {
    player.updateProgress(state);
    player.updatePlayButton(state.isPlaying);
  });

  playerService.setOnSongEnd(() => {
    const mode = playerService.getState().repeatMode;

    if (mode === 'one') {
      
      playCurrentSong();
      return;
    }

    if (playerService.getState().shuffleEnabled && list.size > 1) {
      const randomNode = list.getRandomNode();
      if (randomNode) {
        list.setCurrentById(randomNode.id);
        updateUI();
        playCurrentSong();
        return;
      }
    }

    const next = list.nextSong();
    if (next) {
      updateUI();
      playCurrentSong();
    } else if (mode === 'all') {
      list.current = list.head;
      updateUI();
      playCurrentSong();
    } else {
      player.updatePlayButton(false);
      showToast('✅ Playlist finalizada', 'info');
    }
  });
}

function init(): void {
  
  playlist = new Playlist(
    
    (id: string) => {
      selectAndPlay(id);
    },
    
    (id: string) => {
      const removedSong = list.removeById(id);
      if (removedSong) {
        playerService.stop();
        player.updatePlayButton(false);
        updateUI();
        showToast(`🗑️ "${removedSong.title}" eliminada`, 'success');
      }
    },
    
    (sourceId: string, targetId: string) => {
      const moved = list.moveBefore(sourceId, targetId);
      if (moved) {
        updateUI(false);
        StorageService.save(list);
      }
    }
  );

  const savedVolume = StorageService.loadVolume();
  playerService.setVolume(savedVolume);
  player.updateVolume(savedVolume, false);

  StorageService.migrate();

  StorageService.load(list);

  updateUI(false);

  const current = list.getCurrent();
  if (current) {
    playerService.loadSong(current);
  }

  bindPlayerControls();
  bindListOperations();
  bindSearch();
  bindDeveloperMode();
  bindInfoModal();
  bindPlayerCallbacks();
  initAudioUploader();

  console.info('[DOUBLEPLAY] Application initialized successfully');
  console.info('[DOUBLEPLAY] Doubly linked list:', list.debugInfo());
}

document.addEventListener('DOMContentLoaded', init);
