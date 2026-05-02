/** Parse "mm:ss", "h:mm:ss", or plain minutes string → seconds */
export function parseDuration(input: string): number {
  const trimmed = input.trim();
  if (!trimmed) return 0;
  const parts = trimmed.split(':').map((p) => parseInt(p, 10) || 0);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] * 60; // single number treated as minutes
}

/** Format seconds → "m:ss" or "h:mm:ss" for individual lecture display */
export function formatLectureDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Format total section seconds → "Xhr Ymin" style for section headers */
export function formatSectionDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}hr ${m}min`;
  if (h > 0) return `${h}hr`;
  return `${m}min`;
}

/** Convert seconds back to "m:ss" or "h:mm:ss" for input field display */
export function secondsToInput(seconds: number): string {
  if (!seconds || seconds <= 0) return '';
  return formatLectureDuration(seconds);
}
