

export function generateId(): string {
  return `song_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function formatTime(seconds: number): string {
  const s = Math.floor(seconds);
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function isValidDuration(duration: string): boolean {
  return /^\d{1,3}:\d{2}$/.test(duration.trim());
}

export function parseDuration(duration: string): number {
  const parts = duration.split(':');
  if (parts.length !== 2) return 0;
  const mins = parseInt(parts[0], 10) || 0;
  const secs = parseInt(parts[1], 10) || 0;
  return mins * 60 + secs;
}

export function formatTotalDuration(seconds: number): string {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function truncateText(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '…' : text;
}

export function getCoverGradient(text: string): string {
  const colors = [
    ['#a855f7', '#6366f1'],
    ['#ec4899', '#a855f7'],
    ['#f97316', '#ef4444'],
    ['#14b8a6', '#6366f1'],
    ['#06b6d4', '#3b82f6'],
    ['#10b981', '#06b6d4'],
    ['#f59e0b', '#ef4444'],
    ['#8b5cf6', '#ec4899'],
  ];
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % colors.length;
  return `linear-gradient(135deg, ${colors[idx][0]}, ${colors[idx][1]})`;
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}
