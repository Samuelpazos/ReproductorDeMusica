
export interface SongData {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string; 
  image: string;
  audioUrl?: string; 
}

export class SongNode {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  image: string;
  audioUrl: string; 

  previous: SongNode | null;

  next: SongNode | null;

  constructor(data: SongData) {
    this.id = data.id;
    this.title = data.title;
    this.artist = data.artist;
    this.album = data.album;
    this.duration = data.duration;
    this.image = data.image;
    this.audioUrl = data.audioUrl ?? '';
    this.previous = null;
    this.next = null;
  }

  toJSON(): SongData {
    return {
      id: this.id,
      title: this.title,
      artist: this.artist,
      album: this.album,
      duration: this.duration,
      image: this.image,
      
    };
  }
}
