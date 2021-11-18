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
