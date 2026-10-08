
import { DoublyLinkedList } from '../models/DoublyLinkedList';
import { SongNode } from '../models/SongNode';
import { formatTotalDuration, escapeHtml, truncateText } from '../utils/helpers';

type OnSelectCallback = (id: string) => void;
type OnDeleteCallback = (id: string) => void;
type OnReorderCallback = (sourceId: string, targetId: string) => void;

export class Playlist {
  private container: HTMLElement;
  private emptyMsg: HTMLElement;
  private statHead: HTMLElement;
  private statCurrent: HTMLElement;
  private statTail: HTMLElement;
  private statSize: HTMLElement;
  private songCountBadge: HTMLElement;
  private totalDurationBadge: HTMLElement;

  private onSelect: OnSelectCallback;
  private onDelete: OnDeleteCallback;
  private onReorder: OnReorderCallback;

  private dragId: string | null = null;

  constructor(onSelect: OnSelectCallback, onDelete: OnDeleteCallback, onReorder: OnReorderCallback) {
    this.container = document.getElementById('playlistContainer') as HTMLElement;
    this.emptyMsg = document.getElementById('playlistEmpty') as HTMLElement;
    this.statHead = document.getElementById('statHead') as HTMLElement;
    this.statCurrent = document.getElementById('statCurrent') as HTMLElement;
    this.statTail = document.getElementById('statTail') as HTMLElement;
    this.statSize = document.getElementById('statSize') as HTMLElement;
    this.songCountBadge = document.getElementById('songCountBadge') as HTMLElement;
    this.totalDurationBadge = document.getElementById('totalDurationBadge') as HTMLElement;
    this.onSelect = onSelect;
    this.onDelete = onDelete;
    this.onReorder = onReorder;
  }

  render(list: DoublyLinkedList, filter?: Set<string>): void {
    
    const children = Array.from(this.container.children);
    for (const child of children) {
      if (child !== this.emptyMsg) {
        child.remove();
      }
    }

    if (list.size === 0) {
      this.emptyMsg.style.display = 'flex';
      this.updateStats(list);
      return;
    }

    this.emptyMsg.style.display = 'none';

    let cursor: SongNode | null = list.head;
    let position = 1;

    while (cursor !== null) {
      
      if (!filter || filter.has(cursor.id)) {
        const card = this.createCard(cursor, position, list.current?.id);
        this.container.appendChild(card);
      }

      cursor = cursor.next;
      position++;
    }

    const activeCard = this.container.querySelector('.playlist-item.active');
    if (activeCard) {
      activeCard.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    this.updateStats(list);
  }

  renderSearchResults(nodes: SongNode[], currentId?: string): void {
    const children = Array.from(this.container.children);
    for (const child of children) {
      if (child !== this.emptyMsg) {
        child.remove();
      }
    }

    if (nodes.length === 0) {
      this.emptyMsg.style.display = 'flex';
      this.emptyMsg.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <p>Sin resultados</p>
        <span>Prueba con otro término</span>
      `;
      return;
    }

    this.emptyMsg.style.display = 'none';

    nodes.forEach((node, idx) => {
      const card = this.createCard(node, idx + 1, currentId);
      this.container.appendChild(card);
    });
  }

  resetEmptyMessage(): void {
    this.emptyMsg.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
      </svg>
      <p>Tu playlist está vacía</p>
      <span>Sube canciones usando el panel derecho</span>
    `;
  }

  private createCard(
    node: SongNode,
    position: number,
    currentId?: string
  ): HTMLElement {
    const isActive = node.id === currentId;

    const item = document.createElement('div');
    item.className = `playlist-item${isActive ? ' active' : ''}`;
    item.setAttribute('role', 'listitem');
    item.dataset.id = node.id;
    item.setAttribute('draggable', 'true');
    item.setAttribute('aria-label', `${position}. ${node.title} por ${node.artist}${isActive ? ' — Reproduciendo' : ''}`);

    item.innerHTML = `
      <div class="drag-handle" title="Arrastra para reordenar" aria-hidden="true">⠿</div>
      <div class="item-number">${position.toString().padStart(2, '0')}</div>
      <div class="item-body">
        <div class="item-title">${escapeHtml(truncateText(node.title, 30))}</div>
        <div class="item-meta">
          <span class="item-artist">${escapeHtml(node.artist)}</span>
          ${node.album ? `<span class="item-sep">·</span><span class="item-album">${escapeHtml(truncateText(node.album, 20))}</span>` : ''}
        </div>
      </div>
      <div class="item-right">
        <span class="item-duration">${escapeHtml(node.duration)}</span>
        <div class="item-actions">
          ${node.audioUrl ? '<span class="item-audio-badge" title="Archivo de audio cargado" aria-label="Tiene audio">🎵</span>' : ''}
          ${isActive ? '<span class="item-playing-badge" aria-label="Reproduciendo ahora">▶</span>' : ''}
          <button class="item-btn item-play-btn" data-id="${node.id}" aria-label="Reproducir ${escapeHtml(node.title)}" title="Reproducir">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </button>
          <button class="item-btn item-delete-btn" data-id="${node.id}" aria-label="Eliminar ${escapeHtml(node.title)}" title="Eliminar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    item.querySelector('.item-play-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onSelect(node.id);
    });

    item.querySelector('.item-delete-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onDelete(node.id);
    });

    item.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (
        target.classList.contains('drag-handle') ||
        target.closest('.item-btn')
      ) return;
      this.onSelect(node.id);
    });

    item.addEventListener('dragstart', (e) => {
      this.dragId = node.id;
      requestAnimationFrame(() => item.classList.add('dragging'));
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', node.id);
      }
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      this.dragId = null;
      
      this.container.querySelectorAll('.playlist-item.drag-over-top').forEach((element) => {
        element.classList.remove('drag-over-top');
      });
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (!this.dragId || this.dragId === node.id) return;
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';

      this.container.querySelectorAll('.playlist-item.drag-over-top').forEach((element) => {
        element.classList.remove('drag-over-top');
      });
      item.classList.add('drag-over-top');
    });

    item.addEventListener('dragleave', (e) => {
      const rel = e.relatedTarget as HTMLElement | null;
      if (!rel || !item.contains(rel)) {
        item.classList.remove('drag-over-top');
      }
    });

    item.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      item.classList.remove('drag-over-top');

      const sourceId = this.dragId ?? e.dataTransfer?.getData('text/plain');
      if (!sourceId || sourceId === node.id) return;

      this.onReorder(sourceId, node.id);
    });

    return item;
  }

  private updateStats(list: DoublyLinkedList): void {
    const count = list.size;
    const duration = list.getTotalDurationSeconds();

    this.songCountBadge.textContent = `${count} canción${count !== 1 ? 'es' : ''}`;
    this.totalDurationBadge.textContent = formatTotalDuration(duration);

    this.statHead.textContent = list.head?.title ? truncateText(list.head.title, 20) : '—';
    this.statCurrent.textContent = list.current?.title ? truncateText(list.current.title, 20) : '—';
    this.statTail.textContent = list.tail?.title ? truncateText(list.tail.title, 20) : '—';
    this.statSize.textContent = count.toString();
  }
}
