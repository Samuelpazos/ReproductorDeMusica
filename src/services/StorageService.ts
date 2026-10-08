
import { DoublyLinkedList } from '../models/DoublyLinkedList';
import { SongData } from '../models/SongNode';

const STORAGE_KEY    = 'doubleplay_playlist';
const CURRENT_KEY     = 'doubleplay_actual';
const VOLUME_KEY     = 'doubleplay_volume';
const VERSION_KEY    = 'doubleplay_version';

const STORAGE_VERSION = '2';

export interface PlaylistSnapshot {
  songs: SongData[];
  currentId: string | null;
}

export class StorageService {

  static migrate(): void {
    const savedVersion = localStorage.getItem(VERSION_KEY);

    if (savedVersion !== STORAGE_VERSION) {
      
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CURRENT_KEY);
      localStorage.setItem(VERSION_KEY, STORAGE_VERSION);
      console.info(
        `[StorageService] Migrated v${savedVersion ?? 'no version'} → v${STORAGE_VERSION}.` +
        ' Previous playlist data was cleared.'
      );
    }
  }

  static save(list: DoublyLinkedList): void {
    try {
      const snapshot: PlaylistSnapshot = {
        songs: list.toArray(),
        currentId: list.current?.id ?? null,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      if (list.current) {
        localStorage.setItem(CURRENT_KEY, list.current.id);
      }
    } catch (error) {
      console.error('[StorageService] Failed to save playlist:', error);
    }
  }

  static load(list: DoublyLinkedList): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;

      const snapshot: PlaylistSnapshot = JSON.parse(raw);
      if (!snapshot.songs || snapshot.songs.length === 0) return false;

      const currentId = snapshot.currentId ?? undefined;

      list.fromArray(snapshot.songs, currentId);

      return true;
    } catch (error) {
      console.error('[StorageService] Failed to load playlist:', error);
      return false;
    }
  }

  static saveVolume(volume: number): void {
    localStorage.setItem(VOLUME_KEY, volume.toString());
  }

  static loadVolume(): number {
    const value = localStorage.getItem(VOLUME_KEY);
    if (value === null) return 80;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 80 : Math.min(100, Math.max(0, parsed));
  }

  static clearStorage(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CURRENT_KEY);
  }
}
