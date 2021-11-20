import {Coordinate} from '../../common/src/coordinates';

export function formatScore(score: number, decimals = 1): string {
  return `${Math.round(score * 10 ** (2 + decimals)) / 10 ** decimals}%`;
}

export function formatScoreWithIcon(score: number, minScore: number, decimals = 1): string {
  const icon = score < minScore ? '❌' : '✅';
  return `${icon} ${formatScore(score, decimals)}`;
}

export function formatCoordinate(coordinate: Coordinate): string {
  const {x, y} = coordinate;
  return `${x}/${y}`;
}

export function padLeft(str: string, size: number, c: string): string {
  let val = str;
  while (val.length < size) {
    val = `${c}${val}`;
  }
  return val;
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  return [
    padLeft(String(d.getHours()), 2, '0'),
    padLeft(String(d.getMinutes()), 2, '0'),
    padLeft(String(d.getSeconds()), 2, '0'),
  ].join(':');
}
