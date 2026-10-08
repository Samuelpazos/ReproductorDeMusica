
import { DoublyLinkedList } from '../models/DoublyLinkedList';
import { SongNode } from '../models/SongNode';
import { escapeHtml, truncateText } from '../utils/helpers';

export class DataStructureView {
  private container: HTMLElement;

  constructor() {
    this.container = document.getElementById('structureVisualization') as HTMLElement;
  }

  render(list: DoublyLinkedList): void {
    this.container.innerHTML = '';

    if (list.size === 0) {
      this.container.innerHTML = `
        <div class="structure-empty">
          <p>La lista está vacía. Agrega canciones para visualizar la estructura.</p>
        </div>`;
      return;
    }

    const nullStart = this.createNullNode();
    this.container.appendChild(nullStart);

    let cursor: SongNode | null = list.head;
    let positionIndex = 1;

    while (cursor !== null) {
      const isHead = cursor === list.head;
      const isTail = cursor === list.tail;
      const isCurrent = list.current?.id === cursor.id;

      const arrow = this.createArrow(cursor.previous !== null);
      this.container.appendChild(arrow);

      const nodeElement = this.createNode(cursor, positionIndex, isHead, isTail, isCurrent);
      this.container.appendChild(nodeElement);

      cursor = cursor.next;
      positionIndex++;
    }

    const arrowEnd = this.createArrowEnd();
    this.container.appendChild(arrowEnd);

    const nullEnd = this.createNullNode();
    this.container.appendChild(nullEnd);
  }

  private createNullNode(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'struct-null';
    element.textContent = 'NULL';
    element.setAttribute('aria-label', 'NULL — extremo de la lista');
    return element;
  }

  private createArrow(hasPrev: boolean): HTMLElement {
    const element = document.createElement('div');
    element.className = 'struct-arrow';
    element.innerHTML = hasPrev ? '⇄' : '→';
    element.setAttribute('aria-hidden', 'true');
    return element;
  }

  private createArrowEnd(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'struct-arrow';
    element.innerHTML = '→';
    element.setAttribute('aria-hidden', 'true');
    return element;
  }

  private createNode(
    node: SongNode,
    position: number,
    isHead: boolean,
    isTail: boolean,
    isCurrent: boolean
  ): HTMLElement {
    const labels: { text: string; key: string }[] = [];
    if (isHead) labels.push({ text: 'CABEZA', key: 'head' });
    if (isCurrent) labels.push({ text: 'ACTUAL', key: 'current' });
    if (isTail) labels.push({ text: 'COLA', key: 'tail' });

    const element = document.createElement('div');
    element.className = `struct-node${isCurrent ? ' struct-node-current' : ''}${isHead ? ' struct-node-head' : ''}${isTail ? ' struct-node-tail' : ''}`;
    element.setAttribute('aria-label', `Nodo ${position}: ${node.title} por ${node.artist}${labels.length > 0 ? '. Es ' + labels.map((label) => label.text).join(', ') : ''}`);

    const prevText = node.previous ? `← ${escapeHtml(truncateText(node.previous.title, 12))}` : '← NULL';
    const nextText = node.next ? `${escapeHtml(truncateText(node.next.title, 12))} →` : 'NULL →';

    element.innerHTML = `
      ${labels.length > 0 ? `<div class="struct-node-labels">${labels.map(({ text, key }) => `<span class="struct-label struct-label-${key}">${text}</span>`).join('')}</div>` : ''}
      <div class="struct-node-pos">#${position}</div>
      <div class="struct-node-title">${escapeHtml(truncateText(node.title, 18))}</div>
      <div class="struct-node-artist">${escapeHtml(truncateText(node.artist, 16))}</div>
      <div class="struct-node-duration">${escapeHtml(node.duration)}</div>
      <div class="struct-node-pointers">
        <span class="struct-ptr struct-ptr-prev" title="Enlace anterior">${prevText}</span>
        <span class="struct-ptr struct-ptr-next" title="Enlace siguiente">${nextText}</span>
      </div>
    `;

    return element;
  }

  renderDebug(list: DoublyLinkedList, container: HTMLElement): void {
    const debug = list.debugInfo();
    container.innerHTML = `<pre class="debug-text">${escapeHtml(debug)}</pre>`;
  }
}
