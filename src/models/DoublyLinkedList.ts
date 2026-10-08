
import { SongNode, SongData } from './SongNode';

export class DoublyLinkedList {
  
  head: SongNode | null;

  tail: SongNode | null;

  current: SongNode | null;

  size: number;

  constructor() {
    this.head = null;
    this.tail = null;
    this.current = null;
    this.size = 0;
  }

  addFirst(song: SongData): SongNode {
    const newNode = new SongNode(song);

    if (this.head === null) {
      
      this.head = newNode;
      this.tail = newNode;
      this.current = newNode;
    } else {
      
      newNode.next = this.head;
      this.head.previous = newNode;
      this.head = newNode;
    }

    this.size++;
    return newNode;
  }

  addLast(song: SongData): SongNode {
    const newNode = new SongNode(song);

    if (this.tail === null) {
      
      this.head = newNode;
      this.tail = newNode;
      this.current = newNode;
    } else {
      
      newNode.previous = this.tail;
      this.tail.next = newNode;
      this.tail = newNode;
    }

    this.size++;
    return newNode;
  }

  insertAt(song: SongData, position: number): SongNode {
    if (position <= 1) {
      return this.addFirst(song);
    }
    if (position >= this.size + 1) {
      return this.addLast(song);
    }

    const newNode = new SongNode(song);

    let cursor: SongNode | null = this.head;
    for (let i = 1; i < position - 1; i++) {
      if (cursor === null) break;
      cursor = cursor.next;
    }

    if (cursor === null || cursor.next === null) {
      return this.addLast(song);
    }

    const next = cursor.next;

    newNode.previous = cursor;
    newNode.next = next;
    cursor.next = newNode;
    next.previous = newNode;

    this.size++;
    return newNode;
  }

  removeFirst(): SongNode | null {
    if (this.head === null) return null;

    const removedSong = this.head;

    if (this.head === this.tail) {
      
      this.head = null;
      this.tail = null;
      this.current = null;
    } else {
      this.head = this.head.next;
      if (this.head !== null) {
        this.head.previous = null;
      }
    }

    if (this.current === removedSong) {
      this.current = this.head;
    }

    removedSong.previous = null;
    removedSong.next = null;
    this.size--;
    return removedSong;
  }

  removeLast(): SongNode | null {
    if (this.tail === null) return null;

    const removedSong = this.tail;

    if (this.head === this.tail) {
      
      this.head = null;
      this.tail = null;
      this.current = null;
    } else {
      this.tail = this.tail.previous;
      if (this.tail !== null) {
        this.tail.next = null;
      }
    }

    if (this.current === removedSong) {
      this.current = this.tail;
    }

    removedSong.previous = null;
    removedSong.next = null;
    this.size--;
    return removedSong;
  }

  removeAt(position: number): SongNode | null {
    if (this.head === null) return null;
    if (position <= 1) return this.removeFirst();
    if (position >= this.size) return this.removeLast();

    let cursor: SongNode | null = this.head;
    for (let i = 1; i < position; i++) {
      if (cursor === null) break;
      cursor = cursor.next;
    }

    if (cursor === null) return null;

    const removedSong = cursor;
    const previousNode = cursor.previous;
    const next = cursor.next;

    if (previousNode !== null) previousNode.next = next;
    if (next !== null) next.previous = previousNode;

    if (this.current === removedSong) {
      this.current = next !== null ? next : previousNode;
    }

    removedSong.previous = null;
    removedSong.next = null;
    this.size--;
    return removedSong;
  }

  removeById(id: string): SongNode | null {
    let cursor = this.head;
    let positionIndex = 1;

    while (cursor !== null) {
      if (cursor.id === id) {
        return this.removeAt(positionIndex);
      }
      cursor = cursor.next;
      positionIndex++;
    }
    return null;
  }

  nextSong(): SongNode | null {
    if (this.current === null) return null;
    if (this.current.next === null) return null;

    this.current = this.current.next;
    return this.current;
  }

  previousSong(): SongNode | null {
    if (this.current === null) return null;
    if (this.current.previous === null) return null;

    this.current = this.current.previous;
    return this.current;
  }

  getCurrent(): SongNode | null {
    return this.current;
  }

  setCurrentById(id: string): boolean {
    let cursor = this.head;
    while (cursor !== null) {
      if (cursor.id === id) {
        this.current = cursor;
        return true;
      }
      cursor = cursor.next;
    }
    return false;
  }

  searchSongs(text: string): SongNode[] {
    const results: SongNode[] = [];
    const query = text.toLowerCase().trim();
    if (!query) return results;

    let cursor = this.head;
    while (cursor !== null) {
      const matchesTitle = cursor.title.toLowerCase().includes(query);
      const matchesArtist = cursor.artist.toLowerCase().includes(query);
      const matchesAlbum = cursor.album.toLowerCase().includes(query);

      if (matchesTitle || matchesArtist || matchesAlbum) {
        results.push(cursor);
      }

      cursor = cursor.next;
    }

    return results;
  }

  countSongs(): number {
    return this.size;
  }

  getSongAt(position: number): SongNode | null {
    if (position < 1 || position > this.size) return null;

    let cursor = this.head;
    for (let i = 1; i < position; i++) {
      if (cursor === null) return null;
      cursor = cursor.next;
    }
    return cursor;
  }

  clear(): void {
    this.head = null;
    this.tail = null;
    this.current = null;
    this.size = 0;
  }

  moveBefore(sourceId: string, targetId: string): boolean {
    if (sourceId === targetId) return false;

    let sourceNode: SongNode | null = null;
    let targetNode: SongNode | null = null;
    let cursor = this.head;

    while (cursor !== null) {
      if (cursor.id === sourceId) sourceNode = cursor;
      if (cursor.id === targetId) targetNode = cursor;
      cursor = cursor.next;
    }

    if (!sourceNode || !targetNode) return false;

    if (sourceNode.next?.id === targetId) return false;

    const sourcePrevious = sourceNode.previous;
    const sourceNext = sourceNode.next;

    if (sourcePrevious) sourcePrevious.next = sourceNext;
    else this.head = sourceNext;          

    if (sourceNext) sourceNext.previous = sourcePrevious;
    else this.tail = sourcePrevious;            

    sourceNode.previous = null;
    sourceNode.next = null;

    const targetPrevious = targetNode.previous;

    sourceNode.next = targetNode;
    sourceNode.previous  = targetPrevious;

    targetNode.previous = sourceNode;

    if (targetPrevious) targetPrevious.next = sourceNode;
    else this.head = sourceNode;              

    return true;
  }

  getTotalDurationSeconds(): number {
    let total = 0;
    let cursor = this.head;

    while (cursor !== null) {
      const parts = cursor.duration.split(':');
      if (parts.length === 2) {
        const mins = parseInt(parts[0], 10) || 0;
        const secs = parseInt(parts[1], 10) || 0;
        total += mins * 60 + secs;
      }
      cursor = cursor.next;
    }

    return total;
  }

  getRandomNode(): SongNode | null {
    if (this.size === 0) return null;
    const position = Math.floor(Math.random() * this.size) + 1;
    return this.getSongAt(position);
  }

  getCurrentPosition(): number {
    if (this.current === null) return 0;

    let cursor = this.head;
    let positionIndex = 1;

    while (cursor !== null) {
      if (cursor.id === this.current.id) return positionIndex;
      cursor = cursor.next;
      positionIndex++;
    }

    return 0;
  }

  toArray(): SongData[] {
    const data: SongData[] = [];
    let cursor = this.head;

    while (cursor !== null) {
      data.push(cursor.toJSON());
      cursor = cursor.next;
    }

    return data;
  }

  fromArray(data: SongData[], currentId?: string): void {
    this.clear();

    for (const song of data) {
      this.addLast(song);
    }

    if (currentId) {
      this.setCurrentById(currentId);
    } else if (this.head !== null) {
      this.current = this.head;
    }
  }

  debugInfo(): string {
    const lines: string[] = [];
    lines.push(`Tamaño: ${this.size}`);
    lines.push(`Cabeza: ${this.head?.title ?? 'NULL'}`);
    lines.push(`Actual: ${this.current?.title ?? 'NULL'}`);
    lines.push(`Cola: ${this.tail?.title ?? 'NULL'}`);
    lines.push('');

    let cursor = this.head;
    let idx = 1;
    while (cursor !== null) {
      const isCurrent = this.current?.id === cursor.id ? ' ← ACTUAL' : '';
      const prev = cursor.previous?.title ?? 'NULL';
      const next = cursor.next?.title ?? 'NULL';
      lines.push(`[${idx}] ${cursor.title}${isCurrent}`);
      lines.push(`     ← ${prev} | → ${next}`);
      cursor = cursor.next;
      idx++;
    }

    return lines.join('\n');
  }
}
