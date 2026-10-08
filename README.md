# 🎵 DOUBLEPLAY — Reproductor de música con lista doblemente enlazada

Proyecto académico desarrollado en TypeScript para demostrar operaciones sobre una lista doblemente enlazada mediante una interfaz web en español.

## Tecnologías

| Tecnología | Uso |
|---|---|
| TypeScript | Lógica de la aplicación |
| Vite | Servidor de desarrollo y compilación |
| HTML y CSS | Interfaz y estilos |
| LocalStorage | Persistencia de metadatos de la playlist |

## Instalación y ejecución

```bash
npm install
npm run dev
```

## Estructura del proyecto

```text
src/
├── models/
│   ├── SongNode.ts
│   └── DoublyLinkedList.ts
├── services/
│   ├── StorageService.ts
│   └── PlayerService.ts
├── components/
│   ├── Player.ts
│   ├── Playlist.ts
│   ├── AudioUploader.ts
│   └── DataStructureView.ts
├── utils/
│   └── helpers.ts
├── styles/
│   └── style.css
└── main.ts
```

## Lista doblemente enlazada

Cada `SongNode` almacena los datos de una canción y referencias al nodo anterior y al siguiente. `DoublyLinkedList` conserva los nodos `head`, `tail` y `current`, además del tamaño de la lista.

```text
NULL ← [Song 1] ⇄ [Song 2] ⇄ [Song 3] → NULL
```

La interfaz permite cargar uno o varios archivos de audio. Cada archivo se agrega automáticamente al inicio de la playlist; el título y el artista se obtienen del nombre del archivo cuando viene en formato `Artista - Título`. No es necesario llenar metadatos a mano.

## Funcionalidades

- Reproducir y pausar archivos de audio locales.
- Avanzar y retroceder utilizando los enlaces `next` y `previous`.
- Aleatorio, repetición, control de volumen y búsqueda.
- Agregar archivos al inicio, reordenar canciones y eliminar canciones.
- Visualizar los enlaces de la lista y consultar su estado desde el modo desarrollador.
- Guardar los metadatos de la playlist en LocalStorage.

Los archivos de audio cargados se representan mediante URL temporales del navegador. La playlist y sus metadatos se guardan, pero el audio local debe volver a cargarse después de cerrar o recargar la página.

## API principal de la estructura

```typescript
class DoublyLinkedList {
  head: SongNode | null;
  tail: SongNode | null;
  current: SongNode | null;
  size: number;

  addFirst(song: SongData): SongNode;
  addLast(song: SongData): SongNode;
  insertAt(song: SongData, position: number): SongNode;
  removeFirst(): SongNode | null;
  removeLast(): SongNode | null;
  removeAt(position: number): SongNode | null;
  nextSong(): SongNode | null;
  previousSong(): SongNode | null;
  searchSongs(query: string): SongNode[];
}
```

*Taller de Estructuras de Datos — Semestre 4*
