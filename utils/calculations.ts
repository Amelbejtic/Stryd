export function haversineDistance(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const R = 6371000;
  const φ1 = (a.latitude * Math.PI) / 180;
  const φ2 = (b.latitude * Math.PI) / 180;
  const Δφ = ((b.latitude - a.latitude) * Math.PI) / 180;
  const Δλ = ((b.longitude - a.longitude) * Math.PI) / 180;

  const x =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function speedToPace(speedMs: number): string {
  if (speedMs <= 0) return '--:--';
  const secondsPerKm = 1000 / speedMs;
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.floor(secondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Jeg formaterer millisekunder til et læsbart format — fx 05:23.47
// centiseconds er de to cifre efter punktum — jeg dividerer ms med 10 for at få dem
export function formatDurationMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);

  const msStr = centiseconds.toString().padStart(2, '0');

  // Jeg viser kun timer hvis løbet har varet over en time
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${msStr}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${msStr}`;
}

// Jeg konverterer en hastighed i m/s til pace i minutter per km som et tal
// (til brug i grafer — ikke formateret som streng)
export function speedToPaceMinutes(speedMs: number): number {
  if (speedMs <= 0) return 0;
  // 1000 meter / hastighed i m/s = sekunder per km / 60 = minutter per km
  return 1000 / speedMs / 60;
}

// Jeg grupperer løb per uge og summerer distance
// Returnerer de sidste 8 uger som et array af { uge-label, km }
export function getWeeklyKm(runs: { startTime: number; distanceMeters: number }[]): { x: string; y: number }[] {
  // Jeg opretter et map hvor nøglen er uge-nummer og værdien er total km
  const weekMap: Record<string, number> = {};

  runs.forEach(run => {
    const date = new Date(run.startTime);
    // getFullYear og getWeek giver os et unikt uge-id per år
    const year = date.getFullYear();
    // Jeg beregner uge-nummer manuelt — JS har ingen indbygget getWeek
    const startOfYear = new Date(year, 0, 1);
    const weekNumber = Math.ceil(((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    const key = `${year}-${weekNumber}`;

    weekMap[key] = (weekMap[key] ?? 0) + run.distanceMeters / 1000;
  });

  // Jeg sorterer ugerne kronologisk og tager de sidste 8
  const sorted = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8);

  // Jeg returnerer et array med uge-label og km — x er label, y er km
  return sorted.map(([key, km]) => ({
    x: `U${key.split('-')[1]}`,  // fx "U23"
    y: parseFloat(km.toFixed(1)),
  }));
}